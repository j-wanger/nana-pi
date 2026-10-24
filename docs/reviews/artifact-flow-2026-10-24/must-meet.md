# artifact-flow · must-meet of record (seat, 2026-10-24)

Feature: FEAT-039 · See the product and its decisions in one report

Written by the seat from the artifact-model plan (`docs/reviews/artifact-registry-2026-10-24/plan-draft.md`, section 4's L4 part and the L4 rows of section 6), the page adversary's item 3 there (`plan-attack-page.md`), lane 2's and lane 3's must-meets, plus one adversary pass on this file (`plan-attack.md`, this folder; 3 MUST, 4 SHOULD, 7 NOTE, all taken). Plans get no review round. Where this file and the plan differ, this file holds.

The owner's decision, 2026-10-24: "Feature artifact lines (Recommended)", which the seat split into lane 3 (the lines) and this lane (the view that draws them). The owner's question was why so many features show no artifact, "since artifacts tie capabilities and features together". Lane 1 numbered each artifact under its maker, lane 2 put it on the page with its age, and lane 3 recorded which other features read it. This lane draws the ties: one view of every artifact, the flow between capabilities, and the artifacts nothing else reads.

Spend line: the current priority (since 2026-10-23), appetite clause 2: the report showing each deliverable's age and real reader.

Stakes: low blast, reversible. The page is advisory; the suite's exit code never depends on it (R-2742). A wrong edge misleads the owner about which stage depends on which.

Threat model: honest variation in our tools' output and in other projects' ledgers is in scope (a ledger with no registry, a kindless tree, a frozen feature, a retired entry, a `Reads:` line naming an unknown or retired ID, a constraint capability); deliberate forgery is out.

Order: builds after lane 3 (feature-artifact-lines) lands; it reads lane 3's `Reads:` parse. Row IDs start at R-2799.

## Seat decisions

- **An Artifacts view.** A new page view at `#artifacts` with a nav link after Product.
- **Layout (attack 6).** The view shows, in order: the flow, under one `CAP-a · <label> → CAP-b · <label>` heading per capability pair (Product view capability order for the maker, then the reader, then A-ID); the two lists; then one card per live entry in A-ID order, with one labelled line per field, like the requirement cards. No table. Feature IDs link to their detail views. A-IDs are not hash links, because an unknown hash falls back to Decisions.
- **Exact texts (attack 7).**
  - Flow line, under its pair heading: `<run> · A-nnn · <name> · FEAT-x → FEAT-y[, FEAT-z]`, where `<run>` is the entry's run, `manual` included (attack 4).
  - Entry card: heading `A-nnn · <name>`; `Class: <class>: <location>`; `Age: <age>`; `Made in: FEAT-x · <label> · <run>: <writers>` or `Made in: FEAT-x · <label> · manual: <reason>`; one `Read in: FEAT-y · <label> · <reader paths>` per `Reads:` line, or `Read in: none`; one `Deliverable: R-a · names it` or `Deliverable: R-a · built from it` per deliverable, or `Deliverable: none`.
  - First list: heading `Artifacts no other feature reads and no deliverable names`, then `Its maker or a person may still read it.`, then one `A-nnn · <name>` item each.
  - Second list: heading `Read by code, made by no nana run`, then one `A-nnn · <name> · <class> · manual: <reason>` item each.
  - Feature detail: `Registers: A-nnn · <name>[, …]` or `Registers: none`; `Reads: A-nnn · <name> · made in FEAT-x[, …]` or `Reads: none`; both read `no artifact registry` in a ledger that has none.
  - An ID with no live entry: `A-nnn · no live entry`, as lane 2's R-2790 does (attack 3).
- **Ages for every live entry, in one call (attack 8).** Lane 2 ages only entries a claim names. This lane ages every live entry in the one `artifactAges` call the deliverable blocks use, through the same class rules and predicate, so the card's age is the deliverable block's age.
- **Flow between capabilities.** One line per distinct (maker capability, reader capability, entry), when a feature's `Reads:` line names a live entry made in a feature under another capability. Two reading features under one capability share one line. A read inside one capability is not a flow line; it shows on the entry's card. A `Reads:` line whose ID has no live entry draws no line.
- **No stage mark (attack 1).** The ledger orders product capabilities only through `Needs:` lines (requirements skill, amendment 3), and this ledger has none, so a flow line carries no stage-order mark. A later lane may mark a line whose maker capability needs the reader capability, once a ledger carries `Needs:` lines.
- **Derived edges are not Needs.** Flow lines are never written as `Needs:` lines and never checked as them; the Needs check (R-2444) is untouched.
- **Two lists, worded for what the ledger knows (page attack 3; attack 2).** Lane 3 leaves a feature's reads of its own entries implicit, so the page cannot say an entry is unread. `manual` means no nana run makes an entry; it does not mean a person made it, and it does not mean stale.
  - First list: live entries that no `Reads:` line names and that no deliverable names directly or through `built from:`.
  - Second list: live entries whose run is `manual` and that some feature's `Reads:` line names, or that a deliverable with a code or prompt reader names directly or through `built from:`. Each item shows its class and manual reason, so the owner can tell a hand-run command from a hand-written source or a store another tool writes.
- **Feature detail.** Each feature's detail view gains the `Registers:` and `Reads:` lines, from the same parse.
- **No registry.** In a ledger with no `Artifact:` line, the view says `no artifact registry` and shows no flow, lists or cards.
- **The model carries the text.** `buildReport` builds every new line into the model; `renderInto` reads no module constant (lane 2 attack 14). The same commit gives the same page (R-1012).

## Must-meet rows (FEAT-039; test file product-report.test.mjs)

- **R-2799.** WHEN the ledger has a registry, the report's Artifacts view shall show one card per live entry, in A-ID order, with its class and location, the same age text the deliverable block shows, its maker feature with its run and writers or manual reason, one `Read in:` line per `Reads:` line naming it with that line's reader paths, and one `Deliverable:` line per deliverable that names it directly or through `built from:`; and with no registry it shall say `no artifact registry`. Test: `R-2799: the artifacts view shows a card per live entry with its class, location, age, maker, reading features and deliverables`. Red cases:
  - a reading feature is missing;
  - a retired entry gets a card;
  - a deliverable built from the entry is missing;
  - a deliverable that names the entry directly is missing;
  - an entry no claim names shows no age;
  - a card's age differs from the deliverable block's age for one entry.
- **R-2800.** The Artifacts view shall list one flow line per distinct maker capability, reader capability and live entry where a `Reads:` line crosses capabilities, under its capability-pair heading, showing the entry's run and naming every reading feature under the reader capability, with no stage-order mark, drawing no line for a `Reads:` line whose ID has no live entry, and the tree checker shall report no problem for a read toward an earlier capability. Test: `R-2800: the flow lists one line per cross-capability read with its run, and a read toward an earlier capability adds no mark and no tree problem`. Red cases:
  - a read inside one capability is listed;
  - two reading features under one capability give two lines;
  - an entry read under two other capabilities gives one line;
  - a manual entry's line does not show `manual`;
  - a `Reads:` line naming A-999 stops the page, or one naming a retired entry draws a line;
  - a read toward an earlier capability raises a tree problem.
- **R-2801.** The Artifacts view shall list under `Artifacts no other feature reads and no deliverable names` each live entry that no `Reads:` line names and no deliverable names directly or through `built from:`, and under `Read by code, made by no nana run`, each with its class and manual reason, each live manual entry that a `Reads:` line names or that a deliverable with a code or prompt reader names directly or through `built from:`. Test: `R-2801: the artifacts view lists the artifacts no other feature reads and the ones code reads but no nana run makes`. Red cases:
  - an entry a deliverable is built from is in the first list;
  - an entry that only a `Reads:` line names is in the first list;
  - an automatic entry is in the second list;
  - a manual entry a `Reads:` line names is missing from the second list;
  - a manual entry named only by a deliverable whose readers are person or rule is in the second list;
  - an item in the second list shows no manual reason.
- **R-2802.** Each feature's detail view shall show `Registers:` with its live entries and `Reads:` with each entry its `Reads:` lines name and that entry's maker feature, or `A-nnn · no live entry` for an ID with no live entry. Test: `R-2802: each feature's detail shows the artifacts it registers and the ones it reads with their makers`. Red cases:
  - the reads are omitted;
  - a retired entry is shown under Registers;
  - a read of a live entry shows no maker;
  - a read of A-999 stops the page.

## Docs that change (attack 12)

The pack README's Product view paragraph and the requirements skill's product report paragraph name the Artifacts view. `scripts/product-report.mjs`'s `@outputs` header changes, so `map:check` applies.

## Precedent

- `scripts/product-report.mjs` — `renderInto`'s views and nav, the Product view's capability cards, the feature detail view, `buildReport`'s model, lane 2's `artifactAges` and `artifactLinesFor`.
- `scripts/deliverables.mjs` — lane 1's `artifactRegistry`, lane 2's `artifactAgeTableKey`, lane 3's `artifactReads` (its `byFeature` map and `reads` list).
- `scripts/requirements-tree.mjs` — the Needs check (R-2444), read only to confirm it is untouched.
- `packages/nana-pack/tests/product-report.test.mjs` — lane 2's R-2790 to R-2794 fixtures, `renderedProduct`, `capabilityCard`, the byte-identical page test (R-1012).

No private helper moves to a shared module.

## Class and builder

Ordinary: the page only; no install, hook, gate or land-tool change. The larger builder, one session. The seat runs wrong-code pairs before the final review and reads the land-written page after the land.

## Known limits (the seat writes them before the final round)

- The page cannot say an entry is unread, because a feature's reads of its own entries are implicit.
- A deliverable's `Read by:` paths are not drawn as flow; only feature `Reads:` lines are.
- No flow line carries a stage-order mark until a ledger carries `Needs:` lines.
- Each tracked entry's age adds one git call, about 30 more process starts per page here.
