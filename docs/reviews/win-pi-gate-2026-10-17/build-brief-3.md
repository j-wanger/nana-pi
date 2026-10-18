# Lane win-pi-gate — build brief 3 (2026-10-17 · tip b8014d1)

Builder: Claude Sonnet 5, the same builder. Windows run 2 (`ci-windows-run-2.log` here): the four other files pass;
`agent-dir-parity.test.mjs` still dies at its final `fs.rmSync(HOME, …)` (`:202`) with `EBUSY … rmdir …\nana-u2p-…`,
after the retries. So something holds the folder for longer than the retry window; it is not a slow release.
Candidates, check each against the code the file runs: (1) the test process's own working folder inside `HOME`
(`process.chdir`); (2) a detached background child that install, doctor or a hook starts and leaves running with its
working folder or an open file in `HOME` — the knowledge pull spawns a background index build when the index is stale
or missing, and an installed hook run with a temp home has no index; (3) a child not yet reaped. Find the holder by
reading the code paths (and, if useful, listing the file's spawns with their `cwd` and `detached` options), then fix
the test: move the process's cwd out first, point the background build away from `HOME` or wait for it, or stop it.
Do not remove the cleanup. If the holder is product code that leaves a detached process running in a user's folder
after a command returns, stop and report it.

Same rules as brief 1. Done: `agent-dir-parity.test.mjs` green on macOS with its count unchanged. Commit with explicit
paths, push. Report ≤ 6 lines naming the holder.
