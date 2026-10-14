# Research A — what a new or adopted project gets today

Base: main 5b53ebc, read only. Stakes: medium blast (templates ship to every project; copier never rewrites an
existing REQUIREMENTS.md). Method: read the cited files; rendered all four modes from HEAD into `render/` here
and ran both rails, the tree checker and the product report on them.

## 1. Short answer

- New and adopted projects start with a **flat, numbered-section ledger**: no CAP/FEAT/SUB heading. The seed,
  the requirements skill's audit mode and the adopt/scaffold skills all produce that layout (§2, §5).
- **Neither rail reads headings**; a tree-shaped ledger passes both unchanged (§3, run).
- **The product report refuses today's seed**: every row fails "not in a feature or subgroup table" (§3, run).
- **No test pins the seed's headings**; tests pin row IDs, statuses and the Part G set (§4).
- **`copier update` never delivers a new seed to an existing project** (skip-listed; R-582 pins it unchanged, §6).
  Sorting a flat ledger into the tree must be a skill or command step.

## 2. Row format and layout a project starts with

- `copier.yml:8` `_subdirectory: "templates/{{ language }}/template"`; `:13-20` `_skip_if_exists` lists
  OBJECTIVE.md, HANDOFF.md, **REQUIREMENTS.md**, docs/sessions/README.md, docs/code-map.md; tag-pinned (`:4-6`).
- Seeds `templates/{python,typescript}/template/REQUIREMENTS.md.jinja` are near-identical (marker syntax,
  evidence path form and allowance location differ).
  - Preamble "standing, numbered requirement set … **EARS** form" (py/ts `:4-6`); statuses py `:11-13`; IDs `R-`/`G-`
    + three digits or four not starting with 0 (py `:45-46`, ts `:43-44`); four-cell piped row, `| R-` reserved (py `:48-50`).
  - Scaffold: `## 1. The product` + table + R-001 `implemented` (py `:83-87`, ts `:81-85`).
  - Adopt: `## 1. The product`, empty table, "No product rows yet … audit mode extracts them" (py `:75-81`, ts `:73-79`);
    every G row `untested` (`_shared/requirements-general.md:2`).
  - Part G via `{% include "templates/_shared/requirements-general.md" %}` (py `:89`, ts `:87`): `# Part G. …`
    (`_shared/requirements-general.md:13`) and `## G1.`…`## G5.` (`:23,33,46,54,62`), one table each, 22 rows.
  - Tail: `## Open questions`, `## Deliberate omissions` (py `:91-103`, ts `:89-101`).
- `REQUIREMENTS-general.md` renders from the same include only (`python/template/REQUIREMENTS-general.md.jinja:1`);
  template-owned, not skip-listed, refreshed by update (R-581). The rail takes Requirement cells from it and
  Status/Evidence from REQUIREMENTS.md.
- Rendered py scaffold headings: `# Demo App requirements` (1), `## 1. The product` (55), `# Part G.` (61),
  `## G1.`–`## G5.` (71–110), `## Open questions` (119), `## Deliberate omissions` (126); 23 rows (adopt: 22).
- Flat framing in rendered prose: README "the standing, numbered requirement set"
  (`python/template/{% if not adopt %}README.md{% endif %}.jinja:31`, ts `:33`); AGENTS bullet py `:38-40`,
  ts `:37-39`; shared section "look up affected `REQUIREMENTS.md` rows by ID" (`_shared/working-under-nana-pi.md:3`).
- `nana-setup project` writes no REQUIREMENTS.md: it seeds only OBJECTIVE.md, HANDOFF.md, docs/sessions/README.md
  (`packages/nana-setup/lib/project.mjs:113`); no `REQUIREMENTS` in `packages/nana-setup/{lib,bin}` (grep).

## 3. What reads REQUIREMENTS.md in a project, and what tree headings would break

| Reader | Parse | Effect of CAP/FEAT/SUB headings |
|---|---|---|
| Python rail `tests/conftest.py` (runs at pytest session end, `:513`) | Line-based. It keeps only lines that start and end with `\|` and whose first cell matches `ID_RE` (`:54`, `:171-203`). Near-miss rows: `:59`, `:80-94`. Merge with the general file: it drops every `\|` line, then appends the merged rows (`:426-461`). | **None.** Headings, `Purpose:`, `Status:` and `Also applies:` lines are ignored. Run: the tree variant gave 65 passed, a clean rail summary and "ears: 0 rows off form". |
| TS rail `tests/requirements-trace.ts` (`check`, `:507`) | `requirementRowId` and `ROW` (`:59-69`); `loadRequirements` (`:219-261`); the merge filters out row lines (`:548-567`). | **None.** Run: 0 problems on the flat seed and 0 on the tree variant. nana-pi's own 1,754-line tree ledger already runs through this exact file via the shim `scripts/requirements-trace.mjs:21`. |
| Rail self-tests (`test_requirements_trace.py.jinja:447`, `requirements-trace.test.ts.jinja:574`) | Run `check()` on the project's own file for the EARS count. | None (same parser). |
| code-map, readme-check (both langs) | Do not read it. A grep finds only comments (`typescript/template/scripts/code-map.mjs:392,402`). | None. |
| Tree checker `scripts/requirements-tree.mjs` (nana-pi only, not shipped) | Structural: `HEADING` `:16`; rows must sit under FEAT or SUB (`:121-136`); `Purpose:` (`:138-148`); nesting (`:155-170`); `Status:`/`Also applies:` (`:172-207`). | Today's seed **fails**: 23 problems on scaffold, 22 on adopt (every row: "is not in a feature or subgroup table"). The tree variant: **0 problems**. `main()` reads `REPO_ROOT` only (`:390`) and has no `--root`. |
| Product report `scripts/product-report.mjs` (nana-pi only) | `--root` exists (`:308`). It throws when checkTree reports problems (`:204-206`). It needs git HEAD (`:216`) and HANDOFF.md (`:208`). | The flat render is refused ("requirements tree checker problems: line 59: R-001 …"). The tree variant **writes the report** (`report-tree-py.html`). The seed HANDOFF has `## Open`, not "Open for Jake" (`_shared/HANDOFF.md:11`; `handoff-asks.mjs:11`), so a seeded project yields zero asks without an error. |

Tree variant (`mktree.mjs` here): `## 1. The product` → `# CAP-01` + `## FEAT-001` (`Status: active`);
`# Part G.` → `# CAP-02` + `## FEAT-002`; `## G1-5` → `### SUB-001…005` with `Purpose:`; tail → `# Open questions
and deliberate omissions`. Checker constraints: every G row needs a FEAT/SUB home (nana-pi: FEAT-033,
`REQUIREMENTS.md:1503-1523`); a `proposed` FEAT must hold no rows (`requirements-tree.mjs:189-191`); a heading
with no ID resets the row home and is ignored by checkNesting.
INFERRED (not run): the report imports a `.ts` file (`scripts/requirements-trace.mjs:21`); Node 22.22.2 needed
no flag here, an older Node 22 on a Windows seat would need `--experimental-strip-types`.

## 4. Tests that pin today's seed

- `packages/nana-pack/tests/templates-render.test.mjs` — all regexes over `| G-`/`| R-` rows, none reads a heading:
  `partG()` `:165-177` (R-737) G-001..G-022 once each, no Jinja; `:466` scaffold R-001 `implemented` (**no req
  marker**); adopt `:650-654` (no markers) nothing `implemented`, 22 G `untested`, **no R row emitted**;
  `:193-201` (R-756) nana-pi's G cells mirror the shared file.
- `packages/nana-pack/tests/templates-update.test.mjs`: R-581 `:102,110-118` (general file not skip-listed, its
  jinja is exactly the include, 22 rows); R-582 `:259` v0.6.0 scaffold updated to HEAD keeps REQUIREMENTS.md
  byte-identical, rail clean; R-583 `:255` Python prints "part g: 6 cells … differ".
- `scripts/template-acceptance.mjs` (`npm run template:accept`): renders scaffold+adopt for both languages at one
  SHA (`:76-90`) and runs the native gates, i.e. full rail runs (`:19-21`); the adopt fixture strips the
  `req: R-001` marker (`:69`) because the adopt seed has no R-001.
- Grep: no test anywhere pins `## 1. The product`, `# Part G`, `## G1-5` or the `Open questions`
  heading text. Searched: nana-pack, nana-setup and nana-knowledge tests, and `scripts/`.
- Skill claims (R-599/R-629): every path and command the requirements skill names is judged
  against the rendered py and ts scaffolds (`packages/nana-pack/tests/skill-claims.mjs:22`;
  `templates-render.test.mjs:389-392`). If the skill starts naming `docs/requirements-tree.md`,
  `npm run req:tree` or a report command, a rendered project must carry it, or the claim needs an
  exemption (`skill-claims.mjs:28`).
- nana-pi rows that hold this contract are in SUB-019 "Render language templates"
  (`REQUIREMENTS.md:860-876`: R-737, R-738, R-581, R-582, R-590 …).

## 5. Where the flat layout comes from beyond the seed

- Requirements skill, `packages/nana-pack/skills/requirements/SKILL.md`. One copy serves both
  seats: it is symlinked at `~/.claude/skills/requirements` and listed in pi's `package.json:23`.
  - `:126` already states tree rules ("add each new row to the table of the feature it serves",
    `Status:`, `Also applies:`, "Jake decides tree changes", "the outline's shared-requirements
    index"). It reads as nana-pi-specific: a project has no outline and its owner is not Jake.
  - Audit mode `:128-166` is flat: workers cover "numbered sections" (`:135`) and ID blocks are
    allocated per repo or area (`:148-151`). `:163-166` says to "Put a general-engineering block
    (G1 … G4) at the end as its own Part". This is the most likely origin of the Windows
    project's flat ledger. INFERRED: I did not read that project.
- Audit-mode prompts in the other skills:
  - adopt-py `:137-150` and adopt-ts `:159-172` say "extract EARS rows"; their file list marks
    REQUIREMENTS.md as "(written only when absent)" (adopt-py `:75`, adopt-ts `:90`; pinned by R-590).
  - adopt-structure `:163-173` says "add the standard `Part G` engineering block" and that the
    skill writes no REQUIREMENTS.md itself.
  - scaffold-py and scaffold-ts `:44-49` say "one EARS `shall` row per behaviour".
- The tree tooling is not shipped. A grep of `templates/` and `packages/nana-setup/{bin,lib}`
  finds no `CAP-`, `FEAT-`, `requirements-tree` or `product-report`. The rendered TS
  `package.json` has no `req:tree` or `report` script (`package.json.jinja:14-19`).

## 6. Release and update path

- Template changes ship only through a tag. `npm run release` (`scripts/template-release.mjs:30-56`)
  gates on acceptance (`:46`) and counts commits on `RELEASE_SURFACE = ["templates","copier.yml"]`
  (`packages/nana-pack/lib/release-status.mjs:12`). CI releases after green on main
  (AGENTS.md, Layout).
- Existing projects:
  - REQUIREMENTS.md is skip-listed (`copier.yml:15`), and R-582 pins it unchanged under update.
    A new tree seed therefore reaches only fresh scaffolds and adopts into a folder with no
    REQUIREMENTS.md.
  - `REQUIREMENTS-general.md` does refresh. If `_shared/requirements-general.md` gains tree
    headings, existing projects get them in that file. The rails are heading-blind, so this is
    harmless. INFERRED: copier's 3-way merge would show it as a diff.
  - The include feeds both files (py `REQUIREMENTS.md.jinja:89` and
    `REQUIREMENTS-general.md.jinja:1`). Tree headings that only REQUIREMENTS.md should carry need
    either a separate include or a Jinja switch around the shared headings. INFERRED: a Jinja
    include sees the parent's `set` variables, as `_shared/requirements-general.md:1-2` already
    reads `language` and `adopt`.

## 7. Overlap with the roster lane (worktree nana-pi-wt/roster, not on main)

Its `main...HEAD` diff touches: `templates/_shared/working-under-nana-pi.md` (two new Working-pattern bullets:
Default pattern, Seat land review); AGENTS.md (shared region, Layout line); `templates-render.test.mjs`
(R-1126–R-1128 checks); REQUIREMENTS.md (R-1120–R-1125 in FEAT-006, R-1128 in SUB-012, **R-1126/R-1127 in
SUB-019**, the template subgroup above); `docs/requirements-tree.md`; `requirements-tree.test.mjs:38` (R-291 leaf
total 1,104 → 1,113). A tree-in-templates lane hits the same SUB-019 table, leaf-total literal, outline and render
test, and the shared section if its line 3 ("rows by ID") changes. Start after roster lands or rebase on it.
Main's highest R ID is R-1111; roster takes up to R-1128.

## 8. Facts the plan must respect

1. The rails need no change for a tree. Both languages have a run as proof.
2. The tree checker and the product report live only in nana-pi's `scripts/`. The checker CLI reads only nana-pi's
   root (`requirements-tree.mjs:390`); the report takes `--root` (`product-report.mjs:308`) and worked on a render.
   Shipping them into projects versus running them from a nana-pi checkout is research B's or the plan's call.
3. The adopt seed must keep "no R row" (`templates-render.test.mjs:653`). A tree adopt seed holds
   either Part G only under a FEAT, or a `proposed` product FEAT with no rows.
4. Sorting an existing flat ledger must be a skill or command step. Copier will not touch the file.
5. Audit-mode text (`SKILL.md:135,148-151,163-166`) and the three adopt/scaffold skills must change
   with the seed, or the next audit regenerates a flat ledger.
