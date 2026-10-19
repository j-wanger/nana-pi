# Review — win-gate-tmp (the lane write guard judges edits where pi writes them, in each folder's spelling on disk), 2026-10-19 (Opus, the final reviewer)

Feature: FEAT-006 · Launch builders with execution limits — the gate's lane write guard (R-962's boundary)

Review `git diff b3f6ec2..HEAD` on `feat/win-gate-tmp` (`git merge-base HEAD main` is `b3f6ec2`; main has since moved
to `73f39d5`, with win-objective-golden and win-review-paths, and the lane has not merged it). The plan of record is
`docs/reviews/win-gate-tmp-2026-10-19/must-meet.md`: rows R-1430 to R-1433. `plan-attack.md` holds the adversary's
AMEND and `build-brief-1.md` the one build. The seat's record is `seat-verify-ba0c960.md`: CI run 39248931880 on
297ce13 (the Windows log beside it), the wrong-code pairs (`seat-mutate.mjs`, `seat-mutate-output-297ce13.txt`, 6 of
6 red) and the independent check (`independent-check-ba0c960.md`, HOLDS, eight probes).

Tree movement: four rows added under FEAT-006, R-1430 to R-1433, all `implemented` (CAP-02 123 to 127 rows, FEAT-006
27 to 31, leaf total 1,215 to 1,219). R-962 unchanged.

The code under review: `realOut`, the new `real()` and `laneWriteHit` in `packages/nana-pack/extensions/nana-gate.ts`,
the lane paragraph of `packages/nana-pack/README.md`, and four checks in
`packages/nana-pack/tests/lane-write-guard.test.mjs`. Judge whether the guard now judges each target where pi's edit
and write tools write it, whether two honest spellings of the lane or the temp folder count as one, whether `/tmp`
counts only on macOS and Linux, and whether any change lets a target outside the lane and the temp folders through.
Judge the seat's open finding: R-1430's Windows check skipped on CI, so nothing on Windows shows the gate refusing
`\tmp`.

Threat model: honest variation in our tools' output and the OS (paths, letter case, 8.3 names, links, drive letters,
pi's `~`, `@` and `file://` forms) in scope; deliberate forgery out. Bash writes stay outside this guard (R-962).
Lane class: gate (a pi extension, the nana-gate policy).

Check: (1) each must-meet check runs the spellings and forms it names and fails on main's gate, R-1430's Windows skip
included; (2) no fail-open; (3) nothing main does today stopped working on macOS, Linux or Windows; (4) the tests write
only inside temp fixtures they own and clean up; (5) HANDOFF and the session entry are true; (6) any MUST.
