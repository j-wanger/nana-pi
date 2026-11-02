Feature: FEAT-042 · Measure what builders see

Lane anatomy-label-check. Class: ordinary. Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.

Confirmation round 2. Review only `git diff fe749bb0 HEAD` on `feat/anatomy-label-check`. Round 1 (kept as `r1-reviewer-0dd69bbf.md`) said LAND, but main moved. `build-brief-4.md` records the follow-up build: it merged main (ac20e30a), recorded round 1's SHOULD findings and NOTE 1 as known-bug lines in `docs/known-bugs/FEAT-042.md`, rewrote the line SHOULD 5 named, and updated one HANDOFF sentence.

Question: did the merge keep main's content intact, including lines main deleted, and keep this lane's changes; are the known-bug lines accurate to round 1; did the build cause a harm the review standard lists?

Do not begin any line with the word "Verdict". Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else, not bolded.
