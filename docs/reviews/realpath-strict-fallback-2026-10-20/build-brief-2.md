# Build brief 2 · realpath-strict-fallback

Feature: FEAT-015 · Diagnose the active environment. Class: install, hook or gate. Same worktree and branch; the tip is `9c16aca1` (the seat merged main `aa5f25cd` into your `dd684f3f`). Threat model unchanged.

## Why a second build

The seat's wrong-code pairs on `9c16aca1` went 5 of 5 red, but one must-meet check does not prove its own row:

1. **R-2180 cannot tell the JavaScript lookup's result from the unresolved path.** Under the wrong version M5 (the fallback returns the unresolved path instead of the JavaScript lookup's result), R-2180 stays green. Its sample path is the test file's own folder, which `import.meta.url` already gives as the real path, so both answers are the same string. The setup checks R-2182 to R-2184 still catch M5, so the product is pinned, but R-2180 alone does not prove what its row says.
2. **The row text differs from the plan.** Build brief 1, step 5, asked for the must-meet's row text. REQUIREMENTS.md rewrote all five rows, and coins "typed realpath" for Node's JavaScript path lookup. Use the must-meet table's row text for R-2180 to R-2184, word for word. Keep each row's evidence pointing at its exact test title.

## Change

1. `packages/nana-pack/tests/real-path.test.mjs`, the R-2180 check only: sample at least one path whose JavaScript lookup result differs from the path as given, for example a path through a link you create in the test's temp folder (on macOS the temp folder itself also resolves differently). Assert that realPath returns exactly the JavaScript lookup's result for that path, for every injected code, with and without `mustExist`, and that this result differs from the input. Keep the check's title unless it no longer describes the check; if you change the title, update the row's evidence to match.
2. `REQUIREMENTS.md`: R-2180 to R-2184 take the must-meet's row text word for word. Then regenerate `docs/requirements-tree.md` with `npm run req:tree` and the code map if `npm run map:check` asks for it.
3. Change no product code.

## Run (single files only; no full suite, no loops of a test file — other lanes land on this machine)

- `node packages/nana-pack/tests/real-path.test.mjs` and `node packages/nana-setup/tests/realpath-fallback.test.mjs`: all green.
- Wrong code to try, restored after each: M5 (in realPath's fallback, return `abs` instead of the JavaScript lookup's result) must now turn R-2180 red; main's catch (rethrow the native error under `mustExist` before the JavaScript lookup) must still turn R-2180 red.
- `node scripts/requirements-trace.mjs`, `npm run map:check`, `npm run readme:check`, `node --experimental-strip-types packages/nana-pack/tests/requirements-tree.test.mjs`: all exit 0.

## Report (10 lines or fewer)

DONE or BLOCKED, the tip SHA, the files changed, and which check each wrong version turned red.
