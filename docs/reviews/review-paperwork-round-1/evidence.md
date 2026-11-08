# Round 1 repair evidence

## Closures

- Restored `REVIEW_ROUND_CAP` and `roundCapVerdict` as deprecated pure exports beside `roundFromOutPath`. Their comments state that nana-pi does not use them. No admission cap was restored.
- Fixed the existing subcommand-rejection case: `review-ledger reports` named a removed package bin, so the judge skipped it. `pi-review reports` names a declared bin and still proves rejection.
- Removed the movement-report description from the shared requirements organization text. Removed the retired option from both requested module input headers.

## Requirements and tests

- Updated existing R-730 before tests and code. No new row IDs or sealed tunables were introduced; the restored constant retains its legacy value.
- Added one named-import compatibility check to `packages/nana-pack/tests/review-round.test.mjs`. It imports all three forwarder names together and pins the legacy value and pure verdict behavior.
- Edited one existing assertion in `packages/nana-pack/tests/skill-claims.test.mjs`, changing only the command named by its input. No tests were removed.
- Wrong code first: the new compatibility check failed with exit 1 because the module lacked `REVIEW_ROUND_CAP`; restoration passed with exit 0. This is the missing-export mutation pair.
- The unchanged skill-claims case failed with exit 1 on the removed bin; the corrected fixture passed with exit 0.
- No fixtures or async cases were added. Existing temporary fixture handling remains unchanged.

## Commands

All commands ran from the lane worktree. Companion logs contain full successful output.

| Command | Exit | Result |
| --- | --- | --- |
| `node packages/nana-pack/tests/review-round.test.mjs` | 0 | compatibility and pure-rule checks pass |
| `node packages/nana-pack/tests/skill-claims.test.mjs` | 0 | all claim checks pass |
| `node scripts/test.mjs test-runner` | 0 | 2 files, 64 checks pass |
| `node scripts/test.mjs review-paperwork requirements-trace` | 0 | 2 files, 71 checks pass |
| `node scripts/code-map.mjs --write` | 0 | regenerated map |
| `node scripts/code-map.mjs --check` | 0 | map current |
| `node scripts/readme-check.mjs` | 0 | README checks pass |
| `node scripts/requirements-tree.mjs --root .` | 0 | tree checks pass |
| `git diff --check` | 0 | no whitespace errors |

## Scope

- Branch: `feat/review-paperwork`.
- Caller search found no runtime callers of the two restored exports in nana-pi. No callers needed changes; only the compatibility test imports them.
- Fix card names no Precedent section. Restored the original helper implementation in its original module; no helper was copied elsewhere.
- Read the full FEAT-007 known-bug file. No listed known bug was changed by this repair.
- Left the Windows leak-scan M4 intermittent failure untouched.
- CI covers the full suite under AGENTS.md. No full local suite, Windows execution, CI lookup, push, sibling-repository change or issue action was performed.
