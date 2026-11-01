I'd land this: build 2 closes round 1's MUST, and I found no harm the review standard lists in the change since c5931f51. I reviewed only `git diff c5931f51..HEAD` and wrote nothing to the worktree. To check against real transcripts, I ran scratch scripts in the OS temp folder that printed only record types, hook labels and counts, then deleted them.

**The MUST (memory output landing in the right slot): closed**
- **The fix:** `nana: shared memory index` is now one of the hook markers (`packages/nana-pack/lib/memory-replay-config.mjs:113`). A comment beside it names its source, `packages/nana-setup/lib/settings.mjs:208`.
- **The fixture:** it now uses the label as Claude Code records it. The test asserts that the label's output is in control's slot and that treatment replaces it. It also checks that the two older markers still work.
- **Real transcripts:** I ran `rebuildContext` over this machine's nana-pi transcripts at both revisions.
  - At c5931f51, the shared-memory output sat in the shared prefix at all 31 replay points, and control's slot was empty at 14.
  - At the tip, it sits in control's slot at all 30 points (the count shifted by one between runs), is never in the prefix, and the slot is never empty.

**SHOULD 2 (keep only SessionStart outputs after the last compaction): closed**
- In every real session with compactions, the order is: compact boundary, then summary, then the SessionStart hooks. So clearing both hook lists at each boundary (`memory-replay-context.mjs:51-55`) keeps exactly the set the seat saw.
- No control slot held more than one copy of the shared-memory output.
- The test pins it: the stale shared-memory and objective outputs from before the last boundary are absent.

**SHOULD 3 (compare judged rates, print failed draws): closed**
- The per-case difference is now control's repeat rate minus treatment's failure rate, each over that arm's judged draws. The arithmetic is exact: each fraction is reduced, then scaled to a common BigInt integer (`memory-replay.mjs:236-261`). Session sums and the oracle and ceiling arms use the same path.
- A failed draw is one whose verdict is null, after either a failed reply or a failed judge call. Failed draws now print per arm beside the unclear line.
- I re-did the hand calculation for the uneven fixture:
  - Differences are −1/6, 1/3 and 1/3, which is 1, 2 and 2 in sixths, with an observed sum of 3.
  - p fewer is 2/8 and p more is 7/8.
  - Failed draws are 6/3, unclear draws 3/1, and the effect line reads "smaller by 0.166667".
- A 43-case set with every judged-draw count from 3 to 5 runs the test in 7 ms.

**NOTE (unscreened cases marked `unrun`): closed**
- Cases the cap stops `screen` from reaching stay in the screened plan marked `unrun`, and `run` makes no calls for them.
- `decide` reports `unrun 1` and marks the run incomplete. The test checks the parent plan is unchanged.

**Harm check: none found**
- The only code touched is the memory-replay modules. Nothing outside the lane imports `signFlip` or `SLOT_MARKERS`.
- The marker change alters the seal, so a plan made under build 1 will now fail its hash check. That's expected, and `plan` costs nothing to re-run.
- I found no counts from the private labels left in the lane files, the session note or the FEAT-043 known-bug line. The one match my search turned up is an unrelated line already on main.
- The replay test file passes 20 of 20 and the worktree is clean. I didn't re-run the locked full suite or CI; I relied on the seat's record for those.

**NOTEs for the known-bug file**
- The case-set hash doesn't include case status. Two screens of the same parent with different caps could in theory keep the same cases with different statuses and still share a hash. Honest runs are very unlikely to produce this.
- A screened plan's `unrun` cases can't be recovered from that plan, because re-screening it is refused. The seat has to screen again from the parent plan. The README says those cases stay `unrun`.

VERDICT: LAND
