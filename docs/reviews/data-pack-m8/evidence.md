# data-pack-m8 evidence

Feature: FEAT-033. Row: R-3847, narrowed default-off scope to Python.

## Changes

- `packages/nana-pack/tests/data-pack.test.mjs`: edited only M8, because its whole-release invocation exceeded its Python contract. All three acceptance calls now select `python` and `python-data`; an exact mode-set assertion excludes TypeScript and retains default-off Python scaffold/adopt. Existing Python command, discovery, skipped-test and native acceptance assertions remain unchanged.
- `scripts/template-acceptance.mjs`: optional programmatic `modes` selects mode prefixes. Omission keeps all six renders. No CLI option or release-path behavior changed.
- `docs/code-map.md`: regenerated module header entry.
- No new requirement IDs, tests, sealed tunables or helpers.

## Wrong-code pairs

1. Updated M8 against the old runner, which ignores the filter: `node scripts/test.mjs data-pack.test template-acceptance.test` exited 1; M8 failed its Python-only mode-set assertion. With filtering restored, M8 passed.
2. Removed the runner's skipped-data-test rejection, without changing assertions: `node scripts/test.mjs data-pack.test` exited 1; M8 failed `a skipped data test is not acceptance`. Restored rejection; M8 passed.

## Pre-commit commands

- `npm run map:impact -- scripts/template-acceptance.mjs packages/nana-pack/tests/data-pack.test.mjs`: 0.
- `node scripts/test.mjs data-pack.test template-acceptance.test template-release.test`: 0; 3 files, 25 checks passed.
- `npm run map`: 0.
- `npm run map:check`: 0.
- `npm run req:tree`: 0.
- `npm run readme:check`: 0.
- `npm run template:accept`: 0; unfiltered native acceptance.
- `git diff --check`: 0.

Output: `docs/reviews/data-pack-m8/checks.log`.

## Scope and limits

Card: fix supplies no Precedent section; no precedent departures. Reused `runAcceptance` and `ACCEPTANCE_COMMANDS`. Caller search included scripts: only M8 callers changed; CLI, release and other tests retain the default matrix. No listed known bug touched. No suite tests run, import or copy a seat script added by this change. No line-reading behavior changed.

CI covers the full suite under `AGENTS.md`; no local full-suite fallback run. No Windows host available; native Windows verification remains with the seat/main CI. No push, GitHub access, CI read, issue change or session launch performed.
