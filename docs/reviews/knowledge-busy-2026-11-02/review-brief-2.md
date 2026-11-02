Feature: FEAT-013 · Install and connect harness runtimes

Lane knowledge-busy. Class: hook. Threat model as in `review-brief-1.md`.

Confirmation round 2. Review only `git diff e4768e1e HEAD` on `feat/knowledge-busy`. Round 1 (kept as `r1-*.md`, with `independent-check-92175160.md`) had one MUST from the final reviewer: `build-busy.test.mjs` called `fs.mkdtempSync` directly and broke the R-917 source check on every suite leg. The land reviewer said LAND; the independent check passed. `build-brief-4.md` records the fix build: the test now uses the folder's `tmpDir` helper, four round 1 notes are FEAT-013 known-bug lines, the README's hook budget names the new waits, and the code map is regenerated.

Question: is the MUST fixed without weakening the test, are the known-bug lines accurate to round 1, did nothing else change, and does the change cause a harm the review standard lists?

Do not begin any line with the word "Verdict". Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else, not bolded.
