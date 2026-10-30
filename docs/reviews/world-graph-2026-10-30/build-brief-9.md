Feature: FEAT-039 · See the product and its decisions in one report

Lane world-graph. Class: ordinary. Builder: pi-worker (larger lane). Build session 9, on 47b9ec07.

The owner opened build 8 live and rejected it: "too much of an ai slop". His points, each a requirement for this build:
1. "the scrolling navigation experience is terrible, it breaks if you dont do a long scroll".
2. "the story doesnt make sense the way we are narrating".
3. "the signal tower can be outside the factory but still central to the park".
4. "the signals should be animated signals (not a building?)".
5. "the introduction animation/scene to the world" is missing.
The seat adds a sixth, from its own check: the overview is a sparse field of tiny tokens on spokes, not a city.

Work in this order. If time runs short, finish items in order and report what is left.

First, merge current main (`git merge origin/main`). Regenerate the code map and requirements outline for the two generated indexes that conflict; never hand-merge them.

## 1. Scroll that never breaks

The reference's grammar (from the seat's study, `/private/tmp/nana-3dmk-notes/3dmk-deep-study.md` section 5, read-only, summarised here):
- Scroll position maps to a **fractional stage** S, from 0 at the first chapter to N at the last. The camera blends continuously between the two chapter keyframes around S. A short wheel tick or a short swipe moves the camera a short way. Nothing jumps, and nothing waits for a long scroll.
- Each chapter has one camera keyframe: target, distance, azimuth, elevation, fov. Blend distance in log space. When the target moves far, add a pull-back bump at the middle of the move, so the camera rises, travels and comes down.
- After 400 ms without input, ease the camera, not the page, to the nearest chapter's keyframe. The card shows the nearest chapter.
- A rail or picker click flies to that chapter over 1.6 to 4.2 s, scaled by distance, with the page scroll following on the same clock. Any wheel, touch or key input takes over mid-flight.
- Remove whatever made short scrolls break; name the cause in your report.
- Extend `scripts/hive-gesture-check.mjs`: 40 single wheel ticks of 100 px each must move the stage forward by monotonic steps and reach chapter 3 or later; 5 short touch swipes of 60 px must each change the camera; a rail click mid-scroll must land on its chapter. Pin the stage mapping with a unit test under R-3174 (amend its wording to say continuous stage, not chapter jumps).

## 2. A story a stranger can follow

The plain voice reads narration, not component metaphors. Put each step's narration in `apps/hive/city.json` (a `title` and a `text` per journey step); the technical voice keeps the component data. Use this script as written (the seat's copy, from the owner's city story doc), one chapter per line:

| # | Title | Text |
| --- | --- | --- |
| 00 | One wish, shipped | nana is a city that turns one wish into shipped work. Scroll to follow one request through it. |
| 01 | A signal arrives | The owner sends a wish from far away. It falls on the reception tower as a pulse of light. |
| 02 | The reception tower | The seat works in the tower at the centre. It decodes the wish, checks the rulings and sends the work into the park. Questions go back up as asks. |
| 03 | The drafting office | A planner draws the plan and the tests it must pass. An adversary at the next desk tries to break them before anyone builds. |
| 04 | The dispatch yard | Plans wait here for a free bay. Two lanes build at once, and a third can be planned alongside. |
| 05 | The workshop bays | A builder crew takes the plan into a bay and builds it. The library theater broadcasts the memory the lane needs. |
| 06 | Inspection | The visual judge holds each build against its reference picture. A failed check sends the work back to its bay. |
| 07 | The review ladder | Reviewers from a different model family read the change. Work on gates, hooks and installs climbs extra rungs. |
| 08 | The land gate | The gate opens only when every reviewer says LAND and CI is green. It is the park's only way out. |
| 09 | Customs | At the city edge, customs scans the cargo for anything that names the owner or their work. |
| 10 | The freight road | Release carries templates and setup out of the city. The billboard shows what shipped. |
| 11 | Customer towns | Other projects built the nana way receive the work. Their feedback rises to the sky as new signals. |
| 12 | The way back | Each lane's findings return to the library theater as new tapes, so the next lane starts knowing more. |
| 13 | The whole city | The tower at the centre, the factory park around it, the town around that, and one road out. Dark buildings are parts still to come. |

Side visits (courthouse, survey office and the rest) keep their place in the explore mode and the technical voice; in the plain tour they are named inside the step text only where the script names them. Merge or drop steps so the tour has exactly these 14 chapters.

## 3. The tower at the centre of the park

The tower stands on its own open plaza at the centre of the factory park. It is not a factory hall, and no fence separates it from the halls. The halls ring the plaza, in journey order around it. The park fence runs around the outside of the halls, with the entry facing the town and the land gate as the only exit. Amend spec line 7a and R-3172's geometry pins to say this; keep 7b's controls failing.

## 4. Signals are animation, not buildings

Remove the "signal" place and building. Instead:
- Pulses of light fall from the owner's craft high above the city to the tower's dish, on a loop.
- The tower sends pulses along the street to the drafting office, then on along the journey street; one packet follows the request through the park to the gate and out the freight road.
- The library theater sends out rings, like a broadcast, toward the bays.
- Workers move inside the lit bays.
- `?still` and reduced motion stop every animation and show one still frame with the pulses drawn as dashed lines.

## 5. An opening scene

On load, show the city as a flat plan drawing in thin lines (the reference's loading drawing is the model), with the title. The plan rises into the 3D city as the camera descends from high above onto the tower, while the first signal pulse falls. Lasting 3 to 5 s, any input skips it. It ends on chapter 00's keyframe. Under `?still` or reduced motion, show the end frame at once.

## 6. A dense city, not a diagram

- Buildings fill their lots: scale footprints up so the whole-city view reads as blocks, not tokens. The overview camera comes lower and closer (a three-quarter view, as the reference's chapter 21 frame), so buildings read at 1280 and 380 px.
- Fill the town between named places with plain blocks: houses where the workers live. They are unnamed and unlit-neutral.
- Streets: a ring street around the park and one avenue, plus short local streets. No spokes from the centre to every building.
- Lit and dark windows show together in the whole-city view (spec line 10).

## Show your work

As brief 6: real audit data, first-look captures of chapters 00, 01, 02, 05, 08, 13 and explore, at 380 and 1280 px, with `--hive --reference /private/tmp/nana-3dmk-ref --spec docs/reviews/world-graph-2026-10-30/world-art-spec.md --out <folder outside git>`. Also save a short screen recording or a strip of 8 frames of the opening scene, and 8 frames of a slow scroll from chapter 02 to 05. Your own pass or fail per spec line, over up to three rounds. The extended gesture check at 380 px. No model sessions. Never write into `/private/tmp/nana-3dmk-ref/`. Locked full suite in the foreground.

## Done when

Rows as amended (R-3172, R-3174, spec lines 7a and 10) are `implemented` with backticked `file::title` evidence. These are green: locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs`. Push and report the finished CI run for the new tip. A Windows R-3104 timeout is a known flake: rerun the failed job once before reporting.

Report: the screenshot and frame folders; the spec table; the gesture result; the cause of the short-scroll break; every row and test changed; each departure from the Precedent.

## Precedent

- `apps/hive/tour.mjs`: chapter data, extended to a fractional stage.
- `apps/hive/camera.mjs`: keyframes and blends, extended with log-distance blends and the pull-back bump.
- `apps/hive/main.mjs`: the scroll and hash wiring to replace.
- `apps/hive/text-layer.mjs`: the voices; plain reads narration.
- `apps/hive/city.json`: places and journey; gains narration.
- `apps/hive/city.mjs`: placement; the plaza and the ring.
- `apps/hive/assets/district.mjs`: building forms, scaled up.
- `apps/hive/assets/parts.mjs`: shared parts.
- `apps/hive/assets/road.mjs`: street ribbons.
- `apps/hive/assets/residents.mjs`: workers that now move.
- `apps/hive/pixel.mjs`: the flat drawing to start the opening plan from.
- `scripts/hive-gesture-check.mjs`: the gesture check to extend.
