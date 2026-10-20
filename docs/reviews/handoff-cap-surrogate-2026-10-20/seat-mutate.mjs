#!/usr/bin/env node
// Seat wrong-code pairs for lane handoff-cap-surrogate (hook lane: the pi extension nana-handoff.ts), written by the
// seat 2026-10-20 on the build-1 tip, on the shared runner. The lane changed two product sites in nana-handoff.ts:
// the INJECT_CAP definition (now exported, with its contract note) and the injected-body cut (now `head`). M1 and M2
// revert each site to main's form; M3 and M4 retune the sealed cap by one unit each way; M5-M10 are the plan's wrong
// cuts (must-meet.md W1-W5, W8). Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/handoff-cap-surrogate-2026-10-20/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const HA = "packages/nana-pack/tests/handoff-artifact.test.mjs";
const NH = "packages/nana-pack/extensions/nana-handoff.ts";
const R189 = "cap: a 9012-unit body is injected raw as its first 8000 UTF-16 code units, after the Source and Provenance lines";
const R2160 = "cap: a body cut between the two halves of a surrogate pair is injected ending before that pair";
const CUT = "head(h.body, INJECT_CAP),";
const CAP = "export const INJECT_CAP = 8000;";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
const cut = (replacement) => [one(NH, CUT, replacement)];

const DECLARED = [
	"(a) the `head` import is part of the cut site: dropping it alone throws at injection rather than cutting wrongly, so it has no pair of its own",
	"(b) must-meet W7 (strip lone surrogates after the raw cut) matches `head` on every well-formed body the store can hold, so it is equivalent and has no pair",
];

const PAIRS = [
	{ n: "M1", name: "the cut reverts to main's raw slice of INJECT_CAP units", edits: cut("h.body.slice(0, INJECT_CAP),"), tests: [HA], expectRed: [R2160] },
	{ n: "M2", name: "INJECT_CAP reverts to main's unexported const", edits: [one(NH, CAP, "const INJECT_CAP = 8000;")], tests: [HA], expectRed: [R2160] },
	{ n: "M3", name: "the sealed cap is retuned down one unit to 7999", edits: [one(NH, CAP, "export const INJECT_CAP = 7999;")], tests: [HA], expectRed: [R189] },
	{ n: "M4", name: "the sealed cap is retuned up one unit to 8001", edits: [one(NH, CAP, "export const INJECT_CAP = 8001;")], tests: [HA], expectRed: [R189] },
	{ n: "M5", name: "W1: the cut always drops one unit", edits: cut("h.body.slice(0, INJECT_CAP - 1),"), tests: [HA], expectRed: [R189] },
	{ n: "M6", name: "W2: the raw cut is made well-formed, U+FFFD in place of the half", edits: cut("h.body.slice(0, INJECT_CAP).toWellFormed(),"), tests: [HA], expectRed: [R2160] },
	{ n: "M7", name: "W3: the cut drops the last unit on any surrogate", edits: cut("((s) => { const c = s.charCodeAt(INJECT_CAP - 1); return s.slice(0, c >= 0xd800 && c <= 0xdfff ? INJECT_CAP - 1 : INJECT_CAP); })(h.body),"), tests: [HA], expectRed: [R189] },
	{ n: "M8", name: "W4: the cut counts code points, not code units", edits: cut("Array.from(h.body).slice(0, INJECT_CAP).join(\"\"),"), tests: [HA], expectRed: [R189, R2160] },
	{ n: "M9", name: "W5: the cut drops the last unit only on a low surrogate", edits: cut("((s) => { const c = s.charCodeAt(INJECT_CAP - 1); return s.slice(0, c >= 0xdc00 && c <= 0xdfff ? INJECT_CAP - 1 : INJECT_CAP); })(h.body),"), tests: [HA], expectRed: [R189, R2160] },
	{ n: "M10", name: "W8: a pair-safe cut one unit long, then a raw cut back to INJECT_CAP", edits: cut("head(h.body, INJECT_CAP + 1).slice(0, INJECT_CAP),"), tests: [HA], expectRed: [R2160] },
];

process.exitCode = await runMutations({ lane: "handoff-cap-surrogate", self: import.meta.url, tip: "4011c0a3", declared: DECLARED, pairs: PAIRS });
