Feature: FEAT-040 · Make and keep memory

Lane making-session-end. Class: hook. Threat model as in `review-brief.md`.

Confirmation round 5. Round 4 reviewed 6d6e2605 (the merge of main at b757e4d0) and wrote LAND, but its first line began "Verdict: LAND.", so the ledger read the verdict as malformed and `nana-land` refuses that revision. This commit only keeps round 4's text (`r4-*.md`) and adds this brief. Review only `git diff 6d6e2605..HEAD` on `feat/making-session-end`, and confirm that round 4's findings on the merge still hold for this tip.

Do not begin any line with the word "Verdict". Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else, not bolded.
