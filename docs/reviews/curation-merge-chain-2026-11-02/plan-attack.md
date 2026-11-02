## Attack

The mechanism is confirmed by an in-memory synthetic probe: A→B→C leaves **A and C live** on main. Retracting C and B leaves **A live**. No store was accessed or files changed.

1. **MUST — Define absorption across retracted intermediates.**
   **Evidence:** Design 1 excludes retracted targets, but Design 2 requests every transitive ancestor (`plan.md:22–23`). For A→B→C with B explicitly retracted, the probe returns A and C live. An unrestricted reverse closure for C includes A; retiring C would then retract an independently restored record. `sizeLine` would also predict its removal (`memory-curation.mjs:138`).

   **Fix:** Specify whether a retraction cuts absorption traversal; preserving A1 requires that restored A remain independent. Add a middle-retraction case asserting live records, absorbed count, size prediction, and exactly which records a subsequent retire retracts. Define cycle traversal as unique IDs excluding the survivor itself.

2. **MUST — O1’s existing-test criterion cannot preserve conflict output.**
   **Evidence:** `profile-store.mjs:126–127` interprets shared `supersedes` members as competing replacements. For A→B, B→C and B→D, the probe’s direct sets produce one conflict line, for B. Transitive sets produce another, for A. Existing coverage only checks that a conflict marker exists (`profile-store-guards.test.mjs:85`), so that regression passes O1’s gate.

   **Fix:** Separate direct replacement relationships from transitive retirement membership, or explicitly choose and test new conflict semantics. Pin exact conflict lines for this fork. Update all four behavioral consumers together: `show`, retirement writes (`nana-curate.mjs:93`), `sizeLine`, and `renderQueue` (`memory-curation.mjs:138,147`). Repository-wide search found no other behavioral `supersedes` readers.

3. **MUST — “No events lost” needs a non-vacuous oracle.**
   **Evidence:** M1 checks files “written so far”; M4 requires convergence and no event loss without specifying the expected union. Checking only enumerated survivors passes after deletion. The precedent’s byte snapshot occurs before any accepted merge events exist (`memory-curation.test.mjs:101,117`), so copying that pattern protects records but not the newly created event history.

   **Fix:** After each successful accept, assert expected new event identities and payloads, then retain a path-to-bytes manifest. Require every later manifest to preserve it. Before syncing, capture both clones’ nonempty manifests and require their union on both clones afterward. Include proposal/decision files if “no record or event lost” covers the whole curation history.

4. **SHOULD — Add explicit stale-proposal counterexamples, not just fresh sequential proposals.**
   **Evidence:** `staleProposal` checks current liveness only (`memory-curation.mjs:71`); accept invokes it before writing (`nana-curate.mjs:83–86`). The probe confirms a retracted keep is refused. A reverse merge immediately after A→B is also stale because A is hidden. However, after main’s A→B→C resurrection, an older proposal keeping A and dropping C is **not stale**. The existing stale test covers a retirement target retracted remotely, not a merge endpoint.

   **Fix:** Persist proposals before intervening accepts. Assert that hidden keeps, hidden drops, and retracted endpoints refuse without new events or decisions. State that legitimate restoration after an explicit profile retract is distinct from accidental resurrection.

5. **SHOULD — Pin the promised graph boundaries and keep rows behavioral.**
   **Evidence:** M1 and M4 reject main’s alternating-liveness bug; M2 rejects direct-only absorption; M3 rejects “never restore on retract.” But the threat model also promises tied stamps and retirement anywhere in a chain. M3’s inherited two-node cycle test does not pin equal-stamp ordering, longer cycles, or incoming chains (`profile-store.mjs:109–115`).

   **Fix:** Extend the small synthetic matrix with equal-stamp cycles, incoming tails, and reversed record/event enumeration. Assert exact survivors and conflict output. Write R-3698–R-3701 around these observable outcomes, not where closure is computed. The lane-class command confirms **ordinary**.

**Counts: 3 MUST, 2 SHOULD.**
