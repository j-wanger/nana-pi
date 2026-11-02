/**
 * @module apps/bench/lib/replay.mjs
 * @purpose Coordinate private historical builder replays and expose counts-only manual subcommands without study verdicts.
 * @inputs Explicit study, repository, context/label roots and private output; injectable unpaid launcher and machine checks.
 * @outputs Immutable manifest, spend journal, private streams/checks/measure rows and counts-only CLI results.
 * @effects disk (private output), process (isolated builder, grader and optional reviewer), network (only after explicit go)
 * @errors Fixed replay diagnostics; unsupported isolation, busy machines and changed inputs refuse paid launch.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { runChild, resolvePiLauncher, piVersion as probePiVersion, treeAlive } from "../run.mjs";
import { prepareAgentDir, verifyAuth, defaultSourceDir } from "./agentdir.mjs";
import { rng, shuffle, studyFingerprint, fileSha } from "./plan.mjs";
import { parseStream, costOfRecord, costUnknownReason, observedCostOfRecord } from "./usage.mjs";
import { pullsOf } from "./anatomy-pulls.mjs";
import { buildNumberFromBrief } from "./anatomy-sessions.mjs";
import { SESSION_PREFIX } from "./anatomy-config.mjs";
import { entriesIn, privateFolder } from "../../../packages/nana-pack/lib/claude-transcript.mjs";
import { buildRecordsPath, readBuildLedger } from "../../../packages/nana-pack/lib/build-records.mjs";
import { readBrief } from "../../../packages/nana-pack/lib/brief-precedent.mjs";
import { killProcessTree, pidAlive } from "../../../packages/nana-pack/lib/process-tree.mjs";
import { killTree, signalTreeTargets } from "../../../scripts/runtime-measure.mjs";
import { createRunner } from "../../../scripts/memory-shape-runners.mjs";
import { loadContexts, renderContext, promptMatches } from "./replay-context.mjs";
import { classifyErrors, mergeErrorCounts, normalizeEvents } from "./replay-errors.mjs";
import { grade, loadGrading } from "./replay-grade.mjs";
import { assertRunManifest, lockFolder, readRows, runOperations } from "./replay-journal.mjs";
import { createStartTree, DEFAULT_LOCK_DIR, machineBusy, replayEnv, requireBackend, sandboxProfile, snapshotTargets } from "./replay-isolation.mjs";
import { BUSY_POLL_MS, STALL_MS, CEILING_MS, GIT_MS, REMOTE_HOSTS } from "./replay-config.mjs";

const here = path.dirname(fileURLToPath(import.meta.url)), extension = path.resolve(here, "../ext/replay-context.ts");
const hash = value => createHash("sha256").update(typeof value === "string" || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest("hex");
const write = (file, value) => fs.writeFileSync(file, typeof value === "string" ? value : JSON.stringify(value) + "\n", { mode: 0o600 });
const git = (repo, args) => { const r = spawnSync("git", args, { cwd: repo, encoding: "utf8", timeout: GIT_MS }); if (r.status !== 0) throw new Error("replay: git read failed"); return r.stdout.trim(); };
const loadStudy = dir => JSON.parse(fs.readFileSync(path.join(dir, "study.json"), "utf8"));
function schedule(study, smoke = false) {
 if (!Number.isSafeInteger(study.repeats) || study.repeats < 1 || !Number.isInteger(study.seed) || !study.model?.id || !study.model?.provider || !study.piVersion || !Array.isArray(study.lanes) || !Array.isArray(study.arms) || !Number.isFinite(study.killLimit) || study.killLimit <= 0 || study.killLimit > study.allowance) throw new Error("replay: invalid study");
 if (new Set(study.arms.map(a => a.name)).size !== study.arms.length || new Set(study.lanes.map(l => l.build)).size !== study.lanes.length) throw new Error("replay: duplicate tuple");
 const random = rng(study.seed), rows = [];
 for (let repeat = 0; repeat < study.repeats; repeat++) for (const lane of shuffle(study.lanes, random)) for (const arm of shuffle(study.arms, random)) rows.push({ build: lane.build, lane: lane.lane, arm: arm.name, repeat });
 return smoke ? rows.slice(0, 1).map(r => ({ ...r, smoke: true })) : rows;
}
const keyOf = tuple => `${tuple.smoke ? "smoke|" : ""}${tuple.build}|${tuple.arm}|${tuple.repeat}`;
const runDirOf = (out, tuple) => path.join(out, "runs", hash(keyOf(tuple)));
function runtimePaths(launcher) {
 const paths = [fs.realpathSync(process.execPath)];
 if (launcher?.pre?.[0]) {
  const entry = fs.realpathSync(launcher.pre[0]); paths.push(entry);
  let dir = path.dirname(entry);
  while (dir !== path.dirname(dir)) {
   try { if (JSON.parse(fs.readFileSync(path.join(dir, "package.json"))).name === "@earendil-works/pi-coding-agent") { paths.push(dir); break; } } catch {}
   dir = path.dirname(dir);
  }
 }
 return paths;
}
function contextFor(records, tuple) { const c = records.find(c => c.id === tuple.build); if (!c) throw new Error("replay: context selection missing"); return c; }
function profileFor({ out, tuple, sourceDir, launcher, suiteLock, sandboxReadPaths = [] }) {
 return sandboxProfile({ runDir: runDirOf(out, tuple), suiteLock, readPaths: [...runtimePaths(launcher), extension, path.join(sourceDir, "auth.json"), ...sandboxReadPaths] });
}
/** Every causal byte is passed through the bench fingerprint's extraSha escape hatch, including repeats. */
export async function makeRunManifest({ studyDir, repo, contexts, labels, out, piVersion, launcher, sourceDir = defaultSourceDir(), suiteLock = DEFAULT_LOCK_DIR, sandboxReadPaths = [] }) {
 out = path.resolve(out); const study = loadStudy(studyDir), tuples = schedule(study), { records, labelStore } = await loadContexts(contexts, labels);
 const prereg = study.preregistration;
 if (typeof prereg !== "string" || path.isAbsolute(prereg) || prereg.split(/[\\/]/u).includes("..")) throw new Error("replay: pre-registration not committed");
 const tracked = spawnSync("git", ["ls-files", "--error-unmatch", "--", prereg], { cwd: studyDir, encoding: "utf8", timeout: GIT_MS });
 const clean = spawnSync("git", ["diff", "--quiet", "HEAD", "--", prereg], { cwd: studyDir, timeout: GIT_MS });
 if (tracked.status !== 0 || clean.status !== 0) throw new Error("replay: pre-registration not committed");
 const commit = git(studyDir, ["log", "-1", "--format=%H", "--", prereg]);
 const inputs = { study: await fileSha(path.join(studyDir, "study.json")), "pre-registration": await fileSha(path.join(studyDir, prereg)), "pre-registration-commit": commit, labels: labels ? hash([await fileSha(path.join(labels, "labels.jsonl")), await fileSha(path.join(labels, "manifest.json"))]) : "none", pi: piVersion ?? study.piVersion };
 for (const lane of study.lanes) {
  const c = contextFor(records, lane); inputs[`context:${lane.build}`] = hash(c); inputs[`attempt:${lane.build}`] = hash(0);
  const gradingFile = path.resolve(studyDir, lane.grading), grading = loadGrading(gradingFile);
  inputs[`grading:${lane.build}`] = await fileSha(gradingFile);
  for (const [i, o] of grading.overlay.entries()) inputs[`overlay:${lane.build}:${i}`] = await fileSha(o.source);
 }
 if (study.review?.entry) inputs["reviewer-entry"] = await fileSha(study.review.entry);
 for (const tuple of tuples) {
  const c = contextFor(records, tuple), arm = study.arms.find(a => a.name === tuple.arm);
  const prompt = renderContext(c, { clone: path.join(runDirOf(out, tuple), "work"), arm, labelStore, mainCheckout: repo });
  inputs[`prompt:${keyOf(tuple)}`] = hash(prompt);
  inputs[`sandbox:${keyOf(tuple)}`] = hash(profileFor({ out, tuple, sourceDir, launcher, suiteLock, sandboxReadPaths }));
 }
 // Seal the harness and the shared libraries which decide prompt, cost, pulls and process behaviour.
 const moduleFiles = fs.readdirSync(here).filter(n => n.startsWith("replay") && n.endsWith(".mjs")).map(n => path.join(here, n));
 for (const file of [...moduleFiles, extension, path.resolve(here, "../run.mjs"), path.resolve(here, "../replay.mjs"), ...["usage", "plan", "agentdir", "anatomy-labels", "anatomy-measures", "anatomy-pulls", "anatomy-sessions", "anatomy-config"].map(n => path.join(here, `${n}.mjs`)), path.resolve(here, "../../../scripts/test-locked.mjs"), path.resolve(here, "../../../scripts/memory-shape-runners.mjs"), path.resolve(here, "../../../scripts/runtime-measure.mjs"), ...["process-tree", "claude-transcript", "build-records", "record-ledger", "brief-precedent", "lane-lock", "pi-usage", "memory-shaping-config"].map(n => path.resolve(here, `../../../packages/nana-pack/lib/${n}.mjs`))]) inputs[`harness:${path.relative(path.resolve(here, "../../.."), file).replaceAll("\\", "/")}`] = await fileSha(file);
 for (const file of ["settings.json", "nana-pack.json"]) inputs[`source:${file}`] = await fileSha(path.join(sourceDir, file));
 const fingerprint = await studyFingerprint({ studyDir, study, tasks: [], piVersion: inputs.pi, extraSha: inputs });
 return { inputs, fingerprint: fingerprint.fingerprint };
}
const precedentFor = c => (readBrief(c.parts.filter(p => p.attempt === 0 && p.name === "brief").map(p => p.spans.map(s => s.text).join("")).join("")).precedent ?? []).filter(p => p.kind === "path").map(p => p.value);
function groupedPulls(pulls, field) {
 return [...new Set(pulls.map(p => p[field]))].sort().map(value => { const rows = pulls.filter(p => p[field] === value); return { [field]: value, calls: rows.length, chars: rows.reduce((n, p) => n + p.chars, 0) }; });
}
export function measureRun(text, { cwd, precedent = [], outcome, wallMs } = {}) {
 const normalized = normalizeEvents(text), p = parseStream(normalized.events.map(e => JSON.stringify(e)).join("\n"));
 const usage = normalized.events.flatMap(e => e.type === "message_end" && e.message?.role === "assistant" && e.message.usage ? [e.message.usage] : e.type === "entry_appended" && e.entry?.type === "usage" ? [e.entry.usage] : []);
 const validCost = usage.length > 0 && usage.every(u => Number.isFinite(u.cost?.total) && u.cost.total >= 0);
 const record = { tokens: p.tokens, nestedTokens: p.nested, nestedCost: p.nestedCost, nestedUnknown: p.nestedUnknown };
 const cost = validCost ? costOfRecord(record) : null;
 const pulls = pullsOf(normalized.entries, { cwd, precedent });
 return { tokens: p.tokens, totalTokens: p.tokens.totalTokens, nestedTokens: p.nested, nestedCost: p.nestedCost, pricedNestedCost: p.pricedNestedCost, nestedUnknown: p.nestedUnknown, cost, costReason: cost === null ? (validCost ? costUnknownReason({ ...record, cost: null }) : "no priced usage") : null, wallMs, turns: p.turns, toolCalls: p.toolCalls, retries: p.retries, compactions: p.compactions, pulls: { byClass: groupedPulls(pulls, "class"), byFunction: groupedPulls(pulls, "function") }, errors: classifyErrors(normalized.entries, { precedent, outcome }), reviewer: "missing" };
}
function remoteAudit(text, hosts) {
 const normalized = normalizeEvents(text);
 return [...normalized.calls.values()].some(c => hosts.some(host => JSON.stringify(c.arguments ?? {}).includes(host)));
}
async function supervise({ launcher, args, env, work, runDir, profile, study, busy, pollMs }) {
 const streamFile = path.join(runDir, "stream.jsonl"), fd = fs.openSync(streamFile, "w", 0o600);
 let pid, lastEventAt = Date.now(), lineCount = 0, outcome, timer, seen = { pids: [], groups: [] };
 const remember = () => { const t = snapshotTargets(pid); seen = { pids: [...new Set([...seen.pids, ...t.pids])], groups: [...new Set([...seen.groups, ...t.groups])] }; };
 const stop = reason => { if (outcome) return; outcome = reason; remember(); if (pid) { killTree(pid); killProcessTree(pid); signalTreeTargets(seen); } };
 const interrupt = () => stop("interrupted");
 process.on("SIGINT", interrupt); process.on("SIGTERM", interrupt);
 let result;
 try {
  result = await runChild({ cmd: "/usr/bin/sandbox-exec", args: ["-p", profile, launcher.cmd, ...launcher.pre, ...args], cwd: work, env, timeoutMs: study.ceilingMs ?? CEILING_MS, graceMs: 0, reapOnExit: true,
   onSpawn: value => { pid = value; write(path.join(runDir, "builder.pid"), String(pid)); timer = setInterval(() => {
    try { remember(); if (busy(pid)) stop("aborted: busy"); else if (Date.now() - lastEventAt >= (study.stallMs ?? STALL_MS)) stop("stall"); } catch { stop("launch-refused"); }
   }, pollMs); },
   onOutput: text => {
    // Persist before reacting to a budget crossing; crash recovery reads these partial bytes.
    fs.ftruncateSync(fd, 0); fs.writeSync(fd, text, 0, "utf8"); fs.fsyncSync(fd);
    const count = text.split("\n").length; if (count > lineCount) { lineCount = count; lastEventAt = Date.now(); }
    const p = parseStream(text);
    if (observedCostOfRecord({ tokens: p.tokens, nestedTokens: p.nested, nestedCost: p.nestedCost, pricedNestedCost: p.pricedNestedCost }) > study.killLimit) stop("ceiling");
   },
  });
 } finally {
  clearInterval(timer); fs.closeSync(fd); process.off("SIGINT", interrupt); process.off("SIGTERM", interrupt);
  if (pid) { killTree(pid); killProcessTree(pid); signalTreeTargets(seen); }
 }
 // Do not overlay tests until every remembered descendant, even one in its own group, is dead.
 const deadline = Date.now() + GIT_MS;
 const alive = () => (pid && treeAlive(pid)) || seen.pids.some(pidAlive) || seen.groups.some(group => pidAlive(group, { group: true }));
 while (alive() && Date.now() < deadline) await new Promise(r => setTimeout(r, 20));
 if (alive()) throw new Error("replay: builder tree survived");
 fs.rmSync(path.join(runDir, "builder.pid"), { force: true });
 write(path.join(runDir, "stderr.txt"), result.stderr);
 if (result.outputError) throw new Error("replay: stream persistence failed");
 const p = parseStream(result.stdout);
 return { ...result, killedCleanly: true, outcome: outcome ?? (result.timedOut ? "ceiling" : result.exit === 0 && p.complete ? "settled" : "launch-refused") };
}
function cloneArgs(study, work, runDir) {
 const args = ["--mode", "json", "--provider", study.model.provider, "--model", study.model.id, "--thinking", study.model.thinking, "--no-extensions", "--no-mcp", "--no-themes", "--no-context-files", "--no-skills", "--no-prompt-templates", "--approve", "--session", path.join(runDir, "session.jsonl")];
 // Restore only the two production feedback extensions, from the historical tree, not this checkout.
 for (const name of ["nana-gate.ts", "nana-post-edit.ts"]) { const p = path.join(work, "packages/nana-pack/extensions", name); if (fs.existsSync(p)) args.push("-e", p); }
 args.push("-e", extension); return args;
}
async function reviewRun({ review, out, tuple, manifestHash, cap, runDir, work, env, runReviewer, reviewSpawn }) {
 const reviewAgent = path.join(runDir, "review-agent"); fs.mkdirSync(reviewAgent, { recursive: true, mode: 0o700 });
 if (review.credentialFile && !fs.existsSync(path.join(reviewAgent, ".credentials.json"))) fs.symlinkSync(path.resolve(review.credentialFile), path.join(reviewAgent, ".credentials.json"));
 const runModel = runReviewer ?? createRunner({ runner: "claude", model: review.model, effort: review.effort, budgetUsd: review.allowance, timeoutMs: review.timeoutMs, spawn: (bin, args, opts) => {
  // Keep the shared runner's schema/model/cost validation; grant only read access to this clone.
  const argv = [...args]; argv[argv.indexOf("--tools") + 1] = "Read";
  const options = { ...opts, env: { ...env, CLAUDE_CONFIG_DIR: reviewAgent, CLAUDE_CODE_DISABLE_AUTO_MEMORY: "1" }, cwd: work };
  if (reviewSpawn) return reviewSpawn(bin, argv, options);
  if (!review.entry || !path.isAbsolute(review.entry)) return { error: new Error("reviewer entry required"), status: null, stdout: "", stderr: "" };
  const reviewProfile = sandboxProfile({ runDir, suiteLock: env.NANA_SUITE_LOCK_DIR, readPaths: [process.execPath, review.entry, ...(review.credentialFile ? [review.credentialFile] : [])] });
  return spawnSync("/usr/bin/sandbox-exec", ["-p", reviewProfile, review.entry, ...argv], options);
 } });
 const key = `review|${keyOf(tuple)}`;
 const rows = await runOperations({ out, manifestHash, cap, rowFile: "reviews.jsonl", operations: [{ key, allowance: review.allowance, tuple }], execute: async () => {
  const diff = git(work, ["diff", "HEAD"]), prompt = fs.readFileSync(path.join(runDir, "prompt.json"), "utf8");
  const schema = { type: "object", additionalProperties: false, required: ["must"], properties: { must: { type: "integer", minimum: 0 } } };
  let r; try { r = await runModel({ system: "Review the brief and diff for material MUST findings. Read the clone as needed. Return the MUST count.", prompt: prompt + "\n" + diff, schema }); } catch {}
  if (r?.text) write(path.join(runDir, "review.json"), r.text);
  let count; try { count = JSON.parse(r?.text).must; } catch {}
  return { cost: r?.usage?.cost ?? null, reviewer: r?.ok && Number.isSafeInteger(count) && count >= 0 ? { must: count, cost: r.usage?.cost ?? null } : "missing" };
 } });
 return rows.find(r => r.key === key)?.reviewer ?? "missing";
}
export async function runStudy(options) {
 // Experiment branch (seat, 2026-11-02): builders need node/npm; expose the real node install read-only.
 const nodeBin = path.dirname(fs.realpathSync(process.execPath));
 options = { ...options, sandboxReadPaths: [...(options.sandboxReadPaths ?? []), path.dirname(nodeBin)] };
 const { studyDir, repo, contexts, labels, go = false, smoke = false, sourceDir = defaultSourceDir(), suiteLock = DEFAULT_LOCK_DIR, pollMs = BUSY_POLL_MS, platform = process.platform } = options;
 if (go) requireBackend(platform);
 const out = privateFolder(options.out, { allowAncestorSymlinks: true, refuseCheckout: true }), release = await lockFolder(out);
 try {
  const study = loadStudy(studyDir), tuples = schedule(study, smoke), launcher = options.launcher ?? resolvePiLauncher(study);
  const { records, labelStore } = await loadContexts(contexts, labels);
  const common = path.resolve(repo, git(repo, ["rev-parse", "--git-common-dir"]));
  // Experiment branch (seat, 2026-11-02): replays run alongside live builds; the suite lock still serializes suites.
  const busy = pid => options.busy ? options.busy(pid) : false;
  let version = study.piVersion;
  if (go && !options.launcher) {
   // The version probe is free; no builder is started. Its config still lives in the private folder.
   const versionDir = path.join(out, "version-agent"); fs.mkdirSync(versionDir, { recursive: true, mode: 0o700 });
   version = await probePiVersion(launcher, versionDir); if (version !== study.piVersion) throw new Error("replay: pi version mismatch");
  }
  const identity = await makeRunManifest({ ...options, out, sourceDir, suiteLock, launcher, piVersion: version });
  await assertRunManifest(out, identity);
  if (!go) {
   const dry = tuples.map(tuple => ({ ...tuple, key: keyOf(tuple), argv: [...launcher.pre, ...cloneArgs(study, path.join(runDirOf(out, tuple), "work"), runDirOf(out, tuple)), "--", renderContext(contextFor(records, tuple), { clone: path.join(runDirOf(out, tuple), "work"), arm: study.arms.find(a => a.name === tuple.arm), labelStore, mainCheckout: repo }).instruction], profileHash: hash(profileFor({ ...options, out, tuple, sourceDir, launcher, suiteLock })), reserved: study.allowance }));
   write(path.join(out, "dry-run.json"), dry); return dry;
  }
  const notRun = tuple => {
   const lane = study.lanes.find(l => l.build === tuple.build);
   return { checks: loadGrading(path.resolve(studyDir, lane.grading)).checks.map(c => ({ ...c, outcome: "not-run" })), status: "not-run", bounds: { worst: 0, best: 1 } };
  };
  const recover = start => {
   const tuple = start.tuple, work = path.join(runDirOf(out, tuple), "work"), pidFile = path.join(path.dirname(work), "builder.pid");
   if (fs.existsSync(pidFile) && treeAlive(Number(fs.readFileSync(pidFile, "utf8")))) throw new Error("replay: builder still alive");
   let text = ""; try { text = fs.readFileSync(start.streamFile, "utf8"); } catch {}
   const measured = measureRun(text, { cwd: work, precedent: precedentFor(contextFor(records, tuple)), outcome: "interrupted", wallMs: null }), grading = notRun(tuple);
   return { ...tuple, ...measured, checks: grading.checks, graderStatus: grading.status, bounds: grading.bounds, outcome: "interrupted", partialCost: observedCostOfRecord(measured), cost: null, costReason: "interrupted; partial spend only" };
  };
  const operations = tuples.map(tuple => ({ key: keyOf(tuple), tuple, allowance: study.allowance, streamFile: path.join(runDirOf(out, tuple), "stream.jsonl") }));
  return await runOperations({ out, manifestHash: identity.fingerprint, cap: study.cap, operations, recover, execute: async op => {
   const tuple = op.tuple, c = contextFor(records, tuple), runDir = runDirOf(out, tuple), work = path.join(runDir, "work");
   const lane = study.lanes.find(l => l.build === tuple.build);
   const noRun = reason => { const grading = notRun(tuple); return { ...measureRun("", { cwd: work, outcome: reason, wallMs: 0 }), outcome: reason, checks: grading.checks, graderStatus: grading.status, bounds: grading.bounds, cost: null, costReason: "no priced builder usage" }; };
   if (busy()) return noRun("launch-refused");
   fs.mkdirSync(runDir, { recursive: true, mode: 0o700 });
   await createStartTree(repo, c.startTip, work);
   const rendered = renderContext(c, { clone: work, arm: study.arms.find(a => a.name === tuple.arm), labelStore, mainCheckout: repo });
   write(path.join(runDir, "prompt.json"), rendered);
   const home = path.join(runDir, "home"), temp = path.join(runDir, "tmp"), agentDir = path.join(runDir, "agent");
   for (const p of [home, temp]) fs.mkdirSync(p, { mode: 0o700 });
   fs.symlinkSync(work, path.join(home, "nana-pi"), "dir");
   if (!options.launcher) {
    const settings = JSON.parse(fs.readFileSync(path.join(sourceDir, "settings.json"), "utf8"));
    await prepareAgentDir({ dir: agentDir, sourceDir, settings: { ...settings, packages: [], extensions: [], skills: [], prompts: [], themes: [] } });
    if (fs.existsSync(path.join(sourceDir, "nana-pack.json"))) fs.copyFileSync(path.join(sourceDir, "nana-pack.json"), path.join(agentDir, "nana-pack.json"));
    await verifyAuth({ dir: agentDir, sourceDir });
   } else fs.mkdirSync(agentDir);
   const env = { ...replayEnv({ home, temp, agentDir, suiteLock, bin: `${nodeBin}:/usr/bin:/bin:/usr/sbin:/sbin` }), NANA_REPLAY_CONTEXT: path.join(runDir, "prompt.json"), NANA_REPLAY_SESSION: path.join(runDir, "session.jsonl"), NANA_REPLAY_RUN_DIR: runDir };
   write(path.join(home, "gitconfig"), REMOTE_HOSTS.map(host => `[url "https://replay.invalid/"]\n\tinsteadOf = https://${host}/\n\tinsteadOf = git@${host}:\n`).join(""));
   const args = [...cloneArgs(study, work, runDir), "--", rendered.instruction], profile = profileFor({ ...options, out, tuple, sourceDir, launcher, suiteLock });
   write(path.join(runDir, "sandbox.sb"), profile); write(path.join(runDir, "argv.json"), args);
   if (busy()) return noRun("launch-refused");
   const result = await supervise({ launcher, args, env, work, runDir, profile, study, busy, pollMs });
   let outcome = result.outcome;
   if (remoteAudit(result.stdout, [...REMOTE_HOSTS, ...(study.remoteHosts ?? [])])) outcome = "leak-suspect";
   else if (!fs.existsSync(env.NANA_REPLAY_SESSION) || !promptMatches(env.NANA_REPLAY_SESSION, rendered.systemPrompt)) outcome = "harness: prompt-mismatch";
   const precedent = precedentFor(c);
   const measured = measureRun(result.stdout, { cwd: work, precedent, outcome, wallMs: result.wallMs });
   // Busy-aborted/interrupted operations keep spend but cannot block waiting for the new lane's suite.
   const grading = ["aborted: busy", "interrupted"].includes(outcome) ? notRun(tuple) : await grade({ manifest: loadGrading(path.resolve(studyDir, lane.grading)), tree: work, out: path.join(runDir, "grade"), busy: () => busy(), pollMs });
   let reviewer = "missing";
   if (study.review && outcome === "settled" && (study.review.repeat === undefined || study.review.repeat === tuple.repeat)) {
    while (busy()) await new Promise(r => setTimeout(r, pollMs));
    reviewer = await reviewRun({ review: study.review, out, tuple, manifestHash: identity.fingerprint, cap: study.cap, runDir, work, env, runReviewer: options.runReviewer, reviewSpawn: options.reviewSpawn });
   }
   return { ...tuple, ...measured, outcome, checks: grading.checks, graderStatus: grading.status, bounds: grading.bounds, killedCleanly: result.killedCleanly, reviewer };
  } });
 } finally { release(); }
}

/** Paths, exception strings, check titles and stream contents never cross this printing boundary. */
export async function runReplay(argv, { stdout = s => process.stdout.write(s), stderr = s => process.stderr.write(s), ...deps } = {}) {
 try {
  const [command, ...rest] = argv, args = {};
  const flags = ["--go", "--smoke"], values = ["--contexts", "--labels", "--build", "--arm", "--out", "--study", "--repo", "--manifest", "--tree", "--sessions", "--in"];
  for (let i = 0; i < rest.length; i++) { const flag = rest[i]; if (Object.hasOwn(args, flag)) throw new Error("replay: arguments"); if (flags.includes(flag)) args[flag] = true; else if (values.includes(flag) && rest[i + 1] && !rest[i + 1].startsWith("--")) args[flag] = rest[++i]; else throw new Error("replay: arguments"); }
  const need = names => { if (names.some(n => !args[`--${n}`])) throw new Error("replay: arguments"); };
  const print = value => stdout(JSON.stringify(value) + "\n");
  if (command === "render") {
   need(["contexts", "labels", "build", "arm", "out"]);
   const out = privateFolder(args["--out"], { allowAncestorSymlinks: true, refuseCheckout: true }); if (fs.readdirSync(out).length) throw new Error("replay: output not empty");
   const { records, labelStore } = await loadContexts(args["--contexts"], args["--labels"]), c = records.find(c => c.id === args["--build"]);
   const rendered = renderContext(c, { clone: path.join(out, "work"), arm: JSON.parse(fs.readFileSync(args["--arm"])), labelStore, mainCheckout: deps.mainCheckout });
   write(path.join(out, "prompt.json"), rendered); print({ sections: Object.keys(rendered.sections).length, chars: rendered.systemPrompt.length, sha256: hash(rendered) });
  } else if (command === "run") {
   need(["study", "repo", "contexts", "labels", "out"]);
   const rows = await runStudy({ studyDir: args["--study"], repo: args["--repo"], contexts: args["--contexts"], labels: args["--labels"], out: args["--out"], go: !!args["--go"], smoke: !!args["--smoke"], ...deps });
   print({ runs: rows.length, dry: !args["--go"], reserved: args["--go"] ? undefined : rows.reduce((n, r) => n + r.reserved, 0), profiles: args["--go"] ? undefined : rows.map(r => r.profileHash) });
  } else if (command === "grade") {
   need(["manifest", "tree", "out"]);
   // A standalone grading command also yields to clone-shared lanes and the machine suite.
   const common = path.resolve(args["--tree"], git(args["--tree"], ["rev-parse", "--git-common-dir"]));
   const pidFile = path.join(path.dirname(args["--tree"]), "builder.pid");
   const builderPid = fs.existsSync(pidFile) ? Number(fs.readFileSync(pidFile, "utf8")) : undefined;
   const r = await grade({ manifest: loadGrading(args["--manifest"]), tree: args["--tree"], out: args["--out"], builderPid, busy: deps.busy ?? (() => machineBusy({ ledger: buildRecordsPath(common) })) });
   print({ checks: r.checks.length, status: r.status, bounds: r.bounds, outcomes: tally(r.checks, "outcome") });
  } else if (command === "errors") {
   need(["sessions"]); const files = [];
   const walk = dir => { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) walk(p); else if (e.isFile() && e.name.endsWith(".jsonl")) files.push(p); } }; walk(args["--sessions"]);
   const repo = path.resolve(args["--repo"] ?? path.resolve(here, "../../.."));
   const common = path.resolve(repo, git(repo, ["rev-parse", "--git-common-dir"]));
   const ledgerFile = buildRecordsPath(common), records = fs.existsSync(ledgerFile) ? readBuildLedger(ledgerFile).records : [];
   const groups = new Map();
   for (const file of files.sort()) {
    const entries = entriesIn(file), name = entries.filter(e => e.type === "session_info").at(-1)?.name ?? "";
    if (!name.startsWith(SESSION_PREFIX)) continue;
    const end = records.find(r => r.kind === "end" && r.sessions?.some(s => path.basename(s) === path.basename(file)) && records.some(start => start.kind === "start" && start.build === r.build && path.resolve(start.sessionDir) === path.dirname(file)));
    const start = end && records.find(r => r.kind === "start" && r.build === end.build);
    const number = buildNumberFromBrief(start?.brief);
    const group = groups.get(number) ?? []; groups.set(number, group);
    const precedent = [];
    if (start?.tip && start.brief) {
     const relative = path.isAbsolute(start.brief) ? path.relative(repo, start.brief) : start.brief;
     if (!relative.split(/[\\/]/u).includes("..")) {
      const result = spawnSync("git", ["show", `${start.tip}:${relative.replaceAll("\\", "/")}`], { cwd: repo, encoding: "utf8", timeout: GIT_MS });
      if (result.status === 0) precedent.push(...(readBrief(result.stdout).precedent ?? []).filter(p => p.kind === "path").map(p => p.value));
     }
    }
    group.push(classifyErrors(entries, { precedent }));
   }
   print({ builds: [...groups].map(([buildNumber, summaries]) => ({ buildNumber, ...mergeErrorCounts(summaries) })) });
  } else if (command === "rows") {
   need(["in"]); const rows = await readRows(args["--in"]); print({ runs: rows.length, outcomes: tally(rows, "outcome"), unpriced: rows.filter(r => r.cost === null).length, bounds: rows.map(r => r.bounds).filter(Boolean) });
  } else throw new Error("replay: arguments");
  return 0;
 } catch (error) {
  const safe = /^replay: (?:no isolation backend|folder in use|pre-registration not committed|overlay mismatch|arguments|output not empty|pi version mismatch|builder still alive|changed input [a-zA-Z0-9:./_-]+)$/u.test(error.message) ? error.message : "replay: invalid inputs or read/write failure";
  stderr(safe + "\n"); return 1;
 }
}
function tally(rows, field) { const result = {}; for (const row of rows) if (row[field]) result[row[field]] = (result[row[field]] ?? 0) + 1; return result; }
