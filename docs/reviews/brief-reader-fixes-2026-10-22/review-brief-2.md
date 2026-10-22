# Review — brief-reader-fixes, confirmation round 2, 2026-10-22 (the final reviewer)

Feature: FEAT-006 · Launch builders with execution limits

Class: ordinary. Threat model: as round 1 (`review-brief.md`): honest variation in the seat's own brief; deliberate forgery out.

This is a confirmation round. Review only `git diff 2bb2175d..HEAD` on `feat/brief-reader-fixes`: the change since round 1 (your SEND-BACK at 2bb2175d, kept as the round-1 text in the ledger). The commits: 4b4ed917 (the seat's record of finding M1 and build brief 2), 181bb251 (build 2), 130c5c68 (notes), and the final commit with this brief.

Round 1's MUST, M1: build 1 had turned six `\\n` escapes in `packages/nana-pack/tests/worker-lane.test.mjs` into `\n` (the generated `mainPosixScript` and `mainNodeBody`, the `laneSpawnCount` and `descendantPid` stubs, and R-2580's `tracked\\nested.mjs` case). Build 2 restored the six spellings and changed nothing else.

The seat's record:
- `git diff 61ac64f3..HEAD` now holds no removed line with an escaped `\\n`, `\\r` or `\\t` (the seat's new per-build check; it counted 6 at a4e0c45f).
- The builder ran `node --check` on the generated `mainNodeBody(true)`: exit 0. Its wrong version (no backslash normalising in `normalizeEntry`) turned R-2580 red, so the backslash case tests a backslash again.
- Session titles: 0 missing. The builder's locked full suite: `208 files, 206 PASS, 0 FAIL, 2 SKIP`.
- The draft PR's Windows leg at 2bb2175d failed on worker-lane.test.mjs, as you predicted. It also failed R-1472 in test-runner-parallel.test.mjs, the known parallel-runner Windows flake this lane does not touch. CI on this tip runs the Windows leg again; the seat lands only on green.
- Your N1 is now a FEAT-006 known-bug line; N2 was already a known limit. The session entry records build 2 and the finding.

Tree movement is unchanged from round 1 (six new FEAT-006 rows, R-2616 to R-2621).
