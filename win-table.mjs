// Seat scratch table (never merged): lane win-test-limits' Windows-only wrong-code pairs 14 to 16 (must-meet
// "Seat wrong-code pairs"), all R-2884. R-2884's check runs only on win32, so only a Windows run can turn it red.
const PEH = "packages/nana-pack/tests/post-edit-hardening.test.mjs";
const R_2884 = "R-2884: with taskkill off PATH and the tree's first level starting 3 seconds late, the shell still ends and the run settles timed out";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
export const PAIRS = [
	{ n: "14", name: "the R-1701 case's timeoutMs back to TREE_DEADLINE_MS", edits: [
		one(PEH, 'run: command, timeoutMs: WIN_TREE_DEADLINE_MS }] },', 'run: command, timeoutMs: TREE_DEADLINE_MS }] },'),
	], tests: [PEH], expectRed: [R_2884] },
	{ n: "15", name: "the case's alive wait back to TREE_DEADLINE_MS", edits: [
		one(PEH,
			"return Date.now() - started < WIN_TREE_DEADLINE_MS && shellPid !== process.pid && pidAlive(shellPid) && pidAlive(levelA) && pidAlive(levelB);\n\t\t\t}, WIN_TREE_DEADLINE_MS);",
			"return Date.now() - started < TREE_DEADLINE_MS && shellPid !== process.pid && pidAlive(shellPid) && pidAlive(levelA) && pidAlive(levelB);\n\t\t\t}, TREE_DEADLINE_MS);"),
	], tests: [PEH], expectRed: [R_2884] },
	{ n: "16", name: "level A's late start removed", edits: [
		one(PEH, "writeTreeFixture(td, { lateStartMs: TREE_LATE_START_MS });", "writeTreeFixture(td);"),
	], tests: [PEH], expectRed: [R_2884] },
];
