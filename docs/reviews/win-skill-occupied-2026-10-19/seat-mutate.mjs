#!/usr/bin/env node
// Seat wrong-code pairs for lane win-skill-occupied (install lane), written by the seat 2026-10-19 on build 1's tip,
// on the shared runner. Each pair reverts one product site the lane changed to its main form or to the obvious wrong
// implementation (must-meet.md design; the builder's own wrong-code tries). Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/win-skill-occupied-2026-10-19/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const SS = "packages/nana-setup/tests/skills-and-standards.test.mjs";
const ST = "packages/nana-setup/lib/steps.mjs";
const DR = "packages/nana-setup/lib/doctor.mjs";
const HJ = "packages/nana-setup/lib/skill-copy-history.json";
const R1420 = "win32 occupied skill dir: install exits 1 with ✗ naming the directory and the fix";
const R1421 = "win32 occupied skill dir: the owner's folder is byte-identical after install";
const R1422 = "win32 occupied skill dir: --dry-run exits 1 and leaves the folder unchanged";
const R1423 = "win32 occupied skill dir: doctor reads ✗ — a directory instead of nana-setup's copy — with the move fix";
const R1424 = "win32 pre-marker copy: install exits 0 and refreshes a shipped older SKILL.md, LF and CRLF";
const R1425 = "win32 fresh mirror: install writes the .nana-setup-copy marker";
const R1426 = "win32: install refreshes the stale copy";
const R300 = "win32: a second run changes nothing";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
const REFUSAL = "if (lstatSafe(target)?.isDirectory() && !ownSkillCopy(target, source)) {";
const MARKER_WRITE = "const marker = writeIfChanged(path.join(target, SKILL_COPY_MARKER), SKILL_COPY_MARKER_CONTENT, o);";

const DECLARED = [
	"(a) every pair forces win32 through NANA_SETUP_PLATFORM on macOS; the native Windows run is CI's Windows leg",
	"(b) M5 and M8 name no title: no must-meet check covers them, and they run to show whether any check does; M8 is equivalent at this tip, since the pack ships only SKILL.md and its current hash (79114a0) is in the frozen list",
	"(c) no pair for the lstat-only SKILL.md guard or the marker's regular-file test: a planted link or marker is forgery, outside the threat model",
];

const PAIRS = [
	{ n: "M1", name: "linkSkill keeps main: a directory nana-setup did not make is never refused", edits: [
		one(ST, REFUSAL, "if (false) {"),
	], tests: [SS], expectRed: [R1420, R1421, R1422, R1423] },
	{ n: "M2", name: "the ownership refusal is skipped on --dry-run", edits: [
		one(ST, REFUSAL, "if (!o.dryRun && lstatSafe(target)?.isDirectory() && !ownSkillCopy(target, source)) {"),
	], tests: [SS], expectRed: [R1422] },
	{ n: "M3", name: "the marker is written before the ownership check", edits: [
		one(ST, "if (dirProblem) return dirProblem;", "if (dirProblem) return dirProblem;\n\t\twriteIfChanged(path.join(target, SKILL_COPY_MARKER), SKILL_COPY_MARKER_CONTENT, o);"),
	], tests: [SS], expectRed: [R1420, R1421, R1422, R1423] },
	{ n: "M4", name: "install never writes the marker", edits: [
		one(ST, MARKER_WRITE, ""),
		one(ST, "const all = [...results, marker];", "const all = results;"),
	], tests: [SS], expectRed: [R1425, R1426] },
	{ n: "M5", name: "the marker's status is not folded into the step's", edits: [
		one(ST, "const all = [...results, marker];", "const all = results;"),
	], tests: [SS], expectRed: [] },
	{ n: "M6", name: "the marker content carries a timestamp", edits: [
		one(ST, 'const SKILL_COPY_MARKER_CONTENT = "nana-setup wrote this skill copy\\n";', "const SKILL_COPY_MARKER_CONTENT = `nana-setup wrote this skill copy ${new Date().toISOString()}\\n`;"),
	], tests: [SS], expectRed: [R300] },
	{ n: "M7", name: "ownSkillCopy never reads the marker", edits: [
		one(ST, "if (lstatSafe(path.join(target, SKILL_COPY_MARKER))?.isFile()) return true;", ""),
	], tests: [SS], expectRed: [R1426] },
	{ n: "M8", name: "ownSkillCopy drops the byte-equal-to-pack test", edits: [
		one(ST, "files.length &&", "false &&"),
	], tests: [SS], expectRed: [] },
	{ n: "M9", name: "ownSkillCopy never consults the history list", edits: [
		one(ST, "return hash in skillCopyHistory;", "return false;"),
	], tests: [SS], expectRed: [R1424] },
	{ n: "M10", name: "the history hash is taken without reading CRLF as LF", edits: [
		one(ST, 'const text = fs.readFileSync(path.join(target, "SKILL.md"), "utf8").replace(/\\r\\n/g, "\\n");', 'const text = fs.readFileSync(path.join(target, "SKILL.md"), "utf8");'),
	], tests: [SS], expectRed: [R1424] },
	{ n: "M11", name: "the history list is missing the 0499e52 version", edits: [
		one(HJ, '"2f84208c955ce96b7a12fbfb793a4d28ed5b432bff1cdb1f3be8caedb61e8b3a": "0499e52 2026-10-16",', ""),
	], tests: [SS], expectRed: [R1424] },
	{ n: "M12", name: "doctor keeps main: no ownership check on win32", edits: [
		one(DR, "if (st.isDirectory() && !ownSkillCopy(target, source))", "if (false)"),
	], tests: [SS], expectRed: [R1423] },
];

process.exitCode = await runMutations({ lane: "win-skill-occupied", self: import.meta.url, tip: "04c14e8", declared: DECLARED, pairs: PAIRS });
