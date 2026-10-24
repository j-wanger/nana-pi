The other agent's tables break the sealed rules in three places. Below are the fixes and the corrected tables, checked read-only against `<snapshot at fc06e29d>` at fc06e29d.

1. **Rule (b) fails.** A-023, A-026 and A-027 all sit at `user-home store: <pi agent dir>/sessions/`.
2. **Five unparked Made-by lines are left with no third part.** The migration rule forbids that. I fixed three; R-201 L100 and R-616 L2016 cannot be fixed honestly and need a ruling.
3. **A-025 is missing a writer:** `nana-handoff.ts` appends to the journal directly.

Several smaller fixes follow.

What holds:
- Every other location shape, tracked match, writer file and run is correct.
- All 41 deliverables and all 53 Made-by lines are present, and no plain-path third part remains.
- C1 and C3 to C10 are true to the code.
- The count line stays `18 of 22 made and read by code, 19 parked`.

## Lines I would change

**TABLE A**

1. **A-023, A-026, A-027 → merged into A-023 (rule b).**
   - One store with one run per entry. pi itself writes every session, and pi is not a tracked file. `apps/desk/server.mjs:1719` appends renames outside any listed run.
   - So an automatic entry would have an incomplete writer list, and manual is the only class that fits.
   - nana-stage never loads outside the desk:
     - The root `package.json` lists only the nana-pack and nana-knowledge extensions.
     - nana-setup never installs nana-stage.
     - The desk passes app-manifest extensions into its app sessions.
     - The Parked lines say the same.
   - New line: `Artifact: A-023 · pi session store · user-home store: <pi agent dir>/sessions/ · manual: pi itself writes every session; nana adds entries only through the desk, frozen since 2026-10-10, where nana-stage.ts appends block entries and patched tool results in app sessions and apps/desk/server.mjs appends renames`
   - A-026 and A-027 are left unallocated, so every other ID still matches the plan.
   - This also removes the table's stated nana-stage writer exception.
2. **A-025: add a missing writer.**
   - `nana-handoff.ts:313` and `:383` call `fs.appendFileSync` on `adoptionSettings().journal`. That path is the same default as `config.ts:640`.
   - New line: `Artifact: A-025 · nana journal · user-home store: <pi agent dir>/nana-journal.jsonl · extension: packages/nana-pack/lib/config.ts, packages/nana-pack/extensions/nana-gate.ts, packages/nana-pack/extensions/nana-handoff.ts`
   - R-159's new line already lists all three files, so it still binds.
3. **A-021: location.**
   - The sealed grammar allows `*` only for the tracked class, and `git check-ref-format 'refs/tags/v*'` exits 1.
   - All 39 tags at HEAD are `v` tags.
   - New line: `Artifact: A-021 · release tags · git ref: refs/tags/ · CI: scripts/template-release.mjs`
4. **A-020: the reason is false for half the store.**
   - `steps.mjs:357-358` and `:378-379` send retired `~/.agents` artifacts to `~/.agents/backups/`, not here.
   - New line: `Artifact: A-020 · retired Claude artifact backups · user-home store: ~/.claude/backups/ · manual: the owner runs nana-setup install by hand, which moves retired artifacts from the Claude folder here; retired ~/.agents artifacts go to ~/.agents/backups/ instead`
5. **A-048: new entry.**
   - R-1070 L1009 is unparked, and an honest artifact exists: 12 tracked `docs/reviews/*/install-check-<sha>.txt` files.
   - New line: `Artifact: A-048 · local install-check records · tracked: docs/reviews/*/install-check-*.txt · manual: the seat runs the install check locally on macOS before a setup or hook lane's land and commits its output to the lane's review folder`
   - It goes in FEAT-015, after A-022.
6. **A-011: reason (minor).**
   - The desk's settings form also writes this file: `server.mjs:1372` and `:1487-1493`.
   - R-457 names A-011 for exactly that write.
7. **A-014, A-046, A-047: reasons (minor).**
   - Copier templates render these files too: `templates/{python,typescript}/template/OBJECTIVE.md.jinja`, `HANDOFF.md.jinja` and `docs/sessions/README.md.jinja`.
   - The adopt-structure skill also copies them: `SKILL.md:156-160`.
8. **Evidence-only fixes.**
   - A-012 should cite `paths.mjs:66`, not `:64`.
   - A-013 should cite `:67`, not `:65`.
   - A-019 should cite `:73`, not `:72`.
   - A-044: the extractor does write, but only a private session corpus elsewhere (`writing-trial-extractor.mjs:140-162`). It never writes `after.md`.

**TABLE B**

9. **Unparked lines left empty, now fixed:**
   - R-301 L989 → `· A-022`. The CI install-check job runs install and then doctor, which checks the hook and rule links (`install-check.mjs:375`, `:529`). Its writers are among the claim's paths.
   - R-341 L1004 → `· A-022`. Same reasoning.
   - R-1150 L1000 → `· A-021`. The release job renders both templates through `template-acceptance.mjs`, then tags. The writer `template-release.mjs` is among the claim's paths.
   - R-1070 L1009 → `· A-048`.
10. **R-616 L2017 → `· A-034`.**
    - A-034's writers (`ci.yml`, `test.mjs`) equal the claim's paths, and both runs are CI.
    - The table's `built from: A-034` points the wrong way, which the table itself admits.
11. **R-616 L2016 → leave empty (flagged).**
    - `built from: A-033` is false: the records keep this output, they do not feed it.
    - A-033's writer, `suite-records.mjs`, is not in the claim, so the line cannot name A-033 either.
12. **R-201 L100 → leave empty (flagged).**
    - One artifact is made by two runs: the extension runs the CLI hook, which starts the build.
    - An entry has one run, and A-004's run is hook.
13. **R-260, R-256, R-257 → `· A-023`.**
    - Under the merged manual entry, an honest artifact exists for each:
      - the patched tool result, which pi stores (`nana-stage.ts:96`);
      - the block entries (`nana-stage.ts:95`);
      - the signature, a field of each block entry.
    - So their lines may no longer stay empty.
14. **R-264 → `built from: A-023`** (A-027 is gone).
15. **R-1560 → `built from: A-007, A-008`.**
    - The timeline reads the tally (`review-timeline.mjs:160`, `readRounds`) and the kept texts (`:83-86`).
    - The cited `:47` reads the audit log, which is a different store.
16. **R-341 L1005: add A-009.**
    - Doctor calls `releaseStatus` (`doctor.mjs:724`), which reads `refs/heads/main` (`release-status.mjs:70`).
    - Without it, the claim to list "every registered entry doctor reads" is false.

**TABLE C**

17. **C2 evidence.** The direct journal appends in `nana-handoff.ts` are at `:313` and `:383` (they write `directory_unadopted`, which the R-159 hook reader reads). The cited `:328` and `:463` go through `config.ts`. The new line itself is correct.
18. **C6.** The Parked rewrite should be firm, not just proposed. The old Parked reason ("its only code readers... call judge models") is false once C6 lands.
19. **C11 (new, same as C4 and C5).** `product-report.mjs:25` and `:212` read the suite records.

## TABLE A — registry entries (corrected)
Insert each line directly after the anchor line shown, before any Note line or subgroup, in ID order within each feature.

| A-ID | Maker FEAT (insert after) | Exact line | Evidence |
|---|---|---|---|
| A-001 | FEAT-001 (L113) | `Artifact: A-001 · user objective file · user-home store: <pi agent dir>/nana-objective.md · manual: the owner writes the program objective by hand; nana-setup install, run by hand, seeds a missing copy` | objective.ts:102-112; steps.mjs:710-715. |
| A-002 | FEAT-002 (L163) | `Artifact: A-002 · compaction handoff store · user-home store: ~/.pi/agent/handoffs/ · extension: packages/nana-pack/extensions/nana-handoff.ts` | nana-handoff.ts:498-500, :224-228; fixed path at adoption.mjs:62-66 (computes only). |
| A-003 | FEAT-002 (L163) | `Artifact: A-003 · handoff frontier · tracked: HANDOFF.md · manual: the seat edits it by hand in each lane's reviewed change` | No code writes nana-pi's copy; project.mjs:125 seeds only missing copies. |
| A-004 | FEAT-003 (L280) | `Artifact: A-004 · knowledge index · user-home store: ~/.pi/agent/nana-knowledge/index.db · hook: packages/nana-knowledge/lib/build.ts, packages/nana-knowledge/lib/db.ts` | build.ts:241, :331, :364-423; db.ts:114-121, :135-136; paths.ts:16-18. |
| A-005 | FEAT-005 (L395) | `Artifact: A-005 · writing rule · tracked: packages/nana-pack/rules/nana-writing.md · manual: the owner's adopted rule, edited by hand in reviewed lanes` | Tracked. |
| A-006 | FEAT-006 (L452) | `Artifact: A-006 · build records · clone store: <git common dir>/nana/build-records.jsonl · build: packages/nana-pack/lib/build-records.mjs` | build-records.mjs:40, :64-65; build-records-config.mjs:11; pi-worker.mjs:296, :331. |
| A-007 | FEAT-007 (L542) | `Artifact: A-007 · review round tally · user-home store: ~/.pi/agent/review-ledger.rounds.jsonl · review: packages/nana-pack/bin/review-round.mjs` | review-round.mjs:845, :390-392; fixed dir :102-107. |
| A-008 | FEAT-007 (L542) | `Artifact: A-008 · kept review texts · user-home store: ~/.pi/agent/review-ledger.texts/ · review: packages/nana-pack/bin/review-round.mjs` | review-round.mjs:443-457, :79, :112. |
| A-009 | FEAT-008 (L729) | `Artifact: A-009 · main branch · git ref: refs/heads/main · land: packages/nana-pack/bin/nana-land.mjs` | nana-land.mjs:186. |
| A-010 | FEAT-009 (L768) | `Artifact: A-010 · project trust store · user-home store: <pi agent dir>/trust.json · manual: the owner runs nana-setup trust or pi's /trust by hand; pi's own trust module writes the file` | nana-setup.mjs:518-532; gate-paths.ts:42. |
| A-011 | FEAT-013 (L1019) | `Artifact: A-011 · user pack config · user-home store: <pi agent dir>/nana-pack.json · manual: the owner edits it by hand or in the desk's settings form, runs nana-roster set, or runs nana-setup install, which seeds a missing copy, all by hand` | roster-set.mjs:54-61, :97-109; steps.mjs:707; server.mjs:1372, :1487-1493. |
| A-012 | FEAT-013 (L1019) | `Artifact: A-012 · Claude hook links · user-home store: ~/.claude/hooks/ · manual: the owner runs nana-setup install by hand` | steps.mjs:133; paths.mjs:66. |
| A-013 | FEAT-013 (L1019) | `Artifact: A-013 · Claude rule links · user-home store: ~/.claude/rules/ · manual: the owner runs nana-setup install by hand` | steps.mjs:141-144; paths.mjs:67. |
| A-014 | FEAT-014 (L1265) | `Artifact: A-014 · project objective seed · other project: <project>/OBJECTIVE.md · manual: someone seeds it by hand with nana-setup project, a copier template or the adopt-structure skill, and the owner ratifies its DRAFT lines` | project.mjs:125-128; templates/*/template/OBJECTIVE.md.jinja; adopt-structure SKILL.md:156-160. |
| A-015 | FEAT-014 (L1265) | `Artifact: A-015 · rendered project ledger · other project: <project>/REQUIREMENTS.md · manual: an agent renders a project with copier through the scaffold or adopt skill, by hand` | templates/{python,typescript}/template/REQUIREMENTS.md.jinja. |
| A-046 | FEAT-014 (L1265) | `Artifact: A-046 · project handoff seed · other project: <project>/HANDOFF.md · manual: someone seeds it by hand with nana-setup project, a copier template or the adopt-structure skill` | project.mjs:125-128; templates/*/template/HANDOFF.md.jinja. Split from the plan's A-014. |
| A-047 | FEAT-014 (L1265) | `Artifact: A-047 · project session log seeds · other project: <project>/docs/sessions/ · manual: someone seeds it by hand with nana-setup project, a copier template or the adopt-structure skill` | project.mjs:125-134; templates/*/template/docs/sessions/README.md.jinja. Split from the plan's A-014. |
| A-022 | FEAT-015 (L1419) | `Artifact: A-022 · install-check job result · CI record: ci: .github/workflows/ci.yml#install-check · CI: .github/workflows/ci.yml, packages/nana-setup/bin/install-check.mjs` | ci.yml:23, :53, :111. Departure: narrowed from the plan's whole-run result. |
| A-048 | FEAT-015 (L1419) | `Artifact: A-048 · local install-check records · tracked: docs/reviews/*/install-check-*.txt · manual: the seat runs the install check locally on macOS before a setup or hook lane's land and commits its output to the lane's review folder` | Glob matches 12 tracked files. New: R-1070 L1009 needs it. |
| A-016 | FEAT-016 (L1591) | `Artifact: A-016 · desk launch agent · user-home store: ~/Library/LaunchAgents/com.nana.pi-desk.plist · manual: the owner runs nana-setup install --desk by hand on macOS` | steps.mjs:900; paths.mjs:37, :105. |
| A-017 | FEAT-016 (L1591) | `Artifact: A-017 · desk log · user-home store: <pi agent dir>/desk.log · manual: desk frozen since 2026-10-10; launchd appends the desk server's output while the service runs` | com.nana.pi-desk.plist.tmpl:18-19; steps.mjs:896; paths.mjs:102. |
| A-018 | FEAT-017 (L1621) | `Artifact: A-018 · durable state archive · user-home store: ~/nana-state.tgz · manual: the owner makes it by hand with tar from nana-setup state --paths, as the nana-setup README says` | packages/nana-setup/README.md:117. |
| A-019 | FEAT-018 (L1635) | `Artifact: A-019 · win32 copy record · user-home store: ~/.claude/nana-setup-copies.json · manual: the owner runs nana-setup install by hand on Windows` | copy-record.mjs:62; paths.mjs:73; steps.mjs:1175, :1187. |
| A-020 | FEAT-018 (L1635) | `Artifact: A-020 · retired Claude artifact backups · user-home store: ~/.claude/backups/ · manual: the owner runs nana-setup install by hand, which moves retired artifacts from the Claude folder here; retired ~/.agents artifacts go to ~/.agents/backups/ instead` | steps.mjs:357-358, :378-379, :389-390. |
| A-021 | FEAT-019 (L1675) | `Artifact: A-021 · release tags · git ref: refs/tags/ · CI: scripts/template-release.mjs` | template-release.mjs:50, :53; ci.yml:139. `refs/tags/v*` fails `git check-ref-format`. |
| A-023 | FEAT-020 (L1736) | `Artifact: A-023 · pi session store · user-home store: <pi agent dir>/sessions/ · manual: pi itself writes every session; nana adds entries only through the desk, frozen since 2026-10-10, where nana-stage.ts appends block entries and patched tool results in app sessions and apps/desk/server.mjs appends renames` | server.mjs:165, :1719; nana-stage.ts:95-96. Merged from A-023, A-026 and A-027 (rule b). |
| A-024 | FEAT-021 (L1758) | `Artifact: A-024 · desk runtime matrix · tracked: apps/desk/README.md · manual: desk frozen since 2026-10-10; edited by hand` | Tracked. |
| A-025 | FEAT-023 (L1811) | `Artifact: A-025 · nana journal · user-home store: <pi agent dir>/nana-journal.jsonl · extension: packages/nana-pack/lib/config.ts, packages/nana-pack/extensions/nana-gate.ts, packages/nana-pack/extensions/nana-handoff.ts` | config.ts:640, :649-651; nana-gate.ts:117-120; nana-handoff.ts:313, :383. |
| A-028 | FEAT-026 (L1939) | `Artifact: A-028 · stage keys · user-home store: ~/.pi/agent/nana-desk/stage-keys/ · manual: desk frozen since 2026-10-10; apps/desk/stage-keys.mjs writes it while the desk runs` | stage-keys.mjs:86-87, :320-327. |
| A-029 | FEAT-027 (L1971) | `Artifact: A-029 · app session pointer · user-home store: ~/.pi/agent/apps/ · manual: desk frozen since 2026-10-10; apps/desk/apps.mjs rewrites the manifest's session field while the desk runs` | apps.mjs:177-182; server.mjs:2472. |
| A-030 | FEAT-028 (L2031) | `Artifact: A-030 · requirements ledger · tracked: REQUIREMENTS.md · manual: builders and the seat edit it by hand, and run the lift's --write by hand` | requirements-lift.mjs:910-915. |
| A-031 | FEAT-028 (L2031) | `Artifact: A-031 · tree outline · tracked: docs/requirements-tree.md · manual: a builder runs npm run req:tree by hand after each ledger edit` | requirements-tree.mjs:614-615. |
| A-032 | FEAT-029 (L2120) | `Artifact: A-032 · runtime map · clone store: <git common dir>/nana/runtime-map.json · land: scripts/runtime-measure.mjs` | runtime-measure.mjs:201-211; test-locked.mjs:288; runtime-map-config.mjs:42. |
| A-033 | FEAT-031 (L2285) | `Artifact: A-033 · suite run records · clone store: <git common dir>/nana/suite-runs · suite: packages/nana-pack/lib/suite-records.mjs` | suite-records.mjs:95-96, :105; test-locked.mjs:212; suite-records-config.mjs:20. |
| A-034 | FEAT-031 (L2285) | `Artifact: A-034 · CI suite records · CI record: ci: .github/workflows/ci.yml#suite-record-${{ matrix.os }}-${{ github.run_attempt }} · CI: .github/workflows/ci.yml, scripts/test.mjs` | ci.yml:103-108; test.mjs:614-618. |
| A-035 | FEAT-031 (L2285) | `Artifact: A-035 · mutation records · tracked: docs/reviews/*/seat-mutate*output*.txt · manual: the seat runs the lane's mutation table by hand and commits its record` | Glob matches 226 tracked files. |
| A-036 | FEAT-032 (L2418) | `Artifact: A-036 · requirements skill · tracked: packages/nana-pack/skills/requirements/SKILL.md · manual: edited by hand in reviewed lanes` | Tracked. |
| A-037 | FEAT-033 (L2450) | `Artifact: A-037 · standards rule · tracked: packages/nana-setup/claude/rules/nana-standards.md · manual: edited by hand in reviewed lanes` | Tracked. |
| A-038 | FEAT-033 (L2450) | `Artifact: A-038 · shared general rows · tracked: templates/_shared/requirements-general.md · manual: edited by hand in reviewed lanes` | Tracked. |
| A-045 | FEAT-039 (L2504) | `Artifact: A-045 · land product report · clone store: <git common dir>/nana/product-report.html · land: scripts/product-report.mjs` | product-report.mjs:32, :756-760; test-locked.mjs:186-194. |
| A-039 | FEAT-034 (L2589) | `Artifact: A-039 · study schedule · tracked: apps/bench/studies/tool-profiles-2026-09-08/schedule.json · manual: someone runs node apps/bench/run.mjs by hand, paid or as a free dry run` | plan.mjs:109, :113; run.mjs:882. |
| A-040 | FEAT-035 (L2614) | `Artifact: A-040 · study summary · tracked: apps/bench/studies/tool-profiles-2026-09-08/summary.md · manual: someone runs node apps/bench/aggregate.mjs on a study by hand` | aggregate.mjs:236. |
| A-041 | FEAT-036 (L2632) | `Artifact: A-041 · probe ledger · tracked: apps/bench/studies/tool-profiles-2026-09-08/ledger.jsonl · manual: someone starts a paid study with node apps/bench/run.mjs by hand` | run.mjs:816. |
| A-042 | FEAT-037 (L2660) | `Artifact: A-042 · study results · tracked: apps/bench/studies/tool-profiles-2026-09-08/results.jsonl · manual: someone starts a paid study with node apps/bench/run.mjs by hand` | run.mjs:292, :935. |
| A-043 | FEAT-038 (L2691) | `Artifact: A-043 · catch-ledger rows · tracked: apps/bench/studies/catch-ledger-2026-09-28/rows.jsonl · manual: someone runs node apps/bench/catch-ledger.mjs extract by hand` | catch-ledger.mjs:40, :46-47, :62. |
| A-044 | FEAT-038 (L2691) | `Artifact: A-044 · writing-trial extract · tracked: docs/reviews/writing-trial-2026-10-04/after.md · manual: the seat ran the writing-trial extractor by hand and wrote its result into this file` | The extractor never writes after.md; it only writes a private corpus elsewhere (writing-trial-extractor.mjs:140-162). |

## TABLE B — the 41 deliverables (all 53 Made-by lines, corrected)

| Row | Current (L#) | New | Reason |
|---|---|---|---|
| R-001 | L88 | `Made by: R-001 · session start: packages/nana-setup/claude/hooks/nana-objective.mjs, packages/nana-pack/bin/nana-objective.mjs · built from: A-001, A-010, A-014` | objective.ts:553-608. |
| R-001 | L89 | `Made by: R-001 · extension: packages/nana-pack/extensions/nana-objective.ts, packages/nana-pack/lib/objective.ts · built from: A-001, A-010, A-014` | Same block. |
| R-108 | L92 | `Made by: R-108 · extension: packages/nana-pack/extensions/nana-handoff.ts · A-002` | C1. |
| R-873 | L95 | `Made by: R-873 · session start: packages/nana-setup/claude/hooks/nana-objective.mjs, packages/nana-pack/bin/nana-frontier-summary.mjs · built from: A-003, A-046` | frontier-summary.mjs:3-6. |
| R-873 | L96 | `Made by: R-873 · extension: packages/nana-pack/extensions/nana-frontier-summary.ts, packages/nana-pack/lib/frontier-summary.mjs · built from: A-003, A-046` | Same block. |
| R-201 | L99 | `Made by: R-201 · hook: packages/nana-knowledge/bin/nana-knowledge.ts, packages/nana-knowledge/lib/hook.ts, packages/nana-knowledge/lib/build.ts, packages/nana-knowledge/lib/db.ts · A-004` | C9. |
| R-201 | L100 | unchanged (FLAGGED) | Unparked; A-004's run is hook, and no honest built-from list exists. See the open items. |
| R-217 | L102 | `Made by: R-217 · hook: packages/nana-knowledge/bin/nana-knowledge.ts, packages/nana-knowledge/lib/hook.ts · built from: A-004` | hook.ts:175. |
| R-217 | L103 | `Made by: R-217 · extension: packages/nana-knowledge/extensions/nana-knowledge.ts · built from: A-004` | Same block. |
| R-749 | L106 | unchanged | Parked, no artifact; the checker never reads the rule file. |
| R-1400 | L434 | `Made by: R-1400 · manual: the owner runs nana-roster set by hand to change this machine's roster · A-011` | Manual claim, manual entry. |
| R-1008 | L439 | `Made by: R-1008 · review: packages/nana-pack/bin/pi-review.mjs, packages/nana-pack/bin/review-ledger.mjs, packages/nana-pack/bin/review-round.mjs · A-007, A-008` | Writer listed. |
| R-1560 | L441 | `Made by: R-1560 · manual: someone runs review-timeline by hand; no brief, land step or hook calls it · built from: A-007, A-008` | review-timeline.mjs:160 (tally), :83-86 (kept texts). |
| R-977 | L443 | `Made by: R-977 · land: packages/nana-pack/bin/nana-land.mjs · A-009` | Run and writer match. |
| R-2597 | L446 | `Made by: R-2597 · build: packages/nana-pack/bin/pi-worker.mjs, packages/nana-pack/lib/build-records.mjs · A-006` | Map name replaced. |
| R-301 | L989 | `Made by: R-301 · CI: .github/workflows/ci.yml, packages/nana-setup/bin/install-check.mjs · A-022` | The CI job runs install, then doctor's link rows (install-check.mjs:375, :529). |
| R-301 | L990 | `Made by: R-301 · manual: the owner runs nana-setup install by hand; the symlinks carry edits to an existing hook or rule, but nothing links a new or renamed one · A-012, A-013` | Manual to manual. |
| R-327 | L992 | `Made by: R-327 · manual: someone runs nana-setup project by hand once per project · A-014, A-046, A-047` | project.mjs:125-134. |
| R-1150 | L1000 | `Made by: R-1150 · CI: .github/workflows/ci.yml, scripts/template-release.mjs, scripts/template-acceptance.mjs · A-021` | The release job renders, then tags (template-release.mjs:16, :46-50). |
| R-1150 | L1001 | `Made by: R-1150 · manual: an agent renders a project with copier through the scaffold or adopt skill, by hand · A-015` | Manual to manual. |
| R-341 | L1004 | `Made by: R-341 · CI: .github/workflows/ci.yml, packages/nana-setup/bin/install-check.mjs, packages/nana-setup/lib/install-check.mjs · A-022` | The job result folds in doctor (install-check.mjs:529-543). |
| R-341 | L1005 | `Made by: R-341 · manual: the owner runs nana-setup doctor by hand on the real home; no run checks the real home · built from: A-001, A-004, A-009, A-010, A-011, A-012, A-013, A-016, A-021` | doctor.mjs:382, 385, 485, 494, 503, 647, 706, 724-726; release-status.mjs:70 (main), :81 (tags). |
| R-1070 | L1008 | `Made by: R-1070 · CI: .github/workflows/ci.yml, packages/nana-setup/bin/install-check.mjs · A-022` | Run and both writers match. |
| R-1070 | L1009 | `Made by: R-1070 · manual: the seat runs the install check locally on macOS before a setup or hook lane's land, as AGENTS.md says · A-048` | 12 tracked records. |
| R-596 | L1012 | `Made by: R-596 · CI: .github/workflows/ci.yml, scripts/template-release.mjs · A-021` | Writer listed. |
| R-406 | L1716 | `Made by: R-406 · manual: desk frozen since 2026-10-10 · built from: A-023` | server.mjs:1024. |
| R-422 | L1719 | unchanged | Parked; a live view, no artifact. |
| R-159 | L1722 | `Made by: R-159 · extension: packages/nana-pack/extensions/nana-lifecycle.ts, packages/nana-pack/lib/config.ts, packages/nana-pack/extensions/nana-handoff.ts, packages/nana-pack/extensions/nana-gate.ts · A-025` | C2; all three writers listed. |
| R-1194 | L1725 | `Made by: R-1194 · session start: packages/nana-setup/claude/hooks/nana-roster-notice.mjs, packages/nana-pack/lib/roster-notice.mjs · built from: A-011` | Roster read. |
| R-1194 | L1726 | `Made by: R-1194 · extension: packages/nana-pack/extensions/nana-roster-notice.ts, packages/nana-pack/lib/roster-notice.mjs · built from: A-011` | Same. |
| R-457 | L1729 | `Made by: R-457 · manual: desk frozen since 2026-10-10 · A-011` | server.mjs:1372. |
| R-260 | L1886 | `Made by: R-260 · manual: desk frozen since 2026-10-10 · A-023` | Patched result stored by pi (nana-stage.ts:96). |
| R-256 | L1889 | `Made by: R-256 · manual: desk frozen since 2026-10-10 · A-023` | nana-stage.ts:95. |
| R-257 | L1892 | `Made by: R-257 · manual: desk frozen since 2026-10-10 · A-023` | The signature rides in each block entry (nana-stage.ts:39, :95). |
| R-437 | L1895 | `Made by: R-437 · manual: desk frozen since 2026-10-10 · A-028` | Manual to manual. |
| R-264 | L1898 | `Made by: R-264 · manual: desk frozen since 2026-10-10 · built from: A-023` | blocks.mjs:310-315. |
| R-291 | L2003 | `Made by: R-291 · manual: a builder runs npm run req:tree after each ledger edit; the suite fails on a stale copy until someone does · A-031` | Path replaced. |
| R-1460 | L2006 | `Made by: R-1460 · manual: the seat runs scripts/requirements-moved.mjs by hand before the final review and the land, as AGENTS.md says · built from: A-030` | Reads REQUIREMENTS.md at two revisions. |
| R-1014 | L2008 | `Made by: R-1014 · land: scripts/test-locked.mjs, scripts/product-report.mjs · A-045` | Writer listed. |
| R-1014 | L2009 | `Made by: R-1014 · manual: the seat publishes the land-written page to the owner's copy by hand; no code can update that copy · built from: A-045` | Copy of the land page. |
| R-1272 | L2012 | `Made by: R-1272 · land: packages/nana-pack/bin/nana-land.mjs, scripts/test-locked.mjs, scripts/runtime-measure.mjs · A-032` | Map name replaced. |
| R-1272 | L2013 | `Made by: R-1272 · manual: builders run npm run map:impact by hand to print the section · built from: A-032` | Printed from the map. |
| R-616 | L2016 | unchanged (FLAGGED) | Unparked; console output only; `built from: A-033` is backwards. See the open items. |
| R-616 | L2017 | `Made by: R-616 · CI: .github/workflows/ci.yml, scripts/test.mjs · A-034` | Writers equal the claim's paths (test.mjs:614-618, ci.yml:103-108). |
| R-1239 | L2020 | `Made by: R-1239 · manual: the seat runs the lane's mutation table by hand in install, hook or gate lanes, as the seat guide says · A-035` | Manual to manual. |
| R-2547 | L2023 | `Made by: R-2547 · suite: scripts/test-locked.mjs, scripts/test.mjs, packages/nana-pack/lib/suite-records.mjs · A-033` | C10. |
| R-2632 | L2025 | `Made by: R-2632 · CI: .github/workflows/ci.yml, scripts/test.mjs · A-034` | Both writers listed. |
| R-509 | L2568 | `Made by: R-509 · manual: someone starts a paid study, or a free dry run, with node apps/bench/run.mjs by hand · A-039` | C7. |
| R-532 | L2571 | unchanged | Parked; raw/ is gitignored, so no class fits. |
| R-507 | L2574 | `Made by: R-507 · manual: someone starts a paid study with node apps/bench/run.mjs by hand · A-042` | Path replaced. |
| R-535 | L2577 | `Made by: R-535 · manual: someone runs node apps/bench/aggregate.mjs on a study by hand · A-040` | Path replaced. |
| R-536 | L2580 | `Made by: R-536 · manual: someone runs node apps/bench/catch-ledger.mjs by hand · A-043` | Path replaced. |
| R-694 | L2583 | `Made by: R-694 · manual: the seat runs the writing-trial extractor by hand and writes its result into after.md · A-044` | Path replaced. |

## TABLE C — corrections to existing lines (corrected)

| # | Old line | New line | Evidence |
|---|---|---|---|
| C1 | `Made by: R-108 · extension: packages/nana-pack/extensions/nana-handoff.ts, packages/nana-pack/lib/adoption.mjs` | `Made by: R-108 · extension: packages/nana-pack/extensions/nana-handoff.ts · A-002` | adoption.mjs:62-79 only computes the path; the write is at nana-handoff.ts:498-500. |
| C2 | `Made by: R-159 · extension: packages/nana-pack/extensions/nana-lifecycle.ts, packages/nana-pack/lib/config.ts` | `Made by: R-159 · extension: packages/nana-pack/extensions/nana-lifecycle.ts, packages/nana-pack/lib/config.ts, packages/nana-pack/extensions/nana-handoff.ts, packages/nana-pack/extensions/nana-gate.ts · A-025` | nana-gate.ts:117-120 and nana-handoff.ts:313, :383 append directly; :383 writes the `directory_unadopted` events the R-159 hook reader reads. |
| C3 | `Read by: R-1400 · code: packages/nana-pack/bin/pi-worker.mjs, packages/nana-pack/bin/nana-roster.mjs` | `Read by: R-1400 · code: packages/nana-pack/bin/pi-worker.mjs, packages/nana-pack/bin/nana-roster.mjs, packages/nana-pack/bin/claude-review.mjs, packages/nana-pack/extensions/nana-roster-notice.ts` | claude-review.mjs:16, :72-74; nana-roster-notice.ts:24. |
| C4 | `Read by: R-1272 · code: scripts/code-map.mjs` | `Read by: R-1272 · code: scripts/code-map.mjs, scripts/product-report.mjs` | product-report.mjs:20, :605. |
| C5 | `Read by: R-2597 · code: packages/nana-pack/bin/build-report.mjs, packages/nana-pack/bin/pi-worker.mjs` | `Read by: R-2597 · code: packages/nana-pack/bin/build-report.mjs, packages/nana-pack/bin/pi-worker.mjs, scripts/product-report.mjs` | product-report.mjs:26, :213-215. |
| C6 | `Read by: R-536 · person: the study write-up was read once for its decision; no code or rule reads it now` and `Parked: R-536 · since 2026-10-23: no study is open; a person runs the catch-ledger extraction by hand when a review question needs it, and while extraction calls no model, its only code readers, the label and match steps, call judge models; the next catch-ledger study deletes this line` | `Read by: R-536 · code: apps/bench/test/catch-ledger.test.mjs` and `Parked: R-536 · since 2026-10-23: no study is open; a person runs the catch-ledger extraction by hand when a review question needs it, and the suite's reproduction check reruns every step from the committed caches with no model call; the next catch-ledger study deletes this line` | catch-ledger.test.mjs:296-312. The old Parked reason is false once the Read-by changes. The park stays valid because the maker is manual. |
| C7 | R-509 Made-by | adds "or a free dry run" (as in TABLE B) | run.mjs:81, :832, :882; plan.mjs:109, :113. |
| C8 | `Read by: R-532 · person: a person opens a run's raw folder to audit it; no code reads it` | `Read by: R-532 · person: a person opens a run's raw folder to audit it; the only code reader is a suite test that reads stub evidence it wrote under raw/code-bugfix and then deletes that folder` | orchestration-paths.test.mjs:798, :826, :829. |
| C9 | R-201 L99 | adds `packages/nana-knowledge/lib/db.ts` | db.ts:114-121, :135-136. |
| C10 | R-2547 L2023 | adds `packages/nana-pack/lib/suite-records.mjs` | suite-records.mjs:95-105. |
| C11 | `Read by: R-2547 · code: scripts/test-locked.mjs, packages/nana-pack/lib/suite-records.mjs` | `Read by: R-2547 · code: scripts/test-locked.mjs, packages/nana-pack/lib/suite-records.mjs, scripts/product-report.mjs` | product-report.mjs:25, :212. Same as C4 and C5. |

R-301's row says "four rules" but install creates five. That is row text, so it goes to FEAT-013's known-bug file, not this lane.

## Counts
- **Entries: 46** (the plan's 45; A-014 split adds 2; A-026 and A-027 merged into A-023 removes 2; A-048 adds 1).
  - By class: tracked 16, clone store 4, user-home store 18, other project 4, git ref 2, CI record 2.
  - By run: manual 33, extension 2, land 3, CI 3, review 2, hook 1, build 1, suite 1.
  - 9 of the 14 features with no deliverable have entries. FEAT-010, 011, 012, 022 and 030 have none.
- **Deliverables: 41.**
  - Name an artifact: 30.
  - Built from only: 8 (R-001, R-873, R-217, R-1560, R-406, R-1194, R-264, R-1460).
  - No artifact, all parked: 3 (R-749, R-422, R-532).
- **Made-by lines: 53.**
  - 48 are rewritten and 5 stay unchanged.
  - 33 name an entry, 15 carry a built-from list and 5 stay empty.
  - Of the 5 empty lines, 3 are parked (L106, L1719, L2571) and 2 are flagged (L100, L2016).
  - All 22 unparked deliverables carry a reference on at least one line.
- The count line stays `18 of 22 made and read by code, 19 parked`.

## Open items for the seat
1. **Two lines cannot meet the per-line rule honestly:** R-201 L100 and R-616 L2016. Each deliverable names its artifact on its other line (L99 names A-004, L2017 names A-034). Proposed ruling: a Made-by line may stay empty when another Made-by line of the same deliverable names an artifact. Default: allow.
2. **Suite records and the old map.** A-033's writer is suite-records.mjs, but the old map binds suite-runs to test-locked.mjs. The L1 page shim should match the entry by location and run, as deliverables.mjs:231 does today. L2's age table should name suite-records.mjs.
3. **Globs on the L1 page.** A-035 and A-048 are globs. Today's page matches folder prefixes only, so the shim should skip glob entries until L2.
4. **Departures from the plan:**
   - A-014 is split (A-046, A-047).
   - A-022 is narrowed and moved to FEAT-015.
   - R-749 has no artifact.
   - A-026 and A-027 are merged into A-023, and those two IDs stay unallocated.
   - A-048 is added.
   - A-021's location is now `refs/tags/`. A trailing "/" in a git ref location means a prefix, because `git check-ref-format` rejects both `refs/tags/v*` and `refs/tags/`.
5. **Unusual locations.**
   - A-034 keeps the upload name exactly as ci.yml writes it, `${{ }}` included.
   - A-012, A-013, A-019 and A-020 are written at `~/.claude`, but the code follows CLAUDE_CONFIG_DIR when it is set (paths.mjs:55-59). That is a known gap.