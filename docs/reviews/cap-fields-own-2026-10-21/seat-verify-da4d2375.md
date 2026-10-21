# Seat checks — cap-fields-own build 1, tip da4d2375 (2026-10-21)

- Build: one, by the roster's small-lane pi builder through `pi-worker --lane cap-fields-own --lane-size small`. The
  lane branched from main c51bfcd8 (cap-kinds landed) with the plan at e1034adc (`must-meet.md`, `build-brief-1.md`).
  - Build 1 (a34fb8aa): R-2460 in FEAT-028 after R-2447; its check in `requirements-cap-kinds.test.mjs` (8/8);
    `Kind:` and `Deliverables:` or `Binds:` lines after each of CAP-01 to CAP-08's Outcome line, exactly as the
    must-meet table lists them; the outline and code map regenerated. No other ledger line changed.
- Seat re-runs on a34fb8aa, single files: requirements-cap-kinds, requirements-tree, requirements-lift,
  requirements-regroup, requirements-moved, product-report and templates-render exit 0 with no FAIL line; map:check and
  `git diff --check` clean.
- Merge: main 9e8091e2 (ledger-stages landed) merged at da4d2375 without conflict; product-report,
  requirements-cap-kinds, requirements-tree, requirements-lift and requirements-regroup re-run green there, and the
  outline check passes.
- Stage view preview (ledger-stages's `buildReport` on this ledger, before the merge): CAP-03's binds cover CAP-01,
  CAP-04, CAP-05 and CAP-07 with shared implemented rows, and CAP-02 is a gap; deliverables R-257 and R-264 are gaps
  (untested); two deliverables show a consumer.
- Wrong-code pairs (`seat-mutate.mjs`, macOS): 3 of 3 red on a34fb8aa (`seat-mutate-output-a34fb8aa.txt`).
- Not run by the seat: the full suite (the land runs the locked suite on the reviewed tip).
