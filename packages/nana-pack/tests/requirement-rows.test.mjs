/**
 * @module packages/nana-pack/tests/requirement-rows.test.mjs
 * @purpose Pins the candidate requirement rows lister's tiers, uncertainty label and unknown result.
 * @inputs Synthetic import graphs, rail markers and the checkout's mapped source graph.
 * @outputs PASS/FAIL lines for each R-649 clause.
 * @effects disk (reads this checkout), process (runs the rows CLI)
 * @errors A failed check is reported and makes this test process exit nonzero.
 */
import { spawnSync } from "node:child_process";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { buildGraph, parseConfig } from "../../../templates/typescript/template/scripts/code-map.mjs";
import { candidateRows } from "../../../scripts/requirement-rows.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
let fails = 0;
const check = (name, ok, why = "") => {
	console.log(ok ? "PASS" : "FAIL", name, ok ? "" : why);
	if (!ok) fails++;
};

const config = parseConfig(JSON.stringify({
	roots: ["lib", "tests"],
	exemptRoots: ["tests"],
	moduleExtensions: [".mjs"],
	mapPath: "map.md",
	packages: [{ id: "fixture", prefix: "" }],
	layers: [{ id: "fixture", title: "Fixture", blurb: "Fixture graph", match: ".*" }],
}));
const graph = buildGraph([
	{ path: "lib/a.mjs", source: "" },
	{ path: "lib/b.mjs", source: 'import "./a.mjs";' },
	{ path: "tests/x.test.mjs", source: 'import "../lib/a.mjs";' },
	{ path: "tests/y.test.mjs", source: 'import "../lib/b.mjs";' },
	{ path: "lib/orphan.mjs", source: "" },
], config);
const traced = new Map([
	["R-004", ["tests/x.test.mjs::direct marker", "tests/y.test.mjs::overlap marker"]],
	["R-010", ["tests/y.test.mjs::transitive marker"]],
	["R-002", ["tests/y.test.mjs::transitive marker"]],
]);
const statusOf = (id) => id === undefined
	? "2 untested rows"
	: "implemented";
const textOf = (id) => `Requirement cell for ${id}`;
const fixtureOutput = candidateRows({ graph, traced, statusOf, textOf }, ["lib/a.mjs", "lib/orphan.mjs", "not/mapped.mjs"]);

// req: R-649
check("direct and transitive tiers contain the right marked rows and are disjoint",
	fixtureOutput.includes("direct test files (1), rows (1):\n    R-004 implemented Requirement cell for R-004") &&
	fixtureOutput.includes("transitive-only test files (1), rows (2):\n    R-002 R-010") &&
	fixtureOutput.indexOf("direct test files (1)") < fixtureOutput.indexOf("transitive-only test files (1)") &&
	!fixtureOutput.includes("transitive-only test files (1), rows (2):\n    R-010 R-002") &&
	fixtureOutput.includes("R-004") && !fixtureOutput.includes("transitive-only test files (1), rows (2):\n    R-002 R-004"),
	fixtureOutput);
// req: R-649
check("each file output carries the incomplete and inexact label with the untested count",
	fixtureOutput.includes("neither complete nor exact") &&
	fixtureOutput.includes("any marked check in an importing test file can list a row without exercising this file") &&
	fixtureOutput.includes("untested rows carry no marker and never appear (2 untested rows)") &&
	fixtureOutput.includes("test modules that only spawn a process are not linked"),
	fixtureOutput);
// req: R-649
check("files without marked test callers print unknown, including an unmapped file",
	fixtureOutput.includes("lib/orphan.mjs") && fixtureOutput.includes("not/mapped.mjs  [NOT A MAPPED MODULE]\n  unknown (not none)") && fixtureOutput.includes("unknown (not none)"),
	fixtureOutput);

const { repoGraph, REPO_ROOT } = await import("../../../scripts/code-map.mjs");
const { checkRepo } = await import("../../../scripts/requirements-trace.mjs");
const { requirements, traced: repoTraced } = checkRepo();
const repoStatus = (id) => id === undefined
	? `${[...requirements.values()].filter((row) => row.status === "untested").length} untested rows`
	: requirements.get(id)?.status ?? "unknown";
const repoText = (id) => {
	const text = (awaitRequirementsText);
	return text.match(new RegExp(`^\\|\\s*${id}\\s*\\|([^|]*)\\|`, "m"))?.[1]?.trim() ?? "unknown";
};
const awaitRequirementsText = (await import("node:fs")).readFileSync(path.join(REPO_ROOT, "REQUIREMENTS.md"), "utf8");
const objective = candidateRows({ graph: repoGraph(), traced: repoTraced, statusOf: repoStatus, textOf: repoText }, ["packages/nana-pack/lib/objective.ts"]);
const objectiveIds = [...objective.matchAll(/\bR-(\d{3})\b/g)].map((m) => `R-${m[1]}`);
// req: R-649
check("objective.ts lists R-001 through R-019 across the tiers and carries the uncertainty label",
	Array.from({ length: 19 }, (_, i) => `R-${String(i + 1).padStart(3, "0")}`).every((id) => objectiveIds.includes(id)) &&
	objective.includes("neither complete nor exact"), objective);

const cli = spawnSync(process.execPath, [path.join(ROOT, "scripts/requirement-rows.mjs"), "packages/nana-pack/bin/pi-review.mjs"], { cwd: ROOT, encoding: "utf8" });
// req: R-649
check("CLI reports a file with no marked test caller as unknown", cli.status === 0 && cli.stdout.includes("unknown (not none)"), `${cli.stdout}\n${cli.stderr}`);

if (fails) process.exitCode = 1;
