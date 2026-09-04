// sign.mjs — the provenance signature (node only: extension + desk server).
//
// The desk hands every app child a random per-session key (NANA_STAGE_KEY);
// nana-stage signs each block it mints with HMAC-SHA256 over the canonical
// JSON of the block (sorted keys, `produced_by.sig` excluded). The server
// verifies before anything reaches a page — on the live tool event and on the
// ledger read — so only the key holder can put a block on a stage. A second
// extension re-injecting a carrier, or a forged nana-block entry, has no key.
// Without a key (plain TUI use) blocks are unsigned and the page-side checks
// still apply; the server-side filter is what makes the tooth un-bypassable.

import { createHmac, timingSafeEqual } from "node:crypto";

export function canonical(v) {
	if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
	if (v && typeof v === "object") return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`).join(",")}}`;
	return JSON.stringify(v);
}

function payload(block) {
	const { produced_by: p, ...rest } = block;
	const { sig: _s, ...pb } = p || {};
	return canonical({ ...rest, produced_by: pb });
}

export function signBlock(key, block) {
	return createHmac("sha256", key).update(payload(block)).digest("hex");
}

export function verifyBlock(key, block) {
	const sig = block?.produced_by?.sig;
	if (typeof sig !== "string" || sig.length !== 64) return false;
	const want = Buffer.from(signBlock(key, block), "hex");
	const got = Buffer.from(sig, "hex");
	return want.length === got.length && timingSafeEqual(want, got);
}
