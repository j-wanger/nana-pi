Feature: FEAT-031 · Run checks reliably and without contaminating work

Lane signal-test-race. Class: ordinary (tests only). Threat model as in `review-brief.md`.

Confirmation round 2. Round 1 reviewed 279c6c0a and sent back one MUST (R-2721 broken on Windows) and one SHOULD (the R-2720 change did not match its Ubuntu failure); its text is kept as `r1-*.md`. Build 2 (df219d30) restored R-2720 and R-2721 exactly as on main; the seat recorded the R-2720 lock case as a FEAT-031 known bug and updated the session entry; build 3 (94d6a1b3) merged main. Review only `git diff 279c6c0a..HEAD` on `feat/signal-test-race`.

Question: is `worker-claude.test.mjs`'s diff against main now limited to R-2693's case, with R-2721 identical to main; are R-2693 and the locked-suite check still signalled only at their named states, with every assertion as strong as before; does the merge bring main in whole? Does the change cause a harm the review standard lists?

Do not begin any line with the word "Verdict". Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else, not bolded.
