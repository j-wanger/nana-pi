Feature: FEAT-031 · Run checks reliably and without contaminating work

Lane selective-ci. Class: gate. Builder: pi-worker (larger lane). Build session 3, on a3ce7b7c.

The independent check (`independent-check-a3ce7b7c.md`) found one material problem. When the newest finished push run on main was cancelled, `nana-main-ci` reads it as red on every leg. `--post` would then open a "main CI: suite" issue that never says "cancelled". 14 of the last 100 main push runs were cancelled, because a newer push cancels the older run.

## Fix (R-3183)

- Skip cancelled runs. Report the newest finished run whose conclusion is not `cancelled`, and print one line naming how many newer cancelled runs were skipped.
- When every finished run in the page is cancelled, print one named line, exit 0 and post nothing.
- Never post an issue for a cancelled run.
- Add one test case for each of the two cases above, under R-3183's existing test. Add a wrong-code pair: drop the skip, see the test fail with exit 1, restore and see exit 0.

Leave the other independent-check findings alone. The seat records them as known bugs: red with no reason when the run's commit is missing locally, and the untested duplicate check on titles that are file paths.

## Done when

R-3183 stays `implemented` with its evidence. These are green: locked full suite in the foreground, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs`. Push and report the finished CI run for the new tip. A Windows R-3104 timeout is a known flake: rerun the failed job once before reporting. Do not run the install check; the seat runs it.

Report: the commit, the test cases added, the pair's exits, and each departure from the Precedent.

## Precedent

- `packages/nana-pack/lib/main-ci.mjs`: the run filter to extend.
- `packages/nana-pack/tests/main-ci.test.mjs`: the R-3183 cases to extend.
