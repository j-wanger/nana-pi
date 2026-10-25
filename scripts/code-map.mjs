#!/usr/bin/env node
/**
 * @module scripts/code-map.mjs
 * @purpose Run the project template's code-map generator over this repo, adding artifact readers and measured test files to --impact, so nana-pi's own map is produced by the tool it ships (G-004, G-007, G-009, G-010, G-011).
 * @inputs argv (--write | --render | --check | --impact <file...>), code-map.config.json, module sources, REQUIREMENTS.md, git and runtime data (NANA_RUNTIME_MAP_FILE override)
 * @outputs docs/code-map.md on --write, check findings, or impact callers, callees, artifact writers and readers, freshness and measured test files
 * @effects disk (reads config, module sources, REQUIREMENTS.md and runtime data, writes the map), process (exits non-zero when --check or --write finds a problem; reads git for --impact's staleness check)
 * @errors exit 1 with the problem list when a header is missing or malformed, an import breaks the layer direction, or the map is stale; an artifact note for an unusable ledger; a thrown Error for a bad config or unknown mode
 */
// A shim, not a copy. The generator is ONE source — the template every project
// scaffolds from (`templates/typescript/template/scripts/code-map.mjs`) — and nana-pi
// runs that file, so the repo lives under the rule it ships. Not a symlink: a win32
// checkout does not keep one.
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, posix, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import {
	buildGraph,
	checkRepo as checkRepoAt,
	collectModules,
	formatImpact,
	impact,
	isLayerExempt,
	loadConfig,
	main,
	untracedTests,
	writeMap as writeMapAt,
} from "../templates/typescript/template/scripts/code-map.mjs";
import { checkoutDrift, dataPath, formatFreshness, formatRuntime, hashFile, loadRuntime } from "../packages/nana-pack/lib/runtime-map.mjs";
import { MAIN_REF } from "../packages/nana-pack/lib/land-config.mjs";
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

export { buildGraph, collectModules, formatImpact, impact, isLayerExempt, loadConfig, untracedTests };

/** The whole map check over THIS repo. */
export const checkRepo = () => checkRepoAt(REPO_ROOT);

/** Rewrite docs/code-map.md from the code. */
export const writeMap = () => writeMapAt(REPO_ROOT);

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
		return `\n${out.join("\n")}\n`;
	} catch (error) {
		return `\n${ARTIFACT_NOTE_PREFIX} ${error instanceof Error ? error.message : String(error)}\n`;
	}
}

function printRuntimeBlock(root, argv) {
	process.stdout.write(runtimeBlock(root, argv));
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
	const argv = process.argv.slice(2);
	const code = main(argv, REPO_ROOT);
	if ((argv[0] ?? "--write") === "--impact") {
		process.stdout.write(await artifactBlock(REPO_ROOT, argv));
		printRuntimeBlock(REPO_ROOT, argv);
	}
	process.exit(code);
}
