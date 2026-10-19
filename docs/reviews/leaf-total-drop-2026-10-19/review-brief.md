# Review — leaf-total-drop (adding a requirement row needs no edit to the tree test), 2026-10-19 (Opus, the lane's one final reviewer)

Feature: FEAT-028 · Maintain requirement identity and trace links

Review `git diff 713d6aa..HEAD` on `feat/leaf-total-drop` (`git merge-base HEAD main` is `713d6aa`; main was at
`27603d4` when this brief was written, two lands later, and the lane has not merged it — that merge gets its own
confirmation round). The seat's hand merge of main `713d6aa` is `32ca20b`; read it with `git show --remerge-diff
32ca20b` if your git supports it. The plan of record is `docs/reviews/leaf-total-drop-2026-10-19/must-meet.md` (rows
R-1640 to R-1643), with the adversary's amendments in `plan-attack.md` and the build in `build-brief-1.md`. The seat's
record `seat-verify-32ca20b.md` holds CI, the Windows log beside it.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`): 4 rows in 1 feature, FEAT-028 — R-1640,
R-1641, R-1642 and R-1643 new (implemented).

```
tree movement 713d6aa..32ca20b: 4 rows in 1 features
FEAT-028 · Maintain requirement identity and trace links
  R-1640 new (implemented)
  R-1641 new (implemented)
  R-1642 new (implemented)
  R-1643 new (implemented)
```

Judge whether adding a requirement row to any feature table now passes the tree test with no edit to it; whether the
row accounting fails naming the ID when the tree parser drops a line the trace rail's `requirementRowId` reads as a
row, or reads one ID under two headings; whether a row in a feature's own table above its subgroups counts once;
whether the per-heading check (committed outline IDs equal the heading's rows plus its descendants') keeps its old
strength; and whether the four must-meet checks would fail with that behaviour removed.

Threat model: honest variation in our tools' output and the OS in scope (ledger shapes such as a row in a feature's
own table above its subgroups, a blank line inside a table, one ID under two headings, a fenced sample row; the trace
rail's and the tree parser's row readers disagreeing; LF and CRLF checkouts on macOS, Linux and Windows); deliberate
forgery out (a hand-edited outline made to match a forged ledger). Lane class: ordinary — one test file, four ledger
rows and the regenerated outline; no install, hook, gate, land or review tool changes.

Check: (1) the four must-meet checks are not vacuous: each turns red under its named wrong code in `build-brief-1.md`
(W1 to W7); the build commit records no wrong-code results, and only the adversary's prototype in `plan-attack.md`
recorded them; (2) the real R-291 check is no weaker than the literal it replaces, apart from the plan's named limit,
a row deleted from both the ledger and the outline; (3) the test file carries no row or leaf total, and nothing else
changed: `scripts/requirements-tree.mjs`, its CLI, the templates and the requirements skill are untouched; (4) the
seat's merge `32ca20b` kept only the lane's side of the test, and main's side there only raised the literal from
1,285 to 1,298; (5) the new accounting and its four checks run in memory and write no file; (6) HANDOFF and the session entry are true; (7) any
MUST.
