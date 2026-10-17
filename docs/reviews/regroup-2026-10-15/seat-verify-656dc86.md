# Seat's checks of build 3 (2026-10-16, at 656dc86)

Three instruments. (1) The full suite at the tip: every check passed (7,318 pass, 0 fail); its one failing file was the
suite's own guard against tracked files changing mid-run, tripped by the seat's runner edit. (2) The seat's mutation
runner, extended for build 3 (12 pairs re-anchored, 44 new pairs B3/1-B3/44): `seat-mutate-output-656dc86.txt`.
(3) An independent check: six checkers each attacked one angle in private copies (build 2's findings re-run; a 600-mutant
shape fuzzer; shares end to end with write and verify; the owner's short packet on three ledgers; whether each test pins
its title's clauses; the merge with main and the lift), and a separate checker re-ran every finding from scratch. 52
confirmed (10 MUST, 21 SHOULD, 21 NOTE), 0 not confirmed. The full record quotes real projects' rows, so it stays in the
seat's scratch. No checker wrote in the lane, main or any project (a guard watched).

## Blocking (build brief 4)

- M1. A feature status written as a one-element array (`["proposed"]`) passes the status check by string conversion, skips R-1174's evidence demand, and the lift writes `Status: proposed` with no evidence (findings 0, 10). Build 3 narrowed the gap test and opened this.
- M2. The feature table prints the reserved FEAT-900 row's label and status from the proposal — blank on the lift's own start, or text the lift ignores (1, 11, 23, 33).
- M3. T14 and T16 stay green under each page break build brief 3 item 7 named: recommendations, purposes, outcomes, line reasons, target reasons and text-placed gists dropped (32; also 2, 24, 41).
- M4. R-1172's test is masked: three of its four cases are refused by R-1184's stale-claim check first, and no case covers a capability's purpose (34).
- M5. R-1173's "two same-text headings are reasoned apart" is unpinned, and many refusal cases assert only names the lift's echoed stdout already holds (35, 39).
- M6. R-1170's test does not pin "every named heading": capability heading lines can drop and the lift tests stay green (36, 37, 50).
- M7. A share that a merge or demotion moves onto another feature reaches the ledger with no verdict and off the page (19). Plan: seat amendment 3 in `CHANGE.md`.

## Other confirmed findings

- [0] MUST · closed · Prior finding 18 is only partly closed: a feature status written as an array still passes. For ["proposed"] the check skips the R-1174 evidence demand, the lift writes "Status: proposed", and the page has no Evidence line
- [1] MUST · closed · Prior findings 2, 25, 31 and 35 are only partly closed: the feature table's FEAT-900 row shows a blank label and status, or proposal text the lift ignores, though the node list now uses the seed
- [2] SHOULD · closed · Prior finding 32 is still open: none of the five page breaks it named reds T14 or T16, though build brief 3 item 7 required each one to
- [3] SHOULD · closed · Prior findings 20 and 41 are only partly closed: question 'about' entries with an id but no 'to', empty ones, and claim-style ones naming no rejected claim are still accepted
- [4] SHOULD · closed · Prior finding 28 is only partly closed: a citation whose existing path follows a '·' join is still text-placed, and the refusal says the cell names no existing path
- [5] SHOULD · closed · Prior findings 1 and 40 are only partly closed: T8's title still claims a carried share passes, but its body never runs one
- [6] SHOULD · closed · Prior finding 15 is still open: with --out /dev/stdout on a terminal, a failing run hangs reading the terminal
- [7] NOTE · closed · Prior finding 8 is only partly closed: the unwritable-parent crash is fixed, but questions given as one object or a string still print the same line twice, and the type word is wrong
- [8] NOTE · closed · Prior finding 16 is closed as far as the crash goes; residual: regroup.evidence written as an array is never refused by shape
- [9] NOTE · closed · Residual of prior findings 3 and 33: subgroups now render as headings, but adjacent lines still merge into one rendered paragraph
- [10] MUST · fuzz · A feature status written as a one-element array passes the status check and skips R-1174's evidence demand; the page drops the Evidence line
- [11] MUST · fuzz · The feature table prints the reserved FEAT-900 row with a blank label and status, or with proposal text the lift ignores
- [12] NOTE · fuzz · regroup.read is never shown on the page, and any value is accepted
- [13] NOTE · fuzz · Stray records are still accepted silently: evidence for a non-gap or unknown feature, question about-entries that name nothing, and a move or share verdict's own reason of any type
- [14] NOTE · fuzz · An evidence path in the wrong case passes R-1174 on macOS and is printed as written, though git and a case-sensitive volume do not know it
- [15] NOTE · fuzz · A repeated share target and a repeated evidence path pass and are printed twice on the page
- [16] NOTE · fuzz · Non-canonical same_family values and any pin.rows value are ignored without a word
- [17] NOTE · fuzz · Shape messages misname null, string and number values as "an object", the questions shape error prints twice, and some refusals print "undefined"
- [18] NOTE · fuzz · An empty outcome and a whitespace-only label print blanks on the page; this mirrors what the lift and tree checker accept
- [19] SHOULD · shares · A share that follows a merged or demoted feature onto a different feature reaches the ledger with no share verdict and never appears on the owner's page
- [20] SHOULD · shares · No test runs a share through the command, so the page's 'carried' line is unpinned: dropping carried targets from the page leaves every test green
- [21] SHOULD · shares · Moving a shared row into the feature that shares it passes only with a share verdict that targets the row's own home
- [22] NOTE · shares · The page cannot tell an added share from an unchanged one, or a dropped existing share from a rejected new one; unchanged shares never appear, and empty target and line sections print nothing
- [23] MUST · page · The feature table prints FEAT-900's label and status from the proposal: blank on the lift's own start, or proposal text the lift ignores, never the seed's
- [24] SHOULD · page · T14 and T16 still do not pin six page clauses their titles claim: finding 32 is open and brief 3 item 7 is unmet
- [25] SHOULD · page · A target line prints its outcome and then the target's own argument, so 'refuted — <reason>' reads as the refutation's reason
- [26] NOTE · page · Rendered as Markdown, adjacent field lines merge into one paragraph: the header hashes and proof line, ask+recommendation, Purpose+Outcome, Line+Reason
- [27] NOTE · page · The page never says whether a share target is added, dropped or already carried, and a rejected claim gives no question number
- [28] NOTE · page · Empty 'Move and share targets' and 'Reported lines' sections print nothing, while every other section prints '(none)'
- [29] NOTE · page · An active feature with no rows must name evidence, but the page shows that evidence only for proposed features
- [30] NOTE · page · Row text holding a bare <placeholder> renders as an HTML tag and vanishes in the gists and the appendix
- [31] NOTE · page · The lift's synthetic 'Not yet sorted' capability label passes the checker and reaches the page
- [32] MUST · tests-pin · T14 and T16 still pass under all five page breaks that build brief 3 item 7 required them to catch, and under a blank seed outcome for CAP-90
- [33] MUST · tests-pin · The feature table prints the reserved feature FEAT-900 with a blank label and status, though the lift writes the seed's label and 'Status: active'
- [34] MUST · tests-pin · R-1172's only test does not pin its outcome, subgroup or capability-purpose clauses; three of T4's four cases are masked by R-1184's stale-claim check
- [35] MUST · tests-pin · R-1173's 'two same-text headings are reasoned apart' is still unpinned: reasons keyed by heading text with a multiset shortfall check pass T5, and its line-number names are satisfied by the lift's echoed stdout
- [36] MUST · tests-pin · R-1170's only test does not pin 'every named heading': a plan print that skips capability heading lines leaves the whole lift test file green
- [37] SHOULD · tests-pin · R-1170's cited test pins neither the heading text nor the 'own tree ID differs' clause; only uncited R-1162, R-1166 and R-1181 tests catch them
- [38] SHOULD · tests-pin · Four R-1175 clauses have no test: drafter and reviewer named, a refuted entry's reason, a move or share with zero targets, and a target refuted twice
- [39] SHOULD · tests-pin · Build brief 3 item 8a is not met: most refusal cases assert only an ID or line number, and T7's unknown-verdict case passes with the VERDICTS check removed
- [40] SHOULD · tests-pin · No test pins that a run the lift refuses removes an earlier review page
- [41] SHOULD · tests-pin · Further page clauses unpinned: claim-verdict count, status mix, subtree row count, which claim was rejected, appendix grouping by node, and the question number
- [42] SHOULD · tests-pin · T8's title still claims a carried share passes, but T8 stays green when no target is ever counted as carried
- [43] NOTE · tests-pin · Nine build-3 test titles are cited in no Evidence cell, and several pin behaviour no row states
- [44] SHOULD · tests-pin · 73c846d: nothing keeps the regroup's copied STATUS pattern in step with the tree checker's; the copy is unreachable in a CLI run, and drift would refuse an honest status
- [45] SHOULD · tests-pin · T11 does not pin the count of the rest: printing the total instead stays green
- [46] NOTE · tests-pin · The mirror used for the lift-script --out case lacks the seed, so that half goes red only because the mirrored lift crashes
- [47] SHOULD · tests-pin · The early evidence-shape refusal in main is redundant; the title clause 'before the --out pre-check reads it' cannot be observed
- [48] NOTE · tests-pin · T24's 'a dropped one passes only refuted or asked' is enforced by the lift, not by the regroupProblems call T24 makes
- [49] SHOULD · tests-pin · The rejected-claim question match ignores the field without any test going red
- [50] SHOULD · merge-lift · R-1170's cited test does not pin the capability and subgroup heading lines its title claims; a print that drops them leaves the lift and regroup suites green
- [51] NOTE · merge-lift · Two comments in the regroup test still describe the lift as it was before the merge: it 'refuses also_applies until regroup-shares lands' and a share is carried 'only by direct call'
