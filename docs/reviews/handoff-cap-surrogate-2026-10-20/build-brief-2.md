# Build brief 2 · handoff-cap-surrogate

Feature: FEAT-002 · Resume decisions and next actions. Class: hook (pi extension). Same builder, same worktree and branch. Threat model unchanged.

## Why a second build

The seat's wrong-code pairs on `4f686738` went 9 of 10 red. One survived, and it is a regression this lane caused in the seal on R-189:

- **M4: `INJECT_CAP` retuned from 8000 to 8001 passes every check.** The R-189 sealing check's body is a 12-unit prefix followed by 4500 emoji, so unit 8000 of that body is a high surrogate. With the cap at 8001, `head(body, 8001)` steps back one unit and returns exactly `body.slice(0, 8000)`, so R-189 stays green. On main the raw `slice(0, 8001)` returned 8001 units and turned R-189 red. A retune to 7999 or 8002 is still caught; only +1 slips through.
- The coding standard says a sealed value is pinned by one test naming its row, so retuning it fails naming the row. The seal must catch every retune again.

## Change

1. `packages/nana-pack/tests/handoff-artifact.test.mjs`, the existing R-189 check only: make the sealing check also catch a +1 retune. Use a body where unit 8000 is not part of a surrogate pair, for example an all-ASCII body longer than 8000 units whose injected cut must equal exactly its first 8000 units, written with the literal `8000` (this is the one sealing test, so the literal stays here). Keep the existing emoji body's assertion as it is. Keep the check's title and its `// req: R-189` marker unchanged, so the title stays the row's evidence. Add no new requirement row and no new test call: fold the extra body into the same check (the same `check(...)` call with both conditions, or one fixture run per body under the one title).
2. Change no product code. Do not touch R-2160's check.

## Run (single files only, never the full suite; no loops of a test file)

- `node --experimental-strip-types packages/nana-pack/tests/handoff-artifact.test.mjs`: all green.
- Wrong code to try, in a temp copy or restored after each: `INJECT_CAP = 8001` must turn the R-189 check red; `INJECT_CAP = 7999` must turn it red; the cut reverted to `h.body.slice(0, INJECT_CAP)` must still turn R-2160 red.
- `node scripts/requirements-trace.mjs`, `npm run map:check`, `npm run readme:check`, and `node --experimental-strip-types packages/nana-pack/tests/requirements-tree.test.mjs` all exit 0.

## Report (10 lines or fewer)

DONE or BLOCKED, the tip SHA, the files changed, and which check each wrong version turned red.
