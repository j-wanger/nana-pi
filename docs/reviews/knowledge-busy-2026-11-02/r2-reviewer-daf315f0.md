The round 1 MUST is fixed without weakening the test. The four known-bug lines match round 1, nothing outside the brief's scope changed, and I found no harm the review standard lists. No MUST stands.

**The MUST (R-917 source check)**
- `build-busy.test.mjs` now imports the folder's helper with exactly the import line R-917 looks for (`import { tmpDir } from "./tmp-dir.mjs";`). It creates its folder with `tmpDir(path.join(os.tmpdir(), "nk-busy-"))`.
- The helper calls `mkdtempSync` with the same prefix and also deletes the folder when the process exits. The test's own `rmSync` in `finally` is still there, so cleanup only gets stronger.
- The diff changes no check title and no assertion. Both changed lines are the import and the folder call.
- I ran the R-917 rule from `packages/nana-pack/tests/test-runner.test.mjs:666-672` against all 300 test files at the tip, and it flags none.
- The build saved before-and-after test runs. Before the fix, 59 checks passed and 1 failed, the R-917 check. After it, all 60 pass (`build-4-red.txt`, `build-4-tests.txt`).

**Known-bug lines**
All four lines say what round 1 said:
- The Linux failure of R-3591 at 10398568 with noPull=1 (the reviewer's SHOULD).
- The M5 Windows load run, where most failures were other SessionStart hooks timing out (a NOTE from the reviewer and a SHOULD from the land reviewer).
- Dropping recovery's explicit `busy_timeout=0` would go unnoticed, since recovery would then wait only 100 ms (a NOTE).
- The final checkpoint can wait up to 5 s (a NOTE).

The reviewer's other NOTE, that the README's hook budget skipped the new waits, was fixed rather than recorded.

**Scope**
- Outside the lane folder, only four files changed: the test, `docs/known-bugs/FEAT-013.md`, the README, and `docs/code-map.md`. The code map edit is the regeneration in c0aadaa5, and it is consistent: `npm run map:check` reports 0 problems.
- Other checks also pass: `readme:check` (0 problems), `known-bugs.mjs` (exit 0) and `identity-scan` (exit 0). No runtime code changed.

**Notes (not blocking)**
- NOTE: the README sentence `A query may now wait up to 100 ms on a database lock, and a build up to 5 s.` is true for each lock a query meets. Round 1 found a pull can wait about 200 ms in total, and a reader may take 100 ms as the total.
- NOTE: build brief 4 told the builder to keep an existing FEAT-013 busy-timeout line. No such line is on main or on the branch, so the builder correctly removed or added nothing.
- NOTE: CI for the tip ce9d0239 (run 41395974222) was still queued when I checked. The land still has to wait for it to pass.

VERDICT: LAND
