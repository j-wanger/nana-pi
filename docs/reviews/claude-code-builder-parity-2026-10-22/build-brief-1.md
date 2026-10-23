Feature: FEAT-006 · Launch builders with execution limits. Lane claude-code-builder-parity. Class: gate (pi-watchdog sits behind pi-review and pi-worker). Builder: pi-worker (larger lane). Build session 1: the whole lane.

Work in the lane worktree on feat/claude-code-builder-parity. The spec is `docs/reviews/claude-code-builder-parity-2026-10-22/must-meet.md`: read it whole before designing, including its "Settings carry (amendment, 2026-10-23)" section, which holds over anything earlier in the file and over the plan draft. Read `proxy-verdict.md` section 4 in the same folder for the settings-carry tests' fixtures. Do not edit HANDOFF, the session archive, `docs/known-bugs/`, or any file in this review folder.

What the lane does, in one sentence: when the roster's `largerBuilder` is a Claude Code entry, `pi-worker --lane-size larger` starts it itself as a headless `claude -p` in the lane worktree, under the same brief check, lock, ceiling, signals and build record as a pi builder, with a composed prompt file and a carried settings file, instead of refusing it.

Precedent:
- packages/nana-pack/bin/pi-worker.mjs — lane checks, roster slot choice, the R-1191 refusal this lane replaces, the preamble rendered into a `mkdtemp` folder removed in `finally`, the pi argv, `childEnv`, the lane lock.
- packages/nana-pack/bin/pi-watchdog.mjs — `runOnce`'s one `piLaunch(args, { cwd })` call and its `spawn` options: the one injection point (`opts.launch ?? piLaunch`, with `launch.options` spread into `spawn`); `maxFlat` from `stallSecs`; ceiling and signals reused unchanged.
- packages/nana-pack/bin/review-launch.mjs — resolves a non-pi command per platform (POSIX direct; win32 PATH and PATHEXT, `.cmd` through cmd.exe with verbatim arguments).
- packages/nana-pack/bin/review-ledger.mjs — `spawn(..., { ...launch.options, ... })`, the options spread the watchdog adopts.
- packages/nana-pack/bin/claude-review.mjs — a headless Claude Code launch from a roster slot.
- packages/nana-pack/lib/claude-review-config.mjs — `CLAUDE_BIN`, `CLAUDE_PRINT_FLAG`, `CLAUDE_MODEL_FLAG`, `CLAUDE_ALLOW_FLAG`: import them, never copy them.
- packages/nana-pack/bin/worker-config.mjs — home of every new builder value, beside `LANE_DEFAULTS.tools`, `CLAUDE_CODE_RUNTIME` and `LARGER_BUILDER_LABEL`.
- packages/nana-pack/lib/brief-precedent.mjs — `checkBriefForLaunch` and `knownBugPath`, unchanged.
- packages/nana-pack/lib/json-text.mjs — `parseJsonBytes` and `jsonErrorPlace` for reading the user settings file; never pass parser message text through.
- packages/nana-pack/lib/build-records.mjs — the start record this lane fills for a Claude Code build (R-2653).
- packages/nana-pack/lib/win-command.mjs — the characters `winCommand` refuses; why every file goes by path, never inline.
- packages/nana-pack/prompts/builder-preamble.md — the rules, rendered unchanged into the prompt file.
- packages/nana-pack/tests/worker-lane.test.mjs — the lane harness (fixture repo, linked worktree, roster folders, spawn marker, lock path, prompt copies); its R-1191 check is deleted.
- packages/nana-pack/tests/claude-review.test.mjs — `writeFakeClaude` (POSIX shebang, win32 `claude.cmd`) and the whole-argv equality of R-2560.
- packages/nana-pack/tests/brief-check.test.mjs — the "same line as brief-check" equality.
- packages/nana-pack/tests/build-records.test.mjs — the start-record harness for R-2653.
- packages/nana-pack/tests/templates-render.test.mjs — the R-1193 check this lane replaces, and the R-1213 and R-1214 checks it keeps.
- templates/_shared/working-under-nana-pi.md — the Larger lanes bullet.

Steps, in order:
1. Rows first: add R-2646 to R-2655, R-2664 and R-2665 to `REQUIREMENTS.md` as the must-meet states them (R-2652 in FEAT-014 beside R-1213, and in FEAT-006's Also applies); reword R-1124; retire R-1191 and R-1193 with the must-meet's texts.
2. Tests: a new `packages/nana-pack/tests/worker-claude.test.mjs` with the six-tag header, holding R-2646 to R-2651, R-2654, R-2655, R-2664, R-2665 and the seal test, each with its `// req:` marker directly above and the exact title the must-meet gives; R-2652 in templates-render; R-2653 in build-records.test. Every case has a time limit, injects its platform or skips by name off it, and imports config names instead of literals except in the seal test. R-2650 runs only on the Windows leg. Delete worker-lane's R-1191 check and templates-render's R-1193 check.
3. Code: the Claude branch in pi-worker where R-1191 refused, after `checkBriefForLaunch` and roster resolution; the prompt file and the settings file in the existing temp folder, removed in the same `finally`; the claude argv exactly as R-2646 states it; the child env and the settings file's sealed env; the builder line; the carry line; the start record's provider, model and null thinking; the two-line launch injection in pi-watchdog with pi-review's path unchanged; no stall stop for a Claude build.
4. Docs: the pack README's lane-mode paragraph (argv, prompt file, settings carry and its line, child env, no stall stop), roster paragraph and brief-check lead-in; the shared template's Larger lanes bullet and the same text in AGENTS.md's marker region; module headers for pi-worker, pi-watchdog, worker-config and review-launch; the pi-worker comment citing R-1193. Regenerate `docs/code-map.md` and `docs/requirements-tree.md` (`npm run map`, `npm run req:tree`).
5. Checks before your one commit: the touched test files (worker-claude, worker-lane, templates-render, build-records, review-ledger, win32-launch, claude-review, brief-check); `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `npm run test:locked`. Never start a real `claude` or a real model: every test uses the fake.

Seat check: `node docs/reviews/claude-code-builder-parity-2026-10-22/seat-titles.mjs all` must print `0 missing`.

Done: every must-meet test passes, the seat check prints `0 missing`, the full suite is green, and the work is committed.

Report (at most 12 lines after the VERDICT line): the commit sha; each must-meet title's result; each departure from the Precedent files or the must-meet, with its reason; the full suite's summary line; map, readme, trace, tree and seat-check status; anything not done.
