The slow-gh probe hit the inner timeout, not the CLI limit. Eight concurrent CPU workers did not reproduce the failure: the existing check passed in 3.341 seconds.

The session also reports stale installed rulings. I have not changed the installation.
1. **MUST — M1 tests the wrong timeout and requires an unsupported failure.**  
   **Evidence:** `plan.md:9–18,59` treats slow gh calls as additional shutdown time. However, `lib/issue-watch.mjs:51–56` aborts pending work immediately; `lib/gh-runner-async.mjs:22–25,40` kills calls after 1.5 seconds.  
   Windows probe: ordinary fake gh completed in **3.191 s**. Adding **1.7 s per gh call** produced `Issue watch: timeout.`, no owner answer, and a successful restart/exit in **3.147 s**—not `CLI limit`. Eight concurrent CPU workers also left the existing check passing in **3.341 s**. The reported CI cause remains unconfirmed.  
   **Fix:** Separate startup delay from per-call delay. Use a bounded CLI-start delay to cross the old outer deadline; test slow successful calls below their inner deadline separately. Record the actual baseline failure rather than requiring `CLI limit` from the proposed gh-delay fixture. Narrow “cannot fail on a slow runner” to a measured envelope.

2. **MUST — Equal case and child deadlines can suppress diagnostics and cleanup.**  
   **Evidence:** `plan.md:18` replaces both limits with one bound. In `tests/issue-watch.test.mjs:52–57`, the case timer starts before the test callback; the child timer starts later at line 162. Equal durations therefore let generic `case limit` win first. `Promise.race` does not cancel the still-running callback.  
   **Fix:** Use one timeout owner that diagnoses and cleans up before rejecting, or give the case guard an explicit cleanup margin beyond the child deadline. Require that the hang test receives the specific diagnostic, never `case limit`. Budget all serial cases and cleanup beneath the suite’s **300-second** default (`scripts/test.mjs:92`).

3. **MUST — M2’s suggested hang does not prove outer-bound enforcement.**  
   **Evidence:** `plan.md:17,60` ends on the list call following the answer. The fake writes its count before emitting its response (`tests/issue-watch.test.mjs:161`). Hanging that third call can trigger the end handler anyway; stop then aborts it. Otherwise, the inner 1.5-second gh deadline kills it. Neither demonstrates a CLI that never exits.  
   **Fix:** Inject a referenced, nonterminating handle in the CLI preload after the restart handler runs. Assert “no exit,” deadline enforcement, and cleanup. Test missing polls and missing owner output separately. Keep the trigger at **three list calls**, not two: the second count precedes answer consumption.

4. **SHOULD — Make cleanup proof explicit rather than equating kill with cleanup.**  
   **Evidence:** The current timeout only calls `child.kill("SIGKILL")` and immediately rejects (`tests/issue-watch.test.mjs:162`). It neither awaits closure nor checks descendant liveness. M2 promises no orphans (`plan.md:60`).  
   **Fix:** Record fixture PIDs, await bounded termination, and assert they are gone. Reuse `lib/process-tree.mjs` where tree cleanup is needed, with a POSIX process group. Keep a separate fixture safety limit and unconditional cleanup.

5. **SHOULD — M3’s literal ban exceeds the declared timing change.**  
   **Evidence:** `plan.md:19,61` overlooks R-2994’s **5000 ms** process timeout (`tests/issue-watch.test.mjs`) and also bans independent fake-clock inputs such as **3000/1600 ms**. Those inputs deliberately test clock drift; deriving them from product constants would weaken independence.  
   **Fix:** Enumerate real-time harness tunables, including R-2994. Exempt fixture timestamps and fake-clock scenario data. Write the new rows as observable behavior before implementation; retain separate value seals.

**Counts: 3 MUST, 2 SHOULD.**
