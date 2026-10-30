# selective-ci — plan (revision 3)

Lane class: `hook: packages/nana-pack/lib/frontier-summary-config.mjs — directly imported by packages/nana-pack/bin/nana-frontier-summary.mjs` (printed by `node scripts/lane-class.mjs --root . --files scripts/ci-select.mjs,scripts/ci-select-config.mjs,scripts/test.mjs,packages/nana-pack/lib/test-runner-config.mjs,scripts/code-map.mjs,scripts/code-map-launch.mjs,code-map.config.json,.github/workflows/ci.yml,packages/nana-pack/bin/nana-main-ci.mjs,packages/nana-pack/lib/main-ci.mjs,packages/nana-pack/lib/main-ci-config.mjs,packages/nana-pack/lib/frontier-summary.mjs,packages/nana-pack/lib/frontier-summary-config.mjs,packages/nana-setup/claude/rules/nana-seat.md,packages/nana-pack/lib/lane-class-config.mjs,packages/nana-pack/tests/ci-select.test.mjs,packages/nana-pack/tests/ci-workflow.test.mjs,packages/nana-pack/tests/test-runner.test.mjs,packages/nana-pack/tests/main-ci.test.mjs,packages/nana-pack/tests/frontier-summary.test.mjs,packages/nana-pack/tests/lane-class.test.mjs,REQUIREMENTS.md,docs/requirements-tree.md,README.md,packages/nana-pack/README.md,docs/known-bugs/FEAT-031.md,docs/known-bugs/FEAT-029.md,docs/reviews/selective-ci-2026-10-30/plan.md,docs/reviews/selective-ci-2026-10-30/measure.mjs,scripts/requirements-tree.mjs`).

The script reads main's gate list, which does not yet hold R-3185's entries. `classify` returns the first match in sorted path order. So once R-3185's entries are in the worktree, the same command prints `gate` for `.github/workflows/ci.yml`; the attack confirms this from the code (inferred, not run).

Ladder for this lane:
- the land reviewer, or `seat-land.md` when the roster prints `land: seat`;
- the seat's wrong-code pairs (listed below);
- one independent check;
- the local macOS install check, because the lane touches a session-start producer and `nana-seat.md`.

Revision 3 takes the adversary's attack (`plan-attack.md`): all four MUST findings, SHOULDs 5 to 9, and notes 10, 13, 14, 15 and 16. Re-measured under the safer rules, the documents-only saving almost vanishes. That is the one new owner question. Base: `feat/selective-ci` at d797a9f1 (main).

## Purpose

The owner, 2026-10-29: "is it possible to do selective CI? Like we probably dont need the full CI for code that were not changed?" He chose option C: "C makes sense to aim for, just make sure we harden code map to cover path based child processes; full run after landing on main, yes issue is the way to go".

The owner, issue 274, on revision 1's three questions: "Defaults for 1 and 3, and do the documentation only for 2".

The agreed reading, after both answers:

- A pull-request push that changes only documents runs the document checks on each of the three suite legs.
- Every other pull-request push runs the full suite on all three systems, as today.
- Main runs the full suite on all three systems after each land, as today.
- When main's full run fails, the workflow posts nothing. Its jobs fail and keep their suite records.
- The seat runs one command at session start and after each land. It reads main's run for the land tip. When any leg or job is red, the seat posts one `next` issue from the owner's account, starting `Seat:`, after the identity scan. A red main does not block the next land.
- `nana-land` waits for a green run on the pull request, as today.
- The CI workflow, the selector, the runner and their config files are gate files from now on.

### Measured (seat prototype in this folder)

`measure.mjs` replays real pull-request pushes against each pushed tree. Revision 3's rules run with `DOCRULE=r3`. Outputs:
- `measure-since.txt`: R-3178 and R-3179 as specified, with every lister declared;
- `measure-since-links-only.txt`: every lister exempted, the lower bound;
- `measure-window-failed.txt` and `measure-variants.txt`: revision 2's figures, kept for comparison.

Per-file seconds come from the Windows suite record of run 40999266815 (240 files, 4496 file-seconds, a 1369 s suite step). The minutes are inferred, scaling that step linearly by summed file-seconds.

The saving under revision 3's rules, over 125 pull-request pushes since 2026-10-24:

| Documents-reader rule | Share of test files on a documents-only push | Est. Windows suite-step minutes per documents-only push | All 125 pushes, of 2852 minutes |
|---|---:|---:|---:|
| revision 2 (traced path values only) | 9.5% | 7.4 | 2652 (93%) |
| revision 3, every lister exempted | 53.5% | 17.3 | 2781 (98%) |
| revision 3, every lister declared | 80.4% | 20.5 | 2822 (99%) |

- The real figure lies between the last two rows. It depends on how many listers R-3179 exempts with a reason.
- The share grows for two reasons:
  - Many non-test hubs call `readdirSync` (MUST 2).
  - A bare `"docs"` folder literal links many modules. Without single-segment folders, the share would be 5.8%. The attack's rule keeps every folder but `.`, so this plan keeps them.
- Revision 2's 9.5% described a rule that misses real helper-mediated reads (attack MUST 1). It does not stand.
- None of the 13 documents-only pushes was a land tip (attack note 10). The saving is all on pre-build pushes.
- The real saving is about 1 to 2% of Windows suite minutes. That is Question 1.

Catch rate for documents-only pushes, failed suite pairs since 2026-10-24: 3 pairs.
- Under revision 3's rule, 2 are caught: `component-audit` and `worker-claude`.
- The one miss is a `mutation-runner` Windows failure. The branch's next push passed, so it is an inferred flake.
- The attack read one log (run 40992301983): a per-case timeout. That is consistent with a flake.
- The record holds no failure a documents change caused. A catch rate over real failures cannot show recall. The read-trace audit below is the recall check.

The harm left at land, stated as the owner's trade: a documents-only lane whose change breaks a test only on Windows or Linux, where the reader rule misses that test. The land's local macOS suite catches every platform-independent miss (A8). Main's full run catches the rest after the land.

## Assumptions

- A1. The selector runs inside each suite leg on `pull_request` events. It diffs `HEAD^1` against `HEAD` of GitHub's merge commit. `fetch-depth: 0` holds both parents (R-686). R-3180 runs the full suite when that does not hold.
- A2. Push events never run the selector, and every leg runs the full suite. Release keeps `needs: [suite, install-check]`.
- A3. Documents (R-3186) take exclusions first:
  - Excluded, so they run the full suite: `templates/**`, `apps/bench/studies/**`, any path with a `fixture` or `fixtures` segment, and generated files. Generated files are read by name: `code-map.config.json`'s `mapPath`, and the requirements-tree output path, exported as a constant from `scripts/requirements-tree.mjs`.
  - Also excluded: every file under `docs/` that is not `*.md`, outside `docs/reviews/`, and every path on a sealed pinned-documents list. The read-trace audit seeds that list.
  - Then the documents: `docs/reviews/**` (any type), other `docs/**/*.md`, root-level `*.md`, and `README.md` anywhere.
  - Shipped Markdown (rules, skills, prompts) is not a document.
- A4. `nana-land` needs no code change. Only the pack README's contract note changes, to say a pull-request run may hold only the document checks. Its `--suite` being the full suite is practice, not something the tool enforces (attack note 10).
- A5. Install-check is unchanged and runs on every pull-request push. A documents-only leg still installs its toolchain, so its wall-time saving is below the suite-step figure (attack note 12).
- A6. The Linux leg stays advisory (R-1531). The main check reports it red from its suite record, even inside a green run.
- A7. The suite record schema is unchanged. A documents-only run's record does not say it ran a subset.
- A8. Every land runs the full locked suite locally on macOS.
- A9. The seat runs the main check at session start and after each land, once that land's main run finishes. It starts from the frontier block's line in Claude Code and in pi. Builders and reviewers never run it.
- A10. `code-map.config.json` and `scripts/code-map-launch.mjs` stay off the gate list. Both change on most map lanes, so gating them would make every map change heavy. What protects the reader rule there is R-3179's guard, which fails `map:check` for an undeclared lister, and R-3178's recall pins. An exemption added in a map lane gets ordinary review, and that goes to FEAT-031's known-bug file.
- A11. The rows sit under FEAT-031. R-3179 changes `map:check`, so FEAT-029's tree entry lists it under Also applies.

## Open choices

- O1. The selector's output: one JSON object (`mode`, `reason`, `files`, `of`), written to `$GITHUB_OUTPUT` as `mode` plus a list file, and one summary line in the log.
- O2. The runner's list flag, which reads newline-separated repository paths. Its name is sealed in `packages/nana-pack/lib/test-runner-config.mjs` beside `JOBS_FLAG`.
- O3. The issue's wording. Its title names `main` and the first failing file or job, with no run id or SHA, so a recurring flake deduplicates by exact title against open issues (attack note 15). The body opens `Seat:` and holds only run id, short SHA, legs, job names and file paths.
- O4. The read-trace preload's form: a `--import` module set through `NODE_OPTIONS`, writing (test, path) pairs to a folder outside git.

## Questions for the owner

Question: Under the safer reader rules, a documents-only push still runs 54 to 80% of test files, which saves about 1 to 2% of Windows suite minutes. Build the documents-only selector anyway, or drop selection and land only the main check, the seat command and the gate list?
Default: drop selection. This lane lands R-3183, R-3184 and R-3185 (the gate entries for `.github/workflows/ci.yml`, `scripts/test.mjs` and `packages/nana-pack/lib/test-runner-config.mjs`). The selector rows are parked as one `next` issue.
What the default gains and misses: gains a lane with no new selection risk and the main-failure path the owner asked for; misses the 2 to 5 Windows suite minutes a documents-only push would save, and the selector machinery a later lane could widen once listers and hubs are resolved.
Cost of a wrong guess: easy to undo — the parked rows and `measure.mjs` stay in this folder, ready for a later lane.
If answered otherwise: build every row below. The builder seeds R-3179's exemptions, and the seat re-measures after build 1 and runs the read-trace audit before the final round.

## Feature

Feature: FEAT-031 · Run checks reliably and without contaminating work

Rows: R-3178 to R-3186, new. World-graph takes R-3170 to R-3177, shops-flows takes R-3161 to R-3169, and the attack confirmed no other worktree uses R-3178 to R-3186. Under the default answer, R-3178 to R-3182 and R-3186 are not entered. Unused IDs are never reused.

Existing rows whose tests may change: R-597, R-1031, R-1313, R-2556, R-2631, R-2632 (the `ci.yml` parse), and R-2998 and R-2999 (the frontier block's watch line). This is a forecast, not a limit.

## Threat model

In scope: honest variation in our own tools and history:
- how our code spells a document path, including through helpers and injected roots;
- listers that take their root as a parameter or through an injected runner;
- merge-commit parents, stacked pull requests, empty diffs, deleted and renamed files, and Windows separators;
- a flaky Windows file, a red base, a leg with no suite record, a red advisory leg inside a green run, a failed non-suite job, and an unfinished newer run;
- the pull-request run and the push run sharing one SHA after a fast-forward land;
- an identity word in a path or branch name that reaches an issue.

Out of scope: deliberate forgery, meaning code written to hide a document read, or a workflow edited to skip the selector. A finding outside the model is a residual.

The harm that matters most is a silent miss: a documents-only pull request whose run is green while a test that reads the changed document fails. Every rule resolves doubt toward the full suite.

## Precedent

- `docs/reviews/selective-ci-2026-10-30/measure.mjs` `r3Readers` — the text-level reader rule R-3178 and R-3179 must at least match. The builder may lift it, but must not copy its anchor-word regex as the only anchor test.
- `scripts/code-map-launch.mjs` — the lexical reader (`quotedEnd`, comment and regex skipping) and the path-value evaluator. Literal scanning and traced values reuse them through new exports, and are not copied.
- `scripts/code-map.mjs` — `impact`, `repoGraph` and the private `linkRepo`. `linkRepo` becomes an export, and the selector imports it (ruling 2026-10-22).
- `code-map.config.json` `launchAlwaysRun` — the shape of `repoReaders` and `repoReadersExempt`.
- `scripts/requirements-tree.mjs` line 644 — the inline `"docs/requirements-tree.md"` target. It becomes an exported constant, which the selector reads.
- `scripts/blast-radius.mjs` `collectChangedPaths` — the git diff call.
- `scripts/test.mjs` `collect()`, which the selector intersects with (attack note 13), and `test-runner-config.mjs` `JOBS_FLAG`.
- `scripts/lane-class.mjs` and `packages/nana-pack/lib/lane-class-config.mjs`, with `packages/nana-pack/tests/lane-class.test.mjs`. Entries are explicit (R-3185). The ` tool` hop cannot reach `test-runner-config.mjs`, because `scripts/test-locked.mjs` also imports it and is not a gate root.
- `.github/workflows/ci.yml` and `packages/nana-pack/tests/ci-workflow.test.mjs`.
- `packages/nana-pack/bin/nana-issue-watch.mjs` and `packages/nana-pack/lib/issue-watch.mjs` — the shape of a seat-side command over a lib with injected `gh`.
- `packages/nana-pack/lib/frontier-summary.mjs` `watchLine` and `renderBlock`, and `frontier-summary-config.mjs` `WATCH_COMMAND_PREFIX` — the new line follows them inside the cap and in the omitted path.
- `packages/nana-setup/claude/rules/nana-seat.md` line 23 — the issue-watch instruction.
- `packages/nana-pack/lib/ci-records.mjs` `readCiRecords` (filtered to the push run's id), `packages/nana-pack/lib/suite-records.mjs` `finalFiles`, `packages/nana-pack/lib/gh-runner.mjs` and `scripts/identity-scan.mjs`.
- `map:search` results taken: `scripts/code-map.mjs`, `scripts/blast-radius.mjs`, `scripts/lane-class.mjs`, `scripts/test-locked.mjs`, `scripts/identity-scan.mjs`, `packages/nana-pack/lib/handoff-issues.mjs`, `packages/nana-pack/lib/issue-watch.mjs`, `packages/nana-pack/lib/land-ci.mjs` and `packages/nana-pack/lib/ci-records.mjs`.

## Outside precedent

- Pants build system (Apache-2.0), `--changed-since` with `--changed-dependents=transitive` — borrow its rule to run more when a change cannot be attributed. Source: https://www.pantsbuild.org/stable/docs/using-pants/advanced-target-selection (from memory; the page was not opened in this session).
- Also looked at: GitHub's `paths-ignore` (skipped, because a skipped workflow gives `nana-land` no run to read), `dorny/paths-filter` (MIT, skipped), and Google's TAP presubmit and post-submit split.

## Must-meet

Selector tests build a throwaway fixture repository with its own `code-map.config.json` and git history, and call the selector with an injected `git`. Each test carries its `req:` marker directly above the test call. Under the default answer to Question 1, only R-3183 to R-3185 are built.

1. **R-3178 — a documents-only change runs every test that may read the changed document.**
   - WHEN every changed path is a document (R-3186), the selector shall return mode `documents`. Its files are every collected test that holds, or reaches through enriched callees, a module linked to a changed document, plus R-3179's readers.
   - A module links to a document D when it holds any of these:
     - a string literal equal to D's repository path, or to any folder above D except `.`;
     - a run of quoted literal segments spelling such a path, as in `join(x, "docs", "known-bugs")`;
     - a literal equal to D's file name while the module holds a repository-root anchor (a traced path value, or a root-anchor name);
     - a traced path value naming D or a folder above it.
   - Fixture, recall pins:
     - `tests/a.test.mjs` defines `const read = (f) => readFileSync(join(ROOT, f))` and calls `read("README.md")`, the shape of `fresh-machine.test.mjs:24`;
     - `tests/b.test.mjs` passes the nested literal `"packages/p/README.md"` to a helper, the shape of `skill-claims.test.mjs:138`;
     - `lib/c.mjs` takes an injected `root` parameter and names `"docs/x.md"`, and `tests/c.test.mjs` imports it.
   - Pins: a change to `README.md` selects `tests/a.test.mjs`. A change to `packages/p/README.md` selects `tests/b.test.mjs`. A change to `docs/x.md` selects `tests/c.test.mjs`. No precision pin: a test that names a document only under a temp folder may be selected.

2. **R-3179 — every listing module is declared or exempted.**
   - `map:check` shall fail, naming the module, while a non-test mapped module calls a listing primitive without an entry in `repoReaders` or in `repoReadersExempt`. Both lists hold a path and a reason each.
   - The listing primitives are `readdirSync`, `readdir`, `opendir`, `opendirSync`, `globSync` and `fs.promises.readdir`, or `git` with `ls-files`, `ls-tree`, `grep`, `archive` or `--name-only`, whether launched or passed to a runner. This applies whatever the argument.
   - Every test that holds or reaches a `repoReaders` module shall be in every `documents` selection.
   - Pins, from the repository's three real shapes: a parameter root with `readdirSync(directory)` (`scripts/known-bugs.mjs:44`), `git -C <param> ls-files` (`scripts/identity-scan.mjs:89`), and an injected runner with `ls-tree` (`scripts/component-audit.mjs:190`). Each undeclared one fails `map:check` naming it. Declared, a change to `docs/x.md` selects its test. Exempted with a reason, it passes and adds nothing.
   - The builder seeds both lists from this scan of the real repository, not from a hand list, and reports the counts.

3. **R-3180 — any other push runs the full suite, and so does every doubt.**
   - The selector shall return mode `full`, naming the reason, and exit 0, WHEN any of these holds:
     - a changed path is not a document under R-3186, with exclusions applied first;
     - `HEAD` does not have exactly two parents;
     - the pull request's base branch, passed in from `github.base_ref`, is not `main`;
     - the changed set is empty;
     - the selection, intersected with the runner's collected set, is empty;
     - git, the graph or the selector fails.
   - Pins:
     - one case per bullet;
     - `templates/_shared/docs/sessions/README.md` gives `full`;
     - `apps/bench/studies/s/fixture/README.md` gives `full`;
     - `docs/code-map.md` gives `full`, read through `mapPath`;
     - `docs/components/x.json` gives `full`;
     - `docs/reviews/l/replay.mjs` gives `documents`;
     - an injected git failure gives `full` and exit 0.

4. **R-3181 — the runner runs exactly the listed files.**
   - WHEN `npm test` gets the list flag, the runner shall run exactly the listed files it collects. The Windows skip list still applies.
   - It shall exit 1, naming the path, when a listed path is not collected. Without the flag, collection is unchanged.
   - Pins: a two-file list gives two result lines and a total of 2. A missing path exits 1 naming it. Running with no flag collects the same count as before.

5. **R-3182 — the workflow fails safe.**
   - In `.github/workflows/ci.yml`, on `pull_request` each suite leg shall run a select step. That step has an `id`, its own `timeout-minutes` and `continue-on-error: true`, and runs over `HEAD^1`, `HEAD` and `github.base_ref`.
   - The list shall reach `npm test` only under `steps.<id>.outputs.mode == 'documents'`, as a conditional argument on the existing one `npm test` step per OS condition. So a missing or garbled output runs the full suite.
   - On `push` no select step runs.
   - `on.pull_request` shall carry no `paths` or `paths-ignore` filter. No `if:` shall skip the suite job, and no job shall hold `issues: write`.
   - Pins come from parsing the workflow:
     - the select step's event condition, timeout and `continue-on-error`;
     - the list guarded by the exact `outputs.mode == 'documents'` test;
     - one `npm test` step per OS;
     - no path filters, no suite-job `if:`, and no `issues` permission.

6. **R-3183 — `nana-main-ci` reports every red on main's run for the land tip, and posts only from the seat's session.**
   - `node "$HOME/nana-pi/packages/nana-pack/bin/nana-main-ci.mjs" --cwd <repo>` shall read the `ci` workflow's `push` runs on `main`, never a `pull_request` run for the same SHA. It reports the newest finished one, and notes any newer unfinished one.
   - For that run it shall read every leg's suite record, filtered to the run's id, and the run's jobs at their latest attempt. It reports red in any of these cases:
     - a file failed in any leg, including the Linux leg inside a green run;
     - a leg left no record;
     - any job failed, including `install-check` and `release`.
   - When the run is red, it prints the failed files and jobs, and the exact `--post` command.
   - With `--post` it builds the title and body (O3). It passes both through the identity scan, and runs `gh issue create --label next` through the local `gh` only when the scan finds nothing and no open issue has the same title. It refuses under a launcher `NANA_ROLE`.
   - Pins, with injected `gh` and fixture records:
     - a SHA carrying a green documents-only pull-request record and a red push record prints the push run's red files;
     - a green run with a red Linux record reports red;
     - a run whose suite records are green but whose `install-check` failed names that job;
     - a newer unfinished run over an older red one reports the red and notes the unfinished run;
     - all green gives no create call;
     - `--post` on red gives exactly one create carrying `--label next`, with a body starting `Seat:`;
     - a same-title open issue gives no create;
     - an identity-word hit gives no post and exits non-zero naming the scan;
     - `NANA_ROLE=worker` gives no post.

7. **R-3184 — the session-start block and the seat rule name the main check.**
   - WHEN the frontier block renders for a project holding `.github/workflows/ci.yml` (an `existsSync` check, no spawn) and the issues pointer, it shall carry one line naming the main-check command. The line sits inside `renderBlock` under the cap, and in the omitted path beside the watch line.
   - It shall be absent under a launcher `NANA_ROLE`. The hook makes no network call and no new process for it.
   - `nana-seat.md` shall tell the seat two things: run the command at session start, and again after each land once that land's main run finishes; and post with `--post` when it reports red.
   - Pins:
     - the line appears for a fixture with the workflow, and is sealed in `frontier-summary-config.mjs`;
     - it is absent under `NANA_ROLE=reviewer` and without the workflow;
     - it is present in the omitted-block output;
     - the seat rule holds both sentences.

8. **R-3185 — CI's selection files are gate files.**
   - `packages/nana-pack/lib/lane-class-config.mjs` shall class each of these as `gate`, with the reason "CI verdict nana-land reads":
     - `.github/workflows/ci.yml`;
     - `scripts/ci-select.mjs`;
     - `scripts/ci-select-config.mjs`;
     - `scripts/test.mjs`;
     - `packages/nana-pack/lib/test-runner-config.mjs`.
   - The entries are explicit, because the ` tool` hop needs every non-test caller to be a tool root, and `scripts/test-locked.mjs` also imports the runner config.
   - Pins: `node scripts/lane-class.mjs --root . --files <path>` prints a `gate` line with that reason, for each of the five.
   - Under the default answer to Question 1, the two selector paths are left out until the selector lane.

9. **Seal (one test, naming its row).** R-3186: A3's exclusions and document patterns, and the pinned-documents list, are defined once in `scripts/ci-select-config.mjs`. Exclusions are applied first. Every other assertion imports them.

### Seat acceptance after build 1 (recorded checks, not suite tests)

- **Read-trace audit (the recall check, for the selector rows).** Run the full suite once with a `--import` preload set through `NODE_OPTIONS`, so children inherit it. It logs every `readFileSync`, `readFile`, `fs.promises.readFile` and `createReadStream` path. For each (test, tracked document) read, ask the built selector what it selects for a change to that document. A pair it does not select is a FAIL. Fix the rule, or put the document on the pinned list (so it runs the full suite), before the final round. Record the list in this folder after the identity scan.
- `measure.mjs` against the built selector, with the declared and exempt lists the R-3179 scan forced. Compare it with the table above.
- One real documents-only push, with its select line, suite-step minutes and leg wall time.
- `nana-main-ci` against main's real newest push run, without `--post`.
- The lane-class line re-printed after build 1. It is expected to print `gate`.

### Wrong-code pairs (gate ladder)

The seat takes the attack's six, and adds two for MUST 1 and SHOULD 5. Each pair is a deliberate wrong change that the named must-meet test must fail:

1. The selector classes `packages/p/rules/r.md` as a document. Caught by R-3180 and R-3186.
2. The workflow passes the list on `push`. Caught by R-3182.
3. The runner ignores the list flag. Caught by R-3181.
4. The selector returns `documents` on a git failure. Caught by R-3180.
5. `nana-main-ci` posts after an identity-scan hit. Caught by R-3183.
6. The main-check line renders under `NANA_ROLE=reviewer`. Caught by R-3184.
7. The reader rule requires an anchor-traced value, so it misses the `read("README.md")` helper. Caught by R-3178.
8. `nana-main-ci` reads the pull-request run's records for the tip SHA. Caught by R-3183.

Under the default answer to Question 1, pairs 1, 2, 3, 4 and 7 wait for the selector lane.

### Known bugs to record at land

- FEAT-031: a documents-only run's suite record does not say it ran a subset (A7).
- FEAT-031: an exemption or rule change in a map lane gets ordinary review (A10).
- FEAT-031: a document read through a route neither the reader rule nor the audit saw is missed until main's full run.
- FEAT-031: a red main is reported only when the seat runs the check.
- FEAT-031: `nana-land` does not enforce a full `--suite` (A4).
- FEAT-029: the written map does not list document links.
