# Review — win-pi-gate (the pi seat's gate and agent-folder tests on Windows), 2026-10-17 (gpt-5.6-sol, the lane's one final reviewer)

Review `git diff 9c965ae..HEAD` on `feat/win-pi-gate` (main is `9c965ae`). The plan of record is
`docs/reviews/win-pi-gate-2026-10-17/must-meet.md`: GA1, the Windows CI evidence for five test files; no new row. The
seat's record `seat-verify-bcb2f5a.md` holds the Mac suite and three Windows runs, logs beside it.

The review standard pi-review appends is the bar. Threat model: honest variation in Windows paths, home folders and
process behaviour in scope; deliberate forgery out. Lane class: ordinary — the changes are in tests only; no gate,
extension or library code changed.

Check: (1) the five files run to their end on Windows, and each Windows skip names a case that cannot exist there;
(2) no edited check pins less on macOS than before; (3) HANDOFF and the session entry are true; (4) any MUST.
