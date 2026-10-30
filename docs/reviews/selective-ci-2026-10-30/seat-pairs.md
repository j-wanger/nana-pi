# Seat wrong-code pairs — selective-ci, tip 417943ab

Each mutation edits packages/nana-pack/lib/main-ci.mjs; `node --test packages/nana-pack/tests/main-ci.test.mjs` runs after each, then the file is restored.

| Mutation | Test exit | Restored exit |
| --- | --- | --- |
| Drop the push-event filter (a pull-request run counts) | 1 | 0 |
| Never count a finished non-success job (red leg missed) | 1 | 0 |
| Skip the identity-scan refusal (post without scan) | 1 | 0 |
| Skip the same-title check (duplicate issue) | 1 | 0 |

Install check on the tip, seat shell, macOS: every step PASS, including pi post-edit.
