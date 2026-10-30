#!/usr/bin/env node
/**
 * @module scripts/code-map.mjs
 * @purpose Wrap the template generator with exact launch paths, blind reach and planner precedent search, retaining artifact readers and measured tests in --impact (G-004, G-007, G-009, G-010, G-011).
 * @inputs argv (--write | --render | --check | --search <need> | --impact <file...>), code-map.config.json, module sources, REQUIREMENTS.md, git and runtime data (NANA_RUNTIME_MAP_FILE override)
 * @outputs docs/code-map.md on --write, check findings, ranked precedent suggestions with callees, or marked impact callers, blind-reach tests, callees, artifact writers and readers, freshness and measured test files
 * @effects disk (reads config, module sources, REQUIREMENTS.md and runtime data, writes the map), process (exits non-zero when --check or --write finds a problem; reads git for --impact's staleness check)
 * @errors exit 1 with the problem list when a header is missing or malformed, an import breaks the layer direction, the map is stale, or a repo-code/untraced program lacks a reasoned launchAlwaysRun entry; an artifact note for an unusable ledger; a thrown Error for a bad config or unknown mode
 */
// A shim, not a copy. The generator is ONE source — the template every project
// scaffolds from (`templates/typescript/template/scripts/code-map.mjs`) — and nana-pi
// runs that file, so the repo lives under the rule it ships. Not a symlink: a win32
// checkout does not keep one.
import { existsSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, posix, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import {
	buildGraph,
	checkRepo as checkRepoAt,
	collectModules,
	formatImpact as formatImportImpact,
	impact,
	isLayerExempt,
	loadConfig,
	main,
	renderMap,
	untracedTests,
	writeMap as writeMapAt,
} from "../templates/typescript/template/scripts/code-map.mjs";
import { checkoutDrift, dataPath, formatFreshness, formatRuntime, hashFile, loadRuntime } from "../packages/nana-pack/lib/runtime-map.mjs";
import { MAIN_REF } from "../packages/nana-pack/lib/land-config.mjs";
import { addLaunchLinks } from "./code-map-launch.mjs";
import { IMPACT_LABELS } from "./code-map-launch-config.mjs";
import { formatSearch, searchCode } from "./code-search.mjs";
import {
	ARTIFACT_CLOSING_NOTE, ARTIFACT_HEADING, ARTIFACT_NONE, ARTIFACT_NOTE_PREFIX,
	ARTIFACT_NO_IMPORT_PATH, ARTIFACT_NO_LIVE_ENTRY, ARTIFACT_READ_BY, ARTIFACT_READS,
	ARTIFACT_STAR, ARTIFACT_WRITES, NOTE_PREFIX,
} from "../packages/nana-pack/lib/runtime-map-config.mjs";

/** This repo's root, resolved through symlinks, whatever the cwd. */
export const REPO_ROOT = resolve(
	dirname(realpathSync(fileURLToPath(import.meta.url))),
	"..",
);

export { buildGraph, collectModules, impact, isLayerExempt, loadConfig, untracedTests };

const isTest = (graph, path) => isLayerExempt(graph.config, path) && /\.test\.(?:mjs|ts|js)$/.test(path);
const blindSite = (site) => ["unresolved", "other-program", "program-unknown"].includes(site.kind);

function linkRepo(root, graph, sources) {
	graph.importGraph = buildGraph(sources, graph.config);
	addLaunchLinks(graph, sources);
	const declarations = JSON.parse(readFileSync(resolve(root, "code-map.config.json"), "utf8")).launchAlwaysRun ?? [];
	if (!Array.isArray(declarations)) throw new Error("launchAlwaysRun must be an array of paths with reasons");
	graph.launchAlwaysRun = declarations.filter((e) => graph.modules.has(e?.path) && typeof e.reason === "string" && e.reason.trim()).map((e) => e.path);
	for (const entry of declarations) {
		if (!graph.modules.has(entry?.path) || typeof entry.reason !== "string" || !entry.reason.trim()) graph.problems.push(`launchAlwaysRun: invalid path or missing reason: ${entry?.path ?? "—"}`);
	}
	for (const [path, sites] of graph.sitesByModule) {
		if (sites.some((s) => ["other-program", "program-unknown"].includes(s.kind)) && !declarations.some((e) => e.path === path && typeof e.reason === "string" && e.reason.trim())) graph.problems.push(`${path}: repo-code or untraced program needs a launchAlwaysRun path and reason`);
	}
	return graph;
}

/** Tests that hold or transitively reach a blind launch, independent of the queried file. */
export function blindReach(graph) {
	const holders = [...new Set([...(graph.launchAlwaysRun ?? []), ...[...(graph.sitesByModule ?? [])].filter(([, sites]) => sites.some(blindSite)).map(([path]) => path)])];
	return [...new Set([...holders, ...impact(graph, holders).callers])].filter((p) => isTest(graph, p)).sort();
}

/** The template's layout with enriched caller marks and nana-pi's two coverage lines. */
export function formatImpact(graph, paths) {
	let output = formatImportImpact(graph, paths);
	for (const item of impact(graph, paths).per) {
		const imported = new Set(impact(graph.importGraph ?? graph, [item.path]).callers);
		const line = `  transitive callers (${item.callers.length}): ${item.callers.join(" ") || "—"}`;
		const marked = item.callers.map((p) => `${p}${imported.has(p) ? "" : ` ${IMPACT_LABELS.launch}`}`);
		const heading = `${item.path}${item.known ? "" : "  [NOT A MAPPED MODULE]"}`;
		output = output.replace(`${heading}\n${line}`, `${heading}\n  transitive callers (${item.callers.length}): ${marked.join(" ") || "—"}`);
	}
	const tests = graph.order.filter((p) => isTest(graph, p));
	const untraced = tests.filter((p) => graph.modules.get(p).callees.length === 0).length;
	output = output.replace(/^untraced tests:.*$/m, `${IMPACT_LABELS.untraced} ${untraced} of ${tests.length} ${IMPACT_LABELS.unlinked}`);
	const blind = blindReach(graph);
	return `${output}\n${IMPACT_LABELS.blind} ${blind.length} of ${tests.length}: ${blind.join(" ") || "—"}`;
}

function renderRepoMap(graph) {
	let text = renderMap(graph).replace("# Code map\n\n", "# Code map\n\nNana-pi adds exact anchored launch/path links to callers and callees below; launch edges\nare not imports and do not follow import layer rules. `--impact` walks these links and\nreports blind reach; `map:search` reads this enriched map. Other graph readers and the\nimpact artifact block retain the import-only graph.\n\n");
	// Extend each existing entry without copying the template renderer.
	text = text.replace(/(^### `([^`]+)`[\s\S]*?)(?=^### |^## |$(?![\s\S]))/gm, (entry, _, path) => {
		const sites = (graph.sitesByModule.get(path) ?? []).filter(blindSite);
		if (!sites.length) return entry;
		const line = (s) => `line ${s.line}: ${s.call}${s.bindingLines.map((n) => `; binding line ${n}`).join("")}`;
		const unresolved = sites.filter((s) => s.kind === "unresolved");
		const programs = sites.filter((s) => s.kind !== "unresolved");
		return `${entry.trimEnd()}\n${unresolved.length ? `- **unresolved launches** — ${unresolved.map(line).join(" · ")}\n` : ""}${programs.length ? `- **repo-code launches** — ${programs.map(line).join(" · ")}\n` : ""}\n`;
	});
	return text;
}

/** Keep the generator's validation, then compare its launch-enriched rendering. */
export function checkRepo(root = REPO_ROOT) {
	const result = checkRepoAt(root);
	const before = new Set(result.graph.problems);
	linkRepo(root, result.graph, collectModules(root, result.graph.config));
	result.problems.push(...result.graph.problems.filter((p) => !before.has(p)));
	result.markdown = renderRepoMap(result.graph);
	const { config } = result.graph;
	const stale = `${config.mapPath} is stale against the code; run '${config.runner} map'`;
	result.problems = result.problems.filter((p) => p !== stale);
	const file = resolve(root, config.mapPath);
	if (existsSync(file) && readFileSync(file, "utf8").replace(/\r\n/g, "\n") !== result.markdown) result.problems.push(stale);
	result.line = result.line.replace(/\d+ problem\(s\)$/, `${result.problems.length} problem(s)`);
	return result;
}

/** Rewrite the template map with this repo's reciprocal launch links. */
export function writeMap(root = REPO_ROOT) {
	const result = writeMapAt(root);
	linkRepo(root, result.graph, collectModules(root, result.config));
	result.markdown = renderRepoMap(result.graph);
	writeFileSync(resolve(root, result.config.mapPath), result.markdown);
	return result;
}

/** The graph of this repo, for an impact walk. */
export function repoGraph(root = REPO_ROOT) {
	const config = loadConfig(root);
	return buildGraph(collectModules(root, config), config);
}

/** The same repo-relative path each `--impact` argument resolves to inside the generator's own `main` (R-1272). */
function resolveImpactPaths(args, root, graph = repoGraph(root)) {
	return args.map((a) => {
		const rel = relative(root, resolve(a)).split(sep).join("/");
		return posix.normalize(existsSync(resolve(a)) || graph.modules.has(rel) ? rel : a);
	});
}

/** Compare a measured tip with main without surfacing git's diagnostics for an absent tip (R-2529). */
export function relationToMain(root, tip, { gitRunner = spawnSync } = {}) {
	const run = (args) => gitRunner("git", args, { cwd: root, encoding: "utf8" });
	const main = run(["rev-parse", "--verify", `${MAIN_REF}^{commit}`]);
	if (main.status !== 0) return { kind: "not-on-main" };
	if (main.stdout.trim() === tip) return { kind: "same" };
	const ancestor = run(["merge-base", "--is-ancestor", tip, MAIN_REF]);
	if (ancestor.status !== 0) return { kind: "not-on-main" };
	const count = run(["rev-list", "--count", `${tip}..${MAIN_REF}`]);
	if (count.status !== 0 || !/^\d+$/.test(count.stdout.trim())) return { kind: "not-on-main" };
	return { kind: "past", commits: Number(count.stdout.trim()) };
}

/**
 * The `--impact` runtime block (R-1272, R-1273, R-2528, R-2529, R-2534): freshness and the
 * measured test files for each named path, or one measure note when no runtime data exists.
 */
export function runtimeBlock(root, argv, { env = process.env, now = () => new Date(), gitRunner = spawnSync } = {}) {
	const git = (args, options) => gitRunner("git", args, { encoding: "utf8", ...options });
	const file = dataPath(root, { env, git });
	const loaded = loadRuntime(file);
	if (!loaded.ok) return `\n${NOTE_PREFIX} ${loaded.reason}; run npm run map:measure\n`;
	const paths = resolveImpactPaths(argv.slice(1), root);
	const tracked = gitRunner("git", ["ls-files"], { cwd: root, encoding: "utf8" });
	const trackedFiles = tracked.status === 0 ? tracked.stdout.split("\n").filter(Boolean) : [];
	const hashOf = (f) => hashFile(resolve(root, f));
	const drift = checkoutDrift(loaded.data, { tracked: trackedFiles, hashOf });
	const mainRelation = typeof loaded.data.tip === "string" && loaded.data.tip
		? relationToMain(root, loaded.data.tip, { gitRunner })
		: { kind: "same" };
	const freshness = formatFreshness(loaded.data, { drift, mainRelation, now });
	return `\n${freshness ? `${freshness}\n` : ""}${formatRuntime(loaded.data, paths, { hashOf })}\n`;
}

export async function artifactBlock(root, argv, { load = async () => {
	const [tree, deliverables] = await Promise.all([import("./requirements-tree.mjs"), import("./deliverables.mjs")]);
	return { parseLedger: tree.parseLedger, ledgerReadProblem: tree.ledgerReadProblem, artifactRegistry: deliverables.artifactRegistry, artifactReads: deliverables.artifactReads };
} } = {}) {
	try {
		const modules = await load();
		const ledger = readFileSync(resolve(root, "REQUIREMENTS.md"), "utf8");
		const parsed = modules.parseLedger(ledger);
		const problem = modules.ledgerReadProblem(ledger, parsed);
		if (problem) return `\n${ARTIFACT_NOTE_PREFIX} ${problem}\n`;
		const registry = modules.artifactRegistry(parsed, null);
		const reads = modules.artifactReads(parsed, null, registry);
		const graph = repoGraph(root);
		const paths = resolveImpactPaths(argv.slice(1), root, graph);
		const out = [];
		for (const file of paths) {
			const radius = new Set([file, ...impact(graph, [file]).callers, ...impact(graph, [file]).callees]);
			const writes = registry.entries.filter((entry) => entry.live && entry.writers.includes(file));
			const readIds = [...new Set(reads.reads.filter((entry) => entry.readers.includes(file)).map((entry) => entry.id))]
				.filter((id) => !writes.some((entry) => entry.id === id))
				.sort((a, b) => Number(a.slice(2)) - Number(b.slice(2)));
			const ids = new Set([...writes.map((entry) => entry.id), ...readIds]);
			out.push(`${ARTIFACT_HEADING} ${file} (${ids.size}):`);
			if (!ids.size) out.push(`  ${ARTIFACT_NONE} ${file}`);
			for (const entry of writes) {
				out.push(`  ${ARTIFACT_WRITES} ${entry.id} ${entry.name} · ${entry.featureId} · ${entry.run}`);
				const byPath = new Map();
				for (const read of reads.reads.filter((item) => item.id === entry.id && item.featureId !== entry.featureId)) {
					for (const reader of read.readers) {
						if (reader === file) continue;
						if (!byPath.has(reader)) byPath.set(reader, new Set());
						byPath.get(reader).add(read.featureId);
					}
				}
				const readers = [...byPath].map(([reader, features]) => `${reader} (${[...features].join(", ")})${radius.has(reader) ? "" : ` ${ARTIFACT_NO_IMPORT_PATH}`}`);
				out.push(`    ${ARTIFACT_READ_BY}: ${readers.join("; ") || "—"}`);
			}
			if (readIds.length) out.push(`  ${ARTIFACT_READS} (${readIds.length}): ${readIds.map((id) => {
				const entry = registry.byId.get(id);
				if (!entry?.live) return `${id} ${ARTIFACT_NO_LIVE_ENTRY}`;
				return `${id}${entry.writers.some((writer) => radius.has(writer)) ? "" : ARTIFACT_STAR}`;
			}).join(", ")}`);
		}
		out.push(ARTIFACT_CLOSING_NOTE);
		out.push("artifact radius uses import links only; launch/path links above do not change (no import path) marks");
		return `\n${out.join("\n")}\n`;
	} catch (error) {
		return `\n${ARTIFACT_NOTE_PREFIX} ${error instanceof Error ? error.message : String(error)}\n`;
	}
}

/** Synchronous static shim modes, also usable against isolated fixture roots. */
export function repoMain(argv, root = REPO_ROOT) {
	const mode = argv[0] ?? "--write";
	if (mode === "--impact") {
		if (argv.length < 2) throw new Error("usage: node scripts/code-map.mjs --impact <file...>");
		const graph = repoGraph(root);
		linkRepo(root, graph, collectModules(root, graph.config));
		process.stdout.write(`${formatImpact(graph, resolveImpactPaths(argv.slice(1), root, graph))}\n`);
		return 0;
	}
	if (mode === "--check") {
		const result = checkRepo(root);
		process.stdout.write(`${result.line}\n`);
		for (const problem of result.problems) process.stdout.write(`  ${problem}\n`);
		return result.problems.length ? 1 : 0;
	}
	if (mode === "--write" || mode === "--render") {
		const { graph, config } = writeMap(root);
		process.stdout.write(`${config.mapPath}: ${graph.order.length} modules\n`);
		for (const problem of graph.problems) process.stdout.write(`  ${problem}\n`);
		return graph.problems.length ? 1 : 0;
	}
	return main(argv, root);
}

function printRuntimeBlock(root, argv) {
	process.stdout.write(runtimeBlock(root, argv));
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
	const argv = process.argv.slice(2);
	const mode = argv[0] ?? "--write";
	let code;
	if (mode === "--search") {
		const need = argv.slice(1).join(" ").trim();
		if (!need) {
			process.stderr.write('usage: npm run map:search -- "<need>"\n');
			code = 2;
		} else {
			const config = loadConfig(REPO_ROOT);
			process.stdout.write(formatSearch(searchCode(need, readFileSync(resolve(REPO_ROOT, config.mapPath), "utf8"), readFileSync(resolve(REPO_ROOT, "REQUIREMENTS.md"), "utf8"))));
			code = 0;
		}
	} else code = repoMain(argv, REPO_ROOT);
	if ((argv[0] ?? "--write") === "--impact") {
		process.stdout.write(await artifactBlock(REPO_ROOT, argv));
		printRuntimeBlock(REPO_ROOT, argv);
	}
	process.exit(code);
}
