/**
 * @module packages/nana-setup/tests/win-shims-sh.test.mjs
 * @purpose Prove the Windows PATH shim renderings preserve supported arguments, exit status, runtime lookup and self-rewrite safety.
 * @inputs lib/win-shims.mjs, the host POSIX shell or Windows Git Bash, cmd.exe and Windows PowerShell, and temporary hostile-path fixtures.
 * @outputs PASS, FAIL or named SKIP lines for the eight shim and PATH-resolution requirements.
 * @effects disk (temporary callers, briefs, bins and shims), process (spawns shells and node through rendered shims).
 * @errors each case is awaited under a timeout; a failed assertion prints FAIL and makes the process exit nonzero.
 */
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { WIN_SHIM_LINE_ENDINGS, WIN_SHIM_SUFFIXES } from "../lib/win-shims.mjs";
import { CASE_TIMEOUT_MS, createShimFixture } from "./win-shims.test.mjs";

const cases = [];
const test = (title, row, platforms, fn) => cases.push({ title, row, platforms, fn });
const { root, callerDir, brief, rendered, runShCaller, jsonResult } = createShimFixture();

// req: R-1611
test("sh shim hands node every argument unchanged and returns the bin's exit status", "R-1611", "all", () => {
	assert.deepEqual(WIN_SHIM_SUFFIXES, { sh: "", cmd: ".cmd" });
	assert.deepEqual(WIN_SHIM_LINE_ENDINGS, { sh: "\n", cmd: "\r\n" });
	assert.ok(!rendered.sh.includes("\r"));
	const briefArg = `@${process.platform === "win32" ? brief.replaceAll("/", "\\") : brief}`;
	const args = ["a space", "single'quote", 'double"quote', "% & ^ ! ( ) | < >", "trailing\\", "line one\nline two", "", briefArg];
	if (process.platform === "win32") assert.ok(args.every((arg) => !arg.includes("/")));
	const run = runShCaller(args);
	assert.ok(run, "Git Bash not found");
	assert.equal(run.status, 7, run.stderr);
	assert.deepEqual(jsonResult(run).argv, args);
	const stdinText = "first line  \r\nsecond line\t";
	const stdinFile = path.join(callerDir, "stdin fixture.txt");
	fs.writeFileSync(stdinFile, stdinText);
	const stdinRun = runShCaller(["stdin"], false, stdinFile);
	assert.ok(stdinRun, "Git Bash not found");
	assert.equal(stdinRun.status, 7, stdinRun.stderr);
	assert.equal(jsonResult(stdinRun).stdin, stdinText);
});

// req: R-1617
test("an sh shim rewritten by its own bin runs none of the new text", "R-1617", "all", () => {
	const run = runShCaller(["--rewrite"], true);
	assert.ok(run, "Git Bash not found");
	assert.equal(run.status, 7, run.stderr);
	assert.doesNotMatch(run.stdout, /NANA_REWRITE_MARKER/);
});

let failures = 0;
for (const current of cases) {
	if (current.platforms === "win32" && process.platform !== "win32") {
		console.log("SKIP", `${current.row} Windows leg only`);
		continue;
	}
	let timer;
	try {
		await Promise.race([
			Promise.resolve().then(current.fn),
			new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`case timed out after ${CASE_TIMEOUT_MS} ms`)), CASE_TIMEOUT_MS); }),
		]);
		console.log("PASS", current.title);
	} catch (error) {
		failures++;
		console.log("FAIL", current.title, error?.message ?? String(error));
	} finally {
		clearTimeout(timer);
	}
}
fs.rmSync(root, { recursive: true, force: true });
if (failures) process.exitCode = 1;
