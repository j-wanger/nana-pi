# Review — win-gate-tmp (the lane write guard judges edits where pi writes them, in each folder's spelling on disk), 2026-10-19 (Opus, the final reviewer)

Feature: FEAT-006 · Launch builders with execution limits — the gate's lane write guard (R-962's boundary)

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

Tree movement: four rows added under FEAT-006, R-1430 to R-1433, all `implemented` (CAP-02 130 to 134 rows, FEAT-006
27 to 31, leaf total 1,226 to 1,230). R-962 unchanged.

The code under review: `realOut`, the new `real()` and `laneWriteHit` in `packages/nana-pack/extensions/nana-gate.ts`,
the lane paragraph of `packages/nana-pack/README.md`, and four checks plus the `contained()` helper's cross-drive guard
in `packages/nana-pack/tests/lane-write-guard.test.mjs`. Judge whether the guard now judges each target where pi's edit
and write tools write it, whether two honest spellings of the lane or the temp folder count as one, whether `/tmp`
counts only on macOS and Linux, and whether any change lets a target outside the lane and the temp folders through.
Judge whether build 3's merge kept both lanes' checks whole. The seat's earlier open finding is closed: R-1430's
Windows check runs and passes on the real runner in both later CI runs; no Windows run has shown it red on main's gate.

Threat model: honest variation in our tools' output and the OS (paths, letter case, 8.3 names, links, drive letters,
pi's `~`, `@` and `file://` forms) in scope; deliberate forgery out. Bash writes stay outside this guard (R-962).
Lane class: gate (a pi extension, the nana-gate policy).

Check: (1) each must-meet check runs the spellings and forms it names and fails on main's gate, R-1430's Windows half
included; (2) no fail-open; (3) nothing main does today stopped working on macOS, Linux or Windows; (4) the tests write
only inside temp fixtures they own and clean up; (5) HANDOFF and the session entry are true; (6) any MUST.
