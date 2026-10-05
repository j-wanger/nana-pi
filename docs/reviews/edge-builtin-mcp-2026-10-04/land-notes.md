# Land notes — edge desk on pi's built-in MCP, plus R-760 (seat, 2026-10-05)

Verdict: LANDED. astra r1 BLOCK 7 → r2 BLOCK 8 → r3 LAND 9 (`astra-r{1,2,3}.md`). r1's verdict was
voided by the ledger because the seat redirected the wrapper log into the reviewed tree; its findings
were addressed anyway, and r2 and r3 ran on clean trees.

## r3 residuals — both closed by the seat after the ruling

- R-856/R-857 cited phrase checks that stay green when the clause is removed. The marker now sits on
  the exact-text label check (`T2c ${label}: label is its own paragraph right before "governing:"`),
  whose expected text is built independently in the test. Seat mutations: dropping the
  held-unreadable "cannot confirm" sentence turns 6 cited checks red; writing "pi's own trust check
  fails" into the stale-unreadable remedy turns 2 red.
- Pack README: nana diagnoses a stale empty lock; it does not reclaim it.

## Pre-land gate

`npm test` in the worktree, with the gitignored `apps/bench/.ext` and root `node_modules` linked in
from main: 95 files, 95 PASS, 5,775 checks, 0 fail, exit 0.

## Live steps, as executed (quiesce-first order)

1. `launchctl bootout gui/$UID/com.nana.pi-desk`: exit 0; the desk pid was gone and 7317/7320/7321
   closed. It had no pi children. One unrelated process remained: an orphaned TEST desk from the
   EARS lane worktree (`~/nana-pi-wt/ears/apps/desk/server.mjs`, pid 4786, started 2026-10-04
   10:30, with a stub `pi --mode rpc` child). Left running; not the live desk.
2. Fast-forwarded `~/nana-pi` main to `e4846f5` and `~/edge-screener` `p87-setup` to `ecace8a`.
3. Backed up `~/.pi/agent/apps/edge.json` to `edge.json.bak-builtin-mcp-20261005`, then replaced it:
   `tools` and `mutating` prefixed `mcp__edge__`, and `extensions` = edge-mcp.ts, `builtin:mcp`,
   nana-stage.ts. All other keys unchanged.
4. `launchctl bootstrap …com.nana.pi-desk.plist` loaded the job but did NOT start it (`runs = 0`,
   despite `RunAtLoad`). `launchctl kickstart gui/$UID/com.nana.pi-desk` started it. **Runbook
   correction: bootstrap, then kickstart.**
5. `GET :7321/api/manifest` returned the six `mcp__edge__*` tools. Live smoke through the real desk
   with the page's own quick prompt "Show the screen detail for amihud_illiquidity":
   - session tools `ready`;
   - the model called `mcp__edge__screen_detail`;
   - two blocks (card, chart), each stamped by that tool and signed (64-char sig);
   - no `structuredContent` on the live `tool_execution_end`;
   - two block entries in the ledger.
6. Removed `~/.pi/agent/apps/vendor/` (94 MB). Nothing in the repos or in the agent-dir configs
   referenced it.

## Recorded residuals

- Aggregate block count and structured bytes are unbounded on the built-in path (astra r1: 200 valid
  cards → a 12 MB patch). Per-block caps hold. Stated in the nana-stage README.
- A narrowed interactive desk spawn (`--no-extensions`) loses pi's built-in MCP, and the user's MCP
  servers with it, since pi 1.0. The picker neither lists nor re-adds `builtin:mcp`. Stated in the
  desk README.
- The user-scope `memory` MCP server also connects inside the edge app session; `-t` keeps its
  tools away from the model.
- win32 behaviour of the unreadable-lock classification is read from code only.
