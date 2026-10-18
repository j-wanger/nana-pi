# win-review-tests — the review tools' tests run to their end on Windows (W7a of the Windows fixes, 2026-10-18)

**The feature.** `pi-review`, `review-round`, `review-ledger` and `pi-worker` run on Windows, but three of their test files
crash there before most checks run (`docs/reviews/windows-fixes-2026-10-17/`, and the seat's re-triage in this folder):
`immutable-review` and `review-ledger` die at module load on a raw `D:\` path handed to `import()`, and `worker-lane`
stops after 10 of 52 checks. Under the crashes, the fake `pi` is a `#!/bin/sh` script Windows cannot launch, so the
runner's real global pi starts instead ("No API key found"). After this lane the three files run to their end on Windows.

**Lane class: ordinary** — tests only, plus one shared test helper. Under the test faults sits a product bug: the review
tools compare Windows' short 8.3 temp path (`RUNNER~1`) with git's long path. That bug is lane W7c's (a gate lane). This
lane keeps the short temp path on purpose, so the checks that bug fails stay visible and name it. Threat model as the
other Windows lanes: honest variation in Windows paths, processes and file systems in scope; deliberate forgery out.

## Must-meet (evidence; no new row)

- **WR1.** On the Windows CI leg, `immutable-review`, `review-ledger` and `worker-lane` (under `packages/nana-pack/tests/`)
  run to their end with no crash, and no line they print says "No API key found". `worker-lane` passes with its macOS
  count minus declared skips. In `immutable-review` and `review-ledger`, every FAIL left is one the build brief lists as
  blocked by the short-path bug, and each prints the short and long paths it compared. Each skip prints a reason that
  names a case that cannot exist on Windows.
- **WR2.** The macOS counts are unchanged (17, 155, 52), and the POSIX stubs keep their behaviour, the sleeper and
  ignorer modes included.

## Known limits

Until W7c lands, R-705, R-724, R-967, R-979 and R-1009 are violated on Windows: a tracked `--out` is not refused, one
repository can get two ledger keys (so the round cap resets), and a dead review checkout is never reclaimed there.
SIGTERM cleanup is untested on Windows (Windows delivers none), and the extensionless git shims cannot run there.
