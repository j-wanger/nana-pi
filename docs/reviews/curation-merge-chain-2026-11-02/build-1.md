VERDICT: DONE

## Rows and files

- R-3698: implemented; chained accept liveness, queue exclusions and size forecast.
- R-3699: implemented; transitive retirement, middle-retract boundary, exact retract payloads and size forecast.
- R-3700: implemented; direct-predecessor restoration, exact conflict lines, two/three-node cycles, tied stamps, incoming tails and reversed enumeration.
- R-3701: implemented; immutable manifests, exact event payloads and two-clone union in both sync orders.
- R-3702: implemented; persisted stale keep, drop, explicitly retracted endpoint and old reverse-chain proposals refuse without writes or commits.
- Evidence is backticked in REQUIREMENTS.md and tagged on the five new checks.
- SUB-027 moved unchanged from FEAT-043 to FEAT-040; original R-3560 through R-3577 rows compare byte-identically.
- docs/requirements-tree.md regenerated. The map generator ran but produced no map diff.

## Code and readers

- packages/nana-pack/lib/profile-store.mjs: effectiveState cuts links at retractions, suppresses predecessors through non-retracted chains, and uses DFS strongly connected components for deterministic terminal-cycle winners. Newest stamp wins; tied stamps choose the lexically greatest target, preserving the prior tie rule. A cycle with an outgoing standing continuation is hidden.
- effectiveState computes unique, sorted absorbed IDs by reverse traversal through hidden non-retracted nodes, excluding the survivor itself. Existing direct supersedes stays unchanged for display.
- packages/nana-pack/bin/nana-curate.mjs: accept-retire reads absorbed, not direct supersedes.
- packages/nana-pack/lib/memory-curation.mjs: sizeLine and renderQueue read absorbed. staleProposal and pendingQueue need no edits: corrected shared liveness fixes their inputs.
- show remains on direct supersedes; exact fork conflict output is pinned.
- packages/nana-pack/README.md: only the accepting paragraph changed, explaining chain retention and the retract-restores exception.

## Tests and wrong-code pairs

New tests appear only in memory-curation.test.mjs and profile-store-guards.test.mjs. No existing test was edited or deleted. R-3233 remains byte-identical.

wrong-code.txt contains the runs and named assertions:

- Main code / M1: FAIL, “only newest keep live”; fixed code: PASS.
- Main code / M2: FAIL, “transitive absorbed count”; fixed code: PASS.
- Main code / M3: FAIL, “restored predecessor still absorbs earlier drops”; fixed code: PASS.
- Main code / M4: FAIL, “synced chain survivor”; fixed code: PASS.
- Main code / M5: FAIL, “stale keep refuses”; fixed code: PASS.
- Direct-only absorbed code / M2: FAIL, “transitive absorbed count”; restored code: PASS.
- Never-restore superseded records / M3: FAIL, “only direct predecessor restored”; restored code: PASS. This also breaks the unchanged R-3233 test.

Failing test-file runs exited 1; fixed runs exited 0. Assertions were not inverted.

The first main-code run exposed an incorrect synthetic sync URL and one interrupted guard run. The corrected transport run reached the intended M4 assertion. The new checks initially used a diagnostic check wrapper; final calls use the standard check name for requirement tracing. Assertion bodies did not change.

## Commands and exit codes

build-1-green.txt contains these eight complete runs, each exit 0:

- node packages/nana-pack/tests/memory-curation.test.mjs
- node packages/nana-pack/tests/profile-store-guards.test.mjs
- node packages/nana-pack/tests/profile-store.test.mjs
- node packages/nana-pack/tests/profile-sync.test.mjs
- node packages/nana-pack/tests/memory-shaping.test.mjs
- node packages/nana-pack/tests/memory-replay.test.mjs
- node packages/nana-pack/tests/test-runner.test.mjs
- node packages/nana-pack/tests/requirements-tree.test.mjs

checks.txt records map:check, readme:check, requirements-trace, requirements-tree --check, known-bugs and lane-class, each exit 0. Lane class: ordinary. Identity scan runs after staging. Full suite is delegated to CI under AGENTS.md; this brief explicitly requires no push. No CI run was started, awaited or read.

An initial requirements-trace run exited 1 because the trace grammar requires a standard check call; the new checks now use it. A one-time row comparison exceeded the default child-output buffer, exited 1, and passed with an explicit larger buffer. No production change resulted.

## Precedent and review departures

- Precedent departure: replaced alternating-liveness DFS with strongly connected component DFS to handle chains and cycles without file-order dependence. All immutable writers and fixture command boundaries retain their patterns.
- Added a broader test manifest helper because the precedent snapshot covers records/events only; M4 also requires proposals and decisions.
- No private helper exports, copies or moves were needed.
- Review suggested extra write-side supersede events. Revision 2 replaces those with read-side liveness so already-written chains are fixed without new events. Retirement follows the transitive absorbed set as requested.
- No other review-plan departures.

## Known bugs touched and work not done

- Closed: accepted merge chains resurrecting earlier drops.
- Recorded only: the mandated FEAT-040 skip-covers-one-turn line. The specific brief authorizes this single append despite the general known-bug editing restriction. The skip behavior was not changed.
- No other known bug was fixed. No real owner store, credential, issue, session archive or HANDOFF edit was used.
- No push, full local suite, CI observation, model session or subagent launch. The seat retains review and CI responsibilities.
