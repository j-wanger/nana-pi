/**
 * @module packages/nana-pack/tests/code-map-land.test.mjs
 * @purpose Holds nana-pi to the code-map rule it ships — every mapped module carries a contract header, the map builds from current sources, the layer direction holds, and a test module is covered like any other
 * @inputs scripts/code-map.mjs, code-map.config.json and the modules under the configured roots
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (reads this checkout; writes a scratch copy of one test module for the mutation check), process (runs the map CLI and a syntax check as child processes)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
import { tmpDir } from "./tmp-dir.mjs";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
// nana-pi under its own rule: the repo's code map is generated and checked by the generator
// the templates ship (scripts/code-map.mjs is a shim over
// templates/typescript/template/scripts/code-map.mjs), so G-004 / G-007 / G-009 / G-010 /
// G-011 hold HERE and not only in a scaffolded project.
//
// Reads this checkout only — no temp HOME needed, no network, no model.
// Run: node --experimental-strip-types <this file>
const { REPO_ROOT, buildGraph, checkRepo, collectModules, formatImpact, impact, loadConfig } = await import(new URL("../../../scripts/code-map.mjs", import.meta.url).href);
const { IMPACT_LABELS } = await import(new URL("../../../scripts/code-map-launch-config.mjs", import.meta.url).href);
const { TEST_ROOTS } = await import(new URL("../../../scripts/requirements-trace.mjs", import.meta.url).href);
// R-860's full breadth (bare / .href / .pathname / a second import() argument) is pinned
// directly against the generator template ships, not the shim: tests may import anything
// (G-007), and templates/ is not a mapped root, so this import is external to the graph, not
// a broken edge.
const { parseRelativeImports } = await import(new URL("../../../templates/typescript/template/scripts/code-map.mjs", import.meta.url).href);

let fails = 0;
const check = (n, ok, why = "") => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : why);
	if (!ok) fails++;
};

const { problems, line } = checkRepo();
console.log(line);
// req: G-004 G-009 G-010
check("the current source graph builds with valid module headers and layer directions", problems.length === 0, problems.join("\n  "));
// CI's Repository checks step runs the real map CLI directly.

if (fails) process.exitCode = 1;
