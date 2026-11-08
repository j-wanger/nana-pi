# win-shards build record

Feature: FEAT-008 · Integrate and clean up reviewed changes
Branch: `feat/win-shards`
Verdict: PARTIAL — implementation and local checks pass; hosted Windows measurements remain with the seat.

## Requirements and files

| Must-meet | Row | Result | Main files |
|---|---|---|---|
| M1 | R-3815 | Local pass: real collected paths, N=1..4, disjoint union and Windows path spellings | `scripts/test.mjs`, `packages/nana-pack/lib/test-runner-config.mjs` |
| M2 | R-3816 | Local pass: named early refusal, including self-test | Same runner files |
| M3 | R-3817 | Local pass: three Windows shards, unsharded macOS/Linux, unique artifacts | `.github/workflows/ci.yml` |
| M4 | R-3818 | Local pass: real land refuses before suite/merge; main agrees | `packages/nana-pack/bin/nana-land.mjs`, `packages/nana-pack/lib/land-ci.mjs`, `packages/nana-pack/lib/main-ci.mjs` |
| M5 | R-3819 | Local pass: historical Windows artifact shape | Same CI readers |
| M6 | R-3820 | Planned: boundary-tested CI suite-wall check exists; actual hosted job measurements unavailable | Workflow; candidate M6 test |
| M7 | R-3821 | Local pass: release requires each Windows success output; Linux remains advisory | Workflow |
| M8 | R-3822 | Local pass: latest execution per shard, carried successes, missing latest record, reversed outcomes, one file count | Same CI readers |
| M9 | R-3823 | Local pass: real copied runner, two jobs, timestamp rendezvous and RUN_ALONE isolation | `packages/nana-pack/tests/win-shards.test.mjs` |

All nine checks live in `packages/nana-pack/tests/win-shards.test.mjs`. M6 uses `req-candidate` rather than claiming the pending hosted measurement. Native Windows runs the same M9 test in the suite; it has no platform skip.

The requirements diff preceded tests; tests preceded implementation. Only R-3815 through R-3823 were added, in M-order. Generated outputs: `docs/code-map.md`, `docs/requirements-tree.md`.

## Assignment and measurements

Chosen: three Windows shards, from the plan's 2026-11-07 baseline of 1,790–1,860 seconds at four jobs. Ideal equal work gives 597–620 seconds per shard, leaving variance below the 1,200-second target. This is an estimate, not a measured result.

Assignment hashes the slash-normalized repository-relative path with SHA-256 and takes its remainder modulo N. It preserves collected order within each shard. It does not depend on absolute checkout names, locale sorting or a runtime cache.

The workflow records each shard's suite wall time in its artifact, log and job summary. The check rejects suite wall time at or above 1,200 seconds. Full job elapsed time also includes setup; the seat must measure that independently from CI jobs for M6.

| Hosted Windows shard | Suite wall seconds | Full job seconds |
|---|---|---|
| 1/3 | Not run by builder | Not run by builder |
| 2/3 | Not run by builder | Not run by builder |
| 3/3 | Not run by builder | Not run by builder |

## Precedents and departures

Read every named precedent before designing:

- `scripts/test.mjs`: retained `--jobs`' early exit-1 refusal shape for `--shard`.
- `.github/workflows/ci.yml`: retained the suite job, setup, four workers, advisory Linux, per-attempt upload and release dependencies. Departure: an include matrix names each Windows shard. Per-shard success outputs additionally prevent a skipped matrix child from allowing release.
- `packages/nana-pack/lib/land-ci-records.mjs`: retained budgeted injected reads, raw artifact retention and slow-file notes unchanged. Aggregation belongs to the CI proof/report, not the archive: retained raw artifacts preserve per-shard and per-attempt provenance.
- `packages/nana-pack/bin/nana-main-ci.mjs`: the CLI delegates to `lib/main-ci.mjs`; changed that existing implementation rather than duplicating job reads in the CLI. Both main and land import the new public `ciSuiteLegs` selector from existing `lib/land-ci.mjs`. No private helper was copied or moved.

Land now discovers shard records even when a changed workflow/runner requires local coverage. Known failed or incomplete shards refuse rather than becoming permission to substitute locally. Departure from the old proof-only read: necessary for M4 on every land path. Ordinary unreadable legacy records retain the existing fallback behavior.

Outside precedent inspected: Jest CLI `--shard` documentation at <https://jestjs.io/docs/cli#--shard> and `packages/jest-test-sequencer/src/index.ts` from <https://raw.githubusercontent.com/jestjs/jest/main/packages/jest-test-sequencer/src/index.ts>. Adopt one-based i/N syntax; borrow normalized relative-path hashing. Skip Jest's hash-sort-and-slice algorithm: modulo keeps existing assignments stable when unrelated files are added. No external source code was copied.

## Mutation pairs

Every listed red run exited 1. Restoring the production code produced the green `verification.log` run (exit 0).

| Checks | Wrong code | Red evidence |
|---|---|---|
| M1 | Every shard receives all files | `partition-mutation.log` |
| M2 | Original runner ignores shard options and executes the marker fixture | `baseline.log` |
| M3 | Original unsharded matrix and artifact name | `baseline.log` |
| M4 | Original independent-record proof; later disabled shard-evidence refusal | `baseline.log`, `pre-land-guard.log`, `guards-mutation.log` |
| M5 | Reject legacy records lacking shard metadata | `legacy-mutation.log` |
| M6 enforcement only | Disable the wall-time rejection | `guards-mutation.log` |
| M7 | Original release gate; later remove shard 2's required success output | `baseline.log`, `guards-mutation.log` |
| M8 | Ignore incomplete shard evidence; select first rather than latest attempt | `guards-mutation.log`, `rerun-mutation.log` |
| M9 | Runner executes the full collection instead of its assigned shard | `execution-mutation.log` |

Assertions were never inverted. Fixtures and copied runners live only in OS temporary folders. Every async check is awaited under a per-case limit; spawned runners also have explicit process limits. Timestamp rendezvous tolerates staggered child starts.

## Existing test edits

No tests were deleted. Five existing test files changed only where the workflow or extra preflight record discovery invalidated their expectations:

- `ci-records.test.mjs`, R-2633: expand the real workflow's new matrix shard argument before executing its command fixture.
- `ci-workflow.test.mjs`: root CI and main-push checks read the include matrix; R-1530 reads its OS entries; R-1313 expects the shard argument; R-2632 expects `matrix.leg` artifact names.
- `land-ci-edge.test.mjs`, R-2590: expect verdict plus record-discovery calls for a tip-added workflow.
- `land-ci-read.test.mjs`, R-2588: expect those two pre-suite calls; retain the no-job-read assertion for legacy run fixtures.
- `land-ci-records.test.mjs`, R-2750: identify post-merge record reads after release-status reading rather than conflating them with new preflight reads; expect the five preflight calls before a failing local suite.

After each test-edit batch, `node scripts/test.mjs test-runner` passed. No README, rule or prompt sentence changed.

## Commands and results

All paths below are relative to this folder unless they name a command.

- `npm run map:impact -- scripts/test.mjs packages/nana-pack/lib/land-ci-records.mjs packages/nana-pack/bin/nana-main-ci.mjs`: 0; inspected initial caller/callee and artifact radius.
- Additional implementation impact: `impact.log`, exit 0.
- `npm run map`: 0 (`map.log`).
- `npm run map:check`: 0 (`map-check.log`).
- `npm run req:tree`: 0 (`req-tree.log`).
- `npm run readme:check`: 0 (`readme-check.log`).
- `node scripts/test.mjs test-runner`: 0 (`runner-final-tests.log`).
- Path-filtered touched tests: 0 (`touched-final.log`).
- Broader affected and trace/map tests: 0 (`verification.log`): **23 files: 23 PASS, 0 FAIL, 0 SKIP, 0 WARN · checks: 416 pass, 0 fail, 0 skip**.
- `node packages/nana-setup/bin/install-check.mjs`: 0, 18 PASS checks (`install-check.log`).
- `git diff --check`: 0.

The repository's AGENTS says CI covers the full suite. No local full suite ran; no lock was needed for these path-filtered runs. Root package scripts declare no separate lint or types command. Map, README and Node syntax checks passed.

The final response names the commit SHA and seat-check results rerun on that exact tip.

## Known-bug interaction

Read all of `docs/known-bugs/FEAT-008.md`; did not edit it.

- The CI-as-suite missing-latest-record/no-`started_at` bug is refused for sharded legs, including M8's latest record missing case. Legacy single-record behavior remains unchanged.
- The latest-attempt-wins residual remains by design: a later passing shard replaces its earlier failure.
- The twice-read CI-record residual remains. Proof-path changes now also pay the bounded preflight discovery read before local fallback.

No unrelated known bug was fixed. No issue, HANDOFF, rule, review tool or app code was changed.

## Not done / seat follow-up

No push, CI read, issue operation, stored-credential access, model session or subagent launch occurred. No reviewer was started. The seat must push and obtain CI plus the one independent review. It must record all three Windows job durations, verify the slowest is below 20 minutes, confirm native Windows M9, and promote R-3820 only with that evidence. Actionlint was unavailable locally; workflow shape, shell source and release predicates were checked by the tagged tests.
