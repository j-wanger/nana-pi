/**
 * @module packages/nana-pack/tests/code-map.test.mjs
 * @purpose Holds nana-pi to the code-map rule it ships — every mapped module carries a contract header, the map on disk is current, the layer direction holds, and a test module is covered like any other
 * @inputs scripts/code-map.mjs, code-map.config.json, docs/code-map.md and the modules under the configured roots
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (reads this checkout; writes a scratch copy of one test module for the mutation check), process (runs the map CLI and a syntax check as child processes)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
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
const { REPO_ROOT, checkRepo, collectModules, impact, loadConfig } = await import(new URL("../../../scripts/code-map.mjs", import.meta.url).href);

let fails = 0;
const check = (n, ok, why = "") => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : why);
	if (!ok) fails++;
};

const { problems, line, graph } = checkRepo();
console.log(line);

// req: G-004 G-009 G-010
check("the repo's code map is current and every module has a contract header", problems.length === 0, problems.join("\n  "));

const config = loadConfig(REPO_ROOT);
const exempt = graph.order.filter((p) => graph.modules.get(p).exemptReason);
// req: G-004
check("only the three content-pinned bench modules are excused a header, each with a reason",
	exempt.length === 3 && exempt.every((p) => /study tool-profiles-2026-09-08/.test(graph.modules.get(p).exemptReason)),
	`exempt: ${exempt.join(", ")}`,
);

// G-007 as THIS repo declares it: apps and scripts on top, the packages under them, so no
// module in a package may import an app. Asserted on the edges, not on the absence of a
// problem — the claim is about the repo's shape, not about the checker having run.
const reversed = [];
for (const from of graph.order) {
	const a = graph.modules.get(from).layer?.id;
	for (const to of graph.modules.get(from).callees) {
		const b = graph.modules.get(to).layer?.id;
		if (a === "packages" && b === "apps") reversed.push(`${from} -> ${to}`);
	}
}
// req: G-007
check("no module in a package imports an app", reversed.length === 0, reversed.join(", "));
check("every module lands in a declared layer", graph.order.every((p) => graph.modules.get(p).layer), "a module has no layer");

// G-011: the blast radius of a change is one command away, and it crosses the layer
// boundary — the desk is downstream of the pack's agent-dir resolver.
const blast = impact(graph, ["packages/nana-pack/lib/agent-dir.mjs"]);
// req: G-011
check("the map gives a change's transitive callers across the layer boundary",
	blast.callers.includes("apps/desk/server.mjs") && blast.callers.includes("packages/nana-setup/lib/paths.mjs"),
	`callers: ${blast.callers.join(" ")}`,
);
check("an unmapped path is reported as unmapped rather than silently empty",
	impact(graph, ["apps/desk/test/live-feel.e2e.mjs"]).per[0].known === false,
	"an ignored path was reported as mapped",
);

// A TEST MODULE IS A MODULE. The six dirs `npm test` collects are mapped roots (each declared
// layerExempt — a test may import across the layer direction), so a test carries the same contract
// header as any other module and a dropped header is a --check failure. Before this they were
// `ignore`d, which made the "every module" rule silently stop at the suite.
const TEST_ROOTS = [
	"packages/nana-pack/tests",
	"packages/nana-knowledge/tests",
	"packages/nana-stage/tests",
	"packages/nana-setup/tests",
	"apps/desk/test",
	"apps/bench/test",
];
const mappedTests = graph.order.filter((p) => TEST_ROOTS.some((r) => p.startsWith(`${r}/`)));
const unrootedTestDirs = TEST_ROOTS.filter((r) => !config.roots.includes(r));
check("every test dir `npm test` collects is a declared map root", unrootedTestDirs.length === 0, unrootedTestDirs.join(", "));
const unexemptRoots = TEST_ROOTS.filter((r) => !(config.exemptRoots ?? []).includes(r));
check("each test root is layerExempt, so a test may import either layer", unexemptRoots.length === 0, unexemptRoots.join(", "));
const rootsWithoutTests = TEST_ROOTS.filter((r) => !mappedTests.some((p) => p.startsWith(`${r}/`)));
check("every test root contributes mapped modules", rootsWithoutTests.length === 0, rootsWithoutTests.join(", "));
// the map on disk lists them too — checkRepo's own entry comparison above covers staleness, so this
// pins that a test module is a FIRST-CLASS entry and not merely collected
const mapOnDisk = fs.readFileSync(path.join(REPO_ROOT, config.mapPath), "utf-8");
const unlisted = mappedTests.filter((p) => !mapOnDisk.includes(`### \`${p}\``));
check("every mapped test module has an entry in docs/code-map.md", unlisted.length === 0, unlisted.join(", "));
// and the ignored suites stay out: a browser-only e2e file is not a module here
check("the browser-only e2e suites are still outside the map",
	!graph.order.some((p) => p.endsWith(".e2e.mjs")),
	graph.order.filter((p) => p.endsWith(".e2e.mjs")).join(", "),
);

// the documented command is the one that runs: `npm run map:check` from the repo root
const cli = spawnSync(process.execPath, [path.join(REPO_ROOT, "scripts", "code-map.mjs"), "--check"], {
	cwd: REPO_ROOT,
	encoding: "utf-8",
});
check("scripts/code-map.mjs --check exits 0 on a clean repo", cli.status === 0, `${cli.stdout ?? ""}${cli.stderr ?? ""}`);
check("the config the CLI reads is this repo's", config.mapPath === "docs/code-map.md", config.mapPath);

// MUTATION: dropping a test module's header must FAIL --check. Run in a scratch copy of this
// checkout (the real config, the real module sources, the generator at a dot-dir so it is not
// itself a module) so the claim is about the shipped CLI and not about a hand-built graph. Asserted
// as a DIFF against the scratch baseline, so a problem that already exists cannot pass for the one
// the mutation introduced.
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "code-map-mutation-"));
try {
	const gen = path.join(scratch, ".map", "code-map.mjs");
	fs.mkdirSync(path.dirname(gen), { recursive: true });
	fs.copyFileSync(path.join(REPO_ROOT, "templates", "typescript", "template", "scripts", "code-map.mjs"), gen);
	fs.copyFileSync(path.join(REPO_ROOT, "code-map.config.json"), path.join(scratch, "code-map.config.json"));
	fs.mkdirSync(path.dirname(path.join(scratch, config.mapPath)), { recursive: true });
	for (const mod of collectModules(REPO_ROOT, config)) {
		const to = path.join(scratch, mod.path);
		fs.mkdirSync(path.dirname(to), { recursive: true });
		fs.writeFileSync(to, mod.source);
	}
	const run = (...args) => spawnSync(process.execPath, [gen, ...args], { cwd: scratch, encoding: "utf-8" });
	const written = run("--write");
	check("the scratch copy renders a map of the same size", (written.stdout ?? "").includes(`${graph.order.length} modules`), `${written.stdout ?? ""}${written.stderr ?? ""}`);
	const before = run("--check").stdout ?? "";

	const MUT = "packages/nana-stage/tests/blocks.test.mjs";
	const mutFile = path.join(scratch, MUT);
	const kept = fs.readFileSync(mutFile, "utf-8");
	const end = kept.indexOf("*/");
	check("the mutated test module really opened with a contract header", kept.startsWith("/**") && end !== -1, kept.slice(0, 40));
	fs.writeFileSync(mutFile, kept.slice(end + 2).replace(/^\n/, ""));

	const after = run("--check");
	const named = `${MUT}: no contract header`;
	check("a test module with its header dropped fails --check", after.status !== 0 && (after.stdout ?? "").includes(named), `${after.stdout ?? ""}${after.stderr ?? ""}`);
	check("…and that problem is the one the mutation introduced", !before.includes(named), before);
} finally {
	fs.rmSync(scratch, { recursive: true, force: true });
}

console.log(fails ? `\n${fails} FAILED` : "\nall passed");
process.exit(fails ? 1 : 0);
