# Research C — how an agent understands an existing repo well enough to propose its feature tree

nana-pi main `e451c90`, 2026-10-15. Subjects read only: `~/work-desk` main `7dee19b` (clean), `~/basketball-geek` main `98192e3`
(dirty: another session's ledger, source and test edits). Every run was on copies under `plan-regroup/subjects/` (nana-pi copy = `git archive HEAD`).
Ran: `signals.mjs` → `signals-output.json` (per-project signals); `ground-truth.mjs` → `ground-truth-output.json` (signals vs nana-pi's ruled tree); an inline draft scorer.
Stakes: medium blast, reversible until `--write` — a proposal is read-only, but a misfiled row passes the tree checker silently (lift research-ledgers.md:4, :74).
INFERRED marks anything not read or run.

## 1. What a nana project already carries (the inputs)

| Carrier | Where | What it gives the proposer |
|---|---|---|
| Ledger rows + Evidence cell | `REQUIREMENTS.md`; form `tests/<file>::<title>` (SKILL.md:14-20) | row text, status, the test file that pins it; sibling-repo cites `repo:test/...` |
| `req:` markers | `// req:` / `# req:` above the test (SKILL.md:29-33; templates/python/template/tests/conftest.py:98) | row → test file, checked by the rail (SKILL.md:36-38) |
| Six-tag headers | `@module/@purpose/@inputs/@outputs/@effects/@errors` (SKILL.md:81-90) | one-sentence purpose per module — the only code-side prose that is checked |
| Code map | `docs/code-map.md`, generated (scripts/code-map.mjs:1-27) | per module purpose, callers, callees; layers with blurbs (code-map.config.json "layers") |
| README contract | G-012 (SKILL.md:117-124) | first paragraph = what the thing is for → capability purpose/outcome, not the feature cut |
| Product report | scripts/product-report.mjs | per feature: purpose, status, count bar, assessment, shared rows (:81-101); assessment packets carry rows only (:285) |
| Audit mode | SKILL.md:134-173 | read-only workers, ID blocks per area, extraction-notes file for judgement calls, pass 2 conflicts |
| Tree lifecycle | REQUIREMENTS.md:40-42; requirements-tree.mjs:189-191 | `proposed` = agreed, no rows yet; the checker refuses a proposed feature that holds rows |

Honest variation already present: basketball-geek marks tests with `@pytest.mark.req("R-012")` (tests/conftest.py:3), not `# req:`;
it has 0 of 84 modules with a six-tag header and no code map; work-project's map excludes `test/` (docs/code-map.md:9-11).
The Evidence cell is the uniform carrier: it agrees with the markers on 154/154 (work-project) and 151/151 (basketball-geek working copy) marked rows.

## 2. Measured: which signal predicts the owner's feature

Ground truth: nana-pi's ruled tree (1,136 rows, 8 caps, 39 features, 849 traced rows, 144 test files). Each row takes the majority feature of its test files.

| Signal | Predicts feature | Predicts capability | Source |
|---|---|---|---|
| Test file majority (nana-pi) | 85.9% | 94.1% | ground-truth-output.json |
| Test file majority (basketball-geek draft, 25 features) | 72.4% (105/145) | — | inline scorer |
| Package / top directory majority (nana-pi) | 19.2% | 48.5% | ground-truth-output.json |

Caveat (INFERRED): nana-pi's tree grew from its old sections (90.1% of rows sat in their section's majority capability,
requirements-proposal-2026-10-09/README.md "Placement quality"), and tests were written per section, so the 85.9% is partly circular.
The draft's lower 72.4% is the honest figure for a finer cut: 9 sections became 25 features, and only 17 of 25 drew from one section.

Purity on the subjects (share of a unit's linked rows in its top old section):

| Unit | work-project | basketball-geek |
|---|---|---|
| Test file (its markers) | 87.6% (46 files) | 92.8% (30 files) |
| Module, via every test that imports it | 81.9%; 14 modules span ≥3 sections | 69.9%; 32 span ≥3 |
| Module under test (test name = module name) | 92.8% (6 modules) | 95.9% (18 modules) |
| Directory | `app/src/canvas` 90%; `server` 22%; `packs/desk-native` 28% | one flat package: 26% |

Reading: a test file is the strongest cheap signal. A module imported by many tests is shared plumbing, not a feature home —
work-project `packs/desk-native/fixture.mjs` (10 sections), `build.mjs` (10), `queries.mjs` (10), `server/index.mjs` (8);
basketball-geek `db.py` (5), `cache.py` (4), `crosswalk.py` (6), `bref.py` (6). Those are `Also applies:` candidates,
which is one more reason the regroup needs share support. Directories help only where the layout is already feature-shaped (UI folders).

## 3. Recipe: signals → features

1. **Rows first, by evidence.** Read each row's Evidence cell; group rows by cited test file; seed one candidate feature per cluster of
   test files that share rows. Cross-check with markers where present. This places 52% (work-project, 191/365) to 88% (basketball-geek, 145/165 at HEAD) of rows.
2. **Unevidenced rows by text.** `untested`, `planned`, `violated` and sibling-cited rows carry no local file. A model places them by
   the row text against each candidate feature's purpose, as the basketball-geek draft did; every non-obvious placement goes in a
   judgement-calls list (draft: 13 placement calls, 12 split-candidate rows, 3 stale-status finds).
3. **Purpose from code.** Write each feature's `Purpose:` from its modules' `@purpose` lines (or docstrings when headers are absent),
   and each capability's purpose/outcome from the README's first paragraph and `OBJECTIVE.md`. Never from the old section label alone —
   basketball-geek §9's label is provenance prose ("direction from the owner 2026-10-01, after …"), research-ledgers.md:56-57.
4. **Shares from plumbing.** A row pinned by tests of several candidate features stays in its majority home and is listed in the
   others' `Also applies:`. The first-pass draft lists shares on 6 of 25 features.
5. **Split time-boxed sections.** A sprint or lane section is not a feature: work-project §36 "Sprint 2026-10" (REQUIREMENTS.md:501) holds
   four prose-labelled lanes (518, 534, 544, 560); `36b` appears twice (484, 570). The lift keeps these as one FEAT-037 of 41 rows.

## 4. Code with no rows → proposed features

Mechanical filter: a module no marker-traced test imports, and whose name the ledger never mentions. Result: work-project 8 of 95,
basketball-geek 20 of 84 (signals-output.json "gapCandidates"). The list over-counts; each candidate needs one more read:

- **Reached through a covered module** — not a gap. basketball-geek `build_draft`, `build_philosophies`, `build_rank_costs`,
  `build_types` are imported only by `build_arena`/`build_simulation`; `opportunity` by `comps`/`eval_boards`. Use the import graph.
- **Covered by an `untested` row that names no file** — not a gap. work-project `app/src/screens/Workspace.tsx` and `app/src/ui/Floating.tsx`
  are the source of §8's untested rows (work-project docs/requirements-extraction-2026-10-01.md:12). Only a read of the row text finds this.
- **A thin CLI over a tested library** — a row gap, not a feature gap: basketball-geek `age_relative`, `player_comps`,
  `progression_atlas`, `young_risers`, `context_report`, `rookie_cohort`, `blocks_cli`, `backfill_claim_binding` (docstrings).
- **A whole surface with no rows** — a proposed feature. basketball-geek's model-analyst loop: `scripts/analyst_pass.py`,
  `assess_analysts.py`, `design_methods.py`, `consensus_board.py`, `current_boards.py`, `predict_board.py`, plus the `analysts/` and
  `loops/` trees. Only R-099 mentions an analyst (REQUIREMENTS.md:113). The draft's question 6 names "analyst boards" without placing it.
  work-project: `packs/desk-native/cluster-records.mjs` (@purpose: one record row per source identity) and `PackFlags.tsx` (realism flag)
  look like row gaps inside existing features (INFERRED from headers only).

How to express it: a `Status: proposed` feature with a `Purpose:` and no rows — the checker already enforces "no rows"
(requirements-tree.mjs:189-191). Its rows come later as a separate requirement diff, drafted `untested` (the honest default for code that
appears to hold a row, SKILL.md:144-146) in a fresh ID block. Keep the regroup itself move-only, so the lift's byte-identity proof still holds.

## 5. What the owner reviews

- **Machine form: a lift mapping file.** The lift already validates `tree[cap{id, from, features[{id, from, rows, also_applies,
  subgroups[{id, from, rows}]}]}]` (requirements-lift.mjs:445-461) and writes `Also applies:` (:740), though it refuses shares
  today (:155-156). The proposer emits this; the reviewer checks it; the lift applies it after the owner's yes.
  Mapping, report and probes are plain files node writes, so both seats on macOS and Windows can use them (INFERRED; not run on Windows).
- **Owner form: the product report rendered over the proposed tree.** Apply the mapping to a scratch copy, then run
  `product-report.mjs --root <copy>`. The owner gets the Product view (capabilities with purpose and outcome), Features (count bars),
  Shared, and Issues (product-report.mjs:55, 81-103) — the same page he will use afterward. Gaps show as `proposed` features.
- **What the report lacks for a proposal** (a build item, INFERRED cost small): a "Proposal" view with the judgement calls, the
  gap list with its code evidence, split candidates, stale statuses and numbered questions — the basketball-geek draft's
  closing sections are the template. Also a moves table (old section → new feature) for the reviewer; the owner reads results, not moves.
- **Gates to handle:** the report needs a tree, `HANDOFF.md` and git in the root (SKILL.md:130; product-report.mjs:208-210).
  basketball-geek has no `HANDOFF.md` (research-ledgers.md:53), so the scratch copy needs an empty one and a scratch commit.
- A markdown draft alone has been tried: basketball-geek's draft (2026-10-10) is still untracked five days on, with six questions open.
  The owner said he cannot read the flat ledger (requirements-proposal-2026-10-09/README.md:10-14); a list of IDs has the same problem.

## 6. Size of the job

| | work-project | basketball-geek |
|---|---|---|
| Rows | 365 (284 impl, 50 untested, 16 planned, 15 violated) | 165 at HEAD (145 impl, 16 untested, 3 planned, 1 retired); 171 dirty |
| Old sections → lift result | 41 (`36b` twice) → CAP-01–06, FEAT-001–041 (research-ledgers.md:41) | 9 → CAP-01, FEAT-001–009 (:56) |
| Rows placeable by test evidence | 191 (154 marker-traced) | 145 at HEAD (all marker-traced) |
| Rows placed by text only | 74 local + 100 citing only sibling repos (Parts B, C) | 20 |
| Modules / with six-tag header | 95 / 95, code map present | 84 / 0, no code map, README stale since 2026-07-19 |
| Test files / with markers | 53 / 46 | 32 / 30 |
| Gap candidates after reading | about 2–3 row gaps, 0 clear feature gaps (INFERRED) | about 8 CLI row gaps, 1 proposed feature (analyst loop) |
| Prior proposal | none | 6 CAP / 25 FEAT draft, untracked |
| Hard parts | inherited Parts B–C (105 rows) are sibling-repo contracts; Part D (40) is inherited but tested here — capability, freeze or move is the owner's call; §36 lanes; duplicate `36b` | dirty ledger — regroup from HEAD only; marker dialect differs |

Effort (INFERRED): basketball-geek is one read-only pass (a draft exists: add the gap pass, emit a mapping, render). work-project is one
worker per Part (six), as the audit allocates per area (SKILL.md:138-158), then seat assembly and a review round.
nana-pi itself (1,136 rows, 107 shared IDs) is already regrouped; it needs share support in the lift, not a new proposal.

## 7. Residuals and open items

- The claim most likely wrong: the 85.9% ground truth over-states accuracy on a project whose tests were not written per section.
- The import scan is regex-only (signals.mjs); a model read is still needed. A rowless `proposed` feature needs a label, not an empty bar (INFERRED).
- Open for the owner: should inherited sibling-repo rows (work-project Parts B–C) become their own capabilities or stay as frozen features?
- Open for the owner: should gap rows land in the same change as the regroup or after it? This research recommends after.
