# lane-push-ci technical record

## Delivery

One whole-part commit on `feat/lane-push-ci`; the final response identifies its full tip after the seat-check rerun. No push, GitHub issue operation, CI read, credential lookup, model session or subagent was used.

This work serves the current priority to finish the test-pack and lane-push CI lanes, then stop CI work.

## Files and rows

- `.github/workflows/ci.yml`: M4/M5/M7/M8/M9. Feature push trigger; deterministic same-repository feature PR suppression; explicit head-tip checkout; macOS/Linux lane matrices; a selection probe and unsharded selected Windows job. Main keeps full Windows shards, ceiling/floor installs and release prerequisites. Existing suite environment values have one YAML definition, reused by the Windows job.
- `packages/nana-pack/lib/ci-wait.mjs`, `packages/nana-pack/bin/nana-land.mjs`: M1/M2/M3. Export and reuse `cleanMergeTree` with inspection-only mode; fetch origin main; retain the ordinary conflict refusal. The existing land call still regenerates. The no-run land diagnosis now passes its injected Git runner and source checkout.
- `packages/nana-pack/lib/land-ci.mjs`, `packages/nana-pack/lib/land-config.mjs`, `packages/nana-pack/lib/ci-records.mjs`: M6 and seal. Share the public `duplicateCiRun` predicate between run judging and artifact reading. Exact title, event, workflow, feature branch and repository identity distinguish duplicates. A duplicate alone proves nothing. Push records retain the existing suite-proof rules.
- `packages/nana-pack/tests/lane-push-ci.test.mjs`: precisely M1–M9 plus the duplicate-title seal; ten awaited bounded cases. CRLF, trailing spaces/tabs and no-final-newline merge-tree transports are covered. Fixtures use the existing temp helpers and never write this repository.
- `packages/nana-pack/lib/test-packs-config.mjs`: register the new test in land. No existing membership moved.
- `REQUIREMENTS.md`: new R-3935–R-3944 in FEAT-008; narrow R-3824 to matrix allocation and amend R-3720's generated-conflict exception and Git-side effects. No new cross-feature shares.
- `packages/nana-pack/README.md`, `docs/plan/lane-push-ci.md`: consumer contract, O1/O2 choices and departures.
- `docs/code-map.md`, `docs/requirements-tree.md`: regenerated outputs.
- `docs/evidence/lane-push-ci/`: bounded-run evidence; paths normalized to repository-relative, `~` or `$TMPDIR`.

## Choices and precedent

- O1: always execute feature pushes; skip same-repository feature PR jobs. This avoids an open-PR API race. Non-feature and fork PRs retain executed jobs. Separate event concurrency groups cannot cancel the authoritative run; superseded feature tips cancel, main pushes do not.
- O2: fetch origin main and import `cleanMergeTree` directly from its precedent file, with inspection-only mode. It retains attribute refusal, merge settings and output validation but runs no generators in readiness.
- Precedents read: workflow, ci-wait, land-ci, nana-land, land-config and test-packs-config.
- Departures: a separate selected Windows job, because an empty selection must prevent runner allocation; a lightweight Ubuntu probe using the existing `selectPackFiles`; shared YAML environment anchor to avoid duplicating suite bounds. The required helper import creates a module cycle; function exports are only called after module initialization. No shared-module move was authorized or made.
- All callers of the changed merge helper: the original clean-merge land call and the new waiter inspection call. Its original return/regeneration behavior remains unchanged outside inspection-only mode.

## Mutation pairs

All mutations broke code, not assertions. Each was followed by restored-code green tests before committing.

| Cases | Wrong code / observed red | Restored green |
|---|---|---|
| M1, seal | Base refusal rejects generated conflicts; duplicate title absent. `wrong-first.log`, exit 1. | Ten cases in `touched-green.log`, exit 0. |
| M2 | Conflict readiness wrongly accepts all conflicts. `wrong-regressions.log`, exit 1. | M2 includes ordinary conflict, fetch failure, malformed merge output and unsupported Git semantics. |
| M3 | Judge rejects push events. `wrong-regressions.log`, exit 1. | Real generator bytes and accepted-tip/main parents; zero suite calls. |
| M5 | Required main jobs omit Windows. `wrong-regressions.log`, exit 1. | Each missing Windows gate and each missing release shard output refuses. |
| M4, M7, M8, M9 | Run current tests against the base workflow via `CI_WORKFLOW_PATH`: missing push ownership, Linux PR coverage, main-only Windows predicates and selected Windows job. `workflow-mutation.log`, exit 1, four named failures. | Same tests against the changed workflow, exit 0. |
| M6 | Base judge lets the newer duplicate decide (`wrong-first.log`); then the uncorrected artifact reader treats skipped duplicate jobs as missing records (`duplicate-reader-wrong.log`). Both exit 1. | Both API orders and both event orders, real red/green and duplicate success/skipped conclusions; complete pack records land without a local fallback. |

M9 executes both workflow lane commands in OS-temp runner fixtures and compares files and selection metadata. An unrelated retire canary never executes; an empty inventory emits `selected=false`. Selection uses the ordinary land/module membership and changed-from selector, not a list of the 22 misplaced live retire tests.

## Existing tests edited

No test was deleted and no extra case was added to an existing test file.

- `ci-workflow.test.mjs`: update trigger and main-only matrix syntax; scope suite parsing to the next job, since the new job now follows suite; recognize the shared environment anchor; replace the obsolete prohibition on all suite job guards with the duplicate guard contract; update the exact non-Windows suite command. Existing names and assertions unrelated to those changes remain.
- `test-packs-ci.test.mjs`, M4: PR matrix now includes Linux; evaluate PR concurrency using an actual PR-shaped ref rather than main's ref. Main's pack/cancellation expectations stay unchanged.
- `win-main-only.test.mjs`, M10: PR matrix includes Linux and its empty shard value; recognize duplicate-suppression guards rather than forbidding any job guard. Windows shard/install allocation remains main-only.
- `ci-records.test.mjs`, R-2633: stop suite parsing at the next job and give the main-push expression its main ref. This preserves its two original full-suite command probes.

## Commands and exits before commit

| Command | Exit / result | Evidence |
|---|---|---|
| `node scripts/test.mjs test-runner` | 0; 2 files, 64 passing checks | `test-runner.log` |
| `node scripts/test.mjs --jobs=4 lane-push-ci ci-workflow ci-records land-clean-merge land-regenerate win-main-only win-shards main-ci` | 0; 10 files, 93 passing checks | `touched-green.log` |
| `npm test -- --pack=land --jobs=4` | 0; 72 files, 2423 passing checks, 6 case skips | `land-pack.log` |
| `node scripts/test.mjs test-packs test-packs-ci land-ci ci-wait` | 0; 9 files, 39 passing checks | `seat-tests.log` |
| `npm run map` | 0 | `map-write.log` |
| `node scripts/requirements-tree.mjs --write` | 0 | `tree-write.log` |
| `npm run map:check` | 0 | `map-check.log` |
| `npm run readme:check` | 0 | `readme-check.log` |
| `node scripts/requirements-trace.mjs` | 0; 0 rows off EARS form | `trace.log` |
| `node scripts/requirements-tree.mjs --check` | 0 | `tree-check.log` |
| `node packages/nana-setup/bin/install-check.mjs` | 0 | `install-check.log` |
| `npm run map:impact -- packages/nana-pack/lib/ci-wait.mjs packages/nana-pack/lib/land-ci.mjs packages/nana-pack/bin/nana-land.mjs packages/nana-pack/lib/test-packs-config.mjs` | 0; inspected before mapped edits | Session tool output |
| `npm run map:impact -- packages/nana-pack/lib/ci-records.mjs` | 0; inspected before reader edit | `records-impact.log` |
| Removed-line/path/name fixed-string grep across all test roots | 0; matching references reviewed | `removed-reference-grep.log` |
| `git diff --check` | 0 | Session tool output |

CI covers the full repository suite under AGENTS.md. The builder ran touched tests and the required land pack, not the locked full suite. The final response records the same seat checks rerun on the committed tip.

## Known-bug context and remaining work

The complete FEAT-008 known-bug file was read. No known-bug line was removed or otherwise edited.

- The all-jobs-skipped workflow residual is touched only for this workflow's explicit feature PR duplicate. Generic skipped workflows still do not prove CI.
- The PR merged-tree and stacked-base residuals change for this root workflow because lane jobs now check out the head tip. Other workflows and adopted projects are not claimed fixed.
- The generated-conflict path still uses the existing regeneration contract. Missing scaffold generators can still refuse at land; readiness does not run them.
- The newest-100-runs limit, post-snapshot CI race, clean-merge semantic-breakage policy and other listed residuals remain.
- The 22 live retire-pack memberships stay unchanged for the later lane. M9 does not enumerate or subtract them; it reuses the lane selector. This does not fix their general PR coverage gap.

Not done: push, hosted/native Windows proof for M7–M9, independent review, land, issue operations and whole-repository fallback suite. The seat supplies push/CI proof. No owner question was opened.
