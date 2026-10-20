# Review round 2 — rm-outside-asks (a plain rm outside the working folder and every temp folder asks first), 2026-10-20 (pi gpt-6-astra, the land reviewer)

Feature: FEAT-010 · Guard risky commands and protected resources

Round 1 reviewed `31e85b5d`. pi gpt-6-astra (the land reviewer) said LAND, with a SHOULD (shell comments are not stripped; carried in HANDOFF). Claude Opus 5.5 (the final reviewer) said SEND-BACK with one MUST: CI run 39460770013 at 490bb78b failed `gate-rm-outside.test.mjs` on Ubuntu, 6 pass and 3 fail, because the fixture root sits under `os.tmpdir()`, which is `/tmp` on Linux, and build 2's `gateTempRoots()` counts `/tmp`. The three handler cases build 2 added (R-2330's detection pass, R-2331's `~` and `$HOME` spellings, R-2335's cd inside a subshell) therefore saw their targets as temp. Its SHOULD 3: `gateTempRoots()` gave `/tmp` to darwin and linux only, narrower than main's non-win32 rule for the lane write guard.

This round reviews what changed since: `git diff 31e85b5d..HEAD` on `feat/rm-outside-asks`.
- `2b0ccfb7` is build brief 3. `22a49d27` is build 3: in `packages/nana-pack/tests/gate-rm-outside.test.mjs` the three handler cases use never-created targets outside every temp root (the filesystem-root outside path for the detection case, a relative target whose `../` steps reach the filesystem root for the cd case, a never-created HOME for the home cases), and in `packages/nana-pack/extensions/nana-gate.ts` `gateTempRoots()` adds `/tmp` on every platform but win32. Rows unchanged.
- `c9507890` is the seat's pairs on 22a49d27: 31 of 31 red (`seat-mutate-output-22a49d27.txt`).
- The seat's notes commit (the commit that adds this brief): HANDOFF's Landed line covers build 3; two residual edits (the Git Bash `/tmp` line gains the reviewer's note; a new line for unstripped comments); the session entry's "Round 1 and build 3" paragraph; the seat record's build-3 section.

Evidence: the builder showed `TMPDIR=/tmp npm test -- packages/nana-pack/tests/gate-rm-outside.test.mjs` 6 pass, 3 fail before its change and 9 pass after; the seat re-ran it under the default TMPDIR and `TMPDIR=/tmp`, 9 pass each. G2, G5 and G6 stay red under both temp layouts (builder's run) and in the seat's table. CI on c9507890 was still running when this brief was written; the seat reads its Linux and Windows legs before the land, and the land runs the locked suite on the reviewed tip.

Tree movement since main (`node scripts/requirements-moved.mjs --root . --base cd2d580e`):

```
tree movement cd2d580..c950789: 9 rows in 1 features
FEAT-010 · Guard risky commands and protected resources
  R-2330 new (implemented)
  R-2331 new (implemented)
  R-2332 new (implemented)
  R-2333 new (implemented)
  R-2334 new (implemented)
  R-2335 new (implemented)
  R-2336 new (implemented)
  R-2337 new (implemented)
  R-2338 new (implemented)
```

Threat model and class as round 1: honest variation in commands, paths, platforms and temp layouts is in scope (including `os.tmpdir()` = `/tmp`); deliberate forgery is out. Lane class: gate.

Check: (1) round 1's MUST is fixed: the three handler cases fail with their wrong code and pass on the real gate under any temp layout, Linux's included, and nothing they create lies outside the fixture; (2) `gateTempRoots()` gives the lane write guard exactly main's `/tmp` rule again, and the rm check the same roots; (3) nothing round 1 accepted changed; (4) HANDOFF, the session entry and the seat record are true about build 3; (5) any MUST.

This is a confirmation round on the final tip after fixes to named findings.
