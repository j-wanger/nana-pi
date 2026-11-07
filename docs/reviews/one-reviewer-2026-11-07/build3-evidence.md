# Build 3 — CI text pins

## Closures

- Restore the README's role-independent, revision-based counting statement. Replace the retired land-ruling example with the equivalent generic new-revision statement. The existing trust-model case now pins that statement under R-971 and R-972.
- Remove only the seat wrong-code assertion from the R-1301 standards/skill case. That assertion names the group-1 seat machinery removed in build 2; R-1301 never required it. Keep all other assertions and the skill's existing must-meet-test contract.

## Files and rows

- `packages/nana-pack/README.md`: restore revision-counting prose without restoring the land reviewer.
- `packages/nana-pack/tests/review-ledger-state.test.mjs`: replace the land-specific sentence pin with the generic sentence pin. No other assertion changes.
- `packages/nana-setup/tests/skills-and-standards.test.mjs`: remove the obsolete group-1 seat-mutation pin. No other assertion changes.
- `build3-pin-audit.log`: grep results for removed README, rule, prompt, skill and shared guidance prose across canonical suite tests. Archived seat scripts and fixture copies are not suite cases and were not executed.
- `build3-checks.log`: sanitized command output.

No requirement diff: this fix restores the existing R-972 contract and removes an assertion outside R-1301. No new rows, tests, tunables, helpers or runtime code. Card: fix has no Precedent section; no pattern departures. No known bug is changed; the complete FEAT-007 known-bug file was read.

## Wrong-text-first pairs

1. Original build-2 text and tests: `node scripts/test.mjs review-ledger-state.test.mjs skills-and-standards.test.mjs` exits 1, failing the two named pins.
2. Updated tests against the still-unfixed README: same command exits 1, with the trust-model case red and the standards/skill case green. Restoring the counting prose makes both green. Assertions were not inverted; the wrong implementation is the build-2 README.

Initial direct file invocations also exited 1 and 7 respectively. The latter additionally failed six doctor checks because direct invocation used the repository cwd rather than the package cwd. The canonical runner supplies the correct cwd and isolated environment; no doctor changes were made.

## Green commands before commit

- `node scripts/test.mjs context-anatomy.test.mjs land-clean-merge.test.mjs outcome-meter.test.mjs review-ledger-state.test.mjs templates-render.test.mjs skills-and-standards.test.mjs seat-rule.test.mjs one-reviewer.test.mjs review-ledger-launch.test.mjs`: exit 0. All grep-matched canonical test files plus the lane and revision-counting regression files.
- Summary: `9 files: 9 PASS, 0 FAIL, 0 SKIP, 0 WARN · checks: 480 pass, 0 fail, 0 skip`.
- `npm run map:check`: exit 0.
- `npm run readme:check`: exit 0.
- `node packages/nana-setup/bin/install-check.mjs`: exit 0 (macOS).
- `git diff --check`: exit 0.

The local full suite is delegated to CI by AGENTS.md. No push, CI read, credential access, model session, issue operation or leak-scan change was performed. Windows execution remains with the seat's CI run.
