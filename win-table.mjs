#!/usr/bin/env node
// Seat wrong-code pair for lane review-movement that only the Windows leg can judge: pair 13's R-2907 half
// (must-meet "Seat wrong-code pairs" item 13). pi-review passes the movement section as argv text in place of a
// file; past 32,767 characters on the command line the Windows spawn fails, so R-2907 must turn red. The edit is
// pair 13's anchor and replacement from seat-mutate.mjs at build tip 53081c82. Written by the seat 2026-10-25;
// run in place on a scratch CI branch. Never merged.
const PR = "packages/nana-pack/bin/pi-review.mjs";
const IRT = "packages/nana-pack/tests/immutable-review.test.mjs";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
export const PAIRS = [
	{ n: "13w", name: "pi-review passes the section as argv text in place of a file", edits: [
		one(PR, "      movementPrompt = join(movementFolder, MOVEMENT_FILE_NAME);\n      writeFileSync(movementPrompt, movement);\n", "      movementPrompt = movement;\n"),
	], tests: [IRT], expectRed: [
		"R-2907: a tree movement section longer than 32,767 characters reaches the pi reviewer whole",
	] },
];
