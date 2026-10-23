Feature: FEAT-015 · Diagnose the active environment. Lane install-check-builder. Class: ordinary. Builder: pi-worker (larger lane). Build session 1: the whole lane.

Work in the lane worktree on feat/install-check-builder. The spec is `docs/reviews/install-check-builder-2026-10-23/must-meet.md`: read it whole before designing. It holds over `plan-draft.md` where they differ; read the draft for the measured facts, the design parts 1 to 7, the judge's table, the tunables and the test designs, and `plan-attack.md` for the findings the must-meet adopts. Do not edit HANDOFF, the session archive, `docs/known-bugs/`, or any file in this review folder.

What the lane does, in one sentence: after doctor, the install check points the temporary home's roster builder at the review fixture's test model, then starts one offline lane build through each installed pi-worker launcher (the path off Windows; cmd and Git Bash on Windows), each in its own linked worktree of the review repository, and judges the exit, the report, the fixture's record, the build ledger and the lane lock, naming pi-worker's refusal or pi's own error on a failure.

Precedent:
- docs/reviews/install-check-review-launch-2026-10-20/must-meet.md — the review check's design this lane mirrors: runs per platform, the judge's first-failing-condition order, the fixture, the pin and the known limits.
- packages/nana-setup/lib/install-check.mjs — the review block, its launch switch (which moves into the shared `launchInstalled` helper the draft's part 1 names: this move is the brief's named move of a private helper), `reviewGit`, `judgePiReview`, `reason()`, `okay()`, `comparablePath()`, `shellQuote`, and the post-edit config edit.
- packages/nana-setup/lib/install-check-config.mjs — `PI_REVIEW` with provenance on every value, `PI_TURN.writingTag`, `SPAWN_TIMEOUT_MS`, `OVERRIDE_ENV`, and the rule that the check keeps its own contract copies.
- packages/nana-setup/lib/install-check-review.mjs — the fixture, reused unchanged.
- packages/nana-setup/tests/install-check.test.mjs — `recordingRun`, `reviewArgument`, the R-2071 to R-2075 checks, the review pin, the files-written check, the environment test and R-1071's pin.
- packages/nana-pack/lib/win-command.mjs — `winCommand`.
- packages/nana-pack/bin/pi-worker.mjs — read only: lane checks, roster and lane size, the pi argv, the lock, records and output, and the real-path function it renders the worktree with.
- packages/nana-pack/lib/build-records-config.mjs — read only: the ledger subpath, record kinds, schema and outcomes.
- packages/nana-pack/lib/build-records.mjs — read only: `readBuildLedger`; the judge parses the ledger itself instead, as `judgePiReview` parses its tally, to keep the check's own contract (a named departure from the import rule).
- packages/nana-pack/tests/build-records.test.mjs — a `feat/` linked worktree for a pi-worker lane.
- packages/nana-pack/lib/brief-precedent.mjs — read only: the `Precedent:` label form and the launch check.
- packages/nana-setup/README.md — the Install check section, a README contract.

Steps, in order:
1. Rows first: add R-2681 to R-2687 to `REQUIREMENTS.md` in FEAT-015 directly after R-2076, `untested` until each check passes, then `implemented` with backticked `file::title` evidence. Update R-1071's and R-1084's evidence for the environment test's new title (M-2).
2. Tests, each with its `// req:` marker directly above and the exact title the must-meet gives, plus the pin. Make the listed edits to existing tests the must-meet names (the S-2 stubs, R-1072's files-written check, R-1071's pin, the environment test), and fold S-6's two cases into R-2682's and R-2683's tests. Every new check must be red on main's code; check that by hand once and say so in the report (do not commit those checks).
3. Code: the shared launch helper, the two config edits with S-3's failure, the worktree, brief and build per run, `judgePiWorker`, the result lines, and `PI_CODING_AGENT_SESSION_DIR` in `OVERRIDE_ENV`, with the block after doctor and before the README rehearsal (S-1).
4. Docs: the setup README's Install check section as the draft's Docs list says, with the offline value as the build's one environment addition and the session-folder variable among the overridden names; module headers of `install-check.mjs` and `install-check-config.mjs`. Regenerate `docs/code-map.md` and `docs/requirements-tree.md` (`npm run map`, `npm run req:tree`).
5. Run `node packages/nana-setup/bin/install-check.mjs` once on macOS and report its pi-worker line and the step's time.
6. Checks before your one commit: `node packages/nana-setup/tests/install-check.test.mjs`; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `npm run test:locked`. You cannot run Windows here; reason about the cmd and Git Bash builds from the code and say what you could not run.

Seat check: `node docs/reviews/install-check-builder-2026-10-23/seat-titles.mjs all` must print `0 missing`.

Done: every must-meet test passes and was red on main, the real macOS install check prints `PASS pi-worker`, the seat check prints `0 missing`, the full suite is green, and the work is committed.

Report (at most 12 lines after the VERDICT line): the commit sha; each must-meet title's result; the hand check against main; the real install check's pi-worker line and time; each departure from the Precedent files or the must-meet, with its reason; the full suite's summary line; map, readme, trace, tree and seat-check status; what you could not run.
