# Build 2 technical record

VERDICT: PARTIAL

## Closures

- P5 / R-3592: `M3: recovery refuses a late writer without a build busy wait and keeps the index` fails against a full build timeout, passes against the explicit zero timeout, and preserves the damaged index's inode and bytes. The timer begins after an independent process confirms its write lock, and excludes process startup and the damage-detecting open. The writer remains held until the build returns. The bound is half `BUILD_BUSY_TIMEOUT_MS`.
- P6 / R-3590: `M1: sources-problem probe waits out a transient lock and keeps the index` fails with the probe timeout zero, passes with the build timeout, and verifies exit 0, no busy error, retained inode and row count, and advancing `built_at`.

## Files and rows

- `packages/nana-knowledge/tests/build-busy.test.mjs`: exactly two new tagged checks. Existing titles and assertions unchanged.
- `packages/nana-knowledge/lib/build.ts`: optional `BuildOptions.onRecoveryLocking` seam, passed into `assertRecoveryDeleteSafe` and awaited after its open, before the explicit timeout and `BEGIN IMMEDIATE`. No timeout policy change.
- `REQUIREMENTS.md`: evidence cells only, R-3590 and R-3592.
- This lane folder: red/green records, map delta, checks, seat mutation output and this report. Only the seat table's tip changed.

## Precedent and departures

- Reused this test file's `check`, `child`, `waitFor`, `held`, `seed` and `builtAt`; no private helper from another module was copied or moved.
- Used the incomplete docs-schema fixture from the recovery precedent, not page damage. No fixture helper was added.
- The new seam is async-capable, unlike `onRecoveryLocked`, because it must await an independent writer before the synchronous lock attempt. The existing seam fires too late.
- The sources-problem case uses rollback journaling, unlike M1's existing WAL case. This makes `BEGIN EXCLUSIVE` block the read-only probe, rather than only a later writer. It retains M1's existing build-lock barrier and 500 ms release.
- No existing test was edited. No known-bug behavior was fixed; the FEAT-013 file was read in full. The existing Windows late-writer recovery skip remains.

## Commands and exit codes

- `npm run map:impact -- packages/nana-knowledge/lib/build.ts packages/nana-knowledge/tests/build-busy.test.mjs`: 0.
- Wrong P6 probe timeout 0, `NK_BUSY_ONLY='M1: sources-problem' node scripts/test.mjs packages/nana-knowledge/tests/build-busy.test.mjs`: 1; one new check failed.
- Wrong P5 full recovery timeout, `NK_BUSY_ONLY='M3: recovery' node scripts/test.mjs --verbose packages/nana-knowledge/tests/build-busy.test.mjs`: 1; one new check failed at about 5749 ms.
- `node scripts/test.mjs packages/nana-knowledge/tests/build-busy.test.mjs packages/nana-knowledge/tests/recover.test.mjs`: 0; 17 pass, 0 fail, 1 existing skip. Output: `build-2-green.txt`.
- `SEAT_MUTATE_SHARDS=2 SEAT_MUTATE_OUT=docs/reviews/knowledge-busy-2026-11-02/seat-mutate-win32.txt node docs/reviews/knowledge-busy-2026-11-02/seat-mutate.mjs`: 0.
- `npm run map:check`: 1; generated map stale. Required delta is in `build-2-map-diff.txt`.
- `node scripts/requirements-trace.mjs`: 0; 2170 implemented rows traced, 0 off-form rows.
- `node scripts/requirements-tree.mjs --check`: 0; 0 problems.
- `node scripts/identity-scan.mjs --root .`: 0; 0 findings.
- `node scripts/lane-class.mjs --root . --base origin/main`: 0; hook class.

RESULT: 8/8 red (3 exactly their named titles, 4 with a named title green, 5 with an unnamed red), 0 survived, across 2 shards

The seat table still expects the old titles for P5 and P6. Their new checks are therefore reported as unnamed red; the table's expectations were not changed.

## Not done / open question

The map records caller edges and launch-site line numbers. The two required tests change those entries. `docs/code-map.md` is outside the brief's edit allowlist, so it remains unchanged. A diagnostic `--render` invocation unexpectedly wrote that file; those generated changes were immediately reverted. Permission to update the generated map is needed for a green map check.

The full suite was not run: AGENTS assigns it to CI. No push was made, following this brief's explicit no-push instruction. No CI run was started or inspected. No install check was requested in this build-2 brief.
