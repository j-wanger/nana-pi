# Brief 2: load-log, a Windows CI fix

Feature: FEAT-041 · Shape each agent's context by role

CI on tip 91f279dc failed only on suite (windows-latest), in one test:

FAIL R-3729: pi review logs the child checkout context and land or reviewer slot.
packages/nana-pack/tests/context-anatomy.test.mjs:357. The actual cwd is `C:\Users\runneradmin\AppData\Local\Temp\…\nana-review-8656-Xfp62k`, while the expected value is `C:\Users\RUNNER~1\AppData\Local\Temp\…\nana-review-8656-Xfp62k`.

The code logs the real (long) path of the child checkout, as intended. The test builds its expectation from the 8.3 short temp path. Fix the test's expectation to compare canonical paths (the repo's real-path helper), not the code. Check the other new R-3726 to R-3732 assertions for the same short-vs-long pattern, and fix any you find the same way. Change no behaviour.

## Precedent
- `packages/nana-pack/lib/real-path.mjs` — the canonical-path function the review tools compare folders by.
- `packages/nana-pack/tests/context-anatomy.test.mjs` — the failing assertion at line 357.

Report: the tip, the touched tests run, and each assertion changed.
