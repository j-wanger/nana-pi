# Lane win-project-files — build brief 2 (2026-10-17 · tip c596dca, main a980a1f merged)

Builder: Claude Sonnet 5, the same builder. The draft pull request's first Windows run (39062424783; log
`ci-windows-run-1.log` in this folder, now verbose thanks to PF5) shows:
- `project-working-region.test.mjs`: **PASS, 27 checks** on Windows. The refresh fix works.
- `project.test.mjs`: 54 checks pass, then the file crashes at `:217`:
  `const npmRoot = spawnSync("npm", ["root", "-g"], { encoding: "utf8" }).stdout.trim();` →
  `TypeError: Cannot read properties of undefined (reading 'trim')`. A bare `spawnSync("npm")` cannot start npm's
  `.cmd` shim on Windows. Use the package's own helper, `spawnNpmRoot` from `packages/nana-setup/lib/npm-root.mjs`, as
  `trust.test.mjs:19-24` and `restore.test.mjs:17,37` do. That also fixes the file's standalone macOS run you noted.
  Search the file for any other bare `spawnSync("npm"` or `"pi"` and route it the same way.
- `ci-workflow.test.mjs` fails 10 of 12: the line-ending class the win-line-endings lane fixes; leave it.
- Linux fails only `lane-write-guard.test.mjs`, as main does.

After the fix, the next Windows layer in `project.test.mjs` is unknown; the seat runs CI again and sends what it shows.
Same rules as brief 1. Done: `project.test.mjs` green on macOS, run standalone and in the line-ending clone (its known
CRLF failures excepted, listing them); `seat-titles.mjs 1` → `0 missing`. Commit with explicit paths, push. Report ≤ 8
lines.
