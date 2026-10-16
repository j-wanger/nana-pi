# Lane regroup — build brief 4 (2026-10-16 · feat/regroup · tip after the seat's records commit)

**Builder: Claude Sonnet 5.** Build 3 (`656dc86`) passed the full suite and closed most of build 2's findings. The seat's
checks of build 3 (`seat-verify-656dc86.md`) found seven blocking gaps, most of them tests that do not pin what their
titles and rows claim. The seat's mutation runner caught 139 of 148 breaks (`seat-mutate-output-656dc86.txt`; 9
survived). Read `seat-verify-656dc86.md` and seat amendment 3 at the end of `CHANGE.md` first. Build brief 1's rules
hold: touched test files only, in the foreground (`node scripts/test.mjs <file>`), each tool call under 5 minutes; never
`npm run test:locked`; commit after each item; push; never write in a real project.

**A rule for every refusal test from now on.** A refusal case asserts a substring that only its own check prints, read
from **stderr only**. The lift's dry run echoes heading lines and row IDs on stdout, so a row ID or line number found
anywhere in the output pins nothing. Keep each case's fixture in step (claims, reasons, evidence) so that only its own
check can refuse it. Check this by deleting the check and seeing the case go red.

1. **A status is a string (M1).** A feature `status` that is not a string is refused by name in the shape check. Remove
   the copied `STATUS` pattern and `statusProblems`: the lift's tree check already refuses a status string the tree does
   not allow, before the regroup's own check runs (finding 44), so the copy only risks drifting. The gap test and the page
   read the same string. Cases: `["proposed"]` and `["active"]` on a feature with no rows and no evidence are refused.
2. **The reserved rows in the feature table (M2).** The feature table shows each reserved feature's label and status as
   the lift will write them (`seedNodeText`), as the node list already does. T14 asserts FEAT-900's table row on the
   lift's own default start and on a proposal that gives FEAT-900 other text.
3. **Seat amendment 3 (M7).** Reword R-1187 with amendment 3's text verbatim and check it: a row that a feature's
   `also_applies` names, which the input ledger's feature of the same ID does not share (read with the tree parser's share
   reader), needs a `share` verdict targeting that feature. T24 gains a merge case and a demotion case on its tree-form
   fixture: each is refused without the verdict and passes with it, and the page line reads `share` and `carried`.
4. **T14 and T16 pin the page (M3).** Each must red when any one of these is dropped from the page: a question's
   recommendation; a non-reserved purpose; a capability's outcome; a reserved node's seed outcome; a reported line's
   reason; a target's own reason; a text-placed row's gist, home or reason; the claim-verdict count; a feature's status
   mix and subtree row count; the rejected claim's name; the appendix's grouping by node; an asked target's question
   number. The fixture already carries a distinct marker for each (`recommend alpha`, `reason item N`, `target alpha`,
   `placed item N`, the purpose texts, the seed outcome); assert them.
5. **R-1172 (M4).** Keep each T4 case's claim in step, so only the placeholder check can refuse it, and add a
   capability-purpose case. Assert the placeholder check's own words.
6. **R-1173 (M5).** Add the moved-reason case: line 30's reason given at line 15 with claims kept in step. Assert
   `more than one reason` for line 15 and the missing-reason message for line 30, on stderr.
7. **R-1170 (M6).** The R-1170 test asserts a printed line for every named heading: the capability headings, a subgroup
   heading (add one to its fixture) and the feature headings, each with its heading text and node.
8. **The nine survivors.** Add a case each: a directory at `--out` (B2/4; assert the directory refusal's own words); a
   question `about` entry naming an unknown row (B2/23); an evidence array holding a non-string (B3/8); the exact-type
   check for a claim's `to`, a refuted entry's `to`, and a question `about` entry's `id`, `to`, `node` and `line`
   (B3/20, B3/22 to B3/26).
9. **Untested clauses (SHOULD).** Cases for: drafter and reviewer lineage named; a refuted entry's empty reason; a move
   or share verdict with no targets; a target refuted twice; a run the lift refuses removes an earlier review page; T11's
   count of the rest (not the total); the rejected-claim question matching both node and field. T8: run a carried share
   through the command (not only a direct call), so its title's "a share carried … passes" is true. Cite every build 3 and
   build 4 title in its row's Evidence cell.
10. **Page and behaviour fixes (SHOULD).** A failing run reads `--out` for an earlier page only when it is a regular file
    (`--out /dev/stdout` on a terminal must not hang). A target line shows its own argument as `proposed because …`, and
    a refuted target shows the refutation's reason beside `refuted`. A question `about` entry with an `id` but no `to`,
    an empty one, or a claim-style one naming no rejected claim is refused. A citation's path after a `·` join counts. An
    active gap's evidence shows on the page like a proposed one's. Empty target and reported-line sections print
    `(none)`. Field lines on the page are separate Markdown lines or list items, so a renderer does not merge them into one
    paragraph. A `<placeholder>` in row text is escaped in gists and the appendix. Remove the redundant early evidence-shape
    refusal in `main` if the shape check already covers it, and drop that clause from the test title. Fix the two test
    comments that still describe the lift before the merge.

Do not change any row's text except R-1187 (amendment 3, verbatim). Do not touch `CHANGE.md`, the seat's files,
`HANDOFF.md` or `docs/sessions/`.

## Done
The touched test files green; `node docs/reviews/regroup-2026-10-15/seat-titles.mjs 1` → `0 missing`;
`node docs/reviews/regroup-2026-10-15/acceptance.mjs > docs/reviews/regroup-2026-10-15/acceptance-output.txt 2>&1` → only
the seat's HANDOFF/session cases miss; `node scripts/requirements-tree.mjs --check`; `node scripts/code-map.mjs --check`;
`npm run -s readme:check`; `node scripts/requirements-trace.mjs`. Commit, push.

## Report
≤ 25 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; each item with the red you saw first; the touched
test files' summary lines; the last line of each seat output; the one claim most likely wrong.
