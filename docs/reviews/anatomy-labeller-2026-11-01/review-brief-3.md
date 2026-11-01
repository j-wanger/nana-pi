Feature: FEAT-042 · Measure builder context

Lane anatomy-labeller (Part 1). Class: ordinary. Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.

Confirmation round 3. Round 2 reviewed be5d10cf and sent back one MUST: the merge restored two `docs/known-bugs/FEAT-039.md` lines main deleted. Since then the seat kept round 2 and wrote `build-brief-3.md`, and build 3 (93efe23d) removed the two lines. Review only `git diff be5d10cf..HEAD` on `feat/anatomy-labeller`.

Question: is `docs/known-bugs/FEAT-039.md` now identical to main's, does every file the lane did not set out to change match main, and does the change cause a harm the review standard lists?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, and do not bold it.
