#!/usr/bin/env node
/**
 * @module scripts/lane-class.mjs
 * @purpose Classify changed or planned paths as ordinary or install, hook or gate using AGENTS.md:94 and one mapped import hop.
 * @inputs argv (--root <dir> --base <rev> | --files <comma-list>); git changed paths and code map.
 * @outputs One class line naming the first trigger and optional also-reaches lines.
 * @effects process (read-only git when --files is absent).
 * @errors exit 2 for usage; exit 1 for git or map failures.
 */
import { existsSync, realpathSync } from "node:fs";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { collectChangedPaths } from "./blast-radius.mjs";
import { repoGraph } from "./code-map.mjs";
import { defaultGit } from "./requirements-moved.mjs";
import { CLASS_PATHS, LAUNCHED_CLIS, LANE_CLASS_BASE } from "../packages/nana-pack/lib/lane-class-config.mjs";

const cmp = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const norm = (value) => value.replace(/\\/g, "/").replace(/^(\.\/)+/, "").replace(/^\.\//, "");
function usage() {
	console.error("Usage: lane-class.mjs --root <dir> [--base <rev> | --files <comma-list>]");
	return 2;
}
function parse(argv) {
	const args = {};
	if (argv.length % 2) return null;
	for (let i = 0; i < argv.length; i += 2) {
		if (!["--root", "--base", "--files"].includes(argv[i]) || args[argv[i]] !== undefined) return null;
		args[argv[i]] = argv[i + 1];
	}
	if (!args["--root"] || (args["--base"] && args["--files"])) return null;
	return args;
}
function extensionDirs(root) {
	const dirs = [];
	for (const manifest of ["package.json", "packages/nana-stage/package.json"]) {
		const parsed = JSON.parse(readFileSync(resolve(root, manifest), "utf8"));
		for (const item of parsed.pi?.extensions ?? []) dirs.push(norm(resolve(root, manifest === "package.json" ? item : resolve("packages/nana-stage", item)).slice(root.length + 1).replace(/\\/g, "/")));
	}
	return dirs;
}
function classify(paths, root) {
	const changed = [...new Set(paths.map(norm))].sort(cmp);
	for (const path of changed) {
		if (LAUNCHED_CLIS.includes(path)) return { kind: "hook", line: `hook: ${path} — launched CLI`, changed };
		const rule = CLASS_PATHS.find(({ prefix }) => path.startsWith(prefix));
		if (rule) return { kind: rule.kind, line: `${rule.kind}: ${path} — ${rule.why}`, changed };
	}
	const graph = repoGraph(root);
	const extDirs = extensionDirs(root);
	const entryPaths = new Set([
		...[...graph.modules.keys()].filter((p) => extDirs.some((d) => p.startsWith(`${d}/`))),
		...[...graph.modules.keys()].filter((p) => p.startsWith("packages/nana-setup/claude/hooks/")),
		...LAUNCHED_CLIS,
	]);
	const toolRoots = [...graph.modules.keys()].filter((p) => CLASS_PATHS.some((r) => / tool$/.test(r.why) && p === r.prefix));
	const direct = [];
	const also = [];
	for (const path of changed) {
		const callers = [...graph.modules.values()].filter((module) => module.callees.includes(path) && !module.path.includes("/tests/") && !module.path.endsWith(".test.mjs")).map((module) => module.path).sort(cmp);
		const starters = callers.filter((p) => entryPaths.has(p));
		if (starters.length) direct.push({ path, importer: starters[0], kind: "hook" });
		const toolCallers = callers.filter((p) => toolRoots.includes(p));
		if (toolCallers.length && callers.every((p) => toolRoots.includes(p))) direct.push({ path, importer: toolCallers[0], kind: "gate" });
		else if (toolCallers.length) also.push(`${path} — also reaches ${toolCallers[0]}`);
	}
	if (direct.length) {
		direct.sort((a, b) => cmp(a.path, b.path) || cmp(a.importer, b.importer));
		const first = direct[0];
		return { kind: first.kind, line: `${first.kind}: ${first.path} — directly imported by ${first.importer}`, changed, also };
	}
	const deepReach = [];
	const visit = (start, here, seen, depth) => {
		if (seen.has(here)) return;
		seen.add(here);
		const module = graph.modules.get(here);
		if (!module) return;
		for (const child of module.callees) {
			if (changed.includes(child) && depth > 0) deepReach.push(`${child} — also reaches ${start}`);
			visit(start, child, seen, depth + 1);
		}
	};
	for (const start of [...entryPaths, ...toolRoots]) visit(start, start, new Set(), 0);
	const lines = [...new Set([...(also ?? []), ...deepReach])].sort(cmp);
	return { kind: "ordinary", line: "ordinary", changed, also: lines };
}

export function main(argv, git = defaultGit) {
	const args = parse(argv);
	if (!args) return usage();
	const root = resolve(args["--root"]);
	let paths;
	if (args["--files"] !== undefined) paths = args["--files"].split(",").filter(Boolean);
	else {
		const result = collectChangedPaths(root, args["--base"] ?? LANE_CLASS_BASE, git);
		if (result.error) { console.error(result.error); return 1; }
		paths = result.paths;
	}
	try {
		const result = classify(paths, root);
		console.log(result.line);
		for (const line of result.also ?? []) console.log(`also reaches: ${line}`);
		return 0;
	} catch (error) {
		console.error(`lane-class: ${error.message}`);
		return 1;
	}
}
if (process.argv[1] && existsSync(process.argv[1]) && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
	process.exit(main(process.argv.slice(2)));
}
