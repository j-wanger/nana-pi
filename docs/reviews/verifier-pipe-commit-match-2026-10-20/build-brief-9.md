# verifier-pipe-commit-match — build brief 9

**Builder:** the larger-lane builder (pi sol) in `~/nana-pi-wt/verifier-pipe-commit-match`, on top of the current tip fefbfa4c (build 8 plus the seat's notes). Rules: the builder preamble, but single test files only, never the full suite. No push; no `HANDOFF.md`, `docs/sessions/` or `docs/reviews/` edits. Do not merge main.

## Why
Round 2 on fefbfa4c: both reviewers sent it back. Every finding is a command main asks on that the tip lets through, and every one comes from the same relaxation: reading `set +e` as turning errexit off, scoped by bracket pairing.
- **Final reviewer, M1 (new in build 6):** a pipeline that ends a subshell running `set +e`. `set -e; (set +e; npm test | tail -5); git commit -m x` is null; real bash runs the commit after a masked failure, because outer errexit reads the subshell's status. Same for `set -e; x=$(set +e; npm test | tail -5); git commit -m x`, the backtick form, and `set -e; (cd app; set +e; npm test | tail -5); git commit -m checked`.
- **Land reviewer, MUST:** a `case` pattern's `)` pairs with the enclosing `(`, closing the scope early. `(set -e; case "$OSTYPE" in darwin*) echo preparing;; esac; npm test | tail -5; git commit -m checked)` and `set -e; (case "$OSTYPE" in darwin*) echo preparing;; esac; set +e; true); npm test | tail -5; git commit -m checked` are null.
- **The seat:** `case "$OSTYPE" in darwin*) set -e;; esac; npm test | tail -5; git commit -m checked` is null too: a `set` right after a case pattern is not read as an errexit change.

**The seat's ruling: subtract the relaxation.** On a gate floor, each relaxation has become a bypass. Bash errexit now counts as active at a pipeline when `set -<letters including e>` or `set -o errexit` appears anywhere in the live text before that pipeline starts. `set +e` and `set +o errexit` never turn it off. No scope, no bracket pairing. This can only add asks against round 1's tip, never remove one, and main asks on every pipe before a commit.

## Do, nothing else
1. Replace `bashErrexitStates`' scope walk with that rule: one scan of the live text for an errexit-enabling `set` before each pipeline start, at any command position (start, after a separator, an opener, a brace, `then`, `do`, or a case pattern's `)`). Remove `BASH_ERREXIT_CHANGES`' `+` alternatives if nothing else needs them.
2. Remove build 6's unquoted backtick block in `liveText`: it existed only for the scope walk. Keep build 6's PowerShell changes (status reads live in expandable strings, here-strings and subexpressions) exactly as they are.
3. Rows: rewrite R-2351's errexit clause to say exactly the rule above, and drop the subshell-scope wording. Check R-2350's text still matches its cases; change it only if a case moves.
4. Cases: move "bash set +e disables errexit before pipeline" from R-2350's discarded cases to R-2351's consumed cases, renamed for what it now pins (a later `set +e` does not turn errexit off). Keep "bash set -e after pipeline" null. Keep every build 6 to 8 consumed case; the backtick ones must still ask under the new rule. Add as consumed: the five commands above (M1's four forms, the land reviewer's two, the seat's case-branch `set -e`), plus `(case a in a) echo;; esac; npm test | tail -5) && git commit -m x`. Every other existing case stays green.
5. Show the new consumed cases red on fefbfa4c's `pipe-guard.mjs` and green on yours.
6. Run alone: `npm test -- packages/nana-pack/tests/pipe-guard.test.mjs`, `pipe-guard-pwsh-oracle.test.mjs`, the gate corpus test file, `packages/nana-setup/tests/verifier-pipe.test.mjs`, `install-check.test.mjs`; `node scripts/requirements-trace.mjs`, `npm run -s map`, `npm run -s map:check`, `npm run -s readme:check`. Time `pipe-guard.test.mjs`.
7. Check both READMEs' guard lines still describe the behaviour; change a README only if a sentence became untrue.
8. Commit with explicit paths.

**Report** (6 lines or fewer, VERDICT first): commit; each command's result; the new cases red on fefbfa4c and green now; the test file's time; any README change.
