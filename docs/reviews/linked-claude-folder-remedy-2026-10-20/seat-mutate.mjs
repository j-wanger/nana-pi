#!/usr/bin/env node
// Seat wrong-code pairs for lane linked-claude-folder-remedy (install, hook or gate lane: install's retired-artifact
// step, doctor's skill rows, and the stale-copies session-start producer), written by the seat 2026-10-20 on build 1's
// tip, on the shared runner. Each pair reverts one product site the lane changed (steps.mjs stepRetiredArtifacts and
// linkedSkillFolder, doctor.mjs diagnose's skill rows, bin/stale-copies.mjs's move path) to its main form or to the
// obvious wrong implementation (build-brief-1.md W1-W8 and W10; plan-attack.md amendments 3 and 5). G1 is W9: it plants
// a wrong form at an unchanged site, the doctor's last line, to show the R-2294 guard is not vacuous.
// Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/linked-claude-folder-remedy-2026-10-20/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const LCF = "packages/nana-setup/tests/linked-claude-folder.test.mjs";
const RA = "packages/nana-setup/tests/retired-artifacts.test.mjs";
const SAS = "packages/nana-setup/tests/skills-and-standards.test.mjs";
const SC = "packages/nana-setup/tests/stale-copies.test.mjs";
const SP = "packages/nana-setup/lib/steps.mjs";
const DR = "packages/nana-setup/lib/doctor.mjs";
const SCB = "packages/nana-setup/bin/stale-copies.mjs";
const NS = "packages/nana-setup/bin/nana-setup.mjs";

const T2290 = "R-2290: install through a linked Claude folder prints no retired row for an absent retired path or a skill link or copy install made";
const T2291 = "R-2291: through a linked Claude folder each present retired artifact is reported ✗ and left byte-for-byte untouched";
const T2292 = "R-2292: every ✗ skill row doctor prints for a linked Claude or skills folder names the folder the session-start line names, to move aside";
const T2293 = "R-2293: moving aside the folder doctor's skill rows name and running install leaves every skill row ✓";
const T2294 = "R-2294: doctor's last line lists every ✗ skill row under a linked Claude or skills folder as a fix by hand";
const RA_SOURCE = "source symlink ancestors are refused without changing their external target";
const RA_HOOK = "hook source symlink ancestor is refused without changing its external target";
const RA_HOOKS_DIR = "unsafe hooks directory is refused without removing anything";
const SAS_FIX = "doctor marks the missing skill ✗ and names the fix";
const SC_1763 = "R-1763: moving the named paths and running the named install clears the stale line";
const SC_1766 = "R-1766: a linked parent is the existing path to move before install";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

// stepRetiredArtifacts, manifest loop (tip order: lstat, managed-skill skip, source guard, provenance match).
const LSTAT = "\t\tconst st = lstatSafe(source);\n\t\tif (!st) continue;\n";
const SKIP = "\t\tif (newlyManagedSkill && (st.isSymbolicLink() || (st.isDirectory() && lstatSafe(path.join(source, SKILL_COPY_MARKER))?.isFile()))) {\n\t\t\t// stepSkills reports every link at these managed names and owns every marked win32 copy.\n\t\t\tcontinue;\n\t\t}\n";
const SKIP_LINK = "\t\tif (newlyManagedSkill && st.isSymbolicLink()) continue;\n";
const SKIP_MARKER = "\t\tif (newlyManagedSkill && st.isDirectory() && lstatSafe(path.join(source, SKILL_COPY_MARKER))?.isFile()) continue;\n";
const GUARD = "\t\tif (!directoryAncestorsAreSafe(artifactHome, path.dirname(source), true)) {\n\t\t\tout.push({ label: `retired ${entry.relative}`, status: PROBLEM, detail: `unsafe source ancestor under ${artifactHome}; source left untouched` });\n\t\t\tcontinue;\n\t\t}\n";
const MATCH = "\t\tif (!matchesRetiredArtifact(entry, st, source)) {\n";
// stepRetiredArtifacts, retired hook-link loop (tip order: lstat, guard).
const HLSTAT = "\t\tconst st = lstatSafe(link);\n\t\tif (!st) continue;\n";
const HGUARD = "\t\tif (!directoryAncestorsAreSafe(layout.claudeHome, layout.hooksDir, true)) {\n\t\t\tout.push({ label: `retired ${old} link`, status: PROBLEM, detail: `unsafe source ancestor under ${layout.claudeHome}; link left untouched` });\n\t\t\tcontinue;\n\t\t}\n";
// doctor's ✗ skill row text under a linked folder.
const SPAN = "${codeSpan(linkedFolder) ?? linkedFolder}";
const ROW_TEXT = "? `install will not add skills under the linked folder ${codeSpan(linkedFolder) ?? linkedFolder} — move it aside, then run \\`nana-setup install\\``";

const DECLARED = [
	"(a) every pair runs on macOS; home D in R-2290 forces win32 skill copies through NANA_SETUP_PLATFORM, and the native Windows run is CI's Windows leg",
	"(b) G1 edits bin/nana-setup.mjs, which the lane does not change: it is build-brief-1.md W9, a guard pair showing R-2294 can turn red",
	"(c) no pair drops linkedSkillFolder's early return: when directoryAncestorsAreSafe holds, neither the Claude home nor the skills folder is a link, so the loop returns null anyway (an equivalent edit)",
	"(d) no pair reverts bin/stale-copies.mjs to main's linkedSkillParent: the lane claims the same output (R-1762, R-1763, R-1766), and a stay-green pair is a feature this runner does not have; C1 drops the linked folder instead",
	"(e) D4 names R-2292, the nearest check: no must-meet home runs doctor over a linked folder whose skill rows are ✓, so D4 runs to show whether any check pins a ✓ row's text there",
	"(f) no pair for the header export list, the README or comments",
];

const PAIRS = [
	{ n: "S1", name: "the manifest loop's source guard runs before the lstat (main's order)", edits: [
		one(SP, GUARD + MATCH, MATCH),
		one(SP, LSTAT, GUARD + LSTAT),
	], tests: [LCF, RA], expectRed: [T2290] },
	{ n: "S2", name: "the whole managed-skill skip stays below the source guard (W1)", edits: [
		one(SP, SKIP + GUARD, GUARD + SKIP),
	], tests: [LCF, RA], expectRed: [T2290] },
	{ n: "S3", name: "the skip's link half sits above the guard and its copy-marker half below (W8)", edits: [
		one(SP, SKIP + GUARD, SKIP_LINK + GUARD + SKIP_MARKER),
	], tests: [LCF, RA], expectRed: [T2290] },
	{ n: "S4", name: "the skip's copy-marker half sits above the guard and its link half below", edits: [
		one(SP, SKIP + GUARD, SKIP_MARKER + GUARD + SKIP_LINK),
	], tests: [LCF, RA], expectRed: [T2290] },
	{ n: "S5", name: "the manifest loop drops its source guard (W7)", edits: [
		one(SP, GUARD + MATCH, MATCH),
	], tests: [LCF, RA], expectRed: [RA_SOURCE] },
	{ n: "S6", name: "the hook-link loop's guard runs before the lstat (main's order)", edits: [
		one(SP, HLSTAT + HGUARD, HGUARD + HLSTAT),
	], tests: [LCF, RA], expectRed: [T2290] },
	{ n: "S7", name: "the hook-link loop continues silently on an unsafe ancestor (W2)", edits: [
		one(SP, HGUARD, "\t\tif (!directoryAncestorsAreSafe(layout.claudeHome, layout.hooksDir, true)) continue;\n"),
	], tests: [LCF, RA], expectRed: [T2291, RA_HOOKS_DIR] },
	{ n: "S8", name: "the context-size-check row prints on an unsafe ancestor whether or not anything is there (main's form)", edits: [
		one(SP, "\tconst hookStat = lstatSafe(legacyHook);\n\tif (hookStat) {\n", "\tconst hookStat = lstatSafe(legacyHook);\n\tif (hookStat || !directoryAncestorsAreSafe(layout.claudeHome, path.dirname(legacyHook), true)) {\n"),
	], tests: [LCF, RA], expectRed: [T2290] },
	{ n: "S9", name: "the context-size-check step drops its guard (W3)", edits: [
		one(SP, "if (!hookAncestorsSafe) {", "if (false) {"),
	], tests: [LCF, RA], expectRed: [T2291, RA_HOOK] },
	{ n: "S10", name: "the context-size-check guard runs only when lstat finds a link (W10)", edits: [
		one(SP, "\tif (hookStat) {\n", "\tif (hookStat?.isSymbolicLink()) {\n"),
	], tests: [LCF, RA], expectRed: [RA_HOOK] },
	{ n: "L1", name: "linkedSkillFolder returns the Claude home with no checks (W6)", edits: [
		one(SP, "export function linkedSkillFolder(layout) {\n", "export function linkedSkillFolder(layout) {\n\treturn layout.claudeHome;\n"),
	], tests: [LCF, SAS, SC], expectRed: [T2292, T2293, SAS_FIX] },
	{ n: "L2", name: "linkedSkillFolder looks only at the Claude home, never the skills folder", edits: [
		one(SP, "for (const candidate of [layout.claudeHome, layout.skillsDir]) {", "for (const candidate of [layout.claudeHome]) {"),
	], tests: [LCF, SC], expectRed: [T2292, T2293] },
	{ n: "C1", name: "the stale-copies line drops the linked folder and names only existing skill paths", edits: [
		one(SCB, "const movePath = linkedSkillFolder(layout) ?? existingPath(path.join(layout.skillsDir, name));", "const movePath = existingPath(path.join(layout.skillsDir, name));"),
	], tests: [LCF, SC], expectRed: [T2292, T2293, SC_1763, SC_1766] },
	{ n: "D1", name: "doctor's ✗ skill rows keep the generic install text (main's row)", edits: [
		one(DR, "add(st.ok ? OK : FAIL, `skill ${name}`, detail);", "add(st.ok ? OK : FAIL, `skill ${name}`, st.detail);"),
	], tests: [LCF, SAS], expectRed: [T2292, T2293] },
	{ n: "D2", name: "doctor always names the skills folder (W4)", edits: [
		one(DR, SPAN, "${codeSpan(layout.skillsDir) ?? layout.skillsDir}"),
	], tests: [LCF, SAS], expectRed: [T2292, T2293] },
	{ n: "D3", name: "doctor keeps missing — run and appends the folder (W5)", edits: [
		one(DR, ROW_TEXT, "? `${st.detail} — " + SPAN + "`"),
	], tests: [LCF, SAS], expectRed: [T2292, T2293] },
	{ n: "D4", name: "doctor gives ✓ skill rows the move-aside text too", edits: [
		one(DR, "const detail = !st.ok && linkedFolder", "const detail = linkedFolder"),
	], tests: [LCF, SAS, SC], expectRed: [T2292] },
	{ n: "D5", name: "doctor prints the linked folder without its code span", edits: [
		one(DR, SPAN, "${linkedFolder}"),
	], tests: [LCF, SAS], expectRed: [T2292, T2293] },
	{ n: "G1", name: "the doctor's last line counts every ✗ skill row as an install repair (W9)", edits: [
		one(NS, "new Set(dryRunRows.filter((row) => row.status === \"created\" || row.status === \"updated\").map((row) => row.label))", "new Set(dryRunRows.filter((row) => row.status === \"created\" || row.status === \"updated\" || row.label.startsWith(\"skill \")).map((row) => row.label))"),
	], tests: [LCF], expectRed: [T2294] },
];

process.exitCode = await runMutations({ lane: "linked-claude-folder-remedy", self: import.meta.url, tip: "2055067e", declared: DECLARED, pairs: PAIRS });
