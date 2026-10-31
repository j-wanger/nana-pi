Feature: FEAT-039 · See the product and its decisions in one report

Lane city-loop. Class: ordinary. Threat model: honest variation in our tools' output and in the code the city describes is in scope (an audit that changes a component's status, a later lane that builds or removes a flow, a narration edit that names a road that does not exist or revives a retired claim, renderer fallback, reduced motion, phone widths); deliberate forgery, such as planting a matching code line that does no work, is out.

Review `git diff origin/main...HEAD` on `feat/city-loop`. Main is 811ed082. The plan of record is `docs/reviews/city-loop-2026-10-31/plan.md`, revised after the one adversary pass (`plan-attack.md`). The backbone map behind it is `backbone-map.md`. Build briefs 1 and 2 state each change; the builder's records are `build-notes.md`, `build2-notes.md` and `build2-followup.md`. The 2026-10-31 entry in `docs/sessions/2026-10.md` summarises the lane.

The change: the city now shows a review archive, a known-bug ledger and a main-CI watchtower; each road carries whether it is built; built returns are ground ribbons with a moving packet, unbuilt ones are dark and dashed; a new chapter, "The way back", says what returns today and what does not. R-3187 ties each built road to one working code line, matched once with comments stripped, so deleting the flow fails naming the road. Two overclaims of the landed text are removed (library to builders, findings to library). R-3171, R-3173, R-3174 and R-3177 amended.

The seat's record:
- Builds 1 and 2; locked full suite at 143e46f4: 242 files, 240 pass, 2 skip. CI run 41181033675 passed on all three systems.
- Gesture check at 390 px: 26 passed; p95 frame time 10 to 17 ms; no reversals.
- The seat scrolled all 14 chapters with short wheel ticks at 1280 px and swipes at 390 px: monotonic, no snap-back, every chapter card reached.
- Known bugs added in this change: eight lines in `docs/known-bugs/FEAT-039.md`, four carried from the world-graph final review.

Question: does the feature work for its user, a stranger who opens the page to understand how nana works, and does the change cause a harm the review standard lists? Check especially that every road the city draws as built has a real flow in the code, that no narration claims a return that does not exist, that R-3187's test fails when a flow line is deleted, and that tests assert the city's invariants rather than restate the implementation.

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, and do not bold it.
