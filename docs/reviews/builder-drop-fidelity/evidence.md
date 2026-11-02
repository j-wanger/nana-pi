# Builder replay fidelity evidence

Feature: FEAT-045. Lane: builder-drop-fidelity. Class: ordinary.

## Changes and closures

- Git sandbox failure: `apps/bench/lib/replay-config.mjs` permits read-only Command Line Tools; `apps/bench/lib/replay.mjs` puts its git directory before `/usr/bin`.
- Stale lock rename denial: `apps/bench/lib/replay-isolation.mjs` permits writes only to the configured lock's `.stale-` siblings and their contents, with an escaped, anchored regex.
- Checkout mismatch: `createStartTree` takes the context's branch/lane, initializes the recorded branch or `feat/<lane>`, and creates `main` at the sole start commit.

`REQUIREMENTS.md` updates existing R-3600. No IDs were allocated. The row is not shared by another feature. Three new tagged tests cover these changes. No pre-existing tests were edited or deleted. `docs/code-map.md` was regenerated because the exported function signature changed.

## Precedents

Read all five named precedent files completely before design. Followed their path lists, child PATH construction, profile generation, bounded git wrapper, suite-lock quarantine naming and awaited per-case test harness. No helper was copied or moved. No precedent departures. The optional fourth `createStartTree` argument preserves existing callers; callers without context default to `feat/replay`, while actual replay calls pass the recorded context.

## Wrong-code pairs

Before implementation, ran `node --experimental-strip-types apps/bench/test/replay.test.mjs` against the unchanged code. Exit 1; all three new tests failed, and nine original tests passed (`wrong-code.log`). Assertions were never inverted.

| Test | Wrong code | Fixed code |
| --- | --- | --- |
| R-3600: profile permits read-only Command Line Tools | Original read list/PATH omits tools | Tools read permission and child PATH added |
| R-3600: profile permits only stale lock siblings | Original profile has no sibling write rule | Narrow regex write rule added |
| R-3600: checkout preserves recorded and fallback branches | Original init uses default branch, no main ref | Context branch/fallback and main ref added |

## Green commands before commit

Committed command logs replace the absolute checkout path with `<worktree>` and strip trailing spaces. An initial identity scan flagged unsanitized Node warning paths; this log-only normalization removes those findings.

- `node --experimental-strip-types apps/bench/test/replay.test.mjs`: exit 0; 12/12 checks passed, 0 skipped (`replay.log`).
- `node packages/nana-pack/tests/test-runner.test.mjs`: exit 0; all checks passed (`test-runner.log`).
- `npm run map`: exit 0 (`map-generate.log`).
- `npm run map:check`: exit 0 (`map.log`).
- `node --experimental-strip-types scripts/requirements-trace.mjs`: exit 0; 2206 implemented rows traced, 0 off-form rows (`trace.log`).
- OS-temp unpaid probe using the exported `sandboxProfile` and `replayEnv` under `/usr/bin/sandbox-exec`: exit 0 (`probe.log`). Git init: 0; git commit: 0; stale lock rename: 0. Unrelated sibling write denied. No model or credential access.

The initial real probe caught an incorrectly quoted regex literal; using the profile's string regex form fixed it. The initial map check reported the signature entry stale; regeneration fixed it.

## Scope and remaining work

Only the three brief-named harness failures were changed. No known-bug files, handoff or session archives were edited. No model sessions, issue operations, credential reads, pushes or CI reads occurred. The full suite is delegated to CI under AGENTS.md; only the seat pushes. Windows execution remains for CI. Required checks are repeated on the final commit, including identity scan after staging; their exit codes are in the builder report.
