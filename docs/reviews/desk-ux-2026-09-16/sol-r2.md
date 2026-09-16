## 1. B-HIGH: untracked-file accounting

**FINDING (HIGH) — `apps/desk/changes.mjs:202-229`**

The normal case is substantially fixed: filesystem operations are asynchronous, allocation is deterministic in list order, concurrency is eight, errors are caught, and partial totals correctly sum only counted rows.

However, the aggregate cap is based on the earlier `lstat` size (`:223`), while `readFile()` later reads the path without a byte limit (`:229`). A file can grow—or be replaced by a larger file or symlink—between those operations. That can defeat both the 1 MiB per-file cap and 16 MiB aggregate cap, followed by an unbounded synchronous `countBuffer()` pass. The safety bound therefore is not hard under filesystem interleaving.

Use an opened descriptor with `fstat` and bounded reads, rejecting changes beyond the allocated size/cap.

## 2. C-HIGH: reload serialization

**FINDING (HIGH) — `apps/desk/public/app.js:1005-1019`, `apps/desk/public/app.js:2343-2353`**

Publishing `reloadPromise` correctly handles an already-known reload, including failure paths: `runReload()` catches failures and always resolves the waiter.

Pending reload completion remains heuristic, however:

- An unrelated command-list change, including another tab’s concurrent reload, can satisfy `:1017` while this reload is still running.
- An unchanged-list reload necessarily waits the full extra 15 seconds.
- More importantly, after that ceiling the code reads commands, reports success, resolves `reloadPromise`, and allows the user prompt through even if `ctx.reload()` is still running. Thus a reload lasting over roughly 20 seconds still collides with a prompt.

The unchanged-list 15-second delay alone is poor but bounded and could land as a documented limitation; releasing the prompt without evidence of completion cannot.

There is also no server-wide serialization, so two tabs can issue two reloads despite each tab’s local `S.reloading` guard.

The author’s pi-source claim is correct: `agent-session.js:616-617` derives `isStreaming` solely from agent-run activity, while `:826-833` awaits the extension command before completing preflight without starting an agent run. `get_state.isStreaming` therefore cannot signal completion.

## 3. A, B-sym, D

- **PASS — `apps/desk/public/app.js:610-628`**: the stale activity tick now clears only its captured interval handle.
- **PASS, static case — `apps/desk/changes.mjs:365-375`**: an untracked path already symlinked when checked now returns 409.
- **FINDING (MED) — `apps/desk/changes.mjs:373-375`**: the check/read race remains. If a regular path becomes a symlink after `lstat`, `newFileDiff()` follows it. Because `at.abs` can equal the original raw path, the replacement target can be outside the repository; the realpath validation does not constrain the later replacement.
- **PASS — `apps/desk/public/desk-client.mjs:115`**: `lastIndexOf("\n</skill>")` closes the embedded-tag parsing defect.

## 4. Fold tests

**FINDING (MED) — `apps/desk/test/live-feel.e2e.mjs:401-412`, `apps/desk/test/changes-endpoint.test.mjs:256-268`**

Reload tests 5 and 6 are real negative controls: reverting the send wait exposes ordering failure in test 5, and reverting pending handling allows the premature toast caught by test 6. They do not cover unchanged command lists, reloads exceeding the ceiling, or concurrent reloads/tabs.

The activity test does not reliably manufacture an already-queued stale callback; ordinarily `clearStage()` cancels the old interval before the new turn starts. It can pass with the old implementation.

The event-loop test’s absolute `worst < 100 ms` wall-clock threshold is vulnerable to loaded-CI scheduling, and can pass vacuously if no interval tick runs during collection.

## 5. README consistency

**FINDING (MED) — `apps/desk/README.md:184-194`, `apps/desk/README.md:585-591`**

The original nana-pack/no-reload and throttle contradictions are corrected, and the changes-budget/partial description matches the intended normal behavior.

Two claims remain inaccurate:

- It says prompts are held until reload completion, but code releases them after the polling ceiling without proof of completion.
- The symlink limitation says a raced read can only reach the previously validated inside-root target. A regular raw path replaced after `lstat` can instead redirect the subsequent read outside the root.

## VERDICT: BLOCK

### BLOCK/HIGH — must fix

1. `changes.mjs`: enforce the untracked byte budget against bytes actually read, not stale pathname metadata.
2. `app.js`: obtain an authoritative reload-completion signal or retain serialization until actual completion; do not release after a heuristic timeout or unrelated command-list change.

### MED/LOW — may land

1. The per-file symlink check/read race remains and is inaccurately documented.
2. The activity regression test does not force the queued-tick race.
3. The event-loop timing assertion may flake under scheduler load.
4. Reload tests omit unchanged-list, over-ceiling, and concurrent-tab cases.
