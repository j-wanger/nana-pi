/**
 * @module scripts/code-search.mjs
 * @purpose Suggest precedent code by ranking whole code-map headers, paths, artifact lines and graph neighbours without facets.
 * @inputs Need text, generated map text and REQUIREMENTS.md text supplied by the caller.
 * @outputs Named searchCode and formatSearch functions returning a shortlist with reasons and its callee paths.
 * @effects none
 * @errors none; absent entries and unmatched needs produce empty results.
 */
// Follow the seat's 2026-10-28 structure trial, not a knowledge database:
// BM25 over weighted headers, an artifact score, then a one-hop neighbour boost.
import { posix } from "node:path";
import { CALLEE_DEPTH, RANKING, SHORTLIST_SIZE } from "./code-search-config.mjs";

const stopwords = new Set(RANKING.stopwords.split(" "));
const stem = (word) => word.replace(/(ing|ed|es|s)$/, (suffix) => word.length - suffix.length >= 3 ? "" : suffix);
const tokens = (text) => text.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().split(/[^a-z0-9]+/)
	.filter((word) => word && !stopwords.has(word) && !/^\d+$/.test(word)).map(stem);
const isTest = (path) => /(^|\/)tests?\//.test(path) || /\.(?:test|spec)\.[^/]+$/.test(path);
const pathOrder = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const order = (scores) => [...scores].sort((a, b) => b[1] - a[1] || pathOrder(a[0], b[0]));
const normalize = (scores) => {
	let max = 0;
	for (const score of scores.values()) max = Math.max(max, score);
	return new Map([...scores].map(([path, score]) => [path, max ? score / max : 0]));
};

function parseMap(text) {
	const modules = new Map();
	let current;
	for (const raw of text.split(/\r?\n/)) {
		const line = raw.trimEnd();
		const heading = line.match(/^### `([^`]+)`/);
		if (heading) {
			current = { path: heading[1], callers: [], callees: [] };
			modules.set(current.path, current);
			continue;
		}
		const field = line.match(/^- \*\*(\w+)\*\* — (.*)$/);
		if (!current || !field) continue;
		current[field[1]] = field[1] === "callers" || field[1] === "callees"
			? [...field[2].matchAll(/`([^`]+)`/g)].map((m) => m[1]) : field[2];
	}
	return modules;
}

// Keep both ledger eras: the quality corpus predates Artifact/Reads on some bases.
function parseArtifacts(text, modules) {
	const lines = text.split(/\r?\n/).map((line) => line.trimEnd());
	const rows = new Map(), artifacts = new Map();
	for (const line of lines) {
		const row = line.match(/^\| (R-\d+) \| (.*?) \|/);
		if (row) rows.set(row[1], row[2]);
	}
	const artifact = (id) => {
		if (!artifacts.has(id)) artifacts.set(id, { id, text: "", writers: new Set(), readers: new Set() });
		return artifacts.get(id);
	};
	const mapped = (s) => (s.match(/[\w.\/-]+\.(?:mjs|ts|js)\b/g) ?? [])
		.map((p) => p.replace(/^\.\//, "")).filter((p) => modules.has(p));
	let scope = "";
	for (const line of lines) {
		const heading = line.match(/^#{1,3} (?:CAP|FEAT|SUB)-\d+ · (.*)$/);
		if (heading) { scope = heading[1]; continue; }
		let match;
		if ((match = line.match(/^Artifact: (A-\d+) · (.*)$/))) {
			const a = artifact(match[1]);
			const [name, where, ...run] = match[2].split(" · ");
			a.text += ` ${name} ${where} ${scope}`;
			for (const p of mapped(run.join(" · "))) a.writers.add(p);
		} else if ((match = line.match(/^Reads: (A-\d+) · (.*)$/))) {
			for (const p of mapped(match[2])) artifact(match[1]).readers.add(p);
		} else if ((match = line.match(/^Made by: (R-\d+) · (.*)$/))) {
			const a = artifact(match[1]), parts = match[2].split(" · ");
			if (!a.text) a.text = ` ${rows.get(match[1]) ?? ""} ${scope}`;
			const paths = mapped(parts[0]);
			for (const p of paths) a.writers.add(p);
			for (const extra of parts.slice(1)) {
				for (const id of extra.match(/A-\d+/g) ?? []) {
					for (const p of paths) (/built from/.test(extra) ? artifact(id).readers : artifact(id).writers).add(p);
				}
			}
		} else if ((match = line.match(/^Read by: (R-\d+) · (.*)$/))) {
			const a = artifact(match[1]);
			if (!a.text) a.text = ` ${rows.get(match[1]) ?? ""} ${scope}`;
			for (const p of mapped(match[2])) a.readers.add(p);
		}
	}
	return [...artifacts.values()].filter((a) => a.text.trim() && (a.writers.size || a.readers.size));
}

function bm25(documents, weights, need) {
	const flat = documents.map(({ id, fields }) => {
		const frequencies = new Map();
		let length = 0;
		for (const [field, words] of Object.entries(fields)) {
			const weight = weights[field] ?? 1;
			length += weight * words.length;
			for (const word of words) frequencies.set(word, (frequencies.get(word) ?? 0) + weight);
		}
		return { id, frequencies, length };
	});
	const count = flat.length, average = flat.reduce((sum, doc) => sum + doc.length, 0) / Math.max(1, count);
	const documentFrequency = new Map();
	for (const doc of flat) for (const word of doc.frequencies.keys()) documentFrequency.set(word, (documentFrequency.get(word) ?? 0) + 1);
	const query = [...new Set(tokens(need))];
	return new Map(flat.map((doc) => {
		let score = 0;
		for (const word of query) {
			const frequency = doc.frequencies.get(word) ?? 0;
			if (!frequency) continue;
			const df = documentFrequency.get(word) ?? 0;
			const idf = Math.log(1 + (count - df + 0.5) / (df + 0.5));
			score += idf * frequency * (RANKING.k1 + 1) / (frequency + RANKING.k1 * (1 - RANKING.b + RANKING.b * doc.length / average));
		}
		return [doc.id, score];
	}));
}

/** Pure ranker; only text supplied here can influence a result. */
export function searchCode(need, mapText, ledgerText) {
	const modules = parseMap(mapText), paths = [...modules.keys()].sort(pathOrder);
	const lexical = normalize(bm25(paths.map((path) => ({ id: path, fields: Object.fromEntries(
		Object.keys(RANKING.fields).map((field) => [field, tokens(field === "path" ? path : modules.get(path)[field] ?? "")]),
	) })), RANKING.fields, need));
	const artifacts = parseArtifacts(ledgerText, modules);
	const artifactScores = normalize(bm25(artifacts.map((a) => ({ id: a.id, fields: { text: tokens(a.text) } })), {}, need));
	const artifactSignal = new Map(), artifactIds = new Map();
	for (const a of artifacts) {
		const score = artifactScores.get(a.id) ?? 0;
		if (!score) continue;
		for (const [role, weight] of [[a.writers, RANKING.writerWeight], [a.readers, RANKING.readerWeight]]) {
			for (const p of role) {
				artifactSignal.set(p, Math.max(artifactSignal.get(p) ?? 0, score * weight));
				artifactIds.set(p, [...(artifactIds.get(p) ?? []), a.id]);
			}
		}
	}
	// Trial graph neighbours include import callers/callees and same-stem tests.
	// These are ranking hints, not fabricated launch edges in the written map.
	const stemOf = (p) => posix.basename(p).replace(/(\.test)?\.(mjs|ts|js)$/, "");
	const testsByStem = new Map();
	for (const p of paths.filter(isTest)) testsByStem.set(stemOf(p), [...(testsByStem.get(stemOf(p)) ?? []), p]);
	const seed = new Map(paths.map((p) => [p, (lexical.get(p) ?? 0) + RANKING.artifactWeight * (artifactSignal.get(p) ?? 0)]));
	const walk = new Map(), via = new Map();
	for (const [p, score] of order(seed).slice(0, RANKING.seeds)) {
		const m = modules.get(p);
		const neighbours = new Set([...m.callers, ...m.callees, ...(isTest(p) ? [] : testsByStem.get(stemOf(p)) ?? [])]);
		for (const n of neighbours) {
			if (n === p || !modules.has(n)) continue;
			const boost = score * RANKING.damping;
			if (boost > (walk.get(n) ?? 0)) { walk.set(n, boost); via.set(n, p); }
		}
	}
	const scores = new Map(paths.map((p) => [p, seed.get(p) + (walk.get(p) ?? 0)]));
	const query = new Set(tokens(need));
	const top = order(scores).filter(([p, score]) => score > 0 && !isTest(p)).slice(0, SHORTLIST_SIZE).map(([path, score]) => {
		const m = modules.get(path), why = [];
		for (const field of Object.keys(RANKING.fields)) {
			const matches = [...new Set(tokens(field === "path" ? path : m[field] ?? "").filter((t) => query.has(t)))];
			if (matches.length) why.push(`${field}: ${matches.join(",")}`);
		}
		if (artifactSignal.get(path)) why.push(`artifact: ${[...new Set(artifactIds.get(path))].sort(pathOrder).join(",")}`);
		if (via.has(path)) why.push(`neighbour: ${via.get(path)}`);
		return { path, purpose: m.purpose ?? "(no purpose header)", score, why: why.join("; ") };
	});
	const selected = new Set(top.map((m) => m.path)), callees = new Set();
	let frontier = [...selected];
	for (let depth = 0; depth < CALLEE_DEPTH; depth++) {
		const next = [];
		for (const p of frontier) for (const callee of modules.get(p)?.callees ?? []) {
			if (!modules.has(callee) || selected.has(callee) || callees.has(callee)) continue;
			callees.add(callee); next.push(callee);
		}
		frontier = next;
	}
	return { top, callees: [...callees].sort(pathOrder) };
}

/** Keep one shortlist line per module; callers can measure exactly the paths printed. */
export function formatSearch(result) {
	return ["Precedent suggestions (add to your own search):", ...result.top.map((m) => `${m.path} — ${m.purpose} — why: ${m.why}`),
		`Callees (${CALLEE_DEPTH} hop; tests included):`, ...result.callees.map((p) => `  ${p}`), ""].join("\n");
}
