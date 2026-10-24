No MUST findings.

- SHOULD — `packages/nana-pack/bin/pi-worker.mjs:168–176`: the lock is acquired before the watcher starts. A hard kill in this window leaves a stale lock requiring manual removal. `docs/known-bugs/FEAT-006.md` incorrectly says this window leaves no lock.
- NOTE — All ten targeted test files passed locally on macOS, including watcher cleanup and shared watchdog regressions. Native Windows checks remain dependent on the required CI leg.

VERDICT: LAND
