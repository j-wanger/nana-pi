# Review 1 fix

## Closure

- MUST 1: `one-reviewer.test.mjs` now copies the two setup helpers beside its copied pack, following `review-standard.test.mjs` without departure. Existing M3 and M4 failed with `ERR_MODULE_NOT_FOUND` before the repair and pass afterward. No assertions changed, no new tests, no production changes, and no new requirement rows or tunables. Existing rows R-3759 and R-3760 retain their contracts.

## Changes

- `packages/nana-pack/tests/one-reviewer.test.mjs`: repair only `launchFixture`; no case bodies changed.
- `docs/code-map.md`: regenerate shifted launcher line numbers.
- `docs/known-bugs/FEAT-013.md`: append review 1 SHOULDs 2–5, one line each: Claude user-memory overcount, trusted section probe, shared three-second probe limit, and stale child table cell. These remain unfixed. No existing known-bug lines changed.
- `review-1-fix.log` in this directory: normalized command output, including the initial failure and green rerun.

## Verification

- Sweep: `git grep -ln "launchFixture\|cpSync(.*bin" -- packages/nana-pack/tests` selects only `one-reviewer.test.mjs`. Also inspected all `cpSync` sites; the other launcher copies in review-standard, claude-review, and context-anatomy already provide setup helpers. No second gap found.
- Wrong/right pair: existing M3 and M4 with missing fixture dependencies fail; repaired dependency layout passes. No new tests required mutation pairs.
- `node scripts/test.mjs one-reviewer`: exit 1 before repair; 6 checks pass, 2 fail.
- `node scripts/test.mjs one-reviewer review-standard claude-review context-anatomy child-context`: exit 0; 6 files pass, 49 checks pass, 1 skip.
- `npm test -- --pack=land,module --changed-from=main --jobs=4`: initially exit 1 solely from stale map references; after map generation exit 0; 186 files pass, 4504 checks pass, 14 skip.
- `npm run map`: exit 0.
- `npm run map:check`: exit 0 after regeneration.
- `npm run readme:check`: exit 0.
- `node scripts/requirements-trace.mjs`: exit 0.
- Removed-text grep: obsolete generated map binding-line string has no matches in pack tests (exit 1). No sentence, path or file name removed or renamed.
- `git diff --check`: exit 0.

CI covers the full suite per AGENTS.md. No full-suite fallback, model sessions, pushes, issue operations or credential access. The seat must run CI and Windows verification. No precedent departures.
