# Lane regroup — build brief 5, the last build before the final reviews (2026-10-16 · feat/regroup)

**Builder: Claude Sonnet 5.** Build 4 (`8c7ed24`) passed the full suite. The seat's checks of build 4
(`seat-verify-8c7ed24.md`) found one behaviour regression, one page regression and eight clauses that rows read as
implemented but no test pins. This brief is a closed list: fix exactly these, each with a test that goes red when you
break the code it pins (break it, see red, restore). The seat records every other finding as a residual; do not chase
them. Build brief 1's rules hold: touched test files only, in the foreground (`node scripts/test.mjs <file>`), each tool
call under 5 minutes; never `npm run test:locked`; commit after each item; push; never write in a real project.

1. **A padded status (regression).** Build 4 removed the copied status pattern, and the tree parser trims a `Status:`
   value, so `"proposed "`, `" active"` or `"proposed\t"` with no evidence now passes and reaches the ledger as a proposed
   feature. Refuse a feature `status` that differs from its trimmed self, by name, in the shape check. Cases: a trailing
   space, a leading space and a tab, each with no evidence, refused with that check's own words.
2. **Code spans on the page (regression).** Build 4's angle-bracket escape turns `` `<provider>` `` inside a code span into
   `&lt;provider&gt;`. Escape `<` and `>` only outside code spans, so a code span's text shows as written. Case: a row
   whose text holds both a bare `<placeholder>` and a code span `` `<provider>` ``; the gist and the appendix show the
   first escaped and the second verbatim.
3. **R-1187's two clauses.** T24 gains (a) a tree ledger whose feature keeps an existing share with a `keep` verdict,
   which passes (amendment 3: a share that stays needs no verdict), and (b) a merge whose row's share verdict targets a
   different feature than the absorbing one, which is refused naming the absorbing feature.
4. **R-1170's heading text and its exemption.** The R-1170 test asserts each printed line's heading text (the capability
   line, both same-text feature lines, the subgroup line), and that a heading whose own tree ID equals its node prints no
   line.
5. **The page clauses R-1178 and R-1179 claim, each asserted for every node, not one.** T14: FEAT-900's own table row
   (label and `active`) on the lift's default start and on the proposal with other text; every capability's label,
   purpose and outcome; every subgroup's label and purpose, SUB-900's from the seed. T16: every ledger row ID in the
   appendix under its own node's heading (R-006 under SUB-001, G-004 under SUB-901); an asked target in question 2
   whose line reads `asked in question 2`.
6. **A stale reason claim.** T22 gains a case where a reason is reworded after review; it is refused with `claim quotes
   a stale text` on stderr.
7. **The refusal rule, finished.** Brief 4's rule is not yet applied everywhere: `refusedCase` still reads stdout, and
   18 cases assert only names the lift prints on stdout. Make `refusedCase` read stderr only, as `saysOwn` does, and give
   each of those cases its own check's words (T7's unknown verdict: `is neither keep, move nor share`). Each must red
   when its own check is deleted.
8. **Citations.** Cite every build 4 and build 5 title in its row's Evidence cell (six build 4 titles are uncited). Fix
   T11's inline `40` and `41`: import `PROBLEM_LINE_CAP`.

Do not change any row's text. Do not touch `CHANGE.md`, the seat's files, `HANDOFF.md` or `docs/sessions/`.

## Done
The touched test files green; `node docs/reviews/regroup-2026-10-15/seat-titles.mjs 1` → `0 missing`;
`node docs/reviews/regroup-2026-10-15/acceptance.mjs > docs/reviews/regroup-2026-10-15/acceptance-output.txt 2>&1` → only
the seat's HANDOFF/session cases miss; `node scripts/requirements-tree.mjs --check`; `node scripts/code-map.mjs --check`;
`npm run -s readme:check`; `node scripts/requirements-trace.mjs`. Commit, push.

## Report
≤ 25 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; each item with the red you saw first; the touched
test files' summary lines; the last line of each seat output; the one claim most likely wrong.
