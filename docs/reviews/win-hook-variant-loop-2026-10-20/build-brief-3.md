# win-hook-variant-loop — build brief 3

**Builder:** the larger-lane builder (pi sol) in `~/nana-pi-wt/win-hook-variant-loop`, on top of the current tip. Rules: the builder preamble, but single test files only, never the full suite. No push; no `HANDOFF.md`, `docs/sessions/` or `docs/reviews/` edits. Do not merge main.

## Why
CI run 39499732915 at da321c9f: macOS and Ubuntu 0 failing; Windows 175 PASS, 1 FAIL. The failure is in the test, not the product. `packages/nana-setup/tests/win32-hook-repair.test.mjs` builds the R-2412 deep-nesting fixture as a 3,000-deep object and `seed()` writes it with `JSON.stringify(settings, null, 2)`. On the Windows runner that call throws `RangeError: Maximum call stack size exceeded` (test line ~63, called from ~271), so the file stops before R-2412's check. Node's stack is smaller there.

## Do, nothing else
1. Write the deep-nesting fixture's settings file as text built without recursion, for example `'{"hooks":{"SessionStart":[{"hooks":[{"owner":' + '{"next":'.repeat(N) + '"leaf"' + '}'.repeat(N) + '}]}]}}'`, through a small helper beside `seed()`. Keep N at 3,000 unless that no longer turns R-2412 red on build 1's code (no try/catch around the merge simulation); show it red there and green on the tip on macOS.
2. Do not call JSON.stringify or structuredClone on the deep value anywhere in the test. Keep every other check unchanged.
3. Run alone: `npm test -- packages/nana-setup/tests/win32-hook-repair.test.mjs`, `settings-merge.test.mjs`, `doctor-detail.test.mjs`; `node scripts/requirements-trace.mjs`, `npm run -s map:check`, `npm run -s readme:check`.
4. Commit with explicit paths.

**Report** (5 lines or fewer, VERDICT first): commit; each command's result; R-2412 red on build 1's code and green now.
