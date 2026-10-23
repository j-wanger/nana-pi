# install-check-builder · must-meet of record (seat, 2026-10-23)

Feature: FEAT-015 · Diagnose the active environment

Written by the seat from the planner's draft (`plan-draft.md`) and one adversary pass (`plan-attack.md`), both kept in this folder. Plans get no review round. Where this file and the draft differ, this file holds.

Spend line: the owner's 2026-10-23 pick, "Builder launch in the install check — the install check also starts one lane builder, so a machine proves its builder launch works." It serves the install half of the 2026-10-24 priority.

Stakes: medium blast, reversible. The lane changes the install check only: its library, its config, its test file and the setup README. Every push runs the check in CI, and every install lane runs it locally before its land, so a false FAIL blocks lands. No stored format changes; a revert restores main.

## Seat decisions on the attack

- **Class: ordinary.** By AGENTS.md's lane classes, a change to the install check alone is not an install, hook or gate lane; install-check-review-launch (2026-10-20), the same shape, was ordinary (attack N-10). Ladder: one final reviewer (Opus). The local macOS install check still runs before the land, because the lane touches `packages/nana-setup/` (the owner's 2026-10-12 ruling). The seat's pairs still run.
- **M-1 adopted.** `PI_CODING_AGENT_SESSION_DIR` joins `OVERRIDE_ENV`, with provenance "contract: pi 1.0.2 environment-variables.md and build-records.mjs:44, read 2026-10-23". The build is the check's first pi child that writes a session, and lane mode refuses `--no-session`. Listed edits: R-1071's pin (the length check and the two name lists in `install-check.test.mjs`). The threat model's caller-environment line gains the variable.
- **M-2 adopted.** The landed environment test ("environment: every child gets the base environment plus only its own step's additions …") gains the offline value for each build: the expected environment of each pi-worker call adds `PI_BUILD.env`, the title gains "the offline value for each build", and R-1071's and R-1084's evidence take the new title in the same change. The README's FAIL paragraph names the offline value as the build's one addition, so R-1084's "documented additions" holds.
- **S-1 adopted.** The whole build block, with its two config edits, runs after `doctor` and before the README rehearsal. No later row then reads either edited file, the roster-notice row keeps proving the default roster, and restoring stays unneeded.
- **S-2 adopted.** The `recordingRun` stub install writes the seed `nana-pack.json` and a `settings.json` holding `packages`. The stub pi-worker behaves as its two readers do: it puts `roster.builder`'s provider and model in the start record (the default builder's when there is no roster); it exits 1 with `Error: Unknown provider …` in its output unless `extensions` holds the fixture path; and it leaves out the writing tag unless `packages` holds nana-pack. The draft's real-run checks R1 to R3 become mutation-runner pairs.
- **S-3 adopted.** When either config edit cannot be made (a missing or non-object file), each build line is FAIL as `launch` with "temporary home's roster or pi settings could not be edited", and no pi-worker starts. No new row: R-2683's `launch` code covers setup failure.
- **S-4 adopted.** R-2685 gains "another provider in the start record"; R-2684 gains "the preamble rendered for another branch".
- **S-5 adopted.** Pairs 4, 6 and 7 mutate `install-check.mjs` (the prefix, the env spread, `--max-secs` in the spread arguments). Config-value mutations are pair 28's.
- **S-6 adopted.** R-2682's test adds one win32 run with no Git Bash, asserting `FAIL pi-review (sh) — launch: Git Bash was not found` and `FAIL pi-worker (sh) — launch: Git Bash was not found`. R-2683's test adds one run whose review-repository setup fails, asserting both launch lines name the setup failure. No new titles.
- **N-2 adopted.** The expected worktree for the preamble and lock is computed with the same real-path function pi-worker uses, falling back to `path.join` when the folder is missing (the unit stub's git makes none).
- **N-5 adopted.** The Precedent list adds `packages/nana-pack/tests/build-records.test.mjs` (a `feat/` linked worktree for a pi-worker lane) and `packages/nana-pack/lib/build-records.mjs` (`readBuildLedger`). Named departure: the judge parses the ledger itself, as `judgePiReview` parses its tally, to keep the check's own contract; this is a deliberate exception to the preamble's import rule, named in the brief.
- **N-6 adopted.** `PI_BUILD.briefHeading` gets its reason; the record kinds `start` and `end` and schema `1` are sealed in `PI_BUILD` with contract provenance; the ledger cite is `build-records-config.mjs:10`.
- **N-3, N-4, N-7, N-8, N-11:** known limits or known bugs, as below.
- **Open question 1 (PowerShell for both launchers): the default, later.** Adding it changes the landed review row R-2072 and adds a cold PowerShell start to the Windows job. A follow-up lane can add a third form to both launchers through this lane's shared helper. Recorded as a known limit; no new owner ask.

## Must-meet rows (FEAT-015, after R-2076)

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2681 | WHERE the platform is not win32, the install check shall start one lane build by the path of the temporary home's bin `pi-worker` launcher, from a linked worktree of the review repository on the sealed lane's `feat/` branch, with the sealed lane and launcher arguments, a brief and an output file outside that worktree, and the sealed offline environment value. | `packages/nana-setup/tests/install-check.test.mjs::pi-worker launch: off win32, one build starts by the path of the temporary home's bin pi-worker from a linked worktree of the review repository on the sealed lane branch, with the sealed arguments, a brief and output outside that worktree and the offline value` |
| R-2682 | WHERE the platform is win32, the install check shall start two lane builds, one through the temporary home's `pi-worker.cmd` under the command interpreter and one through Git Bash with a command that names `pi-worker` bare, each from its own linked worktree on its own sealed lane branch with its own brief and output file. | `packages/nana-setup/tests/install-check.test.mjs::pi-worker launch: on win32, the temporary home's pi-worker.cmd starts under the command interpreter and Git Bash runs a command naming pi-worker bare, each once from its own worktree on its own lane branch with its own brief and output` |
| R-2683 | The install check shall print one result line per build run, `pi-worker` off win32 and `pi-worker (cmd)` then `pi-worker (sh)` on win32, that is PASS only when the run exited 0 within the sealed build timeout and the last two non-blank lines of its output file are the review fixture's answer line and verdict line. | `packages/nana-setup/tests/install-check.test.mjs::pi-worker lines: one line per run, PASS only when the run exits 0 in time and its output's last two non-blank lines are the fixture's answer and verdict lines` |
| R-2684 | IF the record the review fixture writes during a build run, after the install check removed any earlier record, does not hold in its system prompt the checkout's builder preamble rendered for that run's worktree and branch, the run's whole brief and nana's writing tag, or does not hold the worker role, THEN the install check shall report that run's line as FAIL. | `packages/nana-setup/tests/install-check.test.mjs::pi-worker record: a record missing the rendered builder preamble, the whole brief, the writing tag or the worker role fails, and on win32 the cmd run's record cannot pass the sh run` |
| R-2685 | IF the review repository's build ledger does not hold exactly one start record and one end record for a run's sealed lane, sharing one build id, with the fixture's provider and model in the start record and outcome ok with exit 0 in the end record, THEN the install check shall report that run's line as FAIL. | `packages/nana-setup/tests/install-check.test.mjs::pi-worker ledger: no record, a start without an end, two starts, a mismatched build id, only another lane's records, another provider or model, or an end that is not ok with exit 0 each fail that run's line` |
| R-2686 | IF a build run's start record does not name the lane lock file in that run's worktree folder under the review repository's git folder, or that file still exists after the run, THEN the install check shall report that run's line as FAIL. | `packages/nana-setup/tests/install-check.test.mjs::pi-worker lock: a start record naming another lock path, or a lane lock still present after the run, fails that run's line` |
| R-2687 | IF a build run's launcher exits with a nonzero status, THEN the install check shall name in that run's FAIL line the exit status and the first non-blank line of the run's output file, or the launcher's last standard-error line when that file is missing or blank. | `packages/nana-setup/tests/install-check.test.mjs::pi-worker exit: a failed build's line names the exit status and pi's first output line, or the launcher's last stderr line when there is no output, such as a lane refusal` |

Seal test: `packages/nana-setup/tests/install-check.test.mjs::pin R-2681 to R-2687: the build's sealed runs, lanes, labels, folders, brief text, launcher arguments, offline value, roster, settings path, ledger, record kinds, lock, preamble, role and outcome, and its timeout above the lane ceiling` names R-2681 to R-2687.

R-2688 to R-2690 stay free. R-2070 to R-2076 keep their text and titles.

## What each test does

As the draft's "What each test does", with the seat's changes above: the S-2 stubs; R-2684's branch variant; R-2685's provider variant; R-2682's no-Git-Bash run and R-2683's setup-failure run (S-6); every check red on main.

Existing tests the change touches (listed edits): `recordingRun`'s stub install and stub spawn (S-2); R-1072's files-written check (each run's brief and output and the ledger, `.local/bin/pi-worker` as install's); R-1071's pin (M-1); the environment test and R-1071's and R-1084's evidence (M-2).

## Tunables

As the draft's table, in `packages/nana-setup/lib/install-check-config.mjs`, with: `PI_BUILD.briefHeading` "chosen 2026-10-23 (R-2684): names the build in the fixture record so a reader can tell it from the review"; `PI_BUILD.recordKinds` `{ start: "start", end: "end" }` and `PI_BUILD.recordSchema` `1`, contract `build-records-config.mjs:12-14` (R-2685); the ledger cite `build-records-config.mjs:10`; and `OVERRIDE_ENV` gaining `PI_CODING_AGENT_SESSION_DIR` (M-1). All sealed by the one pin test.

## Wrong-code pairs (each must turn its test red every run)

The draft's pairs 1 to 28, with pairs 4, 6 and 7 applied to `install-check.mjs` (S-5), plus:
29. The settings edit skipped → R-2683 (the stub exits 1, unknown provider).
30. The roster edit skipped → R-2685 (the start record names the default builder).
31. The settings edit writes only `extensions`, dropping `packages` → R-2684 (no writing tag).
32. A missing `nana-pack.json` still launches the build → R-2683's setup-failure case (S-3).
33. `PI_CODING_AGENT_SESSION_DIR` left out of `OVERRIDE_ENV` → R-1071's pin.
34. The build block before the hook rows → the files-written check or the roster-notice row (S-1), whichever the build names; the seat confirms which at pair time.
None is Windows-only: the win32 cases run through `recordingRun` on any system; only CI's Windows leg proves the real cmd and Git Bash builds.

## Known limits (the seat writes them to FEAT-015's file before the final round)

The draft's list, less "the fixture roster and settings entry stay in the temporary home" (S-1 makes no later row read them), with:
- A hang inside pi-worker's watchdog ends in about 90 s (stall) or 120 s (ceiling); a hang before the watchdog, in pi-worker's git calls or trust read, has no ceiling, and on Windows the check waits for the job limit, as the review's known limit says (N-3).
- `GIT_DIR` and `GIT_WORK_TREE` pass through to every child, so with `GIT_DIR` set the review's commit, and now a `feat/` branch and a worktree entry, land in the caller's repository (N-4, not new with this lane).
- `SPAWN_TIMEOUT_MS.build` and `.review` are equal, so code passing the wrong one passes every test (N-7).
- A nonzero exit whose output still holds the fixture reply names the answer line, not the cause; a long lock path loses its tail at the 200-character cut (N-8).
- PowerShell stays unchecked for both launchers; a follow-up lane adds it through the shared helper.

## Docs that change

As the draft's list, with the README naming the offline value as the build's one environment addition (M-2) and the session-folder variable among the overridden names (M-1).

## Seat steps

1. Cut `feat/install-check-builder` from main. Commit this file, the draft, the attack, seat titles and build brief 1; run brief-check.
2. Build with the roster's larger builder.
3. Seat checks: `node packages/nana-setup/tests/install-check.test.mjs`, `npm run test:locked`, map, readme, trace, `requirements-moved --base main`.
4. Run `node packages/nana-setup/bin/install-check.mjs` locally on macOS; expect `PASS pi-worker` after `PASS doctor`.
5. Pairs 1 to 34 through the mutation runner.
6. Draft PR; CI's Windows install-check leg must show `PASS pi-worker (cmd)` and `PASS pi-worker (sh)`; keep both CI logs' lines in the lane folder.
7. Notes before the final round; one final reviewer (Opus) on the exact tip. Whichever of this lane and shared-helpers lands second reruns the real install check on the merged tip (attack N-9).
