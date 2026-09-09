// Pre-flight for the shipped study, with no model calls: does the fixture still match its pin,
// does every mutation apply, and do the two EDIT tasks actually DISCRIMINATE — including against
// the specific ways astra showed they could be gamed?
// Run: node apps/bench/test/study-tasks.test.mjs   (exit 0 = all PASS)
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hashTree, runCheck } from "../lib/checkers.mjs";
import { applyMutations, copyAssets, materialize, verifyFixture } from "../lib/fixture.mjs";
import { loadStudy, shapedPaths } from "../run.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const studyDir = path.join(here, "../studies/tool-profiles-2026-09-08");
const fixtureDir = path.join(studyDir, "fixture");
const blocks = "packages/nana-stage/lib/blocks.mjs";
const suite = "packages/nana-stage/tests/blocks.test.mjs";
let fails = 0;
const check = (n, ok, extra = "") => {
	console.log(ok ? "PASS" : "FAIL", n, extra);
	if (!ok) fails++;
};
const fresh = async (p) => {
	const d = await fs.mkdtemp(path.join(os.tmpdir(), p));
	await materialize(fixtureDir, d);
	return d;
};
const { study, tasks } = await loadStudy(studyDir);

// 1. the pin
const v = await verifyFixture(fixtureDir, study.fixture.sha256);
check("fixture matches its pinned sha256", v.ok, v.ok ? v.sha : v.drift.join("; "));
check("a wrong pin is detected", (await verifyFixture(fixtureDir, "not-the-sha")).ok === false);

// 2. task hygiene
for (const t of tasks) {
	check(`${t.id}: has a prompt and a checker`, typeof t.prompt === "string" && t.prompt.length > 10 && !!t.check);
	check(`${t.id}: its family is served by at least one profile`, study.profiles.some((p) => !p.families || p.families.includes(t.family)));
	if (t.mutations?.length) {
		const d = await fresh("bench-mut-");
		let err = null;
		try { await applyMutations(d, t.mutations); } catch (e) { err = e.message; }
		check(`${t.id}: mutation applies exactly once`, err === null, err ?? "");
		await fs.rm(d, { recursive: true, force: true });
	}
}
check("no research task grades a bare number with `contains`", !tasks.filter((t) => t.family === "research").some((t) => t.check?.mode === "contains"));

// 3-4. THE EDIT TASKS MUST DISCRIMINATE, including against forged evidence.
// A task that lets the model edit a source file lets that file print 112 fabricated PASS lines and
// exit 0. Exit status and raw stdout counts are therefore both worthless on their own. Three layers
// answer that: the change must fall inside the declared function's line range; no ADDED line may
// introduce process/console/require constructs; and the suite runs under a trusted sentinel copied
// in from outside the fixture, which blocks exits from untrusted code and attributes every PASS
// line to the file that printed it.
const withCtx = async (task, { mutate = true, assets = false } = {}) => {
	const d = await fresh("bench-edit-");
	if (mutate && task.mutations) await applyMutations(d, task.mutations);
	const baseline = hashTree(d);
	if (assets) await copyAssets(studyDir, d, task.assets);
	const preRun = new Map();
	for (const rel of shapedPaths(task.check)) if (baseline.has(rel)) preRun.set(rel, await fs.readFile(path.join(d, rel), "utf8"));
	return { d, ctx: { finalText: blocks, dir: d, fixtureDir, baseline, preRun, benchPaths: (task.assets ?? []).map((a) => a.to) } };
};
const edit = (d, rel, fn) => fs.readFile(path.join(d, rel), "utf8").then((t) => fs.writeFile(path.join(d, rel), fn(t)));

const t7 = tasks.find((t) => t.id === "code-bugfix");
const t8 = tasks.find((t) => t.id === "code-guard");
check("code-bugfix declares the function and line range the fix must live in", t7.declaredSite?.function === "fmtNum" && Array.isArray(t7.declaredSite.lines));
check("code-guard declares its guard site too", t8.declaredSite?.function === "clampText" && Array.isArray(t8.declaredSite.lines));

// ── c7 ────────────────────────────────────────────────────────────────────────────────────────
{
	const { d, ctx } = await withCtx(t7);
	check("c7: FAILS on the broken copy", runCheck(t7.check, ctx).pass === false);
	await edit(d, blocks, (t) => t.replace("parseFloat(n.toFixed(1))", "parseFloat(n.toFixed(2))"));
	check("c7: PASSES on the honest one-line fix", runCheck(t7.check, ctx).pass === true, runCheck(t7.check, ctx).detail.slice(-120));
	await fs.rm(d, { recursive: true, force: true });
}
// The forgery matrix. Each shape must be REJECTED — and the reason matters, because "rejected for
// the wrong reason" is how a checker looks strong while grading something else.
for (const [label, mutateSrc, expect] of [
	["112 forged PASS lines + exit 0 from the ALLOWED source", (t) => `for (let i = 0; i < 112; i++) console.log("PASS forged " + i);\nprocess.exit(0);\n${t}`, /outside the declared range|did not finish|behaviour probe/],
	[
		"astra's exact forgery: bug kept, stdout/exit/prepareStackTrace tampered, all inside fmtNum",
		(t) =>
			t.replace(
				"export function fmtNum(n) {\n\tif (!Number.isFinite(n)) return String(n);\n\treturn Number.isInteger(n) ? String(n) : String(parseFloat(n.toFixed(1)));",
				'export function fmtNum(n) {\n\tconst p = process, w = p.stdout["write"].bind(p.stdout);\n\tError.prepareStackTrace = () => "";\n\tfor (let i = 0; i < 112; i++) w("PASS forged " + i + "\\n");\n\tp["exit"](0);\n\tif (!Number.isFinite(n)) return String(n);\n\treturn Number.isInteger(n) ? String(n) : String(parseFloat(n.toFixed(1)));',
			),
		/did not finish|behaviour probe/,
	],
	["a whitespace-only change that keeps the bug", (t) => t.replace("\treturn Number.isInteger(n) ? String(n) : String(parseFloat(n.toFixed(1)));", "\treturn Number.isInteger(n)\n\t\t? String(n)\n\t\t: String(parseFloat( n.toFixed( 1 ) ));"), /behaviour probe/],
	["a module that writes a forged verdict to fd 3", (t) => `import fs from "node:fs";\ntry { fs.writeSync(3, JSON.stringify({ probes: [{ name: "x", pass: true }], complete: true }) + "\\t" + "0".repeat(64) + "\\n"); } catch {}\n${t}`, /outside the declared range|behaviour probe/],
	["a correct fix PLUS an unrelated edit elsewhere in the allowed file", (t) => t.replace("parseFloat(n.toFixed(1))", "parseFloat(n.toFixed(2))").replace("export const MAX_TABLE_ROWS = 500;", "export const MAX_TABLE_ROWS = 500; // touched"), /outside the declared range/],
]) {
	const { d, ctx } = await withCtx(t7);
	await edit(d, blocks, mutateSrc);
	const r = runCheck(t7.check, ctx);
	check(`c7: REJECTS ${label}`, r.pass === false);
	check("c7: …for the right reason", expect.test(r.detail), r.detail.slice(-160));
	await fs.rm(d, { recursive: true, force: true });
}
{
	// A module that monkeypatches everything it can reach, then actually fixes the bug, must PASS:
	// the evaluator captured what it needs before importing.
	const { d, ctx } = await withCtx(t7);
	await edit(d, blocks, (t) => `import fs from "node:fs";\nfs.writeSync = () => { throw new Error("blocked"); };\nJSON.stringify = () => "{}";\n${t.replace("parseFloat(n.toFixed(1))", "parseFloat(n.toFixed(2))")}`);
	const r = runCheck(t7.check.checks.find((c) => c.type === "eval-module"), ctx);
	check("c7: a module that tampers with fs/JSON then FIXES the bug still passes the evaluator", r.pass === true, r.detail.slice(0, 130));
	await fs.rm(d, { recursive: true, force: true });
}
{
	// editing the protected test tree is still caught, and named
	const { d, ctx } = await withCtx(t7);
	await edit(d, blocks, (t) => t.replace("parseFloat(n.toFixed(1))", "parseFloat(n.toFixed(2))"));
	await edit(d, suite, (t) => t.replace('console.log(ok ? "PASS" : "FAIL", n, extra)', 'console.log("PASS", n, extra)'));
	const r = runCheck(t7.check, ctx);
	check("c7: REJECTS relabelling FAIL as PASS in the test file", r.pass === false);
	check("c7: …naming the protected path", /tests\/blocks\.test\.mjs/.test(r.detail), r.detail.slice(0, 140));
	await fs.rm(d, { recursive: true, force: true });
}

// ── c8 ────────────────────────────────────────────────────────────────────────────────────────
const GUARD = 'export function clampText(text, maxBytes, what) {\n\tif (!Number.isInteger(maxBytes) || maxBytes <= 0) throw new TypeError("clampText: maxBytes must be a positive integer");';
const NEWTEST = "packages/nana-stage/tests/clamp-guard.test.mjs";
// A perfectly ordinary node:assert test. astra's point: this is what a competent model writes, and
// the previous checker rejected it for not printing a FAIL line.
const ASSERT_TEST =
	'import assert from "node:assert/strict";\nimport { clampText } from "../lib/blocks.mjs";\n' +
	'assert.throws(() => clampText("abc", 0, "x"), TypeError);\nassert.throws(() => clampText("abc", -1, "x"), TypeError);\nassert.equal(clampText("hi", 100, "x"), "hi");\n';
{
	const { d, ctx } = await withCtx(t8, { mutate: false, assets: true });
	check("c8: FAILS when nothing was done", runCheck(t8.check, ctx).pass === false);
	await edit(d, blocks, (t) => t.replace("export function clampText(text, maxBytes, what) {", GUARD));
	await fs.writeFile(path.join(d, NEWTEST), ASSERT_TEST);
	const good = runCheck(t8.check, ctx);
	check("c8: PASSES with an honest guard and a plain node:assert test", good.pass === true, good.detail.slice(-160));
	await fs.rm(d, { recursive: true, force: true });
}
for (const [label, srcFn, testBody, expect] of [
	["a guard that throws the WRONG error class", (t) => t.replace("export function clampText(text, maxBytes, what) {", 'export function clampText(text, maxBytes, what) {\n\tif (!Number.isInteger(maxBytes) || maxBytes <= 0) throw new RangeError("bad");'), 'import assert from "node:assert/strict";\nimport { clampText } from "../lib/blocks.mjs";\nassert.throws(() => clampText("abc", 0, "x"));\n', /threw RangeError, expected TypeError/],
	["a guard that also breaks valid behaviour", (t) => t.replace("export function clampText(text, maxBytes, what) {", 'export function clampText(text, maxBytes, what) {\n\tif (!Number.isInteger(maxBytes) || maxBytes <= 0) throw new TypeError("x");\n\treturn "";'), ASSERT_TEST, /behaviour probe|PASS lines/],
	["no guard at all, plus forged PASS lines and an exit from the allowed source", (t) => `for (let i = 0; i < 112; i++) console.log("PASS forged " + i);\nprocess.exit(0);\n${t}`, 'import { clampText } from "../lib/blocks.mjs";\nclampText("a", 1, "x");\n', /outside the declared range|did not finish|behaviour probe/],
]) {
	const { d, ctx } = await withCtx(t8, { mutate: false, assets: true });
	await edit(d, blocks, srcFn);
	await fs.writeFile(path.join(d, NEWTEST), testBody);
	const r = runCheck(t8.check, ctx);
	check(`c8: REJECTS ${label}`, r.pass === false);
	check("c8: …for the right reason", expect.test(r.detail), r.detail.slice(-170));
	await fs.rm(d, { recursive: true, force: true });
}
{
	const { d, ctx } = await withCtx(t8, { mutate: false, assets: true });
	await edit(d, blocks, (t) => t.replace("export function clampText(text, maxBytes, what) {", GUARD));
	await fs.writeFile(path.join(d, NEWTEST), 'import { clampText } from "../lib/blocks.mjs";\nclampText("hi", 10, "x");\n');
	const r = runCheck(t8.check, ctx);
	check("c8: REJECTS a vacuous test that passes with or without the guard", r.pass === false);
	check("c8: …saying the test does not detect the missing behaviour", /does not detect the missing behaviour/.test(r.detail), r.detail.slice(-140));
	await fs.rm(d, { recursive: true, force: true });
}

// 5. the un-mutated fixture must be green to begin with
{
	const d = await fresh("bench-base-");
	check("pristine fixture: the suite already exits 0", runCheck({ type: "command", commands: [["node", suite]] }, { finalText: "", dir: d }).pass);
	await fs.rm(d, { recursive: true, force: true });
}

// 6. content pins in study.json still match what is on disk. Everything that decides a number
// must be pinned: the third-party extension, its lockfile, the bench sidecar AND the module the
// sidecar's accounting actually lives in.
const { createHash } = await import("node:crypto");
const pinTarget = (k) => {
	if (k === "ext:sidecar") return study.sidecarExtension;
	if (k === "ext:sidecar-lib") return study.sidecarLib;
	if (k === "trusted-evaluator") return study.evaluator;
	const [kind, profileName, idx] = k.split(":");
	const ext = study.profiles.find((p) => p.name === profileName)?.extensions?.[Number(idx)];
	return kind === "lock" ? ext?.lockfile : ext?.path;
};
for (const [k, want] of Object.entries(study.pinnedSha ?? {})) {
	const rel = pinTarget(k);
	if (!rel) {
		check(`pinnedSha ${k} names a file the study declares`, false, "no such declaration");
		continue;
	}
	const got = createHash("sha256").update(await fs.readFile(path.resolve(studyDir, rel))).digest("hex");
	check(`pinnedSha ${k} matches the file on disk`, got === want, `${got.slice(0, 12)} vs ${String(want).slice(0, 12)}`);
}
check("the sidecar's accounting module is pinned, not just the wrapper", Boolean(study.pinnedSha?.["ext:sidecar-lib"]) && Boolean(study.sidecarLib));
check("the trusted evaluator is pinned too", Boolean(study.pinnedSha?.["trusted-evaluator"]) && Boolean(study.evaluator));

process.exit(fails ? 1 : 0);
