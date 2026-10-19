# Review — unread-verdict-loud (an unreadable review verdict fails at the review, not at the land), 2026-10-19 (Opus, the final reviewer)

Feature: FEAT-007 · Review a specific revision independently

Review `git diff 713d6aa..HEAD` on `feat/unread-verdict-loud` (the lane last merged main at `713d6aa`, in `b42b541`;
`git merge-base HEAD main` is `713d6aa`, and main has since moved on to `8482c2e`). The plan of record is
`docs/reviews/unread-verdict-loud-2026-10-19/must-meet.md`: four must-meet checks, rows R-1620 to R-1623, the R-1390
narrowing and six retargets of existing checks. `plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` and
`build-brief-1b.md` are the build and its finish after a launcher stall. The seat's record is `seat-verify-b42b541.md`:
CI run 39301089336 on all three legs (the Windows log `ci-windows-run-1.log` beside it), the wrong-code pairs
(`seat-mutate.mjs`, `seat-mutate-output-b42b541.txt`: 20 of 20 red, 0 survived) and the independent check
(`independent-check-b42b541.md`: HOLDS, no MUST, three findings recorded as HANDOFF residuals).

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

The code under review: `readVerdict` and `complete()` in `packages/nana-pack/bin/review-round.mjs` (the reader now
returns the selected line, its condition and the first trigger line; `complete()` records once and returns `unread`,
with rounds left from `decide()` after the append), the unread branch in `bin/pi-review.mjs` and
`bin/review-ledger.mjs`, the `UNREAD_VERDICT_CONDITIONS` table in `lib/verdict-config.mjs`, and the pack README's exit,
`review-ledger run`, round and Limits text. Tests: `review-ledger.test.mjs` (the four must-meet checks and five
retargets), `handoff-writer-role.test.mjs` (the R-139 retarget, POSIX only) and `requirements-tree.test.mjs` (the leaf
total, 1,302).

Judge whether a completed review whose recorded verdict is empty now makes both launchers print one stderr line and
exit 1, with the round consumed and `--out` kept; whether the line's selected line, condition, trigger line, nana-land
clause and rounds-left count are true; whether what the reader accepts is unchanged byte for byte (R-969, R-1010); and
whether a readable verdict keeps main's output and exit 0.

Threat model: honest variation in our tools' output and the OS is in scope (a reviewer's bold, marks, CRLF, a trailing
tab or notes after the verdict; macOS, Linux and Windows; configs); deliberate forgery is out. Lane class: gate (the
land and review tools: pi-review, review-ledger, review-round, the verdict config).

Check: (1) R-1620 to R-1623 are not vacuous: each fails on main's launchers, on POSIX and on Windows; (2) the reader's
acceptance is unchanged, and each of the six retargets keeps its check's meaning; (3) no fail-open: no empty verdict
exits 0 or prints a success line, and no round is released or double-counted; (4) a readable verdict's output and exit
are unchanged; (5) R-1390's narrowing is honest, and the four rows sit in the right feature; (6) HANDOFF and the
session entry are true; (7) any MUST.
