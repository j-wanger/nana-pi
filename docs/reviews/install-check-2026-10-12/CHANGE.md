# Change declaration: one check that installs nana and runs every installed hook the way the docs describe, in CI on macOS and Windows

*Lane `install-check` · branch `feat/install-check` · worktree `~/nana-pi-wt/install-check`, based on `main` at `7e6ce39` · 2026-10-12. Builder: pi gpt-6-luna. This is the owner's measurement lane. It is timed against `cc-hooks-windows`, which Claude Sonnet 5.5 builds (`HANDOFF.md:18`, `:58-59`).*

*Features and rows:*
- *FEAT-015 "Diagnose the active environment": new R-1070 to R-1077, R-1079 and R-1080 to R-1084.*
- *FEAT-019 "Release usable templates and report support": R-597 reworded; R-1032 keeps its text but its test pin moves; new R-1078.*

*Order: why → plan → sol plan review (two rounds at most) → seat acceptance script, red, with probes (f) and (g) run first → build → red-first CI runs on draft pull requests → seat verification → sol build review → astra land review → the owner accepts. The owner ruled on 2026-10-11 that pushing a non-main branch and opening a draft PR for CI need no approval. The ruling is recorded at `~/nana-pi-wt/cc-hooks-windows/docs/reviews/cc-hooks-windows-2026-10-12/CHANGE.md:18`, cited below as "cc CHANGE", at cc tip `2818e03`.*

*Dependencies:*
- *`cc-hooks-windows` runs in parallel. Its tip is `2818e03`. Sol plan r3 accepted its plan (LAND 100/100), build brief 1 is issued, and Sonnet 5.5 is building. That lane writes the four Windows hook entries that are missing today. This lane measures them.*
  - *It does not touch `ci.yml` (cc CHANGE:272, :408).*
  - *This lane does not touch `settings.mjs`, `steps.mjs`, `doctor.mjs`, the hook scripts, the pipe guard, R-684 or cc's test `packages/nana-setup/tests/hooks-win32-exec.test.mjs`.*
- *Both lanes edit the same shared files:*
  - *`REQUIREMENTS.md`, in different ID ranges: R-1050 to R-1069 there (R-1065 to R-1069 are reserved for its splits, `build-brief-1.md:43-44`), R-1070 to R-1079 here;*
  - *`docs/requirements-tree.md` and the leaf total in `packages/nana-pack/tests/requirements-tree.test.mjs:38`, `:52`;*
  - *the root `AGENTS.md`, which `CLAUDE.md` links to. cc changes the runtime-matrix verifier cell (cc CHANGE:338). This lane changes `:39`;*
  - *the root `README.md`;*
  - *the code map and `HANDOFF.md`.*

  *Whichever lane lands second merges main and regenerates those files. The known-red list is a special case (section 3, "Blocking").*
- *R-1070 to R-1079 are free. The highest row on main is R-1043 (grep of `REQUIREMENTS.md` at `7e6ce39`).*

## 1. Why

The owner's current priority, due for review on 2026-10-24, reads: "nana working consistently in terminal mode, without the desk, for both seats (Claude Code, or pi with nana-pi), on macOS and Windows, installation and every hook included" (`HANDOFF.md:5`). HANDOFF names this lane as the measure: "the install-and-hooks check on both platforms, built by luna. Green on both is the 2026-10-24 'done'" (`:59`). The Windows install-and-hooks rehearsal has still not been run (`:34`).

Nothing today measures that definition.
1. **Every suite install uses `--home`** (`packages/nana-setup/README.md:402-403`). That flag has three effects:
   - It skips pi registration (`packages/nana-setup/lib/steps.mjs:984`).
   - In doctor, "pi executable" (`lib/doctor.mjs:329`) and "PATH resolves pi-review" (`:602`) drop to notes. "pi packages" (`:610`) drops to a note only when no entry exists; any partial entry stays ✗. "desk service" (`:634`) becomes a note when a plist exists.
   - The tests then seed a fake pi-subagents package (`tests/install.test.mjs:60-64`, `:312`) and stub pi for doctor (`README.md:261`).

   So no test proves that a real install registers nana with a real pi.
2. **The closest macOS proof is narrow.**
   - It runs only the SessionStart commands, and it runs them through `bash -c` (`install.test.mjs:319-323`). Claude Code uses `sh -c` on macOS (hooks docs, quoted at cc CHANGE:47).
   - It checks each command's exit status and stderr (`:322`) and the shared-memory header (`:330`). It does not check the objective or adoption output.
   - `verifier-pipe.test.mjs:34-37` already runs the installed verifier with this lane's Bash hit sample, under `--home`. It calls node directly, not through the settings command.
3. **The Windows suite leg cannot carry the verdict.**
   - On run 38262900510 it failed 68 of 136 test files, mostly on test portability (lane 6).
   - The leg is non-blocking (`.github/workflows/ci.yml:21`), and the run concluded `success` while that leg failed.
   - A hook check placed inside that leg inherits its red.
4. **The R-1058, R-1063 and R-1064 test in cc-hooks-windows covers only part of this.** That test is `hooks-win32-exec.test.mjs`. It spawns every Windows entry, but:
   - it runs inside that red leg;
   - it installs under `--home`, with pi stubbed and pi-subagents seeded;
   - it runs on Windows only (cc CHANGE:479-480, :506, :508).

**CI green is necessary, not sufficient.** A green check proves less than the 2026-10-24 goal:
- Claude Code itself never runs. The check simulates the documented dispatch.
- The pi seat is measured by registration and one session that loads nana-pack (R-1079; probe (f) held, 2026-10-12). No prompt runs, so no pack hook inside a pi prompt fires.

"Done" on 2026-10-24 is settled (seat decision, §3, after the owner's 2026-10-11 acceptance that his machine is the proof): this check green on both legs on a push to main with an empty win32 known-red list, plus the owner's Claude Code machine check (cc CHANGE:548-564) and the owner's own run of this check on his Windows machine — the only test of this plan's most-likely-wrong claim (section 3). HANDOFF states this limit (section 4).

**Observable outcomes.**
1. One command, `node packages/nana-setup/bin/install-check.mjs`, installs nana from its checkout into a new temporary home.
   - It follows the steps of the macOS fresh-machine checklist (root `README.md:118-127`). On win32 it follows the same steps without the PATH step. No README states a Windows checklist (a declared gap, section 3).
   - It prints one PASS, FAIL or XFAIL line per item. It exits non-zero on any FAIL.
   - It writes no nana, pi, Claude Code or npm-cache state outside that home, and its child processes keep their temporary files inside it. Acceptance (b) shows this on macOS only. On win32 the claim is INFERRED (section 3, limits).
2. **pi seat.**
   - Install registers nana-pack and nana-knowledge with the real pi.
   - `pi list` shows both at the checkout, and neither is filtered.
   - pi-subagents installs at doctor's floor version.
   - One `pi --mode rpc --no-session` session in the fixture project loads nana-pack (R-1079; probe (f) held, 2026-10-12).
3. **Claude Code seat.** The settings hold exactly the five nana hook entries in the documented shape. Each one:
   - passes a simulation of Claude Code's documented dispatch;
   - exits 0 within its sealed timeout;
   - prints its expected output.
4. **Doctor**, run against that home, exits 0. It shows no ✗, no !, and no `·` row outside the platform's sealed note list.
5. **CI** runs the check on `macos-latest` and `windows-latest` for every push to main and every pull request.
   - A failure on either leg fails the workflow and holds the template release.
   - Main is unprotected and `nana-land` reads no CI result. So blocking acts only on the release, and only after a lane has landed.
6. **Today the Windows leg passes with XFAIL lines** for the items on the sealed win32 known-red list: the hook set and the four entries Windows does not wire (`steps.mjs:505-510`).
   - The 2026-10-24 signal is the `install-check (windows-latest)` job concluding green on a push to main with an empty win32 list.

**Threat model.** This follows the owner's 2026-10-11 rule (`HANDOFF.md:18`).

Honest variation in hosted runners and machines is in scope:
- runner image updates (Node, Git, Windows image), and pi and pi-subagents fetched from npm;
- on `windows-latest`, `os.tmpdir()` sits on `C:` under an 8.3 short name, while the checkout is on `D:`. The run 38262900510 job log shows the checkout `D:\a\nana-pi\nana-pi` at line 57, runner temp `D:\a\_temp` at line 61, and `C:\Users\RUNNER~1\AppData\Local\Temp` at line 294;
- CRLF line endings on the default Windows checkout (`docs/reviews/windows-ci-2026-10-11/windows-triage.md:3`, `:14`);
- npm registry latency;
- hook cold-start time against the 5-second timeout.

Deliberate forgery is out of scope: a hand-forged `settings.json`, a hook or tool that detects the check, or a tampered runner.

**Lane class.** This is a CI workflow change that decides what holds a release. It is gate/format class, with two plan-review rounds at most (`HANDOFF.md:18`). Stakes: the check's code is reversible test tooling. The gates on the release path are the release job's `needs` and a blocking Windows leg. A Windows runner fault can now hold a template tag until someone reruns the job. Each is reversible in one line.

## 2. Requirement delta

| ID | Change | Text (draft) |
|---|---|---|
| R-1070 | added (FEAT-015) | The install check shall print one PASS, FAIL or XFAIL line for each item it checks and exit non-zero when any line is FAIL. |
| R-1080 | added (FEAT-015; sol plan r1 MUST 1) | The install check shall print XFAIL in place of FAIL only when the item is on the running platform's sealed known-red list, the item's failure matches that entry's sealed expected-failure code, and the run date is before the entry's sealed expiry date (2026-10-24), and otherwise print FAIL, including for a listed item that passes. |
| R-1071 | added (FEAT-015) | WHEN the install check runs, it shall start every process with one environment (HOME and USERPROFILE set to a new temporary home; TMPDIR, TEMP and TMP set to that home's `tmp` folder; `npm_config_cache` set to its `.npm` folder; every variable in its sealed override list and every caller `npm_config_*` variable removed), run `nana-setup install` from the checkout with no `--home`, `--claude-home` or `--pi-home` flag, and report install as FAIL unless it exits 0. |
| R-1084 | added (FEAT-015; sol plan r1 MUST 4) | The install check shall start every child process — including the fixture `git init`, Git Bash discovery, install, pi, each hook and doctor — through one spawn function that passes the same sanitized environment R-1071 defines. |
| R-1072 | added (FEAT-015) | WHEN install has exited 0, the install check shall carry out the fresh-machine checklist's later steps against the temporary home (`pi install npm:pi-subagents@` doctor's floor; objective lines carrying the run token; the bin folder first on PATH, except on win32), launching pi as install does and from the fixture project folder. |
| R-1081 | added (FEAT-015; split from R-1072, sol plan r1 MUST 5) | WHEN the checklist steps have run, the install check shall report doctor as FAIL unless doctor, run with no flag from the fixture project folder, exits 0 and prints no `·` row outside the platform's sealed note list. |
| R-1073 | added (FEAT-015) | WHEN install has exited 0, the install check shall report pi registration as FAIL unless `pi list` lists user packages whose resolved paths equal the checkout's `packages/nana-pack` and `packages/nana-knowledge` folders, neither marked `(filtered)`. The check launches pi as install does, from the fixture project folder, with no `PI_CODING_AGENT_DIR`. |
| R-1074 | added (FEAT-015) | The install check shall report the hook set as FAIL unless the temporary home's Claude Code `settings.json` meets three conditions. Each event is `hooks.<Event>[]` of `{matcher?, hooks: [...]}` groups. There is exactly one entry for each row of the sealed hook table and no other entry. Each entry has `type` `command`, only keys from the sealed allowed set, `args` (when present) as an array of strings, the row's sealed `timeout`, and a group matcher that admits each of the row's tools under the documented matcher rule. SessionStart rows use the source `startup`, and UserPromptSubmit rows take no matcher. |
| R-1082 | added (FEAT-015; sol plan r1 MUST 2) | The install check shall report a hook entry as FAIL when its dispatch form differs from its sealed hook-table row's form for the running platform: exec form (`command` `node` with an `args` array) for every row on win32, and shell form (no `args`) for every row on macOS and Linux. |
| R-1075 | added (FEAT-015) | The install check shall run each hook entry as Claude Code's documented dispatch does: an entry carrying `args` as `command` with `args` and no shell; any other entry as its `command` string through `/bin/sh -c` on macOS and Linux and through Git Bash's `bash -c` on win32. Each entry runs in the fixture project folder, with the R-1071 environment plus `CLAUDE_PROJECT_DIR` set to that folder. The SessionStart entries start together. The check reports a hook as FAIL unless it exits 0 within its row's sealed `timeout`. |
| R-1076 | added (FEAT-015) | WHEN the SessionStart entries run with the SessionStart sample input, the install check shall pass: the objective entry only when its first line is `[nana:objective]` and its output carries the run token and no `OBJECTIVE UNAVAILABLE`; the adoption entry only when its output names the fixture project and carries no `ADOPTION UNAVAILABLE`; the shared-memory entry only when its output carries the `[nana:shared-memory]` header and the seeded `- [` line, and the sample transcript's project folder then holds a `memory/shared` link resolving to the home's `.claude/nana-memory/shared`. It passes each entry only when its stdout is at most 10,000 characters. |
| R-1077 | added (FEAT-015) | The install check shall pass the verifier entry only when, for each tool in its table row, the hit sample prints exactly one JSON line whose `hookSpecificOutput.hookEventName` is `PreToolUse` and whose `hookSpecificOutput.permissionDecision` is `ask`, and the miss sample prints nothing. |
| R-1083 | added (FEAT-015; split from R-1077, sol plan r1 MUST 5) | The install check shall pass the knowledge entry only when a prompt carrying the run token prints, within 10,000 characters, a `[nana:knowledge]` block naming the fixture note's file name. |
| R-1078 | added (FEAT-019, beside R-1031) | The root CI workflow shall run the install check in an `install-check` job on `macos-latest` and `windows-latest`, in bash, with a job `timeout-minutes` and no `continue-on-error` at job or step level, after installing the pinned pi with the fresh-machine checklist's command and checking its version. |
| R-1079 | added (FEAT-015); probe (f) HELD, 2026-10-12 (see §3 step 6) | WHEN install has exited 0, the install check shall report the pi session as FAIL unless `pi --mode rpc --no-session`, started in the fixture project folder with no model flag, launched as install launches pi and with `NANA_TEST_TEMP_ROOTS` set empty, lists `reload-runtime` in its `get_commands` response and the user-scope journal gains a `directory_unadopted` line naming the fixture project. |
| R-597 | reworded (FEAT-019) | The root CI workflow shall run the suite on pushes and pull requests and gate the main-branch release job on the success of the suite and install-check jobs. Its release-header pin (`packages/nana-pack/tests/ci-workflow.test.mjs:25`) changes to `needs: [suite, install-check]`. |
| R-1032 | text unchanged | "The root CI release job shall not depend on the Windows suite leg's success." This stays true: the suite's Windows leg keeps `continue-on-error`. Its pin at `ci-workflow.test.mjs:80` moves to the new `needs` line. |

Probe (f) held (§3 step 6), so R-1076's adoption clause keeps its full output assertion; there is no weaker fallback (sol plan r1 MUST 3).

**Sealed values.** These live in `packages/nana-setup/lib/install-check-config.mjs`, each with its provenance beside it. Each is pinned by one test that names its row.
- **The hook table (R-1074, R-1082).** Events and scripts are contract values from the Claude Code seat row of the runtime matrix (`templates/_shared/working-under-nana-pi.md:7`, mirrored in the root `AGENTS.md`). The timeout is a contract value copied from `settings.mjs:139-175`, never imported.

  | Label | Event | Matcher tools or source | Script | Timeout | Form on darwin/linux | Form on win32 |
  |---|---|---|---|---|---|---|
  | objective | SessionStart | `startup` | `nana-objective.mjs` | 5 | shell | exec |
  | adoption | SessionStart | `startup` | `nana-adoption.mjs` | 5 | shell | exec |
  | shared memory | SessionStart | `startup` | `nana-shared-memory.mjs` | 5 | shell | exec |
  | verifier pipe | PreToolUse | `Bash` | `verifier-pipe.mjs` | 5 | shell | exec |
  | knowledge pull | UserPromptSubmit | no matcher | `nana-knowledge.ts`, then `hook` | 5 | shell | exec |

  The form columns are contract values: exec form on win32 from cc R-1050 (cc CHANGE, exec-form decision of 2026-10-12); shell form elsewhere from main's `settings.mjs`, which cc leaves byte-identical (cc R-1061). Exec form means `command` `node` and an `args` array; shell form means no `args`. R-1082 fails an entry whose form differs.

  - The verifier's tools are `Bash` on every platform, plus `PowerShell` on win32. The PowerShell entry is a contract value from cc R-1053 (cc CHANGE:141) and the hooks docs (cc CHANGE:68, :101-102). cc rewords the matrix's verifier cell to name the Windows matcher (cc CHANGE:338).
  - `startup` is the SessionStart source for a new session (hooks docs, SessionStart matcher values, read 2026-10-12).
- **The allowed entry keys (R-1074):** `type`, `command`, `args`, `timeout`, `statusMessage`.
  - This is a contract value. It is the hooks docs' command-hook fields (read 2026-10-12), minus `shell`, `async`, `asyncRewake`, `onFailure`, `if` and `once`, which change how or whether an entry runs.
  - The installer writes `type`, `command`, `timeout` and `statusMessage` today (`settings.mjs:139-175`). cc R-1050 adds `args`.
- **The matcher rule (R-1074, R-1075).** These are the hooks docs' matcher patterns, read 2026-10-12:
  - `*`, `""` or no matcher matches everything;
  - a matcher made only of letters, digits, `_`, `-`, spaces, `,` and `|` is a list of exact names, split on `|` or `,` with whitespace trimmed;
  - any other matcher is an unanchored JavaScript regular expression.
- **The override list (R-1071).** Each variable is listed with the line that reads it:
  - `PI_CODING_AGENT_DIR` (`packages/nana-pack/lib/agent-dir.mjs:68`, called from `lib/paths.mjs:41`; pi `dist/config.js:453-459`);
  - `CLAUDE_CONFIG_DIR` (`claude/hooks/nana-shared-memory.mjs:32`);
  - `NANA_SHARED_MEMORY_DIR` (`:33`);
  - `NANA_KNOWLEDGE_HOME` (`packages/nana-knowledge/lib/paths.ts:16-18`);
  - `NANA_ROLE` (`packages/nana-knowledge/lib/hook.ts:159-160`);
  - `NANA_SETUP_PLATFORM` (`lib/paths.mjs:97-99`);
  - `NANA_TEST_TEMP_ROOTS` (`packages/nana-pack/lib/adoption.mjs:39-40`; `bin/nana-adoption.mjs:40-41` warns on stderr when it is set);
  - `NANA_HANDOFF` (`packages/nana-pack/extensions/nana-handoff.ts:329`). When it is `off`, R-1079's journal line is never written;
  - every `npm_config_*` variable from the caller, matched without case on win32. The check then sets its own `npm_config_cache`.
- **The known-red list (R-1070, R-1080).** One list per platform. Each entry is sealed as `{ item, code, owner, expires }`: `code` is the one failure the entry may excuse — `missing-entry`, `wrong-form`, `no-output` or `note-row`; `owner` names the cc row that fixes it; `expires` is `2026-10-24`. A listed item that fails with any other code, or on or after its expiry date, prints FAIL. Since cc-hooks-windows lands first (§3, decided), the win32 list is expected to be EMPTY at this lane's land; the entries below are the fallback if that order changes.
  - darwin: empty.
  - win32 at plan time: the hook set, objective, adoption, shared memory, verifier (`Bash`) and verifier (`PowerShell`). Each entry names the cc row that fixes it.
  - Also on win32: the doctor `·` rows that cc changes. INFERRED: these are `settings …` at `doctor.mjs:382` (cc R-1055) and "node for the objective hook" at `:296` (cc R-1057).
  - The seat seals the list at land from the lane's final Windows run with main merged in. An entry is listed only when a named lane or row owns its fix, and each entry carries its code and expiry.
- **The doctor note list (R-1081).** These are the rows that may show `·` by design, one list per platform.
  - darwin: "pi agent dir" (`doctor.mjs:418`), "pi mcp.json" when absent (`:532`), "desk service" not installed (`:620`) and "release status" (`:640`).
  - win32 adds: the four PATH rows (`:585-588`; the Support line says Windows links none of the pack's PATH commands), "desk service" (`:619`; launchd is macOS-only) and the pi-only skill rows (`:360`).
  - `hook …` at `:335` stays unclassified until the first merged Windows run. INFERRED: cc's exec form may point at checkout scripts, which would leave those rows as notes.
  - INFERRED: the list is complete. The seat confirms each entry on the first green run of each platform.
- **The sample inputs and the verifier hit and miss commands (R-1076, R-1077).** These are contract values from the Claude Code hooks docs' input shapes. The builder re-reads https://code.claude.com/docs/en/hooks and records the date.
  - Bash hit: `npm test | tail -1 && git commit -m done`, the same as `verifier-pipe.test.mjs:34`. Bash miss: `git status`.
  - PowerShell hit: `npm test | Select-Object -Last 5; git commit -m x`, from cc's R-1062 cases (cc CHANGE:513).
  - The knowledge prompt is at least 12 characters and has at least 2 meaningful tokens (`packages/nana-knowledge/lib/tokenize.ts:58-64`).
  - The run token matches `[a-z0-9_]+`. A hyphen would split it into separate tokens.

**Chosen tunables** (in the same module, provenance "chosen" with the reason, not pinned).

Each spawn has its own limit. Reason: a hung npm or pi call must end with a FAIL line that names it, inside the job limit. `steps.mjs:992` spawns pi with no timeout. The draft limits are:
- 300 s for install and for each pi call that fetches from npm;
- 60 s for `pi list` and for the pi session;
- 120 s for doctor.

The first green runs' durations are recorded beside the values.

## 3. Design

**Modules.** Each has the six-tag header and named exports. Spawn, platform and environment are injected.
- `packages/nana-setup/lib/install-check-config.mjs` holds the sealed values and chosen tunables above.
- `packages/nana-setup/lib/install-check.mjs` decides, for each installed hook entry, whether it runs and answers as its table row says. Its effects are none. It does six things:
  - validates the settings shape and maps entries to table rows;
  - applies the matcher rule;
  - builds each entry's run, in exec form or shell form;
  - judges each result against the known-red list;
  - parses `pi list` and doctor's marks;
  - builds the one environment.
- `packages/nana-setup/bin/install-check.mjs` is the command. It creates the temporary home and the fixtures. It runs the install, the user steps, the `pi list` call, the pi session, the hook runs and the doctor run, then writes the report. Its effects are disk, process and network.
  - On win32 it launches pi through `findPi` and `winCommand` from `packages/nana-pack/lib/win-command.mjs:45`, `:50`, as `steps.mjs:39` already imports them. On the runner pi is `C:\npm\prefix\pi.cmd` (job 114857675317, log line 286), and Node does not spawn a `.cmd` without a shell.

Why these modules sit in nana-setup:
- Scripts may import packages, never the reverse (`docs/code-map.md:18`).
- Windows has no PATH commands (`steps.mjs:687`), so the check is spelled with `node`, as install is.
- The file name does not end in `.test.mjs`, so `npm test` never collects it (`scripts/test.mjs:127`).

**Sequence.** Each step prints one line.
1. **Temporary home.** The check calls `mkdtemp` under `os.tmpdir()` and resolves the result with `realpathSync.native`. That turns `RUNNER~1` and `/var`→`/private/var` into one form for path comparison. It creates `<home>/tmp` and `<home>/.npm`.
2. **Fixtures that exist before nana.** Both stand in for a real user's folders:
   - `<home>/notes` is a `git init` repository whose `docs/install-check.md` holds the run token. The knowledge build discovers `~/*/docs` inside folders that contain `.git` (`packages/nana-knowledge/lib/sources.ts:41-45`, `:93-114`).
   - `<home>/project` is a `git init` repository with no `.pi` folder and no adoption evidence.
3. **Environment and install (R-1071).**
   - **One spawn function, one environment** (R-1071, R-1084). Every child goes through it: both fixture `git init` runs (`<home>/notes`, `<home>/project`), Git Bash discovery (the `git.exe` lookup and any `git --exec-path` call), install, every pi call (`pi install npm:…`, `pi list`, the session), every hook and doctor. A recording-spawn test enumerates all of them.
   - HOME and USERPROFILE point at `<home>`. The override list and the caller's `npm_config_*` variables are removed.
   - **Children's temporary folder is `<home>/tmp`.** Node's `os.tmpdir()` reads TMPDIR on POSIX and TEMP first on win32 (Node docs, read 2026-10-12). Two consequences follow:
     - Child temporary files stay inside the home.
     - `<home>/project` is not a temporary root for the adoption reader or for `nana-handoff`. Both use `adoptionTempRoots()`, which is `os.tmpdir()` plus `/tmp` on POSIX (`adoption.mjs:38-43`, `:124`; `nana-handoff.ts:55`, `:379`). Without this, the reader treats the fixture project as adopted, and the adoption entry can never print.
   - **`npm_config_cache` is `<home>/.npm`.** npm's default cache on win32 is `%LOCALAPPDATA%\npm-cache`, which ignores USERPROFILE.
   - **Why not `--home`:**
     - `isRealHome` is true when the layout base equals `os.homedir()` and no override flag is set (`lib/paths.mjs:84`).
     - `os.homedir()` follows HOME on POSIX and USERPROFILE on win32 (Node docs). The suite runner sets both variables for the same reason (`scripts/test.mjs:357`).
     - So `stepPiRegister` really runs `pi install <dir>` with `PI_CODING_AGENT_DIR=<home>/.pi/agent` (`steps.mjs:992`). That is registration through the same command line users run.
     - Install exits 1 only on PROBLEM (`steps.mjs` `installExitCode`). A SKIPPED registration still exits 0, so R-1073 is the line that catches it.
   - **No network for registration:** a local folder is "Loaded from the resolved path without copying" (pi 1.0.2 `docs/packages.md:36`).
   - **pi on win32:** install launches it through `findPi` and `winCommand` (`steps.mjs:986-993`). That gives the pi-cmd-launch code a real-runner run.
   - **launchctl:** it runs only with `--desk` (`steps.mjs:1031`), and the check never passes that flag.
4. **The checklist's later steps (R-1072).** The check writes only what the checklist tells a user to do. It never writes a file that install or pi is responsible for.
   - `pi install npm:pi-subagents@${PI_SUBAGENTS_FLOOR}` (checklist step 6, `README.md:125`; the floor constant is at `doctor.mjs:163`, read by name).
     - This is a network fetch: "Installed under the Pi npm directory" (`docs/packages.md:33`).
     - On win32 the check launches pi through `findPi` and `winCommand`.
     - It runs from `<home>/project`, so pi reads no project `.pi` folder from the checkout.
   - Objective lines carrying the run token, written over the seed's placeholder lines (step 7, `README.md:126`; seed `packages/nana-setup/pi/nana-objective.seed.md:8`, `:10`).
   - On POSIX, `<home>/.local/bin` goes first on PATH for the later steps (step 5, `README.md:124`).
   - One `- [` line is appended to the shared `MEMORY.md`. It stands in for a user's memory. The seed has no such line, and the hook prints only lines of that form (`nana-shared-memory.mjs:89`).
5. **`pi list` (R-1073).**
   - The check launches pi as in step 4, from `<home>/project`.
   - pi resolves its agent folder from `PI_CODING_AGENT_DIR`, or else from `homedir()/.pi/agent` (`dist/config.js:453-459`).
   - `pi list` prints `User packages:` with each source and, indented, its resolved path. An object entry prints with `(filtered)` (`dist/package-manager-cli.js:842-871`; `dist/core/package-manager.js:768`). Doctor counts only string entries as registered (`doctor.mjs:610`).
   - The check strips colour codes and resolves both sides. On win32 it compares without case.
   - INFERRED: the exact output format, taken from the code. Under GitHub Actions the output is coloured.
6. **pi session (R-1079; probe (f) held, 2026-10-12).**
   - The check starts `pi --mode rpc --no-session` in `<home>/project` with no model flag. It sends `{"type":"get_commands"}`, reads the response, and closes stdin.
   - pi's RPC docs allow a session with no model selected (pi 1.0.2 `docs/rpc-commands.md:186`).
   - **Probe (f), run by the seat 2026-10-12 on macOS with pi 1.0.2**, in a temporary HOME and `PI_CODING_AGENT_DIR`, after `pi install <checkout>/packages/nana-pack`, in a fresh git project, sending `get_commands`: the session reached `session_start` with no model (journal line `session_start`, reason `startup`), and `get_commands` listed `reload-runtime`. With `NANA_TEST_TEMP_ROOTS` unset, NO `directory_unadopted` line appeared: nana-handoff skips projects under temporary folders (`packages/nana-pack/lib/adoption.mjs:39-40`). With `NANA_TEST_TEMP_ROOTS` set EMPTY (the documented seam: empty disables the skip), the journal gained `adoption_test_temp_roots_override` and then `directory_unadopted` naming the project. So the check sets it empty for the pi session and the adoption hook; the override line in the journal is expected, not a failure. Whether the same holds on windows-latest is shown by the first red-first CI run.
   - nana-pack registers `reload-runtime` (`nana-lifecycle.ts:79`). nana-handoff writes `directory_unadopted` for an unadopted git root in its `session_start` handler (`nana-handoff.ts:303`, `:379-382`). These two signals prove nana-pack loaded.
   - nana-knowledge registers no command, so its load inside pi stays unproven.
   - This step runs before the hooks. That way the adoption entry has a journal line to report.
7. **Hooks (R-1074 to R-1077).**
   - **Dispatch rule.** The hooks docs (cc CHANGE:47-48; re-read 2026-10-12) give the rule:
     - an entry with `args` is exec form: `command` plus `args`, with no shell. Exec form needs a real executable (`.exe`) on win32;
     - any other entry is shell form. It runs through `sh -c` on macOS and Linux, and through Git Bash on Windows.

     The check keys on `args` to RUN an entry. Before running it, R-1082 compares the entry's form with its sealed row's form for the platform; a mismatch prints FAIL, or XFAIL only under a matching `wrong-form` known-red entry before its expiry. If cc-hooks-windows had not landed, Windows entries would be absent or shell form and would fail with `missing-entry` or `wrong-form`.
   - **Finding Git Bash.** The docs say Git Bash is "located via registry or `PATH`" (read 2026-10-12). The check derives the Git root from the `git.exe` on PATH:
     - `git.exe` can sit in `Git\cmd`, `Git\bin` or `Git\mingw64\bin`. The checkout log uses `C:\Program Files\Git\bin\git.exe`;
     - the check then uses `<root>\bin\bash.exe`;
     - it never resolves `C:\Windows\System32\bash.exe`, because the `windows-2025` image has WSL enabled.

     INFERRED: skipping the registry finds the same bash on the runner and on the owner's machine. The PowerShell fallback for machines without Git Bash is not covered.
   - **How each entry runs:**
     - the working folder is `<home>/project`, with `CLAUDE_PROJECT_DIR` set to it. INFERRED: Claude Code uses the project folder;
     - stdin is the sample input for the entry's event;
     - the spawn timeout is the row's sealed `timeout` × 1000. A missing or different `timeout` already fails R-1074, so `NaN` never reaches `spawnSync`;
     - the three SessionStart entries start together, because "All matching hooks run in parallel" (hooks docs);
     - the duration is printed, so a hook near its 5-second limit shows before it fails.
   - **The table is independent.** It must not import `desiredHooks` (`lib/settings.mjs:123-178`). An entry the installer drops must turn the check red, not shrink what it expects.
   - **Expected outputs** come from the hook code:
     - objective: `nana-pack/bin/nana-objective.mjs:22`, `:41`. Its failure marker also starts with `[nana:objective]` (`lib/hook-producer.mjs:15`), hence the token and UNAVAILABLE rules;
     - adoption: `bin/nana-adoption.mjs:79`, `:82`. It names the root from step 6's journal line;
     - shared memory: `nana-shared-memory.mjs:78`, `:87-89`;
     - verifier: `lib/verifier-hook.mjs:12-24`. The docs require `hookEventName` inside `hookSpecificOutput`;
     - knowledge (R-1083): `nana-knowledge/lib/hook.ts:27`, `:39`. Its internal budget is 1,500 ms. When the budget runs out, the hook exits 0 and prints nothing, which fails R-1077. On win32 the pointer reads `~\notes\docs\…`, so the check matches the fixture note by file name.
     - Plain stdout over 10,000 characters is replaced by a file path and a 2,000-character preview (hooks docs). The check fails an entry over the cap.
   - **Samples:**
     - The SessionStart sample's `source` is `startup`. Its `transcript_path` is `<home>/.claude/projects/install-check/<uuid>.jsonl`, the path Claude Code takes. The check creates that folder first, as Claude Code would (INFERRED).
     - The hook uses that folder when its parent is `<claude home>/projects` (`nana-shared-memory.mjs:45-55`). So no project key is computed, and the link is expected at exactly `projects/install-check/memory/shared`.
     - The verifier hit and miss samples are listed under the sealed values.
8. **Doctor (R-1081).**
   - The check runs `node packages/nana-setup/bin/nana-setup.mjs doctor` with no flag, from `<home>/project`.
   - Doctor exits 1 on any ✗ or ! (`bin/nana-setup.mjs:325-335`). It exits 0 with `·` rows.
   - On win32 about 15 rows are "skipped" notes (`doctor.mjs:296`, `:335`, `:360`, `:382`, `:585-588`, `:619`). So the check reads the exit status and also each `·` row:
     - a row on the platform's note list passes;
     - a row on the known-red list prints XFAIL only when its failure code is `note-row` and the run is before the entry's expiry (R-1080);
     - any other row prints FAIL.
   - The folder is neutral because doctor warns about project trust when the folder holds `.pi/nana-pack.json` with no trust record (`doctor.mjs:430-437`), and the checkout tracks that file.
9. **Report and cleanup.**
   - The first lines name the resolved paths: the Git Bash `bash.exe` (win32), the `pi` the check launches, and `node`. A runner-image change then shows as a path change, not a hook failure.
   - When every line is PASS or XFAIL, the check deletes the home.
   - On any FAIL it keeps the home and prints its path, the `hooks` block of its `settings.json`, and the last `pull.log` record (`nana-knowledge/lib/paths.ts:25`).
   - CI wipes `runner.temp` at job end, so the printed lines are the evidence. Chosen over an artifact upload: the printed lines are enough to triage and need no extra action.

**CI job.** The job goes before `suite:`. That keeps byte-identical the slices that `ci-workflow.test.mjs:32-33` cuts (from `suite:` to `release:`, and from `release:` to the end).
- A job placed after `release` would fall into the release slice that R-996 scans (`:52-54`).
- The `pi --version` before `npm test` order still holds (`:30`).
- `PI_VERSION` stays the first match for R-951 (`packages/nana-setup/tests/fresh-machine.test.mjs:28`).

```yaml
  install-check:
    strategy:
      fail-fast: false
      matrix:
        os: [macos-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    # chosen 2026-10-12: a hung npm or pi call must not hold the release for the 360-minute default; first green runs' durations recorded
    timeout-minutes: 20
    defaults:
      run:
        shell: bash
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm i -g --ignore-scripts @earendil-works/pi-coding-agent@${PI_VERSION}
      - name: Verify pi version
        run: test "$(pi --version)" = "${PI_VERSION}"
      - name: Install check
        env:
          TEMP: ${{ runner.temp }}
          TMP: ${{ runner.temp }}
        run: node packages/nana-setup/bin/install-check.mjs
```

- **The pi install line** is the checklist's own command: `PI_INSTALL_HINT` (`steps.mjs:815`) plus the version. It is not the suite's `npm i -g` (`ci.yml:38`).
  - `--ignore-scripts` skips the postinstall scripts of pi's dependencies esbuild and protobufjs. INFERRED low risk. Step 6 loads extensions, so a pi-session FAIL considers this cause first.
- **TEMP and TMP** put the check's temporary home on the checkout's drive, with no 8.3 name. That matches the owner's layout.
  - `os.tmpdir()` reads TEMP first on win32 (Node docs).
  - The setting is harmless on macOS, where `os.tmpdir()` reads TMPDIR.
  - Children still get `<home>/tmp` (step 3).
- **The job leaves out** uv, pnpm, copier and `fetch-depth: 0`. Install needs none of them, and doctor's release status row is only a note.
- **No `continue-on-error`**, at job or step level, and no `|| true`. Both legs block.
- **The release job** changes to `needs: [suite, install-check]` (R-597).

**Blocking, and the known-red list.**
- **Both legs block from day one.** A failure on either leg fails the workflow and skips the release.
- **Known-red items.** Items Windows cannot pass today are on the sealed win32 known-red list (R-1070).
  - A listed item prints XFAIL and does not fail the leg.
  - A listed item that passes prints FAIL with "remove it from the known-red list".
  - So the list can only shrink, and an unlisted regression turns the leg red at once.
- **The 2026-10-24 signal** is the `install-check (windows-latest)` job green on a push to main with an empty win32 list.
  - Read the job conclusion from `gh api repos/j-wanger/nana-pi/actions/runs/<id>/jobs`, never the run conclusion.
  - Run 38262900510 concluded `success` while `suite (windows-latest)` failed.
- **Reconciling with cc-hooks-windows.**
  - If cc-hooks-windows lands first, this lane merges main before its final round. The seat then seals the list from that Windows run.
  - If this lane lands first, cc's next merge of main turns cc's Windows install-check leg red until the list shrinks. That edit is outside cc's declared scope (cc CHANGE:408), so it goes to the owner (Open, below).
- **Cost.** A Windows runner fault now holds a template tag until someone reruns the job.
- **Decision: gate the release (seat).**
  - Main is unprotected, with no required checks (`gh api repos/j-wanger/nana-pi/branches/main`, 2026-10-12).
  - `nana-land` reads no CI result (grep of `packages/nana-pack/bin/nana-land.mjs` for `gh run`, `gh pr` and `conclusion`).
  - So the release is the only thing CI can hold. Without it, "blocking" would block nothing.
  - Network dependence is not new: both existing jobs already install pi from npm (`ci.yml:38`, `:63`).
  - The cost is R-597's rewording, two regex pins and the README and AGENTS lines (section 4).
  - It is reversible in one line. A reviewer may push back.

**Overlap with cc-hooks-windows.**

| | Its `hooks-win32-exec.test.mjs` (R-1058, R-1063, R-1064) | This check |
|---|---|---|
| Where it runs | Inside the suite, Windows leg only | Its own job, on macOS and Windows |
| Install | `--home` | Real-home mode in a temporary home |
| pi | Stubbed, pi-subagents seeded | Real pi registration, a real pi-subagents install, one pi session |
| Paths | Hostile paths and legacy-entry migration | Plain paths only |
| Verifier | PowerShell lexing cases (R-1062) and a pipefail dialect case | One hit and one miss per tool |
| Doctor | Run with `withPiStub` | Run with the real pi, marks parsed |

The two files carry their own copies of the samples. Sharing them is rejected (below), and the duplication is a residual.

**Rejected.**
- **A step in the `suite` job.** On Windows `npm test` fails first, so later steps never run. Any non-blocking posture would then have to cover the whole leg, which lane 6 keeps red.
- **A non-blocking Windows leg with a later flip (the first draft).**
  - Run conclusions read `success` while a `continue-on-error` leg fails (run 38262900510), so "green on both" would read green today.
  - The flip also depended on someone counting passes.
- **`--home` plus a library call to `stepPiRegister` with `isRealHome` forced**, as `tests/pi-registration.test.mjs:176-177` does with a fake pi. That proves a path no user runs.
- **Seeding the pi-subagents `package.json`.** It would forge the very thing doctor checks.
- **Seeding pi's journal to make the adoption hook print.** It would copy the pack's journal format into the check. The real pi session in step 6 writes it.
- **The `NANA_TEST_TEMP_ROOTS` seam for adoption.** It is a test seam. It warns on stderr (`nana-adoption.mjs:40-41`) and journals an override (`nana-handoff.ts:308-312`). Redirecting the children's temporary folder keeps the production path.
- **Sharing samples with cc-hooks-windows (the first draft).**
  - The cc brief names no import from this lane.
  - Its test file is owned by cc.
  - Reopening an accepted plan needs a named fail-open bug (`HANDOFF.md:18`).
- **Installing Claude Code on the runner.** It is absent from both images (the Windows 2025 image lists none), and a session needs an account login. INFERRED: a headless login is not practical, and it would put a secret in CI.
- **Redirecting APPDATA and LOCALAPPDATA on win32.** npm, pi and Git read machine settings from there. Redirecting them would move the run further from the owner's machine. The npm cache is redirected on its own instead.

**Declared limits and residuals.**
- **Claude Code itself never runs.** The check simulates the dispatch the docs describe. The real dispatch stays with the owner's machine check in cc-hooks-windows (cc CHANGE:548-564). That covers the workspace trust dialog, the PATH Claude Code passes, the `node` it finds, PowerShell routing and `${CLAUDE_PROJECT_DIR}` substitution in `args`.
- **pi seat: registration plus one session with no prompt.** The pack's prompt-time hooks (gate, objective, knowledge pull, post-edit) are not exercised. nana-knowledge's load inside pi is unproven. Probe (f) held, so the session row stands.
- **Children's temporary folder is inside the home.** This is a chosen deviation from a real machine. It keeps the fixture project from being a temporary root.
  - POSIX also treats `/tmp` as a temporary root. On Linux the home would sit under `/tmp`, which this lane does not handle. There is no Linux leg.
- **Writes outside the home on win32 (INFERRED none from nana).** APPDATA and LOCALAPPDATA are not redirected, and machine-level npm and Git config are read. Acceptance (b) runs on macOS only. The owner's Windows run carries this residual.
- **Plain paths only.** Hostile characters belong to cc-hooks-windows R-1058.
- **No cross-drive layout.** A home and a checkout on different Windows drives are not covered, because CI puts them on the same drive on purpose.
- **No Windows checklist.** The checklist the check follows is "Fresh machine (macOS), in order" (`README.md:118`). Step 1 is `xcode-select` and step 5 is `.zprofile`.
  - On win32 the check runs the same steps without the PATH step, in Git Bash rather than the owner's terminal.
  - The new README section states those steps. No fresh-machine Windows checklist is written here.
- **Network.** pi and pi-subagents come from npm. An outage shows red, and nothing retries automatically. Chosen: a retry hides intermittent faults, and a rerun costs minutes.
- **Blocking acts only after land.** The release gate runs only on pushes to main (`ci.yml:45`). Draft-PR runs cannot exercise it before land. A macOS regression from another lane lands first, and only the release is held afterwards.
- **CRLF.** The check uses the default Windows checkout as it comes. INFERRED: the owner's clone has the same default.
- **Doctor run from the checkout (finding, confirmed by code, carried).**
  - Checklist step 8 says to run doctor "from `~/nana-pi`; expect `all good`" (`README.md:127`).
  - `doctor.mjs:431-437` adds `!` whenever the folder holds `.pi/nana-pack.json` with no trust record.
  - The checkout tracks that file (`git ls-files .pi`), install records no trust, and `bin/nana-setup.mjs:335` then exits 1.
  - So step 8 fails on every fresh machine. Probe (g) records it on a run. This lane does not fix it.
- **Unverified Windows PASS lines (INFERRED).**
  - Doctor may not exit 0 on Windows today: registration stores a backslash path relative to the agent folder, and no runner has run that.
  - The knowledge entry may not pass: the knowledge tests that fail on Windows fail for test-portability reasons (`URL.pathname`, `/` suffixes), so they are no evidence either way.
- **Duplicated samples.** This check and cc's `hooks-win32-exec.test.mjs` carry separate samples. A drift between them is caught by neither.
- **Product report.** The stored assessments for FEAT-015 and FEAT-019 will read "out of date" after the land. Refreshing them is not in this lane.
- **The claim most likely to be wrong:** that a temporary HOME and USERPROFILE make `windows-latest` behave like a fresh Windows machine.
  - npm, pi and git still read machine-level settings, for example the image's npm prefix `C:\npm\prefix` and Git's system config.
  - So the Windows leg can pass where the owner's machine fails, or fail for runner reasons. The owner's own Windows run is the only test of this claim.

**Decided by the seat (2026-10-12), with the reason.**
- The 2026-10-24 "done" = this check green on both legs on a push to main with an empty win32 known-red list, PLUS the owner's own run of it on his Windows machine and his Claude Code machine check (cc CHANGE:548-564). The owner accepted on 2026-10-11 that his machine, not a VM or a hosted runner, is the proof for Windows. R-1079 is part of it (probe (f) held, 2026-10-12).
- Landing order: `cc-hooks-windows` lands first (it is building; this lane is planning). Whichever lane lands second merges main and edits the win32 known-red list in that merge; the seat owns merges, so no lane's scope has to stretch.
- Checklist step 8 (doctor's `!` on project trust on every fresh machine) goes to the queued small process lane, not this one.

**Open for the owner** (HANDOFF line, written by the seat):
- Should every lane that touches nana-setup or the hooks run this check locally on macOS as part of its land checklist? Main is unprotected and `nana-land` reads no CI result, so today a failing check is seen only after the land.

## 4. Scope

**In.**
- New code:
  - `packages/nana-setup/lib/install-check-config.mjs`
  - `packages/nana-setup/lib/install-check.mjs`
  - `packages/nana-setup/bin/install-check.mjs`
- A new test, `packages/nana-setup/tests/install-check.test.mjs`. It is pure, with an injected spawn, and runs on every suite leg.
- `.github/workflows/ci.yml`: the new job and the release `needs` line.
- `packages/nana-pack/tests/ci-workflow.test.mjs`:
  - new checks over the slice from `^  install-check:` to `^  suite:`. They check the exact `os` list, `timeout-minutes: 20`, zero `continue-on-error:` lines, the exact `run: node packages/nana-setup/bin/install-check.mjs` line, no `|| true` and the `--ignore-scripts` pi line;
  - the R-597 pin at `:25` and the R-1032 pin at `:80`.
- `REQUIREMENTS.md`, `docs/requirements-tree.md` (regenerated) and the leaf total in `requirements-tree.test.mjs` (1,056 today).
- The code map.
- A short "Install check" section in `packages/nana-setup/README.md`. It names the command, what it proves and what it does not prove, and the steps it follows on win32. The readme check keeps it honest.
- Stale release sentences:
  - root `README.md:25`, `:177` and `:210` ("after the blocking macOS suite leg passes");
  - `AGENTS.md:39` ("CI releases after a green suite on main"). `CLAUDE.md` links to it.
- `HANDOFF.md` and the session entry, written by the seat before the final review. The `:59` line gets a qualifier: CI green is necessary, not sufficient. The Open lines go in too.

**NOT.**
- The hooks themselves and how install wires them, including `settings.mjs`, `steps.mjs`, `doctor.mjs`, `verifier-hook.mjs` and `pipe-guard.mjs` (cc-hooks-windows).
- cc's `hooks-win32-exec.test.mjs` and its samples.
- Hostile paths, legacy-entry migration and PowerShell lexing (cc-hooks-windows R-1058, R-1062).
- The desk, which is frozen.
- Test portability and the suite's Windows leg posture (lane 6). R-1031 and R-1032 keep their text.
- The Support line (R-684), which cc-hooks-windows rewords.
- A Linux leg; uninstall; the owner's real-home install.
- A fresh-machine Windows checklist.
- Fixing the doctor-from-checkout finding.
- pi extension behaviour inside a prompt.

## 5. Verification

- **Seat acceptance script**, written and red before the build: `docs/reviews/install-check-2026-10-12/acceptance.mjs`, run on macOS.
  - (a) The command exists and exits 0 from a clean worktree. It prints a PASS line, and no XFAIL, for each of these labels: install, pi-subagents, `pi list` nana-pack, `pi list` nana-knowledge, the pi session (R-1079), the hook set, the five hooks and doctor.
  - (b) The real home is untouched. A listing with sizes and modification times of the following is identical before and after the run:
    - `~/.claude/settings.json`, `~/.claude/hooks`, `~/.claude/projects` and `~/.claude/nana-memory`;
    - `~/.pi/agent/settings.json`, `~/.pi/agent/npm`, `~/.pi/agent/nana-objective.md`, `~/.pi/agent/nana-pack.json` and the pack's journal;
    - `~/.local/bin`;
    - the knowledge index.

    Also, no `~/.claude/projects` entry names the temporary home.
  - (c) A hostile caller environment changes nothing.
    - The caller sets `NANA_ROLE=worker`, `NANA_SETUP_PLATFORM=win32`, `NANA_HANDOFF=off` and `NANA_TEST_TEMP_ROOTS=""`.
    - It also points `PI_CODING_AGENT_DIR`, `CLAUDE_CONFIG_DIR`, `NANA_KNOWLEDGE_HOME` and `npm_config_cache` each at an empty folder.
    - The run still passes every line, and those folders stay empty.
  - (d) Sensitivity. Each fault goes in its own scratch worktree. The check must exit non-zero and name the matching item:
    1. the verifier entry dropped from `desiredHooks`;
    2. `stepPiRegister` always returning SKIPPED;
    3. the shared-memory hook's import broken;
    4. the knowledge entry losing its `hook` word.
  - (e) `ci.yml` has the job shape shown in section 3, and the release job needs both jobs.
  - (f) Probe — RUN by the seat 2026-10-12 on macOS and HELD (§3 step 6): a model-free session lists `reload-runtime` and, with `NANA_TEST_TEMP_ROOTS` empty, writes `directory_unadopted` for the project. R-1079 and R-1076's full adoption clause stand.
  - (g) Probe, recorded only. Run doctor from the checkout root against the temporary home. It records on a run the finding the code already confirms.
- **Pure cases on every leg** (`install-check.test.mjs`):
  - **Shape and mapping:**
    - an exact set passes;
    - a missing row fails;
    - a duplicate entry fails;
    - an unmapped extra entry fails;
    - a missing `type`, `async: true`, a `shell` field, non-string `args` and a missing or non-5 `timeout` each fail;
    - a group without the `{matcher?, hooks: [...]}` nesting fails.
  - **Matchers:**
    - `*`, `""` and an omitted matcher admit everything;
    - `Bash, PowerShell` admits both tools;
    - `^Bash$` admits `Bash`;
    - `NotBash` does not admit `Bash`;
    - a `resume` SessionStart matcher fails;
    - win32 requires `PowerShell` in the verifier matcher.
  - **Dispatch:**
    - `args` runs as exec form with no shell;
    - no `args` runs `/bin/sh -c` on POSIX and Git Bash `bash -c` on win32;
    - Git Bash is derived from `git.exe` in `cmd`, `bin` or `mingw64\bin`, and `System32\bash.exe` is refused;
    - the working folder and `CLAUDE_PROJECT_DIR` are set;
    - the SessionStart spawns overlap.
  - **Timeout:** an `ETIMEDOUT` result is a FAIL, and the duration is printed.
  - **Outputs:**
    - the objective failure marker fails, even though it starts with `[nana:objective]`;
    - a missing token fails;
    - `ADOPTION UNAVAILABLE` fails, and so does adoption output that does not name the project;
    - a missing `- [` line fails, and so does a link at another key or with another target;
    - a 10,001-character stdout fails;
    - a verifier `allow`, a missing `hookEventName`, malformed JSON or two JSON lines fail;
    - an empty knowledge output fails;
    - a win32 `~\notes\docs\install-check.md` pointer matches by file name.
  - **Environment:**
    - the override list and the caller's `npm_config_*` variables are removed, without case on win32;
    - HOME, USERPROFILE, TMPDIR, TEMP, TMP and `npm_config_cache` are set;
    - a recording spawn shows the same sanitized environment on EVERY child: both fixture `git init` runs, Git Bash discovery, install, `pi install npm:…`, `pi list`, the pi session, each of the five hooks and doctor (R-1084).
  - **Install command line:** it carries no override flag.
  - **Doctor:**
    - exit 1 with only ✓ and ! marks is a FAIL;
    - exit 0 with a `·` row off the note list is a FAIL;
    - a known-red `·` row is an XFAIL.
  - **`pi list` parsing:**
    - colour codes are stripped;
    - a relative `../../` source still matches;
    - `D:\` matches `d:\` on win32;
    - `(filtered)` fails.
  - **pi launch:** on win32, `pi list`, `pi install npm:` and the session go through `findPi` and `winCommand`.
  - **Platform:** `NANA_SETUP_PLATFORM` is ignored.
  - **Reporting:**
    - any FAIL gives a non-zero exit;
    - a listed item that fails with its sealed code before its expiry prints XFAIL (R-1080);
    - a listed item that fails with a DIFFERENT code prints FAIL (the wrong-code case);
    - a listed item that fails on or after its expiry prints FAIL (the expired case, with an injected clock);
    - a listed item that passes prints FAIL;
    - the first lines name the resolved Git Bash (win32), pi and node paths.
  - **Dispatch form (R-1082):** a shell-form entry under forced win32 fails; an exec-form entry under forced darwin fails; each row's sealed form is read from the table, never inferred from `args`.
  - **Pins:** each of these is pinned by one test naming its row:
    - the hook table with its form columns (R-1074, R-1082) and the allowed keys (R-1074);
    - the override list (R-1071);
    - the known-red list with each entry's code and expiry (R-1070, R-1080);
    - the doctor note list (R-1081).
- **Mutation pairs.** Each one breaks the check's own code, never an assertion. The seat records which test turns red.
  1. Ignore `args` and always use a shell: the exec-form case fails.
  2. Split a shell-form command on spaces with no shell: the shell-form case fails.
  3. Use `bash` instead of `/bin/sh` on POSIX: the shell-binary case fails.
  4. Drop the spawn timeout: the slow-hook case fails. Accept a missing `timeout`: the missing-timeout case fails.
  5. Judge by exit status only: the objective-marker and empty-knowledge cases fail.
  6. Treat a missing row as SKIP: the missing-row case fails.
  7. Ignore unmapped entries: the extra-entry case fails.
  8. Make the matcher rule wrong in either direction:
     - use a substring match: the `NotBash` case fails;
     - treat every matcher as exact names: the `^Bash$` case fails;
     - treat every matcher as a regex: the `Bash, PowerShell` case fails.
  9. Drop one variable from the removal list: the environment case fails. Retune the list: its pin naming R-1071 fails.
  10. Pass `--home` to install: the command-line case fails.
  11. Read doctor's exit status alone: the case where exit 0 passes a `·` row off the note list fails.
  12. Compare `pi list` paths as raw strings: the path-form case fails. Accept `(filtered)`: the filtered case fails.
  13. Honour `NANA_SETUP_PLATFORM`: the forced-platform case fails.
  14. Exit 0 with a FAIL line: the reporting case fails.
  15. Import `desiredHooks` as the table: acceptance (d)1 goes green, so the acceptance script fails.
  16. Treat a listed item that passes as PASS: the unexpected-pass case fails.
  17. Drop the `hookEventName` check: the missing-`hookEventName` case fails.
  18. Run SessionStart entries one at a time: the overlap case fails.
  19. Drop the stdout cap: the 10,001-character case fails.
  20. Accept `async` or a missing `type`: those shape cases fail.
  21. Leave children's TMPDIR, TEMP and TMP unset: the environment case fails. On macOS, acceptance (a)'s adoption line also fails.
  22. Spawn pi directly on win32: the pi-launch case fails.
  23. In `ci.yml`, each of the following fails its own check:
      - drop `windows-latest` (R-1078);
      - add `continue-on-error` at job or step level, or `|| true` on the run line (R-1078);
      - drop `timeout-minutes` (R-1078);
      - drop `install-check` from the release job's `needs` (R-597);
      - use plain `npm i -g` without `--ignore-scripts` (R-1078).
  24. XFAIL any failure of a listed item whatever its code: the wrong-code case fails.
  25. Ignore the expiry: the expired case fails.
  26. Skip the form check (R-1082): the shell-on-win32 and exec-on-darwin cases fail.
  27. Spawn a fixture `git init` directly instead of through the shared spawn: the recording-spawn case fails (R-1084).
- **Red-first CI runs.** The seat records each run ID in the evidence of R-1070 and R-1078.
  - **Windows baseline.** This is the lane's first draft-PR run, on main without cc.
    - `install-check (windows-latest)` should conclude success.
    - It should show XFAIL lines for exactly the win32 known-red list: the hook set, objective, adoption, shared memory, verifier `Bash`, verifier `PowerShell`, and the listed doctor rows.
    - It should show PASS lines for install, pi-subagents, both `pi list` lines, the pi session, the knowledge entry and doctor's exit. INFERRED for doctor, the knowledge entry, `pi list` and the session on win32.
    - Any other FAIL is triaged and recorded before land: fixed if it is in scope, carried if not.
  - **Windows sensitivity.** A throwaway branch empties the win32 list.
    - The leg turns red, with FAIL lines for each item that was listed.
    - The PR is closed and the branch deleted.
  - **Windows ahead of land.** A throwaway branch merges this lane's tip with cc-hooks-windows's tip, opened as a draft PR.
    - Listed items that now pass print FAIL ("remove it from the known-red list"). That proves the tripwire.
    - The same branch with the list emptied shows whether Windows is green before 2026-10-24.
    - Nothing from it lands.
  - **macOS.** A throwaway branch carries one installer fault: the verifier entry removed from `desiredHooks`.
    - Its draft-PR run should show the `install-check (macos-latest)` job red, naming the verifier. The seat reads this from the jobs API.
    - `suite (macos-latest)` also turns red on this fault (`install.test.mjs:131-132`, `verifier-pipe.test.mjs:34-37`). So the workflow's failure is not credited to install-check.
    - The PR is closed and the branch deleted. Nothing from it lands.
- **Before land:**
  - `npm run test:locked` passes on macOS;
  - `map:check` and `readme:check` pass;
  - the lane's final draft-PR run, with main merged in, is green on macOS and green-with-only-listed-XFAILs on Windows;
  - the known-red list is sealed from that run.
- **After land:**
  - The first push to main shows release running after both jobs.
  - The seat reads the `install-check (windows-latest)` job conclusion and the list's size from the jobs API on each push to main. It never reads the run conclusion.
  - The owner runs `node packages/nana-setup/bin/install-check.mjs` once on his Windows machine. That run is the closest bridge from the runner to his machine.
    - Acceptance (b) shows on macOS that the run leaves the real home alone.
    - On win32 that claim is INFERRED beyond nana, pi, Claude Code and npm-cache state (section 3).
    - This run is part of "done" (seat decision, §3, after the owner's 2026-10-11 acceptance that his machine is the proof).

## Seat fact-check (2026-10-12)

*Two read-only checks reviewed the first draft. One checked the code, the runs and the repo state. The other checked the claims and the Claude Code hooks docs (read 2026-10-12). The seat re-read the cited cc lane files, the doctor, adoption, handoff and shared-memory code, pi 1.0.2's list and RPC code and docs, and the hooks docs. Changes:*

- **cc-hooks-windows state.**
  - Its tip is `2818e03`, not `71757f4` at plan stage. Sol plan r3 says LAND 100/100, build brief 1 is issued, and Sonnet 5.5 is building.
  - The cc lane holds R-1050 to R-1069.
  - cc CHANGE `:541-557` is now `:548-564`.
  - The PowerShell hit is now cc's `npm test | Select-Object -Last 5; git commit -m x` (`:513`). The draft's string was not in that file.
- **Windows blocking.** The non-blocking Windows leg and its later flip are replaced by a blocking leg with a sealed known-red list (XFAIL; a listed pass is a FAIL). R-1070 carries the list. R-1078 forbids `continue-on-error`.
  - The draft R-1079 (provisional non-blocking row) is dropped before it ever landed. Its ID now holds the pi session row.
  - The 2026-10-24 signal is read from the job conclusion, never the run conclusion.
- **Overclaim.**
  - The title and outcome 3 now say "simulation of the documented dispatch".
  - Section 1 states that CI green is necessary, not sufficient, and lists what "done" also needs. HANDOFF `:59` gets the qualifier.
- **Adoption.** The draft's adoption PASS could not fail: temporary roots count as adopted (`adoption.mjs:38-43`, `:124`).
  - Children's TMPDIR, TEMP and TMP now point at `<home>/tmp`.
  - A real pi session (new R-1079; probe (f) run 2026-10-12 and held) writes the journal line the adoption entry must name.
  - `NANA_TEST_TEMP_ROOTS` is cleared rather than used. This settles a conflict between the two checks: the code check said clear it, and the claims check offered it as one option.
- **Hook-set shape (R-1074).** The check now validates:
  - the nesting;
  - `type`;
  - a sealed allowed-key set that rejects `shell`, `async`, `asyncRewake`, `onFailure`, `if` and `once`;
  - `args` as strings;
  - a sealed `timeout: 5` per row, which removes the `NaN` timeout;
  - SessionStart source `startup`, with no matcher on UserPromptSubmit;
  - the documented three-path matcher rule, replacing "`|`-separated exact names".
- **Dispatch (R-1075).**
  - The SessionStart entries start together.
  - Each output is capped at 10,000 characters (R-1076, R-1077).
  - Git Bash is derived from `cmd`, `bin` or `mingw64\bin`, never `System32\bash.exe`.
- **Verifier (R-1077).** It asserts `hookEventName` `PreToolUse`.
- **Shared memory (R-1076).** The sample's `transcript_path` now sits under `<home>/.claude/projects/install-check/`. The link is asserted at that exact key and target.
- **Doctor (R-1072).**
  - `·` rows are parsed against a sealed per-platform note list, because doctor exits 0 with about 15 skipped rows on win32.
  - The draft's `--home` row claims are stated precisely (`:610` partial, `:634`).
- **pi on win32 in the check.** `pi install npm:`, `pi list` and the session launch through `findPi` and `winCommand`, from `<home>/project`.
- **`pi list`.** `(filtered)` is a FAIL.
- **Environment (R-1071).**
  - One environment serves every spawn.
  - The override list adds `NANA_TEST_TEMP_ROOTS`, `NANA_HANDOFF` and caller `npm_config_*` variables.
  - `PI_CODING_AGENT_DIR`'s provenance is corrected to `agent-dir.mjs:68`.
  - `npm_config_cache` points into the home.
- **"Writes nothing outside that home."** The claim is narrowed to nana, pi, Claude Code and npm-cache state. It is marked INFERRED on win32, where APPDATA and LOCALAPPDATA are not redirected.
- **CI.**
  - `timeout-minutes: 20` (chosen) and per-spawn limits (chosen) are added.
  - New pins cover the run line, `continue-on-error` and `|| true`.
  - On FAIL the check prints the settings hooks block and the last `pull.log` record, because `runner.temp` is wiped.
  - The `--ignore-scripts` effect is stated.
- **macOS red-first proof.** It now claims only the install-check job's own conclusion. The verifier fault also turns the macOS suite leg red.
- **Windows red-first expectation.** It now lists the hook-set line, as XFAIL. Doctor, knowledge, `pi list` and session PASS lines on win32 are marked INFERRED. A merged throwaway branch with cc's tip is added, to show Windows before 2026-10-24.
- **Sample sharing with cc.** The draft's promise is dropped (rejected). The duplication is a residual.
- **Row placement.** "beside R-950" and "beside R-323" are dropped. Those rows sit in FEAT-013.
- **Knowledge sample constraints.** The prompt needs at least 12 characters and 2 meaningful tokens, the token matches `[a-z0-9_]`, and the note is matched by file name on win32. The 1,500 ms internal budget is noted.
- **INFERRED marks dropped**, per the Node docs: `os.tmpdir()` reads TEMP first on win32, and `os.homedir()` reads USERPROFILE.
- **Doctor-from-checkout finding.** It moves from INFERRED to confirmed by code. It is carried as Open for the owner.
- **Why section.**
  - `install.test.mjs:322` checks exit status for all three SessionStart commands.
  - The prior art at `verifier-pipe.test.mjs:34-37` is cited.
- **Scope.** It adds root `README.md:25`, `:177`, `:210`, `AGENTS.md:39`, and the README statement of the win32 steps (no Windows checklist, a declared gap).
- **Open for the owner.** Four lines are added: the "done" definition, the cross-lane edit to the known-red list, checklist step 8, and a local land-checklist run.
- **Process note.** The code check wrote one scratchpad copy of cc CHANGE.md at `71757f4` (`/private/tmp/claude-501/-Users-example-nana-pi/dea1c010-278e-4392-a90f-df947a3a8b71/scratchpad/cc-change-71757f4.md`). It is outside the repo. No repo file changed.
- 2026-10-12, after sol plan r1 (LAND-WITH-FIXES 82/100): each known-red entry carries a sealed expected-failure code and the 2026-10-24 expiry (R-1080), with wrong-reason and expired-entry test cases; the sealed hook table carries the dispatch form per platform (R-1082); probe (f) was run and HELD, with `NANA_TEST_TEMP_ROOTS` set empty for the pi session, so R-1079 stays and the adoption fallback is gone; one spawn function passes the sanitized environment to every child, git and Git Bash discovery included (R-1084), with a recording-spawn test over all of them; R-1072, R-1077 and R-1079 now carry one `shall` each (R-1081, R-1083 split out); the stale "open" sentence on the owner's Windows run is resolved; the check prints the resolved Git Bash and pi paths at its start, so a runner-image change is distinguishable from a hook failure; and the pi-coverage residual is explicit: registration and one model-free session do not exercise pi's prompt-time objective, knowledge, gate or post-edit behaviour. New IDs R-1080–R-1084 extend this lane's range (R-1080–R-1089 reserved; no other lane holds them).
- 2026-10-12, after sol plan r2 (SEND-BACK 78/100): the verification and design text now carry R-1080's code-and-expiry rule (wrong-code and expired cases), the hook table carries per-platform form columns with shape cases (R-1082), the recording-spawn test enumerates every child (R-1084), the front "done" text states the settled definition, every probe (f) mention states the held result, the resolved paths are in the report and its tests, and the doctor, known-red and knowledge references name R-1081, R-1080 and R-1083.
