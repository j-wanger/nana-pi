# Revision 2: review 1 closures

## Scope and closures

- MUST 1: the opt-in scaffold now seeds both optional module entries and a 10-module count. Acceptance regenerates maps only for adoption.
- NOTE, README whitespace: Jinja whitespace control preserves the default-off README bytes.
- NOTE, table-name quoting: `PRAGMA table_info` reuses the existing `_quoted` identifier helper within its own module.
- No departure from either precedent: extend the existing map seed and restore the acceptance runner's adopt-only map step.
- No known-bug file changed. The module-initialisation rule, WAL behaviour and other review observations remain unchanged.

## Requirements, tests and mutation pair

- Requirement diff first: R-3840 now states passing pytest with a current shipped map; R-3847 excludes scaffold map regeneration.
- Then changed the existing tagged M1 test to run `uv run pytest` on the opt-in render. This is the only existing test edited; no test added or removed.
- Wrong implementation: old 8-module seed, unchanged assertions. `node scripts/test.mjs data-pack.test` exited 1: M1 failed, seven checks passed (`revision-2-wrong.log`).
- Direct old-seed `uv run pytest` exited 1: 1 failed, 65 passed; missing optional entries and stale map (`revision-2-old-seed.log`). Fixture paths in this log use `$TMPDIR/render`.
- Fixed implementation: the same M1 and the real M8 six-render acceptance pass without scaffold map regeneration (`revision-2-green.log`).

## Verification before commit

All fixtures and render source snapshots live under `$TMPDIR`; no test writes the repository.

| Command or probe | Exit | Result |
| --- | --- | --- |
| `node scripts/test.mjs data-pack.test template-acceptance.test template-release.test` | 0 | 3 files, 25 checks passed |
| `node scripts/test.mjs templates-render.test templates-update.test` | 0 | See `revision-2-template-tests.log` |
| `npm run map:check` | 0 | See `revision-2-map.log` |
| `npm run req:tree` | 0 | See `revision-2-tree.log`; generated tree unchanged |
| `npm run readme:check` | 0 | See `revision-2-readme.log` |
| Main and lane default-off Copier renders, identical answers | 0 each | Sources snapshotted into temporary Git repositories |
| `diff -ru --exclude=.copier-answers.yml` on those renders | 0 | Zero diff; `revision-2-default-diff.log` is empty |
| Opt-in render `uv run ruff check .` | 0 | Clean |
| Opt-in render `uv run ruff format --check .` | 0 | Clean |
| Opt-in render `uv run mypy` | 0 | Clean |
| Opt-in render `uv run pytest` | 0 | 66 passed |
| Temporary SQLite table named `odd'table`, identifier check | 0 | Clean identifier finding, no SQL syntax error |

Python diff review: clean; no new import, suppression, helper copy, exception path or return-contract change. No callers require updates.

The full repository suite is delegated to CI by AGENTS.md. No push, CI access, history rewrite, GitHub issue action, model session or subagent launch performed. Native Windows verification remains for CI. Last-commit seat-check results belong in the builder report.
