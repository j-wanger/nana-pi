# Lane win-pi-handoff — build brief 5 (2026-10-18 · feat/win-pi-handoff · tip after 3baad0e)

**Builder: Claude Sonnet 5**, the same worktree and rules as brief 1. The final reviewer (`sol-r1.md`) sent the lane back
with one MUST: `handoff-store.test.mjs:237` skips the dangling-link cases on Windows as "POSIX symlinks". Windows has
symlinks, and CI's Windows leg already creates them (`handoff-symlink.test.mjs` passes there). So ten checks of the
broken-versus-missing store behaviour never run on Windows, and the skip's reason is false.

**The fix.** Run both dangling-link blocks (the dangling store entry and the dangling `handoffs/` folder link) on
Windows. Create the folder link with type `"junction"` or `"dir"` on win32 as the product's other tests do. Skip only
when the test cannot create a symlink at all (an `EPERM` from `symlinkSync`, as on a Windows machine without Developer
Mode), and print that reason. Change no check's expectation unless Windows makes it false; if a check fails on Windows
because of product code, stop and report it. This lane does not fix product code.

## Done
`handoff-store` green on macOS at 52; the code-map and trace checks.

## Report
≤ 6 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: the commit; the macOS line; each edit; the one claim most
likely wrong on Windows.
