# Lane land-rule — build brief (2026-10-10 · feat/land-rule · worktree ~/nana-pi-wt/land-rule)

**The contract is `CHANGE.md` in this folder: §1 outcomes, §2 rows, §3 scope, §4 design, §5
residuals, §6 verification.** sol reviewed the plan five times (`sol-plan-r1..r5.md` and the seat's
responses); read them for the reasons behind each choice. Build all of it in this lane.

**Not in this build (Jake has not yet decided):** the R-1008 share on FEAT-008's `Also applies:` line
and FEAT-008's purpose rewording (§2 "Tree changes for Jake"). Leave FEAT-008's `Purpose:` and
`Also applies:` lines exactly as they are; the seat adds them after Jake rules. Do not edit
`HANDOFF.md` or `docs/sessions/` either — the seat writes them before the final review.

## What to build (each item maps to CHANGE.md)
1. **Rows first** (§2): reword R-976, R-977, R-588, R-969, R-731, R-970, R-992; retire R-978 (text
   kept, status `retired`, the dated reason in Evidence); add R-1002–R-1011 in their homes (FEAT-008
   rows under FEAT-008's table; R-969 and R-1010 in SUB-009; R-1008, R-731, R-970, R-992 in SUB-010).
   One `shall` each. Regenerate the outline (`npm run req:tree`).
2. **`review-round.mjs`** (§3, §4): `complete()` appends a round record for every completed verdict,
   at tally version 2 (`v: 2`); `readTally` accepts versions 1 and 2; the returned and printed round
   number is the revision's round ordinal; `decide()`'s "N completed" counts revisions; the verdict
   word per R-969/R-1010 — match the RAW last `VERDICT:` line against the §4 pattern, never deleting
   characters first; one exported function that runs a caller's step under the ledger lock and hands
   it the round records and live reservations read there.
3. **`nana-land.mjs`** (§3, §4): option allowlist (R-1003; `--exempt` gone from the parser, errors,
   output and `runLand`'s options); same repository first (R-1009, before any reviewed-SHA
   resolution or record read); canonical SHA and item; authorisation only by a verified version-2
   LAND (R-976, R-1011); the repository-wide, snapshot-aware non-LAND check (R-1004); the in-flight
   check matching a reservation's revision or parsed head (R-1006); uncovered commits refused and
   named (R-1002); after the suite, the second reading, R-977 rechecks and the ff-only merge inside the
   exported lock call (R-1005); no HANDOFF or session-archive lines (R-1007). Keep `usage: nana-land`.
4. **`review-ledger.mjs`**: `report` prints one line per recorded verdict (R-970).
5. **Tests** (§3 list): `land.test.mjs` and `review-ledger.test.mjs` as listed, masking tests through
   real `complete()` calls; the 20 `exempt: "test"` call sites move to reviewed fixtures; the old
   module test reads the pre-change file from git history (`1836fa3`) into the OS temp dir.
6. **Docs** (§3): the pack README usage, rule, Trust model corrections and §5 residuals, keeping
   R-981's pinned patterns; the shared working section and this repo's `AGENTS.md` region, edited by
   hand to stay byte-identical (R-859), with every point §3 lists; R-683's phrases kept.

## Rules
- Mutation pairs as CHANGE §6 lists: break the code or a scratch copy, never an assertion; record red
  and green for each.
- No test writes the repository or the real review ledger: fixtures in the OS temp dir, and every
  test that reaches the ledger passes a scratch `home` (or sets `HOME`) — never `os.homedir()`.
- Fix the class, not the instance: when a reviewer-style case fails, look for its siblings.
- Line-oriented parsing (the verdict line): CRLF and trailing-whitespace cases in the tests.
- NOT and the allowlist exactly as CHANGE §3. Do not touch other repos or the historical lane tools
  under `docs/reviews/`.
- Commit with explicit paths, message file under `$TMPDIR`. Template change (the shared working
  section): commit BEFORE `template:accept`.

## Then
`npm run req:tree`, `npm run map`, `npm run map:check`, `npm run readme:check`,
`npm run test:locked`, commit, `npm run template:accept`, then
`node docs/reviews/land-rule-2026-10-10/seat-verify-land.mjs > docs/reviews/land-rule-2026-10-10/seat-verify-land-output.txt 2>&1`
(must exit 0 with `seat-verify-land: 0 mismatch(es)`; it fails 34 cases at launch), commit that file.
The seat script and `CHANGE.md` are frozen.

## Report
≤ 40 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; files; rows changed and the
clause each cited test pins; mutation pairs red/green; the `test:locked` and `template:accept`
summary lines; the LAST TWO LINES of the seat output, verbatim; scope check
(`git diff --stat <launch HEAD>..HEAD`); the one claim most likely wrong.
