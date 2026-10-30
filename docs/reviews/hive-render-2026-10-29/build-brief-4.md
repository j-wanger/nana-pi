Feature: FEAT-039 · See the product and its decisions in one report

Lane hive-render. Class: ordinary. Builder: pi-worker (larger lane). Build session 4, on the tip of build 3.

Build 3 did the swap and draws all 23 real components; keep the swap, rows and tests as they are. The seat ran the new visual judge (visual-check lane, `scripts/visual-reader.mjs`, not yet on main) on the real-data page at 380 and 1280 px against the reference frames. Verdict "holds up", with one spec line failed, and the seat adds one more finding of its own.

## 1. The scene must be the page (spec line 1, failed)

The judge: "At 1280px the left rail is solid and no scene shows behind it. The model is a floating plate in the right two-thirds with empty grey around it. At 380px the scene is a band stacked between the header and the card." The reference runs the model edge to edge behind a translucent rail and card.
- Make the rail translucent (frosted) so the scene shows through it, as in the reference frames.
- Frame the overview camera so the model fills the viewport: no large empty floor plate around it, structures running under the rail and the card and off the edges.
- At 380 px the scene stays full-screen behind the header and the card, which floats over it, not below it.
- The card itself should read as frosted (the judge called it "a flat opaque panel").

## 2. Each component is its own kind of structure (seat finding)

At 23 components the structures are near-copies: the same tiered block in different sizes, told apart only by labels. In the reference each part is a distinct machine (tower, funnel, crane, cylinder core, globe, rack). Give each component a structure whose form says what it does, built from the existing injected-THREE builders: for example the queue as a conveyor or rack, the library as stacks, the review ladder as a stepped hall, the gates as gatehouses on the ring, the compass as a tall mast, the desk as an open floor of desks. A viewer who has read the chapter titles should be able to pick most components out without labels. Keep the statuses readable as now (unfinished frames, dark gap, empty foundations).

## Show your work

Capture as build 3 did, with the real audit data, at 380 and 1280 px. Put the shots beside build 3's and the reference frames and judge each spec line, pass or fail with one reason, up to three rounds. Never write into `/private/tmp/nana-3dmk-ref/`; save shots in a fresh temporary folder outside git.

Run the locked full suite as a plain foreground command with its output on screen.

## Done when

The rows stay `implemented` with backticked `file::title` evidence. The locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs` are green, and the contract and fixture match their sealed sha256. Push and report the finished CI run for the new tip.

Report: the screenshot folder; the spec table; every row or test you changed; each departure from the Precedent.

## Precedent

- `apps/hive/assets/hive.mjs`: the injected-THREE structure builders to extend.
- `apps/hive/layout.mjs`: build 3's placement of the 23 structures.
- `apps/hive/camera.mjs`: the overview framing and the focus function.
- `apps/hive/index.html`: the rail, card and phone layout.
