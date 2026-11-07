Both round-1 MUSTs are closed, and I found no harm on the review standard's list. Verdict: LAND.

**Scope:** commits `0089c56d..5a28d6e8`. All runtime changes are in `3e793169` and `24d65693`. The last commit, `5a28d6e8`, only adds review records.

## The two MUSTs

**Reviewer MUST: real reviews counted as test loads.** Fixed.
- `pi-review.mjs:245` logs `cwd: sourceRoot` again, the same value main logs. The new `childCwd` field holds the checkout.
- Context is still measured from the checkout (`tempRootReal`).
- The new meter test runs a real `pi-review` launch with its temp folder separated from the source fixture, then asserts `test loads 0`. Under the old code it reports `test loads 4` (`r2-wrong-meter.log`).
- The meter's row check accepts the extra `childCwd` key, so these lines still count.

**Checker MUST: lookup with no deadline.** Fixed.
- Finding pi, importing it and running its loader now happen in a separate Node child, `pi-context-measure.mjs`.
- That child is detached, its stderr is discarded, and it gets the sealed 3000 ms limit `PI_CONTEXT_TIMEOUT_MS`.
- When the limit passes, `stop()` kills the child's process group, then sends the child a direct SIGKILL, destroys its output pipe, unrefs the child and resolves. It never waits for the child to exit, and on Windows it does not wait for taskkill.

## The two specific checks

I ran `piContextLoad` directly with fake measuring children:

| Case | Time | Result |
|---|---|---|
| Real pi 1.4.0 on this tree | 378 ms | `AGENTS.md`, 21,756 chars |
| Output that isn't JSON | 25 ms | unavailable (pi context process failed) |
| Output is the JSON value `null` | 25 ms | unavailable (pi context process failed) |
| Child exits with code 1 | 24 ms | unavailable (pi context process failed) |
| Child SIGKILLs itself | 22 ms | unavailable (pi context process failed) |
| cwd that doesn't exist | 4 ms | unavailable (pi context process failed) |
| Child stalls forever | 3009 ms | unavailable (timed out) |
| Child exits, but a grandchild keeps its output open | 3006 ms | unavailable (timed out) |

No SIGINT listener was left behind in any case.

- **Never waits past the deadline:** confirmed. The paired timing test shows the same: a stalled measurement adds about 2.8 s to both launchers, and the measuring child is dead afterwards.
- **The child's death or garbage output can't change delivery:** confirmed. Every such case gives one unavailable part, and the launch goes ahead with the same arguments.
- **Signals during measurement:** handled. The temporary SIGINT, SIGTERM and SIGHUP handlers pass the signal on, and both launchers use their existing stop paths: exit 130, 143 or 129, the reservation or lane lock released, and no child started. Before that fix, a signal during measurement was swallowed and the build ran on to its time limit (`r2-tests.log`); R-2693 now passes.

## SHOULD / NOTE (none blocks the land)

- **NOTE — the measuring child's whole result is used as-is.** If its output is a valid JSON object, the launcher uses it without rebuilding it. An object with a `signal` key would cancel the launch, and extra keys on a part (for example `content`) would go into the log; I reproduced both with a fake child. In practice nothing honest can produce this: pi's own output writes are thrown away, and anything else on that channel would break the JSON. It is outside the threat model, but rebuilding `{piVersion, parts}` from only the checked fields would close it.
- **NOTE — file-handle exhaustion crashes the launcher.** If Node can't start the measuring child because the process is out of file handles (EMFILE or ENFILE), `child.stdout` is null. The code then throws before its error listener is attached, and the launcher crashes on an unhandled `error` event. The real child launch would fail in that state anyway.
- **NOTE — a killed launcher can leave a stuck measuring child.** If the launcher is SIGKILLed during measurement while pi is stuck, the detached measuring child is never cleaned up. With a normal pi it exits on its own in about 0.4 s.
- The meter SHOULDs are done: the three new part names are in `WORDS.parts`, all unavailable reasons fold into one name, and the README notes that windows spanning the land compare two different totals.

## Checks I ran

- Tests: `node scripts/test.mjs context-anatomy outcome-meter worker-claude win32-launch` → 4 files pass, 77 checks, 0 failures, 11 platform skips.
- `node scripts/code-map.mjs --check` and `node scripts/readme-check.mjs` → 0 problems.
- I made no changes in the worktree; my scratch probe folder in `/tmp` is deleted.

VERDICT: LAND
