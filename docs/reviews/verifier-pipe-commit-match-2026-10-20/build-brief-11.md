# verifier-pipe-commit-match — build brief 11

**Builder:** the larger-lane builder (pi sol) in `~/nana-pi-wt/verifier-pipe-commit-match`, on top of the current tip e19f5444 (build 10). Rules: the builder preamble, but single test files only, never the full suite. No push; no `HANDOFF.md`, `docs/sessions/` or `docs/reviews/` edits. Do not merge main.

## Why
Build 10's rule is right, but `bashErrexitStates` calls `bashErrexitActive(live.slice(0, pipe))` for every pipe, so the cost is pipes times length. The seat timed `'a|b;'.repeat(16000) + 'git commit -m x'` (64 KB): round 1's tip fe6b7298 and build 9 take 20 ms; build 10 takes 3,489 ms, close to the Claude Code hook's 5 s limit. `'set a|b;'.repeat(8000) + …` takes 4,198 ms. An honest 8 KB script is 10 ms.

## Do, nothing else
1. Compute, once per command, the earliest position at which build 10's rule first holds: the end of the first `errexit` text, or the end of the first errexit-enabling option word of a `set` simple command. Errexit is active at a pipeline exactly when that position is at or before the pipeline's start, the same answer `bashErrexitActive(live.slice(0, pipe))` gives today. No behaviour change: every existing case keeps its result.
2. Time `pipe-guard.test.mjs` and the two 64 KB inputs above on e19f5444 and on yours; report them. Both inputs must take under 100 ms on yours.
3. Run alone: `npm test -- packages/nana-pack/tests/pipe-guard.test.mjs`, `pipe-guard-pwsh-oracle.test.mjs`, the gate corpus test file, `packages/nana-setup/tests/verifier-pipe.test.mjs`; `node scripts/requirements-trace.mjs`, `npm run -s map:check`, `npm run -s readme:check`.
4. Commit with explicit paths.

**Report** (4 lines or fewer, VERDICT first): commit; each command's result; the timings before and after.
