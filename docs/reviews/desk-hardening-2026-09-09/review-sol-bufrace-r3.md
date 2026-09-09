### A. Adoption rule — FINDING

- **BLOCK — `apps/desk/public/app.js:365-378, 1935-1969`**: a count increase of one does not prove provenance. A compaction, branch/new-session history rewrite, another client, or a previously stale-generation run can introduce one unrelated same-command card. Returning to the session creates a fresh `bashInFlight` map, so the older server-side POST is no longer counted. The newer POST can therefore adopt the unrelated card.
- **BLOCK — `apps/desk/public/app.js:382-385, 665, 1952-1969`**: repair resync is deduplicated only while the first resync is running. If it completes and clears `resyncQueued` before another ambiguous POST returns, that POST starts a second repair. **Minimal fix:** aggregate ambiguity until the relevant same-command cohort drains, then issue one resync. Adoption itself needs stable execution provenance—preferably an ID carried into history; without that, do not claim a card.

### B. Failure re-apply — FINDING

- **BLOCK — `apps/desk/public/app.js:1950-1964`**: re-applying the buffered failure is correct only if the adopted card is known to belong to that ID. Because the adoption proof above is unsound, a successful card from a different same-command run can be changed to failed. **Minimal fix:** re-apply only after ID-backed attribution; otherwise preserve the transport failure separately and resync.

### C. Budget and surrogate handling — PASS

`apps/desk/public/app.js:395-448, 472-492` correctly uses one error-first budget across error, output, and delta, clips every field, records truncation only after a cut, and caps rendered errors. `tailTo` keeps a high-surrogate boundary and advances past a low-surrogate boundary.

### D. Generation gates — PASS

`apps/desk/public/app.js:1792-1804, 1842-1905, 2217-2238` gates every listed awaited continuation and rejection UI. `spawnSession` refreshes the global rail for stale success before any response UI; the server-created session remains tracked without reclaiming the stage.

### E. Tests and teardown — FINDING

- **SHOULD — `apps/desk/test/session-races.e2e.mjs:781-785, 802-807`**: the two new positive adoption/error assertions depend on a fixed `SETTLE` delay, contradicting the header’s claim that positive outcomes never depend on one. **Minimal fix:** wait for the expected terminal mark/error DOM condition, then assert.
- The eight additional pre-fold failures are credible: 2 ambiguous-adoption, 2 failure-reapply, 2 oversized-error, 1 surrogate, and 1 stale-toast check.
- The detached process-group teardown at `apps/desk/test/session-races.e2e.mjs:179-215` correctly sends group SIGTERM, escalates to group SIGKILL, and awaits server exit before cleanup. The ambiguous-adoption child is covered.

### F. Documentation — FINDING

- **BLOCK — `apps/desk/README.md:317-324`; `docs/review-punchlist-2026-09-08.md:256-260`**: “provably ours,” “older identical command … never,” and exactly one repair resync overstate the implementation. **Minimal fix:** repair the adoption/cohort logic above, or weaken the documentation to acknowledge count-based attribution and potentially repeated repairs.
- Budget, surrogate, finished-row, and stale-toast documentation otherwise matches the code.

VERDICT: BLOCK
