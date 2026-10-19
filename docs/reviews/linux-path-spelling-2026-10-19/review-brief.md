# Review — linux-path-spelling (the path-spelling test's case-divergence checks skip on a case-sensitive volume), 2026-10-19 (Opus, the lane's one final reviewer)

Feature: FEAT-007 · Review a specific revision independently — the folder-spelling checks GP1 and GP2 (R-1350 and
R-1351's case-divergence checks)

Review `git diff b8ace0b..HEAD` on `feat/linux-path-spelling` (the lane branched from main `b8ace0b`; `git merge-base
HEAD main` is `b8ace0b`; main has since moved to `0f2e0ca`, and this branch has not merged it). The plan of record is
`docs/reviews/linux-path-spelling-2026-10-19/must-meet.md` (tests only, no new row; R-1350 and R-1351 keep their rows),
with the build in `build-brief-1.md`. The seat's record `seat-verify-1008d16.md` holds CI, the Linux log beside it.

Tree movement: none (`requirements-moved.mjs --base main` prints `tree movement: none`; no row added or changed).

Judge whether GP1 and GP2 still run and can fail on a case-insensitive volume (macOS here, Windows on CI), skip with a
printed reason only where the rename left two different folders (a case-sensitive volume, Linux CI), and decide that by
asking the volume, not the platform.

Threat model: honest variation in our tools' output and in the OS and its file systems (case-sensitive and
case-insensitive volumes) in scope; deliberate forgery out. Lane class: ordinary — one test file.

Check: (1) must-meet 1 to 3 are met and not vacuous: on a case-insensitive volume the new guard is false and both checks
run (CI's Windows PASS lines; macOS `11 pass`); (2) the new guard cannot skip a check on a case-insensitive volume for an
honest reason other than two folders, such as a fixture file that was never written; (3) each `// req:` marker still sits
directly above its `check(` call, and nothing else under `packages/` changed; (4) no test writes outside the temp folders
it owns; (5) HANDOFF and the session entry are true; (6) any MUST.
