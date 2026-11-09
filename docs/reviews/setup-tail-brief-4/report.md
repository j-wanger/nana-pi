# setup-tail brief 4

- Requirement correction: R-3892 keeps one shall and both existing promises. No test changed for this correction.
- Existing failing wording: requirements-trace.test.mjs exit 1 (three failures); corrected wording: exit 0. No new tests or mutation pairs required.
- Merge: local main at e1510b3397dd53e39f236f930cb2cc8bae628ce8; no rebase. Resolve REQUIREMENTS.md by retaining R-3885–R-3893 and main's R-3805 wording/evidence.
- Existing test edits imported from main only: setup-retire.test.mjs M7 title narrowed; redundant nested contract-check loop removed. Both fixes retained; no lane-side test edits.
- Main's deletions stand. Code map regenerated; requirements tree regenerated with no byte changes.
- No precedent departures (Card: fix). No listed known bug changed or closed.
- Commands before merge commit: npm run map; npm run req:tree; node --experimental-strip-types packages/nana-pack/tests/requirements-trace.test.mjs; node scripts/requirements-trace.mjs; node scripts/test.mjs setup-tail.test code-map-launch.test setup-retire.test; npm run map:check; npm run readme:check. Each exited 0.
- Touched tests: 3 files: 3 PASS, 0 FAIL, 0 SKIP, 0 WARN; checks: 26 pass, 0 fail, 0 skip.
- Full suite deferred to CI per AGENTS.md. No push, credential access, model session, or CI inspection.
- Evidence: checks.log (home/worktree/temp paths normalized).
