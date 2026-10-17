# win-session-start — both seats' session start is proven on Windows (W4 of the Windows fixes, 2026-10-17)

**The feature.** At session start both seats show the objective and the current priority, and the Claude Code seat also
shows the adoption line. On Windows the only proof today is that the SessionStart hooks exit 0
(`packages/nana-setup/tests/hooks-win32-exec.test.mjs`), the same gap the knowledge hook had until lane win-claude-hooks.
The tests that would prove the content fail on Windows for test reasons (`docs/reviews/windows-fixes-2026-10-17/rows.json`):
they move only `HOME` while Windows reads `USERPROFILE` (`objective-golden.test.mjs:39-40,106,976`,
`adoption-reader.test.mjs:169`), they make directory names NTFS forbids (`config-display-text.test.mjs:22-34,50`,
`adoption-reader.test.mjs:220-261`, `adoption-producer.test.mjs:318-324`, `objective-golden.test.mjs:368-385`), and one
builds a relative path across drives (`adoption-producer.test.mjs:305`). After this lane, the Windows run shows the
objective and adoption hooks printing their blocks through the installed commands, and the four test files run to
their end.

**Lane class: ordinary** while the changes stay in tests. If a check hidden behind a crash fails on Windows because of
product code, the builder stops and reports; that fix becomes its own lane (hook class if it is a hook). Threat model:
honest variation in Windows paths, names and home folders in scope; deliberate forgery out.

## Rows

| ID | Text |
|---|---|
| R-1340 | WHERE the platform is Windows, the installed objective and adoption SessionStart hook commands shall, run in a fixture project with an objective and a configured priority, print the objective block naming that priority and the adoption line. |

## Must-meet tests

- **SS1 (R-1340).** In `hooks-win32-exec.test.mjs` (Windows only; SKIPs elsewhere with its reason): in a fixture project
  with an `OBJECTIVE.md` and a priority, under a temp home whose `HOME` and `USERPROFILE` both point at it, run the
  installed SessionStart objective and adoption commands exactly as settings.json holds them, and assert the objective
  block names the fixture's priority and the adoption output carries its line.
- **SS2 (evidence).** On the Windows CI leg, `objective-golden`, `adoption-producer`, `adoption-reader` and
  `config-display-text` (all under `packages/nana-pack/tests/`) each pass with their macOS count minus declared win32
  skips, each skip printing its reason; the hostile-name cases keep at least one Windows-legal hostile name each.

## Known limits

POSIX file modes (chmod 000, 0o555 trust stores) and names with LF, CR, VT or `:` are POSIX-only cases.
