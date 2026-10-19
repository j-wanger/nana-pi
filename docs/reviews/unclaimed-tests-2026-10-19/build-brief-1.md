# Build brief — unclaimed-tests

Feature: FEAT-028 · Maintain requirement identity and trace links. Class: ordinary. Builder: larger (`pi-worker --lane-size larger`).
Worktree `~/nana-pi-wt/unclaimed-tests`, branch `feat/unclaimed-tests` from main. Row IDs R-1660 to R-1669 only; this plan uses R-1660 to R-1665. Run single test files only; the seat runs the full suite. Never edit HANDOFF.md or docs/sessions/. The must-meet file is the contract: switch, format strings and order are fixed there. No grouping by nearby row.

Order: rows, then the six tests (see each go red), then code.
1. REQUIREMENTS.md: add R-1660 to R-1665, text verbatim from the must-meet, to FEAT-028's table after its last row (R-1463, or R-1643 if leaf-total-drop has landed). Each stays `untested` until its test passes, then `implemented` with evidence `packages/nana-pack/tests/requirements-unclaimed.test.mjs::<title>`, backticked.
2. New `packages/nana-pack/tests/requirements-unclaimed.test.mjs`: six-tag header, the repo's `check(name, ok, why)` pattern, `// req:` directly above each `check("title", …` written on one line.
   - Fixtures in the OS temp dir via `./tmp-dir.mjs`. Write fixture sources as one-line strings with `\n` escapes: a `// req:` line in a template literal is scanned for real and breaks nana-pi's trace.
   - Twin fixtures come from one layout table. Child runs: compare stdout only; build the off env by deleting `NANA_REQ_UNCLAIMED` from a copy of `process.env`.
   - Python legs use `uvx --with pytest`: runpy for `unclaimed_lines` and the constant, and a real `pytest -p no:cacheprovider` run with `PYTHONIOENCODING=utf-8`. SKIP only when uvx cannot resolve pytest and NANA_TEST_REQUIRE_COPIER is unset; FAIL when it is `1` (copy templates-render's pattern).
3. `templates/typescript/template/tests/requirements-trace.ts`: add `UNCLAIMED_ENV` (contract value, R-1665), `unclaimedLines(root, options)` and `printUnclaimed(root, options, env)`. Sort entries by the whole path string, then line. Update header @inputs/@outputs. Erasable TypeScript only (strip-types), biome style.
4. `templates/typescript/template/tests/requirements-trace.test.ts.jinja`: one `printUnclaimed(ROOT, {}, process.env)` after `printReport` in the first "this project" test. This edits that test; it is not a new test.
5. `templates/python/template/tests/conftest.py`: add `UNCLAIMED_ENV` and `unclaimed_lines(root, test_roots=("tests",), call_names=CALL_NAMES)`; sort by the posix path string, never `Path` order. `pytest_sessionfinish` sits at ruff mccabe 10 today, the template's cap: add no `if` or loop to it; put the switch test and the writing in one helper it calls. Leave the exit status alone; keep `check()` (a 7-tuple) and `scan_source` unchanged. Fully typed for the template's `mypy --strict`; update the header.
6. `scripts/requirements-trace.mjs`: re-export the three new names. The main block calls `printUnclaimed(REPO_ROOT, { testRoots: TEST_ROOTS, callNames: CALL_NAMES }, process.env)` after the problem lines, then sets `process.exitCode` in place of `process.exit(...)` (same codes). Update the header.
7. `packages/nana-pack/skills/requirements/SKILL.md` §5, after "get the rail green" and before Pass 2, a short paragraph:
   - Set `NANA_REQ_UNCLAIMED=1` and run the suite; the rail prints every test declaration no marker claims.
   - Each line is a proposal: mark a row it already evidences, draft a row for behaviour no row states, or leave it. A listed line is never a row or evidence by itself.
   - A zero count covers only what the grammar sees; `req-candidate:` tests stay listed until their rows are promoted.
   - Name no path or script that exists in only one language's render, and no nana-pi-only path (skill-claims judges both scaffolds).
8. Run `npm run req:tree`. If main still has the R-291 leaf-total literal in `packages/nana-pack/tests/requirements-tree.test.mjs`, set it (title text and literal) to the total `node scripts/requirements-trace.mjs` prints; if leaf-total-drop has landed, make no edit there. Then `npm run map`.

Wrong code to try (each must turn the named check red; then revert):
- A marker two lines up also claims, so the line under a claimed test goes unlisted: R-1660, R-1662.
- TS orders by folder walk; Python orders by `sorted(Path)`: R-1660, R-1662.
- Count line dropped at zero: R-1660. Python binding ignores decorators: R-1661.
- Listing pushed into problems, or one entry dropped from the printed listing: R-1663.
- Python reads another variable name: R-1663, R-1665. Skill names another switch: R-1664.
- Paths joined with the platform separator fail only on the Windows leg: name it CI-only in the report.

Done:
- The six checks PASS in the new file, with the Python legs run, not skipped.
- Green single files: requirements-unclaimed, requirements-trace, requirements-tree, templates-render (its ruff check covers the conftest), templates-update, skill-claims, code-map.
- `npm run map:check`, `npm run readme:check` and the trace command exit 0.
- `npm run template:accept` exits 0 at your committed tip (renders into the OS temp folder; runs ruff, mypy strict, pytest and pnpm check). If the network fails it, say so.
- No existing test changed beyond the leaf total and the .jinja call.

Report (10 lines or fewer): VERDICT; commits; rows and statuses; new-file PASS/SKIP counts; each wrong code and its red check; single-file runs with exit codes; the `unclaimed:` count line from `NANA_REQ_UNCLAIMED=1` on nana-pi; map, readme, tree, trace and template:accept exits; existing tests edited; what was not done.
