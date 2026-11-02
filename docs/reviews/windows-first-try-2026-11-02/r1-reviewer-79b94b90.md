I found no MUST. Both checks now hold up under load and still fail on the wrong code they guard. CI is green on the reviewed tip 448e88ef, including `suite (windows-latest)` in run 41383303024. Lane class is `ordinary` and the worktree is clean.

**What I checked**
- **Stagger check (R-1238, R-3530).** All five assertions are still there: exit 0, wt1 equals wt3, wt2 differs, GREEN 1 and GREEN 2. The gap threshold is now `STAGGER_CHECK_MS / 2`, 1000 ms, up from 150, so it is stricter than before.
  - **Rendezvous wait.** The new 30 s `NANA_TEST_WAIT_MS` reaches the probe, because the runner's scrub keeps `NANA_TEST_*` (`mutation-runner.mjs:407`). The longer stagger therefore can't cause a missing GREEN 1.
  - **Shards run one after another.** That wrong code still fails: shard 2 never starts while pair 1 waits, so pair 1 gives up after 30 s and is not GREEN.
  - **Detail line.** The pattern for the parent header matches the line the parent prints first (`mutation-runner.mjs:686`), so the new start times are correct.
  - **My runs on macOS.** The file passed: exit 0, 42 PASS. With `SEAT_MUTATE_STAGGER_SECS=0` the check FAILed with gap 30 ms and shard start times of 110 and 140 ms after the parent. That matches the builder's win32 result of 127 ms.
- **`timeoutMs 0` check (R-1702, R-3531).**
  - `settle` arms its watchdog with the saved real `setTimeout`, so the 30 s watchdog never shows up in `recorded`.
  - The control still proves the timer recorder works: it must record exactly one timer of `CONTROL_DEADLINE_MS`.
  - The zero case's assertions are unchanged.
  - The extension clears its timer when the check finishes (`nana-post-edit.ts:170`), so the 10 s timer does not keep the test process running.
  - Both recorded wrong-code runs fail as they should. With `timeoutMs >= 0` the zero case records `[0,2000]`. With a 1 ms control deadline the control records `[1,2000]`, the same failure CI saw.
  - The file passes on macOS, and the check's title and PASS line are unchanged.

**The builder's question: can reading `SEAT_MUTATE_STAGGER_SECS` from the environment give a false pass?**
Not realistically. The threshold always comes from the constant, never from the environment. If the runner ignores the stagger, the gap is the same whatever the variable says, so a missing stagger fails for every value. Bad values fail too: a non-number becomes `"NaN"`, which the runner refuses, so the exit is non-zero. An empty value becomes 0, which fails on the gap.

A false pass needs two faults at once: a runner bug that misreads the unit (seconds as milliseconds), plus a seat exporting a large value such as `2000`. That is contrived.

The check also can't tell the runner's 4 s default stagger from the stagger it asks for. That gap existed before this lane, at 300 ms against 4000 ms, and this lane doesn't change it.

**SHOULD**
- **A stagger value exported in a seat's shell can make the local suite fail.** Before this lane the check ignored the shell's value. Now `mutation-runner.test.mjs:1207` reads it, and `scripts/test.mjs:334` doesn't remove `SEAT_MUTATE_*` from a test's environment. A seat that exports `SEAT_MUTATE_STAGGER_SECS=0` or `0.5` to speed up its mutation runs gets a FAIL with a gap under 1000 ms.
  - The failure is loud and the detail line explains it. CI and the mutation runner both run without the variable, so the harm is a confusing local red, not a weakened check.
  - It also doesn't quite match R-3530's text, which says the stagger comes "from a named constant".
  - A test-only name such as `NANA_TEST_STAGGER_SECS` would remove both problems. For now it fits as one known-bug line.

**NOTE**
- **The plan's leftover limits are not in `docs/known-bugs/FEAT-031.md`.** They are listed only under Residuals in `plan.md`. The lane deleted the clause saying the stagger check "may fail on a loaded machine" and added nothing about the limits that remain:
  - a `git worktree add` of 1000 ms or more lets a missing stagger pass;
  - a shard set-up over about 2 s can still fail the check.
  
  Each could be one known-bug line.

VERDICT: LAND
