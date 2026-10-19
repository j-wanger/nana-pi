# Lane clean-revision — build brief 1 (2026-10-19 · feat/clean-revision · tip after the seat merges feat/win-review-paths)

**Builder: Claude Sonnet 5, a subagent in this worktree** (`<worktrees>/clean-revision`). A **gate lane**:
it changes review-round's `workingState`, which pi-review and nana-land read. Follow
`packages/nana-pack/prompts/builder-preamble.md` as your rules (WORKTREE = this worktree, BRANCH = `feat/clean-revision`).

Read first: `must-meet.md` here (MM1 to MM8, rows R-1370 to R-1377, already `planned`), then `plan-design.md` (the
design), then `plan-attack.md` (the adversary's AMEND — it wins where the two differ: borrow objects through an
`objects/info/alternates` file in the scratch object folder, never the environment variable), then `plan-inventory.md`
for any site's detail. The branch already carries win-review-paths' canonical-path work (`lib/real-path.mjs`,
`realOut`, `gitPathKey`, `repoKeyOf`); build on it and keep its `--out` exclusion matching.

**Build, in this order:**
1. The tests: MM1 to MM8 as `must-meet.md` names them (file::title), each with its `// req: R-13xx` marker directly
   above the check call; every one cross-platform with no skip; a committed mode comes from `git update-index
   --chmod=+x`, never chmod. Run each against today's code and record which go red (MM1, MM2, MM3, MM4, MM7 must).
2. The row amendments: R-708 and R-709 as `must-meet.md` says; remove the three collapse checks that pin today's
   raw-byte behaviour (CRLF, chmod, clean filter) and keep R-709's split check; fix `win32-launch.test.mjs`'s plain-sha
   check (commit its file with `update-index --chmod=+x`, correct its comment).
3. The code: `workingState` per the amended design — a scratch index seeded with `read-tree HEAD`; a scratch object
   folder whose `info/alternates` file holds the repo's absolute object folder (forward slashes on Windows; refuse a
   path holding a newline); the real index read first so a corrupt index still refuses (R-712); `git add -A` with
   nested repositories excluded and folded in by recursion; `--out` paths reset to HEAD after the add; `write-tree`;
   scratch removed in `finally`. `gitOut` gains an `env` option. Name the scratch prefix as a constant with its
   provenance. Update review-round's module header (`@inputs`, `@effects`) and the pack README's revision paragraph.
4. Flip each row to `implemented` when its test passes.

Every existing test file's macOS count stays the same except review-ledger (minus the three removed collapse checks,
plus the new MMs) and the files that gain an MM. Run `npm run map` after the change and commit the map.

## Done
review-ledger, immutable-review, land, review-round, path-spelling, worker-lane and win32-launch green on macOS; the
eight MMs green; `npm run map:check`, `node scripts/requirements-trace.mjs` and `npm run readme:check` clean; the full
suite through `npm run test:locked` green on your last commit. Commit with explicit paths, prefix `clean-revision: `,
ending `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`. Do not push; the seat pushes.

## Report
≤ 14 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; each MM red-today and green-after; each touched
file's macOS line before and after; the derivation time on this repo before and after; the one claim most likely wrong
on Windows.
