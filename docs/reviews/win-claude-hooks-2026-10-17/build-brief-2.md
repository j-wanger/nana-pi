# Lane win-claude-hooks — build brief 2 (2026-10-17 · tip 5f7050d)

Builder: Claude Sonnet 5, the same builder. CI run 39073656911 on draft pull request #17 (Windows log
`ci-windows-run-1.log` here; this branch predates the verbose Windows leg, so only FAIL lines print):
- **KH1 passes on Windows**: `hooks-win32-exec.test.mjs` went from 28 to 29 passing checks. hook (94), discovery (37),
  settings-merge (209 + 7 skips) and shared-memory-hook (42 + 1 skip) pass on Windows.
1. **The macOS leg fails the trace rail** because R-1330 is `planned` while KH1 traces it. That was the seat's brief's
   mistake; the Windows run now shows KH1 passing, so flip R-1330 to `implemented` with KH1's title in its Evidence cell.
2. `render.test.mjs` on Windows: `FAIL the hostile filename renders as ONE escaped JSON literal` (66 pass, 1 fail, 2
   skips). The NTFS-legal stand-in name now reaches this check; find why its rendered literal differs on Windows (the
   path separator escaped in JSON is the likeliest) and make the check compare the Windows form, without weakening what
   it pins on macOS.
3. `verifier-pipe.test.mjs` on Windows: `FAIL installed symlink asks on a verifier-pipe hit` (28 pass, 1 fail). On
   win32 install writes no link; this check must run the hook as the installed settings entry runs it (exec form,
   `node <args[0]>`), as your build 1 did for the other checks in the file. Retitle it only if its title names a link
   that does not exist on Windows, and say so.

Same rules as brief 1; run test files through `npm test -- <file>` on this Mac. Done: the touched files green on macOS;
`node scripts/requirements-trace.mjs` exit 0; `seat-titles.mjs 1` → `0 missing`. Commit with explicit paths, push.
Report ≤ 8 lines.
