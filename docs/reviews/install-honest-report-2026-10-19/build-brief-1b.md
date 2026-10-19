# install-honest-report: build brief 1b — finish build 1

**Builder:** the larger-lane builder (pi sol) in `~/nana-pi-wt/install-honest-report`, branch `feat/install-honest-report`. **Class:** install. Rules: the builder preamble; single test files only, never the full suite; no push; no `HANDOFF.md` or `docs/sessions/` edits.

Build 1 (brief `build-brief-1.md` in this folder, with `must-meet.md` and `plan-attack.md`) was cut off by the launcher's stall watchdog before it committed. Its uncommitted changes are still in the worktree: `REQUIREMENTS.md`, `docs/code-map.md`, `docs/requirements-tree.md`, `packages/nana-pack/tests/requirements-tree.test.mjs`, `packages/nana-setup/README.md`, `packages/nana-setup/lib/steps.mjs`, and three tests under `packages/nana-setup/tests/` (`install`, `retired-artifacts`, `settings-merge`).

**Do.** Read `build-brief-1.md` and `must-meet.md` first. Then read `git diff` and judge each change against them: keep what is right, fix what is not, and finish what is missing. Show each must-meet check red on the code before the change (for example with `git stash` on the product file only, or a temp copy) and green after. Run each touched test file alone, `node scripts/requirements-trace.mjs` (exit 0; each `// req:` marker sits directly above a `check("title", …` call with the title on that line), `npm test -- packages/nana-pack/tests/test-runner.test.mjs`, `npm run map:check` and `npm run readme:check`. Then commit with explicit paths.

**Report** in the shape `build-brief-1.md` asks for, VERDICT first.
