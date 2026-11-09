# Plan: lane-push-ci

Feature: FEAT-008 · Integrate and clean up reviewed changes

## Purpose

A fix that restores agreed behaviour. The 2026-11-02 ruling says a conflict only in the generated files the land contract names counts as no conflict, and nana-land now rebuilds those files at land (land-regen-both). But GitHub starts no `pull_request` CI on a pull request that conflicts with main. `ci-wait` refuses such a lane ("PR … conflicts with main; merge main into the lane; GitHub starts no CI for it"). So every land that touched `docs/code-map.md` or `docs/requirements-tree.md` forced each waiting lane through a hand merge, a confirmation review and a new CI run. On 2026-11-07 and 11-08 that happened about a dozen times. This lane makes CI run on the lane branch's own tip when its pull request conflicts only in generated files, so the lane lands through nana-land's clean-merge path with no extra merge.

## Assumptions

- A1. CI also runs on `push` to lane branches (`feat/**`), on the pushed tip. A concurrency group keeps one run per branch tip, so a lane push with a mergeable pull request does not run twice (builder picks the mechanism: skip the push run when an open mergeable PR exists, or skip the PR run; report the choice).
- A2. `ci-wait` accepts a conflicting pull request when every conflicting path is in the land contract's generated set, and waits for the lane tip's push run. A conflict in any other path still refuses with today's message.
- A3. nana-land's CI reading accepts the push run on the exact lane tip as that tip's CI, with the same job and record rules as a pull-request run; Windows stays main-only.
- A4. Serialized after ci-packs, which also changes `ci.yml`, `land-ci.mjs` and the CI tests.
- A5. One reviewer plus CI. Changes the land tool and CI, so nana-land runs the local suite at its land, and the macOS install check runs.

Requirement IDs: R-3935–R-3944.

## Open choices

- O1. A1's de-duplication mechanism.
- O2. How `ci-wait` learns the conflicting paths (a local `git merge-tree` against `origin/main` is the precedent in nana-land's clean-merge path).

## Builder choices

- O1: feature pushes execute CI; same-repository feature PR jobs skip deterministically, without an API race. Non-feature and fork PRs keep their own jobs. A fixed run title plus event, workflow, branch and repository identity excludes only the duplicate from both judging and artifact reads. Per-branch concurrency cancels superseded feature pushes; main pushes remain independent.
- O2: fetch origin main, then import the public `cleanMergeTree` from `bin/nana-land.mjs` in inspection-only mode. This retains the land's attribute, merge settings and output validation without executing generators. The existing land caller retains regeneration.
- M9: a lightweight selection job calls `selectPackFiles` with land/module and origin/main. Windows uses the same runner arguments as macOS, unsharded; a false selection output allocates no Windows runner. No retire membership moves or hard-coded retire exclusions.
- Precedent departures: add a separate Windows selected-test job rather than expanding the suite matrix, because its empty selection must prevent runner allocation. Share the suite environment by YAML anchor so its existing bounds retain one definition. Importing the land helper introduces a module cycle; both sides use function exports only at call time. No helper moved to a new module.

## Questions for the owner

None.

## Threat model

Honest variation in GitHub's mergeability, run events and timing. Forgery out.

## Precedent

- `.github/workflows/ci.yml`: the triggers to extend.
- `packages/nana-pack/lib/ci-wait.mjs`: the conflict refusal.
- `packages/nana-pack/lib/land-ci.mjs`: run reading and judging.
- `packages/nana-pack/bin/nana-land.mjs`: `cleanMergeTree`, the merge-tree precedent.
- `packages/nana-pack/lib/land-config.mjs`: `CLEAN_MERGE_GENERATED_PATHS`.
- `packages/nana-pack/lib/test-packs-config.mjs`: pack selection that M9's Windows job reuses.

## Outside precedent

none: in-house CI wiring.

## Must-meet

- M1 (CI on a generated-only conflict). A lane whose pull request conflicts with main only in `docs/code-map.md` or `docs/requirements-tree.md` gets a CI run on its tip; `ci-wait` waits for it and reports its result.
- M2 (real conflicts still refuse). A conflict in any other path refuses with today's message and starts no wait.
- M3 (land through clean merge). nana-land lands such a lane from its push-run CI through the clean-merge path, regenerating the generated files, with no new review or CI.
- M4 (no double runs). A lane push with a mergeable pull request produces one completed CI run for its tip, not two.
- M5 (main unchanged). Main's push runs, Windows legs and the red-main rule behave exactly as before.
- M6 (adversary 1: skipped duplicates never decide). With a skipped duplicate run newer than the real suite run, in both event orders: a failing real suite makes the waiter exit 1 and nana-land refuse; a passing suite with complete records lets both succeed without the local fallback. (Replaces M4's proof.)
- M7 (adversary 2: no PR loses coverage). Same-repository feature PRs, same-repository non-feature PRs and fork PRs each get exactly one executed macOS and Linux suite and the macOS install checks for their tip.
- M8 (adversary 3, amended by M9). Evaluating the workflow's matrix expressions for each event and ref: feature pushes and PRs allocate no Windows suite shards and no Windows install checks, only M9's selected-test job; main pushes allocate the Windows suite shards and install checks; a feature push cannot release.

- M9 (Windows for selected tests). A lane's CI also runs, on Windows, the test files its pack selection picks. It never runs the whole Windows suite. A lane whose selection is empty starts no Windows job. Seat call, 2026-11-08: since Windows moved to main only, lane changes turned main red on Windows five times, each in a test the lane changed or reached.
