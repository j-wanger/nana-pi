# Should artifacts go in the code map?

## Part 1: For the owner

YOUR CALL: yes, put artifacts in the code map, but show them through the impact command rather than writing them into each file's header.

Your premise half holds. The rules ask each file's header to say what it reads and writes, but nothing ever links those statements across files.

What we checked. Three judges attacked three designs. We also measured how the map and the artifact list overlap.

The result. The map holds 51 of the 55 reader files and 17 of the 18 maker files. Of 48 maker-to-reader pairs, 29 have no import path between them. The impact command cannot see those 29 today. They fall in 11 artifacts, and 2 of those carry a real, unplanned format risk. Twenty-seven of the 79 artifacts name no code file at all, so the map can never hold the whole list. Headers name their artifact clearly in about half the cases.

The trade. Writing artifact numbers into the headers gives you the literal version. The map file would then show them. That costs about 230 hand edits across about 70 files. It also means writing every cross-feature read twice. The impact route keeps one record and changes two code files. It never makes the map go stale. But the map file itself stays silent on artifacts. Neither route catches a file that quietly starts writing a new store.

Recommendation. Build the impact route as one small lane after your readability pause. Add a check that every file in the artifact list exists in the map. Leave the product page alone until your discussion. The route keeps the audit's rule: no check guesses readers from imports.

Why it is your call. You asked for artifacts "in there", and the cheap route puts them in the command, not the map file. Two of three judges gave equal totals to a close variant that can later print artifacts into the map file. Only you can say whether the map file itself must show them.

The claim most likely wrong: that agents will read the extra impact lines rather than skim past them.

*(`nana-writing --report` on Part 1: sentences=29 words=343 over=0 passive=0 banned=0 verdict=1/1 identifiers=0.)*

---

## Part 2: Technical appendix

Everything here was read at main 86c628b9. The land-records worktree was not read, so every A-082 detail is *inferred*. "Rerun" means I ran it today with a read-only node one-liner over the repo's own exports (`repoGraph`, `impact`, `parseLedger`, `artifactRegistry`, `artifactReads`, `isModulePath`, `isIgnored`).

### A. Is the premise right?

**What the map was written for:**
- G-004 (REQUIREMENTS.md:2671): each header states "its inputs (what it reads or is given), its outputs (what it returns, writes or emits)".
- G-009 (:2676): the map "lists every module with its purpose, inputs, outputs, side effects, callers and callees, in a form an agent can read without opening the code."
- G-011 (:2678): blast radius, meaning "transitive callers and callees", by one command.

**What it does not do:**
- No row, README or doc says the map exists for input/output or data-flow tracing across modules. The grounding searched for `data flow`, `traceab`, `input/output` and `i/o trac` and found nothing.
- The generator checks `@inputs` and `@outputs` only for being present and non-empty (template `code-map.mjs:348-367`).
- It prints them as written (:735-736).
- `--impact` walks import edges only (:604-636).

**Verdict:** per-module I/O statements, yes. Linking them across modules, never.

### B. Recommended design

The recommendation is Design 3 ("separate-maps"), with three grafts the judges proposed. The ledger stays the one record. The impact command joins it to the import graph when it runs. Nothing is stored in `docs/code-map.md` or in headers.

**Stakes:**
- Lane B is low-blast and reversible: printed text, nana-pi only.
- Lane A is medium: heavy REQUIREMENTS.md edits, and R-2730 (:2232) fails every land on any deliverable note.

#### B1. Grammar

**Lane B (impact-artifacts, FEAT-029) adds no grammar.** It reads today's lines:
- `Artifact:` lines, parsed by `scripts/deliverables.mjs:131-204`;
- `Reads:` lines, parsed by `:206-245`.

**Lane A (artifact-readers, FEAT-028) is the audit's lane 1 grammar (report.md:227-234) plus one part.** All of it sits in the maker feature's span:
```
Artifact: A-nnn · <name> · <class>: <location> · <run>: <writers | reason>[ · by: <path>[, <path>]]
    <run> ∈ MAKER_RUNS (deliverables.mjs:25) ∪ {source}
    "by:" only after manual or source: tracked code that writes the artifact when run by hand
Read by: A-nnn · <code|prompt|person|rule|runtime>: <paths | reason>
Parked: A-nnn · since YYYY-MM-DD: <what deletes this line>
Reads: A-nnn · <path>[, <path>]        (unchanged; reader feature's span)
```
- The parse rule "3 or 4 parts" (`deliverables.mjs:150`) becomes 3 to 5.
- The ban on own reads in `Reads:` stays (`deliverables.mjs:237`).
- `Read by: A-` lines do not collide with deliverable `Read by: R-` lines only because they sit in FEAT spans, and `ownFieldLines` stops a capability span at the next heading (`deliverables.mjs:80-96`). Any non-R line inside a capability span is noted (`:396-399`).
- **Why `by:` is needed:** 43 of the 60 `manual` entries are made by a nana module run by hand, across 50 entry–module pairs. Without `by:`, the impact block can never show `steps.mjs`, `project.mjs`, `code-map.mjs` or the bench scripts as writers.

#### B2. Impact block

The block lives in the `scripts/code-map.mjs` shim. Its precedent is `runtimeBlock` (shim :81-100).

**Output format:**
```
artifacts for <path> (<n>):
  writes A-nnn <name> · <maker feature> · <run>[ (by)][ · parked since <date>]
    read by: <path> (<feature>)[ (no import path)]; <kind>: <reason>; …   or "—"
  reads (<k>): A-nnn*, A-nnn, …     * = no recorded writer is in this file's import radius
  one import away (may not touch them): A-nnn via <direct caller|callee>, …
artifact note: built from REQUIREMENTS.md Artifact, Reads, Read by and Parked lines; a read or write with no ledger line is not shown
```

**Placement:** generator output first, then the artifact block, then the runtime block. The two R-1272 tests need this order:
- They take the generator output by stripping the no-data suffix with `endsWith` (`packages/nana-pack/tests/runtime-map.test.mjs:172-174`), then check `startsWith` (:181).
- `NAMED_A` is `scripts/test.mjs` (:151), a registered A-034 writer (REQUIREMENTS.md:2466), so the block is not empty in that test.
- A deterministic block placed before the runtime block keeps the prefix identical in both runs.
- The R-1272 and R-1273 row wording must change to name the block.

**Loading (graft, a precondition):** load the ledger parse with `await import(...)` inside try/catch. On failure, print one `artifact note: … could not be read` line and keep the generator's exit code. Two reasons:
- **R-1278.** The MM9 fixture copies the shim with only today's dependencies (`runtime-map.test.mjs:511-529`). A static import of `deliverables.mjs` would make the fixture's `--impact` exit non-zero, and the check at :561-573 needs status 0. I read this; I did not run it. A caught dynamic import prints only a note, and the check uses `includes`, so it passes (*inferred*).
- **The stderr warning.** Importing the deliverables chain makes Node print `MODULE_TYPELESS_PACKAGE_JSON` (from `requirements-trace.ts`) when the process ends naturally. My rerun on Node 22.22.2 gave three results:
  - static import, then a synchronous `process.exit`: no warning;
  - static import, natural end: warning;
  - dynamic import, then a synchronous exit: no warning.

  The design's own prototype (`scratchpad/block.mjs`) has no exit, and it prints the warning. The shim ends in a synchronous `process.exit` (shim :102-106), so it stays quiet as written. That depends on how the shim ends, and nothing in the code says so.

**Graph side effect:** the generator's graph picks up literal `import('…')` specifiers (template :393-411). The map therefore gains honest shim → `deliverables.mjs` and shim → `requirements-tree.mjs` edges (*inferred* from the parser).

**Gates:** `map:check` is unchanged. It never loads the ledger, so the map check and the tree check stay separate producers.

**Cost:** about 73 ms by the design's measurement, 84 ms by judge 1's, on a run of about 1.0–1.08 s.

**Noise:**
- 57 of 196 non-test modules have direct links today (rerun).
- Hub modules show doctor 18, steps 13, uninstall 12 and install-check 10. The design measured these and a judge checked them.

**Live output today** (prototype, rerun):
```
artifacts for packages/nana-pack/lib/suite-records.mjs (3):
  writes A-059 CI run records · FEAT-008 · land
    read by: —
  writes A-033 suite run records · FEAT-031 · suite
    read by: scripts/product-report.mjs (FEAT-039)
artifacts for packages/nana-pack/lib/build-records.mjs (2):
  writes A-006 build records · FEAT-006 · build
    read by: packages/nana-setup/lib/install-check.mjs (FEAT-015) [outside import radius]; scripts/product-report.mjs (FEAT-039)
```

#### B3. Checks

**M1, the key-join check (graft from Design 2; judges 1 and 2 put it in the tree check, not `map:check`):**
- **Rule:** every module-shaped path on a writer list, a `by:` part, a `Reads:` line or a `Read by: · code` line must be a mapped module or sit under the map config's ignore list.
- **Mechanism:** use the generator's exported `isModulePath` (template :446) and `isIgnored` (:189). The caller passes in the loaded map config, so `deliverables.mjs` keeps its process-only effects.
- **Rerun on today's ledger:** 61 distinct paths, 57 of them mapped modules. The 4 others all pass:
  - `ci.yml`, which is not module-shaped;
  - two `.jinja` files, which are ignored;
  - the template `readme-check.mjs`, which is ignored.

  M1 gives 0 notes, so it lands green.
- **Honest value:** low but cheap. The existing tracked-at-HEAD checks (`deliverables.mjs:189-190`, `:239-241`) already catch renames. M1 adds a guarantee that a ledger path always joins a map node.

**Lane A tree-check rules** are the audit's (report.md:236-250) plus the `by:` rule:
- `source` needs a reason and no writers.
- `by:` must follow `manual` or `source`, and must name tracked files that are not globs, folders or `*.test.*` files.
- Artifact `Read by:` lines are checked for shape, a live ID, sitting in the maker's span, a known kind, tracked paths or a reason, no repeat and no test path.
- Coverage: an entry with no reader and no park gets a note.
- Parks are checked for a date, a reason and the absence of a reader.

**What no check catches:**
- a module that starts reading or writing a store with no ledger line;
- a ledger path that is tracked but wrong;
- presence-only readers;
- whether a person or runtime claim is true;
- header prose drifting from the ledger;
- format compatibility between a writer and its readers.

**Rejected sub-options:**
- An effects-word gate would give 2 false notes on today's 57 modules: `packages/nana-stage/lib/blocks.mjs:11` declares `none`, and `scripts/requirements-moved.mjs:7` declares `process`. Under R-2730, each would block lands.
- A "header does not name it" hint is a text match. The 2026-10-22 design rejected that as "false comfort" (`docs/reviews/deliverable-fields-2026-10-22/plan-draft.md:28`).

#### B4. Map file and page effect

**`docs/code-map.md`:** no artifact data. Only two entries change: the shim's entry (inputs gain REQUIREMENTS.md, plus new callees) and the `deliverables.mjs` entry (a new caller). Ledger edits never make the map stale.

**Product page (graft from judge 3):** Lane B adds nothing to the page. Lane A also leaves the page's code alone:
- The honest coverage count goes on the tree check's count line.
- The list predicate (`scripts/product-report.mjs:866`), the headings (:891-892) and the card's "Read in" slot (:878-882) wait for the readability discussion (HANDOFF.md:16).
- The current heading, "Artifacts no other feature reads and no deliverable names", with its note "Its maker or a person may still read it." (:891), stays literally true.
- **Side effect:** moving entries from `manual` to `source` shrinks the second list with no code change, because `manualCodeReads` filters on `run === "manual"` (:867). The first list stays overstated until audit lane 5.

#### B5. Migration counts, lanes and ladders

**Lane B, impact-artifacts (FEAT-029 · Navigate code and investigate impact).** Small, ordinary ladder.
- **Code:** `scripts/code-map.mjs` and `scripts/deliverables.mjs` (one join helper plus sealed label constants).
- **Ledger:**
  - 5–6 rows;
  - R-1272 and R-1273 wording;
  - add `scripts/code-map.mjs` to FEAT-029's existing `Reads: A-030` line (REQUIREMENTS.md:2297), because one Reads line per ID per feature is enforced (`deliverables.mjs:233`).
- **Other files:** the regenerated map, and one clause in README.md:54-57 for the readme check.
- **Must-meet tests:**
  - **B1:** writes with readers, and the "(no import path)" mark.
  - **B2:** reads with the star mark.
  - **B3:** the one-import-away line leaves out direct links and carries "may not touch them".
  - **B4:** generator output byte for byte, then the block, then the runtime block, on `scripts/test.mjs`.
  - **B5:** an unloadable parse or an unreadable ledger gives one note and keeps the exit code.
  - **B6:** M1 fires on a module-shaped path that is not mapped, and today's ledger gets none.
- **Precedents:**
  - test code: `runtime-map.test.mjs` and `code-map.test.mjs`;
  - the block: `runtimeBlock` (shim :81-100);
  - the join: `scripts/requirement-rows.mjs`, which joins the graph to the ledger and labels its output "neither complete nor exact";
  - generator imports: shim :19-30.
- **Threat model:** honest variation in ledger lines and tool output is in scope; forgery is out.

**Lane A, artifact-readers (FEAT-028).** Larger, ordinary ladder (`largerBuilder` if the roster sets one).
- **All 60 `manual` lines get a review:**
  - roughly 30 move to `source` by the audit's count, but the grounding's seed test gives 17, so pin the test first;
  - about 43 gain `by:` (50 pairs).
- **New reader lines:**
  - 13 own-code `Read by: · code` lines;
  - `Reads: A-057 · packages/nana-pack/bin/nana-land.mjs` in FEAT-008;
  - A-081 as `runtime`;
  - about 5 `person` lines;
  - a park for A-059;
  - the audit's claim fixes;
  - A-082 once land-records lands (*inferred*).
- **Possibly:** FEAT-015 `Reads:` lines for A-067 and A-070 through `packages/nana-setup/lib/stale-copies.mjs:74,:77` (*inferred* attribution).
- **Files:**
  - REQUIREMENTS.md (prose at :27);
  - `scripts/deliverables.mjs`;
  - `scripts/requirements-tree.mjs`;
  - `docs/requirements-tree.md`;
  - `scripts/requirements-moved.mjs`, which REQUIREMENTS.md:46 requires; today it diffs only Artifact and Reads lines (:148-153) and row-keyed claims (:56-66);
  - `templates/_shared/requirements-organization.md:8`;
  - `requirements-deliverables.test.mjs`.
- **Template effect:**
  - The shared prose is inside `RELEASE_SURFACE` (`packages/nana-pack/lib/release-status.mjs:12`), so CI runs acceptance and cuts a patch tag.
  - REQUIREMENTS.md is skip-if-exists (`copier.yml:13-20`), so no existing project changes.
  - No generator is touched.
- **Constraint:** do **not** add `scripts/test.mjs` as an A-033 writer. `artifactAgeTableKey` requires exactly one writer (`deliverables.mjs:41-44`; R-2793 at REQUIREMENTS.md:2762), and the note would fail every land.
- Lane A also adds the person, runtime and own-code display tests to the Lane B helper.

**Order and timing:**
- B comes first and works on today's lines; A extends B's helper.
- Neither starts now. The readability pause stops new lanes (HANDOFF.md:16; artifact-model memory), and land-records holds a build slot (at most two lanes build).
- Neither lane touches install, uninstall, doctor, a hook, an extension, the gate or the land and review tools. So there are no wrong-code pairs, no land review, no independent check and no local install check.

#### B6. What this replaces from the audit's lane list (report.md §7)

| Audit lane | Effect |
|---|---|
| 1 artifact-readers | Becomes Lane A. It adds `by:` and `requirements-moved.mjs`, drops the page changes, and adds the R-2793 constraint. |
| 5 artifact-reader-view | Unchanged. It is still behind the pause, and Lane A leaves the page to it explicitly. |
| new: impact-artifacts | Lane B. It fills the audit's deferred "a report-only audit could come later" (mechanism.json `.mechanism:69`). The ban at report.md:281 ("No gate that derives readers by grep or from the code map") still holds: B derives nothing and gates nothing beyond the M1 key check. |
| 2–4, 6–18 | Unaffected. Lane 14's A-059 orphan becomes visible at `suite-records.mjs`, but stays the owner's call. |

**Open known-bug carry:** the code-map half of plan-attack N7 (`docs/reviews/artifact-registry-2026-10-24/plan-attack-format.md:64`: "The code map links no path to a feature") was never recorded. `docs/known-bugs/FEAT-028.md:85` records only the overlap between deliverable Read by lines and Reads lines. Lane B does not close N7. Lane A should record it.

### C. Judges' scores

| Design | Judge | one source | closes gaps | mechanical | cost/blast | readability | total |
|---|---|---|---|---|---|---|---|
| 1 headers-source | J1 | 2 | 3 | 2 | 1 | 3 | 11 |
| | J2 | 2 | 4 | 4 | 2 | 3 | 15 |
| | J3 | 2 | 3 | 4 | 2 | 3 | 14 |
| 2 registry-source | J1 | 4 | 4 | 3 | 3 | 3 | 17 |
| | J2 | 4 | 4 | 4 | 3 | 4 | **19** |
| | J3 | 5 | 4 | 4 | 4 | 4 | **21** |
| 3 separate-maps | J1 | 5 | 4 | 3 | 4 | 4 | 20 |
| | J2 | 5 | 3 | 3 | 4 | 4 | **19** |
| | J3 | 5 | 4 | 3 | 5 | 4 | **21** |
| **Sum** | | | | | | | D1 40 · D2 57 · D3 60 |

**Where the judges disagree:**
- All three named Design 3 the winner. J2 and J3 tied it with Design 2 on total and broke the tie on cost.
- Design 2's recommended first step (an impact-only block) is nearly Design 3's Lane B. The real difference is Design 2's optional second step, rendering artifact lines into `docs/code-map.md`, and that is exactly the owner's call.
- J2 rated Design 1 highest on closing gaps and on mechanical checks (4 and 4), for checking at the boundary. The other two judges rated it low on one-source and cost.
- J1 and J3 reproduced the stderr warning; J2 refuted it for a synchronous exit. My rerun shows both are right under their own conditions (B2).

### D. Refuted claims (consolidated)

1. **Design 3, "before-runtime placement keeps R-1272 and R-1273 green".** It holds only while the shim ends in a synchronous exit. A natural end prints the warning, and `runCodeMap` joins stdout and stderr (`runtime-map.test.mjs:142`), so `endsWith` at :174 would fail. Placement before the runtime block is still correct (J2 and J3).
2. **All three designs missed R-1278.** A static ledger import breaks the MM9 fixture (`runtime-map.test.mjs:511-529,561-573`). I read this; I did not run it.
3. **Designs 1 and 2, "block after the runtime block".** That breaks R-1272 and R-1273 (`runtime-map.test.mjs:172-174`), because `NAMED_A` is an A-034 writer.
4. **Design 1, "lane 1 lands before the tokens".** It cannot. R-2730 plus 0 A-IDs in today's headers means every C2 and C3 note fails the suite until about 230 tokens exist. The checks and the tokens must land together, in one lane on the full ladder.
5. **Design 2 L1, "test.mjs as an A-033 writer".** That collides with R-2793. A-034 already lists `test.mjs` (REQUIREMENTS.md:2466).
6. **Design 1, "no tag is released".** The new `Read by:` grammar's prose sits on the release surface (`requirements-organization.md:8`, `release-status.mjs:12`). It is *inferred* that the prose must be updated.
7. **Designs 1 and 2 leave out `requirements-moved.mjs`.** REQUIREMENTS.md:46 requires the movement report to show the new line kinds.
8. **Design 2's reason the lines do not collide is imprecise.** See `deliverables.mjs:396-399`.
9. **Mis-cites:**
   - the 3-or-4 rule is at `deliverables.mjs:150`, not :152;
   - the tracked-writer check is at :189-190, not :186-187;
   - Design 1 does not need to import `parseContractHeader`, because the shim does not re-export it and `buildGraph` already carries the headers (template :530).
10. **A grounding count is off by one.** The unregistered-writes table has 21 rows: 10 data or store groups, 6 locks and 5 backups or rotations. The text says "11 data".

### E. Residuals of the recommended design

- **Silent new reads and writes are invisible to both records.** This is the largest gap. Design 1 would not catch them either, because a header that leaves a claim out still passes.
- **Ledger errors show up as facts.** A-059's writer is recorded as `suite-records.mjs` (REQUIREMENTS.md:781), but the call site that decides to store it is `packages/nana-pack/lib/land-ci-records.mjs:71`.
- **"(no import path)" is mostly benign.** Of the 29 pairs:
  - three are the install check, independent by design (`packages/nana-setup/lib/install-check-config.mjs:3`);
  - the rest are presence checks, git-owned formats, spawned CLIs or CI.
  - Only two are real unplanned format edges among recorded writers. One is the raw SQL `doctor.mjs:73-74` runs on A-004. The other is the run record `test.mjs` builds for A-034, parsed through `suite-records.mjs` with no shared module.
  - After `by:`, two more surface: A-061 (`steps.mjs` → `stale-copies.mjs:45-51`) and the writers and parsers of A-011 and A-069.
- **The one-import-away line over-credits shared codecs.** `suite-records.mjs` serves both A-033 and A-059.
- **Feature-keyed lines look odd in a module view.** `build-records.mjs` shows as a reader of A-023, and `steps.mjs` reads 13 entries it installs.
- **Header prose stays unchecked:**
  - 54 of the 125 modules with disk, database or network effects name no registered store;
  - for 7 of the 19 code-written artifacts, no writer header names the artifact.
- **Other projects get nothing,** because templates ship no deliverables parse.
- **`docs/code-map.md` stays silent.** It depends on agents running `--impact`, which the standards rule asks them to do.
- **The 21 unregistered write groups are untouched.** Lane A adds only a scope sentence about locks, temp files and backups.

### F. Measured numbers

| Fact | Value | Source |
|---|---|---|
| Mapped modules | 431 (235 test, 196 non-test; 193 headers, 3 exempt; 0 problems) | `--check` today |
| Live entries / `manual` / with writers | 79 / 60 / 19 | rerun |
| Reads lines / entries read by another feature | 100 / 47 | rerun |
| Distinct ledger paths / mapped | 61 / 57 (writers 17 of 18, readers 51 of 55) | rerun |
| Recorded writer→reader pairs | 48: 6 same module, 13 inside the import radius, **29 outside**, in 11 of 14 entries (A-004, 006, 007, 009, 021, 022, 025, 032, 034, 053, 054) | rerun (the grounding's 26 of 44 used a different pair set) |
| Non-test modules with any artifact link | 57 of 196 | rerun |
| How headers name artifacts (160 pairs on mapped modules) | 84 clear, 58 vague, 18 not named | grounding, one reader's judgment |
| Effects naming a store (125 disk/db/network modules) | 47 specific, 17 generic, 7 weak, 54 none | grounding |
| Hand-run makers missing from the registry | 43 entries, 50 pairs, 40 already named clearly in the header | grounding |
| Own-code readers | 13 entries; 10 have a clear header; A-041, A-074, A-075 have none | grounding |
| Entries with no code path | 27 | grounding |
| Unregistered write groups | 21 (10 data or stores, 6 locks, 5 backups or rotations) | grounding table, recounted |
| A-IDs in `docs/code-map.md` | 0 | grounding grep |

### G. When the owner's literal version is the right call

**Design 1 (A-IDs inside `@inputs` and `@outputs`):**
- It is the only design where each module's own G-004 statement becomes joinable.
- It passes today's checker, because only unknown *tags* are refused (template :357-360).
- The map renders it with no renderer change (:735-736).
- It checks claims where the edit happens.
- Choose it if the map file must itself carry artifacts and the boundary check outweighs about 230 tokens, a second record of every cross-feature read, the R-2793 "declare at the writing call site" rule, and about 25 ladder modules.

**Design 2's render seam:**
- About 15 default-off lines in the TypeScript generator.
- Choose it if the map file must show artifacts but the ledger stays the single source.
- Costs: every ledger edit stales the map, and Python parity breaks by design.
- Its byte-identical default render is unverified.

### H. Thin evidence

- The clear-versus-vague header split is one reader's judgment.
- The 230-token estimate was partly added by hand.
- The source count is 30 by the audit and 17 by the seed test.
- The MM9 break was read, not run.
- The warning suppression was tested with a `node -e` replica, not the real shim carrying the new import.
- The A-082 shape is *inferred*.
- Whether agents read the block is unmeasured. That is the claim most likely wrong.
