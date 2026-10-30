Feature: FEAT-039 · See the product and its decisions in one report

Lane hive-render. Class: ordinary. Builder: pi-worker (larger lane). Build session 2, on the tip of build 1.

The plan of record is still `docs/reviews/hive-render-2026-10-29/plan.md`. Build 1 built the plumbing well: the frozen contract and fixture, the pixel fallback, the rail, the `#<id>` cards, the ready mark, the phone layout. Keep all of it. The picture failed: the owner called it "ai slop". The seat compared it with the reference: five small hex tiles in a dark box filling about 40% of one panel, a document page with a long column of data-dump cards beside it, flat orange and green tiles, no lighting idea.

## The owner's decision: replicate first

On 2026-10-29 the owner chose to replicate the reference's look and structure first, with nana-pi's own components, and to add the hive theme later in a separate reskin lane. The reference is https://3dmk.com/. The seat's screenshots of it are a record to follow, not a module, and are never committed: `/private/tmp/nana-3dmk-ref/3dmk-opening.png`, `3dmk-seele-commentary.png`, `3dmk-scrolls-technical.png`, `3dmk-intro-commentary.png`, `3dmk-everything-eli5.png`, with the site text in `3dmk-text.txt` beside them. Copy no code, models or assets from the site; build our own geometry and text. The page footer keeps its link crediting the study.

## The target

Build to `docs/reviews/hive-render-2026-10-29/replicate-art-spec.md`, line by line. In concrete terms, against the reference frames:
1. **The scene is the page.** The WebGL canvas fills the whole viewport behind everything. No document column; no boxed canvas.
2. **A detailed monochrome model.** Each component is a building-scale structure of its own, white and light grey forms with ink-black accents, lit with soft shadow and depth: governance homes a ring or wall around the workflow structures, each structure made of many parts (floors, frames, towers, platforms, connecting walkways), so a viewer can tell what each object is. Dense, not five tiles. Gaps read as unfinished or dark structures; absent parts as empty foundations. Small labelled leader lines name structures, as the reference does.
3. **The overlay.** Top left: the page title and the three voice tabs (plain, technical, from the work). Left rail: numbered chapters, `01:WORKSHOP` style, one per component in order, the current one marked. One frosted card floats over the scene for the chosen component, with that component's text in the chosen voice: a short plain line, the technical parts and status, and from the work its gap note and ask. Short and readable; no raw path walls in the default voice.
4. **The camera flies** to the chosen chapter's structure (the existing focus function), slowly, with a gentle drift at rest; `?still` and reduced motion hold it.
5. **At 380 px** the same designed object: the scene stays behind, the rail collapses to a chapter picker, the card fits the screen.

Keep reduced-motion, the ready mark, the pixel fallback (it may stay simple) and every existing row passing. Change rows only where a pinned value must change, and say which.

## Show your work

After the suite is green, serve the page and capture it at 380 and 1280 px with motion off, as in build 1. Then put each shot beside the reference frames and judge each spec line yourself: pass or fail, with one reason. Report that table. If a line fails, fix it and capture again before you report; stop after three rounds and report what still fails.

Run the locked full suite as a plain foreground command with its output on screen.

## Done when

The rows stay `implemented` with backticked `file::title` evidence. The locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs` are green, and the contract and fixture match their sealed sha256.

Report: the screenshot folder; the spec table; every row or test you changed; each departure from the Precedent.

## Precedent

- `apps/hive/main.mjs`: build 1's page entry, camera wiring and rail.
- `apps/hive/assets/hive.mjs`: build 1's injected-THREE asset builders, the pattern for new structure builders.
- `apps/hive/camera.mjs`: the focus function.
- `apps/hive/text-layer.mjs`: build 1's cards and voices.
