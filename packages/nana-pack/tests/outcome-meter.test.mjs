/**
 * @module packages/nana-pack/tests/outcome-meter.test.mjs
 * @purpose Pin the outcome meter's eight synthetic contracts and frozen tunables.
 * @inputs OS-temp transcripts, candidates, labels and injected runners or spawns only.
 * @outputs Awaited per-case PASS/FAIL lines.
 * @effects disk (OS temporary fixtures only)
 * @errors Assertion failures set exit code 1.
 */
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { tmpDir } from "./tmp-dir.mjs";
import { projectKey } from "../../nana-setup/lib/project-key.mjs";
import { resolveEvidence } from "../lib/memory-making.mjs";
import { PRIVATE_REFUSAL } from "../lib/memory-making-config.mjs";
import * as S from "../lib/memory-shaping-config.mjs";
import * as C from "../lib/outcome-meter-config.mjs";
import { measureOutcomes, runMeter, wilson, halvingExposure } from "../lib/outcome-meter.mjs";
import { runOutcomeScore, runOutcomeCompare } from "../lib/outcome-score.mjs";
import { createRunner } from "../../../scripts/memory-shape-runners.mjs";
import { meterRunner } from "../../../scripts/outcome-meter.mjs";
async function check(title, fn) {
 if (process.argv[2] && !title.includes(process.argv[2])) return;
 const abort = new AbortController();
 try { await Promise.race([Promise.resolve().then(fn), delay(20000, null, { signal: abort.signal }).then(() => { throw new Error("case deadline"); })]); console.log("PASS", title); }
 catch (e) { console.log("FAIL", title, e.message); process.exitCode = 1; }
 finally { abort.abort(); }
}
const instant = n => new Date(Date.UTC(2026, 0, 1) + n * 1000).toISOString();
const entry = (type, uuid, content, at, sessionId) => ({ type, uuid, sessionId, isSidechain: false, timestamp: instant(at), message: { role: type, content } });
const pointer = (session, n) => `claude-code:${session}#u${n}+s${n}`;
const candidate = (session, n, kind = "correction", claim = `Synthetic claim ${n}`) => ({ evidence: pointer(session, n), kind, claim, date: "2026-01-01" });
const none = async input => ({ ok: true, text: JSON.stringify({ matches: JSON.parse(input.prompt).items.map(u => ({ id: u.id, earlier: null, relation: "none" })) }), usage: { tokens: 10, cost: 0.01 } });
const match = (relation = "same") => async input => {
 const p = JSON.parse(input.prompt);
 return { ok: true, text: JSON.stringify({ matches: p.items.map(u => ({ id: u.id, earlier: p.earlier[0]?.id ?? null, relation: p.earlier.length ? relation : "none" })) }), usage: { tokens: 10, cost: 0.01 } };
};
async function fixture(n, fn, { specs = {}, starts = {}, eol = "\n", final = true } = {}) {
 const root = fs.realpathSync(tmpDir(path.join(os.tmpdir(), "outcome-meter-")));
 const roots = { repoRoot: path.join(root, "repo"), projectsRoot: path.join(root, "projects"), reviewsRoot: path.join(root, "reviews") };
 fs.mkdirSync(path.join(roots.repoRoot, ".git"), { recursive: true });
 const dir = path.join(roots.projectsRoot, projectKey(roots.repoRoot)); fs.mkdirSync(dir, { recursive: true });
 const sessions = new Map(); const names = [];
 for (let i = 1; i <= n; i++) {
  const spec = specs[i] ?? {}, session = spec.session ?? `session${Math.floor((i - 1) / C.WINDOW_SIZE)}`; names[i] = session;
  if (!sessions.has(session)) sessions.set(session, [entry("user", `open-${session}`, "Synthetic opener", starts[session] ?? i * 10 - 3, session)]);
  const entries = sessions.get(session);
  entries.push(entry("assistant", `s${i}`, spec.seat ?? "Which synthetic sample?", i * 10 - 1, session));
  entries.push(entry("user", `u${i}`, spec.quote ?? `Synthetic turn ${i}`, i * 10, session));
  entries.push(entry("user", `noise${i}`, [{ type: "tool_result", tool_use_id: "unused", content: "Synthetic tool output" }], i * 10 + 1, session));
 }
 for (const [name, entries] of sessions) fs.writeFileSync(path.join(dir, `${name}.jsonl`), entries.map(e => JSON.stringify(e) + " \t").join(eol) + (final ? eol : ""));
 const jsonl = (name, rows) => { const file = path.join(root, name); fs.writeFileSync(file, rows.map(r => typeof r === "string" ? r : JSON.stringify(r)).join(eol) + (final ? eol : "")); return file; };
 const cli = async (candidates, runModel = none, extra = [], out = path.join(root, `out-${crypto.randomUUID()}`)) => {
  const file = jsonl(`candidates-${crypto.randomUUID()}`, candidates); let stdout = "", stderr = "";
  const code = await runMeter(["--repo", roots.repoRoot, "--root", roots.projectsRoot, "--candidates", file, "--out", out, ...extra], { runModel, loadFile: path.join(root, "absent"), stdout: s => { stdout += s; }, stderr: s => { stderr += s; } });
  return { code, stdout, stderr, out };
 };
 try { await fn({ root, roots, dir, names, jsonl, cli, measure: (candidates, runModel = none, extra = {}) => measureOutcomes({ ...roots, candidates, runModel, loadFile: path.join(root, "absent"), ...extra }) }); }
 finally { fs.rmSync(root, { recursive: true, force: true }); }
}
const items = result => result.rows.filter(r => r.type === "item");
// req: R-3310
await check("counts interaction windows and pooled outcomes", async () => {
 for (const [eol, final] of [["\n", true], ["\r\n", true], ["\n", false]]) await fixture(C.WINDOW_SIZE * 3 + 1, async ({ names, cli, measure }) => {
  const a = candidate(names[C.WINDOW_SIZE], C.WINDOW_SIZE, "correction", "Synthetic repeat");
  const b = candidate(names[C.WINDOW_SIZE + 1], C.WINDOW_SIZE + 1, "correction", "SYNTHETIC repeat!");
  const c = candidate(names[C.WINDOW_SIZE * 2 + 1], C.WINDOW_SIZE * 2 + 1, "decision");
  const d = candidate(names[C.WINDOW_SIZE * 3 + 1], C.WINDOW_SIZE * 3 + 1, "correction");
  const r = await cli([a, b, c, d, b, { evidence: "review:synthetic", kind: "lesson", date: "2026-01-01" }]); assert.equal(r.code, 0);
  for (const line of ["interactions " + (C.WINDOW_SIZE * 3 + 1), "1 warm-up", "4 partial", "1 corrections 1 repeated 0 exact 0 parallel 0 unjudged 0", "2 corrections 1 repeated 1 exact 1 parallel 0 unjudged 0", "3 decisions 1 asked again 0 re-decided 0 unprompted 0 exact 0 parallel 0 unjudged 0", "2 pasted 1", "pooled correction 1/1 Wilson 0.2065 1.0000 halving needs 1682 interactions each side", "pooled decision 0/1 Wilson 0.0000 0.7935 halving needs unavailable interactions each side", C.WORDS.windowNote]) assert.ok(r.stdout.split("\n").includes(line), line);
  const result = await measure([a, b, c, d]); assert.equal(result.windows.length, 4); assert.equal(result.windows[1].interactions, C.WINDOW_SIZE);
  assert.deepEqual(wilson(0, 0), [0, 1]); assert.equal(halvingExposure(0, 1, C.WINDOW_SIZE), null);
 }, { eol, final, specs: { [C.WINDOW_SIZE]: { quote: "Synthetic pasted" }, [C.WINDOW_SIZE + 1]: { quote: "SYNTHETIC pasted!" } } });
});
// req: R-3311
await check("repeats need earlier in-scope nonparallel sessions", () => fixture(C.LOOKBACK + 4, async ({ measure }) => {
 const a = candidate("one", 1, "correction", "Synthetic same");
 const result = await measure([a, candidate("one", 2, "correction", a.claim), candidate("parallel", 3, "correction", a.claim), candidate("boundary", C.LOOKBACK + 1, "correction", a.claim), candidate("outside", C.LOOKBACK + 2, "correction", "Unique old claim"), { ...a, evidence: "seat:claude:synthetic:2026-01-01" }, { ...a, evidence: "claude-code:absent#missing+seat" }, { ...a, evidence: "claude-code:one#u1+missing" }]);
 const rows = items(result); assert.equal(rows[0].repeatOf, null); assert.equal(rows[1].repeatOf, null); assert.equal(rows[2].relation, "parallel"); assert.equal(rows[3].repeatOf, a.evidence); assert.equal(rows[4].repeatOf, null); assert.equal(result.counts.skipped, 1); assert.equal(result.counts.unresolved, 2);
 const outside = await measure([candidate("one", 1, "correction", "Synthetic boundary"), candidate("outside", C.LOOKBACK + 2, "correction", "Synthetic boundary")]); assert.equal(items(outside)[1].repeatOf, null);
 }, { specs: { 1: { session: "one" }, 2: { session: "one" }, 3: { session: "parallel" }, [C.LOOKBACK + 1]: { session: "boundary" }, [C.LOOKBACK + 2]: { session: "outside" } }, starts: { parallel: 0 } }));
// req: R-3312
await check("decisions require prompting and same settlement", () => fixture(5, async ({ roots, dir, measure }) => {
 const file = path.join(dir, "ask.jsonl");
 fs.writeFileSync(file, [entry("assistant", "ask", [{ type: "tool_use", id: "call", name: "AskUserQuestion", input: { questions: [{ question: "Which synthetic colour?" }] } }], 25, "ask"), entry("user", "answer", [{ type: "tool_result", tool_use_id: "call", content: '"Which synthetic colour?"="Blue"' }], 26, "ask")].map(JSON.stringify).join("\r\n"));
 const candidates = [candidate("a", 1, "decision"), candidate("b", 2, "decision"), { ...candidate("ask", 3, "decision"), evidence: "claude-code:ask#answer+ask" }, candidate("d", 4, "decision"), candidate("e", 5, "decision")];
 for (const c of candidates) assert.equal((await resolveEvidence(c.evidence, roots)).status, "resolved");
 const r = items(await measure(candidates, match())); assert.deepEqual(r.map(x => x.prompted), [true, true, true, false, true]); assert.equal(r[1].repeatOf, candidates[0].evidence); assert.equal(r[2].repeatOf, candidates[0].evidence); assert.equal(r[3].relation, "unprompted"); assert.equal(r[3].repeatOf, null);
 const changed = items(await measure(candidates, match("changed"))); assert.equal(changed[1].relation, "re-decided"); assert.equal(changed[1].repeatOf, null);
 }, { specs: { 1: { session: "a" }, 2: { session: "b" }, 3: { session: "c" }, 4: { session: "d", seat: "Synthetic statement." }, 5: { session: "e", seat: "YOUR CALL synthetic sample" } } }));
// req: R-3313
await check("judge sees full lookback and rejects bad calls", () => fixture(C.BATCH_SIZE + 3, async ({ names, measure, cli }) => {
 const candidates = Array.from({ length: C.BATCH_SIZE + 3 }, (_, i) => candidate(names[i + 1], i + 1, "correction", `Synthetic paraphrase ${i} ` + "x".repeat(C.CLAIM_CAP)));
 const calls = []; const result = await measure(candidates, async input => {
  const p = JSON.parse(input.prompt); calls.push(p); assert.equal(input.schema.type, "object"); assert.equal(p.kind, "correction"); assert.ok(p.items.length <= C.BATCH_SIZE);
  for (const u of [...p.items, ...p.earlier]) { assert.deepEqual(Object.keys(u), p.items.includes(u) ? ["id", "claim", "earlier"] : ["id", "claim"]); assert.ok(u.claim.length <= C.CLAIM_CAP); }
  for (const u of p.items) { const index = Number(/paraphrase (\d+)/.exec(u.claim)[1]); assert.equal(u.earlier.length, index); assert.ok(u.earlier.every(id => p.earlier.some(e => e.id === id))); }
  assert.ok(!input.prompt.includes("claude-code:")); assert.ok(!input.prompt.includes("session")); assert.equal(p.earlier.length, p.items.at(-1).claim.match(/paraphrase (\d+)/)[1] * 1);
  const reply = await none(input); return { ...reply, text: "```json\n" + reply.text + "\n```" };
 }); assert.ok(calls.length >= 2); assert.equal(items(result).filter(x => x.relation === "unjudged").length, 0);
 let count = 0; await measure([candidates[0], { ...candidates[1], claim: candidates[0].claim }], () => { count++; }); assert.equal(count, 0);
 for (const corrupt of [r => "Synthetic reply prose " + JSON.stringify(r), r => JSON.stringify({ matches: [] }), r => JSON.stringify({ matches: [...r.matches, { id: "u999", earlier: null, relation: "none" }] }), r => JSON.stringify({ matches: r.matches.map(x => ({ ...x, earlier: "e999", relation: "same" })) }), r => JSON.stringify({ matches: r.matches.map(x => ({ ...x, id: "u999" })) }), r => JSON.stringify({ matches: r.matches.map(x => ({ ...x, relation: "changed", earlier: "e1" })) })]) {
  const r = await cli(candidates, async input => ({ ok: true, text: corrupt(JSON.parse((await none(input)).text)), usage: { tokens: 1, cost: 0.01 } }));
  assert.equal(r.code, 0); assert.equal(r.stderr, ""); const rows = fs.readFileSync(path.join(r.out, C.OUTPUT_FILE), "utf8").trim().split("\n").map(JSON.parse); assert.equal(rows.filter(x => x.relation === "unjudged").length, candidates.length - 1); assert.ok(!r.stdout.includes("Synthetic"));
 }
 }, { specs: Object.fromEntries(Array.from({ length: C.BATCH_SIZE + 3 }, (_, i) => [i + 1, { session: `distinct${i}` }])) }));
// req: R-3314
await check("spend cap and unknown usage remain visible", () => fixture(C.WINDOW_SIZE * 3, async ({ names, cli }) => {
 const candidates = Array.from({ length: C.WINDOW_SIZE * 3 }, (_, i) => candidate(names[i + 1], i + 1)); let calls = 0;
 const r = await cli(candidates, async () => { calls++; return { ok: false, usage: { tokens: C.TOKEN_CAP / 2, cost: 0.01 } }; }); assert.equal(calls, 2); assert.ok(r.stdout.includes(C.WORDS.capReached)); assert.ok(r.stdout.includes(`3 corrections ${C.WINDOW_SIZE} repeated 0 exact 0 parallel 0 unjudged ${C.WINDOW_SIZE}`));
 let count = 0; const unknown = await cli(candidates.slice(0, C.BATCH_SIZE * 2 + 1), async input => ({ ...(await none(input)), usage: ++count === 1 ? null : { tokens: 7, cost: null } }));
 for (const line of ["calls with unknown usage 1", "cost unknown", "tokens >= 7"]) assert.ok(unknown.stdout.includes(line + "\n"), line);
 }, { specs: Object.fromEntries(Array.from({ length: C.WINDOW_SIZE * 3 }, (_, i) => [i + 1, { session: `spend${i}` }])) }));
// req: R-3315
await check("context loads split by window role launcher and part", () => fixture(C.WINDOW_SIZE + 1, async ({ root, jsonl, measure, cli }) => {
 const load = (role, launcher, at, chars, cwd = path.parse(root).root) => ({ v: 1, role, launcher, at: instant(at), cwd, parts: [{ name: "brief", deliveredChars: chars }, { name: "preamble", deliveredChars: 10 }] });
 const records = Array.from({ length: C.MIN_LOADS }, (_, i) => load("worker", "pi-worker", 11 + i, (i + 1) * 10));
 records.push(load("seat", "nana-shared-memory", 12, 5), load("reviewer", "pi-review", 13, 20), load("reviewer", "claude-review", 14, 30), load("worker", "pi-worker", 15, 999, root), load("worker", "pi-worker", 0, 999), load("worker", "pi-worker", (C.WINDOW_SIZE + 1) * 10, 25), "{torn", { ...load("seat", "x", 12, 1), v: 2 }, { v: 1, role: "seat", launcher: "x", at: instant(12) });
 for (const [eol, final] of [["\r\n", true], ["\n", false]]) {
  const file = path.join(root, "loads"); fs.writeFileSync(file, records.map(r => (typeof r === "string" ? r : JSON.stringify(r)) + " \t").join(eol) + (final ? eol : ""));
  const result = await measure([], none, { loadFile: file });
  for (const line of ["1 context worker pi-worker loads 10 median 65 p90 100 max 110", "1 context worker pi-worker part brief loads 10 median 55 p90 90 max 100", "1 context seat nana-shared-memory too few loads 1", "1 context reviewer pi-review too few loads 1", "1 context reviewer claude-review too few loads 1", "2 context worker pi-worker too few loads 1", "test loads 1", "outside 1", "bad load lines 3"]) assert.ok(result.lines.includes(line), line);
 }
 assert.ok((await measure([])).lines.includes("no load log"));
 const huge = path.join(root, "huge"); fs.writeFileSync(huge, " ".repeat(C.LOAD_LOG_CAP + 1)); await assert.rejects(measure([], none, { loadFile: huge }), e => e.code === "ERR_TOO_LARGE");
 const oversized = await cli([], none, ["--load-log", huge]); assert.equal(oversized.code, 1); assert.equal(oversized.stderr, "memory: load log too large\n");
 const file = jsonl("valid", []); assert.ok(file);
 }));
// req: R-3316
await check("commands stay private and Claude options stay isolated", () => fixture(2, async ({ root, roots, names, cli, jsonl }) => {
 const candidates = [candidate(names[1], 1, "correction", "Synthetic secret claim"), candidate(names[2], 2, "correction", "Synthetic private reply")];
 const refused = await cli(candidates, none, [], path.join(roots.repoRoot, "out")); assert.equal(refused.code, 1); assert.equal(refused.stderr.trim(), PRIVATE_REFUSAL);
 let calls = 0; const labels = await cli(candidates, () => { calls++; }, ["--labels", "synthetic"]); assert.equal(labels.code, 1); assert.equal(calls, 0);
 for (const malformed of [["{torn"], [{ evidence: 7, kind: "correction", date: "2026-01-01" }], [{ evidence: "synthetic", kind: "correction" }]]) { const rejected = await cli(malformed, () => { calls++; }); assert.equal(rejected.code, 1); assert.equal(rejected.stderr, "memory: meter failed\n"); assert.equal(calls, 0); }
 const good = await cli(candidates); assert.equal(good.code, 0); const file = path.join(good.out, C.OUTPUT_FILE), before = fs.readFileSync(file, "utf8"); assert.equal((await cli(candidates, none, [], good.out)).code, 1); assert.equal(fs.readFileSync(file, "utf8"), before);
 if (process.platform !== "win32") { assert.equal(fs.statSync(file).mode & 0o777, 0o600); assert.equal(fs.statSync(good.out).mode & 0o777, 0o700); }
 const thrown = await cli(candidates, () => { throw new Error("Synthetic secret claim"); });
 for (const r of [good, thrown]) for (const secret of [...candidates.map(c => c.claim), ...candidates.map(c => c.evidence), "Synthetic private reply"]) assert.ok(!(r.stdout + r.stderr).includes(secret));
 for (const option of ["model", "effort", "budgetUsd", "timeoutMs", "maxBuffer"]) assert.throws(() => createRunner({ runner: "pi", [option]: 1 }));
 const input = { system: C.SYSTEM_PROMPT, prompt: "Synthetic stdin", schema: { type: "object" } };
 for (const [factory, model, effort, dollars, timeout, buffer] of [[meterRunner, C.JUDGE_MODEL, C.JUDGE_EFFORT, C.DOLLAR_CAP, C.TIMEOUT_MS, C.MAX_BUFFER], [createRunner, S.CLAUDE_MODEL, S.CLAUDE_EFFORT, S.DOLLAR_CAP, S.TIMEOUT_MS, S.MAX_BUFFER]]) {
  let invoked = 0; const runner = factory({ spawn: (bin, argv, opts) => {
   invoked++; assert.equal(bin, "claude"); assert.equal(opts.input, input.prompt); assert.equal(opts.cwd, os.tmpdir()); assert.equal(opts.timeout, timeout); assert.equal(opts.maxBuffer, buffer); assert.equal(opts.env.NANA_ROLE, "worker"); assert.deepEqual(opts.stdio, ["pipe", "pipe", "pipe"]);
   for (const [flag, value] of [["--model", model], ["--effort", effort], ["--max-budget-usd", String(dollars)], ["--tools", ""], ["--setting-sources", ""], ["--system-prompt", input.system]]) assert.equal(argv[argv.indexOf(flag) + 1], value);
   for (const flag of ["--strict-mcp-config", "--no-session-persistence"]) assert.ok(argv.includes(flag)); assert.ok(!argv.includes(input.prompt));
   return { status: 0, stdout: JSON.stringify({ structured_output: { matches: [] }, modelUsage: { [model]: { inputTokens: 2 } }, total_cost_usd: 0.01 }) };
  } }); assert.equal((await runner(input)).ok, true); assert.equal(invoked, 1);
 }
 const rows = jsonl("rows", [{ type: "item", ...candidates[0], repeatOf: null, relation: "new", window: 2 }, { type: "window", window: 2, warmUp: false, partial: false }]);
 const labelFile = jsonl("labels", [{ evidence: candidates[0].evidence, kind: "correction", valid: true, repeatOf: [], relation: "none" }]);
 for (const [run, argv] of [[runOutcomeScore, ["--rows", rows, "--labels", labelFile]], [runOutcomeCompare, ["--rows", rows, "--against", rows]], [runOutcomeScore, ["--rows", labelFile, "--labels", rows]], [runOutcomeCompare, ["--rows", labelFile, "--against", rows]]]) {
  let output = ""; await run(argv, { stdout: s => { output += s; }, stderr: s => { output += s; } }); for (const secret of [candidates[0].evidence, candidates[0].claim]) assert.ok(!output.includes(secret));
 }
 }, { specs: { 1: { session: "a" }, 2: { session: "b" } } }));
// req: R-3317
await check("scorer and comparison measure valid item agreement", () => fixture(0, async ({ jsonl }) => {
 const rows = [], labels = [];
 for (let i = 0; i < C.MIN_REPEATS; i++) { const evidence = `claude-code:synthetic#u${i}+seat`, earlier = `claude-code:earlier#e${i}+seat`; rows.push({ type: "item", kind: "correction", evidence, repeatOf: i === 0 ? null : earlier, relation: i === 0 ? "new" : "same", window: 2 }); labels.push({ evidence, kind: "correction", valid: true, repeatOf: [earlier, "claude-code:alternate#turn+seat"], relation: "same" }); }
 rows.push({ type: "item", kind: "correction", evidence: "claude-code:synthetic#invalid+seat", repeatOf: "claude-code:earlier#e+seat", relation: "same", window: 2 }); labels.push({ evidence: rows.at(-1).evidence, kind: "correction", valid: false, repeatOf: [], relation: "none" });
 rows.push({ type: "item", kind: "decision", evidence: "claude-code:synthetic#decision+seat", repeatOf: null, relation: "new", window: 2 }); labels.push({ evidence: rows.at(-1).evidence, kind: "decision", valid: true, repeatOf: [], relation: "none" });
 rows.push({ type: "window", window: 2, warmUp: false, partial: false });
 const invoke = async (run, argv) => { let stdout = "", stderr = ""; const code = await run(argv, { stdout: s => { stdout += s; }, stderr: s => { stderr += s; } }); return { code, stdout, stderr }; };
 const file = jsonl("rows", rows), labelled = jsonl("labels", labels); const result = await invoke(runOutcomeScore, ["--rows", file, "--labels", labelled]); assert.equal(result.code, 0);
 for (const line of ["correction kind precision 15/16 lower 0.7167", "correction repeat recall 14/15 lower 0.7018", "correction repeat precision 14/14 lower 0.7847", "correction pointer agreement 14/14 lower 0.7847", "correction unlabelled 0", "correction bar below", "decision unscored: too few repeats"]) assert.ok(result.stdout.split("\n").includes(line), line);
 for (const fileName of [file, labelled]) fs.writeFileSync(fileName, fs.readFileSync(fileName, "utf8").trimEnd().split("\n").map(line => line + " \t").join("\r\n"));
 assert.deepEqual(await invoke(runOutcomeScore, ["--rows", file, "--labels", labelled]), result);
 const missing = await invoke(runOutcomeScore, ["--rows", file, "--labels", jsonl("missing", labels.slice(1))]); assert.ok(missing.stdout.includes("correction unscored: unlabelled rows"));
 const other = rows.map(r => r.type === "item" ? { ...r, evidence: r.evidence.replace("+seat", "+alternate"), repeatOf: r.evidence.includes("#u1+") ? null : r.repeatOf } : r);
 const compared = await invoke(runOutcomeCompare, ["--rows", file, "--against", jsonl("other", other)]); assert.equal(compared.code, 0); assert.ok(compared.stdout.includes("correction repeats 15 14 agreement 14/15"));
 for (const bad of [[...labels, labels[0]], ["{torn"], [{ evidence: "synthetic", kind: "correction", valid: "true", repeatOf: [] }]]) { const r = await invoke(runOutcomeScore, ["--rows", file, "--labels", jsonl("bad", bad)]); assert.equal(r.code, 1); assert.equal(r.stderr, "memory: meter-score failed\n"); }
 const malformed = await invoke(runOutcomeCompare, ["--rows", jsonl("malformed", ["{torn"]), "--against", file]); assert.equal(malformed.code, 1); assert.equal(malformed.stderr, "memory: meter-compare failed\n");
}));
// req: R-3318
await check("seal: judge runner", () => assert.equal(C.JUDGE_RUNNER, "claude"));
// req: R-3319
await check("seal: judge model", () => assert.equal(C.JUDGE_MODEL, "claude-sonnet-5"));
// req: R-3320
await check("seal: judge effort", () => assert.equal(C.JUDGE_EFFORT, "low"));
// req: R-3321
await check("seal: dollar cap", () => assert.equal(C.DOLLAR_CAP, 0.50));
// req: R-3322
await check("seal: token cap", () => assert.equal(C.TOKEN_CAP, 1000000));
// req: R-3323
await check("seal: batch size", () => assert.equal(C.BATCH_SIZE, 20));
// req: R-3324
await check("seal: interaction sizes", () => assert.deepEqual([C.WINDOW_SIZE, C.LOOKBACK], [80, 60]));
// req: R-3325
await check("seal: claim cap", () => assert.equal(C.CLAIM_CAP, 600));
// req: R-3326
await check("seal: timeout", () => assert.equal(C.TIMEOUT_MS, 300000));
// req: R-3327
await check("seal: buffer", () => assert.equal(C.MAX_BUFFER, 67108864));
// req: R-3328
await check("seal: log cap", () => assert.equal(C.LOAD_LOG_CAP, 16777216));
// req: R-3329
await check("seal: minimum loads", () => assert.equal(C.MIN_LOADS, 10));
// req: R-3330
await check("seal: minimum repeats", () => assert.equal(C.MIN_REPEATS, 15));
// req: R-3331
await check("seal: kind precision bar", () => assert.equal(C.KIND_BAR, 0.80));
// req: R-3332
await check("seal: repeat precision bar", () => assert.equal(C.PRECISION_BAR, 0.80));
// req: R-3333
await check("seal: repeat recall bar", () => assert.equal(C.RECALL_BAR, 0.70));
// req: R-3334
await check("seal: interval and power", () => assert.deepEqual([C.CONFIDENCE, C.POWER], [0.95, 0.80]));
// req: R-3335
await check("seal: system prompt hash", () => assert.equal(crypto.createHash("sha256").update(C.SYSTEM_PROMPT).digest("hex"), "b522dbca4d472999b811304a5a8c1fa166f835e756c328c7b4c196dca048712a"));
// req: R-3336
await check("seal: output words", () => assert.deepEqual([C.OUTPUT_FILE, C.WORDS], ["outcome-meter.jsonl", { warmUp: "warm-up", partial: "partial", parallel: "parallel", pasted: "pasted", outside: "outside", unprompted: "unprompted", changed: "re-decided", unjudged: "unjudged", fewLoads: "too few loads", testLoads: "test loads", noLog: "no load log", capReached: "incomplete: spend cap reached", fewRepeats: "unscored: too few repeats", unlabelled: "unscored: unlabelled rows", windowNote: "Window rows are not a verdict.", roles: ["seat", "worker", "reviewer", "planner", "adversary"], launchers: ["pi-worker", "pi-review", "claude-review", "nana-shared-memory"], parts: ["brief", "preamble", "memory-index", "shared-memory-index", "shared-memory", "system", "prompt", "memory", "objective", "frontier", "adoption", "known bugs", "settings", "standard", "movement", "append", "shared-memory index"] }]));
