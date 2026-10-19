# readme-install: build brief 1 (feat/readme-install)

**Builder: a Claude Sonnet subagent in the lane worktree. Lane class: ordinary.** Feature: FEAT-015 · Diagnose the active environment. Read `must-meet.md` first. Order: rows first, then tagged tests, then code. Add R-1540 to R-1545 to the FEAT-015 table after R-1209, and R-1546 to SUB-011 after R-1111. Each row starts `planned` and flips to `implemented` when its test passes. Leave R-1547 to R-1549 unused. Run `npm run req:tree`, then set the leaf total in the R-291 title in `packages/nana-pack/tests/requirements-tree.test.mjs` to the total the fresh tree gives (7 more than your base). Run single test files only. Do not run the full suite and do not push; the seat does both. Do not edit `HANDOFF.md` or `docs/sessions/`.

**Product**
- `lib/install-check-config.mjs`: add `README_REHEARSAL`. Item `readme checklist`; readme `README.md`; heading `### Fresh machine (macOS), in order`; platforms `["darwin"]`; home `readme-home`; npm prefix `.npm-global`; shell `/bin/zsh` with args `["-l","-c"]`; command leads `["Run","then"]`; expect lead `expect`; dropped env `["ZDOTDIR"]`; answers `[{ prefix: "nana-setup trust ", append: "--yes" }]`; step timeout 300000; max output 1000000. Give each value its provenance.
- New `lib/readme-rehearsal.mjs`, with the six-tag header and named exports only:
  - `parseChecklist(text)` returns `[{ step, commands, expect }]`. Read CRLF as LF.
  - `rehearsalPlan(steps)` applies the answer rule and nothing else.
  - `runReadmeRehearsal({ root, home, env, spawn })` mkdirs home, `tmp`, `.npm` and the npm prefix. It sets `npm_config_prefix` to the prefix and puts the prefix's `bin` before PATH, using `path.join` and `path.delimiter`. It derives the clone URL from the `github:` shorthand in the root package.json `repository`, adds the four git variables and deletes `ZDOTDIR`. It runs each step through `spawn(shell, [...args, joined], { cwd: home, env, timeout, maxOutput })` and stops at the first failure.
  - Do not import `install-check.mjs`.
- `lib/install-check.mjs`:
  - `createSpawnAdapter` keeps `options.maxOutput ?? 10001` characters.
  - In `runInstallCheck`, after the doctor report and before the `if (failed)` dump, when `README_REHEARSAL.platforms` includes the platform: call `runReadmeRehearsal` with `home/readme-home`, `buildEnvironment(env, thatHome, platformName)` and the same spawn. Then call `report(...)` with its result.
- `README.md`: reword step 8 to: Run `cd ~/nana-pi`, then `nana-setup trust ~/nana-pi` (it asks before it records), then `nana-setup doctor`; expect `all good`. Above the list, add an HTML comment with no backticks: the install check runs the commands after Run and then in a new temporary home and checks for the text after expect.
- `packages/nana-setup/README.md`: in the Install check section, add the macOS rehearsal: second home, login zsh, home npm prefix (step 2's pi install runs for real over the network), clone redirect to committed HEAD, `--yes`, and the `readme checklist` FAIL rule. Add a tests-table row for `tests/readme-rehearsal.test.mjs`.

**Tests**
- Write only the titles in must-meet.md, verbatim, plus one pin test for `README_REHEARSAL`. Put `// req:` directly above each `check(`.
- R-1540 goes in `tests/install-check.test.mjs` and uses `recordingRun`. In that fixture, make `/bin/zsh` calls return `{ status: 0, stdout: "\n  all good.\n" }` so the existing darwin checks stay green; list that edit in your report.
- R-1541 to R-1545 go in the new `tests/readme-rehearsal.test.mjs`, using a stub spawn, fake children and OS-temp fixtures. R-1546 goes in `tests/fresh-machine.test.mjs` and imports `parseChecklist` and `rehearsalPlan`.
- Build expected paths with `path.join` and `path.delimiter`, never literal separators, so every file passes on win32. Give the parse cases CRLF, trailing-space and no-final-newline variants.

**Wrong code to try (report each pair)**
1. Every backticked span counts as a command: R-1541 fails.
2. `~/.local/bin` is put on PATH by the rehearsal: R-1542 fails.
3. `ZDOTDIR` is kept: R-1542 fails.
4. No npm prefix, or a prefix outside the home: R-1542 fails.
5. The global npm install is dropped: R-1543 fails.
6. `--yes` goes on every command: R-1543 fails.
7. The adapter ignores `maxOutput`: R-1544 fails.
8. No expected text anywhere still passes: R-1545 fails.
9. Steps keep running after a failure: R-1545 fails.
10. The gate is `!== "win32"`: R-1540 fails.
11. The rehearsal reuses the install home: R-1540 fails.
12. README step 8 without the `cd` command: R-1546 fails.

**Checks:** run `npm run map`, `npm run map:check` and `npm run readme:check`, each green. Commit, then run `node packages/nana-setup/bin/install-check.mjs` once and paste its `readme checklist` line and exit code.

**Done:** all seven rows are implemented, every touched test file is green, and the install check prints `PASS readme checklist` with exit 0.

**Report (≤ 10 lines):** VERDICT; commits; rows flipped; tests per file with pass counts; the 12 mutation pairs; the edited existing test; the map, readme and install-check lines with exit codes; anything not done.