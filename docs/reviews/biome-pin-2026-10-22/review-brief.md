# Review — biome-pin (the TypeScript template pins Biome 2.5.15; the render test lints with the pinned version), 2026-10-22 (the final reviewer)

Feature: FEAT-014 · Create or adopt a project workspace

Class: ordinary (the TypeScript template's package.json, the adopt-ts skill's devDependency sentence, the render test, the ledger and its outline, notes). An urgent fix that ships alone: main's suite is red on every platform. Threat model: honest variation in scope — a new upstream Biome release with new formatters or rules, a machine without pnpm, scaffold and adopt renders; deliberate forgery out (a hand-edited rendered package.json).

Review `git diff 09e38e7d..HEAD` on `feat/biome-pin`. Main is 09e38e7d; the lane branched from it. Commits: 2bf5799b (plan), 2d4ec87e (the build) and the final commit (the seat's pairs, notes and this brief).

The plan of record is `docs/reviews/biome-pin-2026-10-22/must-meet.md`: what broke, decisions D1 to D3, one row (R-2559), the tunable and the known limits; `plan-attack.md` is the adversary's pass (the seat took M1 and S1 to S4).

The seat's record:
- Biome 2.6.0 (2026-10-21) formats Markdown and YAML; the template's `^2.0.0` made a fresh scaffold fail `biome check .` on 9 files, and the render test (`pnpm dlx @biomejs/biome`, always the newest) turned main red. Biome 2.5.15 checks a fresh scaffold and adopt render clean.
- The seat's four wrong-code pairs are red at 2d4ec87e (`seat-pairs.sh`, `seat-pairs-output-2d4ec87e.txt`): the caret back, the adopt render alone on a caret, the version read from the wrong key, the check without the version. They run by hand because the render test copies the template from the committed HEAD.
- The build's full suite: `205 files: 203 PASS, 0 FAIL, 2 SKIP, 0 WARN`; templates-render passes with its Biome check run, not skipped; template acceptance passes. Session titles: 0 missing.
- CI runs on the draft PR (#167) at 2d4ec87e while you review; the seat lands only once its three suite legs pass.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement 09e38e7..2d4ec87: 1 rows in 1 features
FEAT-014 · Create or adopt a project workspace
  R-2559 new (implemented)
```
