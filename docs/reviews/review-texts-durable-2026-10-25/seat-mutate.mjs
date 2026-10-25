#!/usr/bin/env node
// Seat wrong-code pairs for lane review-texts-durable (ordinary), written by the seat 2026-10-25 after build 1 at 4ccc6979.
// They follow the must-meet's verify list (pairs 1 to 7; the plan names 1, 6 and 7 as the seat's, and 2 to 5 as the builder's red cases).
// Run from the lane worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/review-texts-durable-2026-10-25/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const SM = "packages/nana-setup/lib/state-manifest.mjs";
const RR = "packages/nana-pack/bin/review-round.mjs";
const NS = "packages/nana-setup/bin/nana-setup.mjs";
const TM = "packages/nana-setup/tests/state-manifest.test.mjs";
const TR = "packages/nana-setup/tests/restore.test.mjs";
const R_2870 = /^R-2870: /; // R-2870
const R_2871 = /^R-2871: /; // R-2871
const R_2872 = /^R-2872: /; // R-2872
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const DECLARED = [
	"(seat) pairs 1 to 7 follow the must-meet's verify list in order; each names the rows it must turn red",
];

const PAIRS = [
	{ n: "1", name: "an extra ledger path goes unclassified", edits: [one(RR, "    texts: join(dir, REVIEW_TEXT_STORE_NAME),\n", "    texts: join(dir, REVIEW_TEXT_STORE_NAME),\n    extra: join(dir, 'review-ledger.extra'),\n")], tests: [TM, TR], expectRed: [R_2871] },
	{ n: "2", name: "the texts row is disposable", edits: [one(SM, "  durable(\"review ledger texts\", \"nana-pack\", \"dir\", ledger.texts, undefined, modules.pack);", "  disp(\"review ledger texts\", ledger.texts, \"dir\", \"nana-pack\", modules.pack);")], tests: [TM, TR], expectRed: [R_2870, R_2872] },
	{ n: "3", name: "the texts row is joined from pi home", edits: [one(SM, "  durable(\"review ledger texts\", \"nana-pack\", \"dir\", ledger.texts, undefined, modules.pack);", "  durable(\"review ledger texts\", \"nana-pack\", \"dir\", path.join(layout.piHome, \"review-ledger.texts\"), undefined, modules.pack);")], tests: [TM, TR], expectRed: [R_2871] },
	{ n: "4", name: "the texts row is an installer-owned generated file", edits: [one(SM, "  durable(\"review ledger texts\", \"nana-pack\", \"dir\", ledger.texts, undefined, modules.pack);", "  durable(\"review ledger texts\", \"nana-setup\", \"generated\", ledger.texts, undefined, modules.pack);")], tests: [TM, TR], expectRed: [R_2870] },
	{ n: "5", name: "the texts row is deleted", edits: [one(SM, "  durable(\"review ledger texts\", \"nana-pack\", \"dir\", ledger.texts, undefined, modules.pack);\n", "")], tests: [TM, TR], expectRed: [R_2870, R_2871, R_2872] },
	{ n: "6", name: "the state listing skips the texts store", edits: [one(NS, "\tfor (const row of durableRows) {\n\t\tif (!within(layout.base, row.path)) {", "\tfor (const row of durableRows) {\n\t\tif (row.store === \"review ledger texts\") continue;\n\t\tif (!within(layout.base, row.path)) {")], tests: [TM, TR], expectRed: [R_2872] },
	{ n: "7", name: "the texts row loses its source and restore arguments", edits: [one(SM, "  durable(\"review ledger texts\", \"nana-pack\", \"dir\", ledger.texts, undefined, modules.pack);", "  durable(\"review ledger texts\", \"nana-pack\", \"dir\", ledger.texts);")], tests: [TM, TR], expectRed: [R_2870] },
];

process.exitCode = await runMutations({ lane: "review-texts-durable", self: import.meta.url, tip: "4ccc6979", declared: DECLARED, pairs: PAIRS });
