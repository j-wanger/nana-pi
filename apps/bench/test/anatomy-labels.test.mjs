/**
 * @module apps/bench/test/anatomy-labels.test.mjs
 * @purpose Pin private capped anatomy labelling, resume and read-only measurement on synthetic stores.
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
import * as M from "../lib/anatomy-measures.mjs";
import { cohensKappa, seededSample } from "../lib/catch-stats.mjs";

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
  const manifest = manifestIn(first.out); manifest[field] = field === "model" ? "claude-sonnet-5" : "different"; fs.writeFileSync(path.join(first.out, "manifest.json"), JSON.stringify(manifest));
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
await test("R-3397: seal label model", () => assert.equal(C.LABEL_MODEL, "claude-opus-5-5"));
// req: R-3397
await test("R-3397: seal label effort", () => assert.equal(C.LABEL_EFFORT, "medium"));
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
// Reader fixtures never leave OS temp; failures print only the tagged title.
const fullContext = (spans, name = "brief", extra = {}) => ({ ...context([]), id: `build-${serial}`, buildNumber: 1, pulls: [], parts: [{ name, spans }], ...extra });
const unit = (id, text, label = "lessons") => ({ kind: "unit", id, text, label });
async function invoke(args) {
 let stdout = "", stderr = "";
 const exit = await runAnatomy(args, { stdout: (s) => { stdout += s; }, stderr: (s) => { stderr += s; } });
 return { exit, stdout, stderr, value: exit === 0 ? JSON.parse(stdout) : null };
}
async function labelled(contexts, choose = () => "task") {
 const input = store(contexts), result = await cli(input); assert.equal(result.exit, 0);
 const rows = rowsIn(result.out).map((r) => ({ ...r, label: choose(r) }));
 fs.writeFileSync(path.join(result.out, C.LABEL_FILE), rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
 return { contexts, input, labels: result.out, rows };
}
function filled(rows) {
 const file = path.join(folder(), "filled.jsonl");
 fs.writeFileSync(file, rows.map((r) => JSON.stringify(r) + " \t").join("\r\n")); return file;
}
const agreeArgs = (f, a, b = a) => ["agree", "--in", f.input, "--model", f.labels, "--a", filled(a), "--b", filled(b)];
const reportArgs = (f) => ["report", "--in", f.input, "--labels", f.labels];
const sampleArgs = (f, extra = []) => ["sample", "--in", f.input, "--labels", f.labels, "--out", path.join(folder(), "sheet"), ...extra];
const countOf = (table, label) => table.find((r) => r.function === label).units;
// req: R-3399
await test("R-3399: model pairs map normalized keys and preserve rule pairs", async () => {
 const contexts = [fullContext([unit("a", "- Follow `/synthetic/home/project-wt/alpha/lib` on `feat/alpha`."), unit("b", "* **Follow** /synthetic/home/project-wt/alpha/lib on feat/alpha."), unit("other", "Separate task"), unit("big", "x".repeat(C.OVERSIZE_UNIT_CHARS + 1))]), fullContext([unit("c", "Follow /synthetic/home/project-wt/beta/lib on feat/beta.")], "brief", { cwd: "/synthetic/home/project-wt/beta", branch: "feat/beta" })];
 const f = await labelled(contexts), a = ["b", "other", "big", "c"].map((id) => ({ id, label: "task" }));
 const args = agreeArgs(f, a), r = await invoke(args); assert.equal(r.exit, 0);
 const legacy = await invoke(args.filter((_, i) => i !== 3 && i !== 4)); assert.equal(legacy.exit, 0);
 assert.deepEqual(r.value.pairs, legacy.value.pairs); assert.deepEqual(r.value.rulesConsensus, legacy.value.rulesConsensus);
 assert.equal(r.value.oversizeExcluded, 1); assert.equal(r.value.modelPairs.length, 3);
 for (const p of r.value.modelPairs) { assert.equal(p.rows, 3); assert.equal(p.distinctKeys, 2); assert.equal(p.kappa.po, 1); assert.equal(p.perFunction.find((x) => x.function === "task").count, 3); }
 assert.equal(r.value.provenance.model, C.LABEL_MODEL);
 fs.writeFileSync(path.join(f.labels, C.LABEL_FILE), f.rows.filter((r) => r.id !== "a").map(JSON.stringify).join("\n"));
 const missing = await invoke(args); assert.equal(missing.exit, 1); assert.equal(missing.stderr, "anatomy: model labels missing: 1\n");
});
// req: R-3400
await test("R-3400: weights count heavy keys once and expose disputed weight", async () => {
 const heavy = Array.from({ length: 50 }, (_, i) => unit(`h${String(i).padStart(2, "0")}`, "Heavy " + "z".repeat(100)));
 const light = Array.from({ length: 9 }, (_, i) => unit(`l${i}`, `Light ${i}`));
 const f = await labelled([fullContext([...heavy, ...light])], (r) => r.id.startsWith("h") ? "lessons" : "task");
 const a = [...heavy.slice(0, 2), ...light].map((s) => ({ id: s.id, label: "task" }));
 let r = (await invoke(agreeArgs(f, a))).value;
 assert.equal(r.modelPairs.find((p) => p.pair === "model:b").kappa.po, 9 / 11);
 const w = r.weighted["model:b"], hc = heavy[0].text.length, lc = light.reduce((n, s) => n + s.text.length, 0);
 assert.deepEqual(r.weighted["model:consensus"], w); assert.equal(w.occurrences, 9 / 59); assert.equal(w.occurrenceChars, lc / (50 * hc + lc)); assert.notEqual(w.occurrenceChars, lc / (hc + lc)); assert.notEqual(w.occurrenceChars, w.occurrences);
 const unique = a.slice(1); r = (await invoke(agreeArgs(f, unique))).value; assert.equal(r.modelPairs.find((p) => p.pair === "model:b").kappa.po, 0.9); assert.deepEqual(r.weighted["model:b"], w);
 const b = a.map((row) => ({ ...row, label: row.id.startsWith("h") ? "lessons" : row.label }));
 r = (await invoke(agreeArgs(f, a, b))).value;
 assert.deepEqual(r.consensusLeftOut, { occurrences: 50, occurrenceChars: 50 * hc }); assert.equal(r.weighted["model:consensus"].occurrences, 1); assert.equal(r.weighted["model:consensus"].occurrenceChars, 1);
 const d = r.disputed.find((row) => row.function === "task"); assert.equal(d.aVsB.occurrences, 50); assert.equal(d.aVsB.occurrenceChars, 50 * hc);
 const wrong = (await invoke(agreeArgs(f, a))).value.disputed.find((row) => row.function === "task"); assert.equal(wrong.modelVsB.occurrences, 50);
});
// req: R-3401
await test("R-3401: dual minima seeded ids and heavy boundary make blind sheets", async () => {
 const spans = Array.from({ length: 160 }, (_, i) => unit(`s${i}`, `SYNTHETIC_SAMPLE ${i}`, i < 40 ? "purpose" : i < 80 ? "task" : i < 83 ? "feedback" : "knowledge"));
 spans.push(...Array.from({ length: C.LABEL_SAMPLE_MIN }, (_, i) => unit(`min${i}`, `At sample minimum ${i}`, "tools")), ...Array.from({ length: C.LABEL_SAMPLE_MIN - 1 }, (_, i) => unit(`under${i}`, `Below sample minimum ${i}`, "lessons")), ...Array.from({ length: C.LABEL_HEAVY_MIN }, (_, i) => unit(`heavy${i}`, "SYNTHETIC_HEAVY")), ...Array.from({ length: C.LABEL_HEAVY_MIN - 1 }, (_, i) => unit(`below${i}`, "SYNTHETIC_BELOW")), unit("empty", "**"));
 const f = await labelled([fullContext(spans)], (r) => r.id.startsWith("min") ? "tools" : r.id.startsWith("under") ? "lessons" : /^s\d+$/u.test(r.id) ? Number(r.id.slice(1)) < 40 ? "task" : Number(r.id.slice(1)) < 80 ? "purpose" : Number(r.id.slice(1)) < 83 ? "constraints" : "knowledge" : "task");
 const seed = C.LABEL_ORDER_SEED, args = sampleArgs(f, ["--seed", seed, "--n", "1"]), first = await invoke(args); assert.equal(first.exit, 0);
 const readSheet = (args) => fs.readFileSync(path.join(args[args.indexOf("--out") + 1], C.SHEET_FILE), "utf8");
 const bytes = readSheet(args), rows = bytes.trim().split("\n").map(JSON.parse), byId = new Map(spans.map((s) => [s.id, s])), labels = new Map(f.rows.map((r) => [r.id, r.label]));
 for (const source of [(id) => byId.get(id).label, (id) => labels.get(id)]) for (const label of C.FUNCTIONS) {
  const available = f.rows.filter((r) => r.id !== "empty" && source(r.id) === label).length;
  assert.ok(rows.filter((r) => source(r.id) === label).length >= Math.min(C.LABEL_SAMPLE_MIN, available));
 }
 const expected = new Set(); for (const source of [(r) => byId.get(r.id).label, (r) => r.label]) for (const label of C.FUNCTIONS) for (const id of seededSample(f.rows.filter((r) => r.id !== "empty" && source(r) === label).map((r) => r.id), C.LABEL_SAMPLE_MIN, seed)) expected.add(id);
 assert.equal(rows.length, expected.size); assert.equal(first.value.units, rows.length); assert.equal(first.value.emptyNormalized, 1);
 assert.equal(new Set(rows.map((r) => M.normalize(r.text, f.contexts[0]))).size, rows.length); assert.ok(rows.every((r) => Object.keys(r).sort().join() === "id,text" && r.id !== "empty" && r.text === byId.get(r.id).text));
 const againArgs = sampleArgs(f, ["--seed", seed, "--n", "1"]); assert.equal((await invoke(againArgs)).exit, 0); assert.equal(readSheet(againArgs), bytes);
 const fillArgs = sampleArgs(f, ["--seed", seed, "--n", String(expected.size + 1)]); assert.equal((await invoke(fillArgs)).value.units, expected.size + 1);
 assert.notDeepEqual(rows.map((r) => r.id).sort(), f.rows.slice(0, rows.length).map((r) => r.id).sort());
 const ha = sampleArgs(f, ["--heavy"]); assert.equal((await invoke(ha)).value.units, 1); assert.equal(JSON.parse(readSheet(ha).trim()).text, "SYNTHETIC_HEAVY");
 fs.writeFileSync(path.join(f.labels, C.LABEL_FILE), f.rows.slice(1).map(JSON.stringify).join("\n")); assert.equal((await invoke(sampleArgs(f, ["--seed", seed]))).value.unlabelledKeys, 1);
});
// req: R-3402
await test("R-3402: model shares have occurrence and per-part distinct denominators", async () => {
 const f = await labelled([fullContext([unit("a", "Repeated task"), unit("b", "**Repeated task**"), unit("missing", "Missing label")]), fullContext([unit("c", "Repeated task")], "preamble")]);
 fs.writeFileSync(path.join(f.labels, C.LABEL_FILE), f.rows.filter((r) => r.id !== "missing").map(JSON.stringify).join("\r\n") + " \t");
 const r = await invoke(reportArgs(f)); assert.equal(r.exit, 0); const v = r.value;
 assert.equal(countOf(v.perOccurrence.counts, "task"), 3); assert.equal(countOf(v.perDistinct.counts, "task"), 1); assert.equal(countOf(v.perOccurrence.counts, "unlabelled"), 1); assert.equal(countOf(v.perOccurrence.counts, "unsorted"), 0);
 assert.equal(v.perDistinct.parts.reduce((n, p) => n + countOf(p.counts, "task"), 0), 2);
 for (const view of [v.perOccurrence, v.perDistinct]) for (const table of [view, ...view.parts]) { assert.equal(table.counts.reduce((n, r) => n + r.units, 0), table.denominator.units); assert.equal(table.counts.reduce((n, r) => n + r.chars, 0), table.denominator.chars); assert.equal(typeof table.denominator.basis, "string"); }
 assert.match(v.interpretation, /model labels.*not findings/u); assert.equal(v.provenance.model, C.LABEL_MODEL);
 const old = await invoke(["report", "--in", f.input]); assert.deepEqual(old.value, JSON.parse(JSON.stringify(M.reportContexts(f.contexts))));
 fs.writeFileSync(path.join(f.labels, C.LABEL_FILE), JSON.stringify({ ...f.rows.find((r) => r.id === "a"), id: "b" }));
 const storedRep = (await invoke(reportArgs(f))).value;
 assert.equal(storedRep.perDistinct.counts.find((r) => r.function === "task").chars, "**Repeated task**".length);
});
// req: R-3403
await test("R-3403: all report readers follow model labels and mark mixed pulls", async () => {
 const f = await labelled([fullContext([unit("a", "Model task")], "brief", { pulls: [{ class: "known-bugs", function: "lessons", chars: 7 }] })]);
 const r = (await invoke(reportArgs(f))).value;
 assert.equal(r.builds[0].functions.task.units, 1); assert.equal(r.builds[0].functions.lessons.units, 0);
 assert.equal(r.zeroSupply.find((r) => r.function === "task" && r.group === "1").zero, 0);
 assert.equal(countOf(r.parts[0].counts, "task"), 1); assert.equal(countOf(r.parts[0].counts, "lessons"), 0);
 assert.equal(r.pulls.functionProvenance, "target-rule functions; model-labelled pushed chars"); assert.equal(r.pulls.byFunction.find((r) => r.function === "task").pushedChars, "Model task".length);
 assert.ok(!Object.hasOwn((await invoke(["report", "--in", f.input])).value.pulls, "functionProvenance"));
});
// req: R-3404
await test("R-3404: context dependence short raw boundary and empty counts", async () => {
 const short = "s".repeat(C.LABEL_SHORT_CHARS - 1), exact = "e".repeat(C.LABEL_SHORT_CHARS);
 const f = await labelled([fullContext([unit("a", short), unit("b", exact), unit("empty", "**")]), fullContext([unit("c", short)], "preamble")]);
 const r = (await invoke(reportArgs(f))).value;
 assert.deepEqual(r.contextDependent.spanningParts, { keys: 1, occurrences: 2, rawChars: 2 * short.length });
 assert.deepEqual(r.contextDependent.short, { keys: 1, occurrences: 2, rawChars: 2 * short.length }); assert.equal(r.emptyNormalized, 1);
});
// req: R-3405
await test("R-3405: readers refuse damage privately without changing files", async () => {
 const sentinel = "SYNTHETIC_PRIVATE_SENTINEL_3405", f = await labelled([fullContext([unit("a", sentinel + " one"), unit("b", sentinel + " two")])]);
 const labelsFile = path.join(f.labels, C.LABEL_FILE), manifestFile = path.join(f.labels, C.LABEL_MANIFEST_FILE), original = fs.readFileSync(labelsFile), manifest = fs.readFileSync(manifestFile);
 if (process.platform !== "win32") fs.chmodSync(labelsFile, 0o644);
 const snapshot = () => fs.readdirSync(f.labels).sort().map((name) => { const file = path.join(f.labels, name), s = fs.lstatSync(file); return { name, mode: s.mode, mtime: s.mtimeMs, bytes: s.isFile() ? fs.readFileSync(file).toString("base64") : null }; });
 const runAll = async (reason = null) => {
  for (const args of [agreeArgs(f, [{ id: "a", label: "task" }, { id: "b", label: "task" }]), sampleArgs(f, ["--seed", "private"]), reportArgs(f)]) {
   const before = snapshot(), r = await invoke(args); assert.deepEqual(snapshot(), before); assert.equal(r.exit, reason ? 1 : 0);
   if (reason) assert.equal(r.stderr, `anatomy: ${reason}\n`); else assert.equal(r.value.provenance.labelsSha256, crypto.createHash("sha256").update(fs.readFileSync(labelsFile)).digest("hex"));
   assert.ok(!`${r.stdout}${r.stderr}`.includes(sentinel)); for (const row of f.rows) assert.ok(!`${r.stdout}${r.stderr}`.includes(row.key));
  }
 };
 for (const [eol, final] of [["\n", true], ["\r\n", true], ["\r\n", false]]) { fs.writeFileSync(labelsFile, f.rows.map((r) => JSON.stringify(r) + " \t").join(eol) + (final ? eol : "")); await runAll(); }
 fs.writeFileSync(labelsFile, original.toString("utf8") + " \t"); await runAll();
 const badRows = ["{torn", JSON.stringify(f.rows[0]) + "\nBAD MIDDLE\n" + JSON.stringify(f.rows[1]), [...f.rows, f.rows[0]].map(JSON.stringify).join("\n"), JSON.stringify({ ...f.rows[0], label: "bad" })];
 for (const bad of badRows) { fs.writeFileSync(labelsFile, bad); await runAll("invalid labels"); }
 for (const row of [{ ...f.rows[0], key: "0".repeat(64) }, { ...f.rows[0], id: "stale" }]) { fs.writeFileSync(labelsFile, JSON.stringify(row)); await runAll("label store mismatch"); }
 fs.writeFileSync(labelsFile, original);
 for (const field of ["contexts", "distinctUnits"]) { fs.writeFileSync(manifestFile, JSON.stringify({ ...JSON.parse(manifest), [field]: 999 })); await runAll("label store mismatch"); } fs.writeFileSync(manifestFile, manifest);
 for (const file of [labelsFile, manifestFile]) {
  const bytes = fs.readFileSync(file); fs.unlinkSync(file); await runAll("invalid labels");
  fs.mkdirSync(file); await runAll("invalid labels"); fs.rmdirSync(file);
  const target = path.join(folder(), "target"); fs.writeFileSync(target, bytes); fs.symlinkSync(target, file); await runAll("invalid labels"); fs.unlinkSync(file); fs.writeFileSync(file, bytes);
 }
 fs.writeFileSync(manifestFile, "{"); await runAll("invalid labels");
});
// req: R-3406
await test("R-3406: two sheet pairs pool every function once per key", async () => {
 const spans = Array.from({ length: 32 }, (_, i) => unit(`p${i}`, `Pooled ${i}`)), f = await labelled([fullContext(spans)]);
 const a = spans.slice(0, 8).map((s) => ({ id: s.id, label: "task" })), a2 = spans.slice(7).map((s) => ({ id: s.id, label: "task" })), b2 = a2.map((r, i) => ({ ...r, label: i === 0 || i === 1 ? "lessons" : "task" }));
 const single = await invoke(agreeArgs(f, a)); assert.ok(single.value.modelPairs.every((p) => p.rows < 30));
 const second = await invoke(agreeArgs(f, a2, b2)); assert.ok(second.value.modelPairs.every((p) => p.rows < 30));
 const r = (await invoke([...agreeArgs(f, a), "--a2", filled(a2), "--b2", filled(b2)])).value.pooled;
 assert.equal(r.overlap, 1); assert.equal(r.distinctKeys, 32); assert.equal(r.perFunction.length, C.FUNCTIONS.length + 1);
 const task = r.perFunction.find((r) => r.function === "task"); assert.equal(task.count, 32);
 const bv = spans.map((_, i) => i !== 8), mv = spans.map(() => true); assert.deepEqual(task.modelB, cohensKappa(mv, bv)); assert.deepEqual(task.modelConsensus, cohensKappa(mv.filter((_, i) => i !== 8), mv.filter((_, i) => i !== 8)));
 assert.equal(r.perFunction.find((r) => r.function === "feedback").count, 0);
});
// req: R-3401
await test("R-3401: seal label sample minimum", () => assert.equal(C.LABEL_SAMPLE_MIN, 15));
// req: R-3401
await test("R-3401: seal label heavy minimum", () => assert.equal(C.LABEL_HEAVY_MIN, 60));
// req: R-3404
await test("R-3404: seal label short chars", () => assert.equal(C.LABEL_SHORT_CHARS, 40));
fs.rmSync(root, { recursive: true, force: true });
console.log(`anatomy labels: ${passed}/${passed + failed} checks passed`);
process.exitCode = failed ? 1 : 0;
