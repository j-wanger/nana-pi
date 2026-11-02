Feature: FEAT-013 · Install and connect harness runtimes

Lane knowledge-busy. Class: hook (`packages/nana-knowledge/lib/db.ts` and `build.ts` reach the knowledge hook). Builder: pi-worker (small lane). Build session 1. This build runs on the reference Windows 11 laptop; shell commands run in PowerShell or Git Bash, and Node is on PATH.

Build to the plan of record, `docs/reviews/knowledge-busy-2026-11-02/plan.md` (revision 2). It has taken the pi adversary's attack in `plan-attack.md` and the seat's churn probe in `hook-churn-probe.txt`. Take its Open choices' defaults. Build rows R-3590 to R-3594, the R-2403 amendment, and must-meet M1 to M5 exactly as its Must-meet section says.

Threat model: honest variation in machines and load is in scope (a hook, a background build and other readers on one index; Windows and macOS; CPU load; Node 22 point releases). Deliberate forgery is out.

## Build

1. Requirement rows first: add R-3590 to R-3594 to the FEAT-013 table in `REQUIREMENTS.md`, and amend R-2403's text as the plan says.
2. Then the tagged tests in `packages/nana-knowledge/tests/build-busy.test.mjs`, written before the code. Run M1 and M2 against main's code first and record the red output in `docs/reviews/knowledge-busy-2026-11-02/build-1-red.txt`.
3. Then the code in `db.ts` and `build.ts`.
4. Grep every test and checker for literals this change breaks before limiting edits. Watch for `recover.test.mjs` case limits, which may need the 5 s wait.
5. Add one session entry to the current `docs/sessions/` file, newest first.

Constraints:
- Every child process a test starts has a watchdog and is ended in `finally`. Temp homes go under the system temp folder and are removed afterwards.
- Never edit the real `~/.pi/agent` or the real knowledge home; tests set `NANA_KNOWLEDGE_HOME` to a temp folder.
- Recovery's explicit `PRAGMA busy_timeout=0` (`build.ts:252`) stays.
- New values are named constants with `chosen` provenance, pinned by one seal check each.
- No committed text names a person or a machine path.

## Show your work

Save each in `docs/reviews/knowledge-busy-2026-11-02/`:
- `build-1-red.txt`: M1 and M2 run against main's code;
- `build-1-green.txt`: the new test file passing;
- `m5-win32.txt`: M5's four items, which are:
  - 10 consecutive runs of `node scripts/test.mjs packages/nana-setup/tests/hooks-win32-exec.test.mjs` with four `node -e "for(;;){}"` processes on every core, stopped afterwards;
  - `node --no-warnings docs/reviews/knowledge-busy-2026-11-02/hook-churn-probe.mjs . 20` on the built code;
  - every touched knowledge test;
  - `node packages/nana-setup/bin/install-check.mjs` and its exit.

## Done when

- M1 to M5 hold. R-3590 to R-3594 are `implemented` with backticked `file::title` evidence. R-2403 is amended, and its checks pass.
- The FEAT-013 busy-timeout known-bug line is removed if PR #317 has landed (check `git log origin/main`); otherwise say it has not landed and leave the file.
- These are green:
  - every touched test file;
  - `npm run map:check` (after `npm run map`);
  - `npm run readme:check`;
  - `node scripts/requirements-trace.mjs`;
  - `node scripts/requirements-tree.mjs --write` then `--check`;
  - `node scripts/known-bugs.mjs --root .`;
  - `nana-writing` on the session entry;
  - `node scripts/identity-scan.mjs --root .`.
- Do not run the locked full suite; CI is the suite.
- `node scripts/lane-class.mjs --root . --base origin/main` prints the hook class.
- Commit explicit paths on `feat/knowledge-busy`. Do not push; the seat pushes and writes the wrong-code pairs.

Report:
- every row, check and constant changed;
- the red and green results;
- M5's numbers;
- the install-check exit;
- each departure from the Precedent.

## Precedent

- `packages/nana-knowledge/lib/db.ts`: `openDb`, `indexDamage`, `DAMAGE_CODES`.
- `packages/nana-knowledge/lib/build.ts`: `assertRecoveryDeleteSafe`, `build`, `buildLocked`, `acquireBuildLock`, `LOCK_TTL_MS`.
- `packages/nana-knowledge/lib/hook.ts`: `BUDGET_MS` and the query open.
- `packages/nana-knowledge/tests/recover.test.mjs`: the R-2403 checks and a second process holding a write lock.
- `packages/nana-knowledge/tests/hook.test.mjs`: the seal form.
- `docs/reviews/knowledge-busy-2026-11-02/hook-churn-probe.mjs`: the probe M2 turns into a test.
