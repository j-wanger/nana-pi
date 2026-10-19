#!/usr/bin/env node
// Seat wrong-code pairs for lane install-honest-report (install lane), written by the seat 2026-10-19 on build 1b's
// tip after the merge of main, on the shared runner. Each pair reverts one product site the lane changed to its main
// form or to the obvious wrong implementation (must-meet.md design; the builder's wrong-code tries 1-9). Run from the
// worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/install-honest-report-2026-10-19/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const ST = "packages/nana-setup/lib/steps.mjs";
const SM = "packages/nana-setup/tests/settings-merge.test.mjs";
const IN = "packages/nana-setup/tests/install.test.mjs";
const RA = "packages/nana-setup/tests/retired-artifacts.test.mjs";
const R1590 = "lock: a held lock stops install before its first write";
const R1591 = "second install prints no retired row for a skill it linked";
const R1592 = "second install reports no more skipped rows than the first";
const R1593 = "a link at a retired skill name install does not link is still reported unrecognized";
const R926 = "lock: --dry-run is not blocked by a lock";
const DRY_REPORT = "lock: --dry-run reports what it would add";
const NORMAL = "lock: a normal install leaves no lock file";
const FULL_RELEASE = "full install: no temp or lock left behind";
const R663 = "recognized Claude skill and empty flag move under dated backups";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
const LOCKED_STEPS = "else withSettingsLock(layout.claudeSettings, () => claudeSteps(true));";
const MANAGED_LINK_SKIP = "if (st.isSymbolicLink() && NEW_CLAUDE_SKILLS.some((name) => entry.relative === `.claude/skills/${name}`)) {";
const LOCK_PATH = 'path.join(path.dirname(layout.claudeSettings), ".settings.json.nana-setup.lock")';

const DECLARED = [
	"(a) every pair runs on macOS; the win32 skip of the four pi-only names in the retired step is unchanged by the lane, and the native Windows run is CI's Windows leg",
	"(b) M9 names no title: the plan's known limits say no test separates taking the lock before the first write from checking for it there and taking it at settings; it runs to show whether any check does",
	"(c) no pair for the lock's extent (held through the later steps): the plan's known limits say no test pins it",
	"(d) no pair for a crafted lock or a planted look-alike pack tree: forgery, outside the threat model",
];

const PAIRS = [
	{ n: "M1", name: "install keeps main: only the settings step takes the lock", edits: [
		one(ST, LOCKED_STEPS, "else claudeSteps(false);"),
	], tests: [SM], expectRed: [R1590] },
	{ n: "M2", name: "the retired step runs before the lock is taken", edits: [
		one(ST, "\tconst claudeSteps = (lockHeld) => {\n\t\tresults.push(...stepRetiredArtifacts(layout, o));\n", "\tresults.push(...stepRetiredArtifacts(layout, o));\n\tconst claudeSteps = (lockHeld) => {\n"),
	], tests: [SM], expectRed: [R1590] },
	{ n: "M3", name: "the dry run takes the lock too", edits: [
		one(ST, `if (o.dryRun) claudeSteps(false);\n\t${LOCKED_STEPS}`, "withSettingsLock(layout.claudeSettings, () => claudeSteps(true));"),
	], tests: [SM], expectRed: [R926], alsoRed: [DRY_REPORT] },
	{ n: "M4", name: "stepSettings takes the lock again when install already holds it", edits: [
		one(ST, "return lockHeld ? write() : withSettingsLock(layout.claudeSettings, write);", "return withSettingsLock(layout.claudeSettings, write);"),
	], tests: [SM], expectRed: [NORMAL] },
	{ n: "M5", name: "install releases its lock only when the Claude steps succeed", edits: [
		one(ST, LOCKED_STEPS, `else {\n\t\tconst lock = ${LOCK_PATH};\n\t\tfs.mkdirSync(path.dirname(lock), { recursive: true });\n\t\ttry { fs.writeFileSync(lock, JSON.stringify({ pid: process.pid, at: Date.now() }), { flag: "wx" }); } catch { withSettingsLock(layout.claudeSettings, () => {}); }\n\t\tclaudeSteps(true);\n\t\tfs.rmSync(lock, { force: true });\n\t}`),
	], tests: [SM], expectRed: [FULL_RELEASE] },
	{ n: "M6", name: "the retired step skips every link under .claude/skills/", edits: [
		one(ST, MANAGED_LINK_SKIP, 'if (st.isSymbolicLink() && entry.relative.startsWith(".claude/skills/")) {'),
	], tests: [RA], expectRed: [R1593] },
	{ n: "M7", name: "the retired step skips the managed names whatever their kind", edits: [
		one(ST, MANAGED_LINK_SKIP, "if (NEW_CLAUDE_SKILLS.some((name) => entry.relative === `.claude/skills/${name}`)) {"),
	], tests: [RA], expectRed: [R663] },
	{ n: "M8", name: "the retired step keeps main: a link at a managed name gets a retired row", edits: [
		one(ST, MANAGED_LINK_SKIP, "if (false) {"),
	], tests: [IN], expectRed: [R1591, R1592] },
	{ n: "M9", name: "install checks for the lock before its first write and takes it only at settings", edits: [
		one(ST, LOCKED_STEPS, `else {\n\t\tif (fs.existsSync(${LOCK_PATH})) withSettingsLock(layout.claudeSettings, () => {});\n\t\tclaudeSteps(false);\n\t}`),
	], tests: [SM, IN, RA], expectRed: [] },
];

process.exitCode = await runMutations({ lane: "install-honest-report", self: import.meta.url, tip: "cc2c4ed", declared: DECLARED, pairs: PAIRS });
