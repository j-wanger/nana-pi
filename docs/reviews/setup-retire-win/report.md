# setup-retire-win build record

## Scope and requirements

- Branch: `feat/setup-retire-win`.
- R-3801 remains unchanged: one canonical unadopted root per day, repeated after 25 hours, with adopted roots omitted.
- Requirement review preceded the test edit. No behavior or requirement diff was needed.
- Only existing M3 expectations changed: first-day journal root, hook output root, next-day journal roots, adopted-root journal filter, and adopted-root hook exclusion.
- Added no tests, tunables, helpers, or production changes.
- Regenerated `docs/code-map.md` for the shifted launch line.

## Precedent

Read `packages/nana-pack/tests/adoption-producer.test.mjs` completely after searching tests for `realpathSync.native`.
It canonicalizes fixture roots with Node's native realpath before comparing journal and reader output.
M3 now canonicalizes expected project roots at the assertion boundary, preserving its original fixture paths and discovery inputs.
This placement differs from canonicalizing the whole fixture because the brief asks to fix expectations and retain M3's remaining assertions.
No helper was copied or introduced.

## Wrong-code pair on macOS

Temporarily replaced the fixture's body call with:

```js
const alias = path.join(base, 'project-alias');
fs.symlinkSync(cwd, alias, 'dir');
try { await body({ base, home, agent, cwd: alias }); }
```

The fixture and symlink lived entirely in the OS temporary directory.
The same existing, awaited, per-case-bounded tests ran for both sides.

- Old expectations: `node scripts/test.mjs --verbose setup-retire.test`, exit 1; M3 failed comparing the canonical `project` journal path with expected `project-alias`. Four other cases passed.
- Fixed expectations, identical injection: same command, exit 0; all five cases passed, including the hook and adopted-root assertions.
- Removed the temporary injection before the final test run.
- Regenerated the map before both recorded pair runs. An earlier unrecorded-map attempt also failed M7 because the injected lines made the map stale; it was not used as mutation evidence.

The pair changes executable fixture code, not assertion polarity. No production mutation was needed for this test-only defect.
Full sanitized output: `docs/reviews/setup-retire-win/evidence.log`.

## Final pre-commit checks

| Command | Exit | Result |
| --- | --- | --- |
| `node scripts/test.mjs setup-retire.test` | 0 | 1 file PASS; 5 checks pass, 0 fail |
| `npm run map:check` | 0 | 0 problems |
| `npm run req:tree` | 0 | Tree valid; generated outline unchanged |
| `npm run readme:check` | 0 | README checks pass |
| `npm run map:impact -- packages/nana-pack/tests/setup-retire.test.mjs` | 0 | 0 transitive callers; 58 transitive callees |

The repository declares CI coverage in `AGENTS.md`; no local full suite ran.
The seat checks will run again on the committed tip and be listed in the worker report.

## Boundaries

Read all of `docs/known-bugs/FEAT-013.md`; this change touches none of its listed bugs.
No production, setup, or hook file changed, so no install check was required.
Windows was not available locally; the macOS symlink pair proves the path-spelling failure, not a native Windows run.
No push, CI lookup, GitHub operation, model launch, or session-archive edit occurred.
No open questions.
