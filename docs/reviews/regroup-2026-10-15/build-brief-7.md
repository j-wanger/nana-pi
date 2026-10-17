# Lane regroup — build brief 7: three test cases (2026-10-16 · feat/regroup)

**Builder: Claude Sonnet 5.** Build 6 (`8d7efe4`) fixed sol's three MUSTs. The seat's mutation runner shows three of its
new checks are not pinned on their own (`seat-mutate.mjs` pairs B6/1, B6/2, B6/7 survive): T70's one refused case both
declares the row in `shares_added` and continues a different heading, so either half of the exemption alone still
refuses it. Add exactly these cases, each red when you break the code it pins (break, see red, restore). No code change
is expected; if a case shows a real defect, fix it and say so. Rules as in brief 6.

1. Under T70 (or a new `// req: R-1187` title): a feature that continues its own old heading and lists in
   `shares_added` a row that heading already shared, with no share verdict, is refused naming the row and the feature.
2. Under T70 (or a new `// req: R-1187` title): a feature that reuses an old feature's ID while its `from` names a
   different heading, carrying a row of the old feature in `also_applies` with no `shares_added` entry and no share
   verdict, is refused naming the row and the feature.
3. Under T68 (or a new `// req: R-1179` title): a move or share target whose own argument holds `<provider>` shows it
   escaped on the page.

Do not change any row's text. Do not touch `CHANGE.md`, the seat's files, `HANDOFF.md` or `docs/sessions/`.

## Done
The touched test file green; `node docs/reviews/regroup-2026-10-15/seat-titles.mjs 1` → `0 missing`;
`node docs/reviews/regroup-2026-10-15/acceptance.mjs > docs/reviews/regroup-2026-10-15/acceptance-output.txt 2>&1` → 0
mismatches; `node scripts/requirements-trace.mjs`. Commit, push. Report in ≤ 12 lines, first line `VERDICT: …`.
