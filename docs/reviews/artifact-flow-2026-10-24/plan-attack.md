# artifact-flow · adversary pass on the must-meet (2026-10-24)

Read at main 0943299b and lane 2's tip 6ea795eb, with lane 3's must-meet and verified entry table. The numbers below come from a read-only script. It applied this must-meet's rules to the 46 entries on main plus lane 3's 33 entries and 100 `Reads:` lines. Result: 48 flow lines over 20 capability pairs, 36 reads inside one capability, 21 entries in the first list and 38 in the second.

## MUST

1. **MUST: "against stage order" by document order contradicts the ledger.**
   - Evidence: amendment 3 says "Product capabilities are ordered stages only when a later step needs an earlier stage's checked artifact; otherwise they are loops, tool families or services" (packages/nana-pack/skills/requirements/SKILL.md:134).
   - nana-pi has no `Needs:` line (`grep -c '^Needs:' REQUIREMENTS.md` gives 0). R-2444 (REQUIREMENTS.md:2104) uses heading order only to stop Needs cycles.
   - With lane 3's table, 16 of the 48 lines get the mark. 13 of those carry a hand-written entry: A-011 twice, A-069, A-014, A-046, A-062, A-061, A-023, A-071, A-030 (the ledger), A-036, A-037, A-038.
   - So the page tells the owner that a third of the capabilities' ties run backward, when the ledger never put them in order. A retired product capability also counts as "product" under l4-must-meet.md:22, but R-2444 excludes it.
   - Replace l4-must-meet.md:22 with: "**No stage mark.** The ledger orders product capabilities only through `Needs:` lines (requirements skill, amendment 3). This ledger has none, so a flow line carries no stage-order mark. A later lane may mark a line whose maker capability needs the reader capability, directly or through other `Needs:` lines, once a ledger carries them."
   - Replace R-2800 with: "The Artifacts view shall list one flow line per distinct maker capability, reader capability and entry where a `Reads:` line crosses capabilities, naming every reading feature under the reader capability and carrying no stage-order mark, and the tree checker shall report no problem for a read from a later capability to an earlier one. Test: `R-2800: the flow lists one line per cross-capability read, and a read toward an earlier capability adds no mark and no tree problem`." Drop the two mark red cases. Keep the other three, and add item 5's case.
   - If the seat keeps a mark, use: "marked `against stage order` when the maker capability needs the reader capability, directly or through other `Needs:` lines". Add the red case: "in a ledger with no `Needs:` line, a read from a later product capability to an earlier one carries a mark".

2. **MUST: the second list's heading is false for some entries, and its rationale overstates the priority's queue.**
   - `manual` means no nana run makes the entry. It does not mean a person made it by hand.
   - pi writes A-010 and A-023 (REQUIREMENTS.md:796, :1780). pi writes A-064's entries. Claude Code writes A-062's entries and part of A-061 (l3-entry-table.md, Table A).
   - Of the 38 entries the list would hold, 12 are text a person writes on purpose and reviews in every lane: A-003 (HANDOFF.md), A-030 (REQUIREMENTS.md), A-005, A-024, A-036, A-037, A-038, A-049, A-051, A-058, A-079 and A-080.
   - l4-must-meet.md:26 calls these "the ones the priority calls built once and left to go stale". The 10-22 ruling targets a hand-run maker of a produced artifact, which these are not.
   - The test title at l4-must-meet.md:45 says "no run makes", so it already disagrees with the heading.
   - Replace l4-must-meet.md:26 with: "`Read by code, made by no nana run`: live entries whose run is `manual` and that some feature's `Reads:` line names, or that a deliverable with a code or prompt reader names directly or through `built from:`. Each item reads `A-nnn · <name> · <class> · manual: <reason>`, so the owner can tell a hand-run command from a hand-written source or a store another tool writes. The list does not call them stale."
   - In R-2801, replace "under `Read by code, made by hand`" with "under `Read by code, made by no nana run`, each with its class and manual reason,". Add the red case: "an item in the second list shows no manual reason".

3. **MUST: nothing says what a `Reads:` line naming a retired or unknown entry shows, and R-2802 rules out the right output.**
   - The threat model names "a retired entry" (l4-must-meet.md:13). Lane 3 gives such a line a note (l3-must-meet.md:36), but a note never stops another project's page.
   - A retired entry stays in `registry.byId` with its `featureId` and `capabilityId` (scripts/deliverables.mjs:166 in lane 2). A builder who looks it up there draws a flow line for a retired artifact. A builder who reads `.featureId` off `byId.get("A-999")` throws, and the page fails.
   - R-2802's red case "a read shows no maker" turns `no live entry` into a failure.
   - Lane 2 already settled this case: R-2790 shows `artifact A-nnn · no live entry`, with the red case "a claim naming A-999 stops the page".
   - In R-2802, add after "that entry's maker feature": ", or `A-nnn · no live entry` for an ID with no live entry".
   - In R-2800, add after "crosses capabilities": ", drawing no line for a `Reads:` line whose ID has no live entry".
   - Add a red case to R-2800: "a `Reads:` line naming A-999 stops the page, or one naming a retired entry draws a line". Change R-2802's red case to "a read of a live entry shows no maker".

## SHOULD

4. **SHOULD: show each flow line's run.**
   - 36 of the 48 lines carry a `manual` entry. Only 12 carry an artifact a nana run makes: A-002, A-004, A-006 twice, A-007, A-009 twice, A-021, A-025, A-034, A-053 and A-054.
   - A-011 (the user pack config) alone gives five lines, CAP-04 to CAP-01, -02, -03, -05 and -07. A-069 gives four more. Each line says the install capability feeds that capability, yet the owner writes the file and install only seeds a missing copy.
   - In l4-must-meet.md:21, make the line form `<run> · A-nnn · <name> · FEAT-x → FEAT-y[, FEAT-z]`, where `<run>` is the entry's run (`manual` or the run name). The capability pair moves to a heading (item 6).
   - Add the red case: "a manual entry's line does not show `manual`".

5. **SHOULD: the red cases let realistic wrong builds pass.**
   - R-2800: a build that gives one line per entry, merging every reader capability, passes every listed case when no fixture entry is read under two other capabilities. Add: "an entry read under two other capabilities gives one line".
   - R-2801: a first list built from deliverables alone (the plan's old wording) passes. Add: "an entry that only a `Reads:` line names is listed under the first list".
   - R-2801: a second list that ignores the reader kind passes. Add: "a manual entry named only by a deliverable whose readers are person or rule is listed under the second list".
   - R-2799: only a built-from deliverable is covered. Add: "a deliverable that names the entry directly is missing".

6. **SHOULD: the must-meet does not set the view's order, grouping or layout, and the phone page needs them.**
   - The view holds 79 entry rows, 48 flow lines and 59 list items. An entry row has up to nine fields. A-011 alone has 13 reader paths and four deliverables.
   - If the rows come first, the flow and the lists sit far down a phone page. An estimate is several hundred lines.
   - A nine-column table would be unreadable at 360px. The template only sets `overflow-wrap:anywhere` under 600px (scripts/product-report/template.html:11).
   - The one-line flow form carries two arrows and two capability labels, about 170 characters.
   - Add after l4-must-meet.md:19: "**Layout.** The view shows, in order: the flow, under one `CAP-a · <label> → CAP-b · <label>` heading per capability pair (Product view capability order, then reader capability order, then A-ID); the two lists; then one card per entry with one labelled line per field, like the requirement cards. No table. Feature IDs link to their detail views. A-IDs are not hash links, because an unknown hash falls back to Decisions (scripts/product-report.mjs:358)."
   - With lane 3's table, that gives 20 headings over 48 short lines.

7. **SHOULD: give the exact texts, as lane 2's must-meet did.** Otherwise the test and the seat's pairs pin whatever the builder picks. "Read by" would also clash with the deliverable `Read by:` claim label on the same page. Add these to the seat decisions:
   - Entry card: the heading `A-nnn · <name>`. Then `Class: <class>: <location>` and `Age: <age>`. Then `Made in: FEAT-x · <label> · <run>: <writers>`, or `· manual: <reason>`. Then one `Read in: FEAT-y · <label> · <reader paths>` per `Reads:` line. Then one `Deliverable: R-a · names it` or `Deliverable: R-a · built from it` per deliverable. Use `Read in: none` and `Deliverable: none` when a list is empty.
   - First list: the heading `Artifacts no other feature reads and no deliverable names`, then `Its maker or a person may still read it.` Today's heading is narrower than its rule: A-031 has no other reader and is still left out, because R-291 names it. Change R-2801 to match.
   - Feature detail: `Registers: A-nnn · <name>[, …]` or `Registers: none`. Then `Reads: A-nnn · <name> · made in FEAT-x[, …]` or `Reads: none`. Both read `no artifact registry` in a ledger that has none.

## NOTE

8. **NOTE: R-1012 holds.**
   - All three age-table entries already have a claim: A-006 (REQUIREMENTS.md:454), A-032 (:2060) and A-033 (:2071). So aging every live entry reads no new clone store here. Every other entry is either tracked, which git fixes per commit, or shows `age not measured`.
   - Cost: the history walk stays one call (scripts/product-report.mjs:270). It took 0.15 s over 2821 commits on this Mac. Each tracked entry adds one `rev-list --count` (:281), about 17 ms each here and slower on Windows. That is about 30 more process starts.
   - At l4-must-meet.md:20, write "in the one `artifactAges` call the deliverable blocks use". A second call would double the walk. The red case on differing ages cannot catch it, because both calls give the same text.

9. **NOTE: these edge cases resolve themselves.**
   - An `Artifact:` line in a subgroup span gets a note and is dropped (scripts/deliverables.mjs:141). It never has a maker capability, so it never appears.
   - An entry in a frozen feature is live and drawn like any other. Seven desk features are frozen.
   - A kindless end cannot occur. Neither entries nor `Reads:` lines are read under a kindless capability (l3-must-meet.md:29), so "kindless end" in l4-must-meet.md:22 is dead text.
   - An entry in a retired feature's span stays live (deliverables.mjs:166, :179) and is listed. That is fine, because the checker notes it.

10. **NOTE: "names" in R-2801's second-list clause is ambiguous.** R-2799 says "names it or is built from it". In nana-pi the output does not change, because every built-from entry has a `Reads:` line or an automatic run. In another project with no `Reads:` lines, it would change. Item 2's text settles it.

11. **NOTE: lane 3's known limit contradicts this one.** Lane 3 says "lane 4's flow view reads both" (l3-must-meet.md:86). This must-meet draws only `Reads:` lines (l4-must-meet.md:70). Fix lane 3's line before its final round: "A feature's `Read by:` paths on its deliverables and its `Reads:` lines overlap; lane 4's flow view draws only `Reads:` lines."

12. **NOTE: the docs that change are not listed.**
    - The pack README's Product view paragraph and the skill's product report paragraph (SKILL.md:129) describe the views.
    - The `@outputs` header of `product-report.mjs` changes, so `map:check` applies.
    - Add a "Docs that change" line naming all three.

13. **NOTE: page size is fine.**
    - The 79 entries and 100 reads come to about 22 KB of ledger text. The view adds tens of KB to a 2.07 MB page (l2-page.html).
    - The phone rule already wraps long paths and the CI location. `text()` finds no `**` or backtick in any location or reason, so nothing renders as bold or code by accident.

14. **NOTE: subtraction.**
    - These parts earn their cost: R-2799's ages for every entry, R-2802, and the first list. The first list holds the one true orphan, A-059, and the hand-run study outputs.
    - The second list earns its place only with item 2's reasons. Without them, it lists 38 of 79 entries and reads as if half the registry were stale.
    - The stage mark does not earn its place in a ledger with no `Needs:` line (item 1).

Counts: 3 MUST, 4 SHOULD, 7 NOTE.
