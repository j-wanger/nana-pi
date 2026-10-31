# nana-pi consistency backbone — map

Read-only survey of `~/nana-pi` at main `8e4c9906`, 2026-10-30. Commands were run read-only from the main checkout. The city narration is `apps/hive/city.json`, which exists only in the world-graph worktree (`~/nana-pi-wt/world-graph`, tip `811ed082`). It is not on main.

Strength key: **live** means a tool produces it and a tool or prompt reads it automatically. **partial** means it exists but is hand-kept, unread, stale or limited to one runtime. **gap** means it is missing. Where the component audit (`docs/components/nana-pi.json`) gives a status, the table quotes it as `audit: <status>`.

## Capability table

| # | Capability | What it is | Artifacts kept (checked?) | Writes → reads in the lane loop | Strength | Evidence |
|---|---|---|---|---|---|---|
| 1 | Requirement rows + feature tree | One testable row per behaviour, grouped as capability → feature → sub-feature | `REQUIREMENTS.md` (2,210 rows, 39 features); `scripts/requirements-trace.mjs`, `requirements-tree.mjs`, `requirement-rows.mjs`; skill `packages/nana-pack/skills/requirements/` (yes, suite + CLI) | planner/adversary write rows → builder tags tests → reviewer gets the tree movement → product report and next planner read them | live (audit: requirement-contract **sound**) | `node scripts/requirements-trace.mjs` prints 2210 total: 1959 implemented and traced, 189 untested, 7 planned, 5 violated, 50 retired, 0 rows off form. `requirements-tree.mjs --check` reports 0 problems |
| 2 | Tree movement per lane | Diff of rows, features and artifacts since main, attached to every review | `scripts/requirements-moved.mjs`; `docs/reviews/<lane>/tree-movement.md` (yes, tests) | review-ledger keep writes it → reviewer prompt and owner land report read it | live (since about 10-25) | Present in 23 of 255 lane folders. `tests/requirements-moved.test.mjs`, `review-movement.test.mjs` |
| 3 | Must-meet tests + adversary | Three to eight tests per lane, attacked before the build | `docs/reviews/<lane>/must-meet.md`, `plan-attack.md`; `req:` markers in tests (trace checks markers, not the files) | seat + adversary write → builder builds to them → reviewer's standard makes a missing one a MUST | live for markers; the plan files are hand-written | must-meet.md is in 178 of 255 lanes, plan-attack.md in 177. `packages/nana-pack/prompts/review-standard.md` line 1 |
| 4 | Precedent rule | Each plan or brief names the nearest existing code for each part | `packages/nana-pack/lib/brief-precedent.mjs`, `bin/brief-check.mjs`; `scripts/code-search.mjs` (`npm run map:search`) | planner runs map:search and writes Precedent → pi-worker refuses a brief without it → builder must read and import, and report departures | live (audit: drafting-table **sound**) | `prompts/planner.md` ("Run npm run map:search"); `prompts/builder-preamble.md`; `tests/brief-check.test.mjs`, `worker-lane.test.mjs` |
| 5 | Standing rulings | One file of dated owner decisions every session loads | `packages/nana-pack/rules/nana-rulings.md` (29 lines); `extensions/nana-rulings.ts` (yes, `tests/rulings.test.mjs`) | seat writes inside a reviewed lane → injected into pi seat/builder/reviewer and the Claude seat; planner ranks it as source #2 | live (audit: rulings **sound**) | doctor: `✓ rule nana-rulings.md`, `✓ pi nana-rulings.md` |
| 6 | Seat guide | How the seat runs builders and reviewers | `packages/nana-setup/claude/rules/nana-seat.md` | owner/seat write → seat reads (Claude rule; pi injects for seat sessions) | partial | doctor on this machine: `✗ pi nana-seat.md` (pi install stale) |
| 7 | Writing rule | One rule for every message to the owner, with a checker | `packages/nana-pack/rules/nana-writing.md`, `bin/nana-writing.mjs`, `extensions/nana-writing.ts` (yes: the suite checks HANDOFF live sections) | seat runs `--report` by hand before each report; the suite reads HANDOFF | live for HANDOFF; partial for reports (hand-run) | `tests/writing-check.test.mjs`; AGENTS.md "HANDOFF writing check" |
| 8 | Review standard + ladder | A different model lineage reviews the exact tip against one standard | `prompts/review-standard.md`; `bin/pi-review.mjs`, `claude-review.mjs`, `review-round.mjs`, `review-launch.mjs` (yes, tests) | seat writes the review brief → reviewer reads brief + standard + tree movement → seat files the verdict | live (audit: review-ladder **sound**) | `tests/review-standard.test.mjs`; roster: reviewer `claude-code opus`, land `gpt-6-astra` |
| 9 | Review corpus | Per-lane folder: plan, attack, briefs, builder reports, review rounds, check outputs | `docs/reviews/<lane>-<date>/` (255 folders); no check reads the content | seat, builder and reviewer write → **nothing reads it for a later lane** | partial (write-only for later lanes) | Code reads `docs/reviews` only as provenance comments, e.g. `scripts/code-search-config.mjs`. The knowledge index skips `reviews/` (`packages/nana-knowledge/README.md`, sources.json `exclude`) |
| 10 | Review ledger + round cap | Records each round, caps rounds per item, keeps outputs in the lane folder | `bin/review-ledger.mjs`, `review-round.mjs` (yes) | seat runs `keep` before the final round → nana-land verifies the rounds | live, but the keep step is a hand step | Memory `feedback_run_review_ledger_keep`: keep was missed in 3 of 15 keepable lanes |
| 11 | Land gate | Fast-forward land only for a revision every reviewer accepted, with green CI | `bin/nana-land.mjs`; `.git/nana/land-records.jsonl` (66 lines, clone-local) | seat runs it → product report and build-report read the records | live (audit: land-gate **sound**) | `tests/land-records.test.mjs`, `land-ci-records.test.mjs` |
| 12 | Build records | One record per builder attempt | `.git/nana/build-records.jsonl` (272 lines, clone-local) | pi-worker writes → `bin/build-report.mjs` and the product report read | live but local: one clone, never in git | `tests/build-records.test.mjs`; `scripts/deliverables.mjs` |
| 13 | Known-bug files | One line per non-blocking finding, filed by feature | `docs/known-bugs/FEAT-*.md` + `unplaced.md` (30 files, about 1,678 lines); `scripts/known-bugs.mjs` checks names only | seat writes from review findings → pi-worker appends the feature's file to every brief → planner told to read it → outside-reader avoids repeats | live read path; no burn-down or size limit | `node scripts/known-bugs.mjs --root .` prints `names=0 sizes=0`. `bin/pi-worker.mjs` @inputs: "feature known bugs" |
| 14 | Code map + impact | Module headers, layer edges and blast radius for every mapped file | `docs/code-map.md` (5,141 lines); `scripts/code-map*.mjs`, `blast-radius.mjs`; `.git/nana/runtime-map.json` (yes, map:check in the suite) | builder regenerates with each change → planner runs map:impact and map:search; lane-class reads one import hop | live (audit: code-map **sound**) | `node scripts/code-map.mjs --check`: 500 modules, 0 problems |
| 15 | README contract | Every command or path a README names must exist | `scripts/readme-check.mjs`, `readme-check.config.json` (yes, suite) | builder keeps it green → the land needs it green | live | `node scripts/readme-check.mjs --check`: 904 claims, 0 problems |
| 16 | Lane class | Sorts a change as ordinary or install/hook/gate, which sets the review ladder | `scripts/lane-class.mjs` (yes) | planner puts its line in the plan → pi-worker prints it → seat picks the ladder | live | `tests/lane-class.test.mjs` |
| 17 | HANDOFF frontier | One-screen live state; next items and asks live as GitHub issues | `HANDOFF.md` (28 lines); `bin/nana-frontier.mjs`, `nana-frontier-summary.mjs`, `nana-issue-watch.mjs` (yes, suite) | seat writes inside the reviewed change → session-start block prints it to the next session | live (audit: compass, queue **sound**) | 42 open issues (37 ask, 4 next, 2 parked). `tests/frontier-golden.test.mjs` |
| 18 | Session notes | The narrative of each session, newest first | `docs/sessions/2026-09.md`, `2026-10.md` (4,465 lines) | seat writes before the final round → reachable only through the seat's knowledge pull (docs/ is indexed) | partial (hand-kept; no tool or prompt reads it) | Updated 2026-10-30. No reader in code (grep) |
| 19 | Objective + priority | The umbrella goal and current priority, printed at every session start | `~/nana-agent-loop/OBJECTIVE.md` (outside this repo; nana-pi has no OBJECTIVE.md by design); hooks `nana-objective.mjs` | owner writes → every pi and Claude session reads it, including builder and reviewer children | live (audit: compass **sound**) | HANDOFF line 5; doctor `✓ pi objective file` |
| 20 | Knowledge pull | BM25 index over this machine's markdown stores, injected as pointers when a prompt arrives | `packages/nana-knowledge/`; index under `~/.pi/agent/nana-knowledge/` (1,363 docs, 14 roots) | Claude seat and pi seat read it at each prompt → **builders and reviewers get nothing** (ruling 2026-10-09; `NANA_ROLE`) | partial (audit: library **gap**) | `nana-knowledge.ts status`; README says reviews/ and raw/ are skipped |
| 21 | Claude auto-memory, two tiers | Shared rules plus per-project facts, printed at Claude session start | `~/.claude/nana-memory/shared/MEMORY.md` (86 files); project memory (36 files); hook `nana-shared-memory.mjs` | Claude seat writes and reads → pi sessions, builders, reviewers and other machines never see it | partial (audit: library **gap**: "index descriptions cut to stubs … about 125 entries, newest whole entries begin dropping") | doctor: `! memory links … 70 links name memories not written yet` |
| 22 | Component audit | Hand-audited model of 23 components, with status, gap and ask | `docs/components/nana-pi.json`, `contract.json`; `scripts/component-audit.mjs` (yes: `--check`, suite) | seat audits by hand → hive page and Pages workflow read it; `--asks` feeds planner-shaped asks | partial (hand-kept; check reports staleness only) | Status counts: 16 sound, 4 partial, 1 gap, 2 absent. `--check` prints 2 stale components (66 commits since `a2ad3f21`) and 18 of 238 modules unclaimed, including all of `apps/hive` and `bin/nana-main-ci.mjs` |
| 23 | Product report | HTML ledger of features, deliverables, asks and records | `scripts/product-report.mjs`; `.git/nana/product-report.html`; hand assessments `docs/product-report/assessments.json` | Pages workflow builds it on every push to main → owner and outside-reader read it | live build; partial assessments (last edited 2026-10-21) | `.github/workflows/pages.yml`; audit: notice-board **sound** |
| 24 | Deliverable registry | Each produced artifact names the run that makes it and the code that reads it | `scripts/deliverables.mjs`; artifact lines in REQUIREMENTS.md (yes, tree check) | planner and builder declare → tree check reads them | live | `requirements-tree.mjs --check`: "21 of 21 made and read by code, 21 more parked" |
| 25 | Templates + scaffold/adopt | Copier templates seed REQUIREMENTS, HANDOFF, OBJECTIVE, the code map and sessions in new projects | `templates/`, `copier.yml`, `templates/_shared/`; skills `scaffold-*`, `adopt-*`, `adopt-structure`; `scripts/template-acceptance.mjs`, `template-release.mjs` (yes, acceptance gates every tag) | builder edits → release gate → other projects pull with `copier update` by hand | partial (audit: release-route **partial**) | Current tag v0.6.41. Adopted projects: two at v0.6.21 and one at v0.6.7. No tool flags this drift (grep for `_commit` finds no checker). Templates seed no `docs/known-bugs/`; all three projects have 0 known-bug files |
| 26 | nana-setup + doctor | One command wires hooks, rules, skills and PATH; doctor is the ✓/✗ check | `packages/nana-setup/`; `bin/install-check.mjs`, `stale-copies.mjs` (yes, install-check in CI on both legs) | owner or seat runs install → every session reads what it installed | live (audit: setup **sound**) | doctor on this machine: 2 missing (verifier-pipe hook, pi nana-seat.md) and 1 warning |
| 27 | Command gate (pi) / verifier pipe (Claude) | Advisory check before protected shell commands and edits | `extensions/nana-gate.ts`; hook `verifier-pipe.mjs` | runs inside every pi session, builders included | live in pi; partial in Claude | doctor `✗ hook verifier-pipe.mjs`. Memory: the owner stubbed it off on 10-19 |
| 28 | Identity scan | Keeps owner names and work words out of the public repo, pages and issues | `scripts/identity-scan.mjs`, `identity-scan.config.json` (yes: suite scans every tracked file; Pages scans output; seat scans issues) | seat runs before each post → Pages and the suite run it automatically | live (audit: identity-scan **sound**) | `identity-scan --root .`: 4,779 files, 0 findings. `tests/identity-scan.test.mjs` (R-2511) |
| 29 | CI + main-CI check | Full suite on macOS, Linux and Windows plus install checks; a seat command reports a red main run | `.github/workflows/ci.yml`; `.git/nana/ci-runs/`, `suite-runs/`; `bin/nana-main-ci.mjs` | push → nana-land refuses until the tip's CI passes → seat runs main-CI at session start and after each land | live for the land; the main-CI step is seat-run | `nana-land.mjs` @outputs; `nana-seat.md` line 23; `frontier-summary-config.mjs` names the command |
| 30 | Roster | Per-machine list of builder, reviewer and land models | `~/.pi/agent/nana-pack.json`; `bin/nana-roster.mjs` | owner sets it → printed at session start → pi-worker and the review launchers read it | live | `nana-roster`: builder luna, larger sol, reviewer Opus, land astra |
| 31 | Mutation runner + seat wrong-code pairs | Proves tests fail on broken code in install, hook and gate lanes | `packages/nana-pack/lib/mutation-runner.mjs`; `docs/reviews/<lane>/seat-mutate*` | seat runs → reviewer and land read the outputs | live for those lanes only | `tests/mutation-runner.test.mjs` |
| 32 | Visual and outside readers | First-look shots, a judge against the reference and a cold reader of the page | `scripts/first-look.mjs`, `visual-reader.mjs`, `outside-reader.mjs` | seat runs on page lanes → owner reads the shots | live for page lanes (audit: eyes **sound**; visual-reader unclaimed) | `nana-seat.md` |

## 1. Three gaps that most weaken "nana makes consistent products"

**Gap 1: lessons do not flow to the next lane's planner or builder.** Consistency today comes from rules and checks, not from accumulated knowledge. The review corpus (255 lane folders) has no reader. The knowledge index skips `reviews/`. Builders and reviewers get no knowledge pull, by the 10-09 ruling. Lessons such as "diff-check builds for removed escapes" or "push the draft PR at build 1" live in Claude project memory. Only the Claude seat on this one machine sees that memory. The audit already marks Library as the only `gap`. A sceptic's "no apparent knowledge base, memory" lands here. The only automatic carry from past lanes into a build is the feature's known-bug file.

**Gap 2: consistency across projects is not checked.** The templates seed the frame: rows, HANDOFF, OBJECTIVE, the code map and sessions. Adopted projects sit 20 to 34 tags behind (v0.6.7 and v0.6.21 against v0.6.41). Doctor and stale-copies report nothing about that drift. Templates seed no known-bug folder, and none of the three projects has one. Inferred: the full lane loop with its records runs only in nana-pi, so "products" in the plural is not yet shown.

**Gap 3: the hand-kept summary layers drift, and only a person catches it.** The component audit is hand-audited. Its check prints staleness and 18 unclaimed modules, including the whole hive and the main-CI tool, but nothing blocks. Product assessments were last edited on 10-21. The memory index has 70 dangling links and truncates descriptions. Known bugs grow by design, about 1,678 lines, with a name check only and no burn-down. The rows, map, README and identity checks are mechanical and green. The layers a reader would actually see (audit, report and memory) depend on the seat remembering to update them.

## 2. How the lane loop reads and writes

```
            OWNER ── wish / answer on an `ask` issue
              │
              ▼
  ┌──── SEAT (Claude or pi) ─────────────────────────────────────────────┐
  │ READS at start: objective+priority, HANDOFF, open issues, rulings,   │
  │   seat guide, roster, main-CI report; Claude only: shared + project  │
  │   memory; each prompt: knowledge pointers                            │
  │ WRITES: readings for the owner, then an `ask` issue (scanned)        │
  └──────┬───────────────────────────────────────────────────────────────┘
         ▼
  PLANNER + ADVERSARY
   READ: rulings, AGENTS.md, REQUIREMENTS rows, map:search (precedent),
         map:impact, the feature's known-bug file, lane-class
   WRITE: plan.md (Precedent, Threat model, Must-meet), plan-attack.md,
          new rows  → docs/reviews/<lane>/
         ▼
  BUILDER (pi-worker; no memory, no knowledge pull)
   READS: brief + Precedent files + appended known bugs + objective + rulings
   WRITES: rows → tagged tests → code; code-map regen; builder-report.md;
           build record (.git/nana)          gate checks each command
         ▼
  SEAT checks: suite, map, README, trace, writing, mutation pairs, first-look
         ▼
  REVIEWER (other lineage)
   READS: review brief + review standard + tree-movement.md
   WRITES: round file → MUST = back to builder; else → known-bug line (seat)
         ▼
  SEAT before the final round: HANDOFF + session note + known bugs +
   review-ledger keep (tree-movement.md)
         ▼
  LAND (nana-land): reviewed tip + green CI → ff merge → land record
         ▼
  MAIN push → CI → Pages (product report, hive, identity scan)
         ▼
  NEXT SESSION reads HANDOFF, issues, rulings, objective, memory ─┐
         ▲                                                         │
         └─────────────────────────────────────────────────────────┘
  OTHER PROJECTS: release tag → `copier update` by hand (no drift check)
```

The arrows that do not exist matter too. Nothing reads the review corpus into a later plan. No builder ever reads memory or session notes.

## 3. Capabilities missing from the city story, and where each would sit

Based on `city.json` in the world-graph worktree.

- **Known-bug files.** No place. They would sit beside the Records office as a defect ledger, with a road into the Workshop bays, because pi-worker hands each builder its feature's file.
- **Review corpus and land and build records.** No place. They would sit as an archive behind the Land gate. The story should show it has no road back to the Drafting office yet.
- **Precedent search.** The Survey office exists but links only to the Workshop. A road from Survey to Drafting would show map:search feeding the plan.
- **Tree movement.** Not shown. It is a sheet carried from the Records office up the Review ladder.
- **Session notes.** Not shown. They would be a town diary beside the Library theater, since they reach only the seat's pull.
- **Main-CI check.** Not shown. It is a watchtower on the road past the Land gate, reporting red runs back to the Reception tower as issues.
- **README contract and requirement trace.** Not shown. Both are checks inside the Records office.
- **Lane class and round cap.** Not shown. The lane class is a sorter in the Dispatch yard that picks the ladder height. The round cap is a counter on the ladder rungs.
- **Doctor.** Not shown. It is an inspector at Utilities.
- **Template drift.** Not shown. It is the missing return road from Customer towns to the Freight terminal.

Two lines in the narration contradict the code. "The library theater broadcasts the memory the lane needs" to the bays is wrong for builders: the 10-09 ruling and `NANA_ROLE=worker` turn the pull off. "Each lane's findings return to the library theater as new tapes" holds only for session notes and known bugs under `docs/`. The review corpus is excluded, and memory is written by hand by the Claude seat.

## Summary

1. The backbone has 32 mechanisms. About 20 are live: produced and read by tools or prompts.
2. The checks are strong and green: 2,210 rows (1,959 traced), map 0 problems, README 904 claims, identity scan 0 findings.
3. Precedent, known bugs and rulings are the live channels into each build.
4. Learning is the weak link. The 255-folder review corpus has no reader, and the knowledge index excludes it.
5. Builders and reviewers get no memory and no knowledge pull. Claude memory is seat-only and machine-local.
6. The audit marks Library as nana-pi's only `gap` and flags truncation at about 125 entries.
7. Consistency across projects is unchecked. Adopted projects sit at v0.6.7 and v0.6.21 against v0.6.41, and no tool flags it.
8. Hand-kept layers drift: 2 stale audit components, 18 unclaimed modules, assessments from 10-21, 70 dangling memory links.
9. The city story leaves out known bugs, the review archive, precedent search, tree movement, the main-CI check and doctor.
10. Two city lines overclaim: builders receive no broadcast memory, and review findings do not return to the library.
