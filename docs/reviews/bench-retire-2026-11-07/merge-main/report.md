# Merge main into bench-retire

Branch: `feat/bench-retire`.
Parents: lane `00ebda66e03a342cd5ee2b37ad4edbfcdacfbf4c`; main `ae1f14f9216516e64165264e142831d567eb7222`.

## Conflict resolutions

`git merge --no-commit --no-ff main` exited 1, reporting two conflicted files. Contrary to the brief's prediction, `REQUIREMENTS.md` merged automatically.

- `REQUIREMENTS.md`: kept the automatic union. A comparison against the common base proved all 95 lane-changed/new rows and all 76 main-changed/new rows byte-identical to their respective parent. All base IDs survive; no rows were renumbered. Exact IDs appear in `row-preservation.log`.
- `docs/code-map.md`, original lane line 10: conflicting module totals. Regenerated with `npm run map`; merged total is 592.
- `docs/code-map.md`, original lane line 742: conflicting callers of `scripts/code-map.mjs`. Regeneration retains the retirement test and removes the retired classifier.
- `docs/code-map.md`, original lane line 1167: conflicting callers, callees and launch line numbers of `scripts/test.mjs`. Regeneration removes both sides' retired tests and recomputes launch locations.
- `docs/code-map.md`, original lane line 2636: conflicting callers of `process-tree.mjs`. Regeneration removes the study runner and mutation runner callers.
- `packages/nana-pack/tests/code-map-launch.test.mjs`, first hunk in R-3156: retained both the retired study module set and main's retired source map, including both sides' explicit edge-loss reasons.
- The same test, second hunk: retained the lane's study-edge loss registration and main's absent-retired-source allowance. No assertions were inverted or deleted.
- `docs/requirements-tree.md`: regenerated with `npm run req:tree`, despite its clean automatic merge.

Main's deletions stand, including the classifier, mutation runner, their config modules and their three test files. No unrelated implementation changes were authored.

## Checks before the merge commit

| Command | Exit | Result / evidence |
|---|---|---|
| `npm run map` | 0 | 592 modules; `map.log` |
| `npm run map:check` | 0 | 0 problems; `map-check.log` |
| `npm run readme:check` | 0 | 991 claims, 0 problems; `readme-check.log` |
| `npm run req:tree` | 0 | 2581 rows, 43 features, 0 problems; `tree.log` |
| `node scripts/component-audit.mjs --check` | 0 | Existing report-only staleness and 43/298 unclaimed modules; `component-audit.log` |
| `node scripts/requirements-trace.mjs` | 0 | 2581 rows, 2228 traced; `trace.log` |
| `node scripts/test.mjs <each path in test-files.txt>` | 0 | 27 files: 27 PASS, 0 FAIL, 0 SKIP, 0 WARN; 959 checks pass, 0 fail, 3 skip; `touched-tests.log` |
| Row preservation comparison | 0 | Both parents' changed rows preserved exactly; `row-preservation.log` |
| `git diff --check` | 0 | No whitespace errors |

The test paths are the union of added/modified surviving test files on either side since merge base `89afbe5598bd0ded716df1fe8c57515122f4fda6`. The initial filter array also named `scripts/test.mjs`, the runner rather than a collected test; it matched no additional file. `test-files.txt` lists the 27 actual test files.

## Scope and omissions

No new tests, requirement rows, tunables, mutation pairs or helper functions were introduced. The only manually edited existing test combines both parents' R-3156 retirement exceptions. No precedent departure applies to this fix brief. No known-bug fix was attempted. No full suite was run: `AGENTS.md` delegates it to CI. No CI was read, no model sessions launched, no issue operations performed and nothing pushed. Windows verification remains with CI.

The named seat checks will also run on the merge commit; their final-tip results belong in the builder's final report. Long pre-commit outputs are committed alongside this record.
