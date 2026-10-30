# Seat visual judge on build 3 (3a3d0405), real audit data

## x_.log

visual-reader: fail; 4 FAIL, 0 unanswered, 0 unknown; verdict reads as a demo against the reference
unjudged: 8, 9
visual-reader: the page reads as a demo against the reference
1. FAIL. On desktop the card overlaps the scene, but at 380 px the header sits above the scene and the card and footer are stacked below it, so the text is boxed under the scene instead of laid over it. The model also floats on blank grey with a large empty band above it on mobile.
2. FAIL. Some objects can be identified, such as the compass, binoculars, library shelves and lab dials. But 07, 06, 04.1 and 04 are plain blocks, shadows are faint and the scene is sparse. It falls well short of the dense, shaded detail in the reference city.
3. PASS. White and light-grey forms with black accents, and no saturated colour.
4. PASS. Numbered monospace caps labels, a clear title, headline and body hierarchy, and no raw paths or IDs.
5. PASS. There is one short card with a headline, one line of copy, an Explore button and a brief note.
6. FAIL. At 380 px the page splits into header, scene, card and footer. Labels are clipped at the right edge ("02.1 REQUIREMENT CONTRACT", "03.1 IDENTITY SCAN"), and the scene feels inserted into the page rather than being the page.
7. FAIL. Stages 01 to 09 run roughly clockwise, but the only wide road is a narrow house-shaped path in the middle. Stages 01, 02, 03 and 05 sit off it, so the numbers do not follow one closed widest road. 08, 03 and 03.2, and then 07, 04 and 04.1, line up in rows, so the layout still reads as a grid.
8. UNJUDGED. No attached frame shows a tour chapter with one structure framed in the centre; both page frames show chapter 00, the whole system.
9. UNJUDGED. No attached frame shows explore mode on a phone with an outlined structure, darker roads or Enter and Back to tour buttons.

Verdict: reads as a demo against the reference

## x_drafting_table_.log

visual-reader: fail; 2 FAIL, 0 unanswered, 0 unknown; verdict reads as a demo against the reference
unjudged: 7, 9
visual-reader: the page reads as a demo against the reference
1. PASS — At both widths the 3D scene runs edge to edge. The left rail, the chapter card and the footer controls sit on top of the scene, not in a box beside it.
2. FAIL — The library, the requirement-contract boards, the drafting table and the compass can be recognised, and they have shadows. But the ground around them is empty. The road pieces stop in mid-air: a green slab on the right and a ladder-like strip near the middle don't connect to anything, and you can't tell what they are. The reference is far more detailed and finished.
3. PASS — The forms are white and grey with black accents. The sage-grey roads are muted, not bright patches of colour.
4. PASS — Labels are in monospace capitals, and the title, subtitle, chapter label and heading form a clear order. No raw paths or IDs. Labels are clipped, though: "01.1 RULINGS" at the top edge and "1 COMPASS" where it meets the rail.
5. FAIL — The card is short and frosted, but the rail isn't frosted enough. Its items 04 to 05.2 run over the compass dial and are hard to read. In the reference, the blur behind the rail keeps its text clear.
6. PASS — At 380px the scene still fills the screen behind one card and a compact header. It doesn't turn into a column of cards.
7. UNJUDGED — None of the images shows the whole loop.
8. PASS — The drafting table is framed near the centre. Its label "02 DRAFTING TABLE" matches "02 / PLAIN" on the card and the chapter picker. A dashed road comes into the frame at the lower left (and the lower right at 380px).
9. UNJUDGED — None of the images shows Explore mode on a phone.

Verdict: reads as a demo against the reference

## x_explore_.log

visual-reader: fail; 3 FAIL, 0 unanswered, 0 unknown; verdict reads as a demo against the reference
unjudged: 8
visual-reader: the page reads as a demo against the reference
1. FAIL — At 380 px the header sits above the scene and the card sits below it, so the scene is boxed between text blocks instead of filling the screen. At 1280 px the left rail has a hard divider and nothing from the scene shows behind it. Only the right card is laid over the scene.
2. PASS — The objects can be recognised (compass, binoculars, library shelves, globe cage, drafting table) and have light shading. But they're small and widely spaced, with faint shadows, and much less detailed than the dense reference city.
3. PASS — Grey ground, white forms and ink-black accents; no saturated colour.
4. PASS — Labels are in monospace caps, and the title, label and body text form a clear hierarchy. Some labels overlap (02.1 runs over 02.2; the depot labels collide on mobile).
5. PASS — There is one short card. At 1280 px it sits over the scene, though it looks flat rather than frosted.
6. PASS — It's still one scene rather than a column of cards. Labels crowd and are cut off at the left edge, and there's a dead gap under the header.
7. FAIL — Stages 02 to 09 run in order around a closed road, but 01 Compass sits above the top of the loop, joined by thin dashed links rather than the wide road. 08 and 03 sit off the road. Depot Key Cabinet and Night Shift hang off Depot Stage, which is not a numbered stage, and Depot Stage is reached by a long road, not a short one.
8. UNJUDGED — Both page frames show explore mode at chapter 00; no tour frame is attached.
9. FAIL — The phone frame shows the whole loop, but no structure is outlined and no roads are darker. The card shows the generic "Explore the loop" text with only Back to tour; there's no name and no Enter button.

Verdict: reads as a demo against the reference

## x_explore_workshop_.log

visual-reader: fail; 4 FAIL, 0 unanswered, 0 unknown; verdict reads as a demo against the reference
unjudged: 8
visual-reader: the page reads as a demo against the reference
1. FAIL — The scene doesn't fill the viewport. At 1280 px an opaque left rail takes the space and the model sits only to its right. At 380 px the header, chapter picker and card are stacked above and below the scene instead of laid over it.
2. FAIL — Some props are readable (compass, binoculars, tool belt, ladder), but they're small tokens floating on flat grey. There's no ground, little shadow and lots of empty space. It's far below the reference's dense, lit city.
3. PASS — White and grey forms with black accents. The one muted sage road highlight is not a saturated blob.
4. FAIL — The monospace labels are deliberate, but they collide ("DEPOT: STAGE" over "KEY CABINET") and run off the edge at 380 px. The card's body line is jammed under its buttons with no spacing.
5. PASS — At 1280 px there is one short card over empty scene space, with a title, buttons and one line of text. It's not a data dump.
6. PASS — At 380 px it's still recognisably the same map with one card. It's a stacked column, but not a column of cards, and there is a large empty gap above the scene.
7. FAIL — Stages 01 to 09 do run in order around a rough ring. But the loop doesn't read as one continuous widest road: segments are faint and broken, and 03 and 07 sit off it. Thin lines from 08.1 and 09 cut across the inside. The depots hang off a long road with no numbered stage beside them.
8. UNJUDGED — Both frames show the explore card (Enter / Back to tour), so no tour-state frame is attached.
9. PASS — At 380 px Workshop is outlined and its roads are drawn darker. The card shows "Workshop" with Enter and Back to tour buttons, and the whole loop is in view.

Verdict: reads as a demo against the reference

## x_notice_board_.log

visual-reader: fail; 1 FAIL, 0 unanswered, 0 unknown; verdict reads as a demo against the reference
unjudged: 7, 9
visual-reader: the page reads as a demo against the reference
1. PASS — At both widths the scene runs to the viewport edges and the chapter card sits over it. At 1280 px the left rail shows plain grey with no scene behind it, while in the reference the scene shows through the rail.
2. FAIL — The rotunda, compass, notice board and library are easy to identify and have shading and shadows. But the roads break into loose floating slabs and thin crossing lines that you can't identify. The scene is sparse next to the dense, finished city in the reference.
3. PASS — The forms are white and light grey with black accents. The muted sage-grey roads are the only tint, and they aren't saturated colour blobs.
4. PASS — Labels are monospace caps and the hierarchy is clear: title, mode tabs, chapter list, card heading. Dotted sub-IDs like "01.1" and "02.2" are tidy, not raw paths. There is one flaw: at 1280 px the "NANA / SYSTEM MODEL" footer runs into the card and a black object covers it.
5. PASS — There is one short frosted card ("09 / PLAIN, Notice board, The product report"). It isn't stacked and it isn't a data dump.
6. PASS — At 380 px the page keeps the scene, a header, a dropdown chapter picker and one overlaid card, not a column of cards. Some controls and labels collide with roads and the compass.
7. UNJUDGED — None of the attached images shows the whole loop.
8. PASS — The notice board is the main structure near the centre. Its "09 NOTICE BOARD" label matches "09" on the card, and a road enters the frame from below.
9. UNJUDGED — None of the attached images shows the phone explore state, an outlined structure, or Enter and Back to tour buttons.

Verdict: reads as a demo against the reference

## x_review_ladder_.log

visual-reader: fail; 1 FAIL, 0 unanswered, 0 unknown; verdict reads as a demo against the reference
unjudged: 7, 9
visual-reader: the page reads as a demo against the reference
1. PASS — At both widths the WebGL scene fills the viewport. The title, the chapter rail and the chapter card sit over it, and at 1280 px the scene shows through behind the left rail.
2. FAIL — The buildings have some detail (windows, columns, stairs, a pergola) and you can tell they're buildings. But the light is flat and there are almost no cast shadows. The ground is a mostly empty plane crossed by thin lines. Next to the dense, shaded city in the reference, it lacks depth and finish. A generic building also doesn't read as a "review ladder".
3. PASS — The forms are white and light grey with black window and door accents. The roads are a muted grey-green, not a saturated colour.
4. PASS — Labels and the rail are monospace capitals with numbers, the title is a larger sans-serif, and the card has a clear kicker, heading and line. There are no raw paths or IDs.
5. PASS — One short frosted card ("06 / PLAIN · Review ladder · one line"), plus a rail like the reference's. There are no stacked data dumps.
6. PASS — At 380 px the full-bleed scene stays, with the header and chapter dropdown at the top and a single card at the bottom. There are flaws: a dark blurred smear on the card's right edge, and the card partly covers the "HOLD STILL" button.
7. UNJUDGED — Neither page frame shows the whole loop. Both are tour close-ups.
8. PASS — The 06 Review ladder building is framed near the centre at both widths. Its label "06 REVIEW LADDER" matches the card's "06". Dark roads lead into the frame from the top and the right.
9. UNJUDGED — No frame shows explore mode on a phone: no outlined structure, darker roads, Enter button or Back to tour button.

Verdict: reads as a demo against the reference

