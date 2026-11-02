Feature: FEAT-031 · Run checks reliably and without contaminating work

Lane windows-first-try. Class: ordinary. Builder: pi-worker (small lane). Build session 1. This build runs on the reference Windows 11 laptop; shell commands run in PowerShell or Git Bash, and Node is on PATH. Another lane may share this machine: run the locked full suite only through `npm run test:locked`, which waits for the machine lock.

Build to the plan of record, `docs/reviews/windows-first-try-2026-11-02/plan.md` (revision 2), which has taken the adversary's attack in `plan-attack.md`. Build rows R-3530 and R-3531 and must-meet M1 to M3 exactly as its Must-meet section says. Requirements first: rows, then tests, then evidence.

Why this lane exists: two checks fail Windows CI legs on their first try for reasons of load, not behaviour. They are mutation-runner's stagger check (gaps 118 and 148 ms against 150) and post-edit-status's "timeoutMs 0 arms no deadline and a slow check passes". The plan's Assumptions give the mechanism for each, and `ci-windows-failures.tsv` is the evidence.

Constraints:
- Test files only: `packages/nana-pack/tests/mutation-runner.test.mjs` and `packages/nana-pack/tests/post-edit-status.test.mjs`. Do not edit any file under `packages/nana-pack/lib`, `packages/nana-pack/bin` or `packages/nana-pack/extensions`. M2's product mutation is an uncommitted copy, restored afterwards; confirm `git status` is clean for product files before you commit.
- Keep both check titles and every other check in both files byte-identical. The only edit to a req line is the appended row ID.
- New values are named constants with a `chosen` provenance comment, as the files' existing constants are. No new inline literal.
- The CPU load for M1 and M2's load runs: four `node -e "for(;;){}"` processes, started before and stopped after each load run. Do not leave any running.
- No committed text names a person or a machine path.

## Show your work

Save each of these in `docs/reviews/windows-first-try-2026-11-02/`:
- `m1-mutation-win32.txt`, `m1-load-win32.txt`, `m2-mutation-win32.txt` and `m2-load-win32.txt`, as M1 and M2 say. Write each with the command, the relevant PASS or FAIL lines with their detail, and the restore step.
- `suite-run-win32.txt`: the locked full suite, run as a plain foreground command, `npm run test:locked` with no filter. Record the summary line and the two files' times.

## Done when

- M1 to M3 hold. R-3530 and R-3531 are `implemented`, with backticked `file::title` evidence naming the two checks.
- FEAT-031's line 5 no longer says the stagger check may fail on a loaded machine; the rest of the line is unchanged.
- The locked full suite passes except the known `post-edit-utf8` (no Python) and `template-acceptance` (no uv). If another file fails only on a time limit, re-run it alone and report both results.
- These are green:
  - `npm run map:check` (run `npm run map` first if needed);
  - `npm run readme:check`;
  - `node scripts/requirements-trace.mjs`;
  - `node scripts/requirements-tree.mjs --check` (regenerate with `--write` first);
  - `node scripts/known-bugs.mjs --root .`;
  - `node scripts/identity-scan.mjs --root .`.
- `node scripts/lane-class.mjs --root . --base origin/main` prints `ordinary`.
- Commit explicit paths on `feat/windows-first-try`. Do not push; the seat pushes.

Report: every row and check changed; the constants and their values; each mutation's FAIL detail; the load-run results; the suite summary line; each departure from the Precedent.

## Precedent

- `docs/reviews/windows-local-suite-2026-11-01/plan.md`: the last test-only Windows reliability lane, with evidence first, kept assertions and a mutated run.
- `packages/nana-pack/tests/mutation-runner.test.mjs`: `CONTEND_WAIT_MS` and its `NANA_TEST_WAIT_MS` pass-through; `check(name, ok, why)`.
- `packages/nana-pack/lib/mutation-runner.mjs`: the worktree lock, the header after set-up and the parent's stagger; read only.
- `packages/nana-pack/tests/post-edit-status.test.mjs`: `settle(promise, limitMs)`.
- `packages/nana-pack/extensions/nana-post-edit.ts`: the `timeoutMs > 0` deadline guard; read only, mutated only in an uncommitted copy.
- `docs/known-bugs/FEAT-031.md`: line 5, edited.
