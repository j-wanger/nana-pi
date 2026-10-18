# Review — win-session-start (both seats' session start proven on Windows), 2026-10-17 (gpt-5.6-sol, the lane's one final reviewer)

Review `git diff 9c965ae..HEAD` on `feat/win-session-start` (main is `9c965ae`; the lane merged it). The plan of record
is `docs/reviews/win-session-start-2026-10-17/must-meet.md`: row R-1340, must-meet test SS1 and SS2, the Windows CI
evidence. The seat's record `seat-verify-0b8a045.md` holds the Mac suite, the install check and three Windows runs, logs
beside it; it states why the objective test runs fewer checks on Windows than on Linux.

The review standard pi-review appends is the bar. Threat model: honest variation in Windows paths, names and home
folders in scope; deliberate forgery out. Lane class: ordinary — the changes are in tests and the row.

Check: (1) SS1 fails if the installed objective or adoption hook printed nothing or the wrong priority on Windows;
(2) no Windows skip hides a case that could run there, and no edited check pins less on macOS than before; (3) HANDOFF
and the session entry are true; (4) any MUST.
