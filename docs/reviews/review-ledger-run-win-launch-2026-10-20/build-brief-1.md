# Build brief 1: review-ledger-run-win-launch (Feature: FEAT-007 · Review a specific revision independently)

Work in ~/nana-pi-wt/review-ledger-run-win-launch on feat/review-ledger-run-win-launch. Follow packages/nana-pack/prompts/builder-preamble.md. Run single test files only. Never edit HANDOFF.md or docs/sessions/. Class: install, hook or gate. Threat model: honest spellings, typos and npm shims are in scope; forgery is out. The plan is must-meet.md in this folder.

## Change
1. New `packages/nana-pack/bin/review-launch.mjs` with the six-tag header. It exports `reviewLaunch(child, opts)`, where opts is {platform, env, cwd, exists, isFile, readText, execPath}. They default to the process values and pass through to piLaunch. Route exactly as must-meet's Design says. Import PI_BIN_NAME and PI_EXTENSIONS; write no other new literal except the reason text.
2. `bin/review-ledger.mjs`:
   - Replace the piLaunch branch with `reviewLaunch(child)`.
   - After admit and before startHeartbeat, a refusal calls cannotStart(reason). cannotStart does release(adm.id), then a best-effort write of `cannot start <word>: <reason>\n` to adm.res.out (an empty word prints as `""`), then die(that line).
   - Spawn outside the Promise, in a try, with {...launch.options, cwd, stdio, env}. A throw calls stopHeartbeat(), then cannotStart(e.code ?? e.message).
   - After the await, `r.error` calls cannotStart(r.error.code ?? r.error.message).
   - Update the header's @inputs, @effects and @errors.
3. New `packages/nana-pack/tests/review-launch.test.mjs` with the six-tag header. Import the module dynamically in a try, so a missing export fails each title, not the whole file. Use a temp HOME and USERPROFILE, a temp git repo for --tree, and the inherited PATH.
   - R-2250, all legs, two runs: `-- ""` and `-- nana-absent-reviewer-xyz -p x`. For each, assert:
     - exit 1;
     - stderr matches /^review-ledger: cannot start \S+: \S/m and has no /^\s+at /m line;
     - --out starts with the `cannot start …` text that stderr carries;
     - review-ledger.reservations is empty, and no kind:"round" row exists.
   - R-2251 to R-2253, all legs, forced platform 'win32' over a Map volume:
     - Files: an npm pi.cmd plus package.json plus entry under C:\npm, C:\npm\claude.cmd, C:\tools\pip.exe, C:\tools\tool.py.
     - PATH `C:\npm;C:\tools`; PATHEXT `.COM;.EXE;.BAT;.CMD;.PY`; ComSpec set.
     - R-2251: PI, pi.cmd, Pi.Exe, pi.bat and pi.COM each give command = execPath and args = [entry, ...args], with a line-feed argument included. Compare command and args only.
     - R-2252: `claude -p hi` gives command = the ComSpec, args `["/d","/v:off","/s","/c",'""C:\npm\claude.cmd" "-p" "hi""']`, and windowsVerbatimArguments true. `C:\s p\stub.bat` and `C:\npm\pi.cmd` give the same shape. pip gives C:\tools\pip.exe, with a line-feed argument unchanged. `C:\tools\codex` is taken as given.
     - R-2253: nothere gives `not on PATH`. tool names `.py`. claude with "a\nb" names the line feed, and with "100%" names the %.
   - R-2254, Windows only; print SKIP elsewhere, because .cmd shims and cmd.exe exist only on Windows.
     - Folder `<temp>\shim dir` holds stub-reviewer.cmd with npm's cmd-shim text. Copy win32-launch.test.mjs CMD_SHIM and retarget it to `%dp0%\node_modules\stub-reviewer\cli.js`.
     - cli.js reads all of stdin, appends {argv, stdin} to a record file and prints `VERDICT: LAND`.
     - PATH is the shim dir, then the original PATH. Run `-- stub-reviewer -p "review this & that (now)" --model m-1` with input "line one\nline two\n" and a 60 s timeout.
     - Assert exit 0, one record with the exact argv and stdin, and one round.
   - Markers: `// req: R-2250` to `// req: R-2253`, each directly above a one-line `check("…", …`. R-2254 uses `// req-candidate: R-2254 (Windows only; becomes req: when the Windows CI leg passes it)`. Put no `"` in titles.
4. win32-launch.test.mjs: add one condition to the R-1723 check: the --out text starts with `cannot start pi: pi launch refused:`. Change its marker to `// req: R-1723 R-2250`.
5. REQUIREMENTS.md: add R-2250 to R-2254 after R-1723, with must-meet's text. R-2250 to R-2253 are implemented, citing their tests. R-2254 is untested, with evidence `written; Windows-leg-only`.
6. packages/nana-pack/README.md:
   - The run paragraph (~185) names the cannot-start line.
   - Add the Windows stdin note under the example (~189).
   - Replace the last sentence of the Windows paragraph (~275) as must-meet says.
   - Add tests/review-launch.test.mjs to the Tests line (~342). Use no machine paths.
7. Run `npm run req:tree`, then `npm run map`.

## Wrong code to try (each must turn the named test red; restore after)
macOS:
- W1: no try around spawn (R-2250).
- W2: the catch skips release (R-2250).
- W3: cannotStart writes no --out (R-2250).
- W4: the error event still ends as `no verdict` (R-2250, missing command).
- W5: a pi name is exact `pi` only (R-2251).
- W6: a pi name is startsWith('pi') (R-2252, through pip).
- W7: a bare word starts by name, with no lookup (R-2252).
- W8: a .cmd starts directly, skipping winCommand (R-2252 and R-2253).
- W9: not-on-PATH falls back to starting by name (R-2253).
Windows (the seat runs these): W10, spawn without launch.options; W11, review-ledger ignores reviewLaunch. Both should turn R-2254 red. Name both in the report.

## Done
- review-launch, review-ledger, win32-launch, win-command, path-spelling and review-timeline each pass on macOS, with R-2254 printing SKIP.
- W1 to W9 each turned red.
- `npm run map:check`, `npm run readme:check` and `node scripts/requirements-trace.mjs` exit 0, with 0 rows off form.
- One commit with explicit paths.

## Report (at most 10 lines)
VERDICT; commit; per-file PASS/FAIL/SKIP counts; W1 to W9 red or survived; the trace's last two lines; the files changed; anything that deviated from this brief.