Feature: FEAT-039 · See the product and its decisions in one report

Lane world-graph. Class: ordinary. Builder: pi-worker (larger lane). Build session 8, on bc74f5da.

Build 7 stopped BLOCKED, rightly, on private helpers. The seat authorizes these moves:
- Move `box`, `drum` and `hoop` out of `buildHive` in `apps/hive/assets/hive.mjs` into `apps/hive/assets/parts.mjs` as named exports. Pass in what they read from the closure today (the materials) as a parameter. `hive.mjs` and the new `apps/hive/assets/district.mjs` both import them.
- Any other private helper in a file the plan's Precedent names may move to a shared module the same way. Report each move.

The seat grepped every precedent file for helpers defined inside a function. Only these three and `tour.mjs`'s `pathBetween` exist, and `tour.mjs` is kept, so `pathBetween` can stay.

Everything else is build brief 6 and 7 unchanged: build the city to plan revision 3 (the fixture count is 19), with brief 6's Show your work, Done when and Report sections.

## Precedent

- `apps/hive/assets/hive.mjs`: `box`, `drum` and `hoop`, moved to `parts.mjs`.
- `apps/hive/assets/parts.mjs`: the shared parts module that receives them.
- `apps/hive/tour.mjs`: the tour mechanics, kept.
- `apps/hive/camera.mjs`: framing and the Enter-only camera.
- `apps/hive/assets/road.mjs`: street ribbons, made pale with kerbs.
- `apps/hive/assets/materials.mjs`: lit and dark window materials.
- `apps/hive/assets/bee.mjs`: resident figures.
- `apps/hive/layout.mjs`: slot arithmetic to start the radial placement from.
- `scripts/hive-gesture-check.mjs`: the gesture check to extend.
- `scripts/hive-page.mjs`: the server that gains `--layout`.
