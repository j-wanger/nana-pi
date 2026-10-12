# Lane install-check — build brief 2b (2026-10-12 · feat/install-check · worktree ~/nana-pi-wt/install-check)

**Builder: pi gpt-6-luna.** Fresh session, THREE items. Finish all three; nothing else. Contract: `CHANGE.md`.

## Why
Session 2a (`eae45f0`) added a reason to every FAIL and XFAIL line. Build 1 put the whole step sequence in `bin/install-check.mjs`, where no pure test can reach it, and wrote
7 tests against roughly 50 cases in CHANGE §5. Rows R-1070, R-1071 (environment on every child), R-1084
are not pinned. This session makes the runner testable and pins the environment and reporting cases.

## Item 1 — the runner moves into `lib/install-check.mjs` (R-1084)
- Export one `runInstallCheck({ root, home, platformName, env, spawn, now, out })` that performs CHANGE §3's
  steps in order and returns `{ lines, exitCode }`. `bin/install-check.mjs` keeps only: make the temporary
  home, pass the real spawn, `new Date`, and `console.log`, print, set the exit code, retain or remove the home.
- EVERY child goes through the injected `spawn`: both fixture `git init` runs, Git Bash discovery, install,
  `pi install npm:…`, `pi list`, the pi session, each hook (hit and miss) and doctor. No other
  `child_process` import in `lib/install-check.mjs`.
- The injected `spawn` is ASYNC (returns a promise of `{ status, signal, stdout, stderr, error, ms }`), so
  brief 2c can run the three SessionStart entries at the same time (CHANGE §5, Dispatch). `bin` adapts
  `child_process.spawn` to it, with the timeout, `input`, `windowsHide` and the 10,000-character cap.
- Behaviour on this Mac is unchanged: the acceptance script still passes 30/30.
- **Fix the Windows `pi session` FAIL (R-1079) while moving that step.** Seat triage of CI run 38285940748
  (`no-output: journal has no directory_unadopted for D:\a\_temp\…\project`): the check searches the
  journal's RAW TEXT for the project path, but each journal line is JSON, which writes every backslash twice,
  so a Windows path can never match. Parse each journal line as JSON (skip lines that do not parse) and pass
  only when a line has `event === "directory_unadopted"` and a `cwd` equal to the project under one path
  comparison: `realpath`, then `path.resolve`, lower-cased on win32 (share it with `parsePiList`'s). Wrong code
  first: a test with a win32 journal line (JSON-escaped `D:\\a\\…\\project`) must fail on today's raw search,
  and a line for another folder or another event must still fail. Push, and confirm the Windows line turns
  PASS on the draft PR's CI run; if it does not, report its new reason verbatim — do not chase it further.

## Item 2 — environment, install line, platform and pi launch cases (R-1071, R-1084, R-1079)
In `tests/install-check.test.mjs`, each with `// req:` above it, wrong code first, through `runInstallCheck`
with a RECORDING spawn and a fake file layer or temp folder:
- the override list and every caller `npm_config_*` variable are removed, without case on win32 (`Npm_Config_Cache`);
- HOME, USERPROFILE, TMPDIR, TEMP, TMP and `npm_config_cache` are set to the temporary home's paths;
- the recording spawn shows that SAME sanitized environment on every child listed in item 1 (the case
  enumerates the children by name and fails if one is missing or differs);
- install's command line carries no override flag (no `--home`, no `--platform`);
- `NANA_SETUP_PLATFORM=win32` in the caller changes nothing on darwin (platform comes from the argument);
- on win32, `pi list`, `pi install npm:` and the session go through `findPi` and `winCommand` (the recorded
  command is the ComSpec line for a `.cmd` pi).

## Item 3 — reporting cases and the two pins (R-1070, R-1080)
- any FAIL gives a non-zero exit; a run with only PASS lines exits 0;
- a listed item failing with its sealed code before its expiry prints XFAIL;
- a listed item failing with a DIFFERENT code prints FAIL (wrong-code case);
- a listed item failing on or after its expiry prints FAIL (expired case, injected `now`);
- a listed item that passes prints FAIL;
- the first lines name the resolved Git Bash (win32 only), pi and node paths;
- pins, one test each naming its row: the override list (R-1071); the known-red list with each entry's
  code, owner and expiry (R-1070, R-1080).

## Rules
Brief 2a's rules hold. **Do not report DONE until these pass on your last commit:** `npm run req:tree`,
`npm run map:check`, `npm run readme:check`, `npm run test:locked` (0 failed), and the acceptance script
(exit 0; commit `acceptance-output.txt`). Flip a row to `implemented` only when a cited test pins every clause.

## Report
≤ 30 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; each row touched and the clause its
cited test pins; the `test:locked` summary line and total checks; the LAST TWO LINES of
`acceptance-output.txt` verbatim; the CI run ID and the Windows `pi session` line verbatim; the one claim
most likely wrong.
