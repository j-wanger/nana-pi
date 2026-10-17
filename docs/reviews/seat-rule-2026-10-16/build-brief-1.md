# Lane seat-rule — build brief 1 (2026-10-17 · feat/seat-rule)

**Builder: the small-lane builder from the roster.** A closed, mechanical build: every byte is already written in this
folder. Read `CHANGE.md` §2, §3 and §5 first.

1. **The row.** In `REQUIREMENTS.md`, replace R-1140's requirement cell with the text of `r1140.txt`, verbatim. Its
   Evidence cell cites each `// req: R-1140` title of the new test as `packages/nana-setup/tests/seat-rule.test.mjs::<title>`,
   in backticks, the way the other rows cite theirs. Status stays `implemented`.
2. **The test.** Copy `proposed-seat-rule.test.mjs` over `packages/nana-setup/tests/seat-rule.test.mjs`, byte for byte.
   Run it: exactly these four checks fail against today's guide, and you must see them fail before step 3:
   - `seat guide holds no bullet beyond its ten rules`
   - `seat guide carries: at most two lanes building and one in planning, each slot defined`
   - `seat guide carries: name and start independent work before the turn ends, lane steps in order`
   - `seat guide carries: full suite whole, no split beside a full suite, a time-limit failure re-run alone`
3. **The guide.** Copy `nana-seat.proposed.md` over `packages/nana-setup/claude/rules/nana-seat.md`, byte for byte. Run
   the test again: all 12 checks pass.
4. **The code map.** `node scripts/code-map.mjs --write`.

Rules: work only in this worktree; run only `node scripts/test.mjs packages/nana-setup/tests/seat-rule.test.mjs` and the
Done commands, in the foreground; never the full suite. Do not edit anything else, and nothing in this review folder.
Commit with explicit paths, message prefix `seat-rule: `, and push to `origin feat/seat-rule`.

## Done
`node docs/reviews/seat-rule-2026-10-16/acceptance.mjs` → only the HANDOFF/session case misses;
`node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `node scripts/code-map.mjs --check`;
`npm run -s readme:check`. Report in ≤ 12 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`, with the four checks you
saw fail at step 2.
