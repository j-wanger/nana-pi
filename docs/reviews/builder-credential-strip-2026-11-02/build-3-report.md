# Build 3 technical record

VERDICT: PARTIAL

## Changes

- `REQUIREMENTS.md`: clarified existing R-3663 corpus and R-3667 seal evidence; no new IDs.
- `packages/nana-pack/tests/credential-gate.test.mjs` and `credential-strip.test.mjs`: exact R-917 double-quoted temp-helper import.
- `packages/nana-pack/tests/context-anatomy.test.mjs`: R-3211 exact settings comparison now includes `credentialStripEnv(f.env)` from the lane's existing exported helper. No duplicated configuration names or reset logic.
- `packages/nana-pack/lib/credential-gate-config.mjs`: three additional patterns cover store with a file option, cache get, and short status token display.
- `docs/code-map.md`: regenerated for the new test import.

## Existing test edits

- Credential gate M4: three corpus entries; existing negatives unchanged.
- Credential gate M7: exact seal includes the three additional patterns.
- Credential strip: import spelling only; assertions unchanged.
- Context anatomy R-3211: exact expected environment gains only credential-strip controls.
- No new test declaration or tunable.

## Evidence

- Requirement evidence diff preceded corpus/seal edits and code.
- Each new corpus entry was moved to the first failing position against unchanged gate code: store, short status, cache. Each run exited 1 with M4 naming that command and M7 red. See `build-3-wrong-{store,status,cache}.txt`.
- `node scripts/test.mjs test-runner.test.mjs context-anatomy.test.mjs credential-gate.test.mjs credential-strip.test.mjs rulings.test.mjs worker-claude.test.mjs worker-lane.test.mjs`: exit 0; 7 files, 180 pass, 0 fail, 10 skip. Includes every test file changed by this lane relative to main.
- `npm run map:impact -- packages/nana-pack/lib/credential-gate-config.mjs`: exit 0.
- Initial map check exited 1 (new import made map stale); `npm run map` and repeated `npm run map:check`: exit 0.
- `npm run readme:check`: exit 0.
- `node scripts/requirements-trace.mjs --root .`: exit 0.
- `node scripts/requirements-tree.mjs --root .`: exit 0.
- `node scripts/known-bugs.mjs --root .`: exit 0.
- Pre-commit seat mutation run: exit 0, S1–S11 all red, zero survivors. It used the old HEAD, so final-tip rerun remains necessary.
- Full suite deliberately not run: CI covers it. No push, as explicitly required by this brief.

## Precedent and departures

All three named precedent files were read completely. The temp import matches R-917 exactly. R-3211 retains exact deep equality and imports the existing strip helper rather than copying it. Gate additions stay in the exported sealed pattern list. Existing patterns remain intact so the unchanged seat mutation anchors continue to apply.

Departure: build item 4 requests known-bug edits, but the lane scope explicitly says never edit `docs/known-bugs/`. Those files remain unchanged. The requested lines are carried below for the seat. No existing known bug was fixed; the direct-shell/advisory limits remain.

## Requested known-bug lines, not written to the prohibited folder

- Builder credential strip (builder-credential-strip, review round 2): the ledger spots Claude only by command name; `npx claude`, `node …/cli.js`, an `env` prefix, or args after `--` skip sealing.
- Builder credential strip (builder-credential-strip, review round 2): the pack README does not state that direct `review-ledger run -- claude` reviewers now get the ancestor excludes and auto-memory off.
- Builder credential strip (builder-credential-strip, review round 2): M5's banned phrase lacks backticks.
