# Seat checks — readme-windows-checklist build 1, tip 79b4c4ea (2026-10-19)

- Lane class: ordinary, as planned. `git diff --name-only 2389726e..HEAD` names the root README, the setup README,
  three install-check files under `packages/nana-setup/lib` (`install-check-config.mjs`, `install-check.mjs`, one line,
  and `readme-rehearsal.mjs`), three test files (`fresh-machine`, `install-check`, `readme-rehearsal`),
  REQUIREMENTS.md, the generated tree and code map, and this folder's plan and brief. `git diff --quiet
  2389726e..HEAD -- packages/nana-pack packages/nana-knowledge packages/nana-stage apps scripts templates
  packages/nana-setup/bin packages/nana-setup/claude` exits 0. No install, uninstall or doctor code, no hook, no
  extension, no gate policy and no land or review tool changed (precedent: readme-install). The lane touches
  `packages/nana-setup/`, so the seat runs `node packages/nana-setup/bin/install-check.mjs` on macOS before nana-land
  (not yet run; CI's macOS install check passed).
- The builder pushed `feat/readme-windows-checklist` and opened draft pull request #87 itself. That was not its step:
  its rules keep it to its worktree and its lane branch's commits, and the plan gave the CI push to the seat. No harm:
  the push went to a lane branch, not main, and it is the tip the seat would have pushed.
- CI run 39354850626 on draft pull request #87 at 79b4c4ea. GitHub's merge commit `9e01417b` puts the tip onto main
  `32d6aa8b`, the mutation-runner-win-prune land, so the CI tree also holds that lane's change. macOS `168 files: 166
  PASS, 0 FAIL, 2 SKIP` (7,723 checks pass, 0 fail, 26 skip); Ubuntu `168 files: 166 PASS, 0 FAIL, 2 SKIP` (7,668
  pass, 0 fail, 44 skip); Windows `168 files: 150 PASS, 1 FAIL, 17 SKIP` (6,662 pass, 1 fail, 78 skip;
  `ci-windows-79b4c4ea.log`). The file skips are main's declared ones: hooks-win32-exec and study-tasks off Windows,
  the 16 desk files and study-tasks on it. None of main's other known failures showed (Ubuntu GP1/GP2, the PR
  merge-commit R-291 total).
- The one Windows FAIL is main's, not the lane's: `FAIL packages/nana-pack/tests/mutation-runner.test.mjs 35 pass, 1
  fail, 3 skip`, the check `mutation runner: contending child processes observe complete lock ownership and never
  overlap their critical sections` (markers R-1776 and R-1777). Every worker and the observer ended by SIGKILL, and the
  lock and marker were left. That check arrived with mutation-runner-win-prune's third build (`79f6b0b9`); the lane
  tip's own tree does not hold it, and the lane changes no mutation runner file. The seat's scratch run at main
  d4423eff failed the same check in 11 of 12 runs (run 39357872086, seat-reported). An urgent fix lane,
  mutation-runner-win-lock, is building.
- The lane's four files read the same on all three legs, each with 0 fail and no skip: fresh-machine 8 pass,
  readme-rehearsal 8, install-check 115, pi-install-pin 8.
- The Windows leg prints each new check by title, and all seven passed there; none skipped:
  - `Windows checklist has eight ordered actions for Command Prompt at the declared versions, with no command in the
    user Path step` (R-1850)
  - `Windows last step runs cd /d to the clone, trust and doctor as commands and expects all good` (R-1851)
  - `every Windows checklist command names user-folder paths only as double-quoted %USERPROFILE% paths, and at least
    three exist` (R-1852)
  - `readme gate: win32 prints one readme checklist result line from cmd.exe runs in a second home, ending on the
    Windows checklist's last step` (R-1853)
  - `run on win32: each command step is one verbatim cmd.exe /d /v:off /s /c call from the rehearsal home with the
    joined commands in one pair of quotes` (R-1854)
  - `run on win32: one Path key in any letter case holds the home npm prefix folder, the home's bin folder and the
    caller's Path in that order, with only the npm prefix and clone redirect added` (R-1855)
  - `pin R-1542 R-1543 R-1544 R-1545 R-1853 R-1854 R-1855: the sealed README_REHEARSAL contract`

  The darwin checks, which now pass "darwin" explicitly, pass there too: R-1540's retitled `readme gate: darwin prints
  one readme checklist result line from /bin/zsh runs in a second home; linux runs neither rehearsal shell and prints
  none` and R-1546's `last step runs cd ~/nana-pi, trust and doctor as commands and expects all good`.
- The CI install-check jobs (not in the copied log, which holds the Windows suite job only): macOS printed 15 items,
  all PASS, ending `PASS readme checklist` 16.3 s after `PASS doctor`. Windows printed 16 items, all PASS, ending
  `PASS readme checklist` 21.0 s after `PASS doctor` (01:44:30.90 to 01:44:51.91 UTC). So the plan adversary's claim
  most likely wrong, that the Windows leg prints PASS readme checklist on its first run, held. That PASS needs every
  command step to exit 0 and step 8's output to hold `all good`. So on that runner cmd's quoting of a joined line with
  inner quotes, the git redirect to a drive-letter checkout, npm's Windows prefix layout, the `.cmd` launchers chained
  with `&&`, trust through the launcher and doctor's `all good` from the clone each worked. The plan feared step 2's
  2m06s cold pi install; the whole Windows rehearsal took 21 s, since the job's own pi install had already filled
  npm's cache (inferred).
- The builder's wrong-code tries (a pi gpt-5.6-sol builder through pi-worker, build 1, macOS). Per its report, which
  the seat did not re-run, each try turned its named test file red:

  | Row | Wrong code (build brief 1) | Red test file |
  |---|---|---|
  | R-1850 | swap steps 5 and 6; give step 5 a Run span | fresh-machine |
  | R-1851 | drop `/d` | fresh-machine |
  | R-1852 | unquote step 3's path; write step 3's target as `~\nana-pi` | fresh-machine |
  | R-1853 | platforms `["darwin"]`; read the darwin heading on win32; drop the platformName argument in install-check.mjs | install-check |
  | R-1854 | drop the outer quotes; drop windowsVerbatimArguments; use `/bin/zsh` | readme-rehearsal |
  | R-1855 | a new `PATH` key beside `Path`; `<prefix>\bin`; the bin folder after the caller's Path; join with path.delimiter | readme-rehearsal |

  All 15 tries were red before the code went back; every must-meet row has at least one.
- One existing-test change the brief did not name, for the reviewer: R-1079's win32 check now counts ComSpec launches
  whose arguments hold a quoted `"list"`, where it counted any argument text holding `list`. The brief said R-1079
  needed no change, since the bare `cmd.exe` rehearsal calls fall outside its filter. On a throwaway copy of the tip
  (`git archive`, outside the worktree) with the old filter put back, `install-check.test.mjs` still passes 115 of 115
  on macOS. The commit message gives no reason. The new filter is narrower but still pins exactly three pi launches.
- No wrong-code pairs from the seat and no independent check: an ordinary lane, so no findings to settle. The plan's
  known limits go to HANDOFF as carried lines: step 5 never runs, a CI runner is not a fresh machine, the rehearsal
  home has no space and sits on the temp drive, step 2's network install against the 300 s step cap, and no
  PowerShell or Linux checklist. The plan's out-of-scope wording ("not on PATH, as on Windows" in the adopt skills) is
  already a HANDOFF residual.
- The seat on 79b4c4ea (this notes commit changes no row and no code): `node scripts/requirements-trace.mjs` reads
  1,450 rows (1,165 implemented, 1 planned, 29 retired, 250 untested, 5 violated), `ears: 0 rows off form`; `npm run
  map:check` reads 326 modules, 0 problems; `npm run readme:check` reads 714 claims, 0 problems. R-1850 to R-1855 read
  `implemented`. Single-file runs on macOS: fresh-machine 8 pass, readme-rehearsal 8, install-check 115, pi-install-pin
  8, each 0 fail.
- Main has moved since the base: main is `d4423eff` (mutation-runner-win-prune, install-pins and review-records-pin
  landed). None of them touches the lane's READMEs, install-check files or three test files. Each changes
  REQUIREMENTS.md, the tree, the map, HANDOFF and the session archive. A merge of main and a confirmation round follow
  before the land.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main` on 79b4c4ea; R-1540's evidence title also
  changed, which the report does not list):

  ```
  tree movement 2389726..79b4c4e: 10 rows in 2 features
  FEAT-013 · Install and connect harness runtimes
    R-951 text changed
    R-1111 text changed
    R-1546 text changed
    R-1850 new (implemented)
    R-1851 new (implemented)
    R-1852 new (implemented)
  FEAT-015 · Diagnose the active environment
    R-1542 text changed
    R-1853 new (implemented)
    R-1854 new (implemented)
    R-1855 new (implemented)
  ```
