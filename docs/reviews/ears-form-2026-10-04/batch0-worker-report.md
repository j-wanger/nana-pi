# Batch 0 worker report — EARS form check + Part G split

Worker: Sonnet (build), worktree `~/nana-pi-wt/ears`, branch `feat/ears-form`, cut from main `ed90650`.
Spec: `docs/reviews/ears-form-2026-10-04/design-ruling.md`. Mapping: `docs/reviews/ears-form-2026-10-04/batch-0.json`.

## Commit

One commit on `feat/ears-form`, explicit paths only (see the commit message for the full list).

## Off-form count

Measured directly against `REQUIREMENTS.md` before and after, with the same counting logic the rail now runs:

- Before: **200** rows off form (539 total rows at this worktree's HEAD — 4 more than the ruling's §0 snapshot of 535/539, drift between the ruling's measurement and this cut).
- After: **194** rows off form (550 total rows: +10 Part G rows, +1 R-756).
- Matches the ruling's expected 200 → 194 exactly.

## Rows added

All in `REQUIREMENTS.md`'s new `## 54. The requirement set` (Part G, mirrored verbatim from `templates/_shared/requirements-general.md`'s new `## G5`):

| ID | Status (nana-pi) | Pinning test |
|---|---|---|
| G-013 | `violated` (the honest residual: 194 rows still off form; closes at batch C per the ruling) | — (residual cell names the count and the ratchet) |
| G-014 | `implemented` | `packages/nana-pack/tests/requirements-trace.test.mjs::ears: a two-shall row and a no-shall row are counted, a retired one is not` |
| G-015 | `implemented` | same fixture check + `packages/nana-pack/tests/requirements-trace.test.mjs::seal: EARS_ALLOWANCE is 194 (G-015)` |
| G-016–G-020 | `untested` | split from G-001/G-003/G-005/G-007/G-008; no test pins the clause |
| G-019 | `untested` | split from G-007's second clause — deliberately NOT given G-007's cite (see "siblingCiteFlags" in batch-0.json): that cite proves the repo currently has no reverse import, not that `--check` fails when one appears |
| G-021, G-022 | `untested` | split from G-012's clauses 2/3 — deliberately NOT given G-012's cite, same reasoning, even though a case could be made it already holds (see "the claim I'd most expect to be wrong" below) |

Plus `R-756` (`implemented`, pins the new Part-G-mirrors-the-shared-file check) and `R-737` amended to `G-001 to G-022`.

## Mutation results

Each proven on a disposable copy or a disposable render, confirmed red, then restored (verified restored = all green again):

1. **TS `SHALL` regex** mutated to never match → nana-pi's repo-level test failed on the full off-form list (G-013 itself included) and the G-015 fixture test. Restored, green.
2. **TS allowance comparison** (`>` → `>=`) → the "at the allowance none" half of the G-015 fixture test went red (boundary caught). Restored, green.
3. **TS retired-exemption clause** removed → the G-014 fixture test ("…a retired one is not [counted]") went red, specifically and only. Restored, green.
4. **TS code-span masking** (`CODE_SPAN`) disabled → G-013's own row (which mentions `` `shall` `` in backticks) flipped to 2 raw shalls and was reported off form by name. Restored, green.
5. **Python `SHALL_RE`** mutated to never match, in a disposable rendered scaffold (not the template source) → 5 tests red, including the new `test_this_project_every_row_carries_exactly_one_shall`, `test_ears_counts_…` and `test_ears_over_the_allowance_…`. Disposable render deleted.

## Rendered-template results (manual acceptance)

Both templates rendered via `uvx copier copy --vcs-ref HEAD`, scaffold and adopt, dependencies installed, suites run for real:

- **TypeScript scaffold**: `pnpm install && pnpm test` — 51/51 pass, `ears: 0 rows off form (allowance 0)`.
- **TypeScript adopt**: `pnpm install` + the EARS self-test file alone — 20/20 pass (full `pnpm test` in adopt mode has pre-existing, unrelated placeholder-state failures in code-map/readme-check, documented residuals, not touched here).
- **Python scaffold**: `uv sync && uv run pytest` — 56/56 pass, `ears: 0 rows off form (allowance 0)`.
- **Python adopt**: `uv sync && uv run pytest` — 2 pre-existing, unrelated failures (code-map/readme-check placeholder state, and adopting into an empty dir has no `src/`, hence a coverage-gate error too); every EARS-related test passed (25/25 once isolated).
- **Injected two-`shall` row** (`R-900`) fails the suite naming it, in every one of the four combinations above:
  - TS: `requirements trace FAILED: R-900 carries 2 shall (one is the form)`.
  - Python: `requirements trace FAILED: R-900 carries 2 shall (one is the form)`, non-zero exit.
- **Allowance override makes it pass**, by the mechanism each language actually has:
  - TS: editing `CheckOptions.earsAllowance` at both call sites in `tests/requirements-trace.test.ts` (there is no project-wide TS config surface for this — only `CheckOptions` at the call site, same as `testRoots`/`callNames` already work) — confirmed 51/51 pass with `R-900` present.
  - Python: adding `requirements_ears_allowance = 1` to `pyproject.toml`'s `[tool.pytest.ini_options]`, **with no test file edit** — confirmed via `pytestconfig.getini(...)` in the new G-013 self-test — 56/56 (scaffold) and the EARS subset (adopt) pass.

## Totals and exit codes

- Touched tests run directly (`node --experimental-strip-types …`): `packages/nana-pack/tests/requirements-trace.test.mjs` all passed; `packages/nana-pack/tests/templates-render.test.mjs` all passed (61 checks, including the new `wantG` 22 and the Part G mirror check).
- `npm run map:check`: 172 modules, **0 problems**, exit 0 (after `npm run map` regenerated `docs/code-map.md` — the two touched test modules' headers changed).
- `npm run readme:check`: **5 problems**, all environmental and expected per the brief — this worktree has no root `node_modules` and no `apps/bench/.ext`:
  - `README.md:79` and `apps/bench/README.md:14`: `apps/bench/.ext` / `apps/bench/.ext/pi-web-access` do not exist.
  - `packages/nana-knowledge/README.md:56`: `node_modules` does not exist.
  - Exit 0 (the CLI itself doesn't fail the process; the problems are reported).
- `npm test` (once, alone, after confirming no other `scripts/test.mjs` was running): **95 files: 93 PASS, 1 FAIL, 1 SKIP · checks: 5519 pass, 2 fail, 6 skip · exit 1**. The one failing file is `packages/nana-pack/tests/readme-check.test.mjs`, failing on the identical 5 environmental problems above — pre-existing, not introduced by this batch, and exactly what the brief said to expect.

## What I could not do

Nothing in batch 0's scope was blocked. Everything the ruling assigned to batch 0 — the check in both rails, the three check rows, the block declarations, the Part G split of its six origins, the allowance at its post-batch-0 value — landed.

## The claim I would most expect to be wrong

**Placement of the split rows.** Design-ruling.md §2 says a split row sits "directly after the origin, in the origin's table." I did NOT do that for Part G: G-016 to G-022 sit together in a new `## G5` subsection at the end, not interleaved after G-001/G-003/G-005/G-007/G-008/G-012. I read this as the ruling's own intent, because §4 explicitly introduces `## G5. The requirement set` as home for the new rows, and because R-737's amended pinning test (`wantG` becomes a strict sequential `G-001..G-022`) can only pass if the ids are NOT interleaved — an interleaved placement would make `gIds` skip around (`G-001, G-016, G-002, …`) and fail that exact check. But this is my inference reconciling two instructions that point different ways for this one Part, not something the ruling states outright; a reviewer could instead rule that the general placement rule should have won, with `wantG`'s check redesigned to tolerate interleaving. If so, the fix is confined to this batch's rows (and the README description above), not the mechanism.

A second-order item I would flag for the reviewer to sample deliberately: G-019, G-021 and G-022 were kept `untested` even though their sibling clause's cited test (`no module in a package imports an app` / `every README this repo ships holds its claims`) plausibly already pins them too — I chose not to claim that without running the mutation myself for those specific clauses, per "when in doubt, untested." A reviewer re-running that mutation could legitimately promote one or more of them.
