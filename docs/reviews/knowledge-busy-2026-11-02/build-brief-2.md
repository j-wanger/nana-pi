Feature: FEAT-013 · Install and connect harness runtimes

Lane knowledge-busy. Class: hook. Builder: pi-worker (small lane). Build session 2. This build runs on the reference Windows 11 laptop; shell commands run in PowerShell or Git Bash, and Node is on PATH.

The plan of record is `docs/reviews/knowledge-busy-2026-11-02/plan.md` (revision 2). Build 1 is committed (cadd0b14). The seat then ran its wrong-code pairs, `seat-mutate.mjs` in the lane folder, with output in `seat-mutate-win32.txt`. 6 of 8 pairs went red. Two survived, and this session closes them. Change nothing else.

## Findings

1. **P5 survived: nothing pins recovery's fail-fast (plan M3, attack SHOULD 4).** Changing recovery's `PRAGMA busy_timeout=0` (`build.ts:252`) to `BUILD_BUSY_TIMEOUT_MS` leaves every check green. Add a check, tagged `// req: R-3592`, in `build-busy.test.mjs`:
   - a damaged index (as `recover.test.mjs` builds one);
   - a write lock that another process takes after the first open has found the damage, and holds through recovery's `BEGIN IMMEDIATE`;
   - the build fails and keeps the index;
   - recovery's lock attempt adds no busy wait: time it, and require it to be well under `BUILD_BUSY_TIMEOUT_MS`.

   If the existing `onRecoveryLocked` seam cannot place the writer before recovery's lock, add a test seam beside it in `BuildOptions`, the same way. Name it in your report.
2. **P6 survived: nothing pins the sources-problem path's wait (plan O2, attack SHOULD 5).** Changing the problem-probe open at `build.ts:327` to `busyTimeoutMs: 0` leaves every check green. Add a third M1 case, tagged `// req: R-3590`: an existing index plus a sources problem, under the same transient-lock barrier as M1's two cases. The build completes without a busy error and keeps the index.

## Then

- Run `node scripts/test.mjs packages/nana-knowledge/tests/build-busy.test.mjs packages/nana-knowledge/tests/recover.test.mjs` and record the result in `build-2-green.txt`.
- Re-run the seat's pairs: `SEAT_MUTATE_SHARDS=2 SEAT_MUTATE_OUT=docs/reviews/knowledge-busy-2026-11-02/seat-mutate-win32.txt node docs/reviews/knowledge-busy-2026-11-02/seat-mutate.mjs`. Every pair must be red. Edit only the table's `tip` line in `seat-mutate.mjs`, to your new commit, and only if the runner requires it.

## Constraints

- Edit only:
  - `packages/nana-knowledge/tests/build-busy.test.mjs`;
  - `packages/nana-knowledge/lib/build.ts`, only to add a test seam beside `onRecoveryLocked` if one is needed;
  - `REQUIREMENTS.md` evidence cells for R-3590 and R-3592;
  - the lane folder.
- Every child a test starts has a watchdog and is ended in `finally`; temp homes are removed.
- Keep every existing check title and assertion.
- No committed text names a person or a machine path.

## Done when

- Both new checks pass, and every seat pair is red.
- These are green:
  - `npm run map:check`;
  - `node scripts/requirements-trace.mjs`;
  - `node scripts/requirements-tree.mjs --check`;
  - `node scripts/identity-scan.mjs --root .`.
- `node scripts/lane-class.mjs --root . --base origin/main` prints the hook class.
- Commit explicit paths on `feat/knowledge-busy`. Do not push.

Report:
- the two checks;
- any seam;
- the mutation result line;
- each departure from the Precedent.

## Precedent

- `packages/nana-knowledge/tests/recover.test.mjs`: damaged-index fixtures, a second process holding a write lock, and the R-2403 late-writer check that uses `onRecoveryLocked`.
- `packages/nana-knowledge/lib/build.ts`: `BuildOptions.onRecoveryLocked` and `assertRecoveryDeleteSafe`.
- `packages/nana-knowledge/tests/build-busy.test.mjs`: M1's transient-lock barrier from build 1.
- `docs/reviews/knowledge-busy-2026-11-02/seat-mutate.mjs`: the seat's pairs.
