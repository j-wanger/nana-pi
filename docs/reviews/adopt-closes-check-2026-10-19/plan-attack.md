# adopt-closes-check — plan attack (one adversary)

Verdict: AMEND

AMEND. I kept the adopt-close half, split the tree-checker half into its own lane, and fixed the Windows gap and a missing owner-consent pin.

1. The plan held two features, and its feature sentence was two sentences. The `--root` "Not yet sorted" status line belongs to FEAT-028, where the tree-checker rows R-1157/R-1159/R-1165/R-1172 live. The plan homed it in SUB-021 instead. The adopt closing step never runs the tree checker, so the two halves share no user moment. On a carve-out flat ledger, `--root` exits 1 with the no-tree problem, so the close cannot run it either. That half also pulled the lane into scripts/requirements-tree.mjs and scripts/requirements-lift.mjs, where silent-main-guard (same slate) works. It also needed a contract constant moved. Both halves still get built: the seat slates the status line as its own FEAT-028 lane, and the plan's design and fixtures carry over unchanged. R-1671 and R-1672 are left unused.

2. Windows: install skips the `nana-setup` PATH link on win32 (packages/nana-setup/lib/steps.mjs:748). So the plan's bare closing command fails there today, and the plan's own "most likely wrong" depended on win-path-commands. The step now also gives the node form from the checkout, `node "$HOME/nana-pi/packages/nana-setup/bin/nana-setup.mjs" project <dir> --check`. This follows the AGENTS.md precedent for pi-worker and pi-review. waitFor is none.

3. Owner's yes: the step tells an agent to run the repairs the check names, and one of them records project trust. The plan's row and test never pinned "only with the owner's yes". It is now in the row and in the test.

4. The plan's row was wider than its test: it asserted only "✗" and "exits 0" while the row promised ✗ and ! lines. The test now asserts "ready only when it exits 0" and "every ✗ and ! line". The step finder also normalizes CRLF line endings first.

5. The pack README's two adopt rows now say each skill closes on the check, so the change is stated where users read it.

Probes, run in a temp clone with a temp home; the real repo and home were not touched:
- The new check FAILS on main's skills: all three miss all five parts.
- With the brief's text, it passes. Results: entry-guidance 14 PASS; skill-claims "all passed" (claims 112, versus 111 on main); project.test.mjs 121 PASS; templates-render 168 PASS in 74 s.
- Trace: 0 rows off form, 1286 total with the row. Tree `--check` exits 0. map:check exits 0 after `npm run map`, which the @purpose change needs. readme:check: 0 problems, including the pack README edit.
- The only red is the R-291 typed total, as expected.
- Four wrong-code variants each turned R-1670 red: the step placed before the commit, adopt-structure left on a plain Report, the owner's-yes sentence dropped, and the node form dropped.
- A fresh Python adoption rendered from the clone: `project --check` exits 1, with ✗ for the month log and ! for trust.

Class: ordinary. The change is skill text, a README table and one test. The adopt skills reach pi through the pack's package.json `pi.skills` registration. They are not in CLAUDE_SKILLS, so no install step is involved.

Files the build touches:
- <repo>/packages/nana-pack/skills/adopt-py/SKILL.md
- <repo>/packages/nana-pack/skills/adopt-ts/SKILL.md
- <repo>/packages/nana-pack/skills/adopt-structure/SKILL.md
- <repo>/packages/nana-pack/README.md
- <repo>/packages/nana-setup/tests/entry-guidance.test.mjs
- <repo>/REQUIREMENTS.md
- <repo>/docs/requirements-tree.md
- <repo>/docs/code-map.md
- <repo>/packages/nana-pack/tests/requirements-tree.test.mjs (only the R-291 total, and only if leaf-total-drop has not landed)

Conflicts, none blocking:
- leaf-total-drop is building and removes the R-291 literal. If it lands first, this lane leaves that file alone; otherwise expect a one-line conflict.
- Every in-flight lane edits docs/requirements-tree.md and docs/code-map.md; regenerate them after merging main.
- The pack README hunks in parallel-runner, review-timeline and win-gate-tmp sit near lines 193–245, far from rows 21–22.
- No worktree touches the adopt skills, entry-guidance.test.mjs or SUB-021. bom-pack-config, install-honest-report and win-path-commands share no file with this lane. Neither does silent-main-guard after the split.
- clean-revision landed while I worked (main a1ea491), so the total moved again. The brief therefore says to read the total from the trace, not a fixed number; the plan's "1,288" is stale.

The claim most likely to be wrong: that the node form runs as written in a Windows pi session. That assumes the checkout sits at $HOME/nana-pi and that Git Bash or PowerShell expands "$HOME" inside double quotes. Nobody ran it on Windows. The text tests pin only the wording.
