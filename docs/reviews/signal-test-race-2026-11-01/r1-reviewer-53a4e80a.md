I'm sending this back. The lane breaks R-2721 on Windows every time. Also, the R-2720 change does not fix the Ubuntu failure it was meant to fix. The test-locked fix and the R-2693 fix are both sound.

**What I ran:** both test files once each on macOS, and both passed (worker-claude in 29 s, test-locked in 5 s). No held fake builder, fake suite or lane watcher was left running afterwards. `npm run map:check` and `npm run readme:check` both exit 0. CI on PR #310 had not finished when I stopped: all three suite legs were still pending, and the four install-check legs passed.

## MUST

**1. R-2721 now fails on every Windows run** (`packages/nana-pack/tests/worker-claude.test.mjs:776-780`)
- The new `processGroupReady` wait calls `groupAlive`, and `groupAlive` returns false at once on Windows (line 255). The wait therefore ends false after 5 s, all three kill branches are skipped, and pi-worker is never ended.
- In the `windows-tree` case (line 803), the worker and its 30 s builder keep running. So `watcherGone` and `empty` come back false, and R-2721 fails. I evaluated the gate with Windows semantics and got `{ processGroupReady: false, action: 'none' }`.
- Even if the gate passed, the plain branch changed from `killWorkerTree(child)` to `cleanProcess(child.pid)`. On Windows the first runs `taskkill /T /F`; the second ends only the worker. R-2721's row names `taskkill /F /T` of the tree.
- This check passes on main today, and the Windows suite leg blocks release. The brief did not set out to change it.
- Fix: put back `killWorkerTree(child)` in the plain branch, and either skip the group wait on Windows or drop it.

## SHOULD

**2. The R-2720 change does not address the Ubuntu failure.** The failing run is job 124957754103 (run 41343316046). Its record for the `tree` case reads `started: true, ready: true, watcherGone: true, empty: true, builderGroup: false, lock: true`.
- The kill came after both readiness states, and everything except the lock was cleaned. A wait before the kill can't change that outcome.
- On macOS and Linux the new probe adds nothing: the fake builder writes its pid file only after it is running, and its process group already exists by then. It is also a check the test makes, not a marker the fixture writes, which the brief asked for.
- The lock is kept by the watcher's release step (`packages/nana-pack/lib/lane-watcher.mjs:196-209`). Either it still saw the builder as alive and could not confirm the builder's start time within the 1 s tolerance (`ps etime` counts whole seconds), or the builder did not exit within the 2 s wait. Both readings are inferred.
- The seat should record this as a known bug or plan a separate lane; it is not a fix this lane delivers.

**3. The session note overstates the change.** It says the checks "now wait for a marker the fixture writes at that state". That is not true of R-2720, and the ten-run proof was macOS only.

## NOTE

- **R-2693:** sound. The held fake pi stops the small build from finishing before the signal, which matches the recorded "ended 0 with SUCCESS" failure. The assertion is unchanged, the 5 s limit is the same, and the three-attempt loop was already there. If the marker appears before the signal, the held builder runs until the 10 s ceiling, the same worst case as the larger lanes.
- **The hold loop has no limit of its own** (lines 139 and 142). It relies on the worker's abort, the ceiling or the watcher to end it. On Windows it is never used, since R-2693 runs only on macOS and Linux.
- **The builder pid is now read before the kill** (line 776). If the builder appears only after the 8 s start wait, cleanup misses its pid and relies on the watcher. This only matters in a run that already fails.
- **test-locked:** correct. The fake suite writes its marker after it installs its handler, and the runner installs its own handlers before it starts the suite (`scripts/test-locked.mjs:235-242`). Adding `handlerReady` to the check makes it stronger, and the wait ends early if the child exits.

VERDICT: SEND-BACK
