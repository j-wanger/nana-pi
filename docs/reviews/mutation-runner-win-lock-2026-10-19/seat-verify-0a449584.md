# Seat checks — mutation-runner-win-lock build 2, tip 0a449584 (2026-10-19)

- Builds, by a pi gpt-5.6-sol builder through pi-worker. Build 1 (0ad43c1d, `build-brief-1.md`) made the owned lock's
  release retry EPERM with no limit. Build 2 (3a564fc4, `build-brief-2.md`) gave release its own sealed limit,
  `WORKTREE_LOCK_RELEASE_WAIT_LIMIT_MS` = 300,000 ms (chosen), after which it reports one line and throws (new row
  R-1960); R-1778 now covers acquisition only. R-1776's contention check keeps its strength (8 workers, 2,400
  acquisitions, zero overlap, complete ownership) and gains a 120 s budget (`CONTENTION_BUDGET_MS`, measured), a stop
  file each worker reads between acquisitions, a 5 s grace before SIGKILL, and `timedOut` and `killedWorkers` in its
  failure record. 0a449584 merges main 6bc2f727 into 3a564fc4; its two conflicts, REQUIREMENTS.md and the generated
  tree, resolve to R-1960 after R-1957 and the regenerated counts. No plan file: an urgent fix, whose plan of record is
  the two build briefs (rows R-1960 to R-1969 reserved, R-1960 used).
- Main's baseline (scratch run 39357872086, draft PR #92, main d4423eff): mutation-runner.test.mjs failed R-1776's
  contention check in 11 of 12 hosted Windows runs, 35 pass and 1 fail each time. Build 1 (scratch run 39364310814,
  draft PR #97, 0ad43c1d): 10 of 12 failed, every failure that same check (`windows-12x-0ad43c1d-build1.log`). The
  seat decoded the ten records (table in `build-brief-2.md`): every failing run had workers SIGKILLed by the test's own
  30 s per-child timer, 2 to 8 of 8 workers, and every recorded overlap was in a run with kills.
- Build 2 merged with main (scratch run 39368865667, draft PR #99, 0a449584): 12 of 12 hosted Windows runs pass the
  file, 37 pass, 0 fail, 3 skip each, in 97.9 to 133.4 s (`windows-12x-0a449584-build2.log`). Each run prints PASS for
  the contention check, the acquisition retry check, R-1960 and the live-holder check. Draft PR #98 (3a564fc4 alone)
  never ran: it conflicted with main.
- CI run 39368972192 on draft pull request #100 (0a449584; GitHub's merge commit c23faaa8 merges 0a449584 into
  6bc2f727, its own ancestor, so the tree tested is 0a449584's):
  - macOS `173 files: 171 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7777 pass, 0 fail, 27 skip`; mutation-runner 39 pass.
  - Ubuntu `173 files: 171 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7722 pass, 0 fail, 45 skip`; mutation-runner 39 pass.
  - Windows `173 files: 156 PASS, 0 FAIL, 17 SKIP, 0 WARN · checks: 6713 pass, 0 fail, 103 skip`
    (`ci-windows-0a449584.log`); mutation-runner `37 pass, 3 skip  117.2s`. The 17 skipped files are main's declared
    set: the 16 desk files and bench's study-tasks.
  - install-check: macOS and Windows success.
  - None of main's known failures showed.
- The cleanup check that failed once in 44 Windows runs before mutation-runner-win-prune passed in all 36 of the seat's
  scratch Windows runs above (each run's one failure, where there was one, was the contention check) and in the CI run.
- Main's Windows leg was not red on every run: hook-output-fail-open (1ca5420d), install-dry-run-pi-packages
  (30a5baf9), knowledge-unreadable-root (08ba23e3) and win-silent-skips (a7ed70b2) each read 0 failing on Windows with
  win-prune's lock in their tree. The lock check failed in most runs, not all.
- The seat's wrong-code pairs: none run, an ordinary lane. The builder reports each new or changed check red on wrong
  code: the old 30 s kill with no stop file (10 of 12 Windows runs failed, the build-1 record above), release with no
  limit, release cut at the acquisition limit, and an unsealed release limit. Only the first is in this folder; the
  other three are the builder's report, not seen by the seat.
- Independent check: none, an ordinary lane.
- The builder ran the full locked suite once (`build-2-suite.txt`, 168 files: 166 PASS, 0 FAIL, 2 SKIP at 3a564fc4),
  though the brief said single files only. Recorded; no action.
- Rows: R-1960 reads `implemented` in REQUIREMENTS.md. `node scripts/requirements-trace.mjs` reads `requirements: 1507
  total (1241 implemented · 1 planned · 34 retired · 226 untested · 5 violated); 1241 traced by tests` and `ears: 0 rows
  off form (allowance 0)`; `npm run map:check` reads 331 modules, 0 problems.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, merge base 6bc2f727): `6bc2f72..0a44958:
  2 rows in 1 features`, FEAT-031 · Run checks reliably and without contaminating work: R-1778 text changed, R-1960 new
  (implemented). CAP-07 moves from 300 to 301 rows and FEAT-031 from 85 to 86.
- Not in this record: a seat-run locked full suite (CI's three legs ran the whole suite) and a local install check (the
  lane touches no file under `packages/nana-setup/` and no hook).
