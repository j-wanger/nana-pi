## Land review — round 3

**Score: 7/10. The documentation finding is closed, but two parser defects and one frontier contradiction block landing.**

Reviewed `eeeca20..d2edd8ff445a3cc174a47110729bd23130a8b159`. This review serves the terminal-consistency priority.

### MUST 1 — Normalize the leading BOM exactly once

Locations:

- `templates/python/template/tests/conftest.py:74–81,425–431`
- `templates/typescript/template/tests/requirements-trace.ts:215–217,502–513`

Python removes a BOM when reading the file, then removes another during near-miss validation. TypeScript validates after removing one, but its row loader subsequently removes another.

Independent reproduction, with **two U+FEFF characters** immediately before this first-line row:

```text
| R-0123 | The tool shall work. | untested | — |
```

Results:

- TypeScript: zero rows, zero problems.
- Python: malformed-row failure at `REQUIREMENTS.md:1`.

With a valid `R-1000` instead, both load the row despite the declared **one-BOM** rule.

Normalize once per file and give validation, loading, counting and merging the same normalized text. Add double-BOM fixtures alongside the single-BOM fixtures.

**Sol’s BOM finding is only partially closed.** Its original single-BOM cases pass, but the replacement implementation still disagrees across rails.

### MUST 2 — Give the tree checker the rail’s whitespace grammar

Location: `scripts/requirements-tree.mjs:18`.

The tree imports the widened ID expression but retains JavaScript `\s`. The trace rail now accepts additional whitespace, including U+0085 and U+001C–U+001F.

Independent reproduction inside an otherwise valid feature table:

```text
|\u0085R-1000 | The tool shall work. | untested | — |
```

Here `\u0085` denotes the actual character.

Results:

- Trace rail: loads `R-1000`.
- Tree checker: zero problems; renders **Rows: 0 · IDs: —**.

This silently omits a newly supported row from placement checks and the generated outline. It undermines R-287 and R-291.

Use the shared whitespace definition around tree row IDs. Add tests proving recognition, placement rejection and outline inclusion.

This is separate from the already accepted tree CRLF limitation.

### MUST 3 — Reconcile the HTML-page ruling before landing

- `docs/sessions/2026-10.md:15` records that Jake lifted the HTML-page hold.
- `HANDOFF.md:44` still makes HTML land pages conditional on the writing-trial verdict.
- `HANDOFF.md:47` still parks the review-timeline diagram with those pages.

These instructions cannot all describe the same frontier. Apply the recorded ruling consistently, or explicitly distinguish the surfaces if Jake lifted only one hold.

Because nothing is written after landing, this correction needs acceptance before the merge.

### SHOULD — Make the Windows ruling unambiguously prospective

`docs/sessions/2026-10.md:15` says “Windows is tested now.” The builder explicitly reports no Windows execution.

Use the clearer wording already present at `HANDOFF.md:12`: Jake **requires Windows testing now**. The planned CI runner and VM remain pending.

### NOTE — Round-2 documentation finding closed

Closed at:

- `templates/typescript/template/REQUIREMENTS.md.jinja:46`
- `templates/python/template/REQUIREMENTS.md.jinja:48`
- `docs/reviews/req-ids-2026-10-10/CHANGE.md:39–56`

These now define LF-only lines, the explicit whitespace list, the BOM rule and rejection of other trailing characters.

The author-facing ledgers declare the reserved prefix and provide an indented-example escape. The compatibility break is adequately documented.

The previous NBSP-rejection residual is superseded: NBSP now belongs to the accepted whitespace list.

### NOTE — Sol’s remaining round-2 cases

The original whitespace, comma-separated marker, Unicode-separator and single-BOM fixtures now pass independently.

The ordinary row and marker paths use matching explicit whitespace lists. Closure remains incomplete because of MUST 1 and the downstream tree mismatch in MUST 2.

### NOTE — Three checkpoint decisions

The prepared decisions are technically justified:

1. **Seven frozen desk features:** their status reasons now cite Jake’s 2026-10-10 ruling.
2. **R-224 display share:** retain it; changing the shared renderer can affect knowledge-pointer escaping.
3. **R-1000/R-1001 project-setup shares:** retain both; generated projects receive both rail behaviors.

These recommendations do not replace Jake’s checkpoint-2 acceptance.

### NOTE — Merged-state records and open work

The prewritten merged-state entry is acceptable **only when the required approvals and merge actually occur**. It is not evidence that they already occurred.

The frontier retains downstream migrations, parser limits, tree residuals, unexecuted Windows work and the review-log defect. Existing owner questions remain listed. The HTML contradiction prevents accepting the frontier as fully accurate.

The seat must read every parallel verdict. A stored first verdict must not override this rejection.

### Evidence

Independently verified:

- Seat verifier: **zero mismatches; Python exercised**.
- Trace and tree test files: **all passed**.
- Tree and code-map checks: **passed**.
- **1,012 existing requirement rows unchanged**; only R-1000 and R-1001 added.
- Both parser counterexamples above reproduced.
- Checkout remained clean.

Full-suite and template-acceptance success remain builder-reported; I did not rerun them.

### Accepted residuals

Lexical ID sorting, indented-row exclusion, context-free reserved prefixes, downstream migrations, existing tree CRLF limitations, clause-coverage limits and previously recorded lifecycle gaps remain accepted.

The three MUST findings are **not** accepted residuals.

VERDICT: SEND-BACK
