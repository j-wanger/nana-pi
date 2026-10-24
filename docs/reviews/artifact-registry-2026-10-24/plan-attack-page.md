MUST

1. The desk claims cannot meet R-2783 unless the entries lie about their run. The nana-block entries and patched tool results are written by `packages/nana-stage/extensions/nana-stage.ts`, so their true run is `extension`. The claims on R-260, R-256 and R-257 say `manual: desk frozen` (REQUIREMENTS.md:1886,1889,1892). R-2783 notes any run mismatch, and R-2730 turns that note into a suite failure. So L1 either goes red or registers A-026 and A-027 as `manual`, and L4 then lists them under "read, no nana run makes it". **Fix:** add run and writer columns to the 45-entry table. Register A-026 and A-027 as `extension`, and leave R-260, R-256 and R-257 in state 3; they are parked, which the plan allows. Then restate the after-L2 numbers: state 1 = 26, user-home = 8.

2. The plan claims owner approval the owner has not given. §1 adds artifact entries and `Reads:`/`Writes:` lines to "Who decides" (REQUIREMENTS.md:39-43). It then says the owner's lane pick "approves the 45 day-one entries", but the owner never saw the table. L3's roughly 25 entries and 149 read edges (synthesis graph) have no approval route at all. **Fix:** add owner question 3, "approve the L1 entry table as listed?" (default yes). Either have the seat decide `Reads:`/`Writes:` lines, or route L3's lines to the owner the same way.

SHOULD

3. The own-ID ban produces false orphans. R-2791 notes a `Reads:` line naming the feature's own entry. R-2797 lists an entry as "made, unread" when no feature reads it. A-041, the probe ledger, has no deliverable and is read back only by its maker on resume (audit-report.md:169; graph readers ["FEAT-036"]), so it is always a false orphan. In L3, keys.jsonl and sources.json fail the same way. This contradicts the plan's "expected content: the audit graph". **Fix:** allow own-ID reads, or count the maker's own reads in R-2797.

4. "Against stage order" is undefined for constraint capabilities. CAP-03 is `Kind: constraint` (REQUIREMENTS.md:762), yet its trust store A-010 feeds CAP-01 and CAP-02, which come earlier. R-2444 orders only product stages (REQUIREMENTS.md:2054; requirements-tree.mjs:293-300). **Fix:** label only product-to-product edges, and give any edge with a constraint end its own label.

5. `CI record` has no closed shape ("upload or workflow-run name"), so `CI record: docs/new.md` passes R-2781. That is the very hole R-2781 exists to close. **Fix:** require `<tracked workflow path>#<job or upload name>`.

6. R-2784 does not "block old-style path third parts in this repository". It requires a reference only on unparked rows. Parked rows still carry path third parts (REQUIREMENTS.md:2568-2583), and a second `Made by:` line can still carry one. **Fix:** "no `Made by:` third part in this repository's ledger is a path, and every unparked deliverable carries a reference or a built-from list."

7. The red case for the rewritten R-2743 cannot fail. A-045's location is not in the age table, so no writer value lets it borrow an age. **Fix:** red becomes "an entry at the suite-records location with run `land` and writer `product-report.mjs` gets no note or shows the suite age."

8. The clone-store locations repeat sealed constants as ledger text: `STORE_SUBPATH` (suite-records-config.mjs:20), `DATA_SUBPATH` (runtime-map-config.mjs:42), `BUILD_RECORDS_SUBPATH` (build-records-config.mjs:11) and `LAND_REPORT_SUBPATH` (product-report.mjs:32). If one is renamed, the entry silently drops to "age not measured". **Fix:** build the `CLONE_STORE_AGES` keys from the imported constants. Give a note to any clone-store location that matches none of the four.

9. A glob matcher already exists: `globMatch` at apps/bench/lib/checkers.mjs:89, with `*` staying within one folder. `scripts/` may import it, since code-map.config.json puts `apps/` and `scripts/` in one layer. The 10-22 ruling forbids writing a second one. **Fix:** import or move it, and name that in Precedent.

10. Regroup is unpinned. R-2787 covers only a dry run with no mapping. A regroup moves a feature through the lift's mapping path (requirements-lift.mjs:774-799), which nothing tests, and this is the plan's own most-doubted claim. The regroup owner page shows only purpose and outcome (known-bugs/FEAT-028.md:30), so the owner cannot see entries moving. **Fix:** add a mapping case to R-2787, and record the page gap as a known bug.

11. L3 is not small: about 25 entries plus 149 reader and 15 co-writer edges, each a hand-written claim. If L2 and L3 build in parallel, both edit deliverables.mjs, REQUIREMENTS.md, the outline and SKILL.md. **Fix:** give L3 the larger builder, or start L3 after L2 lands.

12. The frozen-desk question covers only the entry lines. **Fix:** extend question 1 to the claim edits on frozen features' deliverables (R-457, R-256, R-257, R-437, R-406, R-264) and to L3's lines in FEAT-016/020/021/022/024/026/027. Give the numbers for a "no" answer.

NOTE

13. `ownFieldLines` already has three callers (deliverables.mjs:72,89,140). Its `FIELD_PREFIX` (deliverables.mjs:44) needs a parameter before it can read `Artifact:` lines.
14. R-616 → A-034 departs from the audit, which calls R-616 output-only with its kept forms on R-2547 and R-2632 (audit-report.md:119). State why.
15. The audit graph says A-001 is FEAT-013's seed, then written by a person. For nana-pi the governing objective is `~/nana-agent-loop/OBJECTIVE.md`, which is another project's file.
16. The mutation glob matches 226 files at HEAD, not "190+".
17. `templates/_shared/requirements-organization.md:20` is pulled into both templates (R-1153) and is missing from L1's text changes. L2 must rewrite the machine-local sentence at SKILL.md:127.
18. I agree the lanes are ordinary. Both precedents (park-honestly and report-at-land must-meet.md:27) still ran seat pairs. L1 and L2 change what fails every land's suite, so run seat pairs in both.
19. R-2785 drops the independent outline-field check that R-2446 pins (requirements-tree.mjs:438-498; cap-kinds test :206-215).
20. R-2786 skips writer changes, yet a writer change moves the age binding without the reviewer seeing it.
21. L2 deletes L1's resolution shim (references mapped back to the old names); say so in L2's brief. Home stores never get an age, so the stale handoff store (no write since 2026-09-28) stays hidden; record that as a known limit.
22. The cap-kinds citations are one line off: the feature-span rule is at must-meet.md:29, the kindless rule at :28.

Tests to add or change
- R-2783: an entry with run `extension`, referenced from a `manual: desk frozen` claim, gets one note.
- R-2791 and R-2797: a feature may read its own entry, and an entry read only by its maker is not listed as made, unread.
- R-2796: an edge with a constraint capability at either end is never labelled "against stage order".
- R-2781: `CI record: docs/new.md` and `tracked: docs\x.md` each get one note.
- R-2784: no `Made by:` third part in this repository's ledger is a path. Red: R-509 keeping its schedule path passes.
- R-2743: an entry at the suite-records location with run `land` and writer `product-report.mjs` gets one note and shows no suite age.
- New (L2): each `CLONE_STORE_AGES` key equals `<git common dir>/` plus its imported subpath constant. Red: a hand-typed key survives a change to `STORE_SUBPATH`.
- R-2787: a lift whose mapping moves a feature to another capability keeps each `Artifact:` line under that feature, byte for byte.
- R-2785: `checkOutlineFields` reports a dropped or altered `Artifacts:` line.
- R-2789: the page is byte-identical with the home store present and absent, under a temporary HOME.