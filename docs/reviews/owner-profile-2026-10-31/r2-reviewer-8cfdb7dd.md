The change since round 1 fixes the Windows lock failure without weakening the concurrency test, and I found no harm the review standard lists.

**What changed:** `git diff 3923f3bd..HEAD` touches only two code files. The rest is notes and review records.
- `profile-config.mjs`: the lock wait is now worked out from the Git step timeout times the number of steps run under the lock. That is 15,000 ms × 28 = 420,000 ms, replacing the old 5,000 ms. Raising the Git timeout later raises the wait with it.
- `profile-store.test.mjs`: the R-3240 seal test now pins the step count (28) and the wait (420,000 ms). It also checks that the wait is at least timeout × steps, so a change that makes the wait too short fails and names R-3240.
- REQUIREMENTS row R-3240 was reworded to match, and its trace now points at the renamed test.

**Is the concurrency test intact?** Yes. `profile-sync.test.mjs` has no changes in this range, so "offline contention and a stopped rebase lose nothing" makes the same two-saves-at-once claims as before. On Windows, the second writer gave up at 5,000 ms while the first still held the lock through fetch, rebase and push. It now waits as long as that sequence can run, so the round-1 SHOULD 1 is closed. The stale-lock rule still only clears a lock whose process has died, so a live writer is never evicted even though the wait is longer than 120,000 ms.

**What I checked:** I ran `profile-store.test.mjs` locally on macOS and it passed (exit 0, about 2 minutes). I did not re-run the sync test or the full suite. I did not see CI for the new tip; the seat reports it before the land.

**Findings (none MUST):**
- SHOULD: the wait between lock checks is still the total wait divided by 100. That moved from 50 ms to 4,200 ms. A waiting save can now notice a released lock up to about 4 seconds late. This adds delay but loses nothing. A fixed short check interval would be better; record it as a known bug.
- NOTE: the brief asked to use the `locked` reason word where the refusal is reported. The build did not do that. It is recorded honestly in the known-bugs file.
- NOTE: the new known bug about a save waiting up to seven minutes behind a hung sync is the stated cost of this fix. It is recorded.
- NOTE: the number 28 is not checked against the actual code. I counted 22 lines in `profile-sync.mjs` that mention a Git call, but that count is not the same as the steps run under the lock. Since 28 is higher, the risk only goes toward waiting too long.

VERDICT: LAND
