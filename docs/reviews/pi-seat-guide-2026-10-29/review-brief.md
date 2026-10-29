# Review — pi-seat-guide (a pi seat reads the same seat guide as a Claude Code seat), 2026-10-29 (final reviewer and land reviewer)

Feature: FEAT-006 · Launch builders with execution limits

Class: install, hook or gate. `node scripts/lane-class.mjs` prints `hook: packages/nana-pack/extensions/nana-rulings.ts — pi extension`. The lane installs the seat guide into pi's agent dir, adds a doctor row and an uninstall entry, makes the rulings extension inject the guide for seat sessions, adds one pi sentence to the guide, and checks the guide's heading in the live install check.

Threat model: honest variation is in scope: a missing, empty, oversized or non-UTF-8 installed guide; Windows copies; a stale copy after the guide changes; builder and reviewer sessions; a fresh install and a re-install. Deliberate forgery is out. A finding outside this model is a residual.

Review `git diff main...HEAD` on `feat/pi-seat-guide`. The plan of record is `docs/reviews/pi-seat-guide-2026-10-29/plan.md`, after one adversary pass (`plan-attack.md`). The owner said "Go" to this lane; the current priority's appetite names it.

The seat's record:
- **Two builds.** The one independent check (`independent-check-da190156.md`) found no MUST and one SHOULD. The seat's 18 wrong-code pairs at build 1 (`seat-pairs.md`) found four missed test cases. Build 2 (4bb3f463) pinned all four, called the existing path helper in install and doctor, and moved the pi sentence next to the bullet it qualifies. All 18 pairs fail as they should at build 2.
- **Locked full suite at build 2:** 232 files, 230 pass, 2 skip. The local macOS install check passed 18 of 18.
- **Notes before this round:** HANDOFF lanes line, session entry, known bugs in FEAT-006 (the independent check's NOTE points and two carries from the outside-precedent review). The lane's keep wrote `tree-movement.md`.
- **CI** runs on draft pull request 252 at the reviewed tip, the Windows leg included. The seat lands only on green.

Ask above all:
- Does a pi seat session get the guide, and do builder and reviewer sessions never get it?
- Does any guide state block pi, throw, or change the rulings section?
- Do install, re-install, doctor and uninstall handle the guide on macOS and Windows as they handle the rulings file?
- Is each row no wider than its test?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, including your first sentence, and do not bold it.
