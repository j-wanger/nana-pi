# Review — unread-verdict-loud (an unreadable review verdict fails at the review, not at the land), 2026-10-19 (Fable, the land reviewer)

Feature: FEAT-007 · Review a specific revision independently

Review `git diff 713d6aa..HEAD` on `feat/unread-verdict-loud` (the lane last merged main at `713d6aa`, in `b42b541`;
`git merge-base HEAD main` is `713d6aa`, and main has since moved on to `8482c2e`). The plan of record is
`docs/reviews/unread-verdict-loud-2026-10-19/must-meet.md`: four must-meet checks, rows R-1620 to R-1623, the R-1390
narrowing and six retargets of existing checks. `plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` and
`build-brief-1b.md` are the build and its finish after a launcher stall. The seat's record is `seat-verify-b42b541.md`:
CI run 39301089336 on macOS, Ubuntu and Windows (`ci-windows-run-1.log` beside it), the wrong-code pairs
(`seat-mutate.mjs`, `seat-mutate-output-b42b541.txt`: 20 of 20 red, 0 survived) and the independent check
(`independent-check-b42b541.md`: HOLDS, no MUST). The final reviewer's brief is `review-brief.md`.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement 713d6aa..e4cc2b8: 5 rows in 1 features
FEAT-007 · Review a specific revision independently
  R-1390 text changed
  R-1620 new (implemented)
  R-1621 new (implemented)
  R-1622 new (implemented)
  R-1623 new (implemented)
```

The code under review: `readVerdict` and `complete()` in `packages/nana-pack/bin/review-round.mjs`, which pi-review,
review-ledger and nana-land read; the unread branch in `bin/pi-review.mjs` and `bin/review-ledger.mjs`; the
`UNREAD_VERDICT_CONDITIONS` table in `lib/verdict-config.mjs`; the pack README. nana-land's own code is unchanged.
Judge whether the lane fails open: an empty verdict that still exits 0 or prints a success line; a reader that now
accepts more than main's; a round released, double-counted or recorded under the wrong item; nana-land letting through
a revision with an empty record. Judge whether it leaves a harm the review standard lists: a tally or audit record
lost or corrupted, the kept `--out` removed, a test writing outside its temp folders, a broken install or hook. Judge
whether anything main does today stopped working: a readable verdict's output and exit 0, the watchdog's retries, the
admission and round cap, the changed-tree refusal, and every caller that reads these launchers' exit code.

Threat model: honest variation in our tools' output and the OS is in scope (a reviewer's bold, marks, CRLF, a trailing
tab or notes after the verdict; macOS, Linux and Windows; configs); deliberate forgery is out. Lane class: gate (the
land and review tools: pi-review, review-ledger, review-round, the verdict config).

Check: (1) no fail-open; (2) no listed harm; (3) nothing main does today stopped working, on any of the three CI legs;
(4) HANDOFF and the session entry are true; (5) any MUST.
