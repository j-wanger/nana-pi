# verifier-pipe-commit-match — build brief 6

**Builder:** the larger-lane builder (pi sol) in `~/nana-pi-wt/verifier-pipe-commit-match`, on top of the current tip fe6b7298. Rules: the builder preamble, but single test files only, never the full suite. No push; no `HANDOFF.md`, `docs/sessions/` or `docs/reviews/` edits. Do not merge main.

## Why
Round 1 on fe6b7298: the final reviewer said LAND; the land reviewer sent it back with two MUSTs. The seat reproduced both through `verifierPipeReason`: main returns a reason, the tip returns null, and the hook and headless gate follow.

1. **An errexit change anywhere inside a subshell still turns outer errexit off.** Build 5 ignored `+e` only when `set` comes right after `(` or `$(`. `set -e; (echo preparing; set +e; true); npm test | tail -5; git commit -m checked` is still null. Real bash keeps outer errexit, so a failed test masked by `tail` reaches the commit.
2. **A PowerShell status read inside a double-quoted string is blanked.** `npm test | Select-Object -Last 5; if ("$?" -eq "True") { git commit -m checked }` is null. PowerShell expands `$?` inside double quotes, so the condition reads the pipeline's status before the commit.

## Do, nothing else
1. In bash, an errexit change (`set ±e`, `set ±o errexit`, combined letters) inside `( … )`, `$( … )`, a backtick substitution or `<( … )`/`>( … )` applies only to pipes inside that group, up to its matching closer; it never changes the state outside it. Use the existing bracket matching. `{ …; }`, `then`, `do` and the top level stay as they are.
2. In PowerShell, a status read that the predicate already counts (`$?`, `${?}`, and `$LASTEXITCODE` after a native last stage) stays live inside a double-quoted string, a double-quoted here-string (`@" … "@`) and a `$( … )` inside either. A backtick-escaped `` `$? ``, a single-quoted string and a `@' … '@` here-string stay literal.
3. Add to R-2351's test as asking cases: both reproductions above; `set -e; $(echo a; set +e); npm test | tail -5; git commit -m x`; `set -e; (true; set +o errexit); npm test | tail -5; git commit -m x`; a `@"` here-string whose body, on its own line, holds `$?` before `git commit`; `"$($?)"`. Add to R-2350's test as null cases: `npm test | Select-Object -Last 5; if ('$?' -eq 'True') { git commit -m x }` and the `` "`$?" `` form. Keep `set -e; set +e; npm test | tail -5; git commit -m x` null and every existing case green.
4. Run alone: `npm test -- packages/nana-pack/tests/pipe-guard.test.mjs`, `pipe-guard-pwsh-oracle.test.mjs`, the gate corpus test file, `packages/nana-setup/tests/verifier-pipe.test.mjs`, `install-check.test.mjs`; `node scripts/requirements-trace.mjs`, `npm run -s map`, `npm run -s map:check`, `npm run -s readme:check`.
5. Time `pipe-guard.test.mjs` before and after; report both. Do not try to fix the crafted-input slowdowns the final reviewer listed; the seat carries them as residuals.
6. Commit with explicit paths.

**Report** (5 lines or fewer, VERDICT first): commit; each command's result; the two reproductions null on fe6b7298 and asking now; the test file's time before and after.
