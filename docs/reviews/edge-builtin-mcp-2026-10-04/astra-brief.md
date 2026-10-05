# Review brief — the edge desk moves to pi's built-in MCP, plus R-760 (reviewer: gpt-6-astra)

Roles: a Claude worker built it; the seat (Opus 5.5) briefed and verified; you review; the seat
lands. Read `docs/reviews/edge-builtin-mcp-2026-10-04/brief.md` (the seat's brief) and
`worker-report.md` (the worker's claims, tagged [V]/[S]/[I]) in this folder first.

## Scope — two repositories, one commit range each

- nana-pi: this worktree, branch `feat/edge-builtin-mcp`. Review `git diff d358e5d~1..HEAD` in
  full — `d358e5d` is the separate R-760 commit (below); everything after it is the MCP lane.
- edge-screener: `~/edge-screener-wt/builtin-mcp`, branch `feat/builtin-mcp`. Review
  `git -C ~/edge-screener-wt/builtin-mcp diff p87-setup..HEAD`.
- pi 1.0.2 is installed: docs at `$(npm root -g)/@earendil-works/pi-coding-agent/docs/`
  (`mcp.md`, `cli.md`, `extensions.md`), source under `dist/` (`extensions/mcp/tools.js`,
  `core/extensions/runner.js`, `core/resource-loader.js`). Cite pi behaviour from there, not memory.

## Item 1 — R-760 (commit `d358e5d`)

The seat rewrote R-760 from "IF the store lock path is obstructed OR holds a fresh or future-dated
lock THEN the remedy shall never tell the owner to delete or move the lock" (`violated`) to the
held-lock case only (`implemented`). Claim: the code was right and the row was wrong. An
obstructed lock path (a file, a link or a non-empty folder) is never a running pi's lock, and pi
never clears it. So "move it aside" is the only fix there, which R-026 covers. Attack: is any
obstructed form ever a live pi lock (proper-lockfile's `mkdir` lock; `packages/nana-pack/lib/objective.ts`
`lockProblem`)? Does the narrowing drop a promise someone relies on? Does the cited T17 check pin
the narrowed clause? Break it and see.

## Item 2 — the MCP lane: attack these

1. **Carrier correctness.** `packages/nana-stage/lib/blocks.mjs` reads blocks at
   `structuredContent.structuredContent.blocks` and its patches never set `structuredContent`.
   Verify against pi's `convertMcpResult` and the runner's tool_result merge. Is the raw,
   unstamped carrier gone from EVERY path a consumer reads: the live `tool_execution_end`, the
   persisted session message (the desk's ledger and history read it back), and a resumed session?
   Can a server put a carrier where nana-stage does not look and still reach the stage?
2. **Precedence and confusion.** `details.blocks` is checked before the built-in carrier. Can an
   MCP tool or any other extension make one tool result carry blocks in both places, and what
   happens? Do codemode or nested calls (`parentToolCallId`) change anything? Codemode is off by
   `-t`, but say what holds if it were on.
3. **The desk change** (`apps/desk/apps.mjs` `isBuiltinExtensionRef`, `server.mjs` `spawnChild`).
   A `builtin:<name>` entry skips `existsSync` and the project-path refusal. Ask whether any client
   can now load something it could not before: the app manifest path, and the desk's general
   spawn picker (`POST /api/session` with `resources.extensions`). Is the regex tight? Do the new
   rows and tests pin both halves (accepted, and a near-miss rejected)?
4. **Trust posture unchanged?** The app session still runs `-na`. The edge server now comes from an
   app-owned extension (`.pi/extensions/edge-mcp.ts`) named in the operator's manifest, the same
   pattern as basketball. The user-scope `memory` server also connects but is excluded by `-t`.
   Is anything newly reachable by the model or by repo-supplied config?
5. **Retired and reworded rows.** R-263 and R-278 are retired; R-279 is reworded in place (ID kept).
   R-282 to R-284 are added, plus the desk rows. Check EARS form, one `shall`, and that each cited
   test pins its clause (the worker recorded mutations; re-run at least two). Is rewording R-279
   in place an ID reuse the standard forbids, or a legitimate carry-over?
6. **Retired e2e coverage.** The adapter's overflow child is gone and has no built-in equivalent.
   Does anything now bound a huge `structuredContent` before nana-stage validates it? Point to the
   validator caps that do it, or name the gap.
7. **Docs as contract.** nana-stage README, `apps/desk/README.md` (Contract notes and the corrected
   "pi has no MCP" sentence), the design doc. Do they now state the shipped behaviour, and nothing
   that is false?

## Known and declared — do not re-raise unless you disagree with the classification

- A narrowed interactive desk spawn (`--no-extensions`) loses built-in MCP since pi 1.0. Recorded
  as a residual and out of this lane.
- The worktree lacks the gitignored `apps/bench/.ext` and the root `node_modules`, so readme-check
  reports those two paths there. Main reads 0 problems.
- The live machine steps (new `~/.pi/agent/apps/edge.json`, removing the vendored adapter,
  respawning the edge app session) happen after landing.

## Output

Answer with the full review as your final message. Do not write it to a file. Give ranked
findings (MUST / SHOULD / NOTE), each with file:line, evidence (what you executed or read) and the
smallest fix. End with `VERDICT: LAND` or `VERDICT: BLOCK` and a score out of 10.
