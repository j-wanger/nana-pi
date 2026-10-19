#!/usr/bin/env node
// Seat wrong-code pair for lane post-edit-win-survivors that only the Windows leg can judge: killTree's win32 branch
// runs taskkill /F /PID without /T and both fallbacks do nothing (must-meet "Verification (seat)"). Written by the seat
// 2026-10-19; run in place on a scratch CI branch. Never merged.
const PE = "packages/nana-pack/extensions/nana-post-edit.ts";
const HT = "packages/nana-pack/tests/post-edit-hardening.test.mjs";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
export const PAIRS = [
	{ n: "K1", name: "taskkill without /T, both fallbacks no-ops", edits: [
		one(PE, 'const tk = spawn("taskkill", ["/T", "/F", "/PID", String(pid)], { windowsHide: true, stdio: "ignore" });', 'const tk = spawn("taskkill", ["/F", "/PID", String(pid)], { windowsHide: true, stdio: "ignore" });'),
		one(PE, '\t\ttk.on("error", direct);\n\t\ttk.on("close", (code) => {\n\t\t\tif (code !== 0) direct();\n\t\t});', '\t\ttk.on("error", () => {});\n\t\ttk.on("close", () => {});'),
	], tests: [HT], expectRed: [
		"a: the checker is gone, not just abandoned",
		"tree: a timed-out check's process and that process's still-running child are both ended",
		"win32: with taskkill off PATH the timed-out check's shell is killed and the run settles",
		"c: an aborted turn ends the check's process and that process's still-running child",
	] },
];
