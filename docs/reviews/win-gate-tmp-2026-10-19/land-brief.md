# Review — win-gate-tmp (the lane write guard judges edits where pi writes them, in each folder's spelling on disk), 2026-10-19 (Fable, the land reviewer)

Review `git diff b3f6ec2..HEAD` on `feat/win-gate-tmp` (`git merge-base HEAD main` is `b3f6ec2`; main has since moved
to `73f39d5`, with win-objective-golden and win-review-paths, and the lane has not merged it). The plan of record is
`docs/reviews/win-gate-tmp-2026-10-19/must-meet.md`: rows R-1430 to R-1433. `plan-attack.md` holds the adversary's
AMEND and `build-brief-1.md` the one build. The seat's record is `seat-verify-ba0c960.md`: CI run 39248931880 on
297ce13 (the Windows log beside it), the wrong-code pairs (`seat-mutate.mjs`, `seat-mutate-output-297ce13.txt`, 6 of
6 red) and the independent check (`independent-check-ba0c960.md`, HOLDS, eight probes).

The code under review: `realOut`, the new `real()` and `laneWriteHit` in `packages/nana-pack/extensions/nana-gate.ts`,
the lane paragraph of `packages/nana-pack/README.md`, and four checks in
`packages/nana-pack/tests/lane-write-guard.test.mjs`. Judge whether the lane fails open (an edit or write target
outside the lane folder and the temp folders allowed, on any OS, through any of pi's path forms or any honest
spelling), whether it leaves a harm the review standard lists, and whether anything main does today stopped working on
macOS. Weigh the seat's open finding: R-1430's Windows check skipped on CI.

Threat model: honest variation in our tools' output and the OS (paths, letter case, 8.3 names, links, drive letters,
pi's `~`, `@` and `file://` forms) in scope; deliberate forgery out. Bash writes stay outside this guard (R-962).
Lane class: gate (a pi extension, the nana-gate policy).

Check: (1) no fail-open; (2) no harm the review standard lists, including a test writing outside the temp folders it
owns; (3) no macOS regression; (4) HANDOFF and the session entry are true; (5) any MUST.
