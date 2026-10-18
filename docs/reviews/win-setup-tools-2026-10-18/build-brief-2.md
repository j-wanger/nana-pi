# Lane win-setup-tools — build brief 2 (2026-10-18 · feat/win-setup-tools · tip after f2f90cc)

**Builder: Claude Sonnet 5**, the same worktree and rules as brief 1. Windows run 1 (`ci-windows-run-1.log`, on f2f90cc):
`doctor-detail` 62 pass + 1 skip, `install-check` 105, `trust` 11 — all pass. `restore` 11 pass, 3 fail. Windows
failures fell to 35 files on this lane's run.

**1. `restore.test.mjs`: the extraction at :147 fails.** GNU tar on the Windows runner prints
`tar: C\:\\Users\\RUNNER~1\\...\\Temp\nana-test-...\\destination-home: Cannot open: No such file or directory`. Two
things are visible: tar cannot open the `-C` folder, and the rendered path shows a line break where `\nana-test` was. That
suggests the backslashes in a `C:\` argument do not survive to Git's tar intact (INFERRED; confirm from the code and
the log before you change anything). The archive half at :116-117 passes. Give tar paths it cannot misread: pass `-C`
relative to the spawn's `cwd`, or with forward slashes, and make sure the destination folder exists first. The two
later failures ("restored doctor reports project trust only" and "every independently expected durable fixture
restores byte-equal") look like consequences of the failed extraction (INFERRED); confirm after the fix. If one
still fails on its own, report its cause.

**2. `trust.test.mjs:85` (the seat's skip audit, SHOULD).** The new relative agent-dir value resolves against the
runner's working folder inside the checkout. If the product ever accepted it, pi's store would be written into the
checkout. Spawn that one call with `cwd` set to the test's temp root, so any write stays in temp.

Must-meet ST1 still governs. Do not change product files. Do not touch `HANDOFF.md` or `docs/sessions/`.

## Done
`restore` and `trust` green on macOS with their counts unchanged (14 and 11); the code-map and trace checks.

## Report
≤ 8 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: the commit; each file's macOS line; each edit and why; what
you confirmed about the tar cause; the one claim most likely wrong on Windows.
