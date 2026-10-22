# Review brief — req-tree build, 2026-10-09 (reviewer: gpt-5.6-sol; roles: scope + adversarial)

**Round 3 — the last allowed for this item.** Your build reviews are `sol-build-r1.md` (SEND-BACK
5/10) and `sol-build-r2.md` (SEND-BACK 5/10). The fix runs used `build-brief-3.md` and
`build-brief-4.md`; reports `builder-report-3.md` and `builder-report-4.md`. Verify every r1 and r2
finding is closed, then review the build as a whole. If something still blocks, rank it honestly:
after this round the seat lands with declared residuals, subtracts, or takes it to the owner.

Seat notes for round 3 (the seat's own battery, `seat-attacks.mjs`, output in
`seat-attacks-output.txt`; it imports `checkTree` and alters scratch copies only): every r1/r2
attack is red (row under the closing heading, after prose, after a blank line, header without
delimiter, row in a fence, SETEXT after FEAT-001 / before CAP-01's purpose / between CAP-01 and
FEAT-001, indented ATX, level-4 before a purpose, duplicate SUB id); a fenced ATX line and a
thematic break after a blank stay green; the real ledger is green. The seat's own expander counts
1,009 IDs in the committed outline, none missing, none extra. The proof still exits 0. Declared
residual from the builder: HTML blocks/comments, link reference definitions and indented code are
not modeled; the ledger uses none.

You reviewed this lane's PLAN three times (item `req-tree-plan`; your reviews are
`docs/reviews/req-tree-2026-10-09/sol-plan-r{1,2,3}.md`). The owner agreed it at checkpoint 1 (CHANGE §7a;
approved commit `6b9202a501a7fe03dfc834ab34cdfc212f6d92ce`). A pi luna builder has now built it in two
runs (briefs `build-brief.md`, `build-brief-2.md`). Review the build: `git diff 6b9202a..HEAD`, in full.
The ledger diff is large because every row moved; judge it through the proof and by sampling, not by
reading 2,000 lines.

## Attack

1. **Bytes.** Run `node docs/reviews/req-tree-2026-10-09/prove.mjs --approved 6b9202a501a7fe03dfc834ab34cdfc212f6d92ce REQUIREMENTS.md docs/requirements-sections-2026-10-09.md`.
   Then try to defeat it: on scratch copies in the OS temp dir (never the worktree), make a change
   that loses or alters a row byte, a prose byte, a blank line, a note's position, the intro, or the
   Open questions / Deliberate omissions blocks, and see whether it still exits 0. Independently of
   `prove.mjs`, compare the base and new ledgers yourself: ID multiset, each row line, and the
   multiset of non-row lines (expect only the declared additions and the one intro edit).
2. **The proof's own honesty.** Does `prove.mjs` implement CHANGE §4 exactly, read every frozen input
   from the approved commit, and share no code with `move.mjs`? Is any check weaker than the contract?
3. **Structure rules and the outline.** Do `scripts/requirements-tree.mjs` and
   `packages/nana-pack/tests/requirements-tree.test.mjs` pin R-287–R-291 as worded? For each row:
   which clause does the cited test pin? Break each check in the code (mutation) and confirm a test
   goes red. Can a row sit outside a feature, a purpose be empty, an ID repeat, a heading nest wrongly,
   or the outline omit a field, with the suite green?
4. **Consumers.** Run the rail (`npm test` is heavy; at least `node --experimental-strip-types
   packages/nana-pack/tests/requirements-trace.test.mjs`, `npm run req:rows -- scripts/code-map.mjs`,
   `npm run map:check`, `npm run readme:check`). Does anything that reads the ledger or the new files
   break or silently weaken?
5. **Scope.** `git diff --stat 6b9202a..HEAD`: anything outside the allowlist, any frozen input edited,
   any pre-existing row's cells changed, any ID other than R-287–R-291?
6. **The reader's view.** Read `docs/requirements-tree.md` and the top of `REQUIREMENTS.md` as the owner
   will. Is the outline plain, correct and short? Is anything misleading?

## Output

Answer with the full review as your final message; do not write it to a file. Rank findings
MUST / SHOULD / NOTE with file:line, evidence (what you executed) and the smallest fix. A MUST is a
lost or altered byte, a proof weaker than the contract, a structure rule the suite does not enforce,
a broken consumer, or a scope breach. Score out of 10, then the last line exactly one of
`VERDICT: LAND`, `VERDICT: LAND-WITH-FIXES`, `VERDICT: SEND-BACK`.

## Seat notes before this round (verified by the seat with its own script, not the builder's)
- `prove.mjs` exit 0: "1004 base rows preserved once; 5 new rows; 125 ledger blocks and 1554
  physical lines accounted; 64 old headings mapped".
- Independent check: all 1,004 base row lines byte-identical; added exactly R-287–R-291; no frozen
  input edited since 6b9202a; the only removed prose is the intro line replaced by the declared
  `intro_edit` (verified equal after the replacement) and the §10 note's three lines (present in the
  section map); the only added prose is `fixed-text.md` and generated heading/purpose/outcome/
  see-also/note-header lines.
- Reader's view, for your item 6: capability lines and subgrouped-feature lines in
  `docs/requirements-tree.md` read "Rows: 0 · IDs: —" because they count only rows directly under
  that heading. Judge whether that misleads the owner.
- Builder reports (`builder-report-1.md`, `builder-report-2.md` beside this brief) give the mutation
  pairs; re-run any you doubt.
