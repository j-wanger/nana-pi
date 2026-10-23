# park-deliverables: plan attack (adversary, 2026-10-22, main b5b5f8c2)

## Summary

The design holds up. I checked each line kind against main, and parking only the eight desk and app rows gives `deliverables: 14 of 31 made and read by code, 8 parked` with 0 tree problems and an unchanged outline. Widening the field prefix is enough for the Product view: with no product-report change, the park line shows up as a claim in ledger order. The 15 pairs each turn their named test red, and none is an equivalent mutant. There is one material gap. The owner's answer has two halves, and the plan only delivers the first: "Reopening the desk restores them" has no step. A seat that reopens the desk would edit the ruling, HANDOFF's desk line and seven frozen Status lines, and nothing in those places names the park lines, so all eight would stay parked. The should-change items: the draft still carries the 13-park and R-694 design the seat overruled. A duplicate park would be counted per line with no test to catch it. This lane's own movement report runs main's script, which ignores park lines. R-2642 belongs in FEAT-039. A few rows are wider than their tests.

## Material

### M1. Reopening the desk does not restore the parks

- Owner's answer: "Reopening the desk restores them."
- The plan gives the following.
  - D5: "Delete the park line in the change that reopens the work. Nothing expires a park."
  - Known limit (plan:112): "a park never expires, and nothing flags an old one."
  - D4 fires only when code makes and reads the row. All eight desk and app makers are `manual: desk frozen since 2026-10-10` (REQUIREMENTS.md:1629-1641, :1796-1805), so reopening the desk makes none of them live, and D4 never fires.
- Where a reopen happens today:
  - packages/nana-pack/rules/nana-rulings.md:11 ("the desk stays frozen until the owner reopens it")
  - HANDOFF.md:9 ("Frozen by the owner on 2026-10-10 until the owner reopens it")
  - seven `Status: frozen (the owner 2026-10-10: the desk stays frozen until he reopens it)` lines (`grep -c "^Status: frozen" REQUIREMENTS.md` → 7)
  - The plan touches none of these. The unpark rule lives only in the plan and in a generic SKILL.md sentence.
- Concrete input: a later session reopens the desk. It edits the ruling, the HANDOFF line and the seven Status lines.
- Wrong output: `deliverables: 14 of 31 made and read by code, 8 parked` stays, with no note. The Product view still shows eight `Parked:` claims. Eight gaps nobody decided to keep parked stay out of the total. That is the worst case the plan's own Stakes paragraph names.
- Fix (no code):
  - (a) In the HANDOFF desk line under "Where things stand", add one sentence: its eight deliverables are parked, and reopening deletes their `Parked:` lines. This line is the frontier a reopening session reads and must edit.
  - (b) End each park reason with "reopening the desk deletes this line".
  - (c) Add a Seat step to run `nana-writing HANDOFF.md` after (a).
- Rejected alternative: a checker rule tying a park to a frozen feature. R-422 (FEAT-023) and R-260 (FEAT-025) sit in active features, so it would need new grammar for 2 of 8 rows.

## Should change

### S1. Carry the seat's Q1 and Q2 calls through every section

The draft still parks 13 rows and takes R-694 off CAP-08's list. Sections that must change:

- Measurement 9: the count becomes `14 of 31 …, 8 parked`.
- Measurement 10: land-order counts. These are measured on each branch's ledger with the eight parks:
  - feat/build-records: `15 of 32 …, 8 parked`
  - feat/session-start-frontier: `15 of 31 …, 8 parked`
  - feat/land-reads-ci and feat/project-drift-notice: `14 of 31 …, 8 parked`
  - Both of the first two: `16 of 32 …, 8 parked` (inferred).
- D7: delete it. Also delete D10's "Retiring the writing-trial extractor".
- "Docs that change": the park table drops both CAP-08 rows. The "REQUIREMENTS.md, CAP-08" bullet goes. The docs/requirements-tree.md bullet drops CAP-08.
- Known limits: plan:118 (R-694 off the list) becomes the seat's R-694 known-bug line. Its text should say the writing trial closed on 2026-10-21 while R-694 stays a listed deliverable that is not made and read by code.
- Seat steps: "the owner's answers to open questions 1 and 2" and "the answer date" go. The movement-report expectation lists R-2541's text change, five new rows and eight park entries. There is no R-694 change and no CAP-08 change.
- Open questions: close Q1 to Q3. Q4 to Q6 stay as later.
- Source: HANDOFF Next item 3 named "desk and orphan study". This lane now covers the desk only, so see S5.

### S2. A duplicate park line is counted per line, and no test catches it

- The seat's threat model names "a duplicate park". The plan's threat model omits it.
- No must-meet fixture has two park lines for one row: R-2639, R-2640, R-2641 and R-2642 each use one line per row. So a builder who counts readable park lines passes every planned test.
- Probe: I made a scratch copy with a per-line count, `pd-attack/repo/scripts/deliverables.perline.mjs`. I added a second, reworded `Parked: R-406 · since 2026-10-23: …` line, which is honest variation: a seat updates a reason by adding a line, or two lanes merge.

```
per row:  deliverables: 14 of 31 made and read by code, 8 parked
per line: deliverables: 14 of 30 made and read by code, 9 parked
```

- Fix: R-2639 counts rows. Add one fixture case where R-002 carries two readable park lines, so the parked count is 1 and the total drops by 1. Add pair 16, "the parked count counts park lines, not rows", which turns R-2639 red. R-2641's stale note should be one per row, so pin that with the same case.

### S3. This lane's movement report omits its own parks

- AGENTS.md:157 and SKILL.md:142 say to run `node "$HOME/nana-pi/scripts/requirements-moved.mjs" --root . --base main`. `$HOME/nana-pi` is the main checkout, and its code does not read park lines until this lane lands.
- Probe: main's `treeMovement` over main's ledger against the scratch ledger with the eight parks prints `tree movement: none` (`pd-attack/moved.mjs`).
- So the seat step's expected park entries never appear in this lane's review brief or land report. That holds for both the draft's 13 and the corrected 8. The Stakes guard ("the movement report lists every added or removed park in each review brief and land report") does not cover the lane that adds the parks.
- Fix: the seat runs the AGENTS.md command and the worktree's own `node scripts/requirements-moved.mjs --root . --base main`. It carries both outputs and says why they differ.

### S4. Home R-2642 and its known limit in FEAT-039

- R-2542 and R-2543 are the Product-view rows. Both are homed in FEAT-039 · See the product and its decisions in one report, checked through the parser.
- docs/known-bugs/FEAT-039.md already holds the "Product view (report-deliverables, plan)" lines.
- The plan homes R-2642 in FEAT-028 (plan:72) and writes "Product view (park-deliverables, plan)" to FEAT-028.md (plan:116). Move both to FEAT-039.
- Also, plan:72 says "R-2641 to R-2643 are homed in FEAT-028". It should say R-2639 to R-2643, less R-2642.

### S5. The HANDOFF edit drops the study carry

- The plan deletes "A small lane parks the desk and orphan study deliverables when a build slot frees" (HANDOFF.md:16).
- After Q1, the six CAP-08 deliverables (R-509, R-532, R-507, R-535, R-536, R-694) stay counted, and no ruling covers them.
- Deleting the whole sentence loses an unresolved item. The soul rule says every unresolved item keeps a HANDOFF line.
- Fix: replace the sentence with one line saying the six study deliverables stay counted until the owner rules on them. This could be an Open-for-the-owner ask with a since date, if the seat wants a ruling.

### S6. Rows wider than their tests

- **R-2641** says "read by code or a prompt", but its test uses only `code`. Narrow it to "that the count line counts as made and read by code" (it reuses `isMadeAndReadByCode` unchanged, which R-2541 already pins), or add a prompt case.
- **R-2640** says "outside a live `Kind: product` capability". Its test covers only a constraint capability, not kindless or retired-product capabilities. Retired products are already an untested gap, per FEAT-028.md:51. Narrow the row, or add a kindless case like R-2537's `outside` fixture (requirements-deliverables.test.mjs:133).
- **R-2643** says "differ". The test only adds and removes a line, so an edited park reason is untested. Add a reworded-reason case, or narrow the row to "added or removed".
- **D8's R-2541 wording**: "out of all listed deliverables that are not parked" is ambiguous for a stale park, a live row that carries a readable park line. Say "less those a `Parked:` line holds back (R-2639)", so the D4 rule and R-2541 cannot read as conflicting.

### S7. Name `deliverableFieldLinesByRow`'s contract

- Precedent line 17 widens `FIELD_PREFIX` "with no new code". That also changes the exported `deliverableFieldLinesByRow` (deliverables.mjs:60-72, documented as "maker and reader field lines"), which `rowSnapshot` reads (requirements-moved.mjs:58).
- Probe: with only the prefix widened, the movement report prints `R-406 Made by/Read by lines changed` for all eight rows (`pd-attack/moved.mjs`). That is pair 14's behaviour, and it is the default.
- Pair 14 catches it. The plan should still say which side changes: either `deliverableFieldLinesByRow` returns labelled lines, or `rowSnapshot` splits by prefix. The builder should not find out from a red test.

## Notes

- **N1.** Check the pair table's red-test matchers. Pair 3 names R-2541 and R-2538, and their titles have no `R-NNNN:` prefix: "the tree checker counts the deliverables made and read by code in every mode" (requirements-tree.test.mjs:450) and "the tree checker prints deliverable notes in every mode…" (:424). The `^R-2580: ` matching style in seat-mutate.mjs will not find them. R-2543's title does carry its prefix (product-report.test.mjs:1270).
- **N2.** Pair validity. Pairs 1 to 9 and 11 to 15 each fail an assertion the plan names. Pair 10 is contrived, because `claimsByRow` is computed before the field loop (deliverables.mjs:136), so line order cannot matter in a natural build. It is still a valid, non-equivalent mutant, and only R-2641 case one kills it. Pair 11 is killed twice: the "missing both" count (3 notes, not 2) and the sealed `DELIVERABLE_FIELD_LABELS` pin (requirements-deliverables.test.mjs:151).
- **N3.** No inline tunables. `FIELD_PREFIX` (deliverables.mjs:34) repeats `Made by|Read by` as literals. If `Parked` is added the same way, retuning `PARKED_LABEL` needs a second code edit. Build the prefix from `DELIVERABLE_FIELD_LABELS` and `PARKED_LABEL`.
- **N4.** The second copy list. requirements-regroup.test.mjs:209-216 (`mirrorScripts`) also copies `deliverables.mjs` and the five pack libs. Precedent line 30 names only requirements-tree.test.mjs:410-413. Name both.
- **N5.** Silent prose. `**Parked:**`, `- Parked:` and lowercase `parked:` are all prose with no note. They fail closed, and the row stays counted. Add bold and bullet forms to plan:114. The Stakes line "fails closed: the row stays counted as a gap, with a note" holds only for lines that start `Parked:`.
- **N6.** Spacing. No R-2640 guard pins that honest extra spacing still parks, for example `· since  2026-10-22:  held`. R-2537 pins trailing whitespace for maker lines (:149). Over-strict parsing would fail closed, with a visible note.
- **N7.** Module headers. Both `@outputs` headers change, so `npm run map` is required, not "if".
- **N8.** Confirmed claims.
  - No tracked `^Parked:` line exists (`git grep -n "^Parked:"`, exit 1), and none exists in REQUIREMENTS.md history (`git log -G "^Parked:" --all` is empty).
  - There are 25 not live, 7 of them with a code reader. The 8 desk and app rows are R-406, R-422, R-457, R-260, R-256, R-257, R-437 and R-264. 6 of the 8 sit in frozen features. R-422 sits in FEAT-023 and R-260 in FEAT-025, both active.
  - There are 16 of 104 desk-frozen maker and reader lines.
  - Nothing else reads the count line: `git grep "made and read"` finds only the two tree tests, the R-2542 and R-2543 fixtures, and deliverables.mjs:242. No in-flight branch reads it.
  - readme:check passes with the proposed README text: `looksLikePath("Parked:")` → null, and the current run reports 753 claims and 0 problems.
  - product-report needs no change. A scratch `buildReport` over a fixture gave claims `["Made by: manual: …", "Parked: since 2026-10-22: the owner holds it", "Read by: person: …"]`, both marks, and the count line `deliverables: 0 of 1 made and read by code, 1 parked`.
- **N9.** Subtraction. Each part earns its place:
  - D4 is the only signal to delete a park whose row went live.
  - R-2643's separate entry keeps a park from hiding among maker edits.
  - R-2642's behaviour comes free with the prefix, but it needs a pin so that a later filter, for example one added to fix the movement report, cannot hide parks from the Product view.
  - I found no smaller design that meets "reports them apart".

## Measured count

On a scratch copy of REQUIREMENTS.md with only the eight desk and app park lines (`pd-attack/repo/REQUIREMENTS.md`), the minimal D1 to D4 patch (`pd-attack/repo/scripts/deliverables.mjs`) prints:

```
deliverables: 14 of 31 made and read by code, 8 parked
```

- `checkTree` reports 0 problems, and the outline is byte-identical to main's.
- Main's checker on the same copy prints `deliverables: 14 of 39 made and read by code`.
- The patched checker on main's ledger prints `deliverables: 14 of 39 made and read by code`, byte-identical to today's output.

## Plan sections I would change

- Threat model: add duplicate park lines (S2).
- Stakes: the movement-report guard does not cover this lane (S3). The "with a note" claim holds only for lines that start `Parked:` (N5).
- Source: the desk only (S1).
- Precedent: lines 17 and 30, and the regroup copy list (S7, N4).
- Measurements 9 and 10 (S1).
- Design: D5 gets the reopen anchor (M1). D7 is deleted and D10 trimmed (S1). D8's wording changes (S6).
- Must-meet rows: R-2640, R-2641 and R-2643 narrowed or given more cases (S6). R-2642 re-homed (S4). The duplicate case goes into R-2639 (S2). Plan:72's ID range is fixed (S4).
- Wrong-code pairs: add pair 16 (S2). Pair 3's matchers (N1).
- Tunables: build `FIELD_PREFIX` from the constants (N3).
- Known limits: add the R-694 line (S1). Move the Product-view line to FEAT-039 (S4). Add bold and bullet forms (N5).
- Docs that change:
  - the park table (8 rows, reason ends with the reopen step)
  - the CAP-08 bullet deleted
  - the outline bullet
  - the HANDOFF bullet keeps the study carry and adds the desk-line sentence
  - `npm run map` required (M1, S1, S5, N7)
- Seat steps: no Q1 or Q2 answers, run both movement reports, the expected entries, the counts by land order, and the writing check on HANDOFF (S1, S3, M1).
- Open questions: close Q1 to Q3 (S1).
