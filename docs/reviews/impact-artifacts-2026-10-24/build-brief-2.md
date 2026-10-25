Feature: FEAT-029 · Navigate code and investigate impact. Lane impact-artifacts. Class: ordinary. Builder: pi-worker (small lane). Build session 2.

Work in the lane worktree on feat/impact-artifacts, on top of the commit that adds this brief. Session 1 built the block (f5a2927d), and it works. The seat's wrong-code pairs (`seat-mutate-f5a2927d.txt`) found seven must-meet red cases the R-2820 and R-2821 tests cannot catch, because the fixture ledger is too thin. This session changes tests only: do not edit scripts/code-map.mjs, packages/nana-pack/lib/runtime-map-config.mjs, REQUIREMENTS.md rows' text, or any file in a review folder. Do not edit HANDOFF, the session archive or `docs/known-bugs/`.

Precedent:
- packages/nana-pack/tests/runtime-map.test.mjs — the R-2820 and R-2821 fixture root and checks, from session 1.
- docs/reviews/impact-artifacts-2026-10-24/seat-mutate.mjs — the seat's pairs; read each survivor's edit there.

No private helper moves to a shared module.

The task: widen the fixture ledger and the R-2820 and R-2821 assertions so each surviving pair turns its named check red. Each line names the pair and the must-meet red case it is.
1. Pair 2, "readers of a different artifact listed under this one": a second artifact with its own, different readers, and an assertion that one artifact's `read by:` line holds only its own readers.
2. Pair 3, "a reader dropped": a `Reads:` line naming two reader paths for one artifact, both asserted.
3. Pair 8, "the file listed as its own reader": the named writer also on another feature's `Reads:` line for its own artifact, asserted absent from its `read by:` line.
4. Pair 9, "a reader path listed once per feature": one reader path on two features' `Reads:` lines for one artifact, asserted once with both features.
5. Pair 11, "an ID repeated": a named reader on two `Reads:` lines for the same ID, asserted once on its `reads` line.
6. Pair 12, "an ID the file also writes" on its `reads` line: the named writer also read-listed for that artifact by another feature, asserted absent from its `reads` line.
7. Pair 14, "a retired ID starred": a retired `Artifact:` entry on a `Reads:` line, asserted as `A-nnn (no live entry)` with no star.

Run `node docs/reviews/impact-artifacts-2026-10-24/seat-mutate.mjs 2 3 8 9 11 12 14` with SEAT_MUTATE_OUT unset (console only); it must report 7/7 red. Then run it with no pair numbers; it must report 24/24 red. Do not commit any file it leaves.

Checks before your one commit: runtime-map.test.mjs alone; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `npm run test:locked`, with its output kept out of the worktree; then `git status --short` must print nothing.

Seat check: `node docs/reviews/impact-artifacts-2026-10-24/seat-titles.mjs all` must print `0 missing`.

Done: all 24 pairs are red, only the test file changed, the full suite is green, `git status --short` is empty, and the work is committed.

Report (at most 8 lines after the VERDICT line): the commit sha; `git show --stat HEAD`'s file lines; both pair runs' RESULT lines; the full suite's summary line; map, readme, trace, tree and seat-check status.
