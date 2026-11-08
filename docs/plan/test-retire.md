Feature: FEAT-031 · Run checks reliably and without contaminating work
Serves: roadmap step 2 (retire tests by evidence): eight dead test files go, 22 live ones return to pull-request runs, and the tests that re-run whole-repo checkers under short limits stop turning main red.

# Plan: test-retire

## Why

The seat's refreshed retire list (`docs/plan/test-retire-list.md`, checked against main 93936386 on 2026-11-08) leaves 8 files to retire and 22 live files that the ci-packs lane put in the main-only `retire` pack, so pull requests never run them. Main went red on 2026-11-08 (run 42535060869) when `preview-retirement.test.mjs` R-3778 re-ran the component audit as a child under a short limit on macOS; the audit passes alone. That is the same failure class as earlier red mains: a test re-running a whole-repo checker under a short spawn limit.

## What changes

1. Retire the 8 files in the list's Lane A table, with its cascade edits: flip the 15 rows to `retired`, move the 7 markers into the named kept files, fix `packages/nana-stage/README.md:48` and R-283's evidence.
2. Move the 22 keep files out of `retire` into `module` (or `land` where the file is under 5 s and guards a core capability), never `main`: PR CI runs only land and module, and module selection reaches only module callers. This applies to the launcher, PowerShell gate and review-ledger tests the list sent to `main`.
3. Keep the live contracts inside retiring files: move preview-retirement's R-3777 case into `component-audit.test.mjs` and its R-3782 case into `product-report.test.mjs`, and move memory-cut-checks' R-3864 case into `requirements-deliverables.test.mjs`; those rows stay implemented.
4. Add one CI step on PRs and main that runs the repo checkers directly, once each, with no child limit: `npm run map:check`, `npm run readme:check`, `node scripts/requirements-trace.mjs`, `node scripts/requirements-tree.mjs --check`, `node scripts/component-audit.mjs --check`, `node scripts/records-move.mjs` if present. Then sweep the class: list every test that spawns a whole-repo checker (component-audit, readme-check, requirements-trace, requirements-tree, code-map, records-move, deliverables) as a child. For each, either the case is the only pin of a live row and moves to the `main` pack with its limit raised to the measured checker time plus headroom, or it only re-runs a checker that the new CI step now runs, and retires with its rows. Report the table, naming the CI step that covers each retired case.

## Validation (owner ruling 2026-11-08: validation first)

- Real runs: `npm test -- --pack=land --jobs=4` and `npm test -- --pack=land,module --changed-from=main --jobs=4` green; this tip's CI green on every leg it runs, including the Windows selected job once lane-push-ci has landed.
- Requirements trace and tree checks green: no implemented row loses its last marker.
- Counts reported: files and cases removed, serial CI seconds removed (from the CI record), files moved per pack.
- No new tests. The one real failure (R-3778's child-run timeout) is fixed by the sweep, not by a new test.

Changed after the adversary (2026-11-08): keep files go to module or land, never main; three live cases move into kept files; a direct repo-check CI step replaces the child runs it covers.

## Precedent

- `.github/workflows/ci.yml`: the suite job the repo-check step sits beside.

- `packages/nana-pack/lib/test-packs-config.mjs`: pack membership.
- `packages/nana-pack/lib/test-runner-config.mjs`: per-file limits and the run-alone list.

## Threat model

Honest timing and platform variation; forgery out.
