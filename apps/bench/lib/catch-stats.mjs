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

/** 4-stage matcher, stages 1–2 (structural): same file base, then line ranges within ±k. */
export function stageHints(rows, k = 5) {
	const hints = [];
	for (let i = 0; i < rows.length; i++)
		for (let j = i + 1; j < rows.length; j++) {
			const A = rows[i].refs, B = rows[j].refs;
			let file = false, line = false;
			for (const x of A)
				for (const y of B) {
					if (x.base !== y.base) continue;
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

/**
 * Build the ledger. rows: extracted; labels: Map id→label (pass A); adj: Map id→Set (pass A).
 * A finding is a "within-report duplicate" if it matches an EARLIER row of the same report.
 */
export function buildLedger(rows, labels, adj) {
	const L = rows.map((r) => ({ ...r, ...(labels.get(r.id) ?? {}) }));
	const byId = new Map(L.map((r) => [r.id, r]));
	for (const r of L) {
		const ms = [...(adj.get(r.id) ?? [])].map((i) => byId.get(i));
		r.dup_in_report = ms.some((m) => rungOf(m.id) === rungOf(r.id) && Number(m.id.split("#")[1]) < Number(r.id.split("#")[1]));
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
