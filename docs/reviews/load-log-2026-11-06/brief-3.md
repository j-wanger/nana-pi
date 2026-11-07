# Brief 3: load-log, round 1 fixes

Feature: FEAT-041 · Shape each agent's context by role

Round 1 on tip 0089c56d: the land reviewer said LAND, and the reviewer and the independent checker each found one MUST. Their records are beside this brief (r1-reviewer.md, r1-checker.md, r1-land.md). Fix both MUSTs and the two meter SHOULDs. Change nothing else.

1. MUST (checker): the lookup can delay or block a launch without limit. `pi-context-load.mjs` awaits pi's import and loader in the launcher process; a slow entry delayed a launch by 5.3 s. Run the measurement in a short-lived child node process with a deadline. The child imports pi's entry, calls `loadProjectContextFiles`, and prints only paths and content lengths, never content. On expiry, kill the child; the line carries `context files: unavailable (timed out)` and the launch proceeds. The deadline is a sealed tunable, chosen at 3000 ms (reason: well above the measured 0.4 s import), pinned by one test. This also keeps pi's signal-exit listeners, the `process.emit`/`reallyExit` patches, the loader's stderr warnings and about 100 MB of memory out of the launcher (checker and reviewer NOTEs). Add a test: a stub entry that never resolves gives the timed-out part, and the child is still spawned within the deadline plus a small margin.
2. MUST (reviewer): pi-review's logged `cwd` is now the temp checkout, so the outcome meter (R-3315, `outcome-meter.mjs:127-133`) files every real pi-review load as a test load. Keep `cwd` as the reviewed source root, as on main. Record the checkout the child runs in as a new field `childCwd`; the context-file parts still come from the checkout. Reword R-3729 to match. Add a test that a real-shaped pi-review line (source-root cwd, checkout childCwd) is counted by the meter, not filed as a test load.
3. SHOULD (reviewer), fix now since it's this feature: add `context file` and the two status parts (disabled, unavailable) to the meter's part words (`outcome-meter-config.mjs` `WORDS.parts`), so they don't show as `other-N`. Fold the unavailable reasons into one alias.
4. SHOULD (reviewer): one README sentence where load totals are described. From this land, pi-worker and pi-review load totals include the context files, so a meter window spanning the land compares two measures.

## Precedent
- `packages/nana-pack/lib/pi-context-load.mjs` — the module to move behind the child process.
- `packages/nana-pack/bin/pi-watchdog.mjs` — how the pack spawns and kills a child with a limit.
- `packages/nana-pack/lib/outcome-meter.mjs` — lines 127–133, the test-load rule; and `outcome-meter-config.mjs` for WORDS.parts.
- `packages/nana-pack/tests/context-anatomy.test.mjs` — the lane's tests.

Report: the tip, the tests run, mutation pairs for each new test, and each departure.
