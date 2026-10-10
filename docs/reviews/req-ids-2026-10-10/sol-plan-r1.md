## Score: 6/10

The direction is sound, but the plan needs contract and scope fixes before building.

### MUST 1 — Use an ASCII digit grammar in both rails

The proposed regex is correct in JavaScript but not equivalent in Python.

- JavaScript `\d` is ASCII-only here.
- Python `re` treats `\d` as Unicode decimal digits unless `re.ASCII` is used.
- The existing Python grammar already has this cross-language gap at `templates/python/template/tests/conftest.py:54`.
- The TypeScript grammar is at `templates/typescript/template/tests/requirements-trace.ts:45-46`.
- The plan promises identical behavior in both languages at `docs/reviews/req-ids-2026-10-10/CHANGE.md:21-23,87-89`.

A Python rail using the proposed pattern would accept values such as `R-１２３` and mixed four-digit forms that TypeScript rejects.

**Smallest fix:** specify `[0-9]` throughout:

```regex
^[RG]-(?:[0-9]{3}|[1-9][0-9]{3})$
```

Use `[0-9]+` for near-miss detection too. Add Unicode-digit rejection fixtures in both languages.

### MUST 2 — The plan excludes live consumers that become silently weaker

Fable’s statement that nothing else parses IDs is false at `docs/reviews/req-ids-2026-10-10/fable-consult.md:5`. The plan repeats that mistake by excluding three test families at `docs/reviews/req-ids-2026-10-10/CHANGE.md:76-79`.

These live consumers still encode three digits:

- `packages/nana-pack/tests/templates-render.test.mjs:167` parses rendered G IDs.
- `packages/nana-pack/tests/templates-render.test.mjs:188,196` compare shared and nana-pi G rows.
- `packages/nana-pack/tests/templates-render.test.mjs:611` would miss an implemented four-digit row.
- `packages/nana-pack/tests/templates-render.test.mjs:612` would omit a four-digit G row from status checks.
- `packages/nana-pack/tests/templates-render.test.mjs:614` would miss an invented four-digit R row.
- `packages/nana-pack/tests/templates-update.test.mjs:108-109` silently omit four-digit G rows.
- `packages/nana-pack/tests/requirements-tree.test.mjs:72,75` only recognize three-digit shared-index rows.

The claim that these fixtures “can never hold” four-digit IDs contradicts R-1000, which expressly permits `G-1000` through `G-9999` at `docs/reviews/req-ids-2026-10-10/CHANGE.md:36`.

`packages/nana-pack/tests/requirement-rows.test.mjs:80` also parses three digits, but that assertion intentionally checks only R-001 through R-019. Its production comparator already accepts arbitrary widths at `scripts/requirement-rows.mjs:17-20`. It does not require a functional change.

**Smallest fix:** move `templates-render` and `templates-update` into scope and broaden their ID patterns. Explicitly update the two shared-index selectors in the already-allowlisted tree test.

### MUST 3 — Define whether near-misses inside fences and unrelated tables fail

R-1001 applies to every column-zero line beginning with a pipe and a digit-bearing R/G token at `docs/reviews/req-ids-2026-10-10/CHANGE.md:37,92-98`. That includes:

- fenced Markdown examples;
- unrelated tables whose first cell resembles an ID;
- range/index cells such as `R-1000–R-1002`;
- prose examples beginning in column zero.

The current TypeScript rail is already context-free and scans all lines at `templates/typescript/template/tests/requirements-trace.ts:184-218`. The Python rail does the same for column-zero pipe lines at `templates/python/template/tests/conftest.py:137-155,346-359`. Neither design understands fences or canonical table boundaries.

The repo’s current ledgers contain no candidate near-miss, but that does not define upgrade behavior for other projects.

**Smallest fix:** choose and state one rule:

1. Every column-zero candidate fails, including fenced examples and unrelated tables; or
2. Only candidates inside canonical requirement tables fail.

Add fixtures for a fenced example and a secondary table. Assert the chosen behavior in both languages.

### MUST 4 — State the missing-closing-pipe behavior directly

The Python reader currently accepts a missing closing pipe because it strips optional edge pipes before splitting at `templates/python/template/tests/conftest.py:137-145,346-356`. TypeScript requires a closing pipe at `templates/typescript/template/tests/requirements-trace.ts:46`.

R-1001 says failure occurs when the rail “cannot read” the line at `docs/reviews/req-ids-2026-10-10/CHANGE.md:37`. Under the existing Python definition, it can read that line. The proposed fixture therefore pins behavior that the row does not clearly require.

This is also an intentional compatibility break. An existing Python project with such a row will fail on its next template update.

**Smallest fix:** define a requirement row as a column-zero, closing-pipe, exactly-four-cell row. State that missing closing pipes become errors in both rails. Mention the upgrade break in the template release notes or ledger guidance.

### MUST 5 — Expand the test matrix to match the rows

The plan names acceptance, leading-zero, five-digit, and missing-pipe fixtures at `docs/reviews/req-ids-2026-10-10/CHANGE.md:60-63`. It does not explicitly pin all stated dimensions:

- `R-1000` and `G-1000`;
- four-digit IDs in rows;
- four-digit IDs in markers;
- malformed candidates in `REQUIREMENTS.md`;
- malformed candidates in `REQUIREMENTS-general.md`;
- exact filename and line number for each source.

A single `R-1000` row-plus-marker fixture does not fully pin the promised `G` branch. Merely placing a general file beside the fixture does not prove that a malformed line in that file is detected.

**Smallest fix:** list this matrix explicitly and add mutations for the G branch and each raw file.

### SHOULD 1 — Keep R-1000 and R-1001 in FEAT-028, but tighten R-1001

FEAT-028 is the correct home. It already owns identity, trace behavior, Part G merging, and tree validation at `REQUIREMENTS.md:1232-1253`. These behaviors do not belong in Part G.

R-1000 is one cohesive grammar contract, although it spans rows and markers. R-1001 is testable only after “readable row” and candidate boundaries are defined.

R-1002 is intentionally absent. The consult dropped numeric report ordering at `docs/reviews/req-ids-2026-10-10/fable-consult.md:7`, and the plan records lexical sorting as a residual at `docs/reviews/req-ids-2026-10-10/CHANGE.md:50-51`.

### SHOULD 2 — Reconsider sharing R-1001 with FEAT-014

The plan proposes sharing R-1000 but not R-1001 because setup never writes a malformed line at `docs/reviews/req-ids-2026-10-10/CHANGE.md:46-48`.

That reasoning is inconsistent. Both behaviors ship through the same project rail. R-1001 governs how rendered projects validate user-authored ledgers, regardless of what setup initially writes.

**Smallest fix:** either share both rows with FEAT-014 or explain a narrower sharing criterion that excludes validation behavior consistently.

### SHOULD 3 — Update user-facing grammar wording

The plan says `R-nnn` wording remains true at `docs/reviews/req-ids-2026-10-10/CHANGE.md:80`. That wording naturally describes exactly three digits.

Affected live guidance includes:

- `README.md:49`
- `packages/nana-pack/skills/scaffold-py/SKILL.md:17`
- `packages/nana-pack/skills/scaffold-ts/SKILL.md:18`
- `packages/nana-pack/skills/spec/SKILL.md:16`
- `packages/nana-pack/skills/requirements/SKILL.md:68`

Examples using `R-001` remain valid. Grammar descriptions using `R-nnn` should become “three or four digits” or use an unambiguous placeholder.

### SHOULD 4 — Guard the stacked base

The lane is correctly based on the reviewed tree tip, and the plan states the land order at `docs/reviews/req-ids-2026-10-10/CHANGE.md:3-5`. The current checkout confirms that exact tree commit is the parent.

The tree branch is still unmerged and awaiting acceptance. Any amendment to that branch can invalidate row counts, generated outline expectations, or the reviewed base.

**Smallest fix:** require the accepted tree tip to equal the recorded base. Otherwise rebase, regenerate, rerun all checks, and review the changed diff.

### NOTE — Template acceptance is the correct final proof

`template:accept` resolves an immutable commit and passes it to Copier at `scripts/template-acceptance.mjs:37-48`. It renders both languages at `scripts/template-acceptance.mjs:82-93` and runs each native suite at `scripts/template-acceptance.mjs:19-22,100`.

Therefore, after the fixtures are strengthened, the proposed post-commit acceptance run proves both rendered languages. It also avoids the optional Python skip in the root suite.

### NOTE — Sibling-project consequences are described honestly

The deferred hand edit for `aml-desk` and the migration complexity for `basketball-geek` are recorded at `docs/reviews/req-ids-2026-10-10/CHANGE.md:128-133`. Those projects remain unable to consume four-digit IDs until their follow-ups land.

The claim that their ledgers contain no near-miss cannot be verified from this checkout. Keep it attributed to the consult rather than presenting it as locally reproduced evidence.

### NOTE — Historical parsers remain three-digit

Several executable review artifacts would silently omit four-digit IDs if rerun:

- `docs/reviews/ears-form-2026-10-04/apply-batch.mjs:22`
- `docs/reviews/req-tree-2026-10-09/move.mjs:35`
- `docs/reviews/req-tree-2026-10-09/prove.mjs:45,87,103`
- `docs/reviews/req-tree-2026-10-09/seat-attacks.mjs:38,44`
- `docs/reviews/req-tree-2026-10-09/seat-verify-b.sh:25,115,130`

They are historical lane tools, not production consumers. Do not rewrite the records, but name them as intentionally frozen exceptions so the whole-repo inventory is accurate.

VERDICT: SEND-BACK
