# claude-cmd-launch — plan attack

Verdict: the core choice holds. Resolving the npm shim through `package.json` to `bin/claude.exe` and starting it with no shell is right. The real 2.1.316 install matches the plan's layout claims, and A3 holds on Windows (checked below). But the plan has three MUST problems. First, its "first on PATH" rule can break a machine that works today. Second, its test-injection design cannot reach two of the three callers it forecasts, and the planned file list does not match the forecast. Third, it would commit a known-bug line that is false. Fix these, apply the SHOULDs, and the plan is ready to build. The lane stays `ordinary` with the corrected file list (rerun below).

## Findings

1. **MUST: the PATH rule regresses a working setup.**
   - Evidence: O2 (plan.md:28) and M1 (plan.md:72) start the first `claude.exe`, `.cmd` or `.bat` in PATH order. Today `spawnSync("claude")` goes through libuv's lookup, which never considers `.cmd`/`.bat` and only appends `.com`/`.exe`. So today, an npm `claude.cmd` earlier on PATH is skipped, and a native `claude.exe` later on PATH runs.
   - This order is the common migration case. `%APPDATA%\npm` usually sits in the user Path before `%USERPROFILE%\.local\bin`, which the native installer appends later. A leftover npm package often stays installed.
   - Under the plan, that machine switches from the working, auto-updated native binary to the stale npm copy. That copy may be an older JS-bin version without `--effort`/`--json-schema`, or the scripts-disabled stub (finding 4).
   - Change: use two passes. First, any `.exe` (and `.com`, to keep today's set) anywhere on PATH, started directly. Only when none exists, the first `.cmd`/`.bat` shim. Add an M1 pin: "an npm shim earlier on PATH than a native exe resolves to the native exe".
   - Also state the one deliberate difference from libuv: libuv searches the spawn `cwd` (here `os.tmpdir()`) before PATH, and `findOnPath` without `searchCwd` does not. Dropping that is fine, but say so.
   - Resolve with the same `env` that `options()` gives the child (memory-shape-runners.mjs:16), so the lookup and the child see one PATH.

2. **MUST: the test-injection design does not reach the callers, and the file list is wrong.**
   - The forecast (plan.md:88) says the three tests will "also inject a launch". Two of them can't:
     - `outcome-meter.test.mjs:147-149` builds the runner through `meterRunner` (scripts/outcome-meter.mjs:13-15).
     - `memory-replay.test.mjs:244-245` builds it through `replayRunners` (scripts/memory-replay.mjs:14-18).
     - Both forward only `spawn`, and both assert `bin === "claude"`.
   - On the Windows suite leg (ci.yml:58-60, no Claude installed), the default launch refuses, so spawn is never called and `invoked === 1` fails. Injecting a launch means editing `scripts/outcome-meter.mjs` and `scripts/memory-replay.mjs`, which are not in the lane-class list.
   - The list also names `packages/nana-pack/tests/memory-shape-runners.test.mjs`, which does not exist. It omits the three test files the forecast names.
   - Simpler change: resolve inside the *default* spawn only. Make `claudeRunner`'s default `spawn` a wrapper that resolves the launch, then calls `spawnSync(command, args, opts)`, or returns `{ error }` on a refusal so callJudge throws and the runner returns `ok: false`.
     - An injected spawn keeps receiving `("claude", args, options)` unchanged. No caller, CLI wrapper or existing test changes.
     - M3 then pins the wrapper, with injected `spawnSync` and launch: the command is resolved, and args and options are identical.
   - Fix the file list to the real set, and add `code-map.config.json` (finding 7). Rerun: `lane-class --files scripts/memory-shape-runners.mjs,…/claude-launch.mjs,…/claude-launch-config.mjs,…/claude-launch.test.mjs,…/memory-shaping.test.mjs,…/outcome-meter.test.mjs,…/memory-replay.test.mjs,scripts/outcome-meter.mjs,scripts/memory-replay.mjs,REQUIREMENTS.md,docs/known-bugs/FEAT-040.md,code-map.config.json,docs/CODE-MAP.md` prints `ordinary`.

3. **MUST: the gate-lane residual is false as written.**
   - plan.md:49 says pi-worker's Claude Code builder and `claude-review` fail with an npm-only Claude Code. Neither passes a quoted, line-break, `%` or `!` argument:
     - The builder's args are fixed flags plus file paths plus a one-line `instruction` (pi-worker.mjs:185, 205-215).
     - The reviewer passes flags and a settings path (claude-review.mjs:115-117), with its prompt on stdin.
   - FEAT-006's known bugs already say an npm-installed claude starts through `review-ledger run` (docs/known-bugs/FEAT-006.md:5). Recording "fails there too" would put a false line in the ledger.
   - "The feature that owns reviewLaunch" is also vague. Its rows R-2250..R-2254 sit under FEAT-007 (REQUIREMENTS.md:863, 974-978), and the builder's known bugs live in FEAT-006.
   - Change: drop the residual. Or reword it as conditional: "would refuse if a future argument, or a temp path under a user folder holding `%`/`!`, reaches winCommand". Name the file (`docs/known-bugs/FEAT-007.md` or `FEAT-006.md`) and add it to the file list.

4. **SHOULD: A3 is true. Cite the evidence, pin it, and record the residual.**
   - The packed placeholder `bin/claude.exe` in 2.1.316 is a 500-byte `sh` script that `echo`s instructions to stderr. I extracted it from the npm cache tarball.
   - Spawned directly on win32 with the runner's options, it returns `error.code "UNKNOWN"` (ERROR_BAD_EXE_FORMAT) at once: no stdout, no hang, no prompt. callJudge throws (catch-judge.mjs:119) and the runner returns `ok: false`.
   - `FAIL_ON_MISSING_NATIVE` is `false` in this build (install.cjs:36), so npm keeps the stub silently.
   - Change:
     - Put this in A3 as evidence.
     - Add one cheap win32 check: a text file at a fixture `bin/claude.exe` makes `claudeRunner` return `ok: false`.
     - Add a FEAT-040 known-bug line: with `--ignore-scripts`, the native binary is still present at `node_modules/@anthropic-ai/claude-code-win32-x64/claude.exe` (nested under the package in a global install; `cli-wrapper.cjs` resolves it). Making stays pending anyway, by design.
   - Worth stating because CI installs pi with `--ignore-scripts` (ci.yml:38,44), and the same habit applied to Claude Code lands here.

5. **SHOULD: justify the JavaScript-bin branch with evidence, or drop it.**
   - A2, M1, M3 and M4 all carry a JS-entry path for "older packages", but the plan names no version. It also gives no evidence that any JS-bin release accepts every flag the runner sends: `--json-schema`, `--effort`, `--strict-mcp-config`, `--setting-sources ""`, `--max-budget-usd` and `--no-session-persistence`.
   - If those releases reject a flag, the branch only turns a refusal into a spawned failure.
   - Change: name the last JS-bin version and show it accepts those flags. Otherwise refuse a non-`.exe` bin with a named "upgrade Claude Code" reason. That removes half of M1, M3 and M4.

6. **SHOULD: M4 is sound but costly, and does not test claude.exe's own parser.**
   - libuv quotes argv as the exact inverse of the MSVCRT rule and never emits `""` inside a quoted argument. That is the only place the CRT (node.exe), `CommandLineToArgvW` and Bun's Windows parser (claude.exe) differ.
   - I ran a round-trip through `process.execPath` with these inputs, and every byte came back: JSON with `\"`, a line break, `%PATH% !x! ^&|<>`, a trailing `\`, a trailing `\\`, an empty argument, a leading space, `\"`, `a""b` and `\\"\`. So M4 can pass while the real exe still mangles args only if Bun's parser deviates.
   - Copying node.exe (about 80 MB) on every Windows leg adds time to the slowest leg (ci.yml:63-69). A hard link fails across volumes on hosted runners (tool cache and temp are on different drives).
   - Change:
     - Start `process.execPath` with the echo script, and have the fixture launch return it. Or link with a copy fallback.
     - Assert the resolved options carry no `shell` and no `windowsVerbatimArguments`.
     - Add the inputs above to M4's set.
     - Extend M5 so the real `claude.exe` echoes back a system prompt holding a trailing `\`, `\"`, `%` and `!`. That is the only check of claude.exe's own parser.

7. **SHOULD: row status, code map and impact.**
   - M5 has no suite test, so its row should be `untested`, naming the evidence file in the note (the R-848 pattern), not `implemented`.
   - `code-map.config.json:101` explains `memory-shape-runners.mjs` by `piLaunch` alone. Update it.
   - A `claude-launch.test.mjs` that spawns a fixture executable needs a `launchAlwaysRun` entry like `win32-launch.test.mjs` (code-map.config.json:79).
   - planner.md asks for `map:search` and `map:impact`, and the plan shows neither. Impact on `scripts/memory-shape-runners.mjs` adds callers the plan omits: `apps/bench/anatomy.mjs:14` (`createRunner({ runner: "claude" })`), `scripts/memory-run.mjs`, `scripts/memory-shape.mjs`, `scripts/outcome-meter.mjs` and `scripts/memory-replay.mjs`. Under finding 2's design they need no edit, but list them.
   - The residual at plan.md:50 about catch-judge's own spawn is fine. anatomy already goes through the fixed runner.

8. **SHOULD: name the unsupported layouts in refusals.**
   - These stay refused, as they get ENOENT today, so this is not a regression:
     - pnpm global (shim in `PNPM_HOME`, package elsewhere);
     - Yarn classic global (`Yarn\bin\claude.cmd` → `..\Data\global\node_modules`);
     - Volta 2's `.cmd` shims.
   - These are `.exe` and keep starting directly, as today: Scoop and winget shims, Bun's `.exe` shim, the native installer's `.local\bin\claude.exe`, and a WindowsApps alias.
   - The extensionless `claude` and `claude.ps1` beside the shim are never candidates (win-command.mjs:33-35).
   - Change: model the refusal text on piLaunch's (pi-watchdog.mjs:71) so a reader of the code knows which layouts are unsupported. The runner prints nothing, so units stay pending silently, as today. Say that in M2.

9. **SHOULD: avoid the name clash.** pi-worker.mjs:95,217 already has a local `claudeLaunch` (the builder's reviewLaunch wrapper). Give the new export a distinct name, for example `claudeCommand`, so searches and reviews don't conflate the two routes.

## Checked and fine

- The Feature line matches REQUIREMENTS.md:469.
- Rows R-3470..R-3474 are unused and inside the range.
- Every Precedent entry starts with a tracked path.
- The threat model names honest variation versus forgery.
- There are five must-meet tests, one row each.
- No machine paths or personal names appear (`%APPDATA%` and `<prefix>` only).
- M3's option list matches `options()` (memory-shape-runners.mjs:16). The override already discards callJudge's own options and `CATCH_JUDGE_BIN` (catch-judge.mjs:116-118), and that must stay so.
