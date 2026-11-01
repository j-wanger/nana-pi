Feature: FEAT-040 · Make and keep memory

Lane owner-profile. Class: ordinary. Builder: pi-worker (small lane). Build session 3, on this branch's tip (3923f3bd, reviewed LAND in round 1).

CI run 41243722218 on 3923f3bd failed on Windows only: `packages/nana-pack/tests/profile-sync.test.mjs` "offline contention and a stopped rebase lose nothing" got `profile refused: locked`. The previous tip passed the same test on Windows. The round-1 reviewer named the cause as SHOULD 1: save and sync hold the clone lock across fetch, rebase and push, each git step may take up to its timeout, but a second writer waits only `PROFILE_LOCK_WAIT_MS` (5,000 ms), so a save that starts during a slow sync is refused.

Fix: make a second writer's wait cover the longest locked sequence the code allows (derive it from the git step timeout and the number of locked steps, or seal a value with that provenance), keep refusing with the `locked` reason only past that bound, and use the unused `locked` reason where the refusal is reported if that is the intended wording. Pin the relation in the seal test for R-3241 (or the lock-wait row) so a later change to the git timeout that outgrows the wait fails naming the row. Keep the concurrency test meaningful: it must still prove two saves started together both end committed and pushed. No other change.

## Done when

Green: locked full suite (foreground), `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check, `node scripts/identity-scan.mjs`. Push and report the finished CI run for the new tip, Windows included; rerun a failed Windows job once and say if you did.

## Precedent

- `packages/nana-pack/lib/profile-config.mjs`: `PROFILE_LOCK_WAIT_MS`, `PROFILE_LOCK_STALE_MS`.
- `packages/nana-pack/lib/profile-sync.mjs`: the locked sequence.
- `packages/nana-pack/lib/lane-lock.mjs`: bounded lock waits.
