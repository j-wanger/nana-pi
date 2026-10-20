# Review — review-records-pin (tests pin how review-ledger run refuses a broken, linked, folder-shaped or unwritable review ledger before a review starts, and how it treats an in-tree --out), 2026-10-19 (Opus, the lane's one final reviewer)

Feature: FEAT-007 · Review a specific revision independently

Review `git diff 4656f646..HEAD` on `feat/review-records-pin` (main was `4656f646` when this brief was written; `git
merge-base HEAD main` is `4656f646`). The plan of record is `docs/reviews/review-records-pin-2026-10-19/must-meet.md`
(rows R-843, R-855, R-852, R-1840–R-1842, R-725 and R-845, in SUB-010; R-723 and R-844 retired), with `plan-attack.md`
(the adversary's AMEND) and `build-brief-1.md` and `build-brief-2.md` beside it. Build 1 is `40319606`; build 2
(`9dae968c`) changes only the Windows arm of R-1842's check after build 1's Windows CI leg failed on its own fixture;
c2b2b4e0 merges main `4656f646` into it. The seat's record `seat-verify-c2b2b4e0.md` holds CI run 39349939721 (0
failing files on macOS, Ubuntu and Windows; R-1842 SKIPs on Windows by its named reason) and the builder's wrong-code
results, with both Windows logs beside it.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main` at c2b2b4e0; the seat's notes commit changes
no row): five rows flipped to implemented, two retired, three added.

```
tree movement 4656f64..c2b2b4e: 10 rows in 1 features
FEAT-007 · Review a specific revision independently
  R-723 untested -> retired
  R-725 untested -> implemented
  R-843 untested -> implemented
  R-844 untested -> retired
  R-845 untested -> implemented
  R-852 untested -> implemented
  R-855 untested -> implemented
  R-1840 new (implemented)
  R-1841 new (implemented)
  R-1842 new (implemented)
```

The change under review: one test file (`packages/nana-pack/tests/review-ledger.test.mjs`), REQUIREMENTS.md, the
regenerated tree and code map. `review-round.mjs`, `review-ledger.mjs` and `pi-review.mjs` are byte-unchanged. Judge
whether R-855's check plants a valid line first, so only a diagnostic naming line 2 passes. Judge whether R-1841's one
check covers all four ledger files, the lock included, and fails a case that is admitted, prints a stack, touches the
target or takes AT_ONCE_MS or longer; and whether R-1840's check names each data file's path. Judge whether R-1842's
POSIX arm proves its fixture with a probe write before it judges the refusal. Judge whether its Windows arm can never
pass without testing: it judges the refusal only after a failed probe write, and otherwise prints its named SKIP. Judge
whether its `finally` restores the folder on both arms, and how the arm behaves when `whoami` yields no SID (it then
strips inheritance and denies Everyone with no read grant). Judge whether R-852's title and bound now read AT_ONCE_MS
with no "(<3s)" literal, and whether AT_ONCE_MS carries its provenance. Judge whether R-725's seeded `new-out.md` holds
exactly the text the review prints, so only a snapshot that leaves it out records the bare HEAD sha, and whether the
check requires a verified round. Judge whether the two R-845 markers sit on the ignored and outside checks. Judge
whether the retirements of R-723 and R-844 are sound and whether each new row is no wider than its check. R-1842 reads
implemented while its check skips on the hosted Windows runner; the seat records that as a HANDOFF residual.

Threat model: honest variation in our tools' output and the OS in scope: macOS, Linux and Windows on Node 22; a cut-off
or hand-trimmed tally line; a ledger file replaced by a symlink or a folder; a ledger folder its user cannot write
(POSIX mode bits, a Windows deny entry, a hosted runner account that writes through a deny); an --out inside, outside or
ignored by the tree, including a leftover output from an earlier run; a slow CI runner. Deliberate forgery out (a
crafted record that parses as valid, a race on the lock). Lane class: ordinary — one test file, rows, the tree and the
code map; no install, hook, extension, gate-policy or land and review tool file, and no nana-setup file, so no install
check.

Check: (1) the must-meet checks are not vacuous: each reds on the wrong-code shapes the plan names (W1, W1b and W2 for
R-843 and R-855; W3 for R-852 and R-1841; W4 and W5 for R-1840 and R-1841; W7 and W8 for R-1842; W9, W9b and W10 for
R-725; W11 and W12 for R-845), the control W5a stays green, and each row is no wider than its checks; (2) R-1842's
Windows arm never passes without testing and its SKIP fires only after a successful probe write; (3) no test writes
outside the temp folders it owns, and every changed folder right or mode is restored; (4) nothing else changed: no
review tool code, and the regenerated tree and code map match fresh runs; (5) the plan's known limits, its cut rows and
the Windows skip are recorded as HANDOFF residuals, and none of them hides a bug that stops the feature; (6) HANDOFF and
the session entry are true; (7) any MUST.

## Chain note (the seat, after this brief was written)

Since `53cc1d99`, the seat merged `27fb9d3c`, the install-pins lane's reviewed tip. Lanes land in order; each land is a fast-forward of main, so `27fb9d3c` becomes main before this lane lands. Review this lane's own change as `git diff 27fb9d3c...HEAD` (three dots: against the merge base) and the merge itself as `git show --remerge-diff 05b6f85c` (the merge commit) if your git supports it; the generated tree, code map and R-291 leaf total were regenerated by the seat's merge helper. Tree movement now (`node scripts/requirements-moved.mjs --root . --base 27fb9d3c`):

```
tree movement 27fb9d3..05b6f85: 10 rows in 1 features
FEAT-007 · Review a specific revision independently
  R-723 untested -> retired
  R-725 untested -> implemented
  R-843 untested -> implemented
  R-844 untested -> retired
  R-845 untested -> implemented
  R-852 untested -> implemented
  R-855 untested -> implemented
  R-1840 new (implemented)
  R-1841 new (implemented)
  R-1842 new (implemented)
```
