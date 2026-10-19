# Seat audit — win-review-paths build 2, tip 91418e4 (2026-10-18)

The seat checked build 2 alone: the subagent recheck failed on the weekly limit.

- The seven files brief 2 names, on 91418e4 on the Mac: path-spelling 11, review-standard 7, land 51, immutable-review
  17, review-ledger 155, review-round 33, worker-lane 52; 326 pass, 0 fail, 0 skip. `map:check`, the requirements trace
  and `readme:check` report 0 problems.
- Red proofs, in two clones at 91418e4 with the tool files reverted (`<seat-scratch>/w7c-proof`):
  - tools at fe03b6e (before the lane): all 11 path-spelling checks fail; GP7's non-LAND leg lands (code 0).
  - tools at 4c4afa5 (build 1): only GP1's case-divergence leg fails; the other ten pass. GP2's case-divergence leg
    passes on both, as the builder reported: it guards, it does not pin.
- Brief 2's MUST 3 (review-standard's pack copy) and MUST 4 (8.3 and `\\?\` spellings, win32 only) read as built; MUST 4
  waits on the Windows leg.

## MUSTs for build 3 (`build-brief-3.md`)

1. The dev+ino skip build 2 added to `workingState` and `copySnapshot` is not needed on measured git, and on Windows a
   JS-number ino can collide (inferred from libuv's stat). A false match leaves a real file out of the working-state
   record: a fail-open. Remove both; keep the path-key skips.
2. `fileIdentity` stays for `outInTree`, where a false match only refuses. Make it exact: bigint stat, and null for ino 0.

## Known bugs, not sent back

- SHOULD 5's `realPath` throw on ELOOP or EACCES under `mustExist` has no test.
- `inTreeRedirect` keeps its number identity compare; a false match there refuses, it does not pass.
