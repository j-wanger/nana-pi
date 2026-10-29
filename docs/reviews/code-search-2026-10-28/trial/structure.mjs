#!/usr/bin/env node
/**
 * @module trials/v3/structure.mjs
 * @purpose Rank precedent modules for a need from the code map's structure (whole header, facets, artifact lines, one-hop graph walk) at the need's base commit.
 * @inputs ../needs.json, ../out-base.json (v1 named modules, sanity check only); per base commit via read-only git show: docs/code-map.md and REQUIREMENTS.md
 * @outputs out-structure.json ([{lane, top10}]) and ablation.json beside this file; a summary table on stdout
 * @effects disk (writes the two JSON files), process (spawns read-only git show)
 * @errors throws when git show fails for a base commit or an input JSON is malformed
 */
// Deterministic: no model, no randomness. Ties break by path.
// Usage: node structure.mjs [--drop=lex,facets,artifacts,walk] [--damping=0.5]
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = "<repo>";
const HERE = dirname(fileURLToPath(import.meta.url));
const TRIALS = dirname(HERE);

// ---- tunables (one place). All `chosen` before the first run unless marked otherwise.
const CONFIG = {
	k1: 1.2, b: 0.75, // standard BM25 defaults (chosen, same as v1)
	// BM25F field weights over the six-tag header + path (chosen: purpose and path are the
	// author's own summary; errors is mostly failure vocabulary, so it counts half)
	fields: { purpose: 2, path: 2, inputs: 1, outputs: 1, effects: 1, errors: 0.5 },
	artifactWeight: 0.5, // artifact-match share next to the module's own text match (chosen)
	writerWeight: 1, readerWeight: 1, // writers and readers of a matched artifact count the same (chosen: subtraction)
	kindBoost: 0.25, // multiplier bump when the module's kind is one the need names (chosen)
	effectBoost: { process: 0.15, network: 0.2, database: 0.2, disk: 0.05 }, // rarer effect, more signal (chosen)
	seeds: 10, // top seeds the walk starts from (task spec)
	damping: 0.5, // neighbour score = seed score x damping, max over seeds (chosen)
	top: 10, // output size (task spec)
	evalTop: 5, // sanity-check cut (task spec)
};
const DROP = new Set((process.argv.find((a) => a.startsWith("--drop="))?.slice(7) ?? "").split(",").filter(Boolean));
const dampArg = process.argv.find((a) => a.startsWith("--damping="));
if (dampArg) CONFIG.damping = Number(dampArg.slice(10));

// ---- tokenizer (v1's, plus camelCase split so export names in @outputs tokenize)
const STOP = new Set(("a an the and or of to in on for with from by at as is are be it its this that these those " +
	"when each every one two its into than then so no not only any all who what which shall must can may " +
	"packages lib bin mjs ts js scripts apps extensions claude").split(" "));
const stem = (w) => w.replace(/(ing|ed|es|s)$/, (s) => (w.length - s.length >= 3 ? "" : s));
const tokens = (text) => text.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().split(/[^a-z0-9]+/)
	.filter((w) => w && !STOP.has(w) && !/^\d+$/.test(w)).map(stem);

// ---- facets: inferred from the need (regex cues) and from the module (path, @effects)
const NEED_KIND = { // chosen cue words
	hook: /\bhooks?\b|claude code|session start|prompt-time/i,
	extension: /\bextensions?\b|session start|prompt-time/i,
	bin: /\bprints?\b|\breport\b|\bcommand\b|\blauncher\b|\bcli\b/i,
};
const NEED_EFFECT = { // chosen cue words
	process: /\bprocess(es)?\b|\bspawn|\bkill|\bdetached\b|\blauncher\b|\bmerg|\bexit/i,
	network: /\bgithub\b|\bci\b|\bnetwork\b|\bhttps?\b|\bfetch|\bapi\b/i,
	database: /\bdatabase\b|\bsqlite\b|\bindex\b/i,
	disk: /\bfiles?\b|\bjournal\b|\bledger\b|\bfolder\b|\bstore\b|\brecords?\b|\bappend|\bwrites?\b|\bcopy\b|\bpage\b|\bconfig\b/i,
};
const isTest = (p) => /(^|\/)tests?\//.test(p);
function kindOf(p) {
	if (isTest(p)) return "test";
	if (/claude\/hooks\//.test(p)) return "hook";
	if (/\/extensions\/|^apps\/bench\/ext\//.test(p)) return "extension";
	if (/\/bin\/|^scripts\/|^apps\/[^/]+\/[^/]+$/.test(p)) return "bin";
	return "lib";
}
function stripParens(s) { let d = 0, o = ""; for (const c of s) { if (c === "(") d++; else if (c === ")") d = Math.max(0, d - 1); else if (!d) o += c; } return o; }
const effectsOf = (s) => new Set(stripParens(s ?? "").match(/\b(none|disk|database|network|process)\b/g) ?? []);
function needFacets(need) {
	const kinds = Object.keys(NEED_KIND).filter((k) => NEED_KIND[k].test(need));
	const effects = Object.keys(NEED_EFFECT).filter((k) => NEED_EFFECT[k].test(need));
	return { kinds, effects };
}

// ---- BM25 (plain or field-weighted); docs: [{id, fields:{name: tokens[]}}]
function bm25(docs, weights) {
	const flat = docs.map((d) => {
		const tf = new Map(); let len = 0;
		for (const [f, toks] of Object.entries(d.fields)) {
			const w = weights[f] ?? 1; len += w * toks.length;
			for (const t of toks) tf.set(t, (tf.get(t) ?? 0) + w);
		}
		return { id: d.id, tf, len };
	});
	const N = flat.length, avg = flat.reduce((s, d) => s + d.len, 0) / Math.max(1, N), df = new Map();
	for (const d of flat) for (const t of d.tf.keys()) df.set(t, (df.get(t) ?? 0) + 1);
	const idf = (t) => Math.log(1 + (N - (df.get(t) ?? 0) + 0.5) / ((df.get(t) ?? 0) + 0.5));
	return (query) => {
		const q = [...new Set(tokens(query))], out = new Map();
		for (const d of flat) {
			let s = 0;
			for (const t of q) { const f = d.tf.get(t) ?? 0; if (f) s += idf(t) * (f * (CONFIG.k1 + 1)) / (f + CONFIG.k1 * (1 - CONFIG.b + CONFIG.b * d.len / avg)); }
			out.set(d.id, s);
		}
		return out;
	};
}
const normalize = (m) => { const max = Math.max(0, ...m.values()); return new Map([...m].map(([k, v]) => [k, max ? v / max : 0])); };

// ---- index at a base commit
const gitShow = (base, path) => execFileSync("git", ["-C", REPO, "show", `${base}:${path}`], { encoding: "utf8", maxBuffer: 64 << 20 });
const PATH_RE = /[\w.\/-]+\.(?:mjs|ts|js)\b/g;
function parseMap(text) {
	const mods = new Map(); let cur = null;
	for (const line of text.split("\n")) {
		const h = line.match(/^### `([^`]+)`/);
		if (h) { cur = { path: h[1], callers: [], callees: [] }; mods.set(cur.path, cur); continue; }
		const f = line.match(/^- \*\*(\w+)\*\* — (.*)$/);
		if (!f || !cur) continue;
		if (f[1] === "callers" || f[1] === "callees") cur[f[1]] = [...f[2].matchAll(/`([^`]+)`/g)].map((m) => m[1]);
		else cur[f[1]] = f[2];
	}
	return mods;
}
// Artifact and deliverable lines; both old (Made by / Read by) and new (Artifact / Reads) forms.
function parseArtifacts(text, mods) {
	const lines = text.split("\n"), rows = new Map(), arts = new Map();
	for (const l of lines) { const r = l.match(/^\| (R-\d+) \| (.*?) \|/); if (r) rows.set(r[1], r[2]); }
	const art = (id) => { if (!arts.has(id)) arts.set(id, { id, text: "", writers: new Set(), readers: new Set() }); return arts.get(id); };
	const mapped = (s) => (s.match(PATH_RE) ?? []).map((p) => p.replace(/^\.\//, "")).filter((p) => mods.has(p));
	let scope = "";
	for (const l of lines) {
		const head = l.match(/^#{1,3} (?:CAP|FEAT|SUB)-\d+ · (.*)$/); if (head) { scope = head[1]; continue; }
		let m;
		if ((m = l.match(/^Artifact: (A-\d+) · (.*)$/))) {
			const a = art(m[1]); const [name, where, ...run] = m[2].split(" · ");
			a.text += ` ${name} ${where} ${scope}`;
			for (const p of mapped(run.join(" · "))) a.writers.add(p);
		} else if ((m = l.match(/^Reads: (A-\d+) · (.*)$/))) {
			for (const p of mapped(m[2])) art(m[1]).readers.add(p);
		} else if ((m = l.match(/^Made by: (R-\d+) · (.*)$/))) {
			const d = art(m[1]); const parts = m[2].split(" · ");
			if (!d.text) d.text = ` ${rows.get(m[1]) ?? ""} ${scope}`;
			const paths = mapped(parts[0]);
			for (const p of paths) d.writers.add(p);
			for (const extra of parts.slice(1)) { // "· A-006" = makes it; "· built from: A-.." = reads it
				const ids = extra.match(/A-\d+/g) ?? [];
				for (const id of ids) for (const p of paths) (/built from/.test(extra) ? art(id).readers : art(id).writers).add(p);
			}
		} else if ((m = l.match(/^Read by: (R-\d+) · (.*)$/))) {
			const d = art(m[1]); if (!d.text) d.text = ` ${rows.get(m[1]) ?? ""} ${scope}`;
			for (const p of mapped(m[2])) d.readers.add(p);
		}
	}
	return [...arts.values()].filter((a) => a.text.trim() && (a.writers.size || a.readers.size));
}
const cache = new Map();
function index(base) {
	if (cache.has(base)) return cache.get(base);
	const mods = parseMap(gitShow(base, "docs/code-map.md"));
	let artifacts = [];
	try { artifacts = parseArtifacts(gitShow(base, "REQUIREMENTS.md"), mods); } catch { artifacts = []; }
	const paths = [...mods.keys()].sort();
	const field = (m, f) => tokens(m[f] ?? "");
	const lexFull = bm25(paths.map((p) => { const m = mods.get(p); return { id: p, fields: {
		purpose: field(m, "purpose"), path: tokens(p), inputs: field(m, "inputs"), outputs: field(m, "outputs"),
		effects: field(m, "effects"), errors: field(m, "errors") } }; }), CONFIG.fields);
	const lexPurpose = bm25(paths.map((p) => ({ id: p, fields: { purpose: field(mods.get(p), "purpose"), path: tokens(p) } })), { purpose: 1, path: 1 }); // v1
	const artRank = bm25(artifacts.map((a) => ({ id: a.id, fields: { text: tokens(a.text) } })), { text: 1 });
	// linked tests: test modules that import the module, plus tests named after it (bins tested by spawn)
	const testsByStem = new Map();
	for (const p of paths) if (isTest(p)) { const s = basename(p).replace(/(\.test)?\.(mjs|ts|js)$/, ""); testsByStem.set(s, [...(testsByStem.get(s) ?? []), p]); }
	const neighbours = new Map(paths.map((p) => {
		const m = mods.get(p), stemP = basename(p).replace(/\.(mjs|ts|js)$/, "");
		return [p, new Set([...m.callers, ...m.callees, ...(isTest(p) ? [] : testsByStem.get(stemP) ?? [])].filter((x) => mods.has(x) && x !== p))];
	}));
	const out = { mods, paths, artifacts, lexFull, lexPurpose, artRank, neighbours };
	cache.set(base, out);
	return out;
}

// ---- rank one need
function rank(need, base, drop = DROP) {
	const ix = index(base);
	const lex = normalize(drop.has("lex") ? ix.lexPurpose(need) : ix.lexFull(need));
	const art = new Map();
	if (!drop.has("artifacts") && ix.artifacts.length) {
		const as = normalize(ix.artRank(need));
		for (const a of ix.artifacts) {
			const s = as.get(a.id) ?? 0; if (!s) continue;
			for (const p of a.writers) art.set(p, Math.max(art.get(p) ?? 0, s * CONFIG.writerWeight));
			for (const p of a.readers) art.set(p, Math.max(art.get(p) ?? 0, s * CONFIG.readerWeight));
		}
	}
	const { kinds, effects } = needFacets(need);
	const seed = new Map();
	for (const p of ix.paths) {
		let s = (lex.get(p) ?? 0) + CONFIG.artifactWeight * (art.get(p) ?? 0);
		if (!drop.has("facets") && s) {
			let bump = kinds.includes(kindOf(p)) ? CONFIG.kindBoost : 0;
			const me = effectsOf(ix.mods.get(p).effects);
			for (const e of effects) if (me.has(e)) bump += CONFIG.effectBoost[e];
			s *= 1 + bump;
		}
		seed.set(p, s);
	}
	const order = (m) => [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
	const final = new Map(seed);
	if (!drop.has("walk")) {
		const walk = new Map();
		for (const [p, s] of order(seed).slice(0, CONFIG.seeds)) for (const n of ix.neighbours.get(p)) walk.set(n, Math.max(walk.get(n) ?? 0, s * CONFIG.damping));
		for (const [n, w] of walk) final.set(n, (final.get(n) ?? 0) + w);
	}
	return { ranked: order(final), facets: { kinds, effects } };
}

// ---- run: all needs, full system + ablations, sanity check against v1's named modules
const needs = JSON.parse(readFileSync(join(TRIALS, "needs.json"), "utf8"));
const v1 = new Map(JSON.parse(readFileSync(join(TRIALS, "out-base.json"), "utf8")).rows.map((r) => [r.lane, r]));
const namedOf = (lane) => v1.get(lane).namedRanks.map((s) => s.slice(0, s.lastIndexOf(":")));
function score(variant) {
	let anyTop5 = 0, inTop5 = 0, inTop10 = 0, firstTop5 = 0, rr = 0, srcTop5 = 0, testsTop10 = 0; const perLane = [];
	for (const { lane, need, base } of needs) {
		const { ranked } = rank(need, base, variant);
		const pos = new Map(ranked.map(([p], i) => [p, i + 1])), named = namedOf(lane);
		const ranks = named.map((p) => pos.get(p) ?? Infinity);
		const best = Math.min(...ranks), n5 = ranks.filter((r) => r <= CONFIG.evalTop).length;
		anyTop5 += best <= CONFIG.evalTop; inTop5 += n5;
		srcTop5 += named.filter((p, i) => !isTest(p) && ranks[i] <= CONFIG.evalTop).length;
		testsTop10 += ranked.slice(0, CONFIG.top).filter(([p]) => isTest(p)).length; inTop10 += ranks.filter((r) => r <= CONFIG.top).length;
		const firstRank = pos.get(v1.get(lane).firstNamed) ?? Infinity; // the plan's first-named module, in plan order
		firstTop5 += firstRank <= CONFIG.evalTop; rr += 1 / best;
		perLane.push({ lane, named: named.length, best, n5, firstNamedRank: firstRank });
	}
	return { anyTop5, inTop5, inTop10, firstTop5, mrr: +(rr / needs.length).toFixed(3), srcTop5, testsTop10, perLane };
}
// v1 as recorded (its own top5 marks), for the same metrics
const v1Metrics = (() => {
	let anyTop5 = 0, inTop5 = 0, firstTop5 = 0, rr = 0, srcTop5 = 0;
	for (const { lane } of needs) { const r = v1.get(lane); const n5 = r.top5.filter((s) => s.endsWith(" *")).length;
		srcTop5 += r.top5.filter((s) => s.endsWith(" *") && !isTest(s.split(" ")[0])).length;
		anyTop5 += r.bestRank <= 5; inTop5 += n5; firstTop5 += r.firstRank <= 5; rr += 1 / r.bestRank; }
	return { anyTop5, inTop5, inTop10: null, firstTop5, mrr: +(rr / needs.length).toFixed(3), srcTop5, testsTop10: null };
})();

const variants = { full: [], "drop lex (purpose-only BM25)": ["lex"], "drop facets": ["facets"], "drop artifacts": ["artifacts"], "drop walk": ["walk"],
	"v1-equivalent (all four off)": ["lex", "facets", "artifacts", "walk"],
	"v1 + whole header only": ["facets", "artifacts", "walk"], "v1 + facets only": ["lex", "artifacts", "walk"],
	"v1 + artifacts only": ["lex", "facets", "walk"], "v1 + walk only": ["lex", "facets", "artifacts"] };
const table = { "v1 recorded": v1Metrics };
for (const [name, d] of Object.entries(variants)) table[name] = score(new Set([...DROP, ...d]));

const out = needs.map(({ lane, need, base }) => ({ lane, top10: rank(need, base).ranked.slice(0, CONFIG.top).map(([p]) => p) }));
if (!DROP.size && !dampArg) {
	writeFileSync(join(HERE, "out-structure.json"), JSON.stringify(out, null, 2) + "\n");
	writeFileSync(join(HERE, "ablation.json"), JSON.stringify({ config: CONFIG, facetsPerNeed: needs.map(({ lane, need }) => ({ lane, ...needFacets(need) })),
		artifactsPerBase: Object.fromEntries([...cache].map(([b, ix]) => [b, ix.artifacts.length])), table }, null, 2) + "\n");
}
const pad = (s, n) => String(s).padEnd(n);
console.log(pad("variant", 32), "anyNamedTop5  namedInTop5  namedSrcTop5  namedInTop10  firstNamedTop5  MRR(best)  testsInTop10");
for (const [name, m] of Object.entries(table)) console.log(pad(name, 32), pad(m.anyTop5 + "/10", 13), pad(m.inTop5 + "/50", 12), pad(m.srcTop5, 13), pad(m.inTop10 ?? "-", 13), pad(m.firstTop5 + "/10", 15), pad(m.mrr, 10), m.testsTop10 ?? "-");
