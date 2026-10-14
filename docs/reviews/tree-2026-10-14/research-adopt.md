# Research C — the adopt path and the real flat ledgers

nana-pi main `5b53ebc`, 2026-10-14. All repos were read only; nothing outside the scratchpad was written.
Stakes: a reorder rewrites every row line's position in a contract file that other sessions edit at the same time, so the cost of an error is high. A lost or changed row is silent unless a proof catches it.
"Ran" marks a command run here, with its scan script at `plan-tree/ledger-scan.mjs`. INFERRED marks a claim that was not read or run.

## 1. Answer in brief

- Today the adopt path does not sort anything. Every path either leaves an existing `REQUIREMENTS.md` untouched or seeds a flat one (section 2).
- The product report refuses all three real ledgers (ran: exit 1 for each). Two of them are flat. The third is a hand-built tree with 29 problems.
- A deterministic sort is possible only as a **lift**. A lift turns Part headings into capabilities, sections into features and sub-headings into subgroups. Row lines stay byte-identical and keep their order, and a proof accounts for every line. A **semantic sort** (rows regrouped by what they enable) is a judgement call. The agent proposes it as a mapping that names IDs only, the owner rules on it, and the same move-and-prove step applies it.
- Recommendation: run the lift at adopt or migration time, which unblocks the report. Offer the semantic sort as a separate per-project lane that the owner gates. Do not run it inside adopt, and never let it rewrite the ledger file in place.
- Delivery: one migration command plus the tree checker and the report, all taking a project root. Not `copier update`, which never touches `REQUIREMENTS.md`. Not `nana-setup project`, whose contract is never-overwrite.

## 2. How adopt treats an existing REQUIREMENTS.md today

- copier never overwrites it: `copier.yml:13-16` (`_skip_if_exists` lists `REQUIREMENTS.md`). The adopt skills say "written only when absent" (`adopt-py/SKILL.md:75`, `adopt-ts/SKILL.md:90`). `copier update` therefore never migrates an adopted project's ledger. Only the template-owned `REQUIREMENTS-general.md` is refreshed (`REQUIREMENTS.md.jinja:52`).
- The seed itself is flat: in adopt mode, `## 1. The product` plus an empty table (`templates/python/template/REQUIREMENTS.md.jinja:75-81`); in scaffold mode, one row (`:83-87`). The TypeScript seed matches line for line apart from language details (ran: diff).
- The seed's Part G block uses non-tree headings: `# Part G.` and `## G1.`–`## G5.` (`templates/_shared/requirements-general.md:13,23,33,46,54,62`). A freshly seeded ledger therefore fails the tree checker on all 22 G rows (inferred from the yokai-world result in section 3, which carries the same block).
- `adopt-structure` writes no `REQUIREMENTS.md` (`adopt-structure/SKILL.md:171-173`). It only offers the requirements audit (`:163-170`).
- The audit mode extracts a flat ledger. It allocates "ID blocks per repo or area" (`requirements/SKILL.md:148-150`) and puts general engineering "at the end as its own Part" (`:163-166`). Only `:126` mentions features, and it says "In this ledger". The audit is scoped to "an existing project with no rows yet" (`:128`), so no step anywhere converts an existing ledger.
- `nana-setup project` never reads the ledger. It seeds OBJECTIVE, HANDOFF and the sessions files (`packages/nana-setup/lib/project.mjs:111-121`). Its steps are listed in `setupProject` at `:411-423`. Its rule is "never overwrites" (`:30`). Ran: `grep -ci requirements` on that file returns 0.
- The report already takes a root: `scripts/product-report.mjs:306-313` (`--root`). Its `buildReport` throws on any tree problem (`:203-206`) and needs a `HANDOFF.md` (`:208`).
- The tree checker requires three things: every row sits in a feature or subgroup table (`scripts/requirements-tree.mjs:121-131`), every tree heading has a `Purpose:` line (`:138-148`), and every feature has a valid `Status:` line before its table (`:188`).
- The checker command line reads nana-pi's own root only (`:15,390`) and splits on LF only (`:61`). The report normalises CRLF before it calls the checker (`product-report.mjs:23,204`).
- Neither script is installed on PATH: the pack's bin list is `packages/nana-pack/package.json:7-13`. Both run only from a nana-pi checkout. That is the Windows trigger: the report run against a flat ledger fails at `:206`.

## 3. The real ledgers (ran: `ledger-scan.mjs`, the report with `--root`, git reads)

| Project | Rows | ID forms | Headings | Tree problems | Rail |
|---|---|---|---|---|---|
| aml-desk `7dee19b` | 365, no duplicates | R-nnn only | 6 Parts, 41 sections, 2 `###` | 365: every row | hand copy `test/requirements-trace.lib.mjs:24-25`, reads `R-\d{3}` only; tests in `test/` |
| basketball-geek `98192e3` | 171 in the working tree (165 at HEAD) | R-nnn only | 9 sections | 171: every row | copier v0.4.0 adopt; decorator markers (`@pytest.mark.req`, 412 uses, 0 comment markers); `tests/conftest.py:29` reads `R-\d{3}` only |
| yokai-world `8b04969` | 959 (704 R-nnn, 233 R-nnnn, 22 G-nnn; 133 retired) | 3- and 4-digit IDs, G | hand-built tree: 6 CAP, 32 FEAT | 29 | copier v0.6.7 TS; comment markers; `tests/requirements-trace.ts:193-196` |
| edge-screener, nana-agent-loop | no ledger | — | — | — | none (edge-screener's `tests/conftest.py` has no rail) |
| nana-pi (reference) | 1,104 | R-nnn, R-nnnn, G | 68 tree headings | 0 | — |

Details that shape the design:

- **aml-desk.** 27 rows sit in table fragments with no header (lines 149-165, 520-525 and 529-532), split off by prose or a blank line. The rails still count them, but the tree checker sees no table there.
  - Two sections share the heading `## 36b. Build at production size` (lines 484 and 570), and section 36 sits between them.
  - Part F's general rows are R-600 to R-610 (lines 605-627), not G IDs.
  - 199 rows are off the EARS form by the template rail's count; `HANDOFF.md:34` says 193. The figure has probably grown with later lanes (inferred). The tree and the report do not need the EARS form.
  - The project is not copier-tracked. It has one branch and no ledger edits.
- **basketball-geek.** Six uncommitted row lines are another session's work (ran: `git diff --stat`, +6). The project has no `HANDOFF.md`, so the report would still fail at `product-report.mjs:208` after a sort.
- **yokai-world.** The 29 problems break down as follows:
  - 22 G rows sit under `# Part G` / `## G1`–`G5` (lines 1266-1306).
  - R-399 is filed inside G2 (line 1288).
  - FEAT-031, 032, 028 and 029 were appended after Part G (lines 1196, 1208, 1235, 1244), which fails the nesting check.
  - FEAT-028 and FEAT-029 have no `Status:` line.
  - That is append-at-end drift: a new feature lands below the template's trailing Part G block.
  - Three unmerged branches edit its ledger (feat/v2-control +46/-7, v2-move +19/-1, v2-target +45/-16). The repo has 36 worktrees.

## 4. What "sort a flat ledger into the tree" can mean

**A. Wrap (deterministic; reject).** Put every row under one `Unsorted` capability and feature. The checker resets the nearest feature at any non-tree heading (`requirements-tree.mjs:127-130`), so A must delete every old section heading. That throws away the grouping the project already has. Use it only for stray rows that fall outside every section; none of the three ledgers has any.

**B. Lift (deterministic; recommended at adopt or migration).** The same input always gives the same bytes:
1. Each `#` Part becomes `# CAP-nn · <old label>`. A ledger with no Parts gets one synthetic capability.
2. Each `##` section becomes `## FEAT-nnn · <old label>`, and each `###` becomes `### SUB-nnn · <old label>`. IDs are assigned in file order. The old heading text is kept in a generated mapping file whose first column is never an R- or G- ID.
3. A `Purpose:` line is inserted directly after each tree heading, with a fixed, recognisable placeholder such as "Not yet sorted: the rows of old section <label>". Each feature also gets `Status: active`. The checker needs both before the table (`:138-148,188`), and a feature that holds rows cannot be `proposed` (`:189-191`).
4. Section prose stays where it is. Fragments with no header get the standard header and delimiter lines.
5. `## Open questions` and `## Deliberate omissions` move under one closing non-tree `#` heading, as nana-pi did (`docs/reviews/req-tree-2026-10-09/CHANGE.md:159-161,192-194`). A feature appended later then fails loudly instead of nesting silently.
6. Row lines and their order are never touched.
7. The proof checks every physical line: an unchanged copy, a rewritten heading, or a declared insertion. This follows `CHANGE.md:199-221`, whose output was "1004 BASE rows preserved once … 1652 physical lines accounted" (`prove-output.txt`).

Size per project:
- aml-desk: 6 capabilities, 41 features (the two 36b sections get distinct IDs; duplicate labels are allowed, `CHANGE.md:59`) and 2 subgroups, with 3 header insertions.
- basketball-geek: 1 capability and 9 features.

Limit: the features would be history-ordered sections, not real features. In nana-pi, 35 of 60 sections mixed features (`CHANGE.md:10-12`). The placeholder purposes keep that honest, and the report could count them as unsorted (inferred design).

**C. Semantic sort (judged; owner-gated; applied deterministically).**
- The agent drafts a mapping. It carries IDs, labels, purposes and row lists, never row text (`CHANGE.md:124-127`).
- A deterministic validator checks the mapping: every row exactly once, no unknown ID, no new row ID.
- The owner checkpoint comes before the build (`CHANGE.md:240-243, 274-280`).
- B's move and proof then apply the mapping. Here, rows may reorder only as the mapping says.
- Placement is judgement and is deliberately not pinned (`CHANGE.md:57`).
- Cost precedent: nana-pi's 1,004 rows took one lane with three plan-review rounds, three build rounds and two owner checkpoints (`CHANGE.md:5-6`, plus the review files in that folder).
- aml-desk (365 rows, three parts inherited from sibling repos) is the next largest candidate. yokai-world is already sorted.

**D. Never:** an LLM that edits `REQUIREMENTS.md` in place, or regenerates it, without a mapping and a proof.

Inside adopt, for a project with no ledger: the audit's read-only workers should draft rows straight into features, one feature per area, instead of the ID blocks at `requirements/SKILL.md:148-150`. That change belongs to the skill text, and the template seed must already be a tree (Research B).

## 5. What must never happen (each needs a mechanical check in the migration)

1. **A row lost or duplicated.** The ID multiset before and after must be equal, and the count is printed.
2. **A row line changed by one byte.** That covers text, status, evidence, trailing whitespace and line endings.
   - The report stamps sha256(id, requirement, status) (`product-report.mjs:33`), and the template rail cross-checks G Requirement cells against `REQUIREMENTS-general.md` (`templates/typescript/template/tests/requirements-trace.ts:514-551`).
   - Keep CRLF where the file has it. The checker command line splits on LF only (`requirements-tree.mjs:61`; `HANDOFF.md:45`).
3. **A renumbered row ID, or a new one.** IDs are stable (`requirements/SKILL.md:8-12`).
   - The aml-desk and basketball-geek rails read 3-digit IDs only, so a new R-1000 there would be invisible rather than red.
   - New heading IDs (CAP, FEAT, SUB) are a separate namespace and are safe.
4. **A new line whose first cell starts with an R- or G- ID.** Examples are an old-section map table or a quoted example. The rails read any such line as a row, a duplicate or a near miss (`CHANGE.md:190-191`; `REQUIREMENTS.md.jinja:48`). All three rails find rows by line shape, not by heading (aml-desk `lib:29-33`, `conftest.py:59-84`, yokai `requirements-trace.ts:193-196`). A heading-only lift is therefore neutral for every rail.
5. **A non-tree heading left between a feature and its table.** The rows under it are orphaned (`requirements-tree.mjs:127`).
6. **Rewriting a dirty or contended ledger.** Refuse uncommitted ledger edits, as the packets already do (`product-report.mjs:265`); basketball-geek has six such lines today. Warn when unmerged branches edit the ledger: yokai-world has three.
7. **Reordering rows during a lift.** Only an approved mapping (C) reorders.
8. **Renaming `## Open questions`.** The skill points at it (`requirements/SKILL.md:126,157`).
9. **A placeholder purpose that reads like an owner's words.** Use a fixed, recognisable prefix.

## 6. Which projects take it, and how

| Case | Route | Note |
|---|---|---|
| New scaffold | template seed is already a tree | Research B; the Part G form decides the reserved IDs |
| adopt-py / adopt-ts, no ledger | seed lands (copier writes when absent); audit drafts rows into features | skill change |
| any adopt, existing ledger | copier skips it (`copier.yml:16`); the skill runs the migration lift, then offers C | adopt-structure needs its no-ledger rule (`:171-173`) amended or a delegated command |
| basketball-geek (v0.4.0) | migration command in a seat lane | settle the six uncommitted lines first; the report also needs `HANDOFF.md` (`nana-setup project` seeds it); the marker migration is a separate job (`HANDOFF.md:45`) |
| yokai-world (v0.6.7) | hand fix in a seat lane, no lift | Part G becomes one feature (nana-pi precedent `CHANGE.md:182-185`) or the template's Part G form; place R-399; move the four FEAT blocks above Part G; add two `Status:` lines; land after or rebase over the three branches |
| aml-desk (not copier-tracked) | migration command in a seat lane | keep Part F rows R-600 to R-610 as R- rows; C later |
| edge-screener, nana-agent-loop | nothing to sort | they get the seed on adoption |
| `nana-setup project` | report-only check for a flat ledger, at most | a whole-file rewrite breaks its never-overwrite contract (`project.mjs:30`) |

"Runs in any project" also needs both tools to take a project root and ship outside the nana-pi checkout. The checker command line is root-locked (`requirements-tree.mjs:15,390`). The report's missing-HANDOFF failure needs a decision: tolerate it, or seed the file. On Windows the pack's PATH commands are not linked (`CLAUDE.md:5`), so the commands must also run as `node <checkout>/…`.

## 7. Overlap with the roster lane (`~/nana-pi-wt/roster`, ran: `git diff main...HEAD`)

- `templates/_shared/working-under-nana-pi.md`: roster adds two bullets after the land checklist. A tree lane that touches the requirements-first paragraph of the same file must merge after roster lands.
- `REQUIREMENTS.md`: roster adds R-1120 to R-1128 and edits R-684 and R-961, so a tree lane takes IDs above R-1128.
- `packages/nana-pack/tests/requirements-tree.test.mjs`: roster changes the leaf-total literal from 1,104 to 1,113. The `templates-render.test.mjs` file carries the R-1126 to R-1128 checks.
- Roster does not touch the adopt or requirements skills, `copier.yml`, `scripts/`, the template ledgers or `project.mjs` (ran: name filter on the diff).

## 8. Open for the plan

- Is the lift's placeholder tree enough for the report to run, or must the owner's sort come first? Recommend the lift first, with the unsorted features counted visibly.
- Should adopt run the lift on its own, or propose it as a diff the owner accepts? Recommend: the lift runs on its own and is proven; C is always proposed.
- Which IDs does a template-owned Part G feature reserve, so it never collides with a project's own? yokai-world already uses FEAT-001 to FEAT-032. This is for Research B.
