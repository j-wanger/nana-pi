# Lane product-report — build round 8: three page defects the seat saw in a browser (2026-10-11)

Round 7 is verified: the acceptance script passes and the page now follows the prototype (status
bars, pills, links, assessment first). The seat opened it in Chrome and found three defects. Do all
three:

- [ ] **A.** A feature's detail view shows its title twice (the view heading and a second heading).
  Show it once.
- [ ] **B.** `gaps`, `risks` and `decisions` are joined into one paragraph with `"; "`, so the page
  reads `… the objective.; No test proves …`. Render each list as a `ul` with one `li` per entry
  (still text nodes, still `**`/backtick spans), under its label.
- [ ] **C.** Following a link to another view keeps the old scroll position, so a feature's detail
  opens half-way down. The page bootstrap (not the renderer) scrolls to the top after each
  `hashchange` render.

The seat's acceptance script (frozen) has three new cases; two fail at launch (the fixture lists hold one entry, so the ".;" case guards the real page)
(`seat-verify-report-r8-launch.txt`); it must print `0 mismatch(es)`. Mutation pairs (break the code):
render the title twice → its case; join the list again → the list and ".;" cases. Then
`npm run map:check`, `npm run readme:check`, `npm run test:locked` (summary line), `npm run report`
twice (identical bytes), the seat script into `seat-verify-report-output.txt`, the title check into
its output file, commit with explicit paths. Same frozen files as round 7. Report ≤ 12 lines, first
line `VERDICT: …`, the last two lines of each seat output verbatim.
