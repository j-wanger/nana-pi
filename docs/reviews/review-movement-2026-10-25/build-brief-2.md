Feature: FEAT-007 · Review a specific revision independently. Lane review-movement. Class: hook. Builder: pi-worker (larger lane). Build session 2.

Work in the lane worktree on feat/review-movement. Session 1 built the whole lane and stopped BLOCKED with its work uncommitted in this worktree: the rows, tests and seal pass, the tree checker prints `deliverables: 21 of 21 made and read by code, 21 parked`, and every hand red case failed as it should. The full suite failed only `templates-render.test.mjs`, four checks, because build brief 1 required a bare `scripts/requirements-moved.mjs` path in the requirements skill, and R-598 needs every skill path to resolve in a generated project. That was the seat's error, and session 1 was right to stop rather than change the checker. Keep all of session 1's work; this session fixes the skill sentence, moves one evidence file, and commits. Do not edit the product page code (`scripts/product-report.mjs`, `docs/product-report/`), HANDOFF.md, `docs/sessions/`, `docs/known-bugs/`, the review standard, nana-land, review-ledger, review-round, review-timeline, `templates/`, `packages/nana-setup/`, any checker, or any review-folder file other than the one this brief names.

Precedent:
- packages/nana-pack/skills/requirements/SKILL.md:140 — the neighbouring sentences name nana-pi's scripts in the home-qualified form `node "$HOME/nana-pi/scripts/<script>.mjs" --root .`, which R-598's scaffold check accepts.
- packages/nana-pack/tests/templates-render.test.mjs — the four failed checks: "all declared skill claims resolve independently for requirements" and "all declared skill paths resolve independently", for the typescript and python scaffolds.

No private helper moves to a shared module in this session.

The task:
1. In `packages/nana-pack/skills/requirements/SKILL.md`, replace session 1's sentence about the tree movement with this text, exactly: "A lane brief names its feature as `Feature: FEAT-nnn · <label>`. pi-review and claude-review add the tree movement to every reviewer's prompt, as `node "$HOME/nana-pi/scripts/requirements-moved.mjs" --root . --base main` prints it, and the reviewer reads every feature it names. The seat's land report points the owner to the movement, in the review folder or the brief, instead of pasting it."
2. Leave `AGENTS.md`'s sentence as session 1 wrote it; AGENTS.md's nana-pi section is not copied into scaffolds.
3. Move `docs/review-movement-checks.md` to `docs/reviews/review-movement-2026-10-25/build-1-checks.md` with `git mv` after adding it, or plain `mv` before adding; nothing stays at the old path. That file is the one review-folder file this session may create.

Checks before your one commit: `npm test -- packages/nana-pack/tests/templates-render.test.mjs`; then `npm run test:locked` whole, with its output kept out of the worktree; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`, which must print `deliverables: 21 of 21 made and read by code, 21 parked`; `node scripts/known-bugs.mjs --root .`; then `git status --short` must print nothing after the commit. Do not run the install check. Do not push.

Seat check: `node docs/reviews/review-movement-2026-10-25/seat-titles.mjs all` must print `0 missing`.

Commit once, with explicit paths (`git add <path> ...`, never `git add -A` or `.`), covering session 1's files and this session's changes: every file `git status --short` lists.

Done: the skill sentence resolves in both scaffolds; templates-render passes; the full suite is green; the evidence file sits in the review folder; the checks are green; `git status --short` is empty; and the work is committed.

Report (at most 10 lines after the VERDICT line): the commit sha; `git show --stat HEAD`'s summary line; the templates-render result; the full suite's summary line; the tree checker's deliverables line; map, readme, trace, tree, known-bugs and seat-check status; any departure.
