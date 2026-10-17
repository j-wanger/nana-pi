# Confirmation round 2 — roster-notice (gpt-5.6-sol and gpt-6-astra, 2026-10-17)

Review only the change since round 1: `git diff 2862505..HEAD` on `feat/roster-notice`. Round 1 reviewed `2862505`:
astra said LAND; sol sent it back (`sol-r1.md`) with one MUST — on a case-insensitive file system (macOS by default,
Windows always) an agent folder spelled in a different letter case lies under the home folder but the notice showed the
absolute home path. Build 3 compares the home prefix without regard to case on darwin and win32 only, keeps the path's
own spelling after the `~`, and stays case-sensitive on linux; `paths.test.mjs` and L12 pin it. The seat's mutation
runner, split five ways: 71 of 71 caught (`seat-mutate-output-f5c2d3c.txt`; pair 71 is the new one). Acceptance: 298/298.

Threat model and lane class as in round 1 (`review-brief.md`). Check: (1) the round-1 MUST is closed for honest inputs on
macOS, Windows and Linux, and no other caller of the helper changes behaviour wrongly; (2) the new tests pin it; (3) any
MUST in the change since round 1.
