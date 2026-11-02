Feature: FEAT-006 · Launch builders with execution limits

Lane credential-gate-variants. Class: gate. Builder: pi-worker (small lane). Build session 2, on tip a0518213. Every reviewer said LAND (Opus, the land reviewer, and the independent check PASS), and builder-credential-strip has landed on main (a66c0602). Opus raised one SHOULD this build fixes, because it is a regression from main.

## Precedent

- `packages/nana-pack/extensions/nana-gate.ts` (around lines 152-153, the whitespace placeholder)
- `packages/nana-pack/tests/credential-gate.test.mjs`
- `docs/sessions/2026-10.md`

Report each departure.

## Build

1. Merge `origin/main` into `feat/credential-gate-variants`. Every file this lane did not set out to change ends identical to `origin/main`; regenerate `docs/code-map.md` and `docs/requirements-tree.md` with their generators.
2. Fix the SHOULD: the placeholder also seals the command word, so a quoted command string is no longer matched. On main these are refused for worker and reviewer and on this tip they are allowed: `powershell "gh auth token"`, `powershell -NoProfile "gh auth token"`, `powershell -NoProfile "git credential fill"`, `pwsh -NoProfile "gh auth token"`. Make all four refused again for worker and reviewer, without losing any variant this lane added or allowing any near miss it keeps (`--get`, `getx`, `erase`, `store`, `exit`, `config --get`, plain `gh auth status`); the seat (no role) is never blocked. Add the four as gate-corpus or credential-gate cases.
3. Record one wrong-code pair: the tip's sealing fails the new cases.

Change nothing else. Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

Green, run locally: `credential-gate`, `credential-strip`, `gate-survives-mutation`, the gate corpus test, `test-runner`, `context-anatomy`, `config-gate-fallback`, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check, and `node scripts/identity-scan.mjs --root .` after `git add`. Re-run `seat-mutate.mjs` in this folder; every pair stays red. Do not run the locked full suite; CI is the suite. Commit and stop; do not push (the seat pushes).
