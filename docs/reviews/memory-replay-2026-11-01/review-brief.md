Feature: FEAT-043 · Measure memory outcomes

Lane memory-replay. Class: ordinary. Threat model: honest variation in our tools' output is in scope (transcript shapes, shaper candidates that differ run to run, malformed or unknown-usage judge replies, sessions without recorded context, killed runs); deliberate forgery, such as planted transcripts or labels, is out.

Review `git diff origin/main...HEAD` on `feat/memory-replay`. Main is ad9612dd. The plan of record is `docs/reviews/memory-replay-2026-11-01/plan.md`, revised after `plan-attack.md`. `build-brief-1.md` and `build-notes.md` record the build. The 2026-11-01 entry "a replay test to judge the first memory delivery" in `docs/sessions/2026-10.md` summarises the lane.

The change: `npm run memory:replay` (`plan`, `screen`, `run`, `decide`) with the replay, context and config modules; outcome-score's `readRows` exported. SUB-025 under FEAT-043; R-3370 to R-3389; A-097.

The seat's record:
- Locked full suite at 1887f37d: 253 files, 251 pass, 2 skip. CI passed on all three systems. Twenty wrong-code pairs and twelve seal mutations failed red and passed green.
- The seat ran `plan` over private labels and the frozen snapshot (no spend); the counts stay private. No paid run has happened.
- Known bugs: seventeen new lines in `docs/known-bugs/FEAT-043.md`, nine carried from the outcome meter's final review and one from the seat-memory-push plan (the confirmatory run waits for that lane).

Question: does the feature work for its user, the seat deciding whether a memory delivery helps, and does the change cause a harm the review standard lists? Check especially that no arm sees records from after the replay moment; that the judge is blind to the arm and sees one reply per call; that owner text reaches only the sealed Claude runner and never stdout, stderr, the repository or a non-Claude model; that output refuses a folder inside a checkout; that the spend cap stops at a case boundary and prints incomplete; and that `decide` refuses mixed case sets and marks only the first run per bundle maker confirmatory.

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, and do not bold it.
