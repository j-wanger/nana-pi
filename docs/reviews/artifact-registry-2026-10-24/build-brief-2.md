Feature: FEAT-028 · Maintain requirement identity and trace links. Lane artifact-registry. Class: ordinary. Builder: pi-worker (small lane). Build session 2: two survivors in the seat's pairs at af5dc49f.

Work in the lane worktree on feat/artifact-registry. The spec is still `docs/reviews/artifact-registry-2026-10-24/must-meet.md`. Do not edit HANDOFF, the session archive, `docs/known-bugs/`, or any file in this review folder; the seat's pairs table (`seat-mutate.mjs`) and its output are the seat's. Tests only: no change to `scripts/` or the ledger.

Precedent:
- packages/nana-pack/tests/requirements-deliverables.test.mjs — the R-2783 check and its fixture ledgers.
- scripts/deliverables.mjs — the binding (`missingWriters`) and `resolvedArtifact`, the lane-1 shim, unchanged.

Findings (`seat-mutate-output-af5dc49f.txt`):
- F1 (pair 15 survives). The binding says a named reference's claim must list every writer of the entry. Every R-2783 fixture entry has one writer, so a checker that accepts a claim sharing only one writer stays green. Add, inside the R-2783 check with its title unchanged: an entry with two writers, named by a claim of the same run that lists only one of them, gets one note naming the missing writer; and the same claim listing both gets none.
- F2 (pair S1 survives). The lane-1 shim maps a clone-store entry back to today's machine-local name only when the claim's code paths include that store's claim writer (for the suite store, `scripts/test-locked.mjs`), which keeps R-2743's exactness on the page. No check covers that clause. Add, inside the R-2783 check: through `deliverableClaims`, a suite claim naming the suite store entry that lists the entry's writer but not `scripts/test-locked.mjs` resolves to the entry's location, not to `suite-runs`, while the same claim with `scripts/test-locked.mjs` resolves to `suite-runs`.

Confirm by hand that the seat's pair 15 (`entry.writers.some(...)`) and pair S1 (the shim without its claim-writer clause) now turn R-2783 red, restore, and say so in your report; do not commit those changes.

Checks before your one commit: `requirements-deliverables.test.mjs` alone; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `npm run test:locked`.

Seat check: `node docs/reviews/artifact-registry-2026-10-24/seat-titles.mjs all` must print `0 missing`.

Done: both cases pin their clause, pairs 15 and S1 turn R-2783 red by hand, the full suite is green, the seat check prints `0 missing`, and the work is committed.

Report (at most 6 lines after the VERDICT line): the commit sha; F1 and F2; the two hand checks; the full suite's summary line; map, readme, trace, tree and seat-check status.
