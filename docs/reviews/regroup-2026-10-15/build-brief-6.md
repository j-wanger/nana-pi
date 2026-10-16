# Lane regroup — build brief 6, after the final review round 1 (2026-10-16 · feat/regroup)

**Builder: Claude Sonnet 5.** sol's final review (`sol-r1.md`) sent the lane back with three MUSTs; astra
(`astra-r1.md`) said LAND with two of the same points as SHOULDs. A closed list: fix exactly these, each with a test that
goes red when you break the code it pins (break, see red, restore). Read seat amendment 4 at the end of `CHANGE.md`.
Build brief 1's rules hold: touched test files only, in the foreground (`node scripts/test.mjs <file>`), each tool call
under 5 minutes; never `npm run test:locked`; commit after each item; push; never write in a real project. Refusal
cases read the check's own words from stderr only.

1. **R-1187 as amendment 4 words it.** Reword the row with amendment 4's text verbatim and change the check: every row in
   a feature's `shares_added` or `shares_dropped` needs a share verdict targeting that feature; a row in `also_applies`
   is exempt only when the input ledger's feature of the same ID shared it and this feature's own or its subgroups'
   `from` names that input feature's heading. T24 gains the reused-ID case (refused without a verdict, passing with one)
   and keeps every case it has.
2. **Evidence through a link stays inside the root (R-1174).** For an evidence path that exists, compare its real path
   (links followed) with the root's real path; a path whose real location leaves the root is refused, named, like `..`.
   Case: a symlink inside the root pointing at a folder outside it, with an evidence path through it.
3. **No proposal text vanishes from the rendered page (R-1178, R-1179).** Apply the code-span-aware angle-bracket escape
   to every piece of proposal text the page prints — labels, purposes, outcomes, reasons, target arguments, refutation
   reasons, questions, recommendations, claim reasons — not only the gists and the appendix. Case: a purpose and a reason
   holding `<provider>`, each shown escaped, and a code span holding `<provider>` shown as written.
4. **Pin FEAT-900's own status cell (mutation survivor B5/7).** T14 asserts the FEAT-900 table row itself, label and
   `active`, by its row, on both proposals.

Do not change any row's text except R-1187 (amendment 4, verbatim). Do not touch `CHANGE.md`, the seat's files,
`HANDOFF.md` or `docs/sessions/`.

## Done
The touched test files green; `node docs/reviews/regroup-2026-10-15/seat-titles.mjs 1` → `0 missing`;
`node docs/reviews/regroup-2026-10-15/acceptance.mjs > docs/reviews/regroup-2026-10-15/acceptance-output.txt 2>&1` → 0
mismatches; `node scripts/requirements-tree.mjs --check`; `node scripts/code-map.mjs --check`; `npm run -s readme:check`;
`node scripts/requirements-trace.mjs`. Commit, push.

## Report
≤ 20 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; each item with the red you saw first; the touched
test files' summary lines; the last line of each seat output; the one claim most likely wrong.
