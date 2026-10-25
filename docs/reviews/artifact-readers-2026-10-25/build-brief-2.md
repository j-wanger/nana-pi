Feature: FEAT-028 · Maintain requirement identity and trace links. Lane artifact-readers. Class: ordinary. Builder: pi-worker (small lane). Build session 2.

Work in the lane worktree on feat/artifact-readers, on top of the commit that adds this brief. Session 1 built the lane (9dae642b), and it works. The seat's wrong-code pairs (`seat-mutate-9dae642b.txt`) found eight must-meet red cases the tests cannot catch, because the fixtures lack the case. This session changes tests only. Do not edit scripts/deliverables.mjs, scripts/requirements-moved.mjs, REQUIREMENTS.md rows' text, any template or skill file, HANDOFF, docs/sessions/, docs/known-bugs/, scripts/product-report.mjs, or any file in a review folder.

Precedent:
- packages/nana-pack/tests/requirements-deliverables.test.mjs — session 1's R-2830 to R-2834 fixtures, the fixture builder's unused `capability` option, and `consumerLedger`.
- packages/nana-pack/tests/requirements-moved.test.mjs — session 1's R-2837 fixture.
- docs/reviews/artifact-readers-2026-10-25/seat-mutate.mjs — the seat's pairs; read each gap pair's edit there.

No private helper moves to a shared module.

The task: widen the fixtures and assertions so each gap pair turns its named check red. Each line names the pair and the must-meet red case.
1. Pair 1 (R-2830 and R-2837): put a deliverable `Read by: R-nnn` line in a capability span in R-2830's fixture (the builder's `capability` option), and assert it is not read as an artifact reader. In R-2837's fixture, change a capability-span deliverable `Read by:` line between the two revisions, and assert the movement report lists it once, as a row change, and never as an artifact reader change.
2. Pair 14 (R-2830, "these lines count toward the checker's field lines"): a ledger whose only field line is a misplaced feature-span artifact `Read by:` line; assert the check counts one field line and `--check` prints its note.
3. Pair 20 (R-2832): a capability-span `Parked: R-nnn` line in R-2832's fixture; assert it parks no artifact entry.
4. Pair 21 (R-2832, "names no entry registered in that span"): a FEAT-001 `Parked: A-002 · since …: …` line, with A-002 registered in FEAT-002; assert one note and no park.
5. Pair 36 (R-2834): a retired entry, such as `Artifact: A-010 · ten · retired: replaced by A-001`, in `consumerLedger`; assert A-010 gets no coverage note.
6. Pair 39 (R-2834): a second kinded capability whose feature has a `Reads:` line for a CAP-01 entry; assert that entry counts the code reader.
7. Pair 40 (R-2834, "no accepted park"): a malformed park on an otherwise unread entry in R-2834's fixture; assert the entry still gets the coverage note.
8. Pair 41b (R-2834, a noted reader line gives no kind): a direct-reference deliverable whose `Read by:` line names a test-file path; assert that reference gives the entry no kind.

Run `node docs/reviews/artifact-readers-2026-10-25/seat-mutate.mjs 1 14 20 21 36 39 40 41b` with SEAT_MUTATE_OUT unset (console only) after your commit; it must report 8/8 red with each named title red. Then run it with no pair numbers; it must report 48/48 red. The runner tests your committed tip, so commit first, then run it, then amend only if a pair still survives. Do not commit any file it leaves.

Checks before your commit: requirements-deliverables.test.mjs and requirements-moved.test.mjs alone; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `npm run test:locked`, with its output kept out of the worktree; then `git status --short` must print nothing.

Seat check: `node docs/reviews/artifact-readers-2026-10-25/seat-titles.mjs all` must print `0 missing`.

Done: all 48 pairs are red with each named title red, only test files changed, the full suite is green, `git status --short` is empty, and the work is committed.

Report (at most 8 lines after the VERDICT line): the commit sha; `git show --stat HEAD`'s file lines; both pair runs' RESULT lines; the full suite's summary line; map, readme, trace, tree and seat-check status.
