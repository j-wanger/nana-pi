Feature: FEAT-040 · Make and keep memory

Lane memory-end-ebusy. Class: ordinary (tests only). Urgent fix, shipped alone. Threat model: honest variation in timing on hosted Windows runners is in scope; deliberate forgery is out.

Review `git diff origin/main...HEAD` on `feat/memory-end-ebusy`. `build-brief-1.md` states the failures (run 41350694982, both attempts, issue #306) and the fix.

Question: does the change stop the two Windows temp-cleanup failures without weakening any check, waiting only for processes the test itself started, with bounded waits and named retry values? Does it cause a harm the review standard lists?

Do not begin any line with the word "Verdict". Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else, not bolded.
