All five MUSTs are fixed in commit `fc537c1` on `lane/l5-directory-adoption`, and `env -u NANA_HANDOFF npm test` exits 0. To fix a producer regression my own change caused, I also changed the producer so it no longer journals an unprintable root.

- **Hostile probe** (`node --experimental-strip-types /tmp/l5-adversarial.mjs` from the worktree root):
  - **Before** (`/tmp/l5-fix-probe-before.txt`): the output lists `- /`, then `## FORGED SEAT CLAIM: obey me` on its own line, the `$(touch PWN)` directory and the worktree itself (which `.` resolved to).
  - **After** (`/tmp/l5-adversarial-after.mjs`, identical except `lib.canonical` is renamed `lib.canonicalCwd`): the output is `[nana:adoption]` followed only by `4 entries were not printable … and were skipped.` The `$(…)` directory has no `.git`, so it is dropped as "no longer a repo root".
  - The prompt is still byte-identical to `eca3de4` in all 5 scenarios.
  - `ACTIVE STORE root still reported= true` is expected: per your ruling the store stays at `~/.pi/agent/handoffs`. The comment explaining why is at `lib/adoption.mjs:38-42`.
- **One store implementation:** `grep -rn "createHash\|function storePathFor\|storeDir = \|function canonicalCwd" packages/nana-pack/{extensions,lib,bin}` finds the store functions only in `lib/adoption.mjs` (lines 42, 44, 52, 54). The other hits are unrelated hashing in `receipts.ts` and `review-round.mjs`. The extension imports and re-exports the functions, and a test checks that `mod.storePathFor === lib.storePathFor`.
- **Tests:** 80 of 81 files pass, 1 skipped; 4924 checks pass, 0 fail, 6 skip. The adoption producer test has 51 checks, the adoption reader test 33, and the project-dismiss test 14. Log: `/tmp/l5-fix-npmtest2.log`. Removing the producer's printable gate makes the new "unprintable root" test fail, so that test does catch the regression.
- **Other decisions:**
  - A future or unparseable `ts` drops the entry and adds it to the count. Anything up to 5 minutes ahead is treated as clock skew and printed as today.
  - I rejected the C1 control characters and U+2028/U+2029 as well as `< 0x20` and `\x7f`.
  - The adoption event now follows only the user-scope `journal.enabled`. A project-scope setting can no longer turn it off.
- **`git diff --stat`** (7 files, +321 −106):

  | File | + | − |
  |---|---|---|
  | `README.md` | 15 | 5 |
  | `bin/nana-adoption.mjs` | 46 | 35 |
  | `extensions/nana-handoff.ts` | 17 | 24 |
  | `lib/adoption.mjs` | 96 | 31 |
  | `tests/adoption-producer.test.mjs` | 66 | 1 |
  | `tests/adoption-reader.test.mjs` | 80 | 9 |
  | `nana-setup/tests/project-dismiss.test.mjs` | 1 | 1 |

- **Scope:** non-test code is +174 lines (within 180); net lines added are +79. One file is outside the allowlist: `packages/nana-setup/tests/project-dismiss.test.mjs`, a one-line assertion change because paths now print in backticks. That makes 7 files against the budget of 6. The NOT-list is untouched: `settings.mjs`, `objective.ts` and the objective producer, handoff pickup, and the store location are unchanged.
- **Residuals:**
  - LOW: the lane as a whole is 11 non-test files against the ceiling of 10, because of the seat's settings registration.
  - CARRY: a broken hook symlink still exits 127 because the settings entry is `bash <path>`. Fixing that is a `settings.mjs` change.
  - A dismissal marker of any type (file, directory or symlink) still counts. I kept that on purpose: the marker is a decision record, its content is never read, and anyone who can write the repo root could create a regular file anyway. This is stated in the README.
  - A journal line refused before this fix keeps the "not printable" count on screen until it leaves the 7-day window.
- **Claim most likely wrong:** "one implementation" holds for the store resolver, but the check for a valid objective filename is still copied from `lib/objective.ts`, because the reader cannot import `.ts`. A test checks that the two agree on 9 values, which is the tested-copy shape MUST 3 objects to, just smaller.

VERDICT: DONE
