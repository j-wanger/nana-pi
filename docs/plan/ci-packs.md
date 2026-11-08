# Plan: ci-packs

Feature: FEAT-031 · Run checks reliably and without contaminating work

## Purpose

The owner, 2026-11-07: "I want to cut down the tests numbers in nana-pi further, I think theres still way too many machinery tests that really doesn't deserve to be kept for every land run, use workflow to analyze them and group into categories, we need different test packs similar to the data pack". A seat workflow classified all 306 test files (5,740 cases) into packs; its design is `docs/plan/ci-packs/design.md`, its membership `docs/plan/ci-packs/packs.json`, and an independent critic's corrections `docs/plan/ci-packs/critic.md`. This lane makes the test runner and CI run packs instead of the whole suite. Retiring the retire pack's files is a later lane; nothing is deleted here.

Today every lane push runs the whole suite (about 768 s wall on macOS). After this lane a lane push runs the land pack plus the module files its diff can reach (estimate 38 s with no module hit; measure on the first ten lanes); a push to main runs land, main and module on all three platforms.

## Assumptions

- A1. Packs: `land` (every lane and main), `module` (lane: only files the diff can reach; main: whole), `main` (main only), `release` (lanes that touch templates, `copier.yml` or `packages/nana-setup/`, and `npm run release`), `manual` (the `.e2e.mjs` files, which CI never ran; critic C1), and `retire` (kept running in `main` until the retire lanes delete them, so no check silently stops here).
- A2. Seat call, 2026-11-07: no nightly job. Main runs land, main and module after each land, all platforms; Windows already runs on main only (win-shards).
- A3. The critic's corrections apply: A1 (claude-review launch and refusal cases to land), A2 (the real-repo HANDOFF, frontier and known-bug cases to land), A3 (split the six core cases out of slow files into small land files in this lane), C2 (selection uses `addLaunchLinks` and `blindReach`, not `untracedTests` counts), C3 (watch glob for files read as text). B1–B8 belong to the retire lanes.
- A4. PR CI: macOS only, plus the `install-check` job as today. The Ubuntu leg leaves PRs (it is advisory and never blocked); it stays on main. A concurrency group cancels a superseded PR run; main runs are never cancelled.
- A5. nana-land's darwin suite proof (R-3825) holds: a lane's macOS pack run is its suite record.
- A6. One reviewer plus CI. This lane changes the CI workflow and the test runner, so nana-land runs the local suite at its land, by design.

## Open choices

- O1. Builder decides how the pack config stores membership (per path, per folder default plus overrides), following `packages/nana-pack/lib/test-runner-config.mjs`.
- O2. Builder decides how a pack-run suite record names its packs and selection, so nana-land can check it.

## Questions for the owner

None.

## Threat model

Honest variation in lane diffs, the code map's reach, runner speed and platforms. A builder or reviewer forging a suite record is out.

## Precedent

- `scripts/test.mjs`: the runner that gains `--pack` and `--changed-from`.
- `packages/nana-pack/lib/test-runner-config.mjs`: `RUN_ALONE`, the shape for the pack config.
- `packages/nana-pack/lib/windows-skips-config.mjs`: path to reason, frozen, with provenance.
- `scripts/code-map.mjs`: `buildGraph` and `impact` for selection.
- `scripts/code-map-launch.mjs`: `addLaunchLinks` and blind reach.
- `packages/nana-pack/lib/land-ci.mjs`: `proveCiSuite`, which today refuses any filtered record.
- `packages/nana-pack/lib/land-config.mjs`: `SUITE_FALLBACK_PATHS` and `CI_ADVISORY_RULE`.
- `.github/workflows/ci.yml`: the suite job to change.
- `packages/nana-pack/tests/ci-workflow.test.mjs`: the workflow pins to update.

## Outside precedent

The builder checks how one widely used runner selects affected tests (for example Jest `--changedSince` or Nx affected) and notes adopt, borrow or skip.

## Must-meet

- M1 (every file in one pack). Every test file the runner collects belongs to exactly one pack; a new test file with no pack fails the land pack, naming the file.
- M2 (pack run). `npm test -- --pack=land` runs exactly the land files; `--pack=land,module --changed-from=<ref>` runs the land files plus every module file the diff reaches (an importer or launcher of a changed module, a changed test file, a blind-reach test, or a watch-glob hit), and prints each selected module file with its reason.
- M3 (fail-safe). When the diff cannot be read, the graph throws, or the diff touches the runner, the pack config, `package.json` or `code-map.config.json`, the module pack runs whole and the output says why.
- M4 (CI shape). A PR run executes land plus selected module (plus release when a release path changed) on macOS only, and a superseded PR run is cancelled; a push to main runs land, main and module on macOS, Windows and Linux, and is never cancelled.
- M5 (land accepts packs, refuses gaps). nana-land accepts a lane's macOS pack-run record that includes the land pack and its module selection, and still refuses a filtered record that is not a pack run or omits the land pack.
- M6 (core guards on every lane). Each core capability in `design.md` section 2, including the critic's A1–A3 moves, has at least one case in the land pack; moving a case keeps its `req:` marker and assertion unchanged.
- M7 (sealed config). The pack config's watch globs and fail-safe paths carry provenance and are pinned by one test naming its row.
