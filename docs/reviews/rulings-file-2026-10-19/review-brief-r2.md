# Review — rulings-file, confirmation round 2, 2026-10-19 (Opus final review and Fable land review)

Feature: FEAT-001 · Keep goals and priorities in view

Review `git diff 5dc9fca..HEAD` on `feat/rulings-file`. `git merge-base HEAD feat/bench-win` is `ab5c3e8`.

Round 1 said LAND on `5dc9fca` from both reviewers. Since then:

- `6df24de` (build 3, the builder) merges main `ca27d86`. Two code conflicts were import-list collisions with win-skill-occupied: `packages/nana-setup/lib/steps.mjs` keeps both import lines, and `packages/nana-setup/lib/doctor.mjs` keeps main's named imports plus this lane's `RULINGS_FILE` import. The builder grepped every call site of both lanes' names: the rulings doctor row sits beside the occupied-skill-folder refusal, nothing dropped. HANDOFF's Next queue now names trading-zone, not aml-desk (the owner's 2026-10-19 call).
- `28b4701` (the seat) merges `ab5c3e8`, the bench-win lane's reviewed tip, which becomes main by fast-forward when its land finishes. HANDOFF and the session file kept both sides; the R-291 leaf total (now 1,266), the tree and code map were regenerated.

The lane's own code and tests are unchanged since round 1 apart from the merged import lines.

Tree movement (`node scripts/requirements-moved.mjs --root . --base feat/bench-win`):

```
tree movement ab5c3e8..28b4701: 9 rows in 1 features
FEAT-001 · Keep goals and priorities in view
  R-1410 … R-1418 new (implemented)
```

The seat ran on the merged tip: rulings, rulings-install, install, skills-and-standards, state-manifest, uninstall, templates-render and the three requirement tests; map and README checks. Install-check re-runs before the land.

Threat model: honest variation in our tools' output, platforms and configs in scope; deliberate forgery out. Lane class: install and hook (nana-setup install and doctor, a new pi extension).

Check: (1) the two merged code files keep both lanes' behaviour — install still refuses an occupied skill folder it did not make, and still installs and doctor still checks the rulings file; (2) the merges kept both sides' text and lost nothing from the lane's change; (3) any MUST.
