Feature: FEAT-040 · Make and keep memory

Lane seat-memory-push-a. Class: ordinary. Threat model: honest variation in our tools' output is in scope (launcher roles set or empty, short, unknown or ambiguous ids, records in either area); deliberate forgery, such as a planted store or a hand-made event, is out.

Review `git diff origin/main...HEAD` on `feat/seat-memory-push-a`. The plan of record is `plan.md` in this folder ("Lane A", must-meets A1 and A2); `build-brief-a1.md` records the build. The 2026-11-01 entry "profile commands refuse under any launcher role, and retract takes a short id" in `docs/sessions/2026-10.md` summarises the lane.

Question: does the feature work for its user, the seat retracting or confirming a memory record by the short id it sees, while a builder or reviewer can never read or change the owner's profile, and does the change cause a harm the review standard lists? Check especially that every command refuses under `NANA_ROLE` set or empty before reading the pointer; that a prefix matches across both areas, refuses when ambiguous, unknown or short, and writes nothing then; that a project retract lands in the project area and `readMemoryStore` honours it; and that existing profile behaviour for a seat is unchanged.

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, and do not bold it.
