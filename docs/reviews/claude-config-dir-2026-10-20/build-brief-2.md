# claude-config-dir — build brief 2

**Builder:** the larger-lane builder (pi sol) in `~/nana-pi-wt/claude-config-dir`, on top of the current tip (the seat committed its pairs record after build 1). Rules: the builder preamble, but single test files only, never the full suite (other builders share this machine). No push; no `HANDOFF.md`, `docs/sessions/` or `docs/reviews/` edits. Do not merge main; the seat merges it before the final review.

## Why
The seat's pairs on build 1 (`seat-mutate-output-58fe4374.txt`): 16 of 18 red. P4 survives: dropping the guard that skips the variable when `--claude-home` or `--home` is given changes nothing for an absolute value, but with a relative value it would make install refuse (exit 2) even though a flag names the folder, breaking R-2392. R-2392's check sets only an absolute value. P8 (an absolute value's trailing separator kept) is equivalent for every consumer, because each joins paths with `path.join`; the seat records it as declared.

The independent check (HOLDS) found one wrong text (F2): the seeded shared-memory index still says it "Lives at ~/.claude/nana-memory/shared" when CLAUDE_CONFIG_DIR moves it.

## Do, nothing else
1. Extend R-2392's check (title and row unchanged): with `CLAUDE_CONFIG_DIR=rel-claude` (relative) plus `--claude-home <abs>`, and again plus `--home <abs>`, install exits 0 and writes to the folder the flag names, and the banner's claude home line names the flag as its source. Show it red under P4's wrong code from `docs/reviews/claude-config-dir-2026-10-20/seat-mutate.mjs` (read it, do not edit it), green on the tip.
2. F2: the seeded shared-memory index names the folder it actually lives in (the resolved Claude folder), not a hard-coded `~/.claude`. Keep the seed's wording otherwise; if a test pins the seed text, update only the folder part and say which.
3. Run alone: `npm test -- packages/nana-setup/tests/claude-config-dir.test.mjs`, `shared-memory-hook.test.mjs`, `install.test.mjs`; `node scripts/requirements-trace.mjs`, `npm run -s map`, `npm run -s map:check`, `npm run -s readme:check`.
4. Commit with explicit paths.

**Report** (5 lines or fewer, VERDICT first): commit; each command's result; P4's red-then-green.
