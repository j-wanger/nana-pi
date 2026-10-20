# Build brief 1 · readme-windows-checklist

Feature: FEAT-015 · Diagnose the active environment. Class: ordinary. Builder: pi-worker (Windows quoting and Path handling).
Worktree: ~/nana-pi-wt/readme-windows-checklist on feat/readme-windows-checklist, cut from main only after pi-seat-live-turn lands.
Read must-meet.md in this folder first. Follow packages/nana-pack/prompts/builder-preamble.md. Run single test files only. Never edit HANDOFF.md or docs/sessions/.

## Change
1. REQUIREMENTS.md: add R-1850 to R-1852 after R-1546 (FEAT-013 SUB-011) and R-1853 to R-1855 after R-1545 (FEAT-015), worded exactly as must-meet.md, as untested. Flip each to implemented when its test passes. Apply the R-951, R-1111, R-1542 and R-1546 wording and R-1540's new evidence title. Run `npm run req:tree`.
2. Tests first. Each `// req: R-nnnn` line sits directly above a one-line `check("title", …` call, titles as must-meet.md.
   - fresh-machine.test.mjs, R-1850 to R-1852: read the real README through `parseChecklist(readme, "win32")` and `rehearsalPlan`. Take floors from DESK_NODE_FLOOR, CI's PI_VERSION and PI_SUBAGENTS_FLOOR. Build the bin text as `%USERPROFILE%\` plus `resolveLayout({home}).binDir` relative to home, with backslashes. Take objective basenames from the layout. R-1852 fails on any `~` or `$HOME` in a command, on any `%USERPROFILE%` not inside a double-quoted path, and on fewer than three such paths.
   - readme-rehearsal.test.mjs, R-1854 and R-1855: fixture roots carry the win32 heading. R-1855 loops the caller's key over "Path" and "PATH". It asserts exactly one key whose lowercase is "path", valued `${prefix};${binDir};C:\caller` with a literal ";". The rest of the env equals the caller's minus ZDOTDIR, plus only npm_config_prefix, the three GIT_CONFIG_* keys and GIT_ALLOW_PROTOCOL.
   - install-check.test.mjs, R-1853: `recordingRun({platformName:"win32"})`. The stub answers `README_REHEARSAL.shell.win32` calls whose cwd is the readme home with "\n  all good.\n".
3. install-check-config.mjs README_REHEARSAL: the maps and new keys from must-meet.md, a provenance comment on each new or changed value.
4. readme-rehearsal.mjs: the design in must-meet.md; update the header's @purpose and @inputs.
5. install-check.mjs: pass platformName to runReadmeRehearsal. Change nothing else there.
6. README.md: the Windows section; Prerequisites links both lists; narrow "(untested there)".
7. packages/nana-setup/README.md, Install check: the rehearsal paragraph covers macOS and Windows, the cmd shape, the prefix layout and the step-5 stand-in. Linux prints no readme checklist line.
8. Run `npm run map`; confirm map:check and readme:check are green.

## Existing tests: mechanical updates only, same strength
- readme-rehearsal.test.mjs: the R-1541, R-1542 and R-1545 calls pass "darwin" and read `.darwin` fields. The pin deepEquals the new object under its new title.
- fresh-machine.test.mjs: the R-1546 call passes "darwin".
- install-check.test.mjs: R-1540 loops darwin and linux and uses `shell.darwin`. Its title becomes "readme gate: darwin prints one readme checklist result line from /bin/zsh runs in a second home; linux runs neither rehearsal shell and prints none". R-1079 still counts 3 ComSpec pi launches; the bare "cmd.exe" rehearsal calls fall outside its filter.

## Wrong code to try (each must turn its named test red)
- R-1850: swap steps 5 and 6. Separately, give step 5 a Run span.
- R-1851: drop `/d`.
- R-1852: unquote step 3's path. Separately, write step 3's target as `~\nana-pi`.
- R-1853: platforms ["darwin"]. Separately, read the darwin heading on win32. Separately, drop the platformName argument in install-check.mjs.
- R-1854: drop the outer quotes. Separately, drop windowsVerbatimArguments. Separately, use "/bin/zsh".
- R-1855: add a new `PATH` key beside `Path`. Separately, use `<prefix>\bin`. Separately, put the bin folder after the caller's Path. Separately, join with path.delimiter.

## Done
- The six must-meet tests, the pin, and the fresh-machine, readme-rehearsal, install-check and pi-install-pin test files are green. map:check and readme:check are green.
- Seat: run `node packages/nana-setup/bin/install-check.mjs` on macOS and expect PASS readme checklist. Run CI on the lane tip and expect PASS readme checklist on macos-latest and windows-latest. Run requirements-moved.mjs and carry its output.
- If the Windows leg fails on a defect outside this lane's files, the seat stops and puts it to the owner: fix it in its own lane first, or land with a dated known-red entry. Never loosen the check.

## Report (≤ 10 lines)
Tip SHA; each test file and its pass count; each wrong-code try and the test it turned red; map and readme check results; rows flipped; anything not done and why.
## Seat note (at launch, main 2389726e)
The plan was written against main c827fcf8. Since then pi-seat-live-turn (the install check runs one live pi turn; setup README and install-check files) and win-hook-rows (install and doctor no longer list the hook files on Windows; setup README) have landed, and pwsh-lexer-oracle before them. Read the current setup README, the install-check files and the fresh-machine and rehearsal tests at this tip before editing; where the plan's line numbers or quoted text no longer match, follow the current file and say so in the report.
