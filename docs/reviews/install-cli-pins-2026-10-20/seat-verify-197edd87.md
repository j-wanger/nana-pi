# Seat checks — install-cli-pins build 1, tip 197edd87 (2026-10-20)

- Build, by a pi gpt-5.6-sol builder through pi-worker (`build-brief-1.md`): one commit b3753a3f on the plan commit
  bd5f1c0a (based on 20debe02), then 197edd87 merges main 385c633f with no conflict (`git show --remerge-diff
  197edd87` is empty). Tests and REQUIREMENTS.md only: eight new checks in five `packages/nana-setup/tests` files
  (install R-383 and R-315; settings-merge R-317 and R-320; win32-degrade R-349; pi-registration R-384 and R-927;
  relative-agent-dir R-932), `freshHome` in install.test.mjs taking an optional path to re-seed, the eight rows flipped
  untested to implemented, and R-739 and R-939 retired as duplicates of R-302 and R-359. No `lib/`, `bin/`, `claude/`
  or extension change; no code map or tree file change (the tree lists IDs, and every ID stays). The seat's notes
  commit adds only this record, the two CI logs, the review brief, HANDOFF and the session entry.
- Builder verdict: PARTIAL, only because its install check failed at the pi post-edit step under pi-worker. That is
  the known install-check-turn-edit-powershell residual (the gate's lane write boundary blocks the turn's file write);
  the seat's own macOS install check, run outside the builder, passed 16 of 16. No new residual.
- Builder process: the builder ran the full suite, though the brief said single test files only. Recorded once, on
  HANDOFF's builder-briefs line; no action.
- CI run 39386603117 on draft pull request #112 at 197edd87; install-check succeeded on macOS and Windows:
  - macOS attempt 1 `177 files: 174 PASS, 1 FAIL, 2 SKIP, 0 WARN · checks: 7846 pass, 1 fail, 27 skip`
    (`ci-macos-197edd87-attempt1.log`). The one failure is in `packages/nana-pack/tests/mutation-runner.test.mjs`,
    a file this lane does not touch: "contending child processes observe complete lock ownership and never overlap
    their critical sections" with `overlapText "5:0"` (worker 5 recorded an overlap on its first turn at the lock),
    `timedOut false`, `killedWorkers []`, `acquired 2400`, `badContent ""`. The seat re-ran the failed leg.
  - macOS attempt 2 `177 files: 175 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7847 pass, 0 fail, 27 skip`;
    mutation-runner `39 pass`.
  - Ubuntu `177 files: 174 PASS, 0 FAIL, 3 SKIP, 0 WARN · checks: 7786 pass, 0 fail, 45 skip`.
  - Windows `177 files: 160 PASS, 0 FAIL, 17 SKIP, 0 WARN · checks: 6782 pass, 0 fail, 104 skip`
    (`ci-windows-197edd87.log`). The 17 skipped files are main's declared set.
  - The lane's five files, against knowledge-index-pins' CI on main's tree (run 39384899535): macOS and Ubuntu read
    install 107 to 109, settings-merge 219 to 221, win32-degrade 87 to 88, pi-registration `70 pass, 3 skip` to
    `72 pass, 3 skip`, relative-agent-dir 30 to 31. Windows reads install `93 pass, 5 skip` (91), settings-merge
    `214 pass, 7 skip` (212), win32-degrade `87 pass, 1 skip` (86), pi-registration `75 pass, 2 skip` (73),
    relative-agent-dir `31 pass` (30). So each leg gains exactly eight passing checks and no skip. On native Windows
    all eight print PASS by title (log lines 5986, 5987, 6140, 6154, 6385, 6533, 6622, 6954).
  - None of main's known failures showed: Ubuntu's path-spelling GP1 and GP2 were fixed on main at ca27d86, Windows
    main reads 0 FAIL since 4be0b79, and no R-291 merge artifact arose.
- The plan's own worry held: R-384's reverse direction (install from this checkout counts the throwaway worktree's
  entries) passes on native Windows, where the checkout sits on `D:\a\nana-pi\nana-pi` and the temp folder holding
  the worktree and the pi home on `C:\Users\RUNNER~1\AppData\Local\Temp`. The adversary's claim most likely wrong,
  R-383's byte comparison on a re-seeded Windows home, held too: R-383 prints PASS there.
- Wrong-code pairs: none by the seat (an ordinary lane). By the builder's report, each pinned row went red on every
  wrong code the plan names: R-932 2/2, R-383 3/3, R-315 1/1, R-320 8/8, R-317 9/9, R-349 4/4, R-384 2/2, R-927 2/2,
  in a temp clone on this Mac. The seat did not re-run them. Declared: no try ran on Windows.
- Independent check: none (an ordinary lane), so no findings to settle.
- The plan's known limits:
  - New HANDOFF residuals, one line each: R-315's check runs with no terminal, so a prompt shown only at a terminal
    stays green; R-383 compares plain `project` only, not `--check` or `--not-a-project`, and a pair that straddles
    local midnight differs (project seeds carry the date); R-324 stays untested, and the worktree fallback hides a
    dropped real-path compare.
  - HANDOFF's win-hook-rows residual, that the win32 posix-only-step row stays untested, now carries only the part
    left open: R-349's check names the two posix-only steps that exist today, so a new one needs its own case.
  - Recorded here only (test-shape limits, no product bug): R-384's worktree direction runs the throwaway worktree's
    HEAD, so its wrong code had to be committed in the scratch clone; under `--home` install never runs pi, so the
    `registered as` row is the evidence. Older unmarked checks covering parts of R-317, R-320, R-349 and R-932 stay
    untouched.
- HANDOFF's win-claude-skills ledger residual, that the build kept a duplicate Windows owner-file row untested, is
  removed: R-939 is retired as a duplicate of R-359. REQUIREMENTS open question 14 reads "R-739's half closed on
  2026-10-20."; its R-834 half stays open, so the question stays.
- CI attempt 1's macOS mutation-runner overlap gets one new HANDOFF residual: seen once, the re-run passed, and the
  planned mutation-runner-lock-overlap lane will try to reproduce it. HANDOFF had no line for it.
- Rows: R-932, R-383, R-315, R-320, R-317, R-349, R-384 and R-927 read `implemented` in REQUIREMENTS.md, each Evidence
  cell the backticked file::title of its new check; R-739 and R-939 read `retired`, text kept. No row added; the
  R-2040 to R-2049 block stays unused. The seat helper's re-run at the notes commit: `node
  scripts/requirements-trace.mjs` reads `1543 total (1285 implemented · 1 planned · 36 retired · 216 untested · 5
  violated)` and `ears: 0 rows off form (allowance 0)`; `npm run map:check` reads 336 modules, 0 problems.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, against the merge base 385c633f):
  ```
  tree movement 385c633..197edd8: 10 rows in 1 features
  FEAT-013 · Install and connect harness runtimes
    R-315 untested -> implemented
    R-317 untested -> implemented
    R-320 untested -> implemented
    R-349 untested -> implemented
    R-383 untested -> implemented; also applies: FEAT-014
    R-384 untested -> implemented
    R-739 untested -> retired
    R-927 untested -> implemented
    R-932 untested -> implemented
    R-939 untested -> retired
  ```
- Not in this record: a seat-run locked full suite (CI's three legs ran the whole suite).
- Main moved to 445f4d5b (ci-suite-timeout and knowledge-index-pins) after the lane's merge; both touch HANDOFF,
  REQUIREMENTS.md and the session file, none of the lane's test files. The land needs a merge of main and a
  confirmation round on the merged tip.
