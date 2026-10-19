# g005-carveout: build brief 1

Worktree: `~/nana-pi-wt/g005-carveout` on `feat/g005-carveout`, from main. Rows: R-1480 only (block R-1480 to R-1489), plus G-005 reworded. Read `docs/reviews/g005-carveout-2026-10-19/must-meet.md` first. Run single test files only: `node scripts/test.mjs <substring>…`. Never run the full suite.

**Order.**
1. Add R-1480 as `planned` in FEAT-033's table, directly after R-1301, with the row text from must-meet.md.
2. Write the check and watch it FAIL on all three files.
3. Change the text.
4. Flip R-1480 to `implemented`. Its Evidence is the backticked `file::title`.

**Change.**
1. G-005 Requirement cell. In `templates/_shared/requirements-general.md` and in `REQUIREMENTS.md`, write the same bytes: "A module shall expose its behaviour only through named exports that are its entry points, where a pi extension's default export counts as its named entry point." Use a straight apostrophe. Leave Status and Evidence as they are.
2. `packages/nana-setup/claude/rules/nana-standards.md`: replace the "Named exports only." bullet with "Named exports only; a pi extension's default export counts as its named entry point, because pi's loader requires one. Never reach into another module's internals, private helpers or mutable module-level state." Wrap like the bullets around it and keep the file under 80 lines.
3. `packages/nana-pack/skills/requirements/SKILL.md`: the line becomes "Standing rules: named exports only, where a pi extension's default export counts as its named entry point (no reaching into another module's internals, private helpers or mutable state) · …". Change nothing else.
4. `packages/nana-setup/tests/skills-and-standards.test.mjs`, section 0:
   - Add one `check(` directly after R-1301's, inside the same block, with `// req: R-1480` on the line directly above it.
   - Reuse `RULE_NORM`, `SKILL_NORM` and `norm()`. The phrase wraps across lines, so a raw `includes` is wrong.
   - Read the shared G-005 cell from `templates/_shared/requirements-general.md` with `/^\|\s*G-005\s*\|([^|]+)\|/m` and `norm()` it.
   - The failure detail lists each missing file: "the coding standards rule", "the requirements skill", "the shared G-005 row".
   - Title: `R-1480: the coding standards rule, the requirements skill and the shared G-005 row each say a pi extension's default export counts as its named entry point`
5. Run `npm run req:tree`. In `requirements-tree.test.mjs`, bump the leaf total by 1, in both the title and the comparison: 1,234 becomes 1,235 at 0f2e0ca. Recount after any main merge. No code-map change is expected.

**Wrong code to try (break the text, never the assertion):** each one must FAIL and name its file.
- Drop the words from the standards rule: R-1480 fails.
- Drop them from the skill: R-1480 fails.
- Drop them from the shared G-005: R-1480 and R-756 fail.
- Change G-005 in `REQUIREMENTS.md` only: R-756 fails.

**Done.** All of these exit 0:
- `node scripts/test.mjs skills-and-standards templates-render templates-update requirements-tree requirements-trace skill-claims product-report readme-check`
- `node scripts/requirements-trace.mjs` (ears 0 off form)
- `node scripts/code-map.mjs --check`
- `node scripts/readme-check.mjs`

Do not touch HANDOFF.md, the session notes, templates-render.test.mjs or skill-claims files. Do not add a scanner or any other new test.

**Report shape (10 lines or fewer):**
1. `VERDICT: DONE`, `VERDICT: PARTIAL` or `VERDICT: BLOCKED`
2. Commits (short sha and subject)
3. Rows flipped and the leaf total used
4. One line per wrong-code pair: the mutation, then the FAIL line seen
5. Each command with its exit code and its PASS/FAIL count
6. Every existing test edited, and why
7. What was not done