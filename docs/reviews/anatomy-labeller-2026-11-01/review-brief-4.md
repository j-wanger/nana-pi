Feature: FEAT-042 · Measure builder context

Lane anatomy-labeller (Part 1). Class: ordinary. Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.

Confirmation round 4, over the merge of main only. Round 3 said LAND at b4b4bc0a, but main moved to d7af5876 before the land. The seat kept round 3 and wrote `build-brief-4.md`; build 4 merged main (5e0ca799). Review only `git diff b4b4bc0a..HEAD` on `feat/anatomy-labeller`.

Question: does the merge keep this lane's behaviour and rows as round 3 accepted them, and bring main's memory-replay and making-session-end changes in whole, including lines main deleted? Every file this lane did not set out to change should equal main's. Does it cause a harm the review standard lists?

Do not begin any line with the word "Verdict". Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else, not bolded.
