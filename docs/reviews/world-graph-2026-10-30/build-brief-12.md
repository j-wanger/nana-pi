Feature: FEAT-039 · See the product and its decisions in one report

Lane world-graph. Class: ordinary. Builder: pi-worker (larger lane). Build session 12, on 3961ff90.

The owner on build 11: "Its a lot better, the scale of cargos need to be adjusted, and worker actions and moving mechanisms would make the building and the city more lively". Keep everything build 11 does. This build is scale and life.

## 1. One scale for cargo, people and buildings

The cargo boxes on the trays are out of scale with the workers and the trays: in the drafting-office frame they read as large black blocks. Set one scale and keep to it everywhere:
- A worker is the unit: 1.8 tall. A cargo crate is one a worker can carry: about 0.5 on a side, mid grey with an ink outline, not solid black. The request's packet is the same crate with a light on top, so it can be followed.
- A tray lane holds one crate with clearance: crate width about 40 percent of the lane.
- Crates on the raised ring and on the freight road ride on small flat carts or pallets, not floating.
- Define the sizes once in the config, derived from the worker height, and pin the ratios with one test (crate to worker, crate to lane).

## 2. Mechanisms that move

Each named place gets one moving mechanism that shows its job, built from the shared parts in the buildings' language. Under `?still` or reduced motion, each holds one clear position.

| Place | Mechanism |
| --- | --- |
| Reception tower | The dish turns toward each falling pulse; a small lift carries the crate down the stem |
| Drafting office | A sheet feeder moves the plan from the planner's table to the adversary's and back |
| Dispatch yard | A gantry crane lifts a waiting crate onto the tray toward a free bay |
| Workshop bays | A jib crane swings crates in; the bay's frame rises a step each loop |
| Inspection | A turntable turns the crate under the viewing frame |
| Review ladder | A small lift runs up the ladder; a stamp arm comes down at the top |
| Land gate | The gate's two leaves swing open only when the crate arrives with its stamp |
| Customs | A barrier arm lifts; a scanner arch lights as the crate passes |
| Freight road | Trucks carry crates out and return empty |
| Library theater | The projector reel turns; broadcast rings leave the roof |
| Courthouse | A clock face turns slowly |
| Utilities | A water tower and pipes, with a slowly turning wheel |

Dark (future) buildings have no moving parts.

## 3. Workers who do things you can see

At the chapter's camera distance, a reader must see each place's workers doing their job. Scale workers so they read at chapter distance (keep the 1.8 unit; move the chapter cameras closer if needed, and check the phone band from brief 11 still holds).
- Workers walk: builders walk between the yard and the bays carrying crates; a runner carries the sheet from the drafting office to the yard; reviewers climb.
- Each action is a short loop of two to four poses with the limbs moving: carrying, climbing, stamping, turning a wheel, lifting a barrier.
- Workers never walk through buildings, float or overlap. They keep to trays and lots.
- Add a few residents in the town: people walking along the local trays between houses, so the town is alive too, at a lower density than the park.

## Show your work

As brief 11, plus: for each of chapters 02 to 10, a strip of four frames 0.5 s apart at the chapter's midpoint, at 1280 px, showing the mechanism and the workers moving. Your own pass or fail per spec line, over up to three rounds. The gesture check at 390 px. Check frame rate: report the median frame time over 10 s of the whole-city view at 1280 px in the headless browser; keep it under 33 ms, and reduce instance counts or use instancing if not. No model sessions. Never write into `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`. Locked full suite in the foreground.

## Done when

Amended rows `implemented` with backticked `file::title` evidence. Green: locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs`. Push and report the finished CI run for the new tip. A Windows R-3104 timeout is a known flake: rerun the failed job once.

Report: the frame folders; the spec table; the gesture result; the frame time; every row and test changed; each departure from the Precedent.

## Precedent

- `apps/hive/config.mjs`: worker and cargo sizes.
- `apps/hive/assets/road.mjs`: tray traffic.
- `apps/hive/assets/hive.mjs`: the request packet.
- `apps/hive/assets/residents.mjs`: the figure kit and its work loops.
- `apps/hive/assets/district.mjs`: buildings that gain mechanisms.
- `apps/hive/assets/parts.mjs`: shared parts for cranes, arms and wheels.
- `apps/hive/main.mjs`: the animation clock and still mode.
- `scripts/hive-gesture-check.mjs`: the gesture check.
