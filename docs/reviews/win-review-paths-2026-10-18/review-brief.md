# Review — win-review-paths (the land and review tools treat two spellings of one folder as one), 2026-10-19 (Opus, the final reviewer)

Review `git diff 1e3bf1f..HEAD` on `feat/win-review-paths` (main is `1e3bf1f`, and `git merge-base HEAD main` is
`1e3bf1f`). The plan of record is `docs/reviews/win-review-paths-2026-10-18/must-meet.md`: GP1 to GP7 (rows R-1350 to
R-1356) and the evidence GP8. `plan-design.md` and `plan-attack.md` hold the design; `seat-audit-1.md` and
`seat-audit-2.md` the seat's audits of builds 1 and 2; `build-brief-1.md` to `build-brief-4.md` the four builds.
The seat's record is `seat-verify-e8d0967.md`: the wrong-code pairs (`seat-mutate.mjs`, outputs beside it), two
Windows runs (logs beside it) and the independent check (`independent-check-1187eab.md`, weak, said so).

The code under review: `packages/nana-pack/lib/real-path.mjs` (new) and the path compares in `bin/nana-land.mjs`,
`bin/pi-review.mjs`, `bin/review-round.mjs` and `bin/review-ledger.mjs`. Judge whether every compare of a folder now
treats two honest spellings of it as one, whether any of these tools now fails open (a land without a verified LAND, an
overwritten tracked output, a review's own output changing its revision), and whether anything main does today stopped
working on macOS.

Threat model: honest variation in how the OS, git and the user spell a folder is in scope; deliberate forgery is out.
Lane class: gate (the land and review tools).

Check: (1) each GP test runs every spelling it names and fails on the tools from before the lane; (2) no fail-open;
(3) no macOS regression; (4) HANDOFF and the session entry are true; (5) any MUST.
