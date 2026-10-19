#!/usr/bin/env node
// Seat wrong-code pairs for lane win-path-commands that only the Windows leg can judge: the five cmd-shim
// mistakes build brief 1 lists as Windows-only (R-1612, R-1614). Written by the seat 2026-10-19; run on a
// scratch CI branch whose Windows job runs this table instead of the suite. Never merged.
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const SH = "packages/nana-setup/lib/win-shims.mjs";
const WS = "packages/nana-setup/tests/win-shims.test.mjs";
const R1612 = "Windows: cmd.exe hands a .cmd shim's bin every double-quoted argument unchanged on the PATH node and returns its exit status";
const R1614 = "Windows: a .cmd shim rewritten by its own bin runs none of the new text";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const DECLARED = [
	"(a) Windows leg only: on macOS and Linux every pair below skips with the test file's 'Windows leg only' line",
];

const PAIRS = [
	{ n: "W1", name: "dp0 set without quotes", edits: [
		one(SH, String.raw`'SET "dp0=%~dp0"',`, String.raw`'SET dp0=%~dp0',`),
	], tests: [WS], expectRed: [R1612] },
	{ n: "W2", name: "the shim runs whatever 'node' resolves to from the caller's folder", edits: [
		one(SH, String.raw`'FOR %%I IN (node.exe) DO SET "_prog=%%~$PATH:I"',`, String.raw`'SET "_prog=node"',`),
	], tests: [WS], expectRed: [R1612] },
	{ n: "W3", name: "no endLocal-goto line, so cmd.exe keeps reading a rewritten shim", edits: [
		one(SH, "`endLocal & goto #_undefined_# 2>NUL || title %COMSPEC% & \"%_prog%\"  ${target} %*`,", "`\"%_prog%\"  ${target} %*`,"),
	], tests: [WS], expectRed: [R1614] },
	{ n: "W4", name: "a % in the bin's relative path is not doubled", edits: [
		one(SH, String.raw`const batchPath = (value) => value.replaceAll("/", "\\").replaceAll("%", "%%");`, String.raw`const batchPath = (value) => value.replaceAll("/", "\\");`),
	], tests: [WS], expectRed: [R1612] },
	{ n: "W5", name: "the shim names the bin by its absolute path instead of %dp0%", edits: [
		one(SH, "const target = sameWindowsDrive(binFile, shimDir)", "const target = false"),
	], tests: [WS], expectRed: [R1612] },
];

process.exitCode = await runMutations({ lane: "win-path-commands", self: import.meta.url, tip: "f7c5db53", declared: DECLARED, pairs: PAIRS });
