# Adversary verdict — g005-carveout (2026-10-19)

Verdict: AMEND

AMEND: the lane shrinks to the wording change the owner ruled on 2026-10-10, plus one red-today test. The default-export scanner and three of its four rows are cut.

Why the scanner goes:
1. The ruling does not ask for it. HANDOFF queues "the G-005 pi default-export carve-out" as a small fix that rides along. The audit that raised it (docs/reviews/requirements-proposal-2026-10-09/README.md, C08) filed it as "wording + template tag" and said "The standard is wrong, not the code".
2. It fails the review standard's own test. The plan's R-1480 and R-1481 are green on today's tree, which the plan concedes ("a green guard"). They still pass with the feature removed, because the carve-out text is never checked by them. HANDOFF item 6 names exactly that as a send-back.
3. R-1480 duplicates checks that already exist. About 30 test files import each extension's default export and call it with a fake pi, so a missing default export already fails loudly. Two `export default` lines are an ESM syntax error. "A declared directory holds no module" has nothing to do with G-005.
4. R-1482 only tests the in-file scanner. It exists because the scanner exists, and so do known limits 1–3 and the plan's own most-likely-wrong claim.
5. G-005 stays `untested` in the plan anyway, so the scanner moves no status.

Without the scanner there is no new module, no code-map regeneration and no six-tag header.

Probes, run in a temp clone of main 0f2e0ca with a temp HOME:
- A draft R-1480 check sits next to R-1301 in packages/nana-setup/tests/skills-and-standards.test.mjs and reuses its `norm()`. On today's text it FAILS with "missing in: the coding standards rule, the requirements skill, the shared G-005 row".
- After the wording change it PASSES.
- The trace rail reports 1,235 rows and ears 0 off form.
- R-756 ("nana-pi Part G mirrors…") PASSES.
- templates-render, product-report and skill-claims all pass.
- requirements-tree passes after the leaf total goes from 1,234 to 1,235.
- `code-map --check` and readme-check both report 0 problems.
- The standards rule is 71 lines, under 80.
- Wrong-code pairs: dropping the carve-out from each file in turn fails R-1480 and names that file. All 3 of 3 went red.
- The 5 doctor FAILs in that clone also appear on the unmodified clone. They come from the temp clone's environment, not from this change.
- `norm()` is load-bearing. The SKILL.md phrase wraps across lines, and the plan's R-1483 test had no whitespace normalization.

Other checks:
- Lane class: ordinary is right. It changes rule, skill and ledger text only: no install/uninstall/doctor code, no hook, no extension, no gate, no land tool. It touches packages/nana-setup, so the seat runs install-check.mjs before land.
- Cross-platform: `\s+` normalization absorbs CRLF and wrapping. skills-and-standards is not on the win32 skip list.
- Conflicts: the amended lane no longer touches templates-render.test.mjs, which rulings-file and readme-check-cp1252 edit, or skill-claims. It shares skills-and-standards.test.mjs with win-skill-occupied, but in other hunks (that lane edits about line 58 and line 174 onward; this lane edits about line 98).
- Ordering: win-skill-occupied's frozen skill-copy-history.json must hold every requirements SKILL.md version shipped before its marker. No test enforces that. If this lane lands first and the recompute is forgotten, a Windows install can refuse its own skill copy. So this lane's land waits for win-skill-occupied; the build does not wait.
- pi 1.0.2 loader.js lines 481–484 and 529–530 confirm the "pi's loader requires one" claim.
- R-1480–R-1489 are unused on main and in every in-flight worktree.

Most likely wrong: that the owner wants wording only. If he wants the rule enforced, the cut default-export scan becomes its own lane.

Files the build touches:
- REQUIREMENTS.md
- templates/_shared/requirements-general.md
- packages/nana-setup/claude/rules/nana-standards.md
- packages/nana-pack/skills/requirements/SKILL.md
- packages/nana-setup/tests/skills-and-standards.test.mjs
- packages/nana-pack/tests/requirements-tree.test.mjs (leaf total +1)
- docs/requirements-tree.md (regenerated)
- the seat's docs/reviews/g005-carveout-2026-10-19/

Follow-up outside this lane: a trading-zone lane, approved by the user in place of work-project, runs copier update after CI cuts the tag. It copies the new G-005 cell into trading-zone's REQUIREMENTS.md:176. Until then its rail prints a non-failing drift line (R-583).
