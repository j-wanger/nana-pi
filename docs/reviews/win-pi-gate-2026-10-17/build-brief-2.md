# Lane win-pi-gate — build brief 2 (2026-10-17 · tip ac56069)

Builder: Claude Sonnet 5, the same builder. CI run 39085116653 on draft pull request #19 (Windows log
`ci-windows-run-1.log` here): gate-corpus 227, gate-policy-paths 93, lane-write-guard 9 and agent-dir-hostile 18 (+1
skip) pass on Windows. `agent-dir-parity.test.mjs` runs its 31 checks and 4 skips, then the file dies in its cleanup:
`Error: EBUSY: resource busy or locked, rmdir 'C:\Users\RUNNER~1\AppData\Local\Temp\nana-test-…\nana-u2p-…'`. Windows
will not remove a folder some process still holds (a child's working folder, or a handle not yet closed). Find which
folder `nana-u2p-` is and what holds it at that point; close or wait for that holder before the removal, or remove with
`fs.rmSync(dir, { recursive: true, force: true, maxRetries, retryDelay })` (named constants with a chosen reason). The
removal must not be skipped on macOS.

Same rules as brief 1. Done: `agent-dir-parity.test.mjs` green on macOS with its count unchanged; the code-map check.
Commit with explicit paths, push. Report ≤ 6 lines naming what held the folder.
