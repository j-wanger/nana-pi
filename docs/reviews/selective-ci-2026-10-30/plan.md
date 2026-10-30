# selective-ci — plan (revision 2)

Lane class: `hook: packages/nana-pack/lib/frontier-summary-config.mjs — directly imported by packages/nana-pack/bin/nana-frontier-summary.mjs` (printed by `node scripts/lane-class.mjs --root . --files scripts/ci-select.mjs,scripts/ci-select-config.mjs,scripts/test.mjs,packages/nana-pack/lib/test-runner-config.mjs,scripts/code-map.mjs,scripts/code-map-launch.mjs,code-map.config.json,.github/workflows/ci.yml,packages/nana-pack/bin/nana-main-ci.mjs,packages/nana-pack/lib/main-ci.mjs,packages/nana-pack/lib/main-ci-config.mjs,packages/nana-pack/lib/frontier-summary.mjs,packages/nana-pack/lib/frontier-summary-config.mjs,packages/nana-setup/claude/rules/nana-seat.md,packages/nana-pack/lib/lane-class-config.mjs,packages/nana-pack/tests/ci-select.test.mjs,packages/nana-pack/tests/ci-workflow.test.mjs,packages/nana-pack/tests/test-runner.test.mjs,packages/nana-pack/tests/main-ci.test.mjs,packages/nana-pack/tests/frontier-summary.test.mjs,packages/nana-pack/tests/lane-class.test.mjs,REQUIREMENTS.md,docs/requirements-tree.md,README.md,packages/nana-pack/README.md,docs/known-bugs/FEAT-031.md,docs/known-bugs/FEAT-029.md,docs/reviews/selective-ci-2026-10-30/plan.md,docs/reviews/selective-ci-2026-10-30/measure.mjs`).

The script reads main's gate list, which does not yet hold this lane's entries (R-3185). Once R-3185's entries are in the worktree, the same command should print a `gate` line naming `.github/workflows/ci.yml`. That is inferred, because the script prints one class. Hook and gate lanes take the same ladder: the land reviewer, the seat's wrong-code pairs, one independent check, and the local install check on macOS. The lane touches a session-start producer and a seat rule.

Revision 2 applies the owner's answers on issue 274. The workflow posts no issues: the seat posts them. Selection covers documents-only pushes only. The CI workflow, the selector and the runner join lane-class's gate list. Base: `feat/selective-ci` at d797a9f1 (main).

## Purpose

The owner, 2026-10-29: "is it possible to do selective CI? Like we probably dont need the full CI for code that were not changed?" He chose option C: "C makes sense to aim for, just make sure we harden code map to cover path based child processes; full run after landing on main, yes issue is the way to go".

The owner, issue 274, on this plan's three questions: "Defaults for 1 and 3, and do the documentation only for 2".

The agreed reading, after both answers:

- A pull-request push that changes only documents runs the document checks on each of the three suite legs.
- Every other pull-request push runs the full suite on all three systems, as today.
- Main runs the full suite on all three systems after each land, as today.
- When main's full run fails, the job fails and keeps its suite records. The workflow posts nothing.
- At session start the seat runs one command. It reads main's newest full run. When that run is red, the seat posts one `next` issue from the owner's account, starting `Seat:`, after the identity scan. A red main does not block the next land.
- `nana-land` waits for a green run on the pull request, as today.
- The CI workflow, the selector and the runner are gate files from now on.

### Measured (seat prototype in this folder)

`measure.mjs` in this folder is a prototype of the documents rule. It replays real pull-request pushes against each pushed tree with the current linker. Outputs: `measure-since.txt`, `measure-window-failed.txt` and `measure-variants.txt`. Per-file seconds come from the Windows suite record of run 40999266815 (240 files, 4496 file-seconds, a 1369 s suite step at four jobs). Inferred, not measured: the minutes scale that step linearly by summed file-seconds.

Saving at this scope, 125 pull-request pushes since 2026-10-24 whose base and head the logs name:

- 13 pushes changed only documents. Each would run 9.5% of test files on average. That moves its Windows suite step from about 22 to about 7 minutes.
- The other 112 pushes run the full suite.
- In total: about 2652 of 2852 Windows suite-step minutes (93%), a saving of about 7%.
- Over the failed runs since 2026-10-08, 7 of 156 failed pull-request pushes changed only documents.
- The dropped impact selection would have reached 89% (`measure-since.txt`, revision 1's table). It saved about one minute on each code push.

Catch rate for documents-only pushes, failed suite pairs (run, leg, failing file):

- Since 2026-10-24: 3 pairs, none caught. All three are Windows-only: `mutation-runner`, `component-audit` and `worker-claude`. Each branch's next push passed. They are inferred flakes, not failures a documents change caused.
- Whole window since 2026-10-08: 9 pairs, 4 caught, 5 missed. Three misses are the recent pairs above. The other two:
  - `writing-injection`, Windows only. The branch's next run did not fail it, so it is an inferred flake.
  - `template-acceptance` on macOS, red on base in the map-spawn-edges replay. The land's local macOS suite covers macOS anyway.
- No documents-only push in the record failed a test that the documents change caused. This holds only as far as the inferred flakes are flakes. Main's full run after each land is the net for any miss.

## Assumptions

- A1. The selector runs inside each suite leg on `pull_request` events. It diffs `HEAD^1` against `HEAD` of the merge commit GitHub checks out. `fetch-depth: 0` already holds both parents (R-686). `nana-land` merges only by fast-forward, so that diff is the lane's change against the base it lands on.
- A2. Push events never run the selector. Every leg runs the full suite, as today. The release job keeps `needs: [suite, install-check]`.
- A3. A document is a path under `docs/`, a Markdown file at the repository root, or a `README.md` anywhere. Shipped Markdown (rules, skills, prompts, templates) is not a document, so a change to it runs the full suite. Treating it as a document would save under 1% more (`measure-variants.txt`).
- A4. Document readers are found by the linker's path-value rule (R-3149's anchors), applied in every mapped module, not only in launching ones. A traced path value that names a tracked document, or a tracked folder holding one, links that module to it. A test reads a document when it holds such a link, or reaches a module holding one through enriched callees. The selector computes these links, and the written map does not list them.
- A5. Install-check is unchanged and runs on every pull-request push.
- A6. `nana-land` needs no code change. It judges the newest run of each workflow for the tip. A documents-only run concludes like a full one, because its suite legs always run. Only the pack README's contract note changes, to say the run may hold only the document checks.
- A7. The Linux leg stays advisory (R-1531). The main check still reports a red Linux leg, from its suite record.
- A8. Every land already runs the full locked suite locally on macOS.
- A9. The suite record schema is unchanged, so a documents-only run's record does not say it ran a subset. This goes to FEAT-031's known-bug file.
- A10. The seat runs the main check at session start, alongside the issue watch: a Claude Code seat from the frontier block's line, a pi seat from the same block. Builders and reviewers never run it, because the frontier block prints nothing under `NANA_ROLE` launcher roles.
- A11. The rows sit under FEAT-031. R-3179 changes `map:check`, so FEAT-029's tree entry lists it under Also applies.

## Open choices

- O1. The builder picks the selector's output: one JSON object (`mode`, `reason`, `files`, `of`) and one summary line in the leg log. It closes FEAT-029's "no machine-readable selector output" line for this use.
- O2. The builder picks the runner's list flag, which reads newline-separated repository paths. The name is sealed in `packages/nana-pack/lib/test-runner-config.mjs` beside `JOBS_FLAG`.
- O3. The builder picks the issue's title and body wording. The body opens with `Seat:` and holds only the run id, short SHA, leg names and failed file paths. Deduplication is by exact title against open issues.
- O4. The builder picks how `nana-main-ci` finds main's newest full run. The run must be the `ci` workflow's newest `push` run on `main`, and its files come from that run's suite records through `packages/nana-pack/lib/ci-records.mjs`.
- O5. The full-run triggers are computed, not listed. Any changed path that is not a document runs the full suite. That covers the selector and the runner, which are modules, not documents.

## Questions for the owner

None.

## Feature

Feature: FEAT-031 · Run checks reliably and without contaminating work

Rows: R-3178 to R-3186, new. World-graph takes R-3170 to R-3177 (its plan attack names R-3177), and shops-flows takes R-3161 to R-3169. The highest row on main is R-3160. Revision 1's impact-selection row and its hidden-load row are dropped. Neither entered the ledger, and the numbers below are reassigned.

Existing rows whose tests may change: R-597, R-1031, R-1313, R-2556, R-2631 and R-2632 (`ci-workflow.test.mjs` parses each `npm test` step), and R-2998 and R-2999 (the frontier block's watch line). Expected changes to existing tests are a forecast, never a limit.

FEAT-029 known-bug lines: "`--impact` has no machine-readable selector output yet" is rewritten to say only documents-only pushes use the selector. The computed-import and renamed-runner lines stay open.

## Threat model

In scope: honest variation in our own tools and history:
- how our code spells a document path;
- a test that reads documents by listing tracked files;
- merge-commit parents, deleted and renamed files, and Windows separators;
- a flaky Windows file, a red base, and a leg with no suite record;
- an identity word in a path or branch name that reaches an issue body.

Out of scope: deliberate forgery, meaning code written to hide a document read, or a workflow edited to skip the selector. A finding outside the model is a residual.

The harm that matters most is a silent miss. That is a documents-only pull request whose run is green while a test that reads the changed document fails. Every rule resolves doubt toward the full suite.

## Precedent

- `scripts/code-map-launch.mjs` — the path-value evaluator (R-3149 anchors). Document links (A4) reuse it through a new export. The evaluator is not copied.
- `scripts/code-map.mjs` — `impact`, `repoGraph` and the private `linkRepo`. The selector needs the enriched callers, so `linkRepo` becomes an export and the selector imports it. That is a move of a private helper to a shared surface (ruling 2026-10-22).
- `code-map.config.json` `launchAlwaysRun` (path and reason, validated in `linkRepo`) — the shape of the new `repoReaders` list (R-3179).
- `scripts/blast-radius.mjs` `collectChangedPaths` — the git diff call (`--name-only --no-renames -z`, injected `git`).
- `scripts/lane-class.mjs` and `packages/nana-pack/lib/lane-class-config.mjs` — sealed path rules in a config module. R-3185 adds entries to its gate list. `packages/nana-pack/tests/lane-class.test.mjs` is where they are pinned.
- `scripts/test.mjs` `collect()` and `parseJobs`, and `test-runner-config.mjs` `JOBS_FLAG` — where the list flag is parsed and sealed.
- `.github/workflows/ci.yml` suite job, and `packages/nana-pack/tests/ci-workflow.test.mjs` — the step layout and the parse-the-workflow test style.
- `packages/nana-pack/bin/nana-issue-watch.mjs` with `packages/nana-pack/lib/issue-watch.mjs` — the shape of `nana-main-ci`: a seat-side bin over a lib with injected `gh`, started from the session-start block.
- `packages/nana-pack/lib/frontier-summary.mjs` `watchLine` and `frontier-summary-config.mjs` `WATCH_COMMAND_PREFIX` (R-2999) — where the block names a command for the seat. The main-check line follows them.
- `packages/nana-setup/claude/rules/nana-seat.md` line 23 — the issue-watch instruction. The main check gets one sentence beside it.
- `packages/nana-pack/lib/ci-records.mjs` `readCiRecords` and `packages/nana-pack/lib/suite-records.mjs` `finalFiles` — reading a revision's suite records and failed files.
- `packages/nana-pack/lib/gh-runner.mjs` (`ghFromEnvironment`, `ghResult`) and `packages/nana-pack/lib/handoff-issues.mjs` — bounded `gh` calls.
- `scripts/identity-scan.mjs` (`countIdentityWords`, `--stdin`) — the scan before the post.
- `docs/reviews/map-spawn-edges-2026-10-29/replay.mjs` — the replay method `measure.mjs` follows.
- `map:search` results taken: `scripts/code-map.mjs`, `scripts/blast-radius.mjs`, `scripts/lane-class.mjs`, `scripts/test-locked.mjs`, `scripts/identity-scan.mjs`, `packages/nana-pack/lib/handoff-issues.mjs`, `packages/nana-pack/lib/issue-watch.mjs`, `packages/nana-pack/lib/land-ci.mjs` and `packages/nana-pack/lib/ci-records.mjs`. No search found an issue poster, and none exists in the repo.

## Outside precedent

- Pants build system (Apache-2.0), `--changed-since` with `--changed-dependents=transitive` — borrow. It runs dependents of changed files and runs more when it cannot attribute a change. Not adopted: nana-pi's graph is its own code map. Source: https://www.pantsbuild.org/stable/docs/using-pants/advanced-target-selection (from memory; the page was not opened in this session).
- Also looked at: GitHub's `paths-ignore`, skipped because a skipped workflow gives `nana-land` no run to read; the `dorny/paths-filter` action (MIT), skipped so no third-party action decides what runs; Google's TAP split of presubmit and a full post-submit run.

## Must-meet

Selector tests build a throwaway fixture repository with its own `code-map.config.json` and git history, as R-3149's tests do, and call the selector with an injected `git`. Each test carries its `req:` marker directly above the test call.

1. **R-3178 — a documents-only change runs the document readers only.**
   - WHEN every changed path is a document (R-3186), the selector shall return mode `documents`. Its files are the tests that hold or reach a document link to a changed document or a folder above it, plus R-3179's readers.
   - Fixture:
     - `scripts/check.mjs` reads `join(ROOT, "docs", "known-bugs")`, with `ROOT` from `import.meta.url`;
     - `tests/check.test.mjs` imports `scripts/check.mjs`;
     - `tests/handoff.test.mjs` reads `join(ROOT, "HANDOFF.md")`;
     - `tests/other.test.mjs` names `"HANDOFF.md"` only under `mkdtempSync`.
   - Pins: a change to `docs/known-bugs/F.md` selects exactly `tests/check.test.mjs`. A change to `HANDOFF.md` selects exactly `tests/handoff.test.mjs`. `tests/other.test.mjs` is selected by neither.

2. **R-3179 — repository readers run on every documents-only push.**
   - `code-map.config.json` shall hold a `repoReaders` list of a path and a reason each, validated like `launchAlwaysRun`. Every test that holds or reaches a listed module shall be in every `documents` selection.
   - `map:check` shall fail, naming the module, while a module lists files under a traced repository root without a declaration. Listing means launching `git` with `ls-files`, or calling `readdirSync`, `readdir` or `globSync` on that root.
   - Fixture: `scripts/scan.mjs` runs `git ls-files` with `cwd: ROOT`, and `tests/scan.test.mjs` imports it.
   - Pins: undeclared, `map:check` exits 1 naming `scripts/scan.mjs`. Declared, a change to `docs/x.md` selects `tests/scan.test.mjs`.
   - The builder seeds the list from the real repository: `measure.mjs` names 14 candidate tests.

3. **R-3180 — any other push runs the full suite.**
   - The selector shall return mode `full`, with a reason naming the first non-document path, WHEN any changed path is not a document. That includes a module, a test, a deleted file, `package.json`, a workflow, `templates/` and shipped Markdown.
   - It shall also return `full` WHEN the documents selection is empty, or git, the graph or the selector itself fails.
   - It shall exit 0 in every case, so the leg runs the full suite.
   - Pins: a changed `lib/a.mjs` gives `full` naming it. A changed `packages/p/rules/r.md` gives `full`. An empty selection gives `full`. An injected git failure gives `full`, exit 0, and a reason naming git.

4. **R-3181 — the runner runs exactly the listed files.**
   - WHEN `npm test` gets the list flag (O2), the runner shall run exactly the listed files it collects. The Windows skip list still applies.
   - It shall exit 1, naming the path, when a listed path is not a collected test. Without the flag, collection is unchanged.
   - Pins: a two-file list gives two result lines and a total of 2. A list holding `packages/x/tests/missing.test.mjs` exits 1 naming it. A run with no flag collects the same count as before.

5. **R-3182 — CI runs the document checks on documents-only pull requests and the full suite everywhere else.**
   - In `.github/workflows/ci.yml`, on `pull_request` each suite leg shall run the selector over `HEAD^1` and `HEAD` before its `npm test` step. It shall pass the list to that step only when the mode is `documents`.
   - On `push` each leg shall run `npm test` with no list.
   - `on.pull_request` shall carry no `paths` or `paths-ignore` filter, and no `if:` shall skip the suite job, so every pull-request push yields a `ci` run that `nana-land` reads.
   - No job shall hold `issues: write`.
   - Pins come from parsing the workflow, as `ci-workflow.test.mjs` does: the selector step's event condition, the list only on the documents path, a push path with no list, no path filters, no `if:` on the suite job, and no `issues` permission.

6. **R-3183 — `nana-main-ci` reports main's newest full run, and posts only from the seat's session.**
   - `node "$HOME/nana-pi/packages/nana-pack/bin/nana-main-ci.mjs" --cwd <repo>` shall read the `ci` workflow's newest `push` run on `main`. When that run passed, it prints one green line. When it is unfinished, it prints one waiting line.
   - When the run failed, it shall print the failed files per leg from the run's suite records, and name any leg with no record. It shall also print the exact `--post` command.
   - With `--post`, it shall build one title and body. The body starts `Seat:` and holds only the run id, short SHA, leg names and file paths.
   - It shall pass both through the identity scan. It shall run `gh issue create --label next` through the local `gh` only when the scan finds nothing and no open issue has the same title.
   - It shall refuse to post under a launcher `NANA_ROLE`.
   - Pins, with injected `gh` and fixture records:
     - a green run gives no create call;
     - a red run without `--post` gives no create call and prints the failed files and the command;
     - a red run with `--post` gives exactly one create call carrying `--label next`, with a body starting `Seat:`;
     - a same-title open issue gives no create;
     - an identity-word hit gives no post, and exits non-zero naming the scan;
     - `NANA_ROLE=worker` gives no post.

7. **R-3184 — the session-start block names the main check for the seat.**
   - WHEN the frontier block renders for a project whose `origin` is a GitHub repository tracking `.github/workflows/ci.yml`, it shall carry one line naming the main-check command, beside the issue-watch line. That line survives the block's character cap, as the watch line does.
   - The line is absent under a launcher `NANA_ROLE` and for a project with no such workflow. The hook makes no network call for it.
   - `nana-seat.md` shall tell the seat to run that command at session start, and to post with `--post` when it reports a red run.
   - Pins: the block for a fixture with the workflow holds the line, sealed in `frontier-summary-config.mjs`. Under `NANA_ROLE=reviewer` it is absent. With no workflow it is absent. The seat rule holds the sentence.

8. **R-3185 — CI's selector, runner and workflow are gate files.**
   - `packages/nana-pack/lib/lane-class-config.mjs` shall class `.github/workflows/ci.yml`, `scripts/ci-select.mjs` and `scripts/test.mjs` as `gate`, with the reason "CI verdict nana-land reads".
   - Pins: `node scripts/lane-class.mjs --root . --files .github/workflows/ci.yml` prints a `gate` line naming that reason, and so does each of the other two paths.

9. **Seal (one test, naming its row).** R-3186: the document patterns of A3 (`docs/`, a root-level `*.md` and `README.md` anywhere) are defined once in `scripts/ci-select-config.mjs`. Every other assertion imports them.

### Recorded measurements (seat checks after build 1, not suite tests)

- `node docs/reviews/selective-ci-2026-10-30/measure.mjs --record <Windows suite record>` against the built selector. Compare the documents-mode counts, the share and the three since-2026-10-24 documents-only pairs with the figures above.
- One real documents-only push of this lane on all three legs, with its selector line and the Windows suite-step minutes against the 7-minute estimate.
- `nana-main-ci` against main's real newest run, without `--post`. Its first red run is its first live evidence.
- The lane-class line re-printed after build 1. It is expected to print `gate`.

### Known bugs to record at land

- FEAT-031: a documents-only run's suite record does not say it ran a subset (A9).
- FEAT-031: shipped Markdown runs the full suite (A3).
- FEAT-031: a document read through an anchor the path rule cannot trace, a computed `import(...)`, a renamed runner or an unresolved launch is missed on a documents-only push until main's full run.
- FEAT-031: a red main is reported only when a seat session starts and runs the command.
- FEAT-029: the written map does not list document links (A4).
