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

## The claim I would most expect to be wrong (as of the original submission)

**Placement of the split rows.** Design-ruling.md §2 says a split row sits "directly after the origin, in the origin's table." I did NOT do that for Part G: G-016 to G-022 sit together in a new `## G5` subsection at the end, not interleaved after G-001/G-003/G-005/G-007/G-008/G-012. I read this as the ruling's own intent, because §4 explicitly introduces `## G5. The requirement set` as home for the new rows, and because R-737's amended pinning test (`wantG` becomes a strict sequential `G-001..G-022`) can only pass if the ids are NOT interleaved — an interleaved placement would make `gIds` skip around (`G-001, G-016, G-002, …`) and fail that exact check. But this is my inference reconciling two instructions that point different ways for this one Part, not something the ruling states outright; a reviewer could instead rule that the general placement rule should have won, with `wantG`'s check redesigned to tolerate interleaving. If so, the fix is confined to this batch's rows (and the README description above), not the mechanism.

A second-order item I would flag for the reviewer to sample deliberately: G-019, G-021 and G-022 were kept `untested` even though their sibling clause's cited test (`no module in a package imports an app` / `every README this repo ships holds its claims`) plausibly already pins them too — I chose not to claim that without running the mutation myself for those specific clauses, per "when in doubt, untested." A reviewer re-running that mutation could legitimately promote one or more of them.

**This is exactly the item astra round 1 ruled on (MUST 3): the explicit placement rule wins.** See the round-1 section below.

---

## Round 1 — astra BLOCK 6/10 (`batch0-astra-r1.md`), all six items fixed

### MUST 1 — code-span masking now matches backtick RUNS (CommonMark), both rails

Both rails previously masked only single-backtick spans (`` `[^`]*` ``), so a double-backtick
span (`` ``shall`` ``) was read as two adjacent empty spans with the real word exposed between
them — counted 2 instead of 1. Replaced with a proper matching-run masker (`maskCodeSpans` /
`_mask_code_spans`): a run of N backticks opens a span that closes only at the next run of
exactly N. Fixtures for single-, double- and embedded-backtick spans added to the shared
`PARITY_FIXTURES` corpus (below), identical strings in both languages.

### MUST 2 — G-014/G-015 now pin the full clause, in all three places

- **G-014** ("report...in its own line after the summary line"): `check()` gained a `report`
  field (`` `${line}\n${earsLine}` ``), a structural guarantee a test can pin without spying on
  a consumer. Pinned in: the TS template self-test (`report.split("\n") === [line, earsLine]`),
  the Python template self-test (same, plus a NEW pytester test running the REAL
  `pytest_sessionfinish` hook as a subprocess and checking `fnmatch_lines` ordering), and
  nana-pi's own test — the strongest form: spawns the REAL shipped CLI
  (`scripts/requirements-trace.mjs`) and asserts its actual stdout has the `ears:` line
  immediately after the `requirements:` line, content included.
- **G-015** ("...fail naming EACH off-form row"): every fixture upgraded from one off-form row
  to two, asserting both ids by name (and the count), in all three places.
- **Mutation proof, both of astra's named mutations, in all three places:** "WRONG REPORT"
  (replacing `earsLine`'s computation) and "report only the first offending row" (changing the
  loop to push only `earsOffFormIds[0]`) each turn the G-014/G-015 tests red — confirmed on
  nana-pi's CLI-spawning test, a fresh TS scaffold render, and a fresh Python scaffold render;
  restored, green.

### MUST 3 — split-row placement: the explicit rule wins, as astra ruled

G-016 to G-022 moved directly after their respective origins (G-001/G-003/G-005/G-007/G-008,
G-012×2), in BOTH `templates/_shared/requirements-general.md` and `REQUIREMENTS.md`. G5 now
holds only G-013 to G-015. R-737's test (`templates-render.test.mjs`) now compares SORTED id
arrays plus an explicit `gIds.length === new Set(gIds).size` duplicate check, instead of
requiring sequential top-to-bottom order; the cited test TITLE is unchanged, so no
REQUIREMENTS.md evidence cite needed updating. Mutation proof: injected a duplicate `G-016` row
→ the (sorted-array) check still caught it (`duplicates: true`), naming all four
language/mode combinations; restored, green.

### MUST 4 — one word-boundary rule, identical in both languages

JS's `SHALL` is now `` /(?<![\p{L}\p{N}_])shall(?![\p{L}\p{N}_])/giu ``; Python's is
`` (?<!\w)shall(?!\w) `` — Python's stdlib `\w` is already Unicode-aware and gives the same
answer on every shared fixture, so no third-party `regex` dependency was needed. A 13-case
`PARITY_FIXTURES` corpus (same literal strings in both languages: ordinary, single/double/
embedded-backtick spans, a quoted `"shall"`, `shallower`, sentence-initial `Shall`, `shallé`,
`éshall`, `shall_`, `Shall.`, no-promise, two-promises) is asserted in both template self-tests.
Mutation proof: reverting JS's `SHALL` to plain `\bshall\b` turns the parity test red on
`shallé` (expected 1, got 2) — a fresh render reproduced astra's exact finding; restored, green.
(Python's original `\bshall\b` already agreed with the new rule on every fixture — confirmed by
reverting it too and seeing the parity test still pass; the Python change is a documentation/
explicitness fix, not a behavior fix, and is noted as such rather than claimed as a mutation
catch it cannot produce.)

### SHOULD — one TypeScript project-allowance constant

Added `PROJECT_EARS_ALLOWANCE` (= `EARS_ALLOWANCE_DEFAULT`) in `requirements-trace.test.ts`,
read by both `check(ROOT)` call sites. `REQUIREMENTS.md.jinja`'s adopt-mode instructions now
say to raise that one constant, not `CheckOptions.earsAllowance` in the implementation file.

### NOTE — stale-headroom deviation, recorded for Fable

Added `R-757` (nana-pi only): `EARS_ALLOWANCE` must equal the measured off-form count, failing
loudly if the count drops without the allowance being lowered to match. This is a DEVIATION
from design-ruling.md §1's bare ceiling (`count > allowance`), recorded as Open question #7 for
Fable to rule on — keep as policy, or retire and let the ceiling-only ratchet stand as
originally ruled. The Python seal (`test_seal_ears_allowance_default_is_0`) now carries the
`(G-015)` identification in its assertion message, matching the TS seal's title.

### Re-verified after all fixes

- `packages/nana-pack/tests/requirements-trace.test.mjs`: 8/8 pass (was 6 — two new: the CLI
  report-order test, the R-757 seal).
- `packages/nana-pack/tests/templates-render.test.mjs`: all pass.
- `npm run map:check`: 0 problems (after `npm run map` regenerated the two changed headers).
- Fresh renders, both languages, scaffold: TS 52/52 (was 51), Python 58/58 (was 56) —
  the deltas are the new parity-fixture test (+1 each) and Python's new pytester ordering test
  (+1). Injected two-`shall` `R-900` still fails both, naming it, after all the fixes.
- `npm test` once, alone: **95 files: 93 PASS, 1 FAIL, 1 SKIP · checks: 5521 pass, 2 fail, 6
  skip · exit 1** — same single environmental failure (`readme-check.test.mjs`, 5 missing-path
  problems, no root `node_modules` / `apps/bench/.ext` in this worktree), unchanged by this round.

### The claim I would most expect to be wrong, now

The MUST-3 placement fix makes `REQUIREMENTS.md`'s Part G sections visually busier (an origin
row immediately followed by its split sibling, repeated six times) — correct per the ruling,
but I did not re-litigate whether that document now reads worse for a human scanning G1/G2/G4
top to bottom. I'd also flag: the Python-side MUST 4 "fix" is inert behaviorally (see above) — if
a reviewer expects a Python-side mutation to prove it, there isn't one that the parity fixtures
can produce, because Python's original regex was never the bug.
