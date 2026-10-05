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
const { REPO_ROOT, checkRepo, collectModules, formatImpact, impact, loadConfig } = await import(new URL("../../../scripts/code-map.mjs", import.meta.url).href);
// R-860's full breadth (bare / .href / .pathname / a second import() argument) is pinned
// directly against the generator template ships, not the shim: tests may import anything
// (G-007), and templates/ is not a mapped root, so this import is external to the graph, not
// a broken edge.
const { buildGraph: templateBuildGraph, parseRelativeImports } = await import(new URL("../../../templates/typescript/template/scripts/code-map.mjs", import.meta.url).href);

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
// PRODUCTION module in a package may import an app. Asserted on the edges, not on the
// absence of a problem — the claim is about the repo's shape, not about the checker having
// run. A test root is declared layerExempt (G-007: a test may import any layer), so a
// packages/*/tests module importing an app — now visible once R-860's dynamic-import forms
// resolve — is excluded here rather than misread as a reversed production import.
const isExemptFrom = (p) => (config.exemptRoots ?? []).some((r) => p === r || p.startsWith(`${r}/`));
const reversed = [];
for (const from of graph.order) {
	if (isExemptFrom(from)) continue;
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

// R-860: most of this repo's OWN tests load the module they exercise via a dynamic import
// of new URL(<relative path>, import.meta.url) — bare, .href or .pathname — which the
// generator used to read as opaque and silently record no edge for: before this fix, 67 of
// the 95 test modules above had zero callees. paths.test.mjs uses exactly that form (not
// spelled out literally here — this file is itself a mapped module, and a real import
// specifier written out would be read as one of THIS file's own imports once scanned).
// req: R-860
check("a dynamic import via new URL(...).href is a mapped edge (the form most of this repo's tests use)",
	graph.modules.get("packages/nana-setup/tests/paths.test.mjs")?.callees.includes("packages/nana-setup/lib/paths.mjs"),
	`callees: ${graph.modules.get("packages/nana-setup/tests/paths.test.mjs")?.callees.join(" ")}`,
);

// R-860's full breadth: all SIX combinations of {bare, .href, .pathname} x {no second
// argument, a second argument}, each with its OWN distinct target so a mutation that
// rejects just one combination fails exactly one check here, not a blended assertion three
// of six could silently cover for. The `@` placeholder is the same trick the template's own
// fixture uses: a real import specifier written out here would be read as one of THIS
// file's own imports once scanned.
const SIX_FORMS = [
	{ name: "bare, no second argument", target: "./bare-no-arg.mjs", line: "const a = await import(new URL(@TARGET@, import.meta.url));" },
	{ name: "bare, with a second argument", target: "./bare-with-arg.mjs", line: "const b = await import(new URL(@TARGET@, import.meta.url), { assert: { type: @json@ } });" },
	{ name: ".href, no second argument", target: "./href-no-arg.mjs", line: "const c = await import(new URL(@TARGET@, import.meta.url).href);" },
	{ name: ".href, with a second argument", target: "./href-with-arg.mjs", line: "const d = await import(new URL(@TARGET@, import.meta.url).href, { assert: { type: @json@ } });" },
	{ name: ".pathname, no second argument", target: "./pathname-no-arg.mjs", line: "const e = await import(new URL(@TARGET@, import.meta.url).pathname);" },
	{ name: ".pathname, with a second argument", target: "./pathname-with-arg.mjs", line: "const f = await import(new URL(@TARGET@, import.meta.url).pathname, { assert: { type: @json@ } });" },
];
const sixFormsSource = SIX_FORMS.map((f) => f.line.replace("@TARGET@", `@${f.target}@`))
	.join("\n")
	.replace(/@/g, '"');
const sixFormsFound = parseRelativeImports(sixFormsSource);
for (const f of SIX_FORMS) {
	// req: R-860
	check(`new URL(...) ${f.name} resolves to an edge`, sixFormsFound.includes(f.target), `found: ${sixFormsFound.join(" ")}`);
}

// R-860's exclusions: a template-string URL, a variable, and a non-relative literal (a bare
// specifier, an absolute URL, an absolute path) all resolve to nothing — the row only ever
// claims a RELATIVE string literal, same as every other form this generator already parses.
const exclusionsFixture = [
	"const e = await import(new URL(`./e-${n}.mjs`, import.meta.url).href);", // template string: no edge
	"const f = await import(new URL(someVar, import.meta.url).href);", // a variable: no edge
	"const g = await import(new URL(@node:fs@, import.meta.url).href);", // non-relative (bare specifier): no edge
	"const h = await import(new URL(@https://example.com/x.mjs@, import.meta.url).href);", // non-relative (absolute URL): no edge
	"const i = await import(new URL(@/abs/path.mjs@, import.meta.url).href);", // non-relative (absolute path): no edge
]
	.join("\n")
	.replace(/@/g, '"');
// req: R-860
check("a template-string URL, a variable, and a non-relative literal all resolve to nothing",
	parseRelativeImports(exclusionsFixture).length === 0,
	`found (should be empty): ${parseRelativeImports(exclusionsFixture).join(" ")}`,
);

// R-863 (astra r1 MUST 1): text in a comment or a string must never create an edge — the
// four fake specifiers below each have the exact bytes a real import would, just not in
// code. Each targets a distinct, identifiable path.
const noiseFixture = [
	"// a line comment: const x = await import(new URL(@./from-line-comment.mjs@, import.meta.url).href);",
	"/* a block comment:",
	"   const x = await import(new URL(@./from-block-comment.mjs@, import.meta.url).href); */",
	"const s1 = 'import(new URL(@./from-single-quoted-string.mjs@, import.meta.url).href)';",
	"const s2 = `plain template text: import(new URL(@./from-template-text.mjs@, import.meta.url).href)`;",
]
	.join("\n")
	.replace(/@/g, '"');
const noiseFound = parseRelativeImports(noiseFixture);
// req: R-863
check("a line comment, a block comment, a single-quoted string and template-literal TEXT never create an edge for the fake specifier they hold",
	noiseFound.length === 0,
	`found (should be empty): ${noiseFound.join(" ")}`,
);

// R-863 (astra r1 MUST 1, positive side): a real import still resolves right after a regex
// literal containing a quote, right after a string whose text contains "//" (not a comment
// start), and from inside a template's ${...} interpolation (code, not template TEXT).
const afterRegexSource = ["const pattern = /\"/;", "import(@./after-regex.mjs@);"].join("\n").replace(/@/g, '"');
const afterUrlStringSource = ["const u = @http://example.com@;", "import(@./after-url-string.mjs@);"].join("\n").replace(/@/g, '"');
const interpolationSource = "const s = `x ${await import(@./inside-interpolation.mjs@)} y`;".replace(/@/g, '"');
// req: R-863
check("a real import after a regex literal containing a quote still resolves",
	parseRelativeImports(afterRegexSource).includes("./after-regex.mjs"),
	`found: ${parseRelativeImports(afterRegexSource).join(" ")}`,
);
// req: R-863
check("a real import after a string containing // (not a comment start) still resolves",
	parseRelativeImports(afterUrlStringSource).includes("./after-url-string.mjs"),
	`found: ${parseRelativeImports(afterUrlStringSource).join(" ")}`,
);
// req: R-863
check("a real import inside a template's ${...} interpolation still resolves",
	parseRelativeImports(interpolationSource).includes("./inside-interpolation.mjs"),
	`found: ${parseRelativeImports(interpolationSource).join(" ")}`,
);

// R-863, graph-level: astra r1's own two reproduction snippets, through buildGraph (not
// just the regex layer), so the claim is about the shipped edge/problem set astra actually
// inspected, not a lower-level function in isolation.
const astraHeader = (p) => `/**\n * @module ${p}\n * @purpose fixture.\n * @inputs none\n * @outputs none\n * @effects none\n * @errors none\n */\n`;
const astraConfig = { ...config, exempt: [] }; // a lone fixture module can't satisfy the
// real config's exempt-path existence check; irrelevant to what this is pinning
function buildGraphOf(bodySource) {
	const p = "packages/nana-pack/tests/_astra-r1-fixture.mjs";
	return templateBuildGraph([{ path: p, source: astraHeader(p) + bodySource }], astraConfig);
}
const astraRepro1 = buildGraphOf("// import(new URL(@./from-comment-repro.mjs@, import.meta.url).href)".replace(/@/g, '"'));
const astraRepro2 = buildGraphOf("const text = 'import(new URL(@./from-string-repro.mjs@, import.meta.url).href)';".replace(/@/g, '"'));
// req: R-863
check("astra r1's own line-comment repro creates no edge and no problem",
	astraRepro1.modules.get("packages/nana-pack/tests/_astra-r1-fixture.mjs").callees.length === 0 && astraRepro1.problems.length === 0,
	`callees: ${astraRepro1.modules.get("packages/nana-pack/tests/_astra-r1-fixture.mjs").callees.join(" ")}; problems: ${astraRepro1.problems.join(" | ")}`,
);
// req: R-863
check("astra r1's own single-quoted-string repro creates no edge and no problem",
	astraRepro2.modules.get("packages/nana-pack/tests/_astra-r1-fixture.mjs").callees.length === 0 && astraRepro2.problems.length === 0,
	`callees: ${astraRepro2.modules.get("packages/nana-pack/tests/_astra-r1-fixture.mjs").callees.join(" ")}; problems: ${astraRepro2.problems.join(" | ")}`,
);

// R-861: --impact also names the part of the blast radius it still cannot see — a per-run
// count of test modules whose own callees are empty (a child-process-only test, or one
// spelled a form this generator does not parse), recomputed independently of formatImpact
// so this does not just mirror the implementation.
const untracedModules = mappedTests.filter((p) => graph.modules.get(p).callees.length === 0);
const impactLine = `untraced tests: ${untracedModules.length} of ${mappedTests.length} test modules import no mapped module (a test that only starts a process is not linked)`;
// req: R-861
check("--impact's output carries the untraced-test line with the real count",
	formatImpact(graph, ["packages/nana-pack/lib/agent-dir.mjs"]).includes(impactLine),
	`expected: ${impactLine}`,
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
