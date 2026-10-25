# artifact-readers · must-meet draft (planner, 2026-10-25)

Feature: FEAT-028 · Maintain requirement identity and trace links

Written by the planner from the artifact consumer assessment (`<scratch>/assess/out/report.md` sections 3, 4, 6 and 7, with `mechanism.json`, `assessed.json` and `critic.md`) and a read of main at d3cf9a0d. One adversary pass comes next. Plans get no review round. Where this file and the assessment differ, this file holds.

The owner's decision, 2026-10-25: "Build the four", after the artifact consumer assessment. He picked the ledger half of section 6: the four grammar additions, one shared consumer predicate, the checker rules, one count line, and the migration of this repository's ledger. The owner froze the product page on 2026-10-24 until a readability discussion. That freeze is a hard limit on this lane.

Spend line: the current priority (since 2026-10-23): every artifact made by an existing run and read by code. This lane makes every artifact declare its reader or carry a dated park, so the later page lane can tell real gaps from ledger gaps.

Stakes: low blast, reversible. The change is checker output and ledger text. The one sharp edge is R-2730: a false note fails every suite and so blocks every land.

Threat model: honest variation in our tools' output, files and environment is in scope. Concretely: CRLF ledgers, trailing spaces and tabs, a missing final newline; a `Read by:` or `Parked:` label in a capability span (deliverable form) and in a feature span (artifact form); a feature-span line under a kindless capability (prose); a line in a subgroup span, or in a proposed, retired or frozen feature; a retired entry, an entry ID declared twice, an ID with no live entry; a reader path with a backslash, a glob, a trailing slash, or a file that is untracked but not ignored (R-2730 reads both); a test file named as a reader, and a harness file inside a `tests` folder (R-1150's `conftest.py` and `requirements-trace.ts`); an entry reached only through a parked deliverable; a park on an entry that turns out to have a reader; git unable to list HEAD (the existing paths-not-checked note). Deliberate forgery is out: a `Read by:` line naming code that never opens the artifact, or a person reason nobody acts on. A finding outside this model is a residual.

## Seat decisions

- **Split into two lanes; this one is the plan of record.** The `source` run cannot land while the page is frozen. The page prints a card's maker detail as `entry.reason` only when the run is `manual`, else as the writer list (`scripts/product-report.mjs:870`). A `source` entry has no writers, so 30 cards would read `source: ` with nothing after it. Its list filter (`:867`) would also drop sources from a heading that still describes them. So:
  - **Lane 1, artifact-readers (this plan, larger build):** grammar additions 2, 3 and 4 (artifact `Read by:` lines, the `runtime` reader kind, artifact parks); the shared consumer predicate; the checker rules for Read by lines, test files, coverage and parks; the count line without its hand-made part; and every migration item except the 30 `source` relabels.
  - **Lane 2, artifact-sources (after the owner's page discussion):** grammar addition 1 (`source: <reason>` on Artifact lines), its two checker rules (a source needs a reason and no writer; R-2783's binding accepts a `manual` claim that names a source), the 30-entry relabel, the count line's "made by hand from other data" part, and the page change (three lists, card lines, the `source:` maker line). It absorbs the assessment's lane 5. It waits on the owner, because it changes the page.
- **What the owner will see change on the page (data only; no page code changes).** Measured by applying this lane's ledger edits in memory to today's ledger and running the page's own list logic:
  - the deliverables count moves from `20 of 23 made and read by code, 19 parked` to `22 of 25 …, 19 parked`;
  - CAP-01's card gains two deliverables, R-751 and R-1410;
  - "Artifacts no other feature reads and no deliverable names" drops from 21 to 19 (A-057 and A-081 leave);
  - "Read by code, made by no nana run" goes from 38 to 39 (A-031 and A-043 leave; A-057, A-081 and A-028 join);
  - cards gain "Read in:" lines for the new `Reads:` lines, and the flow view gains their cross-capability edges (A-015, A-046 and A-022);
  - A-003's card loses the FEAT-032 line; A-023's reader paths, A-035's location and A-001's maker reason read as edited;
  - R-291, R-536 and R-437 show their corrected reader claims.
- **What the owner will not see until lane 2:** artifact `Read by:` lines, parks, the `runtime` kind, the artifact count line, a "No declared reader" list, and `source`. The page keeps its two lists and their headings.
- **The count line stays off the page.** `deliverableReport()` keeps `lines` byte for byte as the page's input (R-2543). It gains a separate `artifactLine` field, which only the tree checker prints. R-2835 pins both halves.
- **New notes reach the page by the existing path.** Coverage, park, artifact Read by and test-reader notes are ordinary `deliverable note:` lines in `lines`, as R-2543 requires. This repository has none at land, because R-2730 fails on any. So the real page shows no new note.
- **Notes live outside `artifactRegistry` and `artifactReads`.** Both keep their notes byte for byte, so the R-2780, R-2781 and R-2795 tests stay unchanged. A new exported function parses feature-span `Read by:` and `Parked:` lines and computes consumers. `checkDeliverables` appends its notes.
- **The predicate is exported and used by the checker only.** The page keeps its own reference join (`scripts/product-report.mjs:817-831`) until lane 2 imports the predicate (a known limit, not a copy).
- **One declaration for each of the 21 unreferenced entries** (the page's list today, re-derived on main at d3cf9a0d: A-017, A-018, A-019, A-020, A-029, A-041, A-052, A-056, A-057, A-059, A-067, A-068, A-070, A-072, A-073, A-074, A-075, A-076, A-077, A-078, A-081). The table is below. A-057 gets a FEAT-008 `Reads:` line, not a `Read by:` line, because nana-land is another feature's code. A-081 keeps its runtime line even though its new FEAT-015 `Reads:` line already covers it: it is the repository's one use of the kind and the honest reader.
- **Park A-059 only**, dated 2026-10-25, the day of the owner's pick. Its reason names what deletes it: his choice between a CI trend note and no longer writing the store.
- **Claim fixes:** drop R-291's test reader and keep its person line; turn R-536's test reader into a person reader (an auditor checks the rows by eye); turn R-437's `person: desk frozen` reader into the code that reads the stage keys (`apps/desk/server.mjs`, `apps/desk/apps.mjs`). The freeze stays on R-437's park line.
- **Missing `Reads:` lines: the mechanism's verified list, no wider.** FEAT-008 for A-008 and A-022; FEAT-039 for A-015 and A-046; `mutation-runner.mjs` on FEAT-031's A-009 line; FEAT-015 doctor and stale-copies for A-005, A-036, A-037, A-049, A-080 and A-081; FEAT-026's A-023 paths (`apps/desk/server.mjs` in, `packages/nana-stage/lib/blocks.mjs` out). The section 4 extras (A-038's includes, A-039's aggregate, A-050's doctor) wait for the next lane that touches those features.
- **A-001's location keeps its sealed shape.** `user-home store` allows only `~/` or `<pi agent dir>/` paths (R-2781), so "the file objective.path names" cannot go there. The maker reason names objective.path instead, with this location as the default.
- **A-035's glob widens** from `docs/reviews/*/seat-mutate*output*.txt` to `docs/reviews/*/seat-mutate*.txt`. That catches the 12 tracked records the old glob misses on main today.
- **R-751 and R-1410 become CAP-01 deliverables:** each gets an `extension` maker built from its rule artifact (A-005, A-050) and a `prompt` reader, as R-873 does.
- **Drop the FEAT-032 duplicate** `Reads: A-003 · scripts/product-report.mjs`. FEAT-039 keeps its own line.
- **Cross-feature ledger edits are owner-picked.** The migration touches lines in 21 feature spans and 4 capability spans, beyond FEAT-028. The governance text lets a builder edit only its brief's feature, so the brief lists every span. Lines in frozen FEAT-016, FEAT-026 and FEAT-027 record readers that exist today. They change no row and no code.
- **Prose:** REQUIREMENTS.md lines 27 and 28 (the Artifact and Reads paragraph and the outline sentence) and line 46 (the movement report sentence), and `templates/_shared/requirements-organization.md` lines 8 and 20. They say: own, person, rule and runtime readers go on a `Read by:` line in the maker's span; parks go on `Parked:`; a test file is never a reader; every live entry needs a reader or a park; the outline and movement report leave out `Read by:` and `Parked:` lines. The requirements skill is not edited (not in the pick; its text stays true).
- **Subtractions:** no outline lines and no movement-report lines for the new forms (reviewers read the diff); no `source`, no "made by hand" count (lane 2); no grep or code-map reader inference; no writer-cannot-be-reader rule; no `.spec.` pattern; no exact live-count pin on this repository's ledger.
- **Sizing (counted on main at d3cf9a0d):** about 54 ledger lines change: 7 new rows plus R-2787's wording; 21 declarations (13 code, 5 person and 1 runtime `Read by:` lines, 1 `Reads:` line, 1 park); 10 new and 2 edited `Reads:` lines; 1 duplicate dropped; 3 claim fixes; A-035 and A-001; 1 Deliverables line and 4 claims; 2 prose lines. Plus 2 template prose lines, the regenerated outline and code map, about 150 to 200 lines in `scripts/deliverables.mjs`, a few in `scripts/requirements-tree.mjs`, and 7 new checks. One larger build holds it. With `source` it would add 30 more entry lines, two more rules and the page.
- **Overlap:** impact-artifacts (in flight) also edits REQUIREMENTS.md, the outline and the code map. Whichever lands second merges main and regenerates both. Its closing note stays true: its block shows only Artifact writer lists and other features' `Reads:` lines.

## Must-meet rows (FEAT-028; tests in `packages/nana-pack/tests/requirements-deliverables.test.mjs` unless noted)

- **R-2830.** WHEN a feature span under a kinded capability holds a `Read by: A-nnn · <kind>: <detail>` line, the deliverable check shall read it as a reader of that entry, reporting one note for a line that is malformed (not exactly two ` · ` parts, a first part that is not one A-ID, or an unknown kind), names an ID with no live entry or one registered in another feature's span, names a code or prompt path that is not a tracked file, has a `person`, `rule` or `runtime` kind with no reason, repeats an ID and kind already read in that span, or sits in a subgroup span or a proposed or retired feature's span, and none for such a line under a kindless capability. Test: `R-2830: an artifact Read by line reads its own feature's entry, and a malformed, foreign, unknown, untracked, reasonless, repeated or misplaced line gets one note`. Red: a capability-span `Read by: R-nnn` claim read as an artifact reader, or a feature-span `Read by: A-nnn` line read as a deliverable claim; a line naming another feature's entry accepted; a reasonless `person` or `runtime` line accepted; a glob or folder path accepted as tracked; a repeated ID and kind unnoted, or the same ID with a second kind noted; a note under a kindless capability; a CRLF or trailing-space copy giving a different note set; `artifactRegistry` or `artifactReads` notes changed.
- **R-2831.** WHEN a deliverable `Read by:` line or an artifact `Read by:` line names the reader kind `runtime`, the deliverable check shall accept it only with a reason after the colon, as for `person` and `rule`, and never count it as a code reader in the deliverable count or a row's code state. Test: `R-2831: a runtime reader needs a reason on both Read by forms and never counts as code`. Red: `runtime` reported as an unknown reader; accepted with no reason; its detail checked as a tracked path; a row read only by a runtime counted as made and read by code; `deliverableCodeState(...).readByCode` true for it.
- **R-2832.** WHEN a feature span under a kinded capability holds `Parked: A-nnn · since YYYY-MM-DD: <reason>`, the deliverable check shall park that entry, reporting one note in place of the park for a line that lacks the separator or has a third part, names no entry registered in that span, lacks `since` and a date before the colon or a reason after it, or names an entry that R-2834 gives a reader kind (`parks nothing`). Test: `R-2832: an artifact park needs its own unread entry, a since date and a reason, and a park of a read entry parks nothing`. Red: a capability-span `Parked: R-nnn` read as an artifact park, or the reverse; a park of another feature's entry accepted; a dateless or reasonless park counted; a park of an entry that a `Reads:` line names counted as parked; a parked entry still getting R-2834's note.
- **R-2833.** IF a code or prompt reader path on a deliverable `Read by:` line, an artifact `Read by:` line or a `Reads:` line has a last path segment that matches `TEST_READER_GLOB`, THEN the deliverable check shall report one note naming the line and the path. Test: `R-2833: a reader path whose file name is a test file gets one note on every reader form, and a harness file in a tests folder gets none`. Red: only the deliverable form checked; the glob matched against the whole path, so no path with a folder is caught; a folder segment matched (`x.test.d/reader.mjs` caught); `templates/python/template/tests/conftest.py` caught; a person reason that mentions a test file caught.
- **R-2834.** WHEN the deliverable check runs on a ledger with live artifact entries, it shall give each live entry, through one exported function, the reader kinds of its `Reads:` lines (code), its artifact `Read by:` lines (their kinds), each live product capability's `Made by:` built-from lists that name it (code for an automatic run, person for `manual`) and its direct `Made by:` references (that row's `Read by:` kinds), and report one note `A-nnn has no declared reader` for each live entry with no kind and no park. Test: `R-2834: the shared consumer predicate gives each entry its reader kinds, and an entry with none and no park gets one note`. Red: a built-from list on a `manual` claim counted as code; a direct reference given only code; a retired entry noted; a parked entry noted; an entry reached only through a parked deliverable noted; a `Reads:` line in another capability not counted; the coverage note added to `artifactRegistry`'s notes.
- **R-2835.** WHEN the ledger holds at least one `Artifact:` line under a kinded capability, the tree checker shall print one line `artifacts: <live> live; <n> with no declared reader, <p> parked; <q> read only by people or rules`, counted with R-2834's function, right after the deliverables count line or first when there is none, and the deliverable lines the Product view reads shall leave it out. Test (`requirements-tree.test.mjs`): `R-2835: the tree checker prints one artifact count line beside the deliverables count, and the Product view's shared lines leave it out`. Red: the line inside `deliverableReport().lines`; a parked entry counted as having no declared reader; a runtime-, prompt- or code-read entry counted as people or rules; an entry read by a person and by code counted as people only; the line printed for a ledger with no Artifact line, or after the notes.
- **R-2836.** This repository's requirements ledger shall list R-751 and R-1410 as CAP-01 deliverables, each made by an `extension` claim built from A-005 and A-050 respectively and read by a `prompt` line, and shall park A-059. Test: `R-2836: the ledger lists the writing and rulings injections as CAP-01 deliverables made and read by code and parks the CI run records`. Red: R-751 built from A-049; a person reader; R-1410 made by a `manual` claim; A-059 given a reader line in place of the park. (R-2730 already fails on any note, so it pins the 21 declarations, the claim fixes and every new tracked path.)

Seven rows, R-2830 to R-2836, each `untested` then `implemented`. R-2787's wording gains artifact `Read by:` and `Parked:` lines, and its lift fixture gains one of each (a row edit, no new row).

Seal: one test with no row, naming R-2833, R-2834 and R-2835: `seal: the test-reader glob, the no-declared-reader note and the artifact count line read as sealed`. Tunables live in `scripts/deliverables.mjs` beside `MAKER_RUNS`, each with its provenance comment: `TEST_READER_GLOB` `*.test.*` (contract: the owner's pick, the assessment's consumers-first rule, R-2833); the coverage note text (contract, R-2834); the count line's labels (contract, R-2835). `READER_KINDS` and `REASON_REQUIRED` gain `runtime` (contract, R-2831). They stay pinned by R-2537's existing check, whose two expected lists gain `runtime`. That is the one existing seal edit, and it is a contract change, not a retune.

Expected existing-test changes, each named in the build report: R-2537's two expected lists; R-2787's fixture and title; R-2538's expected lines only if a fixture with an Artifact line asserts an exact line count. A product-report or deliverables fixture that registers an unread live entry and asserts exact notes gets one reader line in the fixture. No assertion is loosened.

## Migration table (builder verifies each reader at the code before writing it)

| Entry | Span | Line |
|---|---|---|
| A-017 desk log | FEAT-016 (frozen) | `Read by: A-017 · person:` the owner reads its usage lines for the desk retain-or-retire ruling; desk frozen since 2026-10-10 |
| A-018 durable state archive | FEAT-017 | `person:` the owner restores from it by hand, as the nana-setup README's restore order says |
| A-019 win32 copy record | FEAT-018 | `code: packages/nana-setup/lib/steps.mjs` (`copyRecord.unedited`, :148) |
| A-020 retired Claude artifact backups | FEAT-018 | `person:` the owner restores a retired artifact from it by hand |
| A-029 app session pointer | FEAT-027 (frozen) | `code: apps/desk/apps.mjs` (`loadManifests`, :98) |
| A-041 probe ledger | FEAT-036 | `code: apps/bench/run.mjs` (`readLedger`, :810) |
| A-052 knowledge sources config | FEAT-003 | `code: packages/nana-knowledge/lib/build.ts` (`loadSources`, :300-302) |
| A-056 review audit log | FEAT-007 | `code: packages/nana-pack/bin/review-timeline.mjs` (`readAuditRecords`, :46-49) |
| A-057 lane copies of kept review texts | FEAT-008 | `Reads: A-057 · packages/nana-pack/bin/nana-land.mjs` (blob check, :197-206) |
| A-059 CI run records | FEAT-008 | `Parked: A-059 · since 2026-10-25:` nothing reads the store; the owner's choice between a CI trend note and no longer writing it deletes this line |
| A-067 project working region | FEAT-014 | `code: packages/nana-setup/lib/stale-copies.mjs` (`projectStaleLine`, :61) |
| A-068 project Claude import | FEAT-014 | `code: packages/nana-setup/lib/stale-copies.mjs` (project rows through `projectStaleLine`) |
| A-070 not-a-project marker | FEAT-014 | `code: packages/nana-pack/lib/adoption.mjs` (:131, :137) |
| A-072 code map | FEAT-033 | `person:` builders and reviewers read module purposes and edges; the suite only checks that it is current |
| A-073 feature assessment store | FEAT-039 | `code: scripts/product-report.mjs` (:675-683) |
| A-074 fixture manifest | FEAT-034 | `code: apps/bench/lib/fixture.mjs` (:63-66) |
| A-075 oracle keys | FEAT-037 | `code: apps/bench/run.mjs` (`readKeys`, :819) |
| A-076 catch-ledger judge labels | FEAT-038 | `code: apps/bench/catch-ledger.mjs` (:95, `currentLabels` :108) |
| A-077 catch-ledger judge matches | FEAT-038 | `code: apps/bench/catch-ledger.mjs` (`currentMatches`, :130) |
| A-078 catch-ledger results | FEAT-038 | `person:` the owner decides from it through RESULTS.md; R-538 keeps code from reading it |
| A-081 soul rule | FEAT-013 | `runtime:` Claude Code loads it into every seat session as a rule through the installed link |

`Reads:` additions: FEAT-008 `A-008 · packages/nana-pack/bin/nana-land.mjs` (kept-text check, :118-138) and `A-022 · packages/nana-pack/bin/nana-land.mjs, packages/nana-pack/lib/land-ci.mjs` (`judgeRuns`, nana-land :178); FEAT-039 `A-015` and `A-046 · scripts/product-report.mjs`; FEAT-031's A-009 line gains `packages/nana-pack/lib/mutation-runner.mjs` (:156); FEAT-015 `A-005`, `A-036`, `A-037`, `A-049`, `A-080`, `A-081 · packages/nana-setup/lib/doctor.mjs, packages/nana-setup/bin/stale-copies.mjs` (doctor :383-386, stale-copies :47-53; A-037 adds `packages/nana-setup/lib/stale-copies.mjs`); FEAT-026's A-023 line becomes `apps/desk/apps.mjs, apps/desk/server.mjs`.

## Precedent

- Feature-span line parse, own-span scan, separator, tracked-path notes: `artifactReads` (`scripts/deliverables.mjs:205-247`), `ownFieldLines` (`:80-96`), `PART_SEPARATOR` (`:33`).
- Park parse and `parks nothing`: the deliverable park block (`scripts/deliverables.mjs:360-391`), `PARKED_DATE` (`:72`), `PARKED_LABEL` and `PARKED_SINCE` (`:21-23`), reused, not redefined.
- Reader kinds and reasons: `READER_KINDS`, `REASON_REQUIRED` (`:27-29`); code state (`:289`); the deliverable Read by checks (`:456-474`).
- Predicate inputs: `deliverableClaims` (`:271-295`), `registryReference` (`:263-270`), `MAKER_RUNS` (`:25`); the page's own reference join (`scripts/product-report.mjs:817-831`) as the shape to match, read only.
- Test-file rule: `globMatch` (`apps/bench/lib/checkers.mjs:89-97`, already imported at `scripts/deliverables.mjs:15`) on the last path segment.
- Count line and checker print: the deliverables count line (`scripts/deliverables.mjs:536-542`) and `printDeliverableReport` (`scripts/requirements-tree.mjs:614-621`).
- Tests: `registryTree` (`requirements-deliverables.test.mjs:55`), the R-2795 check (`:228`) and R-2798 check (`:267`) for note-set style, the R-2730 repository run (`:529-548`); R-2538's CLI fixtures (`requirements-tree.test.mjs:470-501`); R-2787's lift fixture (`requirements-cap-kinds.test.mjs:111-114`); R-2816's repository-ledger check (`land-records.test.mjs:268`) for R-2836.
- Ledger lines: CAP-01's R-873 pair (`REQUIREMENTS.md:98-101`) for R-751 and R-1410; R-1239's park (`:2190`) for the park wording; FEAT-015's `Reads:` block (`:1530-1554`).

No private helper moves to a shared module. `ownFieldLines`, `capabilityOf`, `featureOf`, `hasGlob` and `note` gain new callers inside the same module only.

## Class and builder

Ordinary: no install, uninstall, doctor, hook, extension, gate-policy or land or review tool changes. Template prose changes, which the class list does not name. The larger builder, one session. The final reviewer only. The seat pushes the draft pull request at build 1's tip and reads its Windows leg before the review brief. It runs wrong-code pairs from the red cases above before the final review, and runs `requirements-moved.mjs` and carries its output.

## Known limits (the seat writes them before the final round)

- The page shows none of the new lines until lane 2: no Read by lines, parks, count line or "No declared reader" list.
- Until lane 2, the tree checker prints one artifact count line that the page does not show.
- Until lane 2, the page keeps its own reference join beside the exported predicate.
- `manual` still covers hand-written sources and hand-made copies alike until lane 2 adds `source`.
- The count line has no "made by hand from other data" part until lane 2.
- An own-code `Read by:` path is checked for being tracked, not for belonging to the maker feature or for reading the artifact.
- A person reader or a park clears the coverage note; only the owner's reading of those lines judges them.
- A direct reference inherits every reader kind of its row, so A-048 looks code-read through R-1070.
- A `Reads:` line that names a presence check still counts as a reader; A-053 is the example.
- The test-reader rule is a file-name rule: `*.spec.*` and test helpers without `.test.` pass.
- The outline and the movement report do not list `Read by:` or `Parked:` lines; reviewers read the diff.
- The requirements skill does not describe the new lines yet.
- Projects that carry a registry get the coverage note the first time they run the checker (report-only there).
- The section 4 `Reads:` extras (A-038's includes, A-039's aggregate, A-050's doctor) stay unrecorded.
