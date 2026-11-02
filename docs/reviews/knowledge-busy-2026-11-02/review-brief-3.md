Feature: FEAT-013 · Install and connect harness runtimes

Lane knowledge-busy. Class: hook. Threat model as in `review-brief-1.md`.

Confirmation round 3. Review only `git diff 98c8f018 HEAD` on `feat/knowledge-busy`. Round 2 (kept as `r2-*.md`) had both reviewers say LAND, but CI then failed on macOS on this lane's own M2 check (one stale-hook pull missed under churn; earlier once on Linux). Neither machine reproduced the miss at any query timeout, idle or loaded (`query-timeout-sweep-win32.txt`, `query-timeout-sweep-darwin.txt`). `build-brief-5.md` records the product fix: the hook retries its index open and query once (50 ms delay, only while inside its budget), pull.log records structured first and second causes, and M2's failure detail now names each miss's reason; the bar stays 10/10. Main is merged (removing the old FEAT-013 busy-timeout line, which this lane fixes); three seat pairs are added (`seat-mutate-win32.txt`, 11/11 red); `seat-install-check-r3.txt` is the seat's macOS install check.

Question: does the retry stay inside the hook's budget and fail open, is nothing but structured codes logged, is M2 as strict as before, did the merge keep main's content, and does it cause a harm the review standard lists?

Do not begin any line with the word "Verdict". Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else, not bolded.
