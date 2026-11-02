The fix doesn't yet reach memory making: the new resolver works when `claudeRunner` is called directly, but every real caller bypasses it, so I'm sending it back. One side note first: my first check of the factory went through the real `spawnSync("claude")` here. That probably made one small real Claude call on this Mac (sonnet, prompt "p", $0.50 cap). The repeat check ran with an empty PATH and made no call. No files were edited.

## MUST

**1. Memory making never reaches the resolver** (`scripts/memory-shape-runners.mjs:66-69`, used by `scripts/memory-run.mjs:12`)
- **Input:** a Windows machine with only an npm-installed Claude Code, running `nana-memory make`, the session-end hook or a land, which all start `scripts/memory-run.mjs`.
- **Cause:** `createRunner` sets `spawn = spawnSync` whenever no spawn is given, and always passes it to `claudeRunner`. So the `if (spawn)` branch at `memory-shape-runners.mjs:28` always runs and calls `spawnSync("claude", …)`, exactly as main does.
- **Consequence:** the call fails with `ENOENT`, every unit stays pending, and the bug this lane exists to fix is still there. The same applies to `memory-shape.mjs`, `outcome-meter.mjs` and `apps/bench/anatomy.mjs`.
- **Proof:** I called `createRunner({ runner: "claude", platform: "win32", resolveLaunch })` with no spawn and an empty PATH. It returned `{"ok":false}` and `resolveLaunch` was called 0 times. Calling `claudeRunner` directly calls it once.
- **Why the evidence missed it:** `real-npm-claude-win32.txt` drove `claudeRunner` directly, not `createRunner()` or `memory-run.mjs`. The R-3472 test also only checks `claudeRunner`. The plan's line 65 ("all of them pass no spawn … so none changes") missed that `createRunner` fills in a spawn itself.
- **Fix:** remove the `spawn = spawnSync` default from `createRunner`; `piRunner` already has its own. Add an R-3472 check that `createRunner()` with no spawn on win32 calls the resolver. Then re-record the R-3474 evidence through `createRunner()` or `scripts/memory-run.mjs`. The removed A6 known-bug line still describes what users will see until this is fixed.

## Your questions
- **Same arguments, stdin, environment, timeout and `windowsHide`, no shell:** yes, on the path that does use the resolver. The arguments and the options object go to `spawnSync` unchanged, with no `shell` or `windowsVerbatimArguments`, and a refused resolution spawns nothing and returns `ok: false`.
- **Native `claude.exe` still preferred:** yes. `findOnPath` checks every PATH folder for `.com` and `.exe` before it looks for any shim. One small difference: Node's own lookup also searched the working folder (the OS temp folder) first; the new resolver doesn't, which is harmless and safer.
- **Off Windows and with an injected spawn:** unchanged.
- **Shared launchers:** untouched. The diff doesn't change `win-command.mjs`, `review-launch.mjs`, `pi-worker.mjs`, `claude-review.mjs` or `pi-review`.
- **`claudeCommand` instead of `resolveClaudeLaunch`:** doesn't matter. It is the name `plan-attack.md` suggested (SHOULD 9) to avoid clashing with `pi-worker`'s `claudeLaunch`, so it wasn't really an unreported departure.
- **Harms from the review standard:** none beyond the MUST. The tests write only to the OS temp folder, and no install or hook changes.

## SHOULD / NOTE (for the known-bug file)
- **SHOULD:** the missing-entry refusal ("is not a file") has no test. The plan asked for exact refusal text, but the checks match substrings like `"npm"` and `"outside"`.
- **SHOULD:** the R-3472 check leaves `env` out of the options it compares.
- **NOTE:** off Windows, the two Windows-only checks in `claude-launch.test.mjs` print both `SKIP` and `PASS`.
- **NOTE:** the 2026-11-01 session entry says the npm entry "starts directly or through Node". The code refuses any bin that isn't `.exe`, so there is no Node route.

`claude-launch.test.mjs` and `memory-shaping.test.mjs` pass on this Mac, with the Windows-only checks skipped.

VERDICT: SEND-BACK
