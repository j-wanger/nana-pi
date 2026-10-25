#!/usr/bin/env node
// Seat wrong-code pairs for lane keep-movement (hook class), written by the seat 2026-10-25 at build tip b7fe4740.
// They follow the must-meet's "Seat wrong-code pairs" list (items 1 to 19; items 13 and 16 split into a and b because the build guards and refuses in two places; item 17's move is one edit over one contiguous span).
// Run from the lane worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/keep-movement-2026-10-25/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const RL = "packages/nana-pack/bin/review-ledger.mjs";
const RR = "packages/nana-pack/bin/review-round.mjs";
const RM = "packages/nana-pack/lib/review-movement.mjs";
const LEDGER = "REQUIREMENTS.md";
const KMT = "packages/nana-pack/tests/keep-movement.test.mjs";
const RLT = "packages/nana-pack/tests/review-ledger.test.mjs";
const RMT = "packages/nana-pack/tests/review-movement.test.mjs";
const R_2910 = /^R-2910: /; // R-2910
const R_2911 = /^R-2911: /; // R-2911
const R_2912 = /^R-2912: /; // R-2912
const R_2913 = /^R-2913: /; // R-2913
const R_2905 = /^R-2905: /; // R-2905
const R_2573 = /^R-2573: /; // R-2573
const R_2574 = /^R-2574: in a repository with a committed ledger, /; // R-2574 (the new keep-movement test, not review-ledger's)
const SEAL = /^seal: review-ledger keep names the lane folder's tree movement file tree-movement\.md/; // the seal (R-2910 R-2911 R-2912 R-2913)
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

// keep's helper call and its movement write (the source text, so `\n` inside a template literal is two characters).
const HELPER_CALL = "  const section = reviewMovementSection(resolve(repoPath));";
const MOVEMENT_WRITE = "writeFileSync(target, section);";
const COUNT_SLOT = "${movementWritten ? ` and ${KEEP_MOVEMENT_FILE_NAME}` : ''}";
const NO_TEXT = "die(`item ${item} in this repository has no kept text`);";
// The build's two copies of the no-text refusal: the early one (no kept text and no wanted movement) and the final one (no kept text and no movement written).
const EARLY_NO_TEXT = `  if (planned.size === 0 && !wantMovement) ${NO_TEXT}\n`;
const FINAL_NO_TEXT = `  if (planned.size === 0 && !movementWritten) ${NO_TEXT}\n`;
// The lstat guard R-2912's directory case reaches before any movement write.
const GUARD_WARNING = "movementWarning('not a regular file');";
// keep's review-text pre-check loop and writes, then its movement block, contiguous at b7fe4740 (item 17 swaps them).
const PRECHECK_AND_WRITES = [
	"  const writes = [];",
	"  for (const [name, bytes] of planned) {",
	"    const target = join(into, name);",
	"    let state = null;",
	"    try { state = lstatSync(target); } catch (error) { if (error.code !== 'ENOENT') die(`cannot inspect ${target}: ${error.message}`); }",
	"    if (!state) { writes.push([target, bytes]); continue; }",
	"    if (!state.isFile() || state.isSymbolicLink()) die(`${target} is not a regular file; wrote nothing`);",
	"    let existing;",
	"    try { existing = readFileSync(target); } catch (error) { die(`cannot read ${target}: ${error.message}; wrote nothing`); }",
	"    if (!existing.equals(bytes)) die(`${target} holds different bytes; wrote nothing`);",
	"  }",
	"  try {",
	"    mkdirSync(into, { recursive: true });",
	"    for (const [target, bytes] of writes) writeFileSync(target, bytes, { flag: 'wx', mode: 0o600 });",
	"  } catch (error) { die(`cannot keep review text: ${error.message}`); }",
	"",
].join("\n");
const MOVEMENT_BLOCK = [
	"  let movementWritten = false;",
	"  if (wantMovement) {",
	"    const target = join(into, KEEP_MOVEMENT_FILE_NAME);",
	"    try {",
	"      let state = null;",
	"      try { state = lstatSync(target); } catch (error) { if (error.code !== 'ENOENT') throw error; }",
	"      if (state && (!state.isFile() || state.isSymbolicLink())) movementWarning('not a regular file');",
	"      else { writeFileSync(target, section); movementWritten = true; }",
	"    } catch (error) { movementWarning(error.code ?? error.message); }",
	"  }",
	"",
].join("\n");
const PERSON_LINE = "Read by: R-1460 · person: the seat's land report points the owner to the lane folder's tree-movement.md, which review-ledger keep writes";

const DECLARED = [
	"(seat) pairs 1 to 19 follow the must-meet's seat wrong-code list in order, one pair per item, except items 13 and 16, which split; each names the rows the must-meet says it turns red",
	"(seat) item 13 splits: 13a is the item as worded (the movement-write catch calls die); 13b makes the lstat guard, which R-2912's directory case reaches before any write, call die. The must-meet expected that case to reach the catch; the build added the guard, so only 13b shows R-2912's red-list item 'a failed movement write that calls die'",
	"(seat) item 16 splits: 16a is the item as worded (the final no-text refusal removed); 16b removes both copies of the no-text refusal, the early one (no kept text and no wanted movement) and the final one, as two edits in one pair. The must-meet expected one refusal after the movement step; the build refuses in both places, so only 16b gives the must-meet's 'case 2 exits 0' and R-2573's red empty clause",
	"(seat) pair 17 (the movement write moved above the review-text pre-check loop) is one edit: its anchor is the contiguous span from `const writes = [];` through the end of the movement block, replaced by the movement block first and the pre-check and review-text writes after it, unchanged",
	"(seat) pair 5 is one edit: the movement write's existing catch already warns with error.code, so a `wx` flag alone gives the must-meet's 'only warns on EEXIST'",
	"(expected survivors and test gaps, kept as the must-meet lists them) pair 13a: run green end to end at b7fe4740, as the builder found by hand; R-2912's case 2 puts a directory at the movement name, which keep's lstat guard warns on before any write, so the catch is reached only when the write itself fails (an unwritable --into folder, inferred), which no fixture builds. Pair 16a: also run green end to end; the early refusal refuses first in every fixture, so the final refusal is reached only when a computable movement fails to write with no kept text, which no fixture builds; R-2913's 'exit 1 if it does not write' is unpinned for that case",
	"(macOS) none is Windows-only, as the must-meet says",
	"(product code) every pair edits product code or the ledger: review-ledger.mjs, review-movement.mjs, review-round.mjs or REQUIREMENTS.md; no pair edits a test file",
	"(not expressible) none of the 19 items; as the must-meet says, no pair writes the file from the working tree, since the movement script reads HEAD's ledger",
	"(seat) no alsoRed is declared: the table was written before any full run, and only pairs 13a, 13b, 16a, 16b and 18 were run end to end (13b and 16b red on exactly their named titles). Expected UNNAMED reds (inferred, not run): pairs 1 and 2 also R-2912 (no warning in either case); pairs 3 and 6 also R-2913 (case 1 compares the file's bytes); pair 12 also R-2913 (case 2's die names the reason, not `no kept text`); pair 17 also R-2910 and R-2913 (the moved write runs before keep makes a missing --into folder, so it warns ENOENT)",
];

const PAIRS = [
	{ n: "1", name: "keep's movement step removed (no helper call)", edits: [one(RL, HELPER_CALL, "  const section = null;")], tests: [KMT], expectRed: [R_2910, R_2913] },
	{ n: "2", name: "keep calls reviewMovementSection(process.cwd()) in place of the resolved --repo path", edits: [one(RL, "reviewMovementSection(resolve(repoPath))", "reviewMovementSection(process.cwd())")], tests: [KMT], expectRed: [R_2910, R_2913] },
	{ n: "3", name: "keep writes the section with a trailing newline", edits: [one(RL, MOVEMENT_WRITE, "writeFileSync(target, `${section}\\n`);")], tests: [KMT], expectRed: [R_2910] },
	{ n: "4", name: "keep writes the movement with { flag: 'a' }", edits: [one(RL, MOVEMENT_WRITE, "writeFileSync(target, section, { flag: 'a' });")], tests: [KMT], expectRed: [R_2910] },
	{ n: "5", name: "keep writes the movement with { flag: 'wx' } and only warns on EEXIST", edits: [one(RL, MOVEMENT_WRITE, "writeFileSync(target, section, { flag: 'wx' });")], tests: [KMT], expectRed: [R_2910] },
	{ n: "6", name: "keep prefixes a provenance comment naming the repository path", edits: [one(RL, MOVEMENT_WRITE, "writeFileSync(target, `<!-- ${repoPath} -->\\n${section}`);")], tests: [KMT], expectRed: [R_2910] },
	{ n: "7", name: "the count line keeps today's form when the movement was written", edits: [one(RL, `review text(s)${COUNT_SLOT} for`, "review text(s) for")], tests: [KMT], expectRed: [R_2910, R_2913] },
	{ n: "8", name: "the count line names the movement file whether or not it was written", edits: [one(RL, COUNT_SLOT, " and ${KEEP_MOVEMENT_FILE_NAME}")], tests: [KMT], expectRed: [R_2911] },
	{ n: "9", name: "keep treats a null section like a not-computed one and warns", edits: [one(RL, "const notComputed = section === null ? null : notComputedReason(section);", "const notComputed = section === null ? 'no committed ledger' : notComputedReason(section);")], tests: [KMT], expectRed: [R_2911] },
	{ n: "10", name: "keep writes an empty file when the helper returns null", edits: [one(RL, "reviewMovementSection(resolve(repoPath));", "reviewMovementSection(resolve(repoPath)) ?? '';")], tests: [KMT], expectRed: [R_2911] },
	{ n: "11", name: "notComputedReason returns null for every section", edits: [one(RM, "return typeof section === 'string' && section.startsWith(prefix) ? section.slice(prefix.length) : null;", "return null;")], tests: [KMT], expectRed: [R_2912, R_2913] },
	{ n: "12", name: "keep calls die on a not-computed movement", edits: [one(RL, "if (notComputed !== null) movementWarning(notComputed);", "if (notComputed !== null) die(notComputed);")], tests: [KMT], expectRed: [R_2912] },
	{ n: "13a", name: "keep's movement-write catch calls die", edits: [one(RL, "} catch (error) { movementWarning(error.code ?? error.message); }", "} catch (error) { die(`cannot write ${KEEP_MOVEMENT_FILE_NAME}: ${error.message}`); }")], tests: [KMT], expectRed: [R_2912] },
	{ n: "13b", name: "keep's movement lstat guard calls die on a non-regular file", edits: [one(RL, GUARD_WARNING, "die(`cannot write ${KEEP_MOVEMENT_FILE_NAME}: not a regular file`);")], tests: [KMT], expectRed: [R_2912] },
	{ n: "14", name: "the warning leaves out the reason", edits: [one(RL, "not written: ${reason}", "not written")], tests: [KMT], expectRed: [R_2912] },
	{ n: "15", name: "keep's early if (!planned.size) die(...) stays before the movement step", edits: [one(RL, HELPER_CALL, `  if (!planned.size) ${NO_TEXT}\n${HELPER_CALL}`)], tests: [KMT], expectRed: [R_2913] },
	{ n: "16a", name: "keep's final no-text refusal removed", edits: [one(RL, FINAL_NO_TEXT, "")], tests: [KMT, RLT], expectRed: [R_2913, R_2573] },
	{ n: "16b", name: "keep's no-text refusal removed in both places (early and final)", edits: [one(RL, EARLY_NO_TEXT, ""), one(RL, FINAL_NO_TEXT, "")], tests: [KMT, RLT], expectRed: [R_2913, R_2573] },
	{ n: "17", name: "the movement write moved above the review-text pre-check loop", edits: [one(RL, `${PRECHECK_AND_WRITES}${MOVEMENT_BLOCK}`, `${MOVEMENT_BLOCK}${PRECHECK_AND_WRITES}`)], tests: [KMT], expectRed: [R_2574] },
	{ n: "18", name: "KEEP_MOVEMENT_FILE_NAME retuned to movement.md", edits: [one(RR, "export const KEEP_MOVEMENT_FILE_NAME = 'tree-movement.md';", "export const KEEP_MOVEMENT_FILE_NAME = 'movement.md';")], tests: [KMT], expectRed: [SEAL] },
	{ n: "19", name: "R-1460's person line back to its old text", edits: [one(LEDGER, PERSON_LINE, "Read by: R-1460 · person: the seat's land report points the owner to it")], tests: [RMT], expectRed: [R_2905] },
];

process.exitCode = await runMutations({ lane: "keep-movement", self: import.meta.url, tip: "b7fe4740", declared: DECLARED, pairs: PAIRS });
