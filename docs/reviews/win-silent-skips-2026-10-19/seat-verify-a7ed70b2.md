# Seat checks — win-silent-skips build 1, tip a7ed70b2 (2026-10-19)

- Build, by a Claude Sonnet 5 subagent in the lane worktree (`build-brief-1.md`): one pass, one commit 3dae9f8c (rows
  R-1950 to R-1957 at the end of FEAT-031 after R-1779; one `SKIP <title> — <reason>` line per guarded check on the
  Windows branch of each guard in the eight test files; test-locked's second-guard SKIP reworded to name its check; the
  new `packages/nana-pack/tests/windows-skip-lines.test.mjs`; the regenerated tree and code map). a7ed70b2 merges main
  8a9ff9a3 (the readme-windows-checklist land) into 3dae9f8c; `git show --remerge-diff a7ed70b2` shows no conflict
  resolution. No product code changed. The builder's report is not in this folder, so this record does not restate its
  wrong-code results; the seat helper read the commit and CI only.
- CI run 39361973111 on draft pull request #96 (a7ed70b2; GitHub's merge commit af98e34c merges a7ed70b2 into its own
  ancestor 8a9ff9a3, so the tree tested is a7ed70b2's):
  - macOS `169 files: 167 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7739 pass, 0 fail, 26 skip`; windows-skip-lines
    `8 pass`.
  - Ubuntu `169 files: 167 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7684 pass, 0 fail, 44 skip`; windows-skip-lines
    `8 pass`.
  - Windows `169 files: 152 PASS, 0 FAIL, 17 SKIP, 0 WARN · checks: 6679 pass, 0 fail, 98 skip`
    (`ci-windows-a7ed70b2.log`). The 17 skipped files are the 16 declared desk files and bench's study-tasks, main's
    declared set. windows-skip-lines `8 pass`, one PASS line per file (log lines 5071 to 5078).
  - install-check: macOS and Windows success.
  - None of main's known failures showed. Ubuntu's path-spelling GP1 and GP2 were fixed on main at ca27d86, and Windows
    main reads 0 FAIL since 4be0b79; both are in the lane's base. No R-291 merge artifact arises, since GitHub's merge
    commit holds a7ed70b2's tree.
- Per-file counts on the three legs (pass + skip, from the three job logs). On Windows every file's pass + skip equals
  its macOS count, as the must-meet's seat check asks:

  | file | Windows | SKIP lines on Windows | macOS | Ubuntu |
  |---|---|---|---|---|
  | requirements-regroup | 59 + 4 | 4 | 63 | 62 |
  | requirements-lift | 63 + 2 | 2 | 65 | 65 |
  | bounded-read | 2 + 2 | 2 | 4 | 4 |
  | adoption-producer | 61 + 1 | 1 | 62 | 62 |
  | post-edit-hardening | 17 + 6 | 6 | 22 + 1 | 22 + 1 |
  | adoption-reader | 42 + 2 | 2 (one new, one the older mode-000 SKIP) | 44 | 44 |
  | nana-setup win32-degrade | 86 + 1 | 1 | 87 | 87 |
  | test-locked | 13 + 4 | 4 | 17 | 17 |
  | windows-skip-lines (new) | 8 | 0 | 8 | 8 |

  Some of the SKIP lines, as the Windows log prints them:
  ```
  SKIP adoption: canonical /tmp alias is skipped without override — Windows has no /tmp alias
  SKIP reader: canonical /tmp alias is skipped without override — Windows has no /tmp alias
  SKIP FIFO is rejected without blocking — Windows has no mkfifo
  SKIP b: no orphaned grandchild survives the kill — pgrep and POSIX process groups
  SKIP f: settled within deadline + kill grace even though the kill failed — pgrep and POSIX process groups
  SKIP R-1162: run through a symlink to the script, the dry run still prints its plan — a file symlink needs Developer Mode or admin rights
  SKIP R-1171: an --out the command cannot write is refused by name, exit 1, with no stack trace — NTFS ACLs, not mode bits, decide writability
  SKIP SIGINT releases the full-run lock — Windows kills a child outright, so its signal handler never runs
  SKIP handled signals wait for suite termination before releasing the lock — Windows kills a child outright, so its signal handler never runs
  SKIP seam does not leak: a normal run links the hooks — a Windows install links no hook files
  ```
  Windows skips rose from 78 to 98, the 20 the plan expects: 21 guarded checks, of which one (test-locked's second
  guard) already printed a SKIP and only changed its wording. The 78 is the Windows count on readme-windows-checklist's
  run at 79b4c4ea and on hook-output-fail-open's at 1ca5420d; neither changed the eight files, which read the same at
  d4423eff, 8a9ff9a3 and 1ca5420d.
- The plan's win32-degrade counts were stale. Its evidence table and its seat check give 92 on Windows and 93 on macOS,
  from CI run 39344916736 on main f0d6da24. win-hook-rows (5fa19acd) then changed win32-degrade before the lane's
  branch point d4423eff. Windows read 86 on three later runs of this file (readme-windows-checklist at 79b4c4ea,
  knowledge-unreadable-root at 08ba23e3, hook-output-fail-open at 1ca5420d). On a7ed70b2 it reads 86 + 1 on Windows
  and 87 on macOS and Ubuntu, so the plan's real test, Windows equal to macOS, holds.
- Seat observation, outside the lane: Ubuntu's requirements-regroup reads 62 pass, 0 skip, against 63 on macOS and
  Windows. Its case-only alias check ("R-1171: an --out that is a case-only alias of the ledger is refused and leaves
  the ledger byte-identical") runs only on a case-insensitive disk, and its `if (caseInsensitive)` has no else. Main
  reads 62 there too (hook-output-fail-open's Ubuntu leg at 1ca5420d). It is a silent drop on Linux, not Windows, so it
  is a HANDOFF residual, not a finding on this lane.
- The seat's wrong-code pairs: none run, an ordinary lane. The plan's adversary named the dropped checks, and
  windows-skip-lines pins each SKIP line's presence. The plan records nine wrong versions run against its prototype
  scanner; `build-brief-1.md` names eight for the builder.
- Independent check: none, an ordinary lane.
- The plan's known limits, each a HANDOFF residual naming this lane: the test pins the source's shape and only the
  Windows leg shows the lines print; two guard spellings escape the scan; install.test's guard at 307 still drops two
  checks on Windows (win-claude-skills edits that file); 14 files with one SKIP per group stay short of their macOS
  counts; on a POSIX host where mkfifo fails, regroup and bounded-read still drop their FIFO checks silently; the
  scanner reads only the eight files and misses a title on the line after `check(`. The plan-attack's two weak points
  get lines too: a guard spelled another way could hide in a group-SKIP file (folded into the group-SKIP line), and
  test-locked's reason is inferred from Node's documentation; CI now shows the line prints, not that the reason holds.
- HANDOFF: one Landed line. The post-edit-win-survivors residual on the two macOS-and-Linux-only kill checks drops
  "Windows prints no skip line for either", which this lane fixes (the plan-attack asked for that edit), and names this
  lane. Eight new residuals for this lane (seven from the plan, one the Ubuntu observation above). Eight lines from
  other lanes' review notes: three from knowledge-unreadable-root's Opus round, three from its Fable round, two from
  hook-output-fail-open's Opus round. readme-windows-checklist's four review notes are already in main's HANDOFF (added
  after 8a9ff9a3), so this lane adds none of them; they arrive at the next merge of main.
- Rows: R-1950 to R-1957 read `implemented` in REQUIREMENTS.md. `node scripts/requirements-trace.mjs` reads
  `requirements: 1473 total (1199 implemented · 1 planned · 34 retired · 234 untested · 5 violated); 1199 traced by
  tests` and `ears: 0 rows off form (allowance 0)`; `npm run map:check` reads 327 modules, 0 problems.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, merge base 8a9ff9a3): `8a9ff9a..a7ed70b:
  8 rows in 1 features`, FEAT-031 · Run checks reliably and without contaminating work: R-1950 to R-1957 new
  (implemented). CAP-07 moves from 292 to 300 rows and FEAT-031 from 77 to 85.
- Not in this record: a locked full-suite run (CI's three legs ran the whole suite) and the local macOS install check,
  which runs before the land because the lane edits a file under `packages/nana-setup/`.
- Main was d4423eff when the lane branched and 8a9ff9a3 when it last merged main, the merge base. Main has since moved
  to bffa2f2d (the knowledge-unreadable-root and hook-output-fail-open lands). So the land needs a merge of main, and
  that merge needs its own accepted review coverage. Both lands added a Landed line, a session entry and residuals at
  the same places as this lane's, and changed REQUIREMENTS.md, the tree and the code map.
