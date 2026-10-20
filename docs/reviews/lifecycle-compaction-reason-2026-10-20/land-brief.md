# Review — lifecycle-compaction-reason (in pi, each compaction journal line carries pi's reason for that compaction and no other field of pi's event), 2026-10-20 (pi gpt-6-astra, the land reviewer)

Feature: FEAT-023 · Inspect changes and receive useful notices

Review `git diff 9552afb1..HEAD` on `feat/lifecycle-compaction-reason` (main was `9552afb1` when this brief was
written; `git merge-base HEAD main` is `9552afb1`). The plan of record is
`docs/reviews/lifecycle-compaction-reason-2026-10-20/must-meet.md`: four must-meet checks, rows R-2141 and R-2380 to
R-2382. `plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` is the one build (c81371f6). The seat's record
is `seat-verify-92dce9ff.md`. CI on draft pull request #141 runs at c81371f6 (run 39495504953). CI-PENDING. The land
runs the locked suite on the reviewed tip, and the seat runs the macOS install check before the land. The record also
holds the macOS wrong-code pairs (`seat-mutate.mjs`; 5 of 5 red, 0 survived) and the independent check
(`independent-check-92dce9ff.md`: HOLDS over ten probes on c81371f6, no MUST). The final reviewer's brief is
`review-brief.md`.

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

The code under review: the three compaction handlers in `packages/nana-pack/extensions/nana-lifecycle.ts`, which pi
loads into every pi session. Each now passes `{ reason: (event as any).reason }` to `log`, which appends one line to the
nana journal through `appendJournal`, best-effort. pi's compaction events also carry the conversation, the summary,
custom instructions and error text; none of it may reach the journal. session_before_compact must still return
undefined, since a truthy return is a result pi acts on.

Judge whether the lane fails open or leaves a harm the review standard lists: a handler that throws into pi or blocks
a compaction, a return value pi would act on, conversation or summary text written into the journal, a journal line
large enough to push other records out of a reader's window, or a test writing outside the fixture folder it owns.
Judge whether anything main does today stopped working: the start and end lines, the reload command, the status chip
and compaction notices, the adoption store's and the install check's journal readers, and all three CI legs.

Known gaps the seat records as residuals; judge whether each is a harm the standard lists or a known limit: a reason
that is not text is journaled as pi gave it, and one JSON cannot write drops that line silently while compaction goes
on; willRetry, aborted, errorMessage and fromExtension stay out of the journal; whether the pack loads on pi older than
1.0.2 is untested, though the check pins the no-reason shape those versions send; the pairs and the independent check
ran on macOS only (the independent check also ran the must-meet file with the platform forced to win32).

Threat model: honest variation in our tools' output and the OS is in scope (pi 1.0.2's three reasons, a reason a later
pi adds, older pi that sends no reason, pi's full event shapes, the macOS, Linux and Windows layouts); deliberate
forgery is out, such as a forged event or a reason that is not text.
Lane class: install, hook or gate — the pi extension nana-lifecycle.

Check: (1) no fail-open; (2) no listed harm; (3) nothing main does today stopped working, on any of the three CI legs;
(4) HANDOFF and the session entry are true; (5) any MUST.
