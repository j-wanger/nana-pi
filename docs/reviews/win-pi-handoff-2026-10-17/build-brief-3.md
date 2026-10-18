# Lane win-pi-handoff — build brief 3 (2026-10-18 · feat/win-pi-handoff · tip after 35fe370)

**Builder: Claude Sonnet 5**, the same worktree and rules as brief 1. Windows run 2 (`ci-windows-run-2.log`, on 35fe370):
five of seven files pass. Windows failures fell from 45 files to 40. Two files are left.

**1. `display-surfaces.test.mjs`: still 140 pass, 2 fail, then the crash at :211.** Brief 2's cause was wrong. After the
`HOME` strip, the post-edit command still shows `\\?\C:\...\post-edit`, while the store path built from `HOME` shows no
prefix. The prefix comes from `newRoot` (:138): it returns `fs.mkdirSync(..., { recursive: true })`, which returns the
first folder it created, and on Windows that comes back in the `\\?\` form (INFERRED from the log; both failing values
come from `newRoot`, and the one value built from `HOME` is clean). Make `newRoot` return `path.join(HOME, name)`
always. Revert the `HOME` strip at :22 if the run shows it was not needed; it was added for the wrong cause.

**2. `handoff-staleness.test.mjs`: 40 pass, 1 fail, 1 skip, then a crash at :300.**
- The failing check at :290 expects the pointer to start with `~/`. Windows writes `~\`, and pi's own resolver expands
  `~\` on win32 (`normalizePath` in pi's `dist/utils/paths.js`). Use `~${path.sep}`, as the other pointer checks do.
- The crash: the probe loop at :296 writes `hand<TAB>off.md`, and Windows refuses control characters in file names.
  On win32 skip the tab, CR and LF probes with a SKIP line giving that reason; keep the two Unicode-space probes.

Must-meet HD1 still governs. Do not change product files.

## Done
The two files green on macOS with their counts unchanged; the code-map and trace checks.

## Report
≤ 8 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; each file's macOS line before and after; each
edit and why; the one claim most likely wrong on Windows.
