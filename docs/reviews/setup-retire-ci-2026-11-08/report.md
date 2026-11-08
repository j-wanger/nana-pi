# setup-retire: nested M4 removal

## Closure

M4 no longer launches `scripts/test.mjs` or any suite file. It imports the public `verifierPipeReason` predicate used by `nana-gate.ts`, asserts a blocked masking command and an allowed pipe-free command, and checks the retained 13 gate/pipe-guard files against the runner's direct package-test discovery pattern. This is a source-pattern and file-presence check, not an independent runner execution. The outer required run executes all 13 regression files plus setup-retire once.

## Files and rows

- `REQUIREMENTS.md`: narrowed R-3802 to the smoke checks and discoverable retained regression files; updated its evidence title.
- `packages/nana-pack/tests/setup-retire.test.mjs`: replaced only existing M4 and added its predicate import. The old nested-suite assertion became false under the corrected test contract. No other test was edited, added or deleted.
- `docs/code-map.md`: regenerated the predicate caller edge and test links.
- `docs/reviews/setup-retire-ci-2026-11-08/`: this record and sanitized command output.

No production behavior changes, new requirement IDs or sealed tunables. This fix card names no Precedent section; it uses the existing public predicate and awaited, bounded test harness without departures.

## Wrong-code pair

- Wrong code: inserted `return null` at the start of `verifierPipeReason`, leaving assertions unchanged.
- `node scripts/test.mjs setup-retire.test --verbose`: exit 1; M4 alone fails, with four other cases passing. See `m4-wrong.log`.
- Restored the production predicate exactly; it has no final diff.
- Green: `node scripts/test.mjs setup-retire.test pipe-guard gate`: exit 0; 14 files PASS, 858 checks pass, 0 fail, 5 skip. See `green.log`.
- An initial wrong-code run also hit M7's stale-map check before map regeneration. The saved wrong-code run repeats the same mutation with the map current and isolates M4.

## Commands

- `npm run map:impact -- packages/nana-pack/tests/setup-retire.test.mjs`: exit 0.
- `npm run map`: exit 0.
- `npm run map:check`: exit 0; see `map-check.log`.
- `npm run req:tree`: exit 0; see `tree.log`; no generated outline diff.
- `npm run readme:check`: exit 0; see `readme.log`.

The final commit's seat checks are also reported in the builder's response. CI covers the full suite under `AGENTS.md`; no local full suite ran. No push, CI lookup, model session or credential access occurred.

## Scope left alone

Read all of `docs/known-bugs/FEAT-013.md`; no listed bug is changed by this test-only fix. R-2694 and `worker-claude.test.mjs` remain untouched, as requested. No setup or hook implementation changed, so no local install check ran. Windows and the full suite remain for the seat's CI run. No open questions.
