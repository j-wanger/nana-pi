Feature: FEAT-045 · Test which builder context changes builds

Lane builder-drop. Class: ordinary. Builder: pi-worker (small lane). Build session 3, on tip e9808a5a. Two fixes only.

1. `packages/nana-pack/tests/requirements-tree.test.mjs` R-288 and R-1158 pin the real ledger's heading count at 76; this lane's FEAT-045 heading makes 77, so both fail. Update both pins to the real ledger's count as this lane leaves it, as lane memory-curation's build 2 did for its own heading.
2. The brief authorizes this one archive edit: move this lane's session entry from `docs/sessions/2026-11-02-builder-drop.md` into `docs/sessions/2026-10.md` as one entry, newest first (that file holds November entries today), and delete the new file.

## Precedent

- `packages/nana-pack/tests/requirements-tree.test.mjs`
- `docs/sessions/2026-10.md`

Report each departure.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

Green, run locally: `node packages/nana-pack/tests/requirements-tree.test.mjs`, `nana-writing` on the moved entry, the tree check, the known-bugs check, `npm run readme:check`, and `node scripts/identity-scan.mjs --root .` after `git add`. Push and stop.
