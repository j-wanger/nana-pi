# Lane win-session-start — build brief 2 (2026-10-17 · tip 96f0d8d)

Builder: Claude Sonnet 5, the same builder. CI run 39082975152 on draft pull request #18 (Windows log
`ci-windows-run-1.log` here; non-verbose, so only FAIL lines print):
- **SS1 passes on Windows** (`hooks-win32-exec.test.mjs` 29 → 30). adoption-producer 60, adoption-reader 41 (+1 skip) and
  config-display-text 36 (+2 skips) pass on Windows.
- `objective-golden.test.mjs`: 983 pass, 10 fail, 4 skips (it crashed at 94 before). The ten:
  1. `path payload (false|true): every mention is the escaped, quoted path` and `…: wording` (four). Find what the
     objective block prints for a Windows path, and whether the check's expected escaped form assumes POSIX separators.
     If the test's expectation is POSIX-only, make it build the expected form from the platform's path. If the product
     prints a Windows path in a form a user would misread (for example doubled backslashes), stop and report it with the
     exact output; do not change the product in this lane.
  2. `lone surrogate: well-formed, shown as U+FFFD` (one). Find whether Windows' file system round-trips a lone
     surrogate in a name differently; skip on win32 with the reason only if the case cannot exist there.
  3. `T2c fail closed: FIFO (must not block): …` (three): Windows has no FIFOs; skip on win32 with the reason.
  4. `T2c store owned by another user: …` (two): POSIX ownership; skip on win32 with the reason.
- `agent-dir-hostile`, `install-check`, `install` and `post-edit-file-queue` fail on Windows as on main; they belong to
  other lanes.

Same rules as brief 1. Done: `objective-golden.test.mjs` green on macOS with its count unchanged (`npm test -- <file>`);
`seat-titles.mjs 1` → `0 missing`. Commit with explicit paths, push. Report ≤ 10 lines, saying for item 1 whether the
cause was the test or the product, with the Windows output you reasoned from.
