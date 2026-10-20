# verifier-pipe-commit-match — build brief 5

**Builder:** the larger-lane builder (pi sol) in `~/nana-pi-wt/verifier-pipe-commit-match`, on top of the current tip (the seat committed its build-4 pairs record, 65/68 red). Rules: the builder preamble, but single test files only, never the full suite. No push; no `HANDOFF.md`, `docs/sessions/` or `docs/reviews/` edits. Do not merge main.

## Why
The independent check on build 4 (c2d0dcb4) found no MUST and closed the three earlier fail-opens in the predicate, the hook and the headless gate. It found two rare fail-opens against main (main asks, the tip returns null). Neither appears in 110,280 unique local Bash commands.

1. **New in build 4: `(set +e …)` turns errexit off for the outer shell.** Accepting `(` before `set` also accepts `+e` and `+o errexit` there, but a subshell's errexit change never reaches the outer shell. `set -e; (set +e; make lint); npm test | tail -5; git commit -m x` is ASK on main and build 3, null on build 4; real bash runs the commit after a masked failure. The `$(set +e …)` and `( set +o errexit …)` forms do the same.
2. **Since build 3: a double-quoted string ending in an escaped backslash breaks quote tracking.** The double-quote close rule does not count an escaped backslash: `echo "a\\"; echo "b\\"; npm test | tail -5 && git commit -m x` is ASK on main, null on builds 3 and 4.

## Do, nothing else
1. After `(` or `$(`, count only `set -e` (letters with e after -) and `set -o errexit` as errexit changes; a `+e` or `+o errexit` there changes nothing for the outer command. Keep `{`, `then`, `do` and the top level as they are (there `set +e` still turns errexit off).
2. A double quote closes a double-quoted string when an even number of backslashes (zero included) comes right before it.
3. Add both example shapes (and the `$(set +e …)` and `( set +o errexit …)` forms) to R-2351's test as asking cases; add `(set -e; …)` stays asking, and `set -e; set +e; npm test | tail -5; git commit -m x` stays null. Keep every existing case green.
4. Run alone: `npm test -- packages/nana-pack/tests/pipe-guard.test.mjs`, `pipe-guard-pwsh-oracle.test.mjs`, the gate corpus test file, `packages/nana-setup/tests/verifier-pipe.test.mjs`, `install-check.test.mjs`; `node scripts/requirements-trace.mjs`, `npm run -s map`, `npm run -s map:check`, `npm run -s readme:check`.
5. Commit with explicit paths.

**Report** (5 lines or fewer, VERDICT first): commit; each command's result; the two shapes red on c2d0dcb4 and green now.
