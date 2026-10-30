# selective-ci — plan

Lane class: `ordinary` (printed by `node scripts/lane-class.mjs --root . --files scripts/ci-select.mjs,scripts/ci-select-config.mjs,scripts/main-failure-issue.mjs,scripts/test.mjs,packages/nana-pack/lib/test-runner-config.mjs,scripts/code-map.mjs,scripts/code-map-launch.mjs,scripts/code-map-launch-config.mjs,code-map.config.json,docs/code-map.md,.github/workflows/ci.yml,packages/nana-pack/tests/ci-select.test.mjs,packages/nana-pack/tests/ci-workflow.test.mjs,packages/nana-pack/tests/test-runner.test.mjs,packages/nana-pack/tests/code-map-launch.test.mjs,packages/nana-pack/tests/main-failure-issue.test.mjs,REQUIREMENTS.md,docs/requirements-tree.md,README.md,docs/known-bugs/FEAT-031.md,docs/known-bugs/FEAT-029.md,docs/reviews/selective-ci-2026-10-30/plan.md,docs/reviews/selective-ci-2026-10-30/measure.mjs,packages/nana-pack/README.md,packages/nana-pack/lib/lane-class-config.mjs,packages/nana-pack/tests/lane-class.test.mjs`).

The script prints `ordinary` because this plan leaves `packages/nana-pack/bin/nana-land.mjs` unchanged (A6). Adding nana-land to the list prints `gate: packages/nana-pack/bin/nana-land.mjs — land tool`. Question 3 asks whether to run the gate ladder anyway.

Base: `feat/selective-ci` at d797a9f1 (main).

## Purpose

The owner, 2026-10-29: "is it possible to do selective CI? Like we probably dont need the full CI for code that were not changed?" He chose option C: "C makes sense to aim for, just make sure we harden code map to cover path based child processes; full run after landing on main, yes issue is the way to go".

The agreed reading is the owner's pick of C:

- A pull-request push that changes only documents runs the document checks, not the whole suite.
- Any other pull-request push runs, on each of the three suite legs, the test files the code map says the change can reach. It adds every always-run test and the document checks.
- A change to a file outside the code map runs the whole suite.
- The full suite runs on all three systems on main after each land. A failure there opens a GitHub issue labelled `next` and does not block the next land.
- `nana-land` waits for a green run on the pull request, as today.

The map-spawn-edges lane (landed d797a9f1) did the hardening the owner named: launch edges, blind reach and the `launchAlwaysRun` list. This lane builds the selector on that map. It also closes the four map gaps FEAT-029 names for this lane: no machine-readable output, unmapped files, computed `import(...)`, and renamed or injected runners. Each gap closes by running more tests, never fewer.

### Measured (seat prototype in this folder)

`measure.mjs` in this folder is a prototype of the rules below. It replays real pull-request pushes against each pushed tree, using the current linker and the current `launchAlwaysRun` list. Its outputs are `measure-since.txt`, `measure-window-failed.txt` and `measure-variants.txt`. Per-file seconds come from the Windows suite record of run 40999266815 (240 files, 4496 file-seconds, a 1369 s suite step at four jobs). Inferred, not measured: the estimated minutes scale that step linearly by summed file-seconds. The 360 s `land.test.mjs` sets a floor of about 6 minutes for any selection that holds it.

Saving, 122 pull-request pushes since 2026-10-24 whose base and head the logs name:

| Mode | Pushes | Mean share of test files | Est. Windows suite-step minutes (full: 22.3) |
|---|---:|---:|---:|
| documents only | 13 | 9.5% | 7.4 |
| selective | 39 | 78.6% | 21.1 |
| full | 70 | 100% | 22.3 |
| all | 122 | 83.5% | 2479 of 2784 minutes in total (89%) |

- The rules save about 11% of Windows suite minutes. The saving is almost all in documents-only pushes, which fall from about 22 to about 7 minutes.
- A code push saves about one minute. The always-run list holds 169 of 240 tests, including every slow file, so a selection still runs the long poles.
- Full runs: 36 pushes changed shipped Markdown under `packages/` (skills, rules, prompts), 25 changed the runner or the code map and its config, across seven lanes (hive-render 7, map-spawn-edges 5), 6 changed `package.json` and 3 changed a workflow.
- Variants (`measure-variants.txt`): if every non-test hub launch were resolved by hand, the share falls to 78.5% and minutes to 87%. Selecting document readers by file or folder name anywhere in a test, instead of by traced path, gives 93%. Treating shipped Markdown as documents saves under 1% more (88% against 89%).

Catch rate, failed suite pairs (run, leg, failing file):

- Since 2026-10-24: 40 pairs, 37 caught, 3 missed. All three are Windows-only failures on documents-only pushes: `mutation-runner`, `component-audit` and `worker-claude`. Each branch's next push passed. They are inferred flakes, not misses a change caused. Under the plan, main's full run would catch any that recur.
- Whole window since 2026-10-08: 4365 pairs, 4334 caught, 31 missed. 26 of the misses are in three Windows-fix lanes from 2026-10-16 to 2026-10-18, when the Windows leg was widely red. The map-spawn-edges replay classes 27 of the 31 as `unreached` and one as red on base. They were not re-checked one by one. Most of the code-map lane's old `outside map` misses now run the full suite.

Honest reading: C as specified catches every past failure a change could have caused. It saves little on code pushes until blind reach shrinks. Question 2 asks whether to build all of it now.

## Assumptions

- A1. The selector runs inside each suite leg on `pull_request` events. It diffs `HEAD^1` against `HEAD` of the merge commit GitHub checks out (`fetch-depth: 0` already holds both parents, R-686). That diff is the lane's change against the base it will land on, because `nana-land` merges only by fast-forward. The selector writes no artifact that another job reads.
- A2. Push events, which means main after a land, never run the selector. Every leg runs the full suite, as today. The release job keeps `needs: [suite, install-check]`.
- A3. A document is a path under `docs/`, a Markdown file at the repository root, or a `README.md` anywhere. Shipped Markdown elsewhere (rules, skills, prompts, templates) counts as outside the map, so it runs the whole suite. This costs under 1% of minutes (measured) and keeps install and rule changes on the full suite.
- A4. Document readers are found by the linker's existing path-value rule (R-3149's anchors), now applied in every mapped module, not only launching ones. A traced path value naming a tracked document, or a tracked folder that holds one, links that module to it. The links are computed by the selector. The written map does not list them.
- A5. The install-check job is unchanged and runs on every pull-request push. It is shorter than the Windows suite leg, so a documents-only push is still bounded by the suite leg.
- A6. `nana-land` needs no code change. It already judges the newest run of each workflow for the tip. A selective run concludes `success` or `failure` like a full one, because its suite legs always run. Only the pack README's contract note changes, to say the run may be selective.
- A7. The Linux leg stays advisory (`continue-on-error`, R-1531). The post-land issue job still reports its failures.
- A8. Every land already runs the full locked suite locally on macOS. So a selective miss can reach main only on Windows or Linux.
- A9. The suite record schema is unchanged. A selective run's record lists only the files it ran, and nothing in the record marks it selective. This goes to FEAT-031's known-bug file.
- A10. Hand resolution of hub launches (the code-map lane's Question 1 alternative) is out of scope. Measured, it moves minutes from 89% to 87%.
- A11. The rows sit under FEAT-031. R-3181 and R-3182 change the code map, so FEAT-029's tree entry lists them under Also applies.

## Open choices

- O1. The builder picks the selector's output format. It must be one JSON object on stdout or in a file (`mode`, `reason`, `files`, `of`) and one summary line in the leg log. It closes FEAT-029's "no machine-readable selector output" line.
- O2. The builder picks how the runner reads the list: a flag carrying a file path, newline-separated repository paths. The flag name is sealed in `packages/nana-pack/lib/test-runner-config.mjs` beside `JOBS_FLAG`.
- O3. The builder picks the issue's title and body wording. The body holds only the run id, short SHA, leg names and file paths. Deduplication is by exact title against open issues.
- O4. The builder picks the hidden-load site kinds' names and their map-entry wording (R-3181). They are sealed in `scripts/code-map-launch-config.mjs`.
- O5. The full-run set of R-3180 is computed, not listed: the selector, the runner, every module either imports, and `code-map.config.json`. The builder may add a hand list only for files the import walk cannot see, with a reason each.

## Questions for the owner

Question: Who posts the issue when main's full run fails after a land: the workflow, as GitHub's bot account, or the seat, from your account at its next session start?
Default: the workflow posts it, as GitHub's bot, after the identity scan. The body is built only from run id, short SHA, leg and file paths.
What the default gains and misses: gains an issue within minutes of the failure, with no seat session needed; misses the rule that only the seat posts, from your account, so the issue watch and HANDOFF see a post by an author they have never read.
Cost of a wrong guess: hard to undo — issues are public, and a wrong post can be deleted but may already have been read.
If answered otherwise: the workflow only fails the job and keeps the suite records. A seat-side command reads main's newest full run at session start, and the seat posts from your account with `Seat:` and the identity scan.

Question: The rules save about 11% of Windows suite minutes. Documents-only pushes fall from about 22 to 7 minutes; a code push saves about one minute. Build all of C now, or only the documents path rule and the post-land issue?
Default: build all of C now, as you chose.
What the default gains and misses: gains one selector that saves more by itself as blind reach shrinks, since the documents rule needs the same graph and runner list; misses a smaller lane with the same 7-minute documents pushes and less review surface for a silent miss.
Cost of a wrong guess: easy to undo — impact selection is one branch of the selector, and full mode stays the fallback.
If answered otherwise: drop R-3179 and make every non-document push full. R-3181 and R-3182 still land, because document readers need them.

Question: The lane-class script prints `ordinary`, because nana-land's code is unchanged. A silent miss would harm every later land, though. Should this lane add the CI workflow, the selector and the runner to lane-class's gate list, so it and later lanes get the gate ladder?
Default: yes. Add `.github/workflows/ci.yml`, `scripts/ci-select.mjs` and `scripts/test.mjs` to `packages/nana-pack/lib/lane-class-config.mjs` as `gate` ("CI verdict nana-land reads"), with a test that pins it. Once the entry lands in this lane, the script prints `gate` for this lane too.
What the default gains and misses: gains the land reviewer, wrong-code pairs and one independent check on the code that decides what CI runs; misses nothing on safety, but lanes that touch only the runner will get more review than today.
Cost of a wrong guess: easy to undo — one list entry.
If answered otherwise: the lane runs as ordinary, with one final reviewer, and the plan's must-meet tests are the only guard.

## Feature

Feature: FEAT-031 · Run checks reliably and without contaminating work

Rows: R-3178 to R-3186, new. World-graph takes R-3170 to R-3177 (its plan attack names R-3177), and shops-flows takes R-3161 to R-3169. The highest row on main is R-3160.

Existing rows that stay true and whose tests change: R-597 (CI runs the suite on pushes and pull requests), R-1031, R-1313, R-2556 (every `npm test` step passes `--jobs`), R-2631 and R-2632. Each pull-request suite step gains the list flag, and the tests that parse `ci.yml` must still find their `npm test` steps. Expected changes to existing tests are a forecast, never a limit.

FEAT-029 known-bug lines this lane closes or rewrites: "workflows, config, templates and HTML are unmapped, and `--impact` has no machine-readable selector output yet"; the computed `import(new URL(...))` line; and the renamed or injected runners line.

## Threat model

In scope: honest variation in our own tools and history:
- how our code spells a path, a launch or a dynamic import;
- a test that reads documents by listing tracked files;
- a merge commit's parents, a deleted or renamed file, and Windows path separators;
- a flaky Windows file, a red base, and a leg that ends with no suite record;
- an identity word in a file path or branch name that reaches an issue body.

Out of scope: deliberate forgery, meaning code written to hide a load or a launch from the map, or a workflow edited to skip the selector. A finding outside the model is a residual for the feature's known-bug file.

The harm that matters most is a silent miss: a pull request whose selected run is green while a test it should have run fails. Every rule below resolves doubt toward a larger selection.

## Precedent

- `scripts/code-map.mjs` — `blindReach`, `impact`, `repoGraph`, and the private `linkRepo`, which adds launch links and the `launchAlwaysRun` list. The selector needs the enriched graph, so `linkRepo` becomes an export and the selector imports it. That moves a private helper to a shared surface, per the 2026-10-22 ruling. The selector must not copy it.
- `scripts/code-map-launch.mjs` — the path-value evaluator (R-3149 anchors) and the site kinds. Document links (A4) and hidden-load sites (R-3181) reuse its evaluator through a new export. The path rule is not copied.
- `code-map.config.json` `launchAlwaysRun` (path plus reason, validated in `linkRepo`) — the shape for the new `repoReaders` list (R-3182).
- `scripts/blast-radius.mjs` `collectChangedPaths` — the git diff call (`--name-only --no-renames -z`, injected `git`). The selector diffs two revisions instead of the merge base and the work tree.
- `scripts/lane-class.mjs` with `packages/nana-pack/lib/lane-class-config.mjs` — classifying changed paths by sealed rules in a config module, with a `--root`/`--files` style CLI.
- `scripts/test.mjs` `collect()` and `parseJobs`, and `packages/nana-pack/lib/test-runner-config.mjs` `JOBS_FLAG` — where the list flag is parsed and sealed. Path-substring filters stay as they are.
- `.github/workflows/ci.yml` suite job, and `packages/nana-pack/tests/ci-workflow.test.mjs` — the step layout and the parse-the-workflow test style (R-2556, R-2631).
- `scripts/identity-scan.mjs` (`countIdentityWords`, `--stdin`) — the scan the issue poster runs before it posts.
- `packages/nana-pack/lib/gh-runner.mjs` (`ghFromEnvironment`, `ghResult`) and `packages/nana-pack/lib/handoff-issues.mjs` — injected, bounded `gh` calls.
- `packages/nana-pack/lib/suite-records.mjs` (`readRunRecord`, `finalFiles`) — reading a leg's suite record for failed files.
- `packages/nana-pack/lib/land-ci.mjs` `judgeRuns` — unchanged (A6). R-3184 pins the workflow property it relies on.
- `docs/reviews/map-spawn-edges-2026-10-29/replay.mjs` — the replay method `measure.mjs` follows. The builder re-runs `measure.mjs` against the built selector.
- `map:search` results taken: `scripts/code-map.mjs`, `scripts/blast-radius.mjs`, `scripts/lane-class.mjs` (changed set and path rules); `scripts/test-locked.mjs` (runner entry); `scripts/identity-scan.mjs`, `packages/nana-pack/lib/handoff-issues.mjs`, `packages/nana-pack/lib/issue-watch.mjs` (issues); `packages/nana-pack/lib/land-ci.mjs`, `packages/nana-pack/lib/ci-records.mjs` (CI reads). No search suggested an existing issue poster. None exists in the repo.
- Forecast from the code: the pull-request suite steps in `ci.yml` change, so the R-1031, R-1313, R-2556 and R-2631 checks in `ci-workflow.test.mjs` may need edits. Exporting `linkRepo` touches `code-map.test.mjs` only if it asserts the export list. The `templates-render.test.mjs` scaffold checks stay unchanged, because the template generator is not touched.

## Outside precedent

- Pants build system (Apache-2.0), `--changed-since` with `--changed-dependents=transitive` — borrow. It selects targets that transitively depend on changed files. Like this plan, it treats a change it cannot attribute as a reason to run more, not fewer. Not adopted, because nana-pi's graph is its own code map. Source: https://www.pantsbuild.org/stable/docs/using-pants/advanced-target-selection (from memory; the page was not opened in this session).
- Also looked at: Jest `--findRelatedTests` and Nx affected (MIT), which select by import graph only and infer no launches; the `dorny/paths-filter` action (MIT), skipped so no third-party action decides what runs; Google's TAP split of a selective presubmit and a full post-submit run, which is the shape the owner chose.

## Must-meet

Each selector test builds a throwaway fixture repository with its own `code-map.config.json` and a git history, as R-3149's tests do. It calls the selector with an injected `git`. Each test carries its `req:` marker directly above the test call.

1. **R-3178 — a documents-only change runs the document readers only.**
   - WHEN every changed path is a document (A3), the selector shall return mode `documents`. Its files shall be the tests that hold or reach (through enriched callees) a traced path value naming a changed document or a folder above it, plus every test reaching a declared repository reader.
   - Fixture: `scripts/check.mjs` reads `join(ROOT, "docs", "known-bugs")` with `ROOT` from `import.meta.url`. `tests/check.test.mjs` imports it, `tests/handoff.test.mjs` reads `join(ROOT, "HANDOFF.md")`, and `tests/other.test.mjs` names `"HANDOFF.md"` only under `mkdtempSync`.
   - Pins: a change to `docs/known-bugs/F.md` selects exactly `tests/check.test.mjs`. A change to `HANDOFF.md` selects exactly `tests/handoff.test.mjs`. `tests/other.test.mjs` is selected by neither.

2. **R-3179 — a code change runs every test the map says it can reach.**
   - WHEN a changed path is a mapped module and no R-3180 case applies, the selector shall return mode `selective`. Its files shall be: each changed test, every test among the module's enriched transitive callers (imports and launch or path edges), every test in blind reach, every test reaching a declared repository reader, and R-3178's readers of any changed document.
   - Fixture: `tests/a.test.mjs` imports `lib/a.mjs`, `tests/b.test.mjs` launches `bin/b.mjs`, which imports `lib/a.mjs`, `tests/c.test.mjs` is unrelated, and `tests/d.test.mjs` holds an unresolved launch.
   - Pins: changing `lib/a.mjs` selects exactly `a`, `b` and `d`. The JSON's `of` is 4.

3. **R-3180 — anything the map cannot judge runs the whole suite.**
   - The selector shall return mode `full`, with a reason naming the first such path, WHEN any of these holds:
     - a changed path is neither a mapped module nor a document, including a deleted module, `package.json`, a workflow, `templates/`, shipped Markdown, HTML and a fixture;
     - a changed path is the selector, the runner, a module either imports, or `code-map.config.json`;
     - the selection is empty;
     - git or the graph fails, or the selector throws.
   - In each case it shall still exit 0, so the leg runs the full suite.
   - Pins: one case per bullet, each `full` with its reason. An injected git failure gives `full`, exit 0, and a reason naming git.

4. **R-3181 — hidden loads become always-run.**
   - WHEN a module holds a computed `import(...)` whose argument does not trace to a mapped module, or binds a launch name to another name or passes it as a value, the map shall list a blind site under that module's entry. Examples of binding: `const run = spawnSync`, a default parameter `= spawn`, `{ spawn: start }`, and `runner(spawnSync)`.
   - `--impact`'s blind-reach line and the selector shall then name every test that holds or reaches such a site.
   - Fixture: `tests/e.test.mjs` runs ``await import(new URL(`./${name}.mjs`, import.meta.url))``, `lib/r.mjs` holds `const run = spawnSync; run(process.execPath, [x])`, and `tests/r.test.mjs` imports `lib/r.mjs`.
   - Pins: both sites are listed with line numbers. Blind reach names `tests/e.test.mjs` and `tests/r.test.mjs`. A literal `import("./lib/a.mjs")` adds no site.
   - In the real repository, `config-display-text`, `config-handlers-malformed` and `hive-page` are in blind reach. So are the tests reaching `lane-watcher.mjs`, `review-movement.mjs`, `process-tree-helper.mjs` and `hook-producer.mjs`. The builder records the before and after share.

5. **R-3182 — repository readers run on every change.**
   - `code-map.config.json` shall hold a `repoReaders` list of a path and a reason each, validated like `launchAlwaysRun`. Every test that holds or reaches a listed module shall be in every `selective` and `documents` selection.
   - `map:check` shall fail, naming the module, while a module that traces a path value to the repository root lists files under it without a declaration. Listing means launching `git` with `ls-files`, or calling `readdirSync`, `readdir` or `globSync` on that root.
   - Fixture: `scripts/scan.mjs` runs `git ls-files` with `cwd: ROOT`, and `tests/scan.test.mjs` imports it.
   - Pins: undeclared, `map:check` exits 1 naming `scripts/scan.mjs`. Declared, a change to an unrelated `lib/z.mjs` selects `tests/scan.test.mjs`.
   - The builder seeds the list from the real repository: `measure.mjs` names 14 candidate tests, and the builder declares their reader modules.

6. **R-3183 — the runner runs exactly the listed files.**
   - WHEN `npm test` gets the list flag (O2), the runner shall run exactly the listed files that it collects. The Windows skip list still applies.
   - It shall exit 1, naming the path, when a listed path is not a collected test. Without the flag, collection is unchanged.
   - Pins: a two-file list gives two result lines and a totals line of 2. A list holding `packages/x/tests/missing.test.mjs` exits 1 naming it. A run with no flag collects the same count as before.

7. **R-3184 — CI selects on pull requests and runs everything on main.**
   - In `.github/workflows/ci.yml`, on `pull_request` each suite leg shall run the selector over `HEAD^1` and `HEAD` before its `npm test` step. Unless the mode is `full`, it shall pass the list to that step.
   - On `push` each leg shall run `npm test` with no list.
   - The workflow's `on.pull_request` shall carry no `paths` or `paths-ignore` filter, so every pull-request push yields a `ci` run that `nana-land` reads. A suite job shall never be skipped by an `if:` on the selection.
   - Pins come from parsing the workflow, as `ci-workflow.test.mjs` does: the selector step's event condition, the list flag only on the pull-request path, a push path with no list, no path filters, and no `if:` on the suite job.

8. **R-3185 — a red full run on main opens one `next` issue after the identity scan.**
   - On a push to main, a job shall run after the suite legs whatever their result, with `issues: write` at job level only. It shall read each leg's suite record. WHEN a file failed, or a leg left no record, it shall build one title and body from run id, short SHA, leg names and file paths. It shall pass both through the identity scan, and post with label `next` only when the scan finds nothing and no open issue has the same title.
   - The job shall not be in `release`'s `needs`, so it never holds or fails a release.
   - Pins, with injected `gh` and fixture records:
     - one FAIL record gives exactly one `issue create` call carrying `--label next`;
     - all-pass records give no call;
     - an open issue with the same title gives no create;
     - an identity-word hit gives no post, and exits non-zero naming the scan.
   - The workflow parse pins the job's `if:` (push to main, `always()`), its permissions, and its absence from `release`'s `needs`.
   - Who posts follows Question 1. The default is the bot.

9. **Seal (one test, naming its row).** R-3186: the document patterns of A3 (`docs/`, a root-level `*.md` and `README.md` anywhere) are defined once in `scripts/ci-select-config.mjs`. Every other assertion imports them.

### Recorded measurements (seat checks after build 1, not suite tests)

- `node docs/reviews/selective-ci-2026-10-30/measure.mjs --record <Windows suite record>` against the built selector, replacing the prototype's rules with its calls. Compare it with the three tables above: mode counts, the share, the minutes, and the three since-2026-10-24 misses.
- The blind-reach share before and after R-3181 and R-3182, against 169 of 240.
- One real pull-request run of this lane on all three legs. A documents-only push and a code push each show their selector line. Then read the Windows leg's suite step minutes against the estimate.
- The post-land issue path is checked only by its injected test before the land. The first real red run on main is its first live evidence. That residual goes to FEAT-031's known-bug file.

### Known bugs to record at land

- FEAT-031: a selective run's suite record does not say it was selective (A9).
- FEAT-031: shipped Markdown runs the whole suite (A3).
- FEAT-031: hub launches are not resolved by hand, so code pushes save about one minute (A10).
- FEAT-031: document readers found through an anchor the path rule cannot trace are missed until main's full run.
- FEAT-031: the issue poster's first live run is its first evidence.
- FEAT-029: the written map does not list document links (A4).
