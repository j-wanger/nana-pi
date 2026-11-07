# Data pack template build report

## Verdict

PARTIAL: seven must-meets are implemented. M5's historical hash finding cannot be reproduced
in the current target source scope. R-3844 remains `violated`; its fixture test uses a
`req-candidate` marker rather than claiming the real-run requirement is implemented.

Branch: `feat/data-pack-template`. The final response records the full committed tip and
seat checks run against it. No push, CI lookup, issue operation or target-project write occurred.

## Changes and rows

| Item | Files | Rows |
|---|---|---|
| Optional scaffold and settings | `copier.yml`; conditional files under `templates/python/template/`; conditional README section | R-3840 |
| Generic check implementation | `docs/plan/data-pack-template/seed-checks.py`; template include | R-3841, R-3842, R-3846 |
| Pytest integration | conditional `tests/test_data_checks.py` in the Python template | R-3843 |
| Real validation and observed patterns | `packages/nana-pack/tests/data-pack-fixtures.py`; `real-run.log` | R-3844 (residual below) |
| Adoption and subsequent updates | `packages/nana-pack/skills/adopt-py/SKILL.md`; Copier settings ownership; acceptance overlay arguments | R-3845 |
| Native release acceptance | `scripts/template-acceptance.mjs`; `packages/nana-pack/tests/data-pack.test.mjs` | R-3847 |
| Documentation and generated navigation | `README.md`; `docs/plan/data-pack-template/seed-README.md`; `docs/code-map.md`; `docs/requirements-tree.md` | Existing engineering rows; no additional IDs |

The only new requirement IDs are R-3840 through R-3847, in M-order, under FEAT-033.
No cross-feature shares changed. There are exactly eight new named tests, one per must-meet.
The Python fixture driver supports those tests; it declares no additional suite tests.
No new sealed tunable was introduced. Existing budgets remain settings inputs.

## Precedent and departures

- Read both existing Python scripts completely before design. The pack follows their single
  standard-library script, six-tag header, public entry points, root injection and CLI conventions.
- Read `copier.yml` and the adoption skill completely. The new question is default-off and
  Python-only; conditional filenames follow the existing template pattern.
- The existing seed is the canonical engine, included by Jinja into the rendered script.
  Departure: canonical code remains at its seed path rather than moving or copying its helpers.
  This keeps one implementation and reuses the repository's include pattern. No private helper
  crosses a module boundary; the pytest caller imports `format_findings`, `load_settings` and `run_all`.
- Departure from v0: no normalizer module is imported or executed. Additional definitions and
  unsafe canonical initialisation produce explicit errors; samples are not claimed equivalent.
  M3 requires project-wide read-only behaviour, which arbitrary imports cannot guarantee.
- Departure from v0: nonempty WAL files produce explicit errors before immutable database opens.
  This is M7's permitted fail-closed outcome, not an attempted writable checkpoint or backup.
- Departure from v0: copied-body comparison preserves global callees and meaningful literals.
  SQL-shape similarity alone produced false positives in the real run.
- Departure from a permanent code skip-list: project settings remain skip-listed, but the adoption
  command uses copy-only `--skip` arguments for existing checker/test files. A permanent skip-list
  prevented later adopted-project updates; the strengthened M6 test caught that bug.
- Repository-wide caller search found only the engine registry, new pytest caller, fixture driver
  and historical seed runner for the affected APIs. The list-of-findings return shape is unchanged.
  Removed private normalizer-loading/exception helpers had no external callers. The historical
  runner is documented as unshipped and is not used by tests or acceptance.

Outside precedent: inspected pandera's MIT license and `pandera/api/checks.py` from
`https://github.com/unionai-oss/pandera`. Borrowed the distinction between blocking validation
and advisory warnings. Skipped its dataframe runtime/backend dependency: this pack needs
SQLite/source inspection and cannot execute project code. No library source was copied.

## Real run

The target was on its current local `main`; existing untracked data/report additions were not
changed or removed. The supplied example settings were unchanged except for resolving their
root in an OS-temporary settings file. No exception or suppression was added. The engine used
only immutable database reads and source/report reads, so no project scripts or writable SQLite
operations were needed. The CLI returned 1 because it found errors; the validation harness
returned 0 after checking byte identity and recording counts. Raw locations and values remain
outside tracked files.

| Check | Error findings | Warning findings | Info summaries | Clean summaries |
|---|---:|---:|---:|---:|
| identifier-types | 0 | 0 | 0 | 1 |
| keys-hold | 1 | 0 | 0 | 0 |
| one-normalizer | 1 | 0 | 0 | 0 |
| connectors | 4 | 10 | 0 | 1 |
| stable-ids | 0 | 0 | 0 | 1 |
| lineage | 40 | 0 | 1 | 0 |
| reusable-processing | 1 | 0 | 0 | 0 |
| row-wise-ops | 0 | 8 | 0 | 0 |

The keys finding confirms one crosswalk duplicate group. Lineage found 14 of 54 outputs
with provenance. The real run compared 154 scoped files before and after, including database
side files, sources and reports; all bytes and the scoped path set stayed identical.
The separate M3 fixture compares its entire project tree, including an initialiser's destination
outside the database folder. M7 keeps its writer connection open during the byte comparison.

Residual: there is no builtin `hash()` call in the supplied production-source globs at current
main. Consequently the historical unstable identifier is not reported. The unchanged scope
was not widened to test fixtures to manufacture a finding. The small-fixture check and its
mutation prove detection, but cannot substitute for the missing real defect. No target bug
was fixed in this lane.

Observed false-positive patterns pinned within the contract and real-pattern fixtures:

1. Object-shaped identifier declarations with namespace metadata are valid settings.
2. A same-named identifier column in a disjoint namespace does not inherit another domain's SQL type.
3. Read-only SQLite URIs held in local variables remain advisory connector findings, not writable errors.
4. Human-written reviews are outside generated-report scope, using the supplied manifest's existing scope rule.
5. Similar SQL bodies that select different measures are not copied processing helpers.
6. Same-shaped bodies that call different global normalizers are not identical processing.

The same fixture also rejects prose-only provenance and covers structured markdown/JSONL
with CRLF, trailing spaces/tabs and no final newline. No new speculative suite test was added.

## Wrong-code pairs

Every mutation changes implementation code, never an assertion. Fixtures live under the OS
temp directory. Synchronous children have explicit time limits; no async case is left unawaited.

| Must-meet | Wrong implementation | Wrong exit | Corrected exit | Evidence |
|---|---|---:|---:|---|
| M1 | Unmodified default-off seed has no opt-in files | 1 | 0 | `wrong-first.log`, `touched-tests.log` |
| M2 | Stable-id checker returns no findings | 1 | 0 | `wrong-m2.log`, `mutations.log` |
| M3 | Remove unsafe-initialisation error | 1 | 0 | `mutations.log` |
| M4 | Filter error findings from the returned list | 1 | 0 | `mutations.log` |
| M5 subset | Ignore namespace membership; erase meaningful literals; erase global callees | 1 each | 0 each | `wrong-real-patterns.log`, `mutations.log` |
| M6 | Missing opt-in overlay; later, permanently skip adopted checker updates | 1 each | 0 | `wrong-first.log`, `wrong-m6-update.log`, `touched-tests.log` |
| M7 | Remove the nonempty-WAL guard | 1 | 0 | `mutations.log` |
| M8 | Omit opted-in native modes; later, accept a skipped data test | 1 each | 0 | `wrong-first.log`, `wrong-m8-skip.log`, `touched-tests.log` |

The initial seed already passed M2's basic contracts. Its explicit wrong-code run disabled
hash detection before implementation changes. M5's additional observed patterns and M6/M8's
update/skip cases were run red before their corresponding corrections.

## Existing-test edits

Only assertions made false by adding two native acceptance modes were edited in
`packages/nana-pack/tests/template-acceptance.test.mjs`:

- Extend the immutable-SHA render sequence from four entries to six.
- Keep the original exact default-off command matrix assertion scoped to default-off directories;
  the new M8 test checks the opted-in matrix and runs actual acceptance.
- Extend the successful cleanup render sequence from four entries to six.
- Change expected render counts from four to six in the ENOENT continuation case.
- Change expected render counts from four to six in the adopt-only mypy failure case.

`packages/nana-pack/tests/skill-claims.mjs` adds three explicit optional-path exemptions for
its default-off adoption target. M1/M6/M8 independently exercise those opted-in paths.
No existing test was deleted, renamed or disabled.

## Validation commands and results

All log paths below are relative to this report's folder. Long output is committed here,
with machine-specific paths normalised to repo-relative paths, `~` or `$TMPDIR`.

| Command | Exit | Result / evidence |
|---|---:|---|
| `node scripts/test.mjs --jobs=2 data-pack.test template-acceptance.test templates-render.test templates-update.test template-release.test requirements-trace.test code-map.test readme-check.test test-runner` | 0 | `touched-tests.log`: 10 files PASS; 417 checks pass, 0 fail, 0 skip |
| `node scripts/test.mjs test-runner` | 0 | `test-runner.log`: 2 files PASS; 64 checks pass |
| `npm run map` then `npm run map:check` | 0 each | `map.log`, `map-check.log`: 569 modules, 0 missing headers, 0 problems |
| `npm run req:tree` | 0 | `requirements-tree.log`: 2604 rows, 43 features, 0 problems |
| `npm run readme:check` | 0 | `readme-check.log`: 926 claims, 0 problems |
| Native acceptance through M8 on a temporary committed source snapshot | 0 | Default-off Python/TypeScript and opted-in Python, each scaffold/adopt; sync, Ruff lint/format, strict mypy and full pytest pass |
| Explicit opted-in data pytest runs | 0 each | Clean configured SQLite fixture; skipped data tests are rejected |
| Rendered-project `uv run ruff check --fix`, `ruff format`, strict `mypy` | 0 each after fixes | Same native checks also rerun by M8; no cap or strictness relaxation |
| Wrong-code mutation harness | 0 | `mutations.log`: seven rejected mutations, each restored run green |
| Real-run harness / shipped CLI | 0 / 1 | `real-run.log`; CLI failure is the expected findings verdict |
| `git diff --check` | 0 | No whitespace errors |

The required `npm run template:accept` and all seat checks are rerun on the final commit;
the final response gives their exit codes. macOS native acceptance ran locally. The same M8
suite test runs native acceptance on Windows in the existing CI matrix; Windows was not run
or simulated locally. CI covers the full repository suite under `AGENTS.md`, so no local full
suite was run. No CI result is claimed or awaited.

## Closed findings

- Unsafe normalizer initialisation no longer runs project code.
- Immutable readers no longer return a clean keys verdict for a nonempty WAL.
- Namespace collisions and semantically different copied-body shapes no longer produce blocking false positives.
- Adopted checker updates now advance after initial non-overwriting adoption.
- Native acceptance now rejects a skipped data test.

No supplied FEAT-033 known-bug entry was changed or fixed. Those entries concern unrelated
standards, shared helpers and report limitations.

## Not done / open question

M5's absent real hash defect remains unconfirmed and R-3844 remains violated. Should the seat
accept current-source zero plus the fixture proof, or supply a historical read-only snapshot?
No owner intent was changed. No project data or source bug was repaired. The full suite and
native Windows run remain for CI; the builder neither pushes nor reads CI.
