Reviewed `d9cf0bc..e1cc11d`. Acceptance passes **136/136**, and the focused lift tests pass. Independent probes found one material failure.

### MUST — Tree-form shares can disappear with a passing write and verification

**Locations:** `scripts/requirements-lift.mjs:175–177, 225, 667–669`; `scripts/requirements-lift-proof.mjs:110–112`.

R-1167 and `HANDOFF.md` say ledgers containing `Also applies:` are refused. Instead, legitimate feature shares enter the replaceable field block and bypass refusal.

Reproduced with a passing two-feature tree:
1. The second feature carries `Also applies: R-001`, sharing the first feature’s access-control requirement.
2. Emit its identity mapping, then omit that feature’s optional `also_applies` property—an ordinary agent-generated grouping omission.
3. Commit the mapping and run `--mapping map.json --write`.
4. Commit the result and run `--mapping map.json --verify <base>`.

**Both commands exit 0. The share disappears.** The proof reports both rows byte-identical, but the second feature has silently lost its declared access-control obligation.

Enforce the declared share refusal on tree-form input, including verification’s base blob. Add regression tests for this case. The cited refusal test currently puts `Also applies:` in a flat introduction, not a legitimate feature field.

### SHOULD — Worktree scanning skips staged removals

**Location:** `scripts/requirements-lift.mjs:817–820`.

After another worktree stages removal of `REQUIREMENTS.md`, `ls-files` fails and the scan skips it. I reproduced exit 0 even with a regenerated, modified ledger at that path.

Distinguish “absent from this branch” from “tracked in HEAD but removed from the index.” This edge case does not overwrite the other worktree, but contradicts the all-worktree cleanliness claim.

### SHOULD — Some malformed inputs still crash

**Locations:** `scripts/requirements-lift.mjs:414–423, 862`.

A mapping containing `R-001–G-002` passes shape validation, then throws in `expandRowIds`. A terminal `--verify` without its operand throws on `undefined.startsWith`.

Both fail closed without writing. Validate cross-prefix ranges and missing operands before processing them.

### SHOULD — The session overstates grouping-file protection

**Locations:** `docs/sessions/2026-10.md:9`; `scripts/requirements-lift.mjs:960–966`.

The session says both ledger and grouping match HEAD in every worktree. Only the ledger receives the worktree scan. A modified grouping in another worktree does not prevent writing; reproduced exit 0.

Either extend the check or narrow the claim.

The recorded mutation results were inspected, not rerun. No full-suite or Windows execution was performed during this review.

VERDICT: SEND-BACK
