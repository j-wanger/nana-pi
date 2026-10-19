# blast-radius — build brief
Feature: FEAT-029 · Navigate code and investigate impact
Lane blast-radius · worktree ~/nana-pi-wt/blast-radius · branch feat/blast-radius · class ordinary · rows R-1550 to R-1557 only.
Plan of record: docs/reviews/blast-radius-2026-10-19/must-meet.md. Commit it first, unchanged.

## Change
1. REQUIREMENTS.md: add R-1550 to R-1557 to FEAT-029's table as `planned`, text exactly as must-meet.md. In packages/nana-pack/tests/requirements-tree.test.mjs, raise R-291's leaf total by eight in the title, value and message (1,257 to 1,265 on today's main). Run `npm run req:tree`.
2. packages/nana-pack/lib/blast-radius-config.mjs: six-tag header, named exports. Contract values name their row: column ids and order, data-attribute names, no-linked-test label. Chosen values give their reason: node size and gaps, char-width estimate, font size, light and dark colours.
3. scripts/code-map.mjs: add `isLayerExempt` and `untracedTests` to the re-export. Nothing else.
4. scripts/blast-radius.mjs: six-tag header.
   - Exports `main(argv, git)`, `blastModel(graph, changedPaths)` (pure) and `renderPage(model, meta)`. Default git is requirements-moved's exported `defaultGit`, imported by name. Add no second buffer constant.
   - CLI guard: the code-map shim's realpathSync form. requirements-moved's resolve-only guard silently does nothing through a symlinked path (probed).
   - Git: `--no-optional-locks` first, cwd the root, no shell, `-z`. Changed = `diff --name-only --no-renames --relative <mb>` plus `ls-files --others --exclude-standard`.
   - Sort every list by code-unit order (`<`), never localeCompare. Integer coordinates only. Escape every path for HTML. Create the out file's folder. Print one stdout line with the counts and the out path.
   - Errors: a usage error exits 2. An unresolvable rev or no merge base exits 1, names the cause and writes nothing.
   - Page: each node is `<g class="node" data-path data-column>` holding `<rect x y>` and a `<text>` equal to the path. Each edge is `<path class="edge" data-from data-to>`, a curve from the importer's right side to the imported's left side. A same-column or leftward edge arcs through the gutter. Each unmapped file is `<li data-unmapped>` under a heading that says deleted, map-ignored or outside the roots. A no-linked-test node carries the config attribute and the visible label. The header shows the base name and merge-base hash, with no HEAD hash and no date. The caption gives untracedTests in --impact's wording. Inline style, with dark mode under prefers-color-scheme.
5. packages/nana-pack/tests/blast-radius.test.mjs: six-tag header and exactly the eight must-meet tests.
   - Use the titles exactly, with `// req:` directly above each check. Import attribute names, column ids and the label from the config. Only R-1551 pins the column order literally.
   - Fixture git repo under the OS temp dir, using requirements-moved.test.mjs's tmpDir, `-c core.autocrlf=false` and GIT_* scrubbed.
   - Import the script statically so the map links it. Call `main` in-process, with an injected git runner that scrubs GIT_*, for every test but R-1556.
   - R-1556 spawns the CLI on two fs.cpSync copies in folders of different path lengths. Assert byte-identical pages, neither root present in native or forward-slash spelling, and no date or time.
   - R-1551 also asserts every rect x in a column exceeds every rect x in the column to its left.
   - Hard-code the expected sets. Never compute them with impact().
   - Fixture, changed: src/a (committed), src/b (uncommitted edit), src/new (untracked, imports a), src/c (cycle with n2), src/spawned (tests/sp.test only starts it as a process), tests/h.test (committed).
   - Fixture, chains: a→m→b, u→a, top→u, tests/helper→u, h.test→helper, a.test→a, a→d→d2, b→d2. src/gen imports a and is listed in .gitignore.
   - Fixture, negatives: far→d2, tests/d2.test→d2, lonely. main edits far and lonely after the branch point. The lane deletes src/gone and edits src/vendor/v (map-ignored, tracked), tools/x.mjs (outside the roots), README.md and docs/p.html.
   - Expected: tests = a.test, helper. upstream = gen, m, n2, top, u. downstream = d, d2. no-link = c, new, spawned. unmapped = gone, vendor/v, tools/x.
6. README.md: after the requirements-moved line, add one sentence. It names `node "$HOME/nana-pi/scripts/blast-radius.mjs" --root <dir> --base <rev> --out <page>` and says what the page draws.
7. Run `npm run map`. Run `node scripts/blast-radius.mjs --root . --base main --out docs/reviews/blast-radius-2026-10-19/blast-radius.html`, then commit the page.

## Wrong code to try first (each turns its own test red)
R-1550: direct callers only. R-1551: callee beats caller (m, n2, u, helper fall downstream), or columns out of x order. R-1552: drop same-column edges, or add an edge to an undrawn module. R-1553: diff against `<rev>`; drop untracked files; drop `--exclude-standard`. R-1554: also list README.md and docs/p.html. R-1555: label changed test modules too, or count a non-test caller as a test. R-1556: put the root path in `<title>`. R-1557: add a Google Fonts `<link>`.

## Done
- Each of the eight tests was seen red against its wrong code, then passes. Rows R-1550 to R-1557 are `implemented` with citations.
- These single files pass: blast-radius, code-map, requirements-trace, requirements-tree, requirements-moved and readme-check tests. `npm run map:check` and `npm run readme:check` are green. Run single files only; the seat runs `npm run test:locked`.
- The output of `node scripts/requirements-moved.mjs --root . --base main` goes in the report.
- Seat: open the page in a browser. Rerun step 7 on the final tip and require `git diff --exit-code` on the page. Record requirements-moved's symlink guard as a HANDOFF residual.

## Report shape (10 lines or fewer)
VERDICT · commits · rows and titles · wrong-code pairs (row, wrong code, red check) · single-file runs and exit codes · map:check and readme:check lines · the lane page's stdout line · requirements-moved output · edits to existing tests (R-291 leaf total only) · what was not done.