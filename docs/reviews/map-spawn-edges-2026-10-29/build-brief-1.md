Feature: FEAT-029 · Navigate code and investigate impact

Lane map-spawn-edges. Class: ordinary. Builder: pi-worker (larger lane). Build session 1.

Build to the plan of record, `docs/reviews/map-spawn-edges-2026-10-29/plan.md` (revision 2), which has taken the adversary's attack in `plan-attack.md`. Build its must-meet rows R-3149, R-3150 and R-3152 to R-3160, and the amendments to R-1272 and R-2822, exactly as "The rules, stated exactly" and "Must-meet" say. R-3151 stays unused.

The owner's questions are posted as optional issue 268; build on the plan's defaults (report the always-run list only; a temporary-copy launch stays unresolved; only `--impact`, `--check` and the written map use the new links).

After the code is green, re-run the lane folder's `scan.mjs` and `replay.mjs` with `MAP_EDGES=built` against the built linker, and write their outputs into the lane folder as `scan-built.txt` and `replay-built.txt`. Report the built numbers beside the prototype's: the runtime gap, the edges lost (each named), the always-run share, and the replay since 2026-10-24.

Run the locked full suite as a plain foreground command with its output on screen.

## Done when

Every new and amended row is `implemented` with backticked `file::title` evidence. The locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs` are green. Push and report the finished CI run for the new tip, naming the Windows suite leg.

Report: the built measurements; every row and test changed; each departure from the Precedent.

## Precedent

- `scripts/code-map-launch.mjs`: the launch linker this lane rewrites; keep its shape.
- `scripts/code-map.mjs`: the shim that routes `--impact`, `--check` and the written map.
- `scripts/code-search-config.mjs`: the pattern for the new sealed launch config.
- `packages/nana-pack/tests/code-search.test.mjs`: the fixture-repo test pattern and the fixed-revision comparison.
- `packages/nana-pack/tests/runtime-map.test.mjs`: the R-1272 and R-2822 tests that change.
- `docs/reviews/map-spawn-edges-2026-10-29/prototype-edges.mjs`: the seat prototype; lift from it, but not its APPROX shortcuts.
