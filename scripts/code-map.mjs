#!/usr/bin/env node
/**
 * @module scripts/code-map.mjs
 * @purpose Run the project template's code-map generator over this repo, so nana-pi's own map is produced by the tool it ships (G-004, G-007, G-009, G-010, G-011).
 * @inputs argv (--write | --render | --check | --impact <file...>), code-map.config.json at the repo root, and the modules under its roots
 * @outputs docs/code-map.md on --write, the summary line plus problem list of --check, the transitive callers and callees of --impact
 * @effects disk (reads the config and the module sources, writes the map), process (exits non-zero when --check or --write finds a problem)
 * @errors exit 1 with the problem list when a header is missing or malformed, an import breaks the layer direction, or the map is stale; a thrown Error for a bad config or an unknown mode
 */
// A shim, not a copy. The generator is ONE source — the template every project
// scaffolds from (`templates/typescript/template/scripts/code-map.mjs`) — and nana-pi
// runs that file, so the repo lives under the rule it ships. Not a symlink: a win32
// checkout does not keep one.
import { realpathSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
	buildGraph,
	checkRepo as checkRepoAt,
	collectModules,
	formatImpact,
	impact,
	loadConfig,
	main,
	writeMap as writeMapAt,
} from "../templates/typescript/template/scripts/code-map.mjs";

/** This repo's root, resolved through symlinks, whatever the cwd. */
export const REPO_ROOT = resolve(
	dirname(realpathSync(fileURLToPath(import.meta.url))),
	"..",
);

export { buildGraph, collectModules, formatImpact, impact, loadConfig };

/** The whole map check over THIS repo. */
export const checkRepo = () => checkRepoAt(REPO_ROOT);

/** Rewrite docs/code-map.md from the code. */
export const writeMap = () => writeMapAt(REPO_ROOT);

/** The graph of this repo, for an impact walk. */
export function repoGraph() {
	const config = loadConfig(REPO_ROOT);
	return buildGraph(collectModules(REPO_ROOT, config), config);
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
	process.exit(main(process.argv.slice(2), REPO_ROOT));
}
