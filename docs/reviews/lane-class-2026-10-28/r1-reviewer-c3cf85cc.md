# Review: lane-class, final round (`f6604431..fc963583`)

The lane's own tests pass (10/10), and on this machine the script classifies its own diff as `ordinary` in about 0.25 s. pi-worker keeps the build's exit code, and it prints nothing in a tree that lacks the script; the build-records last-line check would catch a stray class line. But the script prints `ordinary` for libraries that install, uninstall, doctor and the land and review tools import directly. That is exactly the miss the brief asks about first, and it happens on a lane that has already landed.

## MUST

**M1. A library that install or doctor code imports directly prints `ordinary`.**

- **Where:** `scripts/lane-class.mjs`, in the import-hop loop of `classify()`, around lines 56–71.
- **Cause:** the one-hop check only treats three kinds of caller as a trigger:
  - extension and Claude hook modules;
  - the five launched CLIs;
  - the four tool roots, and only when every caller is a tool root.

  A caller that is itself install code (`packages/nana-setup/bin/`, `packages/nana-setup/lib/`) or a gate policy file never triggers.
- **Realistic input:** the landed lane realpath-strict-fallback (`c203f485...215cd600`, code files only). Running `node scripts/lane-class.mjs --root . --files packages/nana-pack/lib/real-path.mjs,…` prints `ordinary` plus seven also-reaches lines.
  - Its own plan, plan attack, must-meet and review briefs all classed it install, hook or gate.
  - The change altered how nana-setup doctor, uninstall and stale-copies behave, and how nana-land, pi-review and review-round behave.
  - `real-path.mjs` is imported directly by `nana-setup/lib/{doctor,uninstall,steps,settings,paths,hook-health,stale-copies}.mjs`, by three gate policy files, and by `nana-land.mjs`, `pi-review.mjs` and `review-round.mjs`.
- **Same gap elsewhere:** I scanned every mapped module that a sealed install or gate file imports directly. Seven of them print `ordinary`:
  - `real-path.mjs`
  - `json-text.mjs` (doctor, steps, project)
  - `objective-path.mjs` (paths, steps)
  - `release-status.mjs` (doctor)
  - `rename-retry.mjs` (project)
  - `worker-config.mjs`
  - `pi-watchdog.mjs`
- **Consequence:** AGENTS.md now says "the lane class is what `node scripts/lane-class.mjs` prints". So the next change to one of these files gets the ordinary review ladder. It would have no land reviewer, no wrong-code pairs, no independent check and no local install check, even though it changes what install, uninstall, doctor and the land tool run.

  This applies today's definition ("changes nana-setup install, uninstall or doctor … or the land and review tools"). It does not widen it, so it is not the question the owner holds in issue 242.
- **Fix:** make the files under `nana-setup/bin/`, `nana-setup/lib/` and the five gate policy files hop sources too. A direct importer would then print `install` or `gate`, as extension importers print `hook`. Add `real-path.mjs` (importer `packages/nana-setup/lib/doctor.mjs` or similar) as a case under R-2963, and widen that row's sentence to match. The shared-tool clause can stay as it is: `real-path.mjs` would print `install` through its setup importers, whatever the tool-root rule says.

## SHOULD

- **S1.** R-2966's test only matches strings in `pi-worker.mjs`'s source. No test runs a class child that fails or times out and then checks pi-worker's exit code. The code looks right (try/catch, no reassignment, `process.exit(exit)` last), but the clause "preserve the build exit code on class failure or timeout" is pinned by wording, not by behaviour.
- **S2.** The also-reaches line names only `toolCallers[0]` from the direct hop. For `agent-dir.mjs` it prints `hook: … nana-roster-notice.ts` plus `also reaches … claude-review.mjs`, which is fine. But a shared tool dependency never names any install or gate importers it also has, so the also-reaches lines miss the most useful signal.

## NOTE

- **N1.** pi-worker passes the literal `'--base', 'main'` and `maxBuffer: 1024 * 1024` inline. The script already defaults to `LANE_CLASS_BASE`, so the `--base` argument could be dropped, or the name imported. That would satisfy the no-inline-tunables rule.
- **N2.** `norm()` removes the leading `./` twice; the second `.replace(/^\.\//, "")` does nothing after the first.
- **N3.** The import hop reads the code map, so a build that adds a new import and has not yet regenerated the map classifies against the old graph. `map:check` at land limits the damage, but the class line pi-worker prints after the build can be stale.
- **N4.** I confirmed that lifting `collectChangedPaths` out of blast-radius keeps its error messages and exit-1 behaviour byte for byte. The planner-prompt wording fixes and their tightened checks are fine, and so is the AGENTS.md sentence with its R-2969 pin. The three FEAT-029 known-bug lines are accurate.

VERDICT: SEND-BACK
