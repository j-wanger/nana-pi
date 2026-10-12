# Lane product-report — build round 7: the page a reader meets (2026-10-11 · feat/product-report)

Round 6 replaced the JSON dump with routed views; the seat's acceptance script passes and the seat
looked at the page in a browser. It works, but it is a plain list of labelled paragraphs, well below
the prototype Jake used to decide (`prototype/template.html`), which brief 6 asked you to follow. Jake
reads this page to decide what is solid; the feature detail puts the assessment AFTER every requirement
row, under raw store keys (`what_it_does`, `maturity_reason`), and the features list has no links.
Keep the DOM surface, the one-source renderer and every text-node rule from brief 6. Do every item:

- [ ] **A. Feature detail order and labels.** Header (ID · label, status), then the assessment state
  as a badge — `current`, `out of date` (with each named difference: added, removed, changed rows,
  purpose or status was → now) or `unassessed` — then the assessment under human labels in the
  prototype's order: What it does; Maturity (the rating) and why; Gaps; Risks; Decisions; Next step;
  then "Written by … · checked by … · date". Then the counts, the features that share its rows and the
  rows shared into it, then the requirement rows (own first, then shared). No raw store key appears on
  any view.
- [ ] **B. Status at a glance.** Use the prototype's status colours and a stacked status bar for each
  feature's counts on the Product and Features views and the detail, always with the text counts
  beside it (never colour alone); a status pill on each requirement row. Colours as tokens on `:root`
  with both dark-mode selectors.
- [ ] **C. Links.** Every feature ID the page shows (Product, Features, Shared, a detail's shared-by
  list) is an `a` element with `href="#FEAT-xxx"`; the tab bar is styled as the prototype's tabs, and
  the current view's tab carries `aria-current="page"`.
- [ ] **D. Compact rows.** A requirement row is one card: ID and status pill on one line, the
  requirement text, the evidence in a smaller monospace line. Phone width (≤ 600 px): no horizontal
  page scroll; long evidence wraps.
- [ ] **E. The seat's acceptance script** (frozen) has three new cases that fail at launch
  (`seat-verify-report-r7-launch.txt`): assessment before rows, no raw keys, feature links. It must
  print `0 mismatch(es)`. Update the R-1014–R-1018 tests as needed so they still assert on the
  rendered views.

Mutation pairs, red then green — break the CODE: put the assessment after the rows → its case; print
a raw key → its case; render feature IDs as plain text → the link case.

Then: `npm run req:tree`, `npm run map`, `npm run map:check`, `npm run readme:check`,
`npm run test:locked` (summary line and total checks), `npm run report` twice (identical bytes), the
seat script into `seat-verify-report-output.txt` (exit 0), the title check into its output file
(`0 gap(s)`), commit with explicit paths. Frozen: `CHANGE.md`, the seat scripts, `HANDOFF.md`,
`docs/sessions/`, `prototype/`, the assessments. Report ≤ 20 lines, first line `VERDICT: …`, checklist
ticked, the last two lines of each seat output verbatim, the one claim most likely wrong.
