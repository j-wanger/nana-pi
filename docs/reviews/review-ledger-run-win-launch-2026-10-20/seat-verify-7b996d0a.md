# Seat checks — review-ledger-run-win-launch builds 1 and 2, tip 7b996d0a (2026-10-20)

- Builds, by a pi gpt-5.6-sol builder through pi-worker (two builds); the lane branched from main a112fd30, with the
  plan at 025682d9 (`must-meet.md`, `plan-attack.md`: one adversary, AMEND):
  - Build 1 is one commit, 406f3289 (`build-brief-1.md`). New `packages/nana-pack/bin/review-launch.mjs` exports
    `reviewLaunch(child, opts)`: off win32 an exact `pi` goes to `piLaunch` and any other word starts by name, as on
    main; on win32 a bare pi name in any letter case, alone or with .com, .exe, .bat or .cmd, goes to `piLaunch` (a
    refusal reads `pi launch refused: <reason>`), a word holding `\`, `/` or `:` is a path taken as given (.cmd and
    .bat through `winCommand`), and any other bare word goes through `findOnPath`, then `winCommand`, or is refused
    `not on PATH`. `bin/review-ledger.mjs` calls it in place of its `piLaunch` branch; a refusal now runs after
    admission through `cannotStart`, which releases the reservation, writes `cannot start <word>: <reason>` to --out
    as a best effort and dies with that line. The spawn sits in a try outside the Promise with
    `{...launch.options, cwd, stdio, env}`; a throw and the spawn's `error` event both call `cannotStart`. The new
    `tests/review-launch.test.mjs` holds R-2250 to R-2254; `tests/win32-launch.test.mjs`'s R-1723 check gains the
    --out condition and the marker `req: R-1723 R-2250`. The pack README names the cannot-start line, adds a Windows
    note and example, and rewrites the Windows paragraph's last sentence. Build 1 left R-2254 `untested` behind a
    `req-candidate` marker.
  - 6ec2cf0e merges main 0305bc8d into 406f3289. ee51e52c adds the seat's pairs on 6ec2cf0e.
  - CI run 39417461129 at 6ec2cf0e printed, on the Windows leg, `PASS Windows: review-ledger run starts an npm-style
    .cmd reviewer found on PATH with its arguments and stdin unchanged and records a round` (macOS 185 PASS, 0 FAIL,
    2 SKIP of 187 files; Ubuntu 184 PASS, 0 FAIL, 3 SKIP; Windows 170 PASS, 0 FAIL, 17 SKIP; install-check green on
    macOS and Windows). Build 2 (`build-brief-2.md`) is 3e90e4d7: R-2254's marker reads `// req: R-2254` and its row
    `implemented`; R-2255 (off win32, a bare reviewer name that PATH finds starts by name and records its LAND round)
    is new, with its check; the README's Windows example writes --out under a fresh `%TEMP%` folder. 82174094 adds
    the pairs on build 2. Per the builder's reports, it ran single-file checks only, as its briefs asked.
  - c2cb9e4e merges main 1207b69e; 9dc58d5e regenerates the code map's leaf total. 7b996d0a merges main 95870225 (the
    pack-config-utf16 land tip). Neither merge touched a file of the lane's code: main's changes from 0305bc8d to
    95870225 under `packages/nana-pack/bin` and `lib` are in nana-roster, adoption, config, gate-rm-inside, json-text
    and roster-set, none of which the resolver or review-ledger imports. After 7b996d0a, the seat's notes commit adds
    only this record, the independent check, the Windows log, the two review briefs, HANDOFF and the session entry.
- CI run 39423062782 on draft pull request #129 at 9dc58d5e (build 2 plus the seat's merge of main 1207b69e; GitHub's
  merge commit 67d66705 merges 9dc58d5e into its own ancestor 1207b69e, so the tree tested is 9dc58d5e's); all five
  jobs succeeded:
  - macOS `189 files: 187 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7955 pass, 0 fail, 30 skip`; review-launch
    `5 pass, 1 skip`. That log prints no check lines for a passing file; by the file's platform guards the skip is
    R-2254 and R-2255 passes.
  - Ubuntu `189 files: 186 PASS, 0 FAIL, 3 SKIP, 0 WARN · checks: 7894 pass, 0 fail, 49 skip`; review-launch
    `5 pass, 1 skip`, the same split.
  - Windows `189 files: 171 PASS, 0 FAIL, 18 SKIP, 0 WARN · checks: 6879 pass, 0 fail, 112 skip`
    (`ci-windows-9dc58d5e.log`). The 18 skipped files are main's declared set: 16 desk files, bench's study-tasks and
    checkout-converge (POSIX only). review-launch `5 pass, 1 skip`, with its check lines:
    ```
    PASS review-ledger run with an empty or a missing command exits 1 naming what it cannot start, with no stack trace, no reservation or round, and the reason in --out
    PASS on win32 PI, pi.cmd, Pi.Exe, pi.bat and pi.COM take pi's own npm launch with the arguments unchanged
    PASS on win32 a .cmd found on PATH and .bat or pi.cmd paths start through ComSpec, while pip.exe and an extensionless path start directly
    PASS on win32 a name not on PATH, a .py PATH finds and a .cmd argument with a line feed or % are refused, named
    PASS Windows: review-ledger run starts an npm-style .cmd reviewer found on PATH with its arguments and stdin unchanged and records a round
    SKIP off win32 review-ledger run starts a bare reviewer name found on PATH and records its LAND round — non-Windows only
    ```
    win32-launch `15 pass` (R-1722, and R-1723 with its new --out condition), review-ledger `163 pass, 2 skip`,
    install-check.test `129 pass`. R-2254 was the plan's claim most likely wrong (npm's cmd-shim text through
    winCommand's cmd.exe line from a folder with a space, handing node the `&` and parentheses argument and piped
    multi-line stdin unchanged); it passed on both runs.
  - install-check: macOS and Windows success.
  - None of main's known failures showed (Ubuntu's path spelling, fixed on main at ca27d86; a pull request run's R-291
    leaf-total merge artifact, which cannot arise here because GitHub's merge commit holds 9dc58d5e's tree).
  - CI has not run on 7b996d0a. Its merge of main 95870225 brought pack-config-utf16, green on all three legs on its
    own run; the land runs the locked suite on the reviewed tip, and the local macOS install check runs before the
    land.
- The seat's wrong-code pairs (`seat-mutate.mjs`, the shared mutation runner, macOS, Node 22.22.2, one shard, merge
  base 0305bc8d):
  - On 6ec2cf0e (`seat-mutate-output-6ec2cf0e.txt`, commit ee51e52c): 17 of 19 red, each exactly on its named
    titles; baselines review-launch 4 PASS, review-ledger 165 PASS. Survived: M1 (the win32 route on every platform)
    and M15. M1 was a real test gap: no macOS or Linux check ran review-ledger run with a bare non-pi name that PATH
    finds, so with the platform gate gone, `review-ledger run -- claude` would be refused there as `not on PATH`, and
    no check saw it. Build 2 added R-2255 for it.
  - On build 2, 3e90e4d7 (`seat-mutate-output-3e90e4d7.txt`, commit 82174094): 18 of 19 red (the runner's line: 17
    exactly their named titles, 1 with a named title green, 1 with an unnamed red); baselines review-launch 5 PASS,
    review-ledger 165 PASS. M1 is red through R-2255's check; the pair's named-title list predates R-2255, so it
    shows as an unnamed red. M15 (the spawn catch leaves the heartbeat running) is the declared equivalent:
    `cannotStart` ends in `die()`, which exits before the heartbeat interval can fire.
  - Red by their named titles: M2 and M3 (a win32 pi name in exact case only, or with no extension) and M5 (the pi
    branch in main's `piLaunch` form, without the injected probes) turn R-2251 red; M4 (any word starting with pi),
    M6 (ComSpec under its exact key only), M7 (a path recognised by a forward slash only), M8 (a path starting
    directly whatever its extension) and M9 (a path always through winCommand) turn R-2252 red; M10 (a bare word by
    name with no lookup) and M11 (a found file starting directly) turn R-2252 and R-2253 red; M12 (no match falling
    back to by-name) turns R-2253 red; M13 (no catch around the spawn), M14 (the catch dying without release or
    --out), M16 (cannotStart keeping the reservation), M17 (no --out write), M18 (an empty word printing as nothing)
    and M19 (the error event still ending as no verdict) turn R-2250 red.
  - Declared without a pair, before the run: (a) the Windows-only wrong code: spawn without `launch.options`
    (W10, which R-2254 should catch), review-ledger ignoring `reviewLaunch` (W11, R-2254 and R-1722), the resolver's
    `pi launch refused:` prefix dropped (the R-1723 R-2250 check), and the refusal as a die before admission or
    without release (the same check and R-2250 on Windows). On macOS the resolver never refuses and
    `launch.options` is always absent, so each would survive there. After the notes, the seat ran them on a
    scratch CI branch whose Windows job runs only this table (`seat-mutate-win.mjs`, `win-pairs.mjs`; run
    39429511056 on b696bfc8): 5 of 5 red, record `seat-mutate-win-output-b696bfc8.txt`. W10 (no launch.options) and
    W11b (main's form: pi through piLaunch, the rest by name) turn R-2254 red; W11 (every command by name) turns
    R-2254, R-1722 and R-1723 red; W12 (refusal prefix dropped) and W13 (refusal as a die before admission, no
    --out) turn R-1723 red. Refusal without release is M16 in the macOS table.
    (b) `findOnPath` not searching the launcher's own folder, unlike libuv, and the lookup running from the
    launcher's folder rather than --tree are plan known limits with no test and no pair.
  - The two merges of main after build 2 (1207b69e, 95870225) touched no file of the lane's code, so the seat did not
    re-run the pairs.
- Independent check (`independent-check-7b996d0a.md`, filed under this tip's name): it ran on 6ec2cf0e (build 1) in a
  private clone with a temp HOME for every probe. HOLDS, no MUST, over ten probes (P1 to P8, P5b and P10) and 13
  forced-win32 launch cases (W1 to W13).
  - Must-meet files on build 1: review-launch R-2250 to R-2253 PASS and R-2254 SKIP on macOS; review-ledger 165 PASS;
    win32-launch 5 PASS, 8 SKIP. map:check 0 problems, readme:check 722 claims and 0 problems, the trace 0 rows off
    form.
  - A file without the execute bit, a directory and a bad interpreter line each end `cannot start …` (EACCES, EACCES,
    ENOENT) with exit 1, the line in --out, and no reservation or round. A command that starts and exits 1 still
    reads `no verdict`, so a started command is not misreported. `pi` with no pi on PATH ends `cannot start pi:
    ENOENT`, where main printed only `no verdict`. A failed start uses no round, and the next run records round 1
    with the brief's 31 bytes unchanged. A tracked --out is still refused at admission, before any write, with the
    file's bytes unchanged. A missing --out folder skips the best-effort write without a crash.
  - Forced win32 with an npm folder holding a space, `Path` and `ComSpec` keys, the real PATHEXT and a quoted PATH
    entry: claude and codex resolve to their .cmd shims through cmd.exe; an argument with `& ( ) ^ < > |` is quoted
    and accepted; node starts directly; `Claude.CMD`, a full .cmd path and npx go through ComSpec; `Pi` with a
    multi-line quoted argument takes pi's npm entry byte-identically; a line feed and a trailing backslash are refused,
    named; `""` is refused `not on PATH`; `claude.ps1` is refused `unsupported extension .ps1`. No input threw.
  - Its findings and how each was settled:
    1. Known bug, low (the R-2253 trade): on win32 a bare name is refused when an earlier PATH folder holds the same
       name with another PATHEXT extension such as .js, .vbs or .py, where main's libuv lookup found a later .exe
       (W9). R-2253 allows it; the plan's known limits named only the .cmd-before-.exe case. Recorded as a HANDOFF
       residual.
    2. Known bug, low (docs): the README's Windows example wrote `--out out.md`, a relative path, into the reviewed
       tree, and admission warned (P10). Fixed by build 2, 3e90e4d7: the example now writes into a fresh `%TEMP%`
       folder.
    3. Unverified, not a finding: R-2254 could not run on macOS. Settled: the Windows leg passed it on 6ec2cf0e and
       again on 9dc58d5e, and build 2 flipped the row to implemented.
    4. Inferred, not probed: a reviewer installed only as a Windows Store app alias may go unfound, because
       `findOnPath` checks files with lstat. Recorded as a HANDOFF residual marked inferred.
  - Its EMFILE probe (a low open-file limit) did not force the error, so that path was not tested.
- Seat observation, not probed: a first command word holding a path inside literal quote marks (for example a quoted
  .cmd path) is taken as a direct path, because its extension then ends in the quote, so it skips cmd.exe. A quoted
  bare name holds no path character and is refused `not on PATH` (read in the code). The plan's known limits do not
  cover it: a HANDOFF residual marked inferred.
- The plan's other known limits, each now a HANDOFF residual naming this lane: pi typed by its path is taken as given
  (the review-ledger-run-reviewer launcher line, rewritten to keep only that); pi typed with an extension starts the
  first pi found; PATH-folder order lets an earlier .cmd beat a later .exe; a program in the reviewed tree's own folder
  no longer starts (inferred); the lookup runs from the launcher's folder (the existing line now covers every bare
  name); a refused or failed start prints the admission note first and keeps the over-cap audit line; a .cmd line
  over 8191 characters ends as no verdict; `claude -p` reading stdin is inferred; only the Windows leg proves the
  Windows wiring; its five Windows wrong-code pairs ran there, all red.
- HANDOFF: one Landed line. The roster line no longer says an npm-installed claude does not start on Windows. Two
  review-ledger-run-reviewer lines go, because the lane fixes them: a refused pi launch wrote nothing to the output
  file, and the refused-launch check did not assert the output file. The refusal now writes its cannot-start line
  there, and the R-1723 check reads it. Ten new residuals name this lane. The seat items from other lanes add two
  pack-config-utf16 final-review lines (the unparseable shapes pinned only through the objective producer; no check
  on the set command's backup bytes).
- Land reviewer: pi gpt-6-astra reviews the land through pi-review, so the seat writes no `seat-land.md`.
- Rows: R-2250 to R-2255 read `implemented` in REQUIREMENTS.md; R-2254's evidence says Windows-leg-only. At the notes
  commit (no code or row changed since 7b996d0a): `node scripts/requirements-trace.mjs` reads `requirements: 1625
  total (1388 implemented · 1 planned · 37 retired · 193 untested · 6 violated); 1388 traced by tests` and `ears: 0
  rows off form (allowance 0)`; `npm run map:check` reads 355 modules, 0 problems; `npm run readme:check` reads 724
  claims, 0 problems.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, merge base 95870225, run at 7b996d0a):
  ```
  tree movement 9587022..7b996d0: 6 rows in 1 features
  FEAT-007 · Review a specific revision independently
    R-2250 new (implemented)
    R-2251 new (implemented)
    R-2252 new (implemented)
    R-2253 new (implemented)
    R-2254 new (implemented)
    R-2255 new (implemented)
  ```
  CAP-02 moves from 184 to 190 rows, FEAT-007 from 125 to 131 and SUB-008 from 38 to 44. No existing row's text
  changed; R-1723's check gains a condition and names R-2250 in its marker.
- Not in this record: a seat-run locked full suite (CI's three legs ran the whole suite at 9dc58d5e), the Windows
  pairs, and the local macOS install check, which runs before the land.
- Main moved under this lane: CI ran on 9dc58d5e (build 2 plus main 1207b69e); the seat then merged main 95870225 at
  7b996d0a. Main is still 95870225, the merge base and the review base.
