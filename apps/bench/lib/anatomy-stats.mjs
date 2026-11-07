/**
 * @module apps/bench/lib/anatomy-stats.mjs
 * @purpose Compute deterministic agreement and seeded samples for anatomy.
 * @inputs Nominal label vectors or ids, sample size, seed and seed-order option.
 * @outputs cohensKappa returns kappa, po, pe and n; seededSample returns ids.
 * @effects none
 * @errors Throws Error on empty or unequal-length label vectors.
 */
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

/** Order by sha256(seed|id), take k; return sorted ids unless seedOrder is requested. */
export function seededSample(ids, k, seed, { seedOrder = false } = {}) {
	const h = (id) => crypto.createHash("sha256").update(`${seed}|${id}`).digest("hex");
	const sample = [...ids].sort((x, y) => (h(x) < h(y) ? -1 : h(x) > h(y) ? 1 : 0)).slice(0, k);
	return seedOrder ? sample : sample.sort();
}
