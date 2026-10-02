{%- set _ts = language == 'typescript' -%}
{%- set _status = g_status | default('untested') -%}
{%- set _ev = _status == 'implemented' -%}
{%- set _g004 = 'tests/code-map.test.ts::this project: every module has a contract header and docs/code-map.md is current' if _ts else 'tests/test_code_map.py::test_this_project_headers_and_map_are_current' -%}
{%- set _g009 = 'tests/code-map.test.ts::the rendered map carries one entry per module under its layer' if _ts else 'tests/test_code_map.py::test_rendered_map_carries_one_entry_per_module' -%}
{%- set _g010 = 'tests/code-map.test.ts::--check exits non-zero on a missing header, a stale map or a reverse import' if _ts else 'tests/test_code_map.py::test_check_exits_non_zero_on_missing_header_stale_map_or_reverse_import' -%}
{%- set _g012 = 'tests/readme-check.test.ts::this project: the README passes its own check' if _ts else 'tests/test_readme_check.py::test_this_project_readme_passes' -%}
{%- set _g011 = 'tests/code-map.test.ts::--impact gives the transitive callers and callees of a change' if _ts else 'tests/test_code_map.py::test_impact_gives_transitive_callers_and_callees' -%}
# Part G. General engineering requirements (every nana project)

These rows are the same in every nana project and are **never renumbered or edited
per project** — they arrive with the template and are re-synced by `uvx copier update`.
What changes per project is the Status and Evidence column: promote a row when a test
in this repo pins it, and say where.

Where a row says *every module*, that is every module under the roots declared in
`code-map.config.json` — which ships covering the package, `scripts/` and the test
directory, so a dropped header outside `src/` fails the check too.

## G1. Configuration and provenance

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| G-001 | WHEN a value tunes behaviour (a threshold, cap, weight, budget, timeout, port, path, model name, seed or vocabulary), it shall be defined once in a declared configuration surface and read by name, and shall not appear as an inline literal at a point of use. A contract number is a sealed tunable in that surface with provenance naming its row, pinned by one test, and a retune is a requirement diff first. | untested | — |
| G-002 | Every tunable shall carry its provenance beside its definition: the source and date for a measured value, or the word chosen and the reason for a chosen one. | untested | — |
| G-003 | WHEN a tunable changes, no code shall change; the suite shall pass against the new value or fail naming the row the value violates. | untested | — |

## G2. Module boundaries

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| G-004 | Every module shall open with a contract header in a fixed, scannable form stating its purpose in one sentence, its inputs (what it reads or is given), its outputs (what it returns, writes or emits), its side effects (none, disk, database, network, process) and the typed errors or statuses it can produce. | {{ _status }} | {{ ('`' ~ _g004 ~ '`') if _ev else '—' }} |
| G-005 | A module shall expose its behaviour only through named exports that are its entry points, and no module shall reach into another module's internals, private helpers or mutable state. | untested | — |
| G-006 | Resources with identity or side effects (database handles, clocks, random sources, fetchers, file roots) shall be injected at a module's boundary so the module is exercisable without the real resource. | untested | — |
| G-007 | Imports shall follow the layer direction declared in the code-map config — a module may import its own layer or the one directly after it, and tests may import anything — and a reverse or layer-skipping import shall fail a check. | untested | — |
| G-008 | A module shall have one purpose statable in one sentence; WHEN a module's header needs more than one sentence of purpose, it shall be split. | untested | — |

## G3. The code map

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| G-009 | The project shall carry a code map, generated from the import graph and the contract headers, that lists every module with its purpose, inputs, outputs, side effects, callers and callees, in a form an agent can read without opening the code. | {{ _status }} | {{ ('`' ~ _g009 ~ '`') if _ev else '—' }} |
| G-010 | WHEN a module exists without a map entry, a map entry names a module that no longer exists, or a header is missing or malformed, the suite shall fail. | {{ _status }} | {{ ('`' ~ _g010 ~ '`') if _ev else '—' }} |
| G-011 | WHEN a change touches a module, its blast radius (transitive callers and callees) shall be derivable from the map by one command. | {{ _status }} | {{ ('`' ~ _g011 ~ '`') if _ev else '—' }} |

## G4. Documentation

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| G-012 | The README shall state what the project is and is for, how to install it, how to run it and how to test it, and every command, script name, path, flag and file the README names shall exist and run as written; a README claim the project no longer honours shall fail the suite. | {{ _status }} | {{ ('`' ~ _g012 ~ '`') if _ev else '—' }} |
