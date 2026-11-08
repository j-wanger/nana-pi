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

## Open choices

- O1. A1's de-duplication mechanism.
- O2. How `ci-wait` learns the conflicting paths (a local `git merge-tree` against `origin/main` is the precedent in nana-land's clean-merge path).

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

## Outside precedent

none: in-house CI wiring.

## Must-meet

- M1 (CI on a generated-only conflict). A lane whose pull request conflicts with main only in `docs/code-map.md` or `docs/requirements-tree.md` gets a CI run on its tip; `ci-wait` waits for it and reports its result.
- M2 (real conflicts still refuse). A conflict in any other path refuses with today's message and starts no wait.
- M3 (land through clean merge). nana-land lands such a lane from its push-run CI through the clean-merge path, regenerating the generated files, with no new review or CI.
- M4 (no double runs). A lane push with a mergeable pull request produces one completed CI run for its tip, not two.
- M5 (main unchanged). Main's push runs, Windows legs and the red-main rule behave exactly as before.
