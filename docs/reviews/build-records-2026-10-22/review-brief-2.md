# Review — build-records, confirmation round 2, 2026-10-22 (the final reviewer)

Feature: FEAT-006 · Launch builders with execution limits

Class: ordinary. Threat model as round 1 (`review-brief.md`): honest variation in our own tools' output, deliberate forgery out.

This is a confirmation round. Review only the change since round 1's revision, 52ae45fd, which you accepted with LAND (`r1-opus-45d89999.md`). The lane's own commits since then:
- 73603ddf — the seat's Windows CI finding F5, round 1's review text kept, round 1's four notes plus one Windows note added to `docs/known-bugs/FEAT-006.md`, and `build-brief-5.md`.
- cc8ac3c2 — build 5: R-2599's test only, in `packages/nana-pack/tests/build-records.test.mjs`. On win32 the blocked-start case also accepts `ENOENT`, and each case accepts the ledger path in its real long form as well as the raw `LEDGER`.
- d1f67e3f — a merge of current main, ca4018ed (project-drift-notice landed). Conflicts were HANDOFF's Landed lines (both kept, main's first) and the session archive (both entries kept); the seat regenerated the code map and tree outline and updated HANDOFF's lanes line and the Windows first-try count. The rest of the merge diff is the landed lane, already reviewed there; review only its interaction with this lane.
- the final commit adds this brief.

Why build 5 exists: draft PR CI at 52ae45fd failed R-2599 on the Windows suite leg (the first leg run to reach this file there). Windows reports `ENOENT` when a file sits where the ledger folder should be, and the test built `LEDGER` from `os.tmpdir()`'s 8.3 short form while pi-worker prints the git common folder's long form. pi-worker's behaviour matched the row.

The seat's record: no removed escape lines; session titles 0 missing; `build-records.test.mjs` and `build-report.test.mjs` pass after the merge; map:check, readme:check and the trace are green. Build 5's locked full suite: `208 PASS, 0 FAIL, 2 SKIP`. The macOS leg at 73603ddf's successor failed once in review-ledger's watchdog-signals check, a known load flake (2026-10-20); CI runs again at this tip.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`) is unchanged from round 1 apart from the new base: 9 rows in FEAT-006 and CAP-02's deliverables gaining R-2597.
