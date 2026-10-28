# Review — lane-class, confirmation round 2, 2026-10-28 (the final reviewer)

Feature: FEAT-029 · Navigate code and investigate impact

Class: ordinary; the threat model is round 1's (`review-brief.md`). This is a confirmation round: review only the change since round 1, `git diff fc963583..HEAD` on `feat/lane-class`. Round 1's text is `review-r1.md` (one MUST, two SHOULD, four NOTE).

What changed:
- Build 5 (51e3b35d), from `build-brief-5.md`:
  - Install code (`packages/nana-setup/bin/`, `packages/nana-setup/lib/`) and the five gate policy files are now import-hop sources that print install or gate, naming the importer. R-2963 gained `real-path.mjs` and `json-text.mjs` cases.
  - R-2966 gained a check that runs pi-worker where the class run fails and asserts the build's own exit code. The timeout path stays source-checked.
  - pi-worker drops the inline `--base main` and uses a sealed buffer size.
  - `norm()` loses its repeated replace.
- The seat's check (`seat-check-51e3b35d.md`):
  - Side by side with build 4 over 448 mapped modules and hook files, exactly your seven modules changed class.
  - Over 193 past lanes with a recorded class, judged on merit against AGENTS.md's words, no lane that needed the full ladder prints ordinary.
  - Twelve lanes that changed only the install-check instrument, the README rehearsal or the project command print install. That over-call is recorded as a FEAT-029 known bug.
- Notes: the session entry gained the round, and FEAT-029 gained the over-call line. The keep refreshed `tree-movement.md`.
- CI runs on the draft pull request at the reviewed tip, Windows leg included. The seat lands only on green.

Ask: does round 1's MUST hold closed for real changes? Does the change since round 1 introduce a new way for a change that touches a hook, install step, gate or land and review tool to print ordinary? Is R-2963 still no wider than its checks?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, including your first sentence, and do not bold it.
