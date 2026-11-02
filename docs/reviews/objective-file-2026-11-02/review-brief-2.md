Feature: FEAT-001 · Keep goals and priorities in view

Lane objective-file. Class: ordinary. Threat model as in `review-brief.md`.

Confirmation round 2. Review only `git diff 57c4ee8d HEAD` on `feat/objective-file` (the branch was rebuilt on main ac764bcf as one commit, so compare file contents: `OBJECTIVE.md`, `docs/known-bugs/FEAT-001.md`, this folder). Round 1 (kept as `r1-*.md`) said LAND with one SHOULD and three NOTEs. Changes: the objective line now says it is the seat's wording, written when the owner said "give nana-pi its own objective file"; the two notes about stale readme-check reasons and the duplicated priority line are known-bug lines in FEAT-001; main is merged by rebuilding on it.

Question: are the SHOULD and notes handled honestly, did nothing else change, and does the change cause a harm the review standard lists?

Do not begin any line with the word "Verdict". Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else, not bolded.
