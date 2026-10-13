# Lane cc-hooks-windows — build brief 3 (2026-10-12 · feat/cc-hooks-windows · worktree ~/nana-pi-wt/cc-hooks-windows)

**Builder: Claude Sonnet 5.5**, fresh session. ONE item. Work ONLY inside `/Users/jwang/nana-pi-wt/cc-hooks-windows`.

## The item — a missing status message is not the installer's (R-1061, R-653, R-923)
Build 2 (`1876920`) made `installerTarget` reject ANOTHER status message but let an entry with NO
`statusMessage` fall through to the shape checks. Main rejects both: `mergeKnowledgeHook` skips any entry
whose `statusMessage !== "nana: knowledge pull"` (main `settings.mjs:276`), and the legacy path requires the
key set `command,statusMessage,timeout,type` (`:334`). Seat probe, POSIX, a stale
`NODE_NO_WARNINGS=1 node '/old/…' hook` entry with timeout 5 and no status message:
main → `{"added":true,"replaced":false}`, entry left as it was; lane → `replaced: true`, entry rewritten.
R-1061 says POSIX reads as main does.

- An entry is the installer's own only when its `statusMessage` EQUALS the wanted row's. Missing counts as
  different. Every entry the installer has ever written carries its status message, so a fixture that seeds
  an installer-written entry (stale or healthy) must carry its row's status message too: fix those fixtures;
  do not keep the loophole for them. No test deletion; a changed fixture keeps its title. Your build-2 report
  said strict equality dropped `seat-verify-hooks` to 58/59: that was the SEAT's fixture, which seeded a stale
  entry with no status message. The seat fixed it in the commit that adds this brief; it passes 59/59 either way.
- Wrong code first. Cases, each with `// req:` above it:
  - POSIX: the entry above (no status message) is left byte for byte and the merge reports it as main does
    (`added`, not `replaced`);
  - forced win32, iterating the five labels: an exec-form entry with no status message is kept byte for byte;
  - `installerTarget` returns null for a missing status message (pure case).

## Done — do not report DONE until all of these pass on your last commit
`npm run req:tree`, `npm run map:check`, `npm run readme:check`, `npm run test:locked` (0 failed), both seat
scripts as in brief 1 (outputs re-committed), and
`SEAT_MUTATE_OUT=docs/reviews/cc-hooks-windows-2026-10-12/seat-mutate-build3-output.txt node docs/reviews/cc-hooks-windows-2026-10-12/seat-mutate.mjs`
with `0 survived` on its last line (the seat added pairs 25 and 26 for this gate). Commit the outputs, push,
and report the Windows `settings-merge` and `hooks-win32-exec` lines verbatim with the run ID.

## Rules
Brief 1's and 2's hold. Do not edit `CHANGE.md`, the seat scripts, `HANDOFF.md` or `docs/sessions/`.

## Report
≤ 20 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; the cases and the clause each pins;
fixtures changed and why; the `test:locked` summary line; the last line of each seat output; the Windows lines
with the run ID; the one claim most likely wrong.
