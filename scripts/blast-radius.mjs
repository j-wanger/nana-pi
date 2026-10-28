#!/usr/bin/env node
/**
 * @module scripts/blast-radius.mjs
 * @purpose Draw a change's blast radius as one self-contained HTML page, from the code map and the git-diffed changed set against the merge base, with no script, no external reference and no machine-specific content.
 * @inputs argv (--root <dir> --base <rev> --out <file>); the code map's config, modules and graph through scripts/code-map.mjs; working-tree git state read through the injected git runner (default scripts/requirements-moved.mjs's defaultGit)
 * @outputs the HTML page written to <file>; one stdout line naming the per-column counts, the unmapped count and the out path
 * @effects disk (reads module sources and code-map.config.json through the shim, creates the out file's folder and writes the page), process (runs read-only git commands: merge-base, diff, ls-files)
 * @errors exit 2 for a usage error, naming --root, --base and --out; exit 1 for an unresolvable revision or no merge base, naming the cause, writing nothing
 */
// Plan of record: docs/reviews/blast-radius-2026-10-19/must-meet.md, rows R-1550 to R-1557.
// Graph facts come ONLY from loadConfig, collectModules, buildGraph, impact, isLayerExempt and
// untracedTests, all through the scripts/code-map.mjs shim — this command infers no node or
// edge the map itself does not already carry. The git runner is requirements-moved.mjs's own
// exported defaultGit, imported by name rather than a second buffer constant.
import { existsSync, mkdirSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
	buildGraph,
	collectModules,
	impact,
	isLayerExempt,
	loadConfig,
	untracedTests,
} from "./code-map.mjs";
import { defaultGit } from "./requirements-moved.mjs";
import {
	BG_DARK,
	BG_LIGHT,
	CHAR_WIDTH,
	COLUMN_COLORS_DARK,
	COLUMN_COLORS_LIGHT,
	COLUMN_GUTTER,
	COLUMN_IDS,
	COLUMN_TITLES,
	DATA_COLUMN_ATTR,
	DATA_FROM_ATTR,
	DATA_NO_LINKED_TEST_ATTR,
	DATA_PATH_ATTR,
	DATA_TO_ATTR,
	DATA_UNMAPPED_ATTR,
	EDGE_DARK,
	EDGE_LIGHT,
	FONT_SIZE,
	HEADING_GAP,
	MARGIN,
	MIN_NODE_WIDTH,
	NODE_H_PADDING,
	NODE_HEIGHT,
	NO_LINKED_TEST_COLOR_DARK,
	NO_LINKED_TEST_COLOR_LIGHT,
	NO_LINKED_TEST_LABEL,
	ROW_GAP,
	TEXT_DARK,
	TEXT_LIGHT,
	UNMAPPED_HEADING,
} from "../packages/nana-pack/lib/blast-radius-config.mjs";

const byPath = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

function usage() {
	console.error("Usage: blast-radius.mjs --root <dir> --base <rev> --out <file>");
	return 2;
}

function parseArgs(argv) {
	let root = null;
	let base = null;
	let out = null;
	if (argv.length % 2 !== 0) return null;
	for (let i = 0; i < argv.length; i += 2) {
		const flag = argv[i];
		const value = argv[i + 1];
		if (flag === "--root" && value !== undefined) root = value;
		else if (flag === "--base" && value !== undefined) base = value;
		else if (flag === "--out" && value !== undefined) out = value;
		else return null;
	}
	if (!root || !base || !out) return null;
	return { root, base, out };
}

/** A NUL-separated `git ... -z` stdout, split into its non-empty entries. */
function parseZList(stdout) {
	return stdout.split("\0").filter(Boolean);
}

/** True when `path` carries one of the map's declared module extensions — the same test
 *  isModulePath makes, read directly off the config rather than through the shim, which
 *  re-exports only loadConfig, collectModules, buildGraph, impact, isLayerExempt and
 *  untracedTests (must-meet.md's Graph design). */
function hasModuleExtension(config, path) {
	return config.moduleExtensions.some((ext) => path.endsWith(ext));
}

/**
 * The blast-radius model over a graph and a raw changed-path list (R-1550 to R-1555): which
 * node sits in which column, which edges are drawn, which changed files the map does not hold,
 * and which changed modules carry no linked test. Pure over `graph` and `changedPaths` — it
 * reads nothing else.
 * @param {import("./code-map.mjs").CodeGraph} graph
 * @param {string[]} changedPaths
 */
export function blastModel(graph, changedPaths) {
	const config = graph.config;
	const changedSet = new Set(changedPaths);
	const changedMapped = [...changedSet].filter((p) => graph.modules.has(p)).sort(byPath);
	const unmapped = [...changedSet]
		.filter((p) => !graph.modules.has(p) && hasModuleExtension(config, p))
		.sort(byPath);

	const radius = impact(graph, changedMapped);
	const callerSet = new Set(radius.callers);
	const downstream = radius.callees.filter((p) => !callerSet.has(p)).sort(byPath);

	const tests = [];
	const upstream = [];
	for (const p of radius.callers) (isLayerExempt(config, p) ? tests : upstream).push(p);
	tests.sort(byPath);
	upstream.sort(byPath);

	const noLinkedTest = changedMapped
		.filter((p) => {
			if (isLayerExempt(config, p)) return false;
			return !impact(graph, [p]).callers.some((c) => isLayerExempt(config, c));
		})
		.sort(byPath);

	const columns = { tests, upstream, changed: changedMapped, downstream };
	const drawn = new Set([...tests, ...upstream, ...changedMapped, ...downstream]);
	const edges = [];
	for (const path of [...drawn].sort(byPath)) {
		for (const callee of graph.modules.get(path).callees) {
			if (drawn.has(callee)) edges.push({ from: path, to: callee });
		}
	}

	return { columns, edges, unmapped, noLinkedTest, untraced: untracedTests(graph) };
}

function escapeHtml(value) {
	return String(value)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function nodeWidth(label) {
	return Math.max(MIN_NODE_WIDTH, label.length * CHAR_WIDTH + NODE_H_PADDING * 2);
}

/** Each column's fixed x and width, left to right, each column's width from its own longest
 *  label — so a node's x depends only on its column, never on its row (must-meet.md's Layout). */
function layoutColumns(model) {
	const widths = {};
	for (const id of COLUMN_IDS) {
		const labels = model.columns[id];
		widths[id] = labels.length ? Math.max(...labels.map(nodeWidth)) : MIN_NODE_WIDTH;
	}
	const xs = {};
	let x = MARGIN;
	for (const id of COLUMN_IDS) {
		xs[id] = x;
		x += widths[id] + COLUMN_GUTTER;
	}
	return { widths, xs, width: x - COLUMN_GUTTER + MARGIN };
}

function layoutNodes(model, layout) {
	const positions = new Map();
	const top = HEADING_GAP + ROW_GAP;
	for (const id of COLUMN_IDS) {
		const x = layout.xs[id];
		const width = layout.widths[id];
		model.columns[id].forEach((path, i) => {
			positions.set(path, { x, y: top + i * (NODE_HEIGHT + ROW_GAP), width, height: NODE_HEIGHT, column: id });
		});
	}
	return positions;
}

/** The importer's right side to the imported's left side (must-meet.md's Edges design). A
 *  same-column or leftward edge still starts and ends on those same two sides; its control
 *  points are pulled out past the gutter rather than straight back through the columns between
 *  — an edge router this is not (see Known limits: no layout library, no edge routing). */
function edgePath(from, to) {
	const x1 = from.x + from.width;
	const y1 = from.y + Math.round(from.height / 2);
	const x2 = to.x;
	const y2 = to.y + Math.round(to.height / 2);
	const pull = Math.round(COLUMN_GUTTER / 2);
	return `M ${x1} ${y1} C ${x1 + pull} ${y1}, ${x2 - pull} ${y2}, ${x2} ${y2}`;
}

function renderNode(path, pos, noLinkedTestSet) {
	const flagged = noLinkedTestSet.has(path);
	const attrs = [`class="node"`, `${DATA_PATH_ATTR}="${escapeHtml(path)}"`, `${DATA_COLUMN_ATTR}="${pos.column}"`];
	if (flagged) attrs.push(DATA_NO_LINKED_TEST_ATTR);
	const label = flagged ? `${path} — ${NO_LINKED_TEST_LABEL}` : path;
	const rectClass = `col-${pos.column}${flagged ? " no-link" : ""}`;
	return (
		`<g ${attrs.join(" ")}>` +
		`<rect x="${pos.x}" y="${pos.y}" width="${pos.width}" height="${pos.height}" class="${rectClass}"/>` +
		`<text x="${pos.x + NODE_H_PADDING}" y="${pos.y + Math.round(pos.height / 2) + 4}">${escapeHtml(label)}</text>` +
		`</g>`
	);
}

function renderUnmapped(unmapped) {
	if (!unmapped.length) return "";
	const items = unmapped.map((p) => `<li ${DATA_UNMAPPED_ATTR}>${escapeHtml(p)}</li>`).join("");
	return `<section class="unmapped"><h2>${escapeHtml(UNMAPPED_HEADING)}</h2><ul>${items}</ul></section>`;
}

function renderHeader(model, meta) {
	const counts = COLUMN_IDS.map((id) => `${COLUMN_TITLES[id]} ${model.columns[id].length}`).join(" · ");
	const untracedLine = `${model.untraced.untraced} of ${model.untraced.total} test modules import no mapped module (a test that only starts a process is not linked)`;
	return (
		`<header>` +
		`<h1>Blast radius — ${escapeHtml(meta.base)} @ ${escapeHtml(meta.mergeBase)}</h1>` +
		`<p class="counts">${escapeHtml(counts)}, unmapped ${model.unmapped.length}</p>` +
		`<p class="untraced">${escapeHtml(untracedLine)}</p>` +
		`<p class="legend">Columns left to right: tests, upstream, changed, downstream. Every edge runs from the importing module to the imported module. A node marked “${escapeHtml(NO_LINKED_TEST_LABEL)}” is outside the test roots and no test module transitively imports it.</p>` +
		`</header>`
	);
}

const STYLE = `
body { margin: 0; padding: ${MARGIN}px; font-family: sans-serif; background: ${BG_LIGHT}; color: ${TEXT_LIGHT}; }
svg text { font-size: ${FONT_SIZE}px; font-family: sans-serif; fill: ${TEXT_LIGHT}; }
.edge { fill: none; stroke: ${EDGE_LIGHT}; stroke-width: 1.5; }
.col-heading { font-weight: bold; }
.col-tests { fill: ${COLUMN_COLORS_LIGHT.tests}; }
.col-upstream { fill: ${COLUMN_COLORS_LIGHT.upstream}; }
.col-changed { fill: ${COLUMN_COLORS_LIGHT.changed}; }
.col-downstream { fill: ${COLUMN_COLORS_LIGHT.downstream}; }
rect.no-link { stroke: ${NO_LINKED_TEST_COLOR_LIGHT}; stroke-width: 2; }
.unmapped { margin-top: 1em; }
@media (prefers-color-scheme: dark) {
  body { background: ${BG_DARK}; color: ${TEXT_DARK}; }
  svg text { fill: ${TEXT_DARK}; }
  .edge { stroke: ${EDGE_DARK}; }
  .col-tests { fill: ${COLUMN_COLORS_DARK.tests}; }
  .col-upstream { fill: ${COLUMN_COLORS_DARK.upstream}; }
  .col-changed { fill: ${COLUMN_COLORS_DARK.changed}; }
  .col-downstream { fill: ${COLUMN_COLORS_DARK.downstream}; }
  rect.no-link { stroke: ${NO_LINKED_TEST_COLOR_DARK}; }
}
`;

/**
 * The whole page: one inline SVG, inline style, no script and no reference outside itself
 * (R-1557). No date, time or absolute path (R-1556) — `meta` carries only the base name and the
 * merge-base's short hash.
 * @param {ReturnType<typeof blastModel>} model
 * @param {{base: string, mergeBase: string}} meta
 */
export function renderPage(model, meta) {
	const layout = layoutColumns(model);
	const positions = layoutNodes(model, layout);
	const maxRows = Math.max(1, ...COLUMN_IDS.map((id) => model.columns[id].length));
	const height = HEADING_GAP + ROW_GAP + maxRows * (NODE_HEIGHT + ROW_GAP) + MARGIN;
	const width = layout.width;

	const noLinkedTestSet = new Set(model.noLinkedTest);
	const allNodes = COLUMN_IDS.flatMap((id) => model.columns[id]);
	const nodeMarkup = allNodes.map((path) => renderNode(path, positions.get(path), noLinkedTestSet)).join("");
	const headingMarkup = COLUMN_IDS.map(
		(id) => `<text x="${layout.xs[id]}" y="${HEADING_GAP}" class="col-heading">${escapeHtml(COLUMN_TITLES[id])}</text>`,
	).join("");
	const edgeMarkup = model.edges
		.map(
			(e) =>
				`<path class="edge" ${DATA_FROM_ATTR}="${escapeHtml(e.from)}" ${DATA_TO_ATTR}="${escapeHtml(e.to)}" d="${edgePath(positions.get(e.from), positions.get(e.to))}"/>`,
		)
		.join("");

	const svg =
		`<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">` +
		`<g class="edges">${edgeMarkup}</g>` +
		`<g class="headings">${headingMarkup}</g>` +
		`<g class="nodes">${nodeMarkup}</g>` +
		`</svg>`;

	return (
		`<!doctype html><html><head><meta charset="utf-8"><title>Blast radius</title>` +
		`<style>${STYLE}</style></head><body>` +
		`${renderHeader(model, meta)}<main>${svg}</main>${renderUnmapped(model.unmapped)}` +
		`</body></html>`
	);
}

export function collectChangedPaths(root, base, git = defaultGit) {
	const mergeBase = git(root, ["--no-optional-locks", "merge-base", base, "HEAD"]);
	if (mergeBase.status !== 0) return { error: `could not find a merge base for '${base}' and HEAD: ${(mergeBase.stderr || "").trim() || "git failed"}` };
	const mb = mergeBase.stdout.trim();
	const diff = git(root, ["--no-optional-locks", "diff", "--name-only", "--no-renames", "--relative", "-z", mb]);
	if (diff.status !== 0) return { error: `could not diff the working tree against ${mb}: ${(diff.stderr || "").trim() || "git failed"}` };
	const untracked = git(root, ["--no-optional-locks", "ls-files", "-z", "--others", "--exclude-standard"]);
	if (untracked.status !== 0) return { error: `could not list untracked files: ${(untracked.stderr || "").trim() || "git failed"}` };
	return { mergeBase: mb, paths: [...new Set([...parseZList(diff.stdout), ...parseZList(untracked.stdout)])] };
}

export function main(argv, git = defaultGit) {
	const args = parseArgs(argv);
	if (!args) return usage();
	const root = resolve(process.cwd(), args.root);

	const changedSet = collectChangedPaths(root, args.base, git);
	if (changedSet.error) { console.error(changedSet.error); return 1; }
	const mb = changedSet.mergeBase;
	const changed = changedSet.paths;

	const config = loadConfig(root);
	const graph = buildGraph(collectModules(root, config), config);
	const model = blastModel(graph, changed);
	const page = renderPage(model, { base: args.base, mergeBase: mb.slice(0, 7) });

	const outPath = resolve(process.cwd(), args.out);
	mkdirSync(dirname(outPath), { recursive: true });
	writeFileSync(outPath, page);

	const counts = COLUMN_IDS.map((id) => `${id} ${model.columns[id].length}`).join(", ");
	process.stdout.write(`blast radius: ${counts}, unmapped ${model.unmapped.length} -> ${outPath}\n`);
	return 0;
}

if (
	process.argv[1] &&
	existsSync(process.argv[1]) &&
	realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
) {
	process.exit(main(process.argv.slice(2)));
}
