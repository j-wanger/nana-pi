---
name: requirements
description: Work the standing requirement set — REQUIREMENTS.md rows, the `req:` trace rail, sealed tunables, module contract headers, the code map, the README contract, the requirements tree, lifting a flat ledger into it and the regroup that follows. Use when the user mentions requirements, REQUIREMENTS.md, a requirement, trace, "which rows" cover something, no hardcoding, the code map, a module header, the README or readme-check, conflicts between rows, the requirements tree, a lift into the tree, a regroup, or asks what is failing now. Also for the audit mode that extracts rows from an existing project.
---

# Requirements — the standing set, the trace rail, the code map

`REQUIREMENTS.md` is the project's numbered, standing contract. It outlives every task.
Rows are EARS sentences (one `shall` per row, from the Ubiquitous, WHEN, WHILE, IF-THEN and
WHERE templates) and they spec the **contract, not the design**. IDs are stable: never
renumbered, never reused; a requirement that leaves the product keeps its ID with status
`retired`. No `|` inside a cell.

Statuses: `implemented` (a test asserts it, cited `tests/<file>::<test title>` — the project's
test directory, `tests/` in a nana template) · `untested`
(the code does it, nothing pins it) · `planned` (designed, not built) · `violated` (the code
contradicts the row; the cell carries the residual) · `retired`.

Evidence in a sibling repo is cited with the repo as a prefix and that repo's own test directory
(`other-repo:test/x.test.mjs::title`), lives in that repo's suite, and is exempt from the local rail.

## 1. The workflow — diff, then tests, then code

New behaviour is a **requirement diff first**. In order, every time:

1. **Diff the rows.** Add one row per must-meet test, written no wider than the test; retire a
   row the change removes. Never renumber. Write the row before you decide the design — if you
   cannot state it as one falsifiable `shall` sentence, you do not yet know what you are
   building.
2. **Write the tests, carrying the markers.** A `# req: R-001` (Python) or `// req: R-001`
   (JS/TS) comment directly above the test's call declares the rows that test evidences.
   Stacked markers merge into one declaration. A new row lands `planned` or `untested` with
   no marker, or `implemented` with the marker and the test green — never `implemented` ahead
   of the test.
3. **Then the code.** The suite is the gate; the rail is what keeps the ledger honest.

The rail fails the suite when a status disagrees with the markers: an `implemented` row with
no marker and no external evidence, an `untested`/`planned`/`violated` row that a marker
traces, a marker naming an unknown ID, a duplicate ID, an unknown status, a `|` in a cell.

## 2. Status honesty — the rule that keeps the ledger worth reading

Before you flip a row to `implemented`, its test passes and the row says no more than the test
checks. Write the row from the test, not wider; a row wider than its test is an overclaim, and
the fix is to narrow the row.

- **`violated` carries the residual in its own cell** — what the code actually does, and what
  is left. A `violated` row with an empty Evidence cell is a dead row; nobody can close it.
- A test that asserts *near* a clause does not pin it. Value-relative assertions
  (`threshold ± 1`, "some rows came back") pin nothing a retune could break.
- In an install, hook or gate lane the seat also breaks the code and watches the cited test go
  red.

Workers write honest code and an optimistic ledger. That asymmetry is why §6 exists.

## 3. Sealed tunables — no inline literals

A number stated in a row is a **sealed tunable**, not a config default (ruling from a
work project's C10 call, 2026-10-02, generalised):

- Defined **once** per package in that package's declared configuration surface
  (`config.mjs` / `config.py` / `config.ts`), read by name everywhere else. Never an inline
  literal at a point of use.
- **Provenance beside the definition**: the source and date for a measured value, or the word
  `chosen` and the reason for a chosen one. Contract numbers read
  `contract (design §n, R-001)`; requirement IDs use three or four ASCII digits, and four-digit IDs never start with zero.
- **One test pins each sealed value to its row's number**, so a retune fails naming the row —
  and the fix is a requirement diff, not a test edit. Every other assertion imports the name.
- A value that tunes behaviour counts: threshold, cap, weight, budget, timeout, port, path,
  model name, seed, distribution constant, vocabulary.
- Retuning a tunable must change **no code**. If it does, the row is `violated`.

Two failure directions to watch for, because they look opposite and are the same defect:
value-relative tests let a retune pass while silently falsifying the row's text; literals
duplicated into SQL and oracles make a retune break the build.

## 4. Module headers and the code map

Every module opens with the six-tag contract header:

```
@module  path/to/module
@purpose one sentence — if it needs two, the module is two modules
@inputs  what it reads or is given
@outputs what it returns, writes or emits
@effects none | disk | database | network | process
@errors  the typed errors or statuses it can produce
```

Standing rules: named exports only, where a pi extension's default export counts as its
named entry point (no reaching into another module's internals, private helpers or mutable
state) · resources with identity or side effects (db handles, clocks, random sources,
fetchers, file roots) injected at the boundary so the module is exercisable without the real
resource · imports follow the declared layer direction, and a reverse or layer-skipping
import fails the check · one purpose per module.

The map is generated from the import graph plus those headers, and the check is in the suite:

```
pnpm map            # regenerate docs/code-map.md
pnpm map:check      # fails on a missing/malformed header, a stale entry, a layer violation
pnpm map:impact <files>    # no `--`: pnpm forwards it literally; transitive callers and callees
npm run map:impact -- <files>    # npm requires `--` to forward arguments
uv run python scripts/code_map.py --impact <files>
```

Spelled with the project's runner: `pnpm map:check` / `npm run map:check` over
`scripts/code-map.mjs`, or `uv run python scripts/code_map.py --check` / `--impact` in a Python
project. The post-edit check runs `--check` for you where the project wires one.

**Before touching a mapped module, run the impact command on it** and work from the blast radius
it reports, upstream and downstream. At every land, the check is green: a stale map entry, a
missing or malformed header or an undeclared cross-layer import blocks the land, and the
regenerated map is committed with the change.

**The README is checked the same way (G-012).** A README claim is a row whose evidence is the
readme check, not prose: `pnpm readme:check` / `uv run python scripts/readme_check.py` verifies
that every command the README shows exists (a `scripts` key, or a real script file), every path
and file it names resolves, it carries an install, a run and a test section plus a first
paragraph saying what the project is for, every `--flag` it shows appears in that script's
source, and every script the project ships is named somewhere in the README. It runs in the
suite and on every README edit. **When the README names a command that no longer exists, fix
the README or fix the command — never the check.**

Once the ledger has a tree (capability → feature → subgroup headings), add each new row — including one the audit extracts — to the table of the feature it serves, and name its shares in the requirement diff. Features carry lifecycle `Status:` lines and cross-feature `Also applies:` links. Before changing a row, find every feature that lists it: in nana-pi, the outline's shared-requirements index; in a project with no outline, search the ledger for its ID. The project owner decides every change to the tree; the seat proposes a change and declares it. A new capability, feature or subgroup takes an unused ID and a non-empty `Purpose:` line; CAP-90, FEAT-900 and SUB-900 to SUB-904 are reserved for the general-engineering feature. Keep the `## Open questions` heading for unresolved owner decisions.

A product capability is a product stage or step with tangible deliverables; a constraint capability is a cross-cutting property. Every capability field is optional. In a capability's own span, outside code fences and in any order, `Kind:` is exactly `product` or `constraint`; `Deliverables:` is a comma-separated list of R or G row IDs; `Needs:` and `Binds:` are comma-separated lists of capability IDs; and `Retired:` is a comma-separated list of live successor capability IDs. Lists contain single IDs, not ranges, wildcards or duplicates. Without `Kind:`, the checker treats `Deliverables:`, `Needs:` and `Binds:` as prose. The consumers of a deliverable are derived from the features whose `Also applies:` lines name its row.

The product report's stage view orders capability kinds, shows product deliverables and constraint coverage with gaps, and puts retired capabilities last.

The capability rules carry five amendments:
1. A constraint names every product capability it binds, keeps explicit shares, and carries one tested row per bound stage; there is no implicit every-stage target.
2. A deliverable is a row under the feature that produces it, and its consumer and check stay visible; a missing check is a report gap.
3. Product capabilities are ordered stages only when a later step needs an earlier stage's checked artifact; otherwise they are loops, tool families or services.
4. A feature lives at its main deliverable's stage, and rows consumed in other stages link to it through `Also applies:`; splits need approval.
5. Keep the outcome line, keep every field optional, and retire an old capability ID with named successors instead of relabelling it.

A ledger without a requirements tree keeps its numbered sections; its next step is a lift into the tree, with every row kept byte-identical, then a regroup into capabilities and features that the owner approves. Until then, a ledger with rows and no tree yet is refused by the checker command and the product report with one line naming the row count, saying the ledger has no requirements tree yet, and pointing back here for the next step — in place of one problem per row.

Check the tree with `node "$HOME/nana-pi/scripts/requirements-tree.mjs" --root .`. The product report (`node "$HOME/nana-pi/scripts/product-report.mjs" --root .`) needs the tree, `HANDOFF.md` and git in the project root to build.

A lane brief names its feature as `Feature: FEAT-nnn · <label>`. Before the final review and before the land, run `node "$HOME/nana-pi/scripts/requirements-moved.mjs" --root . --base main`; the review brief and the land report carry that output, and the reviewer reads every feature the output names.

Lift the flat ledger with `node "$HOME/nana-pi/scripts/requirements-lift.mjs" --root .`: a dry run that shows the plan and the proof line, writing nothing — every purpose is a "Not yet sorted:" placeholder. If the ledger holds uncommitted edits, tell the owner; never commit, stash or discard another session's lines to get past the refusal. Run `--write` only after the owner's yes, and only while REQUIREMENTS.md matches HEAD in every worktree of the repository — the lift refuses otherwise, naming the reason. A shape the default refuses (a hand-built partial tree, say) needs a hand fix to the ledger, or a hand-written mapping file applied with `--mapping` — `--emit-mapping` only writes for a ledger the default already accepts, or one that already passes the tree checker. Check the tree, then commit `REQUIREMENTS.md` by its own path with the proof line in the commit message; the reviewer re-runs `--verify <base>` on the tip. Lift only when no other lane is editing the ledger.

**Regroup a flat or lifted ledger (R-1180)** into the capabilities and features the owner approves: `node "$HOME/nana-pi/scripts/requirements-regroup.mjs" --root . --proposal <file> --out <page>`. The proposal is a lift mapping plus one `regroup` object naming what was read (`regroup.read`), a reason per reported line (`regroup.reasons`), text-placed rows (`regroup.placed`), a gap's evidence (`regroup.evidence`) and the review record (`regroup.review`). The drafter reads `req:` markers and Evidence cells, each module's `@purpose` header, the code map, the README's first paragraph, `OBJECTIVE.md` and HANDOFF rulings that freeze or retire work — never session archives or review corpora. A reviewer of another model lineage, or a same-family reviewer named as such, checks every row's placement and every purpose, outcome and section reason before the owner sees the page. Show the page; `--write` with the proposal as `--mapping` runs only after the owner's yes, with the proposal committed, and the reviewer then runs `--verify <base> --mapping <proposal>`. A gap in the tree becomes a `proposed` feature with no rows, never a hand-added row. Before a regroup that moves features, strip the capability fields from the capabilities involved, then add them back.

## 5. Audit mode — an existing project with no rows yet

Extract the standing set from what the project already knows, then find what cannot be true.

**Pass 1 — extraction (read-only workers).** One worker per repo or per area, read-only, each
briefed with:

- **Areas** — the capabilities and features the worker drafts rows under once the ledger has a
  tree (read the design docs, `HANDOFF.md`, phase plans and the test suite; nothing else is a
  source).
- **Statuses** — the five above, with the rule that `untested` is the honest default when the
  code appears to hold a row and nothing checks, and `violated` is for code that contradicts a
  documented rule.
- **Evidence form** — `tests/<file>::<test title>` verbatim from the suite (the project's test
  directory — `tests/` in a nana template), or `<repo>:` prefixed for a sibling, with that
  repo's own spelling. A title you cannot copy exactly is not evidence.
- **Extraction notes** — a separate file (`docs/requirements-extraction-<date>.md`): every
  judgement call on a status, every stale doc claim found, every merged row whose clauses
  should be split later, every artifact format or join key a consumer binds to. This file is
  where the honest uncertainty goes so the rows can stay clean.

Assemble the rows yourself; workers draft, the seat owns the file. Allocate ID blocks per
repo or area up front (`R-001`–`R-199` repo A, `R-200`–`R-299` repo B, …) so later rows never
need renumbering. Then place the markers mechanically (an idempotent script over the cited
titles) and get the rail green.

Set `NANA_REQ_UNCLAIMED=1` and run the suite; the rail prints every test declaration no
marker claims. Treat each listed declaration as a proposal: mark a row it already evidences,
draft a row for behaviour no row states, or leave it. A listed line is never a row or evidence
by itself. A zero count covers only what the grammar sees; `req-candidate:` tests stay listed
until their rows are promoted.

**Pass 2 — conflicts and failing-now.** A second read-only pass, two tables:

- **Conflicts** — rows that cannot all hold at once. Each one: the row IDs, what the conflict
  is, whose contract has to move, and **whose call it is** (the owner, or the seat). Carry them
  in `REQUIREMENTS.md` under `## Open questions`, numbered, until ruled. A conflict is not a
  bug report — it is a decision someone owes.
- **Failing now** — rows whose status is false against the code or the artifacts: an
  `implemented` row no test actually pins, a performance row that is a measured miss, a row the
  committed data contradicts. Correct the statuses the same day the audit lands.

Rule the conflicts that block the work **before** any cleanup pass, or the pass rewrites rows
it should not touch. The seed's general-engineering feature (configuration and provenance,
module boundaries, the code map, documentation — the README contract, G-012 — and the
requirement set itself) already holds the G rows; the audit does not add them again.

## 6. The review rule

**Every land gets an independent reviewer** who reads the diff and asks: does the feature work
for its user, and does the change cause a harm the review standard lists? Rows written no wider
than their tests keep the ledger honest without a clause-by-clause audit.

Also check what the reviewer is placed to catch and the author is not: a refactor that converts
a real resource to a fake can delete that resource's only execution and stay green (coverage of
the deleted path is the check), and an enumerated scan is complete only against the audit that
produced it — invert the walk and let it find its own targets.

## 7. What this skill does not do

- **No per-task spec.** A spec is a task contract that dies when the task closes — that is the
  `spec` skill. `REQUIREMENTS.md` is what evolves and is never thrown away. A task's spec may
  cite rows; it never replaces them.
- **No toolchain, no scaffolding.** A new project gets the file, the rail and the map script
  from `scaffold-py` / `scaffold-ts`; an existing one gets the toolchain from `adopt-py` /
  `adopt-ts` and the navigation layer from `adopt-structure`. Run this skill's audit mode after
  any of those.
- **No row authoring on the owner's behalf for intent.** Objective, priority and the conflict
  rulings are the owner's. Draft, name the call, wait.
