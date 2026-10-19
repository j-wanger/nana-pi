# unclaimed-tests — plan attack (one adversary)

Verdict: AMEND

AMEND. The lane is worth building, but four probes changed the plan.

1. The nearby-row grouping is dropped. The plan's own most-likely-wrong claim turned out true. I measured a 10-line window on two adopted projects on this machine, yokai-world (TypeScript) and trading-zone (Python). It holds 6 of 53 unclaimed declarations in the first (11%) and 44 of 175 in the second (25%), against 70% in nana-pi (1,480 of 2,103, reproduced). The audit mode serves adopted projects, so most lines would land under "no nearby row". Dropping the grouping removes the old R-1663 (grouping) and R-1664 (window seal), a sealed tunable in two rails, the count line's M/W part and the tie logic in Python. The listing is now ordered by path and then line.

2. Printing then calling `process.exit` loses output. The probe printed 40,000 lines and called `process.exit(0)`; only 3,841 arrived through `spawnSync` on macOS. With `process.exitCode`, all 40,000 arrived. nana-pi's roughly 200 KB listing arrives whole today, but only by margin. The plan's R-1665 test checks only the prefix and the first line after it, so it could not see a cut-off tail. The amendment makes the shim set `process.exitCode`, and the switch test now checks that the count line's N equals the number of lines after it.

3. `pytest_sessionfinish` is already at ruff's complexity limit. Ruff gives it mccabe 10, and the template's limit is 10. One more `if` would make templates-render's ruff check on the render fail. The brief now says to add no branch or loop to that hook and to use a helper. mypy strict runs only in release acceptance, so `npm run template:accept` is now in Done.

4. Sort order needed a fixture. Python's `sorted(Path)` puts `tests/test_a/…` before `tests/test_a-b.py` (probed). The TypeScript folder walk does the same. Sorting the whole path string does not. The R-1660 and R-1662 fixtures now cover `a-b` beside folder `a`, with a wrong-code pair for each rail.

5. A new seal row, R-1665, pins the switch name `NANA_REQ_UNCLAIMED` in both rails. The skill teaches users that name. It replaces the dropped window seal and keeps every other assertion on the imported constant.

6. The skill row (now R-1664) is no wider than its test. Its test reads only the SKILL.md slice between Pass 1 and Pass 2.

Red today, confirmed by probe:
- The trace command prints the same 2 lines with the switch on and off, and exits 0 both times.
- A Python fixture run with the template conftest prints the same stdout on and off, and exits 1 both times.
- Neither rail, the shim nor the skill contains "unclaimed" or the switch name.

Lane class is ordinary: no land, review, install, hook or gate tool imports the trace rail. Cross-platform: paths use `/`, CRLF is trimmed by both rails, pytest escapes characters the output encoding lacks, and every case exists on every platform.

Conflicts:
- No in-flight lane touches either rail, the conftest or the skill. I checked each worktree's diff against main.
- leaf-total-drop is building now. It adds R-1640 to R-1643 right after R-1463 in FEAT-028 and rewrites the R-291 accounting in the tree test. The brief covers both landing orders: put the rows after FEAT-028's last row, and make no leaf-total edit once leaf-total-drop is on main. That is a text conflict only, so no wait.
- silent-main-guard (this slate) may edit the shim's main block. This lane also edits it, adding one call and switching to exitCode. Whichever lands second merges. No wait.
- audit-open-questions' product report imports from the shim. This lane only adds exports, so nothing breaks.
- The other in-flight lanes share only REQUIREMENTS.md, docs/requirements-tree.md and the leaf total. Merge main and rerun `npm run req:tree`.

Probes ran only in my own mktemp folder, with a temp HOME and a clone of the repo. The repo, its worktrees and the two adopted projects were only read.

Files: templates/typescript/template/tests/requirements-trace.ts, templates/typescript/template/tests/requirements-trace.test.ts.jinja, templates/python/template/tests/conftest.py, scripts/requirements-trace.mjs, packages/nana-pack/skills/requirements/SKILL.md, packages/nana-pack/tests/requirements-unclaimed.test.mjs (new), REQUIREMENTS.md, docs/requirements-tree.md, packages/nana-pack/tests/requirements-tree.test.mjs (only if leaf-total-drop has not landed), docs/code-map.md.

The claim most likely wrong: that a flat listing is enough. The audit's measured targets have 53 and 175 lines, which read easily. If nana-pi's own 2,103 lines are the first real use, an auditor may want the grouping back. That would be a later lane with its own measured window.
