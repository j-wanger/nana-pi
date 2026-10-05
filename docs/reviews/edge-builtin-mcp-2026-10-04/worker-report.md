# Worker report — the edge desk moves to pi's built-in MCP

Worker: Opus 5.5 (fork of the brief's assigned worker role). Date 2026-10-04/05. pi on this
machine: 1.0.2. Brief: `docs/reviews/edge-builtin-mcp-2026-10-04/brief.md`.

Every claim below is marked **[V]** verified by execution in this session, **[S]** read in pi's
installed source/docs, or **[I]** inferred.

## Verdict

**DONE.** The probe passed once one documented flag (`-e builtin:mcp`) was added to the argv —
not a workaround, pi's own grammar for loading a built-in extension back under `--no-extensions`
(cli.md). Built with that one addition; the full chain is proven live, including the real e2e.

## Step 1 — probe, with evidence

Ran from `~/edge-screener-wt/builtin-mcp`, a throwaway `.pi/extensions/edge-mcp.ts` calling
`pi.registerMcpServer("edge", {command:"uv", args:["run","python","-m","edge_screener.desk.mcp_server"], cwd:REPO_ROOT, exposure:"direct"})`,
started as `pi --mode rpc -na -t mcp__edge__screen_panel,...,mcp__edge__explore_screen
--no-skills --no-extensions -e <ext> -e <nana-stage> --no-session`, `NANA_STAGE_KEY` and
`NANA_STAGE_EXPECT_TOOLS` set to the six `mcp__edge__*` names, driven over the real RPC protocol.

### a/b/c — literal brief argv (two `-e`, no `builtin:mcp`): **NO** — then **YES** with one added flag

**[V]** The literal argv (exactly as the brief Step 1 wrote it) produced, on stdout, immediately
after the extension loaded:

```
{"type":"extension_ui_request","method":"setStatus","statusKey":"nana-tools","statusText":"waiting"}
{"type":"extension_error","extensionPath":".../edge-mcp.ts","event":"register_mcp_server",
 "error":"MCP server \"edge\" is registered, but no loaded extension connects MCP servers;
 another extension may have replaced the built-in MCP support"}
```

nana-tools never left `"waiting"`. **[S]** This is pi's own documented behavior, not a bug:
`cli.md` — "`--no-extensions`, `-ne` … Disables discovered, configured, and built-in extensions.
Explicit `-e` paths still work, so `pi -ne -e builtin:mcp` keeps only the built-in MCP support."
`settings.md` — "`--no-extensions` disables them too, and `-e builtin:<name>` loads one
explicitly." `core/mcp-servers.d.ts` — "The core only validates and stores registrations. The MCP
extension (built in, or another extension that handles `mcp_servers_change`) connects them next
to the servers from `mcp.json`." The extension_error text above is `core/extensions/runner.js`
`reportUnhandledMcpServers()`, read in source and reproduced live. The brief's literal argv
therefore cannot work under pi 1.0.2 — `--no-extensions` strips `builtin:mcp` along with
everything else, and nothing else in that argv puts it back.

**[V]** Re-ran with one line added — `-e builtin:mcp` (same documented `-e builtin:<name>` form,
not a new mechanism) — same six tools, same nana-stage:

```
{"type":"extension_ui_request","method":"setStatus","statusKey":"nana-tools","statusText":"waiting"}
{"type":"extension_ui_request","method":"setStatus","statusKey":"nana-tools","statusText":"ready"}
```

No `extension_error`. A debug extension's `pi.getActiveTools()` / `pi.getAllTools()`, polled at
t+0.5/2/4/7s, showed **exactly** the six `mcp__edge__*` names, nothing else, from the first poll
on — confirming (b) the "edge" server connected and (c) its six tools are active under `-t` and
nana-stage's watcher correctly reports `ready`. This is the one design completion the probe
found: an app manifest whose own extension registers an MCP server must also name `builtin:mcp`
in `extensions`, or pi's `--no-extensions` silences it. Built this in (§ "Decided design, as
built" below) rather than stopping, because it is pi's own documented flag grammar, applied the
same way the manifest already applies `-e <path>` — not a different trust posture, not a desk
redesign.

### d — one real model turn calling `mcp__edge__screen_detail` for `amihud_illiquidity`

**[V]** A debug extension logged the RAW `tool_result` event (loaded *before* nana-stage, against
the **unmodified** nana-stage.ts, specifically to see what reaches it pre-fix):

```
toolName: "mcp__edge__screen_detail"
details:            {"server":"edge","tool":"screen_detail"}
structuredContent:   {"content":[{"type":"text","text":"2 block(s): amihud_illiquidity, ..."}],
                      "isError":false,
                      "structuredContent":{"blocks":[{"id":"blk_screen_amihud_illiquidity", ...}]}}
```

i.e. the blocks sit at `event.structuredContent.structuredContent.blocks` — one level inside the
event's own `structuredContent`, not under `details`. `details` for a built-in MCP tool carries
only `{server, tool, fullOutputPath?}` — no blocks carrier there at all. Matches `extensions/mcp/
tools.js` `convertMcpResult` read in source: `{content, details:{server,tool,...},
structuredContent: <CallToolResult minus _meta>, isError?}`.

**[V]** The same turn's `tool_execution_end` RPC record (unmodified nana-stage: nothing
intercepted it, so this is the raw wire shape) carried:

```json
{"type":"tool_execution_end","toolName":"mcp__edge__screen_detail",
 "result":{"content":[...],"details":{"server":"edge","tool":"screen_detail"},
           "structuredContent":{"content":[...],"isError":false,"structuredContent":{"blocks":[...]}}},
 "isError":false}
```

— i.e. without the fix, the raw unstamped carrier rides straight onto the live event, exactly
the leak R-283/R-284 and the decided design exist to close. After the fix (packages/nana-stage
built, below) the SAME field is provably absent — see the e2e result under "Tests run".

### e — the user-scope `memory` server

**[V]** `ps` taken mid-session showed a **new** `/Users/jwang/.claude/memory_server/.venv/bin/
python3 -m memory_server` process (pid distinct from every pre-existing one, started at the same
wall-clock second as the probe session) alongside the new `edge_screener.desk.mcp_server`
process — so `memory` **does connect**. `pi.getActiveTools()` and `pi.getAllTools()` at every
poll showed **zero** `mcp__memory__*` names — so it is **excluded by `-t`**, consistent with
`-t`'s documented scope ("Applies to built-in, extension, and custom tools" — `pi --help`). Both
halves of (e): yes/yes.

## Decided design, as built

Built exactly the seat's decided design (brief "Decided design" section), with the one addition
the probe found necessary (`builtin:mcp` in the manifest's `extensions`):

- **edge-screener** ships `.pi/extensions/edge-mcp.ts` — registers `"edge"` via
  `pi.registerMcpServer`, `exposure:"direct"`, `cwd` resolved from the extension file's own path
  (robust to a child spawned from another cwd, e.g. the e2e test's temp dir). Registers no tools.
  Deleted the adapter-format `.pi/mcp.json`. Fixed the `mcp_server.py` docstring (adapter →
  built-in MCP, and it is six tools, not five — the docstring undercounted even before this
  lane).
- **nana-stage** (`packages/nana-stage/lib/blocks.mjs`) replaces the adapter carrier with the
  built-in one: `extractBlocks(details, structuredContent)` checks `details.blocks`
  (pi-extension tools, unchanged) then `structuredContent.structuredContent.blocks`. The success
  AND rejection patches never set `structuredContent` — pi's own merge rule (`core/extensions/
  runner.js` `emitToolResult`, read in source, read again in `types.d.ts`: "replacing `content`
  without `structuredContent` drops it") then deletes whatever raw carrier the MCP call returned.
  Removed the adapter path (`details.mcpResult...`) and its `detailsMaxBytes` overflow branch —
  no consumer remains, and there is no built-in equivalent to port (next bullet).
  `extensions/nana-stage.ts` now passes `structuredContent: event.structuredContent` through.
- **Requirements**: R-263 and R-278 retired (reasons below); R-279 reworded in place (ID kept,
  clause's truth carried over); three new rows added (R-282/283/284).
- **Desk**: fixed the one stale panel string in `app.js` (`tabMcp`, was "Bridged by
  pi-mcp-adapter…"); it does **not** write adapter-only keys (`directTools`, `toolPrefix`,
  `lifecycle`, `settings.*`) into `mcp.json` — checked the whole function, it only ever
  constructs `{command,args}` / `{url}` entries (pi's own `mcpServers` shape) or round-trips
  whatever raw JSON the operator typed into the "advanced" textarea. Nothing to report there.
  **One thing beyond "fix the string":** `apps.mjs` `normalizeManifest` and `server.mjs`
  `spawnChild` both validated every `extensions` entry with `fs.existsSync` (and, in
  `spawnChild`, `refuseProject`) — which a `builtin:<name>` literal is never going to pass,
  since it is not a path. Without this fix the manifest below is simply rejected at load time
  ("extensions: no such file builtin:mcp") and the whole design is inert on the desk, even though
  the probe shows it works at the pi level. Added `isBuiltinExtensionRef` (exported from
  `apps.mjs`, imported into `server.mjs`) — a syntax check only (`/^builtin:[A-Za-z0-9_.-]+$/`),
  pi refuses an unknown name itself at spawn time. This is a small, necessary completion of the
  decided design, not a redesign: same validation point, one more literal form recognized,
  matching pi's own `-e` grammar exactly.
- Block action prompts in `edge_screener/desk/blocks.py` ("Run explore_screen for …") were left
  unprefixed, per the brief — confirmed live: the model reads "Run explore_screen for …" and
  correctly calls `mcp__edge__explore_screen` without needing the prefix spelled out.

## Tests run

- **Unit** — `packages/nana-stage/tests/blocks.test.mjs`: **116/116 pass**, `node
  packages/nana-stage/tests/blocks.test.mjs`, exit 0. New/changed checks: built-in carrier found
  and extracted; malformed built-in-carrier rejection; no-carrier untouched (built-in shape);
  patch carries no `structuredContent` on both success and rejection; `details.blocks` path
  (pi-extension tools, e.g. basketball) proven unchanged by the pre-existing checks in the same
  run (byte-identical — same assertions, same outcomes, as the unmodified rows).
- **E2E, the real chain** — `apps/desk/test/stage-chain-edge.e2e.mjs`, ported to the built-in
  carrier, run alone (`EDGE_REPO=~/edge-screener-wt/builtin-mcp DESK_TEST_PORT=4421 node
  apps/desk/test/stage-chain-edge.e2e.mjs`), never alongside another desk suite, never on
  7317/7320/7321 (used 4421/4422): **18/18 pass**, exit 0, run twice. Proves live, over the real
  RPC wire, through the real desk server: the manifest with `builtin:mcp` spawns and reaches
  `tools:"ready"`; `mcp__edge__screen_detail` returns two stamped, **signed** blocks in
  `result.details.blocks`; **`result` on the live `tool_execution_end` record carries only
  `content` and `details` — no `structuredContent` key at all** (the R-283 proof, live); the
  model-facing text is byte-exact canonical rendering; the ledger replays the same two blocks;
  the mutating `mcp__edge__explore_screen` call wrote exactly one new file under
  `reports/explore/` with the "NOT A VERDICT" note; a partial screen name refused with
  suggestions and minted nothing; the ledger holds exactly the three real blocks at the end.
  Removed the adapter's `outputGuard.detailsMaxBytes` overflow child (APP2/`tinyCwd`) — no
  built-in equivalent exists to port (see R-278 below); said so in the file's own header comment.
  Needed a worktree-only environment fix unrelated to the code: the worktree's `data/cache/` is
  gitignored (market-data cache, never committed) and was empty, so `screen_detail`/
  `explore_screen` (which read committed `reports/*.md`) worked immediately but `/api/data/tape`
  and `explore_screen`'s live-vintage read did not until I **copied** (never moved, never wrote
  to) `~/edge-screener/data/cache/` into the worktree — read-only copy from the live checkout,
  which the hard rule forbids writing to, not reading from.
- **nana-pi full suite** — `npm test` (clean single run, real exit code checked — not piped
  through head/tail before this decision): **95 files: 93 PASS, 1 FAIL, 1 SKIP, 0 WARN · checks:
  5526 pass, 2 fail, 6 skip · 297.5s**. The one failing file is `packages/nana-pack/tests/
  readme-check.test.mjs` — **0 introduced failures**, see "Pre-existing, not mine" below. (Two
  earlier attempts raced on a shared output file across two backgrounded invocations and produced
  garbled, untrustworthy text; both are discarded in favor of this clean rerun, whose only FAIL
  line matches every other check of the same claim in this report.)
- **`npm run map:check`**: 0 problems (172 modules; map regenerated and committed).
- **`npm run readme:check`** (standalone, `node scripts/readme-check.mjs --check`): 549 claims,
  **5 problems — all 5 pre-existing**, confirmed by `git status` showing the three affected
  READMEs (`README.md`, `apps/bench/README.md`, `packages/nana-knowledge/README.md`) untouched by
  me and `apps/bench/.ext` genuinely absent from disk; these are about `apps/bench/.ext/
  pi-web-access` and `nana-knowledge`'s `node_modules` claim, unrelated to nana-stage/desk/edge.
- **`node scripts/requirements-trace.mjs`**: `requirements: 791 total (504 implemented · 1
  planned · 2 retired · 277 untested · 7 violated); 504 traced by tests` / `ears: 0 rows off form
  (allowance 0)`, exit 0.
- **edge-screener** — `uv run ruff check src/edge_screener/desk/mcp_server.py`: clean. `uv run
  mypy src/edge_screener/desk/mcp_server.py`: clean. `uv run pytest -q` (whole suite): **691
  passed**, coverage 92.93% (gate 85%). `uv run pre-commit run --files
  src/edge_screener/desk/mcp_server.py .pi/extensions/edge-mcp.ts`: secret scan passed, ruff +
  ruff-format passed; `mypy` (repo-wide, `pass_filenames: false`) reports its documented
  pre-existing 81 errors in `tests/firm/` — matches the design doc's own close-of-slice-2 note
  ("mypy has 81 pre-existing errors in `tests/firm/`, untouched") exactly; not touched by this
  lane.

### Pre-existing, not mine [V]

Five readme-check problems and the `packages/nana-pack/tests/readme-check.test.mjs` failure
predate this lane: `git status --short README.md apps/bench/README.md
packages/nana-knowledge/README.md` on the base commit shows all three **unmodified**, and
`apps/bench/.ext` does not exist on disk. I did not touch any of the three files and did not fix
this — out of this lane's remit (surgical change discipline), flagged here for the seat.

## Rows retired / reworded / added

| ID | Change | Clause the cited test(s) pin |
|---|---|---|
| R-263 | **retired** — pi-mcp-adapter removed; superseded by R-282 | n/a |
| R-278 | **retired** — no built-in equivalent: pi's built-in MCP never truncates/omits `structuredContent` (docs/mcp.md: only the model-facing text is cut, at 20 KB); the adapter's `outputGuard.detailsMaxBytes` cap this row named does not exist on that path | n/a |
| R-279 | **reworded** (ID kept) — "the MCP adapter" → "pi's built-in MCP carrier"; the clause's truth (no-blocks result left untouched) carries over unchanged | `blocks.test.mjs::non-block built-in MCP result (no blocks key) is untouched (null)` pins: a `structuredContent` with no `.structuredContent.blocks` key makes `processToolResult` return `null` — proved red by the R-279 mutation (next section) |
| R-282 | **added** — built-in carrier extraction + stamping | `blocks.test.mjs::built-in MCP carrier found` pins `extractBlocks` reading `structuredContent.structuredContent.blocks`; `::built-in path: blocks extracted, stamped, carrier moved to details.blocks` and `::built-in path: produced_by.tool is the mcp__ tool name` pin that a built-in MCP event's blocks get the same stamp (`produced_by.tool` = the real `mcp__edge__*` name) and land in `details.blocks` same as the extension path |
| R-283 | **added** — carrier dropped from the patch on success | `blocks.test.mjs::valid: patch carries no structuredContent (pi drops the raw carrier)` and `::built-in path: patch carries no structuredContent (raw carrier dropped)` pin that a successful patch never sets the `structuredContent` key; also proved live by the e2e's `raw MCP carrier dropped from the live event` check (not a formal rail citation — `.e2e.mjs` is outside `TEST_EXTENSIONS`) |
| R-284 | **added** — carrier dropped on rejection | `blocks.test.mjs::malformed: patch carries no structuredContent either (rejection drops the raw carrier too)` and `::built-in path, malformed: isError, no entries, no structuredContent in the patch` pin the same omission on the `fail()` path |

## Mutation proofs (red output recorded)

Each mutation applied to `packages/nana-stage/lib/blocks.mjs`, run, red output captured, then
reverted; `diff` against a pre-mutation saved copy confirmed byte-identical after every revert.

**R-282** — changed `extractBlocks`'s built-in-carrier read from `structuredContent.structuredContent` to
`structuredContent.content` (wrong key):
```
FAIL built-in MCP carrier found
TypeError: Cannot read properties of null (reading 'entries')
    at .../blocks.test.mjs:244:90   (mcpOk.entries.length — processToolResult returned null)
```
exit 1.

**R-283** — made the success patch re-attach `structuredContent: event.structuredContent`:
```
FAIL valid: patch carries no structuredContent (pi drops the raw carrier)
FAIL built-in path: patch carries no structuredContent (raw carrier dropped)
```
exit 1.

**R-284** — made `fail()` re-attach `structuredContent: event.structuredContent`:
```
FAIL malformed: patch carries no structuredContent either (rejection drops the raw carrier too)
FAIL built-in path, malformed: isError, no entries, no structuredContent in the patch
```
exit 1.

**R-279** — replaced the `blocks === null` early-return guard with `if (false) return null;`:
```
FAIL non-block tool result is untouched (null)
FAIL non-block built-in MCP result (no blocks key) is untouched (null)
```
exit 1 (suite kept running past these two — later checks build their own `blocks` arrays
directly and were unaffected).

After each: reverted, `node packages/nana-stage/tests/blocks.test.mjs` → 116/116 pass, exit 0;
`diff` against the pre-mutation saved copy → identical.

## Proposed new `~/.pi/agent/apps/edge.json` (not applied — report only, per the brief)

```json
{
  "port": 7321,
  "title": "edge desk",
  "cwd": "/Users/jwang/edge-screener",
  "tools": [
    "mcp__edge__screen_panel",
    "mcp__edge__screen_detail",
    "mcp__edge__construction_table",
    "mcp__edge__stop_table",
    "mcp__edge__direction_board",
    "mcp__edge__explore_screen"
  ],
  "extensions": [
    "/Users/jwang/edge-screener/.pi/extensions/edge-mcp.ts",
    "builtin:mcp",
    "/Users/jwang/nana-pi/packages/nana-stage/extensions/nana-stage.ts"
  ],
  "skills": [],
  "mutating": [
    "mcp__edge__explore_screen"
  ],
  "trust": "no-approve",
  "page": "/Users/jwang/edge-screener/desk",
  "data": {
    "tape": ["uv", "run", "python", "-m", "edge_screener.desk.data", "tape"],
    "shelf": ["uv", "run", "python", "-m", "edge_screener.desk.data", "shelf"],
    "roster": ["uv", "run", "python", "-m", "edge_screener.desk.data", "roster"]
  },
  "quick": [
    ["screen panel", "Show the screen panel"],
    ["amihud detail", "Show the screen detail for amihud_illiquidity"],
    ["direction board", "Show the direction board"]
  ],
  "session": null
}
```

Only `tools` and `extensions` changed from the live file (adds `builtin:mcp`, drops the vendored
adapter path, prefixes the six tool names) and `mutating` (prefixed). `port`, `title`, `cwd`,
`skills`, `trust`, `page`, `data`, `quick`, `session` are untouched.

## Machine steps the seat must do after landing

1. Merge `feat/edge-builtin-mcp` into nana-pi `main`, and `feat/builtin-mcp` into edge-screener's
   `p87-setup` (not `main` — the edge desk code lives on `p87-setup`).
2. Update the live `~/edge-screener` checkout to that merged `p87-setup` state (pulls in
   `.pi/extensions/edge-mcp.ts`, the deleted `.pi/mcp.json`, the `mcp_server.py` docstring fix).
3. Replace `~/.pi/agent/apps/edge.json` with the JSON above.
4. Remove `~/.pi/agent/apps/vendor/` (the pi-mcp-adapter vendor tree) — nothing reads it any
   more; I found no other reference to it anywhere in nana-pi's live code or docs (the only other
   hit, `apps/bench/studies/tool-profiles-2026-09-08/fixture/...`, is a frozen benchmark artifact,
   left untouched).
5. Stop and respawn the edge app's **own** child session (not the desk server on 7317/7320/7321
   itself) so it picks up the new manifest — e.g. `DELETE` then `POST /api/session` on the edge
   app's listener (port 7321), or the desk UI's own session controls. I did not do this myself:
   the hard rule names 7321 among the ports I may never stop or restart, and this step only makes
   sense against the real `~/edge-screener` + the real `~/.pi/agent/apps/edge.json`, neither of
   which I touched.
6. After that restart, a quick live smoke check (same shape as probe (d) above, or just a real
   prompt through the desk UI) is worth doing once, since the live machine's `uv`/python env at
   `~/edge-screener` could in principle differ from the worktree's (it didn't, here, but I ran
   everything against the worktree, never the live checkout, by the hard rule).

## Residuals

- `apps/desk/README.md` line ~142 ("pi has no MCP — extensions are the pluggable surface") is now
  a false claim about the desk's **general** interactive-session spawn picker (pi 1.0.2 has
  built-in MCP) — but it is about that general picker's MCP-toggle gap, not the edge app-session
  contract this lane owns, so left as found; flagging for the seat rather than touching it.
- The over-cap/overflow scenario the old e2e tested (adapter `outputGuard.detailsMaxBytes`) has
  no built-in-MCP equivalent and was retired, not replaced; the rejection mechanics it exercised
  stay pinned at the unit level only (R-255, pre-existing).
- `edge_screener/desk/mcp_server.py`'s docstring said "Five tools"; it is six — fixed in passing
  while rewriting the docstring for the carrier change (not a separate finding worth its own
  line, noted here only for completeness).

## Uncertain / most likely to be wrong

I initially flagged `extensions` order (`builtin:mcp` before vs. after the app's own
MCP-registering extension) as untested. **[V] Checked it before sending:** re-ran the probe with
`[builtin:mcp, edge-mcp.ts, nana-stage.ts]` (swapped from the shipped
`[edge-mcp.ts, builtin:mcp, nana-stage.ts]`) — same result, `nana-tools` reaches `"ready"`, no
`extension_error`. Order-independent, confirmed, matching pi's own doc text ("servers registered
later right away"). No open claim here now.

The claim I'd still flag as least-verified: the live machine's `uv run python -m
edge_screener.desk.mcp_server` under the real `~/edge-screener` checkout and the real `~/.pi/
agent` behaves identically to the worktree's. I never ran anything against either (hard rule), so
this is **[I]** inferred from the worktree being a plain git worktree of the same repo, branched
from `p87-setup` at `085a3a5f` (the brief's own starting point) — not a different environment in
any way I can see, but genuinely untested on the real paths. Machine step 6 above covers it.

