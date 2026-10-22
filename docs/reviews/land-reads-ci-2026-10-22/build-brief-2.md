Feature: FEAT-008 · Integrate and clean up reviewed changes. Lane land-reads-ci, rows R-2591 and R-2586. Class: gate (a land tool). Builder: pi-worker (larger lane). Build session 2: two fixes from the independent check.

Work in the lane worktree on feat/land-reads-ci. Build 1 is 3d2953dc. Read `docs/reviews/land-reads-ci-2026-10-22/must-meet.md`'s Amendment 1 and `independent-check-3d2953dc.md` first. Do not edit HANDOFF, the session archive or the known-bug files.

Precedent:
- packages/nana-pack/bin/nana-land.mjs — the CI read's `runGh(main, args, { env: process.env })` call and `ghDefault`.
- packages/nana-pack/lib/land-ci.mjs — `remedyOf` and `judgeRuns`.
- packages/nana-pack/tests/land.test.mjs — R-2591's preset-environment case and its POSIX fake-gh command case, and R-2586's case table.

F1 (must fix, A1). With `CLICOLOR_FORCE=1` or `GH_FORCE_TTY=1` in the seat's shell, gh prints ANSI-coloured JSON and every land is refused. Pass gh the process environment with `CLICOLOR_FORCE` set to `0` and every key whose upper-case form is `GH_FORCE_TTY` removed; build the copy once, in one helper. Update R-2591's row text in REQUIREMENTS.md as A1 says. In R-2591's test: preset both variables in `process.env` (restore in `finally`) and assert the environment gh receives; in the POSIX command case, make the fake gh print the green run list wrapped in ANSI colour codes whenever either variable is set, and set both for the child.

F2 (should fix, A2). Make each rerun remedy read `gh run rerun <id> --repo <owner>/<repo>` (and `--failed` where it is today), with the repository nana-land already parsed; assert it in R-2586's cancelled and failed cases.

1. Change only what F1 and F2 need.
2. Run `node packages/nana-pack/tests/land.test.mjs`, then `npm run map`, `npm run map:check`, `npm run readme:check`, `node scripts/requirements-trace.mjs`, then `npm run test:locked` before your commit. Try these wrong versions, see each go red, then restore: pass gh `process.env` unchanged (R-2591); drop `--repo` from the cancelled remedy (R-2586).

Seat check: `node docs/reviews/land-reads-ci-2026-10-22/seat-titles.mjs all` must print `0 missing`.

Done:
- A coloured gh no longer refuses a land; rerun remedies name the repository; the land tests and the full suite are green; the work is committed.

Report (at most 10 lines after the VERDICT line): the commit sha; the change; each departure from the Precedent files with its reason; each existing test you edited and why; the wrong versions tried and their results; the full suite's summary line; map, readme, trace and seat-check status.
