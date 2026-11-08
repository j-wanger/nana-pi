# Data pack template build report — build 2

## Result and scope

All eight must-meets pass locally under the amended M5 ruling. R-3844 is now
`implemented`, with a `req:` marker and evidence no wider than its fixture.
The real data project's scoped source contains zero builtin `hash()` identifiers;
the run records zero rather than manufacturing a finding. The crosswalk duplicate
remains confirmed. Native Windows and the full repository suite remain with CI,
as AGENTS.md directs. No push, CI lookup, issue operation, credential access or
write to the real data project occurred.

Branch: `feat/data-pack-template`. The final response supplies the full tip and
seat checks executed on that commit. This record describes pre-commit validation;
final-commit checks write only temporary output.

## Changes, files and rows

| Item | Files | Rows |
|---|---|---|
| Neutral public example; private real-run settings | `docs/plan/data-pack-template/example-manifest.json`, `docs/plan/data-pack-template.md`, `docs/plan/data-pack-template/seed-README.md` | R-3844 |
| Single shipped engine; retain prototype only in history | `git mv` from `docs/plan/data-pack-template/seed-checks.py` to `templates/python/data_checks.py`; Jinja include under `templates/python/template/scripts/`; remove `docs/plan/data-pack-template/seed-run.py` | R-3840–R-3847 |
| Namespace membership port and fixtures | `templates/python/data_checks.py`, `packages/nana-pack/tests/data-pack-fixtures.py` | R-3841, R-3844 |
| Narrowed M5 contract and promoted trace marker | `REQUIREMENTS.md`, `packages/nana-pack/tests/data-pack.test.mjs` | R-3844 |
| Comparison and validation evidence | this report; `build2-*.log` in this folder | R-3840–R-3847 |

No new requirement IDs, cross-feature shares or sealed tunables were added.
The requirement diff preceded the fixture change, its red run and implementation.

## Precedent and callers

Read every file in `templates/python/template/scripts/` and the entire former
seed engine before design. The engine keeps the precedent's dependency-free
single script, six-tag header, injected root, public CLI and Jinja inclusion.
Its new home follows the existing shared-source include pattern.

The former history-path departure is closed: only `templates/python/data_checks.py`
is canonical. The template includes that file, and tests no longer copy the plan
folder to render or update projects. The historical v0 runner is removed rather
than retaining its stale engine import. Prototype source remains available through git.
The plan and implementation note now point readers to the shipped engine.

Caller search covered the full repository, including `scripts/`. Updated the
fixture loader, the template include and both Copier snapshot/update paths.
The later-update fixture now edits the new canonical path. Public return shapes
and exceptions are unchanged; existing helpers are reused in place, not copied
or imported privately.

Departure from v1b: retain static-only normalizer inspection. Importing and running
project normalizers would violate M3. Retain inferred namespace scope, then check
membership within that scope; applying v1b's type rule to every same-named column
would restore the disjoint-domain false positive. Preserve global callees and
meaningful literals in duplicate detection. These choices retain the build-1
safety and false-positive fixes.

No supplied FEAT-033 known-bug entry was touched or fixed. They concern unrelated
standards, shared helpers and reporting limits.

## Comparison with na-na v1b

Read `checks.py`, `README.md` and `BUILD-REPORT.md` completely from the supplied
v1b pack. Did not copy its manifest, names or example. The table covers behaviour
that this engine lacks, rather than shared checks. Counts below come from applying
non-executing v1b check functions to the private settings, or are explicitly
conditional where v1b would execute project code.

| v1b behaviour absent at build-2 start | Would it change a count in the real run? | Decision |
|---|---|---|
| Non-null namespace membership validation | Yes: two missing-member errors, covering 81 and 238 stored rows in two inferred-domain columns | Ported using existing immutable reads and quoting; no raw ids disclosed |
| Namespace overrides; unknown-namespace and missing-reference diagnostics; validate all declared namespaces | No: overrides are empty and references exist | Not ported; no new real finding |
| Apply identifier SQL types even to disjoint same-named domains | Yes: one extra type error in an unrelated domain | Not ported; known false positive |
| Continue through unavailable databases and deduplicate per-database open errors | No: both configured databases are available and checkpointed | Not ported; no real count change |
| Duplicate-key samples in diagnostics | No: same one crosswalk finding | Not ported; public diagnostics retain counts, not private values |
| Execute canonical and competing normalizers on samples, distinguishing agreement warnings from disagreement errors | Could relabel the one static normalizer error if imports succeed; the discovered wrapper adds another name transformation | Not ported; unsafe execution is not a demonstrated false-positive correction |
| Derived-key roles: default `binding` errors, `source` ambiguity info, unknown-role errors | The private settings have one `source` entry: v1b would add one info summary if canonical execution succeeds; no binding entry or invalid role | Not ported; source ambiguity is information for the binder, not a new defect, and execution conflicts with M3 |
| Code-file literals outside declared path modules, excluding docstrings | Yes: eight candidate errors | Not ported; five are provenance generator labels, two are extension vocabulary, one is a module-suffix matcher; none is a managed-path defect |
| Independent database/network/path clean summaries | No additional database/network clean summary: both kinds already have findings; path clean summary is absent with the eight candidates | Not ported; no true finding |
| Erase global callees in strict copied-body comparisons | Yes: one extra error | Not ported; different global normalizers are semantically distinct |
| Near-copy literal similarity | Yes: one extra warning on different SQL measures | Not ported; existing fixture deliberately rejects this false positive |
| Explicit invalid Markdown marker diagnostics; fallback substring provenance when no marker is supplied | No: the real marker is valid and supplied; v1b lineage counts equal this engine's counts | Not ported; substring fallback would weaken structured provenance |
| Accepted debt relabels only errors/warnings, retains reasons and excludes row-wise debt before budget/top-sites | No: accepted debt is empty | Not ported; relabelling is not a new finding |
| Exceptions relabel findings after checks | No: exceptions are empty | Not ported; M5 forbids hiding findings through settings suppressions |
| Grouped reports, per-check CLI summaries, debt columns, output destination guards and exit-2 output failures | No finding-count change | Not ported; this CLI intentionally writes only stdout, and pytest prints its table |

Shared behaviour already present includes immutable SQLite reads, live-WAL
rejection, portable relative paths, relative settings-root resolution, structured
Markdown/JSON/JSONL provenance, read-only connector warnings, stable-id detection,
and errors for checks that cannot run.

## Real run after the only port

Settings for the real data project remain in an OS-temporary file. Source globs,
databases, scope, budgets and empty suppression lists were preserved from build 1.
The project remained on local `main`. Both runs inspected identical source/data
scope. Raw results, locations and values remain temporary and untracked.

| Check | Before: error/warn/info/ok | After membership port: error/warn/info/ok |
|---|---|---|
| identifier-types | 0 / 0 / 0 / 1 | 2 / 0 / 0 / 0 |
| keys-hold | 1 / 0 / 0 / 0 | 1 / 0 / 0 / 0 |
| one-normalizer | 1 / 0 / 0 / 0 | 1 / 0 / 0 / 0 |
| connectors | 4 / 10 / 0 / 1 | 4 / 10 / 0 / 1 |
| stable-ids | 0 / 0 / 0 / 1 | 0 / 0 / 0 / 1 |
| lineage | 40 / 0 / 1 / 0 | 40 / 0 / 1 / 0 |
| reusable-processing | 1 / 0 / 0 / 0 | 1 / 0 / 0 / 0 |
| row-wise-ops | 0 / 8 / 0 / 0 | 0 / 8 / 0 / 0 |

`build2-real-run.log` records the rerun. The CLI exits 1 for real errors; the
validation harness exits 0 after confirming the duplicate and unchanged bytes
across 154 scoped files, including database side files. The crosswalk has one
duplicated external-key group. Stable-id errors remain zero. The fixture and its
code-breaking mutation independently prove detection when builtin `hash()` feeds
an identifier in scope. No target source/data bug was repaired.

Observed false-positive patterns remain pinned in the same M2/M5 fixtures:
object identifier descriptors, disjoint identifier domains, read-only local URIs,
human-authored report reviews, different SQL measures and different global callees.
Structured provenance still covers CRLF, trailing spaces/tabs and no final newline.
The membership port does not read text line by line or execute project code.

## Wrong-code pairs and test edits

| Pair | Wrong code | Wrong exit | Corrected exit | Evidence |
|---|---|---:|---:|---|
| M5 membership, wrong first | Existing engine ignores missing reference members | 1 | 0 | Pre-implementation assertion failed with `AssertionError: []`; `build2-mutations.log` also proves removal of the new membership code fails |
| M5 scoped hash | Stable-id registry entry returns no findings | 1 | 0 | `build2-mutations.log` |

Mutations change implementation code, never assertions. Every fixture lives in the
OS temp directory, and every synchronous case/child has an explicit time limit.
There are still exactly eight named suite tests; no test was deleted or renamed.

Existing test edits in this build:

- M1/M6 snapshots copy only shipped template inputs; the plan folder is no longer
  required. M6 mutates the new canonical path when proving later updates.
- The fixture loader reads the new canonical path.
- M2's name-specific source guard now checks absence of neutral fixture sample
  names, removing private project vocabulary from the test itself.
- M5 gains the missing-member fixture for the port, retains its existing hash and
  crosswalk assertions, and promotes `req-candidate` to `req: R-3844`.

Build 1's acceptance assertion edits remain unchanged: six renders instead of
four, default-off command expectations restricted to default-off directories, and
three optional skill-path exemptions. No unrelated existing test was edited.

## Validation

All evidence paths are relative to this folder. Machine-specific output is
normalised to repo-relative paths, `~` or `$TMPDIR` before committing.

| Command | Exit | Evidence/result |
|---|---:|---|
| Touched tests: `node scripts/test.mjs --jobs=2 data-pack.test template-acceptance.test templates-render.test templates-update.test template-release.test requirements-trace.test code-map.test readme-check.test test-runner` | 0 | `build2-touched-tests.log`: 10 files PASS; 417 checks pass, 0 fail, 0 skip |
| `node scripts/test.mjs test-runner` | 0 | `build2-test-runner.log`: 2 files PASS; 64 checks pass |
| `npm run map` | 0 | `build2-map.log`; generated map unchanged |
| `npm run map:check` | 0 | `build2-map-check.log` |
| `npm run req:tree` | 0 | `build2-tree.log`; generated outline unchanged |
| `node scripts/requirements-trace.mjs` | 0 | `build2-trace.log`; R-3844 implemented and traced |
| `npm run readme:check` | 0 | `build2-readme.log` |
| Rendered project: `uv run ruff check --fix .`, `uv run ruff format .`, `uv run mypy` | 0 each | `build2-ruff.log`, `build2-format.log`, `build2-mypy.log`; Ruff left engine bytes unchanged |
| Native template acceptance through M8 | 0 | Opted-in scaffold/adopt: sync, Ruff lint/format, strict mypy and full pytest; explicit data-test discovery passes; default-off cases remain |
| Real-run harness / CLI | 0 / 1 | `build2-real-run.log`; expected findings verdict |
| Mutation harness | 0 | `build2-mutations.log`; two rejected code mutations and restored greens |

The final response records the final-commit identity scan, private-term diff grep,
map generation/check, requirements tree, README check, template acceptance and
path-filtered tests. No local full-suite result or native Windows result is
claimed: CI covers both under AGENTS.md. No install check is required because
this build changes neither setup nor hooks.

## Closed findings

- The public example and plan no longer name the real data project or real people.
- The engine ships from one template source rather than an exempt history path.
- M5 now records real-source zero honestly and proves hash detection on its fixture.
- Inferred-domain identifier columns now report missing namespace members.

## Not done

No unrelated known bug was fixed. No target-project bug was repaired. No v1b debt,
exception suppression, unsafe normalizer execution or false-positive scan was
ported. No full local suite, native Windows execution, push or CI read occurred.
There is no remaining owner question from this build; the supplied M5 ruling
closes build 1's absent-hash question.
