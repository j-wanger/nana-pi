Feature: FEAT-031 · Run checks reliably and without contaminating work

Lane signal-test-race. Class: ordinary (tests only). Threat model: honest variation in scheduling on hosted runners is in scope; deliberate forgery is out.

Review `git diff origin/main...HEAD` on `feat/signal-test-race`. `build-brief-1.md` names the three flaky checks, the runs where they failed and the fix asked for.

Question: does each check now signal only at the state its row names, proven by a fixture marker, with every assertion as strong as before, no skip or retry, and no raised timeout? Could the held fake builder or the new waits hang a case past its timeout, or leave a process behind? Does the change cause a harm the review standard lists?

Do not begin any line with the word "Verdict". Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else, not bolded.
