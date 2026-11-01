Feature: FEAT-041 · Shape each agent's context by role

Lane context-anatomy. Class: gate. Builder: pi-worker (small lane). Build session 3, on this branch's tip.

The seat repeated the real review measurement on fed332f6 (item `ca-measure`, round 2): the reviewer's instructions now list only the tree's own `CLAUDE.md` and `AGENTS.md`; no `~/.claude/rules` file; no MCP instructions; first-turn input 28,774 tokens (bar 42,000). The land condition passes. The account email remains, as A2 expected.

Remaining: the pull request conflicts with main, so CI has no run. Merge main (lane memory-making landed at a6dcc99a; it added FEAT-040, R-3188 to R-3209, R-3250, A-088, new pack modules and tests). Resolve conflicts keeping both lanes' rows, artifacts and features; regenerate `docs/requirements-tree.md` and `docs/code-map.md`; update heading-count assertions only to the merged counts. Do not change this lane's behaviour. Re-run the wrong-code pair runner and the macOS install check after the merge.

## Done when

Green on the merged tip: locked full suite (foreground), `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check, `node scripts/identity-scan.mjs`, the pair runner and the install check. Push and report the finished CI run for the new tip, Windows included; rerun a failed Windows job once and say if you did.

## Precedent

- `docs/requirements-tree.md`: regenerated, never hand-edited.
- `docs/code-map.md`: regenerated.
- `packages/nana-pack/tests/requirements-tree.test.mjs`: heading counts.
