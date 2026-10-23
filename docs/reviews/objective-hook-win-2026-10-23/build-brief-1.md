Feature: FEAT-013 · Install and connect harness runtimes. Lane objective-hook-win. Class: hook. Builder: pi-worker (larger lane). Build session 1: the whole lane.

Work in the lane worktree on feat/objective-hook-win. The spec is `docs/reviews/objective-hook-win-2026-10-23/must-meet.md`: read it whole before designing. It holds over `plan-draft.md` where they differ; read the draft for the measured cause, the design parts 1 to 3, the prototype table, the test designs and the tunables, and `plan-attack.md` for the findings the must-meet adopts. Do not edit HANDOFF, the session archive, `docs/known-bugs/`, or any file in this review folder.

What the lane does, in one sentence: each Claude Code session-start hook (objective and adoption) passes one deadline, 4,000 ms on its own process clock, to the producer launcher, which gives each producer the smaller of a 2,500 ms cap and the whole milliseconds left, and prints the producer's unavailable marker without starting it when none are left, so a stalled Windows machine no longer cuts the objective producer and two hung producers still end before Claude Code's 5 s.

`deadlineMs` is a point on the hook's process clock (`performance.now()`), not a budget measured from the call. Do not compute `HOOK_DEADLINE_MS - performance.now()` in a hook and pass that: that counts the hook's start twice (attack M-1, which R-2671's late-start case and pair 10 catch).

Precedent:
- docs/reviews/hook-deadlines-2026-10-20/must-meet.md — the 1,500 ms limit's design, its two-producers arithmetic, the copied-tree test shape and rows R-2010 to R-2013.
- packages/nana-setup/lib/hook-producer.mjs — `runHookProducer` with its injected `run` and `stdout`, and `HOOK_PRODUCER_TIMEOUT_MS` with provenance beside it.
- packages/nana-knowledge/lib/hook.ts — the knowledge hook's injected `clock` and `budgetMs` options; follow the option style, with the named departure that this deadline is an absolute point on `performance.now()`, not a relative budget on `Date.now`.
- packages/nana-setup/claude/hooks/nana-objective.mjs — the objective hook's call site, which already spreads `hookProducerConfig` and adds options.
- packages/nana-setup/claude/hooks/nana-adoption.mjs — the adoption hook's call site.
- packages/nana-setup/tests/hook-deadlines.test.mjs — copied hooks and libs, hung and live stubs, `installedLimit()`, the watchdog and the R-2613 case.
- packages/nana-setup/tests/hook-producers.test.mjs — R-2013's injected runner reading `options.timeout`.
- packages/nana-pack/tests/test-runner.test.mjs — `runForced`: a preload passed with `--import` as a file URL, the pattern for the late-start preload.
- packages/nana-setup/tests/hooks-win32-exec.test.mjs — elapsed milliseconds in a check's detail.
- packages/nana-setup/lib/settings.mjs — the installed `timeout: 5`, read in tests through `desiredHooks`.

Steps, in order:
1. Rows first: add R-2671 to R-2674 to `REQUIREMENTS.md` in FEAT-013 SUB-012 directly after R-2015, `untested` until each check passes, then `implemented` with backticked `file::title` evidence. Retire R-2013 ("superseded by R-2674, 2026-10-23"). Narrow R-2010's text as the must-meet's S-2 says; keep its title.
2. Tests, each with its `// req:` marker directly above and the exact title the must-meet gives, plus the seal. The seal and R-2674 replace R-2013's check. Fixture guards go inside their check's condition (no extra PASS lines). Every new check must be red on main's code; check that by hand once per row and say so in the report (do not commit those checks).
3. Code: the launcher's `deadlineMs` and `clock` options and the skip; the two hooks passing `deadlineMs: HOOK_DEADLINE_MS`; the cap at 2,500 and `HOOK_DEADLINE_MS` at 4,000, each with the provenance the must-meet gives.
4. Docs: `packages/nana-setup/README.md`'s producer-limit sentence as the must-meet's S-5 words it; module headers of the launcher, both hooks and the two test files. Regenerate `docs/code-map.md` and `docs/requirements-tree.md` (`npm run map`, `npm run req:tree`).
5. Checks before your one commit: `hook-producers`, `hook-deadlines`, `stale-copies`, `frontier-hook`, `hooks-closed-output` and `objective-golden` test files; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `npm run test:locked`. You cannot run Windows here; reason about the win32 paths from the code and say what you could not run.

Seat check: `node docs/reviews/objective-hook-win-2026-10-23/seat-titles.mjs all` must print `0 missing`.

Done: every must-meet test passes and was red on main, the seat check prints `0 missing`, the full suite is green, and the work is committed.

Report (at most 12 lines after the VERDICT line): the commit sha; each must-meet title's result and its elapsed milliseconds; the hand check against main; each departure from the Precedent files or the must-meet, with its reason; the full suite's summary line; map, readme, trace, tree and seat-check status; what you could not run.
