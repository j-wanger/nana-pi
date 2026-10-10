VERDICT: DONE

Commit: `6459c53` (`req-ids: accept four-digit requirement IDs`).

Files: `REQUIREMENTS.md`; `README.md`; `docs/{requirements-tree,code-map}.md`; four skills; four nana-pack tests; both trace rails, their self-tests and ledger templates; `scripts/requirements-{trace,tree}.mjs`.

Read points: TypeScript rail `requirements-trace.ts:45–47, 203, 275, 485`; Python rail `conftest.py:54, 144, 363, 380–412`; tree checker `requirements-tree.mjs:19, 194–202, 209, 277, 300`; template self-tests `requirements-trace.test.ts.jinja:139, 185` and `test_requirements_trace.py.jinja:142, 248`. Also read the listed CHANGE §3 tests and the requirements skill. No difference from CHANGE.

Rows: R-1000 and R-1001 are `implemented`. R-1000 tests pin four-digit R/G rows and markers, invalid-ID rejection, and tree ranges/shares; R-1001 tests pin raw-file near-miss rejection with file and line across both ledgers and rails.

Mutation pairs, red → green: three-digit ID grammar (1 → 0); Python `\d` mutation (1 → 0); omitted Python general-file raw check (1 → 0); disabled G grammar branch (1 → 0); disabled G near-miss branch (1 → 0); three-digit tree row matcher (1 → 0). Each red failed its targeted test; each restored implementation passed.

Commands: `req:tree` 0; `map` 0; `map:check` 0; focused trace, tree, template-render and template-update tests 0; `test:locked` 0; `template:accept` 0; seat verification 0.

Suite summary: `133 files: 132 PASS, 0 FAIL, 1 SKIP · checks: 6657 pass, 0 fail, 5 skip · 574.2s`. The skip requires absent `apps/bench/.ext/pi-web-access`.

Scope: `git diff --stat 43fb35f..HEAD` reports 20 files, 268 insertions and 53 deletions. Worktree clean.

Not done: no share was applied; the share ruling remains Jake’s. No follow-up rails in aml-desk or basketball-geek were changed, and no external review or template release tag was completed.

Most likely wrong: the checked local ledgers’ candidate lines may not represent every downstream project ledger.

Seat verification output, verbatim:

```text
ok   TS R-1000 and G-1000 rows read and clean: true/true/true (want true/true/true)
ok   PY R-1000 and G-1000 rows read and clean: true/true/true (want true/true/true)
ok   TS R-1000 and G-1000 markers trace their rows: true (want true)
ok   PY R-1000 and G-1000 markers trace their rows: true (want true)
ok   TS near-miss in REQUIREMENTS.md (leading zero) fails: true/names REQUIREMENTS.md:6 (want true/names REQUIREMENTS.md:6)
ok   PY near-miss in REQUIREMENTS.md (leading zero) fails: true/names REQUIREMENTS.md:6 (want true/names REQUIREMENTS.md:6)
ok   TS near-miss in REQUIREMENTS-general.md (leading zero) fails: true/names REQUIREMENTS-general.md:6 (want true/names REQUIREMENTS-general.md:6)
ok   PY near-miss in REQUIREMENTS-general.md (leading zero) fails: true/names REQUIREMENTS-general.md:6 (want true/names REQUIREMENTS-general.md:6)
ok   TS near-miss in REQUIREMENTS.md (five digits) fails: true/names REQUIREMENTS.md:6 (want true/names REQUIREMENTS.md:6)
ok   PY near-miss in REQUIREMENTS.md (five digits) fails: true/names REQUIREMENTS.md:6 (want true/names REQUIREMENTS.md:6)
ok   TS near-miss in REQUIREMENTS-general.md (five digits) fails: true/names REQUIREMENTS-general.md:6 (want true/names REQUIREMENTS-general.md:6)
ok   PY near-miss in REQUIREMENTS-general.md (five digits) fails: true/names REQUIREMENTS-general.md:6 (want true/names REQUIREMENTS-general.md:6)
ok   TS near-miss in REQUIREMENTS.md (non-ASCII digits) fails: true/names REQUIREMENTS.md:6 (want true/names REQUIREMENTS.md:6)
ok   PY near-miss in REQUIREMENTS.md (non-ASCII digits) fails: true/names REQUIREMENTS.md:6 (want true/names REQUIREMENTS.md:6)
ok   TS near-miss in REQUIREMENTS-general.md (non-ASCII digits) fails: true/names REQUIREMENTS-general.md:6 (want true/names REQUIREMENTS-general.md:6)
ok   PY near-miss in REQUIREMENTS-general.md (non-ASCII digits) fails: true/names REQUIREMENTS-general.md:6 (want true/names REQUIREMENTS-general.md:6)
ok   TS near-miss in REQUIREMENTS.md (missing closing pipe) fails: true/names REQUIREMENTS.md:6 (want true/names REQUIREMENTS.md:6)
ok   PY near-miss in REQUIREMENTS.md (missing closing pipe) fails: true/names REQUIREMENTS.md:6 (want true/names REQUIREMENTS.md:6)
ok   TS near-miss in REQUIREMENTS-general.md (missing closing pipe) fails: true/names REQUIREMENTS-general.md:6 (want true/names REQUIREMENTS-general.md:6)
ok   PY near-miss in REQUIREMENTS-general.md (missing closing pipe) fails: true/names REQUIREMENTS-general.md:6 (want true/names REQUIREMENTS-general.md:6)
ok   TS near-miss in REQUIREMENTS.md (fenced example) fails: true/names REQUIREMENTS.md:7 (want true/names REQUIREMENTS.md:7)
ok   PY near-miss in REQUIREMENTS.md (fenced example) fails: true/names REQUIREMENTS.md:7 (want true/names REQUIREMENTS.md:7)
ok   TS near-miss in REQUIREMENTS-general.md (fenced example) fails: true/names REQUIREMENTS-general.md:7 (want true/names REQUIREMENTS-general.md:7)
ok   PY near-miss in REQUIREMENTS-general.md (fenced example) fails: true/names REQUIREMENTS-general.md:7 (want true/names REQUIREMENTS-general.md:7)
ok   TS near-miss in REQUIREMENTS.md (unrelated table (R-)) fails: true/names REQUIREMENTS.md:6 (want true/names REQUIREMENTS.md:6)
ok   PY near-miss in REQUIREMENTS.md (unrelated table (R-)) fails: true/names REQUIREMENTS.md:6 (want true/names REQUIREMENTS.md:6)
ok   TS near-miss in REQUIREMENTS-general.md (unrelated table (R-)) fails: true/names REQUIREMENTS-general.md:6 (want true/names REQUIREMENTS-general.md:6)
ok   PY near-miss in REQUIREMENTS-general.md (unrelated table (R-)) fails: true/names REQUIREMENTS-general.md:6 (want true/names REQUIREMENTS-general.md:6)
ok   TS near-miss in REQUIREMENTS.md (unrelated table (G-)) fails: true/names REQUIREMENTS.md:6 (want true/names REQUIREMENTS.md:6)
ok   PY near-miss in REQUIREMENTS.md (unrelated table (G-)) fails: true/names REQUIREMENTS.md:6 (want true/names REQUIREMENTS.md:6)
ok   TS near-miss in REQUIREMENTS-general.md (unrelated table (G-)) fails: true/names REQUIREMENTS-general.md:6 (want true/names REQUIREMENTS-general.md:6)
ok   PY near-miss in REQUIREMENTS-general.md (unrelated table (G-)) fails: true/names REQUIREMENTS-general.md:6 (want true/names REQUIREMENTS-general.md:6)
ok   TS leading-zero marker refused: true/bad requirement id at tests/a.test.mjs:1 (want true/bad requirement id at tests/a.test.mjs:1)
ok   PY leading-zero marker refused: true/bad requirement id at tests/test_a.py:1 (want true/bad requirement id at tests/test_a.py:1)
ok   TS five-digit marker refused: true/bad requirement id at tests/a.test.mjs:1 (want true/bad requirement id at tests/a.test.mjs:1)
ok   PY five-digit marker refused: true/bad requirement id at tests/test_a.py:1 (want true/bad requirement id at tests/test_a.py:1)
ok   TS non-ASCII-digit marker refused: true/bad requirement id at tests/a.test.mjs:1 (want true/bad requirement id at tests/a.test.mjs:1)
ok   PY non-ASCII-digit marker refused: true/bad requirement id at tests/test_a.py:1 (want true/bad requirement id at tests/test_a.py:1)
ok   tree checker four-digit rows: problems: 0 (want 0)
ok   tree checker counts all three rows in the feature: true (want true)
ok   tree outline range across R-999 to R-1001: true (want true)
ok   tree checker accepts Also applies: R-1000 from another feature: 0 (want 0)
ok   real ledger: candidate lines that are valid rows: all of them (want all of them)
python rail: exercised
seat-verify-ids: 0 mismatch(es)
```
