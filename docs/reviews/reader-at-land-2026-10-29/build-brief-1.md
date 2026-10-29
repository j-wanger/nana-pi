Feature: FEAT-039 · See the product and its decisions in one report

Lane reader-at-land. Class: ordinary (`node scripts/lane-class.mjs` prints `ordinary` on the planned files). Builder: pi-worker (small lane). Build session 1.

Work in the lane worktree on feat/reader-at-land, based on main. The plan of record is `docs/reviews/reader-at-land-2026-10-29/plan.md`. Read it whole, and read `plan-attack.md` beside it; the plan already takes every attack point. The plan has no list of allowed edits.

What the lane does, in one sentence: one command has a cold model read a lane's product page and its first-look diff, and returns at most a few new weaknesses, each with quotes checked against the page text.

Build every must-meet in the plan, rows R-3060 to R-3067. The owner's questions are posted as issue 256; build on the defaults.

The one-off run's files in the seat's scratch folder are a record to follow, not a module: `/private/tmp/claude-501/-Users-jwang-nana-pi/1b67ec2c-e39b-46db-adb0-8837d5a67c84/scratchpad/outside-reader/` (`render.mjs`, `prompt.md`, `reader-out.md`, `page-text.txt`). Copy `reader-out.md` and `page-text.txt` into the test fixtures as the plan says; take starting values and wording from the others. Import nothing from that folder.

Numbers that must not move: first-look's behaviour and its tests after its Playwright loader moves; the seat guide's existing pinned sentences.

No test launches a real browser or a real model. After the suite is green, run first-look and then the reader once for real on a scratch clone of the tip with one product-report heading changed, if a browser and the roster model are available, and report what it printed. If either is missing, report the one line it printed.

Run the locked full suite as a plain foreground command with its output on screen, not redirected to a file and not in the background. Another lane's suite may hold the machine-wide lock; waiting for it is expected.

## Done when

Each row is `implemented` with backticked `file::title` evidence. The locked full suite (`npm run test:locked`), `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs` are green.

Report: each must-meet's test title; the real run's output; the sealed values with provenance; each departure from the Precedent below; every existing test you changed.

## Precedent

- `scripts/first-look.mjs`: the CLI shape (`parseArgs`, injected seams, bounded one-line failures, the `INSTALL_LINE` degrade, `page.goto(url#view)` per view, `pathToFileURL` for a report path). Its private `resolvePlaywright` moves to `scripts/playwright-resolve.mjs` and both scripts import it.
- `scripts/first-look-config.mjs`: `PRODUCT_VIEWS` and `VIEWPORT_WIDTHS`, imported by name; the config-module-with-provenance pattern for the new config.
- `packages/nana-pack/bin/pi-watchdog.mjs`: `runWatchdog(tag, { piArgs, cwd, childEnv, retries, stallSecs, maxSecs, accept })`, used for its wall-clock ceiling and child-tree kill.
- `packages/nana-pack/bin/worker-config.mjs`: `CLAUDE_BUILDER_STALL_SECS = Infinity`, the precedent for switching off the flat-CPU stall; `REVIEWER_CHILD_ENV` (`NANA_ROLE`, `NANA_HANDOFF: off`) as the child env.
- `packages/nana-pack/bin/pi-review.mjs`: how a launcher composes pi args, child env and an `accept` predicate for the watchdog.
- `packages/nana-pack/bin/nana-roster.mjs` with `packages/nana-pack/lib/agent-dir.mjs`: `resolveRoster(piAgentDir())` to pick the model; a Claude Code entry is skipped, not launched.
- `packages/nana-pack/bin/nana-objective.mjs`: the bounded objective block, called as a child with `--cwd`.
- `packages/nana-pack/lib/known-bugs-config.mjs`: `KNOWN_BUGS_DIR`, so the folder name is not repeated.
- `packages/nana-pack/prompts/planner.md`: where a tracked prompt file lives.
- `packages/nana-pack/tests/first-look.test.mjs`: fake browser and fake runner seams; no test launches a real browser or model.
- `packages/nana-pack/tests/fixtures/`: where the one-off's `reader-out.md` and `page-text.txt` go, as `outside-reader/`.
- `packages/nana-setup/claude/rules/nana-seat.md` and `packages/nana-setup/tests/seat-rule.test.mjs`: the guide bullet and R-1140's rule list.
- `README.md` (the first-look paragraph near line 282): where the command's README sentence goes; the readme check runs every command it names.

