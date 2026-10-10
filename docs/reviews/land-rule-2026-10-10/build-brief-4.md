# Lane land-rule — continuation 3: focused tests per new row, exact evidence, mutation pairs (seat, after build 3 DONE)   (2026-10-10 · feat/land-rule)

Build 3 made the suite green (seat re-run: 132 PASS, 1 SKIP, 6,687 checks). The seat reconciled the
count: a worktree run skips 95 checks that the main checkout runs (`apps/bench/test/study-tasks` and
one `argv` check), so the worktree baseline is 6,688; the lane is −2 (the retired R-978 tests) and +1.
Good. Three jobs remain. Finish all three before you report.

## 1. Focused tests for the new rows (CHANGE §3 test list)
Today R-1002–R-1011 cite restored tests that do not pin them (R-1004 cites "a reviewed SHA must be
ancestor…", R-1006 and R-1011 cite "runLand requires verified reviews", R-1009 cites "merge
preflight refuses a non-main checkout", R-1005 cites "suite-time source revision change…"). Add tests
— in `land.test.mjs` (scratch `home`, real version-2 records written as `complete()` writes them, or
through `complete()` itself) and `review-ledger.test.mjs` — and make each row cite ONLY tests that pin
its clause:
- R-1002: an uncovered commit after the reviewed one refuses with no merge and names the commit.
- R-1003: `--exempt` alone and beside `--reviewed`, and an unknown option, each refused by name
  before git runs (an injected runner records no git call).
- R-1004: a verified non-LAND under ANOTHER item at the same commit refuses; one at a working-state
  snapshot of the commit (`head` match) refuses; an explicit empty verdict refuses; a legacy record
  with no `verdict` field and an unverified SEND-BACK each neither authorise nor refuse.
- R-1005: an injected runner shows the second reading, the R-977 rechecks and the merge all happen
  inside the lock call; a SEND-BACK written after the suite and before the lock is seen and refuses.
- R-1006: a live reservation for the commit, and one for a snapshot of it, each refuse.
- R-1007: success output has no HANDOFF or session-archive line (keep `push command` and
  `release status`).
- R-1009: `--tree` from a separate clone refuses, and an injected runner shows no `cat-file` or
  `rev-parse` of a reviewed SHA before the refusal.
- R-1011: a version-1 LAND alone refuses at the first reading AND at the second.
- R-1008/R-969/R-1010/R-992/R-970 (review-ledger): every completed verdict appended at `v: 2`, one
  round per revision, the printed round is the ordinal; the verdict cases of CHANGE §3 (corpus forms,
  `L_A_N_D`, CRLF, the echoed format line before a final SEND-BACK); the report prints one line per
  verdict.

## 2. Exact evidence for the existing rows
Restore each row's evidence to exactly its tests at `661f76e`, using the title map for renamed tests:
R-975 (9 tests), R-976 (8 — the exemption test is mapped), R-977 (7), R-979 (6), R-588 (3). Each
cited test carries its `// req:` marker. `git show 661f76e:REQUIREMENTS.md` has the lists.

## 3. Mutation pairs — all of CHANGE §6
Each: break the code (or a scratch copy), run the named test, record red; restore, record green.
List them in the report as `<mutation> → <test> red/green`.

## Then
`npm run req:tree`, `npm run map`, `npm run map:check`, `npm run readme:check`,
`npm run test:locked` (must pass; report the summary line), commit, `npm run template:accept`, then
`node docs/reviews/land-rule-2026-10-10/seat-verify-land.mjs > docs/reviews/land-rule-2026-10-10/seat-verify-land-output.txt 2>&1`
and `node docs/reviews/land-rule-2026-10-10/seat-verify-tests.mjs >> docs/reviews/land-rule-2026-10-10/seat-verify-land-output.txt 2>&1`
(both exit 0), commit that file.

Rules as `build-brief.md`. Frozen: `CHANGE.md`, both seat scripts, the title map, FEAT-008's
`Purpose:` and `Also applies:` lines, `HANDOFF.md`, `docs/sessions/`. Report ≤ 40 lines, first line
`VERDICT: …`.
