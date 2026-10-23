# land-reads-ci: plan draft (planner, 2026-10-22, main 61ac64f3)

Feature: FEAT-008 · Integrate and clean up reviewed changes (checked: R-975 to R-1011 and R-588 live there, REQUIREMENTS.md:681-704; its purpose is "check merge prerequisites").
Class: install, hook or gate. The lane changes `nana-land`, a land tool. It touches no nana-setup file and no hook, so the local macOS install check does not apply to it. Ladder: the roster's final reviewer, the land reviewer (the roster sets one, so no seat-land file), the seat's wrong-code pairs, one independent check, and the mutation runner after any seat change.
Builder: the larger builder. Every land on every machine goes through this code.
Stakes: high blast, reversible. A wrong refusal stops every land in a repository with GitHub CI. It fails closed, names its cause and loses nothing. Recovery: land the fix with the fix lane's own `node packages/nana-pack/bin/nana-land.mjs` from its worktree; the PATH command runs main's copy. A wrong pass only returns to today's state.
Objective line: the 2026-10-22 queue, "the audit's next gaps: each closes a hand-made maker or a rule-only reader". CAP-04's install-check deliverable (R-1070) has a rule-only reader today (REQUIREMENTS.md:954). This lane gives CI's result a code reader at the land. It also serves the current priority (macOS and Windows working) and the 2026-10-10 ruling that Windows testing is required.
Threat model: honest variation in our tools' output is in scope. That covers every GitHub run status (queued, in_progress, waiting, requested, pending, completed) and conclusion (success, failure, cancelled, timed_out, action_required, neutral, skipped, stale, startup_failure, null). It covers re-run attempts, several runs for one SHA (pull request and push, a reopen), several workflows, and an empty list for an unpushed tip. On the gh side it covers gh missing, signed out, offline, timing out or printing an error body. On the git side it covers origin spellings (https, scp, ssh, `.git` or not, host case), no origin, a local-path or other-host origin, workflows on main but not the tip and the reverse, a seat whose shell already sets GH_REPO, and a Windows seat. Deliberate forgery is out: a fake gh first on PATH, a hand-edited origin pointing at another repository, or a forged run list. Public repo: no text in this lane names the owner or the owner's work, and examples use `example/fixture`.

## Measured facts the plan rests on (this Mac, gh 2.91.0, git 2.50.1, node 22.22.2, 2026-10-22)

- CI triggers: `.github/workflows/ci.yml:2-5` runs on push to main and on every pull request. A lane tip gets only pull-request runs before its land. Over the last 40 merged lane PRs (#126 to #170), every landed tip had a pull-request run. None had a push run before its land: every push run was created at the merge time.
- Runs API, `repos/{owner}/{repo}/actions/runs?head_sha=<sha>`: 61ac64f3 has two runs of one workflow. Push run #757 (id 39840123612) reports `run_attempt` 2, completed, success. Its attempt-1 jobs include `install-check (windows-latest)` failure. Pull-request run #756 reports attempt 1, success. So the run object already carries its latest attempt.
- Run conclusion versus jobs: in run 39271830210 the Linux leg's job reads failure and the run reads success (the leg's `continue-on-error`, ci.yml:57). In run 39697060728 (383b1588) the Windows suite leg failed and the run reads failure.
- Check-runs API, `commits/<sha>/check-runs`: `filter=latest` returns 12 entries at 61ac64f3, six job names times two suites. It keeps one entry per name per suite, not one per name. The Linux leg's job shows failure inside a green run. It is the wrong source for a land verdict.
- A short SHA (`head_sha=61ac64f3`) returns 0 runs. An upper-case full SHA returns 2. An unknown full SHA returns `total_count` 0.
- gh errors: no remote gives exit 1, "unable to expand placeholder in path: no git remotes found". A local-path remote gives exit 1, "... none of the git remotes configured for this repository point to a known GitHub host". Signed out gives exit 4, "To get started with GitHub CLI, please run:  gh auth login". gh missing from PATH gives spawnSync error ENOENT. The offline text and exit code are inferred, not measured.
- gh accepts `GH_REPO` as `https://github.com/o/r.git`, `git@github.com:o/r.git`, `ssh://git@github.com/o/r.git` or `o/r`, from a folder with no remote. All four returned the same 2 runs. nana-land needs no URL parser for the repository name.
- `git remote get-url origin` with no origin exits 2 ("No such remote 'origin'").
- One runs call takes 0.47 s. A two-run answer is 23,880 bytes.
- Lands versus CI, the last 40 merged lane PRs, state of the tip's pull-request run at the land:

  | state at land | lands |
  |---|---|
  | completed success | 19 |
  | still running, later success | 10 |
  | still running, later failure (both the Windows suite leg) | 2 |
  | cancelled (7 before the land, 2 during it; cause not recorded) | 9 |
  | no run | 0 |

  The 12 running ones would have waited 9 to 36 more minutes (median 22). Green attempt-1 pull-request runs took 21 to 43 minutes (median 33).
- Job finish times in 15 green pull-request runs, minutes after the run started: install-check legs median 2.9 (max 18.5); macOS suite 19.2; Linux suite 14.0; Windows suite 33.8 (max 36.0).
- Other repositories: 15 folders on this machine carry a nana AGENTS.md. Of these, 1 has a github.com origin and a workflow (inferred: nana-pi); 2 have a github.com origin and no workflow. Seven carry a template workflow but have no GitHub remote. Five repositories besides nana-pi have LAND rounds in the review ledger (77, 29, 4, 1 and 1 rounds).
- The motivating case: at 61ac64f3 the pull-request run was green at attempt 1 (18:56 to 19:17) before the land (19:26). The Windows install-check failure was in the push run that the land's push started. No land-time read can see that run. This lane would have passed that land, and it catches the other cases in the table.

## Precedent (this lane's own, in the form the lane will require)

Precedent:
- packages/nana-pack/bin/nana-land.mjs — injectable runners `gitDefault` and `commandDefault` (:20-21) and `runLand`'s signature (:71); the CI read slots in after the uncovered-commits check (:122-126) and before the suite (:127); refusals throw into the one `refused:` catch (:164); land notes and the success text (:23-25, :161-163).
- packages/nana-pack/lib/land-config.mjs — land-time tunables with provenance (:10-35); `LAND_NOTE_PREFIX` (:16-17) for the CI note and `TIP_DIGITS` (:28-29) for short tips in messages, both reused.
- packages/nana-pack/lib/release-status.mjs — origin is the remote of record (`RELEASE_REMOTE_REF`, :17-19, R-585), read through an injected git runner (:21).
- packages/nana-setup/lib/steps.mjs — scp and URL host parsing (:1019-1028). Not moved: it matches pi package-entry spellings (`git:` shorthand, `@ref` pins) and is install code. The new check reads only a git remote URL's host, about five lines.
- packages/nana-pack/tests/land.test.mjs — the fixture harness (:31-71), the injected-runner event log (:122-150), the bare-origin fixture (:658-695), and a command child with HOME and a fake binary first on PATH (:745-760, R-1372).
- packages/nana-pack/tests/ci-workflow.test.mjs — R-1078 (:218-227) and R-1530 and R-1531 (:139-157): the pins that make a green `ci` run mean both install-check legs and the macOS and Windows suite legs passed, with the Linux leg excluded.
- .github/workflows/ci.yml — triggers (:2-5), the install-check job (:20-42), the Linux leg's `continue-on-error` (:57), and release `needs` with its push-only `if` (:87-89).
- docs/reviews/install-check-2026-10-12/CHANGE.md — the warning to read job conclusions, never the run's (:323-324). It was written while the Windows leg was continue-on-error; R-1530 now forbids that for macOS and Windows.
- packages/nana-pack/README.md — the Dependencies line (:6) and the land paragraph (:268).
- templates/_shared/working-under-nana-pi.md — the Land checklist bullet (:29), where the one shared sentence goes.
- AGENTS.md — the install-check step (:148), whose "because `nana-land` reads no CI result" clause becomes false.
- REQUIREMENTS.md — CAP-04's R-1070 `Read by:` lines (:953-954), the rule-only reader this lane turns into code.

## Seat decisions (planner's proposals)

- **D1 · Read workflow runs, not check runs.** nana-land asks the Actions runs API for the tip's full SHA, one page. The run object's status and conclusion are its latest attempt's (measured above), so "latest attempt wins" needs no code and no jobs call. Check runs are wrong: they repeat names across suites, and they show a job CI does not block on as failure inside a green run.
- **D2 · What passes.** Group runs by `workflow_id`; that workflow's newest run is its highest `run_number`. The land passes when at least one run exists and every workflow's newest run is `completed` with `success`. The event does not matter: pull-request and push runs of one SHA are one sequence, and the newest wins. A pull-request run tests the tip merged with origin main as of its trigger. That tree is the tip's whenever origin main was an ancestor of the tip, which nana-land's ff-only rule makes the normal case. The base is not checked (known limit).
- **D3 · One rule for every lane; no class flag, no path list.** In nana-pi a green `ci` run already requires install-check on macOS and Windows (R-1078: no continue-on-error) and the macOS and Windows suite legs (R-1530). It excludes the Linux leg (R-1531). So every lane, not only install, hook or gate lanes, needs both install-check legs green. Why one rule: (1) main's release needs install-check for every lane, so a red leg on an ordinary lane blocks the release the same way. (2) install-check finishes long before the Windows suite leg (median 2.9 against 33.8 minutes), so the extra requirement adds no wait. (3) No flag keeps R-1003 true (four options, no exemptions). (4) A path list would copy AGENTS' class definition into code, where it drifts; a copy is a finding. CI's own file stays the one policy, and ci-workflow.test.mjs already pins it.
- **D4 · Where CI applies.** CI applies when main's origin URL names host `github.com` and the captured main commit tracks at least one `.yml` or `.yaml` file under `.github/workflows`. Both are local, durable git facts. Otherwise nana-land lands as today and prints one note: `[nana-land] note: CI not read: <no origin remote | origin is not on github.com | main tracks no workflow>`. The workflow check reads main, not the tip, so a lane cannot drop its own gate by deleting the workflow. Exit 2 from `git remote get-url origin` means no origin; any other failure refuses. Failing closed everywhere would stop every land in the seven template-workflow repositories with no GitHub remote, for want of CI that does not exist (measured above).
- **D5 · With CI applying, every failure fails closed.** gh missing, signed out, offline or timed out refuses, and so does output that is not a run list. The refusal names the cause and gh's first stderr line. An unpushed tip returns an empty list, so it refuses as "no CI run". There is no override option and no environment escape, matching R-978's retirement (no exemptions).
- **D6 · How gh is called.** `gh api repos/{owner}/{repo}/actions/runs?head_sha=<full tip>&per_page=100`. The cwd is the main checkout and stdin is ignored. The env is the process env with `GH_REPO` set to origin's URL as git prints it, which overrides any GH_REPO the seat's shell set. A time limit and an output bound apply. It is injected as `runGh(cwd, args, { env })`, the same shape as `runCommand`. nana-land parses the JSON itself, with no `--jq`, so the judgement is a pure function the tests reach.
- **D7 · When.** One read, after the review checks and the uncovered-commits check, before the suite. A red or unfinished run then costs no suite run. It is not re-read after the suite or inside the ledger lock. A green newest run changes only if someone starts a new attempt during the suite (known limit).
- **D8 · Output.** On a land, one line per workflow before `push command:`: `ci: <workflow name> run <id> attempt <n> (<event>) success at <tip8>`. A refusal is `refused: CI at <tip8>: <name> run <id> attempt <n> is <status or conclusion>; <remedy>`. The remedy is: wait (unfinished), `gh run rerun <id> --failed` or a fix (failed or timed out), `gh run rerun <id>` (cancelled). With no run: `refused: no CI run for <tip8> on origin; push the branch, open or update its draft PR, then wait for CI`.
- **D9 · Code layout.** A new pure lib `packages/nana-pack/lib/land-ci.mjs` (six-tag header, effects none) holds two functions. `ciScope({ originExit, originUrl, workflowPaths })` returns whether CI applies or the reason it does not. `judgeRuns(stdout, tip)` returns the `ci:` lines or the refusal reason. nana-land makes the git and gh calls and passes their output in. The tunables go in land-config.mjs. `gitDefault` and `commandDefault` switch to the new output-bound name, with no behaviour change, so the 16 MiB literal exists once.
- **D10 · The local macOS install check stays.** It is the owner's 2026-10-12 ruling. AGENTS.md:148 loses only its false reason clause. CAP-04's R-1070 rule line is reworded without "which reads no install-check result". A new line, `Read by: R-1070 · code: packages/nana-pack/bin/nana-land.mjs, packages/nana-pack/lib/land-ci.mjs`, is added.
- **D11 · This lane's own land.** The seat lands it with the worktree's own `nana-land.mjs`, so the first real read is this lane's own pull-request run. A wrong refusal shows before the merge.

Trade: 21 of the last 40 lands would have been refused. Twelve were still running and nine were cancelled. The cost is waiting for CI (Windows leg median 33.8 minutes after start) and re-running cancelled runs. The gain is that no land reaches main while its tip's CI is red or unknown: 2 of 40 did, both on the blocking Windows leg. The ruling that Windows testing is required then holds at the land, not only at release. The post-land push run, where 61ac64f3's flake was, stays outside any land check.

## Must-meet rows (EARS, one shall each) and tests

All tests go in `packages/nana-pack/tests/land.test.mjs`. A shared helper builds a CI fixture: main gets origin `https://github.com/example/fixture.git` (never contacted) and a committed `.github/workflows/ci.yml`. An injected `runGh` stub records each call (cwd, args, env) and answers from a run table. Any `/jobs` or `/attempts/` path gets a failing job list, so code that looks past the run object refuses. The suite stub records whether it ran. Every refusal case asserts code 1, `refused:`, no suite run and main's HEAD unchanged. Main's runLand ignores the unknown `runGh` option, so every test runs on main and fails there instead of crashing.

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2586 | IF CI applies to a land and the newest run of any workflow for the source tip has completed with a conclusion other than success, THEN nana-land shall refuse before running the suite, naming that run's workflow, id, attempt and conclusion. | `packages/nana-pack/tests/land.test.mjs::R-2586: a tip whose newest CI run of a workflow concluded other than success is refused before the suite` |
| R-2587 | IF CI applies to a land and no workflow run exists for the source tip, or the newest run of any workflow is not completed, THEN nana-land shall refuse before running the suite, naming the tip and each unfinished run. | `packages/nana-pack/tests/land.test.mjs::R-2587: a tip with no CI run, or with a newest run still queued or running, is refused before the suite` |
| R-2588 | WHEN CI applies to a land and the newest run of every workflow for the source tip, by run number, has completed with success, nana-land shall run the suite and, on landing, print one `ci:` line per workflow naming its run id, attempt and event. | `packages/nana-pack/tests/land.test.mjs::R-2588: the newest run of each workflow at its latest attempt decides, and the land names it` |
| R-2589 | IF nana-land cannot read the origin remote, or CI applies and gh cannot start, exits non-zero, times out, or prints anything other than a workflow-run list, THEN nana-land shall refuse before running the suite, naming the cause. | `packages/nana-pack/tests/land.test.mjs::R-2589: a CI read that cannot complete refuses before the suite and names the cause` |
| R-2590 | IF the main checkout has no origin remote, an origin whose host is not github.com, or a captured main commit that tracks no `.yml` or `.yaml` file under `.github/workflows`, THEN nana-land shall land without calling gh and print one land note naming which. | `packages/nana-pack/tests/land.test.mjs::R-2590: a repository without GitHub CI lands without calling gh and notes why` |
| R-2591 | WHEN CI applies to a land, nana-land shall ask gh, from the main checkout with GH_REPO set to origin's URL, for one page of the workflow runs whose head SHA is the source tip's full SHA. | `packages/nana-pack/tests/land.test.mjs::R-2591: the CI read asks gh for the full tip SHA in origin's repository` |
| R-2592 | The pack README's land paragraph and the shared working pattern's Land checklist shall each state that nana-land refuses a land until the newest CI run of each workflow for the tip has passed, where origin is on github.com and main tracks a workflow. | `packages/nana-pack/tests/land.test.mjs::R-2592: the pack README and the shared Land checklist say a land waits for the tip's CI` |

Plus one seal test (no row of its own; it names R-2586, R-2587, R-2589, R-2590 and R-2591): `seal: the land reads CI from origin on github.com, workflows under .github/workflows, 100 runs a page, within 30 seconds, and passes only completed success`.

R-2593 to R-2595 stay unused.

### What each test does, and why it is red on main

Main's nana-land never calls gh (grep of nana-land.mjs for `gh`, `actions/runs` and `conclusion`: none). It lands any reviewed tip whatever its CI says.

- **R-2586.** A table of one-workflow cases, each with status `completed` and conclusion failure, cancelled, timed_out, action_required, neutral, skipped, stale, startup_failure or null. Then two more cases. Older run #10 success with newer run #11 failure refuses, naming #11's id. Two workflows, one with a green newest run and one with a red newest run, refuse, naming the red one. Each refusal names the workflow name, run id, attempt and conclusion. Red on main: it lands with code 0.
- **R-2587.** The first case is an empty list (`{"total_count":0,"workflow_runs":[]}`, the measured answer for an unknown SHA); it refuses, naming the tip's eight digits and "no CI run". Then one newest run per status: queued, in_progress, waiting, requested and pending. Then a re-run in progress: `run_attempt` 2, status in_progress, with attempt 1's `success` still in `conclusion`. Each refusal names the run id and its status. Red on main: it lands.
- **R-2588.** Five cases, each landing with code 0 and main at the tip. (a) The measured 61ac64f3 shape: push run #757 at attempt 2, success, and pull-request run #756 at attempt 1, success, in one workflow. One `ci:` line names #757's id, `attempt 2` and `(push)`; the stub's failing jobs answer is never asked for. (b) #10 failure and then #11 success. (c) The same list returned oldest first: #11 still decides. (d) Two workflows, both with green newest runs and one with an older red run: two `ci:` lines. (e) The event log shows the gh call before the suite call. Red on main: no `ci:` line.
- **R-2589.** Origin-read failure: the injected runGit answers `remote get-url origin` with exit 128, and the land refuses. gh failures: error ENOENT, refused naming "gh" and "PATH". Exit 4 with the measured sign-in text, refused naming that line. Exit 1 with `error connecting to api.github.com` (inferred text), refused naming it. A time-out (error code ETIMEDOUT, signal SIGTERM), refused naming the time limit. Bad output: stdout `not json`, `{"message":"Not Found"}`, `{"workflow_runs":{}}`, or a run with no `status` or no `run_number`; each refused as "not a workflow-run list". Red on main: it lands.
- **R-2590.** Six repositories, each landing with code 0, the gh stub never called, and exactly one `[nana-land] note: CI not read:` line naming the reason. They are: no origin; origin a local bare repository (the R-588 fixture shape); origin `https://gitlab.com/example/fixture.git`; origin `https://example.com/github.com/fixture.git`; a github.com origin with the workflow committed only on the tip; and a github.com origin where main tracks only `.github/workflows/README.md`. Red on main: no note.
- **R-2591.** The injected stub records cwd, args and env for five origins: `https://github.com/example/fixture.git`, `https://github.com/example/fixture`, `git@github.com:example/fixture.git`, `ssh://git@github.com/example/fixture.git` and `https://GitHub.com/example/fixture.git`. In each, cwd is main, args equal `["api", "repos/{owner}/{repo}/actions/runs?head_sha=<40-hex tip>&per_page=100"]` (built from the tunables), and `env.GH_REPO` equals the origin URL. One case presets `process.env.GH_REPO` to another value, restored in `finally`; the passed env still names origin. A POSIX-only case runs the nana-land command as a child, with HOME set to a ledger holding the LAND round and a fake `gh` shell script first on PATH. The fake records argv, cwd and GH_REPO and prints a green run list for the tip. The land succeeds and the record matches. On win32 that case prints SKIP: without a shell, Windows starts only an `.exe` for a bare name (inferred; unmeasured). Red on main: gh is never called.
- **R-2592.** The test finds the land paragraph in `packages/nana-pack/README.md` and the one `- Land checklist:` bullet in `templates/_shared/working-under-nana-pi.md`, and asserts each one's exact sentence (kept as literals in the test). R-859 keeps AGENTS.md's region identical. The shared sentence avoids the words "install check", which R-1109's own check forbids inside the region. Proposed sentences:
  - README: "Where `origin` is on github.com and main tracks a workflow under `.github/workflows`, the helper refuses until the newest CI run of each workflow for the tip has passed at its latest attempt."
  - Shared: "Where origin is on github.com and main tracks a workflow, `nana-land` also refuses until the newest CI run of each workflow for the tip has passed, so push the tip and wait for its CI."
  Red on main: both sentences absent.

Existing tests made false: none expected (inferred; the builder's full suite decides). Every existing land fixture has no origin or a local bare origin, so CI does not apply. Their output gains one note line, and every success assertion found uses `match` or `includes`. R-1003, R-981 and R-1109 keep their text (no new option; the README and AGENTS patterns stay; AGENTS.md:148 keeps its pinned phrase).

## Tunables (packages/nana-pack/lib/land-config.mjs)

- `CI_REMOTE` `origin` — contract: R-585 compares main with origin/main (release-status.mjs:17-19). Sealed.
- `CI_HOST` `github.com` — chosen: every hosted CI any nana repository on this machine uses (measured 2026-10-22). GitHub Enterprise is out. Sealed.
- `CI_WORKFLOW_DIR` `.github/workflows` and `CI_WORKFLOW_EXTENSIONS` `[".yml", ".yaml"]` — contract: where GitHub Actions reads workflow files. Sealed.
- `CI_RUNS_PATH` `repos/{owner}/{repo}/actions/runs` — contract: GitHub REST "list workflow runs for a repository" with its `head_sha` filter. gh fills the placeholders from GH_REPO (measured, gh 2.91.0).
- `CI_RUNS_PAGE_SIZE` 100 — contract: the endpoint's `per_page` maximum (GitHub REST docs; inferred, not fetched in this session). Measured 1 to 2 runs per landed tip over 40 lands. Sealed.
- `CI_READ_TIMEOUT_MS` 30000 — chosen: about 60 times one measured call (0.47 s, 2026-10-22). An offline seat gets its refusal within half a minute. Sealed.
- `CI_DONE_STATUS` `completed` and `CI_PASS_CONCLUSION` `success` — contract: GitHub's workflow-run vocabulary. Sealed.
- `CHILD_OUTPUT_MAX_BYTES` 16 MiB — chosen: the bound nana-land.mjs:20-21 already gives git and the suite as an inline literal. A two-run answer measured 23,880 bytes, so 100 runs is about 1.2 MB (inferred by scaling).
- `LAND_NOTE_PREFIX` and `TIP_DIGITS` — existing, reused unchanged.

## Wrong-code pairs (each must turn its test red)

1. Only the first run returned is judged (R-2586: a second workflow's red newest run passes).
2. Any green run passes (`some` instead of every workflow's newest) (R-2586: a newer failure under an older success).
3. The newest run is the lowest `run_number`, or list order (R-2588 case c; R-2586's #10/#11 case).
4. Jobs are read for attempt 1 or for all attempts (R-2588 case a: the stub's failing jobs answer refuses).
5. `completed` with neutral, skipped or null passes (R-2586 table).
6. The conclusion is judged without the status, so a re-run in progress with a stale `success` passes (R-2587).
7. An empty run list passes (R-2587).
8. A gh failure, time-out or bad output is read as "CI does not apply" (R-2589).
9. The CI read comes after the suite (R-2586: the suite stub records a run).
10. The wrong SHA is asked for: the eight-digit tip, or captured main's SHA (R-2591 args).
11. GH_REPO is not passed: left unset, left to the seat's environment, or dropped by the default runner (R-2591: the preset case and the POSIX command case).
12. Where CI applies is read from the tip instead of main (R-2590: the workflow only on the tip makes gh run).
13. The host check matches a substring or any origin (R-2590: `https://example.com/github.com/...` and local-path cases).
14. Any file under `.github/workflows` counts as a workflow (R-2590: the README-only case).
15. Every `git remote get-url origin` failure is read as "no origin" (R-2589: the exit 128 case).

## Known limits (the seat writes them to docs/known-bugs/FEAT-008.md before the final round)

- The run conclusion decides. A job CI marks continue-on-error can fail and the land still passes; today that is only the Linux suite leg (R-1531). R-1078, R-1530 and R-1531 pin which nana-pi jobs block.
- Only GitHub Actions runs on github.com are read. Commit statuses, other apps' check runs and Enterprise hosts are not.
- Where CI applies is read from origin's URL. An ssh host alias for github.com reads as another host, so CI is skipped with a note. That fail-open is visible, not silent.
- A lane that adds a repository's first workflow is not held by it. A lane that deletes main's last workflow is refused for want of a run until main's copy goes.
- A pull-request run tests the tip merged with origin main as of its trigger, and nana-land does not check that base. The trees match when origin main was an ancestor of the tip.
- One read, before the suite: a new attempt started during the suite is not seen.
- A workflow that never ran on the tip, because of path filters or push-only triggers, is not required.
- The latest attempt wins, so a real failure that passes on re-run lands.
- Only the newest 100 runs of one tip are read.
- The post-land push run on main is after the land. A flake there, as at 61ac64f3, holds the template release until re-run (R-597), and nana-land cannot see it.
- The command-level fake-gh case runs only off Windows. On a Windows seat, starting `gh.exe` without a shell is unmeasured (inferred to work: a bare name finds the `.exe`).
- doctor does not report gh or its sign-in, so a seat learns of a missing gh at its first land.
- Each land waits for its tip's CI, and a cancelled run must be re-run first.

## Docs that change

- packages/nana-pack/README.md :6 (Dependencies: nana-land needs the GitHub CLI `gh`, signed in, in a repository whose origin is on github.com and whose main tracks a workflow) and :268 (when CI applies, what passes, the refusals, the `ci:` line, the note).
- templates/_shared/working-under-nana-pi.md :29 and AGENTS.md :97: one sentence, kept byte-identical (R-859). The template release surface changes, so CI tags a release after the land.
- AGENTS.md :148: drop "because `nana-land` reads no CI result"; say the land also reads CI, whose run includes both install-check legs, and that the local run stays by the owner's ruling. R-1109's pinned phrase stays.
- REQUIREMENTS.md: seven rows under FEAT-008; CAP-04's R-1070 `Read by:` lines (D10). Optional FEAT-008 purpose amendment: "integrate only changes every reviewer accepted and CI passed".
- docs/requirements-tree.md and docs/code-map.md regenerated (one new lib module).
- The seat writes docs/known-bugs/FEAT-008.md (the known limits above), HANDOFF and the session note before the final round.
- Unchanged: nana-setup (no doctor row; see Open), review-standard.md, pi-review, review-round, the rulings file, ci.yml.

## Seat steps

- Build with the larger builder. The build brief carries this Precedent section and `Feature: FEAT-008 · Integrate and clean up reviewed changes`.
- Run the wrong-code pairs above as the lane's mutation table, again after any seat change to code or tests.
- Reviews: the roster's final reviewer and the land reviewer, each from another model lineage, on the exact tip that lands, plus one independent check.
- Push the branch and open a draft PR for CI with the Windows leg; the stub-based tests run there.
- Land with the worktree's own nana-land.mjs (D11). Its own pull-request run must be green first.
- Run `node "$HOME/nana-pi/scripts/requirements-moved.mjs" --root . --base main` and carry its output in the final review brief and the land.
- Cross-lane: any lane editing the shared Land checklist bullet or nana-land.mjs merges main if it lands later.

## Open for the seat or the owner (one-word defaults)

- Keep the local macOS install check for setup and hook lanes now that the land reads both CI install-check legs? Default: `keep`. It is the owner's 2026-10-12 ruling, so the owner decides.
- Let a repository without GitHub CI land with a note instead of a refusal (D4)? Default: `note`. The seat can decide; it is listed because it is the one fail-open path.
- Add a doctor row for gh and its sign-in? Default: `later`. It would put nana-setup in this lane.
- Name the failing jobs in a refusal, at one more API call per red run? Default: `no`. The run id and its rerun command are enough to act on.
