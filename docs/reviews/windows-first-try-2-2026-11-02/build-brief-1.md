Feature: FEAT-031 · Run checks reliably and without contaminating work

Lane windows-first-try-2. Class: ordinary. Builder: pi-worker (small lane). Build session 1. This build runs on the reference Windows 11 laptop; shell commands run in PowerShell or Git Bash, and Node is on PATH. Run the locked full suite only through `npm run test:locked`, which waits for the machine lock.

Build to the plan of record, `docs/reviews/windows-first-try-2-2026-11-02/plan.md` (revision 2). It has taken the adversary's attack in `plan-attack.md` and the seat's decision to split the R-1713 product fix into a separate hook lane. Build rows R-3540 and R-3541 and must-meet M1 to M3 exactly as its Must-meet section says. Requirements first: rows, then tests, then evidence.

Why this lane exists: two Windows CI checks fail on their first try. The objective golden corpus's hook-versus-pi comparison fails when the installed hook prints a producer's load marker under load; this lane fixes that in the test. R-1713's background-rebuild check fails because of a product bug: `openDb` has no busy timeout, so the background build can die with "database is locked". This lane only adds diagnostics to R-1713 and records the bug; it does not fix it.

Constraints:
- Edit only these:
  - `packages/nana-setup/tests/hooks-win32-exec.test.mjs`;
  - the new `packages/nana-setup/tests/knowledge-state.mjs`;
  - `packages/nana-pack/tests/objective-golden.test.mjs`;
  - the new `packages/nana-pack/tests/objective-hook-retry.mjs`;
  - `REQUIREMENTS.md` and `docs/known-bugs/FEAT-013.md`;
  - generated files (`docs/code-map.md`, `docs/requirements-tree.md`), `code-map.config.json` if the map requires it, and the lane folder.
- Do not edit any file under `packages/nana-knowledge`, `packages/nana-setup/lib`, `packages/nana-setup/claude`, `packages/nana-pack/lib`, `packages/nana-pack/bin` or `packages/nana-pack/extensions`. M2's mutation is an uncommitted copy, restored afterwards. Confirm `git status` shows no product file before you commit.
- R-1713's pass condition, title and `REBUILD_DEADLINE_MS` stay as they are. Only its detail grows.
- Build both markers from their defining modules (plan A1); never copy marker text into a test.
- Keep every check title byte-identical. The only other check edited is the CLAUDE_PROJECT_DIR control (plan O4).
- New values are named constants with a `chosen` provenance comment. No new inline literal.
- Both new helpers carry the six-tag module header.
- No committed text names a person or a machine path.

## Show your work

Save each in `docs/reviews/windows-first-try-2-2026-11-02/`:
- `m1-state.mjs` and `m1-state-win32.txt`, as M1 says;
- `m2-mutation-win32.txt`, `m2-retry.mjs` and `m2-retry-win32.txt`, as M2 says;
- `suite-run-win32.txt`: the locked full suite, run as a plain foreground command, `npm run test:locked` with no filter. Record the summary line and the two changed test files' times.

## Done when

- M1 to M3 hold. R-3540 and R-3541 are `implemented`, with backticked `file::title` evidence naming the tagged checks.
- FEAT-013 has the busy-timeout line, and its line 202 cause says "inferred, not reproduced on CI". Do not edit `docs/known-bugs/FEAT-031.md`.
- The locked full suite passes except the known `post-edit-utf8` (no Python) and `template-acceptance` (no uv). If another file fails only on a time limit, re-run it alone and report both results. R-1713 may still fail on this machine, since its product fix is not in this lane. If it fails, report its new detail and do not count it against M3.
- These are green:
  - `npm run map` then `npm run map:check`;
  - `npm run readme:check`;
  - `node scripts/requirements-trace.mjs`;
  - `node scripts/requirements-tree.mjs --check` (regenerate with `--write` first);
  - `node scripts/known-bugs.mjs --root .`;
  - `node scripts/identity-scan.mjs --root .`.
- `node scripts/lane-class.mjs --root . --base origin/main` prints `ordinary`.
- Commit explicit paths on `feat/windows-first-try-2`. Do not push; the seat pushes.

Report:
- every row, check and constant changed;
- the M1 state descriptions;
- the M2 mutation and retry results;
- the suite summary line;
- each departure from the Precedent.

## Precedent

- `docs/reviews/windows-local-suite-2026-11-01/plan.md`: the last landed test-only Windows reliability lane.
- `packages/nana-setup/tests/hooks-win32-exec.test.mjs`: `rebuilt`, `waitForRebuilt` and the R-1713 block.
- `packages/nana-knowledge/lib/db.ts`: `openDb`, the read-only open copied with a busy timeout; read only.
- `packages/nana-pack/tests/objective-golden.test.mjs`: `runHook`, `golden`, `withCaseLimit`, the T17 cases and the CLAUDE_PROJECT_DIR control.
- `packages/nana-setup/lib/hook-producer.mjs`: `hookProducerConfig` and the markers; imported, unchanged.
- `packages/nana-pack/lib/frontier-summary-config.mjs`: `FRONTIER_TAG` and `FRONTIER_UNAVAILABLE`; imported, unchanged.
- `packages/nana-pack/tests/land-checks.mjs`: a shared test helper with the six-tag header.
