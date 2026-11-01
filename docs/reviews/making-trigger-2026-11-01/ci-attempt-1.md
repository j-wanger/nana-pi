# First finished hosted run — fixture isolation closure

Run: https://github.com/j-wanger/nana-pi/actions/runs/41274710352
Tip: `0e76364275c3cf6c9973248f27479eebfdbe0637`
Finished result read once: failure. The watch returned exit 1; the finished-run read returned exit 0.

| Job | Result |
|---|---|
| install-check, macOS ceiling | success |
| install-check, macOS floor | success |
| install-check, Windows ceiling | success |
| install-check, Windows floor | success |
| suite, macOS | failure: seven automatic-making cases inherited CI and skipped making |
| suite, Linux | failure: same fixture environment defect |
| suite, Windows | failure: same fixture environment defect; R-3104 passed |

Closure: the new synthetic fixture now removes inherited CI from its injected seat environment. R-3296 still supplies CI explicitly and asserts the production skip. No production guard was weakened. This changes only this lane's new fixture, not an existing test from main.

`CI=1 node scripts/test.mjs memory-run` reproduced the defect before the fixture correction: exit 1 (`ci-mode-wrong.txt`). The same command then passed all 23 checks: exit 0 (`ci-mode-tests.txt`).

Foreground `CI=1 npm run test:locked`: exit 0 (`full-suite-ci-mode.txt`), 249 files, 247 PASS, 0 FAIL, 2 SKIP, 0 WARN; 8863 passing checks, 0 failing checks, 44 skips, 663.8 seconds. The new tip is pushed for a fresh hosted run, not a rerun of the defective tip. The brief's R-3104 rerun exception did not apply.
