# verifier-pipe-commit-match — build brief 10

**Builder:** the larger-lane builder (pi sol) in `~/nana-pi-wt/verifier-pipe-commit-match`, on top of the current tip 184f8cd7 (build 9). Rules: the builder preamble, but single test files only, never the full suite. No push; no `HANDOFF.md`, `docs/sessions/` or `docs/reviews/` edits. Do not merge main.

## Why
Build 9's rule is right, but its matcher reads only a `set` at command position whose first option word enables errexit. The seat probed build 9: main asks and the tip lets through each of these; real bash runs the commit after a masked failure in each:
- `set -x -e; npm test | tail -5; git commit -m x`
- `set -u -o errexit; npm test | tail -5; git commit -m x`
- `set -o nounset -o errexit; npm test | tail -5; git commit -m x`
- `shopt -s -o errexit; npm test | tail -5; git commit -m x`
- `! set -e; npm test | tail -5; git commit -m x`

They predate build 9 (round 1's matcher had the same first-flag limit), but round 3 is the lane's last, so close them now, fail-safe.

## Do, nothing else
1. Bash errexit counts as active at a pipeline when the live text before that pipeline contains `errexit` anywhere (any case, inside a longer word too, so `-oerrexit` counts), or a `set` word (word boundary before and after, any position) followed within the same simple command (before the next `;`, `&`, `|`, newline or closing bracket) by an option word of `-` and letters including `e`. Extra asks are acceptable; a missed enable is not. `set +e` and `set +o errexit` still never turn it off (a `+o errexit` counts as enabling under this rule, which is fine).
2. Rows: R-2350, R-2351 and R-2356 state the rule in those words. READMEs: change a sentence only if it became untrue.
3. Cases: add the five commands above to R-2351's consumed cases. Keep every existing case green, including "bash set -e after pipeline" (null).
4. Show the five red on 184f8cd7's `pipe-guard.mjs` and green on yours.
5. Run alone: `npm test -- packages/nana-pack/tests/pipe-guard.test.mjs`, `pipe-guard-pwsh-oracle.test.mjs`, the gate corpus test file, `packages/nana-setup/tests/verifier-pipe.test.mjs`, `install-check.test.mjs`; `node scripts/requirements-trace.mjs`, `npm run -s map`, `npm run -s map:check`, `npm run -s readme:check`.
6. Commit with explicit paths.

**Report** (5 lines or fewer, VERDICT first): commit; each command's result; the five red on 184f8cd7 and green now; any README change.
