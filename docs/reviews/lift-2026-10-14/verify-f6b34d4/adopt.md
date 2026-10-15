# Demo requirements

The standing, numbered requirement set for this project. Rows are **EARS** form (Easy
Approach to Requirements Syntax: one `shall` sentence per row, from the Ubiquitous,
WHEN, WHILE, IF-THEN and WHERE templates) and they spec the **contract, not the design**.

- **IDs are stable and never renumbered or reused.** A requirement removed from the
  product keeps its ID with status `retired`. WHEN a row is split, the first clause keeps
  the original ID and the rest take new ones.
- **Statuses:** `implemented` (a test asserts it, and the evidence cell names that test),
  `untested` (the code does it, nothing pins it), `planned` (designed, not built),
  `violated` (the code contradicts a documented rule; the evidence says where), `retired`.
- **Cells contain no `|` character** — it breaks the table and the parser says so.
- **Evidence** for an `implemented` row cites `tests/<file>::<test name>`, backticked so a
  comma inside a name survives — nested paths included (`tests/billing/test_caps.py::test_cap`).
  Prose, a doc link or an empty cell is NOT evidence for `implemented`. Evidence that lives
  in another repo carries that repo as a prefix (`other-repo:tests/...`), is traced in that
  repo's suite, and is exempt from the local-marker rule here.
- **Sealed tunables.** A contract number (a threshold, cap, budget or deadline a row names)
  is defined ONCE in this package's configuration surface, with provenance naming the row
  it serves, and is pinned by one test. Retuning it is a requirement diff first, then the
  number — never a number changed under a row that still claims the old one.

**Trace rail.** A full `uv run pytest` fails when a status disagrees with the suite. A test
declares the rows it evidences with a comment directly above its `def test_...` line (decorators may
sit in between), and stacked comment lines merge:

```python
# req: R-001 G-004
def test_a_bounded_page_never_repeats_a_row() -> None:
    assert ids(page) == sorted(set(ids(page)))
```

An `implemented` row with no marker and no external evidence fails; an `implemented` row
whose evidence names no test in this repo fails; an `untested`, `planned` or `violated` row
that a marker traces fails; a marker naming an unknown id fails; and an `implemented` row
citing a test that does not exist, or that does not carry that row's marker, fails. The rail
also counts the EARS form (G-013): a non-`retired` row whose Requirement cell does not carry
exactly one `shall` outside a code span is off form, and a full run fails naming each
off-form row once the count exceeds the `requirements_ears_allowance` ini option (default 0).
The rail is the plugin in `tests/conftest.py`; it scans `tests/` recursively, fails a full run
and only reports on a partial one.

**ID blocks and grammar:** `R-001` onward are this project's rows; IDs use `R-` or `G-` followed by three ASCII digits or four ASCII digits that never start with zero (`R-1000` follows `R-999`). `G-001` onward are
the general-engineering feature's rows, in `REQUIREMENTS-general.md`.

A requirement row has four cells and both opening and closing pipes. Lines split only at LF (`"\n"`); one byte-order mark at a file's start is ignored. Whitespace (tab, LF, VT, FF, CR, U+001C–U+001F, space, U+0085, U+00A0, U+1680, U+2000–U+200A, U+2028, U+2029, U+202F, U+205F, U+3000, U+FEFF) around cells and after the closing pipe is ignored. Any other character after the closing pipe fails, naming the line. On every line, `| R-` or `| G-` followed by a non-whitespace character is reserved for a requirement row; indent an example that would use that prefix, for example:

    | R-squared | example | untested | — |

That template-owned file is refreshed by `uvx copier update`; Status and Evidence remain yours in REQUIREMENTS.md.

**New behaviour in this project: requirement diff, then tagged tests, then code.**

**First run in an adopted project.** This render added the rail (`tests/conftest.py`), its
self-tests (`tests/test_requirements_trace.py`, `tests/test_code_map.py`), the generator
(`scripts/code_map.py`) and a PLACEHOLDER `docs/code-map.md`. Run
`uv run python scripts/code_map.py` once (or `python3 scripts/code_map.py` — it needs no
dependencies) to generate the real map; after that `--check` is green. If this project's
tests do not live in `tests/`, move those three files into the real test directory and
update the citations. Every general-engineering feature row below starts `untested`: promote one only when a
test in this repo pins it and the evidence cell names that test. The self-tests arrive carrying
`req-candidate:` markers instead of `req:` for exactly that reason — rename one to `req:`
when you promote its row. Until every mapped module carries a contract header, the
self-test that checks THIS project's headers and map fails: that is the audit's work, not
a reason to delete the test. The EARS form check (G-013) also runs on day one: if the
audit's own rows land off form before they are split, declare the allowance at the count
the first run names (`requirements_ears_allowance` in `pyproject.toml`'s
`[tool.pytest.ini_options]`) rather than leaving the rail red.
G-012 arrives the same way: `scripts/readme_check.py` checks that this project's README names
nothing that does not exist — run it, fix what it reports (or the README), and promote the
row when it is green.

## How this file is organized

Rows are grouped into a tree: capability → feature → subgroup. A capability heading reads
`# CAP-nn · <label>`, a feature heading `## FEAT-nnn · <label>` and a subgroup heading
`### SUB-nnn · <label>`. Each heading is followed by a `Purpose:` line saying why that part of
the product exists; a capability also carries an `Outcome:` line, and a feature a `Status:`
line. Every row lives in exactly one table, its home. Add each new row to the table of the
feature it serves. A new feature goes under the capability it serves, never under CAP-90;
product headings start at CAP-01, FEAT-001 and SUB-001. CAP-90, FEAT-900 and SUB-900 to
SUB-904 are reserved for the general-engineering feature below. A new heading takes an
unused ID and a `Purpose:` line. No row sits in a `proposed` or `retired` feature. The
project owner decides every change to the tree. Check it with
`node "$HOME/nana-pi/scripts/requirements-tree.mjs" --root .`.

# CAP-01 · What the product does

Purpose: DRAFT — name what this product does and who it serves.
Outcome: DRAFT — name the outcome this capability delivers.

## FEAT-001 · First feature

Purpose: DRAFT — name the first feature the audit finds.
Status: proposed

No product rows yet. Add one per promise this project already makes — the
`requirements` skill's audit mode extracts them from the code — starting at `R-001`, in this
table.

| ID | Requirement | Status | Evidence |
|---|---|---|---|

# CAP-90 · Keep engineering promises checkable

Purpose: every nana project carries the same baseline engineering promises, checkable the same way.
Outcome: a rendered project's engineering promises are visible and checkable from day one.

## FEAT-900 · Adopt the general engineering requirements

Purpose: hold the general engineering rows every nana project ships, unedited per project.
Status: active

These rows are the same in every nana project and are **never renumbered or edited
per project**. Template-owned file; do not edit. Refreshed by `uvx copier update`. The rail reads Requirement cells here and Status/Evidence from REQUIREMENTS.md when listed there. Status and Evidence remain project-owned in
REQUIREMENTS.md; promote a row when a test in this repo pins it, and say where.

Where a row says *every module*, that is every module under the roots declared in
`code-map.config.json` — which ships covering the package, `scripts/` and the test
directory, so a dropped header outside `src/` fails the check too.

### SUB-900 · Configuration and provenance

Purpose: a tunable is defined once, with provenance, and a retune changes no code.

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| G-001 | WHEN a value tunes behaviour (a threshold, cap, weight, budget, timeout, port, path, model name, seed or vocabulary), it shall be defined once in a declared configuration surface and read by name. A contract number is a sealed tunable in that surface with provenance naming its row, pinned by one test, and a retune is a requirement diff first. | untested | — |
| G-016 | WHEN a value tunes behaviour (a threshold, cap, weight, budget, timeout, port, path, model name, seed or vocabulary), it shall not appear as an inline literal at a point of use. | untested | split from G-001 2026-10-04 (EARS form batch 0): no test pins this clause |
| G-002 | Every tunable shall carry its provenance beside its definition: the source and date for a measured value, or the word chosen and the reason for a chosen one. | untested | — |
| G-003 | WHEN a tunable changes, no code shall change. | untested | — |
| G-017 | WHEN a tunable changes, the suite shall pass against the new value or fail naming the row the value violates. | untested | split from G-003 2026-10-04 (EARS form batch 0): no test pins this clause |

### SUB-901 · Module boundaries

Purpose: a module has one purpose, named exports and injected resources, and the layer direction holds.

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| G-004 | Every module shall open with a contract header in a fixed, scannable form stating its purpose in one sentence, its inputs (what it reads or is given), its outputs (what it returns, writes or emits), its side effects (none, disk, database, network, process) and the typed errors or statuses it can produce. | untested | — |
| G-005 | A module shall expose its behaviour only through named exports that are its entry points. | untested | — |
| G-018 | No module shall reach into another module's internals, private helpers or mutable state. | untested | split from G-005 2026-10-04 (EARS form batch 0): no test pins this clause |
| G-006 | Resources with identity or side effects (database handles, clocks, random sources, fetchers, file roots) shall be injected at a module's boundary so the module is exercisable without the real resource. | untested | — |
| G-007 | Imports shall follow the layer direction declared in the code-map config — a module may import its own layer or the one directly after it, and tests may import anything. | untested | — |
| G-019 | A reverse or layer-skipping import shall fail a check. | untested | split from G-007 2026-10-04 (EARS form batch 0): no test pins this clause |
| G-008 | A module shall have one purpose statable in one sentence. | untested | — |
| G-020 | WHEN a module's header needs more than one sentence of purpose, it shall be split. | untested | split from G-008 2026-10-04 (EARS form batch 0): no test pins this clause |

### SUB-902 · The code map

Purpose: the code map and its blast-radius command stay generated and checkable.

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| G-009 | The project shall carry a code map, generated from the import graph and the contract headers, that lists every module with its purpose, inputs, outputs, side effects, callers and callees, in a form an agent can read without opening the code. | untested | — |
| G-010 | WHEN a module exists without a map entry, a map entry names a module that no longer exists, or a header is missing or malformed, the suite shall fail. | untested | — |
| G-011 | WHEN a change touches a module, its blast radius (transitive callers and callees) shall be derivable from the map by one command. | untested | — |

### SUB-903 · Documentation

Purpose: the README states and honours what the project is, and how to install, run and test it.

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| G-012 | The README shall state what the project is and is for, how to install it, how to run it and how to test it. | untested | — |
| G-021 | Every command, script name, path, flag and file the README names shall exist and run as written. | untested | split from G-012 2026-10-04 (EARS form batch 0): no test pins this clause |
| G-022 | A README claim the project no longer honours shall fail the suite. | untested | split from G-012 2026-10-04 (EARS form batch 0): no test pins this clause |

### SUB-904 · The requirement set

Purpose: every row stays EARS form and the rail enforces the declared off-form allowance.

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| G-013 | WHERE a row is not retired, it shall carry exactly one `shall` outside a code span. | untested | — |
| G-014 | The rail shall report the count of rows off form in its own line after the summary line. | untested | — |
| G-015 | IF the count of rows off form exceeds the declared allowance THEN the rail shall fail naming each off-form row. | untested | — |


# Open questions and deliberate omissions

## Open questions

Unruled decisions, numbered, each one a sentence ending in a question mark. A question
answered becomes a row; it does not stay here as prose.

1. _(none yet)_

## Deliberate omissions

What this project will NOT do, and why — so a future reader does not read an absence as an
oversight and build it.

- _(none yet)_
