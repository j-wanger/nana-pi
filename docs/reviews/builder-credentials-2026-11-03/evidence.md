# Builder credentials — build 1

Feature: FEAT-002 · Resume decisions and next actions
Lane class: ordinary (`node scripts/lane-class.mjs --root . --files REQUIREMENTS.md,packages/nana-pack/prompts/builder-preamble.md,packages/nana-pack/tests/worker-lane.test.mjs,docs/sessions/2026-10.md`, exit 0).

## Change

- R-3650 is implemented in the same table as R-2510, with its tagged test citation.
- The exact Scope line follows the GitHub-issue prohibition.
- The test follows R-2510 and reuses `RULE_LINE` / `preambleOnce` without copying a helper.
- One authorized session entry was added newest first to `docs/sessions/2026-10.md`.
- `docs/requirements-tree.md` was regenerated.
- Precedent departures: none. REQUIREMENTS.md was read at affected rows, following AGENTS.md's affected-rows-only instruction.
- Existing tests edited: none. One new check and one RULE_LINE entry were added in worker-lane.test.mjs.
- Known bugs touched: none; the full FEAT-002 known-bug file was read.
- No new tunables or runtime text parsing were added.

## Wrong-code pair

The new R-3650 check ran against the unchanged HEAD preamble (verified by `git diff --quiet HEAD -- packages/nana-pack/prompts/builder-preamble.md`, exit 0).
`node packages/nana-pack/tests/worker-lane.test.mjs` exited 1; R-3650 was the only FAIL (`wrong-code-first.log`).
Adding the prescribed line made the same command exit 0 (`worker-lane.log`). No assertion was inverted.

## Literal audit

Searched all tracked/nonignored `.mjs` tests and checkers for builder-preamble, RULE_LINE, preambleText, preambleOnce, preamble length/hash references.
Inspected templates-render.test.mjs's Scope substring assertion and worker-claude.test.mjs's expected prompt assembly.
They read the preamble dynamically or assert unaffected substrings; neither needs an update.
Historical acceptance scripts include old byte-equality baselines; they are not current suite checks and were left unchanged.

## Local commands

All following commands exited 0; sibling logs hold output:

- `node packages/nana-pack/tests/worker-lane.test.mjs`
- `node packages/nana-pack/tests/worker-claude.test.mjs`
- `node packages/nana-pack/tests/templates-render.test.mjs`
- `npm run map:check`
- `npm run readme:check`
- `node scripts/requirements-trace.mjs`
- `npm run req:tree`
- `node scripts/requirements-tree.mjs --root .`
- `node scripts/known-bugs.mjs --root .`
- `nana-writing <OS-temp-file containing only the new session entry>`

`git diff --check` exited 0. After staging, `node scripts/identity-scan.mjs --root .` first exited 1 because four logs contained absolute worktree paths. Replacing that path with `<worktree>` in recorded logs made the staged scan exit 0; no test output assertions changed.

The local full suite was not run: AGENTS.md assigns it to CI. Command blocking is deferred to the hardening lane.
