Feature: FEAT-040 · Make and keep memory

Lane claude-cmd-launch. Class: ordinary. Builder: pi-worker (small lane). Build session 3, on the Mac, on branch tip d3db564e. Round 1 (kept in this folder as `r1-*.md`) sent back one MUST and two SHOULDs.

## Precedent

- `scripts/memory-shape-runners.mjs` (`createRunner` at lines 66-69, `claudeRunner` at line 28)
- `packages/nana-pack/lib/claude-launch.mjs`
- `packages/nana-pack/tests/claude-launch.test.mjs`

Report each departure.

## Build

1. MUST: `createRunner` defaults `spawn = spawnSync` and always passes it to `claudeRunner`, so on win32 the resolver is never reached through `createRunner()`, which `scripts/memory-run.mjs`, `memory-shape.mjs`, `outcome-meter.mjs` and `apps/bench/anatomy.mjs` all use. Stop `createRunner` from filling in a spawn for the Claude runner, so an absent spawn reaches the win32 resolver; keep `piRunner`'s own default. An injected spawn must still receive the plain `("claude", args, options)` call everywhere.
2. Widen R-3472's test: `createRunner({ runner: "claude", platform: "win32", … })` with no spawn calls the resolver once, and its launch receives the same args, stdin, env, timeout and `windowsHide` as main's call. Include `env` in the compared options (SHOULD). Add one check that a missing package entry refuses with the exact plan text (SHOULD).
3. Leave R-3474 `untested`: the seat has the laptop re-record its real-call evidence through `createRunner()` after this build.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

The new checks fail against build 2's code and pass after. Green, run locally: `node packages/nana-pack/tests/claude-launch.test.mjs`, the memory-shaping test, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs --root .`. Do not run the locked full suite. Push and stop.
