# Review — clean-revision, confirmation round 2, 2026-10-19 (Opus final review and Fable land review)

Feature: FEAT-007 · Review a specific revision independently

Review `git diff 163afc3..HEAD` on `feat/clean-revision`. `git merge-base HEAD feat/gate-rm-workdir` is `6b3e432`.

Round 1 said LAND from both reviewers on `163afc3`, with one shared SHOULD: git refreshes the timestamps of objects the scratch add re-hashes, so R-1375's promise of unchanged timestamps in the real git folder was false. Since then:

- `68a6327` (build 3, the builder) narrows R-1375 to sizes and modes unchanged, nothing added or removed and no hook run; each fixture gains a never-edited committed file so the check sees a refreshed object; the README's "never writes the repository" becomes "adds and removes nothing, runs no hook; git may refresh re-hashed objects' timestamps".
- `06b84c1` (the seat): the wrong-code pairs re-run on `68a6327`, 19 of 19 red, 0 survived, the same tally as on `77289a0` (`seat-mutate-output-68a6327.txt`); `seat-verify-68a6327.md`; the HANDOFF Landed line and session entry corrected to the narrowed promise; two round-1 residuals (refreshed timestamps delay cleanup of unreachable copies; a force-added ignored file, staged but not committed, reviews as the plain commit while the reviewer's copy still shows it).
- `cdbc0c4` (the seat) merges `6b3e432`, the gate-rm-workdir lane's reviewed tip. Lands go in order report-test-details, study-stop, gate-rm-workdir, then this lane; each is a fast-forward, so `6b3e432` becomes main before this lane lands. It brings watchdog-exit, win-skill-occupied, linux-path-spelling, bench-win, rulings-file, g005-carveout, report-test-details, study-stop and gate-rm-workdir; none touches review-round, review-ledger, pi-review or nana-land. HANDOFF and the session file kept both sides; the R-291 leaf total (now 1,294), the tree and the code map were regenerated. The seat's follow-up commit drops a residual line that repeated the force-added-file one.

Tree movement (`node scripts/requirements-moved.mjs --root . --base feat/gate-rm-workdir`):

```
tree movement 6b3e432..cdbc0c4: 11 rows in 1 features
FEAT-007 · Review a specific revision independently
  R-708 text changed; also applies: FEAT-008
  R-709 text changed
  R-1370 … R-1378 new (implemented)
```

The seat ran on the merged tip: review-ledger (159), immutable-review (18), land (52), path-spelling (11), review-round (33) and the three requirement tests; map and README checks clean.

Threat model: honest variation in our tools' output, git configs and platforms in scope; deliberate forgery out. Lane class: land and review tools (review-round).

Check: (1) build 3's narrowed R-1375 matches what its check proves, and no text still promises unchanged timestamps; (2) the merge kept both sides' text and lost nothing from the lane's change; (3) any MUST.
