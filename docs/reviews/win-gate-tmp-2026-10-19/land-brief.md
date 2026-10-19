# Review — win-gate-tmp (the lane write guard judges edits where pi writes them, in each folder's spelling on disk), 2026-10-19 (Fable, the land reviewer)

Review `git diff a0e0a69..HEAD` on `feat/win-gate-tmp` (`git merge-base HEAD main` is `a0e0a69`, main when the lane
last merged it at e1e97f6). Main has moved on since (to `06a874a` when this brief was written), so the land needs
another merge of main and a confirmation round on the merged tip. The plan of record is
`docs/reviews/win-gate-tmp-2026-10-19/must-meet.md`: rows R-1430 to R-1433. `plan-attack.md` holds the adversary's
AMEND. Three builds: `build-brief-1.md` (the change), `build-brief-2.md` (the test's `contained()` helper reads a path
on another drive as outside, so R-1430's Windows half runs on CI) and `build-brief-3.md` (the merge of main a0e0a69,
whose linux-lane-guard lane also changed the guard's test; both lanes' fixtures kept). The seat's record is
`seat-verify-5f4dcef.md`: CI runs 39254810413 on a350d3b and 39258781118 on e1e97f6 (the run-3 Windows log beside
it), the wrong-code pairs re-run on e1e97f6 (`seat-mutate.mjs`, `seat-mutate-output-e1e97f6.txt`, 6 of 6 red) and
the independent check (`independent-check-ba0c960.md`, HOLDS, eight probes, run on 297ce13). `seat-verify-ba0c960.md`
and `ci-windows-run-1.log` are the earlier record, from when R-1430's Windows check skipped on CI.

The code under review: `realOut`, the new `real()` and `laneWriteHit` in `packages/nana-pack/extensions/nana-gate.ts`,
the lane paragraph of `packages/nana-pack/README.md`, and four checks plus the `contained()` helper's cross-drive guard
in `packages/nana-pack/tests/lane-write-guard.test.mjs`. Judge whether the lane fails open (an edit or write target
outside the lane folder and the temp folders allowed, on any OS, through any of pi's path forms or any honest
spelling), whether it leaves a harm the review standard lists, and whether anything main does today stopped working on
macOS. The seat's earlier open finding is closed: R-1430's Windows check runs and passes on the real runner in both
later CI runs; no Windows run has shown it red on main's gate.

Threat model: honest variation in our tools' output and the OS (paths, letter case, 8.3 names, links, drive letters,
pi's `~`, `@` and `file://` forms) in scope; deliberate forgery out. Bash writes stay outside this guard (R-962).
Lane class: gate (a pi extension, the nana-gate policy).

Check: (1) no fail-open; (2) no harm the review standard lists, including a test writing outside the temp folders it
owns; (3) no macOS regression; (4) HANDOFF and the session entry are true; (5) any MUST.
