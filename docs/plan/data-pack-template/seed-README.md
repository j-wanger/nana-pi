# Data pack implementation

The original prototype now supplies the canonical implementation in `seed-checks.py`.
The optional Python template includes it into the rendered script rather than maintaining
another copy. `seed-run.py` records the historical prototype runner; it is not shipped or used.

The Python-only Copier answer `data_checks` defaults to false. An opted-in render adds
`data-checks.json`, `scripts/data_checks.py` and `tests/test_data_checks.py`. Configure the
settings before validating actual data. No new runtime dependency is required: the checker
uses the standard library and the template already supplies pytest.

## Checks

- Identifier SQL declarations and stored types; identifier descriptors may carry namespace metadata.
  A declared namespace anchors its source column. Other columns with that name are checked
  when their non-null values overlap the anchor; disjoint domains and empty non-anchor columns
  do not establish namespace membership. This is inferred scope, not a foreign-key check.
- Declared key duplicates and non-null crosswalk uniqueness; diagnostics expose counts, not key values.
- Additional normalizer definitions, inspected statically. Project code is never imported or evaluated;
  sample equivalence is explicitly unavailable for additional definitions. Initialisation calls in
  the canonical module produce an error rather than executing them.
- Network surfaces outside declared connectors and SQLite opens outside database modules.
  Read-only opens (including locally assigned URIs) remain warnings.
- Builtin `hash()` feeding an identifier, including assignments, dict fields and keyword arguments.
- Report provenance: a JSON object or a structured text marker, never a prose mention.
  Existing report-scope globs distinguish human-written reviews from generated outputs.
- Copied function bodies after local-name, annotation and docstring normalisation.
  Global callees and meaningful literals stay distinct; different SQL queries are not copies.
- Row-wise query operations, counted at their innermost loop and compared with the configured budget.

SQLite uses `immutable=1` and refuses a nonempty WAL explicitly. The CLI writes only stdout
and never writes a report into the inspected project. It exits 1 for error findings and 2 for
settings errors. Pytest prints the table, fails on errors, passes on warnings and skips when
settings are absent. Use pytest's `-s` option to see passing warning tables.

Finding suppressions are not applied. The example settings are retained unchanged as grounding
for the private target; the build report records only check names and counts.
