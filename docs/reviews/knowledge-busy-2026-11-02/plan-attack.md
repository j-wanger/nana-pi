1. **MUST — M1 contradicts an existing requirement.**  
   **Evidence:** `REQUIREMENTS.md:384` (R-2403) requires a build to fail when another connection holds a write lock. `plan.md:76` requires that same build to wait and succeed after release. Keeping the existing recovery tests unchanged does not resolve the contradiction.  
   **Fix:** Include R-2403 in the requirement diff. Distinguish transient contention during ordinary builds from recovery’s refusal to delete beneath a live writer. Declare the resulting cross-feature tree movement.

2. **MUST — M1’s claimed deterministic overlap is not established.**  
   **Evidence:** `plan.md:76` starts a real CLI during a fixed 1000 ms hold, without specifying readiness or proof that SQLite was reached before release. Under the explicitly in-scope CPU load, main can start late and pass without waiting. M2’s probabilistic red cannot repair that proof.  
   **Fix:** Specify lock-holder readiness, a build-attempt barrier, and evidence that the attempted operation overlaps the held lock. Release from a separate process; require bounded child cleanup. Keep the 15-build churn as supplemental evidence, not a mandatory reproducible red.

3. **MUST — The owner’s combined contention test is missing.**  
   **Evidence:** `plan.md:9` requires R-1713 green under the probe’s contention. M2 runs builds with churn; M5 runs the existing hook test under CPU load. Neither combines them. The existing R-1713 block at `packages/nana-setup/tests/hooks-win32-exec.test.mjs:237-247` starts no churning reader. The plan explicitly retains busy-induced missing pulls (`plan.md:55`).  
   **Fix:** Require the installed stale-index hook to run against an acknowledged active churn process, asserting both the matching pull block and completed rebuild. Record hook reasons and timings. If that fails, address it or explicitly narrow the restoration claim; CPU stress alone is not the requested contention.

4. **SHOULD — M3 does not prove recovery remains fail-fast.**  
   **Evidence:** `plan.md:78-80` checks timeout values and existing recovery tests. `packages/nana-knowledge/tests/recover.test.mjs:207-246` checks rejection and preservation, not elapsed time. Its 30-second case deadline can accept a new five-second delay. Recovery is reached only after the initial build attempt (`lib/build.ts:302-311`).  
   **Fix:** Define whether “fail-fast” means the deletion-safety check or the entire damaged-index build. Add a timed, held-writer case for that boundary, with a subprocess watchdog and preservation assertions. Do not infer timing from green preservation tests.

5. **SHOULD — “Build path” is broader than `create`, and timeout coverage needs separate cases.**  
   **Evidence:** With an existing index and invalid sources, `packages/nana-knowledge/lib/build.ts:327-331` performs both opens without `create`; that build still writes metadata at lines 420-423. Query and status also remain zero-wait (`bin/nana-knowledge.ts:72,133`). M1 does not specify journal mode, while first initialization executes the WAL transition before schema creation (`lib/db.ts:119-121`).  
   **Fix:** Explicitly delimit the fix to healthy-source builds if intended. Add cases for initial WAL establishment and an existing WAL index, rather than treating a configured timeout as proof that every lock acquisition waits. Document the sources-problem, query and status residuals.

6. **SHOULD — Tighten the requirement and verification instructions.**  
   **Evidence:** `plan.md:74` requires every check red against main, although M3’s zero-timeout assertions already hold. M3 specifies an API implementation rather than user behaviour; M4’s stated row lacks a `shall` sentence. The requirements skill requires behavioural EARS rows and honest trace status.  
   **Fix:** Separate new-behaviour red tests from preservation tests and seals. State M3 as bounded hook/recovery behaviour; retain PRAGMA readback as supporting evidence. Give M4 an EARS seal row with chosen-value provenance. Replace the one-file classification command with the full forecast: my full-list run returned the same **hook** classification.

**Counts: 3 MUST, 3 SHOULD.**
