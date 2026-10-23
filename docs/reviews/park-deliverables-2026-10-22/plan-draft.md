# park-deliverables: plan draft (planner, 2026-10-22, main b5b5f8c2)

Feature: FEAT-028 · Maintain requirement identity and trace links (checked: the deliverable line rows R-2535 to R-2541 sit there, REQUIREMENTS.md:1959-1965; the checker is scripts/deliverables.mjs, called from scripts/requirements-tree.mjs:584-590).

Class: ordinary. The lane changes `scripts/deliverables.mjs`, `scripts/requirements-moved.mjs`, four test files, the root README, the requirements skill text and ledger lines. It touches no nana-setup install, uninstall or doctor code, no Claude Code hook, no pi extension, no gate policy, and none of nana-land, pi-review, claude-review or review-round. `scripts/product-report.mjs` is unchanged; the Product view changes only through the claims `deliverables.mjs` returns. Ladder: the seat's wrong-code pairs and one final reviewer from another model family. Builder: the small builder (`pi-worker --lane-size small`).

Stakes: low blast, reversible. Every deliverable output is report-only: notes and the count line never change an exit status (R-2538). A wrong reading misstates the count line the owner reads. The worst case is a park that hides a gap nobody decided to park. Two things guard that: every park needs a date and a reason, and the movement report lists every added or removed park in each review brief and land report (R-2643). A malformed park fails closed: the row stays counted as a gap, with a note.

Threat model: honest variation in our own ledger lines is in scope. A park line typed with `-` for `·`, or with a reason holding a second ` · `. A date without `since`, in another order, or a word in place of a date. An empty reason. Lowercase `parked:`. A park line under a feature heading or inside a code fence. CRLF endings and trailing blanks. A park line in one capability naming another capability's row. A park line placed above the row's maker line. A park left in place after code starts to make and read the row. Deliberate forgery is out. A park line that claims an owner decision that never happened passes; the checker proves a shape, not the decision, and the reviewer sees the line in the movement output. Public repo: every line this lane writes says "the owner", never a name, and names nothing about the owner's work.

Source: the owner's 2026-10-22 decision "Park them" for the desk and app deliverables, the deliverable ruling of the same day, and HANDOFF Next item 3 ("A small lane parks the desk and orphan study deliverables").

## Precedent (this lane's own, in the form the lane requires)

Precedent:
- scripts/deliverables.mjs:14-23 — the contract constants with their provenance comments; `PARKED_LABEL` and `PARKED_SINCE` join them in that form. `DELIVERABLE_FIELD_LABELS` stays the two required labels.
- scripts/deliverables.mjs:34 — `FIELD_PREFIX`, the one label match. `Parked` joins it, so `ownFieldLines`, the separator note (:142-145), the row note (:147-150), the unlisted-row note (:151-154) and the outside-capability note (:127-130) cover park lines with no new code.
- scripts/deliverables.mjs:181-199 — the `Read by:` branch: exactly two parts, the colon split, the reason note. The park branch copies it.
- scripts/deliverables.mjs:75-93 — `deliverableClaims`: a park line becomes one more claim with a `parked` flag, as `madeByCode` is a flag. One parse function serves this and the checker's branch.
- scripts/deliverables.mjs:103-107 — `isMadeAndReadByCode`, the pattern for an `isParked` predicate; the stale-park rule reuses it unchanged.
- scripts/deliverables.mjs:202 — the per-capability count; the parked count is taken here.
- scripts/deliverables.mjs:242 — the count line, an inline template; the parked suffix stays inline beside it.
- packages/nana-pack/lib/handoff-asks.mjs:11 — the repo's one parked form, `[parked, since <YYYY-MM-DD>]`, with a shape-only date. The park line takes its word and its date shape.
- scripts/requirements-moved.mjs:56-62 — `rowSnapshot`; it gains the row's park lines beside its maker and reader lines.
- scripts/requirements-moved.mjs:158 — the `Made by/Read by lines changed` entry; `Parked lines changed` is pushed by one more line like it.
- scripts/product-report.mjs:346-355 — the claims render; unchanged, it shows a park claim once `deliverableClaims` returns one.
- packages/nana-pack/tests/requirements-deliverables.test.mjs:40-41 — `notesFor` and `tree`; R-2640 and R-2641 use them.
- packages/nana-pack/tests/requirements-deliverables.test.mjs:126-159 — R-2537's `expectNote` table and its sealed-constant check; R-2640's cases and its two-constant pin copy that shape.
- packages/nana-pack/tests/requirements-tree.test.mjs:442-452 — R-2541's three-mode count check (`countTree`, `hasOneCount`); R-2639 copies it in the same block.
- packages/nana-pack/tests/requirements-tree.test.mjs:410-413 — that block copies `deliverables.mjs` and five pack libs into a temp root. A new import in `deliverables.mjs` must join that list, so keep the new code inside the two scripts.
- packages/nana-pack/tests/product-report.test.mjs:1180-1234 — R-2542's claims-in-order check (`capabilityCard`, `claims(id)`, the marks); R-2642 copies it.
- packages/nana-pack/tests/requirements-moved.test.mjs:233-258 — R-2540's `deliverableBase`, the `treeMovement` call and `changedIn`; R-2643 copies them.
- packages/nana-pack/lib/mutation-runner.mjs — the shared pair runner.
- docs/reviews/brief-reader-fixes-2026-10-22/seat-mutate.mjs — the per-lane pair table to copy.

## Measurements (2026-10-22, this Mac, main b5b5f8c2)

1. `node scripts/requirements-tree.mjs --check` prints `requirements tree: 0 problems; rows 1852; features 39` and `deliverables: 14 of 39 made and read by code`, with no note.
2. A scratch script over the real `parseLedger`, `deliverableClaims` and `deliverableCodeState` lists the 25 not live. All 25 have a hand maker; 7 of them have a code reader. By group: 8 desk and app (CAP-05 R-406, R-422, R-457; CAP-06 R-260, R-256, R-257, R-437, R-264), 6 study and trial (CAP-08 R-509, R-532, R-507, R-535, R-536, R-694), and 11 others (R-873, R-749, R-1400, R-1560, R-301, R-327, R-1150, R-291, R-1460, R-1014, R-1239). The 11 stay counted; they are the queue the ruling puts first.
3. All 8 desk and app rows carry `manual: desk frozen since 2026-10-10` and `person: desk frozen since 2026-10-10`: 16 of the ledger's 104 maker and reader lines (`grep -c`).
4. Home features, read through the parser: 6 of the 8 sit in features whose Status is `frozen (the owner 2026-10-10: …)`. R-422 sits in FEAT-023, which is active, and its evidence is `apps/desk/test/changes-endpoint.test.mjs`. R-260 sits in FEAT-025, also active. It is nana-stage, which loads only in app sessions the desk starts (packages/nana-stage/README.md, Install; the root package.json `pi.extensions` lists only nana-pack and nana-knowledge). None of the 6 study rows sits in a frozen feature. A park read from a frozen Status would catch 6 of the 14, so a park is a written line.
5. No tracked file has a line starting `Parked:` (`git grep -n "^Parked:"`, exit 1). No fixture string in packages, scripts, templates or apps holds `Parked:`. The new label reads no existing text.
6. The repo's one parked form is HANDOFF's ask tag `[parked, since YYYY-MM-DD]` (2 live asks), read by handoff-asks.mjs:11-12 with a shape-only date. Two calendar checks exist, nana-frontier.mjs:14-19 and product-report.mjs:29-33. Neither is exported, and product-report imports deliverables.mjs, so deliverables.mjs cannot import back.
7. R-2540's test asserts `includes("Made by/Read by lines changed")` (requirements-moved.test.mjs:251, :258). A combined label such as `Made by/Read by/Parked lines changed` would turn it red, so parks get their own entry text.
8. Study state. The rulings file records on 2026-10-21 that the owner adopted the writing rule, so the writing trial behind R-694 has closed. The bench runner spends nothing without a run flag (R-500, FEAT-036), and `apps/bench/catch-ledger.mjs` reruns over the review corpus by hand. So R-509, R-532, R-507, R-535 and R-536 have a reusable maker that is idle, and R-694's maker served one finished decision.
9. Simulation (scratch, not the lane's code). A copy of the ledger with the 13 park lines proposed below, and R-694 off CAP-08's list, passes `checkTree` with 0 problems. An in-memory copy of D1 to D4 over the real parser and claim reader prints `deliverables: 14 of 25 made and read by code, 13 parked`, with 0 notes. Main's checker on the same copy prints `deliverables: 14 of 38 made and read by code`, so main ignores the lines. Variants: desk and app only gives `14 of 31 …, 8 parked`; all six study rows parked gives `14 of 25 …, 14 parked`. The wrong-code pairs were not simulated.
10. Lanes in flight (read from `git diff main...<branch>`, not run): feat/build-records adds R-2597, made and read by code, to CAP-02. feat/session-start-frontier turns R-873 live. feat/land-reads-ci changes R-1070's reader and product-report.mjs's imports. None touches deliverables.mjs or requirements-moved.mjs. If both of the first two land first, the line after this lane reads `16 of 26 made and read by code, 13 parked` (inferred).

## Design

- **D1 · A park is its own line kind.** `Parked: <row> · since <YYYY-MM-DD>: <reason>`, in the listing capability's own span beside that row's maker and reader lines. It is optional and never a required label. Three other forms were weighed and dropped. A `parked` maker run would retune R-2537's sealed run list and replace the honest maker line; parking is not a run. A park read from a frozen feature Status misses 8 of the 14 rows (measurement 4). A capability-level field would enter R-2441's closed vocabulary and the outline (R-2446), and it holds no reason per row.
- **D2 · Date and reason required; shape only.** The date is the day of the owner's decision; the reason says what holds the row and what reopens it. Following handoff-asks, the checker reads `since` and a `\d{4}-\d{2}-\d{2}` shape, not a calendar date. Following the `Read by:` branch, a park line has exactly two parts. Each malformed park line gets one note (`cannot read Parked:`, `needs a since date`, `needs a reason`, or the existing unlisted-row and outside-capability notes) and parks nothing.
- **D3 · The count line.** `deliverables: <live> of <listed − parked> made and read by code, <parked> parked`. With no parked row the line is byte for byte today's, so R-2541, R-2543 and every other project's output stay as they are. `checkDeliverables` returns a new `parkedDeliverables` field. `checkedDeliverables` keeps meaning "listed", because requirements-tree.mjs:586 gates the summary on it; the line subtracts.
- **D4 · A stale park counts as live.** A parked row that an automatic run makes and code or a prompt reads counts as made and read by code, not parked, and gets one note: `<row> Parked: line <n> parks nothing; code makes and reads it`. The rule is checked after all of a row's lines are read, so line order does not matter. A forgotten park never hides a live row, and closing a gap never hides behind a park.
- **D5 · Unparking.** Delete the park line in the change that reopens the work. Nothing expires a park. The movement report lists each added, removed or changed park line as `Parked lines changed`, separately from maker and reader changes, so each park and unpark reaches the review brief and the land report (AGENTS.md requires both to carry that output).
- **D6 · The Product view.** It shows the shared count line through R-2543, with no new code. Each park line is one more claim under its deliverable, in ledger order, rendered `Parked: since <date>: <reason>`. Both code marks stay, because they stay true. There is no new mark and no product-report.mjs change.
- **D7 · Retired versus parked study deliverables.** A deliverable whose maker served one finished decision leaves the capability's `Deliverables:` list, and its maker and reader lines go with it. Its row stays an implemented requirement. A deliverable whose maker is reusable but idle parks. So R-694 leaves CAP-08's list, and R-509, R-532, R-507, R-535 and R-536 park. CAP-08 keeps five deliverables, so R-2460 holds. Only the owner's 2026-10-22 decision covers the desk and app parks; the five study parks and R-694's removal ship on the owner's answer to the first two open questions, with the defaults below.
- **D8 · R-2541 narrows.** Its cell's last words become "out of all listed deliverables that are not parked". Its test stays unedited and green; R-2639 pins the new clause.
- **D9 · Docs.** See "Docs that change". The README's stale `--root` clause, a FEAT-028 known bug on the line this lane edits, is fixed and its known-bug line deleted.
- **D10 · Left out.** An expiry or age check on parks. A calendar check of the date. A parked mark in the Product view. A reason holding ` · `. The parked count at session start. Rewriting the desk and stage maker lines. Retiring the writing-trial extractor. The shared template's organization text (open question 4).

## Must-meet rows (EARS, one shall each) and tests

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2639 | WHEN a listed deliverable that code does not both make and read carries a readable `Parked:` line, the tree checker shall, in every mode, leave it out of the count line's total and end that line with `, <n> parked`. | `packages/nana-pack/tests/requirements-tree.test.mjs::R-2639: a parked deliverable leaves the count's total and the line names the parked count in every mode` |
| R-2640 | IF a `Parked:` line lacks the separator or has a third part, names a row its capability does not list, lacks `since` and a YYYY-MM-DD date before a colon, has no reason after that colon, or sits outside a live `Kind: product` capability, THEN the deliverable check shall report one note naming the row or the line in place of parking the row. | `packages/nana-pack/tests/requirements-deliverables.test.mjs::R-2640: an unreadable or misplaced Parked line gets one note and parks nothing` |
| R-2641 | WHEN a deliverable with a readable `Parked:` line is made by an automatic run and read by code or a prompt, the deliverable check shall report one note naming the row and that line, counting the row as made and read by code, not parked. | `packages/nana-pack/tests/requirements-deliverables.test.mjs::R-2641: a parked deliverable that code makes and reads counts as live with one note naming its Parked line` |
| R-2642 | WHEN a live product capability lists a deliverable that carries a `Parked:` line, the product report's Product view shall list that line among the deliverable's claims in ledger order. | `packages/nana-pack/tests/product-report.test.mjs::R-2642: the Product view lists a deliverable's Parked line among its claims in ledger order` |
| R-2643 | WHEN a row's `Parked:` lines differ between the base and the tip, the tree movement report shall list one entry for that row naming `Parked lines changed`. | `packages/nana-pack/tests/requirements-moved.test.mjs::R-2643: the movement report lists a row whose Parked line was added or removed` |

R-2644 and R-2645 stay unused. R-2641 to R-2643 are homed in FEAT-028 with the rest, as runtime-map-live homed its land-command row (R-2530) in its own feature.

### What each test does, and why it is red on main

- **R-2639.** In the R-2541 block, write a ledger listing R-001 to R-004. R-001 is made by `suite` and read by `code`. R-002 (`manual`, `person`) and R-003 (`suite`, `rule`) each carry `Parked: <row> · since 2026-10-22: the owner holds it`. R-004 (`manual`, `person`) carries none. In `--root`, `--write` and `--check`, expect exit 0 and exactly one line `deliverables: 1 of 2 made and read by code, 2 parked`. A second ledger with one deliverable, parked, expects `deliverables: 0 of 0 made and read by code, 1 parked` under `--root`. Red on main: main reads no park line and prints `deliverables: 1 of 4 made and read by code`.
- **R-2640.** With `notesFor` and `tree`, each case adds one park line to `Made by: R-001 · manual: owner` and `Read by: R-001 · person: owner`. Each case expects exactly one note holding its fragment and `parkedDeliverables === 0`. The cases: `Parked: R-001 - since 2026-10-22: held` (`cannot read Parked:`); `· 2026-10-22: held`, `· since 22-10-2026: held` and `· since soon: held` (`needs a since date`); `· since 2026-10-22` and `· since 2026-10-22:   ` (`needs a reason`); `· since 2026-10-22: held · more` (`cannot read Parked:`). Two more cases. CAP-01 lists R-001 and CAP-02 lists R-002, and CAP-01's span holds `Parked: R-002 · since 2026-10-22: held`: one `names an unlisted deliverable` note, and R-002 is not parked. A park line on a constraint capability: one `outside a live Kind: product capability` note. Guard: `Parked: R-001 · since 2026-10-22: the owner holds it` gives no note and `parkedDeliverables === 1`. Guard: lowercase `parked:` and a park line under the feature heading give no note and park nothing. Seal: `PARKED_LABEL === "Parked"` and `PARKED_SINCE === "since"`. Red on main: main reads no park line, so every bad case gives zero notes and `parkedDeliverables` is undefined.
- **R-2641.** R-001 is made by `suite: scripts/make.mjs` and read by `code: scripts/make.mjs`, both tracked. Case one puts `Parked: R-001 · since 2026-10-22: held` above the maker line; case two puts it below the reader line. Each case expects exactly one note holding `R-001`, `Parked: line <n>` and `parks nothing`, with `madeAndReadByCode === 1` and `parkedDeliverables === 0`. `deliverableReportLines`, with a git runner that lists the tracked paths, prints `deliverables: 1 of 1 made and read by code`. Red on main: no note.
- **R-2642.** A product capability lists R-6000 and R-6001, both implemented. R-6000's lines, in order: `Made by: R-6000 · manual: a person makes it`, `Parked: R-6000 · since 2026-10-22: the owner holds it`, `Read by: R-6000 · person: a person reads it`. R-6001 is `manual`/`person` with no park. R-6000's claims equal those three texts after the row ID, in that order, and both code marks show. R-6001's claims hold no park line. The Product view's count line is `deliverables: 0 of 1 made and read by code, 1 parked`. Red on main: R-6000 lists two claims, and the count line is `0 of 2`.
- **R-2643.** Base is R-2540's `deliverableBase`; the head adds `Parked: R-001 · since 2026-10-22: the owner holds it` after its reader line. The output has one R-001 entry holding `Parked lines changed` and not `Made by/Read by lines changed`. Head to base (an unpark) gives the same entry. Head to head gives `tree movement: none`. Red on main: main reads no park line and prints `tree movement: none`.

Existing tests made false: none expected. The R-2537 seal is unedited because the five sealed lists keep their values. The R-2538, R-2541, R-2542 and R-2543 fixtures hold no park line. R-2540's case changes a maker and a reader line, so its entry text is unchanged. The R-2539 repository check still holds, because parked rows keep both lines and R-694's two lines leave with it.

## Tunables

- `PARKED_LABEL = "Parked"` in scripts/deliverables.mjs. Contract: the owner's 2026-10-22 decision "Park them"; R-2640. Pinned by R-2640's test.
- `PARKED_SINCE = "since"` in scripts/deliverables.mjs. Contract: HANDOFF's parked-ask form `[parked, since <date>]` (handoff-asks.mjs:11, R-878); R-2640. Pinned with `PARKED_LABEL`.
- No measured value. The date shape is syntax, like the row ID pattern at deliverables.mjs:35. The suffix `, <n> parked` and the entry text `Parked lines changed` are their rows' contract text, inline beside today's inline count line and entry text.

## Wrong-code pairs (each must turn a named test red)

1. Parked rows stay in the total; only the suffix is added: R-2639.
2. Parked rows leave the total, but the suffix is not printed: R-2639.
3. The suffix prints `, 0 parked` when nothing is parked: R-2541 and R-2538 (exact count lines), R-2543 (exact Product view lines).
4. A park line with no `since` date parks its row: R-2640.
5. A park line with an empty reason gets its note but still parks: R-2640 (`parkedDeliverables === 0`).
6. The date's shape is not checked, so `since soon:` parks: R-2640.
7. The parked rows are gathered from every capability's lines, so another capability's park line parks the row: R-2640's unlisted case.
8. A park beats live: a row made and read by code with a park line counts as parked: R-2641.
9. The stale-park note is given, but the row still counts as parked: R-2641's counts.
10. The stale check runs while the lines are scanned, so a park line above the maker line is missed: R-2641's first case.
11. `Parked` joins `DELIVERABLE_FIELD_LABELS`, so it becomes a required line: R-2537's "missing both" case (3 notes, not 2) and R-2539.
12. `deliverableClaims` leaves park lines out: R-2642.
13. Park claims are listed after the maker and reader claims, not in ledger order: R-2642.
14. The movement report folds park lines into the maker and reader comparison: R-2643 (its entry says `Made by/Read by lines changed`).
15. The movement report ignores park lines, as main does: R-2643.

## Known limits (the seat writes them to docs/known-bugs/FEAT-028.md before the final round)

- Deliverable lines (park-deliverables, plan): the checker reads only a park date's shape, so an impossible date such as 2026-02-30 parks, as HANDOFF's ask tags do.
- Deliverable lines (park-deliverables, plan): anyone who edits the ledger can park a row. The checker proves the line's shape, not the owner's decision. The movement report shows each park to the reviewer.
- Deliverable lines (park-deliverables, plan): a park never expires, and nothing flags an old one.
- Deliverable lines (park-deliverables, plan): a park reason cannot hold ` · `. Such a line gets a "cannot read" note and parks nothing.
- Deliverable lines (park-deliverables, plan): lowercase `parked:`, or a park line under a feature heading or inside a code fence, is prose and gets no note.
- Deliverable lines (park-deliverables, plan): a park takes its row out of the count's total, so the ratio rises with no work done. The suffix and the movement report are the only signals.
- Product view (park-deliverables, plan): a parked deliverable keeps both code marks and shows its park line as a claim. The view has no parked mark.
- Deliverable lines (park-deliverables, plan): the desk and stage maker and reader lines still say "desk frozen since 2026-10-10" instead of naming the run that makes each deliverable.
- Deliverable lines (park-deliverables, plan): R-694 and the writing-trial extractor stay implemented after the deliverable leaves CAP-08's list.

## Docs that change

- **README.md:71.** After "…or names a path not tracked at HEAD", add: "and its count line leaves out a deliverable held by a `Parked:` line, then says how many it holds". Change "— no outline, just its problems or a `0 problems` line" to "— no outline, just its problems, or a `0 problems` line followed by any deliverable count and notes". Delete the matching FEAT-028 known-bug line (docs/known-bugs/FEAT-028.md:53).
- **packages/nana-pack/skills/requirements/SKILL.md:127.** Append: "A deliverable the owner holds back carries `Parked: <row> · since <YYYY-MM-DD>: <reason>`. The date is the day of the owner's decision, and the reason says what holds it and what reopens it. The count line leaves a parked deliverable out of its total and ends with `, <n> parked`. A parked deliverable that code makes and reads still counts as made and read by code, with a note. Unpark by deleting the line; the movement report lists each added or removed `Parked:` line." At :129, "its written maker and reader claims" becomes "its written maker, reader and `Parked:` claims".
- **templates/_shared/requirements-organization.md.** Unchanged (open question 4).
- **Module headers.** `deliverables.mjs` `@outputs` adds "parked counts"; `requirements-moved.mjs` `@outputs` adds park-line changes. Run `npm run map` if either header changes.
- **REQUIREMENTS.md, FEAT-028.** R-2541's cell narrows as D8 says. R-2639 to R-2643 go after R-2541, `planned` until their tests pass, then `implemented` with their markers.
- **REQUIREMENTS.md, park lines.** Each goes directly after its row's last `Read by:` line. With the defaults, 13 lines:

| Row | Capability | Proposed line |
|---|---|---|
| R-406, R-422, R-457 | CAP-05 | `Parked: <row> · since 2026-10-22: the owner froze desk work on 2026-10-10 until the owner reopens it; no lane closes this maker or reader before then` |
| R-437 | CAP-06 | the same desk text |
| R-260, R-256, R-257, R-264 | CAP-06 | `Parked: <row> · since 2026-10-22: the stage runs only in app sessions the desk starts, and the owner froze desk work on 2026-10-10 until the owner reopens it` |
| R-509, R-532, R-507, R-535 | CAP-08 | `Parked: <row> · since <answer date>: no study is open; a person starts each paid study by hand, and the bench spends nothing without a run flag` |
| R-536 | CAP-08 | `Parked: R-536 · since <answer date>: no study is open; a person runs the catch ledger by hand when a review question needs it` |

- **REQUIREMENTS.md, CAP-08.** `Deliverables: R-509, R-532, R-507, R-535, R-536, R-694` loses `, R-694`, and R-694's `Made by:` and `Read by:` lines are deleted. Reason, for the session entry: the writing trial closed when the owner adopted the writing rule on 2026-10-21.
- **docs/requirements-tree.md.** Regenerated (`npm run req:tree -- --write`): FEAT-028's five new rows and CAP-08's new Deliverables value.
- **HANDOFF.md.** Drop "A small lane parks the desk and orphan study deliverables when a build slot frees." from Next item 3, then run `nana-writing HANDOFF.md`.

## Seat steps

- Cut `feat/park-deliverables` at `~/nana-pi-wt/park-deliverables` from main. Build with the small builder. The build brief carries the Feature line and a Precedent section and passes `brief-check`.
- Put the owner's answers to open questions 1 and 2 into the build brief before the build. The answer date goes on the five study park lines.
- After the build: run the fifteen pairs with a copy of the brief-reader-fixes pair table on the shared runner. Re-run `requirements-tree`, `requirements-deliverables`, `requirements-moved` and `product-report` tests whole.
- Run `node scripts/requirements-tree.mjs --check` and read its output. Expect the count line from measurement 9 or 10 for the land order, and no note. Run `npm run report` and read the CAP-05, CAP-06 and CAP-08 cards.
- Before the final round: the known-bug lines above go in, and FEAT-028.md:53 comes out. Also the HANDOFF edit and the session entry, with the before and after count lines. Then run `node "$HOME/nana-pi/scripts/requirements-moved.mjs" --root . --base main` and carry its output in the review brief and the land. It should list R-2541's text change, the five new rows, the thirteen park entries, R-694's maker and reader change and CAP-08's Deliverables change.
- One final reviewer from another model family, on the exact tip that lands. CI on the draft PR, the Windows leg included.
- Cross-lane: if build-records or session-start-frontier lands first, merge main, re-run the tree check, and update the count line in the session entry. Their ledger edits sit in CAP-01, CAP-02 and CAP-04, apart from this lane's lines, so a conflict is unlikely (inferred).

## Open questions (each with a one-word default)

1. Park the five bench study deliverables (R-509, R-532, R-507, R-535, R-536)? The owner's decision named the desk and app only. Default: **park**.
2. Take the writing-trial deliverable (R-694) off CAP-08's list instead of parking it? Default: **drop**.
3. Require the `since` date on every park line? Default: **yes**.
4. Name the park line in the shared template's organization text, which ships to every rendered project? Default: **no**.
5. Rewrite the desk and stage maker and reader lines to name the run that makes each deliverable? Default: **later**.
6. Retire the writing-trial extractor's row and code now that the trial has closed? Default: **later**.
