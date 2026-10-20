# Seat checks — install-check-review-launch build 1, tip 2c5c747c (2026-10-20)

- Build, by a pi gpt-5.6-sol builder through pi-worker (`build-brief-1.md`): one commit b234816e on the plan commit
  d9117b91, which sits on main 20debe02 (the install-check-turn-edit-powershell land). 2c5c747c then merges main
  385c633f (the hook-deadlines land); its one conflict was the generated tree, which now lists R-2010 to R-2015 and
  R-2070 to R-2076 under CAP-04 (450 rows) and passes `node scripts/requirements-tree.mjs --check`. The build adds rows
  R-2070 to R-2076; `PI_REVIEW` and `SPAWN_TIMEOUT_MS.review` (180000) in `install-check-config.mjs`; the faux fixture
  `install-check-review.mjs`; in `install-check.mjs` the review repository, the per-run launch, `judgePiReview` and the
  `pi-review` lines; the setup README's Install check section; seven checks and a pin in `install-check.test.mjs`; the
  regenerated code map and tree. The seat's notes commit adds only this record, the two CI install-check logs, the
  review brief, HANDOFF and the session entry. No code or test changed after 2c5c747c.
- CI run 39385972281 on draft pull request #111 at 2c5c747c (GitHub's merge commit c55616c9 merges 2c5c747c into its
  own ancestor 385c633f, so the tree tested is 2c5c747c's):
  - macOS `177 files: 175 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7847 pass, 0 fail, 27 skip`.
  - Ubuntu `177 files: 174 PASS, 0 FAIL, 3 SKIP, 0 WARN · checks: 7786 pass, 0 fail, 45 skip`. The third skip is
    main's `checkout-spelling.test.mjs` on a case-sensitive volume.
  - Windows `177 files: 160 PASS, 0 FAIL, 17 SKIP, 0 WARN · checks: 6782 pass, 0 fail, 104 skip`. The 17 skipped files
    are main's declared set.
  - The lane's file, `install-check.test.mjs`, passes 129 on every leg (121 checks on main, eight new). On Windows each
    new check prints PASS by title, R-2072's cmd and Git Bash launch check and R-2075's cmd-record-cannot-pass-sh case
    included.
  - None of main's known failures showed: Ubuntu's path-spelling GP1 and GP2 were fixed on main at ca27d86, Windows
    main reads 0 FAIL since 4be0b79, and no R-291 merge artifact arises, since GitHub's merge commit holds 2c5c747c's
    tree.
- Both CI install-check jobs succeed (`ci-install-check-windows-2c5c747c.log`, `ci-install-check-macos-2c5c747c.log`):
  - Windows prints 20 items, all PASS, with `PASS pi-review (cmd)` and `PASS pi-review (sh)` after `PASS pi powershell
    gate`. pi there is the npm `C:\npm\prefix\pi.cmd` shim. The cmd line follows the gate line by 2.14 s, review
    repository setup included; the sh line follows the cmd line by 1.88 s.
  - macOS prints 17 items, all PASS, with `PASS pi-review` 1.54 s after `PASS pi post-edit`.
  - This is the first real pi review through the installed pi-review launcher on Windows, through both the `.cmd`
    launcher under cmd and the Git Bash launcher named bare. It ran offline, with the faux fixture provider; no real
    model has reviewed through either launcher. So the plan adversary's claim most likely wrong held: pi-review started
    through those two launchers on the runner starts real pi through pi-watchdog's npm-entry form, exits 0 and ends its
    output with `VERDICT: LAND`, with one LAND round for its item in the temporary home's tally.
- The seat ran the local macOS install check on the lane before review (`env -u NANA_WORKTREE_ROOT node
  packages/nana-setup/bin/install-check.mjs`, from the lane worktree). Its line output was not relayed to this record.
- The builder's report, as relayed to the seat (the seat did not re-run the tries): each new check turned red on wrong
  code: no signing option fails R-2070's repository check; a bare name fails R-2071's POSIX launch check; the cmd form
  alone fails R-2072's Windows launch check; accepting exit 1 fails R-2073's lines check; two round lines fail R-2074's
  ledger check; a stale record fails R-2075's record check; a pack extension path fails R-2076's fixture check. The
  relay names one try per row; the brief listed more (for R-2070 no identity options and a repository inside the
  fixture project; for R-2071 the checkout's pi-review.mjs, the link's real path, the fixture project as cwd and an
  output inside the review repository; for R-2072 the sh launcher by full path and the `.cmd` without cmd; for R-2073 a
  `VERDICT: SEND-BACK` ending and the first non-blank line; for R-2074 a null verdict and another item's line; for
  R-2075 a record without the standard or the role). The final reviewer judges whether any listed try would survive.
- One existing check changed, as the brief allowed: R-1072's `checklist: the check writes only the objective lines and
  one MEMORY.md line, and puts the bin folder first on PATH` now expects the review repository's fixture file, each
  review output, the fixture record and the tally among the written files. It also counts the install stub's
  `.local/bin/pi-review` launchers as install's. Its title still says the check writes only the objective lines and one
  MEMORY.md line. The shared harness now gives win32 runs a Git `cmd` folder on Path and accepts the home's
  `pi-review.cmd`, git.exe and bash.exe.
- The builder ran the full suite, though the brief said single files only; the builder preamble asks for a green full
  suite before the last commit, so the two disagree. Recorded; no action.
- No wrong-code pairs from the seat and no independent check: an ordinary lane, so no findings to settle.
- Lane class: ordinary, as the plan and its adversary decided. The lane changes only the install check: its library,
  config, a test-only `-e` fixture that sits in no pi package manifest (R-2076), its test file and the setup README's
  Install check section. It runs pi-review and the installed launchers but changes no review tool, no install,
  uninstall or doctor code, no Claude Code hook, no shipped extension and no gate policy. Precedent: pi-seat-live-turn
  and install-check-turn-edit-powershell. The lane touches packages/nana-setup, so the owner's 2026-10-12 rule applies:
  the seat ran the local macOS install check before review (above), and CI's Windows install-check leg passed on the
  reviewed tip, 2c5c747c.
- The plan's known limits:
  - Settled by CI: the Windows launch through both installed launchers (above).
  - Edited HANDOFF residuals: the Roster line no longer says no real pi has run a review on Windows; it says a real pi
    now runs an offline review through both Windows launchers in CI, and no real model has. The older checklist-title
    line now also names the review files the check lists.
  - New HANDOFF residuals, one line each: the faux fixture proves the launch, the standard's arrival, the verdict read
    and the tally write, not a real model's review; one attempt only, so the watchdog's retry and stall paths stay
    unexercised and a hung run fails after about 90 s; on Windows the check's timeout ends cmd or bash, not pi-review
    under it; PowerShell's `.cmd` launch and pi-worker's launch stay unchecked; the unit tests stub pi-review, so only
    real install check runs prove it; the check's tally path is its own copy of review-round's, so a ledger move fails
    the line until the copy moves.
  - Covered elsewhere, no residual: the check does not prove which pi-review comes first on PATH; doctor's R-953 and
    R-1616 rows do, in the same run, and the check's doctor line fails on their ✗ or an unlisted note.
  - Already on HANDOFF: Linux runs no install check.
- Rows: R-2070 to R-2076 read `implemented` in REQUIREMENTS.md, in FEAT-015 directly after R-2004. The seat helper's
  re-run at the notes commit: `node scripts/requirements-trace.mjs` reads `1550 total (1284 implemented · 1 planned ·
  34 retired · 226 untested · 5 violated)` and `ears: 0 rows off form (allowance 0)`; `npm run map:check` reads 337
  modules, 0 problems; `npm run readme:check` reads 718 claims, 0 problems; `node scripts/requirements-tree.mjs
  --check` exits 0.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, against the merge base 385c633f):
  ```
  tree movement 385c633..2c5c747: 7 rows in 1 features
  FEAT-015 · Diagnose the active environment
    R-2070 new (implemented)
    R-2071 new (implemented)
    R-2072 new (implemented)
    R-2073 new (implemented)
    R-2074 new (implemented)
    R-2075 new (implemented)
    R-2076 new (implemented)
  ```
  CAP-04 moves from 443 to 450 rows and FEAT-015 from 113 to 120. No existing row changed.
- Not in this record: a seat-run locked full suite (CI's three legs ran the whole suite).
- Main is 385c633f, the merge base, so the land needs no further merge while main stays there.
