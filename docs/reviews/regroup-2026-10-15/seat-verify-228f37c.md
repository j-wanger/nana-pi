# Seat's checks of build 2 (2026-10-16, at 228f37c)

Two instruments. (1) The seat's mutation runner, extended for build 2 (10 pairs re-anchored, 23 new pairs B2/1-B2/23):
101 of 104 red, 3 survived — `seat-mutate-output-228f37c.txt`. (2) An independent check: six checkers each attacked one
angle in private copies (build 1's seven MUSTs; `--out` safety; a 500-mutant shape fuzzer; evidence placement against the
trace rail on four real ledgers; the owner's short packet; review records and the merge with main `2dbc817`), and a
separate checker re-ran every finding from scratch. 50 reported, 45 confirmed (8 MUST, 32 SHOULD, 5 NOTE), 5 not
confirmed. Every finding with its repro and verdict stays in the seat's scratch, because it quotes real projects' rows. No checker wrote in the lane, main or any
project (a guard watched).

## Blocking (each goes into build brief 3)

- M1. An evidence value written as an object, number or boolean crashes the run before the lift and leaves an earlier page (findings 0, 9, 16). Build 2 fixed four shape slips; this is a fifth of the same kind.
- M2. A failing run deletes a non-page file whose first line merely begins with the page head (10): the check is a character prefix, not the whole first line.
- M3. A reason whose `to` is an array passes R-1173 by string coercion, skips R-1184's stale-text check and prints a blank reason (17).
- M4. Reserved nodes show a blank label, purpose and outcome on the page, or proposal text the lift never writes (31; also 2, 25).
- M5. After merging main, the checker refuses `shares_added` and `shares_dropped` as unknown keys (38): the cross-lane step the shares plan gives the second lander.
- M6. After merging main, a share added or dropped needs no share verdict and never reaches the page (39). Plan reopened: seat amendment 2 in `CHANGE.md`.

## Mutation survivors and test weaknesses (SHOULD; brief 3)

- 4/4, B2/9, B2/16 survive because another check refuses the same broken proposal first; the cases assert only that a row ID is named, not the check's own message (also findings 5, 6, 7).
- Pair 2/7 reds by crashing the test file (ENOENT reading a removed file), so later checks never run.
- T14 and T16 do not pin most of the page their titles claim; five page mutations leave all checks green (32).
- R-1176's plain-form split is not pinned (29). T8's title claims a carried share it never runs, and build 2's six new titles are cited in no Evidence cell (1, 40).
- The R-1171 lift-script test points `--out` at the checkout's own lift, so a regression overwrites a tracked source file (4, 14).

## Other confirmed findings

- [0] MUST · gaps · MUST 3 is only partly closed: an evidence value written as an object, number or boolean still crashes the run and leaves the earlier page
- [1] SHOULD · gaps · MUST 7 is only partly closed: T8's title still claims a carried share it never runs, and none of build 2's six new titles is cited in an Evidence cell
- [2] SHOULD · gaps · MUST 5 is only partly closed: the feature table carries no labels, and the reserved nodes print blank labels, purposes and outcomes
- [3] SHOULD · gaps · The nested node list renders subgroups as a code block in Markdown
- [4] SHOULD · gaps · The R-1171 lift-script test overwrites the checkout's real scripts/requirements-lift.mjs when the clause regresses
- [5] SHOULD · gaps · T6's "active feature with no rows" case is masked by R-1184, so build 2's active-gap fix is unpinned
- [6] SHOULD · gaps · The seat's survivor 4/4 is still open: T5's same-text-heading case is masked by R-1184 (brief 2 named 4/1 instead)
- [7] SHOULD · gaps · The claim integer-line check is unpinned (masked by the missing-claim check); the behaviour itself holds
- [8] SHOULD · gaps · Small refusal-message and edge-crash nits
- [9] MUST · out-safety · An evidence value written as an object, number or boolean crashes the --out pre-check and leaves an earlier page in place
- [10] MUST · out-safety · A failing run deletes a non-page file whose first line merely begins with the page head
- [11] SHOULD · out-safety · An earlier page saved with a UTF-8 BOM is not recognised and survives a failing run
- [12] SHOULD · out-safety · With --out a symlink, a failing run deletes the link and leaves the stale page at the link's target
- [13] SHOULD · out-safety · An unwritable --out crashes with a stack trace instead of a named refusal
- [14] SHOULD · out-safety · The lift and evidence clause test points --out at the checkout's own lift, so a regression overwrites a tracked source file
- [15] SHOULD · out-safety · --out /dev/stdout on a terminal: a failing run hangs reading the terminal
- [16] MUST · never-crash · A non-array value inside regroup.evidence crashes the checker before the lift runs, and the earlier review page survives
- [17] MUST · never-crash · A reason whose 'to' is written as an array passes R-1173, skips R-1184's stale-text check, and prints a blank reason
- [18] SHOULD · never-crash · A proposed feature whose status has a trailing space or is written as an array loses its Evidence line on the page
- [19] SHOULD · never-crash · Lineages that differ only by whitespace read as 'another lineage' with no same-family declaration
- [20] SHOULD · never-crash · Refuted entries and question 'about' entries that resolve no proposed target are accepted, and the page prints 'R-001 -> undefined'
- [21] SHOULD · never-crash · Claims matching no required purpose, outcome or reason are accepted unchecked; the header overcounts them and a reasonless reject prints 'Reason: undefined'
- [22] SHOULD · never-crash · A keep verdict carrying targets is accepted, and those targets are dropped without notice
- [23] SHOULD · never-crash · A question without 'ask' is accepted, and the page prints the decision as 'undefined', 'null' or '[object Object]'
- [24] SHOULD · never-crash · An --out the checker cannot write crashes with a stack trace after every check passes
- [25] SHOULD · never-crash · For reserved nodes, the page prints the proposal's label, purpose and outcome unchecked, which are blank from --emit-mapping, though the lift writes the seed's text
- [26] NOTE · never-crash · Shape messages are duplicated for questions and call null, number and string values 'an object'
- [27] NOTE · never-crash · Some regroup fields are silently ignored: read is never shown, evidence for non-gap or unknown features is never checked, and a non-canonical same_family is ignored
- [28] SHOULD · evidence · A citation naming an existing file plus a locator (§5, section 4, a quoted section title, :41-53, a '·' join) reads as text-placed, and the refusal wrongly says there is no evidence path
- [29] SHOULD · evidence · R-1176's plain-form test stays green when plain cells are not split on commas (the rail's plain reading is not pinned)
- [30] NOTE · evidence · Rarer syntactic forms read as text-placed although they name an existing path (none occur in the four ledgers)
- [31] MUST · packet · Reserved nodes (CAP-90, FEAT-900, SUB-900 to SUB-904) show a blank label, purpose and outcome on the page, or text the lift will never write
- [32] SHOULD · packet · T14 and T16 do not pin most of the page content their titles and R-1178/R-1179 claim; five page mutations leave all 26 checks green
- [33] SHOULD · packet · Subgroups render as an indented code block, not as nested headings, in any Markdown viewer
- [34] SHOULD · packet · The move and share targets list does not say which targets are moves and which are shares, gives no current home, and gives no question number for 'asked'
- [35] SHOULD · packet · No feature status appears anywhere: a proposed gap is not marked proposed, frozen features are not marked, and the feature table has no label or capability
- [36] SHOULD · packet · A lineage label with a trailing space reads as 'another lineage' on the page, and the run passes without same_family
- [37] SHOULD · packet · A retired feature with no rows is refused as a gap that lacks evidence, though the tree and the lift accept it
- [38] MUST · records-shares · Merge: the checker refuses shares_added and shares_dropped as misspelled keys, so after merging main no proposal can carry or drop a share, and the merged suite stays green
- [39] MUST · records-shares · Merge: a share added or dropped by the proposal needs no share verdict and never appears on the owner's page; a refuted or asked move target can also be added as a share while the page says 'refuted'
- [40] SHOULD · records-shares · T8's title claims a carried share passes, but its CLI pass case carries nothing; the carried clause is pinned only by a direct-call check that R-1175's Evidence cell does not cite
- [41] SHOULD · records-shares · Stray or stale refuted and question-about entries are accepted and shown to the owner, including a refuted line that prints 'undefined'
- [42] SHOULD · records-shares · Stray claim verdicts are accepted, inflate the page's claim-verdict count, and a stray rejected claim is listed on the page
- [43] NOTE · records-shares · Minor review-record shapes accepted silently: a repeated target in one share verdict, a keep verdict carrying targets, and a move target that equals the row's own home
- [44] NOTE · records-shares · Merge consequences for the lane (consolidated list; the first two findings are the blocking items)

## Not confirmed

- out-safety · Files the run reads but R-1171 does not list are overwritten with exit 0, including the lift's seed and .git/HEAD — I reproduced all three overwrites in private copies of the lane at 228f37c. With --out pointed at the seed, at requirements-tree.mjs or at <root>/.git/HEAD, each run exits 0 and replaces that file wit
- never-crash · Every run, including refusals, adds four Node module-type warning lines to stderr — The report did not reproduce. I ran the checker CLI 60+ times on refusal paths, and the regroup test file spawned it and the lift 103 times across refusal and success paths. None of those runs printed
- evidence · A directory counts as an existing evidence path, including a bare prose word in a plain cell, so a row that says 'no test pins this clause' escapes the text-placed list — I reproduced it from a fresh copy of the lane at 228f37c. At scripts/requirements-regroup.mjs:111, existsUnder uses existsSync, so a directory counts as an existing evidence path. That helper decides 
- evidence · Prose evidence that mentions existing source files mid-sentence is text-placed — I reproduced the report exactly, starting from my own copy. The checker marks 15 work-project rows and 3 nana-pi rows as text-placed. Each of their Evidence cells is one prose sentence with no backticks a
- packet · Cosmetic and misreadable page details — I reproduced all seven observations in my own copy at 228f37c, using a fixture built from the test file's own honest proposal. None of them breaks a row, the plan or the "Short package" ruling. They a
