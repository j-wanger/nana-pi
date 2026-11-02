Feature: FEAT-008 · Integrate and clean up reviewed changes

Lane ci-suite. Class: gate. Threat model as in `review-brief.md`.

Confirmation round 3, over the merge of main only. Round 2 said LAND from both reviewers at 816b0f76, but main moved to 0b434e94 (memory-replay, making-session-end and anatomy-labeller landed) before the land. The seat kept round 2 and wrote `build-brief-4.md`; build 4 merged main (c4a0a450) and recorded the mutation rerun and the locked full suite. Review only `git diff 816b0f76..HEAD` on `feat/ci-suite`.

Question: does the merge keep this lane's behaviour and rows as round 2 accepted them, and bring main's changes in whole, including `nana-land`'s memory-making start and any lines main deleted? Every file this lane did not set out to change should equal main's. Does it cause a harm the review standard lists?

Do not begin any line with the word "Verdict". Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else, not bolded.
