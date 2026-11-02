Feature: FEAT-031 · Run checks reliably and without contaminating work

Lane land-test-split. Class: ordinary. Threat model: honest variation in our tools' output is in scope (slow Windows runners, test-runner timing, renamed files in evidence cells); deliberate forgery is out.

Review `git diff origin/main...HEAD` on `feat/land-test-split`. The plan of record is `plan.md` in this folder (after `plan-attack.md`); `build-brief-1.md` records the build, done on the Windows laptop. Evidence in this folder: `suite-run-win32.txt` and `suite-run-win32-merged.txt` (full locked runs on the laptop), `timings-before-win32.txt`, `alone-runs-win32.txt`, the name lists before and after on win32 and macOS (66 names each, identical), `m3-blocks.txt`. Pull request #314 passed CI on all three systems.

The change: `packages/nana-pack/tests/land.test.mjs` is split into four files (`land.test.mjs`, `land-merge.test.mjs`, `land-ci-read.test.mjs`, `land-ci-edge.test.mjs`) so each stays under the per-file limit on Windows; every check, its `req:` tag and the evidence cells citing it move together. R-3490, R-3491.

Question: does the feature work for its user, a seat or builder running the full suite on Windows without the land tests hitting the per-file limit; did every check survive the split unchanged in name and assertion, with no check lost, duplicated or weakened; and does the change cause a harm the review standard lists?

Do not begin any line with the word "Verdict". Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else, not bolded.
