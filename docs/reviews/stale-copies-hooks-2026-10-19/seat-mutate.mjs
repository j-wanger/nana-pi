#!/usr/bin/env node
// Seat wrong-code pairs for lane stale-copies-hooks (install, hook or gate lane), written by the seat 2026-10-19 after
// build 1 (f089623a), on the shared runner. Each pair reverts one product site the lane changed to main's behaviour or
// to the obvious wrong form (must-meet.md, Design and Must-meet): the producer (bin/stale-copies.mjs), the notice
// renderer (lib/stale-copies.mjs), the shared hook judgement (lib/hook-health.mjs) and doctor's two call sites.
// Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/stale-copies-hooks-2026-10-19/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const SC = "packages/nana-setup/tests/stale-copies.test.mjs";
const WD = "packages/nana-setup/tests/win32-degrade.test.mjs";
const IN = "packages/nana-setup/tests/install.test.mjs";
const DD = "packages/nana-setup/tests/doctor-detail.test.mjs";
const BIN = "packages/nana-setup/bin/stale-copies.mjs";
const LIB = "packages/nana-setup/lib/stale-copies.mjs";
const HH = "packages/nana-setup/lib/hook-health.mjs";
const DOC = "packages/nana-setup/lib/doctor.mjs";

const R1760 = "R-1760: a missing hook link or hook settings entry puts one stale line in the adoption hook output";
const R1761 = "R-1761: the stale line names exactly the rule, skill and hook rows doctor marks failed";
const R1762 = "R-1762: the stale line names as paths to move exactly the skill paths install refuses";
const R1763 = "R-1763: moving the named paths and running the named install clears the stale line";
const R1764 = "R-1764: a current install adds no stale or unavailable line to the adoption hook output";
const R1766 = "R-1766: a linked parent is the existing path to move before install";
const R1765 = "R-1765: the adoption hook leaves every file, folder and link in the home unchanged";

const SETTINGS_LABELS = ["SessionStart objective", "SessionStart adoption", "SessionStart shared-memory", "SessionStart roster notice", "PreToolUse verifier pipe", "UserPromptSubmit knowledge pull"];
const WD_STALE = SETTINGS_LABELS.map((label) => `win32 doctor: a stale ${label} target reads ✗`);
const WD_OUTSIDE = "win32 doctor: a target that exists but resolves outside the checkout reads ✗";
const WD_DUPLICATE = "win32 doctor: a good entry beside a stale duplicate under the same event reads ✗";
const WD_MATCHER = "win32 doctor: a correctly-targeted entry under the wrong matcher reads ✗";
const WD_EVENT = "win32 doctor: a correctly-targeted entry under the wrong event reads ✗";
const WD_EXIT = "win32 doctor exits 0";
const WD_NO_FAIL = "win32 doctor prints no ✗";
const IN_EXIT = "doctor exits 1 on a missing piece";
const IN_MARK = "doctor marks the missing piece with ✗";
const DD_KNOWLEDGE = "doctor rejects missing and out-of-repo absolute knowledge-hook targets";

const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const DECLARED = [
	"(a) every pair runs on macOS: the POSIX fixtures run natively and the win32 fixtures are forced through NANA_SETUP_PLATFORM; hooks-win32-exec.test.mjs runs only on the Windows leg and is in no pair",
	"(b) no pair: the producer's settings read-error path (an unreadable settings file means no install record, so the producer prints nothing on main and on the tip), hasAdoptionInstallRecord's one-argument branch (no caller passes one argument; re-reading the file is behaviour-equivalent), the failedSkills.size guard around the dry run (a cost saving, not a behaviour), and staleNotice's codeSpan fallback for a move path holding a backtick (a crafted path, outside the threat model)",
	"(c) no pair: the label order puts hook links first, and no fixture fails a hook link together with another row, so that position is unpinned",
	"(d) M6 drops the doctor half of R-1762's 'both doctor and install' clause; no fixture holds a skill install refuses while doctor passes it (a skills folder that is itself a link would), so M6 is expected to survive",
];

const PAIRS = [
	// --- the producer, bin/stale-copies.mjs ---
	{ n: "M1", name: "producer skips hook link rows (main)", edits: [
		one(BIN, "for (const row of hookLinkRows(layout)) {", "for (const row of []) {"),
	], tests: [SC], expectRed: [R1760, R1761, R1762, R1763] },
	{ n: "M2", name: "producer skips hook settings rows (main)", edits: [
		one(BIN, "for (const row of hookSettingsRows(layout, settings, parseError)) {", "for (const row of []) {"),
	], tests: [SC], expectRed: [R1760, R1761, R1762, R1763] },
	{ n: "M3", name: "producer counts win32's skipped hook link notes as failures", edits: [
		one(BIN, "for (const row of hookLinkRows(layout)) {\n\t\tif (!row.ok && !row.skipped) labels.push(row.label);", "for (const row of hookLinkRows(layout)) {\n\t\tif (!row.ok) labels.push(row.label);"),
	], tests: [SC], expectRed: [R1761, R1763, R1764] },
	{ n: "M4", name: "producer names every doctor-failed skill as a move path, not only those install refuses", edits: [
		one(BIN, 'if (row.status === "problem" && failedSkills.has(name))', "if (failedSkills.has(name))"),
	], tests: [SC], expectRed: [R1762, R1763] },
	{ n: "M5", name: "producer names the pack source as the move path", edits: [
		one(BIN, "existingPath(path.join(layout.skillsDir, name))", "existingPath(path.join(PACK_SKILLS_DIR, name))"),
	], tests: [SC], expectRed: [R1762, R1763] },
	{ n: "M6", name: "producer names every skill install refuses, without doctor's judgement", edits: [
		one(BIN, 'row.status === "problem" && failedSkills.has(name)', 'row.status === "problem"'),
	], tests: [SC], expectRed: [R1762] },
	{ n: "M7", name: "producer runs install's skill step for real, not as a dry run", edits: [
		one(BIN, "stepSkills(layout, { dryRun: true })", "stepSkills(layout, { dryRun: false })"),
	], tests: [SC], expectRed: [R1765] },
	// --- the notice, lib/stale-copies.mjs ---
	{ n: "M8", name: "staleNotice ignores move paths (main)", edits: [
		one(LIB, "if (!movePaths.length) return", "if (movePaths) return"),
	], tests: [SC], expectRed: [R1762, R1763] },
	{ n: "M9", name: "the move line drops the install command", edits: [
		one(LIB, "out of the way, then fix it with ${install}", "out of the way"),
	], tests: [SC], expectRed: [R1760, R1762, R1763] },
	{ n: "M10", name: "the move paths break the notice over several lines", edits: [
		one(LIB, '${moves.join(", ")}', '${moves.join("\\n")}'),
	], tests: [SC], expectRed: [R1760, R1762, R1763] },
	// --- the shared judgement, lib/hook-health.mjs ---
	{ n: "M11", name: "hook link rows pass without reading the link", edits: [
		one(HH, "ok: linkOk(path.join(layout.hooksDir, h), src)", "ok: true"),
	], tests: [SC, IN], expectRed: [R1761, R1762, R1763, IN_EXIT, IN_MARK] },
	{ n: "M12", name: "win32 hook link rows are failures, not skipped notes", edits: [
		one(HH, 'ok: false, skipped: true, detail: "skipped (win32)"', 'ok: false, skipped: false, detail: "skipped (win32)"'),
	], tests: [SC, WD], expectRed: [R1763, R1764, WD_EXIT, WD_NO_FAIL] },
	{ n: "M13", name: "win32 settings rows judge presence only, not where the target resolves", edits: [
		one(HH, "const healthy = present && resolves;", "const healthy = present;"),
	], tests: [SC, WD], expectRed: [...WD_STALE, WD_OUTSIDE, WD_DUPLICATE] },
	{ n: "M14", name: "the POSIX knowledge pull row judges presence only", edits: [
		one(HH, "? knowledgeHookHealthy(settings, repoRoot)", "? hasHook(settings, w.event, w.spec, w.matcher)"),
	], tests: [SC, DD], expectRed: [DD_KNOWLEDGE] },
	// --- doctor's two call sites, lib/doctor.mjs ---
	{ n: "M15", name: "doctor maps a skipped hook link row to a failure", edits: [
		one(DOC, "add(row.skipped ? NOTE : row.ok ? OK : FAIL, row.label, row.detail)", "add(row.ok ? OK : FAIL, row.label, row.detail)"),
	], tests: [SC, WD], expectRed: [R1761, WD_EXIT, WD_NO_FAIL] },
	{ n: "M16", name: "doctor marks every hook settings row healthy", edits: [
		one(DOC, "for (const row of hookSettingsRows(layout, settings, parseError)) add(row.ok ? OK : FAIL,", "for (const row of hookSettingsRows(layout, settings, parseError)) add(OK,"),
	], tests: [SC, WD, DD], expectRed: [R1761, ...WD_STALE, WD_MATCHER, WD_EVENT, WD_OUTSIDE, WD_DUPLICATE, DD_KNOWLEDGE] },
	{ n: "M17", name: "a linked parent folder is never named; the skill paths are (build 1)", edits: [
		one(BIN, 'if (!row.detail?.startsWith("unsafe source ancestor")) return null;', "return null;"),
	], tests: [SC], expectRed: [R1766] },
	{ n: "M18", name: "a move path that does not exist is still named (build 1)", edits: [
		one(BIN, "const movePath = linkedSkillParent(row) ?? existingPath(path.join(layout.skillsDir, name));", "const movePath = linkedSkillParent(row) ?? path.join(layout.skillsDir, name);"),
	], tests: [SC], expectRed: [R1766] },
];

process.exitCode = await runMutations({ lane: "stale-copies-hooks", self: import.meta.url, tip: "f089623a", declared: DECLARED, pairs: PAIRS });
