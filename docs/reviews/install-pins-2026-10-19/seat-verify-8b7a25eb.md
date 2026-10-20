# Seat checks — install-pins build 1, tip 8b7a25eb (2026-10-19)

- CI run 39348980616 on draft pull request #86 (8b7a25eb; GitHub's merge commit `16de61ea` onto main `f0d6da24`, the
  lane's base, so the same tree as the tip): macOS `167 files: 165 PASS, 0 FAIL, 2 SKIP` (7,674 checks pass, 0 fail,
  25 skip); Ubuntu `167 files: 165 PASS, 0 FAIL, 2 SKIP` (7,619 pass, 0 fail, 43 skip); Windows `167 files: 150 PASS,
  0 FAIL, 17 SKIP` (6,614 pass, 0 fail, 78 skip; `ci-windows-8b7a25eb.log`). The skips are main's declared ones:
  hooks-win32-exec and study-tasks off Windows, the 16 desk files and study-tasks on it. install-check passes on macOS
  and Windows. None of main's known failures showed (Ubuntu GP1/GP2, the PR merge-commit R-291 total).
- The lane's five files on macOS and Ubuntu read the brief's expected counts, each with no skip: install 106,
  settings-merge 219, skills-and-standards 83, relative-agent-dir 30, agent-dir-parity 56. On Windows: install 90 pass
  and 5 skip, settings-merge 212 and 7, skills-and-standards 58 and 4, relative-agent-dir 30 and 0, agent-dir-parity 32
  and 4, 0 fail in each.
- The Windows leg prints each new check by title, and all eight ran and passed there; none skipped: R-827 (agent-dir-parity),
  R-922 and R-318 (install), R-346 (relative-agent-dir), R-924 and R-322 (settings-merge), R-1870 and R-1871
  (skills-and-standards). Every Windows skip in those five files is an older check with its printed reason (symlinks
  need a privilege, POSIX mode bits, the legacy hook migration is off on win32, the desk resolver is frozen, a live cwd
  cannot be deleted, and "win32 occupied skill dir (the POSIX refusal expects a symlink fix; section 4b runs the win32
  refusal natively)"). The lane adds no skip. So the adversary's claim most likely wrong, that the `--claude-home`
  control reads all good on native Windows, held: R-346 passes there only when the absolute run exits 0 and says all
  good with no ✗ or ! line.
- The seat on 8b7a25eb (this notes commit changes no row and no code): `node scripts/requirements-trace.mjs` reads
  1,427 rows, 0 off form; `npm run map:check` reads 0 problems. The eight rows the plan pins or adds read
  `implemented`: R-1870, R-1871, R-924, R-322, R-922, R-318, R-827 and R-346. R-304 and R-382 read `retired`
  (superseded by R-1870), and R-381 `retired` (superseded by R-1871). `git diff --quiet f0d6da24..8b7a25eb --
  packages/nana-setup/lib packages/nana-setup/bin packages/nana-setup/claude packages/nana-pack/lib packages/nana-pack/bin
  packages/nana-pack/extensions packages/nana-knowledge packages/nana-stage apps scripts templates` exits 0. The diff
  touches five test files, REQUIREMENTS.md, the tree, the map and the plan files only. So the lane is ordinary, as
  planned: no install, doctor, hook, gate or land-tool code changed. It touches nana-setup tests, so the seat runs
  `node packages/nana-setup/bin/install-check.mjs` on macOS before nana-land (not yet run; CI's macOS install-check
  passed).
- The builder's report (a Claude Sonnet 5 subagent, build 1, `8b7a25eb`): verdict DONE, the five files at the expected
  counts with 0 FAIL, and an empty `git diff main...HEAD` under nana-setup's lib and bin and nana-pack's lib. The commit
  message records no wrong-code result; the report does. The builder tried the eight wrong versions build brief 1 lists,
  restored each after, and each turned red the checks the plan predicted, and only those where the plan said "only".

  | Pin | Wrong code the plan names | Shown red by the builder | Probed only by the planner and the adversary on main f0d6da24 |
  |---|---|---|---|
  | R-1870 | W7b, W7c, W7d | W7d (R-1870 only; R-1871 stayed green) | W7b, W7c |
  | R-1871 | W7, W7b, W7c | W7 (R-1871 only; R-1870 stayed green) | W7b, W7c |
  | R-924 | W4, W5 | W4 | W5 |
  | R-322 | W6, W6b | W6 | W6b |
  | R-922 | W1, W2, W3 | W1 (with R-318); W2 (R-922 only) | W3 |
  | R-318 | W1, W3 | W1 (with R-922) | W3 |
  | R-827 | W8, W9 | W8 | W9 |
  | R-346 | W10, W11, W11b, W12 | W11 (R-346 only) | W10, W11b, W12 |

  Every pin has at least one wrong version the builder showed red on the build. The seat did not re-run the tries.
- The seat's own reading, for the reviewer: R-1870 proves "untouched" by the folder staying a real directory and its
  SKILL.md keeping its bytes. It does not check that the folder holds only SKILL.md, which the build brief asked. So a
  wrong install that added a file inside the owner's folder, leaving SKILL.md as it was, would stay green (inferred;
  not run).
- No wrong-code pairs from the seat and no independent check: an ordinary lane, so no findings to settle. The plan's
  one known bug, the dry run under `--home` saying "would add per-package entries" for pi packages while the real run
  says skipped (R-391, and R-313 for that step), goes to HANDOFF as a carried line. The plan's coverage limits (R-346
  through `--claude-home` only; R-322, R-924 and R-827 through install only; eleven rows left for later) are in the
  session entry.
- Main has moved since the base: main is `4656f646` (pwsh-lexer-oracle landed). It touches none of the lane's five test
  files but changes REQUIREMENTS.md, the tree, the map, HANDOFF and the session archive. A merge of main and a
  confirmation round follow before the land.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main` on 8b7a25eb):

  ```
  tree movement f0d6da2..8b7a25e: 11 rows in 2 features
  FEAT-013 · Install and connect harness runtimes
    R-304 untested -> retired
    R-318 untested -> implemented
    R-322 untested -> implemented
    R-381 untested -> retired
    R-382 untested -> retired
    R-827 untested -> implemented
    R-922 untested -> implemented
    R-924 untested -> implemented
    R-1870 new (implemented)
    R-1871 new (implemented)
  FEAT-015 · Diagnose the active environment
    R-346 untested -> implemented
  ```
