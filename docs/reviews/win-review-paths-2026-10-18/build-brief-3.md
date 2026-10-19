# Lane win-review-paths — build brief 3 (2026-10-18 · feat/win-review-paths · tip after 91418e4)

**Builder: the roster's builder through `pi-worker --lane win-review-paths`.** A gate lane. Read `must-meet.md`, then
`build-brief-2.md` and the commit 91418e4 it produced. The seat re-checked build 2 itself (`seat-audit-2.md`): the
seven test files are green on macOS, the map, trace and README checks are clean, and the red proofs hold. Two MUSTs
remain, both in the dev+ino identity fallback build 2 added.

**MUST 1 — remove the identity skip from the snapshot.** `workingState` (`review-round.mjs`, the `skipIds` lines) and
`copySnapshot` (`pi-review.mjs`, the `excludedId` lines) now skip any file whose dev and ino equal the `--out` file's.
Build 2 measured that git's untracked listing already carries the disk case, so the path-key skip covers the case it was
written for; GP2's case leg passes with or without it. On Windows a false match is possible: libuv reports NTFS's 64-bit
file reference as a JS number, which drops low bits once the sequence number is 32 or more, so two nearby files can
share an identity (inferred from libuv's Windows stat, which fills `st_ino` from the file's index number; not
measured here). A false match in `workingState` leaves a real file out of the land's working-state record, which
fails open. Remove both identity skips and keep the path-key skips. GP2's case leg stays as a guard and must still pass.

**MUST 2 — make the identity exact where it stays.** `outInTree`'s `trackedByIdentity` keeps the identity fallback
(GP1's case leg proved it red on 4c4afa5). A false match there refuses a good `--out`. Make `fileIdentity` exact: read
`lstatSync(p, { bigint: true })`, compare dev and ino as bigints, and return null when ino is 0 (a volume with no file
ids). Keep every caller's compare on `fileIdentity`'s result. Update `real-path.mjs`'s header and comments to match.

Nothing new to pin: no volume on this Mac gives an inode past 2^53, and the seven must-meet tests are the only tests.
Every touched file's macOS count stays as it is now: path-spelling 11, review-standard 7, land 51, immutable-review 17,
review-ledger 155, review-round 33, worker-lane 52. Do not touch `HANDOFF.md`, `docs/sessions/` or the seat's files.

## Done
Those seven files green on macOS; GP1's case leg still red with `trackedByIdentity` removed (prove it, then restore);
`npm run map`, `map:check`, `node scripts/requirements-trace.mjs` and `readme:check` clean. Commit with explicit paths,
prefix `win-review-paths: `, and push to `origin feat/win-review-paths`.

## Report
≤ 8 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: the commit; each MUST and its evidence; each file's macOS line.
