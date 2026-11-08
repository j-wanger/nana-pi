# records-move evidence

Feature: FEAT-031. Rows: R-3928–R-3934.

## Parts and counts

- Protection/check: `5722fc0353e8ca718fe420bfef1f006ec3b3817c`.
- Removal: `1c7a37cd13f1061ea61fd586fa779c89dad5e6e8`.
- Removed: 222 folders, 3,453 tracked files, 1,432,880 text lines.
- Kept: 126 folders. Disjoint reasons: 46 references only, 65 recent only, 15 both.
- Thus 61 folders have references and 80 have recent changes.
- No folder at this tip belongs to one of the five declared open lanes. The exemption preserves future folders for all five.
- Counts differ from the plan's survey because this lane started from a later tree: 348 folders, not 352.
- The pre-move comparison baseline is `3c3bd610853bd00bcaac5dab61528eb0eb4714f7`; the first part changes no review record.
- The last complete commit is the protection/check commit above. The archive command lists and reads it.

## Must-meets and wrong-code pairs

| Test | Rows | Wrong code / observation | Restored implementation |
|---|---|---|---|
| M1 | R-3928, R-3929 | Empty protection map and no-op checker: exit 1, M1 assertion fails. | Full-path, bare-name, brace, unique-basename, recent-history, missing/excess checks pass. The final test checks this checkout too. |
| M2 | R-3930 | No-op blob checker: exit 1, M2 assertion fails. | Changed bytes, removed paths and added paths fail; original complete folder passes. |
| M3 | R-3931 | No-op archive checker: exit 1, unreadable-commit assertion fails. | Actual README command succeeds; zero commit is refused. |
| M4 | R-3932 | Empty earlier-lane iteration in `pendingUnits`: exit 1, M4 loses earlier evidence. | Two pending landed lanes keep identical keys and readable titles after removal; the shared launch brief check accepts the retained path. |
| M5 | R-3933 | Old objective measure: exit 1, code-lines assertion fails. | Full priority is present in the shared objective producer's output. |
| Policy seal | R-3934 | Cutoff retuned to 2026-11-02: exit 1. | Baseline, cutoff and all five open-lane strings match the brief. |

The memory-run mutation was restored byte for byte. No product memory code changed.
M1 exercises CRLF, trailing spaces/tabs and no final newline. All async cases use the existing awaited per-case harness.
All fixtures use OS temporary directories through the shared helper (directly or through the existing memory fixture).

## Existing tests and protected fixtures

No existing test assertion was edited, and no test was deleted. The existing memory-run file gains only M4 and its imports.
The new test file required the test-runner check. Its first run failed because the source guard requires the helper import's exact double-quoted spelling; corrected spelling passes.

The protected set retains these direct test/fixture references:

- `review-paperwork`: `review-paperwork.test.mjs`.
- `setup-tail`: `setup-tail.test.mjs` and `code-map-launch.test.mjs`.
- `ears-form-2026-10-04`: `requirements-trace.test.mjs`, outside-reader and frontier fixtures.
- `win-silent-skips-2026-10-19`: `windows-skip-lines.test.mjs`.
- `pi-1.0-2026-10-04`: `fsops.test.mjs`, `paths.test.mjs`, `shared-link-state.test.mjs` and frontier fixtures.
- `runtime-map-2026-10-17`: `runtime-map.test.mjs`.
- `parallel-runner-2026-10-19`: `test-runner-parallel.test.mjs`.
- `reader-at-land-2026-10-29`: `ask-shape.test.mjs`.
- `audit-open-questions-2026-10-19`: `product-report.test.mjs`.
- `lift-2026-10-14`: basename references in `frontier.test.mjs`, `land-merge.test.mjs`, `requirements-lift.test.mjs`.
- `rulings-file-2026-10-19`: `rulings.test.mjs`.
- `watchdog-exit-2026-10-19`: `watchdog-exit.test.mjs`.
- Frontier fixture references and code-search fixture references retain their other historical folders automatically.

The removal audit grepped 1,454,390 removed text, sentence, path and basename patterns across 355 test/fixture files, in 156 bounded ripgrep batches (exit 0 for matches, 1 for no matches). Generic text/basenames occur in all 355 files. An exact removed-folder grep returned 1: no removed folder is named by a test. Initial unbounded Git/BSD grep attempts hit pattern/memory limits; the bounded ripgrep audit completed.

## Precedent and boundaries

Read `scripts/readme-check.mjs`, `memory-run.mjs` and `memory-making.mjs` before design.
The check follows tracked-path validation and injects roots for fixtures. It imports the existing public `defaultGit` runner instead of copying it.
The README shim still delegates generic claims to the template checker and extends only the historical Git command check; the template has no historical-command executor.
M4 calls the existing public `pendingUnits`, `resolveEvidence` and `checkBriefForLaunch`; no reader or launcher was copied, moved or started.
No existing function's returned shape or exception convention changed. Existing README callers remain compatible; both exported checks and the CLI now include the archive check.

No known-bug line was changed or fixed. The whole FEAT-031 known-bug file was read.
`test-packs-config.mjs` is absent at this tip; the seat must assign the new test to land after ci-packs lands.
No issue, credential, remote API, model session, push or CI read was used.

## Commands

- Wrong-code commands: `node scripts/test.mjs records-move` and `node scripts/test.mjs memory-run`: exit 1 as above.
- `node scripts/test.mjs test-runner`: final exit 0 (64 checks).
- `node scripts/records-move.mjs`: before deletion exit 1 (expected excess folders); after deletion exit 0, 126 protected, 0 problems.
- `node scripts/test.mjs records-move memory-run memory-making readme-check`: exit 0.
- `npm run map`, `npm run map:check`, `npm run readme:check`: exit 0.
- `node scripts/requirements-trace.mjs`: exit 0.
- `node scripts/requirements-tree.mjs --write` and `--check`: exit 0.
- Full suite uses `npm run test:locked`, which invokes `npm test -- --jobs=4` under the machine lock. The initial foreground attempt exceeded the harness limit while waiting for another lane's lock; its orphaned suite was stopped. A complete run is recorded separately.

Long outputs, with private path prefixes normalized, are in `docs/plan/records-move-checks.log`.
