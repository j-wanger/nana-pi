VERDICT: DONE

## Scope and files

- `packages/nana-pack/lib/brief-precedent.mjs`: choose the first whitespace token from a selected code span. Normalize the bare first token before deciding path shape, using the same private normalization helper as the selected value.
- `REQUIREMENTS.md`: amend R-3716's former inner-space promise and clarify R-3718's compatibility shapes. No new rows.
- `packages/nana-pack/tests/brief-check.test.mjs`: M1/R-3716's inner-space fixture now tracks and selects `space`, not `space name.mjs`. M3/R-3718 adds two literal historical fixtures: a leading span containing several line references, and a bare suffixed subject followed by a code span. No other existing tests changed; no new test declarations.
- `docs/reviews/precedent-line-parse-2026-11-02/corpus.mjs` and `corpus.txt`: count outcome changes by direction overall and within each kind. Classify bare subjects from main's normalized chosen value so a line suffix does not misclassify a bare path as prose. List every changed outcome as before; fail on any accepted-to-refused change.
- `docs/code-map.md`: regenerate the literal fixture's detected edge to `scripts/ci-records.mjs`.
- `plan.md`: append the authorized build-3 correction and unsupported-space residual.
- `build-3-red.txt`, `build-3-mutation.txt`, `build-3-checks.txt`, `build-3-map.txt`: command output evidence.

## Mutation pairs

1. Existing build-2 code (whole span; raw bare-token shape): `node packages/nana-pack/tests/brief-check.test.mjs` exited 1. R-3716 and R-3718 failed. The first new M3 fixture catches the whole-span regression. First-token selection restores green.
2. Correct span selection with CODE mutated to `const normalizedFirst = first`: the same command exited 1, with R-3718 failing on the bare suffix fixture. Restoring normalization restores exit 0. Assertions were never inverted.

The M1 loop retains CRLF, trailing space/tab and no-final-newline cases. Child processes have per-case limits; these additions introduce no async cases or repository-writing fixtures.

## Corpus

`node docs/reviews/precedent-line-parse-2026-11-02/corpus.mjs` exited 0.

372 sections; 2,561 bullets. Accepted to refused: **0**. Refused to accepted: **85**.

| Kind | Bullets | Accepted to refused | Refused to accepted |
| --- | ---: | ---: | ---: |
| backticked-first | 1,444 | 0 | 0 |
| bare-path-first | 902 | 0 | 0 |
| prose-with-span | 182 | 0 | 85 |
| bare-word | 30 | 0 | 0 |
| none | 3 | 0 | 0 |

All 85 newly accepted bullets remain listed in `corpus.txt`.

## Commands and exit codes

Tests ran one file at a time on Windows:

- `node packages/nana-pack/tests/brief-check.test.mjs`: 0 after fixes, and 0 after restoring the mutation.
- `node packages/nana-pack/tests/worker-lane.test.mjs`: 0.
- `node packages/nana-pack/tests/planner-prompt.test.mjs`: 0.
- `node packages/nana-pack/tests/test-runner.test.mjs`: 0.
- `node packages/nana-pack/tests/context-anatomy.test.mjs`: 0 (known-bug-digest coverage).
- `node apps/bench/test/anatomy.test.mjs`: 0.
- `node apps/bench/test/anatomy-labels.test.mjs`: 0.
- `node apps/bench/test/anatomy-seat.test.mjs`: 0.
- `npm run map:impact -- packages/nana-pack/lib/brief-precedent.mjs`: 0.
- `npm run map:check`: initially 1 (new literal fixture edge); `npm run map`: 0; repeated `npm run map:check`: 0.
- `npm run readme:check`: 0.
- `node scripts/requirements-trace.mjs`: 0.
- `node scripts/requirements-tree.mjs --check`: 0.
- `node scripts/known-bugs.mjs --root .`: 0.

Identity scan runs after staging. Required checks are repeated on the committed tip, with their exit codes and full SHA in the final report.

## Departures, residuals and omissions

- Authorized departure from Revision 2: code spans no longer preserve inner-space paths. Such paths are unsupported; only the first token is selected. Recorded in the plan, not the known-bug file.
- No helper exports, copies or moves. Existing normalization was factored privately within its own module for both call sites.
- No existing known-bug line was fixed. The tracked-folder/no-span hole, path case rule and unchecked line-number bounds remain unchanged. Read the full FEAT-006 known-bug file before this report.
- Full suite delegated to CI under `AGENTS.md`; no local full-suite run, push or CI read.
- No edits to HANDOFF, known-bug files, session archives, unrelated seat files or GitHub issues.
- Installed rulings remain stale; owner refresh needed. No setup changes made.

Branch: `feat/precedent-line-parse`. Commit uses explicit paths and a message file under `$TMPDIR`. Seat-owned untracked briefs and notes remain uncommitted, except the plan explicitly amended by this brief.
