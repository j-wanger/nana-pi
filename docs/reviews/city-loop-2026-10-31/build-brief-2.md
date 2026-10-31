Feature: FEAT-039 · See the product and its decisions in one report

Lane city-loop. Class: ordinary. Builder: pi-worker (larger lane). Build session 2, on 24db3cb5.

Build 1 is sound: the rows, the flow evidence test, the narration and the scroll numbers hold. The seat looked at its frames and agrees with your two failing lines. The loop is true in the data and the text, but a reader cannot see it on the page. Fix that; change nothing else.

## 1. "The way back" must show the way back

At chapter 12 the camera pulls out to the whole city. The city fills about a third of the frame, a blank band sits above it, and no return road can be told apart. This is the chapter the owner's question hangs on. Frame the park and the town ring around the land gate, archive, ledger, library theater and drafting office: close enough that every listed return road is readable at 1280 and 390 px. Highlight that chapter's returns: built returns as solid ink ribbons with packets moving along them, and unbuilt returns as dark dashed ribbons, each with its painted name. Every return ribbon must stay on the ground or on a tray; no arcs in the air. The current dashed arc over the review-ladder frame floats and reads as a glitch.

## 2. Centre the place, then frame its roads

At chapter 07 the review ladder sits at the right edge under the card, and the ledger's road leaves the frame on the left. Rule: the chapter's place stays in the centre band (spec line 8). If its listed roads do not fit, widen the field of view or pull back a little, but never move the place out of the centre band or under the card. Amend the R-3174 framing test to check both: the place's projected centre is in the middle third horizontally, above the card, and both ends of every listed road are in frame.

## 3. The return packet reads at every distance

In the whole-city view the return packet is a dot you can only find with the debug label. Give packets a minimum on-screen size and a short fading trail, so a reader can follow one at the whole-city view at 1280 and 390 px. Keep it within the palette. Remove the debug labels from captures.

## Show your work

As build 1, for chapters 07, 08, 12 and 13 and the visits, plus the four-frame return strip without debug labels. Your own pass or fail per spec line; lines 8 and 10 must pass. Scroll measurements before and after; p95 below 20 ms. Gesture check at 390 px. No model sessions. Never write into `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`. Locked full suite in the foreground.

## Done when

Amended rows `implemented` with backticked `file::title` evidence. Green: locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs`. Push and report the finished CI run for the new tip. A Windows R-3104 timeout is a known flake: rerun the failed job once.

## Precedent

- `apps/hive/tour.mjs`: chapter poses and framing.
- `apps/hive/camera.mjs`: field of view and pose blend.
- `apps/hive/assets/hive.mjs`: return ribbons and the return packet.
- `apps/hive/assets/parts.mjs`: `ribbon`.
- `apps/hive/config.mjs`: sealed return and packet sizes.
- `packages/nana-pack/tests/hive-city.test.mjs`: the R-3174 framing test to amend.
