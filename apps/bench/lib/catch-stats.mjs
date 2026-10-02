/**
 * @module apps/bench/lib/catch-stats.mjs
 * @purpose Pure deterministic arithmetic over the ledger's rows and stored labels: Cohen's kappa,
 *  seeded sampling, finding-equivalence graphs, the table and the pre-registered claims.
 * @inputs in-memory rows, label objects, match records and stage hints — no files, no model
 * @outputs exports
 *  cohensKappa/seededSample/canonSegments/samePath/sameBase/stageHints/matchGraph/components/buildLedger/componentSizes/table/claims/matchConfidence;
 *  returns plain objects and markdown strings
 * @effects none
 * @errors throws Error when kappa is given empty or unequal-length label vectors
 */
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
 * "packages/nana-pack/lib/objective.ts"). Two refs name the same file iff, after canonical
 * normalisation ("", "." and "~" segments dropped; "x/.." resolved: `a/b/../c` → `a/c`; a leading
 * ".." that cannot be resolved is dropped), one path's segments are a suffix of the other's.
 * `src/one/config.ts` vs `src/two/config.ts` → different; `config.ts` vs `src/one/config.ts` → same
 * (a bare basename is compatible with any path ending in it — it is only a hint).
 */
export function canonSegments(f) {
	const out = [];
	for (const x of String(f).split("/")) {
		if (!x || x === "." || x === "~") continue;
		if (x === "..") out.pop();
		else out.push(x);
	}
	return out;
}
export function samePath(a, b) {
	const x = canonSegments(a), y = canonSegments(b);
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

/**
 * The judge's two relations, validated and resolved (sol r2 HIGH). Returns
 *   eq:  Map id→Set  symmetric `same_as` (equivalence) — the ONLY edges components are taken over;
 *   cov: Map id→Set  directed `covers`: cov.get(A).has(B) ⇔ A is broader and B's defect is part of A's;
 *   stats: { same_as_pairs, covers_pairs, mutual_covers_as_same_as, same_as_vs_covers_as_covers }.
 * Fail-closed: an unknown id (not in the pool) in either field, or an id in both fields of one
 * row, throws. Pair resolution, deterministic:
 *   - A covers B and B covers A (a contradiction the judge may make) → same_as, counted;
 *   - one side says same_as, the other side says covers (one direction) → covers, counted. Covers
 *     never merges but still denies uniqueness, so this is the non-merging, conservative reading.
 * Self-references are ignored.
 */
export function matchGraph(matches, pool) {
	const ids = new Set(pool.map((r) => r.id));
	const rawEq = new Set(), rawCov = new Set(); // "a|b" (eq: sorted pair; cov: broader|narrower)
	for (const m of matches) {
		if (!ids.has(m.id)) throw new Error(`match: unknown row id ${m.id}`);
		const sa = m.same_as ?? [], cv = m.covers ?? [];
		for (const o of [...sa, ...cv]) if (!ids.has(o)) throw new Error(`match: ${m.id} names unknown id ${o}`);
		const both = sa.filter((o) => cv.includes(o) && o !== m.id);
		if (both.length) throw new Error(`match: ${m.id} lists ${both.join(",")} in both same_as and covers`);
		for (const o of sa) if (o !== m.id) rawEq.add([m.id, o].sort().join("|"));
		for (const o of cv) if (o !== m.id) rawCov.add(`${m.id}|${o}`);
	}
	const eq = new Map([...ids].map((i) => [i, new Set()]));
	const cov = new Map([...ids].map((i) => [i, new Set()]));
	const stats = { same_as_pairs: 0, covers_pairs: 0, mutual_covers_as_same_as: 0, same_as_vs_covers_as_covers: 0 };
	const pairs = new Set([...rawEq, ...[...rawCov].map((k) => k.split("|").sort().join("|"))]);
	for (const k of [...pairs].sort()) {
		const [a, b] = k.split("|");
		const ab = rawCov.has(`${a}|${b}`), ba = rawCov.has(`${b}|${a}`);
		if ((ab && ba) || (!ab && !ba)) {
			if (ab && ba) stats.mutual_covers_as_same_as++;
			eq.get(a).add(b), eq.get(b).add(a), stats.same_as_pairs++;
		} else {
			if (rawEq.has(k)) stats.same_as_vs_covers_as_covers++;
			ab ? cov.get(a).add(b) : cov.get(b).add(a);
			stats.covers_pairs++;
		}
	}
	return { eq, cov, stats };
}

const rungOf = (id) => id.split("#")[0]; // "<lane>/<model>-r<n>"
const itemOf = (id) => Number(id.split("#")[1]);

/** Connected components of the `same_as` graph ONLY (equivalence). Containment never merges. */
export function components(eq) {
	const comp = new Map();
	let n = 0;
	for (const start of [...eq.keys()].sort()) {
		if (comp.has(start)) continue;
		const stack = [start];
		comp.set(start, n);
		while (stack.length) for (const o of eq.get(stack.pop()) ?? []) if (!comp.has(o)) (comp.set(o, n), stack.push(o));
		n++;
	}
	return comp;
}

/**
 * Build the ledger. rows: extracted; labels: Map id→label (pass A); graph: matchGraph(...) output.
 * - Components are over `same_as` only.
 * - Matched at rung R (denies uniqueness): another member of the row's component is at R, OR the row
 *   has a containment edge (either direction, one hop) to a row whose component contains an R row.
 *   Containment denies uniqueness but never merges: A covers {B, C} does not make B and C one defect.
 * - Within-report duplicate: an EARLIER same-report row is in the row's component, OR the row covers
 *   another row of the same report (the bundle is dropped, the atomic rows stay, whatever the order).
 *   Nothing is ever dropped across reports.
 */
export function buildLedger(rows, labels, graph) {
	const { eq, cov } = graph;
	const L = rows.map((r) => ({ ...r, ...(labels.get(r.id) ?? {}) }));
	const byId = new Map(L.map((r) => [r.id, r]));
	const comp = components(eq);
	const members = new Map();
	for (const r of L) if (comp.has(r.id)) members.set(comp.get(r.id), [...(members.get(comp.get(r.id)) ?? []), r]);
	const compOf = (id) => (comp.has(id) ? members.get(comp.get(id)) : []);
	const coveredBy = new Map();
	for (const [a, s] of cov) for (const b of s) coveredBy.set(b, [...(coveredBy.get(b) ?? []), a]);
	for (const r of L) {
		const ms = compOf(r.id).filter((m) => m.id !== r.id);
		const covers = [...(cov.get(r.id) ?? [])].sort();
		const covered_by = [...(coveredBy.get(r.id) ?? [])].sort();
		const viaCov = [...covers, ...covered_by].flatMap((o) => compOf(o));
		const matched = [...ms, ...viaCov].filter((m) => rungOf(m.id) !== rungOf(r.id));
		r.component = comp.has(r.id) ? comp.get(r.id) : null;
		r.covers = covers;
		r.covered_by = covered_by;
		r.dup_in_report = ms.some((m) => rungOf(m.id) === rungOf(r.id) && itemOf(m.id) < itemOf(r.id)) || covers.some((o) => rungOf(o) === rungOf(r.id) && byId.has(o));
		r.matched_other_rungs = [...new Set(matched.map((m) => m.rung))].sort();
		r.matched_via_containment_only = matched.length > 0 && !ms.some((m) => rungOf(m.id) !== rungOf(r.id));
		r.matched_sol = matched.some((m) => m.reviewer_model === "sol");
		r.unique = r.matched_other_rungs.length === 0;
	}
	const findings = L.filter((r) => r.kind !== "verification" && r.is_finding && !r.dup_in_report);
	return { L, findings };
}

/** Size summary of the same_as components (rows in the pool only). */
export function componentSizes(eq) {
	const c = components(eq);
	const g = new Map();
	for (const [id, n] of c) g.set(n, [...(g.get(n) ?? []), id]);
	const groups = [...g.values()].map((v) => v.sort());
	const sz = groups.map((v) => v.length);
	return { components: sz.length, multi_row: sz.filter((x) => x > 1).length, ge3: sz.filter((x) => x >= 3).length, max: Math.max(0, ...sz), groups_ge3: groups.filter((v) => v.length >= 3).sort((a, b) => b.length - a.length || a[0].localeCompare(b[0])) };
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
