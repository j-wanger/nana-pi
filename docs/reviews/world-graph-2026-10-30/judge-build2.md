# Seat visual judge on build 2 (09607546), real audit data

## x_.log

visual-reader: fail; 3 FAIL, 0 unanswered, 0 unknown; verdict reads as a demo against the reference
unjudged: 8, 9
visual-reader: the page reads as a demo against the reference
1. PASS — At both widths the WebGL scene runs behind the text. At 1280 px the left rail and the bottom-right card sit over the scene. At 380 px the card overlays the bottom of the loop. Neither is boxed off beside it.
2. FAIL — The structures are tiny glyphs on a large empty field. The roads are flat grey strips with almost no light, shadow or depth. Apart from the 05.2 lab and the 01.2 library, you can't tell what an object is. This falls well short of the dense, shaded models in the reference.
3. PASS — The forms are white and light grey with black accents, and there are no saturated colours.
4. PASS — Labels are monospace caps, numbered and underlined. The card has a clear eyebrow, then headline, then body. There's no dump of raw paths or IDs.
5. FAIL — There is one card, but at 1280 px its last sentence is cut off ("White forms are built. Open frames are"). The card also crowds the 04.1 and 04.2 labels.
6. PASS — At 380 px the page is still the loop scene with an overlaid card, not a column of cards. One flaw: the 05.2 LAB label is partly hidden under the card.
7. FAIL — Stages 01 to 09 do run in order around a closed loop, but:
   - the ring is several parallel strands, with no single widest road;
   - the rail lists 10.1 to 10.3, which have no stage 10, sit off-frame behind the rail, and connect by a long road;
   - 05.2 hangs on a long spoke rather than a short road;
   - roads cross the inside of the loop (09→04 and 07→04).
8. UNJUDGED — No tour frame is attached. Both page images show chapter 00.
9. UNJUDGED — No explore-on-phone state is attached.

Verdict: reads as a demo against the reference

## x_drafting_table_.log

visual-reader: fail; 2 FAIL, 0 unanswered, 0 unknown; verdict reads as a demo against the reference
unjudged: 7, 9
visual-reader: the page reads as a demo against the reference
1. FAIL — At 1280 px the scene stops at an opaque left rail (x≈236), so the chapter list sits beside the scene instead of over it. A dark blurred smear also runs across the top of the rail and covers its text. At 380 px the scene reaches the edges, but the header sits on a plain band.
2. FAIL — The drafting table, with its lamp and scissor legs, is readable. The requirement contract is a stack of plain slabs. The roads are huge, crude prisms that take up most of the frame. Shadows are faint and there is little fine detail. This is far below the dense, finished city in the reference frames.
3. PASS — Forms are white and light grey with black accents. The roads are a muted dark green-grey, which is heavy but not saturated, and there are no colour blobs.
4. PASS — Labels are monospace caps, such as "02 DRAFTING TABLE" and "CHAPTER 02:DRAFTING TABLE". The title, kicker and body text form a clear hierarchy, with no raw paths or IDs.
5. PASS — There is one short frosted card ("02 / PLAIN, Drafting table, Plans and briefs before building"), not stacked data cards.
6. PASS — At 380 px the page keeps the scene with the same card laid over it, plus a chapter dropdown. It does not fall into a column of cards.
7. UNJUDGED — None of the attached frames shows the whole loop, so the 01–09 order, the closed road and the grid can't be checked.
8. PASS — The drafting table is framed near the centre. Its "02 DRAFTING TABLE" label matches the chapter 02 on the card, and several roads lead into the frame.
9. UNJUDGED — There is no phone frame of explore mode showing an outlined structure, darker roads, or the Enter and Back to tour buttons.

Verdict: reads as a demo against the reference

## x_explore_.log

visual-reader: fail; 3 FAIL, 0 unanswered, 0 unknown; verdict reads as a demo against the reference
unjudged: 8
visual-reader: the page reads as a demo against the reference
1. PASS — At 1280 px the loop scene fills the area behind the rail, and the card floats over it. At 380 px the card is also laid over the bottom of the scene.
2. FAIL — The structures are tiny, flat icons joined by thin, washed-out lines. There is almost no light, shadow or depth. Most objects (Compass, Queue, Workshop, Eyes) can't be identified, which falls far short of the reference's detailed, lit models.
3. PASS — The page uses white and light grey forms with black ink accents, and has no saturated colour.
4. PASS — Labels are in monospace caps, with a clear title, chapter and body hierarchy. The rail index matches the style of the reference's chapter list.
5. PASS — There is one short card ("Explore the loop" plus a short note), not stacked data cards.
6. PASS — At 380 px the page still shows the loop with one card over it. It does not fall apart into a column of cards.
7. FAIL — Stages 01 to 09 run in order around a closed loop, and only about two roads cross the inside. But 10.1 Stage, 10.2 Key Cabinet and 10.3 Night Shift sit beside no numbered stage: there is no stage 10. They hang far off to the left, joined by a long road and partly hidden under the rail. The loop road is also drawn as several parallel strands, so no single widest road stands out.
8. UNJUDGED — Neither page frame shows the tour state. Both show the "00 / Explore the loop" card, so there is no framed structure or chapter number to check.
9. FAIL — The 380 px frame shows the whole loop and a Back to tour button. But no structure is outlined, no roads are drawn darker, and the card shows "00 / NANA PI" rather than a structure name. There is no Enter button.

Verdict: reads as a demo against the reference

## x_explore_workshop_.log

visual-reader: fail; 3 FAIL, 0 unanswered, 0 unknown; verdict reads as a demo against the reference
unjudged: 8
visual-reader: the page reads as a demo against the reference
1. FAIL — At 380px the scene is a band between a stacked header and a card below it; text is not laid over it. At 1280px the rail and card do overlay it, but most of the frame is empty grey.
2. FAIL — The page is a thin-line wireframe with tiny glyph-like objects. There is barely any depth, light or shadow, and only Library, Lab and Desk can be told apart. The reference shows a detailed, shaded model.
3. PASS — Light grey and white forms with ink-black accents and no saturated colour.
4. PASS — Monospace uppercase labels such as "04.1 COMMAND GATE" and a clear title, chapter and card hierarchy. No raw paths or IDs.
5. PASS — One short card, "Workshop" with one line of copy, plus a nav rail. It reads as flat rather than frosted.
6. PASS — At 380px it is still one scene with one card, not a column of data cards. The card sits under the scene rather than over it.
7. FAIL — Stages 01 to 09 do run in order around a closed loop. But 10.1, 10.2 and 10.3 have no numbered stage and hang off a long road to 09, and on desktop they are cut off under the rail. At least three thick dark roads, from 09, 07 and 06 to 04, cross the inside of the loop and are drawn wider than the loop itself.
8. UNJUDGED — Both frames show the explore state (Enter, Back and Back to tour buttons). Neither shows a tour frame with a structure centred.
9. PASS — At 380px the Workshop's roads are darker, and the card shows "Workshop" with Enter and Back to tour buttons. The whole loop is visible, not a close-up. The outline on the selected structure is hard to see at this size.

Verdict: reads as a demo against the reference

## x_notice_board_.log

visual-reader: fail; 1 FAIL, 0 unanswered, 0 unknown; verdict reads as a demo against the reference
unjudged: 7, 9
visual-reader: the page reads as a demo against the reference
1. PASS. At both widths the WebGL scene covers the whole viewport. A road shows blurred through the 1280px rail, and the header, card and buttons sit over the scene rather than in a panel beside it.
2. FAIL. The notice board itself is legible, with pinned sheets, posts and a bolted base. Around it, the roads are huge, plain six-sided dark beams at the wrong scale with no surface detail. There is little visible shadow on the ground and a lot of empty grey. Next to the reference's dense, finished city, it reads as one model among rough placeholders.
3. PASS. The forms are white and light grey with black accents. The roads are a dark grey-green, not a bright colour, but they are big enough to outweigh the "accents" idea.
4. PASS. Monospace uppercase labels and a numbered rail like `09:NOTICE BOARD` set a clear order: title, then mode tabs, then chapters, then card heading. The card's body font looks like a default sans, and "RENDERER: WEBGL" reads like debug text.
5. PASS. A single frosted card holds the chapter number, mode, title and one line of text. It is short and readable, not a data dump.
6. PASS. At 380px the header, chapter picker, scene and card still form one composed object, not a column of cards. Two flaws: a large empty band sits above the model, and the card cuts off part of "RENDERER: WEBGL".
7. UNJUDGED. No whole-loop frame is attached, so the 01–09 ring, its spur roads and the no-rows-or-columns rule can't be checked.
8. PASS. The notice board is framed near the centre. Its label "09 NOTICE BOARD" matches the card's "09 / PLAIN" and the selected rail item, and several roads run into the frame.
9. UNJUDGED. No phone explore-mode frame is attached, so the outline, darker roads, Enter and Back to tour buttons, and whole-loop view can't be checked.

Verdict: reads as a demo against the reference

## x_review_ladder_.log

visual-reader: fail; 1 FAIL, 0 unanswered, 0 unknown; verdict reads as a demo against the reference
unjudged: 7, 9
visual-reader: the page reads as a demo against the reference
1. PASS: At both widths the scene runs to the edges. At 1280 the left rail is see-through over the scene, and on both the chapter card sits on top of the scene, not beside it.
2. FAIL: The scene is one sparse tower with a few rails and tiny figures. The roads are huge dark beams that don't read as roads, and the blurred dark streaks behind the rail look accidental. It's far below the dense, finished detail of the reference cities.
3. PASS: The forms are white and light grey with very dark green-black roads. There are no saturated colour blobs.
4. PASS: Labels are monospace capitals in a clear order: title, mode tabs, numbered chapter list, then the card heading and body. There are no raw paths or IDs.
5. PASS: The text is one short card plus a rail. The card's frosting is a muddy dark gradient, though, not a clean pane.
6. PASS: At 380 it keeps the same design: header, chapter dropdown, scene, then one card. It doesn't turn into a column of cards.
7. UNJUDGED: No whole-loop frame is attached. Both screenshots are tour close-ups of chapter 06.
8. PASS: The Review ladder tower is near the centre. Its label "06 REVIEW LADDER" matches "06 / PLAIN" on the card, and several roads run into the frame.
9. UNJUDGED: The 380 frame is tour mode. It shows no outlined structure, no Enter or Back to tour buttons and no whole-loop view.

Verdict: reads as a demo against the reference

