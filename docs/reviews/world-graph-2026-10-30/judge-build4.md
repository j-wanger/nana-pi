# Seat visual judge on build 4 (c85d8e05), real audit data

## x_.log

visual-reader: fail; 2 FAIL, 0 unanswered, 0 unknown; verdict holds up
unjudged: 8, 9
1. FAIL — At 1280px the left rail is an opaque panel that cuts the scene off: SETUP is clipped at the rail's edge, and the grid doesn't continue behind it. The scene sits beside the rail instead of filling the viewport. At 380px a solid header block sits above the scene.
2. PASS — The objects are modelled with shading and cast shadows, and you can tell what they are: compass, shelves, binoculars, wireframe globe, ladder, desk. They are small and much less dense than the reference city, but they read clearly.
3. PASS — White and light grey forms with black accents (library stacks, LAB, STAGE). There are no saturated colours.
4. PASS — Monospace uppercase labels with leader lines, a numbered chapter rail and a clear serif-free headline hierarchy. One flaw: at 380px the DEPOT: KEYS and DEPOT: NIGHT labels overlap and collide.
5. PASS — There is one short card ("From idea to next idea.") over the scene, plus the chapter rail. The card looks solid rather than frosted, which is a minor gap against the reference.
6. PASS — At 380px it is still one scene with one overlaid card and a compact header, not a column of cards. The labels at the bottom crowd and the card hides part of the loop.
7. FAIL — Stages 01 to 09 do run in order around one closed oval road, nothing sits in rows and columns, and few roads cross inside the loop. But DEPOT: STAGE, DEPOT: NIGHT and DEPOT: KEYS are reached by long chained roads off 05 and LAB. They are not beside a numbered stage on a short road.
8. UNJUDGED — Both page frames show chapter 00, the whole system. No tour frame was attached.
9. UNJUDGED — No phone frame of explore mode (outlined structure, Enter and Back to tour buttons) was attached.

Verdict: holds up

## x_drafting_table_.log

visual-reader: fail; 1 FAIL, 0 unanswered, 0 unknown; verdict reads as a demo against the reference
unjudged: 7, 9
visual-reader: the page reads as a demo against the reference
1. PASS — At both widths the WebGL scene fills the viewport. The left rail at 1280 px and the bottom card at 380 px sit over the scene, and you can see shadows through the rail, just as in the reference.
2. FAIL — There is light, shadow and depth, and the drafting table and compass are easy to read. But the forms are thin primitives on large flat discs. "Contract" is just upright slabs, and "Library" is a black block grid. Next to the dense trusses, towers and roads in the reference, the model lacks detail and some objects can't be identified.
3. PASS — White and light grey forms with black roads, legs and accents. There is no saturated colour.
4. PASS — Monospace uppercase labels in a clear order: title, mode tabs, chapter list, then the card's large name. Finish slips: at 1280 px "COMPONENT ATLAS" runs past the edge of the rail, and at 380 px "RENDERER: WEBGL" collides with the "03 QUEUE" label.
5. PASS — There is one rail and one short card ("02 / PLAIN", "Drafting table", one line of text). It is not a stack of data dumps. The 1280 px card is close to opaque rather than frosted.
6. PASS — At 380 px the scene is still the page, with a chapter dropdown and an overlaid card, not a column of cards. The bottom edge is crowded: the footer, buttons and scene labels overlap.
7. UNJUDGED — None of the attached frames shows the whole loop.
8. PASS — At 1280 px the drafting table is framed near the centre. Its label "02 DRAFTING TABLE" matches chapter 02 on the card, and roads (the dark road on the left and the connector on the right) lead into the frame.
9. UNJUDGED — The 380 px frame is a tour view (chapter dropdown, no Enter or Back to tour buttons, no outlined structure). There is no explore frame for a phone.

Verdict: reads as a demo against the reference

## x_explore_.log

visual-reader: fail; 2 FAIL, 0 unanswered, 0 unknown; verdict reads as a demo against the reference
unjudged: 8
visual-reader: the page reads as a demo against the reference
1. PASS — At both widths the WebGL ground grid runs to the viewport edges, and the card sits over the scene. At 1280 the left rail looks opaque rather than see-through, so the scene stops at its edge (08.1 Setup is cut off there).
2. PASS — You can tell what most models are: compass, library shelves, binoculars, ladder, wire globe, desk frame. They have shadows and depth. They are small and sparse next to the reference's dense cities, though, and about 40% of the 1280 frame is empty grid.
3. PASS — White and grey forms with black accents. No saturated colour.
4. PASS — Labels are monospace caps like "04.1 COMMAND GATE", and the card has a clear kicker, heading and body. At 380 the depot labels collide ("DEPOT: KEYS DEPOT: NIGHT", "DEPOT: STAGE").
5. PASS — There is one short card, "Explore the loop." At 380 the scene shows blurred through it. There are no stacked data cards.
6. PASS — At 380 it is still a full scene with the card laid over it, not a column of cards. The card covers the bottom of the depot cluster.
7. FAIL — Stages 01 to 09 do run in order around one wide closed oval, nothing crosses the inside, and there is no grid. But the depot labels are not joined to a numbered stage by a short road. Depot: Keys and Depot: Night hang off Depot: Stage, which hangs off 05 Eyes on a long road. 05.2 Lab also sits at the end of a long road.
8. UNJUDGED — Both page frames are in explore mode (chapter "00 / NANA PI", "Back to tour"). No tour frame is attached.
9. FAIL — The 380 view does show the whole loop with a Back to tour button. But no structure is outlined, no roads are darker, and the card shows no structure name or Enter button.

Verdict: reads as a demo against the reference

## x_explore_workshop_.log

visual-reader: fail; 2 FAIL, 0 unanswered, 0 unknown; verdict reads as a demo against the reference
unjudged: 8
visual-reader: the page reads as a demo against the reference
1. FAIL — At 1280 px the left rail is an opaque panel that cuts the scene off at its edge; 08.1 Setup is clipped there. The scene sits beside the rail rather than under it, and most of the right half of the frame is empty ground.
2. PASS — The objects have depth and cast shadows, and most can be identified: the library shelves, compass, binoculars (Eyes), ladder and wire globe. They are small and simple next to the reference.
3. PASS — White and light-grey forms with black accents. There are no saturated colours.
4. PASS — Labels are monospace caps with clear chapter numbers, a large title on the card and short body text. There are no raw paths or IDs. The labels Depot: Keys and Depot: Night overlap each other.
5. PASS — There is a single short card over the scene. It looks solid rather than frosted.
6. PASS — At 380 px the page is still the same scene with the card over it, not a column of cards. Labels are crowded, and the card hides the bottom stages.
7. FAIL — Stages 02 to 09 do run clockwise around the oval, but 01 Compass sits off the loop, above its top end. 05.2 Lab and the three depots hang from 05 Eyes on long spokes, not short roads. The stages are spaced unevenly along the ring.
8. UNJUDGED — Both frames show explore mode (Enter / Back / Back to tour). No tour frame is attached.
9. PASS — Workshop has a wireframe outline and its roads to 04.1 and 04.2 are drawn dark. The card shows Workshop with Enter and Back to tour buttons, and the whole ring is in view. The darker roads are only weakly set apart from the black loop.

Verdict: reads as a demo against the reference

## x_notice_board_.log

visual-reader: pass
unjudged: 7, 9
1. PASS — At both widths the WebGL scene runs edge to edge. The rail, header and chapter card sit over it rather than in a separate panel beside it, as in references 4, 6 and 7.
2. PASS — You can tell what each object is: a notice board with pinned sheets, a domed rotunda, a compass dial and stacked library shelves. Each has cast shadows and depth. It is much sparser than the reference city, with simple primitives and a lot of empty floor, but it is legible and finished.
3. PASS — The forms are white and light grey with ink-black roads, frames and accents. There are no saturated colours.
4. PASS — Labels are monospace caps (`09:NOTICE BOARD`, `01.2 LIBRARY`). The large sans title over a small kicker gives a clear hierarchy. There are no raw paths or IDs.
5. PASS — There is one short frosted chapter card ("09 / PLAIN, Notice board, The product report") plus a frosted rail. That matches the reference layout and is not a stack of data cards.
6. PASS — At 380 px the page keeps the scene as the background, with the header, a chapter dropdown and a single card. Finish flaw: the card covers the "RENDERER" line and the "PIXEL VIEW" and "HOLD STILL" buttons, and it touches the "08 RELEASE ROUTE" label.
7. UNJUDGED — Neither frame shows the whole loop. The partial view is consistent with the spec, though: 09 sits next to 01 and 01.1, there is no visible grid, and spurs are joined by short roads.
8. PASS — The notice board is framed near the centre. Its label "09 NOTICE BOARD" matches the card's "09". A thin road enters its platform from the bottom edge, and the wide dark road runs alongside.
9. UNJUDGED — None of the attached frames shows phone explore mode, so the outline, darker roads, Enter and Back to tour buttons, and whole-loop view can't be judged.

Verdict: holds up

## x_review_ladder_.log

visual-reader: fail; 1 FAIL, 0 unanswered, 0 unknown; verdict holds up
unjudged: 7, 9
1. PASS — At both widths the WebGL scene fills the viewport. The 1280 rail and the card sit over the scene rather than beside it, which matches the reference layout.
2. PASS — The scene has depth and cast shadows, and the objects are readable: the stepped review ladder, the colonnaded land gate, lamp posts and dashed-lane roads. It is sparser than the reference city, but the finish is careful.
3. PASS — The palette is white and light grey forms with black roads, decks and accents. There are no saturated colour areas.
4. PASS — The rail, tabs and scene labels use monospace caps, and the card's large sans title sits over a one-line summary, so the hierarchy is clear. There are no raw paths or IDs.
5. PASS — There is one short card ("Review ladder" / one sentence) plus the chapter rail, the same structure as the reference. It is not a stack of data cards.
6. FAIL — At 380px it is still one scene with a card over it, but the finish breaks. The 09 Notice Board model and its label cover the subtitle and the PLAIN/TECHNICAL/FROM THE WORK tabs. At the bottom, the 05.2 LAB label and scene geometry collide with the RENDERER, PIXEL VIEW and HOLD STILL controls.
7. UNJUDGED — Neither screenshot shows the whole-loop view. Both are tour close-ups.
8. PASS — The structure labelled 06 Review Ladder is framed near the centre at both widths, and the card reads "06 / PLAIN". The dark loop road runs into the frame beside it.
9. UNJUDGED — No phone explore-mode frame is attached: no outlined structure, Enter/Back to tour card, or whole-loop phone view.
Verdict: holds up

