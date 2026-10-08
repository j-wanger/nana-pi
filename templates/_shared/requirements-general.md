{%- set _ts = language == 'typescript' -%}
{%- set _status = 'untested' if adopt else 'implemented' -%}
{%- set _general_preamble = 'Template-owned file; do not edit. Refreshed by `uvx copier update`. The rail reads Requirement cells here and Status/Evidence from REQUIREMENTS.md when listed there.' -%}
{%- set _ev = _status == 'implemented' -%}
{%- set _g004 = 'tests/code-map.test.ts::this project: every module has a contract header and docs/code-map.md is current' if _ts else 'tests/test_code_map.py::test_this_project_headers_and_map_are_current' -%}
{%- set _g009 = 'tests/code-map.test.ts::the rendered map carries one entry per module under its layer' if _ts else 'tests/test_code_map.py::test_rendered_map_carries_one_entry_per_module' -%}
{%- set _g010 = 'tests/code-map.test.ts::--check exits non-zero on a missing header, a stale map or a reverse import' if _ts else 'tests/test_code_map.py::test_check_exits_non_zero_on_missing_header_stale_map_or_reverse_import' -%}
{%- set _g012 = 'tests/readme-check.test.ts::this project: the README passes its own check' if _ts else 'tests/test_readme_check.py::test_this_project_readme_passes' -%}
{%- set _g011 = 'tests/code-map.test.ts::--impact gives the transitive callers and callees of a change' if _ts else 'tests/test_code_map.py::test_impact_gives_transitive_callers_and_callees' -%}
{%- set _g013 = 'tests/requirements-trace.test.ts::this project: every row carries exactly one shall' if _ts else 'tests/test_requirements_trace.py::test_this_project_every_row_carries_exactly_one_shall' -%}
{%- set _g014 = 'tests/requirements-trace.test.ts::ears: a two-shall row and a no-shall row are counted, a retired one is not' if _ts else 'tests/test_requirements_trace.py::test_ears_counts_a_two_shall_row_and_a_no_shall_row_but_not_a_retired_one' -%}
{%- set _g015 = 'tests/requirements-trace.test.ts::ears: over the allowance each off-form row is a problem, at the allowance none' if _ts else 'tests/test_requirements_trace.py::test_ears_over_the_allowance_each_off_form_row_is_a_problem_at_the_allowance_none' -%}
# Part G. General engineering requirements (every nana project)

These rows are the same in every nana project and are **never renumbered or edited
per project**. {{ _general_preamble }} Status and Evidence remain project-owned in
REQUIREMENTS.md; promote a row when a test in this repo pins it, and say where.

Where a row says *every module*, that is every module under the roots declared in
`code-map.config.json` — which ships covering the package, `scripts/` and the test
directory, so a dropped header outside `src/` fails the check too.

## G1. Configuration and provenance

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| G-001 | WHEN a value tunes behaviour (a threshold, cap, weight, budget, timeout, port, path, model name, seed or vocabulary), it shall be defined once in a declared configuration surface and read by name. A contract number is a sealed tunable in that surface with provenance naming its row, pinned by one test, and a retune is a requirement diff first. | untested | — |
| G-016 | WHEN a value tunes behaviour (a threshold, cap, weight, budget, timeout, port, path, model name, seed or vocabulary), it shall not appear as an inline literal at a point of use. | untested | split from G-001 2026-10-04 (EARS form batch 0): no test pins this clause |
| G-002 | Every tunable shall carry its provenance beside its definition: the source and date for a measured value, or the word chosen and the reason for a chosen one. | untested | — |
| G-003 | WHEN a tunable changes, no code shall change. | untested | — |
| G-017 | WHEN a tunable changes, the suite shall pass against the new value or fail naming the row the value violates. | untested | split from G-003 2026-10-04 (EARS form batch 0): no test pins this clause |

## G2. Module boundaries

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| G-004 | Every module shall open with a contract header in a fixed, scannable form stating its purpose in one sentence, its inputs (what it reads or is given), its outputs (what it returns, writes or emits), its side effects (none, disk, database, network, process) and the typed errors or statuses it can produce. | {{ _status }} | {{ ('`' ~ _g004 ~ '`') if _ev else '—' }} |
| G-005 | A module shall expose its behaviour only through named exports that are its entry points. | untested | — |
| G-018 | No module shall reach into another module's internals, private helpers or mutable state. | untested | split from G-005 2026-10-04 (EARS form batch 0): no test pins this clause |
| G-006 | Resources with identity or side effects (database handles, clocks, random sources, fetchers, file roots) shall be injected at a module's boundary so the module is exercisable without the real resource. | untested | — |
| G-007 | Imports shall follow the layer direction declared in the code-map config — a module may import its own layer or the one directly after it, and tests may import anything. | untested | — |
| G-019 | A reverse or layer-skipping import shall fail a check. | untested | split from G-007 2026-10-04 (EARS form batch 0): no test pins this clause |
| G-008 | A module shall have one purpose statable in one sentence. | untested | — |
| G-020 | WHEN a module's header needs more than one sentence of purpose, it shall be split. | untested | split from G-008 2026-10-04 (EARS form batch 0): no test pins this clause |

## G3. The code map

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| G-009 | The project shall carry a code map, generated from the import graph and the contract headers, that lists every module with its purpose, inputs, outputs, side effects, callers and callees, in a form an agent can read without opening the code. | {{ _status }} | {{ ('`' ~ _g009 ~ '`') if _ev else '—' }} |
| G-010 | WHEN a module exists without a map entry, a map entry names a module that no longer exists, or a header is missing or malformed, the suite shall fail. | {{ _status }} | {{ ('`' ~ _g010 ~ '`') if _ev else '—' }} |
| G-011 | WHEN a change touches a module, its blast radius (transitive callers and callees) shall be derivable from the map by one command. | {{ _status }} | {{ ('`' ~ _g011 ~ '`') if _ev else '—' }} |

## G4. Documentation

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| G-012 | The README shall state what the project is and is for, how to install it, how to run it and how to test it. | {{ _status }} | {{ ('`' ~ _g012 ~ '`') if _ev else '—' }} |
| G-021 | Every command, script name, path, flag and file the README names shall exist and run as written. | untested | split from G-012 2026-10-04 (EARS form batch 0): no test pins this clause |
| G-022 | A README claim the project no longer honours shall fail the suite. | untested | split from G-012 2026-10-04 (EARS form batch 0): no test pins this clause |

## G5. The requirement set

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| G-013 | WHERE a row is not retired, it shall carry exactly one `shall` outside a code span. | {{ _status }} | {{ ('`' ~ _g013 ~ '`') if _ev else '—' }} |
| G-014 | The rail shall report the count of rows off form in its own line after the summary line. | {{ _status }} | {{ ('`' ~ _g014 ~ '`') if _ev else '—' }} |
| G-015 | IF the count of rows off form exceeds the declared allowance THEN the rail shall fail naming each off-form row. | {{ _status }} | {{ ('`' ~ _g015 ~ '`') if _ev else '—' }} |
