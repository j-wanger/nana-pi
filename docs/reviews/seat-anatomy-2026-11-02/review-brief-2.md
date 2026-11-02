Feature: FEAT-042 · Measure what each role's context is for

Lane seat-anatomy. Class: ordinary. Threat model: as in `review-brief.md`.

Confirmation round 2. Review only the change since round 1's send-back: `git diff 2a294a24..HEAD` on `feat/seat-anatomy`. Round 1 (`r1-reviewer-a4e5f72d.md` in this folder) sent back one MUST (each real compaction split into two segments, R-3641) and two SHOULDs (startup and clear start rows missing the system prompt; objective, adoption and roster-notice hook kinds never matched). `build-brief-4.md` took all three and regenerated `seat-counts.md`.

Question: does the change close the MUST and both SHOULDs against the real transcript order, does the builder golden stay byte-equal, does no transcript text, owner text or session id reach the repository, and does the change cause a harm the review standard lists?

Do not begin any line with the word "Verdict". Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else, not bolded.
