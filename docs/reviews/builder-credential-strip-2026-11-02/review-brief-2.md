Feature: FEAT-006 · Launch builders with execution limits

Lane builder-credential-strip. Class: gate. Threat model: as in `review-brief-1.md`: honest variation and an over-helpful builder or reviewer are in scope; deliberate forgery and a model that unsets variables on purpose are out; the gate stays advisory by load path.

Confirmation round 2. Review only the change since round 1: `git diff e50afc24..HEAD` on `feat/builder-credential-strip`. Round 1 (kept in this folder): the final reviewer said LAND; the land reviewer sent back one MUST (a direct review-ledger run started a Claude child whose own flag settings could put a credential helper back) and SHOULDs on the README push line and the gate's helper command forms. `build-brief-2.md` sent those back; build 2 fixed them, recorded the round 1 notes as FEAT-006 known-bug lines, then merged main 6dc5953c (builder-credentials), whose preamble sentence "Push with plain `git push`" contradicted this lane's "Do not push"; the merge kept the credential sentence and removed its push clause, updating the pinned literal in `worker-lane.test.mjs`. The seat's wrong-code pairs grew to 11 (S9 to S11), 11/11 red on win32 and macOS. Pull request #324. The land waits for the owner.

Question: does the change since round 1 close the round 1 MUST and SHOULDs without opening a new path for a child to read a stored credential, does the preamble now say one consistent thing about pushing, and does the change cause a harm the review standard lists?

Do not begin any line with the word "Verdict". Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else, not bolded.
