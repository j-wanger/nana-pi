Feature: FEAT-033 · Adopt explicit engineering standards

# Review brief 1: data-pack-template

Review the whole lane: `git diff main...HEAD` on branch feat/data-pack-template. Plan: `docs/plan/data-pack-template.md` (M1–M8; M5 narrowed by the seat in build 2). Builder report: `docs/reviews/data-pack-template/build-report.md`.

Question: does a Python project that opts in get a data-check baseline that works for its user (eight generic checks, a pytest test that fails on errors, read-only against real data), and does a project that does not opt in stay unchanged? Check especially: the read-only promise (M3, M7: no project code run, no WAL/SHM writes, WAL fails closed), adopt and update paths (M6), native acceptance with the opt-in on (M8), and that no tracked file names the real data project, its package or any real person.

Threat model: honest variation in projects' data, schemas and settings files; read-only access to real databases. Deliberate tampering with a project's data is out.
