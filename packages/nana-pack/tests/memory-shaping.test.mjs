/**
 * @module packages/nana-pack/tests/memory-shaping.test.mjs
 * @purpose Pin synthetic model shaping, isolation, accounting and sealed choices.
 * @inputs Synthetic fixtures and injected runners or spawn functions only.
 * @outputs Awaited PASS/FAIL lines with per-case deadlines.
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
import { displayText } from "../lib/display.mjs";
import * as M from "../lib/memory-making-config.mjs";
import * as C from "../lib/memory-shaping-config.mjs";
import { extractShaped, runShape } from "../lib/memory-shaping.mjs";
import { scoreMemory } from "../lib/memory-score.mjs";
import { claudeRunner, piRunner, createRunner } from "../../../scripts/memory-shape-runners.mjs";
import { piLaunch } from "../bin/pi-watchdog.mjs";

async function check(title, fn) {
 const abort = new AbortController();
 try {
  await Promise.race([Promise.resolve().then(fn), delay(15000, null, { signal: abort.signal }).then(() => { throw new Error("case deadline"); })]);
  console.log("PASS", title);
 } catch (error) { console.log("FAIL", title, error.message); process.exitCode = 1; }
 finally { abort.abort(); }
}
const entry = (type, uuid, content, extra = {}) => ({ type, uuid, sessionId: "synthetic", isSidechain: false, timestamp: "2026-10-01T12:00:00Z", message: { role: type, content }, ...extra });
const seat = "The sample build currently writes a separate output for every step and keeps each result in the checkout while preparing the next operation.";
const redirect = "Gather the sample outputs into a single private folder outside the checkout and make each step read the previous result before preparing its next operation.";
const choice = "Use the blue sample for the next build and keep its output private while preparing the smaller example for a later check.";
const question = "Which sample should the next build use?";
const paired = fs.readFileSync(new URL("fixtures/memory-shaping/session.jsonl", import.meta.url), "utf8").trim().split("\n").map(JSON.parse);
const usage = (tokens = 100, cost = 0.01) => ({ tokens, cost });
function fake(kinds = ["correction", "decision", "lesson", "none"], calls = []) {
 let index = 0;
 return async (input) => {
  calls.push(input);
  const units = JSON.parse(input.prompt.slice(input.prompt.indexOf("[")));
  return { ok: true, text: JSON.stringify(units.map((u) => ({ id: u.id, kind: kinds[index++ % kinds.length], claim: `Keep sample claim ${index}.` }))), usage: usage() };
 };
}
async function fixture(run) {
 const root = fs.realpathSync.native(tmpDir(path.join(os.tmpdir(), "memory-shaping-")));
 const roots = { repoRoot: path.join(root, "repo"), projectsRoot: path.join(root, "projects"), reviewsRoot: path.join(root, "reviews") };
 fs.mkdirSync(path.join(roots.repoRoot, ".git"), { recursive: true }); fs.mkdirSync(roots.projectsRoot); fs.mkdirSync(roots.reviewsRoot);
 const add = (entries = paired, name = "synthetic", eol = "\n", final = true) => {
  const dir = path.join(roots.projectsRoot, projectKey(roots.repoRoot)); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${name}.jsonl`), entries.map((e) => JSON.stringify({ ...e, sessionId: name }) + " \t").join(eol) + (final ? eol : ""));
 };
 const reviews = (titles = ["Preserve sample boundaries", "Sample fragment"]) => {
  const dir = path.join(roots.reviewsRoot, "demo-2026-10-01"); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "r1.md"), `VERDICT: SEND-BACK\n${titles.map((s) => `## MUST — ${s}`).join("\n")}`);
 };
 const cli = async (out, runModel, extra = []) => {
  let stdout = "", stderr = "";
  const code = await runShape(["--repo", roots.repoRoot, "--root", roots.projectsRoot, "--reviews", roots.reviewsRoot, "--out", out, ...extra], { runModel, stdout: (s) => { stdout += s; }, stderr: (s) => { stderr += s; } });
  return { code, stdout, stderr };
 };
 try { await run({ root, roots, add, reviews, cli }); } finally { fs.rmSync(root, { recursive: true, force: true }); }
}
const ask = () => [entry("assistant", "ask", [{ type: "tool_use", id: "call", name: "AskUserQuestion", input: { questions: [{ question: "Which sample size?" }] } }]), entry("user", "answer", [{ type: "tool_result", tool_use_id: "call", content: '"Which sample size?"="Small"' }])];
const readRecords = (out) => fs.readFileSync(path.join(out, C.OUTPUT_FILE), "utf8").trim().split("\n").filter(Boolean).map(JSON.parse);

// req: R-3251
await check("model claims retain the shared candidate shape", () => fixture(async ({ root, add, reviews, cli }) => {
 assert.equal(M.CORRECTION_CUES.test(redirect), false);
 add(); reviews(); const out = path.join(root, "output");
 const result = await cli(out, fake()); assert.equal(result.code, 0);
 const records = readRecords(out); assert.equal(records.length, 3);
 for (const [i, r] of records.entries()) {
  assert.deepEqual(Object.keys(r), M.CANDIDATE_FIELDS); assert.equal(r.trust, "low"); assert.equal(r.source, "extracted");
  assert.deepEqual(r.roles, M.ROLES[r.type]); assert.equal(r.claim, `Keep sample claim ${i + 1}.`);
 }
 assert.deepEqual(records.map((r) => [r.kind, r.quote, r.context]), [["correction", redirect, seat], ["decision", choice, question], ["lesson", "Preserve sample boundaries", ""]]);
}));
// req: R-3252
await check("kind pairing scores against independent primary and alternate labels", () => fixture(async ({ roots, add }) => {
 const entries = [entry("assistant", "substantial", seat), entry("assistant", "status", "Working."), entry("assistant", "question", question), entry("user", "one", redirect), entry("assistant", "second", seat), entry("user", "two", choice), entry("user", "three", "Blue")];
 add(entries);
 const labels = fs.readFileSync(new URL("fixtures/memory-shaping/labels.jsonl", import.meta.url), "utf8").trim().split("\n").map(JSON.parse);
 const first = await extractShaped({ ...roots, runModel: fake(["correction", "decision", "decision"]) });
 const lines = scoreMemory(first.records, labels); assert.ok(lines.includes("correction: recall 1/1")); assert.ok(lines.includes("decision: recall 2/2")); assert.ok(lines.includes("precision 3/3")); assert.ok(lines.includes("unlabelled 0"));
 const second = await extractShaped({ ...roots, runModel: fake(["decision", "decision", "decision"]) });
 assert.ok(scoreMemory(second.records, labels).includes("precision 2/3")); assert.ok(scoreMemory(second.records, labels).includes("unlabelled 0"));
 assert.ok(first.records.every((r) => !r.evidence.endsWith("+none")));
 add(ask()); let calls = 0;
 const answered = await extractShaped({ ...roots, runModel: () => { calls++; throw new Error("must not call"); } });
 assert.equal(calls, 0); assert.equal(answered.records.length, 1); assert.equal(answered.records[0].evidence, "claude-code:synthetic#answer+ask"); assert.equal(answered.records[0].kind, "decision");
}));
// req: R-3253
await check("frozen inputs skip unpairable turns and count cuts", () => fixture(async ({ root, roots, add, cli }) => {
 const longOwner = redirect.repeat(C.OWNER_CAP), longSeat = seat.repeat(C.CONTEXT_CAP);
 const entries = [entry("user", "first", "First sample turn"), entry("assistant", "tool", [{ type: "tool_use", id: "x", name: "Read", input: {} }]), entry("user", "tool-only", "Second sample turn"), entry("assistant", "seat", longSeat), entry("user", "before", longOwner), entry("user", "after", choice, { timestamp: "2026-10-01T12:00:02Z" }), ...ask().map((e) => ({ ...e, timestamp: "2026-10-01T12:00:03Z" }))];
 for (const [index, [eol, final]] of [["\n", true], ["\r\n", true], ["\n", false]].entries()) {
  add(entries, "synthetic", eol, final); const calls = [];
  const result = await cli(path.join(root, `out${index}`), fake(["correction"], calls), ["--until", "2026-10-01T12:00:01Z"]);
  assert.equal(result.code, 0); assert.equal(calls.length, 1);
  const units = JSON.parse(calls[0].prompt.slice(calls[0].prompt.indexOf("["))); assert.equal(units.length, 1);
  assert.equal(units[0].owner, longOwner.slice(0, C.OWNER_CAP)); assert.equal(units[0].context, longSeat.slice(-C.CONTEXT_CAP));
  const records = readRecords(path.join(root, `out${index}`)); assert.equal(records.length, 1);
  assert.equal(records[0].context, displayText(longSeat.slice(-C.CONTEXT_CAP).slice(-M.CLAIM_CAP), M.CLAIM_CAP));
  assert.equal(records[0].quote, displayText(longOwner, M.CLAIM_CAP));
  for (const line of ["owner turns 3", `${C.WORDS.skipped} 2`, "asks 0", "review titles 0", "cut owner 1", "cut context 1"]) assert.ok(result.stdout.includes(`${line}\n`), line);
 }
 let calls = 0; const rejected = await cli(path.join(root, "labels-out"), () => { calls++; }, ["--labels", "synthetic-labels"]);
 assert.equal(rejected.code, 1); assert.equal(rejected.stderr, "memory: shape failed\n"); assert.equal(calls, 0);
 assert.equal(fs.existsSync(path.join(roots.repoRoot, "synthetic-labels")), false);
}));
// req: R-3254
await check("batch validation is source-specific exact and fail-closed", () => fixture(async ({ root, add, reviews, cli }) => {
 const text = 'Sample text with ```json\n{"id":"u2"}\n```';
 add([entry("assistant", "seat", seat), entry("user", "a", text), entry("user", "b", redirect)]); reviews();
 const calls = [];
 const accepted = await cli(path.join(root, "valid"), async (input) => {
  calls.push(input); const units = JSON.parse(input.prompt.slice(input.prompt.indexOf("[")));
  assert.ok(units.every((u) => ("title" in u) === ("title" in units[0]))); assert.ok(!input.prompt.includes("claude-code:"));
  const owner = "owner" in units[0]; if (owner) assert.equal(units[0].owner, text);
  assert.deepEqual(input.schema.items.properties.kind.enum, owner ? ["correction", "decision", "none"] : ["lesson", "none"]);
  return { ok: true, text: "```json\n" + JSON.stringify(units.map((u, i) => ({ id: u.id, kind: owner ? "decision" : "lesson", claim: `Claim for ${i}.` }))) + "\n```", usage: usage() };
 });
 assert.equal(accepted.code, 0); assert.equal(calls.length, 2);
 const records = readRecords(path.join(root, "valid")); assert.equal(records[0].quote, displayText(text, M.CLAIM_CAP)); assert.equal(records[1].quote, redirect); assert.equal(records[0].claim, "Claim for 0."); assert.equal(records[1].claim, "Claim for 1.");
 const bad = [
  (rows) => "Private reply prose " + JSON.stringify(rows),
  (rows) => JSON.stringify(rows.slice(1)),
  (rows) => JSON.stringify([...rows, { id: "u999", kind: "none", claim: "" }]),
  (rows) => JSON.stringify(rows.map((r) => ({ ...r, id: "u1" }))),
  (rows, owner) => JSON.stringify(rows.map((r) => ({ ...r, kind: owner ? "lesson" : "decision" }))),
  (rows) => JSON.stringify(rows.map((r) => ({ ...r, claim: " \t" })))
 ];
 for (const [i, corrupt] of bad.entries()) {
  let count = 0; const result = await cli(path.join(root, `bad${i}`), async (input) => {
   count++; const units = JSON.parse(input.prompt.slice(input.prompt.indexOf("["))); const owner = "owner" in units[0];
   return { ok: true, text: corrupt(units.map((u) => ({ id: u.id, kind: owner ? "decision" : "lesson", claim: "Private claim" })), owner), usage: usage() };
  });
  assert.equal(result.code, 0); assert.equal(count, 2); assert.deepEqual(readRecords(path.join(root, `bad${i}`)), []);
  assert.ok(result.stdout.includes(`${C.WORDS.unclassified} 4\n`)); assert.ok(result.stdout.includes("tokens 200\n")); assert.equal(result.stderr, ""); assert.ok(!result.stdout.includes("Private"));
 }
}));
// req: R-3255
await check("spend cap stops calls and unknown spend stays unknown", () => fixture(async ({ root, add, cli }) => {
 add([entry("assistant", "seat", seat), ...Array.from({ length: C.BATCH_SIZE * 3 }, (_, i) => entry("user", `u${i}`, redirect))]);
 let calls = 0; const capped = await cli(path.join(root, "capped"), async () => { calls++; return { ok: false, text: "Private failed reply", usage: usage(C.TOKEN_CAP / 2) }; });
 assert.equal(calls, 2); for (const line of ["calls 2", `tokens ${C.TOKEN_CAP}`, `${C.WORDS.unsent} ${C.BATCH_SIZE}`, `${C.WORDS.unclassified} ${C.BATCH_SIZE * 2}`, C.WORDS.capReached]) assert.ok(capped.stdout.includes(`${line}\n`));
 for (const [name, unknown] of [["missing", null], ["unpriced", usage(100, 0)]]) {
  let count = 0; const result = await cli(path.join(root, name), async () => ({ ok: false, text: "", usage: ++count === 1 ? unknown : usage() }));
  assert.ok(result.stdout.includes("cost unknown\n"));
  assert.ok(result.stdout.includes(name === "missing" ? "calls with unknown usage 1\n" : "calls with unknown usage 0\n"));
  assert.ok(result.stdout.includes(name === "missing" ? "tokens >= 200\n" : "tokens 300\n"));
 }
}));
function spawnOptions(opts, prompt) {
 assert.equal(opts.input, prompt); assert.equal(opts.cwd, os.tmpdir()); assert.equal(opts.env.NANA_ROLE, "worker");
 assert.deepEqual(opts.stdio, ["pipe", "pipe", "pipe"]); assert.equal(opts.timeout, C.TIMEOUT_MS); assert.equal(opts.maxBuffer, C.MAX_BUFFER);
}
const modelInput = { system: C.SYSTEM_PROMPT, prompt: "Private synthetic stdin", schema: { type: "array" } };
const claudeReply = () => ({ structured_output: [], total_cost_usd: 0.02, modelUsage: { [C.CLAUDE_MODEL]: { inputTokens: 20, outputTokens: 10, cacheReadInputTokens: 2, cacheCreationInputTokens: 3 } } });
// req: R-3256
await check("Claude isolation and private output survive failures", () => fixture(async ({ root, roots, add, cli }) => {
 const spawn = (bin, argv, opts) => {
  assert.equal(bin, "claude"); spawnOptions(opts, modelInput.prompt); assert.ok(!argv.includes(modelInput.prompt));
  for (const [flag, value] of [["--model", C.CLAUDE_MODEL], ["--effort", C.CLAUDE_EFFORT], ["--output-format", "json"], ["--json-schema", JSON.stringify(modelInput.schema)], ["--tools", ""], ["--setting-sources", ""], ["--system-prompt", C.SYSTEM_PROMPT], ["--max-budget-usd", String(C.DOLLAR_CAP)]]) assert.equal(argv[argv.indexOf(flag) + 1], value);
  for (const flag of ["-p", "--strict-mcp-config", "--no-session-persistence"]) assert.ok(argv.includes(flag)); assert.ok(!argv.includes("--bare"));
  return { status: 0, stdout: JSON.stringify(claudeReply()) };
 };
 const result = await claudeRunner(modelInput, { spawn }); assert.equal(result.ok, true); assert.equal(result.usage.tokens, 35); assert.equal(result.usage.cost, 0.02);
 for (const reply of [{ ...claudeReply(), modelUsage: { other: {} } }, { ...claudeReply(), is_error: true }]) assert.equal((await claudeRunner(modelInput, { spawn: () => ({ status: 0, stdout: JSON.stringify(reply) }) })).ok, false);
 assert.equal((await claudeRunner(modelInput, { spawn: () => ({ status: 1, stdout: redirect }) })).ok, false);
 add(); const refused = await cli(path.join(roots.repoRoot, "private"), fake()); assert.equal(refused.code, 1); assert.equal(refused.stderr.trim(), M.PRIVATE_REFUSAL);
 const out = path.join(root, "private"); fs.mkdirSync(out); fs.writeFileSync(path.join(out, M.CANDIDATES_FILE), "Synthetic previous bytes\n");
 const good = await cli(out, fake()); assert.equal(good.code, 0);
 assert.equal(fs.readFileSync(path.join(out, M.CANDIDATES_FILE), "utf8"), "Synthetic previous bytes\n"); assert.deepEqual(fs.readdirSync(out).sort(), [M.CANDIDATES_FILE, C.OUTPUT_FILE].sort());
 if (process.platform !== "win32") { assert.equal(fs.statSync(out).mode & 0o777, 0o700); assert.equal(fs.statSync(path.join(out, C.OUTPUT_FILE)).mode & 0o777, 0o600); }
 assert.equal((await cli(out, fake())).code, 1);
 const thrown = await cli(path.join(root, "throws"), () => { throw new Error(redirect); }); assert.equal(thrown.code, 0); assert.ok(thrown.stdout.includes(`${C.WORDS.unclassified} 2\n`));
 for (const output of [good.stdout, good.stderr, thrown.stdout, thrown.stderr]) for (const secret of [redirect, seat, choice, "Keep sample claim"]) assert.ok(!output.includes(secret));
}));
// req: R-3257
await check("pi isolation parses the complete large stream and runner switch", async () => {
 const stream = [JSON.stringify({ type: "message_update", padding: "s".repeat((1 << 20) + 1) }), JSON.stringify({ type: "message_end", message: { role: "assistant", content: [{ type: "text", text: "[]" }], usage: { totalTokens: 100, cost: { total: 0.03 } }, stopReason: "stop" } }), JSON.stringify({ type: "agent_settled" })];
 for (const ending of ["\n", "\r\n", ""]) {
  const spawn = (bin, argv, opts) => {
   const expected = piLaunch(["--mode", "json", "--no-session", "--no-tools", "--no-extensions", "--no-skills", "--no-prompt-templates", "--no-context-files", "--system-prompt", C.SYSTEM_PROMPT, "--model", C.PI_MODEL, "--thinking", C.PI_THINKING]);
   assert.equal(bin, expected.command); assert.deepEqual(argv, expected.args); assert.ok(!argv.includes(modelInput.prompt)); spawnOptions(opts, modelInput.prompt);
   return { status: 0, stdout: stream.join(ending || "\n") + (ending ? ` \t${ending}` : "") };
  };
  const result = await piRunner(modelInput, { spawn }); assert.equal(result.ok, true); assert.equal(result.text, "[]"); assert.deepEqual(result.usage, usage(100, 0.03));
 }
 const incomplete = await piRunner(modelInput, { spawn: () => ({ status: 0, stdout: '{"type":"agent_settled"}\n' }) }); assert.equal(incomplete.ok, false); assert.equal(incomplete.usage, null);
 for (const runner of [C.RUNNER, "pi"]) {
  let count = 0; const result = await createRunner({ runner, spawn: () => { count++; return { status: 0, stdout: runner === "pi" ? stream.join("\n") : JSON.stringify(claudeReply()) }; } })(modelInput);
  assert.equal(count, 1); assert.equal(result.ok, true); assert.equal(result.text, "[]");
 }
});

// req: R-3258
await check("seal: runner", () => assert.equal(C.RUNNER, "claude"));
// req: R-3259
await check("seal: Claude model and effort", () => assert.deepEqual([C.CLAUDE_MODEL, C.CLAUDE_EFFORT], ["claude-sonnet-5", "low"]));
// req: R-3260
await check("seal: pi model and thinking", () => assert.deepEqual([C.PI_MODEL, C.PI_THINKING], ["openai-codex/gpt-6-luna", "low"]));
// req: R-3261
await check("seal: batch size", () => assert.equal(C.BATCH_SIZE, 10));
// req: R-3262
await check("seal: run token cap", () => assert.equal(C.TOKEN_CAP, 1000000));
// req: R-3263
await check("seal: Claude dollar cap", () => assert.equal(C.DOLLAR_CAP, 0.50));
// req: R-3264
await check("seal: owner cap", () => assert.equal(C.OWNER_CAP, 4000));
// req: R-3265
await check("seal: seat cap", () => assert.equal(C.CONTEXT_CAP, 2000));
// req: R-3266
await check("seal: timeout", () => assert.equal(C.TIMEOUT_MS, 300000));
// req: R-3267
await check("seal: capture buffer", () => assert.equal(C.MAX_BUFFER, 67108864));
// req: R-3268
await check("seal: system prompt hash", () => assert.equal(crypto.createHash("sha256").update(C.SYSTEM_PROMPT).digest("hex"), "ef726abb8a0d48e17c1b4a214af86c6dff52978b69e86e628b8e4d810b084c98"));
// req: R-3269
await check("seal: output file and count words", () => assert.deepEqual([C.OUTPUT_FILE, C.WORDS], ["shaped-candidates.jsonl", { unsent: "unsent", unclassified: "unclassified", skipped: "skipped", capReached: "unscored: spend cap reached" }]));
