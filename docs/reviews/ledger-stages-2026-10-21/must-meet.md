Feature: FEAT-039 · See the product and its decisions in one report

Class: ordinary. The product report is a script and a generated page. No hook, pi extension, desk, knowledge pull or nana-setup library reads it. Ladder: the seat's wrong-code pairs, then one final reviewer of a different model lineage from the builder.

Chained on lane cap-kinds (based on its branch at f6d08f0f). That lane adds the optional capability lines `Kind:`, `Deliverables:`, `Needs:`, `Binds:` and `Retired:`, their checks, and the parsed values on each capability heading (`heading.capabilityFields`). This lane shows them in the product report's Product view and in a feature's detail view. It lands after cap-kinds.

Owner ruling (2026-10-21) and the amendments this lane serves:
- A product capability is a stage with tangible deliverables. A constraint capability names the stages it binds and carries one tested row per bound stage (amendment 1).
- A deliverable is a row under the feature that produces it. Its consumers are the features that list it on `Also applies:`; a deliverable whose check has not passed shows as a gap (amendment 2).
- Retired capabilities name their successors (amendment 5).

The report is where amendment 1's and 2's gaps become visible; the tree checker does not check them.

Threat model: honest variation in owners' ledgers is in scope: ledgers with no capability field lines at all, partly kinded ledgers, kindless and retired capabilities anywhere in document order, deliverables homed in subgroups, shares from proposed or retired features. Deliberate forgery, such as a crafted ledger meant to break the page, is out. The ledger reaching the report has passed the tree checker, so field values are already valid.

## Must-meet tests

New rows R-2450 to R-2454 go in FEAT-039's table (block R-2450 to R-2459). No new heading. Every row carries exactly one "shall" (the EARS allowance is 0). "Live" means a capability with no `Retired:` line.

| Row | Requirement (EARS) | Test | Red today |
|---|---|---|---|
| R-2450 | The product report's Product view shall show the live `Kind: product` capabilities first, then the live capabilities with no `Kind:` line, then the live `Kind: constraint` capabilities, each group in REQUIREMENTS.md order, with each product capability's card naming the capabilities on its `Needs:` line. | `packages/nana-pack/tests/product-report.test.mjs::R-2450: the Product view orders product, then kindless, then constraint capabilities, in document order within each, and a product card names its needs` | RED. The fixture puts a constraint capability and a kindless capability before two product capabilities in document order, and the later product capability needs the earlier one. The test asserts the card order and the needs text. It also renders the ledger committed at 5548d4c2, which has no capability field lines, and asserts cards in document order, each card's children being exactly the h3, Purpose, Outcome, then (feature line, count bar) pairs, as today. |
| R-2451 | Each live `Kind: constraint` capability's card in the Product view shall list every capability its `Binds:` line names, each with the IDs of the implemented rows homed under the constraint capability that an active or frozen feature under the bound capability lists on its `Also applies:` line, or with a gap mark when there are none. | `…::R-2451: a constraint card lists each bound capability with its implemented shared constraint rows, or a gap` | RED. Cases: bound P1 has a feature sharing an implemented constraint row (covered, row ID named); bound P2 shares only an untested constraint row (gap); bound P3 shares nothing while unbound P4 shares an implemented constraint row (P3 a gap, P4 not listed); a P1 feature sharing an implemented row homed in P2, not in the constraint capability, does not count; a proposed feature under a bound capability sharing an implemented constraint row does not count. Extra assertion: each feature's counts, shared rows, shared-by list and assessment state are identical with and without every capability field line, and `validateStore` returns no problems for a store stamped before those lines were added. |
| R-2452 | Each live `Kind: product` capability's card in the Product view shall list the rows on its `Deliverables:` line in that line's order, each with its status, a link to its home feature and links to the features that list it on `Also applies:`, marking each row whose status is not `implemented` as a gap. | `…::R-2452: a product card lists its deliverables in line order with status, home and consumers, and marks every one not implemented as a gap` | RED. Cases: one deliverable each in `implemented`, `untested`, `planned` and `violated`; one homed in a subgroup, whose home link goes to the subgroup's feature; the `Deliverables:` order differs from ledger order; one deliverable with two consumers and one with none. Only the implemented one carries no gap mark. |
| R-2453 | A feature's detail view in the product report shall name the capability that holds it, and that capability's kind when the capability carries a `Kind:` line. | `…::R-2453: a feature's detail view names its capability, and the kind only when the capability has one` | RED. Cases: a feature under a product capability, one under a constraint capability, and one under a kindless capability, whose line carries no kind and never the text `undefined` or `null`. |
| R-2454 | The product report's Product view shall show each capability carrying a `Retired:` line after every other capability, with a card naming its successors. | `…::R-2454: a retired capability's card comes after every other card and names its successors` | RED. The fixture puts a retired product capability first in document order and a retired kindless capability in the middle; both come last, in document order, each naming its successors. |

## Rules for the build (from the adversary's evidence)

- The page runs `renderInto` through `String()`. Any module-scope helper or constant it references throws in the browser. Compute the grouping, gap marks, coverage and consumers in `buildReport` and carry them on the model. Display strings stay inside `renderInto` (the R-1571 pattern) or arrive on the model.
- Every new check renders through `renderHtmlAt` or `renderPageAt`, never the imported `renderInto`.
- A card's h3 text stays exactly `${id} · ${label}`; no kind badge in it. New card paragraphs go after Outcome and before the first feature line (R-1014's bar adjacency check needs each bar right after its feature line).
- Do not add the capability or its kind to `featureStamp` or to a packet's feature keys. Do not fold constraint rows into a feature's own rows: counts, bars and assessment states stay as today.
- Link only to `#FEAT-nnn`. Capability references (needs, binds, successors) are text: an unknown hash such as `#CAP-02` routes to Decisions.
- A deliverable's status comes from the ledger's row, not from a stamp or a feature's counts.

## Written, not pinned

- The README's product report paragraph and the requirements skill gain one sentence each on the stage view: kinds order the cards, product cards list deliverables with gaps, constraint cards list bound stages with coverage or gaps, retired cards come last.

## Known limits (carried to HANDOFF)

- The order is document order within each group. The report does not sort stages by `Needs:`; the tree checker already requires each need to come earlier in the document.
- Coverage counts only implemented constraint rows shared by active or frozen features. A test that has not run since the last change still counts as covered; the runtime labels under each row show that.
