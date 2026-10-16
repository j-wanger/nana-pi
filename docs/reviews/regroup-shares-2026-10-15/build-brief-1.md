# Lane regroup-shares — build brief 1 (2026-10-15 · feat/regroup-shares · worktree ~/nana-pi-wt/regroup-shares · base main e451c90)

**Builder: Claude Sonnet 5** (gate lane: it changes what the lift may write into another project's contract file). The
contract is `CHANGE.md` in this folder, frozen at `e5837c1` after sol plan r1 LAND, plus its final "Seat amendment
(2026-10-15): R-1181 one shall" (meaning unchanged). Read ALL of it including "Seat revision". Jake's ruling it serves:
2026-10-10, "we should allow multiple features pointing to the same requirements". New IDs: R-1181–R-1183 only; R-1167
reworded exactly as §2 says.

## Seat clarifications (from sol plan r1's SHOULDs; not plan changes)
1. `shares_added: []` and `shares_dropped: []` mean no change: an unchanged share line stays byte-identical (R-1181).
2. A repeated ID in `also_applies`, `shares_added` or `shares_dropped` is refused by the validator directly, named, with a
   test case each (under R-1167's title for mapping refusals, or the title §5 gives).

## Build in this order
1. Rows (§2), then `node scripts/requirements-tree.mjs --write` and R-291's literal (base + 3 = 1,139 at this base).
2. The tests by exact title (§5; each `// req:` line directly above its check call; T22b removed as §5 says), run against
   the base so every new check is seen red; commit them.
3. The code (§3): one share reader — `parseLedger`'s FEAT `alsoAppliesLines[0]`, no new finders; every other
   `Also applies:` line refused as R-1167 says; the writer, the proof's independent recount, the plan's one line per
   added or dropped share. Commit after each part.
4. The cross-lane key step (§4) applies only if the regroup lane is on main when you start: it is not, so leave
   `PROPOSAL_KEYS` alone; the regroup lane's merge owns it.

## Rules
All the lift lane's builder rules hold: wrong code first; a mutation breaks code, never an assertion; no suite test runs
a seat script; never write in another project; temp repos set `core.autocrlf` explicitly. Do NOT run `npm run
test:locked`, the seat's mutation runner, or any command that waits on a background job — run the touched test files in
the foreground (`node scripts/test.mjs <file>`), each tool call under 5 minutes; the seat runs the suite and CI. Do not
touch `CHANGE.md`, the seat scripts, `HANDOFF.md` or `docs/sessions/`. Commit with explicit paths; push to origin
feat/regroup-shares (pre-approved); open a DRAFT pull request "regroup-shares (draft, for CI)"; never touch main. Sign
commits with the model you actually run as.

## Done
The touched test files green; `node docs/reviews/regroup-shares-2026-10-15/seat-titles.mjs 1` → `0 missing`;
`node docs/reviews/regroup-shares-2026-10-15/acceptance.mjs > docs/reviews/regroup-shares-2026-10-15/acceptance-output.txt 2>&1`
→ only the seat's HANDOFF/session case misses (70 build cases red at launch, `acceptance-launch.txt`);
`node scripts/requirements-tree.mjs --check`; `node scripts/code-map.mjs --check`; `npm run -s readme:check`. Commit, push.

## Report
≤ 25 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; each row and the titles that pin it, with the red
you saw first; the touched test files' summary lines; the last line of each seat output; the one claim most likely wrong.
