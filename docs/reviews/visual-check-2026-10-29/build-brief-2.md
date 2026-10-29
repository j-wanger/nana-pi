Feature: FEAT-039 · See the product and its decisions in one report

Lane visual-check. Class: ordinary. Builder: pi-worker (small lane). Build session 2, on the tip ae270a8a, which the final reviewer accepted with LAND.

## 1. The Windows CI failure (must fix)

CI run 40954089790 failed only on the Windows suite leg: `R-3144: launches once with cold Claude reviewer flags in an empty external folder` reports `launched.command` as `undefined` where it expects `'claude'`. The test calls `run.launch(run.piArgs, { cwd: run.cwd })`, and `reviewLaunch` takes the win32 path on the runner, which resolves the command differently. The code is right; the test asserts the POSIX shape on every platform.

Fix the test, not the launcher: pass an explicit non-Windows `platform` in that `launch` call so it pins the POSIX shape everywhere. Do not change `scripts/visual-reader.mjs` or `packages/nana-pack/bin/review-launch.mjs`.

## 2. The empty per-item check (fix while there)

The reviewer found that in `packages/nana-pack/tests/visual-reader.test.mjs` the helper `splitCount` and the line filter near the R-3145 case use doubled backslashes (`\\s`, `\\d`) inside regex literals, so they look for a literal backslash and always count 0. Make them real regex escapes, and prove the check bites: break the item printing in a scratch copy, see R-3145 fail, restore it.

No row changes. No other file changes except the code map if it needs regenerating.

## Done when

The locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs` are green. Push the branch and report the CI run for the new tip once it has finished, with the Windows suite leg named.

Report: the two test changes, the mutation result and the CI run.

## Precedent

- `packages/nana-pack/tests/review-launch.test.mjs`: how tests pass an explicit platform to `reviewLaunch`.
- `packages/nana-pack/tests/visual-reader.test.mjs`: the R-3144 and R-3145 cases.
