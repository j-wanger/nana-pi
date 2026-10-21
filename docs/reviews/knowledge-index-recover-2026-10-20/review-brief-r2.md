# Review round 2 — knowledge-index-recover, 2026-10-20 (Claude Opus 5.5, the final reviewer)

Feature: FEAT-003 · Index and connect existing knowledge sources

Round 1 reviewed `93b32712`. The final reviewer said LAND with one SHOULD already carried and four NOTEs. The land reviewer sent it back with one MUST: when a page check fails before any write, the recovery deleted index.db and its side files while another connection held a write transaction on it, and that connection's committed rows were lost. R-2403's check covered only an undamaged write-locked index. The seat reproduced the MUST on the tip.

This round reviews only what changed since round 1: `git diff 93b32712..HEAD` on `feat/knowledge-index-recover`. Main has not moved (`7aadbc99`).

- `6faebfb3`: `build-brief-3.md`.
- `bf003ea1` (build 3): `assertRecoveryDeleteSafe` in `packages/nana-knowledge/lib/build.ts` runs before the recovery's rebuild. A fresh handle with a zero busy timeout runs `BEGIN IMMEDIATE`. A busy or locked failure fails the build and keeps the index. Only a damage error, or the lock taken, lets the delete go ahead. It rolls back and closes before the delete, for Windows. R-2403's check now runs a healthy and a page-damaged write-locked index; it requires the build to fail, index.db's inode and bytes unchanged, and the committed sentinel readable after the writer rolls back. R-2403's row text is unchanged.
- `8f4c71d8`: the seat's pairs on bf003ea1, 29 of 30 red (`seat-mutate-output-bf003ea1.txt`). B15 drops the call; B16 lets a busy lock pass the check; both turn R-2403 red. B9 survives as declared.
- The notes commit after it: HANDOFF and the session entry record round 1 and build 3, with two new residuals (the gap between the lock's release and the delete; the open's table step before the page check). CI run 39515790247 at bf003ea1 reads 0 failing on all three legs: macOS 197 PASS, 0 FAIL, 2 SKIP of 199 files (8,051 checks pass, 36 skip); Ubuntu 196 PASS, 0 FAIL, 3 SKIP of 199 files (7,990 checks pass, 56 skip); Windows 181 PASS, 0 FAIL, 18 SKIP of 199 files (6,980 checks pass, 114 skip). The install check passes on macOS and Windows. The Windows leg's log is ci-windows-bf003ea1.log in this folder.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, run at 8f4c71d8):

```
tree movement 7aadbc9..8f4c71d: 10 rows in 1 features
FEAT-003 · Index and connect existing knowledge sources
  R-2400 new (implemented)
  R-2401 new (implemented)
  R-2402 new (implemented)
  R-2403 new (implemented)
  R-2404 new (implemented)
  R-2405 new (implemented)
  R-2406 new (implemented)
  R-2407 new (implemented)
  R-2408 new (implemented)
  R-2409 new (implemented)
```

Threat model and lane class as round 1: honest variation in our tools' output, the owner's files and other processes on the machine is in scope; deliberate forgery is out. Install, hook or gate lane: both seats' knowledge hooks start the build this lane changes.

Check: (1) round 1's MUST is closed: no recovery deletes an index another connection holds a write lock on, on the paths a build reaches; (2) the new check adds no false failure for a healthy build, `--rebuild` with no other writer, the broken-sources keep, the lost build lock or Windows; (3) the gap between the check and the delete is honestly described as a residual and is not a material problem under the threat model, or say why it is; (4) HANDOFF and the session entry are true; (5) any MUST.

Answer with the full review as your final message: MUST / SHOULD / NOTE, a score, and as the last line exactly `VERDICT: LAND` or `VERDICT: SEND-BACK`.
