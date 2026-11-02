Feature: FEAT-006 · Launch builders with execution limits

Lane builder-credential-strip. Class: gate. Threat model: as in `review-brief-1.md`: honest variation and an over-helpful builder or reviewer are in scope; deliberate forgery and a model that unsets variables on purpose are out; the gate stays advisory by load path.

Confirmation round 3. Review only the change since round 2: `git diff e4b010b6..HEAD` on `feat/builder-credential-strip`. Round 2 (kept in this folder): the land reviewer said LAND; the final reviewer sent back one MUST: two suite checks red on every CI leg since build 1 (R-917's double-quoted `tmpDir` import in both new test files; R-3211's expected claude-review settings env lacked the lane's credential controls). `build-brief-3.md` sent those back with three more gate forms (`git credential-store --file x get`, `gh auth status -t`, `git credential-cache get`) and the round 2 notes as FEAT-006 known-bug lines. The brief's Precedent named a file that does not exist; the laptop corrected only that path before the build. Seat pairs: 11/11 red. CI on the tip runs before this review. Pull request #324. The land waits for the owner.

Question: does the change since round 2 close the round 2 MUST with no new path for a child to read a stored credential, do the new gate forms refuse what they name while the existing negatives stay allowed, and does the change cause a harm the review standard lists?

Do not begin any line with the word "Verdict". Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else, not bolded.
