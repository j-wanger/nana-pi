# Seat checks — install-check-turn-edit-powershell build 1, tip c21273a8 (2026-10-20)

- Build, by a pi gpt-5.6-sol builder through pi-worker (`build-brief-1.md`): one commit c21273a8 on the plan commit
  8c751009, based on main cdf4b098. It adds rows R-2000 to R-2004; `PI_TURN_EDIT` and `PI_TURN_POWERSHELL` in
  `install-check-config.mjs`; in `install-check.mjs` the post-edit merge into the temporary home's `nana-pack.json`,
  the win32 tool list, `judgePiPostEdit`, `judgePiPowerShell` and the `pi post-edit` and `pi powershell gate` lines;
  the fixture's write call and its PowerShell call (only when that tool is active) in `install-check-turn.mjs`; the
  setup README's install-check paragraph; five checks and a pin in `install-check.test.mjs`; the regenerated code map
  and tree. The seat's notes commit adds only this record, the two CI install-check logs, the review brief, HANDOFF and
  the session entry. No code or test changed after c21273a8.
- CI run 39377875753 on draft pull request #106 at c21273a8 (GitHub's merge commit 6ef519b8 merges c21273a8 into its
  own ancestor cdf4b098, so the tree tested is c21273a8's):
  - macOS `174 files: 172 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7788 pass, 0 fail, 27 skip`.
  - Ubuntu `174 files: 172 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7733 pass, 0 fail, 45 skip`.
  - Windows `174 files: 157 PASS, 0 FAIL, 17 SKIP, 0 WARN · checks: 6724 pass, 0 fail, 103 skip`. The 17 skipped
    files are main's declared set.
  - The lane's file, `install-check.test.mjs`, passes 121 on every leg (115 checks on main, six new).
    `fresh-machine` and `readme-rehearsal` pass 8 each on every leg. On Windows each new check prints PASS by title,
    so R-2000's check ran the composed post-edit command through real cmd.exe with `"%NANA_PI_FILE%"`:
    ```
    PASS pi post-edit config: before the turn, the installed nana-pack.json keeps its other keys and holds one post-edit command that matches only the fixture file and, run as nana-post-edit runs it, makes the running node print the file and exit with the sealed code
    PASS pi post-edit config: a missing, unparseable or non-object installed nana-pack.json is left as install left it
    PASS pi post-edit: one line per run, PASS only when a write result not marked as an error holds a check line with the sealed exit text and the run token
    PASS pi turn tools: on win32 the sealed tool list naming powershell comes before the sealed turn arguments, and linux and darwin carry no tool list
    PASS pi powershell gate: win32 prints one line, PASS only when an errored powershell result starts with the gate block text, and linux and darwin print none
    PASS pin R-2000 to R-2004: the post-edit item, tool, fixture file, match, placeholder, failure lead, check source and exit code, and the PowerShell item, tool, platforms and tool list
    ```
  - None of main's known failures showed: Ubuntu's path-spelling GP1 and GP2 were fixed on main at ca27d86, Windows
    main reads 0 FAIL since 4be0b79, and no R-291 merge artifact arises, since GitHub's merge commit holds c21273a8's
    tree.
- Both CI install-check jobs succeed (`ci-install-check-windows-c21273a8.log`, `ci-install-check-macos-c21273a8.log`):
  - Windows prints 18 items, all PASS: install, pi-subagents, pi list nana-pack, pi list nana-knowledge, pi session,
    pi turn, pi post-edit, pi powershell gate, hook set, hook roster notice, hook shared memory, hook knowledge pull,
    hook verifier pipe (PowerShell), hook verifier pipe (Bash), hook adoption, hook objective, doctor, readme
    checklist. pi there is the npm `pi.cmd` shim.
  - macOS prints 16 items, all PASS: the same without pi powershell gate and hook verifier pipe (PowerShell). The
    PowerShell line is Windows-only by design (R-2004).
  - This is the first real pi turn that ran nana-post-edit on any platform, and the first that ran pi's powershell
    tool under nana-gate. The `pi turn` line follows the `pi session` line by 0.73 s on macOS and 1.78 s on Windows,
    inside the sealed 60 s turn timeout; `pi post-edit` and `pi powershell gate` print within 5 ms after it.
  - So the plan adversary's claim most likely wrong held: pi 1.0.2 on native Windows enables the powershell tool from
    `--tools` passed through the npm `pi.cmd` shim, the fixture saw it among the active tools, and the errored result
    starts with the gate's block text. The plan's known limit that the Windows live write, the tool list through the
    shim and the gate on powershell stay inferred until CI's Windows install-check leg runs is settled by this run.
- The seat's local macOS install check on c21273a8, before review (the seat's helper ran `env -u NANA_WORKTREE_ROOT
  node packages/nana-setup/bin/install-check.mjs` from the lane worktree; Node 22.22.2, pi 1.0.2): 16 items, all PASS,
  `PASS pi turn` and `PASS pi post-edit` included, exit 0 in 22 s. It left the worktree unchanged.
- The builder's report, as relayed to the seat (the seat did not re-run the tries): each new check turned red on wrong
  code: dropping the placeholder (R-2000), an unconditional config write (R-2001), accepting a missing token (R-2002),
  omitting the Windows tool list (R-2003), accepting a non-error PowerShell result (R-2004). The relay names one try
  per row; the brief listed more (for R-2000 the match `.*`, `{postEdit}` alone and a source that exits 0; for R-2002 a
  write result marked as an error and one that says `exited 1`; for R-2003 the tool list on every platform; for R-2004
  the line on linux or darwin). The final reviewer judges whether any listed try would survive.
- The builder ran the full suite (174 files, 172 PASS, 0 FAIL, by its report), though the brief allowed single files.
  Recorded; no action.
- No wrong-code pairs from the seat and no independent check: an ordinary lane, so no findings to settle.
- Lane class: ordinary, as the plan and its adversary decided. The lane changes only the install check and its
  test-only fixture extension, which loads through `-e` and sits in no pi package manifest (R-1796). It changes no
  install, uninstall or doctor code, no Claude Code hook, no shipped extension, no gate policy and no land or review
  tool. Precedent: pi-seat-live-turn, whose must-meet says "Class: ordinary" for the same fixture. The lane touches
  packages/nana-setup, so the owner's 2026-10-12 rule applies: the seat's local macOS install check ran before review
  (above), and CI's Windows install-check leg passed on the reviewed tip, c21273a8.
- The plan's known limits:
  - Settled by CI: the Windows live write, the tool list through the shim and the gate on powershell (above).
  - Edited HANDOFF residuals: pi-seat-live-turn's line that the turn runs only the bash tool now says the PowerShell
    tool runs on Windows since this lane and the approval dialog stays unchecked; the line that the unit tests stub pi
    now names the turn's write and PowerShell calls; the line on a gate that fails to block now names the PowerShell
    sample.
  - New HANDOFF residuals, one line each: on Windows the tool list replaces pi's selection, so pi-subagents' and MCP
    tools are off in that turn; the PowerShell gate line runs on Windows only, though macOS pi also accepts the tool;
    post-edit's silent pass, timeout, could-not-run and lock paths stay unchecked; a run under pi-worker's lane write
    boundary (`NANA_WORKTREE_ROOT`) fails `pi post-edit`; a Node path holding `"`, `$` or a backtick breaks the command
    on macOS or Linux; R-1072's "writes only" check title understates the new config edit; a rewording of post-edit's
    failure line fails `pi post-edit` loudly.
  - Already on HANDOFF: Linux runs no install check.
- Rows: R-2000 to R-2004 read `implemented` in REQUIREMENTS.md, in FEAT-015 directly after R-1796. The seat helper's
  re-run at the notes commit: `node scripts/requirements-trace.mjs` reads `1517 total (1251 implemented · 1 planned ·
  34 retired · 226 untested · 5 violated)` and `ears: 0 rows off form (allowance 0)`; `npm run map:check` reads 333
  modules, 0 problems; `npm run readme:check` reads 715 claims, 0 problems; `node scripts/requirements-tree.mjs
  --check` exits 0.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, against the merge base cdf4b098):
  ```
  tree movement cdf4b09..c21273a: 5 rows in 1 features
  FEAT-015 · Diagnose the active environment
    R-2000 new (implemented)
    R-2001 new (implemented)
    R-2002 new (implemented)
    R-2003 new (implemented)
    R-2004 new (implemented)
  ```
  CAP-04 moves from 416 to 421 rows and FEAT-015 from 96 to 101. No existing row changed.
- Not in this record: a seat-run locked full suite (CI's three legs ran the whole suite).
- Main was cdf4b098 when the lane branched, its merge base. Main has since moved to 8466795b (the doctor-fix-line
  land). That land changes doctor, its new test, REQUIREMENTS.md (FEAT-015, after R-1766), the tree, the code map, the
  setup README's doctor paragraph and tests table, HANDOFF and the session archive, none of the lane's install-check
  files. So the land needs a merge of main and a confirmation round on the merged tip, and the macOS install check
  runs again on the landing tip.
