# Review — clean-revision (a checkout git calls clean reviews and lands at its plain HEAD), 2026-10-19 (Fable, the land reviewer)

Feature: FEAT-007 · Review a specific revision independently

Review `git diff a0e0a69..HEAD` on `feat/clean-revision` (the lane last merged main at `a0e0a69`, in `77289a0`; `git
merge-base HEAD main` is `a0e0a69`, and main has since moved on to `06a874a`). The plan of record is
`docs/reviews/clean-revision-2026-10-18/must-meet.md`: MM1 to MM8 (rows R-1370 to R-1377) and the R-708 and R-709
amendments; build 2 added R-1378. `plan-design.md` and `plan-attack.md` hold the design and the adversary's AMEND, which
wins where they differ; `build-brief-1.md` and `build-brief-2.md` are the two builds. The seat's record is
`seat-verify-a099700.md`: CI run 39257938251 (`ci-windows-run-1.log` beside it), the wrong-code pairs
(`seat-mutate.mjs`, 19 of 19 red on 77289a0) and the independent check (`independent-check-a099700.md`, run on 57e542b;
its MUST, a clean checkout under `core.safecrlf` refused, was fixed in build 2). The final reviewer's brief is
`review-brief.md`.

The code under review: `workingState` and `gitOut` in `packages/nana-pack/bin/review-round.mjs`, which pi-review,
review-ledger and nana-land read; their own code is unchanged. Judge whether the lane fails open: a dirty tree that derives
plain HEAD and lets nana-land merge content no reviewer saw; a review's own output changing its revision; a git failure
read as clean instead of refused; a derivation that writes the real index, objects or git folder, or runs a repository
hook. Judge whether the lane leaves a harm the review standard lists, and whether anything main does today stopped
working: admission, the round count, the in-flight and verified checks, and the land on macOS, the nested-repository and
corrupt-index refusals, and the `--out` exclusion.

Threat model: honest variation in our tools' output and the OS is in scope (git config, attributes, filters, linked
worktrees, path characters, NTFS on Windows); deliberate forgery is out. Lane class: gate (review-round's `workingState`,
behind pi-review and nana-land).

Check: (1) each must-meet test fails with its feature removed; (2) no fail-open, including the held probes P5 and P12;
(3) no write outside the scratch folder and no macOS regression in review or land; (4) HANDOFF and the session entry are
true; (5) any MUST.
