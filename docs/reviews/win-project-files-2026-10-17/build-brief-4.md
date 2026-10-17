# Lane win-project-files — build brief 4 (2026-10-17 · tip ce29bc5)

Builder: Claude Sonnet 5, the same builder. Windows run 3 (log `ci-windows-run-3.log` here):
- `project-working-region.test.mjs`: **PASS, 27 checks**, no skip taken.
- `project.test.mjs`: **112 pass, 9 fail**, no crash. Eight of the nine are the line-ending class the win-line-endings
  lane fixes (the nasty-name seed, the SKILL.md starter, six byte-equal seed copies); leave them.
- The ninth is yours: `--check: CLAUDE.md as a link into a missing folder reads ✗ naming the target` fails on Windows;
  its detail shows the `--check` output's first line instead of the expected ✗. Read that check and the code path in
  `packages/nana-setup/lib/project.mjs` that classifies a CLAUDE.md link, and find what differs on Windows (how the test
  makes the link there — a file link, a directory link or a junction — and what `lstat`/`readlink` return for a link
  into a missing folder). If the product misreports a dangling link on Windows, fix the product and say so; if the
  test cannot make that link on Windows, skip it there with the reason printed. The check's macOS behaviour does not
  change.

Same rules as brief 1. Done: `project.test.mjs` green on macOS standalone and through `scripts/test.mjs`;
`seat-titles.mjs 1` → `0 missing`. Commit with explicit paths, push. Report ≤ 8 lines, saying which of the two it was.
