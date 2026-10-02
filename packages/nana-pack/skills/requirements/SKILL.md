---
name: requirements
description: Work the standing requirement set — REQUIREMENTS.md rows, the `req:` trace rail, sealed tunables, module contract headers, the code map and the README contract. Use when the user mentions requirements, REQUIREMENTS.md, a requirement, trace, "which rows" cover something, no hardcoding, the code map, a module header, the README or readme-check, conflicts between rows, or asks what is failing now. Also for the audit mode that extracts rows from an existing project.
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

1. **Diff the rows.** Add a row, split a row that now carries two clauses, retire a row the
   change removes. Never renumber. Write the row before you decide the design — if you cannot
   state it as one falsifiable `shall` sentence, you do not yet know what you are building.
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

Before you flip a row to `implemented`, **name the clause each cited test pins.** Say it out
loud, clause by clause. Then:

- **A row's status is the weakest of its clauses.** A three-clause row with two pinned clauses
  is not `implemented`.
- **Split rather than overclaim.** If one clause is pinned and one is not, split the row (new
  ID for the new half, the original keeps its ID) instead of calling the pair implemented.
- **`violated` carries the residual in its own cell** — what the code actually does, and what
  is left. A `violated` row with an empty Evidence cell is a dead row; nobody can close it.
- A test that asserts *near* a clause does not pin it. Value-relative assertions
  (`threshold ± 1`, "some rows came back") pin nothing a retune could break.
- Mutation is the cheap proof: break the clause, watch the cited test go red. If it stays
  green the citation is wrong.

Workers write honest code and an optimistic ledger. That asymmetry is why §6 exists.

## 3. Sealed tunables — no inline literals

A number stated in a row is a **sealed tunable**, not a config default (ruling from the
aml-desk C10 call, 2026-10-02, generalised):

- Defined **once** per package in that package's declared configuration surface
  (`config.mjs` / `config.py` / `config.ts`), read by name everywhere else. Never an inline
  literal at a point of use.
- **Provenance beside the definition**: the source and date for a measured value, or the word
  `chosen` and the reason for a chosen one. Contract numbers read
  `contract (design §n, R-nnn)`.
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

Standing rules: named exports only (no reaching into another module's internals, private
helpers or mutable state) · resources with identity or side effects (db handles, clocks,
random sources, fetchers, file roots) injected at the boundary so the module is exercisable
without the real resource · imports follow the declared layer direction, and a reverse or
layer-skipping import fails the check · one purpose per module.

The map is generated from the import graph plus those headers, and the check is in the suite:

```
map            # regenerate docs/code-map.md
map:check      # fails on a missing/malformed header, a stale entry, a layer violation
map:impact -- <changed-files>    # transitive callers and callees: the blast radius
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

## 5. Audit mode — an existing project with no rows yet

Extract the standing set from what the project already knows, then find what cannot be true.

**Pass 1 — extraction (read-only workers).** One worker per repo or per area, read-only, each
briefed with:

- **Areas** — the numbered sections the worker must cover (read the design docs, `HANDOFF.md`,
  phase plans and the test suite; nothing else is a source).
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

**Pass 2 — conflicts and failing-now.** A second read-only pass, two tables:

- **Conflicts** — rows that cannot all hold at once. Each one: the row IDs, what the conflict
  is, whose contract has to move, and **whose call it is** (the owner, or the seat). Carry them
  in `REQUIREMENTS.md` under `## Open questions`, numbered, until ruled. A conflict is not a
  bug report — it is a decision someone owes.
- **Failing now** — rows whose status is false against the code or the artifacts: an
  `implemented` row no test actually pins, a performance row that is a measured miss, a row the
  committed data contradicts. Correct the statuses the same day the audit lands.

Rule the conflicts that block the work **before** any cleanup pass, or the pass rewrites rows
it should not touch. Put a general-engineering block (G1 configuration and provenance, G2 module
boundaries, G3 the code map, G4 documentation — the README contract, G-012) at the end as its own
Part, so the engineering bar is rows too.

## 6. The review rule

**Any pass that flips rows to `implemented` gets an independent reviewer** who reads the diff
and asks, for every flipped row: *which clause does this cited test pin?* The reviewer did not
write the code. Expect to lose rows — on aml-desk six of them, the first time.

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
