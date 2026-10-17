# Review — win-line-endings (LF checkouts everywhere; CRLF-tolerant template scripts; mutation runner autocrlf off), 2026-10-17 (gpt-5.6-sol, the lane's one final reviewer)

Review `git diff a980a1f..HEAD` on `feat/win-line-endings` (main is `a980a1f`). The plan of record is
`docs/reviews/win-line-endings-2026-10-17/must-meet.md`: rows R-1320 to R-1322, must-meet tests LE1 to LE3, and LE4, the
Windows CI evidence. The Windows plan behind it is `docs/reviews/windows-fixes-2026-10-17/`. The seat's record
`seat-verify-c7a0bf4.md` holds the Mac suite and CI run 39065519961 (log `ci-windows-run-1.log`): every LE4 file passes
on Windows.

The review standard pi-review appends is the bar. Threat model: honest variation in git's line-ending settings and in
editors' saves in scope; deliberate forgery out. Lane class: ordinary (one final reviewer).

Check: (1) a Windows checkout of nana-pi, and a TypeScript project scaffolded or adopted on a default Windows machine,
read LF where it matters and pass their checks; (2) LE1 to LE3 each fail with their feature removed; (3) no honest
checkout or editor save loses data or breaks what main does today; (4) HANDOFF and the session entry are true; (5) any
MUST.
