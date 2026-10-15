# Seat's checks of build 4 (2026-10-15, at 9eadde0)

## Independent check

MUST 1. A plain 4-column table that is not a requirement table loses its header and delimiter lines, and both `--write` and `--verify` still exit 0. Cause: the writer (`requirements-lift.mjs:636`, prose mode), the region matcher (`requirements-lift-proof.mjs:438`) and the count (`proof:562`) all drop any 4-cell header and delimiter pair. No check can see the loss. Repro (scratch `/private/tmp/claude-501/-Users-jwang-nana-pi/dea1c010-278e-4392-a90f-df947a3a8b71/scratchpad/lift-mutate4-verify/`): `run.sh tbl4 in/tbl4.md` (a flat ledger, `| Term | Meaning | Source | Since |` under a `#` Part, plus a section holding only a 4-column table) loses 4 lines, with `--write` and `--verify HEAD~1` both exiting 0. `in/tbl4c.md` (a passing tree with the same tables) loses the same 4 lines on a no-mapping `--write`. Hand regroups lose them too (`fuzz4.mjs`). Most likely wrong: I call this input realistic, but none of the ~50 local ledgers has such a table, and fuzzing found no other kind of loss.
MUST 2. Two of the unpinned checks are material, G4 and P6b. With G4 off, the empty-purpose mapping (`in/map-emptypurpose.json`) writes a ledger that fails the tree check, and `in/tbl4a.md` writes the owner's table header rewritten as the requirement header; both exit 0, then `--verify` refuses. With P6b off, a new feature with no `label` (`in/map-nolabel.json`) writes `## FEAT-050 · undefined`, and `--write` and `--verify` both exit 0.
P6b proof mapping seq: MATERIAL; see MUST 2.
P9F proof from compare: not material. The default builder always agrees with the proof's own derivation; with P9F off, 150 fuzz cases accept and refuse exactly as at baseline.
P20 matchProse trailing: not material. The writer never adds trailing non-blank prose, the line count is a second guard, and fuzz results match baseline.
V8 duplicate node: not material. The proof's row-order and tree checks refuse it (`in/map-dupnode.json`).
V9 row listed twice: not material. The row-ID count and the row-twice check refuse it.
V11 heading text: not material. A typo in `from.heading` still writes the correct output, byte-identical; a plain-form heading is refused by the tree check and the count.
V12 proposed holds rows: not material. The proof's tree check refuses it.
R5 line break in a mapping string: not material. The heading-sequence, stray-line and line-count checks refuse it.
G4 write proof gate: MATERIAL; see MUST 2.
Vf3 verify pin: not material. A mapping run against the wrong rev is refused by the validator's heading names or by the byte compare.
Vf5 verify proof: not material. It needs a HEAD that was made outside a proved `--write`.
Vf6 verify shape: not material. A malformed committed mapping crashes with exit 1; it never passes.
Vf8 verify fromDefault: not material. The builder is deterministic, and the byte compare still refuses a hand-edited HEAD.
S3 tail.keep: not material. An object crashes with a TypeError and exit 1.
S4 from: not material. An object crashes with exit 1.
S5 head.through: not material. A string value is refused by the validator's head.through check.
S6 features: not material. An object crashes with exit 1.
S7 tail object: not material. An array is refused because the kept sections are "not named".
A1 apply rows sorted: not material. The proof's row-order check refuses it.
Notes: The brief names 19 checks, not 21; all 19 are unpinned at 9eadde0 (45/45 tests pass under each). Earlier repros are all closed: headcut, gate-reach, verify-droprow ×2, the five tree variants, the builder dropping a kept section, every tamper3 case, and the shapes (all named, no crash). The first-round "three extra blank lines" tamper still passes the proof, but only a writer bug could make it. About 600 honest default lifts and 600 regroups (CRLF, BOM, mixed line endings, fences, owner sections) show no loss besides MUST 1. ANSI ledgers and mapping keys are refused.
Q3: Not material. Both runs exit 1 and nothing is written; the tree-shape refusal appears once line 50 is reworded. But the field-label refusal also fires on lines in the head, which is carried verbatim, so the flagged line is harmless. That is yokai line 50, and nana-pi's own ledger line 64 is blocked the same way. SHOULD: exempt head and tail lines, or run every stage.
Q4: aml-desk 6/41/2, basketball-geek 1/9/0 (both copies), trading-zone CAP-01, CAP-90, CAP-02 with FEAT-005–011 under CAP-02. Rows 365/171/165/197 are byte-identical; an independent count finds 0 lines missing, 0 extra and equal blank lines. Write, commit and `--verify` pass on all four. A fresh basketball-geek regroup (a merge, 3 moved rows, a capability move, a proposed feature) writes and verifies, with 0 tree problems and 0 lines lost.
Other non-material issues, all refusals or crashes. A fenced table example inside a section is wrongly refused, because `proof:562` ignores fences (`in/fence.md`). An owner's table in a section with rows is also wrongly refused. A level-3 section with no level-2 parent crashes at `requirements-lift.mjs:305`. A new capability with no outcome is refused with the vague "heading sequence differs".

## Mutation runner

RESULT: 60/60 red (37 exactly their named titles, 5 with a named title green, 20 with an unnamed red), 0 survived

The run covered the whole table at tip 9eadde0, finished with EXIT 0, and wrote 60 judged lines. All five baseline files passed (requirements-lift 45 PASS) before any pair was judged.

SURVIVED lines: none.

ANCHOR-MISS lines: none in the full run. The dry run before re-anchoring had one:
ANCHOR-MISS 4/17 a line after an unterminated last row accepted — scripts/requirements-lift.mjs: anchor occurs 0× (want 1) — "      if (hasTail || lastLeafRows.at(-1) !== lastId) problems.push("

Re-anchor:
- 4/17: the anchor is now `      if (!nothingAfter) problems.push(` → `      if (false) problems.push(` (lift :541, build 4 D2's last-emitted-line rule). As before, this turns off the whole unterminated-last-row refusal, so the mutation is no weaker. Result: `RED 4/17 … 1/1 named: R-1167: a mapping is refused, …; UNNAMED red: … R-1167: a mapping with an empty trailing capability after the last leaf of a ledger ending in an unterminated…` (that second test is build 4's own D2 pin).

New pair M (multiset count disabled):
- Edit: `    if (JSON.stringify([...inMulti].sort()) !== JSON.stringify([...outMulti].sort())) {` → `    if (false) {` (proof :591).
- Result: `RED M proof skips the input-derived line-accounting count (the multiset of non-blank segments) — 1/1 named: R-1163: the proof names a dropped row, …; FAIL detail names 3/3 expected labels; 1 FAIL total`
- T6's FAIL detail lists only the three cases the build added: the extra rowless header pair, the second Purpose: line and the stray fenced block before CAP-01. Each shows `[]`, meaning no other check in the proof catches any of them. The count is therefore their only guard, and these three tests are what pin it.

Survivors: none. The two survivors at 0dc5d1d now red on T6 with the anchors unchanged:
- **2/4:** the "blank line dropped from an in-place leaf" test.
- **2/11:** the "unterminated last row followed by more unterminated output" test.

Named-but-green lines: the same five pairs as at 0dc5d1d (1/5, 1/7, 1/8, 2/9, 3/10). All five are red through other titles, and none is new.

Not covered by the table: build 4 §B copied the mapping file's NUL, encoding, version and invalid-JSON refusals into `runVerify`. Pairs 4/2, 4/12, 4/15 and 4/16 still turn off only `readMapping`'s copy, and no pair turns off the `--verify` copies.

Runner changes (copy only; the lane worktree is untouched and clean, and the scratch worktree was removed):
- Default tip set to 9eadde0.
- DECLARED line (i) added.
- An `expectWhy` check that looks for the expected labels inside a test's FAIL detail.
- `SEAT_MUTATE_LOGDIR`, which keeps each pair's test output.

Files are in /private/tmp/claude-501/-Users-jwang-nana-pi/dea1c010-278e-4392-a90f-df947a3a8b71/scratchpad/lift-mutate4/:
- seat-mutate.mjs
- seat-mutate-output-9eadde0.txt
- dry1.txt (before the re-anchor)
- dry2.txt (after: 60/60 apply)
- logs/ (one test-output log per pair)
