Feature: FEAT-031 · Run checks reliably and without contaminating work

Lane signal-test-race. Class: ordinary (tests only). Threat model: honest variation in our tools' output is in scope (CI runner load and timing); deliberate forgery is out.

Confirmation round 4, over the cap. Review only `git diff a4909b08 HEAD` on `feat/signal-test-race`. Round 3 (kept as `r3-reviewer-94da26ca.md`) sent back one MUST (restore the hold file so the small builder waits for the signal) and one SHOULD (an empty pid file made `stopFixtureBuilder` call `process.kill(-0, "SIGKILL")`, killing the test's own process group). `build-brief-5.md` records the fix build (6e74b6a8) and `build-5-probe.txt` its probe; `build-brief-6.md` merged main (d4285b6c).

Question: are round 3's MUST and SHOULD fixed, with R-2692's and R-2693's assertions unchanged and the records now stating the cause correctly; did the merge keep main's content; does the change cause a harm the review standard lists?

Do not begin any line with the word "Verdict". Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else, not bolded.
