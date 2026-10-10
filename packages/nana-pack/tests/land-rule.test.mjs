/**
 * @module packages/nana-pack/tests/land-rule.test.mjs
 * @purpose Exercises the land-rule acceptance matrix against disposable Git repositories and a scratch review home.
 * @inputs The frozen seat acceptance script and the land/review CLIs in this repository.
 * @outputs One PASS/FAIL result for the complete land-rule contract matrix.
 * @effects disk (OS temporary directory only), process (spawns the acceptance script and its scratch CLIs).
 * @errors A nonzero acceptance result or a missing success summary fails this test.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const script = path.join(root, "docs/reviews/land-rule-2026-10-10/seat-verify-land.mjs");
const result = spawnSync(process.execPath, [script], { cwd: root, encoding: "utf8", timeout: 300_000 });
const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
const ok = result.status === 0 && output.includes("seat-verify-land: 0 mismatch(es)");
const check = (title, passed, detail = "") => {
	console.log(passed ? "PASS" : "FAIL", title, passed ? "" : detail);
	if (!passed) process.exitCode = 1;
};
// req: R-975 R-976 R-977 R-1002 R-1003 R-1004 R-1005 R-1006 R-1007 R-1009 R-1011
check("frozen land-rule acceptance matrix", ok, `exit=${result.status}; ${output.slice(-4000)}`);
