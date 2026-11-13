---
name: requirements
description: Maintain REQUIREMENTS.md, trace, sealed tunables, module headers, code map and README claims. Use for requirements, tree lift or regroup, conflicts, failing-now checks and audits. Not for task specs.
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

## 1. The workflow — validation, rows, then code

In order, every time:

1. **Name the validation.** State the run, its input and the exact result it must show.
2. **Diff the rows.** Add one row per behaviour, no wider than its check; retire a row the
   change removes. Never renumber. Write the row before code as one falsifiable `shall` sentence.
3. **Write only the tests the brief names, carrying the markers.** Add a test only when it pins
   a failure that happened, the main use of a kept feature, or a safety line (privacy,
   credentials, rm, identity, Windows paths). Do not demand new tests. A `# req: R-001` (Python) or `// req: R-001`
   (JS/TS) comment directly above the test's call declares the rows that test evidences.
   Stacked markers merge into one declaration. A new row lands `planned` or `untested` with
   no marker, or `implemented` with the marker and the test green — never `implemented` ahead
   of the test.
4. **Then the code.** The suite is the gate; the rail is what keeps the ledger honest.

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

Use six-tag module headers and named exports. Run the impact command before touching a mapped module; keep `map:check` green at every land.
Read `references/code-map.md` when changing modules, README claims or the requirements tree.

## 5. Audit mode — an existing project with no rows yet

Extract rows from documented contracts and tests, then audit conflicts and false statuses. Rule blocking conflicts before cleanup.
Read `references/audit.md` when auditing an existing project with no rows yet.

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
