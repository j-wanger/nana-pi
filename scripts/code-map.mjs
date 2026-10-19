#!/usr/bin/env node
/**
 * @module scripts/code-map.mjs
 * @purpose Run the project template's code-map generator over this repo, adding the measured test files to --impact, so nana-pi's own map is produced by the tool it ships (G-004, G-007, G-009, G-010, G-011).
 * @inputs argv (--write | --render | --check | --impact <file...>), code-map.config.json at the repo root, the modules under its roots, and for --impact, git and the runtime data file (NANA_RUNTIME_MAP_FILE override)
 * @outputs docs/code-map.md on --write, the summary line plus problem list of --check, the transitive callers and callees plus the measured test files of --impact
 * @effects disk (reads the config, the module sources and the runtime data file, writes the map), process (exits non-zero when --check or --write finds a problem; reads git for --impact's staleness check)
 * @errors exit 1 with the problem list when a header is missing or malformed, an import breaks the layer direction, or the map is stale; a thrown Error for a bad config or an unknown mode
 */
// A shim, not a copy. The generator is ONE source — the template every project
// scaffolds from (`templates/typescript/template/scripts/code-map.mjs`) — and nana-pi
// runs that file, so the repo lives under the rule it ships. Not a symlink: a win32
// checkout does not keep one.
import { existsSync, realpathSync } from "node:fs";
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
import { checkoutDrift, dataPath, formatRuntime, hashFile, loadRuntime } from "../packages/nana-pack/lib/runtime-map.mjs";
import { NOTE_PREFIX } from "../packages/nana-pack/lib/runtime-map-config.mjs";

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
export function repoGraph() {
	const config = loadConfig(REPO_ROOT);
	return buildGraph(collectModules(REPO_ROOT, config), config);
}

/** The same repo-relative path each `--impact` argument resolves to inside the generator's own `main` (R-1272). */
function resolveImpactPaths(args, root) {
	const graph = repoGraph();
	return args.map((a) => {
		const rel = relative(root, resolve(a)).split(sep).join("/");
		return posix.normalize(existsSync(resolve(a)) || graph.modules.has(rel) ? rel : a);
	});
}

/**
 * The `--impact` runtime block (R-1272 to R-1274): the measured test files for each named path
 * when runtime data exists, else one note naming `npm run map:measure` (R-1273). Never changes
 * the generator's own exit code.
 */
function printRuntimeBlock(root, argv) {
	const file = dataPath(root, { env: process.env });
	const loaded = loadRuntime(file);
	process.stdout.write("\n");
	if (!loaded.ok) {
		process.stdout.write(`${NOTE_PREFIX} ${loaded.reason}; run npm run map:measure\n`);
		return;
	}
	const paths = resolveImpactPaths(argv.slice(1), root);
	const tracked = spawnSync("git", ["ls-files"], { cwd: root, encoding: "utf8" });
	const trackedFiles = tracked.status === 0 ? tracked.stdout.split("\n").filter(Boolean) : [];
	const drift = checkoutDrift(loaded.data, { tracked: trackedFiles, hashOf: (f) => hashFile(resolve(root, f)) });
	process.stdout.write(`${formatRuntime(loaded.data, paths, { drift })}\n`);
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
	const argv = process.argv.slice(2);
	const code = main(argv, REPO_ROOT);
	if ((argv[0] ?? "--write") === "--impact") printRuntimeBlock(REPO_ROOT, argv);
	process.exit(code);
}
