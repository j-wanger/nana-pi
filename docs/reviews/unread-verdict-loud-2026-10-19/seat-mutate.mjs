#!/usr/bin/env node
// Seat wrong-code pairs for lane unread-verdict-loud (gate lane), written by the seat 2026-10-19 on build 1b's tip
// after the merge of main, on the shared runner. Each pair reverts one product site the lane changed to today's main
// form or to the obvious wrong form (build-brief-1.md W1-W15), and names the must-meet checks it must turn red.
// Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/unread-verdict-loud-2026-10-19/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const RLT = "packages/nana-pack/tests/review-ledger.test.mjs";
const RR = "packages/nana-pack/bin/review-round.mjs";
const RL = "packages/nana-pack/bin/review-ledger.mjs";
const PR = "packages/nana-pack/bin/pi-review.mjs";
const R1620 = "review-ledger run exits 1 when the recorded verdict is empty and 0 when it is a word";
const R1621 = "pi-review exits 1 without its success line when the recorded verdict is empty";
const R1622 = "an empty verdict prints one stderr line naming the selected line, its condition and the conflicting line";
const R1623 = "the empty-verdict line says nana-land refuses the revision and counts the rounds left";
const CORPUS = "complete records the LAND corpus forms and final SEND-BACK";
const MALFORMED = "complete records an empty verdict for malformed verdict suffixes";
const REFUSED = "complete refuses marks, corrections, conflicting verdicts, invisible characters and bounded-token lookalikes";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const DECLARED = [
	"(a) every pair runs on macOS only; the Windows leg of these checks belongs to the independent check on the exact tip",
	"(b) verdict-config's condition texts have no pair: the tests import each text by name, so an edited text is a retune of chosen wording, and dropping the table only crashes the import",
	"(c) the empty-output condition and its selected-line fallback are reachable only by a direct complete() call; the plan leaves them unpinned, so they have no pair",
	"(d) the note's opening (item, short revision, round) follows the plan's format, but no must-meet check asserts it, so it has no pair",
	"(e) the six retargets are test edits only; no product site restores their old form, so they show only as named reds of L1 and C1",
];

const PAIRS = [
	{ n: "L1", name: "review-ledger records an empty verdict and exits 0 as on main (W1)", edits: [
		one(RL, "  if (c.unread) die(c.unread);\n", ""),
	], tests: [RLT], expectRed: [R1620, R1622, R1623, CORPUS, MALFORMED] },
	{ n: "L2", name: "review-ledger prints the unread note on stdout (W10)", edits: [
		one(RL, "if (c.unread) die(c.unread);", "if (c.unread) { process.stdout.write(`review-ledger: ${c.unread}\\n`); process.exit(1); }"),
	], tests: [RLT], expectRed: [R1622, R1623] },
	{ n: "R1", name: "pi-review prints SUCCESS and exits 0 on an empty verdict as on main (W2)", edits: [
		one(PR, "    if (c.unread) throw new Error(c.unread);\n", ""),
	], tests: [RLT], expectRed: [R1621, R1622, R1623] },
	{ n: "R2", name: "pi-review prints the unread note but still prints SUCCESS and exits 0 (W3)", edits: [
		one(PR, "if (c.unread) throw new Error(c.unread);", "if (c.unread) process.stderr.write(`pi-review: ${c.unread}\\n`);"),
	], tests: [RLT], expectRed: [R1621, R1622, R1623] },
	{ n: "V1", name: "the reader numbers non-blank lines instead of physical lines (W5)", edits: [
		one(RR, "const nonblank = lines.map((line, index) => ({ number: index + 1, text: line })).filter((line) => line.text.trim() !== '');",
			"const nonblank = lines.filter((line) => line.trim() !== '').map((line, index) => ({ number: index + 1, text: line }));"),
	], tests: [RLT], expectRed: [R1622] },
	{ n: "V2", name: "the reader numbers lines from 0 (W6)", edits: [
		one(RR, "({ number: index + 1, text: line })", "({ number: index, text: line })"),
	], tests: [RLT], expectRed: [R1622] },
	{ n: "V3", name: "a final-line grammar failure is named as first-line grammar", edits: [
		one(RR, "condition: UNREAD_VERDICT_CONDITIONS.FINAL_LINE_GRAMMAR", "condition: UNREAD_VERDICT_CONDITIONS.FIRST_LINE_GRAMMAR"),
	], tests: [RLT], expectRed: [R1622] },
	{ n: "V4", name: "a first-line conflict is named as first-line grammar (W7)", edits: [
		one(RR, "condition: UNREAD_VERDICT_CONDITIONS.FIRST_LINE_CONFLICT, trigger: first", "condition: UNREAD_VERDICT_CONDITIONS.FIRST_LINE_GRAMMAR, trigger: first"),
	], tests: [RLT], expectRed: [R1622] },
	{ n: "V5", name: "a first-line conflict drops its trigger line (W8)", edits: [
		one(RR, "condition: UNREAD_VERDICT_CONDITIONS.FIRST_LINE_CONFLICT, trigger: first", "condition: UNREAD_VERDICT_CONDITIONS.FIRST_LINE_CONFLICT, trigger: null"),
	], tests: [RLT], expectRed: [R1622] },
	{ n: "V6", name: "a first-line grammar failure is named as final-line grammar", edits: [
		one(RR, "selected: first, condition: UNREAD_VERDICT_CONDITIONS.FIRST_LINE_GRAMMAR", "selected: first, condition: UNREAD_VERDICT_CONDITIONS.FINAL_LINE_GRAMMAR"),
	], tests: [RLT], expectRed: [R1622] },
	{ n: "V7", name: "a later mention drops its trigger line", edits: [
		one(RR, "LATER_MENTION, trigger }", "LATER_MENTION, trigger: null }"),
	], tests: [RLT], expectRed: [R1622] },
	{ n: "V8", name: "the reader keeps the CR in the selected line's text (W9)", edits: [
		one(RR, "const lines = text.split(/\\r?\\n/);", "const lines = text.split('\\n');"),
	], tests: [RLT], expectRed: [R1622] },
	{ n: "V9", name: "the reader accepts a bold first line that agrees with the final line (W14)", edits: [
		one(RR, "const firstWord = firstGrammar.exec(first.text)?.[1] ?? null;", "const firstWord = firstGrammar.exec(first.text.replace(/\\*\\*/g, ''))?.[1] ?? null;"),
	], tests: [RLT], expectRed: [R1620, R1621, R1622, REFUSED] },
	{ n: "C1", name: "complete returns the round instead of recording an empty verdict (W4)", edits: [
		one(RR, "const parsed = readVerdict(out);",
			"const parsed = readVerdict(out); if (parsed.verdict === null) { unlinkSync(f); return { ok: false, message: 'the verdict is empty; reservation returned and no round consumed' }; }"),
	], tests: [RLT], expectRed: [R1620, R1621, R1622, R1623, CORPUS, MALFORMED, REFUSED] },
	{ n: "C2", name: "rounds left come from the tally count before the append (W15)", edits: [
		one(RR, "const used = decide(p, held, held.revision, undefined, false).used;", "const used = revisionOrder.length;"),
	], tests: [RLT], expectRed: [R1623] },
	{ n: "C3", name: "rounds left have no floor at zero (W11)", edits: [
		one(RR, "${Math.max(0, REVIEW_ROUND_CAP - used)} of", "${REVIEW_ROUND_CAP - used} of"),
	], tests: [RLT], expectRed: [R1623] },
	{ n: "C4", name: "the note drops the nana-land clause (W12)", edits: [
		one(RR, "nana-land will refuse this revision for good — make a new commit and review it; ", ""),
	], tests: [RLT], expectRed: [R1623] },
	{ n: "C5", name: "a readable verdict also gets the unread note (W13)", edits: [
		one(RR, "const unread = parsed.verdict === null ? ", "const unread = parsed.verdict !== undefined ? "),
	], tests: [RLT], expectRed: [R1620, R1621] },
	{ n: "C6", name: "the note prints the selected text raw instead of as JSON (W9)", edits: [
		one(RR, "selected line ${selected.number} ${JSON.stringify(selected.text)}", "selected line ${selected.number} \"${selected.text}\""),
	], tests: [RLT], expectRed: [R1622] },
	{ n: "C7", name: "the note drops the trigger line", edits: [
		one(RR, "const trigger = parsed.trigger ? `; line ${parsed.trigger.number} ${JSON.stringify(parsed.trigger.text)}` : '';", "const trigger = '';"),
	], tests: [RLT], expectRed: [R1622] },
];

process.exitCode = await runMutations({ lane: "unread-verdict-loud", self: import.meta.url, tip: "b42b541", declared: DECLARED, pairs: PAIRS });
