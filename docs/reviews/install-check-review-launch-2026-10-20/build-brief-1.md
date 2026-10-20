# Build brief 1 · install-check-review-launch
Feature: FEAT-015 · Diagnose the active environment. Class: ordinary. Base: main 20debe02 or newer (install-check-turn-edit-powershell has landed). Read must-meet.md first.

## Change
1. REQUIREMENTS.md: add R-2070 to R-2076 as `planned` directly after R-2004, texts from must-meet.md. Flip each to implemented with its test cite when its test passes. Run `npm run req:tree`.
2. lib/install-check-config.mjs: add PI_REVIEW directly after PI_TURN_POWERSHELL and `review` to SPAWN_TIMEOUT_MS, provenance beside every value. Build the verdict line from the verdict and the pi args from the fixture, provider and model names, never second literals. Leave every other export byte-equal.
3. lib/install-check-review.mjs (new): the faux fixture from the design, six-tag header, modelled on install-check-turn.mjs.
4. lib/install-check.mjs, after the turn's result lines and before `hook set`: the git helper (git's own `-c` options lead each command, which keeps R-1084's init count at 2 and its env check unchanged), the out folder, then per run: remove the record, launch, read, judge with an exported pure judgePiReview, report the run's label. Launch rules as the design says: the bin link by its path off win32; winCommand on the home's `.cmd` path; Git Bash reading one stdin line that names pi-review bare. Reuse the check's existing bin-folder join and Git Bash discovery. Print no new informational line.
5. packages/nana-setup/README.md, Install check: name the review in the opening paragraph; in the FAIL paragraph say what fails it and that its ledger is the temporary home's.
6. tests/install-check.test.mjs, new checks directly after the R-2004 checks:
   - Harness: the install stub creates the home's launchers; on win32 the injected exists also accepts the home's `pi-review.cmd`, and the Path holds a Git `cmd` folder whose git.exe and bash.exe it accepts. A review branch matches the review provider in the args or, for Git Bash, in the standard input; it writes the out file, one LAND tally line for the item and a passing record.
   - R-2070's check runs real git for every `git` call (spawnOverride, the caller's PATH) with GIT_CONFIG_COUNT setting `user.useConfigOnly=true`, `commit.gpgsign=true` and a missing `gpg.program`; it reads `git ls-tree -r --name-only HEAD` in the sealed folder.
   - One allowed edit to an existing check: R-1072's written-file list gains the review repository's fixture file, the review output, the record and the tally. Change no other existing check or title; list each edit in the report.
   - Seven checks and one pin, titles from must-meet.md. Put `// req: R-207n` directly above `check("<exact title>", …` with the title on that one line.
   - R-2075's win32 case: the stub writes the record for the cmd run only; `pi-review (sh)` must FAIL.
7. Run `npm run map`, `npm run map:check`, `npm run readme:check` and `node scripts/requirements-trace.mjs`.

## Tests (single files only)
`node packages/nana-setup/tests/install-check.test.mjs`. Then once on macOS: `env -u NANA_WORKTREE_ROOT node packages/nana-setup/bin/install-check.mjs`; expect `PASS pi-review`. pi-subagents and the readme checklist may FAIL offline; say so. Never run nana-setup install against the real home.

## Wrong code to try (each must turn its check red; revert each)
- R-2070: drop the identity options; OR drop the signing option; OR build the repo inside the fixture project.
- R-2071: start node with the checkout's pi-review.mjs; OR start the link's real path; OR start `pi-review` by name; OR run from the fixture project; OR put the output inside the review repository.
- R-2072: run only the cmd form; OR start the sh launcher by its full path; OR start the `.cmd` without the command interpreter.
- R-2073: accept exit 1; OR accept output ending `VERDICT: SEND-BACK`; OR read the first non-blank line.
- R-2074: accept two round lines; OR accept a round line whose verdict is null; OR count another item's line.
- R-2075: skip removing the record before each run; OR accept a record without the standard; OR without the role.
- R-2076: point the fixture into packages/nana-pack/extensions.
No file under docs/reviews may spell a pi launch as the spawn call with the literal "pi" (a desk test scans those files).

## Stop and report
If the real macOS run needs a change to pi-review, pi-watchdog, review-round, win-shims or steps.mjs, stop and report the failing line: that change reclassifies the lane. Add no known-red entry; a Windows failure seen later in CI is the seat's call.

## Done
- The seven checks and the pin pass; every other check in the file passes with only the allowed edit.
- Each row is implemented with its cite; map, readme and trace checks are green; the README section is updated.
- The macOS install check prints PASS pi-review. HANDOFF.md and docs/sessions are not edited.

## Report (at most 10 lines)
Tip SHA; PASS and FAIL counts for the test file; each wrong code and the check it turned red; the macOS install-check lines for pi turn and pi-review, with the review's run time; each edit to an existing check; any deviation with its reason; any open question.