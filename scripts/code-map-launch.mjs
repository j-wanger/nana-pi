/**
 * @module scripts/code-map-launch.mjs
 * @purpose Add repo bin and script launch links to nana-pi's template-generated graph.
 * @inputs A code graph and its path/source records.
 * @outputs The same graph with reciprocal, sorted caller/callee launch edges.
 * @effects none
 * @errors none; ambiguous basenames and unmapped targets are left unlinked.
 */
import { posix } from "node:path";

// Read balanced call arguments, retaining string literals but not interpreting them.
function callEnd(source, start) {
	let depth = 1, quote = null;
	for (let i = start; i < source.length; i++) {
		const c = source[i];
		if (quote) {
			if (c === "\\") i++;
			else if (c === quote) quote = null;
		} else if (c === '"' || c === "'" || c === "`") quote = c;
		else if (c === "(") depth++;
		else if (c === ")" && --depth === 0) return i;
	}
	return source.length;
}

function launchExpressions(source) {
	const assignments = new Map([...source.matchAll(/\b(?:const|let|var)\s+([\w$]+)\s*=\s*([^;]+);/g)].map((m) => [m[1], m[2]]));
	const expressions = [], seen = new Set();
	for (const call of source.matchAll(/\b(?:spawn|spawnSync|exec|execSync|execFile|execFileSync|fork|boundedSpawnSync|runHookProducer)\s*\(/g)) {
		const start = call.index + call[0].length;
		expressions.push(source.slice(start, callEnd(source, start)));
	}
	// Follow named path constants (CLI = new URL(...), then spawn(..., [CLI])).
	for (let i = 0; i < expressions.length; i++) {
		const identifiers = expressions[i].replace(/(["'`])(?:\\.|(?!\1)[^\\])*?\1/g, " ").match(/[A-Za-z_$][\w$]*/g) ?? [];
		for (const name of identifiers) {
			if (seen.has(name) || !assignments.has(name)) continue;
			seen.add(name); expressions.push(assignments.get(name));
		}
	}
	return expressions.join("\n");
}

/** Raw-source hints limited to launch arguments and their constants, not every named file in a launcher. */
export function addLaunchLinks(graph, sources) {
	const targets = graph.order.filter((p) => /(?:^scripts\/|\/bin\/)/.test(p));
	const byName = new Map();
	for (const p of targets) {
		const name = posix.basename(p);
		byName.set(name, [...(byName.get(name) ?? []), p]);
	}
	for (const { path, source } of sources) {
		for (const match of launchExpressions(source).matchAll(/(["'`])([^"'`\r\n]+)\1/g)) {
			const literal = match[2].replace(/\\\\/g, "/");
			if (literal.includes("${")) continue;
			const relative = posix.normalize(posix.join(posix.dirname(path), literal));
			const rooted = posix.normalize(literal.replace(/^\.\//, ""));
			let target = targets.includes(relative) ? relative : targets.includes(rooted) ? rooted : null;
			// join(root, "bin", "tool.mjs") and a URL stored in CLI before spawn.
			if (!target && !literal.includes("/")) {
				const candidates = byName.get(literal) ?? [];
				if (candidates.length === 1) target = candidates[0];
			}
			if (!target || target === path) continue;
			const from = graph.modules.get(path), to = graph.modules.get(target);
			if (!from || !to) continue;
			from.callees = [...new Set([...from.callees, target])].sort();
			to.callers = [...new Set([...to.callers, path])].sort();
		}
	}
	return graph;
}
