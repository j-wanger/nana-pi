# feature-artifact-lines · adversary pass on l3-must-meet.md (2026-10-24)

Read at main 0943299b and lane 2 at feat/report-names-artifacts 809d0571. Counts: 1 MUST, 6 SHOULD, 8 NOTE.
"mm:N" is a line of l3-must-meet.md; "derive:N" is a line of l3-entry-table-derive.md.

## MUST

1. **MUST: two seat decisions conflict on R-001, so the pasted table fails R-2730 on the first run.** "Which feature reads" (mm:23) puts a line only where a feature's own row states the read. "Built-from lists tie to reads" (mm:25) and R-2798 (mm:47) need every built-from entry registered or read in the home feature.
   - R-001 is homed in FEAT-001 (REQUIREMENTS.md:121). Its claims say `built from: A-001, A-010, A-014` (:91-92). A-010 is FEAT-009's entry (:796).
   - Table B gives FEAT-001 only A-011 and A-014 (derive:101-102). Derive doubt 2 drops A-010 on purpose, because the trust rows are FEAT-009's (derive:274).
   - The read is real: `objective.ts:601` calls `trustRecord` for a repo-supplied governing objective, and :602-603 add the trust label to R-001's block.
   - I checked every built-from list against Table B. R-873, R-217, R-341, R-1194 and R-264 are covered, and R-1560, R-406, R-1460, R-1014 and R-1272 are own entries. R-001's A-010 is the only miss.
   - R-2730 (REQUIREMENTS.md:2120) fails the suite on any note, so the builder must choose: edit lane 1's claim, or invent a line. Neither is in the brief.
   Replace the "Which feature reads" bullet with: "**Which feature reads.** A `Reads:` line goes in the span of the feature whose own row states the behaviour the reading code serves. A deliverable row's `built from:` list is such a statement for its home feature: each entry it names that the home feature does not register gets a `Reads:` line there, citing that deliverable row. The entry table cites the row; the checker does not." Add under "The remaining entries": "FEAT-001 gains `Reads: A-010 · packages/nana-pack/lib/objective.ts` (objective.ts:601-603; cites R-001). Before the paste, the seat runs R-2798's rule over Table B against every built-from list at the lane's base and finds no miss."

## SHOULD

2. **SHOULD: R-2798 never defines "home feature", and it does not say one note per what.**
   - Three deliverables sit in subgroup tables: R-108 (FEAT-002 SUB-001), R-873 (FEAT-002 SUB-005) and R-1560 (FEAT-007 SUB-010). The code has two definitions of home: requirements-tree.mjs:196 and :415 use the table's feature or the subgroup's parent; requirements-moved.mjs:49-54 does the same.
   - A builder who reads `row.heading.id` gets SUB-005 for R-873. R-2730 would catch that here, but only because of R-873; no red case does.
   - R-001, R-873, R-217 and R-1194 repeat one built-from list on two `Made by:` lines (REQUIREMENTS.md:91-92, 98-99, 105-106, 1768-1769). One note per line and one note per row are both readings of "one note" (mm:47).
   - R-264 is parked (:1946) and keeps a built-from list (:1944). The row does not say whether parked rows count.
   Replace R-2798's text with: "WHEN a listed deliverable's `Made by:` claims name a live entry in a `built from:` list, parked or not, and that entry is neither registered in the row's home feature (the feature whose span holds the row's table, or that subgroup's parent feature; an `Also applies:` line does not count) nor named on a `Reads:` line in that feature's own span, the deliverable check shall report one note per row and entry, naming the row, the entry and the feature, however many claims name it." Add red cases: "a subgroup-homed row whose built-from entry is registered in the parent feature gets a note"; "two claims naming the same missing entry give two notes"; "a direct `A-nnn` reference to another feature's entry gets an R-2798 note" (R-301, R-1400, R-457 and others name other features' entries directly; REQUIREMENTS.md:442, :1017-1018, :1772).

3. **SHOULD: if `Reads:` lines count toward `fieldLineCount`, a ledger with only `Reads:` lines changes three behaviours, and no named test sees it.** The precedent says the reads parse "shares its one parse" (mm:56). The shortest build adds `Reads` to the label set at deliverables.mjs:62 and lets :134 count it. `registry.fieldLineCount` then switches three things:
   - plain-path third parts become notes (lane 2 deliverables.mjs:393);
   - every unparked deliverable needs a registry reference (:423);
   - the page shows entries in place of `no artifact registry` (lane 2 product-report.mjs:738, R-2794).
   Today's tree checker in `--check` also prints nothing for a ledger whose only field lines are `Reads:` lines unless they count (requirements-tree.mjs:603, R-2538).
   Add a seat decision: "`Reads:` lines are not registry entries. They do not enter `entries`, `byId` or the count that switches registry rules and the page's `no artifact registry` text, but they do count toward the tree checker's print gate (R-2538)." Add to R-2795's red cases: "a ledger whose only registry-like line is a `Reads:` line gets a note for a plain-path third part"; "a ledger whose only field line is a `Reads:` line prints nothing under `--check`." Add R-2538 to "Rows that change text or tests".

4. **SHOULD: an untracked reader can pass without a note.** `deliverableReport` reads HEAD's tree only when `pathsToCheck` is non-empty or `needsTrackedPaths` is set (deliverables.mjs:462). `needsTrackedPaths` looks only at entries (:193). Suppose a ledger's entries are all manual home, project or ref entries, and no claim names a code path. Then its reader paths are never checked, and the R-2795 test misses it, because it calls `checkDeliverables` with paths given (the precedent at test:49). Here deliverables always bring paths, so only other projects are hit. Add to R-2795: "and a `Reads:` line makes the shared report read the HEAD tree, as an automatic writer does." Add a red case: "through `deliverableReportLines`, an untracked reader in a ledger whose only path is that reader gets no note."

5. **SHOULD: nothing pins the new notes to the shared lines that R-2730, the tree checker and the page read.** The R-2780 tests call `artifactRegistry` directly (test:69-82). An R-2795 test written the same way stays green even if the reads notes never reach `deliverableReportLines`. In that case R-2730 passes with nothing checked. Lane 1 closed the same gap with its control ledger (lane 1 must-meet:35; test:436-445). Add: "R-2730 (test change): the control ledger also gains `Reads: A-999 · scripts/x.mjs` in FEAT-001 and yields exactly three registry notes through `deliverableReportLines`."

6. **SHOULD: a `Reads:` line in a proposed or retired feature passes without a note.** That is a stale read by definition, and lane 1 notes a live entry in the same place (deliverables.mjs:175, R-2780). Add to R-2795's list: "a `Reads:` line in a proposed or retired feature's span". Add a red case: "a retired feature's valid `Reads:` line passes."

7. **SHOULD: "malformed" and the outline's ID list are open, and R-2796 lacks two red cases that R-2785 has.**
   - Malformed. Add to R-2795: "malformed: not exactly two ` · ` parts, a first part that is not one A-ID, or an empty reader after splitting on commas."
   - Outline. Add to R-2796: "the IDs of the span's well-formed `Reads:` lines, in document order, each once."
   - Red cases. R-2785's test checks a kindless ledger and an altered line (requirements-tree.test.mjs:267). Add to R-2796: "a kindless capability's `Reads:` line appears in the outline"; "an altered `Reads:` line passes the field check."

## NOTE

8. **NOTE: R-2798 is report-only in other projects.** The tree checker prints notes and exits 0 (requirements-tree.mjs:603-606, :620-621). R-2730 reads only this repository's ledger. No template gates on a deliverable note (`git grep "deliverable note" templates packages/nana-setup` finds nothing). A project with built-from lists and no `Reads:` lines gets new notes, and its suite stays green.

9. **NOTE: the 0943299b fixture already works.** R-2785 reads each revision with `git show` (requirements-tree.test.mjs:259-263). CI checks out with `fetch-depth: 0` (ci.yml:83). I rendered all four revisions with today's code, and each equals its committed outline. 0943299b holds 31 `Artifacts:` lines, so it guards that rendering too. Its ledger and the three older ones hold no `Reads` line. R-2796 should reuse R-2785's history helper rather than copy it.

10. **NOTE: no feature-span parser chokes on the new line.**
    - The lift refuses carried field labels only for Purpose, Outcome and Status (lift.mjs:226-229, :160-171). It carries `Reads:` as prose, and prose mode moves it before the table, still under its feature (:789-796).
    - The regroup parses no field lines. known-bugs.mjs reads only heading IDs.
    - The page's assessment fingerprint hashes rows only (product-report.mjs:70), so the paste leaves no assessment out of date.
    - When a lift merges two features, one span can gain a repeated `Reads:` line or an own read. Add to the known limits: "a merge can repeat or self-read a `Reads:` line; the check notes it."

11. **NOTE: the page lane needs nothing from this lane.** Lane 2 lists a feature's live entries from `registry.entries` (product-report.mjs:737). Keeping reads out of `entries` (item 3) keeps them off the page. The new notes reach the Product view through R-2543, as intended. "Features with no deliverable" (R-2794) still says `makes no registered artifact` for a feature that only reads. That is accurate, and lane 4 draws the reads.

12. **NOTE: R-2797 is testable as written, but the output is open.** The R-2786 test pins `8 artifact change(s)` (requirements-moved.test.mjs:329). Say which of two forms the build uses: reads changes counted inside `artifact change(s)`, or a separate `read change(s)` count. Say that only kinded spans are compared, as `artifactRegistry` does. Say whether reordering the same reader paths counts as a change; lane 1's writer comparison counts order (requirements-moved.mjs:218).

13. **NOTE: export one reads parse from deliverables.mjs.** The renderer, the field check, the movement report and lane 4 all need it. `artifactsByFeature` is already built twice (requirements-tree.mjs:383-387, :448-452), and the 2026-10-22 ruling says a second caller imports. Name this in the Precedent section.

14. **NOTE: the must-meet has no Tunables section, though lane 1's had one.** The `Reads` label is a contract value. Define it next to `ARTIFACT_LABELS` (deliverables.mjs:62) with provenance naming R-2795. R-2795's grammar test pins it.

15. **NOTE on subtraction.** Dropping `Writes:` is right. R-2798 earns its cost: one set lookup per built-from ID. R-2796 is the weakest row: the movement report already shows reviewers every reads change, and lane 4 reads the parse, not the outline. Keep it only if someone reads `docs/requirements-tree.md` to see the feature graph. The ledger text the lane adds (organization paragraph, shared template, skill) must not start a line with `Reads:` inside a capability span, or that line is parsed as a field.
