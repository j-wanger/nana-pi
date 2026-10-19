# Review — win-skill-occupied (Windows install refuses a requirements skill folder it did not make), 2026-10-19 (Fable, the land reviewer)

Feature: FEAT-013 · Install and connect harness runtimes

Review `git diff b8ace0b..HEAD` on `feat/win-skill-occupied` (main was `0f2e0ca` when this brief was written; `git
merge-base HEAD main` is `b8ace0b`, merged at fc674a4). The lane's own commits: `git log --oneline --first-parent
b3f6ec2..HEAD`. The plan of record is `docs/reviews/win-skill-occupied-2026-10-19/must-meet.md`: R-1420 to R-1426, with
the adversary's amendments in `plan-attack.md`; `build-brief-1.md` is the build and `build-brief-3.md` the history
recompute after the main merge. The seat's record is `seat-verify-6974bce.md`: CI on all three legs (the Windows log
beside it), the wrong-code pairs (`seat-mutate.mjs`, output beside it, 10 of 12 red, M5 and M8 declared) and the
independent check (`independent-check-6974bce.md`, HOLDS, run on 04c14e8, two known bugs recorded as residuals).

The code under review: `ownSkillCopy`, `SKILL_COPY_MARKER` and the win32 branch of `linkSkill` in
`packages/nana-setup/lib/steps.mjs`, the win32 branch of `skillLinkState` in `lib/doctor.mjs`, and the frozen list
`lib/skill-copy-history.json`. Judge whether the lane fails open (a write into, or a backup inside, a folder nana-setup
did not make; a dry run that writes; doctor reading ✓ over such a folder), whether it leaves a harm the review standard
lists (data lost, a broken install, a test writing outside its temp folders), and whether anything main does today
stopped working: a copy nana-setup made on Windows that now gets refused, a second run that is no longer "nothing to
do", or any change to the macOS and Linux path.

Threat model: honest variation in our tools' output and the OS is in scope; deliberate forgery (a planted marker, a
byte-copied SKILL.md in a foreign folder) is out. Lane class: install (nana-setup install and doctor).

Check: (1) each must-meet test fails on main's code where the plan says red today; (2) no fail-open; (3) no regression on
macOS, Linux or a Windows copy nana-setup made; (4) HANDOFF and the session entry are true; (5) any MUST.
