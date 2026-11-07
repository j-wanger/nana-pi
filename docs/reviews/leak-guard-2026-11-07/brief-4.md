# Brief 4: leak-guard, Windows CI fix 2

Feature: FEAT-041 · Shape each agent's context by role

CI on 6ed9d275 (suite, windows-latest) now prints details. Two leak-scan checks fail; everything else passes:
1. `M7: lane end warns after build line without changing outcome or exit`: in mode `failure`, exit 1 where 0 was expected, and the record shows real hits, not `unavailable`. The test injects the failure with `--import <absolute path>` (leak-scan.test.mjs:149). On Windows, Node's `--import` needs a file URL (`pathToFileURL(preload).href`), not a `C:\...` path. So the preload never loads and pi-worker fails on the flag. Pass the URL. Check every other `--import` or `--loader` in the lane's tests for the same thing.
2. `M6: CLI blocks hits and unread skips and rejects unknown refs`: `actual false, expected true`, child exit 1. Find which subcase fails on win32 by reading the check with that in mind: CRLF in git output, quoting of refs or paths in execFileSync on Windows, path separators in the reported path, or exit-code mapping. Fix the cause. If you can't tell without native Windows, make the check's detail name the subcase and its expected and actual exit, mark the cause inferred, and fix the most likely one.

Change nothing else. Use repo-relative paths, `~` and `$TMPDIR` in committed evidence.

## Precedent
- `packages/nana-pack/tests/leak-scan.test.mjs` — lines 140–160 (M7) and the M6 check.

Report: the tip, the causes (marking any inferred one), and the touched tests run.
