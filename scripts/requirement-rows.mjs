#!/usr/bin/env node
/**
 * @module scripts/requirement-rows.mjs
 * @purpose List candidate requirement rows for files by joining the code map's test callers with the rail's markers.
 * @inputs An injected import graph, traced marker map, status and requirement-cell lookups, or CLI file arguments.
 * @outputs Direct and transitive-only candidate rows with an explicit uncertainty label.
 * @effects disk and process
 * @errors CLI exits nonzero when arguments or repo inputs are invalid.
 */
import { existsSync, readFileSync } from "node:fs";
import { posix, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { impact, repoGraph, REPO_ROOT } from "./code-map.mjs";
import { checkRepo } from "./requirements-trace.mjs";

/** Sort requirement ids by their numeric suffix, with a stable prefix tie-break. */
function compareIds(a, b) {
	const [, ap, an] = /^(\D+)-(\d+)$/.exec(a) ?? [];
	const [, bp, bn] = /^(\D+)-(\d+)$/.exec(b) ?? [];
	return (Number(an) - Number(bn)) || ap.localeCompare(bp);
}

/**
 * Render candidate rows using only supplied graph and rail data.
 * @param {{graph: object, traced: Map<string, string[]>, statusOf: Function, textOf: Function}} data
 * @param {string[]} paths repository-relative POSIX paths
 */
export function candidateRows({ graph, traced, statusOf, textOf }, paths) {
	const idsByTest = new Map();
	for (const [id, citations] of traced) {
		for (const citation of citations) {
			const split = citation.indexOf("::");
			if (split < 1) continue;
			const testPath = citation.slice(0, split);
			const ids = idsByTest.get(testPath) ?? new Set();
			ids.add(id);
			idsByTest.set(testPath, ids);
		}
	}
	const out = [];
	for (const file of paths) {
		const module = graph.modules.get(file);
		out.push(`${file}${module ? "" : "  [NOT A MAPPED MODULE]"}`);
		const directTests = new Set((module?.callers ?? []).filter((caller) => idsByTest.has(caller)));
		const transitiveTests = new Set(impact(graph, [file]).callers.filter((caller) => idsByTest.has(caller)));
		for (const caller of directTests) transitiveTests.delete(caller);
		const directIds = new Set([...directTests].flatMap((test) => [...(idsByTest.get(test) ?? [])]));
		const transitiveIds = new Set([...transitiveTests].flatMap((test) => [...(idsByTest.get(test) ?? [])]));
		for (const id of directIds) transitiveIds.delete(id);
		const orderedDirect = [...directIds].sort(compareIds);
		const orderedTransitive = [...transitiveIds].sort(compareIds);
		if (!directTests.size && !transitiveTests.size) {
			out.push("  unknown (not none)");
		} else {
			out.push(`  direct test files (${directTests.size}), rows (${orderedDirect.length}):`);
			for (const id of orderedDirect) out.push(`    ${id} ${statusOf(id)} ${textOf(id)}`);
			out.push(`  transitive-only test files (${transitiveTests.size}), rows (${orderedTransitive.length}):`);
			if (orderedTransitive.length) out.push(`    ${orderedTransitive.join(" ")}`);
		}
	}
	out.push(`Candidate lists are neither complete nor exact: any marked check in an importing test file can list a row without exercising this file; untested rows carry no marker and never appear (${statusOf()}); test modules that only spawn a process are not linked.`);
	return out.join("\n");
}

function cli(argv) {
	if (!argv.length) throw new Error("usage: npm run req:rows -- <file...>");
	const graph = repoGraph();
	const { requirements, traced, problems } = checkRepo();
	if (problems.length) throw new Error(`requirements trace failed: ${problems.join("; ")}`);
	const requirementsText = readFileSync(resolve(REPO_ROOT, "REQUIREMENTS.md"), "utf8");
	const statusOf = (id) => id === undefined
		? `${[...requirements.values()].filter((row) => row.status === "untested").length} untested rows`
		: requirements.get(id)?.status ?? "unknown";
	const textOf = (id) => requirementsText.match(new RegExp(`^\\|\\s*${id}\\s*\\|([^|]*)\\|`, "m"))?.[1]?.trim() ?? "unknown";
	const paths = argv.map((arg) => {
		const absolute = resolve(REPO_ROOT, arg);
		const rel = relative(REPO_ROOT, absolute);
		return posix.normalize(existsSync(absolute) || graph.modules.has(rel) ? rel : arg);
	});
	process.stdout.write(`${candidateRows({ graph, traced, statusOf, textOf }, paths)}\n`);
	return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
	try {
		process.exitCode = cli(process.argv.slice(2));
	} catch (error) {
		console.error(error instanceof Error ? error.message : String(error));
		process.exitCode = 1;
	}
}
