# Plan attack 3: world-graph, revision 3 (the city)

Adversary, 2026-10-30, against `plan.md` revision 3 and `world-art-spec.md` at tip `b452f8be`. Threat model as the plan states it: honest variation in, forgery out. Eight findings, ranked by how likely each lets build 6 pass every check and still show the owner a wrong shape.

## 1. MUST: the visual negative control passes vacuously, so it cannot tell a wrong shape from a missing label

Line 7 now names a fenced park, a reception tower, a customs post, a gate and customer towns. Neither control (main's grid, build 5's oval) has any of them, so line 7 fails both on vocabulary alone. It would also fail a blank page. The revision-1 record shows the same failure mode: control 1 failed line 7 partly for "no 01–09 numbers", not for rows (`control-verdicts.md`). A pass on the controls therefore says nothing about the two clauses that matter: "not in rows and columns" and "not evenly around one oval with an empty middle". Build 6 can draw every named object in a grid inside a circle, and line 7's shape clauses are never exercised against a near-miss.

How a build passes and fails the owner: it labels a fence, a tower and customs, lays the park out as a 3x3 block, and visual-reader passes line 7 because every noun is present.

Fix:
- Split line 7 into 7a (the parts are present: fence with one gate, tower outside it, customs, customer towns) and 7b (the arrangement: "the park's halls stand at different distances and bearings from a central yard; they do not form a rectangular block, and the town does not form an even ring around an empty middle"). Visual-reader reports each.
- Run the control a second time after build 6, before the shape gate: render the build's own city through a test-only layout override (`?layout=` or a `--layout` flag on `hive-page --serve` that is refused outside `--serve`). Use two near-miss layouts: (a) the park lots on a rectangular grid inside the fence; (b) all park lots on one even circle with an empty yard. Line 7b must FAIL both and PASS the real build. Record in `control-verdicts.md` under "Revision 3 near-miss controls".
- The pre-build control on main and build 5 stays, but is required to fail 7b, not just 7.

## 2. MUST: the row-limit shape check contradicts the plan's own avenue, so it cannot catch a grid park

A8 puts the avenue through tower, entry, drafting office, yard, inspection, ladder, land gate, customs, freight terminal and customer towns. A4 puts all of them south or north of the origin. That is about nine lot centres on one straight line, by design. So the sealed row limit must be at least nine for the real city to pass `cityShapeProblems`. At nine, a park drawn as a 3x3 or 4x3 grid inside the fence has at most four centres per line and passes. The oval control fails on "town lot inside the park's enclosing circle", which only uses district labels, so it says nothing about a two-ring layout either: park lots evenly on one circle, town lots evenly on a larger one, passes every R-3172 pin.

How a build passes and fails the owner: it keeps `settle`'s slot arithmetic, emits park slots as a small grid or an even ring, fences it, and every R-3172 pin is green.

Fix:
- Replace "more than the sealed row limit of lot centres on one line" with a lattice rule: "at most one family of parallel lines that each hold three or more lot centres at even spacing, not counting lines through the origin". A grid has two families; the avenue is one line through the origin.
- Add a ring rule for the park: "park lot centres span at least the sealed number of distinct radius bands from the yard" (spokes give varied radii; an even ring gives one).
- Extend `hive-city-controls.json` from two to four controls: main's grid, build 5's oval, a grid park inside the fence, and a one-ring park. Add a positive control: the real city, which must return no problem. Each control names the one problem it must trigger.

## 3. MUST: the five-component fixture cannot satisfy the plan's pins against the tracked `city.json`

The fixture holds `workshop`, `library`, `key-cabinet`, `review-hall` and `land-gate`. The tracked plan places all 23 audited components, including `queue` (the origin yard) and `compass` (the tower). Run against the fixture, `checkCityPlan(plan, components)` sees 18 plan components the audit lacks. If that is "an unknown component", the fixture's `prepare` returns an error (R-3127), contradicting must-meet 1's "returns a scene with no error". If it is tolerated, the threat model's in-scope case "the plan names an ID the audit dropped" is silently accepted. R-3172 also pins "the dispatch yard is at the origin" and "the tower south" on the fixture, where neither component exists. "Adding a park lot to the fixture plan" implies a second plan the plan never declares.

How a build passes and fails the owner: it writes a private fixture plan that places only the five, so every fixture pin passes on a toy city, and the real-plan drift path (audit drops a component) is never exercised.

Fix: state the rule in A2 and must-meet 1. A place whose component is missing from the audit still stands, dark, with the label "Not in audit". `checkCityPlan` returns a named line for it. The tracked-tree test fails on that line; the fixture test asserts it appears 18 times and that `prepare` still returns a scene. One plan only: no fixture plan. The "grows the fence" pin adds a place to a copy of the tracked plan in the test.

## 4. MUST: "pale streets" and "every lot fronts a street" are measured on data and material constants, not on what the page draws

R-3173's frontage and fence pins run on `city.mjs`'s street list. Nothing pins that `buildHive` draws those streets and lots at those positions. "Lighter than `HIVE_BACKGROUND`" compares a material's base colour to a page constant. The ground mesh may not use that colour, and a pale material in shadow under the scene light can render darker than the lit ground. The owner's complaint "lines which are rows are too solid" was about visual weight. A pale avenue 3.6 units wide still reads as a solid band, and no pin caps width.

How a build passes and fails the owner: `layout()` returns the right positions while `buildHive` keeps an old placement path or a different road list, and the streets render as wide grey bands.

Fix:
- In R-3173, pin from the built scene: every pickable lot's world position equals its `city.mjs` position after rounding, and the street meshes match the layout's street segments one to one by endpoints.
- Compare street colour to the ground mesh's own material, not `HIVE_BACKGROUND`.
- Seal a street width cap as a fraction of the median lot width, separately for avenue and local street.
- In first-look's overview capture, add a pixel probe. Project five points on street centrelines and five on ground beside them. Assert the street pixels are lighter by a sealed luminance margin. This makes "pale" a page fact, not a data fact.

## 5. SHOULD: R-3173's one-exit rule contradicts A8's findings footpath, and frontage is distance only

A8 draws a dashed ground back road "findings from the park to the theater". The theater is in the town, so that footpath crosses the fence. R-3173 says no ground road crosses the fence except at the entry and the land gate. The builder will resolve this silently: a third crossing, an air leg, or a detour through the land gate onto the freight road, which makes findings look like shipped work. Separately, "within the sealed frontage of a street centre line" holds for a park lot near the fence that sits beside the town ring street across the fence. The lot "fronts" a street it cannot reach.

How a build passes and fails the owner: it passes the fence count by drawing findings as an air arc, and a park hall counts the outside ring street as its frontage.

Fix: in A8, say findings leave by the entry gate, as a back road beside the avenue, then turn onto the ring street to the theater. Frontage is measured from each lot's gatehouse point, the door in the lot kit. The nearest street must be in the same district or be the avenue, and the door normal must face it within a sealed angle.

## 6. SHOULD: the tour's visits drag the camera out of the park eleven times, and no check proves the journey reads in order on a phone

A11 puts town lots as visits inside park steps: courthouse and style desk at 02, survey office at 05, control room at 06, utilities, billboard and stage at 10. Must-meet 4 makes the camera follow a drawn street between consecutive anchors, sub-chapters included. So the request's camera walks from the bays out through the entry to the survey office on the ring and back. A stranger sees the request go to town and back, which the journey does not say. On a phone this means about 25 screens, with most hops being side trips. The phone evidence is three hash jumps in first-look and three ids in the gesture check. Nothing scrolls the whole tour at 380 px and checks the order. Nothing checks that the card leaves the framed place visible.

How a build passes and fails the owner: every pose frames its place, every between-anchor point sits on a street, and the phone shows a zigzag with the card covering half the framed lot.

Fix:
- Visits keep their step's anchor. They outline the visit lot and, at most, pull back to frame both the step and the visit. The street-following pin applies only between journey steps.
- In `hive-gesture-check.mjs`, add a fifth check at 380 px. Scroll top to bottom, record `data-hive-chapter` at each settle, and assert the sequence equals `tour()`'s order with no skips. At each step's anchor, the projected place box overlaps the card's rect by no more than a sealed fraction.

## 7. SHOULD: deleting the graph code breaks more than the plan's impact list names

Grep on the tip:
- `apps/hive/assets/hive.mjs:14` imports `visibleRoads` from `../roads.mjs`. The impact list names only `graph.mjs`'s importers, and the tracked-tree search did not include `roads.mjs`.
- `apps/hive/main.mjs:13` also imports `roads.mjs`.
- The R-3174 test imports `segmentDistance` from `scripts/component-graph-layout.mjs`, as does the R-3173 test. Only `roundPosition` is named as a move. Under ruling 10-22 a second caller imports a helper, so the move of `segmentDistance` belongs in Precedent.
- The R-3175 test, which "moves unchanged", pins `NAVIGATION` with `roadWidths: { loop, spur, artifact, import, feature }` and `overviewClasses: ['loop', 'spur']`. Keeping it unchanged forces dead graph vocabulary to stay in `config.mjs`. The city's avenue, local, back and air widths would then live elsewhere or be tucked into `loop`/`spur`. Editing it breaks "unchanged".
- `tour.mjs`'s `pathBetween` filters roads by `loop` and `spur`. It is a rewrite, not precedent kept as-is.
- `apps/hive/README.md` lines 25 and 40 name `component-graph.mjs`. The readme check fails until they go.

`scripts/deliverables.mjs` and `component-audit.mjs` revert cleanly: only `component-graph.mjs` reads `paths` and `contains`.

Fix: add `hive.mjs` and `main.mjs` to the `roads.mjs` impact line. Name the `segmentDistance` move into `city.mjs`. Allow exactly one edit to the R-3175 test, the `NAVIGATION` deepEqual line, with road widths moved to a separately pinned `STREETS` entry keyed `avenue`, `local`, `back` and `air`.

## 8. SHOULD: lights can pass with no visible difference

The R-3177 test pins a "sealed light state" per status and the same mesh count lit and dark. A build can set a `userData.light` flag and give lit and dark lots the same white material. Mesh count holds and the flag test passes. In a white and grey daylight palette, "lights off" may not read at all. Spec line 10 then depends on visual-reader guessing.

Fix: pin a sealed minimum luminance contrast between the lit and dark window materials, with half-lit in between. Pin that a half-lit lot has a sealed fraction of its window meshes lit. Rewrite spec line 10 to need a lit and a dark building in the same frame, told apart by their windows.

## Summary

1. The visual controls fail on missing nouns, not shape. Split line 7 and add near-miss renders after build 6.
2. The avenue puts about nine centres on one line, so the row limit cannot catch a grid park. Use a lattice rule, a radius-band rule and four controls plus one positive control.
3. The five-component fixture contradicts the 23-place plan (no yard, no tower). Define the "Not in audit" dark place and keep one plan.
4. Pale streets and frontage are checked on data and constants. Pin the scene against the layout, cap street width, and add a pixel probe.
5. The findings footpath must cross the fence. Route it by the entry, and measure frontage from each lot's door.
6. Visits pull the camera into town eleven times. Pin visits to their step's anchor, and add a full 380 px scroll-order and card-overlap check.
7. Deletion misses `roads.mjs` importers, the `segmentDistance` move and the R-3175 `NAVIGATION` pin. Lights need a material contrast pin, not a flag (8).
