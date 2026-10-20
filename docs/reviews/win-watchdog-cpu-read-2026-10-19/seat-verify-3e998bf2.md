# Seat checks — win-watchdog-cpu-read, builds 1 and 2, tip 3e998bf2 (2026-10-19)

- Builds, by a pi gpt-5.6-sol builder through pi-worker: build 1 (`build-brief-1.md`, commit 59340ee7, merged with
  main d4423eff at 62627846) and build 2 (`build-brief-2.md`, commit b97387a6, merged with main 8a9ff9a3 at 3e998bf2).
  Build 2 changed only `watchdog-cpu.test.mjs`, two lines: R-1890's control now runs through cmd's shell, and R-1891
  gains the ps cases `01:00:00` and `1-02:03:04`. After 3e998bf2, 49b8581a adds only the seat's pair output. The seat's
  notes commit adds this record, the independent check, the Windows log, the two review briefs, HANDOFF and the
  session entry, and promotes R-1890: one marker line in the test (`req-candidate` to `req`, no test logic) and one row
  status. No product code changed after 3e998bf2.
- Probe P1 before the build (`probe-p1.log`, scratch Windows-only CI run 39355882657, main 27fb9d3c's code, an en-US
  runner): Windows PowerShell 5.1.26100 printed `1,5` and the comma CPU value `0,90625` under an in-process de-DE thread
  culture, so the plan's first branch held: build as written. The adversary's claim most likely wrong, that 5.1 honours
  the in-process switch inside one `-Command` script block, held. After `Set-Culture de-DE`, a new PowerShell printed
  `de-DE` and CPU `0,5` (ticks `5000000`). Main's win32-launch.test.mjs then failed `Windows: a busy pi is not stopped as
  stalled` (14 pass, 1 fail), with `cpu=0s` reads and STALL.
- P1 re-run on build 1's tip 62627846 under the de-DE user culture (`probe-p1-tip-62627846.log`, run 39358595464,
  committed in 7389e94d): win32-launch 15 pass, the busy-pi check included; watchdog-cpu 5 pass, R-1890 included. Build 2
  changed only the test file, so this run stands for 3e998bf2's product code (the seat helper's reading). It is
  end-to-end evidence under a real user culture, not a pin.
- CI run 39358574887 on build 1's tip 62627846 (draft pull request #93; merge commit 3ff2f1ef onto d4423eff;
  `ci-windows-62627846-build1.log`): Windows 169 files, 151 PASS, 1 FAIL, 17 SKIP (6,669 checks pass, 1 fail). The one
  FAIL was R-1890 on its own precondition: on the en-US runner the control printed `1.5\r\n`, not `1,5`. The run itself
  was right: cpu 1.4375 s rising to 6.109375 s over four lines, SUCCESS on attempt 1, no STALL. Build 2's commit message
  gives the fix: the control now uses the cmd shell, so its PATH lookup reaches the fixture's `powershell.cmd` wrapper,
  as the product's own `execSync` read already did. mutation-runner passed there (36 pass, 3 skip).
- CI run 39362479464 on draft pull request #93 at 3e998bf2 (GitHub's merge commit 4b859b60 merges 3e998bf2 into its own
  ancestor 8a9ff9a3, so the tree tested is 3e998bf2's):
  - macOS 169 files, 167 PASS, 0 FAIL, 2 SKIP (7,735 checks pass).
  - Ubuntu 169 files, 167 PASS, 0 FAIL, 2 SKIP (7,680 checks pass).
  - Windows `169 files: 151 PASS, 1 FAIL, 17 SKIP, 0 WARN · checks: 6675 pass, 1 fail, 78 skip`
    (`ci-windows-3e998bf2.log`), the 17 skipped files main's declared ones. The one FAIL is
    `packages/nana-pack/tests/mutation-runner.test.mjs` (35 pass, 1 fail, 3 skip), its check `mutation runner: contending
    child processes observe complete lock ownership and never overlap their critical sections`. That is main's lock
    check, the bug the urgent mutation-runner-win-lock lane fixes; this lane touches no mutation runner file. On the
    en-US runner all five lane checks pass natively, by title:
    ```
    PASS R-1890: on Windows a busy pi runs to its exit when PowerShell writes a decimal comma
    PASS R-1891: the CPU sample parser reads whole Windows ticks and ps times, and no number from comma, point or empty text
    PASS R-1891 seal: WIN_CPU_TICKS_PER_SECOND is 10,000,000
    PASS R-1892: unreadable CPU samples print unreadable and count as flat against the last readable time
    PASS R-1893: a pi that exits during a CPU read ends by its own exit status, whether the read fails or repeats the last time
    ```
    win32-launch passes 15, `Windows: a busy pi is not stopped as stalled` included; watchdog-exit 6; immutable-review
    16 pass, 2 skip, the fold's `temporary worktree registration is removed after watchdog stall` included; review-ledger
    163 pass, 2 skip; worker-lane 51 pass, 1 skip. On this runner R-1890's comma comes from its wrapper's in-process de-DE
    culture (the control must print `1,5`), not from the user culture; P1 above covers the user culture.
  - install-check: macOS and Windows success.
  - None of main's other known failures showed: Ubuntu's path-spelling GP1 and GP2 were fixed on main at ca27d86, in the
    lane's base, and no R-291 merge artifact arose, since the merge commit holds 3e998bf2's tree.
- R-1893 on Windows, the adversary's next claim most likely wrong (that one setImmediate yield sees a Windows exit):
  it passed natively on three Windows runs, build 1's CI, the de-DE P1 re-run and 3e998bf2's CI. Three passes do not
  prove a timing claim; the one-yield limit stays a residual.
- The seat's wrong-code pairs (`seat-mutate.mjs`), through the shared mutation runner on macOS, Node 22.22.2, one shard;
  baseline watchdog-cpu 4 PASS, 0 FAIL, R-1890 printing SKIP:
  - 62627846 (`seat-mutate-output-62627846.txt`, commit a45bf37d): 17 of 18 red, each by exactly its named titles. H1
    (the ps parser ignores the hours field) survived: every ps case then carried a zero hours field. The seat sent it
    to build 2.
  - 3e998bf2 (`seat-mutate-output-3e998bf.txt`, commit 49b8581a): 18 of 18 red, each by exactly its named titles,
    0 with an unnamed red, 0 survived. H1 now turns R-1891 red. P1 to P4 put back main's win32 parse, ps parse, poll
    and catch; W2 to W10 are the brief's wrong code; K1 the seal; D1 the digits-only guard; T1 the trim; U1 the
    unreadable print. DECLARED (e) was rewritten in 49b8581a to expect H1 red.
  - Declared, no pair: (a) every pair runs on macOS, where R-1890 skips; (b) W1, the win32 read back to `.CPU`, which
    only R-1890 reaches, on Windows; (c) the immutable-review fold and the pack README's two sentences; (d)
    parseCpuSample's type guard and its two finite checks, judged equivalent (inferred, not run). Declared item (b)
    says the seat runs W1 on the lane's Windows CI leg. It did not: no run has shown R-1890 red on the old read. The
    Windows-only path rests on CI and the two P1 runs: main's read stalled a busy pi under de-DE and the lane's did not.
    The plan's macOS probe (pwsh 7 behind a de-DE wrapper, main's read forced on) also stalled on a `.CPU` read.
    Recorded as a HANDOFF residual.
- Independent check (`independent-check-3e998bf2.md`): it ran on build 1, 62627846, in a private clone on macOS only,
  with a temp HOME and TMPDIR. HOLDS, no MUST, eleven probes. The parser reads real macOS ps output, minutes past 59
  and the days form, and returns no number for comma, point, spaced and empty Windows text (P1). macOS ps prints a point
  under de_DE, fr_FR and C, so the unreadable rule cannot stall a German or French macOS user (P2). A busy fake pi with
  the real ps succeeds, an idle one stalls (P3, P4). A busy pi exiting 3 ends as a failed attempt with no STALL (P5).
  With ps missing from PATH the watchdog prints `cpu=unreadable` and stalls; it fails closed by design, and main stalls
  one poll later (P6). With the Windows tick read forced on behind a fake `powershell`, the product sends the
  TotalProcessorTime.Ticks expression, a busy pi succeeds and an idle one stalls (P7). A pi that exits during a real ps
  read ends by its own exit status, 0 or 5, with no STALL (P8). The neighbouring test files pass one at a time (P9). Map
  and README checks read 0 problems, and main d4423eff is contained in the tip (P10). Build 2 changed only the test file,
  so these product probes stand for 3e998bf2 (the seat helper's reading). Its findings and how each was settled:
  1. Status note: it could not check the Windows-only claims, R-1890 and the one yield seeing a Windows exit (R-1893 on
     win32). The folder then held no post-build P1 run and no Windows CI run on 62627846. Settled: the seat committed
     both in 7389e94d. 3e998bf2's Windows CI passes R-1890 and R-1893 natively, and the seat's notes commit promotes
     R-1890 to implemented.
  2. Known bug, found on main too (P11): immutable-review.test.mjs leaves one empty `pi-review-*` capture folder in the
     temp folder. HANDOFF already carries it, in the watchdog-exit lane's "found on main too" line, so no new line.
- The plan's known limits, each a HANDOFF residual: no suite test changes a real user culture, so the P1 runs are the
  user-culture evidence; the exit re-check yields once, so a read taken after an exit the system has not yet reported
  still counts and can end as STALL (inferred, rare); each Windows read still starts PowerShell, about 1 s and tens of
  seconds on a loaded runner, and both reads still find `powershell` and `ps` by name on PATH. The plan's last limit,
  the reclaim check's wait, the final-cleanup EBUSY in immutable-review, review-ledger's signal-section wait and the
  stale "Until W7c" comments, is the planned review-test-waits lane, which builds after this lane lands; HANDOFF's
  Windows review-tools line now says so. The seat adds two: no wrong-code pair ran on Windows (above), and the rail
  reads R-1890 implemented from a run where its check skips.
- HANDOFF: one Landed line. Two lines change. The watchdog-exit line on a pi that exits during a CPU read drops "it can
  add one extra CPU progress line", which this lane fixes unless the exit is still unreported after one yield. The
  Windows review-tools line seen on pi-seat-live-turn's CI now says the stall check's fake pi and guard allow 180 and
  120 seconds, up from 30 each, and that review-test-waits covers the reclaim wait. Five new lane residuals, each
  naming this lane, and eleven seat items from other lanes (the session entry lists them).
- Rows: R-1890 to R-1893 read `implemented` in REQUIREMENTS.md, in FEAT-007's SUB-008 directly after R-1395, all four
  shared with FEAT-006. R-1890 flips from untested in the notes commit, its evidence the test title plus CI run
  39362479464 and the de-DE run 39358595464. The seat helper's re-run after the flip: `node
  scripts/requirements-trace.mjs` reads `requirements: 1469 total (1195 implemented · 1 planned · 34 retired · 234
  untested · 5 violated); 1195 traced by tests` and `ears: 0 rows off form (allowance 0)`, exit 0; `npm run map:check`
  reads 327 modules, 0 problems; `node scripts/requirements-tree.mjs --check` exits 0.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, merge-base 8a9ff9a3), run at 49b8581a:
  `8a9ff9a..49b8581: 4 rows in 1 features`, FEAT-007 · Review a specific revision independently: R-1890 new (untested),
  R-1891 to R-1893 new (implemented), each also applies FEAT-006. The notes commit flips R-1890, so a run on the tip
  reads R-1890 new (implemented). CAP-02 moves from 180 to 184 rows, FEAT-007 from 121 to 125 and SUB-008 from 34 to 38.
- Not in this record: the seat's own locked full-suite run (CI's three legs ran the whole suite). Build 1's builder ran
  it at 59340ee7 on macOS: `169 files: 167 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7731 pass` (`build-1-suite.log`).
- Main was 8a9ff9a3 when the lane last merged it, its merge base. Main has since moved to 0361bbb7 (the
  knowledge-unreadable-root, hook-output-fail-open and install-dry-run-pi-packages lands), and win-claude-skills lands
  before this lane. So the land needs a merge of main, and that merge needs its own accepted review coverage. Those
  lanes also add Landed lines, residuals and session entries at the same places as this lane's.
