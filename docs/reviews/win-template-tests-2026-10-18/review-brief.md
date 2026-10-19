# Review — win-template-tests (the template and test-runner tools' tests on Windows), 2026-10-18 (gpt-5.6-sol, the lane's one final reviewer)

Review `git diff 86af1e8..HEAD` on `feat/win-template-tests` (main is `86af1e8`, and `git merge-base HEAD main` is
`86af1e8`). The plan of record is `docs/reviews/win-template-tests-2026-10-18/must-meet.md`: TT1 and TT2, Windows CI
evidence for four test files, no new row, with the seat's amendment at its end. The seat's record `seat-verify-a17820a.md`
holds the Mac suite and three Windows runs, logs beside it; its audits are in `seat-audit-1.md`.

One check stays red on Windows by the amendment: "Python earlier-tag update prints Part G drift" runs the rendered
Python project's own pytest, which fails there on a template encoding bug. That bug is the next lane's product fix; this
lane changes tests only. Judge whether the amendment is honest and whether anything else is red or skipped on Windows.

The review standard pi-review appends is the bar. Threat model: honest variation in Windows paths, git, copier and
Python in scope; deliberate forgery out. Lane class: ordinary — tests and one test helper only.

Check: (1) TT1 as amended and TT2; (2) each Windows skip names a case that cannot exist there; (3) no edited check pins
less on macOS than before; (4) HANDOFF and the session entry are true; (5) any MUST.
