# Batch A1 worker report — EARS form split, Part A §1-4

Worker: Sonnet (build), worktree `~/nana-pi-wt/ears-a1`, branch `feat/ears-a1`, cut from main `3d7072b`.
Spec: `design-ruling.md` §2, `batch0-land-ruling.md` §5. Mapping: `batch-a1.json`. Applier/verifier: `apply-batch.mjs`.
Review history: astra r1 BLOCK 6/10 (`batch-a1-astra-r1.md`, 17 PINS / 3 PARTIAL) — fixed below.

## Commit

Two commits on `feat/ears-a1`: the original build, then this round's fixes (explicit paths: REQUIREMENTS.md, `scripts/requirements-trace.mjs`, `packages/nana-pack/tests/requirements-trace.test.mjs`, the marker-edited test files, `apply-batch.mjs`, `batch-a1.json`, this report).

## Astra r1 fixes

- **MUST (overclaim) — R-763, R-781 downgraded to `untested`.** Both cited only `read`/gate+objective; no fixture exercises a genuinely custom tool, an extension command, or post-edit's own output under an unrelated malformed block. Markers removed.
- **MUST — R-768 kept `implemented`**, gaining the `subject cap: a longer command gets no exception` cite: `commandHit()` always runs regardless of length (only the allow-exception eligibility is capped), so astra's inspection-bypass flips that assertion from BLOCK to ALLOW while leaving the originally-cited benign-4MB case green.
- **SHOULD — apply-batch.mjs rewritten** to verify the BRANCH against `--base <rev>` (default `main`): every pre-existing row byte-identical unless a mapped origin (checked via `git show <base>:REQUIREMENTS.md`, not in-run state), and every changed line under any test root across the full `git diff <base>` a `// req:` marker line, with one sanctioned exception (the seal literal), scanning the whole diff without stopping at the first divergence. Added marker-deletion (`new: null`) support. Proved in a disposable copy: astra's two mutations (inverted catastrophic-regex assertion; R-001 rewritten to "shall inject nothing") together make the verifier exit 1, naming both.
- **SHOULD — R-759, R-761, R-794 flipped to `implemented`** on astra-named existing assertions: T13's store-absent/folder-not-writable fixture (`trustRecord` object field) for R-759; the hook-vs-pi byte-identity assertion, which only pi's runtime can see `isProjectTrusted()`, for R-761; the six hostile-path receipt-binding assertions (fixed `receipts.dir`, HOME swapped mid-test) for R-794.
- **SHOULD — R-760 set to `violated`.** `objective.ts:479-480` tells the owner to move an obstructed lock aside, contradicting the row for that case; the fresh/future-lock case still holds. Evidence cell records both; marker removed (a `violated` row must not be traced).
- **SHOULD — R-764, R-771, R-783 reworded** to stand alone without "one"/"that residual"/"that one resolution".

## Off-form count

194 → 157 (unchanged by this round; §1-4 still zero off form).

## Rows added

37 new rows: **32 implemented**, **4 untested** (R-763, R-771, R-777, R-781), **1 violated** (R-760, new this round). Net change from round 1: R-759/R-761/R-794 untested→implemented; R-763/R-781 implemented→untested; R-760 implemented→violated.

## Merged

1 — R-050 (astra-confirmed: semantic equivalence, not shared cites).

## Sibling-cite list

**0.**

## Verifier (`apply-batch.mjs --base main`)

`ALL CHECKS GREEN`, exit 0, idempotent. Branch-level check against `main` passes: every pre-existing row byte-identical unless mapped, every test-root diff line a marker (one sanctioned seal exception). Mutation-replay proof: exit 1, naming both injected defects.

## Totals

- Rail: `ears: 157 rows off form (allowance 157)`, exit 0.
- `map:check`: 172 modules, 0 problems, exit 0.
- `readme:check`: 5 pre-existing environmental problems, exit 0.
- `npm test`: 93/95 files pass (the one failure is the same pre-existing environmental readme-check issue), 5521+ checks pass; exit 1 as expected.
