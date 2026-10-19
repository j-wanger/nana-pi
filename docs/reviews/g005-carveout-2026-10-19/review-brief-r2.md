# Review — g005-carveout, confirmation round 2, 2026-10-19 (Opus, the lane's one final reviewer)

Feature: FEAT-033 · Adopt explicit engineering standards

Review `git diff 58881aa..HEAD` on `feat/g005-carveout`. `git merge-base HEAD feat/bench-win` is `ab5c3e8`.

Round 1 (Opus) said LAND on `58881aa`. Since then `fccdfc2` merges `ab5c3e8`, the bench-win lane's reviewed tip, which becomes main by fast-forward when its land finishes (main today is `ca27d86`; `ab5c3e8` contains it). That merge brings watchdog-exit, win-skill-occupied, linux-path-spelling and bench-win. Conflicts resolved: HANDOFF and the session file kept both sides; the R-291 leaf total (now 1,258), `docs/requirements-tree.md` and `docs/code-map.md` were regenerated. The lane's own rule text and check are unchanged since round 1.

Tree movement (`node scripts/requirements-moved.mjs --root . --base feat/bench-win`):

```
tree movement ab5c3e8..fccdfc2: 2 rows in 1 features
FEAT-033 · Adopt explicit engineering standards
  G-005 text changed
  R-1480 new (implemented)
```

The lane changes the requirements skill's text. Main's skill-copy history (from win-skill-occupied) lists only copies made before the copy marker existed; main's current skill text is in it, and every copy made from this lane's commit carries the marker. The seat checked both hashes.

The seat ran on the merged tip: skills-and-standards, templates-render and the three requirement tests; map and README checks. Install-check re-runs before the land.

Threat model: honest variation in our tools' output in scope; deliberate forgery out. Lane class: ordinary.

Check: (1) the merge kept both sides' text and lost nothing from the lane's change; (2) the HANDOFF Next line still names the two remaining small fixes and drops only this one; (3) any MUST.
