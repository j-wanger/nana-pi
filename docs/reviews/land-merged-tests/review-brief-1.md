Feature: FEAT-031 · Run checks reliably and without contaminating work

# Review brief 1: land-merged-tests

Review the whole lane: `git diff main...HEAD` on branch feat/land-merged-tests.

Plan: `docs/plan/land-merged-tests.md` (revised after the adversary; Design 1–3, Residuals, M1–M5 as R-3960–R-3964). The owner approved testing the merged result before a land on 2026-11-09; the ruling change in `packages/nana-pack/rules/nana-rulings.md` is that approval, recorded.

Summary of the change: `nana-land` no longer writes a merge commit to main. When main has moved past the tip it refuses with a merge-in-lane remedy. A lane merge commit counts as covered (no new review) only when its tree equals the tree `cleanMergeTree` computes for its parents, including generated-file regeneration. Clean-merge tests that pinned landing without CI were deleted and listed in the builder report.

Questions:
- Can any merge that hides an authored edit count as covered? Can a covered merge reach main without CI on that exact tip?
- Does the refusal leave main's ref and both checkouts untouched?
- Were deleted tests only those pinning the removed behaviour, and does anything live still depend on the land-side merge path (callers, README, rulings, `nana-soul.md`, the working section)?
- Does the builder's replay (memory-sort c7c0cc30 merged with records-move 85d5d84a fails memory-run M4) hold?

Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.
