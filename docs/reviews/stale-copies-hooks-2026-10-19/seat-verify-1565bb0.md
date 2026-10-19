# Seat checks — stale-copies-hooks builds 1 and 2, tip 1565bb0 (2026-10-19)

- Builds, by a pi gpt-5.6-sol builder through pi-worker, each with verdict DONE. Per the builder's reports, not re-run
  by the seat except where this record says so:
  - Build 1 (`build-brief-1.md`, f089623a): rows R-1760 to R-1765 added and implemented; R-1601 and R-1602 retired as
    superseded (by R-1764 and R-1761). Its listed-file run read 831 PASS, 5 FAIL, all five in
    skills-and-standards.test.mjs. That matches the base failures it recorded first on this machine, which lacks the
    rulings copies until the owner reruns install. Hook mean time over five runs on a current POSIX temp-home install:
    main 105.6 ms, lane 106.3 ms. Doctor's output on a broken home, normalized, did not differ from main's.
  - Build 2 (`build-brief-2.md`, 1565bb0e): closed the seat's two findings below. Pair M6 survived on f089623a because
    R-1762's doctor half was untested; R-1762's check now also runs over a linked skills folder whose skills doctor
    passes, on macOS and forced win32, and deleting the doctor filter fails it. The independent check's known bug is
    fixed: with a linked Claude home or skills folder, the line names that linked folder once. New row R-1766,
    implemented and traced. stale-copies 13 PASS, 0 FAIL; install 104/0; win32-degrade 98/0; doctor-detail 68/0. The
    seat's pair baselines on 1565bb0 read the same four counts.
  - After 1565bb0e, 51e2423e adds only the seat's pair output. No code or test changed after 1565bb0e.
- CI run 39332152070 on draft pull request #74 (1565bb0e; GitHub's merge onto 22ccd849, merge commit 19f4d32f;
  1565bb0e already holds 22ccd849, so the merge's tree should be 1565bb0e's, inferred):
  - macOS `166 files: 164 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7655 pass, 0 fail, 18 skip`; stale-copies `13 pass`.
  - Ubuntu `166 files: 164 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7600 pass, 0 fail, 36 skip`; stale-copies `13 pass`.
  - Windows `166 files: 149 PASS, 0 FAIL, 17 SKIP, 0 WARN · checks: 6594 pass, 0 fail, 79 skip`
    (`ci-windows-run-2.log`). stale-copies `13 pass, 1 skip`: the skip is the POSIX fixtures, since native win32
    installs copies. Every new check passes there on the win32 fixtures:
    ```
    PASS R-1760: a missing hook link or hook settings entry puts one stale line in the adoption hook output
    PASS R-1761: the stale line names exactly the rule, skill and hook rows doctor marks failed
    PASS R-1762: the stale line names as paths to move exactly the skill paths install refuses
    PASS R-1766: a linked parent is the existing path to move before install
    PASS R-1764: a current install adds no stale or unavailable line to the adoption hook output
    PASS R-1765: the adoption hook leaves every file, folder and link in the home unchanged
    PASS R-1763: moving the named paths and running the named install clears the stale line
    ```
  - install-check: macOS and Windows success. None of main's known failures showed.
  - The plan's claim most likely wrong, that R-1765's whole-home snapshot stays unchanged on native Windows, held:
    R-1765 passes on the Windows leg.
  - The earlier run 39329824138 on build 1's tip f089623a did not finish whole: its macOS and Ubuntu suites and both
    install checks passed, but its Windows suite and release were cancelled. This record does not rely on it.
- The seat's wrong-code pairs (`seat-mutate.mjs`), through the shared mutation runner on macOS, Node 22.22.2, one
  shard each. Baselines: stale-copies 12 PASS on f089623a and 13 PASS on 1565bb0e; install 104, win32-degrade 98,
  doctor-detail 68.
  - f089623a (`seat-mutate-output-f089623a.txt`, committed in ed0d7663): 15 of 16 red, each by exactly its named
    titles. M6 survived: dropping doctor's half of the move-path filter kept every check green, because no fixture held
    a skill install refuses while doctor passes it. That became build brief 2's first finding.
  - 1565bb0e (`seat-mutate-output-1565bb0.txt`, committed in 51e2423e): 17 of 18 red, 14 by exactly their named
    titles and 3 with an extra unnamed red (M8 and M9 also turn R-1766 red; M17 also turns R-1763 red), 0 with a named
    title green. M6 now turns R-1762 red. M17, a linked parent never named, turns R-1766 red.
  - M18 survived on 1565bb0e: dropping the existing-path guard, so a move path that does not exist is still named.
    The only fixture where a refused skill path is missing is the linked-parent case, and the linked-parent branch
    handles it first. The guard covers other refusals no fixture builds, for example a regular file where the skills
    folder should be. Recorded as a carried residual for this lane.
  - Declared, no pair: (a) every pair runs on macOS, the win32 fixtures forced through NANA_SETUP_PLATFORM; (b) the
    settings read-error path, hasAdoptionInstallRecord's one-argument branch, the guard around the dry run and
    staleNotice's fallback for a path holding a backtick; (c) the hook-link position in the label order. Declared item
    (d) still predicts that M6 survives; that held on f089623a only, and the 1565bb0e output shows M6 red. Item (b)
    names a `failedSkills.size` guard, but the code guards the dry run with `labels.length`: it runs whenever any row
    fails, not only a skill row as build brief 1 said. The move paths still come only from failed skills.
- Independent check (`independent-check-f089623a.md`). It ran on build 1 (f089623a), not on 1565bb0e: a private clone
  on macOS, a temp HOME and TMPDIR for every probe. VERDICT HOLDS, 14 probes, no MUST. The installed hook on a fresh
  POSIX install took 0.11 s and printed nothing. A hook link replaced by a copy, a deleted skills folder, a forced-win32
  edited skill copy and a foreign skill link each gave one line; following it cleared the line. Doctor's rows matched
  main's, 47 of 47, on POSIX and forced win32. The hook left a home with no skills folder unchanged. Two mutations
  (the dry run made real; the settings-row loop emptied) turned the checks red. The code map and readme checks read
  0 problems, and the trace exited 0. Findings and how each was settled:
  1. Known bug (not MUST): with `~/.claude` a symlink (a dotfiles layout), install refuses every skill as "unsafe
     source ancestor", and the line told the user to move five skill paths that do not exist. Fixed in build 2
     (1565bb0e): the line names the linked folder once. New row R-1766; its check passes on all three CI legs, and
     seat pair M17 turns it red.
  2. Probe 4 (a settings file that does not parse: the hook stays silent, as on main) and probe 5 (a hooks shape
     install refuses: the line repeats and install exits 2) match the plan's known limits. Both are HANDOFF residuals.
  - Build 2's change (the linked-parent branch, the existing-path guard and the two new fixtures) had no independent
    probe. CI and the seat's pairs M6, M17 and M18 cover it; M18 survived, as above.
- Rows: R-1760 to R-1766 read `implemented` in REQUIREMENTS.md. R-1601 and R-1602 read `retired`, "superseded by
  R-1764, 2026-10-19" and "superseded by R-1761, 2026-10-19". The seat helper's re-run at 51e2423e:
  `node scripts/requirements-trace.mjs` reads `requirements: 1403 total (1117 implemented · 1 planned · 26 retired ·
  254 untested · 5 violated); 1117 traced by tests` and `ears: 0 rows off form (allowance 0)`; `npm run map:check`
  reads 320 modules, 0 problems; `npm run readme:check` reads 709 claims, 0 problems.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, merge-base 22ccd849): 9 rows in FEAT-015
  — R-1601 and R-1602 implemented to retired; R-1760 to R-1766 new (implemented).
- HANDOFF: one Landed line. Two win-stale-copies residuals change: the line about a folder at a skill path is gone,
  because the line now names that path to move; the line about hooks now names only what stays doctor-only. New
  carried residuals, each naming this lane: the unpinned existing-path guard (M18); the check goes silent with the
  adoption hook or an unparseable settings file; settings problems install cannot fix repeat the line; a retired copy
  whose backup exists repeats it; doctor's own advice for two refused skill shapes; and, from the plan, a second
  verifier entry on Windows. The seat also recorded one residual for adopt-structure-markers there.
- Install check: the lane class needs the local macOS install check before nana-land; the seat runs it before the
  land. CI's install check passes on macOS and Windows.
- Main was 22ccd849 when CI ran, the lane's merge base. Main has since moved to 02f1c139, the review-ledger-run-reviewer
  land, and this lane has not merged it. A merge of main before the land needs its own accepted review coverage.
