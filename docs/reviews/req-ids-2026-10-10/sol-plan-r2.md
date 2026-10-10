## Score: 7/10

Round-one fixes are substantially addressed, but three blocking defects remain.

### MUST 1 — The tree’s shared-requirement validator remains a missed consumer

The plan updates the tree row prefix, range parser, and compressors at `docs/reviews/req-ids-2026-10-10/CHANGE.md:82-84`.

It does not name the separate `Also applies:` validator. That validator still requires exactly three digits at `scripts/requirements-tree.mjs:197`.

If unchanged, a valid `R-1000` row will parse, but `Also applies: R-1000` will report that the row does not exist. This contradicts the proposed FEAT-014 shares and R-292 compatibility.

**Smallest fix:** add the share-ID validator to scope and derive it from the exported `ID`. Add a fixture where another feature shares `R-1000`.

### MUST 2 — The acceptance script never fails

The script only prints actual and wanted values at `docs/reviews/req-ids-2026-10-10/seat-verify-ids.mjs:48`. It never counts mismatches or sets a failing exit status through its end at `docs/reviews/req-ids-2026-10-10/seat-verify-ids.mjs:118`.

I ran it. The expected four-digit and near-miss checks failed on today’s code, but the process still exited zero.

It correctly exposed skipped four-digit rows, rejected markers, missed near-misses, and broken tree counts. However, it cannot serve as acceptance evidence while every result exits successfully.

**Smallest fix:** make `out` compare `got` with `want`, count mismatches, print a summary, and exit one when any mismatch remains. Decide explicitly whether a missing Python runner is an accepted skip.

### MUST 3 — The stacked landing revision is wrong

The plan says the tree lands at `eeeca20` and this lane’s review covers the diff from there at `docs/reviews/req-ids-2026-10-10/CHANGE.md:126-130`.

The branch is actually based on `c4332ec`. That commit adds the final independent review record, whose verdict is at `docs/reviews/req-tree-2026-10-09/astra-land-b-r4.md:68`.

Landing only `eeeca20` omits that review record and leaves this lane carrying it. It also makes the stated accepted base differ from the actual parent.

**Smallest fix:** land the tree at `c4332ec` and review `c4332ec..<tip>`. If `eeeca20` is intentionally the product tip, explain how the review-record commit lands before this lane.

### SHOULD 1 — Declare the full compatibility break

The plan explicitly declares only the missing-closing-pipe break at `docs/reviews/req-ids-2026-10-10/CHANGE.md:46-48`.

The context-free rule is broader. A column-zero fenced example or unrelated table beginning with `R-` or `G-` can become a new failure, even when it is legitimate prose rather than a ledger row.

That behavior is deliberate and testable, but the proposed template guidance only mentions the closing pipe at `docs/reviews/req-ids-2026-10-10/CHANGE.md:76-77`. Current template guidance merely forbids pipes inside cells at `templates/python/template/REQUIREMENTS.md.jinja:14` and `templates/typescript/template/REQUIREMENTS.md.jinja:14`.

**Smallest fix:** state that the candidate prefix is reserved on every column-zero line. Tell users to indent such examples or avoid that first-cell spelling.

### SHOULD 2 — Pin every malformed marker class

R-1000 gives rows and markers the same complete grammar at `docs/reviews/req-ids-2026-10-10/CHANGE.md:36`.

The matrix rejects leading-zero markers, but five-digit and non-ASCII forms are rejected only as rows at `docs/reviews/req-ids-2026-10-10/CHANGE.md:138-144`.

The shared `ID` design reduces the immediate risk, but the tests should pin the contract rather than depend on that implementation detail.

**Smallest fix:** add five-digit and non-ASCII marker cases in both languages.

### NOTE — Round-one fixes verified

- The grammar now uses ASCII classes and correctly accepts three digits or non-zero-leading four digits.
- The live three-digit consumers in template rendering, updates, and tree tests are now in scope.
- The intentionally narrow objective-row test remains correctly excluded.
- The near-miss rule now defines context-free behavior for fences and unrelated tables.
- The Python missing-closing-pipe change is explicitly identified.
- Both raw ledger files and exact locations appear in the test matrix.
- Both rows are proposed for FEAT-014.
- User-facing `R-nnn` grammar wording is in scope.
- Historical executable review artifacts are accurately frozen.
- R-1000 and R-1001 are cohesive, testable contracts in FEAT-028. R-1002 correctly remains absent.

### NOTE — Template and sibling-project handling

`template:accept` resolves an immutable commit, renders both languages, and runs both native suites at `scripts/template-acceptance.mjs:74-100`. Strengthened rendered self-tests therefore provide the required release proof.

The `aml-desk` hand update and the more involved `basketball-geek` migration are honestly deferred at `docs/reviews/req-ids-2026-10-10/CHANGE.md:158-162`. They remain unable to consume four-digit IDs until those follow-ups land.

VERDICT: SEND-BACK
