# Seat checks — hook-output-fail-open build 1, tip 1ca5420d (2026-10-19)

- Build, by a pi gpt-5.6-sol builder through pi-worker (`build-brief-1.md`): one pass, one commit 1ca5420d (rows R-1940
  to R-1944, one `process.stdout.on("error", () => {})` in each of `nana-objective.mjs`, `nana-adoption.mjs`,
  `nana-shared-memory.mjs` and `verifier-pipe.mjs` with its `@errors` clause, the new
  `tests/hooks-closed-output.test.mjs`, the regenerated tree and code map). The must-meet's class line names a Claude
  Sonnet subagent as the builder; the build ran through pi-worker with gpt-5.6-sol (its pi session names that model).
  The builder's report, read and not re-run by the seat: VERDICT DONE; before the fix, four FAIL lines on main's hooks,
  each `open=0 closed=1 stderr="node:events:497"` (the roster notice pin passed on main in the adversary's probe);
  after it, five PASS. Its wrong code: each
  listener removal red, the roster exit removal red, the journal fixture removal red, an exit-1 listener red, and the
  EPIPE-only listener green, as the brief expected. The five named files pass 91 checks; trace 0 rows off form; tree
  test 93 checks; map and readme checks exit 0. After 1ca5420d, 05c51b00 adds only the seat's pair table and its
  output, and the seat's notes commit adds only this record, the independent check, the Windows log, the two review
  briefs, HANDOFF and the session entry. No code or test changed in the lane after 1ca5420d.
- Test titles and rows (the pairs agent's note). The test prints shorter titles than the plan's must-meet table: for
  example `objective hook ignores a closed stdout and exits 0`, where the table has `objective hook prints with its
  output open and exits 0 with empty stderr when its output is closed first`. The rows cite the test's own titles, so
  the trace holds. The row text differs from the plan's too: each reads "IF stdout raises an error, such as because its
  reader closed it, THEN the <hook> shall ignore the error and exit 0", without the plan's "and write nothing to
  stderr". The test still requires empty stderr on the closed run (the independent check's K2). The seat helper's
  reading, not run: the rows' trigger, any stdout error, is wider than the test, which raises only a closed reader's
  error; that is the K1 gap below in the rows' own words.
- CI run 39360558690 on draft pull request #94 (1ca5420d; GitHub's merge commit bf05224f merges 1ca5420d into its own
  ancestor d4423eff, so the tree tested is 1ca5420d's):
  - macOS `169 files: 167 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7730 pass, 0 fail, 26 skip`; hooks-closed-output
    `5 pass`.
  - Ubuntu `169 files: 167 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7675 pass, 0 fail, 44 skip`; hooks-closed-output
    `5 pass`.
  - Windows `169 files: 152 PASS, 0 FAIL, 17 SKIP, 0 WARN · checks: 6670 pass, 0 fail, 78 skip`
    (`ci-windows-1ca5420d.log`). The 17 skipped files are the 16 declared desk files and bench's study-tasks, main's
    declared set. hook-producers `10 pass`; roster-notice-hook `4 pass`; shared-memory-hook `42 pass, 1 skip`;
    verifier-pipe `29 pass`. All five checks run natively there and pass by title:
    ```
    PASS objective hook ignores a closed stdout and exits 0
    PASS adoption hook ignores a closed stdout and exits 0
    PASS shared-memory hook ignores a closed stdout and exits 0
    PASS roster-notice hook ignores a closed stdout and exits 0
    PASS verifier hook ignores a closed stdout and exits 0
    ```
    So on native Windows each hook prints with its output open, and exits 0 with empty stderr after its reader
    closes. A pass cannot show which error Windows raised, or that it raised one: no run of main's hooks and no pair
    ran on Windows. The adversary named a vacuous Windows pass as its claim most likely wrong. So the fix holds on
    Windows, but the K1 pin gap stays open there.
  - install-check: macOS and Windows success.
  - None of main's known failures showed: Ubuntu's path-spelling GP1 and GP2 were fixed on main at ca27d86, Windows
    main reads 0 FAIL since 4be0b79 (both in the lane's base), and no R-291 merge artifact arises, since GitHub's merge
    commit holds 1ca5420d's tree.
- The seat's wrong-code pairs (`seat-mutate.mjs`, `seat-mutate-output-1ca5420d.txt`, committed in 05c51b00), through
  the shared mutation runner on macOS, Node 22.22.2, one shard on 1ca5420d; baseline hooks-closed-output 5 PASS,
  0 FAIL: 5 of 5 red, each by exactly its named title, 0 survived. M1 to M4 each delete one hook's stdout error
  listener (main's form) and turn R-1940, R-1941, R-1942 and R-1944 red, one each. M5 deletes the roster notice's
  `process.exit(0)` and turns R-1943, the pin, red. Declared, no pair: (a) every pair runs on macOS only; (b) the
  ignore-every-error choice has no pair, since an EPIPE-only listener stays green on macOS; (c) the four `@errors`
  header clauses are comments.
- Independent check (`independent-check-1ca5420d.md`, a private clone at 1ca5420d with main d4423eff for comparison,
  a temp HOME, macOS): HOLDS, no MUST, eleven probes. The must-meet file is red on main's four hooks and green on the
  lane, three runs of three (P1). With the reader open, all five hooks print the same bytes as main's over seven
  inputs (P2). Piped into a reader that exits at once, main's hooks exit 1 on every run and the lane's exit 0 with
  empty stderr (P3). A 1.28 MB shared memory index piped into a reader that closes after 10 bytes: main exits 1 on
  five of five runs, the lane 0; a slow full reader gets all 1,278,090 bytes on both (P4). A preload that makes every
  stdout write fail with a Windows-style EOF error: main's objective, shared-memory and verifier hooks exit 1, the
  lane's exit 0 (P5). The verifier's stderr diagnostics still print with stdout closed (P6). The adoption hook's
  output and its 0.11 s time are unchanged (P7). The four existing hook test files pass whole (P8). Map, readme,
  trace and tree movement read clean (P9). The test writes nothing outside its temp folder (P10). Its own wrong code:
  the roster exit removal turns R-1943 red; an EPIPE-only listener passes the test but exits 1 under the EOF preload
  (P11). Its findings and how each was settled:
  1. K1, known bug (the plan lists it): nothing pins the choice to ignore every stdout error; an EPIPE-only listener
     passes the must-meet file on macOS and exits 1 on an EOF error. Not fixed. Windows CI now runs the five checks
     natively and they pass, but no Windows pair ran, so the gap stays. Recorded as a HANDOFF residual.
  2. K2, known bug, records only: the rows drop the plan's "write nothing to stderr", and the test titles differ from
     the plan's table. Behaviour is unaffected. Recorded as a HANDOFF residual, with the seat helper's width reading
     above.
  3. K3, residual as planned: the knowledge hook is unchanged; a closed stderr is unguarded; the hooks still do their
     disk work after the reader closes; the second adoption step has no time limit of its own. Each is a HANDOFF
     residual; the time limit extends the existing win-stale-copies line.
- The plan's known limits, each a HANDOFF residual unless said: nobody has seen Claude Code close a hook's output
  early, and a plain parent process stands in (no line; the session entry says so); no check covers a reader that
  closes partway through (a line; P4 probed it by hand); the ignore-every-error choice is unpinned (K1's line); a
  closed stderr is out of scope (a line); Windows was unprobed (now run natively by CI; the pair gap is in K1's line);
  a hook still does its work after the close (a line); neither adoption producer has its own time limit (the existing
  line, extended).
- The plan's cut of part (b): on pi-seat-live-turn's Windows install-check log the adoption hook passed 0.49 s after
  the hook set started (23:59:48.131 to 48.625), ten times under Claude Code's 5 s hook limit, and a deadline would add
  a tunable that must fit two producers under 5 s. The lane chose not to add a per-producer time limit. HANDOFF's
  win-stale-copies line on the adoption producers' missing time limit stays and now names this lane's choice.
- HANDOFF: one Landed line. The tranche-5 residual drops "the shared-memory hook throws on a closed pipe", which this
  lane fixes. Six new carried residuals, each naming this lane: K1's pin gap with the Windows pair gap; the
  partway-close test gap; the closed stderr; the work done after the close; the knowledge hook without a check; and
  K2's row text and titles.
- Rows: R-1940 to R-1944 read `implemented` in REQUIREMENTS.md, at the end of SUB-012 directly after R-1207. The seat
  helper's re-run at 05c51b00: `node scripts/requirements-trace.mjs` reads `requirements: 1464 total (1190 implemented ·
  1 planned · 34 retired · 234 untested · 5 violated); 1190 traced by tests` and `ears: 0 rows off form (allowance 0)`;
  `npm run map:check` reads 327 modules, 0 problems.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, merge-base d4423eff): `d4423ef..05c51b0:
  5 rows in 1 features`, FEAT-013 · Install and connect harness runtimes: R-1940 to R-1944 new (implemented). CAP-04
  moves from 387 to 392 rows, FEAT-013 from 130 to 135 and SUB-012 from 28 to 33.
- Not in this record: a locked full-suite run (CI's three legs ran the whole suite) and the local macOS install check,
  which runs before the land.
- Main was d4423eff when the lane branched, its merge base. Main has since moved to 8a9ff9a3 (the
  readme-windows-checklist land), so the land needs a merge of main, and that merge needs its own accepted review
  coverage. readme-windows-checklist also added a Landed line and a session entry at the same places as this lane's,
  and changed REQUIREMENTS.md, the tree and the code map.
