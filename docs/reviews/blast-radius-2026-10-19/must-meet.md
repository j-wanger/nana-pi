# blast-radius — must-meet

Feature: FEAT-029 · Navigate code and investigate impact
Class: ordinary. The lane adds a repo script, its config module and its test, and adds two names to the code-map shim's re-export. It touches no install, hook, gate, land or review tool.
Threat model: honest variation is in scope. That covers git output on macOS, Linux and Windows; uncommitted, untracked and git-ignored files; a module that is both caller and callee; an import cycle; a deleted or map-ignored module; two folders holding one checkout; and a command path that runs through a symlink. Deliberate forgery, such as a hand-edited page or a doctored map, is out.

Feature sentence: `node scripts/blast-radius.mjs --root <dir> --base <rev> --out <page>` writes one self-contained HTML page. Its SVG draws, from the code map alone, every module changed since the merge base of `<rev>` and HEAD, their transitive callers and callees, and the tests that import them. The same checkout content gives the same bytes.

## Design
- Format: one HTML page with one inline SVG and no script. The owner opens it in any browser with no tool. The code draws the layout, so the bytes diff cleanly. Mermaid was rejected because its renderer lays out the picture, and a local review folder has no renderer. A model reviewer reads the same facts from the data attributes on each node and edge.
- Changed set: run `git merge-base <rev> HEAD`. Then take `git diff -z --name-only --no-renames --relative <mb>` (working tree against the merge base) plus `git ls-files -z --others --exclude-standard`. Every git call runs with `--no-optional-locks`. The map walks the working tree too, so both sides agree.
- Graph: `loadConfig`, `collectModules`, `buildGraph`, `impact`, `isLayerExempt` and `untracedTests`, all through the `scripts/code-map.mjs` shim. The command reads nothing else and infers no node or edge.
- Columns, left to right: tests, upstream, changed, downstream. The changed column wins first. A caller beats a callee after that. A caller under a test root goes to tests.
- Edges: every map import between two drawn nodes, drawn from importer to imported, and no other edge. A same-column or leftward edge arcs through the gutter.
- The page also carries: the base name and the merge-base hash; counts per column; the changed module-extension files the map does not hold (deleted, map-ignored or outside its roots); the map's untraced-test sentence; and a legend. It carries no HEAD hash or date. So the committed page is checked by rerunning the command and diffing.
- Layout: each column has a fixed x, nodes are sorted by path in code-unit order, coordinates are integers, and each column's width comes from its longest label. Tunables live in `packages/nana-pack/lib/blast-radius-config.mjs` with their provenance. The git runner is requirements-moved's exported `defaultGit`.
- The command stands alone. Wiring it into nana-land would make this a land-tool lane and put a drawing failure on the land path. A later ordinary lane can name it in AGENTS.md's land checklist after rulings-file lands.

## Must-meet (tests in packages/nana-pack/tests/blast-radius.test.mjs)
| Row | Requirement | Test title |
|---|---|---|
| R-1550 | WHEN `scripts/blast-radius.mjs` runs with `--root <dir>`, `--base <rev>` and `--out <file>`, the blast-radius command shall write to `<file>` an HTML page whose SVG draws exactly one node for each changed module in the code map and for each of their transitive callers and transitive callees in the map, and no other node. | R-1550: the page draws one node for each changed mapped module and each transitive caller and callee, and no other module |
| R-1551 | The blast-radius page shall place each node in one of four columns, left to right tests, upstream, changed and downstream, putting every changed module in changed, every other transitive caller under a test root of the map in tests, every other transitive caller in upstream, and every remaining node in downstream. | R-1551: nodes sit in four columns, tests, upstream, changed, downstream, left to right, with changed first and a caller never downstream |
| R-1552 | The blast-radius page shall draw, from the importing node to the imported node, one edge for each code-map import between two drawn nodes and no other edge. | R-1552: the drawn edges are exactly the map's imports between drawn nodes, importer to imported |
| R-1553 | The blast-radius command shall treat as changed each file git tracks at the merge base of `<rev>` and HEAD or in the index whose working-tree content or absence differs from that merge base, and each untracked file git does not ignore, so that neither a change `<rev>` gained after that merge base nor a git-ignored file counts as changed. | R-1553: changed means differing from the merge base in the working tree, uncommitted and untracked included, base-only changes and git-ignored files excluded |
| R-1554 | The blast-radius page shall list as changed outside the map exactly the changed files that carry one of the map's module extensions and are not mapped modules. | R-1554: the page lists exactly the changed module-extension files the map does not hold |
| R-1555 | The blast-radius page shall label as having no linked test exactly those changed modules outside every test root of the map that no module under a test root transitively imports, saying on the label that a test which only starts a module as a process is not linked. | R-1555: exactly the changed modules outside the test roots that no test imports carry the no-linked-test label |
| R-1556 | The blast-radius command shall write the same bytes from the same checkout content in any folder, with no date, time or absolute path in the page. | R-1556: two copies of one checkout in different folders give byte-identical pages with no folder path and no date |
| R-1557 | The blast-radius page shall carry no script and reference no stylesheet, font, image or other file outside itself. | R-1557: the page carries no script and references no file outside itself |
R-1558 and R-1559 stay unused.

## Red today (probes 2026-10-19, temp clone of main, temp HOME)
- All eight fail today because `scripts/blast-radius.mjs` does not exist.
- A prototype over the fixture below gave: changed a, b, c, new, spawned, h.test; tests a.test, helper; upstream gen, m, n2, top, u; downstream d, d2; no-linked-test c, new, spawned. Four nodes (m, n2, u, helper) are both callers and callees, so the precedence rule is exercised.
- Diffing against `<rev>` instead of the merge base adds far and lonely to changed. Dropping `--exclude-standard` moves the git-ignored gen from upstream to changed.
- Radii of the eight in-flight lane branches: 9 to 70 nodes, 14 to 189 edges, labels up to 57 characters.
- requirements-moved's resolve-only CLI guard, run through a symlinked temp path, printed nothing and exited 0. This command uses the shim's realpath guard instead.

## Known limits
- The map links imports only. A test that only starts a module as a process, or builds its import path from a template string, is not linked. Today 12 of 164 test modules import no mapped module. scripts/test.mjs and requirements-moved show no linked test although tests run them. The label and the untraced-test sentence say so.
- No measured runtime data from map:measure. It is per machine and would break R-1556.
- Not shipped in the templates. Reads only the TypeScript generator's map.
- The page names the merge base, not the tip. Merging main into the lane changes it, and a stale committed page is caught only by rerunning and diffing.
- Large radii give a tall page with crossing edges. There is no layout library and no edge routing.
- Refusal paths are not pinned: a usage error exits 2, and a bad rev exits 1 and writes nothing. A map with header problems still draws.
- Spurious edges from text in strings and comments carry over from the map's regex reader (open questions 10 to 12).