# Review — win-install-shape (the install tests on Windows), 2026-10-18 (gpt-5.6-sol, the lane's one final reviewer)

Review `git diff ddc45b4..HEAD` on `feat/win-install-shape` (main is `ddc45b4`; the lane merged it). The plan of record
is `docs/reviews/win-install-shape-2026-10-17/must-meet.md`: IS1, the Windows CI evidence for five install test files;
no new row. The seat's record `seat-verify-bd33b92.md` holds the Mac suite, the install check and three Windows runs,
logs beside it. Before this review the seat ran a skip audit (`seat-skip-audit.md`); build 3 fixed its seven findings.

The review standard pi-review appends is the bar. Threat model: honest variation in Windows paths, links, copies and
file names in scope; deliberate forgery out. Lane class: ordinary — the changes are in tests only; no install,
uninstall or doctor code changed. The seat ruled that on Windows install backs up and overwrites an occupied
requirements skill folder (macOS refuses); this lane declares that difference in the test and records it as a known
bug rather than changing it.

Check: (1) the five files run to their end on Windows, and each Windows skip names a case that cannot exist there or
a declared Windows difference; (2) no edited check pins less on macOS than before; (3) HANDOFF and the session entry
are true; (4) any MUST.
