Both test files pass locally and no fixture process was left behind. I recommend landing: round 1's MUST is closed, and nothing in this round reaches MUST.

**What I ran:** I ran both test files once each on macOS, and both passed. `test-locked` took 5 s, with its handled-signal check passing. `worker-claude` took 29 s, with R-2693 and R-2720 passing and R-2721 skipped, as it always is off Windows. Afterwards no held fake builder, watcher or fake suite was still running. The only leftover `sleep` belonged to another session's preview heartbeat. `npm run map:check` and `npm run readme:check` both exit 0. CI on PR #310 for tip `cf2d4290` is still queued, so the Windows leg has not run yet.

## Answers to the brief

**1. Is `worker-claude.test.mjs`'s diff against main limited to R-2693, with R-2721 identical to main?** Yes. `git diff main HEAD` on that file now shows only three changes:
- the new `STARTUP_SIGNAL_READY_LIMIT_MS` constant, which only `startupSignalCase` uses;
- the `WC_HOLD_FILE` hold in both fake `pi` builders, which only `startupSignalCase` sets, so no other case changes;
- `startupSignalCase` itself (`packages/nana-pack/tests/worker-claude.test.mjs:599-601`).

Nothing about R-2720 or R-2721 appears in that diff. Comparing against `279c6c0a`, build 2 removed `PROCESS_GROUP_READY_LIMIT_MS` and the `processGroupReady` wait. It also put back the unconditional kill choice, including `killWorkerTree(child)` in the plain branch. The `builderPid` read is back after the 2 s close wait, and R-2720's assertion matches main again. Round 1's MUST, R-2721 failing on every Windows run, is therefore closed. Round 1's SHOULD is handled the way build brief 2 asked: the region is reverted and the lock case is a new line in `docs/known-bugs/FEAT-031.md`.

**2. Are R-2693 and the locked-suite check still signalled only at their named states, with assertions as strong as before?** Yes. Neither changed since `279c6c0a`, and round 1 judged both sound.
- **R-2693:** the signal is sent only when temp files exist and the builder has not started. The held fake builder cannot finish first. The assertion at `:619` is the same as on main.
- **Locked-suite check:** the signal is sent only after the fake suite writes its marker, and that happens after it installs its SIGTERM handler. The check now also requires that marker (`handlerReady &&`), which makes it stronger, not weaker.

Neither check gained a skip, retry or longer timeout.

**3. Does the merge bring main in whole?** Yes. `origin/main` is still `ac20e30a`, the merge's second parent. The two-dot and three-dot diffs against main list the same 12 files, all within the lane's scope:
- the two test files;
- `docs/code-map.md`, where only `worker-claude`'s line numbers moved by one or two, matching the added lines (map check passes);
- `docs/sessions/2026-10.md`, which adds only the lane's own entry, after main's newer entry, with every entry whole;
- the one FEAT-031 known-bug line;
- the lane's review folder.

**4. Does the change cause a harm the review standard lists?** No. The change is tests and docs only, with no product code. The fixtures write only inside their temp roots, and the hold file is under `TEMP`. R-2721 is now byte-identical to main, so the Windows leg sees the same code that passes on main today.

## NOTE

- **The session note still overstates the cause.** Its sentence "In each, the signal raced the state its row names" still covers all three checks. Two sentences later it says R-2720's failure was a kept lock, not a race. This is wording only.
- **The ten-run claim is unchecked.** The note says both files passed ten runs in a row, but I could not see the build-2 loop to confirm it. My single run passed.

VERDICT: LAND
