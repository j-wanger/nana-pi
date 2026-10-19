# Seat checks — study-stop build 1, tip 87bfeae (2026-10-19)

- CI run 39271830210 on draft pull request #42 (87bfeae; GitHub's merge with main 2a96090):
  - Windows `154 files: 133 PASS, 0 FAIL, 21 SKIP, 0 WARN · checks: 6216 pass, 0 fail, 79 skip`
    (`ci-windows-run-2.log`). `PASS  apps/bench/test/integration.test.mjs  48 pass  2.6s` and
    `PASS  apps/bench/test/orchestration-paths.test.mjs  91 pass  9.2s`; all six new checks pass natively. There Node's
    ENOTDIR message names only `raw\t1`, and the stop still names the run's full `raw\t1\lean\rep0` folder, so the
    plan's most-likely-wrong claim (the new checks on Windows) did not happen.
  - Ubuntu `154 files: 151 PASS, 1 FAIL, 2 SKIP, 0 WARN · checks: 7456 pass, 2 fail, 28 skip`. The one failure is
    path-spelling GP1/GP2, main's Linux regression, fixed on main by linux-path-spelling (ca27d86).
    `PASS  apps/bench/test/integration.test.mjs  48 pass  2.0s` and
    `PASS  apps/bench/test/orchestration-paths.test.mjs  91 pass  6.9s`.
  - macOS: the runner cancelled the first suite attempt before any step ran. The re-run (job 118138617177) reads
    `154 files: 152 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7509 pass, 0 fail, 14 skip`, with
    `PASS  apps/bench/test/integration.test.mjs  48 pass  2.2s` and
    `PASS  apps/bench/test/orchestration-paths.test.mjs  91 pass  7.9s` (log not copied). The seat still runs the full
    suite on macOS at the land.
  - install-check: macOS and Windows success.
- Red first (the seat, macOS, a temp copy of the tip with 2a96090's `apps/bench/run.mjs` and README): orchestration-paths
  87 pass, 4 fail — R-1500 (spawns=4), R-1501 (no error), R-1502 (4 rows, not 1), R-1503 (spawns=4, err=none). The
  R-1504 check and the R-542 probe check pass there, as the plan's pins. On the tip: 91 pass, 0 fail. Integration 48
  pass on both (marker-only change). The checks landed in bce4c50, before the fix in f04a320.
- On the tip (macOS): ops 48, plan 57 and the requirements-tree test 89 pass; `requirements-tree --check` exits 0.
  Trace: 1,260 rows, 5 violated (was 6), 0 off EARS form; R-1500 to R-1504 read implemented and R-542 reads
  implemented. `map:check` 0 problems; readme-check 0 problems.
- Tree movement (`requirements-moved --base 2a96090`): 6 rows in FEAT-036 — R-542 violated → implemented, R-1500 to
  R-1504 new (implemented).
- No wrong-code pairs and no independent check: an ordinary lane (apps/bench runner, its tests and README). The plan's
  known limits that the lane leaves open are HANDOFF residuals (six "Study stop" lines). The builder's report was not
  available to this record; its wrong-code results are not verified here.
