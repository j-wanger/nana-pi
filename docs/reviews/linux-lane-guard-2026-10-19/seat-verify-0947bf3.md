# Seat checks — linux-lane-guard build 1, tip 0947bf3 (2026-10-19)

- CI on draft pull request #32 (0947bf3): Ubuntu `150 files: 148 PASS, 0 FAIL, 2 SKIP` — lane-write-guard 9 pass
  (`ci-linux-run-1.log`); macOS 148 PASS, 0 FAIL; Windows fails only main's short-path set (fixed by win-review-paths).
- The builder's shapes on macOS (A, C = the Linux shape, D = no fixture) and two gate mutants (an unresolved realOut, a
  `..` bypass) each turn the amended checks red; the guard-only alternative hides the `..` mutant, as the plan predicted.
- No wrong-code pairs and no independent check: an ordinary lane (tests only).
