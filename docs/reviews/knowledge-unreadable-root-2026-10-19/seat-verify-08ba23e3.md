# Seat checks — knowledge-unreadable-root, builds 1 and 2, tip 08ba23e3 (2026-10-19)

- Builds, by a pi gpt-5.6-sol builder through pi-worker: build 1 (`build-brief-1.md`, commit 802c8478, merged with
  main d4423eff at fd0e7ab5) and build 2 (`build-brief-2.md`, commit 08ba23e3). After 08ba23e3, 356dc265 adds only the
  seat's pair table and its output; the seat's notes commit adds only this record, the independent check, the two
  Windows logs, the review briefs, HANDOFF and the session entry. No code or test changed in the lane after 08ba23e3.
- CI run 39360453683 on draft pull request #89 at 08ba23e3 (GitHub's merge commit 960f6b52 merges 08ba23e3 into its
  own ancestor d4423eff, so the tree tested is 08ba23e3's):
  - macOS `169 files: 167 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7732 pass, 0 fail, 26 skip`. unreadable-root `7 pass`;
    incremental-build `27 pass`; discovery `37 pass`; hook `98 pass`; extension `38 pass`.
  - Ubuntu `169 files: 167 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7677 pass, 0 fail, 44 skip`. The same five knowledge
    files pass with the same counts, so the four denial checks run and pass on Linux too.
  - Windows `169 files: 152 PASS, 0 FAIL, 17 SKIP, 0 WARN · checks: 6667 pass, 0 fail, 83 skip`
    (`ci-windows-08ba23e3.log`), its 17 skipped files main's declared ones. unreadable-root `2 pass, 5 skip`:
    ```
    SKIP R-1910 … R-1913 and R-1915 — readdir unexpectedly succeeded for …\a; readdir unexpectedly succeeded for …\b\locked
    PASS R-883: build names a missing root MISSING and status marks it MISS, both exiting 0
    PASS R-1914: status marks a readable single-file root ok
    ```
    The hosted runner's account lists a folder behind the `icacls … /deny *S-1-1-0:(RD)` rule, so the precondition
    fails and the five denial checks print their declared SKIP. The unreadable-folder behaviour is proven on macOS and
    Linux only. incremental-build, discovery, hook and extension pass with the macOS counts. mutation-runner passes
    `36 pass, 3 skip`, so main's lock contention failure did not show on this run.
  - install-check: macOS and Windows success.
- CI run 39357305834 on build 1's tip fd0e7ab5 (merge commit 7b044e50 into d4423eff): macOS 167 PASS, 0 FAIL, 2 SKIP of
  169 files (7,730 checks pass); Ubuntu the same file counts (7,675); Windows 152 PASS, 0 FAIL, 17 SKIP (6,666;
  `ci-windows-fd0e7ab5-build1.log`). unreadable-root `5 pass` on macOS and Ubuntu; on Windows R-1910 to R-1913 SKIP
  by the same named reason and R-883 passes. install-check passes on macOS and Windows.
- None of main's known failures showed on either run: Ubuntu's path-spelling GP1 and GP2 were fixed on main at ca27d86,
  and no R-291 merge artifact arose, since each merge commit holds the lane's own tree.
- Build 2's saved output (`build-2-output.txt`, the builder's, not re-run by the seat): the local macOS install check
  exits 0 with every line PASS, and the locked full suite reads `169 files: 167 PASS, 0 FAIL, 2 SKIP` (7,734 checks
  pass).
- The seat's wrong-code pairs (`seat-mutate.mjs`), through the shared mutation runner on macOS, one shard, Node 22.22.2:
  - fd0e7ab5 (`seat-mutate-output-fd0e7ab5.txt`, commit 2b7d4e9b): 14 of 19 red, 5 survived. M19 (status opens a file
    root as a folder) was unpinned: without the directory guard a healthy single-file root reads UNREADABLE and no
    check failed. M3 and M8 (walk's root-level `return false` and the caller's `if (!walk(...)) continue`) were
    redundant: the purge loop already keeps every row under a recorded root. M4 and M5 are not reachable in a test.
    The seat sent all four to build 2.
  - 08ba23e3 (`seat-mutate-output-08ba23e.txt`, commit 356dc265): 14 of 16 red, each by exactly its named titles,
    0 with an unnamed red; baselines unreadable-root 7 and incremental-build 27 PASS. M19 now turns R-1914 red; the new
    M20 (fd0e7ab5's rebuild wording) turns R-1915 red. M3, M6, M7 and M8 are deleted, because build 2 removed the code
    they changed (walk returns nothing and the caller reads no result). M4 (a root whose stat fails in walk right
    after `existsSync` passed) and M5 (a folder that lists in its parent but cannot be stat'd) survive; each needs a
    race, and both are declared and carried as a HANDOFF residual.
- Independent check (`independent-check-08ba23e3.md`): it ran on build 1, fd0e7ab5, in a private clone with a main
  baseline at d4423eff, a temp HOME and a temp knowledge home for every probe. HOLDS, no MUST, eleven probes. The
  main bug is fixed: main purged an unlistable root and folder (`removed 3`, status `ok`), the lane keeps both
  (`removed 1 · preserved 2`, both lines UNREADABLE, status UNREADABLE) and still purges the deleted file (P1).
  Recovery purges the kept rows once the folder lists again (P2). A macOS privacy-protected folder behaves like the
  chmod case (P3). The sibling-name boundary holds (P5). The hook's detached build keeps the rows main purged (P6).
  Setup's parse still reads the summary line (P7). A whole subfolder deleted between builds still purges (P10). Its
  findings and how each was settled:
  1. Known bug A, test only: R-1913's and R-883's checks asserted the status line held no "ok", but the line ends
     with the temp path, so a temp path holding "ok" failed correct code (P11). Fixed in build 2, 08ba23e3: both
     checks now test the line's prefix.
  2. Known bug B: after `build --rebuild` an unlistable path printed "(skipped, rows kept)", but the rebuild had
     dropped the index (P8). Fixed in build 2, 08ba23e3: under `--rebuild` the MISSING and UNREADABLE lines read
     "(skipped; the rebuild dropped its rows)", pinned by new row R-1915.
  3. Confirmed known limit: a folder with read but no execute permission (mode 444) still purges its files (P4).
     Recorded as a HANDOFF residual.
  4. Confirmed known limit: an unlistable discover parent still purges its discovered roots' rows, as main does (P9).
     Recorded as a HANDOFF residual.
  5. Not verified there: the Windows deny path (CI's Windows leg then skipped it by its named reason) and a run as
     root. Recorded with the Windows proof residual.
- The plan's other known limits, each a HANDOFF residual: an unreadable single file keeps its rows silently, and
  status checks roots only; the hook's background build prints its UNREADABLE lines to no one; a file really deleted
  under an unlistable folder stays indexed until the folder lists again. R-203 and R-235 (the walker skips linked
  folders, .git and raw folders) stay untested; the seat narrowed knowledge-pull-fail-open-pin's walker residual
  from four requirements to those two.
- Rows: R-1910 to R-1915 read `implemented` in REQUIREMENTS.md, in FEAT-003 directly after R-883; R-207 and R-883 flip
  from untested to implemented with their text unchanged. The seat helper's re-run at the notes commit: `node
  scripts/requirements-trace.mjs` reads `1465 total (1193 implemented · 1 planned · 34 retired · 232 untested · 5
  violated)` and `ears: 0 rows off form (allowance 0)`; `npm run map:check` reads 327 modules, 0 problems.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, merge-base d4423eff): `d4423ef..356dc26:
  8 rows in 1 features`, FEAT-003 · Index and connect existing knowledge sources: R-207 and R-883 untested ->
  implemented, R-1910 to R-1915 new (implemented). CAP-01 moves from 179 to 185 rows and FEAT-003 from 35 to 41.
- Not in this record: the seat's own locked full-suite run (CI's three legs ran the whole suite) and the local macOS
  install check, which runs before the land.
- Main was d4423eff when the lane branched, its merge base. Main has since moved to 8a9ff9a3 (the
  readme-windows-checklist land), so the land needs a merge of main, and that merge needs its own accepted review
  coverage. readme-windows-checklist also edited the end of HANDOFF's Landed list and residuals and its Next item 1.
