VERDICT: PARTIAL

## Commits and result

- Merge commit `3930ae0e` merges current `origin/main`. Both conflicting indexes were regenerated, not hand-merged. Its foreground locked baseline passed: 242 files, 240 PASS, 0 FAIL, 2 SKIP; 8750 passing checks.
- The build commit follows the final green locked suite. The final worker response records its hash and the finished CI result for that exact tip.
- This work serves the shared-toolkit experience: making the owner's city story usable. No model session, subagent or GitHub issue operation was started.
- Visual acceptance remains incomplete. The phone overview now has housing blocks, but named park structures and window states still read too small. I do not call the feature DONE.

## Files and rows

| Item | Files | Row changes |
|---|---|---|
| Continuous navigation | `apps/hive/tour.mjs`, `camera.mjs`, `main.mjs`, `config.mjs`, `index.html`; `scripts/hive-gesture-check.mjs` | R-3174 now specifies continuous fractional stage, fourteen narrated chapters, numbered/hash anchors and exploration side places. |
| Plain story | `apps/hive/city.json`, `text-layer.mjs`, `tour.mjs` | R-3174 evidence updated. Exactly fourteen title/text pairs use the supplied script. Technical retains component data; side places remain in Explore. |
| Central plaza | `apps/hive/city.json`, `city.mjs` | R-3172 now pins the tower at the origin inside the park, halls outside its plaza, town outside the fence and the northern land gate. Four shape controls still fail. |
| Activity and opening | `apps/hive/assets/hive.mjs`, `district.mjs`, `pixel.mjs`, `main.mjs` | No new row. The signal lot is removed. A decorative owner craft sends falling pulses; a packet follows declared journey handoffs; theater rings broadcast; visible crews move inside open-front bays. Still/reduced motion freeze these and draw dashed pulse traces. A four-second drawing/rise/descent ends at chapter 00; input skips it. |
| Density | `apps/hive/assets/hive.mjs`, `district.mjs`, `camera.mjs`, `layout.mjs`, `config.mjs` | R-3172 evidence adds a sealed density pin. Larger forms fill lots; unnamed neutral houses fill the town; the lower overview includes housing bounds. Neighbouring halls share a journey street instead of individual hub spokes. |
| Contracts and records | `apps/hive/README.md`, `docs/code-map.md`, this folder's `build-9-*` records and `world-art-spec.md` | Spec 7a moves the tower into the central plaza. Spec 7b replaces “central yard” with the tower plaza without weakening its controls. Spec 10 explicitly requires both window states in the whole-city frames at both widths. |

Only R-3172 and R-3174 change in the ledger; both remain implemented with backticked `file::title` evidence. No new row ID was allocated. The requirements outline was regenerated during the merge and again after the changes; its latter output was unchanged. No HANDOFF, known-bug file or session archive was edited by this build; incoming versions were accepted through the requested merge.

### Cause of short-scroll failure

The old reduced-motion branch rounded fractional progress to an integer before computing a pose. Every short swipe below half a chapter therefore produced the same camera. The normal branch additionally applied a 0.025-per-draw chase, and resize rewrote progress to the nearest integer. These made short input lag or lose fractional progress. The new mapping never quantizes input, applies its blended pose immediately, preserves fractional stage on resize and settles only the camera after 400 ms idle.

Rail navigation previously assigned `location.hash`, which also lets the browser jump to its section before a flight can start. The replacement uses `history.pushState` and an explicit clock shared by camera stage and page scroll. Hash changes and browser history still resolve chapters. Wheel, touch, pointer and key input cancel a flight; a repeated rail destination still works.

## Every test changed

No test was deleted. All asynchronous cases remain awaited under per-case limits. Fixtures and mutation copies use OS temporary folders; no suite case runs, imports or copies the gesture seat script.

| File | Case | Change and reason |
|---|---|---|
| `packages/nana-pack/tests/hive-city.test.mjs` | R-3172 radial city | Replace yard-origin/south-town-tower/sky-signal pins with central park tower, surrounding journey-ordered halls and no signal lot. Keep clearance, district, growth and all four control assertions. |
| same | R-3174 journey, renamed `request journey frames fourteen narrated chapters` | Replace inserted component visits and street-walk targets with exactly fourteen narrated keyframes, continuous reduced-motion interpolation and corner framing at both widths. |
| same | R-3175 gestures | Only its source-wiring assertion changes: no `location.hash` assignment; require `history.pushState`. Native hash jumps no longer drive navigation. Gesture reducer assertions remain unchanged. |
| same | **new** R-3174 `scroll position maps to continuous stage without short-input dead zones` | Pin clamps, 1 px motion, forty 100 px ticks, five 60 px increments, logarithmic distance and a distant-travel pull-back. |
| same | **new** R-3174 `motion clocks pin idle and distance-scaled flight limits` | Pin idle 400 ms, flights 1600–4200 ms and opening 4000 ms. |
| same | **new** R-3172 `dense town scale retains chosen lot and housing dimensions` | Pin the new density configuration object. |
| `packages/nana-pack/tests/hive-page.test.mjs` | R-3126 rail/card | The plain library chapter is now “The way back”; assert its supplied narration. Existing component metaphor/data assertions remain, in Technical. |
| `packages/nana-pack/tests/hive-assets.test.mjs` | R-3134 sealed defaults | Retune overview elevation from 1.35 to 0.8 and local street width from 0.7 to 1.0. Other pins stay unchanged. |

The gesture script adds the three requested checks, for nine total. Its flight check switches to normal motion and verifies the destination is not reached immediately. Pixel probes now sample five entry-facing ring segments; the former evenly distributed set included a street hidden behind the theater. The assertions still measure actual street/ground pixels, with the same margin.

## Red runs and mutation pairs

`build-9-wrong-scroll.txt`, `build-9-wrong-clocks.txt`, `build-9-wrong-density.txt`, `build-9-wrong-plaza.txt` and `build-9-wrong-gestures.txt` record the initial reds. The new short-input gesture cases fail on the old browser implementation.

Process departure: the three new unit cases first failed on missing exports, not substantive wrong implementations. Later external-copy mutations provide substantive proof, but do not repair that chronology. Additional log-distance assertions were added after the blend existed. Assertions were never inverted and no repository file was mutated for this proof.

| Actual cited case | Broken code in temporary app copy | Original → mutant → restored exit |
|---|---|---|
| R-3174 continuous stage | Round scroll stage to integers | 0 → 1 → 0 |
| same | Replace logarithmic/bumped distance with a linear blend | 0 → 1 → 0 |
| R-3174 motion clocks | Change idle clock to 4000 ms | 0 → 1 → 0 |
| R-3172 density pin | Restore token-sized footprint factor | 0 → 1 → 0 |

`build-9-mutations.txt` records these runs of the extracted, unchanged case bodies, each awaited under a per-case limit. The final full suite exercises the original complete test files.

## Visual evidence and own spec judgement

Real audit source: `/tmp/nana-world-9-audit.json`, generated by `node scripts/component-audit.mjs --out /tmp/nana-world-9-audit.json`. It is the real repository audit, not the frozen fixture. The acceptance server serves a publisher-created OS-temporary app copy.

- Final screenshots: `/tmp/nana-world-9-round3/{00,01,02,05,08,13,explore}/`. Every folder contains `page-380.png` and `page-1280.png`, the reference copy and the spec. `build-9-browser.txt` separately confirms WebGL for all fourteen served views; no pixel fallback is accepted.
- Frames: `/tmp/nana-world-9-frames/`. Eight opening frames span stage times 0, .143, .286, .429, .572, .715, .858 and 1. A controlled browser clock prevents screenshot/GPU stalls from skipping the plan. Eight ordinary slow-scroll frames span stages 2, 2.42, 2.86, 3.28, 3.72, 4.14, 4.58 and 5; the browser clock is not controlled for this strip. `manifest.json` records poses.
- Gestures: `/tmp/nana-world-9-gestures-final/gesture-380.png`; **9 passed, 0 failed**. All forty wheel stages advance exactly .1 to stage 4. Five short swipes change the camera; the mid-scroll picker flies and lands. Full-tour measured card overlap is 0.0000 at every chapter.
- Earlier overview trial: `/tmp/nana-world-9-round1/13/`. Housing initially extended beyond the named-place camera bounds. The final overview includes those bounds. Final art judgement follows, without a model judge. The reference folder was only read.

Every final screenshot invocation uses `node scripts/first-look.mjs --page url --hive --after <served still/hash URL> --reference /private/tmp/nana-3dmk-ref --spec docs/reviews/world-graph-2026-10-30/world-art-spec.md --out <outside-git chapter folder>` and exits 0. `build-9-first-look.txt` records each exit.

| Spec | Own verdict | Evidence |
|---|---|---|
| 1 | PASS | Full-viewport scene with overlaid text, not an inset canvas. |
| 2 | FAIL | Close views show architecture and crews; the phone overview still reduces named park places to small objects. Housing density alone does not meet the reference's readable massing. |
| 3 | PASS | Pale forms and streets, neutral houses, grey ground and ink detail. |
| 4 | PASS | Fourteen numbered labels/picker entries, clear hierarchy, no raw-path dump in Plain. |
| 5 | PASS | One frosted card; measured active-place/card overlap stays zero across the phone tour. |
| 6 | PASS | The same scene/card composition at 380 px, not a stacked column. |
| 7a | PASS | Tower on the open central park plaza, halls inside the outer fence, town belt outside, one northern gate/customs/freight route. |
| 7b | PASS | Varied hall bearings/radii, occupied central plaza and uneven named town locations. Historical lattice, oval, grid-park and ring-park controls remain rejected by the geometry test. |
| 8 | PASS | Matching numbered title/label and close place framing; a street or dashed pulse leads into the view. |
| 9 | PASS | Phone Explore keeps the whole city, outlines selection and darkens its incident streets; Enter and Back to tour remain explicit. |
| 10 | FAIL | Complete dark forms and workers exist, but both window states are not clearly readable together in the whole-city phone frame. |

## Precedent and departures

All twelve named Precedent files were read before design. No private helper was copied or moved. Camera/tour reuse `focus`, `overview` and exported `blendPose`; the scene imports shared parts and `segmentDistance` instead of copying their implementations. City handoffs continue using the existing exported `pathBetween`.

- Required change from the former tour: remove inserted visits and street-following camera targets. Fourteen narrated steps and direct fractional keyframe blends replace them, as the owner's new script and navigation grammar require. Side places remain in Explore.
- Scene-transform placement departure: worker animation lives in exported `animateHive` in `assets/hive.mjs`, not in resident geometry. This preserves `buildResident` as a pure explicit-THREE builder and lets the assembly own road packets, broadcast rings and local worker transforms together.
- Housing placement departure: unnamed houses use the shared box kit directly in the scene assembly rather than `buildDistrict`, so they acquire no component identity, audit status or selectable name.
- Pixel-plan extension adds a line-only drawing of existing lot/street coordinates while preserving the fallback's existing cells. It does not copy a projection helper from another module.
- The gesture script retains its prior six checks and extends them. Its entry-facing pixel probe selection is narrower because a named front building physically occludes one old sample; no luminance assertion was weakened.

## Commands, gates and remaining work

Long outputs are committed in this folder as `build-9-*.txt`; home/repository prefixes are redacted without changing assertions, counts or exits. Initial red exits are 1; restored pairs and final targeted checks exit 0. The final worker response gives the locked-suite summary, exact commit, post-commit seat checks and finished CI run.

Already green (exit 0): targeted hive/capture/map-launch tests; seven first-look invocations; the extended gesture check; browser renderer/skip checks; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --root .`; `node scripts/known-bugs.mjs --root .`; `node scripts/identity-scan.mjs`; evidence-title check (0 missing). `build-9-class.txt` reports ordinary. The locked full suite runs in the foreground under its one machine lock before the build commit. The writing check exits 0 with advisories; they remain because this technical worker record must carry the brief's VERDICT line, paths, row IDs and exact test titles.

Known-bug contact: the supplied CABINET/rail/label area changes because side visits leave the Plain tour and labels follow the current chapter; no general clipping closure is claimed. The pixel-fallback readiness risk remains in first-look, so all final views are separately checked as WebGL. The known folder-part activity semantics and full-history test dependence remain untouched. No other supplied known bug is fixed, and no known-bug file is edited.

Not done: reference-art acceptance (spec 2 and 10); substantive wrong-code-first chronology for the three new unit cases; independent review (model sessions were forbidden). CI is reported after the new tip finishes. No open product decision was invented or posted.
