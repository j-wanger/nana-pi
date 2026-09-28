Round 2 — serves the priority of making nana-pi consistent, coherent and effective.
Paths below are relative to `packages/nana-pack/`.

1. **MUST 1 — FIXED:** `bin/review-round.mjs:223–240,414,432–438` resolves final symlinks and dangling targets; segment containment also fixes snapshot exclusion (`:190`). Tracked targets are refused before reservation.
2. **MUST 2 — FIXED:** `bin/review-round.mjs:459,483,550` rotates before every audit append, including failed overrides. `README.md:124` explicitly declares the permanent tally and overall storage unbounded.
3. **MUST 3 — FIXED:** `README.md:191–198` requires changing to `pi-worker`, deleting `--retries 2`, and withholding `--item`/`--worker`; both external scripts still need that migration.

**New-defect assessment:** No new blocker found.
- `realOut` rethrowing `ENOTDIR`/`ELOOP` (`bin/review-round.mjs:234`) is correct: these destinations cannot presently support the write. Refusing before spending is preferable to warning and admitting.
- No segment-comparison regression found: root equality, parent traversal and cross-drive absolute results remain excluded; legitimate `..name` segments now work.
- **Undocumented residual:** force-adding an ignored, non-HEAD file introduces it through the index (`bin/review-round.mjs:185–188`), changing the snapshot without changing disk bytes. Qualify `README.md:95–97`’s staging-independence claim; this is pre-existing, not a segment regression.
- **Test carry:** `tests/review-ledger.test.mjs:304–314` now compares genuine before/after state. However, a live sentinel cannot detect accidental stale-reservation pruning; add a stale sentinel and demonstrate failure against a mutating implementation.
- Seat-reported merged-tree tests: 71 files, 3660 checks, exit 0; not independently rerun here.

SCORE: 9/10
MUST:
CARRY: Document/test the force-added ignored-file exception; strengthen the non-mutating-check test; execute README migration, install the `pi-worker` symlink, and update external basename-rule references.
VERDICT: LAND
