# Change declaration — the land rule: nothing reaches main without an independent reviewer

*Lane `land-rule` · branch `feat/land-rule` · worktree `~/nana-pi-wt/land-rule`, based on `main`
at `1836fa3` (the requirements tree and four-digit IDs) · 2026-10-10. Features: **FEAT-008 ·
Integrate and clean up reviewed changes** (home of the land rows) and **FEAT-007 · Review a specific
revision independently** (home of the round-record rows; R-969 and R-992 are shared with FEAT-008).
Order: why → plan → Fable consult (`fable-consult.md`) → seat fact-check (`factcheck.md`) → sol plan
review (item `land-rule-plan`) → build → seat verification → sol build review → astra land review →
Jake accepts.*

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
   round records; the merge refuses when any completed verdict at a named revision is not LAND —
   under any item in the repository, and for a working-state snapshot of that commit too; it reads
   the records again after the suite, immediately before merging; and it refuses while a review of a
   named revision is still in flight.
4. The verdict is the one the reviewer ends on: the last `VERDICT:` line, with markdown emphasis,
   code marks and trailing punctuation removed — so an echoed brief format line
   (`VERDICT: LAND | FIX-FIRST | BLOCK`) can no longer record a LAND.
5. Nothing is written to main after a land. `nana-land` stops printing the HANDOFF and session
   archive stubs; the round records (outside git) are the authoritative record of every review; a
   final review's text stays outside the tree; the seat's handoff and session notes go into the
   change BEFORE its final review. The working pattern every nana project reads says so, forbids
   direct commits to main, and names one standard over-cap reason for a confirmation round on a
   final tip: "confirmation round on the final tip after fixes to named findings".

## 2. Requirement delta

**FEAT-008 (home).**

| ID | Change | Text |
|---|---|---|
| R-976 | reworded (drops "WHEN reviews are required" and the print-and-land clause; keeps every pinned clause) | The land merge command shall accept only plain ancestor-or-equal reviewed commits with a verified LAND round for the exact item and revision. |
| R-977 | reworded ("success records" → "a success report"; the stubs go) | The land merge command shall run the supplied suite in the source tree, recheck immediately before merging that the checkout is on main with clean tracked state and HEAD equal to captured main HEAD, run one ff-only merge of the tip, and require main to remain current with its ref at the tip and clean tracked state before it reports success; detected branch switches during merge prevent a success report, while a switch between the final check and merge is not defended. |
| R-978 | retired (text kept; Evidence: "retired 2026-10-10: Jake ruled that nothing reaches main unless an independent reviewer accepted it; the exemption is removed (R-1003)") | unchanged |
| R-588 | reworded ("success records" → "success output") | WHEN a land merge succeeds, the land merge command shall print the main checkout's post-merge release status, a release-status failure leaving its exit code and success output unchanged. |
| R-1002 | added | IF any commit the land merge command would add to main is not an ancestor of, or equal to, a named reviewed revision, THEN the command shall refuse without merging, naming each such commit. |
| R-1003 | added | The land merge command shall accept only `--tree`, `--main`, `--suite` and `--reviewed`, refusing any other option by name before running git. |
| R-1004 | added | IF any completed verdict in the source repository's round records, under any item, for a named reviewed revision or a working-state snapshot of that commit, is not LAND, THEN the land merge command shall refuse without merging, naming each such verdict. |
| R-1005 | added | The land merge command shall read the round records again after the suite passes and immediately before merging, and apply R-976 and R-1004 to that second reading. |
| R-1006 | added | IF a review of a named reviewed revision is in flight when the land merge command reads the round records, THEN the command shall refuse without merging. |
| R-1007 | added | WHEN a land merge succeeds, the land merge command shall print no HANDOFF or session-archive text. |

**FEAT-007 (home; R-969 is shared with FEAT-008, so the review reads both).**

| ID | Change | Text |
|---|---|---|
| R-969 | reworded (first verdict word → the last `VERDICT:` line) | Each completed review shall record the verdict word from the last line of its output that carries `VERDICT:`, with markdown emphasis, code marks and trailing punctuation removed. |
| R-1008 | added | The round records shall keep every completed verdict on a revision with its item, role and model, while that revision still counts as one round (R-972). |

**Tree changes for Jake (governance: Jake decides shares and purposes; the seat proposes).**
- Share R-1008 with FEAT-008: the land check reads it.
- FEAT-008 Purpose: "Check merge prerequisites, integrate only changes every reviewer accepted, and
  remove only safe completed worktrees." (today: "…integrate eligible changes, record the result
  and remove…"; the land no longer records anything). The purpose change re-reads FEAT-008's shares
  (R-705, R-708, R-717, R-969, R-992) in this change.

## 3. Scope

**In.**
- `packages/nana-pack/bin/nana-land.mjs` — refuse uncovered commits; remove `--exempt` from the
  parser, the error strings, the archive text and `runLand`'s options (the 20 `exempt: "test"` test
  call sites move to reviewed fixtures); the repository-wide non-LAND check (any item, revision or
  `head` equal to the named commit); the second reading after the suite; the in-flight refusal; no
  HANDOFF or session-archive lines (the `push command` and `release status` lines stay). Keep
  `usage: nana-land` (pinned by the setup install test).
- `packages/nana-pack/bin/review-round.mjs` — `complete()` appends a round record for every
  completed verdict; its returned and printed round number is the revision's round ordinal, not a
  record index; `decide()`'s "N completed" text counts revisions; the verdict word per R-969.
- `packages/nana-pack/bin/review-ledger.mjs` — `report` shows every verdict on a revision without
  implying extra rounds.
- Tests: `packages/nana-pack/tests/land.test.mjs` (the uncovered-commit test flips to a refusal with
  no merge and no ref change; the exemption tests flip to unknown-option refusals; a covered tip
  lands; LAND+LAND lands; LAND then SEND-BACK, SEND-BACK then LAND, a non-LAND under another item and
  a non-LAND at a snapshot of the commit each refuse; a verdict recorded during the suite refuses; an
  in-flight review refuses; no stub lines). `packages/nana-pack/tests/review-ledger.test.mjs` (every
  check that counts raw tally lines as rounds — :151, :155, :159, :161, :164, :169, :202, :532,
  :536, :541 — counts distinct revisions; several verdicts on one revision stay one round; the round
  number printed is the ordinal; the verdict parse cases). Masking tests use real `complete()` calls,
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

**NOT.** `nana-land cleanup`; other repos' AGENTS.md (they refresh at their next `nana-setup
project`); checking reviewer independence or review scope in the helper; branch protection or hooks
on main; making the round records tamper-proof; canonicalising a passed item name or uppercase SHA.

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
- Non-LAND check (R-1004): over the repository's round records, every record whose `revision` or
  `head` equals a named commit, under any item, must have the verdict LAND; an unverified LAND does
  not satisfy R-976 and is not itself a refusal.
- Order: parse options → read records (R-976, R-1004, R-1006) → suite → read records again (R-1005)
  → recheck checkout (R-977) → ff-only merge. Every refusal happens before any merge or ref update and
  names what it found; uncovered commits are listed by short SHA and subject with "get it reviewed (a
  new round on the tip) or drop it".
- Verdict parse (R-969): scan the output's lines from the end for the first line containing
  `VERDICT:` preceded only by non-word characters (R-701); remove `*`, `_` and backticks from that
  line; the verdict is the next token, with trailing `.`, `,`, `;` and `:` removed.

## 5. Declared residuals (stated in the pack README)

- The helper does not check who reviewed: independence is the roster convention, and
  `review-ledger run` can record a LAND from any command.
- The round records are a plain file: editing or deleting a line changes what the land check reads.
- A narrow review round counts as a LAND of everything up to its revision.
- A new commit (amend, rebase, an empty commit) starts with a clean record.
- A direct commit to main, or a land from a separate clone with its own records, bypasses the
  helper; the working pattern forbids both.
- 156 legacy round records carry no verdict; pass the SHA lowercase and the item as recorded.

## 6. Verification

`npm run test:locked`; commit; `npm run template:accept`; mutation pairs: restore print-and-land →
the refusal test fails; re-add `--exempt` to the parser AND to `runLand` → the unknown-option test
fails; revert `complete()` to first-only → the masking tests fail; drop the second reading → the
during-suite test fails; take the first `VERDICT:` line → the echoed-format test fails. The seat's
acceptance script runs every case in §3's test list against scratch git repositories with `HOME`
pointed at a scratch folder (the CLI otherwise writes into the real round records), and the builder
pastes its last two lines verbatim.

## 7. Checkpoint 2 (Jake)

The rule as built; the new working-pattern text; the two tree changes in §2; and one consequence:
every session's handoff and session notes now land only inside a reviewed change.
