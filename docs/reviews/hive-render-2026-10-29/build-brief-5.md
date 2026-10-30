Feature: FEAT-039 · See the product and its decisions in one report

Lane hive-render. Class: ordinary. Builder: pi-worker (larger lane). Build session 5, on the tip of build 4.

Build 4 made the scene the page and gave each component its own form; keep it. The seat ran the visual judge, now on main (`npm run visual-reader`), on build 4 with the real audit data. Verdict "holds up", five of six spec lines pass. This build merges main, then finishes the model.

## 1. Merge main

The visual-check lane landed on main. Merge `origin/main` into this branch. Both lanes changed `scripts/first-look.mjs`, `scripts/first-look-config.mjs` and `packages/nana-pack/tests/first-look.test.mjs`; keep both behaviours: main's reference mode, `--hive` ready wait and canvas check, and this lane's hive capture. Main's `scripts/first-look-config.mjs` copies `HIVE_BACKGROUND = "#d7d9d5"` as a literal because the hive config was not on main; replace it with an import from `apps/hive/config.mjs`, and delete the matching known-bug line in `docs/known-bugs/FEAT-039.md`. Regenerate generated files (`npm run -s req:tree`, `node scripts/code-map.mjs --write`); merge known-bug files and session notes as a union.

## 2. Finish the model (spec line 2, failed)

The judge: "Stray black diagonal poles cut across the scene, and tiny specks float in mid-air. Several objects (compass, eyes, tool belt, notice board, lab) only make sense because of their labels." Fix:
- remove or ground every stray pole and floating speck; nothing hangs in the air unless it is a deliberate moving piece;
- make the compass, eyes, tool belt, notice board and lab read as what they are without labels, with more parts and finish in the injected-THREE builders.

## 3. The phone footer

At 380 px the footer line ("Data: nana-pi … 3dmk.com · Product report") is clipped and collides with the scene geometry. It fits on screen and reads cleanly over the scene.

## Show your work

With the real audit data, serve the page and run `npm run first-look -- --page url --after <url> --hive --reference /private/tmp/nana-3dmk-ref --spec docs/reviews/hive-render-2026-10-29/replicate-art-spec.md --out <folder outside git>`. Check the 380 shot shows `RENDERER: WEBGL`; a pixel-view capture is a capture flake, so capture again. Judge each spec line yourself against the reference frames, pass or fail with one reason, up to three rounds. Do not start model sessions; the seat runs the judge after the build. Never write into `/private/tmp/nana-3dmk-ref/`.

Run the locked full suite as a plain foreground command with its output on screen.

## Done when

The rows stay `implemented` with backticked `file::title` evidence. The locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs` are green, and the contract and fixture match their sealed sha256. Push and report the finished CI run for the new tip.

Report: the screenshot folder; the spec table; every row or test you changed; each departure from the Precedent.

## Precedent

- `apps/hive/assets/hive.mjs`: build 4's role-specific structure builders.
- `apps/hive/config.mjs`: the sealed `HIVE_BACKGROUND` to import.
- `apps/hive/index.html`: the overlay and phone footer.
- `scripts/first-look.mjs`: this branch's hive capture, to merge with main's.
