# Lane runtime-map — build brief 3 (2026-10-17 · feat/runtime-map · tip 804c7c8)

Builder: Claude Sonnet 5, the same builder. Final review round 1: astra LAND, sol SEND-BACK with three MUSTs under the
feature-first bar (`sol-r1.md`, `astra-r1.md` in this folder). Fix exactly these; nothing else changes.

1. **MM2 passes with the feature removed** (sol 1). `runtime-map.test.mjs:102-107` uses only passing fixtures and checks
   only that seconds are numbers; with every runner record forced to `{ label: "PASS", seconds: 0 }` all checks pass.
   Make MM2's fixture include a failing test file, and assert its recorded label is FAIL and the passing file's PASS,
   and that a test file that sleeps a known minimum records seconds at or above it (a lower bound only, no upper bound).
2. **MM9 never runs the impact command** (sol 2). `runtime-map.test.mjs:391-396` calls `dataPath` and `loadRuntime`
   directly; a wrong default path in the impact CLI passes. Make MM9 run the real impact command
   (`scripts/code-map.mjs` impact, as `npm run map:impact` does) from the fixture's main checkout with no override, and
   assert it prints the measured test line for a file the fixture's test ran.
3. **Deleting a tracked file crashes impact** (sol 3, astra SHOULD 1). `packages/nana-pack/lib/runtime-map.mjs:81` (and
   the hashing it backs, `scripts/code-map.mjs:78`) hash every indexed path without handling a missing working-tree
   file, so an unstaged deletion makes `map:impact` exit 1 with ENOENT. A missing tracked file must count as changed, so
   the section reads stale (R-1274). Add that case to MM5: delete a tracked file without staging it; impact exits with
   the generator's code and marks the section stale.
4. **Ordering** (astra SHOULD 2, same test, cheap): give MM3's fixture entries in reverse of the expected order, so a
   missing sort fails the check.

Rules as brief 1 (touched test files only, foreground, under 5 minutes a call, never the full suite or `map:measure`).
Done: both runtime-map test files green; `seat-titles.mjs 1` → `0 missing`; the trace and map checks. Commit with
explicit paths, push. Report ≤ 10 lines, including for items 1 and 2 the wrong code you ran to see the check fail.
