# Lane tree — build brief 2 (2026-10-14 · feat/tree · tip be19808)

**Builder: Claude Sonnet 5** (the `sonnet` model). Build 1 passed the seat's checks: acceptance 177/180 (the three
seat items aside), titles 0 missing, template acceptance green, the seat's mutation runner 31/31 red with none
surviving. An independent check and the runner found the gaps below. Build brief 1's rules all hold.

## 0. Merge main first
Main is now `99a4103`: lane seat-guide landed (R-1140–R-1142 under SUB-019 and FEAT-006, R-301 reworded, a pointer line
in the shared section, HANDOFF and session entries). `git merge origin/main` (fetch first). Expected conflicts:
`REQUIREMENTS.md` (keep both lanes' rows, each where its plan put it), `templates-render.test.mjs` (keep both blocks),
R-291's literal (main's total + 12 = 1,128), `docs/requirements-tree.md` and `docs/code-map.md` (regenerate, never
hand-merge). `HANDOFF.md` and `docs/sessions/2026-10.md`: take main's version. Commit the merge on its own.

## Fix each, with the named test seen red first
1. **Row counting (R-1159's count, R-1160's no-row refusal).** `scripts/requirements-tree.mjs:411` and `:421` count
   only rows under a byte-exact `| ID | Requirement | Status | Evidence |` header. A table padded by a markdown
   formatter, or a header with one trailing space, is refused as "no requirement rows", and a blank line inside a table
   drops the rows after it (a real 365-row ledger reads 338). Count rows with `requirementRowId` on every line outside
   code fences, as the rail does, in both places. Tests in `requirements-tree.test.mjs`, `// req: R-1160` and
   `// req: R-1159` above them:
   - `R-1160: a tree ledger with a padded table header is not refused as having no rows`
   - `R-1159: a flat ledger's one line counts every requirement row, padded tables and rows after a blank line included`
2. **R-1157's cited test pins every clause.** At `:253`, T8 must also assert that the `--root` run creates no `docs/`
   folder in the target and writes no outline anywhere. Give the two fixture checks at `:258` and `:262` a
   `// req: R-1157` line directly above each and keep their titles; cite both in R-1157's evidence.
3. **R-1151's reserved subgroups.** `templates-render.test.mjs:201` (T2): also assert, in all four renders, that the
   general-engineering feature holds exactly the subgroups SUB-900, SUB-901, SUB-902, SUB-903 and SUB-904, and that
   every G row's parent is one of them. Keep the title.
4. **R-1159 fires on no capability or feature heading.** `:421` tests `parsed.headings.length === 0`, which counts SUB
   headings too: a ledger with SUB headings and rows but no CAP or FEAT heading gets a nesting problem, not the one line.
   Count CAP and FEAT headings only. Test, `// req: R-1159`:
   `R-1159: a ledger with subgroup headings but no capability or feature heading still gets the one line`
5. **R-1161's near-miss pattern.** `:385` misses a heading with one to three leading spaces (an ATX heading the parser
   at `:17` accepts) and levels four to six. Use `/^\s{0,3}#{1,6}\s*(CAP|FEAT|SUB)-\d+/`. Extend T15's fixture (title
   unchanged) with ` # CAP-02 - Indented` and `#### SUB-002 - Deep`, each named with its line.
6. **T13 says "once".** `product-report.test.mjs:506` accepts the line more than once. Assert exactly one.

Do not change any row's text. Add the new titles to the cited rows' evidence. Do not touch `CHANGE.md`, the seat
scripts, `HANDOFF.md` or `docs/sessions/`.

## Done
`node docs/reviews/tree-2026-10-14/seat-titles.mjs 1` → `0 missing` (the three new titles are not in its list; that is
expected); `node docs/reviews/tree-2026-10-14/acceptance.mjs > docs/reviews/tree-2026-10-14/acceptance-output.txt 2>&1`
→ only the three `(f, seat item)` cases miss; `npm run test:locked` (0 failed); `npm run map:check`;
`npm run readme:check`; `node scripts/requirements-tree.mjs --check`; `npm run template:accept`. Commit, push, and read
the finished CI run's Windows log once for T8–T11, T15 and the three new titles.

## Report
≤ 25 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: the merge commit and the fix commits; each item with the
red you saw first; the CI run ID with the Windows results; the `test:locked` summary line; the last lines of each seat
output; the one claim most likely wrong.
