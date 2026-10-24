# Plan: the artifact model (registry, page states, feature artifact lines)

Snapshot: main at fc06e29d. Today the checker prints `deliverables: 18 of 22 made and read by code, 19 parked`. 9 of the 41 deliverables show an age, and 32 show "no artifact named" (audit export `report-data.json`).

## 0. Split: four one-feature lanes instead of the seat's two

The seat's lane 1 changes rows in both FEAT-028 and FEAT-039. Four rules and facts block that:

- AGENTS.md:95 says "a lane is one feature".
- REQUIREMENTS.md:42-43 says "a builder adds or changes rows only in the feature its brief names".
- The deliverable-fields plan already turned down a lane spanning both features for this reason (plan-draft.md:32, D6).
- The tests are coupled across the two features. The R-2536 test (FEAT-028) pins `runtime-map` as a passing artifact (requirements-deliverables.test.mjs:89,113). That exemption belongs to R-2743, which is homed in FEAT-039 (REQUIREMENTS.md:2559).

The order below lets each lane land without breaking the page and without redoing an earlier lane's work.

| Lane | Feature | Content | Depends on |
|---|---|---|---|
| L1 artifact-registry | FEAT-028 | registry lines, classes, checks, references from deliverable claims, migration of all 41 claims, rank-1 corrections, outline, movement report, governance and skill text | — |
| L2 report-names-artifacts | FEAT-039 | three page states, ages by class, the clone-store age table that replaces `MACHINE_LOCAL_ARTIFACTS`, features with no deliverable | L1 |
| L3 feature-artifact-lines | FEAT-028 | feature `Reads:` and `Writes:` lines, the rest of the registry entries | L1 (builds alongside L2) |
| L4 artifact-flow | FEAT-039 | Artifacts view, flow between capabilities, orphans, feature detail | L2, L3 |

L1 can migrate the claims without any page change because the page stays truthful in between. `deliverableClaims` resolves a reference back to the string today's page code expects:

- a tracked entry resolves to its path, which git ages as today;
- a clone-store entry resolves to its old map name, but only when its run and writer match that map entry;
- any other entry resolves to its location, so the page says "age unknown: not tracked at HEAD", which is true.

"Built from" claims carry no artifact, so they keep "no artifact named", which is also true (R-2542). The page code stays as it is (product-report.mjs:688, :226-322).

## 1. Registry form

**Where.** Each entry sits in its maker feature's own span: after `Status:` and `Also applies:`, before the first subgroup heading. The maker feature is the line's position, not a written field. A regroup therefore carries an entry with its maker.

- A dedicated section was rejected because it "fails in place" (deliverable-fields D1(d)).
- The cap-kinds rule that labels are "never read in a feature span" covers the five capability labels only (cap-kinds must-meet.md:30). A new label does not break it.
- Lines are read only under a capability that carries `Kind:`. In kindless and flat trees they stay prose, following cap-kinds must-meet.md:29.

**Grammar.** It reuses the `Made by:` claim parser (deliverables.mjs:207-227):
```
Artifact: A-007 · review round tally · user-home store: ~/.pi/agent/review-ledger.rounds.jsonl · review: packages/nana-pack/bin/review-ledger.mjs
Artifact: A-0nn · <name> · retired: <reason or successor>
```
- **IDs.** IDs run A-001 to A-999 and are allocated in order. They are never renumbered or reused, and a retired entry keeps its ID, as R- and FEAT- IDs do.
- **Run.** The run uses the sealed `MAKER_RUNS` list (deliverables.mjs:21). An automatic run names writer paths; `manual` names a reason.
- **Not fields.** Readers are not on the entry; they live on reading features (L3). Age source is not a field either. It comes from the class, so no second field can disagree with it.

**Code.**
- **Checker.** The registry parse and checks stay in `scripts/deliverables.mjs`. The new purpose sentence is "Parse and check the ledger's deliverable claims and artifact registry and produce the shared checker lines". Keeping them there avoids an import cycle with the claim binding, and `ownFieldLines` (deliverables.mjs:54-69) gains its second caller inside its own module.
- **Notes.** Registry findings print as `deliverable note:` lines. R-2538, R-2543 and R-2730 therefore cover them without a text change. No note becomes a tree problem (deliverable-fields D4).
- **Outline.** It lists one `Artifacts: A-…` line after each feature's Parent line, rendered only when entries exist. The R-2446 historical outlines therefore stay unchanged. Precedent: requirements-tree.mjs:392-399 and :488-498.
- **Lift.** It carries `Artifact:` lines as feature prose. It refuses only `Purpose:`, `Outcome:` and `Status:` prose (requirements-lift.mjs:227-229). Pinned by R-2787.
- **Regroup.** Moving a feature moves its entries with it. A split cannot route single lines; that is a known limit, like the existing line at known-bugs/FEAT-028.md:30.
- **Movement report.** It gains an artifacts section modelled on the capability section (requirements-moved.mjs:100-110, :186-206).

**Governance.** "Who decides" (REQUIREMENTS.md:39-44) gains two items: adding, retiring or moving an artifact entry, and adding or removing a `Reads:` or `Writes:` line. The seat proposes these in the change declaration. The movement report's artifacts section shows them to the reviewer. The owner's 2026-10-24 pick, together with the L1 entry table, approves the 45 day-one entries.

## 2. Classes (sealed)

| Class | Location shape | Checker verifies | Age shown (L2) |
|---|---|---|---|
| `tracked` | repo-relative path, folder ending in `/`, or glob; no `~`, `<`, `\` or `..` | matches at least one file in the HEAD tree | last commit that changed a matching file (R-2544 extended to globs) |
| `clone store` | `<git common dir>/…` | automatic run whose writers are tracked; a location in the age table must match that table entry's run and writer | the table's record reader (runtime map, suite records, build records); otherwise "age not measured: clone store" |
| `user-home store` | `~/…` or `<pi agent dir>/…` | writer paths tracked, or a reason for `manual` | "age not measured: user-home store" |
| `other project` | `<project>/…` | same | "age not measured: other project" |
| `git ref` | `refs/…` | same | "age not measured: git ref" |
| `CI record` | upload or workflow-run name | same | "age not measured: CI record" |

Ages respect R-1012, which says the same commit gives the same page. File times were rejected before (deliverable-fields D2). Tag dates and the gh API depend on refs or the network, which R-1012's condition (REQUIREMENTS.md:2508) does not name.

**Moving `MACHINE_LOCAL_ARTIFACTS`.** Today the map lives at deliverables.mjs:33-37 and binds name → maker and writer (R-2743). After L2 the binding has two links, and both are checked:

- **Claim to entry (L1, R-2783).** The claim's run must equal the entry's run. The claim's code paths must include one of the entry's writers.
- **Entry to table (L2, R-2743 rewritten).** A sealed `CLONE_STORE_AGES` table maps each location to its run, writer and reader. The three current names are those file names without their extensions (report-at-land must-meet.md:55).

M2 stays closed (report-at-land plan-attack.md:47). The land page entry, A-045, is at a location the table does not list, so it never borrows an age.

## 3. Suite rule

R-2730's text stays as it is: any deliverable note fails. What changes is which conditions raise a note.

- **Passes:** a valid reference to an entry of an unageable class.
- **Fails:**
  - an unknown class (R-2781);
  - a location of the wrong shape for its class (R-2781), so an untracked repo path cannot hide in a home class;
  - a tracked entry that matches nothing at HEAD (R-2782);
  - an untracked writer path (R-2782);
  - an unknown or retired ID, or a run or writer mismatch (R-2783).

Rows that change:
- **R-2536 (L1).** The artifact clause becomes "an artifact path that is not a registry reference". L1 also drops the `runtime-map` passing case from R-2536's test; R-2743's test still covers that exemption.
- **R-2743 (L2).** Rewritten as the entry-to-table binding.

Old-style path third parts stay legal for other projects. R-2784 blocks them in this repository.

## 4. The page

**L2: three states per deliverable, plus a list on each card.**
- `artifact A-nnn · <name> · <age or "age not measured: <class>">`, one line per referenced entry.
- `output only, built from A-nnn · <name>, …`
- `artifact not written down`
- Each capability card, product and constraint, gets "Features with no deliverable:". Each feature on it shows its entry IDs and names, or "makes no registered artifact". The list is rendered on the page only and is never a deliverable note.

**L4: Artifacts view (`#artifacts`).**
- One row per live entry: class, location, age, maker feature, features that write it, features that read it, and the deliverables that name it or are built from it.
- **Flow between capabilities:** one line per cross-capability read, from maker capability to reader capability, naming the artifact and both features. An edge to an earlier heading is labelled "against stage order".
- Derived edges are never written as, or checked as, `Needs:`. The R-2444 check (requirements-tree.mjs:293-301) is untouched.
- **Orphans, two lists:**
  - "made, unread": no feature reads or writes it, no deliverable is built from it, and no deliverable naming it has a code or prompt reader;
  - "read, no nana run makes it": a feature reads it and its run is `manual`.
- Expected content: the audit graph (synthesis.json "graph") with the critic's fixes. FEAT-008 does not read the lane-folder copies, and FEAT-022 writes the desk log.

## 5. Migration

**L1 registers 45 entries.** 34 are tied to deliverables (named, or built from). 11 more are made by the 14 features with no deliverable. All 65 of the sweep's lasting artifacts are not registered in L1. L3 adds the roughly 25 more that the graph's reads need, so the total ends at about 70.

| Feature | Entries |
|---|---|
| FEAT-001 | A-001 user objective file (home) |
| FEAT-002 | A-002 handoff store (home); A-003 HANDOFF.md (tracked) |
| FEAT-003 | A-004 knowledge index (home) |
| FEAT-005 | A-005 writing rule (tracked) |
| FEAT-006 | A-006 build records (clone) |
| FEAT-007 | A-007 review round tally (home); A-008 kept review texts (home) |
| FEAT-008 | A-009 main branch (ref) |
| FEAT-009 | A-010 trust store (home) |
| FEAT-013 | A-011 user pack config (home); A-012 Claude hook links (home); A-013 Claude rule links (home) |
| FEAT-014 | A-014 project frontier seeds (other); A-015 rendered copier project (other) |
| FEAT-016 | A-016 desk launch agent (home); A-017 desk log (home) |
| FEAT-017 | A-018 durable state archive (home) |
| FEAT-018 | A-019 win32 copy record (home); A-020 install backups (home) |
| FEAT-019 | A-021 release tag (ref); A-022 ci workflow run result (CI) |
| FEAT-020 | A-023 desk session names (home) |
| FEAT-021 | A-024 desk runtime matrix (tracked) |
| FEAT-023 | A-025 nana journal (home) |
| FEAT-025 | A-026 patched tool results (home) |
| FEAT-026 | A-027 stage block entries (home); A-028 stage keys (home) |
| FEAT-027 | A-029 app session pointer (home) |
| FEAT-028 | A-030 REQUIREMENTS.md; A-031 tree outline (both tracked) |
| FEAT-029 | A-032 runtime map (clone) |
| FEAT-031 | A-033 suite run records (clone); A-034 CI suite records (CI); A-035 mutation records (tracked glob `docs/reviews/*/seat-mutate*output*.txt`, 190+ files) |
| FEAT-032 | A-036 requirements skill (tracked) |
| FEAT-033 | A-037 standards rule; A-038 shared general rows (both tracked) |
| FEAT-034 to FEAT-038 | A-039 schedule, A-040 summary, A-041 probe ledger, A-042 results, A-043 catch-ledger rows, A-044 writing-trial extract (all tracked) |
| FEAT-039 | A-045 land product report (clone) |

FEAT-010, 011, 012, 022 and 030 make nothing of their own.

**Claims (L1), from the audit's per-deliverable table.**

State 1, 29 deliverables:
- R-108→A-002, R-201→A-004 (on the hook claim)
- R-1400→A-011, R-457→A-011
- R-1008→A-007 and A-008
- R-977→A-009, R-2597→A-006
- R-301→A-012 and A-013, R-1150→A-015 (each on its manual claim; the CI claim builds in a temporary home that is deleted)
- R-327→A-014, R-1070→A-022, R-596→A-021, R-159→A-025
- R-260→A-026, R-256 and R-257→A-027, R-437→A-028
- R-291→A-031, R-1014→A-045, R-1272→A-032, R-2547→A-033
- R-616 (CI claim) and R-2632→A-034
- R-1239→A-035 (L2, which brings glob ages)
- R-509→A-039, R-507→A-042, R-535→A-040, R-536→A-043, R-694→A-044

State 2, 10 deliverables:
- R-001←A-001, A-014, A-010
- R-873←A-003, R-217←A-004, R-749←A-005, R-1560←A-007
- R-341←A-012, A-013, A-011, A-010
- R-406←A-023, R-1194←A-011, R-264←A-027, R-1460←A-030

State 3: R-422 and R-532, both parked. The bench's raw evidence is gitignored, and no class covers that.

**Corrections (synthesis modelFixes rank 1):**
- R-536: the reader becomes `code: apps/bench/test/catch-ledger.test.mjs`, and the seat rewrites its park reason.
- R-159: `nana-handoff.ts` and `nana-gate.ts` join its makers.
- R-108: `adoption.mjs` is dropped as a maker.
- R-1400: readers gain `claude-review.mjs` and `nana-roster-notice.ts`.
- R-1272 and R-2597: readers gain `product-report.mjs`.
- R-509 and R-532: the text adds the notes the audit asked for.

R-301's "four rules" is row text in FEAT-013, which this lane does not own. It goes to FEAT-013's known-bug file instead.

**Expected after L1.** The count line is unchanged: `18 of 22 made and read by code, 19 parked`. The corrections only add or drop paths on lines already counted, and R-536 stays hand-made and parked. The same 9 measured ages remain. 19 claims change from "no artifact named" to "age unknown: not tracked at HEAD". 13 claims keep "no artifact named".

**Expected after L2.**
- 29 deliverables in state 1. Of these, 10 have a measured age (R-1239 joins through its glob). The other 19 show "age not measured": user-home 11, other project 2, git ref 2, CI record 3, clone store 1.
- 10 in state 2, and 2 in state 3.
- Of the 14 features with no deliverable, 9 show entries.

## 6. Must-meet tests

**L1 (FEAT-028, after R-2730), test file requirements-deliverables.test.mjs unless noted.**
- **R-2780.** WHEN a feature span under a kinded capability holds an `Artifact:` line, the deliverable check shall read it by its A-ID and report one note for a reused ID, a malformed line, or an `Artifact:` line in a capability or subgroup span. Title "R-2780: an artifact line is read by its ID, and a reused ID, a malformed line or a line outside a feature span gets one note". Red: a second A-003 passes.
- **R-2781.** IF an entry's class is not in the sealed list, or its location lacks that class's shape, THEN the check shall report one note naming the entry. Title "R-2781: an unknown class or a wrong-shaped location gets one note". Red: `user-home store: docs/x.md` passes.
- **R-2782.** WHEN a `tracked` entry matches no file at HEAD, an automatic entry names an untracked writer path, or a `manual` entry has no reason, the check shall report one note naming the entry and the path. Title "R-2782: a tracked entry matching nothing, an untracked writer or a reasonless manual entry gets one note". Red: an untracked `docs/new.md` passes, or a matching glob gets a note.
- **R-2783.** WHEN a `Made by:` third part is `A-nnn[, …]` or `built from: A-nnn[, …]`, the check shall report one note for each ID with no live entry, and for each entry whose run differs from the claim's or, if automatic, shares no writer with the claim's code paths, and no not-tracked note for a valid reference. Title "R-2783: a registry reference resolves under the claim's own run and writer, and a valid home reference gets no not-tracked note". Red: a CI claim naming A-033 passes, or a valid A-002 gets "not tracked at HEAD".
- **R-2784.** Every listed deliverable in this repository's ledger that no `Parked:` line holds shall carry a registry reference or a `built from:` list on a `Made by:` line. Title "R-2784: every unparked deliverable in this repository names an artifact or what it is built from". Red: R-873 without its `built from:` passes.
- **R-2785.** WHEN a feature span holds entries, the outline shall list their IDs on one `Artifacts:` line after its Parent line, while the outlines for c4332ecb, 4b3846ec and 5548d4c2 still equal the committed ones. Test in requirements-tree.test.mjs. Red: the line is omitted, or an old outline changes.
- **R-2786.** WHEN an entry is new, removed, newly retired, under another feature, or has a changed class, location or run, the movement command shall print an artifacts section naming each, and leave its output byte for byte as today otherwise. Test in requirements-moved.test.mjs. Red: an entry moved with its feature is not printed.
- **R-2787.** WHEN an accepted ledger carries `Artifact:` lines, the lift's dry run with no mapping shall exit 0 with a clean proof and keep each line byte for byte under its feature. Test in requirements-cap-kinds.test.mjs. Red: the lift refuses or moves the lines.

**L2 (FEAT-039), test file product-report.test.mjs.**
- **R-2788.** WHEN a product card lists a deliverable, the report shall show one `artifact A-nnn · <name> · <age>` line per referenced entry, or else `output only, built from …`, or else `artifact not written down`. Red: "no artifact named" stays, or a built-from claim shows as an artifact.
- **R-2789.** WHEN a named artifact's class is user-home store, other project, git ref or CI record, or it is a clone store the age table does not list, the report shall show "age not measured: <class>" and read no file time. Red: the page differs after a store file is changed.
- **R-2544, rewritten.** It ages tracked entries by path, folder or glob. Red: a glob shows "not tracked at HEAD".
- **R-2743, rewritten.** The check shall note a clone-store entry whose location is in the age table unless its run and one of its writers match the table entry. Red: A-045 written with writer `test-locked.mjs` shows the suite records' age.
- **R-2790.** Each capability card shall list its features with no deliverable, each with its entry IDs or "makes no registered artifact", never as a deliverable note. Red: a frozen feature is missing, or the list prints a `deliverable note:` line.
- Text-only changes: R-2542, and R-2545, R-2744 and R-2745, which now name the registered store at its location instead of a name.

**L3 (FEAT-028).**
- **R-2791.** A `Reads:` line gets one note for an unknown, retired, repeated or own ID, and for a second line in the same span.
- **R-2792.** A `Writes:` line gets one note for an unknown, retired or own ID.
- **R-2793.** The outline shows `Reads:` and `Writes:` after `Artifacts:`, and the historical outlines are unchanged.
- **R-2794.** The movement report lists features whose reads or writes changed.
- Red for each: an unknown ID passes, or the change goes unreported.

**L4 (FEAT-039).**
- **R-2795.** The Artifacts view lists each live entry with its age, maker, writers, readers and deliverables. Red: a reader through a built-from list is missing.
- **R-2796.** One flow line per cross-capability read, labelled "against stage order" when it runs backward, with the Needs check unchanged. Red: a backward edge is dropped, or it raises a Needs problem.
- **R-2797.** The two orphan lists. Red: an entry read only through a built-from list shows as unread.
- **R-2798.** The feature detail shows the entries the feature registers, writes and reads. Red: writes are omitted.

R-2799 stays free.

## 7. Threat model

In scope is honest variation in our tools' output:
- A store absent on CI: home locations are checked for shape and writer only, never on disk, so CI and the owner's machine give the same notes.
- A home folder that differs per machine: locations are written with `~/` or `<pi agent dir>/` and never expanded.
- A `\` path in a location or writer: one note.
- A CRLF ledger.
- A parked deliverable: state 3 is allowed only with a park.
- A frozen feature: its entries are lines only.
- A regroup that moves a feature, a renamed writer, a shallow clone, or a missing record file: each keeps its existing reason or note.

Deliberate forgery is out:
- a writer path that never writes the artifact;
- a false run;
- a location naming a store that is not there.

## 8. Precedent

- **Grammar and checks:** deliverables.mjs:54-69, 86-108, 207-233 (claims), 159-190 (park parsing), 228-232 (the machine-local binding); `trackedAtHead` in brief-precedent.mjs.
- **Feature-span fields:** requirements-tree.mjs:100-109.
- **Outline:** requirements-tree.mjs:381-417, 438-514.
- **Movement report:** requirements-moved.mjs:56-69, 100-110, 186-206.
- **Page:** product-report.mjs:211-224 (`STORE_READERS_BY_WRITER`), 226-322 (ages), 403-421 (cards), 688.
- **Tests:** requirements-deliverables.test.mjs (`tree()` at :46, the temporary git repo at :69-125, R-2743 at :241-272, R-2730 at :287-300); product-report.test.mjs (R-2542 near :1207-1257; the byte-identical test near :179); requirements-cap-kinds.test.mjs (R-2440, R-2446).
- **Plans:** deliverable-fields (D1, D4); report-deliverables (ages, the walk); cap-kinds (kinded-only reading, historical outlines); report-at-land (M2, S2); park-honestly (the R-2730 runner and its control fixture).
- **Helpers:** none moves to a shared module. L1 exports a new glob matcher from deliverables.mjs. L2 imports it to replace the folder-prefix match at product-report.mjs:257-260, so the logic is not copied.

## 9. Class and builder size

All four lanes are ordinary.
- test-locked.mjs writes the page at each land (test-locked.mjs:186-200), but it is not a listed land tool (AGENTS.md review ladder).
- A page failure keeps the suite's exit code (R-2742).
- report-at-land, which changed that write, was ordinary (must-meet.md:27).
- The seat still runs `npm run report` and reads the land page in L2 and L4.

Builders: L1 and L2 get the larger builder; L3 and L4 get the small one.

## 10. Open questions for the owner

1. Register the seven artifacts of the frozen desk features in L1? These are lines only, with no rows or code. Default: **yes**.
2. Keep release tags and CI records at "age not measured" instead of widening R-1012 to cover tags and network reads? Default: **yes**.

The claim I would most expect to be wrong: that the lift and regroup carry `Artifact:` lines safely under every honest ledger shape. R-2787 pins the lift; the regroup split case is only a known limit.