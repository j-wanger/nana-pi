Feature: FEAT-003 · Index and connect existing knowledge sources. Lane knowledge-freeze-notice. Class: hook. Builder: pi-worker (small lane). Build session 2.

Work in the lane worktree on feat/knowledge-freeze-notice, on top of the commit that adds this brief. Session 1 built the lane (9ceaad8a), and it works; the independent check found nothing material. The seat's pairs (`seat-mutate.mjs`) found five must-meet red cases the tests cannot catch, and one fixture that does not hold what its name says. This session changes tests, plus one product wording fix named below. Do not edit REQUIREMENTS.md rows' text, HANDOFF, docs/sessions/, docs/known-bugs/, or any file in a review folder.

Precedent:
- packages/nana-knowledge/tests/sources-file.test.mjs — session 1's R-2860 and R-2861 cases, `activatePull`, `roleFixture`, `writeGood`.
- packages/nana-setup/tests/doctor-knowledge.test.mjs — session 1's R-2862 and R-2863 cases, `ProbeDatabase`, and R-675's real docs-only fixture.
- docs/reviews/knowledge-freeze-notice-2026-10-25/seat-mutate.mjs — the seat's pairs; read each gap pair's edit there.

No private helper moves to a shared module.

The task. Each line names the pair and the must-meet red case.
1. Pairs 8, 9 and 10 (R-2860, no notice for a reviewer or worker role, bad input or a skipped prompt): those null checks run after `activatePull(noticePullGoodTwin)`, and `NANA_KNOWLEDGE_HOME` is never switched back to `roleFixture`. So they read a good sources.json. Make each of those pulls read the broken home, and assert null.
2. Pair 3 (R-2860, the notice is not counted inside the block budget): add a broken-file hit case whose pointer block sits close to `BLOCK_MAX_CHARS`, and assert every pointer the good-file twin prints still prints after the notice.
3. Pair 24 (R-2862, doctor's detail carries no parser message): add a broken file whose parser message quotes file text, and assert that text is absent from the detail.
4. Pair 33 (R-2863, an index with no meta table gives `no build time recorded`): run that case on a real docs-only database, as R-675's fixture does, so the meta query really throws.
5. R-2861's CRLF case: `writeGood` writes single-line JSON, so its CRLF copy equals the plain one. Make the CRLF fixture a multi-line JSON file with CRLF line ends, and assert it holds a carriage return.
6. Product wording (independent check, NOTE 1): the UNREADABLE notice has no full stop between the marker and the clause. Separate them as the UNPARSEABLE notice does, and assert it in R-2860's unreadable case.

After your commit, run `SEAT_MUTATE_TIP=HEAD node docs/reviews/knowledge-freeze-notice-2026-10-25/seat-mutate.mjs 3 8 9 10 24 33` with SEAT_MUTATE_OUT unset (console only); it must report 6/6 red with each named title red. Then run it with no pair numbers; it must report 40/40 red. Amend your commit only if a pair still survives, then run both again. Do not commit any file it leaves.

Checks before your commit: sources-file.test.mjs and doctor-knowledge.test.mjs alone; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `npm run test:locked`, with its output kept out of the worktree; then `git status --short` must print nothing. Do not run the install check; the seat runs it.

Seat check: `node docs/reviews/knowledge-freeze-notice-2026-10-25/seat-titles.mjs all` must print `0 missing`.

Done: all 40 pairs are red with each named title red; the full suite is green; `git status --short` is empty; and the work is committed.

Report (at most 8 lines after the VERDICT line): the commit sha; `git show --stat HEAD`'s file lines; both pair runs' RESULT lines; the full suite's summary line; map, readme, trace, tree and seat-check status.
