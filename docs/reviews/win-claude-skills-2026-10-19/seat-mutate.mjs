#!/usr/bin/env node
// Seat wrong-code pairs for lane win-claude-skills (install, hook or gate lane), written by the seat 2026-10-19 on
// the build tip merged with main (942127f4), on the shared runner. One pair per product site the lane changed: each
// pair puts that site back to main's form (must-meet.md "Design"; build-brief-1.md M4, M5, M7, M8, M9) and names the
// must-meet checks it must turn red. Re-run 2026-10-19 on build 2 (fc6ac33d, build-brief-2.md): W8 puts the retired
// step's marked-copy branch back to build 1's link-only form (MUST 1, R-1904); W1 now reaches R-1902 as a named FAIL
// (MUST 2). Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/win-claude-skills-2026-10-19/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const SS = "packages/nana-setup/tests/skills-and-standards.test.mjs";
const RA = "packages/nana-setup/tests/retired-artifacts.test.mjs";
const INST = "packages/nana-setup/tests/install.test.mjs";
const SC = "packages/nana-setup/tests/stale-copies.test.mjs";
const IC = "packages/nana-setup/tests/install-check.test.mjs";
const STEPS = "packages/nana-setup/lib/steps.mjs";
const DOCTOR = "packages/nana-setup/lib/doctor.mjs";
const STALE = "packages/nana-setup/bin/stale-copies.mjs";
const NOTES = "packages/nana-setup/lib/install-check-config.mjs";

const R351 = "R-351: on win32 install mirrors every shipped file of all five Claude Code skills byte-for-byte";
const R1900 = "R-1900: on win32 doctor marks all four newly managed skill copies healthy and names the copy form";
const R938 = "R-938: on win32 doctor names every stale SKILL.md and install refreshes all five copies";
const R388 = "R-388: on win32 each overwritten SKILL.md has one regular in-folder backup and no skill-name backup entry";
const R359 = "R-359: on win32 refresh preserves every owner note and every copy marker";
const R1903 = "R-1903: on win32 doctor identifies regular files and a skill link or junction with the move-then-install fix";
const R1901 = "R-1901: forced win32 install and dry-run refuse all four owner skill directories without changing them";
const R1902 = "R-1902: forced win32 install retires the recognized spec fixture and installs the pack copy";
const R1761 = "R-1761: the stale line names exactly the rule, skill and hook rows doctor marks failed";
const R1762 = "R-1762: the stale line names as paths to move exactly the skill paths install refuses";
const R1763 = "R-1763: moving the named paths and running the named install clears the stale line";
const R1904 = "R-1904: forced win32 second install prints no retired row for four marked skill copies";
const PIN1081 = "pin R-1081: the doctor note list";
const DOCTOR_EXITS_0 = "win32: doctor exits 0 on the copy";
const DOCTOR_GREEN_AGAIN = "win32: doctor is green again";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const DECLARED = [
	"(a) every pair runs on macOS; each named check forces NANA_SETUP_PLATFORM=win32, and native junction behaviour is the Windows CI leg's",
	"(b) the README rows and linkSkill's doc comment changed with no behaviour, so they have no pair",
	"(c) W1 puts main's skip back inline, since the lane also deleted the unused skip helper",
	"(d) W1 also turns section 6's two doctor checks red: doctor now marks the four skills it skipped as missing",
	"(e) W8 names only R-1904: skills-and-standards' 'a second run changes nothing' stays green under it, because the summary still says nothing to do beside skipped rows",
];

const PAIRS = [
	{ n: "W1", name: "stepSkills skips the four newer skills on win32", edits: [
		one(STEPS, "\t\tconst source = path.join(PACK_SKILLS_DIR, name);\n\t\tif (!directoryAncestorsAreSafe(layout.claudeHome, layout.skillsDir, true))",
			"\t\tconst source = path.join(PACK_SKILLS_DIR, name);\n\t\tif (win() && NEW_CLAUDE_SKILLS.includes(name)) return { label: `skill ${name}`, status: SKIPPED, detail: \"skipped (win32)\" };\n\t\tif (!directoryAncestorsAreSafe(layout.claudeHome, layout.skillsDir, true))"),
	], tests: [SS, RA], expectRed: [R351, R1900, R938, R388, R359, R1901, R1902], alsoRed: [DOCTOR_EXITS_0, DOCTOR_GREEN_AGAIN] },
	{ n: "W2", name: "the retired step skips the four newer skills on win32", edits: [
		one(STEPS, "\tfor (const entry of retiredArtifacts(layout.base)) {\n\t\tconst root = entry.relative.startsWith(\".agents/\")",
			"\tfor (const entry of retiredArtifacts(layout.base)) {\n\t\tif (win() && NEW_CLAUDE_SKILLS.some((name) => entry.relative === `.claude/skills/${name}`)) continue;\n\t\tconst root = entry.relative.startsWith(\".agents/\")"),
	], tests: [RA], expectRed: [R1902] },
	{ n: "W3", name: "doctor's skill state drops the win32 link line", edits: [
		one(DOCTOR, "\tif (platform() === \"win32\" && st.isSymbolicLink())\n\t\treturn { ok: false, detail: `a symlink or junction is there instead of nana-setup's copy of ${source} — move it, then re-run \\`nana-setup install\\`` };\n", ""),
	], tests: [SS], expectRed: [R1903] },
	{ n: "W4", name: "doctor's skill state drops the win32 regular-file line", edits: [
		one(DOCTOR, "\tif (!st.isDirectory())\n\t\treturn { ok: false, detail: `a regular file is there instead of nana-setup's copy of ${source} — move it, then re-run \\`nana-setup install\\`` };\n", ""),
	], tests: [SS], expectRed: [R1903] },
	{ n: "W5", name: "doctor keeps the win32 note for the four newer skills", edits: [
		one(DOCTOR, "import { CLAUDE_RULES, CLAUDE_SKILLS, DESK_SERVER,", "import { CLAUDE_RULES, CLAUDE_SKILLS, NEW_CLAUDE_SKILLS, DESK_SERVER,"),
		one(DOCTOR, "\tfor (const name of CLAUDE_SKILLS) {\n\t\tconst st = skillLinkState(path.join(layout.skillsDir, name), path.join(PACK_SKILLS_DIR, name));",
			"\tfor (const name of CLAUDE_SKILLS) {\n\t\tif (win && NEW_CLAUDE_SKILLS.includes(name)) {\n\t\t\tadd(NOTE, `skill ${name}`, \"skipped (win32; pi-only)\");\n\t\t\tcontinue;\n\t\t}\n\t\tconst st = skillLinkState(path.join(layout.skillsDir, name), path.join(PACK_SKILLS_DIR, name));"),
	], tests: [SS, SC], expectRed: [R1900, R938, R1903, R1761, R1762, R1763] },
	{ n: "W6", name: "the stale-copies checker skips the four newer skills on win32", edits: [
		one(STALE, "import { resolveLayout } from \"../lib/paths.mjs\";", "import { platform, resolveLayout } from \"../lib/paths.mjs\";"),
		one(STALE, "import { CLAUDE_RULES, CLAUDE_SKILLS, PACK_SKILLS_DIR, ruleSource, stepSkills } from \"../lib/steps.mjs\";",
			"import { CLAUDE_RULES, CLAUDE_SKILLS, NEW_CLAUDE_SKILLS, PACK_SKILLS_DIR, ruleSource, stepSkills } from \"../lib/steps.mjs\";"),
		one(STALE, "\tfor (const name of CLAUDE_SKILLS) {\n\t\tif (!skillLinkState(",
			"\tfor (const name of CLAUDE_SKILLS) {\n\t\tif (platform() === \"win32\" && NEW_CLAUDE_SKILLS.includes(name)) continue;\n\t\tif (!skillLinkState("),
	], tests: [SC], expectRed: [R1761, R1762, R1763] },
	{ n: "W7", name: "the win32 doctor note list keeps the four skill labels", edits: [
		one(NOTES, "\"release status\", \"Claude Code hooks floor\"]",
			"\"release status\", \"Claude Code hooks floor\", \"skill spec\", \"skill py-lint\", \"skill py-review\", \"skill py-test\"]"),
	], tests: [IC], expectRed: [PIN1081] },
	{ n: "W8", name: "the retired step reports nana-setup's marked win32 copies of the four newer skills again", edits: [
		one(STEPS, "if (newlyManagedSkill && (st.isSymbolicLink() || (st.isDirectory() && lstatSafe(path.join(source, SKILL_COPY_MARKER))?.isFile()))) {",
			"if (newlyManagedSkill && st.isSymbolicLink()) {"),
	], tests: [INST, SS], expectRed: [R1904] },
];

process.exitCode = await runMutations({ lane: "win-claude-skills", self: import.meta.url, tip: "fc6ac33d", declared: DECLARED, pairs: PAIRS });
