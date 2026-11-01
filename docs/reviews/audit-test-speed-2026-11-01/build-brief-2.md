Feature: FEAT-039 · See the product and its decisions in one report

Lane audit-test-speed. Class: ordinary. Builder: pi-worker (small lane). Build session 2. The final reviewer said LAND; main has since moved to 6c4b5363 (lane watcher-clock landed: `packages/nana-pack/lib/lane-watcher.mjs`, its test, and a session entry).

## Precedent

- `docs/sessions/2026-10.md`
- `packages/nana-pack/tests/component-audit.test.mjs`

Report each departure.

## Build

Merge `origin/main` into `feat/audit-test-speed`. Keep both 2026-11-01 session entries whole, each byte for byte as on its branch, this lane's entry directly above the newest entry main already has; you may edit `docs/sessions/2026-10.md` only as the merge requires. Change no code. Renumber nothing. Regenerate maps and update heading counts only if the merge requires it.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

Green: locked full suite in the foreground (`npm run test:locked`), `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check and `node scripts/identity-scan.mjs --root .`. Push and report the finished CI run for the new tip, including the Windows suite leg.
