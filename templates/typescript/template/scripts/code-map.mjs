/**
 * @module scripts/code-map.mjs
 * @purpose Generate, check and query this project's code map from the import graph and the contract headers (G-004, G-007, G-009, G-010, G-011).
 * @inputs code-map.config.json at the project root, the module sources under its roots, and (for --check) the rendered map on disk
 * @outputs the rendered map written to disk, an --impact report on stdout, a --check problem list on stdout; the exported functions return plain data
 * @effects disk (reads the config and the module sources, writes the map), process (exits non-zero from --check as a CLI)
 * @errors a problem list naming each missing or malformed header, unlayered module, reverse or layer-skipping import, cross-package relative import, unresolved relative import, stale or drifted map entry; a thrown Error for a bad config or a bad CLI invocation
 */
// Dependency-free on purpose: regex over source, no TypeScript parser. The map is
// read by agents, so its whole value is that it is never out of date — which is
// what `--check` in the suite buys.
//
// Everything except loadConfig, collectModules, writeMap and main is pure over
// {path, source} records, so the graph, the renderer and the impact walk are
// testable on fixture sources with no filesystem.

import {
	existsSync,
	readdirSync,
	readFileSync,
	realpathSync,
	writeFileSync,
} from "node:fs";
import { dirname, join, posix, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * @typedef {object} Layer
 * @property {string} id
 * @property {string} title
 * @property {string} blurb
 * @property {string} match the path regex, as written in the config
 * @property {RegExp} re the compiled form of `match`
 */
/**
 * @typedef {object} Config
 * @property {string[]} roots the root paths, in declared order
 * @property {string[]} exemptRoots the roots declared `layerExempt` (or named in
 *   `testRoots`): a module under one of them may import any layer (G-007), and
 *   nothing below may import it
 * @property {{pattern: string, re: RegExp}[]} ignore the paths the map deliberately
 *   does not cover
 * @property {{path: string, reason: string}[]} exempt modules excused from the header
 *   rule, each with the reason — they stay in the map and keep their edges
 * @property {string[]} moduleExtensions
 * @property {string} mapPath
 * @property {string} runner the package-manager command the map tells a reader to run
 * @property {{id: string, prefix: string}[]} packages
 * @property {Layer[]} layers
 */
/**
 * @typedef {object} MappedModule
 * @property {string} path
 * @property {(Layer & {index: number}) | null} layer
 * @property {{id: string, prefix: string} | null} package
 * @property {Record<string, string> | null} header
 * @property {string | null} headerProblem
 * @property {string[]} callees
 * @property {string[]} callers
 * @property {string[]} external
 */
/**
 * @typedef {object} CodeGraph
 * @property {Map<string, MappedModule>} modules
 * @property {string[]} order
 * @property {string[]} problems
 * @property {Config} config
 */
/**
 * @typedef {object} ModuleImpact
 * @property {string} path
 * @property {boolean} known
 * @property {string[]} callers
 * @property {string[]} callees
 */

/** The fixed contract-header tags, in the order G-004 fixes them in. */
export const HEADER_TAGS = [
	"module",
	"purpose",
	"inputs",
	"outputs",
	"effects",
	"errors",
];

/** The closed side-effect vocabulary of G-004. A value may carry a parenthetical
 *  qualifier (`disk (browser sessionStorage)`); the leading word must be one of
 *  these, and `none` must stand alone. */
export const EFFECTS = ["none", "disk", "database", "network", "process"];

export const CONFIG_PATH = "code-map.config.json";

// ------------------------------------------------------------------- config

/** `roots`: each entry a path string, or an object with `path` and optional `layerExempt`. */
function parseRoots(entries, where) {
	const roots = [];
	const exemptRoots = [];
	for (const [i, entry] of entries.entries()) {
		if (typeof entry === "string" && entry) {
			roots.push(entry);
			continue;
		}
		if (typeof entry?.path !== "string" || !entry.path) {
			throw new Error(
				`${where}: roots[${i}] must be a path string or an object with a 'path'`,
			);
		}
		if (
			entry.layerExempt !== undefined &&
			typeof entry.layerExempt !== "boolean"
		)
			throw new Error(`${where}: roots[${i}] has a non-boolean 'layerExempt'`);
		roots.push(entry.path);
		if (entry.layerExempt) exemptRoots.push(entry.path);
	}
	return { roots, exemptRoots };
}

/** `testRoots` is shorthand for `layerExempt` on roots that hold tests. */
function applyTestRoots(raw, roots, exemptRoots, where) {
	if (raw === undefined) return;
	if (!Array.isArray(raw))
		throw new Error(`${where}: 'testRoots' must be an array of root paths`);
	for (const [i, entry] of raw.entries()) {
		if (typeof entry !== "string" || !roots.includes(entry))
			throw new Error(
				`${where}: testRoots[${i}] '${entry}' is not one of 'roots'`,
			);
		if (!exemptRoots.includes(entry)) exemptRoots.push(entry);
	}
}

/**
 * `exempt` is a list of `{path, reason}`. A missing reason is a --check problem, not a
 * parse error: the point is a readable failure that names the entry, not a crash.
 */
function parseExempt(raw, where) {
	if (raw === undefined) return [];
	if (!Array.isArray(raw)) {
		throw new Error(
			`${where}: 'exempt' must be an array of objects with a 'path' and a 'reason'`,
		);
	}
	return raw.map((entry, i) => {
		if (typeof entry?.path !== "string" || !entry.path) {
			throw new Error(
				`${where}: exempt[${i}] must be an object with a non-empty 'path'`,
			);
		}
		return {
			path: entry.path,
			reason: typeof entry.reason === "string" ? entry.reason.trim() : "",
		};
	});
}

/**
 * `ignore`: what sits under a root but is deliberately NOT part of the map — a
 * recorded fixture tree, a browser-only e2e suite. An entry is either a
 * project-relative path (a file, or a directory whose whole subtree is skipped) or
 * a double-star-slash prefixed glob, matched against any single path segment, where
 * `*` stays inside one segment. Nothing ignored is collected, and an import that resolves
 * under an ignored path is recorded as external rather than as a broken edge —
 * declaring a path outside the map is also declaring that importing it is allowed.
 */
function parseIgnore(raw, where) {
	if (raw === undefined) return [];
	if (!Array.isArray(raw) || raw.some((e) => typeof e !== "string" || !e)) {
		throw new Error(
			`${where}: 'ignore' must be an array of paths or '**/<name>' patterns`,
		);
	}
	return raw.map((pattern) => {
		const anySegment = pattern.startsWith("**/");
		const body = anySegment ? pattern.slice(3) : pattern;
		const escaped = body.replace(/[.*+?^${}()|[\]\\]/g, (c) =>
			c === "*" ? "[^/]*" : `\\${c}`,
		);
		return {
			pattern,
			re: new RegExp(`^${anySegment ? "(?:.*/)?" : ""}${escaped}(?:/.*)?$`),
		};
	});
}

/** True when a path is declared outside the map by `ignore`. */
export function isIgnored(config, path) {
	return (config.ignore ?? []).some((i) => i.re.test(path));
}

function parseLayers(raw, where) {
	return raw.map((l, i) => {
		for (const key of ["id", "title", "blurb", "match"]) {
			if (typeof l[key] !== "string" || !l[key])
				throw new Error(`${where}: layers[${i}] has no '${key}'`);
		}
		return { ...l, re: new RegExp(l.match) };
	});
}

/**
 * Read and validate code-map.config.json. Layer `match` is a regex over the module
 * path; first match wins, so order the layers from the top down.
 * @returns {Config}
 */
export function parseConfig(text, where = CONFIG_PATH) {
	let raw;
	try {
		raw = JSON.parse(text);
	} catch (err) {
		throw new Error(`${where}: not valid JSON (${err.message})`);
	}
	const need = (key, kind) => {
		const value = raw[key];
		const ok =
			kind === "array"
				? Array.isArray(value) && value.length > 0
				: typeof value === kind;
		if (!ok) throw new Error(`${where}: '${key}' must be a non-empty ${kind}`);
		return value;
	};
	const { roots, exemptRoots } = parseRoots(need("roots", "array"), where);
	applyTestRoots(raw.testRoots, roots, exemptRoots, where);
	return {
		roots,
		exemptRoots,
		ignore: parseIgnore(raw.ignore, where),
		exempt: parseExempt(raw.exempt, where),
		moduleExtensions: need("moduleExtensions", "array"),
		mapPath: need("mapPath", "string"),
		// the map names the command that regenerates it, so it has to be THIS project's
		runner:
			typeof raw.runner === "string" && raw.runner.trim()
				? raw.runner.trim()
				: "pnpm",
		packages: need("packages", "array"),
		layers: parseLayers(need("layers", "array"), where),
	};
}

/** @returns {Config} */
export function loadConfig(root) {
	const file = join(root, CONFIG_PATH);
	if (!existsSync(file))
		throw new Error(`${CONFIG_PATH} not found at the project root`);
	return parseConfig(readFileSync(file, "utf8"));
}

// -------------------------------------------------------- the contract header

const TAG_LINE = /^\s*\*\s*@([a-zA-Z]+)\s*(.*)$/;
const CONTINUATION = /^\s*\*\s*(?!@)(.*)$/;

/** Split a comma list, ignoring commas inside a parenthetical qualifier. */
export function splitTopLevel(value) {
	const parts = [];
	let depth = 0;
	let current = "";
	for (const ch of value) {
		if (ch === "(") depth += 1;
		else if (ch === ")") depth = Math.max(0, depth - 1);
		if (ch === "," && depth === 0) {
			parts.push(current.trim());
			current = "";
			continue;
		}
		current += ch;
	}
	if (current.trim()) parts.push(current.trim());
	return parts.filter(Boolean);
}

function checkEffects(value) {
	const words = [];
	for (const item of splitTopLevel(value)) {
		const word = item.split(/[\s(]/)[0];
		if (!EFFECTS.includes(word))
			return `@effects '${item}' is not one of ${EFFECTS.join(" | ")}`;
		words.push(word);
	}
	if (words.includes("none") && words.length > 1) {
		return `@effects says 'none' alongside ${words.filter((w) => w !== "none").join(", ")}`;
	}
	return null;
}

/** Where the `/**` block starts, or a problem naming why there is none. */
function headerStart(lines) {
	let i = 0;
	if (lines[i]?.startsWith("#!")) i += 1; // a CLI shebang may precede the block
	while (i < lines.length && lines[i].trim() === "") i += 1;
	if (lines[i]?.trim() !== "/**") {
		return {
			problem: "no contract header: the module must open with a /** block",
		};
	}
	if (!lines.slice(i + 1).some((l) => l.trim().endsWith("*/"))) {
		return { problem: "the contract header block is never closed" };
	}
	return { start: i + 1 };
}

/** Read the tag lines of the block, merging continuation lines into the tag above. */
function collectTags(lines, start) {
	const order = [];
	const fields = {};
	let current = null;
	for (let i = start; i < lines.length; i += 1) {
		const line = lines[i];
		if (line.trim() === "*/" || line.trim().endsWith("*/"))
			return { order, fields };
		const tag = TAG_LINE.exec(line);
		if (tag) {
			const [, name, rest] = tag;
			if (fields[name] !== undefined)
				return {
					order,
					fields,
					problem: `duplicate @${name} in the contract header`,
				};
			order.push(name);
			fields[name] = rest.trim();
			current = name;
			continue;
		}
		const cont = CONTINUATION.exec(line);
		if (cont && current) {
			const text = cont[1].trim();
			if (text) fields[current] = `${fields[current]} ${text}`.trim();
			continue;
		}
		return {
			order,
			fields,
			problem: `malformed contract header at line ${i + 1}: ${line.trim()}`,
		};
	}
	return {
		order,
		fields,
		problem: "the contract header block is never closed",
	};
}

/** The six tags, present, non-empty, in order, nothing else — or a problem. */
function tagProblem(order, fields) {
	for (const tag of HEADER_TAGS) {
		if (fields[tag] === undefined) return `the contract header has no @${tag}`;
		if (fields[tag] === "") return `the contract header's @${tag} is empty`;
	}
	const want = HEADER_TAGS.join(",");
	const got = order.filter((t) => HEADER_TAGS.includes(t)).join(",");
	if (got !== want)
		return `the contract header's tags are out of order: ${got} (expected ${want})`;
	const extra = order.filter((t) => !HEADER_TAGS.includes(t));
	if (extra.length) {
		return `the contract header carries unknown tag(s): ${extra.map((t) => `@${t}`).join(", ")}`;
	}
	const badEffects = checkEffects(fields.effects);
	if (badEffects) return badEffects;
	if (/[.!?]\s+\S/.test(fields.purpose)) {
		return "@purpose is more than one sentence (G-008: one purpose, one sentence)";
	}
	return null;
}

/**
 * Parse the contract block at the top of a module.
 * @returns {{ok: true, fields: Record<string, string>} | {ok: false, problem: string}}
 */
export function parseContractHeader(source) {
	const lines = source.split("\n");
	const opened = headerStart(lines);
	if (opened.problem !== undefined)
		return { ok: false, problem: opened.problem };
	const { order, fields, problem } = collectTags(lines, opened.start);
	const bad = problem ?? tagProblem(order, fields);
	return bad === null || bad === undefined
		? { ok: true, fields }
		: { ok: false, problem: bad };
}

// ----------------------------------------------------------------- the graph

// Static `from '...'`, bare side-effect `import '...'`, and dynamic `import('...')`.
const STATIC_FROM = /\bfrom\s*(['"])(\.[^'"]*)\1/g;
const BARE_IMPORT = /^\s*import\s*(['"])(\.[^'"]*)\1/gm;
const DYNAMIC = /\bimport\s*\(\s*(['"])(\.[^'"]*)\1\s*\)/g;

/** Every relative specifier a module names, deduplicated, in source order. */
export function parseRelativeImports(source) {
	const found = [];
	for (const re of [STATIC_FROM, BARE_IMPORT, DYNAMIC]) {
		re.lastIndex = 0;
		for (let m = re.exec(source); m; m = re.exec(source)) found.push(m[2]);
	}
	return [...new Set(found)];
}

/** The source extension a NodeNext import spelling stands for (`./a.js` -> `.ts`). */
const SPELLINGS = {
	".js": ".ts",
	".jsx": ".tsx",
	".mjs": ".mts",
	".cjs": ".cts",
};

/** A relative specifier, resolved against the importing module's path. NodeNext
 *  spells a `.ts` import `.js`, so both spellings resolve to the source file. */
export function resolveImport(fromPath, spec, known = new Set()) {
	const target = posix.normalize(posix.join(posix.dirname(fromPath), spec));
	if (known.has(target)) return target;
	for (const [from, to] of Object.entries(SPELLINGS)) {
		if (
			target.endsWith(from) &&
			known.has(target.slice(0, -from.length) + to)
		) {
			return target.slice(0, -from.length) + to;
		}
	}
	return target;
}

export function layerOf(config, path) {
	const index = config.layers.findIndex((l) => l.re.test(path));
	return index === -1 ? null : { index, ...config.layers[index] };
}

export function packageOf(config, path) {
	return config.packages.find((p) => path.startsWith(p.prefix)) ?? null;
}

export function isModulePath(config, path) {
	return config.moduleExtensions.some((e) => path.endsWith(e));
}

/** True when a specifier LOOKS like a module even if it resolves to nothing: a
 *  dangling `./gone.js` is a broken edge, not a `.css` asset. */
export function isModuleSpecifier(config, path) {
	if (isModulePath(config, path)) return true;
	return Object.entries(SPELLINGS).some(
		([spelling, source]) =>
			path.endsWith(spelling) && config.moduleExtensions.includes(source),
	);
}

/** True when a path sits under a root declared `layerExempt`. */
export function isLayerExempt(config, path) {
	return (config.exemptRoots ?? []).some(
		(root) => path === root || path.startsWith(`${root}/`),
	);
}

function layerProblem(config, mod, target, targetMod) {
	const a = mod.layer?.index;
	const b = targetMod.layer?.index;
	if (a == null || b == null) return null;
	if (isLayerExempt(config, mod.path)) return null; // G-007: a test may import anything
	if (b < a)
		return `${mod.path}: imports ${target} against the layer direction (${mod.layer.id} -> ${targetMod.layer.id})`;
	if (b > a + 1) {
		// A skip is not harmless: it is the layer in between losing its claim to
		// be the only way through — which is how a contract surface acquires a
		// second, unnamed entrance.
		const skipped = config.layers
			.slice(a + 1, b)
			.map((l) => l.id)
			.join(", ");
		return `${mod.path}: imports ${target} SKIPPING a layer (${mod.layer.id} -> ${targetMod.layer.id}, past ${skipped})`;
	}
	return null;
}

/**
 * Build the graph over `[{path, source}]`.
 * @param {{path: string, source: string}[]} sources
 * @param {Config} config
 * @returns {CodeGraph}
 */
/** The declared reason this module is excused from the header rule, or null. */
export function exemptReason(config, path) {
	return (config.exempt ?? []).find((e) => e.path === path)?.reason ?? null;
}

function makeModule(config, path, source, problems) {
	const layer = layerOf(config, path);
	if (!layer)
		problems.push(
			`${path}: no declared layer covers this module (${CONFIG_PATH} layers)`,
		);
	const excused = exemptReason(config, path);
	if (excused !== null) {
		// declared exempt: no header is read and none is demanded
		return {
			path,
			layer,
			package: packageOf(config, path),
			header: null,
			headerProblem: null,
			exemptReason: excused,
			callees: [],
			callers: [],
			external: [],
		};
	}
	const header = parseContractHeader(source);
	if (!header.ok) problems.push(`${path}: ${header.problem}`);
	else if (header.fields.module !== path) {
		problems.push(
			`${path}: the header's @module says '${header.fields.module}'`,
		);
	}
	return {
		path,
		layer,
		package: packageOf(config, path),
		header: header.ok ? header.fields : null,
		headerProblem: header.ok ? null : header.problem,
		exemptReason: null,
		callees: [],
		callers: [],
		external: [],
	};
}

/** One module's relative imports, as edges plus the problems they raise. */
function linkOne(config, modules, known, path, source, problems) {
	const mod = modules.get(path);
	for (const spec of parseRelativeImports(source)) {
		const target = resolveImport(path, spec, known);
		if (!known.has(target)) {
			if (isModuleSpecifier(config, target) && !isIgnored(config, target)) {
				problems.push(
					`${path}: relative import '${spec}' resolves to ${target}, which is not a mapped module`,
				);
			} else mod.external.push(target);
			continue;
		}
		const targetMod = modules.get(target);
		mod.callees.push(target);
		targetMod.callers.push(path);
		if (mod.package?.id !== targetMod.package?.id) {
			const edge = `${mod.package?.id} / ${targetMod.package?.id}`;
			problems.push(
				`${path}: relative import '${spec}' crosses the ${edge} package boundary`,
			);
		}
		const bad = layerProblem(config, mod, target, targetMod);
		if (bad) problems.push(bad);
	}
}

/** An exemption has to name a real module and say why, or it is a way to hide one. */
function exemptProblems(config, known) {
	const problems = [];
	for (const entry of config.exempt ?? []) {
		if (!known.has(entry.path)) {
			problems.push(
				`${CONFIG_PATH}: exempt path '${entry.path}' is not a module under ${config.roots.join(", ")}`,
			);
		}
		if (!entry.reason)
			problems.push(
				`${CONFIG_PATH}: exempt path '${entry.path}' has no reason`,
			);
	}
	return problems;
}

export function buildGraph(sources, config) {
	const modules = new Map();
	const problems = [];
	const byPath = new Map(sources.map((s) => [s.path, s.source]));
	const order = [...byPath.keys()].sort();
	const known = new Set(order);
	problems.push(...exemptProblems(config, known));
	for (const path of order)
		modules.set(path, makeModule(config, path, byPath.get(path), problems));
	for (const path of order)
		linkOne(config, modules, known, path, byPath.get(path), problems);
	for (const mod of modules.values()) {
		mod.callees = [...new Set(mod.callees)].sort();
		mod.callers = [...new Set(mod.callers)].sort();
		mod.external = [...new Set(mod.external)].sort();
	}
	return { modules, order, problems, config };
}

// ---------------------------------------------------------------- the impact

function walk(modules, start, edge) {
	const seen = new Set();
	const queue = [...(modules.get(start)?.[edge] ?? [])];
	while (queue.length) {
		const next = queue.shift();
		if (seen.has(next)) continue;
		seen.add(next);
		for (const n of modules.get(next)?.[edge] ?? [])
			if (!seen.has(n)) queue.push(n);
	}
	seen.delete(start);
	return [...seen].sort();
}

/**
 * The blast radius of a change (G-011): transitive callers and callees per path.
 * @param {CodeGraph} graph
 * @param {string[]} paths
 * @returns {{per: ModuleImpact[], callers: string[], callees: string[]}}
 */
export function impact(graph, paths) {
	const per = paths.map((path) => ({
		path,
		known: graph.modules.has(path),
		callers: walk(graph.modules, path, "callers"),
		callees: walk(graph.modules, path, "callees"),
	}));
	const union = (key) =>
		[...new Set(per.flatMap((p) => p[key]))]
			.filter((p) => !paths.includes(p))
			.sort();
	return { per, callers: union("callers"), callees: union("callees") };
}

export function formatImpact(graph, paths) {
	const r = impact(graph, paths);
	const out = [];
	for (const p of r.per) {
		out.push(`${p.path}${p.known ? "" : "  [NOT A MAPPED MODULE]"}`);
		out.push(
			`  transitive callers (${p.callers.length}): ${p.callers.join(" ") || "—"}`,
		);
		out.push(
			`  transitive callees (${p.callees.length}): ${p.callees.join(" ") || "—"}`,
		);
	}
	if (paths.length > 1) {
		out.push("");
		out.push(
			`blast radius: ${r.callers.length} upstream, ${r.callees.length} downstream`,
		);
	}
	return out.join("\n");
}

// --------------------------------------------------------------- the renderer

const refs = (list) =>
	list.length ? list.map((p) => `\`${p}\``).join(", ") : "—";

/**
 * The map, as markdown. Deterministic: no timestamps and nothing machine-dependent,
 * so a regenerated map is byte-identical until the code changes.
 * @param {CodeGraph} graph
 */
export function renderMap(graph) {
	const { config } = graph;
	const out = [
		"# Code map",
		"",
		`Generated — do not edit. \`${config.runner} map\` rewrites it from the import graph and the`,
		`contract header at the top of each module; \`${config.runner} map:check\` fails when this file`,
		`and the code disagree (G-009, G-010). \`${config.runner} map:impact -- <file...>\` prints a`,
		"change's transitive callers and callees (G-011).",
		"",
		`Covers \`${config.roots.join("`, `")}\` — ${graph.order.length} modules, as declared in`,
		`\`${CONFIG_PATH}\`.`,
		"",
		"**Layer direction** (G-007): a module may import from its own layer or the one",
		"directly after it, never an earlier one and never skipping one.",
		"",
		`**Effects vocabulary** (G-004): \`${EFFECTS.join("` · `")}\`, with an optional`,
		"parenthetical qualifier. Rendering into the DOM is an *output*, not an effect;",
		"browser `localStorage` and `sessionStorage` count as `disk`.",
		"",
	];
	for (const [i, layer] of config.layers.entries())
		out.push(`${i + 1}. **${layer.title}** — ${layer.blurb}`);
	out.push("");
	for (const layer of config.layers) {
		const members = graph.order.filter(
			(p) => graph.modules.get(p).layer?.id === layer.id,
		);
		out.push(`## ${layer.title}`, "", layer.blurb, "");
		if (!members.length) {
			out.push("_No modules._", "");
			continue;
		}
		for (const path of members) {
			const m = graph.modules.get(path);
			out.push(`### \`${path}\``, "");
			if (m.exemptReason) {
				out.push(`- **exempt** — ${m.exemptReason}`);
				out.push(`- **callers** — ${refs(m.callers)}`);
				out.push(`- **callees** — ${refs(m.callees)}`);
				out.push("");
				continue;
			}
			if (!m.header) {
				out.push(`- **header** — MISSING OR MALFORMED: ${m.headerProblem}`, "");
				continue;
			}
			out.push(`- **purpose** — ${m.header.purpose}`);
			out.push(`- **inputs** — ${m.header.inputs}`);
			out.push(`- **outputs** — ${m.header.outputs}`);
			out.push(`- **effects** — ${m.header.effects}`);
			out.push(`- **errors** — ${m.header.errors}`);
			out.push(`- **callers** — ${refs(m.callers)}`);
			out.push(`- **callees** — ${refs(m.callees)}`);
			out.push("");
		}
	}
	return `${out.join("\n").replace(/\n+$/, "")}\n`;
}

/** The ``### `path` `` headings the rendered map on disk carries. */
export function mapEntries(markdown) {
	return [...markdown.matchAll(/^### `([^`]+)`$/gm)].map((m) => m[1]);
}

// ------------------------------------------------------------------- the fs

/**
 * Every module under the configured roots, as `[{path, source}]` sorted by path.
 * @param {string} root
 * @param {Config} config
 * @returns {{path: string, source: string}[]}
 */
export function collectModules(root, config) {
	const found = [];
	const walkDir = (dir) => {
		const entries = readdirSync(join(root, dir), { withFileTypes: true });
		for (const entry of entries.sort((a, b) => (a.name < b.name ? -1 : 1))) {
			const rel = posix.join(dir, entry.name);
			if (isIgnored(config, rel)) continue;
			if (entry.isDirectory()) {
				if (entry.name === "node_modules" || entry.name.startsWith("."))
					continue;
				walkDir(rel);
			} else if (isModulePath(config, entry.name)) {
				found.push({
					path: rel,
					source: readFileSync(join(root, rel), "utf8"),
				});
			}
		}
	};
	for (const r of config.roots)
		if (!isIgnored(config, r) && existsSync(join(root, r))) walkDir(r);
	return found.sort((a, b) => (a.path < b.path ? -1 : 1));
}

/**
 * The whole check (G-010): header problems, graph problems, and whether the map
 * on disk is the one this code renders.
 * @returns {{graph: CodeGraph, markdown: string, problems: string[], line: string}}
 */
export function checkRepo(root) {
	const config = loadConfig(root);
	const graph = buildGraph(collectModules(root, config), config);
	const markdown = renderMap(graph);
	const problems = [...graph.problems];
	const mapFile = join(root, config.mapPath);
	if (!existsSync(mapFile)) {
		problems.push(
			`${config.mapPath} does not exist; run '${config.runner} map'`,
		);
	} else {
		const onDisk = readFileSync(mapFile, "utf8");
		const listed = new Set(mapEntries(onDisk));
		for (const path of graph.order) {
			if (!listed.has(path))
				problems.push(
					`${path} has no entry in ${config.mapPath}; run '${config.runner} map'`,
				);
		}
		for (const path of listed) {
			if (!graph.modules.has(path)) {
				problems.push(
					`${config.mapPath} lists ${path}, which is not a module under ${config.roots.join(", ")}`,
				);
			}
		}
		if (onDisk !== markdown)
			problems.push(
				`${config.mapPath} is stale against the code; run '${config.runner} map'`,
			);
	}
	const headerless = graph.order.filter(
		(p) => !graph.modules.get(p).header && !graph.modules.get(p).exemptReason,
	).length;
	const excused = graph.order.filter(
		(p) => graph.modules.get(p).exemptReason,
	).length;
	const line = `code map: ${graph.order.length} modules over ${config.roots.join(", ")}; ${headerless} without a usable contract header; ${excused ? `${excused} exempt; ` : ""}${problems.length} problem(s)`;
	return { graph, markdown, problems, line };
}

export function writeMap(root) {
	const config = loadConfig(root);
	const graph = buildGraph(collectModules(root, config), config);
	const markdown = renderMap(graph);
	writeFileSync(join(root, config.mapPath), markdown);
	return { graph, markdown, config };
}

// ------------------------------------------------------------------- the CLI

/** The project root: this file's parent's parent, resolved through symlinks. */
export const PROJECT_ROOT = resolve(
	dirname(realpathSync(fileURLToPath(import.meta.url))),
	"..",
);

/**
 * The CLI, over any project root — a repo that vendors this generator as a shim
 * passes its own root, so there is one implementation of the command.
 */
export function main(argv, root = PROJECT_ROOT) {
	const mode = argv[0] ?? "--write";
	if (mode === "--impact") {
		const config = loadConfig(root);
		const graph = buildGraph(collectModules(root, config), config);
		const paths = argv.slice(1).map((a) => {
			const rel = relative(root, resolve(a));
			return posix.normalize(
				existsSync(resolve(a)) || graph.modules.has(rel) ? rel : a,
			);
		});
		if (!paths.length)
			throw new Error("usage: node scripts/code-map.mjs --impact <file...>");
		process.stdout.write(`${formatImpact(graph, paths)}\n`);
		return 0;
	}
	if (mode === "--check") {
		const { problems, line } = checkRepo(root);
		process.stdout.write(`${line}\n`);
		for (const p of problems) process.stdout.write(`  ${p}\n`);
		return problems.length ? 1 : 0;
	}
	if (mode === "--write" || mode === "--render") {
		const { graph, config } = writeMap(root);
		process.stdout.write(`${config.mapPath}: ${graph.order.length} modules\n`);
		for (const p of graph.problems) process.stdout.write(`  ${p}\n`);
		return graph.problems.length ? 1 : 0;
	}
	throw new Error(
		`unknown mode '${mode}' (expected --write, --check or --impact)`,
	);
}

const invokedDirectly =
	process.argv[1] &&
	existsSync(process.argv[1]) &&
	realpathSync(process.argv[1]) ===
		realpathSync(fileURLToPath(import.meta.url));
if (invokedDirectly) process.exit(main(process.argv.slice(2)));
