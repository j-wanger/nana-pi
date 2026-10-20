#!/usr/bin/env node
// Seat wrong-code pairs for lane install-link-race (install lane), written by the seat 2026-10-20 on f52a33fe (build 1
// 8bdd8375 plus the merge of main c203f485), on the shared runner. Each pair reverts one site of install() the lane
// changed to main's form or to the obvious wrong form (must-meet.md design; build-brief-1.md W1-W5). Run from the
// worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/install-link-race-2026-10-20/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const OV = "packages/nana-setup/tests/install-overlap.test.mjs";
const SM = "packages/nana-setup/tests/settings-merge.test.mjs";
const ST = "packages/nana-setup/lib/steps.mjs";
const R2260 = "R-2260: a second install started at the first install's PATH step exits 2 naming the held settings lock";
const R2261 = "R-2261: the first install finishes with no problem row and all four PATH rows created when a second install starts at its PATH step";
const R2262 = "R-2262: the settings lock, taken once, is present at every look of a shared memory, pi config, subagent, reviewer or PATH target";
const R2263 = "R-2263: the settings lock is gone when install starts the knowledge build";
const R926 = "lock: --dry-run is not blocked by a lock";
const R926_ROWS = "lock: --dry-run reports what it would add";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
const DRY = "\tif (o.dryRun) fileSteps(false);\n";
const LOCK = "\telse withSettingsLock(layout.claudeSettings, () => fileSteps(true));\n";
const step = (name) => `results.push(...${name}(layout, o));\n`;
// Move one file step out of the locked closure to just after the release, before the knowledge build.
const afterRelease = (name) => [one(ST, `\t\t${step(name)}`, ""), one(ST, LOCK, `${LOCK}\t${step(name)}`)];
const LATER = ["stepSharedMemory", "stepPiConfig", "stepSubagentConfig", "stepReviewerAgent", "stepPath"];

const DECLARED = [
	"(a) every pair runs on macOS; the win32 shim branch of the PATH step is CI's Windows leg and the seat's forced-win32 probe",
	"(b) no pair moves stepPiRegister or stepDesk inside the lock: the lane did not change them, and under --home pi registration spawns nothing (builder W6 survived as expected)",
	"(c) no pair for the header lines: they are documentation, read by the reviewer",
];

const PAIRS = [
	{ n: "M1", name: "main's install(): the lock ends after the settings step and the knowledge build runs before PATH", edits: [
		one(ST, LATER.map((s) => `\t\t${step(s)}`).join(""), ""),
		one(ST, `${LOCK}\t${step("stepKnowledge")}`, `${LOCK}${["stepSharedMemory", "stepPiConfig", "stepSubagentConfig", "stepReviewerAgent", "stepKnowledge", "stepPath"].map((s) => `\t${step(s)}`).join("")}`),
	], tests: [OV], expectRed: [R2260, R2261, R2262] },
	{ n: "M2", name: "the knowledge build runs inside the lock (W1)", edits: [
		one(ST, `\t\t${step("stepPath")}`, `\t\t${step("stepPath")}\t\t${step("stepKnowledge")}`),
		one(ST, `${LOCK}\t${step("stepKnowledge")}`, LOCK),
	], tests: [OV], expectRed: [R2263] },
	// R-2263 goes red here too: the first install throws EEXIST at its PATH step, which now runs before the knowledge
	// build, so the build is never started and the check's wrap never fires.
	{ n: "M3", name: "the PATH step runs after the release (W2)", edits: afterRelease("stepPath"), tests: [OV], expectRed: [R2260, R2261, R2262, R2263] },
	{ n: "M4", name: "the shared memory step runs after the release", edits: afterRelease("stepSharedMemory"), tests: [OV], expectRed: [R2262] },
	{ n: "M5", name: "the pi config step runs after the release (W4)", edits: afterRelease("stepPiConfig"), tests: [OV], expectRed: [R2262] },
	{ n: "M6", name: "the subagent config step runs after the release", edits: afterRelease("stepSubagentConfig"), tests: [OV], expectRed: [R2262] },
	{ n: "M7", name: "the reviewer agent step runs after the release", edits: afterRelease("stepReviewerAgent"), tests: [OV], expectRed: [R2262] },
	{ n: "M8", name: "two lock calls: one for the Claude steps, one for the later file steps (W5)", edits: [
		one(ST, "\t\tresults.push(...stepSettings(layout, o, settingsState, { lockHeld }));\n", "\t\tresults.push(...stepSettings(layout, o, settingsState, { lockHeld }));\n\t};\n\tconst laterSteps = () => {\n"),
		one(ST, DRY, "\tif (o.dryRun) { fileSteps(false); laterSteps(); }\n"),
		one(ST, LOCK, "\telse { withSettingsLock(layout.claudeSettings, () => fileSteps(true)); withSettingsLock(layout.claudeSettings, laterSteps); }\n"),
	], tests: [OV], expectRed: [R2262] },
	{ n: "M9", name: "the dry run takes the lock like a real run", edits: [
		one(ST, `${DRY}${LOCK}`, "\twithSettingsLock(layout.claudeSettings, () => fileSteps(!o.dryRun));\n"),
	], tests: [SM], expectRed: [R926, R926_ROWS] },
];

process.exitCode = await runMutations({ lane: "install-link-race", self: import.meta.url, tip: "f52a33fe", declared: DECLARED, pairs: PAIRS });
