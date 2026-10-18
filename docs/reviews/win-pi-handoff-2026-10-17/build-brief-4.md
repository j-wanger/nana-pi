# Lane win-pi-handoff — build brief 4 (2026-10-18 · feat/win-pi-handoff · tip after 32ef165)

**Builder: Claude Sonnet 5**, the same worktree and rules as brief 1. Windows run 3 (`ci-windows-run-3.log`, on 32ef165):
six of seven files pass, and `display-surfaces` is at 180 pass, 1 fail. Windows failures fell to 39 files.

**The one failure:** "handoff custom prompt: the path is an exact escaped locator on the Source line". The product emits
the custom path as a JSON string, so each Windows backslash appears as `\\`. The test's `expectLoc` interpolates the
raw path, so its backslashes are single and `JSON.parse(expectLoc)` cannot equal the path. Escape backslashes first in
`expectLoc` (for example `custom.replaceAll("\\", "\\\\")` before the other replaces). macOS paths hold no backslash,
so the macOS expectation stays byte-identical. Change nothing else.

## Done
`display-surfaces` green on macOS at 181; the code-map and trace checks.

## Report
≤ 5 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: the commit; the macOS line; the edit.
