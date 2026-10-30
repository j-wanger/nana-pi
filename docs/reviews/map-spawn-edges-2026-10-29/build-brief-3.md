Feature: FEAT-029 · Navigate code and investigate impact

Lane map-spawn-edges. Class: ordinary. Builder: pi-worker (larger lane). Build session 3, on the tip of build 2 plus the seat's notes.

The final reviewer sent the lane back; its review is `docs/reviews/map-spawn-edges-2026-10-29/r1-review.md`. Fix its MUST 1 and SHOULD 2. The seat records SHOULDs 3 to 5 as known bugs.

## 1. Inline-code launches (MUST 1)

In `launchSites` in `scripts/code-map-launch.mjs`, the reader marks a node launch inline when `-e`, `-p`, `--eval`, `--print` or `--input-type` appears anywhere in its arguments, including arguments after the script path that belong to the child. It then decides there is no repo code by searching only string literals. So `packages/nana-pack/tests/review-standard.test.mjs:101` (a temp copy of `bin/pi-review.mjs` launched with the child's own `-- -p review`) is dropped silently: not linked, not unresolved, not always-run.
- Count an inline flag only in node's option position, before the first argument that is not a flag.
- An inline-code argument that is not a plain string literal (a variable, a template string) is an unresolved launch, listed per call site, so its test is always-run. Never guess "no repo code".
- Add both spellings, a trailing child `-p` after a script path and inline code held in a variable, to the R-3152 fixture so the test fails when the fix is removed. Show the wrong-code pair.
- Confirm afterwards that `review-standard.test.mjs` is either linked to `bin/pi-review.mjs` or on the always-run list, and that `--impact packages/nana-pack/bin/pi-review.mjs` names it.

## 2. Ternary launches (SHOULD 2)

`callsIn` drops a call followed by `:`, treating it as a TypeScript signature, so `cond ? spawnSync(...) : x` is not a site (eight sites, among them `win32-launch.test.mjs:189` and `:193`). Recognise a call in a ternary's first branch as a site, without matching real signatures. Pin it in the fixture.

## Then

Re-run `scan.mjs` and `replay.mjs` with `MAP_EDGES=built`, rewrite `scan-built.txt`, `replay-built.txt` and `replay-built-since.txt`, and report the new runtime gap, always-run count and replay misses beside build 2's. Run the locked full suite in the foreground. Push and report the finished CI run for the new tip.

## Done when

The rows stay `implemented` with backticked `file::title` evidence. The locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs` are green.

## Precedent

- `scripts/code-map-launch.mjs`: `launchSites` and `callsIn`, the two functions to fix.
- `packages/nana-pack/tests/code-map-launch.test.mjs`: the R-3152 fixture to extend.
- `packages/nana-pack/tests/review-standard.test.mjs`: the dropped launch.
