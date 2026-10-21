#!/usr/bin/env node
// Seat wrong-code pairs for lane cap-fields-own (ordinary lane), written by the seat 2026-10-21 after build 1, on the
// shared runner. The lane's product is ledger data, so each pair puts one capability's new lines into a wrong form:
// a missing kind, missing deliverables, or a kind flipped. Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/cap-fields-own-2026-10-21/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const T = "packages/nana-pack/tests/requirements-cap-kinds.test.mjs";
const L = "REQUIREMENTS.md";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
const R2460 = /^R-2460: /;

const DECLARED = ["(build 1, a34fb8aa) three pairs over the capability lines this lane adds"];

const PAIRS = [
	{ n: "C1", name: "CAP-05 loses its Kind: line (its Deliverables: line becomes prose)", edits: [
		one(L, "Kind: product\nDeliverables: R-406, R-422, R-159, R-1194, R-457\n", "Deliverables: R-406, R-422, R-159, R-1194, R-457\n"),
	], tests: [T], expectRed: [R2460] },
	{ n: "C2", name: "CAP-08 loses its Deliverables: line", edits: [
		one(L, "Deliverables: R-509, R-532, R-507, R-535, R-536, R-694\n", ""),
	], tests: [T], expectRed: [R2460] },
	{ n: "C3", name: "CAP-03 flipped to product with no deliverables", edits: [
		one(L, "Kind: constraint\nBinds: CAP-01, CAP-02, CAP-04, CAP-05, CAP-07\n", "Kind: product\n"),
	], tests: [T], expectRed: [R2460] },
];

process.exitCode = await runMutations({ lane: "cap-fields-own", self: import.meta.url, tip: "a34fb8aa", declared: DECLARED, pairs: PAIRS });
