# Windows hook expectation fix

- Branch: `feat/win32-hooks-memory`.
- Edited existing test: `packages/nana-setup/tests/hooks-win32-exec.test.mjs`, doctor label loop only. Removed the retired SessionEnd memory-making label.
- Requirement review: R-1055 already specifies active hook settings rows. No requirement change or new ID is needed.
- Production code: unchanged. No new tests, tunables or mutation pairs.
- Precedent: fix card; no Precedent section or departures.
- Read the complete test and `docs/known-bugs/FEAT-013.md`. No listed known bug is changed or claimed closed.
- The existing knowledge retirement assertion remains correct. The explicit shared knowledge CLI checks do not expect installed wiring. No verifier-pipe expectation remains.
- Doctor emits a failing retired-hook row only when stale wiring exists. There is no successful retired-hook row to assert after install.

## Label evidence

`checks.log` records `hookSettingsRows` with `NANA_SETUP_PLATFORM=win32` and an injected parse error, which enumerates labels without reading fixtures. Its four settings labels exactly match the remaining expected settings labels. `diagnose` forwards those rows. The same log records grep evidence for the remaining node label and the conditional retired-hook failure row in doctor.

Probe command:

```sh
NANA_SETUP_PLATFORM=win32 node --input-type=module <<'JS'
import { hookSettingsRows } from './packages/nana-setup/lib/hook-health.mjs';
for (const row of hookSettingsRows({ hooksDir: 'fixture/hooks' }, {}, 'injected label-only probe')) console.log(row.label);
JS
grep -nE 'node for the objective hook|settings.*retired hook|retired hook still wired' packages/nana-setup/lib/doctor.mjs
```

Both commands exited 0.

## Checks before commit

All commands exited 0:

- `npm run map:impact -- packages/nana-setup/tests/hooks-win32-exec.test.mjs`
- `node scripts/test.mjs hooks-win32-exec.test`: 1 file skipped on macOS; no failures. This runner does not execute the skipped file.
- Win32 row-builder probe and doctor grep above.
- `npm run map:check`: 523 modules, 0 problems.
- `npm run req:tree`: 2674 rows, 43 features, 0 problems.
- `node scripts/requirements-trace.mjs`: 1996 traced requirements; 0 rows off EARS form. Existing module-type warning paths normalized to repo-relative paths in the log.
- `npm run readme:check`: 781 claims, 0 problems.
- `node packages/nana-setup/bin/install-check.mjs`: all 14 checks passed; see `install-check.log`.

The full suite is deferred to CI under AGENTS.md. No Windows execution, CI access, push, issue operation or seat script execution occurred. Native Windows validation remains for the seat's main workflow.
