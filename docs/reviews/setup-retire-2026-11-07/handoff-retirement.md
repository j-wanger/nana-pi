# setup-retire part 2: handoff

Feature: FEAT-013 · Install and connect harness runtimes

## Scope and rows

Removed compaction storage, pickup, pointers and handoff config. Added the adoption-only extension using the existing adoption library, without copying its helpers. Existing stored summaries remain adoption evidence and are never read as prompt text.

R-3801 (M3) and R-3804 (M6) are implemented. R-3800 remains planned until the cross-platform install-turn proof is complete. All handoff-only rows in SUB-001 through SUB-004, plus R-185 and R-187, are retired. The exact row diff accompanies the case inventory. R-079, R-143, R-147, R-641 and R-810 now state surviving behavior. R-159 keeps its surviving agent-dir evidence. Artifact A-002 is retired; its files remain untouched. Component setup remains partial with only pending anchors.

## Tests and wrong-code pairs

`setup-retire.test.mjs` adds only M3 and M6. Both fail against the pre-cut implementation (handoff-wrong.log, exit 1) and pass against the replacement (handoff-tests-final.log, exit 0). M3 uses real pi package discovery without creating a model session, then invokes discovered handlers and the real SessionStart hook. No adoption events are seeded. It checks root/subdirectory deduplication, user-only journal placement, a second event after 25 hours, and adopted-root silence. M6 loads malformed and valid legacy blocks in both scopes, retains gate policy and requires no warnings, fallback or config diagnostics.

Deleted with git rm: the handoff extension and handoff-artifact, handoff-store, handoff-staleness, handoff-trust and handoff-symlink test files. `handoff-deleted-cases.log` lists every deleted declaration and its adjacent markers. Store-key checks were relocated to adoption-producer before deletion. No pipe-guard case existed in these files.

Mixed-file edits:
- adoption-producer: import adoption-only extension; retain adoption cases, replace compaction fixture production with direct temporary store fixtures, drop custom handoff-path suppression and historical compaction prompt comparisons; retain root prompt silence and relocate resolver comparisons.
- handoff-writer-role: retire compaction-only cases, retain the unchanged launcher environment case (R-139/R-1683).
- display-surfaces: remove handoff-only call-site block; retain renderers, gate and adoption cases unchanged.
- writing-injection: remove the handoff participant from composition permutations; retain objective/writing and foreign-section assertions.
- config-normalize: remove only retired handoff leaves and positive-days cases.
- config-trust: remove only handoff assertions from mixed trust checks.
- config-handlers-malformed: discover adoption instead of handoff, remove the handoff malformed-block diagnostic case and expect zero diagnostics for its ignored path.
- code-map-launch: document historical handoff edge losses.

`handoff-mixed-diff.log` and `handoff-row-diff.log` retain the exact removed cases and row edits. `handoff-removed-text-scan.log` searches test files for removed sentences and paths; historical fixtures and retirement inventories do not load removed runtime code.

## Precedent and checks

Followed the small-extension option permitted by O1. The producer imports adoptionSettings, canonicalCwd, repoRootOf, rootState, isAdopted, printable, tailLines and recentReports from the existing adoption library. No helper was moved or copied. Adoption no longer depends on handoff.enabled or handoff.path, because M6 ignores that retired config. NANA_HANDOFF=off still suppresses child adoption reports, preserving the existing adoption role contract.

Read all named precedent files and all 216 known-bug lines. No listed FEAT-013 bug is fixed in this part; the existing npm-prefix test limitation requires npm_config_prefix=~/.local locally. No known-bug file changed.

Final precommit checks: map generation/check, requirement tree, README check, component audit, all touched/dependent tests, test-runner and the local macOS install check exit 0. Logs retain earlier failures and final green runs separately. Full suite is delegated to CI under AGENTS.md; no push or CI read. Native Windows remains for the seat's CI. Final tip checks are reported after the later part.
