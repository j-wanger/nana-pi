# win-template-tests — the template and test-runner tools' tests run on Windows (W7b of the Windows fixes, 2026-10-18)

**The feature.** A new project made on Windows renders, updates and passes its own checks, the template release gate
runs there, and the suite runner reports Windows results honestly. Four test files fail on Windows for test reasons
(the seat's re-triage beside this file): `new URL(...).pathname` handed to git, copier and Python as `/D:/...`; a git
symlinked under an extensionless name, which Windows' PATH search never finds; and the runner's own fixtures expecting
a POSIX signal name and a POSIX-only skip. After this lane the four files pass on Windows.

**Lane class: ordinary** — tests only, plus one shared test helper. If a check hidden behind these faults fails on
Windows because of product code (a template's own tests under `templates/python/template/tests/`, the release CLI, or
`scripts/test.mjs`), the builder stops and reports. Threat model as the other Windows lanes.

## Must-meet (evidence; no new row)

- **TT1.** On the Windows CI leg, `templates-update`, `template-acceptance`, `template-release` and `test-runner` (under
  `packages/nana-pack/tests/`) each pass with their macOS count minus declared win32 skips, each skip printing a reason
  that names a case that cannot exist on Windows. The two `templates-update` blocks the `v0.6.0` tag probe skipped run
  on Windows (CI checks out full history).
- **TT2.** The macOS counts are unchanged (34, 12, 5, 39).

## Known limits

The updated project's pytest under `templates-update` runs on Windows for the first time; nobody knows yet whether it
passes. A copied v0.6.0 project may check out with CRLF line endings (inferred harmless).

## Amendment (the seat, 2026-10-18, after Windows run 2)

The update legs ran on Windows for the first time in run 2 and found a product bug in the Python template: a Python
project rendered on Windows fails its own pytest. `tests/test_requirements_trace.py` runs pytest in a subprocess
through pytester, which reads the child's output as UTF-8; the child writes the template conftest's summary separator
`·` in Windows' cp1252, so decoding fails (`UnicodeDecodeError ... byte 0xb7`). The brief's stop condition applies: the
fix is in `templates/python/template/`, a product change. So TT1 holds for every check except one, "Python earlier-tag
update prints Part G drift", which fails on Windows on that template bug and is fixed by the next lane,
win-python-template. Every other check in the four files passes on Windows with no skip.
