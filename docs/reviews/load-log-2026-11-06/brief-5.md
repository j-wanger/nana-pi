# Brief 5: load-log, round 2 fix

Feature: FEAT-041 · Shape each agent's context by role

Round 2: the reviewer and the land reviewer said LAND. The independent checker found one MUST (r2-checker.md beside this brief).

1. MUST: `pi-context-load.mjs:40` buffers the measuring child's stdout with no size limit. A child writing 128 MiB crashed both launchers (out of memory) before the deadline, so no worker or reviewer started. Bound the channel: stop reading once the buffered output passes a sealed cap, chosen at 1 MiB (reason: the honest output is a few paths and lengths, under 10 KiB). Then kill the child and return `context files: unavailable (output too large)`. Pin the cap with one test. Add a test with a fake child that writes past the cap: the launch proceeds with that unavailable part, and the launcher's memory isn't exhausted.
2. Reviewer NOTE, fix now since it's one line: rebuild the result from checked fields only (`piVersion`, and per part `name`, `source`, `fullChars`, `deliveredChars`), never using the child's object as-is. Extra keys such as `signal` or `content` must not pass through. Add one assertion.

Change nothing else. Use repo-relative paths, `~` and `$TMPDIR` in any committed evidence, never absolute home or temp paths.

## Precedent
- `packages/nana-pack/lib/pi-context-load.mjs` — the launcher side, line 40.
- `packages/nana-pack/bin/worker-config.mjs` — where the 3000 ms deadline is sealed. Put the new cap beside it.

Report: the tip, the tests run, and the mutation pair for each new test.
