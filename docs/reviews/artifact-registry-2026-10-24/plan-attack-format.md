**FORMAT AND GOVERNANCE attack: the artifact-model plan at main fc06e29d (2 MUST, 9 SHOULD, 8 NOTE, 9 tests)**

**MUST**

M1. R-2783's binding also covers `built from:` lists, so every state-2 deliverable gets a note and L1 cannot land green.
- Evidence: R-2783's WHEN clause names `built from: A-nnn`. The claim's run must equal the entry's run (plan §2).
- R-001's claims run `session start` and `extension` (REQUIREMENTS.md:88-89). Its inputs A-001, A-010 and A-014 are made by hand, so their run is `manual`.
- R-1560 is `manual` (REQUIREMENTS.md:441), but A-007's run is `review`.
- R-2730 fails the suite on any deliverable note (REQUIREMENTS.md:2070).
- Fix: "The run and writer binding applies only to a named reference. Each ID in a `built from:` list is checked only for a live entry."

M2. The plan claims owner approval that was never given.
- Evidence: the owner decides every change to the tree (REQUIREMENTS.md:39-41). Plan §1 adds artifact entries and Reads/Writes lines to that list. It then says the owner's lane pick "approves the 45 day-one entries".
- The owner picked four lanes, not an entry table. L3's roughly 25 entries and all its Reads/Writes lines are not listed anywhere.
- Fix: add open question 3, "Approve the L1 entry table (45 entries, each under its maker feature)? Default: yes". L3's brief should carry its entry and Reads/Writes table for an owner pick before the build starts.

**SHOULD**

S1. R-2784 does not "block old-style paths in this repository", as §3 claims. It exempts parked rows, and R-509, R-507 and R-535 are parked with path third parts (REQUIREMENTS.md:2568, 2574, 2577). Fix: also require that no `Made by:` line, parked or not, carries a third part that is neither a registry reference nor a `built from:` list.

S2. No check catches one artifact registered twice. R-2780 checks only reused IDs. L3 adds about 25 entries alongside other work, so a double registration is honest variation.
- `~/.pi/agent/...` and `<pi agent dir>/...` are different stores: the review tally deliberately stays at `~/.pi/agent` (review-round.mjs:103). So compare locations as exact strings, never normalized.
- Fix: two live entries with the same class and location get one note.
- The A-007 example names the wrong writer: review-round.mjs:107 writes the tally, not review-ledger.mjs. The binding still passes only because R-1008's claim also lists review-ledger.mjs (REQUIREMENTS.md:439).

S3. The plan says nothing about entries under proposed or retired features. Proposed and retired features hold no rows (REQUIREMENTS.md:45-48, requirements-tree.mjs:206-209), and a retired capability holds only retired features (R-2445). Fix: a live entry in a proposed or retired feature's span gets one note.

S4. R-2786 contradicts itself and leaves gaps.
- Its trigger list has no "maker capability changed", yet its red case is "an entry moved with its feature is not printed". A feature's move to another capability already prints at requirements-moved.mjs:185-190.
- Writer changes are not a trigger, though R-2783 and R-2743 bind on writers.
- The summary line and the "tree movement: none" early return are unspecified (requirements-moved.mjs:210-213), unlike the R-2447 precedent.
- Fix all three. L3's R-2794 should also name the features that read each changed entry, as R-1463 does for shared rows.

S5. "Against stage order" mislabels edges that touch a constraint capability. Stage order exists only among product capabilities (requirements-tree.mjs:299; cap-kinds must-meet.md:24). CAP-03 is a constraint placed between CAP-02 and CAP-04 (REQUIREMENTS.md:759-763), so trust store → R-001 in CAP-01 would read as backward. Fix: label only product-to-product edges.

S6. `Writes:` fails the subtraction test as specified.
- It repeats the entry's writer paths at feature level, and nothing ties the two together.
- The orphan rule "no feature reads or writes it" counts writing as reading. An artifact that features only write would hide from "made, unread".
- Fix: the orphan rule ignores `Writes:`. Either drop R-2792, or state its one purpose: naming co-makers, per the owner's "makes and reads".

S7. The ledger's own description goes stale. Fix: L1 also edits these three paragraphs, besides "Who decides".
- The ID-blocks paragraph (REQUIREMENTS.md:11-13) must declare the A- space.
- The organization paragraph (REQUIREMENTS.md:19-27) lists the span fields and the outline.
- The checks paragraph (REQUIREMENTS.md:62-64) names R-2440 to R-2447 and must add the new rows.

S8. R-2780's notes for capability and subgroup spans must apply only under kinded capabilities. Elsewhere such lines are prose (cap-kinds must-meet.md:29). Otherwise a kindless tree's `Artifact:` prose gets notes.

S9. A regroup moves entries without the owner seeing them. The owner's review page lists only nodes, purposes and outcomes (requirements-regroup.mjs:27, R-1178), so the derived flow edges change unseen. A split routes all of a feature's lines to one successor, because the lift refuses a heading named twice (requirements-lift.mjs:637). Fix: add a known-bug line in L1, as cap-kinds did (docs/known-bugs/FEAT-028.md:30).

**NOTE**

N1. `ownFieldLines` already has three callers (deliverables.mjs:75, 89, 140) and is hard-wired to its label pattern (:44). Pass a label set rather than widening that pattern; widening it would change the field-line count (:141) and add notes outside live product capabilities (:143).

N2. "Avoids an import cycle" is not a reason: a cycle already exists (deliverables.mjs:12 and requirements-moved.mjs:14 import each other). The widened purpose sentence strains the one-purpose rule.

N3. Build the glob matcher on `trackedAtHead` (brief-precedent.mjs:65-69), which deliverables.mjs:11 already imports and product-report.mjs:257-258 copies. Also seal the glob grammar: `*` only, never crossing `/`.

N4. "After Status: and Also applies:" is not enforced: the parser reads those lines anywhere in the span (requirements-tree.mjs:89-109). FEAT-017 and FEAT-019 have no Also applies line. Check the order, or drop the claim and add a Status, Artifact, Also applies case to R-2787's fixture.

N5. Deliverables are allowed only on product capabilities (requirements-tree.mjs:266). So "Features with no deliverable" on a constraint card lists every feature; relabel it there.

N6. "R-509 and R-532: the text adds the notes" must mean the claim lines. Both rows are homed in FEAT-034 (REQUIREMENTS.md:2597, 2607), and editing row text breaks REQUIREMENTS.md:42-43.

N7. A state-1 deliverable's `Read by:` paths already name its artifact's readers (e.g. REQUIREMENTS.md:440). The code map links no path to a feature, so `Reads:` can disagree with them unchecked; record this as a known bug.

N8. Deleting an entry outright makes later ID reuse invisible. Make R-2786's "removed" line an explicit review stop.

N9. R-2792 lacks R-2791's repeated-ID and second-line notes.

**Must-meet tests to add or change**

- R-2783 (change): a `built from:` ID that names a live entry with a different run gets no note, and a named reference with a different run gets one. Red: R-001 built from A-001 gets a note.
- R-2784 (change): no `Made by:` line in this repository, parked or not, carries a third part that is neither a registry reference nor a `built from:` list. Red: R-509 keeps its schedule.json path and passes.
- New, L1: two live entries with the same class and the same location string get one note naming both IDs. Red: a second entry at the same user-home location passes.
- New, L1: a live entry in a span whose Status is proposed or retired gets one note. Red: a live entry under a retired feature passes.
- R-2780 (change): an `Artifact:` line in any span under a capability with no `Kind:` gets no note. Red: kindless prose gets a note.
- R-2786 (change): an artifact-only change prints "0 rows in 0 features, N artifact change(s)" plus a section covering new, removed, retired, feature, class, location, run and writer changes, and never "tree movement: none". Red: a writer change prints "none".
- R-2794 (change): each changed entry line names every feature whose `Reads:` line lists it. Red: a reader goes unnamed.
- R-2796 (change): a read edge touching a constraint capability is never labelled "against stage order". Red: the trust store's edge to CAP-01 is labelled.
- R-2797 (change): an entry that features only write and none reads is listed as "made, unread". Red: a `Writes:` line hides it.