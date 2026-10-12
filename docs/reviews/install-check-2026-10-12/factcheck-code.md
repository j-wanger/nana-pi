VERDICT: the plan can run on hosted macOS and Windows runners after the fixes below. Six things are wrong or will not work as written: the Windows pi launches, the expected first Windows result, the attribution of the macOS failure, the stale state of cc-hooks-windows, the promise to share samples with that lane, and the claim that the check writes nothing outside its home.

Process slip: I broke the read-only rule once. A `git show … >` redirect wrote `/private/tmp/claude-501/-Users-jwang-nana-pi/dea1c010-278e-4392-a90f-df947a3a8b71/scratchpad/cc-change-71757f4.md`. It is a copy of cc CHANGE.md at `71757f4`. I left it in place, because deleting it is also not allowed. No repo file was touched.

**Steps that cannot work as written (each with the smallest fix)**

1. **pi on win32 inside the check.** The check itself runs `pi install npm:pi-subagents@…` and `pi list`. On the runner, pi is `C:\npm\prefix\pi.cmd` (job 114857675317, log line 286). Node will not spawn a `.cmd` without a shell. The plan routes only install's own `pi install` through `findPi` and `winCommand`.
   - Fix: R-1072 and R-1073 say these calls launch pi the same way, importing `packages/nana-pack/lib/win-command.mjs` `findPi` and `winCommand`.
   - Run both calls from `<home>/project`, not the checkout. pi reads the project settings in the working folder, and the checkout tracks `.pi/`.
2. **The expected first Windows result is wrong.** R-1074's hook-set line also fails today, because four rows are missing. Expect five FAIL lines: the hook set, objective, adoption, shared memory and verifier. If verifier results are printed per tool, expect more.
3. **The macOS "workflow fails" proof is confounded.** Removing the verifier from `desiredHooks` also turns `suite (macos-latest)` red (`install.test.mjs:131-132`, `verifier-pipe.test.mjs:34-37`). So the workflow's failure cannot be credited to install-check.
   - Fix: claim only that `install-check (macos-latest)` is red with the verifier line.
   - Or pick a fault the suite cannot see.
4. **cc-hooks-windows has moved on.** Its tip is `2818e03`, not `71757f4` at plan stage. Sol plan r3 accepted it (LAND 100/100), build brief 1 is issued and Sonnet 5.5 is building.
   - Seven lines were inserted after line 511 of cc CHANGE.md. The plan's `:512` and `:541-557` are now about `:512-516` and `:548-564`.
   - The PowerShell hit `npm test | Select-Object -Last 1; git commit -m done` is not verbatim in that file. The closest is `npm test | Select-Object -Last 5; git commit -m x`.
   - The cc lane holds R-1050 to R-1069, not R-1064. `build-brief-1.md` reserves R-1065 to R-1069 for its own splits.
5. **The sample-sharing promise conflicts with the cc contract.** The cc brief has no instruction to import from `install-check-config.mjs`. Its Windows test is `packages/nana-setup/tests/hooks-win32-exec.test.mjs`.
   - "cc imports them at its next merge" reopens a plan sol accepted. Jake allows that only for a named fail-open bug.
   - "This lane moves that test's samples" edits a cc-owned file that is not in this lane's scope.
   - Fix: drop the promise and carry the duplication as a residual.
6. **"Writes nothing outside that home" is false on Windows.** npm's cache is `%LOCALAPPDATA%\npm-cache`, which ignores USERPROFILE. Both platforms also write to the system temp folder. The same goes for "Jake's run touches only a temporary home".
   - Fix: set `npm_config_cache=<home>/.npm` for the pi-subagents step and strip `npm_config_*`.
   - Or reword the claim to "no nana, pi or Claude Code state outside the home".

**Other corrections**

- **Timeouts in the hook table.** R-1075 uses `entry.timeout × 1000`. A missing timeout means Claude Code's default (600 s, or 30 s on UserPromptSubmit) and NaN in `spawnSync`.
  - Seal `timeout: 5` per row as a contract value from `settings.mjs:139-175`, and FAIL otherwise.
  - Also FAIL on a `shell` field, which the docs say picks the shell explicitly.
  - SessionStart rows need a matcher that is absent or admits `startup`.
- **Matcher rule is incomplete.** The hooks docs (read 2026-10-12) say:
  - letters, digits, `_`, `-`, spaces, `,` and `|` mean exact names separated by `|` or `,`;
  - any other character means an unanchored JS regex.
  - Implement both, or FAIL on any matcher that is not exact names.
- **The CI job has no `timeout-minutes`.** `steps.mjs:992` spawns pi with no timeout, so one hung npm or pi call burns the 360-minute default. Add a job limit and per-spawn limits, each with provenance.
- **The kept home is lost in CI.** `runner.temp` is wiped at job end. Upload it with an artifact step on failure, or print `settings.json` and the last `pull.log` reason.
  - The knowledge hook has an internal 1,500 ms budget (`hook.ts:27`). When it runs out, the hook exits 0 and prints nothing.
- **Knowledge sample constraints.**
  - The prompt needs at least 12 characters and at least 2 meaningful tokens (`tokenize.ts:58-64`).
  - The run token must be `[a-z0-9_]`; a hyphen splits it.
  - On win32 the pointer shows `~\notes\docs\…`, so match the fixture note by basename.
- **Variables to clear before each step.**
  - Add `NANA_TEST_TEMP_ROOTS` (`nana-pack/lib/adoption.mjs:39-40`; `bin/nana-adoption.mjs:40-41` warns on stderr) and `npm_config_*`.
  - `PI_CODING_AGENT_DIR` is read at `nana-pack/lib/agent-dir.mjs:68`; `paths.mjs:41` only calls it.
  - R-1071 should say that HOME, USERPROFILE and the variable removals apply to pi, the hooks and doctor too, not only install.
- **The doctor-from-checkout finding is confirmed by the code, not inferred.**
  - `doctor.mjs:431-437` adds `!` whenever the folder holds `.pi/nana-pack.json` with no trust record.
  - The checkout tracks that file (`git ls-files .pi`).
  - `bin/nana-setup.mjs:335` then exits 1.
  - So README step 8 ("expect `all good`") fails on every fresh machine.
- **Doctor rows under `--home`, stated precisely.**
  - `:329` (pi executable) and `:602` (PATH resolves pi-review) drop to notes.
  - `:610` (pi packages) stays ✗ when any partial entry exists.
  - `:634` (desk service) also becomes a note when a plist exists.
- **Row placement.** R-950 (`REQUIREMENTS.md:673`) is in FEAT-013 SUB-011, and R-323 (`:717`) is in FEAT-013 SUB-013. "FEAT-015, beside R-950/R-323" contradicts how this repo uses "beside" (adjacent rows). Drop "beside", or place the rows in FEAT-013.
- **Finding Git Bash.** `git.exe` may sit in `Git\cmd`, `Git\bin` or `Git\mingw64\bin`; the checkout log uses `C:\Program Files\Git\bin\git.exe`. Derive the Git root from any of these.
  - Never resolve `C:\Windows\System32\bash.exe`. The `windows-2025` image has WSL enabled.
- **Prior art to cite in the Why section.** `verifier-pipe.test.mjs:34-37` already runs the installed verifier with this exact hit sample, under `--home`. `install.test.mjs:322` checks exit status for all three SessionStart commands, not only the header.

**Missing scope**

- `AGENTS.md:39` (CLAUDE.md links to it) says "CI releases after a green suite on main". That goes stale once release needs install-check.
- `HANDOFF.md:59` says "Green on both is the 2026-10-24 done". By the plan's own limits, a green check proves less:
  - Claude Code never runs;
  - pi seat extensions never load;
  - adoption can only ever be silent, because production skips everything under the OS temp folder (`adoption.mjs:38-43`).

  State that in HANDOFF, or turn the rpc `get_commands` probe into a row.
- Nothing runs install-check on cc's code before either lane lands. A throwaway branch that merges both, opened as a draft PR, would show Windows green before 2026-10-24.
- The flip needs two consecutive pushes to main, and Jake pushes main by hand. Say so, or count PR runs at main's tip.
- `--ignore-scripts` skips the postinstall scripts of pi's dependencies esbuild and protobufjs. The risk is low because the check never loads extensions, but the plan does not state it.

**Verified correct**

- **CI file and its pins.**
  - `ci.yml` lines 2-5, 21, 38, 45 and 63.
  - Slices at `ci-workflow.test.mjs:25`, `:30`, `:32-33`, `:52-54` and `:80`: placing the job before `suite:` keeps them byte-identical and `:30` still holds.
  - `fresh-machine.test.mjs:28`.
- **Installer and test code.**
  - `steps.mjs` lines 505-510, 687, 815, 984, 986-993 and 1031; `paths.mjs:84` and `:97-99`; `settings.mjs:123-178`.
  - Doctor exit codes at `bin/nana-setup.mjs:325-335`; `doctor.mjs:163` and `:430-437`.
  - `install.test.mjs:60-64`, `:312`, `:319-323` and `:330`.
  - `scripts/test.mjs:127` and `:357`.
- **Hook code.** Every cited hook and producer line, including `hook-producer.mjs:15`, `nana-adoption.mjs:79` and `:82`, `verifier-hook.mjs:12-24`, `hook.ts:27`, `:39` and `:159-160`, and `sources.ts:41-45` and `:93-114`.
- **pi 1.0.2.**
  - `config.js:453-459`, `package-manager-cli.js:842-871` and `docs/packages.md:33` and `:36`.
  - A local `pi install` copies nothing and runs no npm.
  - `pi list` prints the resolved local path, coloured under GitHub Actions, so stripping colour codes is needed.
- **Runs and logs.**
  - Run 38262900510: 136 files, 68 FAIL, release succeeded. Run 38203236675: release also succeeded.
  - Raw job log lines 57, 61 and 294 match the plan.
  - Node 22.23.x on both runners. The Windows 2025 image lists no Claude Code.
- **Repo state.**
  - Main is unprotected, and `nana-land` reads no CI result.
  - R-1070 to R-1079 are free; the highest row on main is R-1043.
  - The leaf total is 1,056 at `requirements-tree.test.mjs:38` and `:52`.
  - `HANDOFF.md` lines 5, 18, 34 and 58-59.
- **Node behaviour.** `os.tmpdir()` reads TEMP first on win32 and `os.homedir()` reads USERPROFILE (Node docs), so those two INFERRED marks can be dropped.

**Unverified (the plan should mark these INFERRED)**

- Doctor exiting 0 on Windows today. Registration stores a path with backslashes relative to the agent folder, and the runner has never exercised that.
- The Windows knowledge-entry PASS. The knowledge tests that fail on Windows fail for test-portability reasons (`URL.pathname`, suffixes with `/`), so they are no evidence either way.