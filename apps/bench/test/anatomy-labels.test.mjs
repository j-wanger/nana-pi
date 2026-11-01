/**
 * @module apps/bench/test/anatomy-labels.test.mjs
 * @purpose Pin private capped anatomy labelling and resume with synthetic stores and fake runners.
 * @inputs Synthetic OS-temp contexts, injected runners and sealed configuration.
 * @outputs Awaited bounded PASS/FAIL cases and a check total; never fixture text or keys.
 * @effects disk (OS-temp fixtures), process (synthetic killed-run child)
 * @errors Assertion failures set exit code 1 without printing private values.
 */
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { tmpDir } from "./tmp-dir.mjs";
import { runAnatomy } from "../lib/anatomy.mjs";
import * as C from "../lib/anatomy-config.mjs";

const root = tmpDir(path.join(os.tmpdir(), "anatomy-labels-"));
let serial = 0, passed = 0, failed = 0;
const folder = () => { const dir = path.join(root, String(++serial)); fs.mkdirSync(dir); return dir; };
const rowsIn = (out) => fs.readFileSync(path.join(out, "labels.jsonl"), "utf8").split(/\r?\n/u).filter((s) => s.trim()).map(JSON.parse);
const manifestIn = (out) => JSON.parse(fs.readFileSync(path.join(out, "manifest.json"), "utf8"));
const context = (texts, cwd = "/synthetic/home/project-wt/alpha", branch = "feat/alpha") => ({ cwd, branch, parts: [{ name: "brief", spans: texts.map((text, i) => ({ kind: "unit", id: `private-${i}`, text, label: "lessons", heading: "private heading" })) }] });
function store(contexts, eol = "\r\n", final = false) {
 const dir = folder();
 fs.writeFileSync(path.join(dir, "contexts.jsonl"), contexts.map((c) => JSON.stringify(c) + " \t").join(eol) + (final ? eol : ""));
 return dir;
}
const many = (n, chars = 40, sentinel = "sample") => Array.from({ length: n }, (_, i) => `${sentinel} ${i} ` + "x".repeat(chars));
const good = (input, usage = { tokens: 100, cost: 0.01 }) => ({ ok: true, text: JSON.stringify({ units: JSON.parse(input.prompt).map((u) => ({ id: u.id, label: "task" })) }), usage });
const fake = (calls = [], usage) => async (input) => { calls.push(input); return good(input, usage); };
async function cli(input, out = path.join(folder(), "output"), runModel = fake(), { resume = false, caps } = {}) {
 let stdout = "", stderr = "";
 const exit = await runAnatomy(["label", "--in", input, resume ? "--resume" : "--out", out], { runModel, caps, stdout: (s) => { stdout += s; }, stderr: (s) => { stderr += s; } });
 return { exit, stdout, stderr, out };
}
async function test(title, fn) {
 let timer;
 try { await Promise.race([Promise.resolve().then(fn), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("deadline")), 30000); })]); passed++; console.log(`PASS ${title}`); }
 catch { failed++; console.log(`FAIL ${title}`); }
 finally { clearTimeout(timer); }
}
const line = (result, text) => assert.ok(result.stdout.split("\n").includes(text));

// req: R-3390
await test("R-3390: distinct blind texts are labelled once", async () => {
 for (const [eol, final] of [["\n", true], ["\r\n", true], ["\r\n", false]]) {
  const contexts = [context(["- Follow `/synthetic/home/project-wt/alpha/lib` on `feat/alpha`. \t", "a".repeat(C.OVERSIZE_UNIT_CHARS + 1), "Other task.", "Another task."]), context(["* Follow `/synthetic/home/project-wt/beta/lib` on `feat/beta`.\r\n"], "/synthetic/home/project-wt/beta", "feat/beta"), context(["Follow /synthetic/home/project-wt/gamma/lib on feat/gamma."], "/synthetic/home/project-wt/gamma", "feat/gamma")];
  const calls = [], result = await cli(store(contexts, eol, final), undefined, fake(calls));
  assert.equal(result.exit, 0); assert.equal(result.stderr, "");
  const units = calls.flatMap((c) => JSON.parse(c.prompt)); assert.equal(units.length, 3);
  assert.ok(units.every((u) => Object.keys(u).sort().join() === "id,text"));
  assert.ok(!JSON.stringify(units).includes("/synthetic/home")); assert.ok(!JSON.stringify(units).includes("feat/"));
  assert.ok(units.some((u) => u.text.includes("`<WORKTREE>/lib`")));
  assert.ok(units.every((u) => u.text.length <= C.OVERSIZE_UNIT_CHARS));
  const rows = rowsIn(result.out); assert.equal(rows.length, 3); assert.equal(new Set(rows.map((r) => r.key)).size, 3);
  for (const row of rows) { assert.match(row.key, /^[a-f0-9]{64}$/u); assert.deepEqual(Object.keys(row).sort(), ["id", "key", "label"]); assert.equal(row.label, "task"); }
 }
});
// req: R-3391
await test("R-3391: bounded batches charge unknown usage and print progress", async () => {
 const n = C.LABEL_BATCH_UNITS * (C.LABEL_PROGRESS_EVERY + 1), input = store([context(many(n, 900))]);
 const calls = [], result = await cli(input, undefined, fake(calls)); assert.equal(result.exit, 0);
 for (const call of calls) { const units = JSON.parse(call.prompt); assert.ok(units.length <= C.LABEL_BATCH_UNITS); assert.ok(units.reduce((n, u) => n + u.text.length, 0) <= C.LABEL_BATCH_CHARS); }
 assert.ok(result.stdout.split("\n").some((s) => new RegExp(`^progress calls ${C.LABEL_PROGRESS_EVERY} labelled \\d+ unclassified 0 tokens \\d+$`, "u").test(s)));
 let count = 0;
 const capped = await cli(input, undefined, async (call) => { count++; return good(call, { tokens: C.LABEL_TOKEN_CAP + 1, cost: 0.02 }); });
 assert.equal(count, 1); line(capped, "calls 1"); assert.ok(/unsent [1-9]\d*/u.test(capped.stdout));
 const expected = Math.ceil(C.LABEL_TOKEN_CAP / C.LABEL_UNKNOWN_CHARGE);
 const unknownCalls = [], unknown = await cli(store([context(many(C.LABEL_BATCH_UNITS * (expected + 1)))]), undefined, fake(unknownCalls, null));
 assert.equal(unknown.exit, 0); assert.equal(unknownCalls.length, expected); line(unknown, "tokens >= 0"); line(unknown, `charged tokens ${expected * C.LABEL_UNKNOWN_CHARGE}`); line(unknown, "cost unknown"); line(unknown, `unsent ${C.LABEL_BATCH_UNITS}`);
});
// req: R-3392
await test("R-3392: malformed batches are rejected whole", async () => {
 const corruptions = [() => "not JSON", (rows) => JSON.stringify({ units: rows.slice(1) }), (rows) => JSON.stringify({ units: [...rows, { id: "extra", label: "task" }] }), (rows) => JSON.stringify({ units: rows.map((r) => ({ ...r, id: "u1" })) }), (rows) => JSON.stringify({ units: rows.map((r) => ({ ...r, label: "invalid" })) })];
 for (const corrupt of corruptions) {
  let count = 0;
  const result = await cli(store([context(many(C.LABEL_BATCH_UNITS * 2))]), undefined, async (call) => { const reply = good(call); if (++count === 1) reply.text = corrupt(JSON.parse(reply.text).units); else reply.text = "```json\n" + reply.text + "\n```"; return reply; });
  assert.equal(result.exit, 0); assert.equal(count, 2); assert.equal(rowsIn(result.out).length, C.LABEL_BATCH_UNITS); line(result, `unclassified ${C.LABEL_BATCH_UNITS}`);
 }
});
// req: R-3393
await test("R-3393: unsafe destinations and echoed text stay private", async () => {
 const sentinel = "SYNTHETIC_PRIVATE_SENTINEL_3393", input = store([context(many(C.LABEL_BATCH_UNITS * 2, 40, sentinel))]);
 const checkout = folder(); fs.mkdirSync(path.join(checkout, ".git"));
 const occupied = folder(); fs.writeFileSync(path.join(occupied, "existing"), "old");
 const link = path.join(folder(), "link"); fs.symlinkSync(folder(), link, process.platform === "win32" ? "junction" : "dir");
 for (const [out, reason] of [[path.join(checkout, "out"), "output checkout refused"], [occupied, "output not empty"], [link, "output symlink refused"]]) {
  let calls = 0; const r = await cli(input, out, () => { calls++; }); assert.equal(r.exit, 1); assert.equal(calls, 0); assert.equal(r.stderr, `anatomy: ${reason}\n`);
 }
 for (const kind of ["good", "bad", "throw"]) {
  const r = await cli(input, undefined, async (call) => {
   if (kind === "throw") throw new Error(sentinel);
   const reply = good(call); reply.text = kind === "good" ? JSON.stringify({ ...JSON.parse(reply.text), note: sentinel }) : sentinel + reply.text; return reply;
  });
  assert.equal(r.exit, 0); assert.equal(r.stderr, ""); assert.ok(!`${r.stdout}${r.stderr}`.includes(sentinel));
  for (const file of ["manifest.json", "labels.jsonl"]) assert.ok(!fs.readFileSync(path.join(r.out, file), "utf8").includes(sentinel));
  for (const row of rowsIn(r.out)) assert.ok(!`${r.stdout}${r.stderr}`.includes(row.key));
  line(r, `model ${C.LABEL_MODEL}`); line(r, `prompt sha256 ${crypto.createHash("sha256").update(C.LABEL_SYSTEM_PROMPT).digest("hex")}`);
  if (kind === "good") assert.equal(rowsIn(r.out).length, C.LABEL_BATCH_UNITS * 2);
  if (process.platform !== "win32") { assert.equal(fs.statSync(r.out).mode & 0o777, 0o700); for (const file of ["manifest.json", "labels.jsonl"]) assert.equal(fs.statSync(path.join(r.out, file)).mode & 0o777, 0o600); }
 }
});
// req: R-3394
await test("R-3394: capped and killed runs resume only missing keys", async () => {
 const input = store([context(many(C.LABEL_BATCH_UNITS * 3))]), firstCalls = [];
 const first = await cli(input, undefined, fake(firstCalls), { caps: { tokens: 100 } }); assert.equal(first.exit, 0); assert.equal(firstCalls.length, 1);
 const before = rowsIn(first.out), calls = [], resumed = await cli(input, first.out, fake(calls), { resume: true, caps: { tokens: 1000 } });
 assert.equal(resumed.exit, 0); assert.equal(calls.length, 2); assert.equal(rowsIn(first.out).length, C.LABEL_BATCH_UNITS * 3); assert.deepEqual(rowsIn(first.out).slice(0, before.length), before);
 const sent = new Set(firstCalls.flatMap((c) => JSON.parse(c.prompt).map((u) => u.text))); assert.ok(calls.flatMap((c) => JSON.parse(c.prompt)).every((u) => !sent.has(u.text)));
 const out = path.join(folder(), "killed"), child = path.join(folder(), "kill.mjs");
 fs.writeFileSync(child, `import { runAnatomy } from ${JSON.stringify(new URL("../lib/anatomy.mjs", import.meta.url).href)}; let calls = 0; await runAnatomy(${JSON.stringify(["label", "--in", input, "--out", out])}, { stdout: () => {}, stderr: () => {}, runModel: async (input) => { if (++calls === 2) process.exit(17); return { ok: true, text: JSON.stringify({units: JSON.parse(input.prompt).map(u => ({id:u.id,label:"task"}))}), usage:{tokens:1,cost:0.01} }; } });`);
 const killed = spawnSync(process.execPath, [child], { timeout: 15000, encoding: "utf8" }); assert.equal(killed.status, 17); assert.equal(rowsIn(out).length, C.LABEL_BATCH_UNITS);
 // A complete no-newline row and a torn tail both retain a safe append boundary.
 for (const tail of ["", "\r\n{torn"]) {
  const target = path.join(folder(), "repair"); fs.cpSync(out, target, { recursive: true });
  const file = path.join(target, "labels.jsonl"); fs.writeFileSync(file, fs.readFileSync(file, "utf8").trimEnd().replaceAll("\n", " \t\r\n") + " \t" + tail);
  const after = await cli(input, target, fake(), { resume: true }); assert.equal(after.exit, 0); const rows = rowsIn(target); assert.equal(rows.length, C.LABEL_BATCH_UNITS * 3); assert.equal(new Set(rows.map((r) => r.key)).size, rows.length);
 }
});
// req: R-3395
await test("R-3395: changed model or prompt refuses resume", async () => {
 const input = store([context(["Task"])]), first = await cli(input); assert.equal(first.exit, 0);
 for (const field of ["model", "promptSha256"]) {
  const manifest = manifestIn(first.out); manifest[field] = "different"; fs.writeFileSync(path.join(first.out, "manifest.json"), JSON.stringify(manifest));
  let calls = 0; const r = await cli(input, first.out, () => { calls++; }, { resume: true }); assert.equal(r.exit, 1); assert.equal(calls, 0); assert.equal(r.stderr, "anatomy: label fingerprint mismatch\n");
  manifest[field] = field === "model" ? C.LABEL_MODEL : crypto.createHash("sha256").update(C.LABEL_SYSTEM_PROMPT).digest("hex"); fs.writeFileSync(path.join(first.out, "manifest.json"), JSON.stringify(manifest));
 }
});
// req: R-3396
await test("R-3396: consecutive failure stop resets after success", async () => {
 const input = store([context(many(C.LABEL_BATCH_UNITS * 10))]); let calls = 0;
 const r = await cli(input, undefined, async () => { calls++; return { ok: false, text: "", usage: null }; }); assert.equal(r.exit, 0); assert.equal(calls, C.LABEL_FAIL_STREAK); line(r, `unsent ${(10 - C.LABEL_FAIL_STREAK) * C.LABEL_BATCH_UNITS}`); line(r, `unclassified ${C.LABEL_FAIL_STREAK * C.LABEL_BATCH_UNITS}`);
 let resetCalls = 0;
 const reset = await cli(input, undefined, async (call) => { resetCalls++; return resetCalls === C.LABEL_FAIL_STREAK ? good(call) : { ok: false, text: "", usage: null }; });
 assert.equal(reset.exit, 0); assert.equal(resetCalls, C.LABEL_FAIL_STREAK * 2); assert.equal(rowsIn(reset.out).length, C.LABEL_BATCH_UNITS);
});
// req: R-3397
await test("R-3397: seal label model", () => assert.equal(C.LABEL_MODEL, "claude-sonnet-5"));
// req: R-3397
await test("R-3397: seal label effort", () => assert.equal(C.LABEL_EFFORT, "low"));
// req: R-3398
await test("R-3398: seal system prompt hash", () => assert.equal(crypto.createHash("sha256").update(C.LABEL_SYSTEM_PROMPT ?? "").digest("hex"), "422f2aa3ad294594735a46cb05cbaee66450cef501ee7407c2b11e327fcaad52"));
// req: R-3391
await test("R-3391: seal batch unit limit", () => assert.equal(C.LABEL_BATCH_UNITS, 40));
// req: R-3391
await test("R-3391: seal batch char limit", () => assert.equal(C.LABEL_BATCH_CHARS, 24000));
// req: R-3391
await test("R-3391: seal run token cap", () => assert.equal(C.LABEL_TOKEN_CAP, 2500000));
// req: R-3391
await test("R-3391: seal unknown usage charge", () => assert.equal(C.LABEL_UNKNOWN_CHARGE, 20000));
// req: R-3391
await test("R-3391: seal progress interval", () => assert.equal(C.LABEL_PROGRESS_EVERY, 10));
// req: R-3396
await test("R-3396: seal failure streak", () => assert.equal(C.LABEL_FAIL_STREAK, 3));
// req: R-3390
await test("R-3390: seal order seed", () => assert.equal(C.LABEL_ORDER_SEED, "anatomy-labeller-2026-11-01"));
// req: R-3394
await test("R-3394: seal label file", () => assert.equal(C.LABEL_FILE, "labels.jsonl"));
// req: R-3395
await test("R-3395: seal manifest file", () => assert.equal(C.LABEL_MANIFEST_FILE, "manifest.json"));
fs.rmSync(root, { recursive: true, force: true });
console.log(`anatomy labels: ${passed}/${passed + failed} checks passed`);
process.exitCode = failed ? 1 : 0;
