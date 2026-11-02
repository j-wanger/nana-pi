/**
 * @module apps/bench/test/replay.test.mjs
 * @purpose Pin the eight replay contracts using synthetic private stores and unpaid stub processes.
 * @inputs OS-temp repositories, synthetic streams, manifests and injected runners.
 * @outputs Eight awaited bounded PASS/FAIL cases; no private fixture text.
 * @effects disk (OS temp only), process (stub children and macOS sandbox)
 * @errors Assertion failures set exit code 1.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { segmentPart } from "../lib/anatomy-spans.mjs";
import { distinctUnits } from "../lib/anatomy-measures.mjs";
import { entriesIn } from "../../../packages/nana-pack/lib/claude-transcript.mjs";
import { pidAlive } from "../../../packages/nana-pack/lib/process-tree.mjs";
import { tmpDir } from "./tmp-dir.mjs";

const root = tmpDir(path.join(os.tmpdir(), "builder-replay-test-"));
let serial = 0, partSerial = 0, passed = 0, failed = 0;
const folder = () => { const p = path.join(root, String(++serial)); fs.mkdirSync(p); return p; };
const put = (p, s) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); return p; };
const json = (p, v) => put(p, JSON.stringify(v));
const sha = (s) => createHash("sha256").update(s).digest("hex");
const lines = (xs, eol = "\n", final = true) => xs.map(x => JSON.stringify(x) + " \t").join(eol) + (final ? eol : "");
const git = (cwd, args) => { const r = spawnSync("git", args, { cwd, encoding: "utf8", timeout: 10000 }); assert.equal(r.status, 0); return r.stdout.trim(); };
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(fn, ms = 5000) { const end = Date.now() + ms; while (!fn()) { assert.ok(Date.now() < end); await pause(20); } }
async function test(title, fn) {
 let timer;
 try { await Promise.race([Promise.resolve().then(fn), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("case deadline")), 45000); })]); passed++; console.log(`PASS ${title}`); }
 catch (e) { failed++; console.log(`FAIL ${title}`); if (process.env.REPLAY_TEST_DEBUG) console.error(e.stack); }
 finally { clearTimeout(timer); }
}
const part = (name, raw, attempt = 0, section = name) => ({ name, raw, attempt, section, spans: segmentPart(raw, name, `${++partSerial}:${name}:${attempt}`) });
function context(cwd = "/synthetic/main-wt/lane") {
 return { id: "build-1", lane: "lane", cwd, branch: "feat/lane", buildNumber: 1, attempts: 2, startTip: null, parts: [
  part("preamble", "Recorded preamble."), part("tools", "<tools>\nread and edit\n</tools>"),
  part("preamble", "<addendum>\n", 0, "addendum"),
  part("brief", "# Empty elsewhere\n\n# Lessons\n- Model lesson. \t\n- Rule lesson only.\n\n| Kind | Note |\n| --- | --- |\n| lesson | Table lesson |\n", 0, "addendum"),
  part("known-bugs", "Known bugs\n</addendum>", 0, "addendum"),
  part("cwd", `<cwd>\n${cwd}\n</cwd>`), part("objective", "<objective>\nRecorded goal.\n</objective>"), part("instruction", `Build at ${cwd}, ~/nana-pi and $HOME/nana-pi.`, 0, undefined),
  part("knowledge-pull", "LATER_CUSTOM_SENTINEL"), part("preamble", "ATTEMPT_TWO_SENTINEL", 1), part("instruction", "SECOND_INSTRUCTION", 1),
 ] };
}
function labelsFor(c) {
 const units = distinctUnits([c]), labels = new Map(), byId = new Map();
 for (const u of units.values()) { for (const { s } of u.occurrences) byId.set(s.id, u.key); labels.set(u.key, { id: u.id, label: /Model lesson|Table lesson/u.test(u.text) ? "lessons" : "task" }); }
 return { units, byId, labels };
}
const stream = (cost = 0.1, extra = []) => [
 { type: "turn_start" }, ...extra,
 { type: "message_end", message: { role: "assistant", content: [{ type: "text", text: "done" }], stopReason: "stop", usage: { input: 11, output: 3, cacheRead: 5, cacheWrite: 7, totalTokens: 26, cost: { input: cost, output: 0, cacheRead: 0, cacheWrite: 0, total: cost } } } },
 { type: "agent_settled" },
];
const call = (id, name, args, output, isError = true, details) => [
 { type: "message", message: { role: "assistant", content: [{ type: "toolCall", id, name, arguments: args }] } },
 { type: "message", message: { role: "toolResult", toolCallId: id, toolName: name, content: [{ type: "text", text: output }], isError, details } },
];
const events = xs => xs.map(x => x.type === "message" ? { type: "message_end", message: x.message } : x);
async function fixture() {
 const base = folder(), repo = path.join(base, "repo"); fs.mkdirSync(repo);
 git(repo, ["init", "-q"]); git(repo, ["config", "user.email", "fixture@example.invalid"]); git(repo, ["config", "user.name", "Fixture"]);
 put(path.join(repo, "impl.mjs"), "export const answer = 1;\n"); git(repo, ["add", "impl.mjs"]); git(repo, ["commit", "-qm", "start"]); const startTip = git(repo, ["rev-parse", "HEAD"]);
 put(path.join(repo, "future-answer"), "FUTURE_SENTINEL"); git(repo, ["add", "future-answer"]); git(repo, ["commit", "-qm", "future"]);
 const contexts = path.join(base, "contexts"), c = context(repo); c.startTip = startTip;
 put(path.join(contexts, "contexts.jsonl"), lines([c], "\r\n", false));
 const labelStore = labelsFor(c), labels = path.join(base, "labels");
 json(path.join(labels, "manifest.json"), { model: "synthetic", promptSha256: sha("synthetic"), contexts: 1, distinctUnits: labelStore.units.size });
 put(path.join(labels, "labels.jsonl"), lines([...labelStore.labels].map(([key, row]) => ({ key, ...row })), "\r\n", false));
 const source = put(path.join(base, "overlay", "test.mjs"), 'console.log("PASS same");\n');
 const grading = json(path.join(base, "grading.json"), { overlay: [{ source, path: "test.mjs", sha256: sha(fs.readFileSync(source)) }], files: ["test.mjs"], checks: [{ id: "test.mjs#same#1", file: "test.mjs", text: "same", occurrence: 1, row: "R-fixture", weight: 1, class: "fail-to-pass" }], interface: { modules: [{ path: "impl.mjs", exports: ["answer"] }], commands: [] } });
 const studyDir = path.join(base, "study"); fs.mkdirSync(studyDir);
 put(path.join(studyDir, "PREREG.md"), "Synthetic registration, no study values.\n");
 git(studyDir, ["init", "-q"]); git(studyDir, ["config", "user.email", "fixture@example.invalid"]); git(studyDir, ["config", "user.name", "Fixture"]); git(studyDir, ["add", "PREREG.md"]); git(studyDir, ["commit", "-qm", "register"]);
 const study = { id: "synthetic", model: { provider: "stub", id: "stub", thinking: "off" }, repeats: 1, seed: 9, allowance: 1, killLimit: 0.8, cap: 4, piVersion: "stub-1", preregistration: "PREREG.md", lanes: [{ build: c.id, lane: c.lane, grading }], arms: [{ name: "control" }] };
 json(path.join(studyDir, "study.json"), study);
 return { base, repo, contexts, labels, c, grading, source, studyDir, study, out: path.join(base, "private"), startTip };
}
const moduleURL = new URL("../lib/replay.mjs", import.meta.url).href;
const launcher = (base, body) => ({ cmd: process.execPath, pre: [put(path.join(base, "stub.mjs"), body)] });
const stubBody = (xs, tail = "") => `import fs from 'node:fs';const p=JSON.parse(fs.readFileSync(process.env.NANA_REPLAY_CONTEXT,'utf8'));fs.writeFileSync(process.env.NANA_REPLAY_SESSION,JSON.stringify({type:'message',message:{role:'system',content:'',sections:p.sections}})+'\\n');process.stdout.write(${JSON.stringify(lines(xs))});${tail}`;

// req: R-3600
await test("R-3600: sandbox start tree excludes future and outside data", async () => {
 const I = await import("../lib/replay-isolation.mjs"), R = await import("../lib/replay.mjs");
 const f = await fixture();
 const clone = path.join(f.base, "run", "work"); await I.createStartTree(f.repo, f.startTip, clone);
 assert.equal(git(clone, ["rev-list", "--all", "--count"]), "1"); assert.equal(git(clone, ["remote"]), ""); assert.ok(!fs.existsSync(path.join(clone, "future-answer")));
 const env = I.replayEnv({ home: path.dirname(clone), temp: path.dirname(clone), agentDir: path.dirname(clone), suiteLock: path.join(f.base, "suite"), bin: "/usr/bin:/bin", parent: { GH_TOKEN: "secret", GITHUB_TOKEN: "secret", UNEXPECTED: "secret" } });
 assert.equal(env.GH_TOKEN, undefined); assert.equal(env.GITHUB_TOKEN, undefined); assert.equal(env.UNEXPECTED, undefined);
 if (process.platform !== "darwin") {
  await assert.rejects(R.runStudy({ ...f, go: true, platform: process.platform }), /replay: no isolation backend/u); return;
 }
 const forbidden = ["live", "sibling", "validation", "sessions"].map(n => put(path.join(f.base, n, "sentinel"), "PRIVATE_SENTINEL"));
 // HOME-relative traversal reaches the same denied folders; no ambient HOME is needed.
 forbidden.push(path.join(env.HOME, "..", "live", "sentinel"));
 fs.symlinkSync(forbidden[0], path.join(clone, "outside-link"));
 const probe = put(path.join(path.dirname(clone), "probe.mjs"), `import fs from 'node:fs';import{spawnSync}from'node:child_process';let n=0;for(const p of ${JSON.stringify([...forbidden, path.join(clone, "outside-link")])}){try{fs.readFileSync(p);process.exitCode=1}catch{n++}const r=spawnSync('/bin/cat',[p]);if(r.status===0)process.exitCode=1;const j=spawnSync(process.execPath,['-e','require("fs").readFileSync(process.argv[1])',p]);if(j.status===0)process.exitCode=1;}try{fs.writeFileSync(${JSON.stringify(forbidden[0])},'bad');process.exitCode=1}catch{}fs.writeFileSync(${JSON.stringify(path.join(clone, "ok"))},'ok');console.log('PASS denied '+n);`);
 const profile = I.sandboxProfile({ runDir: path.dirname(clone), readPaths: [process.execPath], suiteLock: path.join(f.base, "suite") });
 const result = spawnSync("/usr/bin/sandbox-exec", ["-p", profile, process.execPath, probe], { env, cwd: clone, encoding: "utf8", timeout: 10000 });
 assert.equal(result.status, 0, JSON.stringify({ signal: result.signal, error: result.error?.code, stderr: result.stderr })); assert.ok(fs.existsSync(path.join(clone, "ok")));
 const l = launcher(f.base, stubBody(stream(0.1, [{ type: "tool_execution_start", toolName: "bash", toolCallId: "remote", args: { command: "git clone https://github.com/example/repo" } }])));
 const rows = await R.runStudy({ ...f, go: true, launcher: l, sandboxReadPaths: [l.pre[0]], busy: () => false, suiteLock: path.join(f.base, "suite") });
 assert.equal(rows[0].outcome, "leak-suspect");
});
// req: R-3601
await test("R-3601: first context is exact and cuts only model-labelled kind", async () => {
 const C = await import("../lib/replay-context.mjs"), R = await import("../lib/replay.mjs");
 const c = context(), labels = labelsFor(c), clone = "/synthetic/replay/work";
 const control = C.renderContext(c, { clone, arm: { name: "control" }, labelStore: labels });
 const expected = ["Recorded preamble.", "<tools>\nread and edit\n</tools>", c.parts.slice(2, 5).map(p => p.raw).join(""), `<cwd>\n${clone}\n</cwd>`, "<objective>\nRecorded goal.\n</objective>"].join("\n\n");
 assert.equal(control.systemPrompt, expected); assert.equal(control.instruction, `Build at ${clone}, ${clone} and ${clone}.`); assert.equal(control.attempt, 0);
 assert.ok(!JSON.stringify(control).includes("SENTINEL"));
 // Load the actual bench extension, not a stub that merely repeats expected sections.
 const promptFile = json(path.join(folder(), "prompt.json"), control), old = process.env.NANA_REPLAY_CONTEXT;
 process.env.NANA_REPLAY_CONTEXT = promptFile;
 try {
  const { default: activate } = await import("../ext/replay-context.ts");
  let handler; activate({ on: (name, fn) => { assert.equal(name, "before_agent_start"); handler = fn; } });
  const event = { systemPromptOptions: { sections: {}, cwd: clone, selectedTools: ["read"] } };
  handler(event);
  assert.equal(event.systemPromptOptions.forceSystemPrompt, undefined);
  // pi 1.4.0 stores customPrompt before cwd, then wraps custom sections. It does not persist forceSystemPrompt.
  const options = event.systemPromptOptions;
  const recorded = [options.customPrompt, `<cwd>\n${options.cwd}\n</cwd>`, ...Object.entries(options.sections).map(([n, t]) => `<${n}>\n${t}\n</${n}>`)].join("\n\n");
  assert.equal(recorded, control.systemPrompt);
 } finally { if (old === undefined) delete process.env.NANA_REPLAY_CONTEXT; else process.env.NANA_REPLAY_CONTEXT = old; }
 const cut = C.renderContext(c, { clone, arm: { name: "no-tools", dropSections: ["tools"] }, labelStore: labels });
 assert.equal(cut.systemPrompt, expected.replace("<tools>\nread and edit\n</tools>\n\n", ""));
 const instructionContext = context();
 const instructionPart = instructionContext.parts.find(p => p.name === "instruction");
 instructionPart.spans = segmentPart(instructionPart.raw + "\n\nModel lesson in the first instruction.\n", "instruction", "instruction-fixture");
 const instructionCut = C.renderContext(instructionContext, { clone, arm: { name: "no-lessons", dropLabel: "lessons" }, labelStore: labelsFor(instructionContext) });
 assert.ok(!instructionCut.instruction.includes("Model lesson")); assert.ok(instructionCut.instruction.includes("Build at"));
 const lessons = C.renderContext(c, { clone, arm: { name: "no-lessons", dropLabel: "lessons" }, labelStore: labels });
 assert.ok(!lessons.systemPrompt.includes("Model lesson")); assert.ok(lessons.systemPrompt.includes("Rule lesson only")); assert.ok(lessons.systemPrompt.includes("# Empty elsewhere")); assert.ok(!lessons.systemPrompt.includes("| Kind |"));
 if (process.platform === "darwin") {
  const f = await fixture(), l = launcher(f.base, stubBody(stream()).replace("sections:p.sections", "sections:{preamble:'reordered'}"));
  const rows = await R.runStudy({ ...f, go: true, launcher: l, sandboxReadPaths: [l.pre[0]], busy: () => false, suiteLock: path.join(f.base, "suite") });
  assert.equal(rows[0].outcome, "harness: prompt-mismatch");
 }
});
// req: R-3602
await test("R-3602: frozen checks retain failures and grader bounds", async () => {
 const G = await import("../lib/replay-grade.mjs");
 const f = await fixture(), tree = folder(); put(path.join(tree, "impl.mjs"), "export const answer=1;\n");
 const a = put(path.join(f.base, "a.mjs"), 'console.log("PASS same (12ms) \\t\\r\\nSKIP skipped\\r\\n  PASS nested\\r\\nFAIL failed");process.exitCode=1;');
 const b = put(path.join(f.base, "b.mjs"), 'console.log("PASS same (999ms)");process.exitCode=1;');
 const manifest = { overlay: [a, b].map((source, i) => ({ source, path: `${i}.mjs`, sha256: sha(fs.readFileSync(source)) })), files: ["0.mjs", "1.mjs"], masks: [{ pattern: "\\(\\d+ms\\)", replacement: "(TIME)" }], checks: [
  { file: "0.mjs", text: "same (TIME)", occurrence: 1 }, { file: "1.mjs", text: "same (TIME)", occurrence: 1 }, { file: "0.mjs", text: "failed", occurrence: 1 }, { file: "0.mjs", text: "skipped", occurrence: 1 }, { file: "0.mjs", text: "nested", occurrence: 1 },
 ].map(c => ({ ...c, id: `${c.file}#${c.text}#1`, weight: 1, row: "R-fixture", class: "fail-to-pass" })), interface: { modules: [{ path: "impl.mjs", exports: ["answer"] }] } };
 const r = await G.grade({ manifest, tree, out: folder(), busy: () => false });
 assert.deepEqual(r.checks.map(c => c.outcome), ["pass", "pass", "fail", "not-run", "not-run"]); assert.notEqual(r.checks[0].id, r.checks[1].id);
 for (const [code, source, incompatible] of [
  ["export const answer = ;", `import {answer} from ${JSON.stringify("./impl.mjs")};`, false],
  ["export const other=1;", `import {answer} from ${JSON.stringify("./impl.mjs")};`, false],
  [null, `import {answer} from ${JSON.stringify("./impl.mjs")};`, false],
  ["export const answer=1;", `import ${JSON.stringify("./unnamed-helper.mjs")};`, true],
 ]) {
  if (code === null) fs.rmSync(path.join(tree, "impl.mjs"), { force: true }); else put(path.join(tree, "impl.mjs"), code);
  const src = put(path.join(f.base, "fault.mjs"), source + '\nconsole.log("PASS check");');
  const m = { ...manifest, overlay: [{ source: src, path: "fault.mjs", sha256: sha(fs.readFileSync(src)) }], files: ["fault.mjs"], checks: [{ id: "fault.mjs#check#1", file: "fault.mjs", text: "check", occurrence: 1, weight: 1, row: "R-fixture", class: "fail-to-pass" }] };
  const g = await G.grade({ manifest: m, tree, out: folder(), busy: () => false });
  assert.equal(g.status, incompatible ? "grader-incompatible" : "graded"); assert.equal(g.checks[0].outcome, incompatible ? "not-run" : "fail"); assert.deepEqual(g.bounds, incompatible ? { worst: 0, best: 1 } : { worst: 0, best: 0 });
 }
 const hanging = put(path.join(f.base, "hang.mjs"), 'setInterval(()=>{},1000);');
 const broken = await G.grade({ manifest: { ...manifest, timeoutMs: 30, overlay: [{ source: hanging, path: "0.mjs", sha256: sha(fs.readFileSync(hanging)) }, manifest.overlay[1]] }, tree, out: folder(), busy: () => false });
 assert.equal(broken.status, "grader-broken"); assert.equal(broken.checks[0].outcome, "grader-broken"); assert.deepEqual(broken.bounds, { worst: 0, best: 1 });
 manifest.overlay[0].sha256 = "wrong"; await assert.rejects(G.grade({ manifest, tree, out: folder(), busy: () => false }), /replay: overlay mismatch/u);
});
// req: R-3603
await test("R-3603: durable reservations cap spend and never repay interruptions", async () => {
 const J = await import("../lib/replay-journal.mjs"), R = await import("../lib/replay.mjs");
 const out = folder(), ops = [0, 1, 2].map(repeat => ({ key: `lane|control|${repeat}`, allowance: 1 })); let calls = 0;
 await J.runOperations({ out, manifestHash: "hash", cap: 2, operations: ops, execute: async op => { calls++; const log = entriesIn(path.join(out, "journal.jsonl")); assert.ok(log.some(x => x.kind === "start" && x.key === op.key && x.reserved === 1)); return { cost: 1, outcome: "settled" }; } });
 assert.equal(calls, 2); assert.ok(entriesIn(path.join(out, "journal.jsonl")).some(x => x.kind === "refused" && x.reason === "cap"));
 const unknown = folder(); await J.runOperations({ out: unknown, manifestHash: "h", cap: 1, operations: ops, execute: async () => ({ cost: null }) });
 assert.equal(entriesIn(path.join(unknown, "journal.jsonl")).find(x => x.kind === "end").charged, 1);
 const interrupted = folder(), childFile = put(path.join(folder(), "interrupt.mjs"), `import {runOperations} from ${JSON.stringify(new URL("../lib/replay-journal.mjs", import.meta.url).href)};await runOperations({out:${JSON.stringify(interrupted)},manifestHash:'h',cap:1,operations:[{key:'x',allowance:1}],execute:async()=>{process.exit(17)}});`);
 assert.equal(spawnSync(process.execPath, [childFile], { timeout: 10000 }).status, 17);
 await J.runOperations({ out: interrupted, manifestHash: "h", cap: 1, operations: [{ key: "x", allowance: 1 }], execute: async () => { assert.fail("repaid"); } });
 const partialStream = put(path.join(interrupted, "partial.jsonl"), lines(stream(0.2)));
 const interruptedLog = entriesIn(path.join(interrupted, "journal.jsonl"));
 // A fresh interrupted operation retains its actual saved stream, even without a final newline.
 const partialOut = folder(); put(path.join(partialOut, "journal.jsonl"), lines([{ ...interruptedLog[0], streamFile: partialStream }], "\r\n", false));
 await J.runOperations({ out: partialOut, manifestHash: "h", cap: 1, operations: [], execute: () => assert.fail("repaid") });
 const recovered = (await J.readRows(partialOut))[0]; assert.equal(recovered.totalTokens, 26); assert.equal(recovered.partialCost, 0.2); assert.equal(recovered.cost, null);
 assert.equal((await J.readRows(interrupted))[0].outcome, "interrupted");
 const both = folder(); await J.runOperations({ out: both, manifestHash: "h", cap: 2, operations: [{ key: "smoke", allowance: 1 }, { key: "review", allowance: 1 }, { key: "third", allowance: 1 }], execute: async op => op.key === "review" ? { cost: null, reviewer: "missing" } : { cost: 1 } });
 assert.equal((await J.readRows(both)).length, 2); assert.equal((await J.readRows(both))[1].reviewer, "missing");
 if (process.platform === "darwin") {
  const f = await fixture(), l = launcher(f.base, stubBody(stream(0.9), "setInterval(()=>{},1000);"));
  const rows = await R.runStudy({ ...f, go: true, launcher: l, busy: () => false, suiteLock: path.join(f.base, "suite"), sandboxReadPaths: [l.pre[0]] });
  assert.equal(rows[0].outcome, "ceiling"); assert.equal(rows[0].cost, 0.9); assert.equal(rows[0].killedCleanly, true);
  const unknownFixture = await fixture(); unknownFixture.study.ceilingMs = 2000; json(path.join(unknownFixture.studyDir, "study.json"), unknownFixture.study);
  const nested = call("nested", "bash", {}, "result", false, { benchNested: { unknown: true } });
  const unknownLauncher = launcher(unknownFixture.base, stubBody(stream(0.9, events(nested)), "setTimeout(()=>fs.writeFileSync(process.env.NANA_REPLAY_RUN_DIR+'/survived','bad'),500);setInterval(()=>{},1000);"));
  const unknownRows = await R.runStudy({ ...unknownFixture, go: true, launcher: unknownLauncher, busy: () => false, suiteLock: path.join(unknownFixture.base, "suite"), sandboxReadPaths: [unknownLauncher.pre[0]] });
  assert.equal(unknownRows[0].cost, null); assert.equal(entriesIn(path.join(unknownFixture.out, "journal.jsonl")).find(r => r.kind === "end").charged, 1);
  const unknownRun = path.join(unknownFixture.out, "runs", fs.readdirSync(path.join(unknownFixture.out, "runs"))[0]);
  assert.ok(!fs.existsSync(path.join(unknownRun, "survived")), "known priced spend still enforces kill limit when nested spend is unknown");
  const crash = await fixture(), crashLauncher = launcher(crash.base, "throw new Error('must not repay');");
  const dry = await R.runStudy({ ...crash, launcher: crashLauncher, suiteLock: path.join(crash.base, "suite") });
  const identity = JSON.parse(fs.readFileSync(path.join(crash.out, "run-manifest.json")));
  const saved = put(path.join(crash.out, "partial.jsonl"), lines(stream(0.2, events([...call("pull", "read", { path: "impl.mjs" }, "bytes", false), ...call("err", "edit", {}, "Could not find the exact text")]))));
  put(path.join(crash.out, "journal.jsonl"), lines([{ kind: "start", key: dry[0].key, tuple: dry[0], reserved: 1, manifestHash: identity.fingerprint, streamFile: saved }]));
  const resumedCrash = await R.runStudy({ ...crash, go: true, launcher: crashLauncher, busy: () => false, suiteLock: path.join(crash.base, "suite") });
  assert.equal(resumedCrash[0].outcome, "interrupted"); assert.equal(resumedCrash[0].pulls.byClass[0].calls, 1); assert.equal(resumedCrash[0].errors.failedCalls, 1); assert.equal(resumedCrash[0].checks[0].outcome, "not-run");
  // Exercise the prescribed Claude runner adapter, including durable reviewer admission and shared cap.
  for (const ok of [true, false]) {
   const f = await fixture(); f.study.review = { model: "stub-claude", effort: "low", allowance: 1 }; json(path.join(f.studyDir, "study.json"), f.study);
   const l = launcher(f.base, stubBody(stream())); let reviews = 0;
   const rows = await R.runStudy({ ...f, go: true, smoke: true, launcher: l, busy: () => false, suiteLock: path.join(f.base, "suite"), sandboxReadPaths: [l.pre[0]], reviewSpawn: (_bin, args) => {
    reviews++; assert.ok(entriesIn(path.join(f.out, "journal.jsonl")).some(r => r.kind === "start" && r.key.startsWith("review|smoke|")));
    assert.equal(args[args.indexOf("--max-budget-usd") + 1], "1");
    assert.equal(args[args.indexOf("--tools") + 1], "Read");
    return { status: ok ? 0 : 1, stdout: JSON.stringify({ structured_output: { must: 2 }, modelUsage: { "stub-claude": { inputTokens: 10 } }, total_cost_usd: 0.3 }), stderr: "" };
   } });
   assert.equal(reviews, 1); assert.deepEqual(rows[0].reviewer, ok ? { must: 2, cost: 0.3 } : "missing");
   assert.equal(entriesIn(path.join(f.out, "journal.jsonl")).filter(r => r.kind === "end").length, 2);
  }
 }
});
// req: R-3604
await test("R-3604: complete measures and stalled trees precede grading", async () => {
 const R = await import("../lib/replay.mjs");
 const sessions = call("read1", "read", { path: "impl.mjs" }, "source bytes", false), evs = events(sessions);
 const a = R.measureRun(lines(sessions), { cwd: root, outcome: "settled", wallMs: 12 }), b = R.measureRun(lines(evs), { cwd: root, outcome: "settled", wallMs: 12 });
 assert.deepEqual(a.toolCalls, { read: 1 }); assert.deepEqual(a.toolCalls, b.toolCalls); assert.deepEqual(a.pulls, b.pulls); assert.deepEqual(a.pulls.byClass, [{ class: "source", calls: 1, chars: 12 }]);
 const m = R.measureRun(lines(stream(0.2, [{ type: "auto_retry_start" }, { type: "compaction_end" }])), { cwd: root, outcome: "settled", wallMs: 12 });
 assert.equal(m.totalTokens, 26); assert.equal(m.tokens.cacheWrite, 7); assert.equal(m.tokens.cacheRead, 5); assert.equal(m.tokens.input, 11); assert.equal(m.tokens.output, 3); assert.equal(m.cost, 0.2); assert.equal(m.wallMs, 12); assert.equal(m.turns, 1); assert.equal(m.retries, 1); assert.equal(m.compactions, 1); assert.equal(m.reviewer, "missing");
 if (process.platform !== "darwin") return;
 const f = await fixture(); f.study.stallMs = 250;
 // The overlay itself observes the no-live-builder boundary, before declaring its check.
 put(f.source, `import fs from 'node:fs';const pid=Number(fs.readFileSync('../grandchild.pid','utf8'));try{process.kill(pid,0);process.exit(1)}catch{}console.log('PASS same');`);
 const grading = JSON.parse(fs.readFileSync(f.grading)); grading.overlay[0].sha256 = sha(fs.readFileSync(f.source)); json(f.grading, grading);
 json(path.join(f.studyDir, "study.json"), f.study);
 const l = launcher(f.base, stubBody(stream(), `const{spawn}=await import('node:child_process');const c=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});fs.writeFileSync(process.env.NANA_REPLAY_RUN_DIR+'/grandchild.pid',String(c.pid));setInterval(()=>{},1000);`));
 const rows = await R.runStudy({ ...f, go: true, launcher: l, sandboxReadPaths: [l.pre[0]], busy: () => false, suiteLock: path.join(f.base, "suite") });
 assert.equal(rows.length, 1); const row = rows[0]; const marker = path.join(f.out, "runs", fs.readdirSync(path.join(f.out, "runs"))[0], "grandchild.pid"); assert.equal(row.outcome, "stall"); assert.equal(row.killedCleanly, true); assert.ok(!pidAlive(Number(fs.readFileSync(marker))));
 for (const key of ["lane", "arm", "repeat", "manifestHash", "checks", "tokens", "totalTokens", "cost", "costReason", "wallMs", "turns", "toolCalls", "retries", "compactions", "pulls", "errors", "reviewer"]) assert.ok(Object.hasOwn(row, key));
 assert.equal(row.checks[0].outcome, "pass");
});
// req: R-3605
await test("R-3605: live lanes abort and exclusive folders refuse peers", async () => {
 const I = await import("../lib/replay-isolation.mjs"), J = await import("../lib/replay-journal.mjs"), G = await import("../lib/replay-grade.mjs"), R = await import("../lib/replay.mjs");
 const f = await fixture(), ledger = path.join(f.base, "builds.jsonl"), suiteLock = path.join(f.base, "suite"), lock = await J.lockFolder(f.out);
 await assert.rejects(J.lockFolder(f.out), /replay: folder in use/u); lock();
 put(ledger, lines([{ v: 1, kind: "start", build: "x", pid: process.pid }])); assert.equal(I.machineBusy({ ledger, suiteLock }), true);
 put(ledger, lines([{ v: 1, kind: "start", build: "x", pid: 2147483647 }])); put(path.join(suiteLock, "pid"), "2147483647"); assert.equal(I.machineBusy({ ledger, suiteLock }), false);
 put(path.join(suiteLock, "pid"), String(process.pid)); assert.equal(I.machineBusy({ ledger, suiteLock }), true);
 let polls = 0; const tree = folder(), busy = () => ++polls < 3;
 const grade = await G.grade({ manifest: JSON.parse(fs.readFileSync(f.grading)), tree, out: folder(), busy, pollMs: 10 }); assert.equal(grade.checks[0].outcome, "pass"); assert.ok(polls >= 3);
 if (process.platform !== "darwin") return;
 const l = launcher(f.base, stubBody(stream(), "setInterval(()=>{},1000);")); let active = false, detectedAt;
 const peerLock = await J.lockFolder(f.out);
 await assert.rejects(R.runStudy({ ...f, go: true, launcher: l }), /replay: folder in use/u); peerLock();
 const pending = R.runStudy({ ...f, go: true, launcher: l, sandboxReadPaths: [l.pre[0]], busy: () => { if (active) detectedAt ??= Date.now(); return active; }, suiteLock, pollMs: 50 });
 pending.catch(() => {});
 await until(() => fs.existsSync(path.join(f.out, "journal.jsonl"))); await pause(200); active = true;
 const at = Date.now(), rows = await pending; assert.ok(detectedAt - at <= 100, "busy detected within poll plus scheduling tolerance"); assert.equal(rows[0].outcome, "aborted: busy"); assert.equal(rows[0].checks[0].outcome, "not-run"); assert.equal(rows[0].killedCleanly, true); assert.ok(Date.now() - at < 3000);
 const resumed = await R.runStudy({ ...f, go: true, launcher: l, sandboxReadPaths: [l.pre[0]], busy: () => false, suiteLock, pollMs: 50 }); assert.equal(resumed.length, 1);
});
// req: R-3606
await test("R-3606: all causal inputs seal resume including committed registration", async () => {
 const R = await import("../lib/replay.mjs"), J = await import("../lib/replay-journal.mjs");
 const f = await fixture(); const first = await R.makeRunManifest({ ...f, piVersion: "stub-1" }); await J.assertRunManifest(f.out, first);
 for (const [file, change, expected] of [
  [path.join(f.labels, "labels.jsonl"), s => s + "\n", "labels"],
  [path.join(f.contexts, "contexts.jsonl"), s => s.replace("Recorded preamble", "Changed preamble"), "context"],
  [f.source, s => s + "\n", "overlay"],
  [path.join(f.studyDir, "study.json"), s => JSON.stringify({ ...JSON.parse(s), repeats: 2 }), "study"],
  [path.join(f.studyDir, "PREREG.md"), s => s + "edited\n", "pre-registration"],
 ]) {
  const bytes = fs.readFileSync(file); put(file, change(bytes.toString()));
  await assert.rejects(async () => J.assertRunManifest(f.out, await R.makeRunManifest({ ...f, piVersion: "stub-1" })), new RegExp(`replay: .*${expected}`, "u")); put(file, bytes);
 }
 const uncommitted = await fixture(); git(uncommitted.studyDir, ["rm", "--cached", "PREREG.md"]);
 await assert.rejects(R.makeRunManifest({ ...uncommitted, piVersion: "stub-1" }), /replay: pre-registration not committed/u);
});
// req: R-3607
await test("R-3607: three error layers deduplicate and never print private text", async () => {
 const E = await import("../lib/replay-errors.mjs"), R = await import("../lib/replay.mjs");
 const A = await import("../lib/anatomy-sessions.mjs");
 for (const [file, number] of [["build-brief-1.md", 1], ["build_2_brief.md", 2], ["fix-brief.md", 2], ["fix3-brief.md", 3], ["brief-7.md", 7], ["other.md", "unknown"]]) assert.equal(A.buildNumberFromBrief(file), number);
 const tools = [
  ["edit", "Could not find the exact text", "edit-mismatch"], ["edit", "Found 2 occurrences", "edit-not-unique"], ["read", "ENOENT", "read-missing"], ["bash", "Process exited with code 1", "bash-nonzero"], ["bash", "Command timed out", "bash-timeout"], ["write", "other", "tool-other"],
 ];
 const diagnostics = ["SyntaxError AssertionError", "ERR_MODULE_NOT_FOUND", "AssertionError", "test process crashed", "test timed out", "suite.lock", "EACCES", "ECONNRESET", "No configured push destination", "PRIVATE_ERROR_SENTINEL"];
 const xs = tools.flatMap(([tool, text], i) => call(`tool${i}`, tool, { path: "impl.mjs" }, text));
 xs.push(...diagnostics.flatMap((text, i) => call(`diag${i}`, "bash", {}, text)), ...call("duplicate", "edit", {}, "Could not find the exact text"), ...call("duplicate", "edit", {}, "Could not find the exact text"));
 const a = E.classifyErrors(xs, { precedent: ["impl.mjs"], outcome: "stall" }), b = E.classifyErrors(events(xs), { precedent: ["impl.mjs"], outcome: "stall" }); assert.deepEqual(a, b);
 assert.equal(a.failedCalls, 17); assert.equal(a.tools.edit["edit-mismatch"], 2); assert.equal(a.tools.edit["edit-not-unique"], 1); assert.equal(a.tools.read["read-missing"], 1); assert.equal(a.tools.bash["bash-timeout"], 2);
 for (const name of ["syntax", "module-load", "assertion", "test-crash", "test-timeout", "lock", "permission", "network", "no-remote"]) assert.equal(a.diagnostics[name], 1);
 assert.deepEqual(a.outcomes, { stall: 1 }); assert.equal(a.precedentTouch.count, 6); assert.equal(a.precedentTouch.interpretation, "proxy, not causal"); assert.equal(a.unclassifiedRate, 8 / 17);
 const negatives = [...call("grep", "bash", { command: "grep SyntaxError file" }, "SyntaxError", false), ...call("cat", "read", { path: "file" }, "SyntaxError", false), ...call("red", "bash", {}, "FAIL expected red", false)]; assert.equal(E.classifyErrors(negatives).failedCalls, 0);
 for (const [eol, final] of [["\n", true], ["\r\n", true], ["\r\n", false]]) {
  const f = await fixture(), sessions = path.join(f.base, "sessions"); fs.mkdirSync(sessions);
 put(path.join(sessions, "one.jsonl"), lines([{ type: "session", cwd: f.repo }, { type: "session_info", name: "pi-worker attempt 5" }, ...xs], eol, final));
 put(path.join(sessions, "two.jsonl"), lines([{ type: "session", cwd: f.repo }, { type: "session_info", name: "pi-worker attempt 6" }, ...xs], eol, final));
 // Both session attempts belong to build 2. Reused tool call ids in different sessions are independent.
 put(path.join(f.repo, ".git/nana/build-records.jsonl"), lines([{ v: 1, kind: "start", build: "baseline", sessionDir: sessions, brief: "build-brief-2.md" }, { v: 1, kind: "end", build: "baseline", sessions: ["one.jsonl", "two.jsonl"] }], eol, final));
 let stdout = "", stderr = "";
  assert.equal(await R.runReplay(["errors", "--sessions", sessions, "--repo", f.repo], { stdout: s => { stdout += s; }, stderr: s => { stderr += s; } }), 0); assert.equal(stderr, ""); assert.ok(!stdout.includes("PRIVATE_ERROR_SENTINEL")); assert.ok(stdout.includes("unclassifiedRate")); assert.ok(stdout.includes("proxy, not causal"));
  const group = JSON.parse(stdout).builds; assert.equal(group.length, 1); assert.equal(group[0].buildNumber, 2); assert.equal(group[0].failedCalls, 34);
  assert.equal(group[0].precedentTouch.count, 0);
 }
});

fs.rmSync(root, { recursive: true, force: true });
console.log(`builder replay: ${passed}/${passed + failed} checks passed`);
process.exitCode = failed ? 1 : 0;
