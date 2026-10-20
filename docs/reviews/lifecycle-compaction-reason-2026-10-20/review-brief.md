# Review — lifecycle-compaction-reason (in pi, each compaction journal line carries pi's reason for that compaction and no other field of pi's event), 2026-10-20 (Opus, the final reviewer)

Feature: FEAT-023 · Inspect changes and receive useful notices

Review `git diff 9552afb1..HEAD` on `feat/lifecycle-compaction-reason` (main was `9552afb1` when this brief was
written; `git merge-base HEAD main` is `9552afb1`). The plan of record is
`docs/reviews/lifecycle-compaction-reason-2026-10-20/must-meet.md`: four must-meet checks, rows R-2141 and R-2380 to
R-2382. `plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` is the one build (c81371f6), with the seat's
re-check on main 9552afb1. The seat's record is `seat-verify-92dce9ff.md`. CI on draft pull request #141 runs at
c81371f6 (run 39495504953). CI-PENDING. The land runs the locked suite on the reviewed tip, and the seat runs the macOS
install check before the land. The record also holds the macOS wrong-code pairs (`seat-mutate.mjs`; 5 of 5 red, 0
survived; record `seat-mutate-output-c81371f6.txt`) and the independent check (`independent-check-92dce9ff.md`: HOLDS
over ten probes on c81371f6, no MUST; its one known bug, two stale HANDOFF residuals, is settled in the seat's notes
commit).

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, which reads from the merge base; run at
92dce9ff, before the seat's notes commit):

```
tree movement 9552afb..92dce9f: 4 rows in 1 features
FEAT-023 · Inspect changes and receive useful notices
  R-2141 violated -> implemented
  R-2380 new (implemented)
  R-2381 new (implemented)
  R-2382 new (implemented)
```

CAP-05 moves from 105 to 108 rows and FEAT-023 from 47 to 50. R-2141's text is unchanged; only its status and evidence
changed.

The code under review: the session_before_compact, session_compact and session_compact_failed handlers in
`packages/nana-pack/extensions/nana-lifecycle.ts`, which now pass `{ reason: (event as any).reason }` to `log`, with no
default, allow-list, coercion or spread of pi's event; session_before_compact still returns undefined. Tests: four
checks in `packages/nana-pack/tests/lifecycle-journal.test.mjs` (R-2141 on the main fixture; R-2380 to R-2382 through
one `fireBatch` helper, each on its own fixed-name subfolder of the fixture folder), plus the corrected CASES comment
and a one-sentence @purpose. The rest of the diff is the plan, the seat's records, the generated code map and tree,
HANDOFF and the session entry.

Judge whether each compaction line now carries pi's reason unchanged, carries no reason field when pi sends none, and
carries no field of pi's event beyond the reason; whether any handler can now throw into pi or change what
session_before_compact returns to pi; whether the journal's existing readers still work; and whether the test writes
only inside the fixture folder it owns and removes it.

Threat model: honest variation in our tools' output and the OS is in scope (pi 1.0.2's three reasons, a reason a later
pi adds, older pi that sends no reason, pi's full event shapes, the macOS, Linux and Windows layouts); deliberate
forgery is out, such as a forged event or a reason that is not text.
Lane class: install, hook or gate — the pi extension nana-lifecycle.

Check: (1) the must-meet checks are not vacuous: each pair turns its named check red (5 of 5) — judge whether any
must-meet check is still unproven, given that R-2380 and R-2382 are green on main's code by design; (2) no handler
throws into pi, and session_before_compact still returns undefined; (3) nothing main does today stopped working: the
other lifecycle lines, R-162 and R-2140, the reload command, the adoption store's and the install check's journal
readers; (4) the test writes only inside the fixture folder it owns; (5) HANDOFF and the session entry are true,
including the Landed line, the two removed notify-lifecycle-pins residuals and the three new residuals; (6) any MUST.
