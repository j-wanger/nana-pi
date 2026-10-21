# Seat checks — cap-kinds builds 1 and 2, tip e8132c2f (2026-10-21)

- Builds: two, by the roster's larger-lane pi builder through `pi-worker --lane cap-kinds --lane-size larger`. The lane
  branched from main 5548d4c2 with the plan at 84f08aa3 (`must-meet.md`, `plan-attack.md`, `build-brief-1.md`).
  - Build 1 (c97ddc66): rows R-2440 to R-2447 in FEAT-028 after R-294; `scripts/requirements-tree.mjs` gains
    `CAPABILITY_FIELD_LABELS` (`contract: R-2441`), the span read in `parseLedger`, `checkCapabilityFields` in
    `checkTree`, the outline lines after Parent and their check in `checkOutlineFields`; `scripts/requirements-moved.mjs`
    gains the capability section; new `packages/nana-pack/tests/requirements-cap-kinds.test.mjs` (R-2440 to R-2446) and
    R-2447 in `requirements-moved.test.mjs`; SKILL.md, the shared organization seed and the ledger's notes describe the
    format. No change to `scripts/requirements-lift.mjs`.
  - Build 2 (e8132c2f, `build-brief-2.md`): tests and one row only. R-2443 reworded to exempt a retired constraint
    capability (it contradicted R-2445); a passing retired-constraint case; the needs test's bad-kind and retired
    targets moved earlier than the needing capability, each failure asserting the capability, `Needs:` and the token;
    kindless retired cases; the byte-order mark at the start of the new test file removed.
- Seat re-runs on c97ddc66, single files: requirements-cap-kinds, requirements-moved, requirements-tree,
  requirements-lift, requirements-regroup, templates-render, product-report, skill-claims, readme-check and rulings all
  exit 0 with no FAIL line; map:check, readme:check, trace, req:tree and `git diff --check` clean.
- Seat re-runs on e8132c2f: the builder's report (cap-kinds 7/7, moved, tree pass; map, readme, trace green) and the
  seat's pairs baseline (cap-kinds 7 PASS, moved 5 PASS) agree.
- Wrong-code pairs (`seat-mutate.mjs`, macOS): 37 of 41 red on c97ddc66
  (`seat-mutate-output-c97ddc66.txt`; P2, B6, N2 and N3 survived, each a test gap) and 41 of 41 on e8132c2f
  (`seat-mutate-output-e8132c2f.txt`). D4 goes red by a throw; B6 also names R-2445, which stays green (declared).
- Not run by the seat: the full suite (the land runs the locked suite on the reviewed tip) and a Windows pairs run
  (the lane has no platform branch; CI's Windows leg runs every test file).
