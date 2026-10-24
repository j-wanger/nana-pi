# Review — hard-kill-watcher, confirmation round 3, 2026-10-24 (the final reviewer)

Feature: FEAT-006 · Launch builders with execution limits

Class and threat model as round 1's brief, `review-brief.md` in this folder.

This is a confirmation round, for the standard reason: confirmation round on the final tip after fixes to named findings or a merge of current main. Round 2 at 46a55957 ended LAND from both reviewers (`r2-opus-c7df8c89.md`, `r2-land-cd600d77.md` in this folder). Review only `git diff 46a55957..HEAD` on `feat/hard-kill-watcher`. Main is still fc06e29d.

Why there is a round 3: the Windows CI suite leg failed at every tip from build 1 on (runs 40052982470, 40056844401, 40057408224, 40059923100), and the seat had not read those runs when it wrote rounds 1 and 2. Five checks failed only on Windows (R-2721, R-2722, R-2724, R-2728 in worker-claude.test.mjs; R-2725 in build-report.test.mjs). In each, the product's effects were right (the end record arrived, the temp folder was empty, the lock was as expected), but the test could not see the watcher.

What changed since round 2:
- dddb98c4 and c60ce369: build briefs 3 and 4.
- 7d03134b (build 3): a shared `windowsLaneWatchers` in `packages/nana-pack/tests/process-tree-helper.mjs` lists node processes other than the PowerShell query itself, matched by the lane folder's last path segment, because the watcher's JSON spec doubles every backslash in its command line. Both test files call it; their macOS `ps` branches are unchanged.
- ee94a415 (build 4): a shared `watcherWorkerPid` reads the worker pid with and without escaped quotes (`\"workerPid\":`), for R-2728's `alphaGone` and `betaIntact`; the second lane's fake build sleeps 15 seconds on Windows (3 elsewhere).
- 69ecc3d0 and 791413f8: the seat's pairs, 23 of 23 red at 7d03134b and at ee94a415.
- 95060218: notes (the session entry's builds and evidence; a FEAT-013 line for R-1713, a knowledge-hook timing check that failed once on the Windows leg at 7d03134b and passed at ee94a415; round 2's texts kept).
- The final commit adds these briefs.

No product code changed since round 1. CI at ee94a415 passed on every leg: the three suites (macOS, Ubuntu, Windows) and the four install checks. Builds 3 and 4's locked full suites on macOS: 218 PASS, 0 FAIL, 2 SKIP each. CI runs again on this round's tip; the seat reads it and lands only on green.

Ask: do the Windows lookups now find exactly this test's watcher processes, so each check can fail for the reason it names, and does anything in the change since round 2 weaken a macOS check or block the land?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, and do not bold it.
