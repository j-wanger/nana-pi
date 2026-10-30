Feature: FEAT-039 · See the product and its decisions in one report

Lane world-graph. Class: ordinary. Builder: pi-worker (larger lane). Build session 1.

Build to the plan of record, `docs/reviews/world-graph-2026-10-30/plan.md` (revision 2), which has taken the adversary's attack in `plan-attack.md`. Build rows R-3170 to R-3176 and the changes to R-3120 (retired), R-3126, R-3127, R-3129, R-3130, R-3131 and R-3139 exactly as its must-meet section says. The owner's questions are optional issue 272; build on the plan's defaults (the loop as mapped, about 30 overview roads with imports and shared features on selection, bounded pinch zoom with tap-select and Enter-only camera moves).

Why this lane exists: the owner rejected the landed page's shape on 2026-10-30, "just 9 boxes next to each other in a 3 x 3 grid, with no flow/process designed", and said exploration "is very easy to misclick and zoom into a building especially on mobile". The art spec is `world-art-spec.md` in the lane folder; its line 7 already failed on main's grid page and on an all-roads frame (`control-verdicts.md`), so it is the bar.

## Show your work

After the suite is green, serve the page as the plan's visual acceptance step 2 says and run first-look on its six URLs with `--hive --reference /private/tmp/nana-3dmk-ref --spec docs/reviews/world-graph-2026-10-30/world-art-spec.md --out <folder outside git>`. Check each 380 shot shows `RENDERER: WEBGL`; a pixel-view capture is a flake, so capture again. Judge each spec line yourself against the frames, pass or fail with one reason, up to three rounds. Build `scripts/hive-gesture-check.mjs` as the plan says and run it at 380 px; write its output to the lane folder as `gesture-check.txt`. Do not start model sessions; the seat runs the visual judge after the build and shows the owner the frames before build 2. Never write into `/private/tmp/nana-3dmk-ref/`.

Run the locked full suite as a plain foreground command with its output on screen.

## Done when

Every new and changed row is `implemented` (R-3120 `retired`) with backticked `file::title` evidence, and the v1 contract and fixture are byte-identical. The locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs` are green. Push and report the finished CI run for the new tip, naming the Windows suite leg.

Report: the screenshot folder; the spec table; the gesture check result; the built counts (edges per source in their units, overview roads, crossings on the base graph); every row and test changed; each departure from the Precedent.

## Precedent

- `apps/hive/layout.mjs`: the deterministic geometry module the spring layout replaces.
- `scripts/component-audit.mjs`: the CLI shape, injected runners and `--out` writer for `scripts/component-graph.mjs`.
- `scripts/deliverables.mjs`: the artifact, reads and read-by parsers.
- `scripts/hive-page.mjs`: the publisher that gains `--graph`.
- `apps/hive/camera.mjs`: the focus function the tour and Enter use.
- `apps/hive/main.mjs`: the page entry and today's pointer binding.
