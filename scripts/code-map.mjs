#!/usr/bin/env node
/**
 * @module scripts/code-map.mjs
 * @purpose Run the project template's code-map generator over this repo, adding the measured test files to --impact, so nana-pi's own map is produced by the tool it ships (G-004, G-007, G-009, G-010, G-011).
 * @inputs argv (--write | --render | --check | --impact <file...>), code-map.config.json at the repo root, the modules under its roots, and for --impact, git and the runtime data file (NANA_RUNTIME_MAP_FILE override)
 * @outputs docs/code-map.md on --write, check findings, or impact callers, callees, freshness and measured test files
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
import { checkoutDrift, dataPath, formatFreshness, formatRuntime, hashFile, loadRuntime } from "../packages/nana-pack/lib/runtime-map.mjs";
import { MAIN_REF } from "../packages/nana-pack/lib/land-config.mjs";
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
export function repoGraph(root = REPO_ROOT) {
	const config = loadConfig(root);
	return buildGraph(collectModules(root, config), config);
}

/** The same repo-relative path each `--impact` argument resolves to inside the generator's own `main` (R-1272). */
function resolveImpactPaths(args, root) {
	const graph = repoGraph(root);
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

function printRuntimeBlock(root, argv) {
	process.stdout.write(runtimeBlock(root, argv));
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
	const argv = process.argv.slice(2);
	const code = main(argv, REPO_ROOT);
	if ((argv[0] ?? "--write") === "--impact") printRuntimeBlock(REPO_ROOT, argv);
	process.exit(code);
}
