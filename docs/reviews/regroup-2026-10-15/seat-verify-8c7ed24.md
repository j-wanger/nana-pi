# Seat's checks of build 4 (2026-10-16, at 8c7ed24)

Three instruments. (1) The full suite at the tip: every check passed (7,331 pass, 0 fail); its one failing file was the
suite's guard against tracked files changing mid-run, tripped by the seat's runner edit. (2) The seat's mutation runner,
extended for build 4 (13 pairs re-anchored, 2 retired with build 4's removals, 49 new pairs B4/1-B4/49): 195 of 195
red, 0 survived (`seat-mutate-output-8c7ed24.txt`). (3) An independent check: five checkers (build 3's findings re-run;
whether each test pins its title's clauses; shares end to end after amendment 3; a 600-mutant shape fuzzer; the owner's
short packet on three ledgers), each finding re-run from scratch by a separate checker: 47 confirmed (10 MUST, 23 SHOULD,
14 NOTE), 0 not confirmed. The full record quotes real projects' rows and stays in the seat's scratch.

## Proportional stopping

This is the lane's fourth build. Each independent check finds new clauses of the long page rows (R-1178, R-1179) that no
test pins yet, which is the pattern the seat's own notes warn about: a row with many enumerated clauses invites one more
finding every round. So build brief 5 is a closed list — the one behaviour regression (a padded status), the one page
regression (escaped code spans), and the eight named clauses rows read as implemented — and the lane then goes to its
final reviews. Every other finding below is a residual, recorded here and summed up in HANDOFF; none is a safety,
permission or fail-open defect.

## In build brief 5

- [0] MUST · closed · Regression: removing the copied STATUS check reopened prior finding 0 for a padded status. 'proposed ' (or ' active') with no evidence passes the regroup and reaches the ledger as a proposed feature
- [1] MUST · closed · New in build 4: R-1187's 'that the input ledger's feature of the same ID does not share' clause is unpinned. Dropping it refuses every honest proposal that keeps an existing share, and all tests stay green
- [2] SHOULD · closed · Prior findings 1, 11, 23 and 33 are closed in behaviour, but the pin is partial: a blank FEAT-900 status in the feature table leaves every test green
- [3] SHOULD · closed · Prior finding 41 is only partly closed: a page that always prints 'asked in question 1' stays green, because the only asked target sits in question 1
- [5] SHOULD · closed · Prior finding 39 is only partly closed: T7's unknown-verdict case still passes with the VERDICTS check removed, and about 38 refusal cases still assert only an ID or line number read from stdout and stderr
- [10] MUST · tests-pin · The R-1170 test does not check the heading text or the 'own tree ID differs' clause. R-1170 reads implemented on this test alone
- [11] MUST · tests-pin · FEAT-900's status in the feature table is still unchecked. A blank status leaves both tests that claim it green
- [12] MUST · tests-pin · No R-1178 test checks the node list's subgroup lines, capability purposes or capability labels, or the reserved subgroups' seed text
- [13] MUST · tests-pin · The appendix can drop every subgroup row, or list subgroup rows under the parent feature, and T16 stays green
- [14] SHOULD · tests-pin · An asked target's question number is unchecked: a constant 1, or the wrong question, passes T16
- [15] MUST · tests-pin · R-1187's 'with that feature among its targets' is unchecked. A share verdict that names a different feature lets a merged share reach the ledger with no review of it
- [16] MUST · tests-pin · No test refuses a stale reason claim. A reason reworded after review passes when the reason-text compare is removed
- [19] SHOULD · tests-pin · Brief 4's stderr-only rule is not applied: refusedCase reads stdout too, 18 cases assert only names the lift prints on stdout, and two cases stay green with their own check deleted
- [22] SHOULD · tests-pin · Six build-4 test titles are cited in no Evidence cell
- [23] SHOULD · tests-pin · T11 asserts the problem-line cap as inline literals (40, 41), so retuning PROBLEM_LINE_CAP makes an honest run fail
- [27] MUST · shares · R-1187 reads implemented, but no test pins its exemption for a share that stays: two mutants that refuse every unchanged share leave the regroup test file 51/51 green
- [38] MUST · page · No cited test pins that reserved subgroups (SUB-900 to SUB-904) show the seed's label and purpose. Rendering them from the proposal blanks them on every project with G rows, and all 51 tests still pass
- [39] SHOULD · page · An angle-bracket escape added in build 4 corrupts code spans: 33 nana-pi rows render '&lt;provider&gt;' literally in the appendix
- [43] SHOULD · page · Six build-4 test titles are cited in no Evidence cell, among them five page tests for R-1178 and R-1179

## Residuals (not in brief 5)

- [4] SHOULD · closed · Prior finding 37 is still open: R-1170's cited test pins neither the heading text nor the 'own tree ID differs' clause, though build brief 4 item 7 asked for 'each with its heading text and node'
- [6] SHOULD · closed · Prior finding 21 is still open (build brief 4 did not direct a fix): moving a shared row into the feature that shares it passes only with a share verdict targeting the row's own home
- [7] NOTE · closed · Six build-4 test titles are cited in no row's Evidence cell (build brief 4 item 9: 'Cite every build 3 and build 4 title')
- [8] NOTE · closed · Residual of prior finding 26 after build brief 4 item 10: a rejected claim's label and its Reason still merge into one Markdown paragraph
- [9] NOTE · closed · escapeAngles also escapes '>', so raw page text changes wherever row text holds '->' or '>='
- [17] SHOULD · tests-pin · The rejected-claim question match for a reason claim ignores 'to' and every test stays green. Two rejected reasons on one old line can share one question
- [18] SHOULD · tests-pin · T8's 'a share carried to one feature and refuted for another passes' is not checked by any case
- [20] SHOULD · tests-pin · R-1173's empty-reason refusal has no test: deleting it leaves the suite green, and a reported line passes with an empty reason
- [21] SHOULD · tests-pin · Amendment 3's 'a share that stays on the same feature needs none' is unchecked. Over-refusing every unchanged share leaves the suite green
- [24] SHOULD · tests-pin · The header-paragraph test does not check its own 'proof line' clause: merging the proof line into the Drafter line stays green
- [25] SHOULD · tests-pin · Several page clauses are checked for one node only: one feature's label, one capability's outcome, one feature's status mix
- [26] NOTE · tests-pin · The lift-script --out case goes red under a dropped clash check only because the mirror crashes: the mirror has no seed (prior finding 46 is still open)
- [28] SHOULD · shares · A share declared in shares_added reaches the ledger with no share verdict and never appears on the page when the feature reuses an ID whose input feature shared that row
- [29] SHOULD · shares · Still open from check 3, and now against amendment 3's text: a merge or demotion into a shared row's home, or a row moved into the feature that shares it, refuses honest keep verdicts and passes only with a share verdict that targets the row's own home
- [30] SHOULD · fuzz · A capability 'rows' value that is not an array, or that holds a bad ID, crashes the lift's validateMapping. The regroup then exits 1 printing the lift's stack trace and never names tree[0].rows
- [31] SHOULD · fuzz · Question 'about' entries that mix shapes pass, and the second shape is never checked. A claim-style node+field naming an ACCEPTED claim passes when the entry also carries id+to, and 'field' passes with any type
- [32] NOTE · fuzz · regroup.placed and regroup.evidence of a wrong container type pass silently when nothing reads them (null, number, string, boolean or array)
- [33] NOTE · fuzz · A feature label containing '|' breaks the page's feature table, so a renderer shows the wrong status and row count for that feature
- [34] NOTE · fuzz · A row with a blank Status cell prints a blank word in the page's status mix
- [35] NOTE · fuzz · A reserved node's label, purpose, outcome or status, and an empty tail's heading, accept any type or value and are silently ignored (exit 0)
- [36] NOTE · fuzz · Refusal wording residuals are still open: 'undefined' and '[object Object]' appear in refusals, null/string/number containers are called 'an object', and 1e400 is reported as 'not null'
- [37] NOTE · fuzz · Outside the threat model: a 4,000-deep nested array (for example in regroup.read) overflows the lift's recursive stringsOf, and the regroup prints a RangeError stack trace
- [40] NOTE · page · A share that the proposal drops reads on the page as a share someone proposed and the reviewer refuted. The page never says added or dropped, and --write deletes the existing Also applies line
- [41] SHOULD · page · In a Markdown renderer, a rejected claim and its reason still merge into one paragraph
- [42] SHOULD · page · T14 and T16 still pass when the page lists accepted claims as rejected, puts a reason on the wrong reported line, leaves rows out of the appendix, or blanks feature statuses, questions or outcomes after the first
- [44] NOTE · page · With 10 or more questions, a recommendation drops out of its list item
- [45] NOTE · page · A bare <placeholder> in a purpose, label, reason, ask or recommendation still disappears in a renderer
- [46] NOTE · page · Status mix lists statuses in row order, so the same status sits in different positions on adjacent table rows; a rejected claim names no question number
