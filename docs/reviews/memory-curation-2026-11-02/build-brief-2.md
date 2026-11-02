Feature: FEAT-040 · Make and keep memory

Lane memory-curation. Class: ordinary. Builder: pi-worker (small lane). Build session 2, on branch tip after build 1. CI failed on all three systems in `packages/nana-pack/tests/requirements-tree.test.mjs`: R-288 ("all real headings have non-empty purposes 77 headings") and R-1158 (CRLF ledger) read the real ledger, whose heading count this lane's new SUB-027 heading changed. Fix those checks so they hold for the real ledger as this lane leaves it, the way the precedent below did for its own new heading. Change nothing else.

## Precedent

- `packages/nana-pack/tests/requirements-tree.test.mjs`

Report each departure.

## Build

Read why each check fails (`node packages/nana-pack/tests/requirements-tree.test.mjs`), then make the smallest change that keeps each check meaningful: a pinned count follows the real ledger; a missing Purpose line for a new heading is added in `REQUIREMENTS.md`, not waived. Regenerate the tree if `REQUIREMENTS.md` changes.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

Green, run locally: `node packages/nana-pack/tests/requirements-tree.test.mjs`, every test file build 1 touched, the requirements trace, the tree check, the known-bugs check, and `node scripts/identity-scan.mjs --root .` after `git add`. Do not run the locked full suite; CI is the suite. Push and stop.
