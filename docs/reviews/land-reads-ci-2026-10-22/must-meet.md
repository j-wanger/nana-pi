# land-reads-ci · must-meet (seat, 2026-10-22, after one adversary pass)

Feature: FEAT-008 · Integrate and clean up reviewed changes

Spend line: the current priority (macOS and Windows working, the 2026-10-10 ruling that Windows testing is required) through the owner's 2026-10-22 slate of open audit items. CAP-04's install-check deliverable (R-1070) has a code reader in CI and a rule-only reader at the land ("nana-land reads no CI result"); this lane replaces the rule reader with code. It also turns the seat's own practice, landing only on a green CI run, into a check.

Class: install, hook or gate (it changes `nana-land`, a land tool; no nana-setup file and no hook, so the local install check does not apply). Ladder: the roster's final reviewer, the land reviewer (the roster sets one), the seat's wrong-code pairs, one independent check, and the mutation runner after any seat change. Builder: the larger builder. Stakes: high blast, reversible. A wrong refusal stops every land in a repository with GitHub CI; it fails closed, names its cause and loses nothing. Recovery: main's PATH copy of nana-land lands as today, so a wrong refusal of this lane's own copy becomes a finding, not a lock-out (adversary N12). A wrong pass only returns to today's state.

Threat model: honest variation in our tools' output. Every GitHub run status (queued, in_progress, waiting, requested, pending, completed) and conclusion (success, failure, cancelled, timed_out, action_required, neutral, skipped, stale, startup_failure, null); re-run attempts; several runs for one SHA (pull request and push); several workflows, two with the same `name:`; an empty list for an unpushed tip. gh missing, signed out, offline, behind a refused proxy, timing out or printing an error body; a seat whose shell sets GH_HOST or GH_REPO. Origin spellings (https, scp, ssh, `.git` or not), no origin, a local-path or other-host origin; workflows on main but not the tip and the reverse; a nested folder under `.github/workflows`; a Windows seat. Deliberate forgery is out: a fake gh first on PATH, a hand-edited origin, a forged run list, or a lane deleting its workflows to skip CI (the reviewed diff shows it). Public repo: no owner name, nothing about the owner's work; examples use `example/fixture`.

The planner's draft (`plan-draft.md`) holds the measurements; the adversary's attack (`plan-attack.md`, M 4, S 5, N 12) changed the plan as the decisions below say. Where they disagree with this file, this file wins.

## Precedent

Precedent:
- packages/nana-pack/bin/nana-land.mjs — injectable runners `gitDefault` and `commandDefault` (the bare-name `git` spawn with no shell that already passes on the Windows leg), `runLand`'s signature, the uncovered-commits check the CI read follows, the one `refused:` catch, land notes and the success text.
- packages/nana-pack/lib/land-config.mjs — land-time tunables with provenance; `LAND_NOTE_PREFIX` and `TIP_DIGITS`, reused.
- packages/nana-pack/lib/release-status.mjs — origin as the remote of record (R-585), read through an injected git runner.
- scripts/product-report.mjs — `GITHUB_REMOTE`, the R-1511 contract regex, and its non-throwing origin read; MOVE the regex and a `githubRepoOf(url)` into the pack lib and import it back.
- packages/nana-pack/tests/product-report.test.mjs — R-1511's origin spellings table, the case list for R-2590 and R-2591.
- packages/nana-pack/tests/land.test.mjs — the fixture harness, the injected-runner event log, the bare-origin fixture, and a command child with HOME and a fake binary first on PATH (R-1372).
- packages/nana-pack/tests/ci-workflow.test.mjs — R-1078, R-1530 and R-1531: the pins that make a green `ci` run mean both install-check legs and the macOS and Windows suite legs passed, the Linux leg excluded.
- .github/workflows/ci.yml — triggers (push to main, pull requests), the install-check job, the Linux leg's `continue-on-error`, release `needs`.
- docs/reviews/install-check-2026-10-12/CHANGE.md — the earlier warning to read job conclusions, written while the Windows leg was continue-on-error.
- packages/nana-pack/README.md — the Dependencies line and the land paragraph.
- templates/_shared/working-under-nana-pi.md — the Land checklist bullet, where the one shared sentence goes.
- AGENTS.md — the install-check step whose "because `nana-land` reads no CI result" clause becomes false.
- REQUIREMENTS.md — CAP-04's R-1070 `Read by:` lines.

## Seat decisions

- **D1 · Read workflow runs, not check runs** (draft D1). One page of the Actions runs API for the tip's full SHA. The run object's status and conclusion are its latest attempt's (measured), so no jobs call.
- **D2 · What passes** (draft D2; adversary S3). Group runs by `workflow_id`, never by name; a workflow's newest run is its highest `run_number`. The land passes when at least one run exists and every workflow's newest run is `completed` with `success`. The event does not matter. The pull-request run's base is not checked (known limit).
- **D3 · One rule for every lane** (draft D3; adversary M4, S1). No class flag, no path list: CI's own file stays the policy, pinned by ci-workflow.test.mjs. Times since CI moved to four files at a time (2026-10-22): Windows suite leg 20.7 to 21.5 minutes (runs 39817844688, 39835745432, 39817507050), install-check 0.6 to 0.7 minutes on macOS and 3.3 to 3.6 on Windows, whole runs 20.8 and 23.6 minutes. Install-check ends long before the Windows suite leg, so requiring the whole run adds no wait over requiring install-check alone.
- **D4 · Where CI applies, read from the tip** (adversary M1, M3, N5, N10). CI applies when main's checkout has an `origin` remote whose URL matches the moved `GITHUB_REMOTE` (strict: https, scp or ssh spellings of github.com, optional `.git`, no credentials) and the source tip's tree tracks at least one top-level `.yml` or `.yaml` file in `.github/workflows` (a non-recursive `git ls-tree <tip> -- .github/workflows/`). "No origin" is read from `git remote`'s list, not from an exit code; any other git failure refuses. Otherwise nana-land skips the CI read and prints one note: `[nana-land] note: CI not read: <no origin remote | origin is not a github.com repository URL | the tip tracks no workflow>`.
- **D5 · With CI applying, every failure fails closed** (draft D5; adversary N2). gh missing, signed out, offline or timed out refuses, and so does output that is not a run list. The refusal names the cause and gh's first stderr line (split on `\r?\n`). An unpushed tip refuses as "no CI run". No override option and no environment escape (R-978's retirement; R-1003's four options stay).
- **D6 · How gh is called** (adversary M2, S4). `gh api --hostname <CI_HOST> repos/<owner>/<repo>/actions/runs?head_sha=<full tip>&per_page=<CI_RUNS_PAGE_SIZE>`, owner and repo from `githubRepoOf`, cwd the main checkout, stdin ignored, the process env unchanged (no GH_REPO; `--hostname` overrides GH_HOST, measured). The default runner is an exported factory taking `{ timeoutMs, maxBuffer }` with defaults from land-config; it is injected as `runGh(cwd, args, options)`, the shape of `runCommand`. nana-land parses the JSON itself, so the judgement is a pure function.
- **D7 · When** (draft D7). One read, after the review checks and the uncovered-commits check, before the suite. Not re-read after the suite.
- **D8 · Output** (draft D8). On a land, one line per workflow before `push command:`: `ci: <workflow name> run <id> attempt <n> (<event>) success at <tip8>`. A refusal is `refused: CI at <tip8>: <name> run <id> attempt <n> is <status or conclusion>; <remedy>`: wait (unfinished), `gh run rerun <id> --failed` or a fix (failed or timed out), `gh run rerun <id>` (cancelled). With no run: `refused: no CI run for <tip8> on origin; push the tip to its open pull request, then wait for CI`.
- **D9 · Code layout** (draft D9; adversary M3, N6, N9). New pure lib `packages/nana-pack/lib/land-ci.mjs` (effects none): `GITHUB_REMOTE`, `githubRepoOf(url)`, `ciScope(...)` and `judgeRuns(stdout, tip)`. `scripts/product-report.mjs` imports `GITHUB_REMOTE` back; R-1511's tests stay unchanged. Tunables in land-config.mjs, whose `@purpose` and `@outputs` widen to land-time values; nana-land's `@effects` gains `network (through gh)` and `@inputs` the gh runner. `gitDefault` and `commandDefault` use the named output bound.
- **D10 · The local macOS install check stays** (draft D10; adversary N7). AGENTS.md loses only its false reason clause. CAP-04's R-1070 rule line is replaced by `Read by: R-1070 · code: packages/nana-pack/bin/nana-land.mjs, packages/nana-pack/lib/land-ci.mjs`; the existing ci.yml code reader stays.
- **D11 · This lane's own land** (draft D11). The seat lands it with the worktree's own `nana-land.mjs`, so the first real read is this lane's own pull-request run.
- **D12 · Owner questions, defaults taken** (adversary M4). Gate every lane on its tip's whole CI run: `whole`. During a GitHub outage, land without CI: `wait`. The seat reports both trades to the owner; the build does not wait on them.

## Must-meet rows

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2586 | IF CI applies to a land and the newest run of any workflow for the source tip has completed with a conclusion other than success, THEN nana-land shall refuse before running the suite, naming that run's workflow, id, attempt and conclusion. | `packages/nana-pack/tests/land.test.mjs::R-2586: a tip whose newest CI run of a workflow concluded other than success is refused before the suite` |
| R-2587 | IF CI applies to a land and no workflow run exists for the source tip, or the newest run of any workflow is not completed, THEN nana-land shall refuse before running the suite, naming the tip when no run exists and otherwise each unfinished run's id and status. | `packages/nana-pack/tests/land.test.mjs::R-2587: a tip with no CI run, or with a newest run still queued or running, is refused before the suite` |
| R-2588 | WHEN CI applies to a land and the newest run of every workflow for the source tip, by run number, has completed with success, nana-land shall run the suite and, on landing, print one `ci:` line per workflow naming its run id, attempt and event. | `packages/nana-pack/tests/land.test.mjs::R-2588: the newest run of each workflow at its latest attempt decides, and the land names it` |
| R-2589 | IF nana-land cannot read the origin remote, or CI applies and gh cannot start, exits non-zero, times out, or prints anything other than a workflow-run list, THEN nana-land shall refuse before running the suite, naming the cause. | `packages/nana-pack/tests/land.test.mjs::R-2589: a CI read that cannot complete refuses before the suite and names the cause` |
| R-2590 | IF the main checkout has no origin remote, an origin that is not a github.com repository URL, or a source tip that tracks no `.yml` or `.yaml` file in `.github/workflows`, THEN nana-land shall skip the CI read without calling gh and print one land note naming why. | `packages/nana-pack/tests/land.test.mjs::R-2590: a repository or tip without GitHub CI skips the CI read and notes why` |
| R-2591 | WHEN CI applies to a land, nana-land shall ask gh, from the main checkout, for github.com's one page of workflow runs of origin's owner and repository whose head SHA is the source tip's full SHA. | `packages/nana-pack/tests/land.test.mjs::R-2591: the CI read asks github.com for the full tip SHA in origin's repository` |
| R-2592 | The pack README's land paragraph and the shared working pattern's Land checklist shall each state that nana-land refuses a land until the newest CI run of each workflow for the tip has passed, where origin is on github.com and the tip tracks a workflow. | `packages/nana-pack/tests/land.test.mjs::R-2592: the pack README and the shared Land checklist say a land waits for the tip's CI` |

Plus one seal test naming R-2586, R-2587, R-2589, R-2590 and R-2591: `packages/nana-pack/tests/land.test.mjs::seal: the land reads CI from origin on github.com, workflows in .github/workflows, 100 runs a page, within 30 seconds, and passes only completed success`. R-2593 to R-2595 stay unused.

### What each test does, and why it is red on main

A shared helper builds a CI fixture: main gets origin `https://github.com/example/fixture.git` (never contacted) and the tip a committed `.github/workflows/ci.yml`. An injected `runGh` stub records each call (cwd, args, options) and answers from a run table; any `/jobs` or `/attempts/` path gets a failing job list. The suite stub records whether it ran. Every refusal case asserts code 1, `refused:`, no suite run and main's HEAD unchanged. New tunables are read through a namespace import (`import * as landConfig`) and `land-ci.mjs` is reached only through `runLand`, so each test fails alone on main rather than crashing the file (adversary S5).

- **R-2586.** One-workflow cases, each `completed` with failure, cancelled, timed_out, action_required, neutral, skipped, stale, startup_failure or null. Older #10 success with newer #11 failure refuses naming #11. Two workflows, one green and one red, where the red one's newest run has the lower `run_number`: refuses naming the red one. Two workflows sharing a `name:` with different `workflow_id`s, one red: refuses. Each refusal names workflow, run id, attempt and conclusion. Red on main: it lands.
- **R-2587.** An empty list (`{"total_count":0,"workflow_runs":[]}`) refuses naming the tip's eight digits and "no CI run". One newest run per status: queued, in_progress, waiting, requested, pending. A re-run in progress (`run_attempt` 2, in_progress, attempt 1's `success` still in `conclusion`). Each names the run id and status. Red on main: it lands.
- **R-2588.** (a) The measured 61ac64f3 shape: push run #757 attempt 2 success and pull-request run #756 attempt 1 success in one workflow: one `ci:` line naming #757, `attempt 2`, `(push)`; the jobs answer is never asked for. (b) #10 failure then #11 success. (c) The same list oldest first: #11 decides. (d) Two workflows, both newest green, one with an older red run: two `ci:` lines. (e) The event log shows the gh call before the suite. Each lands with code 0. Red on main: no `ci:` line.
- **R-2589.** The git runner fails reading the remote list or origin's URL: refused. gh failures: error ENOENT (refused naming `gh` and PATH); exit 4 with the measured sign-in text; exit 1 with `error connecting to api.github.com` and the githubstatus line (first line named); exit 1 with a proxyconnect refusal; a time-out (ETIMEDOUT, SIGTERM) naming the limit. Bad output: `not json`, `{"message":"Not Found"}`, `{"workflow_runs":{}}`, a run with no `status`, `run_number` or `workflow_id`: each refused as "not a workflow-run list". Real-runner cases: on POSIX, the exported runner factory against a fake `gh` sleeping 2 s with `timeoutMs` 200 refuses with the time-out; on every platform, the nana-land child with PATH holding only node's folder refuses naming `gh` (the Windows leg's real spawn). Red on main: it lands.
- **R-2590.** Each skips gh (the stub never called), prints exactly one `[nana-land] note: CI not read:` line naming the reason, and lands: no origin; a local bare origin (the R-588 shape); `https://gitlab.com/example/fixture.git`; `https://example.com/github.com/fixture.git`; `https://GitHub.com/example/fixture.git` and a credentials URL (strict regex, known limit); main tracks a workflow but the tip deletes it; the tip tracks only `.github/workflows/README.md`; the tip tracks only `.github/workflows/sub/x.yml`. A workflow committed only on the tip makes CI apply (gh called). Red on main: no note.
- **R-2591.** The stub records cwd, args and options for four origins: `https://github.com/example/fixture.git`, `https://github.com/example/fixture`, `git@github.com:example/fixture.git`, `ssh://git@github.com/example/fixture.git`. In each, cwd is main and args equal `["api", "--hostname", landConfig.CI_HOST, "repos/example/fixture/actions/runs?head_sha=<40-hex tip>&per_page=100"]` built from the tunables. One case presets `process.env.GH_HOST` and `process.env.GH_REPO` to other values (restored in `finally`); the args still carry `--hostname` and origin's repository. A POSIX-only case runs nana-land as a child with HOME holding a ledger with the LAND round, a fake `gh` script first on PATH that records argv and cwd and prints a green run list, and `HTTPS_PROXY=http://127.0.0.1:9` so a missed fake fails offline; the land succeeds and the record matches. Red on main: gh is never called.
- **R-2592.** The test finds the land paragraph in `packages/nana-pack/README.md` and the one `- Land checklist:` bullet in `templates/_shared/working-under-nana-pi.md`, and asserts each one's exact sentence (literals in the test). R-859 keeps AGENTS.md's region identical; the shared sentence avoids the words "install check" (R-1109). Sentences:
  - README: "Where `origin` is on github.com and the tip tracks a workflow under `.github/workflows`, the helper refuses until the newest CI run of each workflow for the tip has passed at its latest attempt."
  - Shared: "Where origin is on github.com and the tip tracks a workflow, `nana-land` also refuses until the newest CI run of each workflow for the tip has passed, so push the tip to its open pull request, do not cancel its run, and wait for CI."
  Red on main: both absent.

Existing tests made false: none expected; every existing land fixture has no origin or a local bare origin, so its output gains one note line. R-1003, R-981, R-1109 and R-1511 keep their text.

## Tunables (packages/nana-pack/lib/land-config.mjs)

- `CI_REMOTE` `origin` — contract: R-585. Sealed.
- `CI_HOST` `github.com` — chosen: the hosted CI every nana repository on this machine uses (measured 2026-10-22). Sealed.
- `CI_WORKFLOW_DIR` `.github/workflows` and `CI_WORKFLOW_EXTENSIONS` `[".yml", ".yaml"]` — contract: where GitHub Actions reads workflow files (top level only). Sealed.
- `CI_RUNS_PATH` `repos/<owner>/<repo>/actions/runs` — contract: GitHub REST "list workflow runs for a repository" with `head_sha`.
- `CI_RUNS_PAGE_SIZE` 100 — measured: `per_page=101` and `150` each return 100 runs (2026-10-22); 1 to 2 runs per landed tip over 40 lands. Sealed.
- `CI_READ_TIMEOUT_MS` 30000 — chosen: about 60 times one measured call (0.47 s, 2026-10-22). Sealed.
- `CI_DONE_STATUS` `completed` and `CI_PASS_CONCLUSION` `success` — contract: GitHub's workflow-run vocabulary. Sealed.
- `CHILD_OUTPUT_MAX_BYTES` 16 MiB — chosen: the bound nana-land already gives git and the suite inline; a two-run answer measured 23,880 bytes.
- `GITHUB_REMOTE` moves from scripts/product-report.mjs to land-ci.mjs unchanged — contract: R-1511.
- `LAND_NOTE_PREFIX` and `TIP_DIGITS` — reused unchanged.

## Wrong-code pairs (the seat runs each; it must turn its test red)

1. Only the first run returned is judged (R-2586).
2. Any green run passes, not every workflow's newest (R-2586).
3. The newest run is the lowest `run_number`, or list order (R-2588 case c; R-2586).
4. Jobs read for attempt 1 or all attempts (R-2588 case a).
5. `completed` with neutral, skipped or null passes (R-2586).
6. The conclusion judged without the status (R-2587: the re-run in progress).
7. An empty run list passes (R-2587).
8. A gh failure, time-out or bad output read as "CI does not apply" (R-2589).
9. The CI read after the suite (R-2586: the suite stub records a run).
10. The eight-digit tip, or main's SHA, asked for (R-2591).
11. `--hostname` dropped, or owner and repo taken from the environment (R-2591: the preset case).
12. Scope read from main instead of the tip (R-2590: the deletion case refuses).
13. The host check matches a substring or any origin (R-2590).
14. Any file under `.github/workflows`, nested ones included, counts as a workflow (R-2590).
15. Every origin-read failure read as "no origin" (R-2589).
16. Runs grouped by name, not `workflow_id` (R-2586: the same-name case).
17. The default runner passes no `timeout` (R-2589: the real-runner time-out case).

## Known limits (the seat writes them to docs/known-bugs/FEAT-008.md before the final round)

- The run conclusion decides: a continue-on-error job can fail and the land still passes (today only the Linux suite leg, R-1531).
- Only GitHub Actions runs on github.com are read; commit statuses, other apps' check runs and Enterprise hosts are not.
- The strict origin regex skips CI, with the note, for an ssh host alias, an upper-case host or a URL with credentials.
- A lane that deletes every workflow is not held by CI; the note says so. A lane that adds the first workflow is held by its own run.
- A pull-request run tests the tip merged with origin main as of its trigger; nana-land does not check that base.
- One read, before the suite: a new attempt started during the suite is not seen.
- A workflow that never ran on the tip (path filters, push-only triggers) is not required.
- The latest attempt wins, so a real failure that passes on re-run lands.
- Only the newest 100 runs of one tip are read.
- The post-land push run on main is after the land; a flake there holds the template release until re-run (R-597).
- Dynamic workflows (such as a code-scanning default setup) run on pull-request heads and would be judged.
- A fork-based origin holds no pull-request runs, so it refuses as "no CI run".
- Removing `origin` locally skips the read with the note.
- The fake-gh command case runs only off Windows; the Windows leg runs the real spawn only through the no-gh case.
- doctor does not report gh or its sign-in, so a seat learns of a missing gh at its first land.
- Each land waits for its tip's CI (about 21 minutes after the last push), a cancelled run must be re-run first, and consecutive lands sit about one CI run apart because each later lane merges main. During a GitHub outage nothing lands.

## Docs that change

- packages/nana-pack/README.md: Dependencies (nana-land needs the GitHub CLI `gh`, signed in, where CI applies) and the land paragraph (when CI applies, what passes, the refusals, the `ci:` line, the note).
- templates/_shared/working-under-nana-pi.md Land checklist and AGENTS.md's marker region: the one sentence, byte-identical (R-859). The template release surface changes, so CI tags a release after the land.
- AGENTS.md install-check step: drop "because `nana-land` reads no CI result"; say the land also reads CI, whose run includes both install-check legs, and that the local run stays by the owner's ruling. R-1109's pinned phrase stays.
- REQUIREMENTS.md: seven rows under FEAT-008; CAP-04's R-1070 reader line (D10).
- docs/requirements-tree.md and docs/code-map.md regenerated.

## Seat steps

- Build with the larger builder; the build brief carries a Precedent section and passes brief-check.
- The pairs above as the lane's mutation table, again after any seat change to code or tests.
- The roster's final reviewer and the land reviewer on the exact tip that lands, plus one independent check.
- Push the branch and open a draft PR for CI with the Windows leg.
- Land with the worktree's own nana-land.mjs (D11); its own pull-request run must be green first. If it wrongly refuses, main's copy lands as today and the refusal becomes a finding.
- `requirements-moved.mjs --root . --base main` output in the final review brief and the land.
- Cross-lane: any lane editing the shared Land checklist bullet or nana-land.mjs merges main if it lands later.
