Feature: FEAT-008 · Integrate and clean up reviewed changes

Lane ci-suite. Class: gate (`packages/nana-pack/bin/nana-land.mjs — land tool`). Builder: pi-worker (larger lane). Build session 1, on main 6c4b5363.

Owner ruling (2026-11-01): builders and lands rely on GitHub CI for the full suite; the local suite runs only when CI cannot stand in. The plan's three owner questions are posted as optional issue 302; build on their defaults (refuse when CI applies but gives no pass; no report refresh on a CI land; require an unfiltered same-platform record).

Build the plan of record, `docs/reviews/ci-suite-2026-11-01/plan.md` (revised after `plan-attack.md`): every must-meet (R-3430 to R-3437) and each seal it lists, its decisions, Assumptions, Threat model and Precedent. Rows R-3430 to R-3449 only; parallel lanes hold R-3350 to R-3429.

This lane's own rule applies to you already: push your last commit and stop. Do not wait for CI; report the pushed branch, the full tip SHA and the push exit code. Run targeted test files locally. This lane changes `scripts/test.mjs`, so its own land will run the local suite; you need not run the full suite yourself unless a targeted run leaves doubt.

## Precedent

- `AGENTS.md`
- `packages/nana-pack/bin/nana-land.mjs`
- `packages/nana-pack/lib/ci-records.mjs`
- `packages/nana-pack/lib/gh-runner.mjs`
- `packages/nana-pack/lib/land-ci-records.mjs`
- `packages/nana-pack/lib/land-ci.mjs`
- `packages/nana-pack/lib/land-config.mjs`
- `packages/nana-pack/lib/land-records-config.mjs`
- `packages/nana-pack/lib/land-records.mjs`
- `packages/nana-pack/lib/suite-records.mjs`
- `packages/nana-pack/prompts/builder-preamble.md`
- `packages/nana-pack/README.md`
- `packages/nana-pack/rules/nana-rulings.md`
- `packages/nana-pack/tests/land-ci-records.test.mjs`
- `packages/nana-pack/tests/land-fixtures.mjs`
- `packages/nana-pack/tests/rulings.test.mjs`
- `packages/nana-pack/tests/worker-lane.test.mjs`
- `README.md`
- `scripts/test.mjs`
- `templates/_shared/working-under-nana-pi.md`

Report each departure.

## Build

Helper moves authorized: exactly the plan's list (including moving the CI-read budget wrapper in `land-ci-records.mjs` to a shared export rather than copying it). No other private helper moves; ask in your report if you need one.

Gate lane extras: add the plan's wrong-code pairs to the lane's mutation runner and report its run. Run `node packages/nana-setup/bin/install-check.mjs` and report its exit; a `pi post-edit` `write-error` is the known builder-environment failure. Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

Rows `implemented` with backticked evidence. Green, run locally: the touched test files, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs --root .`. Push the branch, open a draft pull request, and stop.
