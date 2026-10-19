# Review — gate-rm-workdir, confirmation round 2, 2026-10-19 (Opus final review and Fable land review)

Feature: FEAT-010 · Guard risky commands and protected resources

Review `git diff 344b94b..HEAD` on `feat/gate-rm-workdir`. `git merge-base HEAD feat/study-stop` is `f29827a`.

Round 1 said LAND from Opus and LAND 9/10 from Fable on `344b94b`. Since then:

- `3e22819` merges `f29827a`, the study-stop lane's reviewed tip. Lands go in order g005-carveout, report-test-details, study-stop, then this lane; each is a fast-forward, so `f29827a` becomes main before this lane lands. It brings bench-win, rulings-file, g005-carveout, report-test-details and study-stop. None of them touches the gate: `git diff f29827a HEAD -- packages/nana-pack/extensions packages/nana-pack/lib` shows only this lane's change (`nana-gate.ts` 6 lines, `lib/gate-rm-inside.ts` new). HANDOFF and the session file kept both sides; the R-291 leaf total (now 1,285), the tree and the code map were regenerated.
- The seat's follow-up commit: the HANDOFF Next bullet that three lanes edited now reads as one line (all three small fixes have landed); Fable's two SHOULDs are residuals (a mount point inside the working folder counts as inside it; three gate corpus checks for allow patterns now pass through the new exemption).

The lane's own code and tests are unchanged since round 1, so the seat did not re-run its wrong-code pairs (34 of 34 red on `0862220`).

Tree movement (`node scripts/requirements-moved.mjs --root . --base feat/study-stop`):

```
tree movement f29827a..3e22819: 7 rows in 1 features
FEAT-010 · Guard risky commands and protected resources
  R-1490 … R-1496 new (implemented)
```

The seat ran on the merged tip: gate-rm-inside (7), gate-corpus (227), gate-survives-mutation (38), display-surfaces (181) and the three requirement tests; map and README checks clean.

Threat model: honest variation in our tools' output, platforms and configs in scope; deliberate forgery out. Lane class: gate.

Check: (1) the merge kept both sides' text and lost nothing from the lane's change; (2) the residual lines say what round 1 found; (3) the gate still fails closed for every form main asked for except the one the ruling permits; (4) any MUST.
