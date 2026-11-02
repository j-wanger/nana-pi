# Plan — ci-wait-ready

## Purpose

A fix that restores agreed behaviour. R-2592's contract is that a land waits for "the newest CI run of each workflow for the tip". Two things seen on 2026-11-02 break waiting for that run:
1. A tip waited hours for CI that GitHub never started. nana-pi's workflow runs only on `pull_request` and main pushes. The branch had no open PR, or its PR conflicted with main, and GitHub starts no `pull_request` workflow for a conflicting PR.
2. GitHub cancelled macOS jobs for capacity four times ("The job was not acquired by Runner of type hosted even after multiple attempts"). Each cancellation read as a red tip.

The seat worked around both with a scratch helper. The seat's goal: one shared CI-wait, used by nana-land's CI step and callable by the seat.
- It refuses at once, naming the cause, when the branch has no open PR or its PR is CONFLICTING.
- When a completed run's only non-success jobs are cancelled, it re-runs the failed jobs up to a sealed count, 2 (chosen), before reporting.
- It never re-runs a real test failure.

What exists today (main fa4bf2be):
- `nana-land` reads CI once and does not wait. `judgeRuns` (`packages/nana-pack/lib/land-ci.mjs:91-110`) refuses on no run, an unfinished run or a non-success run, and prints a remedy such as `gh run rerun <id>`. `landCiWaitMs` in `land-records.mjs` only measures.
- `main-ci.mjs` reads main's push runs and skips cancelled ones. It never re-runs.
- `gh-runner.mjs` gives the injectable `ghDefault` and `ghResult` used by both.

So "nana-land's CI wait" is today a single read. The waiting lives only in the seat's scratch helper.

## Design

1. **New module `packages/nana-pack/lib/ci-wait.mjs`** with three pure-ish steps, each taking an injected gh runner and an injected clock and sleep:
   - `ciReadiness({ repository, branch, tip })`: list the branch's open PRs (`gh pr list --head <branch> --state open --json number,mergeable,headRefOid`).
     - Refuse with a named cause on no open PR ("no open PR for <branch>; CI runs only on pull requests").
     - Refuse on a CONFLICTING PR ("PR #n conflicts with main; GitHub starts no CI for it").
     - Refuse on a PR whose head is not the tip ("PR #n head is <x>, not <tip>; push the tip").
     - `UNKNOWN` mergeability is re-read up to a sealed count with a sealed delay, then reported as unknown, never as ready.
   - `classifyRun(run, jobs)` decides between `passed`, `pending`, `capacity-cancelled` and `failed`. It returns `capacity-cancelled` only when every non-success job's conclusion is `cancelled` and no job has `failure` or `timed_out`. Anything else that is not success is `failed`. A whole run cancelled with no job data is `failed`; the plan claims nothing about its cause.
   - `waitForCi(...)`: readiness first. Then poll the tip's runs (the newest per workflow, as `judgeRuns` already does) until each is complete, within a sealed overall bound and poll interval. For a `capacity-cancelled` run, call `gh run rerun <id> --failed` and keep waiting, at most `CI_CANCEL_RERUNS` = 2 times per workflow. Report the verdict lines `judgeRuns` already prints, plus one line per re-run.
2. **CLI `packages/nana-pack/bin/nana-ci-wait.mjs`** (`--tip`, `--branch`, `--repo`), modelled on `nana-main-ci.mjs`, so the seat can call it in place of its scratch helper. It exits 0 only on all-passed.
3. **nana-land**: before reading runs, nana-land calls `ciReadiness` and refuses at once with its cause. When `judgeRuns` refuses on a run that `classifyRun` calls `capacity-cancelled`, the refusal names that, and the remedy becomes `nana-ci-wait --tip <tip>` instead of a raw `gh run rerun`.
4. **Sealed values** in `land-config.mjs`, each with provenance: `CI_CANCEL_RERUNS` (2, chosen by the seat), the mergeability re-read count and delay, the poll interval, the overall wait bound, and the PR and job API paths.

## Assumptions

- A1: Capacity cancellation shows as a completed run whose non-success jobs are all `cancelled`. Annotation text is not read: it needs a second API call per job, and a manual cancel also matches the rule. A human cancel is therefore re-run at most twice. That is a recorded residual; a person who cancels on purpose can say so to the seat.
- A2: `gh pr list --json mergeable` returns `MERGEABLE`, `CONFLICTING` or `UNKNOWN`, as in gh's documented fields. The builder confirms the field name against the installed gh's `--json` help, without calling the API.
- A3: The re-run is a write call through the seat's `gh`, as the seat's helper already does. Builders never run it; tests use a fake gh only.

## Open choices

- O1: Whether `nana-land` itself waits and re-runs, or only refuses with the cause and points at `nana-ci-wait`. Default: nana-land stays a one-read gate. It gains readiness refusals and the capacity classification in its message. The waiting and re-running live in `nana-ci-wait`, which the seat runs before `nana-land`. This keeps the land tool free of polling and write calls. **Question for the seat (default: as above).**

## Questions for the owner

None. O1 is the seat's.

## Feature

Feature: FEAT-008 · Integrate and clean up reviewed changes

Lane class: gate (it changes `nana-land`). The builder pastes `node scripts/lane-class.mjs --root . --files packages/nana-pack/lib/ci-wait.mjs,packages/nana-pack/bin/nana-ci-wait.mjs,packages/nana-pack/bin/nana-land.mjs,packages/nana-pack/lib/land-config.mjs,packages/nana-pack/tests/ci-wait.test.mjs,REQUIREMENTS.md`.

Build waits for land-clean-merge to land, as the seat directed, because both change `nana-land`'s CI path. The branch is merged forward from main then.

## Threat model

In scope: honest variation in GitHub's responses. That covers a missing PR, a conflicting PR, UNKNOWN mergeability, a PR head behind the tip, runs not yet started, queued or in progress, capacity cancellation on any OS leg, real failures and timeouts, several workflows, re-run attempts and API read failures. Out: a forged API response. That is a residual, because gh talks to GitHub directly.

## Precedent

- `packages/nana-pack/lib/land-ci.mjs`: `judgeRuns` (newest run per workflow, remedies) and `ciScope`.
- `packages/nana-pack/lib/main-ci.mjs` and `packages/nana-pack/bin/nana-main-ci.mjs`: a CI reader with an injected gh runner and its CLI shape.
- `packages/nana-pack/lib/gh-runner.mjs`: `ghDefault`, `ghResult`, `ghEnvironment`.
- `packages/nana-pack/lib/land-config.mjs`: the `CI_*` sealed values and their provenance.
- `packages/nana-pack/bin/nana-land.mjs`: the CI read in `runLandCore`.
- `packages/nana-pack/tests/main-ci.test.mjs`: fake-gh test patterns.

## Outside precedent

GitHub CLI `gh run rerun --failed` and `gh pr list --json mergeable` (MIT), borrowed: the documented commands the helper calls; no library is adopted.

## Must-meet

Rows R-3720 to R-3725 (FEAT-008).

- M1 (R-3720): no open PR, a CONFLICTING PR, or a PR whose head differs from the tip each refuse at once. Each names its cause and remedy, before any run is read; the fake gh records no `actions/runs` call. `UNKNOWN` mergeability re-reads to the sealed count, then reports unknown. Covers `nana-ci-wait` and `nana-land`.
- M2 (R-3721): a run whose only non-success jobs are cancelled is re-run with `--failed` and waited on again. A second capacity cancel re-runs once more. A third reports red, naming three attempts. The fake gh records exactly two re-run calls.
- M3 (R-3722): a run with any `failure` or `timed_out` job is never re-run, even when other jobs were cancelled; the fake gh records zero re-run calls. A whole run cancelled with no job data is reported red, not re-run.
- M4 (R-3723): waiting is bounded. Queued and in-progress runs are polled at the sealed interval on an injected clock. Past the sealed overall bound the wait reports "CI did not finish", naming each unfinished run. A run that never starts after readiness passed is reported the same way.
- M5 (R-3724): on success, `nana-ci-wait` prints `judgeRuns`' lines plus one line per re-run, and exits 0. nana-land's existing passing path is unchanged; existing land tests stay green unedited.
- M6 (R-3725): the re-run cap of 2, the readiness re-read count and delay, the poll interval, the wait bound and the API paths are sealed once.

Seat wrong-code pairs (gate lane):
- skip readiness (M1);
- re-run on any cancelled run regardless of failed jobs (M3);
- no re-run cap (M2);
- treat a capacity-cancelled run as success (M2);
- an unbounded wait (M4).

Seat checks:
- `ci-wait.test.mjs`, `land.test.mjs`, `land-ci-read.test.mjs`, `land-ci-edge.test.mjs`, `main-ci.test.mjs` and `test-runner.test.mjs`, one at a time;
- the map, readme, trace, tree and known-bugs checks, and the identity scan;
- the seat pairs.

## Revision 2 (after `plan-attack.md`: 6 MUST, 2 SHOULD, all taken; the seat confirmed O1's default)

These changes override the sections above wherever they differ.

**O1, decided by the seat.** `nana-land` stays a one-read gate. It names the cause and gives the remedy line `nana-ci-wait --tip <tip>`. `nana-ci-wait` does the polling and the re-runs, so no gh write call lives in the land tool. Purpose's "used by nana-land" means that nana-land uses the shared readiness and classification functions, not the waiter. The manual-cancel residual (A1) becomes one FEAT-008 known-bug line.

**Readiness diagnoses; it does not gate valid CI (attack 2).** nana-land reads runs first, as today. Readiness runs only when the tip has no run for a workflow, and then it explains why: no open PR, a CONFLICTING PR, a PR head that isn't the tip, or UNKNOWN. Successful push-only CI with no PR still lands, and the no-CI skip is unchanged. `nana-ci-wait` checks readiness before waiting, because waiting only makes sense when a run will start.

**Targeting (attack 3).**
- Every gh read and write passes `--repo <owner>/<repo>` and the `github.com` host taken from origin by `githubRepoOf`, never from `GH_REPO` or `GH_HOST`.
- The PR is found by head ref *and* head repository: `--json number,mergeable,headRefName,headRefOid,headRepository,headRepositoryOwner`. The head repository must be origin's.
- The remote branch name comes from the source tree's upstream, or `--branch`. Zero or several matches refuse, naming each.
- Fixtures cover wrong `GH_REPO` and `GH_HOST`, a local branch named differently from its remote, and a same-name branch from a fork.

**Classification against the real workflow (attack 1).** A run is `capacity-cancelled` only when:
- it is completed;
- its jobs (complete, every page, attempt-matched) include at least one `cancelled` job;
- every job is `success`, `skipped`, `neutral` or `cancelled`, or is `failure` only on a job the run itself treats as allowed to fail.

Allowed-to-fail is read from the run's overall conclusion, not guessed from job names. If the run's conclusion is `cancelled` and the only `failure` jobs are on a leg with `continue-on-error`, that is still capacity. To know which leg that is, the builder reads `.github/workflows/ci.yml` at the tip (matrix `continue-on-error`, today `ubuntu-latest`) through one sealed rule, with provenance `ci.yml:68`.

Any other `failure` or `timed_out` makes the run `failed`, and it is never re-run. A run with missing or partial job data is `failed`.

Fixtures use real PR job lists: suite on 3 OSes, install-check on 4 legs, and `release` skipped. They cover a macOS leg cancelled with release skipped, plus the same with the Linux leg failed.

**Re-run identity (attack 4).** The waiter tracks `workflow_id/run_id/run_attempt`. After a re-run request it waits for that run's `run_attempt` to grow, within the deadline. It never re-runs the same observed attempt twice. A failed re-run request is reported and not counted as a re-run. Fixtures cover stale responses repeated after a re-run, a failed re-run call, paginated jobs, and two workflows advancing independently.

**One deadline (attack 5).** One monotonic deadline starts before the first gh call. Every gh call's timeout is `min(sealed per-call limit, remaining)`, and every sleep is capped at the remaining time. No call starts after expiry. M4 adds a slow readiness read, a slow jobs read, a slow re-run write and API failures, each on an injected clock.

**Existing tests (attack 6).** M5 now says existing land behaviour is preserved; not that tests stay unedited. Expected edits:
- `land-ci-read.test.mjs` 68-69 (gh call count), where nana-land adds a readiness read only on no-run paths;
- any fixture whose fake gh answers every request with workflow JSON.
List each edit with its reason. Windows CLI tests run through an injected Node fake gh.

**land-clean-merge interaction (attack 7).** A re-run completed before the land passes. A run attempt that changes during the land still refuses through land-clean-merge's identity check. This lane adds one test for each, once that lane has landed, and does not weaken the check.

**Evidence limits (attack 8).** A fake gh proves only that `gh run rerun <id> --failed --repo …` is called. Whether `--failed` restarts cancelled jobs is GitHub's documented behaviour; the builder quotes `gh run rerun --help` from an installed gh if one exists, or else the published manual page text, in `gh-evidence.md`, and claims nothing more. `judgeRuns`' `head_sha` query stays as it is.

**Rows** stay R-3720 to R-3725, each worded as observable behaviour. M1 becomes "no run for the tip is explained by its PR state", and it now applies to `nana-ci-wait` and to nana-land's no-run refusal.
