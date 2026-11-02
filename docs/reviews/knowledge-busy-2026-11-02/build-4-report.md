VERDICT: PARTIAL

## Changes

- `packages/nana-knowledge/tests/build-busy.test.mjs`: imported the existing `tmpDir` helper and replaced the direct temporary-folder call. Every check title and assertion stays unchanged.
- `docs/known-bugs/FEAT-013.md`: added the four review findings below.
- `packages/nana-knowledge/README.md`: added the lock-wait sentence below.
- This folder: saved red, green, check and writing evidence.

Rows: R-917 and R-3590 through R-3594 unchanged. No requirements or runtime code changed. No new tests or tunables.

## Mutation pair and tests

The existing direct temporary-folder call is the wrong implementation. Before the fix, the requested two-file command exited 1: 59 passing checks and one failing R-917 source check. After the helper import, the same command exited 0: 60 passing checks.

Command: `node scripts/test.mjs packages/nana-pack/tests/test-runner.test.mjs packages/nana-knowledge/tests/build-busy.test.mjs`.

Evidence: `build-4-red.txt` and `build-4-tests.txt`. No assertion was inverted or changed.

## Known-bug additions

- Knowledge churn (knowledge-busy, review round 1): R-3591's "every one of 10 runs" failed once on the Linux CI leg at 10398568, with noPull=1.
- Windows load (knowledge-busy, review round 1): the M5 run did not reach ten consecutive loaded passes. Most failures were other SessionStart hooks timing out.
- Recovery check (knowledge-busy, review round 1): dropping recovery's explicit `busy_timeout=0` would go unnoticed, since recovery would then wait only 100 ms.
- Build checkpoint (knowledge-busy, review round 1): the build's final `wal_checkpoint(TRUNCATE)` can now wait up to 5 s for readers.

The complete known-bug file was read. The origin/main log contains no #317 or windows-first-try-2 match. The brief's existing busy-timeout line was already absent at startup; no such line was removed or added.

## README sentence

A query may now wait up to 100 ms on a database lock, and a build up to 5 s.

## Checks

- `npm run map:impact -- packages/nana-knowledge/tests/build-busy.test.mjs`: exit 0.
- `npm run map:check`: exit 1, generated code map is stale after the helper import.
- `npm run readme:check`: exit 0, 1064 claims, 0 problems.
- `node scripts/requirements-trace.mjs`: exit 0, 2434 rows, 2178 traced.
- `node scripts/requirements-tree.mjs --check`: exit 0, 0 problems.
- `node scripts/known-bugs.mjs --root .`: exit 0, names=0, sizes=1 (report-only size note).
- `nana-writing` on the four new lines and README sentence: exit 0, no findings; `build-4-writing.txt`.
- `node scripts/identity-scan.mjs --root .`: exit 0, no findings.
- `node scripts/lane-class.mjs --root . --files packages/nana-knowledge/tests/build-busy.test.mjs,packages/nana-knowledge/README.md,docs/known-bugs/FEAT-013.md`: exit 0, ordinary for this test/docs-only revision.

## Scope and remaining work

Precedent departures: none. Imported the helper rather than copying it; kept the existing bullet formats and budget section.

The code map needs regeneration. `docs/code-map.md` is outside this brief's explicit edit scope, so it remains unchanged. This prevents a DONE verdict. The seat must authorize that generated-file update.

The local full suite was not run: AGENTS.md delegates it to CI. No model sessions, issue operations, credential reads or GitHub API calls ran. Push outcome and commit SHA belong in the final report; stop immediately after push without reading CI.
