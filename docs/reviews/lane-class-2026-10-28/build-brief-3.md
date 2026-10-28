Feature: FEAT-029 · Navigate code and investigate impact

Lane lane-class. Class: ordinary. Builder: pi-worker (small lane). Build session 3.

Build 2 finished the plan's must-meets at 9e5329cf and 8346dbf7. The seat checked them and found them sound. The seat then merged main at 602edced, which carries the planner-prompt lane: `packages/nana-pack/prompts/planner.md`, its tests in `packages/nana-pack/tests/planner-prompt.test.mjs`, and rows R-2950 to R-2956. This build makes three changes. The plan of record stays `docs/reviews/lane-class-2026-10-28/plan.md`.

Run the locked full suite as a plain foreground command with its output on screen, not redirected to a file and not in the background.

## 1. One source for the extension folders (the plan's choice C2)

`scripts/lane-class.mjs` reads the pi manifests for the import-hop entry points, but `CLASS_PATHS` in `packages/nana-pack/lib/lane-class-config.mjs` also lists the three extension folders by hand for the raw-prefix match. That is two sources for one fact: a folder added to a manifest gets hop entries but no prefix match. Take the extension folders for the prefix match from the same manifest read and drop the three hand entries. Keep the sealed-list pin naming its row. Extend the R-2961 check with a fixture whose manifest names an extra extension folder: a non-module file in it prints `hook`. No new row.

## 2. Planners take the class from the script

The plan said the second lane to land adds a sentence to the planner prompt. The seat changed that: the planner prompt is shared by every project, and `scripts/lane-class.mjs` exists only in nana-pi. The prompt already lists the project's own AGENTS.md section as a source. So the sentence goes in nana-pi's project section instead, replacing the line "In nana-pi, the lane class is what lane-class prints; a wrong call is fixed in its list." with:

"In nana-pi, the lane class is what `node scripts/lane-class.mjs` prints. A planner runs it with `--root . --files <planned files>` and puts its line in the plan; pi-worker prints it after each build. A wrong call is fixed in its list."

Row R-2969 pins that exact text with one check.

## 3. Four findings from the planner-prompt lane's final review

The reviewer said LAND and raised these as SHOULD. This lane fixes them, because it edits the planning instructions anyway.

- A plan that writes **Precedent** as a bold line, not a heading, gets its brief refused. A bold **Outside precedent** line under a `## Precedent` heading merges into Precedent and is refused too. In `planner.md`, say to write Precedent and Outside precedent as `##` headings at the same level. Pin that sentence in the R-2954 check, and add to that check a sample with a bold Outside precedent line under `## Precedent` that the brief parser refuses, so the check shows why the sentence is there.
- The R-2952 check would still pass if "without" became "with". Also pin "For new capability without an agreed reading" and "A fix that restores agreed behaviour plans straight away."
- The R-2950 check would still pass if the order meant the opposite. Also pin "Use these sources in this order when instructions conflict:".

No new rows for these; the existing rows keep their text.

## Done when

The same checks as build brief 1: R-2969 `implemented` with backticked `file::title` evidence, and the locked full suite (`npm run test:locked`), `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check and the known-bugs check are green.

Report: the sealed list as now written; the R-2969 and R-2954 test titles; the class the script prints for this lane's own diff against main; each departure from the Precedent below with its reason; every existing test you changed.

## Precedent

- `scripts/lane-class.mjs:35-42` (`extensionDirs`): the manifest read the prefix match now shares.
- `packages/nana-pack/lib/lane-class-config.mjs`: the sealed list this build trims.
- `packages/nana-pack/tests/lane-class.test.mjs`: the R-2961 check this build extends.
- `packages/nana-pack/tests/planner-prompt.test.mjs:23-73`: the R-2950, R-2952 and R-2954 checks this build tightens.
- `packages/nana-pack/lib/brief-precedent.mjs:30-62`: the brief parser whose heading rule the new prompt sentence states.
- `packages/nana-pack/tests/rulings.test.mjs:225-234`: the R-2663 exact-line pin, the form for the R-2969 pin.
