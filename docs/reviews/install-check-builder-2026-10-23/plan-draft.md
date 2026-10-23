# install-check-builder · plan draft (planner, 2026-10-23, main dbb98cbb)

Feature: FEAT-015 · Diagnose the active environment

Spend line: the owner's 2026-10-23 pick, "Builder launch in the install check — the install check also starts one lane builder, so a machine proves its builder launch works." It serves the install half of the 2026-10-24 priority. It also closes half of FEAT-015's known bug "A pi-review launch from PowerShell stays unchecked. So does pi-worker's launch."

Stakes: medium blast, reversible. The lane changes the install check only: its library, its config, its test file and the setup README. Every push runs the check in CI, and every install lane runs it locally before its land. So a false FAIL would block lands. No stored format changes. A revert restores main.

Every claim below is marked measured or inferred. Raw data and scripts: scratchpad `icb-plan/` (`runs.json`, `jobs.json`, `logs/`, `timings.json`, `fetch.mjs`, `extract.mjs`, `ci-win-39916343360.log`, `ci-mac-39916343360.log`; probes `probe1.sh`, `probe2.sh`, `probe-a.sh`, `probe-b.sh`, `probe-c.sh` and their folders). No probe ran `nana-setup install` or touched the real home. The checkout's `git status --ignored` was identical before and after the probes (measured).

## What I measured

**The route to pi.** pi-worker's lane mode refuses every caller pi argument (`packages/nana-pack/bin/pi-worker.mjs:124`). So `-e <fixture>`, `--offline` and `--provider`, which the review check passes, cannot reach the builder's pi. The builder's provider and model come only from the user-scope roster (`pi-worker.mjs:125-141`, `:187`). Measured, by reading.

**Correction to the brief's framing: no new test model is needed, and no pi-worker change.** The review check's fixture (`packages/nana-setup/lib/install-check-review.mjs`) also loads from pi's user settings `extensions` list, not only from `-e`. With that entry and a roster whose builder names the fixture's provider and model, the installed pi-worker runs one offline lane build unchanged. Measured, probes 1 and 2.

Probes on this Mac (temp HOME and TMPDIR under the scratch folder; `env -i`; pi 1.0.2):
- P1. Fixture in user settings, fixture roster, no pack. `pi-worker --lane install-check-build --brief <outside> --out <outside> --lane-size small` from a linked worktree on `feat/install-check-build`: exit 0 in 777 ms.
- P2. The same, plus the checkout's nana-pack and nana-knowledge as local packages in user settings: exit 0 in 1,066 to 1,147 ms (n=4). A bare `pi -p` turn in the same home took 389 to 485 ms (n=3). So pi-worker's own cost is about 0.6 to 0.7 s here.
- In P1 and P2:
  - The output file held exactly the fixture's reply: its answer line, a blank line and `VERDICT: LAND` (65 characters, no other text).
  - The fixture record's role was `worker`.
  - Its system prompt held the whole builder preamble, rendered with the worktree and branch, byte for byte with its final newline.
  - It also held the whole brief, byte for byte.
  - The only user message was pi-worker's fixed instruction.
  - The clone's `.git/nana/build-records.jsonl` held one start and one end with one build id: outcome `ok`, exit 0, one matched session, cost $0.00.
  - The lane lock was gone.
- P2's system prompt held nana's writing tag `<nana-writing>`. It did not hold the rulings heading, because the rulings copy comes from install (measured). So the writing tag is the fingerprint that proves the installed pack loaded in the builder.
- `PI_OFFLINE=1`: P1 passed with it and without it, also behind a dead proxy, at 779 to 786 ms each. Measured. The variable is still the only way lane mode can keep the review check's no-network contract (pi `docs/cli.md:229-230`, `docs/environment-variables.md:84`).
- Failure output (measured):
  - a. With the fixture missing from settings, pi-worker exits 1. Its last stderr line is its build-record summary. pi's own error, `Error: Unknown provider "nana-install-check-review-fixture". …`, is in the output file.
  - b. With a stale lane lock, pi-worker exits 1. Its last stderr line is the refusal `pi-worker: lane refused: worktree lock … exists (recorded pid …)`. It writes no output file.
  - c. With no roster, pi-worker starts the default builder `openai-codex gpt-6-luna` and exits 1. The output file says `No API key found for openai-codex.`
  - So the cause a reader needs sits in the output file for a pi failure and in stderr for a refusal.
- Git: `git worktree add -b feat/<lane> <folder>` exits 0 under `user.useConfigOnly=true`, `commit.gpgsign=true` and a missing gpg program, with or without the review's sealed git options. The worktree's metadata folder is named after its folder. Measured.

Reading the code (measured, by reading):
- Install writes `pi-worker` beside `pi-review` (`packages/nana-setup/lib/steps.mjs:89-95`), as sh and `.cmd` shims on Windows (`steps.mjs:814-815`). So the check can launch the installed pi-worker exactly as it launches pi-review.
- The review check's three launch forms are one switch inside the review loop (`packages/nana-setup/lib/install-check.mjs:422-436`). Its judge is `judgePiReview` (`:264-284`). The check's existing failure text helper is `reason()` (`:340`) and its path comparison is `comparablePath()` (`:162-165`).
- The check already edits the installed `nana-pack.json` in the temporary home for post-edit (`:347-355`), and does not restore it (FEAT-015 known bug, "doctor in the install check now reads a config whose post-edit block the check rewrote").
- pi-watchdog passes pi-worker's environment to pi (`packages/nana-pack/bin/pi-watchdog.mjs:193`). So `PI_OFFLINE` in the launch env reaches pi.
- pi-worker takes its lock at `<worktree git folder>/nana-lane.lock` (`pi-worker.mjs:382`). It records it in the start record (`:276`), writes the output before the end record (`:365-369`) and releases the lock last (`:370`).
- The ledger path is `<git common folder>/nana/build-records.jsonl` (`packages/nana-pack/lib/build-records-config.mjs:11`).
- Doctor reads only `packages` from pi's user settings (`packages/nana-setup/lib/doctor.mjs:258`). It holds no roster read (grep). The roster notice hook check reads only the notice prefix (`install-check.mjs:170-180`). So leaving the fixture roster and settings entry in the temporary home changes no later row today (inferred).
- `.gitattributes` sets `eol=lf`, so the preamble's bytes match on Windows too.
- Builder preamble on shared-helpers (`feat/shared-helpers`, 77cba752) adds one line. The check reads the checkout's preamble, so it follows any edit.

CI timings (measured): the last 40 `ci.yml` runs, 2026-10-23 00:13 to 07:16 UTC, 9 branches. That gave 34 green install-check jobs per OS. Times are from line stamps in `logs/`.

| Step | macOS | Windows |
|---|---|---|
| one review run | median 1.37 s (0.86 to 2.51) | cmd median 3.32 s (2.08 to 3.83); Git Bash median 2.97 s (1.93 to 3.51) |
| whole install check | median 27.6 s (15.8 to 40.3) | median 47.4 s (29.2 to 52.0) |
| job limit | 20 min (`.github/workflows/ci.yml:26`) | 20 min |

Inferred cost: one build run costs about one review run plus pi-worker's 0.6 to 0.7 s. That adds about 1.5 to 2.5 s on macOS and about 6 to 10 s for two Windows runs.

## Design

One block after the review runs and before `hook set`. It reuses the review repository, the review fixture and the review's launch forms.

1. **One launch helper for both launchers.** Move the review loop's three branches (`install-check.mjs:424-436`) into one local helper inside `runInstallCheck`: `launchInstalled(name, form, args, { cwd, timeout, env })`. The path form starts `<home>/.local/bin/<name>`. The cmd form starts `<name>.cmd` through `winCommand` with `ComSpec`. The sh form pipes one line naming `<name>` bare to Git Bash, each argument single-quoted with the existing `shellQuote`. A missing Git Bash or a cmd refusal stays an `ELAUNCH` error. The review loop calls it with `pi-review` and today's options, so its behaviour does not change. Subtraction test: a copy would duplicate 13 lines and let the forms drift; the helper is smaller. R-2071 and R-2072 guard the move.
2. **Point the temporary home at the test model.** After the review loop, read, merge and write two installed files, as the post-edit edit does (`:347-355`). The roster goes into `<home>/.pi/agent/nana-pack.json` under `roster`. The review fixture's absolute path is appended to `extensions` in `<home>/.pi/agent/settings.json`. Every other member stays. A missing or non-object file is left alone, as post-edit does; the build then fails naming pi's own error (P-a, P-c). Use one small local helper for the two edits; leave the post-edit edit as it is. The edits come after the reviews so the review's pi does not load the fixture twice (inferred risk). Subtraction test: lane mode refuses pi arguments, so these two entries are the only route (measured). Restoring both files afterwards was dropped. No later row reads either value today (measured by grep), and the post-edit edit set the precedent of not restoring.
3. **One linked worktree per run, in the review repository.** For each run, `git worktree add --quiet -b feat/<lane> <home>/build-worktrees/<lane>` through the existing `reviewGit` helper. A failed review-repository setup or worktree add makes that run's line FAIL as `launch`, naming the git failure through `reason()`. Subtraction test: reusing the review repository costs no new commit. One lane per run is needed because a worktree holds one branch, the ledger is shared by the clone, and its records are matched by lane.
4. **One brief per run, outside the worktree.** Write `<home>/build-out/<lane>-brief.md`: the sealed heading, the sealed task sentence ending in the run token, a `Precedent:` label and one entry, the review repository's committed fixture file. No `Feature:` line. Subtraction test: the Precedent entry is the least that passes pi-worker's brief check; the token ties the record to this run. A Feature line would only exercise the known-bug attachment (Known limits).
5. **One build per run.** Remove the fixture record. Then call `launchInstalled("pi-worker", run.form, ["--lane", lane, "--brief", brief, "--out", out, ...PI_BUILD.launcherArgs], { cwd: worktree, timeout: SPAWN_TIMEOUT_MS.build, env: { ...childEnv, ...PI_BUILD.env } })`. The output goes to `<home>/build-out/<lane>.md`. Subtraction test: `--lane-size small` is the documented small-lane launch and stays valid if a roster sets a larger builder. `--max-secs 120` must stay below the check's own timeout: on Windows that timeout ends only cmd.exe or bash.exe, so pi-worker's ceiling is what ends a hung build, writes its end record and frees the lock (inferred, the review's known limit). `PI_OFFLINE` stays for the no-network contract.
6. **A pure judge, `judgePiWorker`, exported beside `judgePiReview`.** It takes the launch result, the output text, the fixture record, the rendered preamble, the brief text, the ledger text, the lane and the expected lock path, and whether that lock exists. It returns the first failing condition, in this order:

| Code | Fails when | Detail on the line |
|---|---|---|
| `timeout` | the launch hit the build timeout | `build timed out after <ms> ms` |
| `launch` | the launcher could not start, or setup failed | the launch error |
| `exit` | the launcher exited nonzero | `exit status <n>; <first non-blank line of the output file, else the launcher's last stderr line>` |
| `missing-report` | the output file cannot be read | `build output could not be read` |
| `report` | the output's last two non-blank lines are not the fixture's answer line and verdict line | names both lines |
| `missing-record` | no readable fixture record | names the record file |
| `preamble` | the system prompt lacks the checkout's builder preamble rendered for this worktree and branch | names the preamble |
| `brief` | the system prompt lacks the whole brief | names the brief |
| `writing` | the system prompt lacks nana's writing tag | names the tag |
| `role` | the record's role is not `worker` | names the role |
| `build-record` | the ledger lacks exactly one start and one end for this lane, joined by one build id, with the fixture provider and model in the start and outcome `ok`, exit 0 in the end | names the lane |
| `lock` | the start record does not name `<review repo>/.git/worktrees/<lane>/nana-lane.lock`, or that file still exists | names the expected path |

   Subtraction test: each condition is one item of the owner's list (worktree and brief check through exit 0, the preamble and brief, the build record, the report, the lock), except two. The writing tag is the one visible proof that the builder's pi loaded the installed pack (P2). The exit detail is measured: without the text line, a refusal and pi's own error both read as `exit status 1` (P-a, P-b, P-c). Lines are compared exactly after splitting on CRLF or LF, as `judgePiReview` does. Paths compare through `comparablePath`.
7. **One result line per run.** `pi-worker` off win32; `pi-worker (cmd)` then `pi-worker (sh)` on win32. The check prints no new informational line.

Dropped:
- A builder-specific fixture or a role branch in the fixture. The review fixture's reply is enough, and the fixture and R-2076 stay untouched.
- Restoring the two edited files (part 2).
- Judging the end record's tokens, cost or session match. On Windows the session folder key is untested here; a mismatch would block the lane on a build-records bug outside its scope.
- A `Feature:` line and the known-bug attachment.
- `nana-roster set` instead of a JSON merge. It refuses inside a pi model shell, which is where a builder runs the check (pack README, Machine roster).
- The Claude Code larger builder. It needs a real `claude` and login.
- PowerShell for either launcher (Open question 1).

## Class

Install lane, as the seat's brief sets it: Opus final reviewer (`claude-review`), astra land reviewer (`pi-review`), the seat's wrong-code pairs, one independent check, the local macOS install check, and CI's Windows install-check leg on the reviewed tip. The roster's land slot is astra, so no `seat-land.md` is written.

The claim I expect to be read differently: install-check-review-launch (2026-10-20) classed the same kind of change ordinary. It changed only the install check and ran pi-review without changing it. This lane is the same shape. It changes no install, uninstall, doctor, hook, pi extension, gate policy or review tool. If a reviewer follows that precedent, the ladder drops to one final reviewer; the seat's brief keeps the install ladder.

A needed change to pi-worker, pi-watchdog, build-records, win-command, steps.mjs or the review fixture stops the build, which reports instead.

## Threat model

Honest variation in our tools' output and machine state is in scope:
- the three launcher forms, Git Bash argument handling and cmd quoting through `winCommand`;
- Windows 8.3 temp paths (`RUNNER~1`) against long forms, and native real-path spellings;
- a runner's git identity and signing config (measured: worktree add needs neither);
- cold node and pi starts on a hosted Windows runner (review runs 1.9 to 3.8 s, measured);
- pi printing other lines before the reply in the output file;
- a pi-worker that refuses (roster, precedent, lock, branch), and pi failing (unknown provider, no login);
- the caller's environment when a builder runs the check: `NANA_ROLE` and `PI_CODING_AGENT_DIR` are stripped by `buildEnvironment`, and pi-worker sets its own `NANA_WORKTREE_ROOT`.

Deliberate forgery is out:
- a forged ledger line or a fixture record written by something other than the fixture;
- a `pi-worker` shim placed first on PATH that fakes success;
- a hand-edited roster or settings file during the run.

A finding outside the model is a residual. The public repo carries no owner name and nothing about the owner's work.

## Precedent

Precedent:
- docs/reviews/install-check-review-launch-2026-10-20/must-meet.md — the review check's design: rows, runs per platform, the judge's first-failing-condition order, the fixture, the pin and the known limits this lane mirrors.
- docs/reviews/win-flake-hardening-2026-10-23/plan-draft.md — the plan shape.
- packages/nana-setup/lib/install-check.mjs — the review block (`:401-443`), its launch switch (`:422-436`) that part 1 moves into a shared helper, `reviewGit` (`:405`), `judgePiReview` (`:264-284`), `reason()` (`:340`), `okay()` (`:339`), `comparablePath()` (`:162-165`), `shellQuote` (`:286-288`), and the post-edit config edit (`:347-355`).
- packages/nana-setup/lib/install-check-config.mjs — `PI_REVIEW` (`:94-126`) with provenance on every value, `PI_TURN.writingTag` (`:65`), `SPAWN_TIMEOUT_MS` (`:130-133`), and the rule that the check keeps its own contract copies (`:20-21`).
- packages/nana-setup/lib/install-check-review.mjs — the fixture, reused unchanged.
- packages/nana-setup/tests/install-check.test.mjs — `recordingRun` (`:219-308`), `reviewArgument` (`:201-206`), the R-2071 to R-2075 checks (`:1330-1456`), the review pin (`:1480-1507`) and the files-written check (`:777-815`).
- packages/nana-pack/lib/win-command.mjs — `winCommand` (`:50-60`).
- packages/nana-pack/bin/pi-worker.mjs — read only: lane checks (`:93-124`), roster and lane size (`:125-141`), pi argv (`:187-188`), lock (`:381-405`), records and output (`:261-328`, `:351-379`).
- packages/nana-pack/lib/build-records-config.mjs — read only: the ledger subpath (`:11`) and outcomes (`:17`).
- packages/nana-pack/lib/brief-precedent.mjs — read only: the `Precedent:` label form (`:47-54`) and the launch check (`:82-127`).
- packages/nana-pack/README.md — the Lane builder and Machine roster sections, the contract this check proves.
- packages/nana-setup/README.md — the Install check section (`:456-464`), a README contract.

Departures, each named:
- The two config edits stay in the temporary home, like the post-edit edit (part 2).
- The build judge reads the output's last two lines where the review judge reads one. A build has no verdict contract; the two lines prove the fixture's whole reply reached `--out`.
- The exit detail adds one text line where the review's says only the status. Measured: that line is the cause.
- The ledger subpath, the lock name and the preamble placeholders are the check's own copies, not imports from nana-pack. This follows the check's independent-contract rule.

## Must-meet rows (FEAT-015)

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2681 | WHERE the platform is not win32, the install check shall start one lane build by the path of the temporary home's bin `pi-worker` launcher, from a linked worktree of the review repository on the sealed lane's `feat/` branch, with the sealed lane and launcher arguments, a brief and an output file outside that worktree, and the sealed offline environment value. | `packages/nana-setup/tests/install-check.test.mjs::pi-worker launch: off win32, one build starts by the path of the temporary home's bin pi-worker from a linked worktree of the review repository on the sealed lane branch, with the sealed arguments, a brief and output outside that worktree and the offline value` |
| R-2682 | WHERE the platform is win32, the install check shall start two lane builds, one through the temporary home's `pi-worker.cmd` under the command interpreter and one through Git Bash with a command that names `pi-worker` bare, each from its own linked worktree on its own sealed lane branch with its own brief and output file. | `packages/nana-setup/tests/install-check.test.mjs::pi-worker launch: on win32, the temporary home's pi-worker.cmd starts under the command interpreter and Git Bash runs a command naming pi-worker bare, each once from its own worktree on its own lane branch with its own brief and output` |
| R-2683 | The install check shall print one result line per build run, `pi-worker` off win32 and `pi-worker (cmd)` then `pi-worker (sh)` on win32, that is PASS only when the run exited 0 within the sealed build timeout and the last two non-blank lines of its output file are the review fixture's answer line and verdict line. | `packages/nana-setup/tests/install-check.test.mjs::pi-worker lines: one line per run, PASS only when the run exits 0 in time and its output's last two non-blank lines are the fixture's answer and verdict lines` |
| R-2684 | IF the record the review fixture writes during a build run, after the install check removed any earlier record, does not hold in its system prompt the checkout's builder preamble rendered for that run's worktree and branch, the run's whole brief and nana's writing tag, or does not hold the worker role, THEN the install check shall report that run's line as FAIL. | `packages/nana-setup/tests/install-check.test.mjs::pi-worker record: a record missing the rendered builder preamble, the whole brief, the writing tag or the worker role fails, and on win32 the cmd run's record cannot pass the sh run` |
| R-2685 | IF the review repository's build ledger does not hold exactly one start record and one end record for a run's sealed lane, sharing one build id, with the fixture's provider and model in the start record and outcome ok with exit 0 in the end record, THEN the install check shall report that run's line as FAIL. | `packages/nana-setup/tests/install-check.test.mjs::pi-worker ledger: no record, a start without an end, two starts, a mismatched build id, only another lane's records, another model, or an end that is not ok with exit 0 each fail that run's line` |
| R-2686 | IF a build run's start record does not name the lane lock file in that run's worktree folder under the review repository's git folder, or that file still exists after the run, THEN the install check shall report that run's line as FAIL. | `packages/nana-setup/tests/install-check.test.mjs::pi-worker lock: a start record naming another lock path, or a lane lock still present after the run, fails that run's line` |
| R-2687 | IF a build run's launcher exits with a nonzero status, THEN the install check shall name in that run's FAIL line the exit status and the first non-blank line of the run's output file, or the launcher's last standard-error line when that file is missing or blank. | `packages/nana-setup/tests/install-check.test.mjs::pi-worker exit: a failed build's line names the exit status and pi's first output line, or the launcher's last stderr line when there is no output, such as a lane refusal` |

Seal test (one for the new sealed set; it compares imported names with literals):
- `packages/nana-setup/tests/install-check.test.mjs::pin R-2681 to R-2687: the build's sealed runs, lanes, labels, folders, brief text, launcher arguments, offline value, roster, settings path, ledger, lock, preamble, role and outcome, and its timeout above the lane ceiling` names R-2681 to R-2687.

R-2688 to R-2690 stay free. Rows go in FEAT-015's table directly after R-2076, each `untested` first, then `implemented` with backticked `file::title` evidence when its check passes. Add no heading. R-2070 to R-2076 keep their text and titles.

The two config edits (part 2) have no row of their own. Their effect is judged in the real run: the fixture provider in the start record (R-2685) and the writing tag and record (R-2684). A unit check of file contents would only confirm the implementation.

### What each test does, and why it is red on main

All seven run through `recordingRun` and the pure judge. Main has no `PI_BUILD`, no `judgePiWorker`, no pi-worker call and no pi-worker line, so every check is red on main on every platform.

- **R-2681.** `recordingRun({ platformName: "linux" })`. Find calls whose command, arguments or input name `pi-worker` and `--lane`; expect one. Assert:
  - the command is `<home>/.local/bin/pi-worker`;
  - cwd is `<home>/build-worktrees/<lane>`;
  - an earlier `git` call in the review repository ran `worktree add --quiet -b feat/<lane> <that folder>`;
  - the arguments deep-equal `["--lane", lane, "--brief", brief, "--out", out, ...PI_BUILD.launcherArgs]`, and neither path starts with the worktree;
  - no `--` appears;
  - `options.env.PI_OFFLINE` is `"1"`;
  - the timeout is `SPAWN_TIMEOUT_MS.build`;
  - the only pi-worker line is `PASS pi-worker`.
- **R-2682.** `recordingRun({ platformName: "win32" })`. Expect two pi-worker calls.
  - The cmd call runs `ComSpec` with `windowsVerbatimArguments`, and its last argument holds the quoted `pi-worker.cmd` path but not `pi-worker.mjs`.
  - The Git Bash call has no arguments and one input line starting `'pi-worker' `, without the bin path.
  - Each run's lane, worktree, brief and output appear in exactly one call.
  - The lines are `PASS pi-worker (cmd)` then `PASS pi-worker (sh)`.
- **R-2683.** Judge variants, each with its code: `timeout`, `launch`, `exit`, a missing output file (`missing-report`), the two lines swapped (`report`), only the verdict line (`report`), and a trailing tab on the verdict line (`report`). A passing variant ends with CRLF and a blank line of spaces and tabs. Then one `recordingRun` per platform asserts the PASS lines in order.
- **R-2684.** Judge variants, each with its code:
  - the preamble with its placeholders not filled (`preamble`);
  - the preamble rendered for another worktree (`preamble`);
  - the brief cut by one character (`brief`);
  - no writing tag (`writing`);
  - role `reviewer` or none (`role`).
  - Then `recordingRun({ platformName: "win32" })`, with the stub writing the record only for the cmd form: `PASS pi-worker (cmd)` and `FAIL pi-worker (sh) — missing-record:`.
- **R-2685.** Judge variants, each `build-record`: an empty ledger; a start without an end; two starts and one end; start and end with different build ids; only another lane's records; another model in the start; an end with outcome `failed`; an end with exit 1. A passing ledger also holds another lane's complete pair.
- **R-2686.** Judge variants, each `lock`: a start record naming `<review repo>/.git/nana-lane.lock`; a correctly named lock that still exists. A correctly named lock that is gone passes.
- **R-2687.** Judge variants:
  - (1) Exit 1, no output file, stderr ending `pi-worker: lane refused: worktree lock X exists (recorded pid 1)`: the detail holds `exit status 1` and that refusal.
  - (2) Exit 1, output file `Error: Unknown provider "x". …`, stderr ending with a `pi-worker: build record: failed` line: the detail holds the output line, not the stderr line.
  - (3) An output file of blank lines: the detail falls back to stderr.
  - One `recordingRun` with a stubbed refusal asserts the printed FAIL line holds the refusal.

Existing tests the change touches (listed edits, not new tests):
- `recordingRun`'s stub install also writes `pi-worker`, and `pi-worker.cmd` on win32. Its stub spawn gains a pi-worker branch that writes the output file, the fixture record (worker role, the rendered preamble, the brief read from `--brief`, the writing tag) and the two ledger lines, and takes no lock.
- R-1072's files-written check (`:777-815`) gains each run's brief and output and the ledger, and treats `.local/bin/pi-worker` as install's. Its title stays; FEAT-015 already notes that title is stale.
- R-2070 to R-2075 keep their titles. R-2070's real-git override now also runs the real worktree add (measured: it exits 0 under that config).

## Tunables

All in `packages/nana-setup/lib/install-check-config.mjs`, as `PI_BUILD` after `PI_REVIEW`, plus one `SPAWN_TIMEOUT_MS` member. All are sealed by the one pin test.

| Name | Value | Provenance |
|---|---|---|
| `PI_BUILD.runs.default` | `[{ label: "pi-worker", lane: "install-check-build", form: "path" }]` | chosen 2026-10-23 (R-2681, R-2683): one path launch off Windows, as the review's |
| `PI_BUILD.runs.win32` | `[{ label: "pi-worker (cmd)", lane: "install-check-build-cmd", form: "cmd" }, { label: "pi-worker (sh)", lane: "install-check-build-sh", form: "sh" }]` | chosen (R-2682, R-2683): cmd then Git Bash, as the review's; own lanes because a worktree holds one branch and the ledger is matched by lane |
| `PI_BUILD.worktreeFolder` | `"build-worktrees"` | chosen (R-2681, R-2682): worktrees outside the review repository |
| `PI_BUILD.outFolder` | `"build-out"` | chosen (R-2681): briefs and outputs outside every worktree |
| `PI_BUILD.branchPrefix` | `"feat/"` | contract: `pi-worker.mjs:104`, read 2026-10-23 (R-2681) |
| `PI_BUILD.briefHeading` | `"# Install check build"` | chosen (R-2684) |
| `PI_BUILD.briefTask` | `"Build nothing and report one line for"` | chosen (R-2684): the run token follows it |
| `PI_BUILD.precedentLabel` | `"Precedent:"` | contract: `brief-config.mjs:10` and the label form at `brief-precedent.mjs:53` (R-2578, R-2681) |
| `PI_BUILD.launcherArgs` | `["--lane-size", "small", "--max-secs", "120"]` | contract: the pack README's small-lane launch; chosen 120 s so pi-worker's ceiling ends a hung build before the check's timeout (R-2681) |
| `PI_BUILD.env` | `{ PI_OFFLINE: "1" }` | contract: pi 1.0.2 `cli.md:229-230`, the `--offline` equivalent; lane mode refuses pi arguments (`pi-worker.mjs:124`) (R-2681) |
| `PI_BUILD.roster` | `{ scout: null, builder: { provider: PI_REVIEW.provider, model: PI_REVIEW.model, thinking: null }, reviewer: <same>, land: null }` | contract: R-1122's roster shape; chosen: the review fixture's names, pi's default thinking (R-2685) |
| `PI_BUILD.settings` | `[".pi", "agent", "settings.json"]`, key `"extensions"` | contract: pi 1.0.2 `settings.md`, Resources (R-2684) |
| `PI_BUILD.ledger` | `[".git", "nana", "build-records.jsonl"]` | contract: `build-records-config.mjs:11`, read 2026-10-23 (R-2685) |
| `PI_BUILD.lock` | `[".git", "worktrees"]` and `"nana-lane.lock"` | contract: `pi-worker.mjs:382`; git names the folder after the worktree's folder (measured 2026-10-23) (R-2686) |
| `PI_BUILD.preamble` | `"packages/nana-pack/prompts/builder-preamble.md"`, placeholders `"{{WORKTREE}}"`, `"{{BRANCH}}"` | contract: `pi-worker.mjs:146-147` (R-2684) |
| `PI_BUILD.role` | `"worker"` | contract: `pi-worker.mjs:188` (R-2684) |
| `PI_BUILD.outcome` | `"ok"` | contract: `build-records-config.mjs:17` (R-2685) |
| `SPAWN_TIMEOUT_MS.build` | `180000` | chosen 2026-10-23 (R-2683): above the 120 s ceiling plus pi-worker's start, brief check and record writes; equal to the review's |

Reused unchanged: `PI_REVIEW.provider`, `.model`, `.answer`, `.verdictLine`, `.record`, `.fixture`, `.fixtureFile`, `.repoFolder`, `.gitOptions`; `PI_TURN.writingTag`.

Module headers to update: `install-check.mjs` `@outputs` names build judgments; `install-check-config.mjs` `@outputs` names the build contract. The test file keeps its header.

## Wrong-code pairs (the seat runs each; each must turn its test red every run)

None is Windows-only: the win32 cases run through `recordingRun` on any system. Only CI's Windows leg proves the real cmd and Git Bash builds.

1. Main's code (no build block) → R-2681, R-2682, R-2683.
2. Off win32, `pi-worker` launched by bare name → R-2681.
3. The build started from the review repository instead of the worktree → R-2681.
4. The worktree's branch without `feat/` → R-2681.
5. The brief or output written inside the worktree → R-2681.
6. `PI_OFFLINE` dropped from the launch env → R-2681.
7. `--max-secs` dropped from the launcher arguments → R-2681 and the pin.
8. On win32, the cmd form runs `node pi-worker.mjs` instead of `pi-worker.cmd` → R-2682.
9. On win32, the Git Bash form names the bin path → R-2682.
10. On win32, both runs share one lane and worktree → R-2682.
11. The judge reads only the exit status → R-2683.
12. The judge reads only the last non-blank line → R-2683.
13. The preamble condition dropped → R-2684.
14. The preamble rendered without its placeholders filled → R-2684.
15. The brief condition dropped → R-2684.
16. The writing-tag condition dropped → R-2684.
17. The role condition dropped → R-2684.
18. The record not removed before each run → R-2684's win32 case.
19. The ledger judge counts any lane → R-2685.
20. The ledger judge ignores the end's outcome or exit → R-2685.
21. The ledger judge does not join by build id → R-2685.
22. The ledger judge ignores the start's provider and model → R-2685.
23. The lock judge checks only that the named file is gone → R-2686.
24. The lock judge dropped → R-2686.
25. The exit detail as `judgePiReview` gives it (status only) → R-2687.
26. The exit detail always from stderr → R-2687's case 2.
27. The exit detail always from the output file → R-2687's case 1.
28. Any sealed value changed, or `--max-secs` at or above the build timeout → the pin.

The seat's real-run checks on macOS (scratch edits in the worktree, reverted; not mutation-runner pairs):
- R1. The settings edit skipped → `FAIL pi-worker — exit: exit status 1; Error: Unknown provider "nana-install-check-review-fixture". …` (P-a).
- R2. The roster edit skipped → `FAIL pi-worker — exit: exit status 1; No API key found for openai-codex.` (P-c).
- R3. The settings edit writes only `extensions`, dropping `packages` → `FAIL pi-worker — writing: …` (inferred from P1 against P2).

## Windows notes

- CI runs the check from Git Bash (`ci.yml:27-29`). The cmd and Git Bash builds are its children, as the reviews are.
- On Windows the check's timeout kills cmd.exe or bash.exe, not pi-worker. pi-worker's 120 s ceiling ends a hung build instead (inferred, the review's known limit).
- pi-worker resolves the worktree by the native real path (`pi-worker.mjs:211`). The check's home is already the native real path (`bin/install-check.mjs:18`). So the rendered preamble and the lock path should match `path.join(home, …)` (inferred). A mismatch fails loudly as `preamble` or `lock`, not silently.
- pi-worker's CPU sampler starts a PowerShell each 15 s poll. A build that ends in about 3 s exits before the first poll, so no cold PowerShell start is on its path (inferred from the exit race, `pi-watchdog.mjs:216-225`).
- `winCommand` refuses a double quote, `%`, `!`, a carriage return, a line feed, NUL and a trailing backslash in arguments (`win-command.mjs:49-57`). The build's arguments are temp paths and plain words, as the review's are.

## Known limits (the seat writes them to FEAT-015's known-bug file before the final round)

- The fixture calls no tool. So the gate's lane write boundary and post-edit under pi-worker stay unchecked in a real build.
- Only the small pi builder runs. A Claude Code larger builder (`claude -p`) stays unchecked: it needs a real `claude` and login.
- The brief carries no `Feature:` line, so the known-bug attachment stays unchecked.
- The check does not judge the end record's tokens, cost or session match.
- The fixture roster and the settings entry stay in the temporary home. The later hook and doctor rows read that home; no row reads either value today.
- Real builds do not set `PI_OFFLINE`. The probes showed no difference in outcome.
- One attempt only. The stall and ceiling paths stay unexercised. A hung build fails after about 120 s; two on Windows add about 4 minutes to the 20-minute job (inferred).
- The worktree is untrusted, so pi-worker prints its trust line and project post-edit stays inert. The check does not judge that line.
- The builder's output is the review fixture's reply, which ends in a LAND verdict line. It is a fixture reply, not a builder report.
- Windows covers cmd and Git Bash. PowerShell stays unchecked for both launchers.
- The unit tests stub pi-worker. Only real install-check runs prove the feature: the seat's macOS run and CI's macOS and Windows legs.
- The ledger subpath, lock name and preamble placeholders are the check's own copies. If pi-worker moves one, the line fails until the copy moves.
- Linux runs no install check.

## Not verified

- Any build on Windows, through cmd or Git Bash. Every probe ran on this Mac.
- That pi-worker's native real path for the worktree matches `path.join(home, …)` on a Windows runner.
- A build after a real `nana-setup install`. The probes registered the pack by hand and did not run install, by instruction. P2's output had no extra line; an installed rulings copy or pi-subagents could add one before the reply (the two-line rule tolerates text before the reply).
- How PowerShell passes `--` and a spaced argument to a `.cmd` launcher (Open question 1).

## Docs that change

- `packages/nana-setup/README.md`, Install check (`:458`, `:464`):
  - The first paragraph adds that the check runs one offline lane build through each installed pi-worker launcher, in a linked worktree of that throwaway repository. It also says the turn, review and build use local test models.
  - The FAIL paragraph names what fails a pi-worker run, as the table in Design part 6 lists. It says a failed run names pi-worker's refusal or pi's own error.
  - It says that before the builds the check points the temporary home's roster builder at the test model and lists the review fixture in pi's user settings.
  - The readme check is the test of these claims.
- `REQUIREMENTS.md`: R-2681 to R-2687 in FEAT-015 after R-2076.
- `docs/requirements-tree.md` and `docs/code-map.md` regenerated; `map:check` green.
- Seat notes, in the reviewed change before the final round:
  - FEAT-015: the line "on Windows the review runs from cmd and Git Bash only. A pi-review launch from PowerShell stays unchecked. So does pi-worker's launch." loses its last sentence, and gains one for the build's own Windows forms. Add the Known limits above.
  - HANDOFF: queue item 4 drops "the builder launch in the install check"; a Landed line; the session entry.
- Unchanged: pi-worker, pi-watchdog, build-records, win-command, the review fixture, install, doctor, every hook and extension, the CI workflow.

## Seat steps

1. Cut `feat/install-check-builder` from main at `~/nana-pi-wt/install-check-builder`. It shares no source file with shared-helpers (measured: that branch touches `bounded-spawn-child.mjs` and `project.mjs` in nana-setup, not the install check). Whichever lands second merges main and regenerates `REQUIREMENTS.md`'s tree and the code map.
2. Run one adversary pass on this draft. Commit the must-meet of record and build brief 1. The brief carries `Feature: FEAT-015 · Diagnose the active environment` and a Precedent section from the list above. It names the move of the review's launch branches into the shared helper, because the preamble now says to import and never copy. Run `node "$HOME/nana-pi/packages/nana-pack/bin/brief-check.mjs" --brief <file> --tree <worktree>`.
3. Build with the larger builder, as an install lane: `pi-worker --lane install-check-builder --brief … --out … --lane-size larger`. The roster's larger builder is `openai-codex gpt-5.6-sol high`.
4. Seat checks on the build tip:
   - `node packages/nana-setup/tests/install-check.test.mjs`;
   - `npm run test:locked`, `map:check`, the readme check and the trace;
   - `node scripts/requirements-moved.mjs --root . --base main`, carried into the review briefs and the land.
5. Run `node packages/nana-setup/bin/install-check.mjs` locally on macOS, per the owner's ruling. Expect `PASS pi-worker` after `PASS pi-review`. Record the step's time. Then run real-run checks R1 to R3, each on a scratch edit that is reverted.
6. Run pairs 1 to 28 through the mutation runner. Re-run it after any seat change to code or tests, before the review.
7. Push a draft PR. CI's Windows install-check leg must show `PASS pi-worker (cmd)` and `PASS pi-worker (sh)`. Record both times and keep both CI logs in the lane's review folder, as install-check-review-launch did.
8. Write the notes before the final round.
9. Run the Opus final reviewer, the astra land reviewer and the one independent check on the exact tip.

## Open questions to the owner

1. **PowerShell for both launchers.** Nothing checks a pi-review or pi-worker launch from PowerShell, Windows Terminal's default shell.
   - A third form in the shared helper would cover both at once.
   - Against doing it here: it changes the landed review row R-2072 ("two reviews") and its test.
   - It adds one cold PowerShell start to the Windows job: 6 to 15+ s, measured by win-leg-flakes.
   - It risks blocking this lane on an unmeasured PowerShell quirk.
   - The quirks would hit pi-review harder: its arguments carry `--` and a spaced prompt. pi-worker's lane arguments carry neither (inferred).
   - It is the owner's call because it widens his pick and changes a landed row.
   - Default: **later** (one follow-up lane adds PowerShell to both launchers through this lane's helper).
