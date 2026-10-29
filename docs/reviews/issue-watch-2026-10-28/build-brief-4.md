Feature: FEAT-002 · Resume decisions and next actions

Lane issue-watch. Class: hook. Builder: pi-worker (small lane). Build session 4.

Work in the lane worktree on feat/issue-watch at 5c8ed954. One fix.

1. **The Windows CI suite fails one test.** CI run 40789387311, windows-latest: `FAIL R-2992: real opted-in command keeps polling prints an owner answer and ends with restart` with `ERR_UNSUPPORTED_ESM_URL_SCHEME`. The test passes an absolute path to `node --import` (`packages/nana-pack/tests/issue-watch.test.mjs:162`); on Windows that must be a `file:` URL. Pass `pathToFileURL(preload).href`. Search the lane's other tests for the same pattern and fix each.

Run the locked full suite as a plain foreground command with its output on screen, not redirected to a file and not in the background.

## Done when

The locked full suite (`npm run test:locked`), `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs` are green.

Report: each line you changed; every existing test you changed.

## Precedent

- `packages/nana-pack/tests/issue-watch.test.mjs:162`: the failing spawn.
- `packages/nana-pack/tests/`: grep `pathToFileURL` for the repo's existing Windows-safe form.
