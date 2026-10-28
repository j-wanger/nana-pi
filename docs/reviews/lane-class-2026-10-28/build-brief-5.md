Feature: FEAT-029 · Navigate code and investigate impact

Lane lane-class. Class: ordinary. Builder: pi-worker (small lane). Build session 5.

The final reviewer sent build 4 back (`review-r1.md` beside this brief: one MUST, two SHOULD, four NOTE). Fix the MUST and the items below. Run the locked full suite as a plain foreground command with its output on screen, not redirected to a file and not in the background. Another lane's suite may hold the machine-wide lock; waiting for it is expected.

## 1. Install code and gate policy are hop sources too (the MUST)

The one-hop check in `scripts/lane-class.mjs` (`classify()`, around lines 56-71) triggers only on extension and Claude hook modules, the launched CLIs, and the four tool roots when they are a module's only callers. A module that install code or a gate policy file imports directly prints `ordinary`. Seven do today: `packages/nana-pack/lib/real-path.mjs`, `json-text.mjs`, `objective-path.mjs`, `release-status.mjs`, `rename-retry.mjs`, `worker-config.mjs` and `pi-watchdog.mjs`. The landed lane realpath-strict-fallback changed `real-path.mjs` and was rightly an install lane; the script calls it ordinary.

- Make every mapped module under `packages/nana-setup/bin/` and `packages/nana-setup/lib/` a hop source that prints `install`, and the five gate policy files hop sources that print `gate`, naming the importer, as extension importers print `hook`.
- Keep one deterministic choice when a module has importers of several kinds, and say in your report which you chose.
- Add `real-path.mjs` as a case under R-2963: it prints install or gate and names a nana-setup or gate importer. Widen R-2963's row sentence to name install files and gate policy files among the direct importers; keep it no wider than its checks.
- The shared-tool clause stays: a module that the land and review tools share with other code still prints `ordinary` plus an also-reaches line, unless an install, gate, hook or extension file imports it directly.

## 2. pi-worker keeps the build's exit code, by behaviour (SHOULD)

R-2966's check only matches strings in pi-worker's source. Add a check that runs pi-worker the way `build-records.test.mjs` already does, in a lane tree that carries the class script at HEAD but where the class run fails (for example a fixture repo with no `main` branch, so the script exits 1 with no merge base). Assert that pi-worker prints one class-unavailable reason after the build-end line and exits with the build's own code. Keep the source check for the timeout path if a real timeout cannot be forced cheaply, and say so.

## 3. Small items

- `packages/nana-pack/bin/pi-worker.mjs:393` passes `'--base', 'main'` and `maxBuffer: 1024 * 1024` inline. Drop `--base` (the script already defaults to `LANE_CLASS_BASE`) or import the name, and give the buffer a named, sealed value in `lane-class-config.mjs` with its provenance.
- `norm()` in `scripts/lane-class.mjs` strips a leading `./` twice; remove the second replace.

## Done when

The same checks as build brief 1. Report: the hop sources as now written; the R-2963 case's title and paths; the new R-2966 check's title; the class each of the seven modules above prints on its own; and the class each of the last ten landed lanes prints, with any change from build 4 and its reason.

## Precedent

- `scripts/lane-class.mjs:43-75`: `classify()` and its hop-start set, which this build widens.
- `packages/nana-pack/lib/lane-class-config.mjs`: `CLASS_PATHS`, whose install and gate entries become hop sources.
- `packages/nana-pack/tests/lane-class.test.mjs`: the R-2963 and R-2966 checks.
- `packages/nana-pack/tests/build-records.test.mjs`: how a test runs pi-worker with a fixture lane tree.
- `packages/nana-pack/bin/pi-worker.mjs:385-400`: the class call after the build-end line.
