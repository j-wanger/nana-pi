## Findings

### MUST 1 — Code-span masking miscounts valid Markdown

**Files:** `templates/typescript/template/tests/requirements-trace.ts:52`; `templates/python/template/tests/conftest.py:60`

Both regexes recognize single-backtick spans, not matching backtick runs.

**Executed evidence:** For this Requirement cell, both rails count **2**, instead of **1**, and reject the row:

~~~text
The system shall print ``shall``.
~~~

The literal inside the double-backtick code span is counted as a promise. Ordinary single-backtick spans work.

**Smallest fix:** Mask spans delimited by matching backtick runs in both implementations. Add fixtures for single, double, and embedded-backtick spans.

### MUST 2 — Implemented G-014 and G-015 have incomplete clause evidence

**Files:**
- `packages/nana-pack/tests/requirements-trace.test.mjs:71`
- `templates/typescript/template/tests/requirements-trace.test.ts.jinja:336`
- `templates/python/template/tests/test_requirements_trace.py.jinja:275`
- `REQUIREMENTS.md:845–846`

G-014 promises a report line **after the summary**, but its cited tests assert only the off-form ID list.

G-015 promises to name **each** off-form row, but its failure fixture contains only one.

**Executed evidence:**
- Replacing the report with `WRONG REPORT` leaves nana-pi’s six rail checks, the rendered TypeScript suite **51/51**, and Python suite **56/56** green.
- Mutating each rendered rail to report only the first offending row also leaves both complete suites green.

The shipped behavior works, but these `implemented` citations do not pin their complete clauses.

**Smallest fix:** Assert the actual summary/report output and ordering. Test failure diagnostics with at least two off-form rows, asserting every ID and count. Cite those assertions.

### MUST 3 — Split placement contradicts the explicit ruling

**Files:** `templates/_shared/requirements-general.md:62–68`; `REQUIREMENTS.md:847–853`; `packages/nana-pack/tests/templates-render.test.mjs:138–140`

G-016 through G-022 are grouped under the requirement-set section rather than directly after their origins.

**Evidence:** Design-ruling §2 explicitly requires placement “directly after the origin, in the origin’s table.” Section §4 introduces G5 for the three check rows; it does not grant a placement exception for split-born rows.

R-737 promises stable IDs, not numerical table order. Its sequential-array assertion unnecessarily imposes the latter.

**Smallest fix:** Move each split-born row immediately after its origin in both copies. Compare sorted ID arrays in R-737’s test, retaining duplicate detection. Keep G-013–G-015 in G5.

**Placement ruling:** The worker’s reconciliation is understandable, but the explicit placement rule wins.

### MUST 4 — TypeScript and Python disagree on whole-word boundaries

**Files:** `templates/typescript/template/tests/requirements-trace.ts:53`; `templates/python/template/tests/conftest.py:61`

JavaScript and Python give `\b` different Unicode semantics.

**Executed evidence:** On identical input:

```text
The system shall print shallé.
```

- TypeScript counts **2**, reports R-900, and fails.
- Python counts **1** and passes.

**Smallest fix:** Choose and document one word-boundary definition, implement it identically in both languages, and add shared parity fixtures including non-ASCII letters.

### SHOULD — Document the usable TypeScript allowance setting

**File:** `templates/typescript/template/REQUIREMENTS.md.jinja:62–64`

The adoption instructions direct owners to `CheckOptions.earsAllowance` in the implementation file. That is an interface property, not a project setting. The rendered self-tests invoke `check(ROOT)` independently twice.

**Evidence:** The worker report correctly says both call sites need editing, contradicting the consumer-facing instructions.

**Smallest fix:** Document the actual call sites, preferably using one project allowance constant passed to both.

### NOTE — The allowance is a ceiling, not an automatically tightening ratchet

**Files:** `scripts/requirements-trace.mjs:54`; `packages/nana-pack/tests/requirements-trace.test.mjs:94`

**Executed evidence:**
- Increasing the repository count to **195** fails and names all **195** offending rows.
- Reducing it to **193**, with allowance still **194**, leaves all six rail checks green.
- Raising the exported allowance to **195** fails the seal test naming G-015.
- Both language implementations agree at allowances **0, 2, and 3** for the same two-off-form-row fixture.

This follows the ruling’s explicit `count > allowance` comparison. However, tightening remains a landing ceremony: stale headroom is not caught.

**Smallest improvement:** Add a repository-specific assertion that the measured count equals the declared allowance, or explicitly retain manual tightening as the accepted policy.

Each surface has exactly one literal-value seal assertion. The Python seal at `test_requirements_trace.py.jinja:291` lacks the requested G-015 identification; add it.

## Verification

Reviewed `git diff main..HEAD` completely at **6f21ea9**, against **ed90650**. Repository working tree remains clean.

### Precision and parity

Both rails ran the same **13-case corpus**:

| Input | Result |
|---|---|
| Ordinary requirement | Both count 1 |
| Single-backtick `shall` | Both ignore it |
| Double-backtick `shall` | Both incorrectly count it |
| Embedded-backtick span fixture | Both count 1 |
| Quoted `"shall"` | Both count it; quotes are not exempt under the ruling |
| Evidence-column `shall` | Both ignore it |
| Retired row | Both exempt it |
| Escaped pipe in a cell | Both reject the table; consistent with the existing no-pipes contract |
| `shallower` | Neither counts the substring |
| Sentence-initial `Shall` | Both count it |
| `shallé` | **Different results**, as above |
| No promise word | Both report count 0 |
| Two promises | Both report count 2 |

Thus, **12/13 outcomes agree**, normalizing parser-error wording. Agreement does not make the double-backtick result correct.

### Rows and split audit

- **539 → 550** IDs; no removed or duplicate IDs.
- Added IDs exactly match G-013–G-022 and R-756.
- All six origins’ mapping texts match the committed requirement cells.
- Continuation allocations match the ruling.
- All new Part G rows have one modal `shall` outside code spans.
- All seven split-born clauses remain `untested`; this is the correct conservative disposition.
- G-007’s retained citation fails when a package-to-app import is injected.
- G-012’s retained citation fails when the README’s test heading is removed, after establishing a clean disposable baseline.
- G-013 is honestly `violated` in nana-pi.
- R-737 and R-756 have direct ID/render and cell-equality assertions.
- G-014/G-015 need the evidence repairs above.

There are **zero implemented split-born rows** to randomly sample; I inspected all seven and both retained implemented origins.

### Executed suites

| Check | Result |
|---|---|
| Repository rail tests | **6 passed**, allowance 194 |
| Template render tests, both languages and modes | **61 passed** |
| Fresh TypeScript scaffold: install + own suite | **51 passed**, allowance 0 |
| Fresh Python scaffold: sync + own suite | **56 passed**, allowance 0 |
| Injected two-`shall` R-900 in each scaffold | Both suites exit 1 and name R-900 |
| `npm run map:check` | **0 problems** |
| `npm run readme:check` | **5 missing-path problems**, exit 1 |
| Completed `npm test` | **93 PASS, 1 FAIL, 1 SKIP**; **5519 checks passed, 2 failed, 6 skipped** |

The repository suite’s sole failing file is the README check, caused by absent `node_modules` and benchmark extension paths. This matches the worker’s environmental failures. Contrary to its report, the README CLI exits **1**, not 0.

Execution artifacts are under `/tmp/ears-astra/`.

**VERDICT: BLOCK — 6/10**
