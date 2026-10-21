# verifier-pipe-commit-match — build brief 12

**Builder:** the larger-lane builder (pi sol) in `~/nana-pi-wt/verifier-pipe-commit-match`, on top of the current tip f0be3c45 (build 11, merges of main 954b8726 and of bcabe3ce, now main, and the seat's notes). Rules: the builder preamble, but single test files only, never the full suite. No push; no `HANDOFF.md`, `docs/sessions/` or `docs/reviews/` edits. Do not merge main.

## Why
Round 3 on f0be3c45: the final reviewer said LAND; the land reviewer sent it back with one MUST, which the seat reproduced. Build 9 removed build 6's unquoted backtick group from `liveText`. Without it, a pipeline that ends just before a closing backtick after a newline or `;` loses the status reader:
- ``summary=`npm test | tail -5`` + newline + `` ` && git commit -m checked``
- ``summary=`npm test | tail -5;` && git commit -m checked``
- ``if x=`npm test | tail -5;`; then git commit -m checked; fi``
Main and round 2's tip ask on all three; the tip returns null. Bash assigns the substitution's status, so a failing test masked by `tail` reaches the commit. The seat put build 6's block back on a scratch copy of the tip: all three ask, and `x=`…`; git commit` and ``echo `date`; …; git commit`` stay null. With errexit now global (build 9), the group carries no errexit scope.

The final reviewer's SHOULD 2: four row clauses have no case pinning them.

## Do, nothing else
1. Put build 6's unquoted backtick block back in `liveText`, unchanged (the block that appends `` ` (${liveText(inner)}) ` `` for a closed unquoted backtick pair, before the quote handling). Change nothing else in the product code.
2. Add the three commands above to R-2351's consumed cases.
3. Pin the four unpinned clauses, one case each: consumed `set -o ERREXIT; npm test | tail -5; git commit -m x` (any case); consumed `echo noerrexitx; npm test | tail -5; git commit -m x` (inside a longer word); consumed `set +o errexit; npm test | tail -5; git commit -m x` (`+o errexit` counts); discarded (null) `set -x; grep -e foo f | head; git commit -m x` (the option search stops at the simple command's end).
4. Show the three backtick cases red on f0be3c45 and green on yours. Show the R-2351 backtick-substitution cases from builds 7 and 8 still green.
5. Run alone: `npm test -- packages/nana-pack/tests/pipe-guard.test.mjs`, `pipe-guard-pwsh-oracle.test.mjs`, the gate corpus test file, `packages/nana-setup/tests/verifier-pipe.test.mjs`; `node scripts/requirements-trace.mjs`, `npm run -s map:check`, `npm run -s readme:check`. Time 64 KB of `a|b;` (`'a|b;'.repeat(16000) + 'git commit -m x'`) on f0be3c45 and on yours.
6. Commit with explicit paths.

**Report** (5 lines or fewer, VERDICT first): commit; each command's result; the three cases red on f0be3c45 and green now; the timing.
