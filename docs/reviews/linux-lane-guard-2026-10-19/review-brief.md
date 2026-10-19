# Review — linux-lane-guard (the lane write guard's symlink check runs honestly on Linux), 2026-10-19 (Opus, the lane's one final reviewer)

Feature: the gate's lane write guard (R-962's checks)

Review `git diff b3f6ec2..HEAD` on `feat/linux-lane-guard` (main was `b3f6ec2` when this brief was written; `git
merge-base HEAD main` is `b3f6ec2`). The plan of record is `docs/reviews/linux-lane-guard-2026-10-19/must-meet.md` (tests
only, no new row). The seat's record `seat-verify-0947bf3.md` holds CI, the Linux log beside it.

Tree movement: none (no row changed).

Judge whether lane-write-guard's checks now run and can fail on Linux, macOS and a machine with no usable outside folder,
and whether the test writes only inside temp folders and the fixture parents it names, cleaning up after itself.

Threat model: honest variation in CI homes and temp roots in scope; deliberate forgery out. Lane class: ordinary — one
test file.

Check: (1) the must-meet checks are not vacuous; (2) no test writes outside the temp folders it owns; (3) nothing else
changed; (4) HANDOFF and the session entry are true; (5) any MUST.
