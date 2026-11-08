# Build 3 — round 1 fixes

## Closures

- MUST: shard carry-forward now uses job start time versus the newest artifact creation time, independently of reported attempt. Missing start time does not prove carry-forward.
- SHOULD 1: Windows shard wall time prints to the log and summary; reaching 1200 seconds emits a warning, not a failing exit.

## Files and rows

- `REQUIREMENTS.md`: clarified R-3822 carry-forward and missing-start behavior; changed R-3820 to report-only. R-3820 remains planned pending printed hosted times from the seat.
- `packages/nana-pack/lib/land-ci.mjs`: removed the attempt-metadata restriction on timestamp carry-forward.
- `.github/workflows/ci.yml`: replaced wall-time failure with a warning; retained printed shard times.
- `packages/nana-pack/tests/win-shards.test.mjs`: existing shared fixture now reports attempt 2 for every Windows job, with earlier starts for carried jobs. M4 consequently exercises that shape too. M8 retains failed/missing latest record refusals and adds absent-start refusal. M6 now requires successful exits and boundary warnings at 1200 and 1200.1 seconds, with no warning at 1199.9 seconds. No new tests or tunables.
- `docs/code-map.md`: regenerated after the source change.

## Wrong-code / fixed-code pairs

The updated existing tests ran against unchanged production code first. `node packages/nana-pack/tests/win-shards.test.mjs` exited 1: M4 and M8 rejected valid carried shards, and M6 rejected the old failing wall-time step. After the fixes, the same command exited 0 with all nine checks passing. Assertions were not inverted for mutation proof.

Evidence: `build3-wrong-first.log` and `build3-green.log` in this directory.

## Verification

- `node scripts/test.mjs win-shards ci-records land-ci main-ci`: exit 0; 7 files PASS; 37 checks pass, 0 fail, 0 skip (`build3-touched.log`).
- `node scripts/test.mjs test-runner`: exit 0; 2 files PASS; 64 checks pass, 0 fail, 0 skip (`build3-test-runner.log`).
- `node scripts/code-map.mjs --impact packages/nana-pack/lib/land-ci.mjs`: exit 0 before editing. Reviewed callers include ci-records, main-ci, land CI proof and nana-land; no API signatures changed and no callers needed changes.
- Initial map check exited 1 for a stale map. `node scripts/code-map.mjs --write` exited 0; final `node scripts/code-map.mjs --check` exited 0 (`build3-map-check.log`).
- `node scripts/readme-check.mjs`: exit 0 (`build3-readme-check.log`).
- `node scripts/requirements-tree.mjs`: exit 0 (`build3-req-tree.log`).
- `git diff --check`: exit 0.

## Scope

Card: fix names no Precedent section. No helper was added or copied; no precedent departures. Read the full FEAT-008 known-bug file; no listed known bug was changed or closed. The pre-existing unsharded missing-start residual remains outside this fix.

SHOULD 2, SHOULD 3 and review notes were not acted on, as directed. No HANDOFF, known-bug file, session archive or issue was changed. CI covers the full suite under AGENTS.md; no local full run, push, CI read, model session or subagent. Hosted Windows timings remain for the seat.
