# Must-meet · install-check-review-launch

Feature: FEAT-015 · Diagnose the active environment
Falsifiable sentence: after a fresh install, the install check prints FAIL for each installed pi-review launcher (the bin link off Windows; the `.cmd` launcher and the Git Bash launcher on Windows) unless one offline review started through it exits 0, ends its output with `VERDICT: LAND`, records exactly one LAND round for its own item in the temporary home's ledger, and showed the fixture model the whole review standard, the run token and the reviewer role.

Class: ordinary.
- Changes the install check only: its library, config, a new `-e` fixture extension, its test file and the setup README's Install check section. It runs pi-review and the installed launchers but changes neither, nor install, uninstall, doctor, a hook, a shipped extension or the gate.
- Precedent: pi-seat-live-turn and install-check-turn-edit-powershell were ordinary with a `-e` fixture. R-2076 keeps this fixture out of every package manifest.
- A needed change to pi-review, pi-watchdog, review-round, win-shims or steps.mjs makes this an install, hook or gate lane: the build stops and reports instead.
- The lane touches packages/nana-setup: the seat runs the install check on macOS before nana-land and reads CI's Windows install-check leg on the reviewed tip.

Threat model: honest variation in pi's output, the three launcher forms, Git Bash argument handling, git identity and signing config on a runner, temp paths and runner speed is in scope. A forged review file, ledger line or fixture record is out.
Rows go in FEAT-015's table directly after R-2004.

## Design
- install-check-config.mjs, after PI_TURN_POWERSHELL: `PI_REVIEW`, provenance beside every value.
  - fixture `packages/nana-setup/lib/install-check-review.mjs`; provider `nana-install-check-review-fixture`; model `nana-install-check-review` (chosen: neither holds PI_TURN's provider, which the tests match as a substring); pi args `--offline -e <fixture> --provider <p> --model <m> --no-session -p`, built from those names.
  - launcher args `--retries 0` (chosen: the fixture is deterministic; a retry hides a flaky launch and triples a hung wait).
  - runs: off win32 `{label "pi-review", item "install-check-review"}`; win32 `{form "cmd", label "pi-review (cmd)", item "install-check-review-cmd"}` then the same for `sh` (chosen: own items, because review-round's complete() appends a round line for every completed review, read 2026-10-20).
  - folders `review-repo`, `review-out`; fixture file, text, commit message (chosen); git options `-c user.name=… -c user.email=…@example.invalid -c commit.gpgsign=false` (chosen: a runner may give no identity or require signing; probe 2026-10-20).
  - prompt of plain words, letters, digits, spaces and hyphens only (chosen: cmd, winCommand, the `.cmd` launcher and Git Bash pass it unchanged); answer; verdict `LAND`, verdict line built from it (contract: review-standard.md's last-line rule).
  - record `.nana-install-check-review.json` (chosen); tally `.pi/agent/review-ledger.rounds.jsonl` (contract: review-round.mjs ledgerPaths, read 2026-10-20); standard `packages/nana-pack/prompts/review-standard.md` (contract: pi-review.mjs).
  - `SPAWN_TIMEOUT_MS.review` 180000 (chosen: above one attempt's 75 s stall bound plus a 15 s poll, so pi-review's watchdog ends a hung pi first).
- install-check-review.mjs (new, six-tag header, modelled on install-check-turn.mjs): a faux provider whose one response writes `{system, userMessages, role: NANA_ROLE}` to the home's record and answers `<answer>\n\n<verdict line>`. No tool call.
- install-check.mjs, after the turn's result lines and before `hook set`:
  - Build the repo through one git helper whose commands lead with the sealed git options: init, write the fixture file, add, commit. Make the out folder.
  - Per run: remove the record; launch; read the out file, tally, record and the checkout's standard; judge with an exported pure `judgePiReview` whose FAIL detail names the first failing condition (timeout, launch, exit, missing review, verdict line, ledger, missing record, standard, token, role); report the run's label.
  - Off win32: spawn `<home>/.local/bin/pi-review` by that path, the link install writes, not its target. Doctor's R-953 proves it is first on PATH.
  - win32 cmd: winCommand on `<home>\.local\bin\pi-review.cmd` with ComSpec, as the pi session launches; a refusal is FAIL (R-1616 proves it first on Path). win32 sh: the discovered Git Bash reads one line on standard input that names `pi-review` bare with each argument single-quoted, as R-1611's test runs the sh launcher; no Git Bash is FAIL.
  - Every launch: cwd the review repo, the base environment, `SPAWN_TIMEOUT_MS.review`, and `--out <home>/review-out/<item>.md --item <item> <launcher args> -- <pi args, fixture absolute> "<prompt> <token>"`.
  - Print no new informational line (an existing check allows only result, `pi:` and `node:` lines).
- packages/nana-setup/README.md, Install check: the check runs one offline review through each installed pi-review launcher against a throwaway repository, names what fails it, and says the ledger is the temporary home's.

## Must-meet (packages/nana-setup/tests/install-check.test.mjs, directly after the R-2004 checks)
| Row | Text | Test title |
|---|---|---|
| R-2070 | IF the git configuration the install check inherits gives no identity or requires signed commits, THEN the install check shall still commit the sealed fixture file into a review repository at its sealed folder in the temporary home, outside the fixture project. | `pi-review repo: under a git config that forbids a guessed identity and requires signing, real git commits the sealed fixture file in a review repository at the sealed folder outside the fixture project` |
| R-2071 | WHERE the platform is not win32, the install check shall start one review by the path of the temporary home's bin `pi-review` launcher, from the review repository, with an output file outside that repository, the sealed item and launcher arguments, and the sealed pi arguments followed by one prompt holding the run token. | `pi-review launch: off win32, one review starts by the path of the temporary home's bin pi-review from the review repository with the sealed item and arguments, an output outside that repository and a prompt holding the run token` |
| R-2072 | WHERE the platform is win32, the install check shall start two reviews from the review repository, one through the temporary home's `pi-review.cmd` under the command interpreter and one through Git Bash with a command that names `pi-review` bare, each with its own sealed item and output file and the same sealed arguments and prompt. | `pi-review launch: on win32, the temporary home's pi-review.cmd starts under the command interpreter and Git Bash runs a command naming pi-review bare, each once from the review repository with its own item and output` |
| R-2073 | The install check shall print one result line per review run, `pi-review` off win32 and `pi-review (cmd)` then `pi-review (sh)` on win32, that is PASS only when the run exited 0 within the sealed review timeout and the last non-blank line of its output file is exactly the sealed verdict line. | `pi-review lines: one line per run, PASS only when the run exits 0 in time and its output's last non-blank line is exactly the sealed verdict line` |
| R-2074 | IF the temporary home's review tally does not hold exactly one round line for a run's sealed item, or that line's verdict is not the sealed verdict, THEN the install check shall report that run's line as FAIL. | `pi-review ledger: no round line, two round lines or a round line whose verdict is not the sealed verdict for the run's item each fail that run's line` |
| R-2075 | IF the record the review fixture writes during a run, after the install check removed any earlier record, does not hold the checkout's whole review standard in its system prompt, the run token in its user message and the reviewer role, THEN the install check shall report that run's line as FAIL. | `pi-review record: a record missing the whole review standard, the run token or the reviewer role fails, and on win32 the cmd run's record cannot pass the sh run` |
| R-2076 | The install-check review fixture extension shall sit under packages/nana-setup at its sealed path, outside every extension directory that a pi package manifest in the checkout lists. | `fixture: the review fixture extension sits under packages/nana-setup outside every pi package manifest's extension directories` |
| pin | `// req: R-2070, R-2071, R-2072, R-2073, R-2074, R-2075, R-2076` | `pin R-2070 to R-2076: the review's sealed fixture, provider, model, arguments, runs, items, labels, folders, git options, prompt, verdict, record, tally and standard paths, and timeout` |

Red today, all eight (probe 2026-10-20, main 20debe02): install-check.mjs, its config and its test hold no `pi-review` or `PI_REVIEW` text, so no run starts a review, prints a pi-review line or makes a review repository on darwin or win32. PI_REVIEW, judgePiReview and the fixture do not exist, so R-2076 and the pin throw.
R-2070 wrong codes (probe 2026-10-20, real git 2.50 under `user.useConfigOnly=true`, `commit.gpgsign=true`, a missing gpg program): identity options alone exit 128, signing-off alone exits 128, both exit 0. Without them, a temp-home commit on this Mac succeeded through hostname guessing, so only the forced config shows the runner case.
Feasible (probe 2026-10-20, pi 1.0.2, macOS, temp home): pi-review through a bin link with a faux `-e` fixture exited 0 in 1–2 s, bare and with nana-pack, nana-knowledge and pi-subagents 0.75.0 registered. The output was the answer, a blank line and `VERDICT: LAND`; the tally gained one LAND round; the record held the whole 1,356-character standard, the token and NANA_ROLE=reviewer.

## Known limits
- The fixture reads no file and calls no tool: the check proves the launch, the standard's arrival, the verdict read and the ledger write, not a real model's review.
- One attempt only: the watchdog's retry and stall paths stay unexercised. A hung run FAILs after about 90 s; two on Windows add about 6 minutes to the 20-minute job (inferred).
- The check does not prove PATH order; doctor's R-953 and R-1616 rows do, in the same run.
- On Windows the check's timeout kills cmd.exe or bash.exe, not pi-review under it, so a hung review can hold the check to the job's limit (inferred; today's cmd launches of pi share this).
- Windows covers cmd and Git Bash. PowerShell's `.cmd` quirks and pi-worker's launch stay unchecked. Linux runs no install check.
- The unit tests stub pi-review. Only real install-check runs prove the feature: the seat's macOS run and CI's macOS and Windows legs.
- The tally path is the check's own contract copy; if review-round moves the ledger, the line FAILs until the copy moves.