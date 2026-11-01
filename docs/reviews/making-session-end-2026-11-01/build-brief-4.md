Feature: FEAT-040 · Make and keep memory

Lane making-session-end. Class: hook. Builder: pi-worker (small lane). Build session 4, on branch tip 23c287d5, with build 3's uncommitted work in the worktree. Build 3 stopped PARTIAL: `winCommand` refuses the JSON-schema argument's double quotes, so the npm `claude.cmd` launch cannot go through the shared helper safely.

Seat ruling: the Windows `claude.cmd` case stays a known bug. It was a plan residual accepted at the making-trigger land (A6), it lives in the shared runner this lane does not own, the native `claude.exe` that the Windows installer provides already starts through `spawnSync("claude")`, and widening `winCommand`'s quoting is a security-relevant change for its own lane.

## Precedent

- `packages/nana-pack/lib/profile-sync.mjs` (`unpushedProfile`)
- `scripts/memory-shape-runners.mjs` (as on main; build 3's uncommitted diff to it is reverted)

Report each departure.

## Build

1. Revert build 3's Windows launcher work: `scripts/memory-shape-runners.mjs`, the new case in `packages/nana-pack/tests/memory-shaping.test.mjs`, the R-3363 row, and the bare-spawn pair in `seat-mutate.mjs`. Leave R-3363 unused. Keep the FEAT-040 known-bug line about `claude.cmd` as it was on main, and add to it: "the shared `winCommand` refuses the JSON-schema argument's double quotes, so the fix needs its own lane".
2. Keep build 3's status work: `unpushedProfile` returns an unavailable count on a missing tracking ref or a detached HEAD; `nana-memory status` keeps its run line, prints `unknown` and exits as it otherwise would; doctor keeps the last-run age; R-3356 widened; the throw's known-bug line removed. Make sure its tests and the R-3356 widening match that behaviour exactly.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

Green, run locally: the touched test files, the lane's mutation runner, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check, the deliverables check and `node scripts/identity-scan.mjs --root .`. Run `node packages/nana-setup/bin/install-check.mjs` and report its exit. Do not run the locked full suite; CI is the suite. Commit, push the branch and stop.
