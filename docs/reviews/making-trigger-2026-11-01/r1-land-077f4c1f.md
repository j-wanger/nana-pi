## MUST — A stopped rebase permanently blocks automatic making

**Locations:** `packages/nana-pack/lib/memory-run.mjs:97–101`; `packages/nana-pack/lib/profile-sync.mjs:74`.

A shutdown during rebase can leave the private clone on detached HEAD. `makeMemory` calls `fetchProfile` before `recoverProfile`. The fetch helper requires `symbolic-ref --short HEAD`, which fails in this state. Recovery is never reached.

Every subsequent land-triggered run fails until a seat save, sync, or manual repair aborts the rebase. This blocks automatic making under the brief’s explicit interrupted-Git threat model.

**Reproduction:** In the synthetic fixture, I paused a real rebase using `git rebase --exec false HEAD~1`. Two successive `make` calls reported `memory: failed`, made zero classifier calls, and left the rebase paused.

**Required fix:** Recover the clone under its lock before requiring an attached branch. Keep network operations outside that lock. Add a regression test proving a later making run recovers and processes pending units.

## NOTE — Land integration checks passed

Read `nana-land.mjs`, `land-config.mjs`, and the starter line by line. Merge, containment, cleanup, and existing push-command output remain unchanged. The wrapper adds lane discovery and the post-result starter line.

The starter runs after containment and review-lock release; its thrown errors preserve the land’s code and earlier output. Library calls default to no starter. CI and role guards prevent real spawning.

All **94 targeted checks passed**: eight making cases, four recovery cases, sixteen seals, and sixty-six land cases. The first combined invocation timed out; the standalone land rerun completed successfully. No real model calls were made.

VERDICT: SEND-BACK
