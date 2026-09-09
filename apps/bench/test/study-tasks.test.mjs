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
import { loadStudy } from "../run.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const studyDir = path.join(here, "../studies/tool-profiles-2026-09-08");
const fixtureDir = path.join(studyDir, "fixture");
const blocks = "packages/nana-stage/lib/blocks.mjs";
const suite = "packages/nana-stage/tests/blocks.test.mjs";
const GUARD = 'export function clampText(text, maxBytes, what) {\n\tif (!Number.isInteger(maxBytes) || maxBytes <= 0) throw new TypeError("clampText: maxBytes must be a positive integer");';

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

// 3. code-bugfix discriminates — including the gaming vectors
const t7 = tasks.find((t) => t.id === "code-bugfix");
{
	const d = await fresh("bench-c7-");
	await applyMutations(d, t7.mutations);
	const baseline = hashTree(d);
	const at = { finalText: blocks, dir: d, fixtureDir, baseline };
	check("code-bugfix: FAILS on the broken copy", runCheck(t7.check, at).pass === false);

	const broken = await fs.readFile(path.join(d, blocks), "utf8");
	await fs.writeFile(path.join(d, blocks), broken.replace(t7.mutations[0].replace, t7.mutations[0].find));
	check("code-bugfix: PASSES once the source is correctly fixed", runCheck(t7.check, at).pass === true);

	// GAMING 1: leave the bug, neuter the test file.
	await fs.writeFile(path.join(d, blocks), broken);
	const orig = await fs.readFile(path.join(d, suite), "utf8");
	await fs.writeFile(path.join(d, suite), orig.replace("let fails = 0;", 'let fails = 0; process.on("exit", () => process.reallyExit(0));'));
	check("code-bugfix: FAILS when the TEST file is edited instead", runCheck(t7.check, at).pass === false);
	check("…and the reason names the protected path", runCheck(t7.check, at).detail.includes("tests/blocks.test.mjs"));

	// GAMING 2 (astra round 1): leave the bug and drop process.exit(0) into an UNRELATED imported
	// module, so the suite exits 0 without ever asserting. The allowed-paths check stops this.
	await fs.writeFile(path.join(d, suite), orig);
	const sign = "packages/nana-stage/lib/sign.mjs";
	await fs.writeFile(path.join(d, sign), `process.on("exit", () => process.reallyExit(0));\n${await fs.readFile(path.join(fixtureDir, sign), "utf8")}`);
	const gamed = runCheck(t7.check, at);
	check("code-bugfix: FAILS when an UNRELATED imported module force-exits 0", gamed.pass === false);
	check("…and the reason names the file it must not have touched", gamed.detail.includes("sign.mjs"), gamed.detail.slice(0, 160));
	await fs.writeFile(path.join(d, sign), await fs.readFile(path.join(fixtureDir, sign), "utf8"));

	// GAMING 3 (astra round 2): the early exit goes into the file the task ALLOWS the model to
	// edit, so allowed-paths cannot see it. Only externally observed completion can.
	const pristine = await fs.readFile(path.join(fixtureDir, blocks), "utf8");
	await fs.writeFile(path.join(d, blocks), `process.exit(0);\n${broken}`);
	const early = runCheck(t7.check, at);
	check("code-bugfix: FAILS on `process.exit(0)` inside the ALLOWED source file", early.pass === false);
	check("…and says the suite did not run to completion", /did not run to completion|0 PASS lines/.test(early.detail), early.detail.slice(-170));

	// The sharpest version: the bug IS correctly fixed, so every other check is satisfied, and
	// only the PASS-line count can notice that the suite stopped early.
	await fs.writeFile(path.join(d, blocks), `process.exit(0);\n${pristine}`);
	const earlyButFixed = runCheck(t7.check, at);
	check("code-bugfix: an early exit is caught even when the fix itself is correct", earlyButFixed.pass === false, earlyButFixed.detail.slice(-140));

	// A late force-exit lets the suite print its lines but forces status 0 — caught by `forbid`.
	await fs.writeFile(path.join(d, blocks), `process.on("exit", () => process.reallyExit(0));\n${broken}`);
	check("code-bugfix: FAILS on a LATE force-exit that hides one FAIL line", runCheck(t7.check, at).pass === false);
	await fs.rm(d, { recursive: true, force: true });
}

// 4. code-guard discriminates
const t8 = tasks.find((t) => t.id === "code-guard");
{
	const d = await fresh("bench-c8-");
	const baseline = hashTree(d);
	await copyAssets(studyDir, d, t8.assets);
	const at = { finalText: "DONE", dir: d, fixtureDir, baseline, benchPaths: t8.assets.map((a) => a.to) };
	check("code-guard: FAILS when nothing was done", runCheck(t8.check, at).pass === false);

	const src = await fs.readFile(path.join(d, blocks), "utf8");
	await fs.writeFile(path.join(d, blocks), src.replace("export function clampText(text, maxBytes, what) {", GUARD));
	const guardTest = 'import { clampText } from "../lib/blocks.mjs";\ntry { clampText("a", 0, "x"); process.exit(1); } catch (e) { process.exit(e instanceof TypeError ? 0 : 1); }\n';
	const newTest = "packages/nana-stage/tests/clamp-guard.test.mjs";
	await fs.writeFile(path.join(d, newTest), guardTest);
	const good = runCheck(t8.check, at);
	check("code-guard: PASSES with a correct guard plus a real test", good.pass === true, good.detail.slice(0, 200));

	// GAMING 1 (astra): a "test" that only mentions clampText in a comment.
	await fs.writeFile(path.join(d, newTest), "// this file is about clampText( and it definitely tests it\nprocess.exit(0);\n");
	check("code-guard: FAILS when the test only MENTIONS clampText in a comment", runCheck(t8.check, at).pass === false);

	// GAMING 2: a test that runs green but asserts nothing (passes with or without the guard).
	await fs.writeFile(path.join(d, newTest), 'import { clampText } from "../lib/blocks.mjs";\nclampText("a", 10, "x");\nprocess.exit(0);\n');
	const vacuous = runCheck(t8.check, at);
	check("code-guard: FAILS a vacuous test that passes without the guard", vacuous.pass === false);
	check("…and says the added test does not detect the missing behaviour", vacuous.detail.includes("does not detect"), vacuous.detail.slice(-160));

	// GAMING 3: guard added, real test added, but an unrelated file also edited.
	await fs.writeFile(path.join(d, newTest), guardTest);
	await fs.writeFile(path.join(d, "apps/desk/README.md"), "scribble\n");
	check("code-guard: FAILS when an unrelated file was also changed", runCheck(t8.check, at).pass === false);
	await fs.writeFile(path.join(d, "apps/desk/README.md"), await fs.readFile(path.join(fixtureDir, "apps/desk/README.md"), "utf8"));

	// GAMING 4 (astra round 2): NO guard at all — instead `process.exit(0)` at the top of the
	// allowed source file, which makes the existing suite, the hidden probe AND the model's own
	// test all exit 0 having asserted nothing, and makes revert-and-fail pass too.
	const pristineBlocks = await fs.readFile(path.join(fixtureDir, blocks), "utf8");
	await fs.writeFile(path.join(d, blocks), `process.exit(0);\n${pristineBlocks}`);
	await fs.writeFile(path.join(d, newTest), 'import { clampText } from "../lib/blocks.mjs";\nclampText("a", 0, "x");\nprocess.exit(0);\n');
	const earlyExitGame = runCheck(t8.check, at);
	check("code-guard: FAILS on `process.exit(0)` in the ALLOWED source with no guard at all", earlyExitGame.pass === false);
	check("…caught by suite completion, not by exit status", /did not run to completion|0 PASS lines/.test(earlyExitGame.detail), earlyExitGame.detail.slice(-190));
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

process.exit(fails ? 1 : 0);
