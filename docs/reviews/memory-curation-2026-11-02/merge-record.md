# Memory curation — main merge

## Scope

Merge `origin/main` at `5e7b779ba85eed00892c1c0963ee8af1d6d85350` into the lane at `28d06fecb7501e5df96d2efec4a5d66f0e252729` (which contains build tip `fe2a8849`). No behavior changes, requirement changes or new tests.

Rows R-3560–R-3577, SUB-027 and artifact A-100 remain unchanged. Production modules and memory tests match the pre-merge lane byte-for-byte. The requirement diff remains exactly this lane's existing rows and artifact declarations.

## Resolution and preservation

- Took `origin/main`'s `packages/nana-pack/tests/requirements-tree.test.mjs` whole. Dropped this lane's heading-count pins; main's derived R-288/R-1158 checks pass with SUB-027. This is the only existing test edited by the merge resolution.
- Regenerated `docs/code-map.md` with `npm run map` and `docs/requirements-tree.md` with `npm run req:tree`; both generators exited 0.
- Kept every session entry from both parents whole, ordered newest first. Main's November 3 entry precedes the November 2 entries; the lane's November 2 entry remains before November 1.
- All unrelated files equal origin/main, including main's deleted lines. `merge-preservation.txt` records the byte comparisons and entry comparisons.
- Known-bug files equal origin/main. No lane-specific known-bug lines existed in the branch-only diff. In particular, the stale ruling-order line that main deleted was not restored. No known bug was fixed or widened by this merge.

Files relative to main remain this lane's AGENTS/README/package command declarations, requirements, generated maps, memory modules and tests, session entry and review folder. The heading test has no diff relative to main.

## Verification

Each command ran independently; each exit was 0. Full output is committed beside this record.

| Command | Output |
|---|---|
| `node packages/nana-pack/tests/memory-curation.test.mjs` | merge-curation.txt; 17 PASS |
| `node packages/nana-pack/tests/memory-making.test.mjs` | merge-making.txt; 25 PASS |
| `node packages/nana-pack/tests/requirements-tree.test.mjs` | merge-tree-test.txt |
| `node packages/nana-pack/tests/test-runner.test.mjs` | merge-test-runner.txt |
| `npm run map:check` | merge-map-check.txt |
| `npm run readme:check` | merge-readme-check.txt |
| `node scripts/requirements-trace.mjs` | merge-trace.txt; 2207 implemented rows traced, 0 off-form |
| `node scripts/requirements-tree.mjs --check` | merge-tree-check.txt; 0 problems, 2464 rows, 43 features |
| `node scripts/known-bugs.mjs --root .` | merge-known-bugs.txt |
| `node scripts/identity-scan.mjs --root .` | merge-identity.txt |
| `node scripts/lane-class.mjs --root . --files <lane paths>` | merge-lane-class.txt; ordinary |
| preservation comparisons | merge-preservation.txt; no unrelated tracked differences |
| `git diff --check` | no output |

The checks named in the brief will run again on the merge commit before a plain push. Post-commit verification output stays in OS temporary storage so the verified tip does not change.

## Precedent and tests

Followed the session archive's whole-entry, newest-first pattern and main's complete derived heading checks. No precedent departure. No helper added or copied. No new tests or sealed tunables, so no new wrong-code mutation pairs apply. Earlier build pairs remain in `build-record.md`; this merge does not claim to rerun them.

## Not done

No full suite: CI covers it, as required by this brief. No CI inspection or waiting. No real memory store, paid model, subagent, GitHub issue, hook/setup change, install run, or Windows machine run. No writes to the two prohibited reference directories. Review and land remain seat work.
