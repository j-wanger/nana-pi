# Lane win-project-files — build brief 3 (2026-10-17 · tip after the seat's code-map regeneration)

Builder: Claude Sonnet 5, the same builder. Windows run 2 (log `ci-windows-run-2.log` here) on 8c6f64a:
1. **`project.test.mjs` crashes at the next layer**: `ERR_UNSUPPORTED_ESM_URL_SCHEME … Received protocol 'c:'`. The
   only raw-path import left is `:219`, `await import(path.join(npmRoot, "@earendil-works", …, "trust-manager.js"))`.
   Import it through `pathToFileURL(...).href`. Check the file for any other `import(` of a filesystem path.
2. **`project-working-region.test.mjs` "target identity change during staging is refused" failed on run 2 and passed on
   run 1, on the same code** (run 1 log: `ci-windows-run-1.log`). Its hook unlinks `AGENTS.md` and writes a new one
   while the refresh still holds a handle on the old file; on Windows that can hit a delete-pending file or a scanner
   hold, so the swap itself is not reliable there. First give the check a detail (the result's status and detail, and
   the target's text) so a Windows failure names its cause. Then, on win32 only, when the hook's own replacement write
   throws, print a SKIP naming that cause; when it succeeds, the check asserts exactly as on POSIX. Do not change the
   product's identity check.
3. The seat regenerated `docs/code-map.md` after its merge of main; your last commit is unaffected.

Same rules as brief 1. Done: both files green on macOS, standalone and through `scripts/test.mjs`; `seat-titles.mjs 1`
→ `0 missing`; `node scripts/code-map.mjs --check`. Commit with explicit paths, push. Report ≤ 8 lines.
