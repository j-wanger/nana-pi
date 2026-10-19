# Review — install-honest-report (install tells the truth about a held lock and its own skill links), 2026-10-19 (Fable, the land reviewer)

Feature: FEAT-013 · Install and connect harness runtimes

Review `git diff 713d6aa..HEAD` on `feat/install-honest-report` (main is `27603d4` as this brief is written; `git
merge-base HEAD main` is `713d6aa`, merged at cc2c4ed). The lane's own commits: `git log --oneline --first-parent
a1ea491..HEAD`. The plan of record is `docs/reviews/install-honest-report-2026-10-19/must-meet.md`: R-1590 to R-1593,
with the adversary's amendments in `plan-attack.md`; `build-brief-1.md` is the build and `build-brief-1b.md` its finish
after a launcher stall. The seat's record is `seat-verify-702b9bc.md`: CI on all three legs (the Windows log beside it),
the wrong-code pairs (`seat-mutate.mjs`, output beside it, 8 of 9 red, M9 declared) and the independent check
(`independent-check-702b9bc.md`, FINDINGS: F1, a MUST, fixed in 702b9bc; F2, a known bug, recorded as a residual).

The code under review: `install()`, `stepSettings` and `stepRetiredArtifacts` in `packages/nana-setup/lib/steps.mjs`.
Judge whether the lane fails open (a write under the home while another run's lock is held; a "Nothing was written" line
that is false; a dry run that takes or waits on the lock; a link at a managed skill name that no row reports; a link at
a retired name that loses its row), whether it leaves a harm the review standard lists (data lost, such as a
`settings.json` another run wrote; a broken install, such as a lock left behind that blocks every later run; a test
writing outside its temp folders), and whether anything main does today stopped working: `stepSettings` called alone
no longer taking its lock, uninstall's own lock, the report's row order, a second run that is no longer "nothing to
do", or the win32 path.

Threat model: honest variation in our tools' output and the OS is in scope; deliberate forgery (a crafted lock, a
planted look-alike pack tree) is out. Lane class: install (nana-setup install: the settings lock and the
retired-artifacts report).

Check: (1) each must-meet test fails on main's code where the plan says red today; (2) no fail-open; (3) no regression
on macOS, Linux or Windows; (4) HANDOFF and the session entry are true; (5) any MUST.
