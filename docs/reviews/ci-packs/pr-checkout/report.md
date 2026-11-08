# PR-checkout repair evidence

## Change

- `packages/nana-pack/tests/test-packs-ci.test.mjs`: M8 resolves `main^{commit}`, then `origin/main^{commit}`, using the existing bounded `git` helper from `pack-fixtures.mjs`. Neither resolving produces a clear fetch instruction.
- Existing test edit: only M8's committed-inventory base resolution changed. Its title, assertions and `R-3857` marker remain unchanged.
- Requirements: R-3857 remains unchanged; this repairs test portability, not the product contract. No new rows, tests, tunables or test files.
- `docs/known-bugs/FEAT-031.md`: added only review 3's setup-tail coverage SHOULD. It remains open; no existing known-bug line was removed or changed. The complete file was read.
- No Precedent section was supplied for this fix card. No helper was copied or moved; no caller contract changed.

## Wrong-code pair

The existing local-main-only implementation failed in a detached temporary checkout containing only the two remote-tracking refs: exit 1, 3 checks passed, M8 failed with `fatal: Not a valid object name main` (`wrong-code.log`). The repaired source in that same checkout passed: exit 0, 4 checks passed (`remote-only.log`). Assertions were never inverted.

Deleting `refs/remotes/origin/main` from the temporary checkout made the repaired check fail with its explicit missing-base instruction: exit 1 (`no-base.log`). These were manual checkout probes, not new suite tests.

## Checkout reproduction command

Run from the lane worktree after committing; fetch locally, without credentials or network access:

```sh
source_repo=$PWD
tip=$(git rev-parse HEAD)
scratch=$(mktemp -d "${TMPDIR:-/tmp}/ci-packs-pr.XXXXXX")
git -C "$scratch" init -q
git -C "$scratch" fetch -q "$source_repo" \
  main:refs/remotes/origin/main \
  feat/ci-packs:refs/remotes/origin/feat/ci-packs
git -C "$scratch" checkout -q --detach "$tip"
git -C "$scratch" for-each-ref --format='%(refname)'
(cd "$scratch"; node scripts/test.mjs test-packs-ci)
```

The final committed tip's fresh checkout result and SHA are reported by the builder after committing. Before commit, the same checkout shape with repaired source passed all 4 checks.

## Green precommit checks

| Command | Exit | Result | Log |
| --- | --- | --- | --- |
| `node scripts/test.mjs test-packs-ci test-packs` | 0 | 4 files; 12 passed checks | `checks.log` |
| `npm test -- --pack=land --jobs=4` | 0 | 71 files; 2413 passed checks, 6 skipped | `land.log` |
| `npm run map:check` | 0 | 544 modules; 0 problems | `map.log` |
| `npm run readme:check` | 0 | 787 claims; 0 problems | `readme.log` |
| `node scripts/requirements-trace.mjs` | 0 | 2710 rows; 2020 traced; 0 off-form rows | `trace.log` |

`npm run map:impact -- packages/nana-pack/tests/test-packs-ci.test.mjs` exited 0 before editing. A literal search of tests for the removed local-main-only statement returned no matches (exit 1). No path or file was removed or renamed.

## Not done

No push, CI inspection, GitHub issue action or native Windows run. CI covers the full suite under AGENTS.md; the required land pack ran locally. The recorded setup-tail coverage limitation is not fixed by this repair.
