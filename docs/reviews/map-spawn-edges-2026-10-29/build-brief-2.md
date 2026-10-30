Feature: FEAT-029 · Navigate code and investigate impact

Lane map-spawn-edges. Class: ordinary. Builder: pi-worker (larger lane). Build session 2. Build 1 stopped BLOCKED, correctly: R-3156 needs the private `gitShow` helper in `packages/nana-pack/tests/code-search.test.mjs`, and the reuse rule forbids copying it.

## The seat's decision on the blocker

Move `gitShow` into a new shared test module, `packages/nana-pack/tests/git-fixtures.mjs`, with the six-tag module header and a named export. `code-search.test.mjs` imports it from there instead of defining it; its R-3007 behaviour and its missing-history error text stay exactly as they are. The R-3156 test imports it too. Move nothing else. Add the new module to the code map as needed.

## Everything else is unchanged from build brief 1

Build to `docs/reviews/map-spawn-edges-2026-10-29/build-brief-1.md` in full: the plan of record (revision 2), rows R-3149, R-3150 and R-3152 to R-3160 and the R-1272 and R-2822 amendments, the defaults for issue 268, the built re-run of `scan.mjs` and `replay.mjs` written into the lane folder, the locked full suite in the foreground, the Done-when checks, push and the finished CI run.

Report: the built measurements; every row and test changed; each departure from the Precedent.

## Precedent

- `packages/nana-pack/tests/code-search.test.mjs`: the `gitShow` helper to move, and its callers.
- `packages/nana-pack/tests/report-fixtures.mjs`: the pattern for a shared test module with a six-tag header and named exports.
- `scripts/code-map-launch.mjs`: the launch linker this lane rewrites; keep its shape.
- `scripts/code-map.mjs`: the shim that routes `--impact`, `--check` and the written map.
- `scripts/code-search-config.mjs`: the pattern for the new sealed launch config.
- `packages/nana-pack/tests/runtime-map.test.mjs`: the R-1272 and R-2822 tests that change.
