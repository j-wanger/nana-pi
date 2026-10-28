Feature: FEAT-002 · Resume decisions and next actions

Lane issues-home. Class: install, hook or gate (`node scripts/lane-class.mjs` is not on main yet; the plan's own call). Builder: pi-worker (larger lane). Build session 1.

Work in the lane worktree on feat/issues-home. The seat merged main at f6604431 (merge a5006ce5) before this build. The plan of record is `docs/reviews/issues-home-2026-10-28/plan.md`. Read it whole, and read `plan-attack.md` beside it for the reasons behind each must-meet. The plan has no list of allowed edits; its test forecast is a forecast, not a limit.

What the lane does, in one sentence: a project whose HANDOFF points to its GitHub issues gets its open asks and next items listed at session start, read by one bounded gh call, and every other project gets today's block byte for byte.

## What the seat already did

- The labels `ask`, `next`, `optional`, `blocking` and `parked` exist on github.com/j-wanger/nana-pi.
- The seat opened 26 ask issues, 3 next issues and one pinned known-bugs issue, each through `countIdentityWords` first.
- The seat committed the HANDOFF pointer paragraphs on this branch at 40b29673. Must-meet 8 checks the real HANDOFF; do not edit those paragraphs.
- The seat timed the pinned argv against the real repo: on 2026-10-28, with 30 open issues, 15 calls each in CI run 40693949252 (scratch branch, deleted) and 12 on this Mac. Warm calls: median 0.56 s (Linux), 0.61 s (macOS CI), 0.62 s (Windows), 0.50 s (this Mac); warm maximum 0.90 s (Windows). The first, cold call took 1.27 s (Linux), 1.31 s (macOS CI) and 6.39 s (Windows). Seal the read limit at 1500 ms and the write reserve at 250 ms, with that measurement as provenance. 1,500 ms is chosen: it covers the warm maximum with a 1.6-times margin and the cold call on macOS and Linux, and stays inside the producer's 2,500 ms launcher limit. A cold Windows start prints the timeout line; that is accepted. 250 ms is chosen for the render and the write after gh returns. Seal the fetch cap at 100, chosen: three times the migrated set.

## Build

Build must-meet 1 to 9, one pin per sealed tunable (read limit, write reserve, fetch cap), and the plan's "Also in this change" items. New requirement rows take IDs R-2970 to R-2979. Must-meet 9's row sits in FEAT-028 beside R-2781, a named departure from one feature per lane.

Run the locked full suite as a plain foreground command with its output on screen, not redirected to a file and not in the background. Another lane's suite may hold the machine-wide lock; waiting for it is expected.

No test may call the network. Every gh call in a test goes through the command seam that moves into `packages/nana-pack/lib/gh-runner.mjs`.

This lane touches nana-setup and a hook, so run `node packages/nana-setup/bin/install-check.mjs` once locally before your report.

## Done when

Each row is `implemented` with backticked `file::title` evidence, and the locked full suite (`npm run test:locked`), `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check, `node scripts/identity-scan.mjs` and the local install check are green.

Report: each must-meet's test title; each sealed tunable with its provenance line; the exact session-start block this repo prints with gh working, and with gh absent; each departure from the Precedent below with its reason; every existing test you changed and whether the forecast named it.

## Precedent

- `packages/nana-pack/lib/frontier-summary.mjs:42-101`: the frontier block (render, priority fill, caps, role check).
- `packages/nana-pack/bin/nana-frontier-summary.mjs:14-38`: the producer CLI, which fails open with one line.
- `packages/nana-setup/lib/hook-producer.mjs:23-62`: the launcher. It computes each producer's limit at `:59` and passes it to `spawnSync` at `:62`. The launcher appends the limit it computed, `--limit-ms <limit>`, to each producer that opts in.
- `packages/nana-pack/bin/nana-land.mjs:30-46`: `ghEnvironment` and `ghDefault`. Both move to `packages/nana-pack/lib/gh-runner.mjs`, which takes no default timeout. nana-land re-exports `ghDefault`, so its three callers keep working: nana-land, `scripts/ci-records.mjs:14` and the land tests. This is a named move under the 2026-10-22 second-caller ruling.
- `scripts/ci-records.mjs:19-30, :44-67`: `ghFromEnvironment`, the command seam that every OS can use, and `ghResult`, whose result classes these are. Both move into gh-runner.mjs, as named moves, and gain a timeout class.
- `packages/nana-pack/tests/ci-records.test.mjs:89-94`: a fake gh run through the command seam, which works on all three OSes.
- `packages/nana-pack/tests/known-bugs.test.mjs:41-58`: R-2505, a section that holds a pointer and no list item.
- `scripts/identity-scan.mjs:77-82` and `:147-184`: `countIdentityWords` and the CLI's exit codes. The CLI gains `--stdin`.
- `packages/nana-pack/tests/hook-deadlines.test.mjs`: R-2672's late-start preload, which the end-to-end time-limit test reuses.
- `packages/nana-setup/claude/rules/nana-soul.md:37` and `templates/_shared/working-under-nana-pi.md`: the open-question rule. R-682 pins it at `templates-render.test.mjs:531`, and R-859 at `:436` requires the AGENTS.md region to match byte for byte.
- `packages/nana-pack/tests/product-report.test.mjs:39-47, :225, :284`: the test copies the real HANDOFF. Its fixture appends one well-formed ask, as `:365-380` already does.
- `scripts/deliverables.mjs:25, :53-64, :197`: MAKER_RUNS, the sealed ARTIFACT_CLASSES and ARTIFACT_LOCATION_SHAPES (approved 2026-10-24), and the parse that refuses an unknown class. R-2781 (`REQUIREMENTS.md:2301`, FEAT-028) pins them.
- `REQUIREMENTS.md:489`: an `Artifact:` line with a manual maker, the form for the issue set's line.

## Outside precedent

- GitHub's own CLI issue listing, with its author filter, JSON output and fetch limit.
