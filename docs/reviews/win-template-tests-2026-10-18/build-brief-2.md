# Lane win-template-tests — build brief 2 (2026-10-18 · feat/win-template-tests · tip after 0812a76)

**Builder: Claude Sonnet 5**, the same worktree and rules as brief 1. Windows run 1 (`ci-windows-run-1.log`, on 25717de):
`template-acceptance` 12, `template-release` 5 and `test-runner` 39 all pass with no skip. Windows failing fell to 26 of
150 files on this lane's run. `templates-update` is at 30 pass, 3 fail: the update legs ran on Windows for the first
time, now that the tag probe gets a real path.

**1. The three failures are copier's, under the runner's short temp path.** Each copier update throws
`ValueError: 'C:\Users\RUNNER~1\...\update-python' is not in the subpath of 'C:\Users\runneradmin\...\update-python'`:
copier compares the project folder as the test passed it (the 8.3 short form) with the long form git reports. A
Windows user's project path is the long form, so this is a test-root fault, not a template bug. In
`templates-update.test.mjs`, resolve the test's temp root with `fs.realpathSync.native` (dropping any leading `\\?\`)
before any copier or git call, so every path the update legs pass is the long form. Do not change the template or
copier's arguments otherwise. A `conflict REQUIREMENTS.md` line appears in the adopt leg before its error; if that leg
still fails after the path fix, report the conflict's cause rather than changing the template.

**2. SHOULD, from the seat's audit (`seat-audit-1.md`).** The update-leg skips at :212-213 and :264-265 report any
failure of the tag probe as "v0.6.0 tag unavailable" and ignore `NANA_TEST_REQUIRE_COPIER=1`, which CI sets. When that
variable is `1`, make a failed probe a FAIL that prints the probe's stderr; otherwise keep today's SKIP. Local runs
without the variable behave as before.

Must-meet TT1 still governs. Do not change product files or `scripts/test.mjs`. Do not touch `HANDOFF.md` or
`docs/sessions/`.

## Done
`templates-update` green on macOS at 34; the code-map and trace checks.

## Report
≤ 6 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: the commit; the macOS line; each edit; the one claim most
likely wrong on Windows.
