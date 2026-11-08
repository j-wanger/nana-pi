# Plan: data-pack-template

Feature: FEAT-033 · Adopt explicit engineering standards

## Purpose

The owner, 2026-11-07, picked "Template feature" for bringing na-na's data pack into nana-pi: "the data pack for consistent testing baseline for data related projects, and validation and real run driven tests". The data pack ships with nana-pi's Python project template. A data project fills in one settings file, and pytest runs the eight data checks against its real data, so every data project gets the same baseline. The first proof is a real run on the real data project.

Evidence for the design (na-na FINDINGS #58; v0 seed retained in git history): v0 ran once read-only on the real data project. It found a real crosswalk merge (two players sharing one external id) that the project's 953 tests missed, a builtin `hash()` id that changes every process, two disagreeing name normalizers, 40 of 54 reports with no provenance, and more. It found five false-positive patterns, fixed in the pack, not itemised. Opening SQLite read-only still wrote WAL/SHM side files until it used `immutable=1`.

## Assumptions

- A1. Python template only for now. A copier question (`data_checks`, default no) adds the pack; a project without it is unchanged.
- A2. The pack is generic. Everything project-specific lives in the project's settings file (`data-checks.json`): source globs, import roots, databases, identifier types, declared keys, normalizer samples, connector modules, report folders, row-wise budget. No project name, path or player appears in the pack.
- A3. A pytest test runs every check and fails on any `error` finding, printing the findings table; a `warn` prints and passes. With no settings file the test skips with one line saying how to enable it.
- A4. Databases open read-only with `immutable=1`; a run writes nothing into the project.
- A5. `adopt-py` adds the same files to an existing project without overwriting the project's own files; `copier update` brings later pack versions.
- A6. Fixing the real data project's own bugs (the crosswalk merge, the hash id) happens in that repo, not in this lane; this lane records the real-run findings.
- A7. Validation first (owner, 2026-11-04): the pack's own tests pin the checks' contracts on small fixtures plus the false-positive patterns a real run shows; no speculative cases.
- A8. One reviewer plus CI.

## Open choices

- O1. Builder decides the module split (one `data_checks` package or a single file) following the template's existing `scripts/` modules.

## Questions for the owner

None.

## Threat model

Honest variation in projects' data, schemas and settings files; read-only access to real databases. Deliberate tampering with a project's data is out.

## Precedent

- `templates/python/template/scripts/`: where the template's own checkers live (code map, readme check).
- `copier.yml`: how a template question adds files.
- `packages/nana-pack/skills/adopt-py/SKILL.md`: the adopt path that must add the pack without overwriting.
- `docs/plan/data-pack-template/seed-checks.py` (git history): the v0 checks made generic; the canonical engine now ships from `templates/python/data_checks.py` through a Jinja include.

## Outside precedent

The builder checks one open-source data-quality library (for example Great Expectations, Apache-2.0, or pandera, MIT) and notes adopt, borrow or skip for the check shapes.

## Must-meet

- M1 (scaffold). A Python project scaffolded with `data_checks=yes` has the pack, a starter `data-checks.json` and `tests/test_data_checks.py`; scaffolded with the default, it has none of them and its suite is unchanged.
- M2 (eight checks, generic). On small SQLite and source fixtures, each of the eight checks reports its seeded defect as an `error` (or `warn` for row-wise and read-only connectors) and reports nothing on the clean fixture; the pack's source names no project.
- M3 (read-only, adversary 1). Running the shipped entry point against a fixture project whose normalizer module initialises a file outside the database folder leaves the whole project byte-identical (no file added, removed or changed, no WAL, SHM, journal or `__pycache__`); if a check cannot run project code without side effects, it reports an explicit `error` finding instead of running it.
- M4 (test behaviour). The pytest test fails on any `error` finding and prints the findings table; passes with only `warn` findings; skips with a one-line enable message when no settings file exists.
- M5 (real run). Run on the real data project at its current main, read-only, with real-run settings held only in an OS-temporary file: the build report records counts per check and confirms the crosswalk duplicate. A builtin `hash()` identifier is reported wherever it is in scope, proven by the fixture and its mutation; the real run's zero is recorded, not manufactured. Every false-positive pattern the run shows is fixed in the pack, never suppressed in the settings, and listed by name. The committed manifest is a neutral example, not the real-run settings.
- M6 (adopt and update). `adopt-py` adds the pack to an existing Python project without changing any existing file; `copier update` from the previous release adds it cleanly; template acceptance passes.
- M7 (adversary 2: WAL freshness). With a WAL writer still open after committing an un-checkpointed duplicate key, a run either reports the duplicate from a consistent snapshot or reports an explicit `error` naming the WAL database; never a clean keys verdict; the database and its side files are unchanged.
- M8 (adversary 3: native checks). Release acceptance renders an opted-in Python scaffold and an opted-in adopted project on macOS and native Windows, runs sync, Ruff lint and format, strict mypy and pytest, and every command exits 0 with the data-check test discovered and run against a clean configured fixture; the default-off case stays.
