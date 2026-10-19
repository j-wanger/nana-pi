# Seat checks — tree-briefs build 1, tip 19f44f1 (2026-10-19)

- CI on draft pull request #29 (19f44f1): macOS suite `151 files: 149 PASS, 0 FAIL, 2 SKIP` (7,464 checks); Ubuntu fails
  only lane-write-guard (main's known Linux failure, fixed by the linux-lane-guard lane); Windows fails only immutable-review,
  land and review-ledger (main's short-path set, fixed by win-review-paths) — `ci-windows-run-1.log`. Install checks pass.
- The builder's must-meet test: 4 of 4 red before the script (module not found), green after; six wrong-code tries each
  turned its check red. requirements-tree, requirements-trace, skill-claims, map and README checks clean.
- The report on this lane: `FEAT-028 · Maintain requirement identity and trace links`, R-1460 to R-1463 new (implemented).
- No wrong-code pairs and no independent check: an ordinary lane.
