Feature: FEAT-031 · Run checks reliably and without contaminating work

Lane signal-test-race. Class: ordinary (tests only). Threat model: honest variation in our tools' output is in scope (CI runner load and timing); deliberate forgery is out.

Confirmation round 3. Review only `git diff cf2d4290 HEAD` on `feat/signal-test-race`. Round 2 said LAND, but the tip's macOS CI (run 41367446804) killed `worker-claude.test.mjs` after 21.2 s during R-2693. `build-brief-4.md` asked for the cause and a test-only fix; `build-4-load.txt` records the builder's finding: a missed signal attempt waited for the 10 s ceiling, because the fake pi held on a file nobody writes. Each missed attempt now gets SIGTERM at once, and the hold file is no longer passed.

Question: does the change stop a missed attempt promptly without weakening R-2693's assertion, so a delivered signal is still what the check measures? Does removing the hold file reopen the race this lane set out to close? Does it cause a harm the review standard lists?

Do not begin any line with the word "Verdict". Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else, not bolded.
