# park-deliverables · must-meet (seat, 2026-10-22, after one adversary pass)

Feature: FEAT-028 · Maintain requirement identity and trace links

Spend line: the owner's 2026-10-22 "Use power mode to continue work on remaining open items" and the answer "Park them" to the seat's question "Eight desk and app deliverables, frozen since 2026-10-10, count against the made-and-read total (25 of 39 not live). Park them?" The answer's text: "Mark them parked with your freeze as the reason, so the check reports them apart. Reopening the desk restores them." It serves the artifact work the owner made top priority on 2026-10-22: the count line then shows the gaps a lane can close.

Class: ordinary (scripts/deliverables.mjs, scripts/requirements-moved.mjs, four test files, the root README, the requirements skill text and ledger lines; nothing on the install, hook or gate list). Ladder: the seat's wrong-code pairs and one final reviewer from another model family. Builder: the small builder. Stakes: low blast, reversible; every deliverable output is report-only (R-2538). The worst case is a park that hides a gap nobody decided to park.

Threat model: honest variation in our own ledger lines. A park line typed with `-` for `·`, or a reason holding a second ` · `; a date without `since`, in another order, or a word for a date; an empty reason; extra spaces; lowercase `parked:`, `**Parked:**` or `- Parked:`; a park line under a feature heading or inside a code fence; CRLF; a park line in one capability naming another capability's row; a park line above the row's maker line; two park lines for one row (a reworded reason added, or a merge); a park left in place after code makes and reads the row; other projects' trees with no park line; the movement report over old revisions. Deliberate forgery out: a park line claiming a decision that never happened passes; the checker proves a shape, and the reviewer sees the line in the movement output. Public repo: every line says "the owner".

The planner's draft (`plan-draft.md`) holds the measurements and the precedent detail; the adversary's attack (`plan-attack.md`, M 1, S 7, N 9) changed the plan as the decisions below say. Where they disagree with this file, this file wins.

## Precedent

Precedent:
- scripts/deliverables.mjs — the contract constants with provenance (lines 14 to 23); `FIELD_PREFIX` (line 34), which becomes built from `DELIVERABLE_FIELD_LABELS` and `PARKED_LABEL`; the `Read by:` branch (lines 181 to 199), which the park branch copies; `deliverableClaims` (lines 75 to 93); `isMadeAndReadByCode` (lines 103 to 107); the per-capability count (line 202); the count line (line 242).
- packages/nana-pack/lib/handoff-asks.mjs — line 11, the repo's one parked form `[parked, since <YYYY-MM-DD>]` with a shape-only date.
- scripts/requirements-moved.mjs — `rowSnapshot` (lines 56 to 62) and the `Made by/Read by lines changed` entry (line 158).
- scripts/product-report.mjs — the claims render (lines 346 to 355), unchanged.
- packages/nana-pack/tests/requirements-deliverables.test.mjs — `notesFor` and `tree` (lines 40 and 41); R-2537's `expectNote` table, its `outside` fixture and its sealed-constant check (lines 126 to 159).
- packages/nana-pack/tests/requirements-tree.test.mjs — R-2541's three-mode count check (lines 442 to 452) and the copy list of scripts and pack libs (lines 410 to 413).
- packages/nana-pack/tests/requirements-regroup.test.mjs — `mirrorScripts` (lines 209 to 216), the second copy list.
- packages/nana-pack/tests/product-report.test.mjs — R-2542's claims-in-order check (lines 1180 to 1234).
- packages/nana-pack/tests/requirements-moved.test.mjs — R-2540's `deliverableBase`, `treeMovement` and `changedIn` (lines 233 to 258).

## Seat decisions

- **D1 · A park is its own line kind** (draft D1). `Parked: <row> · since <YYYY-MM-DD>: <reason>`, in the listing capability's own span beside that row's maker and reader lines. Optional, never a required label.
- **D2 · Date and reason required; shape only** (draft D2; attack N6). The checker reads `since` and a `\d{4}-\d{2}-\d{2}` shape, not a calendar date. Exactly two parts, as the `Read by:` branch. Runs of spaces around the separator, `since`, the date and the colon are honest variation and still park. Each malformed park line gets one note and parks nothing.
- **D3 · The count line counts rows** (draft D3; attack S2). `deliverables: <live> of <listed − parked> made and read by code, <parked> parked`, where `<parked>` counts parked rows, not park lines. With no parked row the line is byte for byte today's. `checkDeliverables` returns a new `parkedDeliverables` field; `checkedDeliverables` keeps meaning "listed".
- **D4 · A stale park counts as live** (draft D4; attack S6). A parked row that the count line counts as made and read by code (`isMadeAndReadByCode`, unchanged) counts as live, not parked, and gets one note per row naming its first park line: `<row> Parked: line <n> parks nothing; code makes and reads it`. Line order does not matter.
- **D5 · Unparking, and the reopen anchor** (draft D5; attack M1, taken). Delete the park line in the change that reopens the work. Each of the eight reasons ends with "reopening the desk deletes this line". HANDOFF's desk line under Where things stand gains one sentence: its eight deliverables are parked, and reopening the desk deletes their park lines. The movement report lists each added, removed or changed park line as `Parked lines changed`, separately from maker and reader changes.
- **D6 · The Product view** (draft D6; attack S4). No product-report change; each park line is one more claim under its deliverable, in ledger order. R-2642 and its known limit are homed in FEAT-039, beside R-2542 and R-2543.
- **D7 · The desk and app rows only** (attack S1). The lane parks R-406, R-422, R-457 (CAP-05) and R-437, R-260, R-256, R-257, R-264 (CAP-06). The six study rows (R-509, R-532, R-507, R-535, R-536, R-694) stay counted, and R-694 stays on CAP-08's list: no ruling covers them, and parking without one hides gaps from the count the owner made top priority. HANDOFF gains one optional ask for them, default keep counted.
- **D8 · R-2541 narrows** (draft D8; attack S6). Its cell's last words become "out of all listed deliverables, less those a `Parked:` line holds back (R-2639)". Its test stays unedited and green.
- **D9 · Which side reads park lines** (attack S7). `FIELD_PREFIX` widens, so `deliverableFieldLinesByRow` returns maker, reader and park lines; its doc comment says so. `rowSnapshot` splits them by label: maker and reader lines feed the existing entry, park lines feed `Parked lines changed`.
- **D10 · Both movement reports** (attack S3). This lane's review brief and land carry the AGENTS.md command's output (main's script, which ignores park lines) and the worktree's own `node scripts/requirements-moved.mjs --root . --base main`, and say why they differ.
- **D11 · Left out** (draft D10, trimmed): an expiry or age check, a calendar check, a parked mark in the Product view, a reason holding ` · `, the parked count at session start, rewriting the desk and stage maker lines, the shared template's organization text.

## Must-meet rows

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2639 | WHEN a listed deliverable that code does not both make and read carries a readable `Parked:` line, the tree checker shall, in every mode, leave that row out of the count line's total once and end that line with `, <n> parked` counting parked rows. | `packages/nana-pack/tests/requirements-tree.test.mjs::R-2639: a parked deliverable leaves the count's total once and the line names the parked row count in every mode` |
| R-2640 | IF a `Parked:` line lacks the separator or has a third part, names a row its capability does not list, lacks `since` and a YYYY-MM-DD date before a colon, has no reason after that colon, or sits outside a live `Kind: product` capability, THEN the deliverable check shall report one note naming the row or the line in place of parking the row. | `packages/nana-pack/tests/requirements-deliverables.test.mjs::R-2640: an unreadable or misplaced Parked line gets one note and parks nothing` |
| R-2641 | WHEN a deliverable with a readable `Parked:` line is one the count line counts as made and read by code, the deliverable check shall report one note naming the row and its first `Parked:` line, counting the row as made and read by code, not parked. | `packages/nana-pack/tests/requirements-deliverables.test.mjs::R-2641: a parked deliverable that code makes and reads counts as live with one note naming its Parked line` |
| R-2642 | WHEN a live product capability lists a deliverable that carries a `Parked:` line, the product report's Product view shall list that line among the deliverable's claims in ledger order. | `packages/nana-pack/tests/product-report.test.mjs::R-2642: the Product view lists a deliverable's Parked line among its claims in ledger order` |
| R-2643 | WHEN a row's `Parked:` lines differ between the base and the tip, the tree movement report shall list one entry for that row naming `Parked lines changed`. | `packages/nana-pack/tests/requirements-moved.test.mjs::R-2643: the movement report lists a row whose Parked line was added, removed or reworded` |

R-2639, R-2640, R-2641 and R-2643 are homed in FEAT-028; R-2642 in FEAT-039. R-2644 and R-2645 stay unused.

### What each test does, and why it is red on main

- **R-2639.** In the R-2541 block, a ledger lists R-001 to R-004. R-001 is made by `suite` and read by `code`. R-002 (`manual`, `person`) carries two readable park lines with different reasons; R-003 (`suite`, `rule`) carries one; R-004 (`manual`, `person`) none. In `--root`, `--write` and `--check`: exit 0 and exactly one line `deliverables: 1 of 2 made and read by code, 2 parked`. A second ledger with one deliverable, parked, expects `deliverables: 0 of 0 made and read by code, 1 parked` under `--root`. Red on main: `deliverables: 1 of 4 made and read by code`.
- **R-2640.** With `notesFor` and `tree`, each case adds one park line to `Made by: R-001 · manual: owner` and `Read by: R-001 · person: owner`, and expects exactly one note holding its fragment and `parkedDeliverables === 0`: `Parked: R-001 - since 2026-10-22: held` (`cannot read Parked:`); `· 2026-10-22: held`, `· since 22-10-2026: held`, `· since soon: held` (`needs a since date`); `· since 2026-10-22` and `· since 2026-10-22:   ` (`needs a reason`); `· since 2026-10-22: held · more` (`cannot read Parked:`); CAP-01's span holding `Parked: R-002 …` while CAP-02 lists R-002 (`names an unlisted deliverable`, R-002 not parked); a park line on a constraint capability and one on a kindless capability, as R-2537's `outside` fixture (`outside a live Kind: product capability`). Guards: `Parked: R-001 · since 2026-10-22: the owner holds it` and `Parked: R-001  ·  since  2026-10-22:  the owner holds it` each give no note and `parkedDeliverables === 1`; lowercase `parked:`, `**Parked:**`, `- Parked:` and a park line under the feature heading give no note and park nothing. Seal: `PARKED_LABEL === "Parked"` and `PARKED_SINCE === "since"`. Red on main: every bad case gives zero notes and `parkedDeliverables` is undefined.
- **R-2641.** R-001 is made by `suite: scripts/make.mjs` and read by `code: scripts/make.mjs`, both tracked. Case one puts the park line above the maker line; case two below the reader line; case three carries two park lines. Each expects exactly one note holding `R-001`, `Parked: line <n>` (the first park line) and `parks nothing`, with `madeAndReadByCode === 1` and `parkedDeliverables === 0`. `deliverableReportLines`, with a git runner that lists the tracked paths, prints `deliverables: 1 of 1 made and read by code`. Red on main: no note.
- **R-2642.** A product capability lists R-6000 and R-6001. R-6000's lines in order: `Made by: R-6000 · manual: a person makes it`, `Parked: R-6000 · since 2026-10-22: the owner holds it`, `Read by: R-6000 · person: a person reads it`. R-6001 is `manual`/`person` with no park. R-6000's claims equal those three texts after the row ID, in order, with both code marks; R-6001's hold no park line. The Product view's count line is `deliverables: 0 of 1 made and read by code, 1 parked`. Red on main: two claims and `0 of 2`.
- **R-2643.** Base is R-2540's `deliverableBase`; the head adds `Parked: R-001 · since 2026-10-22: the owner holds it` after its reader line. One R-001 entry holding `Parked lines changed` and not `Made by/Read by lines changed`. Head to base (an unpark) gives the same entry; a head with the reason reworded gives the same entry; head to head gives `tree movement: none`. Red on main: `tree movement: none`.

Existing tests made false: none expected. R-2537's seal stays unedited; the R-2538, R-2541, R-2542 and R-2543 fixtures hold no park line; R-2540's entry text is unchanged.

## Tunables

- `PARKED_LABEL = "Parked"` in scripts/deliverables.mjs. Contract: the owner's 2026-10-22 answer "Park them"; R-2640. Pinned by R-2640's seal.
- `PARKED_SINCE = "since"` in scripts/deliverables.mjs. Contract: HANDOFF's parked-ask form (handoff-asks.mjs line 11, R-878); R-2640. Pinned with `PARKED_LABEL`.
- `FIELD_PREFIX` is built from `DELIVERABLE_FIELD_LABELS` and `PARKED_LABEL`, so retuning a label changes no code (attack N3). The suffix `, <n> parked` and the entry `Parked lines changed` are their rows' contract text, inline beside today's inline count line and entry text.

## Known limits (the seat writes them before the final round)

FEAT-028:
- Deliverable lines (park-deliverables, plan): the checker reads only a park date's shape, so an impossible date such as 2026-02-30 parks, as HANDOFF's ask tags do.
- Deliverable lines (park-deliverables, plan): anyone who edits the ledger can park a row. The checker proves the line's shape, not the owner's decision; the movement report shows each park to the reviewer.
- Deliverable lines (park-deliverables, plan): a park never expires, and nothing flags an old one. Reopening the desk relies on the park reasons and HANDOFF's desk line naming the step.
- Deliverable lines (park-deliverables, plan): a park reason cannot hold ` · `; such a line gets a "cannot read" note and parks nothing.
- Deliverable lines (park-deliverables, plan): lowercase `parked:`, `**Parked:**`, `- Parked:`, or a park line under a feature heading or inside a code fence is prose and gets no note; the row stays counted.
- Deliverable lines (park-deliverables, plan): a park takes its row out of the count's total, so the ratio rises with no work done. The suffix and the movement report are the only signals.
- Deliverable lines (park-deliverables, plan): the desk and stage maker and reader lines still say "desk frozen since 2026-10-10" instead of naming the run that makes each deliverable.
- Deliverable lines (park-deliverables, seat): R-694's writing trial closed on 2026-10-21, yet R-694 stays a listed deliverable that code does not make and read.
- Movement report (park-deliverables, attack): the AGENTS.md command runs the main checkout's script, so a lane that adds the first park lines shows none of them there.

FEAT-039:
- Product view (park-deliverables, plan): a parked deliverable keeps both code marks and shows its park line as a claim; the view has no parked mark.

## Wrong-code pairs (the seat runs each; it must turn its test red)

Match each red test by its full title; R-2538's and R-2541's titles carry no ID prefix (attack N1).

1. Parked rows stay in the total; only the suffix is added: R-2639.
2. Parked rows leave the total, but the suffix is not printed: R-2639.
3. The suffix prints `, 0 parked` when nothing is parked: R-2541 and R-2538 (exact count lines), R-2543.
4. A park line with no `since` date parks its row: R-2640.
5. A park line with an empty reason gets its note but still parks: R-2640.
6. The date's shape is not checked, so `since soon:` parks: R-2640.
7. Park lines are gathered from every capability, so another capability's park line parks the row: R-2640.
8. A park beats live: a row made and read by code with a park line counts as parked: R-2641.
9. The stale-park note is given, but the row still counts as parked: R-2641.
10. The stale check runs while the lines are scanned, so a park line above the maker line is missed: R-2641.
11. `Parked` joins `DELIVERABLE_FIELD_LABELS`, so it becomes a required line: R-2537 and R-2539.
12. `deliverableClaims` leaves park lines out: R-2642.
13. Park claims are listed after the maker and reader claims: R-2642.
14. The movement report folds park lines into the maker and reader comparison: R-2643.
15. The movement report ignores park lines: R-2643.
16. The parked count counts park lines, not rows: R-2639 (attack S2).

## Docs and lines that change

- **README.md, the tree checker paragraph (line 71).** After "…or names a path not tracked at HEAD", add: "and its count line leaves out a deliverable held by a `Parked:` line, then says how many it holds". Change "— no outline, just its problems or a `0 problems` line" to "— no outline, just its problems, or a `0 problems` line followed by any deliverable count and notes", and delete the matching FEAT-028 known-bug line.
- **packages/nana-pack/skills/requirements/SKILL.md (line 127).** Append: "A deliverable the owner holds back carries `Parked: <row> · since <YYYY-MM-DD>: <reason>`. The date is the day of the owner's decision, and the reason says what holds it and what reopens it. The count line leaves a parked deliverable out of its total and ends with `, <n> parked`. A parked deliverable that code makes and reads still counts as made and read by code, with a note. Unpark by deleting the line; the movement report lists each added, removed or reworded `Parked:` line." At line 129, "its written maker and reader claims" becomes "its written maker, reader and `Parked:` claims".
- **Module headers.** `deliverables.mjs` and `requirements-moved.mjs` `@outputs` change; `npm run map` is required.
- **REQUIREMENTS.md.** R-2541's cell narrows (D8). R-2639 to R-2643 go in their features, `implemented` with evidence once their tests pass. Eight park lines, each directly after its row's last `Read by:` line:
  - R-406, R-422, R-457 (CAP-05) and R-437 (CAP-06): `Parked: <row> · since 2026-10-22: the owner froze desk work on 2026-10-10 until the owner reopens it; reopening the desk deletes this line`
  - R-260, R-256, R-257, R-264 (CAP-06): `Parked: <row> · since 2026-10-22: the stage runs only in app sessions the desk starts, and the owner froze desk work on 2026-10-10; reopening the desk deletes this line`
- **docs/requirements-tree.md.** Regenerated (`npm run req:tree -- --write`).
- **HANDOFF.md (seat, at notes).** The desk line under Where things stand gains: "Its eight deliverables are parked; reopening the desk deletes their park lines." Next item 3 drops the parking sentence. One optional ask: the six study deliverables stay counted; park the five idle bench ones? Default: keep counted. Then `nana-writing HANDOFF.md`.

## Seat steps

- Cut `feat/park-deliverables` at `~/nana-pi-wt/park-deliverables` from main when a build slot frees. Build with the small builder. The brief carries the Feature line and a Precedent section and passes brief-check.
- After the build: the per-build escape check, seat titles, the sixteen pairs on the shared runner, then the four named test files whole.
- Run `node scripts/requirements-tree.mjs --check` and read it: expect `deliverables: <live> of <listed − 8> made and read by code, 8 parked` and no note. The attack measured, by what lands first: build-records `15 of 32`, session-start-frontier `15 of 31`, both `16 of 32` (inferred), neither `14 of 31`. Run `npm run report` and read the CAP-05 and CAP-06 cards.
- Before the final round: the known-bug lines, the HANDOFF edits and the session entry with the before and after count lines. Carry both movement reports (D10) in the review brief and the land.
- One final reviewer from another model family, on the exact tip that lands. CI on the draft PR, Windows leg included.
