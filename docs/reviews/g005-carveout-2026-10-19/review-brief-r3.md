# Review — g005-carveout, confirmation round 3, 2026-10-19 (Opus, the lane's one final reviewer)

Feature: FEAT-033 · Adopt explicit engineering standards

Review `git diff cf0ee97..HEAD` on `feat/g005-carveout`. `git merge-base HEAD feat/rulings-file` is `ed38cb4`.

Round 2 (Opus) said LAND on `cf0ee97`, a merge of main `ab5c3e8`. Since then `4d7285d` merges `ed38cb4`, the rulings-file lane's reviewed tip, which becomes main by fast-forward when its land finishes (main today is `ab5c3e8`; `ed38cb4` contains it). Rulings-file adds the rulings file every seat reads at startup: nana-setup install, doctor and state-manifest rows, a new pi extension, and the shared section's runtime table. Conflicts resolved: HANDOFF and the session file kept both sides; the R-291 leaf total (now 1,267), the tree and the code map were regenerated. The lane's own rule text and check are unchanged since round 1.

Tree movement (`node scripts/requirements-moved.mjs --root . --base feat/rulings-file`):

```
tree movement ed38cb4..4d7285d: 2 rows in 1 features
FEAT-033 · Adopt explicit engineering standards
  G-005 text changed
  R-1480 new (implemented)
```

The seat ran on the merged tip: skills-and-standards, rulings, templates-render and the three requirement tests; map and README checks. Install-check re-runs before the land.

Threat model: honest variation in our tools' output in scope; deliberate forgery out. Lane class: ordinary.

Check: (1) the merge kept both sides' text and lost nothing from either lane — in particular the standards rule and the requirements skill carry this lane's export wording, and the shared section carries rulings-file's runtime table; (2) any MUST.
