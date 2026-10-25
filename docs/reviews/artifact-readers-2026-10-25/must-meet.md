# artifact-readers · must-meet of record (seat, 2026-10-25)

Feature: FEAT-028 · Maintain requirement identity and trace links

Written by the seat from the planner's draft (`plan-draft.md`, this folder) and one adversary pass (`plan-attack.md`, this folder; 1 MUST, 8 SHOULD, 9 NOTE). The seat took the MUST exactly, took SHOULD 2 to 9, and took NOTE 1 to 7 and 9; NOTE 8 retires with R-2835. One seat correction past both: A-057's park goes in FEAT-007's span, where A-057 is registered, not FEAT-008's. Plans get no review round. Where this file, the attack and the draft differ, this file holds.

The owner's decision, 2026-10-25: "Build the four (Recommended)". He lifted the 2026-10-24 pause for four page-free lanes from the assessment: this lane, adoption-window, knowledge-freeze-notice and review-texts-durable. The page stays frozen until his readability discussion. This lane is the assessment's lane 1 within that limit: the ledger grammar, the checker rules and this repository's migration, with nothing that needs page code.

Spend line: the current priority (since 2026-10-23): every artifact made by an existing run and read by code. This lane makes every live artifact declare its reader or carry a dated park, so a later page lane can tell real gaps from ledger gaps.

Stakes: low blast, reversible. The change is checker and movement-report output and ledger text. The one sharp edge is R-2730: a false note fails every suite and so blocks every land.

## Threat model

In scope, honest variation in our tools' output, files and environment: CRLF ledgers, trailing spaces and tabs, a missing final newline; a `Read by:` or `Parked:` label in a capability span (deliverable form) and in a feature span (artifact form); a feature-span line under a kindless capability (prose); a line in a subgroup span, or in a proposed, retired or frozen feature; a line above its own `Artifact:` line; a retired entry, an entry ID declared twice, an ID with no live entry; a reader path with a backslash, a glob, a trailing slash, or a file that is untracked but not ignored (R-2730 reads both); a comma list of reader paths; a test file named as a reader, and a harness file inside a `tests` folder (R-1150's `conftest.py` and `requirements-trace.ts`); an entry reached only through a parked deliverable; a park on an entry that turns out to have a reader; git unable to list HEAD (the existing paths-not-checked note). Out: deliberate forgery, such as a `Read by:` line naming code that never opens the artifact, or a person reason nobody acts on. A finding outside this model is a residual.

## Seat decisions

- **`source` moves to a later page lane (seat decision, attack MUST 1).** The frozen page cannot show it: the page prints a card's maker detail as `entry.reason` only for `manual` and as the writer list otherwise (`scripts/product-report.mjs:870`), and its list filter (`:867`) would drop sources from a heading that still describes them. The later page lane takes grammar addition 1 (`source: <reason>`), its two checker rules, the 30-entry relabel, the "made by hand from other data" count, R-751 and R-1410 as CAP-01 deliverables, and the page change. The land report tells the owner; no question goes to him.
- **This lane:** artifact `Read by:` lines, the `runtime` reader kind, artifact parks, one exported consumer function, the checker rules for reader lines, test files, coverage and parks, the movement report's two new forms, and this repository's migration (R-2730 plus the coverage rule make the suite its test).
- **No count line (attack SHOULD 3).** R-2835 is dropped and its ID stays unused. The tree checker prints no artifact count line; `deliverableReport()` and R-2543 are untouched.
- **No ledger row for the migration (attack SHOULD 4).** R-2836 is dropped and its ID stays unused. A-059's park is a reviewed ledger line, not a row. R-751 and R-1410 stay off CAP-01 until the later page lane.
- **No FEAT-015 `Reads:` additions (attack SHOULD 5).** doctor and stale-copies check the installed links, a currency check. A-081's `runtime:` line is its only reader.
- **A-057 is parked, not read (attack SHOULD 6).** nana-land's blob check only notes a missing copy, a presence check. The park keeps the assessment's real gap visible.
- **The movement report lists the new forms (attack SHOULD 7, R-2837).** Governance line 46 keeps its promise that the reviewer sees every entry and read change, and names the two forms. The outline does not list them.
- **Two more clauses on R-2830 (attack SHOULD 8):** the new lines count toward the checker's field lines, and a code or prompt path on one requires the HEAD path check.
- **In-module extraction (attack SHOULD 9).** `readerClaim(text)` (kind, detail, reason or path rule) and `parkClaim(body)` (separator, since date, reason) are extracted inside `scripts/deliverables.mjs` and called from both forms. The deliverable notes stay byte for byte. This is not a move.
- **Three behaviours stated (NOTE 1):** a `code` or `prompt` detail is a comma list, each path checked; a line above its own `Artifact:` line reads like one below it; a line in a frozen feature is read. Each gets a no-note case in R-2830's test.
- **No accepted park, and noted lines give no kind (NOTE 2).** A malformed park gets its own note and leaves the coverage note. A reader line that got any note (malformed, reasonless, foreign, untracked or a test file) gives its entry no kind.
- **The export (NOTE 3):** `artifactConsumers(parsed, trackedPaths, registry, reads)` returning a Map from A-ID to `{ kinds, park, notes }`. The builder may adjust the parameters, or add a field for notes and lines tied to no live entry, to fit existing call shapes, and names each departure in the build report. R-2837 reads the feature-span lines through this export or a sibling export in the same module, never through a second parser.
- **The reader rule in prose (NOTE 4):** REQUIREMENTS.md's prose says "a currency or presence check is not a reader". The migration applies it (A-031, A-072, A-057, the FEAT-015 links).
- **R-437's reader (NOTE 5):** `code: apps/desk/stage-keys.mjs, apps/desk/server.mjs`. The freeze stays on R-437's park line.
- **The requirements skill (NOTE 6):** one sentence in `packages/nana-pack/skills/requirements/SKILL.md` names the artifact `Read by:` and `Parked:` forms; it may name the `runtime` kind they share with deliverable `Read by:` lines.
- **No new import (NOTE 9).** Everything stays inside `scripts/deliverables.mjs`: no new module and no new import, so the copied-CLI fixtures (`requirements-tree.test.mjs:464-468`, `requirements-regroup.test.mjs:212`) stay valid. `scripts/requirements-moved.mjs` already imports `scripts/deliverables.mjs`; a new named import from it is not a new edge.
- **Cross-feature ledger edits are the owner's pick.** The migration touches lines in 19 feature spans and 3 capability spans beyond FEAT-028's rows; the brief lists every span. Lines in frozen FEAT-016, FEAT-026 and FEAT-027 record readers that exist today and change no row and no code.

## Must-meet rows (FEAT-028; tests in `packages/nana-pack/tests/requirements-deliverables.test.mjs` unless noted)

- **R-2830.** WHEN a feature span under a kinded capability holds a `Read by: A-nnn · <kind>: <detail>` line, above or below the entry's own `Artifact:` line, the deliverable check shall read it as a reader of that entry, with a `code` or `prompt` detail read as a comma list of paths, reporting one note for a line that is malformed (not exactly two ` · ` parts, a first part that is not one A-ID, or an unknown kind), names an ID with no live entry or one registered in another feature's span, names a code or prompt path that is not a tracked file, has a `person`, `rule` or `runtime` kind with no reason, repeats an ID and kind already read in that span, or sits in a subgroup span or a proposed or retired feature's span, and none for such a line in a frozen feature or under a kindless capability; these lines count toward the checker's field lines, and a code or prompt path on one requires the HEAD path check. Test: `R-2830: an artifact Read by line reads its own feature's entry, and a malformed, foreign, unknown, untracked, reasonless, repeated or misplaced line gets one note`. No-note cases: a comma list of two tracked paths; a line above its entry; a line in a frozen feature. Red: a capability-span `Read by: R-nnn` claim read as an artifact reader, or a feature-span `Read by: A-nnn` line read as a deliverable claim; a line naming another feature's entry accepted; a reasonless `person` or `runtime` line accepted; a glob or folder path accepted as tracked; a repeated ID and kind unnoted, or the same ID with a second kind noted; a note under a kindless capability, in a frozen feature or for a line above its entry; a comma list read as one path; a CRLF or trailing-space copy giving a different note set; `artifactRegistry` or `artifactReads` notes changed; a ledger with one manual user-home entry and `Read by: A-001 · code: untracked.mjs` gets no untracked note; `--check` prints no note for a ledger whose only field line is a misplaced feature-span `Read by:` line.
- **R-2831.** WHEN a deliverable `Read by:` line or an artifact `Read by:` line names the reader kind `runtime`, the deliverable check shall accept it only with a reason after the colon, as for `person` and `rule`, and never count it as a code reader in the deliverable count or a row's code state. Test: `R-2831: a runtime reader needs a reason on both Read by forms and never counts as code`. Red: `runtime` reported as an unknown reader; accepted with no reason; its detail checked as a tracked path; a row read only by a runtime counted as made and read by code; `deliverableCodeState(...).readByCode` true for it.
- **R-2832.** WHEN a feature span under a kinded capability holds `Parked: A-nnn · since YYYY-MM-DD: <reason>`, the deliverable check shall park that entry, reporting one note in place of the park for a line that lacks the separator or has a third part, names no entry registered in that span, lacks `since` and a date before the colon or a reason after it, or names an entry that R-2834 gives a reader kind (`parks nothing`). Test: `R-2832: an artifact park needs its own unread entry, a since date and a reason, and a park of a read entry parks nothing`. Red: a capability-span `Parked: R-nnn` read as an artifact park, or the reverse; a park of another feature's entry accepted; a dateless or reasonless park counted; a park of an entry that a `Reads:` line names counted as parked; a parked entry still getting R-2834's note.
- **R-2833.** IF a code or prompt reader path on a deliverable `Read by:` line, an artifact `Read by:` line or a `Reads:` line has a last path segment that matches `TEST_READER_GLOB`, THEN the deliverable check shall report one note naming the line and the path. Test: `R-2833: a reader path whose file name is a test file gets one note on every reader form, and a harness file in a tests folder gets none`. Red: only the deliverable form checked; the glob matched against the whole path, so no path with a folder is caught; a folder segment matched (`x.test.d/reader.mjs` caught); `templates/python/template/tests/conftest.py` caught; a person reason that mentions a test file caught.
- **R-2834.** WHEN the deliverable check runs on a ledger with live artifact entries, it shall give each live entry, through the exported `artifactConsumers`, the reader kinds of its `Reads:` lines (code), its artifact `Read by:` lines (their kinds), each live product capability's `Made by:` built-from lists that name it (code for an automatic run, person for `manual`) and its direct `Made by:` references (that row's `Read by:` kinds), where a line that got a note gives no kind, and report one note `A-nnn has no declared reader` for each live entry with no kind and no accepted park. Test: `R-2834: the shared consumer predicate gives each entry its reader kinds, and an entry with none and no park gets one note`. Red: a built-from list on a `manual` claim counted as code; a direct reference given only code; a retired entry noted; a parked entry noted; an entry reached only through a parked deliverable noted; a `Reads:` line in another capability not counted; a malformed park clearing the coverage note; a reasonless, untracked or test-file reader line giving a kind; the coverage note added to `artifactRegistry`'s notes.
- **R-2837.** WHEN the movement command compares two revisions, its artifacts section shall print one line for each feature-span `Read by:` or `Parked:` line added, removed or changed, naming the entry, its feature, and the reader kind or park date. Test (`packages/nana-pack/tests/requirements-moved.test.mjs`): `R-2837: the movement report lists each added, removed or changed artifact Read by and Parked line`. Red: a person line added prints `tree movement: none`; a park reason edit goes unreported; a capability-span deliverable `Read by:` line listed twice.

Six rows, R-2830 to R-2834 and R-2837, each `untested` then `implemented`. R-2835 and R-2836 stay unused; nothing is renumbered. R-2787's wording gains artifact `Read by:` and `Parked:` lines, and its lift fixture gains one of each (a row edit, no new row); its test title becomes `R-2787: the lift keeps every Artifact:, Reads:, Read by: and Parked: line under its feature, with no mapping and when a mapping moves the feature`.

Seal: one test with no row, naming R-2833 and R-2834: `seal: the test-reader glob and the no-declared-reader note read as sealed`. Tunables live in `scripts/deliverables.mjs` beside `MAKER_RUNS`, each with its provenance comment: `TEST_READER_GLOB` `*.test.*` (chosen: the assessment's consumers-first rule (report section 6), which keeps R-1150's harness legal; R-2833); the coverage note text (contract, R-2834). `READER_KINDS` and `REASON_REQUIRED` gain `runtime` at their ends (contract, R-2831). R-2537's existing check pins them, and its two expected lists gain `runtime`. That is the one existing seal edit, and it is a contract change, not a retune.

Expected existing-test changes, each named in the build report: R-2537's two expected lists; R-2640's feature-line case (`Parked: R-001` in a feature span) still parks nothing and now gets exactly one R-2832 note in place of none, which matches R-2640's own title; R-2787's fixture and title; a deliverables, tree or product-report fixture that registers an unread live entry and asserts exact notes gets one reader line in the fixture. No assertion is loosened.

## Migration (builder verifies each reader at the code before writing it)

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
| A-057 lane copies of kept review texts | FEAT-007 | `Parked: A-057 · since 2026-10-25: nana-land only notes a missing copy; a review-admission check that refuses a round without its earlier copy deletes this line` |
| A-059 CI run records | FEAT-008 | `Parked: A-059 · since 2026-10-25: nothing reads the store; the owner's choice between a CI trend note and no longer writing it deletes this line` |
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

That is 13 code, 5 person and 1 runtime `Read by:` line and 2 parks.

`Reads:` additions: FEAT-008 `A-008 · packages/nana-pack/bin/nana-land.mjs` (kept-text check, :118-138) and `A-022 · packages/nana-pack/bin/nana-land.mjs, packages/nana-pack/lib/land-ci.mjs` (`judgeRuns`, nana-land :178); FEAT-039 `A-015` and `A-046 · scripts/product-report.mjs`; FEAT-031's A-009 line (`REQUIREMENTS.md:2482`) gains `packages/nana-pack/lib/mutation-runner.mjs` (:156); FEAT-026's A-023 line (`:2106`) becomes `apps/desk/apps.mjs, apps/desk/server.mjs`. No FEAT-015 line is added.

Other ledger edits:
- Drop the FEAT-032 duplicate `Reads: A-003 · scripts/product-report.mjs` (`REQUIREMENTS.md:2618`); FEAT-039 keeps its own line (`:2711`).
- Claim fixes: drop R-291's test reader (`:2172`, CAP-07) and keep its person line; turn R-536's test reader (`:2801`, CAP-08) into a person reader (an auditor checks the rows by eye); turn R-437's `person: desk frozen` reader (`:2061`, CAP-06) into `code: apps/desk/stage-keys.mjs, apps/desk/server.mjs`.
- A-001's location keeps its sealed shape (R-2781); its maker reason (`:117`) names `objective.path`, with this location as the default.
- A-035's glob (`:2481`) widens from `docs/reviews/*/seat-mutate*output*.txt` to `docs/reviews/*/seat-mutate*.txt`, catching the 14 tracked records the old glob misses at 61671be0.
- Prose: REQUIREMENTS.md line 27 (the Artifact and Reads paragraph), line 28 (the outline sentence) and line 46 (the movement report sentence), and `templates/_shared/requirements-organization.md` lines 8 and 20. They say: a feature declares a reader of its own entry, and person, rule and runtime readers, on `Read by: A-nnn · <kind>: <detail>` in the maker's span; a hold goes on `Parked: A-nnn · since <YYYY-MM-DD>: <reason>`; a test file is never a reader; a currency or presence check is not a reader; every live entry needs a declared reader or a park; the outline leaves out artifact `Read by:` and `Parked:` lines; the movement report shows every entry, read, artifact `Read by:` and `Parked:` change to the reviewer. Plus the one skill sentence (NOTE 6).

## Precedent

- Feature-span line parse, own-span scan, separator, tracked-path notes: `artifactReads` (`scripts/deliverables.mjs:205-247`), `ownFieldLines` (`:80-96`), `PART_SEPARATOR` (`:33`).
- Park parse and `parks nothing`: the deliverable park block (`scripts/deliverables.mjs:360-391`), `PARKED_DATE` (`:72`), `PARKED_LABEL` and `PARKED_SINCE` (`:21-23`), reused, not redefined. `parkClaim(body)` is extracted from this block.
- Reader kinds and reasons: `READER_KINDS`, `REASON_REQUIRED` (`:27-29`); the deliverable Read by checks (`:456-474`), from which `readerClaim(text)` is extracted; `deliverableCodeState` (`:298`).
- Predicate inputs: `deliverableClaims` (`:272-295`), `registryReference` (`:265-270`), `MAKER_RUNS` (`:25`); the page's own reference join (`scripts/product-report.mjs:817-831`) as the shape to match, read only.
- Field-line count and HEAD read (R-2830's last clauses): `printDeliverableReport` (`scripts/requirements-tree.mjs:614-621`) and the `artifactsRequireTracked` read (`scripts/deliverables.mjs:519-534`).
- Test-file rule: `globMatch` (`apps/bench/lib/checkers.mjs:89-97`, already imported at `scripts/deliverables.mjs:15`) on the last path segment.
- Movement report: the read-change loop (`scripts/requirements-moved.mjs:229-239`) and its registry and reads calls (`:148-153`).
- Tests: `tree` and `registryTree` (`requirements-deliverables.test.mjs:53`, `:55`), the R-2795 check (`:228`) and R-2798 check (`:267`) for note-set style, R-2537's pinned lists (`:381-382`), R-2640's cases (`:390-442`), the R-2730 repository run (`:529-548`); R-2797's fixture and check (`requirements-moved.test.mjs:349-365`); R-2787's lift fixture (`requirements-cap-kinds.test.mjs:111-114`); R-2538's CLI fixtures and copy lists (`requirements-tree.test.mjs:464-501`).
- Ledger lines: R-1239's park (`REQUIREMENTS.md:2190`) for the park wording; FEAT-013's own A-081 entry (`:1107`); the skill's ledger paragraph (`packages/nana-pack/skills/requirements/SKILL.md:127`).

No private helper moves to a shared module. `readerClaim` and `parkClaim` are in-module extractions; `ownFieldLines`, `capabilityOf`, `featureOf`, `hasGlob` and `note` gain new callers inside the same module only.

## Class and builder

Ordinary: no install, uninstall, doctor, hook, extension, gate-policy, land or review tool changes; the movement command, the skill text and one template prose file are not on the class list. The larger builder (`pi-worker --lane-size larger`), one session. The final reviewer only. The seat pushes the draft pull request at build 1's tip and reads its Windows leg before the review brief. It runs wrong-code pairs from the red cases above before the final review, and runs `node scripts/requirements-moved.mjs --root . --base main` and carries its output in the review brief and the land.

## Page effect

The lane adds no page or desk code; `scripts/product-report.mjs`, `docs/product-report/` and `apps/desk/` code are untouched. The page shows these differences as data only, derived by the planner's method with the attack's corrections, not run on a modified ledger:
- the deliverables count stays `20 of 23 made and read by code, 19 parked`; CAP-01's card is unchanged;
- "Artifacts no other feature reads and no deliverable names" stays at 21: the page ignores artifact `Read by:` and `Parked:` lines;
- "Read by code, made by no nana run" goes from 38 to 37: A-031 and A-043 leave, A-028 joins;
- A-008 and A-022 gain a FEAT-008 "Read in:" line, A-015 and A-046 a FEAT-039 line; the flow view gains the cross-capability edges for A-015, A-046 and A-022;
- A-009's FEAT-031 "Read in:" line gains `mutation-runner.mjs`; A-023's FEAT-026 line swaps `blocks.mjs` for `server.mjs`; A-003's card loses the FEAT-032 line;
- A-035's location and class line and A-001's maker reason read as edited;
- R-291's and R-536's blocks lose their code-read mark and R-437's gains one; their reader claims read as edited;
- no new deliverable note reaches the page, because R-2730 fails on any.

## Overlap

impact-artifacts is on main (61671be0); build from there. adoption-window, knowledge-freeze-notice and review-texts-durable also edit REQUIREMENTS.md, the outline and the code map. Whichever lands second merges main and regenerates `docs/requirements-tree.md` and `docs/code-map.md`. After this lane lands, every new live entry needs a reader declaration or a park, so each sibling brief says so.

## Known limits (the seat writes them before the final round)

- The page shows none of the new lines until the later page lane: no artifact `Read by:` lines, parks, `runtime` kind or "No declared reader" list.
- The page keeps its own reference join beside the exported `artifactConsumers` until the later page lane imports it.
- `manual` still covers hand-written sources and hand-made copies alike until the later page lane adds `source`.
- map:impact's artifact block (R-2821) lists `Reads:` lines only, so an own-code `Read by:` reader does not show in a file's impact.
- An own-code `Read by:` path is checked for being tracked, not for belonging to the maker feature or for reading the artifact.
- A person reader or a park clears the coverage note; only the owner's reading of those lines judges them.
- A direct reference inherits every reader kind of its row, so A-048 looks code-read through R-1070.
- "A currency or presence check is not a reader" is prose; the checker cannot tell, and A-053's `Reads:` line still counts.
- The test-reader rule is a file-name rule: `*.spec.*` and test helpers without `.test.` pass.
- The outline does not list artifact `Read by:` or `Parked:` lines; the movement report does.
- The template prose edit cuts a template tag on land, so copier-linked projects show drift; the later page lane cuts another.
- Projects that carry a registry get the coverage note the first time they run the checker (report-only there).
- The assessment's section 4 `Reads:` extras (A-038's includes, A-039's aggregate, A-050's doctor) stay unrecorded.
