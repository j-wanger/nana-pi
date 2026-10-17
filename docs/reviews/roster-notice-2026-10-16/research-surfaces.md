# Research: the two session-start surfaces and the test census (main 2dbc817, 2026-10-16, read-only)

Scope: re-verify `../research-startup.md` (written at e451c90) for the two surfaces, then list every existing test and row that a new Claude Code SessionStart hook and a new pi extension would turn red or leave unpinned. The rulings file is out of scope (later lane).

Legend. A bare `file:line` is the repo at 2dbc817. `hooks.md:N` is the saved Claude Code hooks docs copy (scratchpad `hooks.md`, saved 2026-10-12). `pi …:N` is installed pi 1.0.2 under `~/.local/lib/node_modules/@earendil-works/pi-coding-agent/`. `cc-strings:N` is `strings` of the installed Claude Code 2.1.299 binary, saved beside this file as `cc-strings.txt`. "Ran" = run on this Mac today. INFERRED = read or reasoned, not run.

Stakes: medium, reversible. A wrong census costs one more build round, not a broken machine.

How the reds were checked (Ran). The repo stayed untouched throughout (Ran: `git status --short` is empty afterwards).
1. `probe-installcheck.mjs` adds a fleet row to install-check's `HOOKS` table in memory only, then runs `install-check.test.mjs`. Output: `probe-installcheck.out`.
2. `git archive 2dbc817` was unpacked to `copy/` in this folder. In that copy, a fleet row was added to `desiredHooks`, the fleet name was added to `steps.HOOKS`, and an empty hook file was created.
3. Later, again in the copy only, the state-manifest row was added, two tokens were added to the shared table, and an extension stub was created. Single test files ran there with `TMPDIR` inside this folder.
4. Outputs: `*.out` here.
5. A baseline run on an unmodified copy is in `base-*.out`. It was not run for every file.

## 0. What changed since e451c90

- regroup-shares landed: 15 commits, and none touches `packages/nana-setup/`, a hook, an extension or the roster (Ran: `git diff --stat e451c90 2dbc817`). So every setup and pack line the research cites still holds, apart from the shifts noted below.
- Main's highest row is R-1183; feat/regroup holds R-1170 to R-1180 and R-1184 (Ran: grep of both ledgers). The leaf total is now 1,139 (`packages/nana-pack/tests/requirements-tree.test.mjs:40,55`).
- In flight now: `regroup` only. `t3-land-b` has no worktree (Ran: `git for-each-ref --no-merged=main … refs/heads/feat/`).
- The probe now takes 0.09–0.10 s wall, with git at 29–49 ms. The research measured 0.05 s and 19 ms (Ran: the probe three times).
- HANDOFF residual L5 (broken hook symlink exits 127) is now `HANDOFF.md:39`, not `:37`.

## 1. Claude Code SessionStart output contract

| # | Fact | Source |
|---|---|---|
| 1 | Plain SessionStart stdout goes into Claude's context only. It is not shown to the user. | hooks.md:810, :1269 |
| 2 | To show a line to the user, return `systemMessage` ("Warning message shown to the user"). The SessionStart section never says it drops `systemMessage`, and it suggests it for resume-cost reports. | hooks.md:726, :1004, :1013, :1219 |
| 3 | `additionalContext` must sit inside `hookSpecificOutput` beside `hookEventName: "SessionStart"`. | hooks.md:1006, :1061, :1115, :1251, :1261-1263 |
| 4 | In 2.1.299, a top-level `additionalContext` is dropped with a warning: "Did you mean hookSpecificOutput.additionalContext (with a hookEventName)?" and "Hook JSON output had unrecognized keys (ignored)". | Ran: `strings` on the binary; cc-strings:174964, :212115-212116 |
| 5 | Stdout must hold only one JSON object. Other text makes the output plain text or a parse failure. A failed parse is a non-blocking error, and its stdout is not added as context. | hooks.md:812-819, :994 |
| 6 | Each string field is capped at 10,000 characters. | hooks.md:996-1000 |
| 7 | The sources are startup, resume, clear, compact and fork. Before 2.1.214, fork reported resume. The installed version is 2.1.299. | hooks.md:1190-1194, :1196; Ran: `claude --version` |
| 8 | Matching hooks run in parallel. At launch, SessionStart hooks run in the background, and the first reply waits for them. If `/clear` runs while they are still going, their output is thrown away. | hooks.md:412, :1198-1200 |
| 9 | Several hooks may each return `additionalContext`, and Claude receives every value. | hooks.md:1080 |
| 10 | In `-p` mode, hooks still run. `systemMessage` reaches stream-json output as an `SDKInformationalMessage`. | hooks.md:1013, :1252 |
| 11 | The binary turns a hook's `systemMessage` into a `hook_system_message` attachment tagged with the event. The code is minified, so this reading is INFERRED. | Ran: strings |
| 12 | Subagents have their own event, SubagentStart. INFERRED: SessionStart does not fire for a Claude subagent. | hooks.md:51 |

- All three existing SessionStart hooks print plain text. The objective and adoption hooks print through `packages/nana-setup/lib/hook-producer.mjs:33-40`, and shared memory prints at `packages/nana-setup/claude/hooks/nana-shared-memory.mjs:87-89`. Ran: the live `~/.claude/settings.json` has one matcher-less SessionStart group holding these three. So research §2 holds: only a new hook can carry a `systemMessage` without changing an existing hook's contract.
- Correction to research §2: the sources table is hooks.md:1190-1194, not :1190-1196.
- Headless builder (INFERRED from fact 10 and memory `reference_claude_cli_headless_isolation.md`): a `claude -p` builder that a pi seat launches would run the fleet hook. The only way out is to launch it with `--setting-sources ''`, which also drops every other hook.
- Not observed: how `systemMessage` looks in the macOS or Windows terminal UI. Running `claude` here would write under `~/.claude`, which this task forbids.

## 2. nana-setup wiring: what a new hook must touch

| # | Point | Where | If missed |
|---|---|---|---|
| 1 | `desiredHooks` row | `packages/nana-setup/lib/settings.mjs:189-228`. `nodeHook` (:192-200) writes shell form from `hooksDir` off win32, and exec form from the checkout on win32, with timeout 5. The row's `statusMessage` is the installer's identity key (:367-373). | No settings entry anywhere. |
| 2 | Merge placement | A row with no matcher appends to the first matcher-less group (`settings.mjs:25-26`, `:527-532`). `hasHook` compares `g.matcher === matcher` exactly (`:249-253`). | — |
| 3 | `HOOKS` symlink list | `packages/nana-setup/lib/steps.mjs:44`. The symlink step runs at :103-107. Doctor iterates the list at `doctor.mjs:335-339`: ✓/✗ off win32, a note row on win32. | No `~/.claude/hooks/` link, so the POSIX shell-form entry fails to start. |
| 4 | State manifest | `packages/nana-setup/lib/state-manifest.mjs:58` keeps its own literal list, although it already imports other names from `steps.mjs` (:11). | `uninstall` (`uninstall.mjs:21`) never removes the fleet link. Ran in the copy: `uninstall.test.mjs:253` (R-903, R-905) and `:276` (R-660) both go red. The baseline copy passes 31 of 31. So the manifest row is forced. |
| 5 | Install-check `HOOKS` row | `packages/nana-setup/lib/install-check-config.mjs:10-16`. `mapHookEntries` needs the entry count to equal the row count exactly (`install-check.mjs:49`, `:72-73`). | INFERRED: every real install check (local macOS, CI macOS, CI Windows) prints `FAIL hook set — extra-entry`. |
| 6 | Output assertion | `install-check.mjs:273-281` holds one branch per `shortLabel`. A row without a branch passes on any exit-0 stdout of 10,000 characters or less, empty included (:273). | The row is pinned by nothing. |
| 7 | win32 doctor note | `install-check-config.mjs:33`. On win32, doctor prints `· hook <name>` skipped (`doctor.mjs:337`), and the install check fails any note row off the list (`install-check.mjs:297`). | Windows install check prints `FAIL doctor — note-row`. |
| 8 | Sample input | `SAMPLE_INPUTS.session` has source `startup` (`install-check-config.mjs:37`) and `cwd` = the fixture project (`install-check.mjs:257`). That project is a fresh `git init` (`:188-197`). INFERRED: git 2.50 names the first branch `master`, so there is no `main`. | The fleet assertion must accept the "no main" lanes form. |
| 9 | README | `packages/nana-setup/README.md:37` (hook files) and `:45` (settings). The tests table says "five win32 settings entries" at `:438`. | Doc only. |
| 10 | Doctor settings row | The `desiredHooks` loop at `doctor.mjs:387-411` handles it with no edit. | — |
| 11 | Retired lists | `steps.mjs:45`, `uninstall.mjs:25` and `doctor.mjs:41` list only `.sh` predecessors. | No entry needed. |
| 12 | Count comments | `settings.mjs:171` ("five"), `:181` ("four"), `:416` ("five"); `doctor.mjs:381` ("five"), `:383` ("four"). | Comments only. |
| 13 | Land rule | `AGENTS.md:147`: run `install-check.mjs` on macOS before `nana-land`. | — |

Windows:
- Exec form runs `node <checkout>/packages/nana-setup/claude/hooks/<name>` (`settings.mjs:193-197`). The win32 repair already covers every entry (`settings.mjs:428-431`).
- A no-shell `spawnSync("git")` already runs on the Windows leg (`packages/nana-setup/tests/hooks-win32-exec.test.mjs:44`; that file runs only on Windows, `scripts/test.mjs:166-167`). INFERRED: a hook finds git.exe the same way.
- The Windows CI git version is unknown, so whether it supports `%(worktreepath)` is unknown.

Naming constraint (INFERRED from substring matching): the script name must not be a substring of another entry's text. The matches are at `install-check.mjs:53`, `win32-degrade.test.mjs:104` and `settings-merge.test.mjs:847`. `nana-fleet.mjs` is safe.

R-688 (`REQUIREMENTS.md:720`): "Importing hook logic shall never read stdin." A shared fleet module must read nothing at import.

## 3. pi `session_start` surface

| # | Fact | Source |
|---|---|---|
| 1 | The reasons are startup, reload, new, resume and fork. | pi `dist/core/extensions/types.d.ts:553-559` |
| 2 | `hasUI` is true in TUI and RPC modes and false in json and print. `ctx.mode` tells them apart. | types.d.ts:212-219; pi `docs/extensions.md:248-251`; `docs/rpc-extension-ui.md:25` |
| 3 | The UI calls are `notify(message, "info"\|"warning"\|"error")`, `setStatus(key, text)` and `setWidget(key, lines)`. | types.d.ts:80, :84, :101 |
| 4 | In the TUI, an info notice calls `showStatus`, a warning adds a new "Warning: …" line, and an error calls `showError`. | pi `dist/modes/interactive/interactive-mode.js:2270-2280`, :3735-3739 |
| 5 | `showStatus` replaces the previous status line while that line is still the last chat item. | interactive-mode.js:3060-3078 |
| 6 | After an in-TUI resume, pi itself shows "Resumed session". After a fork it shows "Forked to new session". | interactive-mode.js:4738, :1491, :4547 |
| 7 | In RPC mode, notify writes an `extension_ui_request` with `method: "notify"` to stdout. The desk shows it as a toast. | pi `dist/modes/rpc/rpc-mode.js:87-95`; `apps/desk/public/app.js:1469-1470` |
| 8 | pi awaits each extension's handler in turn. A handler that throws raises an extension error and does not crash pi. | pi `dist/core/extensions/runner.js:813-839` |
| 9 | Footer statuses share one line, sorted by key and cut at the terminal width. | pi `dist/modes/interactive/components/footer.js:252-261` |
| 10 | pi-worker passes `-p` and sets `NANA_ROLE=worker`. pi-review sets `NANA_ROLE=reviewer`, and its documented call passes `-p`. | `packages/nana-pack/bin/pi-worker.mjs:106,110`; `pi-review.mjs:197`; `packages/nana-pack/README.md:153` |
| 11 | The manifests load the whole folder, so a new extension needs no registration. | `package.json:22`; `packages/nana-pack/package.json:15` |
| 12 | Precedents: lifecycle's chip, the objective extension's warning notices, and the handoff extension's info notice. | `nana-lifecycle.ts:47`; `nana-objective.ts:77`; `nana-handoff.ts:420` |

Consequences (all INFERRED from the code read above):
- Facts 5 and 6 together: an info fleet notice raised on an in-TUI resume or fork is likely overwritten by pi's own status line. Any later info notice overwrites it too. A warning, `setStatus` or `setWidget` does not coalesce. The order relative to transcript reload is unobserved.
- Fact 8: a handler that awaits git delays every later `session_start` handler by the git time, worst case the timeout. Firing and not awaiting avoids that, but then the notice lands after the others.
- Install check: its pi step runs `pi --mode rpc --no-session` (`install-check.mjs:239-247`). Because RPC has a UI, the extension would notify there. The step only checks for `reload-runtime` and the journal line, so it stays green.
- The desk's RPC contract test runs pi with `-ne` (`apps/desk/test/pi-rpc-contract.test.mjs:109`), so it is unaffected.
- R-082 (`REQUIREMENTS.md:628`) says "Each config problem shall be reported once per session as a warning". `resolveRoster` refuses whole-file problems too: invalid JSON, or a top level that is not an object (`nana-roster.mjs:98-110`). `config.ts` already warns about those. A fleet warning on a refused roster would therefore report a whole-file problem twice. Roster-only problems are not reported by `config.ts` (Ran: `grep roster lib/config.ts` gives 0 hits).

## 4. Census

### 4.1 Red as soon as the wiring a working hook needs lands, with no test edited

Ran results:
- settings-merge: exactly the 8 rows below fail, and 208 checks pass (`settings-merge.out`).
- install-check with the in-memory row: exactly `:45`, `:242` and `:474` fail, and 97 checks pass (`probe-installcheck.out`).
- templates-render with the hook only: just R-680 fails (`tr-hook.out`).
- With the shared tokens and an extension stub as well: R-859, R-680 and eight rendered R-598 checks fail (`sh-templates-render.out`), plus three skill-claims checks (`sh-skill-claims.out`).
- uninstall: `:292` fails once the manifest row is added (`m-uninstall.out`).
- code-map: fails until the map is regenerated (`x-code-map.out`).

| Check (file:line) | Row | Why |
|---|---|---|
| `packages/nana-setup/tests/settings-merge.test.mjs:35` "five active hook entries are wanted" | none | `wanted.length === 5` |
| `settings-merge.test.mjs:117` "empty settings: all five active entries added" | none | `added.length === 5` |
| `settings-merge.test.mjs:138` "the other five are added" | none | `added.length === 5` |
| `settings-merge.test.mjs:142` "nana SessionStart hooks appended to the same group" | R-316 | `SessionStart[0].hooks.length === 4` (one foreign plus three) becomes 5. **The fact-check missed this.** |
| `settings-merge.test.mjs:302`, `:304` POSIX fixture deep-equals | R-1061 ×2 | Five-row fixture at `:294-299`. |
| `settings-merge.test.mjs:392` "removes exactly the five entries" | R-1050 | `removed.length === 5` |
| `settings-merge.test.mjs:799` legacy migration in place | R-908 | `migrated.length === 5`. The fleet entry appends to the same matcher-less group. |
| `packages/nana-setup/tests/install-check.test.mjs:45` "sealed hook table and allowed entry shape" | R-1074 | `HOOKS.length === 5` and the label list (:46, :48), once the required config row lands (§2.5). |
| `install-check.test.mjs:474` "pin R-1074 R-1082" | R-1074, R-1082 | Deep-equals the five rows (:475-481). |
| `install-check.test.mjs:242` "environment: every child gets the base environment…" | R-1071, R-1075, R-1079, R-1084 | The `isHook` regex (:251) lacks `nana-fleet`, but the fleet spawn carries `CLAUDE_PROJECT_DIR` (`install-check.mjs:270`), so the deep-equal fails. **The fact-check missed this.** Ran: red. |
| `install-check.test.mjs:758` "pin R-1081: the doctor note list" | R-1081 | Once `DOCTOR_NOTES.win32` gains `hook nana-fleet.mjs` (required, §2.7). |
| `packages/nana-setup/tests/uninstall.test.mjs:292` (labels at :288) | R-903 to R-907 | Red once `state-manifest.mjs:58` gains the row. Ran: red. |
| `uninstall.test.mjs:253` "install --desk then uninstall restores the independent home snapshot" and `:276` "released context entry is retired by install and its link is removed on uninstall" | R-903, R-905; R-660 | Red while the hook is in `steps.HOOKS` but not in the manifest, because uninstall leaves the link behind. Ran: both red; the baseline copy passes. **The fact-check missed this.** The two choices are exclusive: add the row and `:292` reds; omit it and these two red. |
| `packages/nana-pack/tests/templates-render.test.mjs:342` "shared runtime matrix declares…" | R-680, R-985 | Discovery (:309-316) adds the hook marker, then the extension name. `RUNTIME_INVENTORY_TEXT` (:294-307) has neither. Runs without copier (:451). |
| Same check, literal table rows (:344-347) | R-680 | Red once the shared table's Claude Code or pi row text changes. |
| `templates-render.test.mjs:274` "AGENTS.md marker-owned section is byte-identical to the shared file" | R-859 | Red until `nana-setup project` regenerates nana-pi's marker region after the shared file changes (`AGENTS.md:68`; `CLAUDE.md` links to `AGENTS.md`). Ran: red. |
| `packages/nana-pack/tests/skill-claims.test.mjs:39`, `:78`, `:80`; `templates-render.test.mjs:551` and `:739` (the shared surface, per language), `:573`, `:580`, `:749`, `:756` (the render legs ran here) | R-598 | R-680 forces `nana-fleet.mjs` into the shared section. The claim scanner reads it as a path that does not resolve. Ran: 3 skill-claims checks and 8 render checks red. Fix: add it to `EXEMPTIONS` at `packages/nana-pack/tests/skill-claims.mjs:29`, as is done for the other hook names. **The fact-check missed this.** |
| `packages/nana-pack/tests/code-map.test.mjs:39` and `npm run map:check` | — | Red until `docs/code-map.md` is regenerated. New modules under mapped roots are found automatically (`code-map.config.json` roots). |
| `requirements-tree.test.mjs:40` | R-291 | Total 1,139 changes when rows are added. |

### 4.2 Red only after the lane adds the fleet output assertion (it must, to pin the install-check row)

- The `recordingRun` stub returns empty stdout for any unknown script (`install-check.test.mjs:219`). Once a fleet branch exists in `install-check.mjs`, every scripted run prints `FAIL hook fleet — no-output`.
- That reds two exit-0 checks: `:321` (R-1071) and `:357` (R-1070).
- It also reds 14 checks that need exactly one FAIL (`assertOnlyHookFails`, :575-582): `:585`, `:587`, `:589`, `:591`, `:593`, `:595`, `:610`, `:616`, `:618`, `:620`, `:622`, `:624`, `:626`, `:825`. Their rows are R-1076, R-1077 and R-1083.
- Fix: one stub branch beside `:204-217`.

### 4.3 Unpinned: literal lists that skip a new hook or extension and stay green

| List (file:line) | Row | Gap |
|---|---|---|
| `packages/nana-setup/tests/install.test.mjs:99` (four names) | R-301, R-985 | No symlink check for the fleet hook. Ran in the copy: 100 of 100 green. `win32-degrade.test.mjs` was also 96 of 96 green. |
| `hooks-win32-exec.test.mjs:123-176` (one spawn per named hook) | R-1058, R-1063 | No Windows exec-form spawn of the fleet hook. |
| `hooks-win32-exec.test.mjs:182-186` (five settings labels) | R-1055 | No Windows doctor ✓ check for the fleet settings row. **The fact-check missed this.** |
| `install-check.test.mjs:289` / `:297` (name list) | R-1084 | The fleet spawn is not checked. |
| `install-check.test.mjs:517` / `:519` (regex) | R-1075 | The fleet hook's cwd and `CLAUDE_PROJECT_DIR` are not checked. |
| `install-check.test.mjs:523` "the three SessionStart entries start before any of them finishes" | R-1075 | The fleet hook is outside the parallel-start gate, and the title says "three". |
| `install-check.test.mjs:321` / `:328` (regex) | R-1071 | The fleet hook's shell form is not checked. |
| `packages/nana-setup/tests/win32-degrade.test.mjs:61` (two names), `:69-71` (three labels) | no marker | Skip and "created" rows for the fleet hook are not checked. |
| `packages/nana-setup/tests/state-manifest.test.mjs:56` and `:59` (`Array(17)` becomes 18 if extended) | R-954 | This test does not check the fleet row; uninstall `:253`/`:276` does (§4.1). Ran: green with the row. |
| `packages/nana-setup/tests/restore.test.mjs:51` | R-958 | Unverified. The file already fails on an unmodified copy here: it throws ERR_MODULE_NOT_FOUND for pi's `trust-manager.js` under another Node install (`base-restore.out`). |
| `settings-merge.test.mjs:278` (four names with `every()`) | R-1051 | Stays green. The fact-check said it reds; it does not. |
| `packages/nana-pack/tests/config-handlers-malformed.test.mjs:21` (seven extensions) | R-082, R-083, R-780 | The fleet extension escapes the no-throw and once-per-session warning checks. Ran with an extension stub: 98 of 98 green. |
| `packages/nana-pack/tests/readme-check.test.mjs:72-75` (seven names) | R-658 | Stays green with eight. The row text says "all seven". |
| `templates-render.test.mjs:406-411`, which pins `apps/desk/README.md:127-129` | R-685 | The desk matrix lists every nana surface, and a fleet surface would be missing. Editing the desk README turns this check red. The desk is frozen. |

### 4.4 Covered with no edit (these iterate the source list)

- `settings-merge.test.mjs:45` (R-319), `:276` and `:280` (R-1050; the fleet entry has one arg), `:839` and `:856` (R-923, R-1061, R-653). Each of the last two spawns one install per entry.
- `win32-degrade.test.mjs:103-109` (R-1050, R-1051), `:126` (R-937, through `steps.HOOKS`), `:132-135` (R-1055), `:210-238` (R-1055, R-1056).
- `hooks-win32-exec.test.mjs:100` (R-1050).
- `install-check.test.mjs:539` and `:551` (R-1075). The stub's install branch writes the fleet entry from `HOOKS` (:186-191).

### 4.5 Row text that goes stale or overclaims

- R-301 (`REQUIREMENTS.md:708`) says "four Claude Code Node hooks".
- R-1051 (`:792`) names four entries.
- R-1055 (`:958`) says "five hook settings rows".
- R-1056 (`:1040`) says "all five entries on win32".
- R-1058 (`:794`) says "each hook entry", but its test spawns a literal set, so it overclaims.
- R-1063 (`:795`) names three SessionStart outputs.
- R-1076 (`:934`) says "their sealed output", but the fleet hook has no sealed output until one is added.
- R-658 (`:1527`) says "all seven extension functions".
- R-680 (`:1536`) is satisfied only by editing the map and the table.
- R-685 (`:1121`).

### 4.6 Count words in docs and comments (no test)

- Root `package.json:4` and `packages/nana-pack/package.json:4` say "seven".
- `README.md:11` and `:166`.
- `packages/nana-pack/README.md:28`, plus its table at :30-40.
- `nana-writing.ts:4` ("the seventh pack extension").
- The header of `config-handlers-malformed.test.mjs:4`.
- §2.12 comments.
- `packages/nana-setup/README.md:438`.
- Comments at `win32-degrade.test.mjs:68`, `:92`, `:123`, `:229`.

### 4.7 Only if the configurable lineup changes the roster's shape

- `packages/nana-pack/tests/nana-roster.test.mjs:40` (R-1120) and `:75` (R-1121).
- `nana-roster.test.mjs:154` (R-1122), whose cases include "extra slot auditor" at :129 and "builder array" at :132. Either new shape reds one of them.
- `nana-roster.test.mjs:209-212` (R-1123), an exact stdout match.
- `packages/nana-pack/tests/worker-lane.test.mjs:164` and `:175` (R-961), `:198` (R-1121), `:215` (R-1124).
- `templates-render.test.mjs:373-382` (R-1126, R-1127).
- The pack README roster section at `:218`.
- pi-worker reads only `roster.builder` (`pi-worker.mjs:96-98`). An older checkout refuses an unknown roster key (`nana-roster.mjs:77-96`).

Owner name: files this lane would edit already carry it, at `templates/_shared/working-under-nana-pi.md:17`, `packages/nana-pack/bin/worker-config.mjs:11,26`, `packages/nana-setup/lib/doctor.mjs:413`, and `packages/nana-pack/README.md:38` among others. The lane must add none. Removing the existing ones is a separate decision.

## 5. Fact-check WRONG items re-checked at 2dbc817

| Item | Verdict |
|---|---|
| 3 | **Holds.** The R-1123 exact-stdout check is at `nana-roster.test.mjs:208-212`. It matters only if the printed roster changes (§4.7). |
| 4 | **Partly wrong.** The R-1061 checks are at `:302` and `:304`, and R-908 is at `:799`. `:278` stays green (a gap, not a red). It missed `:142` (R-316), which does red. The correct count is 8 red checks (Ran). |
| 5 | **Holds** (`install.test.mjs:99`). |
| 6 | **Holds.** It missed a second literal list at `hooks-win32-exec.test.mjs:182` (R-1055). The R-1075 half is right (`install-check.mjs:258` iterates `HOOKS`). |
| 7 | **The R-1081 part holds** (the check is at `:758`, not `:759`). The stub claim needs a condition: empty stdout fails only once a fleet output branch exists, and before that the row passes silently. It missed `:242`, which reds regardless of any branch. |
| 8 | **Holds** (`uninstall.test.mjs:288/:292`; `state-manifest.test.mjs:56,:59`; `restore.test.mjs:51`). Also, the product file `state-manifest.mjs:58` is itself a literal list. It missed that leaving the row out reds `uninstall.test.mjs:253` and `:276` (Ran). |
| 9 | **Holds** (`templates-render.test.mjs:294-316`, `:342`). It missed the R-598 red that follows (§4.1). |
| 12 | **Holds** (`packages/nana-setup/tests/entry-guidance.test.mjs:54`; `packages/nana-pack/skills/adopt-structure/SKILL.md:20-22`). It now belongs to the rulings lane, not this one. |
| 13 | **Holds** (9+8+5+5+6+4+11 = 48). Moot, because the plan's table will be rewritten. |

## 6. Unknowns and the claim most likely wrong

- Most likely wrong: §4.2, the 16 reds that follow once an output branch exists. It needs an edit to `install-check.mjs`, so it was not run. The stub's empty fallback at `:219` is the basis.
- The copy's `readme-check` red is an artifact: the copy has no `.git` (`x-readme-check.out`). It is not a census item.
- Unobserved: `systemMessage` in either Claude Code terminal UI. Whether SessionStart fires for a Claude subagent. The Windows CI git version. Whether pi's own "Resumed session" line replaces an info fleet notice in practice. Whether a session-start toast on every desk session is acceptable while the desk is frozen.
