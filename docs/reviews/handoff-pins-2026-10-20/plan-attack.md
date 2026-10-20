# handoff-pins — plan attack (one adversary)

Verdict: AMEND

AMEND. The lane is worth building and the eight pins are sound, but as planned the build turns one existing check red, and one row is wider than its test.

The red check: flipping these eight rows closes the last unready own rows of FEAT-002. The check is `packages/nana-pack/tests/product-report.test.mjs::rejects solid ratings with unready own rows` (R-1024). It stamps FEAT-002 from the live ledger and relies on FEAT-002 still having an untested row. I ran it in a temp clone of main 385c633f with all eight rows flipped: 1 FAIL. Unflipped: 0 FAIL. The plan's Done list never runs that file, so the builder would miss it and the suite would go red at land. Fix: the store-invalid-rules block sets one FEAT-002 own row to untested in the fixture's own ledger copy and commits before stamping, the same way the planned-own-row block beside it already works. I probed the fix: 0 FAIL with the flips and 0 without them. Removing the solid rule in scripts/product-report.mjs still turns both R-1024 checks red. No in-flight lane touches product-report.test.mjs.

The wide row: R-807 covers an unset marker and every value other than exact lowercase off, for both pickup and write. The plan's test tries only OFF. The amended test loops over unset, on, OFF, Off, " off" and "off ". Each pass runs a compaction and then a fresh session. The R-138 check reads the same loop. With this change the trim mutation (W2) also turns R-807 red.

Smaller amendments:
- R-244 copies the live user config into the temp agent folder, so the case does not depend on how config.ts handles a stranded config. config-advice-fixes may change that code. R-244 also restores the variable's prior value instead of deleting it.
- R-189 resets the user config first. The custom-path block before it leaves handoff.path set, and without the reset the check would quietly test the custom file instead of the default store.
- handoff-store's @effects now says it sets PI_CODING_AGENT_DIR, so the map is regenerated.

What I probed: a temp clone with a temp HOME, on macOS with Node 22.22.2. I drafted all eight checks and they pass on unchanged code. Every wrong version, W1 to W20 plus a trim at the write site only, turns its own check red. Each one leaves every existing check green in handoff-writer-role, -store, -artifact, -trust, -symlink, -staleness and -asks. With the rows flipped, requirements-trace, requirements-tree, code-map, requirements-moved, requirement-rows, requirements-lift, requirements-regroup and requirements-unclaimed all pass. map:check and readme:check are green, and req:tree makes no change.

Class: ordinary, because the lane changes tests only. In-flight lanes share only REQUIREMENTS.md, the tree and the map. Their REQUIREMENTS.md hunks sit outside the FEAT-002 lines (knowledge-index-pins is nearest, at about lines 229 to 260). Wait for none.

Files: packages/nana-pack/tests/handoff-store.test.mjs, handoff-writer-role.test.mjs, handoff-artifact.test.mjs, handoff-trust.test.mjs, handoff-symlink.test.mjs and product-report.test.mjs; REQUIREMENTS.md; docs/code-map.md (because the handoff-store header changes); docs/requirements-tree.md only if req:tree changes it (the probe showed no change); docs/reviews/handoff-pins-2026-10-20/builder-mutations.md.

Claim most likely wrong: that the R-880 check passes on the native Windows leg today. It assumes fs.realpathSync.native resolves a junction to the real .pi folder. The repo's path-spelling and canonical-cwd code relies on the same behaviour, but this exact case has not run on Windows. If it fails, that is a real Windows gap in the legacy refusal, and it gets recorded as a finding, not fixed here.
