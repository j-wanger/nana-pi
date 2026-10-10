# Change declaration — the land rule: nothing reaches main without an independent reviewer

*Lane `land-rule` · branch `feat/land-rule` · worktree `~/nana-pi-wt/land-rule`, based on `main`
at `1836fa3` (the requirements tree and four-digit IDs) · 2026-10-10. Features: **FEAT-008 ·
Integrate and clean up reviewed changes** (home of the land rows; it has no subgroups) and
**FEAT-007 · Review a specific revision independently** (homes: SUB-009 "Accept and record a valid
result" for R-969 and R-1010; SUB-010 "Protect and inspect review records" for R-1008, R-731, R-970
and R-992; R-969 and R-992 are shared with FEAT-008).
Order: why → plan → Fable consult (`fable-consult.md`) → seat fact-check (`factcheck.md`) → sol plan
review (item `land-rule-plan`; r1 and r2 SEND-BACK, answered in `sol-plan-r1-response.md` and
`sol-plan-r2-response.md`) → Jake's tree decisions (checkpoint 1, before the build) → build → seat
verification → sol build review → astra land review → Jake accepts (checkpoint 2).*

## 1. Why

Jake, 2026-10-10, on "should unreviewed follow-up commits and any-reason exemptions keep landing on
main?": "No, anything landed on main should be accepted by an independent reviewer."

Today `nana-land merge` accepts reviewed ancestors and only PRINTS the commits no review covers,
then lands them (R-976; its test lands two unreviewed commits on purpose). `--exempt "<any reason>"`
replaces reviews entirely (R-978). And a rejection can be masked: the round records keep only the
FIRST completed verdict on a revision (`review-round.mjs` `complete()`, :598-606), while every
verdict goes to the rotating audit log (:607); `nana-land` reads only the round records and needs
one LAND (:95-96). The seat's fact-check found 17 revisions with two completed verdicts; in 8 the
first was LAND and a later one was not, and 6 of those would land today. One happened on
2026-10-10: the four-digit ID lane at `6a74cfd` had astra LAND recorded at 19:17:10Z and sol
SEND-BACK only in the audit log at 19:18:37Z; the seat held the merge by reading both.

**Observable outcome.**
1. `nana-land merge` refuses, without merging, when any commit it would add to main is not covered
   by a named reviewed revision; it names every such commit.
2. There is no way to land without review: `--exempt` and any option other than `--tree`, `--main`,
   `--suite` and `--reviewed` is refused by name before git runs.
3. A rejection is never masked by the helper's own reading: every completed verdict is kept in the
   round records; the merge refuses when any valid completed verdict at a named revision is not LAND
   — under any item in the repository, and for a working-state snapshot of that commit too; it
   refuses while a review of a named revision is in flight; and it takes its final reading after the
   suite UNDER the review ledger's lock, holding the lock through the merge, so no review starts or
   completes between that reading and the merge. Only records written under the new rule can
   authorise a land, so a revision whose rejection was lost before the change (six such revisions
   today) cannot land on its old LAND: it needs a fresh review.
4. The verdict is the one the reviewer ends on: the last `VERDICT:` line, which must hold one
   verdict word (capital letters and hyphens), optionally one parenthesised score such as `(9/10)`,
   and nothing else but markdown emphasis, code marks and trailing punctuation; any other line
   records an empty verdict, which refuses a land — so an echoed brief format line
   (`VERDICT: LAND | FIX-FIRST | BLOCK`) can no longer record a LAND.
5. Source and main must be one repository: the merge refuses when `--tree` and `--main` do not share
   a git common directory, so a separate clone cannot bring a fresh review record. An item name and a
   SHA are matched in the canonical forms the review ledger records.
6. Nothing is written to main after a land. `nana-land` stops printing the HANDOFF and session
   archive stubs; the round records (outside git) are the authoritative record of every review; a
   final review's text stays outside the tree; the seat's handoff and session notes go into the
   change BEFORE its final review. The working pattern every nana project reads says so, forbids
   direct commits to main, and names one standard over-cap reason for a confirmation round on a
   final tip: "confirmation round on the final tip after fixes to named findings or a merge of
   current main".

## 2. Requirement delta

**FEAT-008 (home).**

| ID | Change | Text |
|---|---|---|
| R-976 | reworded (drops "WHEN reviews are required"; its print-and-land clause is superseded by R-1002, whose tests take over the exact-commit cases; R-976 keeps the ancestor, item, revision, plain-commit, verified-LAND and unverified cases) | The land merge command shall accept only plain ancestor-or-equal reviewed commits with a verified LAND round for the exact item and revision. |
| R-977 | reworded ("success records" → "a success report"; the stubs go) | The land merge command shall run the supplied suite in the source tree, recheck immediately before merging that the checkout is on main with clean tracked state and HEAD equal to captured main HEAD, run one ff-only merge of the tip, and require main to remain current with its ref at the tip and clean tracked state before it reports success; detected branch switches during merge prevent a success report, while a switch between the final check and merge is not defended. |
| R-978 | retired (text kept; Evidence: "retired 2026-10-10: Jake ruled that nothing reaches main unless an independent reviewer accepted it; the exemption is removed (R-1003)") | unchanged |
| R-588 | reworded ("success records" → "success output") | WHEN a land merge succeeds, the land merge command shall print the main checkout's post-merge release status, a release-status failure leaving its exit code and success output unchanged. |
| R-1002 | added | IF any commit the land merge command would add to main is not an ancestor of, or equal to, a named reviewed revision, THEN the command shall refuse without merging, naming each such commit. |
| R-1003 | added | The land merge command shall accept only `--tree`, `--main`, `--suite` and `--reviewed`, refusing any other option by name before running git. |
| R-1004 | added | IF any verified round record in the source repository, under any item, for a named reviewed revision or a working-state snapshot of that commit, carries a verdict field whose value is not LAND, an empty value included, THEN the land merge command shall refuse without merging, naming each such record. |
| R-1005 | added | The land merge command shall take a second reading of the round records after the suite passes, under the review ledger's lock, hold that lock through the ff-only merge, and apply R-976, R-1004 and R-1006 to that reading. |
| R-1006 | added | IF a review of a named reviewed revision is in flight when the land merge command reads the round records, THEN the command shall refuse without merging. |
| R-1007 | added | WHEN a land merge succeeds, the land merge command shall print no HANDOFF or session-archive text. |
| R-1009 | added | IF `--tree` and `--main` do not share one git common directory, THEN the land merge command shall refuse before resolving any reviewed revision or reading any review record. |
| R-1011 | added | The land merge command shall count as authorising only a verified LAND round record that is marked as kept under R-1008. |

**FEAT-007 (home; R-969 is shared with FEAT-008, so the review reads both).**

| ID | Change | Text |
|---|---|---|
| R-969 | reworded (first verdict word → the last `VERDICT:` line) · SUB-009 | Each completed review shall record as its verdict the verdict word — capital letters and hyphens — after `VERDICT:` on the last line of its output that carries `VERDICT:`, ignoring markdown emphasis, code marks, trailing punctuation and one parenthesised score. |
| R-1010 | added · SUB-009 | IF that last `VERDICT:` line holds anything after its verdict word other than one parenthesised score, markdown emphasis, code marks or trailing punctuation, THEN the review ledger shall record an empty verdict for that review. |
| R-1008 | added · SUB-010 | The round records shall keep every completed verdict on a revision, each record marked as kept under this rule and carrying its item, role and model, while that revision still counts as one round (R-972). |
| R-731 | reworded (one line per round → per completed verdict) | Ledger storage shall not be bounded overall: the tally grows one line per completed verdict and is read in full at every admission. |
| R-970 | reworded (one line per round → per recorded verdict) | The review-ledger report command shall print one read-only line per recorded verdict with item, short revision, role, model, duration, attempts, verdict and over-cap reason, using - for unavailable legacy fields. |
| R-992 | reworded (rounds → round records, one per completed verdict) | The exported readRounds(home, {repo, item}) reader shall return the recorded round records, one per completed verdict, without writing the ledger. |

**Tree changes for Jake — checkpoint 1, decided BEFORE the build (governance: Jake decides shares
and purposes; the seat proposes; the builder brief carries them only once accepted).**
- Share R-1008 with FEAT-008: the land check reads it.
- FEAT-008 Purpose: "Check merge prerequisites, integrate only changes every reviewer accepted, and
  remove only safe completed worktrees." (today: "…integrate eligible changes, record the result
  and remove…"; the land no longer records anything). The purpose change re-reads FEAT-008's shares
  (R-705, R-708, R-717, R-969, R-992) in this change.

## 3. Scope

**In.**
- `packages/nana-pack/bin/nana-land.mjs` — refuse a `--tree` outside `--main`'s repository;
  resolve each `--reviewed` SHA to its full lowercase commit ID and canonicalise each item as
  admission does before any ledger check; refuse uncovered commits; remove `--exempt` from the
  parser, the error strings, the archive text and `runLand`'s options (the 20 `exempt: "test"` test
  call sites move to reviewed fixtures); the repository-wide non-LAND check (any item, revision or
  `head` equal to the named commit); the second reading after the suite; the in-flight refusal; no
  HANDOFF or session-archive lines (the `push command` and `release status` lines stay); the
  second reading, in-flight check, R-977 rechecks and ff-only merge run inside one exported
  ledger-lock call from `review-round.mjs` (no reach into its internals). Keep `usage: nana-land`
  (pinned by the setup install test).
- `packages/nana-pack/bin/review-round.mjs` — `complete()` appends a round record for every
  completed verdict; its returned and printed round number is the revision's round ordinal, not a
  record index; `decide()`'s "N completed" text counts revisions; the R-1008 marker on every new
  record; the verdict word per R-969 and R-1010; one
  exported function that runs a caller's step under the ledger lock with the round records and live
  reservations it read there.
- `packages/nana-pack/bin/review-ledger.mjs` — `report` shows every verdict on a revision without
  implying extra rounds.
- Tests: `packages/nana-pack/tests/land.test.mjs` (the uncovered-commit test flips to a refusal with
  no merge and no ref change; the exemption tests flip to unknown-option refusals; a covered tip
  lands; LAND+LAND lands; LAND then SEND-BACK, SEND-BACK then LAND, a non-LAND under another item and
  a non-LAND at a snapshot of the commit each refuse; a verdict recorded during the suite refuses; an
  in-flight review refuses; a review that starts after the final reading waits for the lock and
  cannot complete before the merge; an unverified SEND-BACK neither authorises nor refuses; a legacy
  record with no verdict field beside a verified marked LAND lands, and an explicit empty verdict
  refuses; an old unmarked LAND whose later SEND-BACK is only in the audit log cannot land; a clone
  as `--tree` refuses before any reviewed-SHA resolution or record read (an injected runner shows no
  `cat-file` or `rev-parse` of a reviewed SHA); an uppercase SHA and a differently cased item land;
  while the land holds the lock, a review admission either waits and is admitted after the merge or
  is refused with nothing recorded — never admitted before the merge; no stub lines).
  `packages/nana-pack/tests/review-ledger.test.mjs` (every
  check that counts raw tally lines as rounds — :151, :155, :159, :161, :164, :169, :202, :532,
  :536, :541 — counts distinct revisions; several verdicts on one revision stay one round; the round
  number printed is the ordinal; every new record carries the R-1008 marker; the verdict parse
  cases: the echoed format line alone records an empty verdict, the format line before a final
  `VERDICT: SEND-BACK` records SEND-BACK, `**VERDICT:** LAND`, `VERDICT: LAND.` and
  `VERDICT: LAND (9/10)` record LAND, `VERDICT: LAND-WITH-FIXES` records LAND-WITH-FIXES, and
  `VERDICT: LAND, with fixes` records an empty verdict). `immutable-review.test.mjs` is read, not
  changed (its items get one verdict each). Masking tests use real `complete()` calls,
  not hand-written tally lines, so reverting `complete()` to first-only turns them red.
- `packages/nana-pack/README.md` — usage and the rule (:176); the Trust model (:142, :221-227) stops
  claiming every verdict is in the tally today and stops suggesting deleting tally lines without
  saying it erases verdicts the land check reads; the honest limits (§5). Keep R-981's pinned
  patterns.
- The shared working section `templates/_shared/working-under-nana-pi.md` and this repo's
  `AGENTS.md` marker region, edited by hand to stay byte-identical (R-859; `CLAUDE.md` is a symlink
  to `AGENTS.md`): every commit reaching main is covered by a revision every reviewer accepted; no
  exemptions; never commit directly to main; nothing is written after a land; session notes go in
  before the final round; the standard over-cap reason. R-683's pinned phrases stay.
- `REQUIREMENTS.md` (the rows in §2), regenerated outline and code map.
- `HANDOFF.md` and the current session archive `docs/sessions/2026-10.md`, written by the seat
  before the final review for the merged state: the review-log residual line and this lane's queue
  entry go; the session entry records the lane.

**NOT.** `nana-land cleanup`; other repos' AGENTS.md (they refresh at their next `nana-setup
project`); checking reviewer independence or review scope in the helper; branch protection or hooks
on main; making the round records tamper-proof.

**Blast radius.** `~/.local/bin/nana-land` and `pi-review` link to the main checkout, so the new
land rule and the every-verdict records govern every repo's lands and reviews the moment this
merges (other repos are reviewing today). Mixed versions are safe: the record kind stays `round`,
and the old `decide()` and `complete()` tolerate several records per revision. Both halves land in
one merge: every-verdict records with the old `.some(LAND)` check would make SEND-BACK-then-LAND
landable. `nana-setup project` and `adopt-structure` read the shared section from the main checkout
at merge; copier consumers get it at the next template tag, which needs main pushed (Jake's call).

## 4. Design

- Coverage: `rev-list <tip> --not <main> <reviewed revisions…>` must be empty; each `--reviewed
  <sha>=<item>` still needs a verified LAND round for that item and revision (R-976, unchanged).
- Authorisation (R-976, R-1011): a named revision needs a verified LAND record for its item that
  carries the R-1008 marker. Records written before this change carry no marker, so they never
  authorise; that is what keeps the six historical masked rejections from landing.
- Non-LAND check (R-1004): over the repository's round records, marked or not, every VERIFIED record
  whose `revision` or `head` equals a named commit, under any item, and that carries a `verdict`
  field must have the value LAND; an empty value (`null`, R-1010) refuses. Unverified records
  (R-717) neither authorise nor refuse. A legacy record with no `verdict` field (written before
  2026-10-07) neither authorises nor refuses.
- Order: parse options (R-1003) → same repository (R-1009) → canonical SHAs and items → read records
  (R-976, R-1004, R-1006) → suite → under the ledger lock: read again (R-976, R-1004, R-1006),
  recheck checkout (R-977), ff-only merge → release the lock → success output. The lock section holds
  no suite run. A review of a named revision cannot be completing then: it would be in flight at the
  final reading, and the land would have refused. A review of another revision that tries to start
  or complete meanwhile waits up to the ledger's 15-second lock wait (`LOCK_WAIT_MS`), as it does
  today for any lock holder; past that, its admission is refused with nothing recorded, or its
  completion is not recorded with its output kept, and it is re-run (§5). Every refusal happens before any merge or ref update and
  names what it found; uncovered commits are listed by short SHA and subject with "get it reviewed (a
  new round on the tip) or drop it".
- Verdict parse (R-969, R-1010): scan the output's lines from the end for the first line containing
  `VERDICT:` preceded only by non-word characters (R-701); remove `*`, `_` and backticks from that
  line; what follows `VERDICT:` must match `[A-Z]+(?:-[A-Z]+)*`, optionally a space and one
  `(<score>)`, optionally one of `.`, `,`, `;` or `:`, then the end of the line; anything else
  records `verdict: null`.

## 5. Declared residuals (stated in the pack README)

- The helper does not check who reviewed: independence is the roster convention, and
  `review-ledger run` can record a LAND from any command.
- The round records are a plain file: editing or deleting a line changes what the land check reads.
- A narrow review round counts as a LAND of everything up to its revision.
- A new commit (amend, rebase, an empty commit) starts with a clean record.
- A direct commit to main bypasses the helper; the working pattern forbids it.
- Every revision reviewed before this change needs a fresh review to land (no record carries the
  R-1008 marker); records without a `verdict` field (156, before 2026-10-07) neither authorise nor
  refuse.
- While a land holds the ledger lock (git rechecks and the ff-only merge), a review of ANOTHER
  revision that waits past the 15-second lock limit fails as it does today with any holder: its
  admission is refused, or its completion goes unrecorded with its output kept, and it is re-run.
  `review-ledger run` does not return its reservation when completion fails; the reservation is
  reclaimed when its process dies (unchanged).
- The helper enforces that every recorded verdict is LAND, not that the reviewers were independent;
  neither the README nor the feature purpose claims otherwise.

## 6. Verification

`npm run test:locked`; commit; `npm run template:accept`; mutation pairs: restore print-and-land →
the refusal test fails; re-add `--exempt` to the parser AND to `runLand` → the unknown-option test
fails; revert `complete()` to first-only → the masking tests fail; drop the second reading or the
lock around it → the during-suite and after-final-reading tests fail; take the first `VERDICT:` line
or accept extra words after it → the echoed-format tests fail; drop the common-directory check → the
clone test fails; resolve a reviewed SHA before the common-directory check → the injected-runner
order test fails; let an unmarked record authorise → the historical-masking test fails; treat an
empty verdict as absent → the empty-verdict test fails; reject a parenthesised score → the
`LAND (9/10)` case fails. The seat's
acceptance script runs every case in §3's test list against scratch git repositories with `HOME`
pointed at a scratch folder (the CLI otherwise writes into the real round records), and the builder
pastes its last two lines verbatim.

## 7. Checkpoints (Jake)

1. **Before the build:** the two tree changes in §2 (the R-1008 share with FEAT-008; FEAT-008's
   purpose).
2. **After the reviews:** the rule as built; the new working-pattern text; and two consequences:
   every session's handoff and session notes now land only inside a reviewed change, and every
   revision reviewed before this change needs a fresh review to land.
