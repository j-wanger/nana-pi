# blast-radius — plan attack (one adversary)

Verdict: AMEND

AMEND. The design is right. It is the code-drawn picture the owner approved once the map fix landed, and the class is ordinary. Every must-meet test is red today because the script does not exist. I ran a prototype of the model over the plan's fixture in a temp clone of main, with a temp HOME. Its columns, edges and no-linked-test set are as the plan derived them. Diffing against <rev> instead of the merge base turns far and lonely into changed modules, so R-1553 is discriminating.

Defects found by probe:
1. The brief says no existing test edits. That is wrong. Adding eight rows breaks R-291's pinned leaf total in packages/nana-pack/tests/requirements-tree.test.mjs: 1,257 on main now that bench-win has landed. Every in-flight lane edits that same line.
2. The plan copies requirements-moved's CLI guard, which compares resolve(argv[1]) without realpath. Probe: running requirements-moved through a symlinked temp path (macOS /var is a symlink) printed nothing and exited 0. Copied, blast-radius would exit 0 and write no page. Use the code-map shim's realpathSync guard instead. requirements-moved's own guard is a residual for the seat to record in HANDOFF; it is out of scope here.
3. R-1553 said untracked files are included, but the design uses --exclude-standard, so the row was wider than the code. Probe: the map collects a git-ignored module under a root, because collectModules ignores .gitignore. Dropping --exclude-standard moves that module from upstream to changed. Row reworded, fixture gains src/gen.mjs, and a wrong-code pair is added.
4. R-1555's test asserts "only such a module" but the row did not say so. Reworded to the exactly form.

Smaller brief fixes:
- Reuse requirements-moved's exported defaultGit, not a second 64 MiB buffer constant.
- Pass git --no-optional-locks so a read never writes the index.
- Sort lists by code-unit order, never localeCompare, which depends on locale.
- R-1551's test checks rect x order, not only data-column.
- Same-column and leftward edges arc through the gutter.
- The unmapped list heading says deleted, map-ignored or outside the roots, since src/gone shows there.
- R-1556 checks the root in both separator spellings.
- The builder cannot open a browser, so the seat opens the page. Because the page carries no HEAD hash, a stale committed page looks current. The seat therefore reruns the command on the final tip and requires git diff --exit-code on the page.

Measured on the eight in-flight lane branches: 9 to 70 nodes and 14 to 189 edges; the largest is rulings-file with 27 tests in one column. The no-linked-test label fires on scripts/test.mjs and test-locked.mjs, which tests start only as processes; this is the known limit, and the label's caveat covers it.

Conflicts: no in-flight lane touches scripts/code-map.mjs or the new files. README hunks in parallel-runner, report-test-details and rulings-file sit at lines 11, 171, 248 and 264, against this lane's line 68. Shared regenerated files (docs/code-map.md, REQUIREMENTS.md, docs/requirements-tree.md and the R-291 leaf-total line) collide with every lane. Whichever lands second merges main, reruns npm run map and npm run req:tree, and re-adds its rows to the leaf total.

Claim most likely wrong: that a 70-node, 189-edge page with no layout library is readable enough to verify anything. If it is not, the column lists, counts and no-linked-test labels still carry the verification value, and a later lane can add a collapsed view.
