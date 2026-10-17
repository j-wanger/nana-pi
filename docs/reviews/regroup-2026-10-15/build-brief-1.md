# Lane regroup — build brief 1 (2026-10-15 · feat/regroup · worktree ~/nana-pi-wt/regroup · base main e451c90)

**Builder: Claude Sonnet 5** (format lane; Jake's core feature). The contract is `CHANGE.md` in this folder, frozen at
`1066464` after sol plan r2 LAND. Read ALL of it, including "Seat revision" and "Plan review r1". Jake's words it serves
are in §1 and §7: the regroup is a core nana feature; every placement reviewed by a second model; shares allowed; the
owner approves a short packet ("Short package", 2026-10-15). New IDs: R-1170–R-1180 and R-1184 only (R-1181–R-1183
belong to the parallel lane `regroup-shares`, building now on its own branch).

## Seat clarifications (readings the plan left open; not plan changes)
1. **Same-family review.** `regroup.review.same_family` is `true` exactly when the drafter's and reviewer's lineage
   strings are equal, and the packet then says "same-family review" in its header; otherwise `false`.
2. **"Names a path" (R-1176).** A row is evidence-placed when its evidence cell names, in a backtick span, a path (the
   text before `::`) that exists under the project root; otherwise it is text-placed.
3. **Counts (R-1178).** A feature's row count and status mix include its subgroups' rows.
4. **Claim addresses (R-1184).** A purpose or outcome claim is `{node, field: "purpose" | "outcome"}`; a section-reason
   claim is `{line, to}`.
5. **Unknown rows (R-1175).** A review verdict, share target or `placed` entry naming a row the ledger does not hold is
   refused, naming it — add a test case under R-1175's title (the seat's checks found this skipped silently).
6. **aml-desk's dry run prints 49 heading lines** (6 Parts, 41 sections, 2 `###` subgroups), not the plan's 47.
7. **Shares.** Leave `shares_added`/`shares_dropped` out of `PROPOSAL_KEYS`; the lane that lands second adds them. The
   "carried" share outcome is pinned by T8's direct call until `regroup-shares` lands.

## Build in this order
1. Rows (§2), then `node scripts/requirements-tree.mjs --write` and R-291's literal (base + 12 = 1,148).
2. Tests by exact title (§5), each `// req:` directly above its check call, run against the base so every new check is
   seen red; commit them.
3. The lift change first (R-1170: each named old heading reported by old line, flat input included, under the existing
   proof), then `scripts/requirements-regroup.mjs`, then the skill paragraph and README. Commit after each part.

## Rules
The lift lane's builder rules hold: wrong code first; a mutation breaks code, never an assertion; no suite test runs a
seat script; never write in another project; temp repos set `core.autocrlf` explicitly. Do NOT run `npm run
test:locked`, the seat's mutation runner, or anything that waits on a background job — run touched test files in the
foreground (`node scripts/test.mjs <file>`), each tool call under 5 minutes; the seat runs the suite and CI. Do not touch
`CHANGE.md`, the seat scripts, `HANDOFF.md` or `docs/sessions/`. Commit with explicit paths; push to origin feat/regroup
(pre-approved); open a DRAFT pull request "regroup (draft, for CI)"; never touch main. Sign commits with the model you
actually run as.

## Done
The touched test files green; `node docs/reviews/regroup-2026-10-15/seat-titles.mjs 1` → `0 missing`;
`node docs/reviews/regroup-2026-10-15/acceptance.mjs > docs/reviews/regroup-2026-10-15/acceptance-output.txt 2>&1` → only
the seat's HANDOFF/session cases miss (133 build cases red at launch, `acceptance-launch.txt`; the run needs the ledger
copies in `~/.cache/nana-lift-ledgers/` and `uvx copier`); `node scripts/requirements-tree.mjs --check`;
`node scripts/code-map.mjs --check`; `npm run -s readme:check`. Commit, push.

## Report
≤ 30 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; each row and the titles that pin it, with the red
you saw first; the touched test files' summary lines; the last line of each seat output; the one claim most likely wrong.
