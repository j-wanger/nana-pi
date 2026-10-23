# install-check-builder · plan attack (adversary, 2026-10-23, main dbb98cbb)

Read-only pass over `install-check-builder-plan-draft.md`. Scratch work: `scratchpad/icb-attack/` (`probe-x.sh`, `probe-y.sh` and their run folders `px-*`, `py-*`; `npm-copy/` is a copy of the pi-subagents 0.75.0 package tree, read from the real `~/.pi/agent/npm`, nothing written there). Every probe used a temporary HOME and TMPDIR under the scratch folder, `env -i`, `PI_OFFLINE=1` and the review fixture. No probe made a real model call. The checkout's `git status` was clean before and after. Each claim is marked measured or inferred.

## Summary

The core measurement holds, and it holds wider than the planner tested. With nana-pack, nana-knowledge, pi-subagents 0.75.0, the rulings link, the subagent config and an objective file all registered, one lane build exited 0 in about 1.7 s. Its output was the fixture reply byte for byte (65 bytes). The record held the worker role, the writing tag, the rulings heading and the whole brief. With the fixture missing, the output's first line was still pi's own `Error: Unknown provider …`. Measured, probe-y on this Mac.

Two parts must change before the brief. The build is the first install-check child that writes a pi session, and a caller's `PI_CODING_AGENT_SESSION_DIR` sends that session out of the temporary home (M-1). The plan's `PI_OFFLINE` addition collides with a landed environment test that the plan does not list (M-2).

## Findings

### M-1 · A caller's session-folder variable sends the build's session out of the temporary home

- Measured, probe `px-sess`: with `PI_CODING_AGENT_SESSION_DIR=<scratch>/outside-sessions` in the caller environment, the build exited 0. The session file landed in `outside-sessions/`, and the temporary home held no session at all.
- `buildEnvironment` passes the variable through (`install-check.mjs:19-33`). It is not in `OVERRIDE_ENV` (`install-check-config.mjs:27`), whose provenance is an audit dated 2026-10-12.
- nana-pack itself reads it: `buildSessionDir` in `packages/nana-pack/lib/build-records.mjs:44`, added in fa4a2406 on 2026-10-22. So the override list is stale against a pack reader added yesterday. pi documents the variable in `docs/environment-variables.md` (Pi Process Configuration).
- Every other pi row passes `--no-session`: the turn and the review (`install-check-config.mjs:60`, `:105`) and the RPC session (`install-check.mjs:376`). Lane mode refuses caller pi arguments (`pi-worker.mjs:124`), so the build cannot pass it. The build is the first session writer in the check.
- Realistic input: an owner who sets this documented pi variable in a shell profile. Consequence: every install check run, including the seat's required macOS run before each install lane's land, leaves one fake builder session in the owner's real session store. The desk and pi's resume list show it. Deleting the temporary home does not remove it. That is the review standard's "seat script that writes outside the OS temp folder".
- Change: add `PI_CODING_AGENT_SESSION_DIR` to `OVERRIDE_ENV`, with provenance "contract: pi 1.0.2 environment-variables.md and build-records.mjs:44, read 2026-10-23". The plan must name the R-1071 pin edits this forces: the length check at `install-check.test.mjs:91`, the lists at `:92` and `:529`. The loops at `:83` and `:352` then cover the new name with no new test. Add the variable to the threat model's caller-environment line.
- Note in passing: `PI_PACKAGE_DIR` also passes through, but it reaches every pi row today, so it is outside this lane.

### M-2 · `PI_OFFLINE` turns a landed environment test red, and the plan does not list it

- `install-check.test.mjs:367-383` ("environment: every child gets the base environment plus only its own step's additions (CLAUDE_PROJECT_DIR for each hook, NANA_TEST_TEMP_ROOTS empty for the pi session)") deep-compares every child's environment with the base. Only hooks and the RPC session may differ. Measured, by reading.
- Design part 5 launches the build with `{ ...childEnv, ...PI_BUILD.env }`, and R-2681 asserts `PI_OFFLINE` on that call. So, as written, R-2681 and that landed test cannot both pass.
- That title is evidence for R-1071 and R-1084 in `REQUIREMENTS.md`. R-1084 also says children get "only the documented additions for that step".
- The plan's "Existing tests the change touches" names `recordingRun`, R-1072's files-written check and R-2070 to R-2075, not this one. A builder then either edits a landed row's test and title on its own, breaking two rows' evidence, or drops `PI_OFFLINE` and loses the no-network contract.
- Change: list the edit. The expected environment for each pi-worker call adds `PI_BUILD.env`. Either the title gains "the offline value for each build", with R-1071's and R-1084's evidence updated in the same change, or the plan states that the title stays and why. The README's FAIL paragraph names the offline value as the build's one addition, so R-1084's "documented" holds.

### S-1 · The two config edits come before the hook rows and change what the roster-notice row proves

- Design part 2 writes a `roster` into the temporary home's `nana-pack.json` before `hook set`. Today that file is the seed alone (`packages/nana-setup/pi/nana-pack.seed.json`, no roster). So `resolveRoster` returns `source: 'default'` (`nana-roster.mjs:147`), and the notice carries the `(default)` mark (`roster-notice.mjs`, `rosterSegment`).
- After the edit, `hook roster notice` reads the fixture roster on its file path instead. The row still passes, because it checks only the prefix. But the fresh-machine default path stops being proven by the install check. Inferred from the code. The unit stub returns fixed text, so no unit test sees the change.
- The plan's reason for not restoring is the post-edit edit. That precedent is itself a recorded FEAT-015 known bug ("doctor in the install check now reads a config whose post-edit block the check rewrote").
- Change: move the whole build block after `doctor` and before the README rehearsal, which uses its own home. Then no later row reads either edited file. The "fixture roster and settings entry stay" known limit goes away, and restoring stays unneeded. The macOS run expectation in seat step 5 becomes "`PASS pi-worker` after `PASS doctor`".

### S-2 · No unit test exercises the two config edits, so their wrong code passes the suite

- The `recordingRun` stub install writes neither `.pi/agent/nana-pack.json` nor `.pi/agent/settings.json` (`install-check.test.mjs:229-251`). So in every unit run, part 2's "missing file is left alone" branch skips both edits. The stub pi-worker then passes anyway. Measured, by reading.
- So code that writes the roster under the wrong key, writes the settings to the wrong file, or drops `packages` passes every listed test and pair. R1 to R3 catch it only as manual seat runs, and afterwards only CI's real run would.
- Change: make the stub install write the seed `nana-pack.json` and a `settings.json` holding `packages`. Make the stub pi-worker behave as its two readers do. It puts `roster.builder`'s provider and model in the start record, and the default builder's when there is no roster. It exits 1 with `Error: Unknown provider …` in the output unless `extensions` holds the fixture path. It leaves out the writing tag unless `packages` holds nana-pack.
- This models the consumers' contracts, not the check's implementation. Then R1 to R3 become mutation-runner pairs, red in the R-2685, R-2683 and R-2684 integration cases. The files-written check then also pins "edit in place, create nothing".

### S-3 · A skipped roster edit silently starts the machine's default builder with write tools

- When `nana-pack.json` is missing or not an object, part 2 leaves it alone and still launches. pi-worker then resolves no roster to `ROSTER_DEFAULTS` (`nana-roster.mjs:136`, `:147`), which is `openai-codex gpt-6-luna` with tools `read,grep,find,bash,edit,write` (`worker-config.mjs:15-20`).
- Today this fails safely, as P-c shows. openai-codex has no environment key in pi-ai (`env-api-keys.js` maps none), and the temporary home holds no `auth.json`. Measured, by reading.
- The safety rests on the default provider having no environment key. The caller environment passes provider keys through. A future default such as `anthropic`, with `ANTHROPIC_API_KEY` set, would make a paid real-model call with write tools from the install check. Inferred.
- Change: when either edit cannot be made, report each build line FAIL as `launch` with "temporary home's roster or pi settings could not be edited", and start no pi-worker. This needs no new row: R-2683's `launch` code already covers "setup failed".

### S-4 · Two rows are wider than their tests

- R-2685 names the fixture's provider and model, but its variants change only the model. A judge that checks only the model passes. Add "another provider in the start record".
- R-2684 names the preamble rendered for the run's worktree and branch, but its variants change only the worktree. Add "the preamble rendered for another branch".

### S-5 · Pairs 4, 6 and 7 survive when applied to the config

- By the standard, R-2681 compares with imported names: `PI_BUILD.branchPrefix`, `PI_BUILD.env`, `PI_BUILD.launcherArgs`. A mutation that edits those values in the config keeps R-2681 green, and only the pin turns red. Inferred from the plan's assertion list.
- Change: state that pairs 4, 6 and 7 mutate `install-check.mjs`, by dropping the prefix, the env spread, or `--max-secs` from the spread arguments. Config-level mutations are pair 28's.

### S-6 · "R-2071 and R-2072 guard the move" covers only the happy launch forms

- R-2071 and R-2072 assert the path, cmd and Git Bash calls (`install-check.test.mjs:1330-1378`). No test reaches the three error branches the helper takes over: the review repository setup failure, a cmd refusal, and a missing Git Bash. A grep for `review repository setup failed` and `Git Bash was not found` in the test file finds nothing.
- A helper that changes those branches keeps every test green. It would silently change a landed row's FAIL text and could stop the review's setup-failure check.
- Change: fold two cases into existing must-meet tests, adding no new titles. In R-2682's test, one win32 run with no Git Bash (`winExists` false for `bash.exe`) asserts `FAIL pi-review (sh) — launch: Git Bash was not found` and `FAIL pi-worker (sh) — launch: Git Bash was not found`. In R-2683's test, one run whose fixture commit fails asserts that both launch lines name the setup failure.

### N-1 · The plan's "not verified after a real install" is half closed on macOS

- Measured, probe-y: the pack, knowledge, pi-subagents 0.75.0 (the doctor floor), the rulings link, the subagent config seed and an objective file were all registered. The success output was exactly the 65-byte reply. The record held role `worker`, `<nana-writing>`, the rulings heading and the whole brief. The ledger held one `ok` pair. The failure output's first line was pi's error. Runs took 1.5 to 1.7 s.
- This is still not a real `nana-setup install`, and nothing here ran on Windows.

### N-2 · The preamble match is exact text, and it holds by reading

- The home is `realpathSync.native` (`bin/install-check.mjs:18`), and pi-worker renders `{{WORKTREE}}` from `fsReal(process.cwd())` (`pi-worker.mjs:147`, `:211`). Both sides are canonical, so `path.join(home, …)` matches. Inferred.
- CI never sees an 8.3 home, because `TEMP` is `runner.temp` (`ci.yml:39-41`). The threat model's 8.3 item is covered by design, not by CI.
- A cheap hardening: compute the expected worktree with the same function pi-worker uses. Fall back to `path.join` when the folder is missing, since the unit stub's git creates none.

### N-3 · "A hung build fails after about 120 s" holds only for a hang inside the watchdog

- A flat-CPU hang ends at about 90 s, by the stall rule: 75 s plus one 15 s poll (`pi-watchdog.mjs:105-107`, `:215`).
- A hang before the watchdog, in pi-worker's git calls or `trusted()`, has no ceiling. On Windows the adapter waits for `close` (`install-check.mjs:150`), and pi-worker holds the inherited pipes. So the check waits until the 20-minute job limit, as the review's known limit already says. Word the known limit that way.

### N-4 · Git's location variables pass through

- `GIT_DIR` and `GIT_WORK_TREE` pass through `buildEnvironment`. With `GIT_DIR` set, the review's existing commit already lands in the caller's repository. The build would also add a `feat/` branch and a worktree entry there.
- This is not new with this lane. Record it as a FEAT-015 known bug.

### N-5 · The precedent list misses two nearest pieces of code

- Part 3: `packages/nana-pack/tests/build-records.test.mjs:58` makes a `feat/` linked worktree for a pi-worker lane. That is closer than `reviewGit` alone.
- Part 6: `readBuildLedger` in `packages/nana-pack/lib/build-records.mjs` already reads this ledger. Name the departure: the judge parses the ledger by hand, as `judgePiReview` parses its tally, to keep the check's own contract. Without that line, the builder preamble's new "import it, never copy it" bullet pushes the builder to import.

### N-6 · Tunables

- `PI_BUILD.briefHeading` says only "chosen (R-2684)" and gives no reason.
- The judge needs the record kinds `start` and `end` and schema `1` (`build-records-config.mjs:12-14`). The plan leaves them inline. Seal them in `PI_BUILD` with contract provenance.
- The ledger cite is `build-records-config.mjs:10`, not `:11`.

### N-7 · A wrong timeout name survives

`SPAWN_TIMEOUT_MS.build` and `.review` are both 180000. Code that passes `.review` to the build passes every test. This is harmless while the two values are equal.

### N-8 · Two edges of the exit detail

- An exit other than 0 whose output still holds the fixture reply shows the answer line, not the cause.
- `formatResultLine` cuts details at 200 characters (`install-check.mjs:101`). On macOS a lock refusal's long temporary path loses its "(recorded pid …)" tail. The cause stays readable.

### N-9 · shared-helpers shares no source file, but it does share the build's runtime path

`git diff main...feat/shared-helpers` changes `pi-watchdog.mjs`'s kill path and the builder preamble. Both are on this build's path. Whichever lane lands second should rerun the real install check on the merged tip. CI does this on every push.

### N-10 · Class

By AGENTS.md's lane classes, a change to the install check alone is ordinary, as install-check-review-launch was. The seat chose the install ladder, which is fine. It costs one more reviewer and one independent check.

### N-11 · End records carry no lane

End records carry no `lane`, so the judge must match the end by the start's build id. No variant has two end records for one build id. That input is contrived, because pi-worker writes one end record.
