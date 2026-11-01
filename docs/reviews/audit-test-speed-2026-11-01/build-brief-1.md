Feature: FEAT-039 · See the product and its decisions in one report

Lane audit-test-speed. Class: ordinary (`node scripts/lane-class.mjs` on the test file prints `ordinary`). Builder: pi-worker (small lane). Build session 1, on main ad9612dd.

The problem: on main's Windows CI leg, the R-3104 case in `packages/nana-pack/tests/component-audit.test.mjs` ran past its 20,000 ms case limit three times on 2026-11-01 (runs 41305943926 and 41313874594, the second failing again on rerun), and it is the known flake behind issue 213. It is a fix that restores agreed behaviour, so it has no plan round; there is no new behaviour and no new requirement row. The case's assertions and R-3104's text stay exactly as they are.

Threat model: honest variation in CI machine speed and repository size is in scope; nothing else changes.

## Precedent

- `packages/nana-pack/tests/component-audit.test.mjs`
- `scripts/component-audit.mjs`

Report each departure.

## Build

1. Measure first: time each step of the R-3104 case locally (repository setup, each `buildAudit` call). Report the numbers. Line 116 runs `buildAudit` over the real repository only to obtain a source object; that cost grows with the repository.
2. Make the case fast without weakening it: give it a fixed fixture source (one component whose part is `part.txt`) instead of auditing the real repository, or whatever your measurement shows is the real cost. Every existing assertion stays, with the same meaning.
3. If any other case in the file audits the real repository and takes more than a quarter of its limit on your machine, report it by name and time; do not change it.
4. Show the case still fails on wrong code: break the in-flight count or the recent-commit count in the audit, confirm R-3104 fails, restore it.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Show your work

The before and after timings, the wrong-code run and the locked full suite in the foreground (`npm run test:locked`).

## Done when

Green: locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check and `node scripts/identity-scan.mjs --root .`. Push the branch, open a draft pull request, and report the finished CI run for the new tip with the Windows suite leg's time for `component-audit.test.mjs`.
