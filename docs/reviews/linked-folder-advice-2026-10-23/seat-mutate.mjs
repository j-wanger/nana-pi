#!/usr/bin/env node
// Seat wrong-code pairs for lane linked-folder-advice (install), written by the seat 2026-10-23 after build 1, at tip 6f75ecc1.
// They are the draft's W1 to W15 and W17 to W19 (W16 no longer exists) and the must-meet's V1, V2 and V15.
// Run from the lane worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/linked-folder-advice-2026-10-23/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const DOC = "packages/nana-setup/lib/doctor.mjs";
const STEPS = "packages/nana-setup/lib/steps.mjs";
const T_LCF = "packages/nana-setup/tests/linked-claude-folder.test.mjs";
const T_INS = "packages/nana-setup/tests/install.test.mjs";
const R_2291 = /^R-2291: /; // R-2291
const R_2292 = /^R-2292: /; // R-2292
const R_2293 = /^R-2293: /; // R-2293
const R_2294 = /^R-2294: /; // R-2294
const R_2701 = /^R-2701: /; // R-2701
const R_2702 = /^R-2702: /; // R-2702
const R_2703 = /^R-2703: /; // R-2703
const R_2704 = /^R-2704: /; // R-2704
const R_2705 = /^R-2705: /; // R-2705
const FRESH = /^install exits 0$/; // install.test.mjs's fresh install
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const FLAGS_REFUSED = "const flagsRefused = legacyFlags.length && !directoryAncestorsAreSafe(layout.claudeHome, layout.claudeHome, true);";
const SCAFF = '!legacyScaffolders.length ? "none present" : linkedFolder ? legacyByHand(legacyScaffolders, linkedFolder, layout.skillsDir) : ';
const BYHAND_TAIL = '; move ${items.join(", ")} out of the way by hand`;';
const CALL = "\t// Pre-flight: everything that can abort runs before any write.\n\trefuseUnreachableClaudeFolder(layout);\n";
const CANDIDATES = "\t\tlayout.claudeHome,\n\t\t...(win() ? [] : [layout.hooksDir]),\n\t\tlayout.rulesDir,\n\t\tpath.dirname(layout.sharedMemoryDir),\n\t\tlayout.sharedMemoryDir,\n";
const LINK_TEST = "\t\tif (!lstatSafe(folder)?.isSymbolicLink()) continue;";
const REFUSAL = 'throw new SetupError(`${folder} is a link whose target cannot be reached (${error.code ?? "unreadable"}) — move the link aside or restore its target, then re-run.\\nNothing was changed.`);';
const ITEMS = "const items = names.map((name) => codeSpan(path.join(itemRoot, name)) ?? path.join(itemRoot, name));";

const DECLARED = [
	"(plan) W1 to W15 and W17 to W19 follow the draft's pair table; V1, V2 and V15 are the must-meet's",
	"(seat) W9 makes the guard skip the dry run, the same reach as a guard in runInstall: doctor's dry run misses it",
	"(seat) W12 names R-2291 to R-2294 and R-2701, as the draft lists; W17 names install.test.mjs's fresh install (attack N-2)",
];

const PAIRS = [
	{ n: "W1", name: "the flags row keyed on linkedFolder instead of install's Claude-home test", edits: [
		one(DOC, FLAGS_REFUSED, "const flagsRefused = legacyFlags.length && linkedFolder;"),
	], tests: [T_LCF], expectRed: [R_2701] },
	{ n: "W2", name: "the scaffolders row keyed on the Claude home only", edits: [
		one(DOC, SCAFF, '!legacyScaffolders.length ? "none present" : !directoryAncestorsAreSafe(layout.claudeHome, layout.claudeHome, true) ? legacyByHand(legacyScaffolders, layout.claudeHome, layout.skillsDir) : '),
	], tests: [T_LCF], expectRed: [R_2701, R_2702] },
	{ n: "W3", name: "the by-hand text names no paths", edits: [
		one(DOC, BYHAND_TAIL, "; move them out of the way by hand`;"),
	], tests: [T_LCF], expectRed: [R_2701, R_2702] },
	{ n: "W4", name: "the by-hand text omits the linked folder", edits: [
		one(DOC, "through the linked folder ${folder}; move", "through the linked folder; move"),
	], tests: [T_LCF], expectRed: [R_2701, R_2702] },
	{ n: "W5", name: "the by-hand text still ends with run nana-setup install", edits: [
		one(DOC, BYHAND_TAIL, '; move ${items.join(", ")} out of the way by hand, then run nana-setup install`;'),
	], tests: [T_LCF], expectRed: [R_2701, R_2702] },
	{ n: "W6", name: "the linked branch checked before the count, so a ✓ legacy row gets advice", edits: [
		one(DOC, SCAFF, 'linkedFolder ? legacyByHand(legacyScaffolders, linkedFolder, layout.skillsDir) : !legacyScaffolders.length ? "none present" : '),
	], tests: [T_LCF], expectRed: [R_2702, R_2703] },
	{ n: "W7", name: "the skill loop drops !st.ok, so ✓ skill rows get the move-aside text", edits: [
		one(DOC, "\t\tconst detail = !st.ok && linkedFolder\n", "\t\tconst detail = linkedFolder\n"),
	], tests: [T_LCF], expectRed: [R_2703] },
	{ n: "W8", name: "no guard (main's install())", edits: [
		one(STEPS, CALL, "\t// Pre-flight: everything that can abort runs before any write.\n"),
	], tests: [T_LCF], expectRed: [R_2704, R_2705] },
	{ n: "W9", name: "the guard out of the dry run's reach", edits: [
		one(STEPS, CALL, "\t// Pre-flight: everything that can abort runs before any write.\n\tif (!o.dryRun) refuseUnreachableClaudeFolder(layout);\n"),
	], tests: [T_LCF], expectRed: [R_2705] },
	{ n: "W10", name: "the guard checks the Claude home only", edits: [
		one(STEPS, CANDIDATES, "\t\tlayout.claudeHome,\n"),
	], tests: [T_LCF], expectRed: [R_2704, R_2705] },
	{ n: "W11", name: "the guard checks the hooks folder on win32 too", edits: [
		one(STEPS, "\t\t...(win() ? [] : [layout.hooksDir]),\n", "\t\tlayout.hooksDir,\n"),
	], tests: [T_LCF], expectRed: [R_2704] },
	{ n: "W12", name: "the guard refuses any linked folder, reachable or not", edits: [
		one(STEPS, "\t\t\tfs.statSync(folder);\n", "\t\t\tfs.statSync(folder);\n\t\t\tthrow Object.assign(new Error(\"linked\"), { code: \"LINKED\" });\n"),
	], tests: [T_LCF], expectRed: [R_2291, R_2292, R_2293, R_2294, R_2701] },
	{ n: "W13", name: "the guard runs inside the file steps, after the settings lock", edits: [
		one(STEPS, CALL, "\t// Pre-flight: everything that can abort runs before any write.\n"),
		one(STEPS, "\tconst fileSteps = (lockHeld) => {\n", "\tconst fileSteps = (lockHeld) => {\n\t\trefuseUnreachableClaudeFolder(layout);\n"),
	], tests: [T_LCF], expectRed: [R_2704, R_2705] },
	{ n: "W14", name: "the refusal does not name the link", edits: [
		one(STEPS, "`${folder} is a link whose target cannot be reached", "`A Claude folder link's target cannot be reached"),
	], tests: [T_LCF], expectRed: [R_2704] },
	{ n: "W15", name: "the refusal names the link on its second line only", edits: [
		one(STEPS, REFUSAL, 'throw new SetupError(`A Claude folder link\'s target cannot be reached (${error.code ?? "unreadable"}).\\n${folder} — move the link aside or restore its target, then re-run.\\nNothing was changed.`);'),
	], tests: [T_LCF], expectRed: [R_2704] },
	{ n: "W17", name: "the guard refuses a missing folder, not only a link", edits: [
		one(STEPS, LINK_TEST, "\t\tif (lstatSafe(folder) && !lstatSafe(folder).isSymbolicLink()) continue;"),
	], tests: [T_LCF, T_INS], expectRed: [FRESH] },
	{ n: "W18", name: "the guard skips the shared-memory folder itself", edits: [
		one(STEPS, "\t\tpath.dirname(layout.sharedMemoryDir),\n\t\tlayout.sharedMemoryDir,\n", "\t\tpath.dirname(layout.sharedMemoryDir),\n"),
	], tests: [T_LCF], expectRed: [R_2704, R_2705] },
	{ n: "W19", name: "the by-hand paths spelled through the link's target", edits: [
		one(DOC, ITEMS, "const items = names.map((name) => codeSpan(path.join(realpathSafe(itemRoot) ?? itemRoot, name)) ?? path.join(realpathSafe(itemRoot) ?? itemRoot, name));"),
	], tests: [T_LCF], expectRed: [R_2701] },
	{ n: "V1", name: "the by-hand row names both flags whatever is present", edits: [
		one(DOC, "legacyByHand(legacyFlags, layout.claudeHome, layout.claudeHome)", 'legacyByHand(["enforce", "enforce-memory"], layout.claudeHome, layout.claudeHome)'),
	], tests: [T_LCF], expectRed: [R_2701] },
	{ n: "V2", name: "the guard also checks the skills folder", edits: [
		one(STEPS, "\t\tlayout.rulesDir,\n\t\tpath.dirname(layout.sharedMemoryDir),\n", "\t\tlayout.rulesDir,\n\t\tlayout.skillsDir,\n\t\tpath.dirname(layout.sharedMemoryDir),\n"),
	], tests: [T_LCF], expectRed: [R_2704] },
	{ n: "V15", name: "the guard skips both shared-memory folders on win32", edits: [
		one(STEPS, "\t\tpath.dirname(layout.sharedMemoryDir),\n\t\tlayout.sharedMemoryDir,\n", "\t\t...(win() ? [] : [path.dirname(layout.sharedMemoryDir), layout.sharedMemoryDir]),\n"),
	], tests: [T_LCF], expectRed: [R_2704] },
];

process.exitCode = await runMutations({ lane: "linked-folder-advice", self: import.meta.url, tip: "6f75ecc1", declared: DECLARED, pairs: PAIRS });
