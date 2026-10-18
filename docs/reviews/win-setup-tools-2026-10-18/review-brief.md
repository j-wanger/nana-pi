# Review — win-setup-tools (the doctor, restore, trust and install-check tests on Windows), 2026-10-18 (gpt-5.6-sol, the lane's one final reviewer)

Review `git diff 12fe4c1..HEAD` on `feat/win-setup-tools` (main is `12fe4c1`; the lane merged it). The plan of record is
`docs/reviews/win-setup-tools-2026-10-18/must-meet.md`: ST1, the Windows CI evidence for four test files; no new row.
The seat's record `seat-verify-0cb429b.md` holds the Mac suite, the install check and three Windows runs, logs beside
it. The seat's read-only checks of both builds are in `seat-skip-audit.md` (no MUST).

The review standard pi-review appends is the bar. Threat model: honest variation in Windows paths, drives, tar and
process behaviour in scope; deliberate forgery out. Lane class: ordinary — the changes are in tests only; no doctor,
install, restore or trust code changed.

Check: (1) the four files run to their end on Windows, and each Windows skip names a case that cannot exist there;
(2) no edited check pins less on macOS than before; (3) HANDOFF and the session entry are true; (4) any MUST.
