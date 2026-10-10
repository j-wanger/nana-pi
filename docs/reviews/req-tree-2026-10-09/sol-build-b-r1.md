## Score: 6.5/10

The rendered ledger is correct, but the proof and checker have two adversarial bypasses. Send this back for focused fixes.

### MUST

1. **The proof accepts an undeclared heading added to both the frozen tree and ledger.**
   - `docs/reviews/req-tree-2026-10-09/prove.mjs:66-81`
   - The heading-order comparison filters out keys absent from the base tree.
   - I added `FEAT-999` to a scratch `tree-b.json` commit and inserted its rendered block into a scratch ledger.
   - The proof exited 0: `127 ledger blocks and 1659 physical lines accounted`.
   - This contradicts the promised identical heading set and order.
   - **Smallest fix:** Compare the complete ordered key arrays without filtering. Add this exact mutation to the proof attacks.

2. **The checker ignores invalid earlier metadata lines because parsing is last-write-wins.**
   - `scripts/requirements-tree.mjs:79-82`
   - I inserted `Status: done` and `Also applies: R-999` before valid lines in one feature.
   - `checkTree` reported zero problems because later valid lines overwrote both values.
   - This violates R-292’s “every requirement ID” wording and the one-line feature-block design.
   - **Smallest fix:** Collect every status and also-applies line. Reject duplicate lines and validate every listed ID. Add duplicate-line fixtures.

3. **The R-291 field checker is not independent of the renderer.**
   - `scripts/requirements-tree.mjs:270`
   - `scripts/requirements-tree.mjs:290`
   - `packages/nana-pack/tests/requirements-tree.test.mjs:35`
   - `checkOutlineFields` obtains its expected status, sharing fields, and index by calling `renderOutline`.
   - A coupled renderer/checker defect can pass after regeneration.
   - The build brief explicitly requires an independent field check.
   - **Smallest fix:** Derive expected fields and index directly from the parsed ledger inside `checkOutlineFields`, without calling `renderOutline`.

4. **The governance introduction still assigns status to every heading.**
   - `REQUIREMENTS.md:24-26`
   - It says the outline shows “every heading with its status.”
   - Only features have statuses, as R-291 and the surrounding governance correctly state.
   - **Smallest fix:** Say it shows every heading’s rows, every feature’s status and shared requirements.

### SHOULD

1. **Add the omitted “one sharing feature removed” R-291 mutation.**
   - `packages/nana-pack/tests/requirements-tree.test.mjs:71-74`
   - The tests remove one complete index row and one status, but not one feature from a multi-feature index entry.
   - The current exact-index comparison would reject it, but the declared mutation pair is absent.
   - **Smallest fix:** Remove one feature from an index row and assert `checkOutlineFields` reports the index mismatch.

2. **Reconcile the exact allowlist with the committed review artifacts.**
   - `docs/reviews/req-tree-2026-10-09/CHANGE-B.md:82-89`
   - Five files appear outside the named implementation paths.
   - The build brief and reviewer brief are not builder reports, while the build brief is described as frozen at the inputs commit but is absent there.
   - **Smallest fix:** Remove these files from this increment or explicitly amend the declared review-record exceptions before landing.

### NOTE — byte proof and attacks

- The requested proof passed: 1,004 base rows, eight new rows, 125 blocks and 1,652 physical lines.
- All 1,004 original base row lines are byte-identical.
- Relative to the inputs commit, only R-291 changed and only R-292–R-294 were added.
- R-287–R-294 requirement cells equal `tree-b.json`.
- Scratch attacks for an altered row, lost row, extra prose, old-home move, wrong status and dropped share all exited 1.
- Scratch changes to a `tree-b.json` label and row list also exited 1.

### NOTE — checker and outline

- All six clause-level checker mutations made the test red.
- R-292 rejects unknown, duplicate, retired and same-home IDs.
- R-293 rejects missing, `done`, empty reasons and whitespace-only reasons.
- All four legal lifecycle forms pass.
- R-294 rejects rows under both proposed and retired features.
- My independent parser confirmed 38 feature statuses and sharing lists.
- It confirmed 95 shared-index rows, with exact homes, listers, counts and ordering.

### NOTE — acceptance and consumers

- The seat verification script printed every result as requested.
- The locked suite passed: 132 files passed, one skipped, 6,625 checks passed.
- The tree test passed all 62 checks.
- The code-map and README checks passed.
- The requirement rail, template mirror checks and generated map remained green.
- The working tree remained clean after all attacks.

VERDICT: SEND-BACK
