# Batch C worker report — EARS form split, Part C §27-47 (last batch)

Worker: Sonnet (build), worktree `~/nana-pi-wt/ears-c`, branch `feat/ears-c`, cut from main
`70ef61e` (B landed, allowance 53). Spec: Fable's trigger for C (`bc-method-ruling.md`,
"What would change my mind": A3's gap rate converged but B's didn't, 79.5% — the
per-condition rule does not converge, so **C promotes nothing**: form split only).
Also read: `design-ruling.md` §2 (the split rule), B's record (`batch-b-astra-r1.md`,
`batch-b-seat-verify.md`). Commit: see below.

## Method

53 off-form origins, two apps — desk (§27-39, 26 origins), bench (§40-47, 27 origins).
Every split-born row is `untested`, carrying the batch's standard sentence
(`"no recorded red mutation per named condition; 6b worklist"`); no mutation is run, no
`// req:` marker is added for any split-born row. Each origin keeps its ID, its current
status and (when `implemented`) its exact pre-existing `cites`, unchanged, for its own
retained first clause; only the clause TEXT is narrowed to that one clause, every split
sentence repeating the governing IF/WHEN/WHILE/WHERE and the subject so it stands alone
(e.g. R-492: "IF a fork or clone runs and the destination is not confirmed inside the
budget... THEN the fork shall inherit nothing", reintroducing "a fork or clone runs" from
the origin's WHEN since the split sentence can no longer borrow it). `merged` is empty —
no two `shall`s were judged to be one promise.

Shall-counts were verified by script against the live `Requirement` cells (122 total
across 53 origins → 69 new rows), matching design-ruling.md §0's per-origin estimates
exactly (desk 35, bench 34).

## apply-batch.mjs change

One `PACKAGE_BLOCKS` widening, same pattern as installer's existing precedent: desk's
`continuation` widened from `[[940, 959]]` to `[[940, 959], [468, 499]]` so the block's
own free numbers (design-ruling.md §0: "Free today 32") are used first (R-468–499, 32
ids) with only the 3-row overflow spilling into continuation (R-940–942). The existing
collision guard (section 2) still refuses any id already occupied. `mutationRecords` and
`conditionRecords` are both `false` for this batch, so checks (g2) and the `pins`
substring check never run — only check (g) (every `implemented` clause names a non-empty
`assertion`) applies, satisfied for the 44 origins that stay `implemented` with a uniform,
non-committal note (`"unchanged this batch: carries the origin's pre-existing status and
cites forward... no new judgement, no mutation evidence."`) — required by the script's
schema, asserting nothing new.

## Rows: before → after

| | origins | split-born | total |
|---|---|---|---|
| implemented | 44 | 0 | 44 |
| untested | 9 | 69 | 78 |
| **total** | **53** | **69** | **122** |

## Totals

- Verifier (`apply-batch.mjs batch-c.json --base main`): `ALL CHECKS GREEN`, exit 0,
  idempotent (`rows added: 0` on re-run).
- `refusal-test.mjs`: `REFUSAL TEST: ALL PASS`.
- Rail: `ears: 0 rows off form (allowance 0)`, exit 0. `EARS_ALLOWANCE` is 0
  (`scripts/requirements-trace.mjs`); both seals (`requirements-trace.test.mjs`'s title
  and comparison) read 0; G-013's evidence cell reads "0 rows off form 2026-10-04 ...".
  G-013's **status** stays `violated`, left to Fable's lane-close ruling.
- `requirements-trace.test.mjs`: 8/8 pass.
- `map:check`: 172 modules, 0 problems, exit 0.
- `npm test` (alone, confirmed no other `scripts/test.mjs` running first): 95 files — 93
  PASS, 1 FAIL, 1 SKIP; 5521 checks pass, 2 fail, 6 skip; 346.9s. The one failure,
  `packages/nana-pack/tests/readme-check.test.mjs` (5 problems: missing `node_modules`,
  missing `apps/bench/.ext`), is the worktree's pre-existing environmental gap — identical
  in kind and count to batch 0, A1, A2, A3 and B's own finding, not caused by this batch.

## Residual for 6b

78 untested rows this batch (9 origins, 69 split-born). Because C runs no mutations at
all (Fable's trigger), nothing in this batch adds or removes evidence: the 44 origins
that stay `implemented` carry their pre-existing status, cites and promise forward
byte-for-byte; the 9 untested origins keep their pre-existing `"—"`. This batch completes
the form migration (allowance 53 → 0) and contributes no new coverage claim either way to
6b's worklist. This is the last split batch in the lane.
