Feature: FEAT-031 · Run checks reliably and without contaminating work

# Review brief 1: win-class

Review `git diff main...HEAD` on feat/win-class (54e02d11 plus this brief; 46 files, about +200 / -189).

The owner's ruling (2026-11-09): "a red main leg re-runs once at the same commit; a green re-run keeps lands open, and the flake is recorded per file and fixed in source." The main CI check marked `lane-checks.test.mjs` as needing a fix lane after one case failed on Windows from four different causes. This lane fixes the Windows failure classes at their source instead of case by case:
- the test runner resolves its temp parent once to the long path spelling, and the per-test path repairs go;
- the shared relay kills the whole process tree at its backstop, and the pipe-holder case counts its deadline from a readiness signal instead of a fixed 10-second budget;
- the runner prints a failing file's stderr tail when the file exits non-zero without a failure line;
- the Windows shim test installs no repository hook.
It also records the owner's 2026-11-10 decisions in the rulings file and one wording change in OBJECTIVE.md.

The builder reports PARTIAL: it did not identify the holder behind `build-records.test.mjs`'s Windows EBUSY at temp cleanup, and left some short-path skip branches in another test. The builder cannot run Windows. The seat is running this lane's Windows CI leg and a throwaway probe branch that repeats the failing files ten times on Windows.

Builder's validation: trace, tree check and `check:lane` pass; 39 touched test files pass alone (959 checks); net -19 lines.

Questions:
- Does the tree kill at the relay backstop stop only the processes this relay started, on every platform, and never a reused process ID?
- Does the readiness-triggered deadline still prove the relay returns on time when a holder keeps the output pipe open, or can it pass without a holder?
- Does any test now depend on the runner's long temp spelling in a way that hides a real short-path bug the product must handle?
- Do the rulings line and the OBJECTIVE wording say only what the owner decided?

Threat model: honest variation in scope is in; deliberate forgery is out.

Put exactly one verdict line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, as the last line, and no other line starting with "Verdict".
