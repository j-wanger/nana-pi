Feature: FEAT-039 · See the product and its decisions in one report

Lane world-graph. Class: ordinary. Builder: pi-worker (larger lane). Build session 10, on 40ed75c8.

The owner used build 9 live. His four points, each a requirement:
1. "Scrolling should be designed as one singular super long scroll that goes through the entire story, so unfinished scroll does not scroll back which was terrible UX."
2. "streets render need to be redesigned, the visual just doesn't line up in terms of design language with the buildings".
3. "the workers/agents in the scene are not actually differentiated or doing anything meaningful relative to the scene".
4. The workers also "render in a weird way".

The seat's brief 9 caused point 1: it asked for a 400 ms ease to the nearest chapter. Remove that.

## 1. One continuous scroll

- The page is one long scroll, from the opening to the whole-city view. Stage S follows scroll position continuously, and the camera follows S. Nothing eases, snaps or moves the page or the camera on its own when input stops. Wherever the reader stops, the view stays exactly there.
- The card shows the chapter whose span holds S. Cards cross-fade over the last 15 percent of each span, so text changes smoothly and never jumps back.
- Size each chapter's span to its camera travel, so short moves get short spans and the whole tour reads as one journey. Total length about 6 to 9 screen heights at 1280 px.
- A rail or picker click scrolls the page smoothly to that chapter's start, and the camera follows the scroll; there is no separate flight that fights the page.
- Delete the idle-settle code and its config value. Amend R-3174's wording and test: after input stops, S and the camera pose stay unchanged for 2 s (pin it), and S rises monotonically with scroll position.
- Gesture check: 60 wheel ticks of 100 px, then stop. Read the pose at 0.1 s and at 2 s after the stop; both must match. Repeat for 5 short touch swipes.

## 2. Streets in the buildings' language

The buildings are solid white models with shade sides, ink windows, thin ink outlines and shadows. The streets are flat pale strips with dashes, which reads as a different drawing. Redesign them as built infrastructure, as the reference does (`/private/tmp/nana-3dmk-notes/3dmk-deep-study.md`, sections on trays, viaduct and outlines; read-only):
- **Trays.** Each street is solid geometry: a low deck with a raised kerb wall each side, in the model white with shade sides, ink edge outlines, and shadows, like the buildings.
- **Hierarchy.** The journey street (tower → drafting → yard → bays → inspection → ladder → gate → customs → freight) is a wider two-lane tray. The ring street around the park is a raised ring on piers, like the reference's viaduct. Local streets are narrow single trays.
- **Wayfinding.** Each place has a gatehouse at its tray mouth and its name painted on the tray, as a built object rather than a floating label. Keep the floating label only for the current chapter.
- **Traffic.** Packets are small ink boxes that drive along the trays, keeping lanes. The request packet from brief 9 rides the journey tray. No dashed lines on the ground; dashed lines remain only for the still frame and for air links shown in their own chapter.
- Roads stay thin next to buildings: a lane is about a tenth of a small lot's width.

## 3. Workers who do the work of their place

Each kind of worker has its own silhouette and colour accent within the palette (ink, white, one mid grey), and does its job where it stands:

| Who | Where | Looks like | Does |
| --- | --- | --- | --- |
| Seat | Reception tower deck | Figure with a headset | Turns the dish; a packet leaves the tower when a pulse lands |
| Planner | Drafting office | Figure at a drafting table | Draws; a sheet slides onto the table |
| Adversary | Drafting office, next desk | Figure with a red-pen mark (ink cross) | Strikes the sheet; it goes back to the planner once per loop |
| Builder crew | Lit workshop bays | Two or three figures with hard hats | Carry blocks from the yard into the bay; the bay's frame grows |
| Visual judge | Inspection | Figure at a viewing frame | Holds a card up to the frame; a pass light blinks |
| Reviewers | Review ladder | Figures on the rungs | Climb one rung per loop and stamp a sheet at the top |
| Librarian | Library theater | Figure at a projector | Turns the reel; broadcast rings leave the theater |
| Customs officer | Customs | Figure at a barrier | Lifts the barrier for the packet |

- One figure kit: a simple low-poly body with a head and limbs that bend at the joints, about 1.8 units tall, solid materials, ink outlines like the buildings, and a soft contact shadow. No black blobs, no z-fighting, no floating.
- Dark (future) buildings have no workers.
- Under `?still` or reduced motion, every worker holds one clear pose.
- A reader who stops on a chapter can see that place's workers doing their job at the frame's centre.

## Show your work

As brief 9: real audit data; first-look captures of chapters 00, 02, 03, 05, 06, 07, 08, 13 and explore at 380 and 1280 px with `--hive --reference /private/tmp/nana-3dmk-ref --spec docs/reviews/world-graph-2026-10-30/world-art-spec.md --out <folder outside git>`. Also save frame strips: 8 frames of a slow continuous scroll across chapters 02 to 06, and 4 frames taken 0.5 s apart after scrolling stops mid-chapter (they must be identical in camera pose). Your own pass or fail per spec line, over up to three rounds. The gesture check at 380 px. No model sessions. Never write into `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`. Locked full suite in the foreground.

## Done when

R-3174 (amended) and any row you amend are `implemented` with backticked `file::title` evidence. Green: locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs`. Push and report the finished CI run for the new tip. A Windows R-3104 timeout is a known flake: rerun the failed job once.

Report: the screenshot and frame folders; the spec table; the gesture result; every row and test changed; each departure from the Precedent.

## Precedent

- `apps/hive/main.mjs`: the scroll wiring; remove the idle settle.
- `apps/hive/tour.mjs`: the stage mapping and chapter spans.
- `apps/hive/camera.mjs`: the pose blend, kept.
- `apps/hive/assets/road.mjs`: the street kit to rebuild as trays.
- `apps/hive/assets/parts.mjs`: shared parts, for kerbs, piers and gatehouses.
- `apps/hive/assets/district.mjs`: the buildings whose materials and outlines the streets must match.
- `apps/hive/assets/residents.mjs`: the figures to rebuild as one kit with roles.
- `apps/hive/assets/materials.mjs`: the palette.
- `scripts/hive-gesture-check.mjs`: the gesture check to extend.
