// catch-stats.mjs — pure, deterministic arithmetic over rows + stored labels: κ, stage hints,
// the table and the pre-registered claims. No I/O, no model.
import crypto from "node:crypto";

/** Cohen's κ for two nominal label vectors of equal length. Returns {kappa, po, pe, n}. */
export function cohensKappa(a, b) {
	if (a.length !== b.length || !a.length) throw new Error("kappa: vectors must be non-empty and equal length");
	const n = a.length;
	const cats = [...new Set([...a, ...b])];
	let agree = 0;
	for (let i = 0; i < n; i++) if (a[i] === b[i]) agree++;
	const po = agree / n;
	let pe = 0;
	for (const c of cats) pe += (a.filter((x) => x === c).length / n) * (b.filter((x) => x === c).length / n);
	const kappa = pe === 1 ? (po === 1 ? 1 : 0) : (po - pe) / (1 - pe);
	return { kappa, po, pe, n };
}

/** Deterministic seeded sample: order by sha256(seed|id), take k. */
export function seededSample(ids, k, seed) {
	const h = (id) => crypto.createHash("sha256").update(`${seed}|${id}`).digest("hex");
	return [...ids].sort((x, y) => (h(x) < h(y) ? -1 : h(x) > h(y) ? 1 : 0)).slice(0, k).sort();
}

/**
 * Same file? Paths as written in reviews are partial ("config.ts", "lib/objective.ts",
 * "packages/nana-pack/lib/objective.ts"). Two refs name the same file iff, after normalising
 * ("./", "~/", "../" segments dropped), one path's segments are a suffix of the other's.
 * `src/one/config.ts` vs `src/two/config.ts` → different; `config.ts` vs `src/one/config.ts` → same
 * (a bare basename is compatible with any path ending in it — it is only a hint).
 */
export function samePath(a, b) {
	const seg = (f) => String(f).split("/").filter((x) => x && x !== "." && x !== ".." && x !== "~");
	const x = seg(a), y = seg(b);
	const [s, l] = x.length <= y.length ? [x, y] : [y, x];
	if (!s.length) return false;
	for (let i = 1; i <= s.length; i++) if (s[s.length - i] !== l[l.length - i]) return false;
	return true;
}
/** The legacy (buggy) rule: basename only. Kept ONLY because the cached match runs were prompted with it. */
export const sameBase = (a, b) => a.base === b.base;
const sameRef = (a, b) => samePath(a.file ?? a.base, b.file ?? b.base);

/** 4-stage matcher, stages 1–2 (structural): same file (full path, see samePath), then line ranges within ±k. */
export function stageHints(rows, k = 5, same = sameRef) {
	const hints = [];
	for (let i = 0; i < rows.length; i++)
		for (let j = i + 1; j < rows.length; j++) {
			const A = rows[i].refs, B = rows[j].refs;
			let file = false, line = false;
			for (const x of A)
				for (const y of B) {
					if (!same(x, y)) continue;
					file = true;
					if (x.from != null && y.from != null && x.from - k <= y.to && y.from - k <= x.to) line = true;
				}
			if (file) hints.push({ a: rows[i].id, b: rows[j].id, stage: line ? "line" : "file" });
		}
	return hints;
}

/** Symmetric adjacency from judge match output restricted to the pool. */
export function adjacency(matches, pool) {
	const ids = new Set(pool.map((r) => r.id));
	const adj = new Map([...ids].map((i) => [i, new Set()]));
	for (const m of matches) for (const o of m.same_as) if (ids.has(m.id) && ids.has(o) && o !== m.id) (adj.get(m.id).add(o), adj.get(o).add(m.id));
	return adj;
}

const rungOf = (id) => id.split("#")[0]; // "<lane>/<model>-r<n>"
const itemOf = (id) => Number(id.split("#")[1]);

/** Connected components of an adjacency map ("same underlying defect" is an equivalence relation). */
export function components(adj) {
	const comp = new Map();
	let n = 0;
	for (const start of [...adj.keys()].sort()) {
		if (comp.has(start)) continue;
		const stack = [start];
		comp.set(start, n);
		while (stack.length) for (const o of adj.get(stack.pop()) ?? []) if (!comp.has(o)) (comp.set(o, n), stack.push(o));
		n++;
	}
	return comp;
}

/**
 * Build the ledger. rows: extracted; labels: Map id→label (pass A); adj: Map id→Set (pass A).
 * Matching is over CONNECTED COMPONENTS of the judge's same-defect graph, not direct edges: if
 * sol-r1 ~ astra-r2 ~ astra-r1, then astra-r1 is matched by sol (sol r1 fix brief attack).
 * A finding is a "within-report duplicate" if its component holds an EARLIER row of the same report.
 */
export function buildLedger(rows, labels, adj) {
	const L = rows.map((r) => ({ ...r, ...(labels.get(r.id) ?? {}) }));
	const comp = components(adj);
	const members = new Map();
	for (const r of L) if (comp.has(r.id)) members.set(comp.get(r.id), [...(members.get(comp.get(r.id)) ?? []), r]);
	for (const r of L) {
		const ms = comp.has(r.id) ? members.get(comp.get(r.id)).filter((m) => m.id !== r.id) : [];
		r.component = comp.has(r.id) ? comp.get(r.id) : null;
		r.dup_in_report = ms.some((m) => rungOf(m.id) === rungOf(r.id) && itemOf(m.id) < itemOf(r.id));
		r.matched_other_rungs = [...new Set(ms.filter((m) => rungOf(m.id) !== rungOf(r.id)).map((m) => m.rung))].sort();
		r.matched_sol = ms.some((m) => m.reviewer_model === "sol");
		r.unique = r.matched_other_rungs.length === 0;
	}
	const findings = L.filter((r) => r.kind !== "verification" && r.is_finding && !r.dup_in_report);
	return { L, findings };
}

export function table(findings) {
	const key = (r) => `${r.reviewer_model}|r${r.round}|${r.top}`;
	const t = new Map();
	for (const r of findings) {
		const k = key(r);
		const c = t.get(k) ?? { model: r.reviewer_model, round: `r${r.round}`, cls: r.top, found: 0, carry: 0, accepted: 0, unique_accepted: 0 };
		c.found++;
		if (r.kind === "carry") c.carry++;
		if (r.disposition === "accepted") c.accepted++;
		if (r.disposition === "accepted" && r.unique) c.unique_accepted++;
		t.set(k, c);
	}
	return [...t.values()].sort((a, b) => `${a.model}${a.round}${a.cls}`.localeCompare(`${b.model}${b.round}${b.cls}`));
}

export function claims(L, findings, stats) {
	const astraLanes = [...new Set(stats.filter((s) => s.rung === "astra-r1").map((s) => s.lane))].sort();
	const original5 = ["l1", "l2", "l3", "t2a", "t2b"];
	const p1rows = findings.filter((r) => r.rung === "astra-r1" && r.disposition === "accepted" && !r.matched_sol);
	const p1func = p1rows.filter((r) => r.top === "functional");
	const lanesYes = [...new Set(p1func.map((r) => r.lane))].sort();
	const P1 = {
		astra_lanes: astraLanes,
		unique_accepted_rows: p1rows.map((r) => ({ id: r.id, top: r.top, sub: r.sub, claim: r.claim })),
		functional_lanes: lanesYes,
		answer_6: lanesYes.length >= 2 ? "YES" : "NO",
		answer_original5: lanesYes.filter((l) => original5.includes(l)).length >= 2 ? "YES" : "NO",
		all_unique_evolvability: p1rows.length > 0 && p1rows.every((r) => r.top === "evolvability"),
	};
	const r3 = L.filter((r) => r.reviewer_model === "sol" && r.round === 3 && (r.kind === "verification" || (r.is_finding && !r.dup_in_report)));
	const cnt = (arr, f) => arr.reduce((a, r) => ((a[f(r)] = (a[f(r)] ?? 0) + 1), a), {});
	const P2 = { sol_r3_items: r3.length, by: cnt(r3, (r) => (r.kind === "verification" ? "verification" : r.relation)), per_lane: cnt(r3, (r) => `${r.lane}:${r.kind === "verification" ? "verification" : r.relation}`) };
	const nv = r3.filter((r) => r.kind !== "verification");
	P2.new_scope_share_of_findings = nv.length ? nv.filter((r) => r.relation === "new_scope").length / nv.length : null;
	const acc = findings.filter((r) => r.disposition === "accepted");
	const P3 = { accepted: acc.length, by_origin: cnt(acc, (r) => r.origin), seat_spec_share: acc.length ? acc.filter((r) => r.origin === "seat_spec").length / acc.length : null, per_lane: cnt(acc.filter((r) => r.origin === "seat_spec"), (r) => r.lane) };
	const sc = stats.filter((s) => s.score != null).map((s) => {
		const f = findings.filter((r) => r.report === s.report);
		return { report: s.report, round: s.rung, verdict: s.verdict, score: s.score, accepted_functional: f.filter((r) => r.disposition === "accepted" && r.top === "functional").length, findings: f.length };
	});
	const P4 = { scores: sc, distribution: cnt(sc, (s) => `${s.round}|${s.verdict}|${s.score}`) };
	return { P1, P2, P3, P4 };
}

/**
 * Pre-registered `match_confidence` for a disposition (PREREG.md "Disposition"), computed
 * structurally from the verified quote: explicit = the quote names the item (#N, "item N",
 * "finding N", or "MUST N" for a MUST row) or shares a ≥6-word contiguous span with the finding;
 * semantic = a verified quote that does neither (it exists in the brief but the tie to THIS
 * finding is the judge's reading). null when there is no verified disposition quote.
 */
export function matchConfidence(r) {
	if (!r.quote_verified || !["accepted", "overridden", "carried"].includes(r.disposition)) return null;
	const words = (s) => String(s).toLowerCase().replace(/[`*_"'“”‘’()[\]{}.,;:!?]/g, " ").split(/\s+/).filter(Boolean);
	const q = r.fix_quote;
	const n = r.item_no;
	if (n != null) {
		const names = [`#${n}\\b`, `\\b(?:item|finding)\\s+${n}\\b`, ...(r.severity === "MUST" ? [`\\bMUST\\s*${n}\\b`] : [])];
		if (names.some((re) => new RegExp(re, "i").test(q))) return "explicit";
	}
	const qw = words(q), bw = words(r.body ?? "");
	const grams = new Set();
	for (let i = 0; i + 6 <= bw.length; i++) grams.add(bw.slice(i, i + 6).join(" "));
	for (let i = 0; i + 6 <= qw.length; i++) if (grams.has(qw.slice(i, i + 6).join(" "))) return "explicit";
	return "semantic";
}
