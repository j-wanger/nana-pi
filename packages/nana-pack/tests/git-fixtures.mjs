/**
 * @module packages/nana-pack/tests/git-fixtures.mjs
 * @purpose Read fixed-revision fixture text with an explicit missing-history failure.
 * @inputs Revision and repository-relative path, read-only git history.
 * @outputs Named gitShow function returning the historical file text.
 * @effects process (bounded read-only git child).
 * @errors Assertion naming missing history and the fetch instruction.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../..", import.meta.url));
const LIMIT_MS = 45_000; // chosen: bound the read-only git child, unchanged from code-search.test.mjs.
export function gitShow(base, path) {
	const r = spawnSync("git", ["show", `${base}:${path}`], { cwd: ROOT, encoding: "utf8", timeout: LIMIT_MS, maxBuffer: 8 * 1024 * 1024 });
	assert.equal(r.status, 0, `missing history ${base}:${path}: ${r.stderr || r.error || "git failed"}; fetch full history`);
	return r.stdout;
}
