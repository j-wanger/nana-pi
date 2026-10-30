# Negative control verdicts (seat, before build 1)

Spec: `world-art-spec.md` at fb993d7c. Judge: `npm run visual-reader` on main 57167e92. Captures and judge outputs are outside git.

## Control 1: main's grid page at 57167e92, real audit data

1. PASS — At both widths the WebGL scene fills the viewport edge to edge. The heading, chapter control and card sit over it, and at 1280 px the scene shows blurred through the left rail.
2. PASS — The models are detailed and easy to identify: a domed rotunda, binoculars for Eyes, library racks, lab flasks, a desk frame and a notice board. Each has depth, light and soft shadows, though the scene is less dense than the reference city.
3. PASS — The palette is white and light grey forms with ink-black accents. There are no saturated colours.
4. PASS — Labels are monospace caps and the headline, body and note form a clear hierarchy. There are a few flaws: rail items 14–16 are hard to read over dark blurred shapes, the subtitle runs past the rail edge, and the "CABINET" label is clipped.
5. PASS — There is one frosted card with a short headline, two sentences and a note, plus one rail. There are no stacked data cards.
6. PASS — At 380 px the page keeps the full-bleed scene, the chapter dropdown and one card over the scene. It does not fall back to a column of cards.
7. FAIL — In the whole-system frame the structure labels are bare names (QUEUE, LIBRARY, DESK) with no 01–09 numbers. Only part of a curved road shows along the top, not a closed loop. Desk, Eyes, Notice Board and Lab stand in rough rows, and no short spur roads join side labels to their stages.
8. UNJUDGED — No attached frame shows a tour chapter with one structure framed.
9. UNJUDGED — No attached frame shows explore mode on a phone with an outlined structure, darker roads, or the Enter and Back to tour buttons.
Verdict: holds up

## Control 2: all 68 roads, the revision-1 spring layout (adversary's simulation render, 216 crossings, stages numbered 01 to 09)

1. FAIL. This is not a 3D scene. It's a flat 2D node graph of shadowed squares on a grey field. Apart from a tiny header, no text sits over it.
2. FAIL. There is no modelled depth or light, only drop-shadowed squares. Every structure is the same box, so a viewer can't tell a "Library" from a "Land Gate". The reference has distinct, detailed buildings.
3. PASS. The palette is white and light-grey forms with ink-black loop roads and mid-grey links. There is no saturated colour.
4. FAIL. The monospace caps labels are deliberate, but they collide. "REQUIREMENT CONTRACT" overprints "CODE MAP", "COMMAND GATE" overprints "REQUIREMENT CONTRACT" at 380 px, and roads cut through "03 QUEUE" and "05 EYES". Apart from bold numbered stages, there is little hierarchy.
5. FAIL. There is no frosted card or rail at all, just a one-line header.
6. PASS. At 380 px the page keeps the same graph shape instead of a column of cards. It is cramped and the labels overlap badly.
7. FAIL. Stages 01 to 09 do sit in order on one thick closed loop. But dozens of roads cross the inside of the loop, a dense tangle in both frames. Side structures like Setup, Command Gate, Tool Belt and Code Map sit inside the loop with many links each, not one short road to a stage. Desk, Stage and Identity Scan hang off long roads far from any stage.
8. UNJUDGED. No tour frame with a centred structure and chapter card is attached.
9. UNJUDGED. No explore-state phone frame with an outlined structure, darker roads and an Enter / Back to tour card is attached. The 380 px frame shows the whole loop but no selection or card.

Verdict: reads as a demo against the reference

Line 7 failed on both captures, so the spec stands as written.
