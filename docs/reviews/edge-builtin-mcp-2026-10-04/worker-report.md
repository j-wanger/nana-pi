# Worker report — the edge desk moves to pi's built-in MCP

Worker: Claude Sonnet 5 (claude-sonnet-5) — the brief names the worker role as "Opus 5.5", but
that is not the model actually running this lane; corrected here per the seat's follow-up
2026-10-05. Date 2026-10-04/05. pi on this machine: 1.0.2. Brief:
`docs/reviews/edge-builtin-mcp-2026-10-04/brief.md`.

Every claim below is marked **[V]** verified by execution in this session, **[S]** read in pi's
installed source/docs, or **[I]** inferred.

## Verdict

**DONE.** The probe passed once one documented flag (`-e builtin:mcp`) was added to the argv —
not a workaround, pi's own grammar for loading a built-in extension back under `--no-extensions`
(cli.md). Built with that one addition; the full chain is proven live, including the real e2e.

**astra r1 (BLOCK, 7/10) — all four findings addressed, 2026-10-05.** Read in full at
`docs/reviews/edge-builtin-mcp-2026-10-04/astra-r1.md` (left untracked, with `astra-r1.log` — the
seat commits those). One line each:
1. MUST, R-760: a genuinely held, empty-but-unreadable proper-lockfile lock (astra's own probe,
   mode 333 under a restrictive umask) was classified "lock path obstructed" / move it aside;
   `lockProblem()` now checks staleness before the readdir verdict, so a fresh/future-dated
   unreadable folder reads "store locked" like a readable one, and a stale unreadable folder
   still reads obstructed. New T17 cases (two held, one stale-obstructed, one reproducing
   astra's exact acquired-lock probe with pi's own `proper-lockfile`) and a mutation restoring
   the old classification turns 18 checks red.
2. SHOULD: the shared `spawnChild` is also the general `POST /api/spawn`, where
   `approve:false` makes the project-path refusal live (an app manifest never does); added that
   case to `apps/desk/test/spawn-and-persist.test.mjs` (R-944, widened from "an app session's"
   to "a session's"), reproduced astra's mutation staying green on the old 75 app-listener tests
   and confirmed it turns the new general-spawn test red.
3. SHOULD: "no residual" was wrong — block count and aggregate structured bytes are unbounded
   (astra's probe: 200 valid cards, 12 MB patch, no error); replaced the claim in
   `packages/nana-stage/README.md`, the design doc and the `blocks.mjs` comment with the true
   limitation. No cap added, as instructed.
4. MUST: corrected the "Machine steps" section below — the running desk loads every manifest
   once and keeps the old `spawnChild` code; only an explicit desk-server restart after both the
   merge and the manifest replacement picks up either, and the vendor directory comes out last,
   after a live verification, not before.

**astra r2 (BLOCK, 8/10) — every r1 item closed; two new findings and one doc alignment,
2026-10-05.** Read in full at the scratchpad path the seat gave (left out of the tree — the seat
commits it). Round 3 is the last review round for this item, so this pass is meant to be
complete. One line each:
1. MUST: unreadable-lock remedies overstated what inspection established — the held-unreadable
   remedy ended with the `/trust` steps regardless (a fixed next step on an unconfirmed
   diagnosis), and the stale-unreadable remedy flatly claimed "pi's own trust check and /trust
   both fail," which astra's own lookup disproved for a genuinely empty stale folder (pi
   reclaims it and reads the record straight through). Classification is UNCHANGED; a new
   `unreadable: true` flag (no new `TrustStoreProblem`) carries the uncertainty from
   `lockProblem()` into two new `trustRemedy()` branches that admit what the check cannot see.
   New R-856/R-857, four new T17 fixtures asserting the remedy TEXT (fresh unreadable non-empty,
   stale unreadable empty with an affirmative record pi actually reclaims, stale unreadable
   non-empty where pi's own rmdir agrees it's obstructed, plus the existing held cases and the
   astra r1 regression updated to the new text), two mutations each turning the right rows red.
2. SHOULD: `packages/nana-pack/README.md` wrongly implied a stale unreadable folder could count
   as usable with an exception — the implementation classifies every stale unreadable folder as
   obstructed; it cannot determine the exception. Rewrote the paragraph to separate nana's
   conservative classification from pi's own possible (but unconfirmed) reclamation. Checked
   `CLAUDE.md`'s T2c paragraph: the named clause ("a fresh or future-dated empty folder means
   pi's own lookup throws") is still true — fresh/future-dated still always throws for pi
   regardless of readability — so left unchanged.
3. MUST: replaced the "Machine steps" runbook with astra's quiesce-first order — stop the desk
   before either checkout changes (not merely before the manifest edit), update both checkouts,
   replace the manifest, start the desk, verify live, remove the vendor tree last. One line per
   step says why.

**Commits:**
- nana-pi `feat/edge-builtin-mcp`: `1ed473411338494e4062f29e724d24ccc299879c`,
  `ec080dc` (report hashes), `4737027bca66633444e6618f7173e8574335d18a` (seat follow-up:
  R-943/R-944 + tests, README fix, corrected readme-check/model claims),
  `615ca872de96747af0e7b1edeee22d66792d5f4b` (astra r1 BLOCK fixes: R-760, shared spawn path,
  aggregate-bound residual, machine-steps order)
- edge-screener `feat/builtin-mcp`: `ecace8a6b536fbbd5535e4364d9e71aadd2e3eba`

Neither pushed, neither merged, per the brief.

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
  clause's truth carried over); three new rows added (R-282/283/284). **Seat follow-up (2026-10-05):**
  the desk's `builtin:<name>` acceptance had shipped with no row and no test — added R-943/R-944
  and the tests/mutations for them (below); this was a real gap in the original pass, not a
  disagreement with the seat.
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

**Seat follow-up 4 — the five named checks, real exit codes, `apps/bench/.ext` symlinked in from
`~/nana-pi/apps/bench/.ext` for this re-run only, then removed (tree left clean, `git status`
confirmed empty before and after):**

| Check | Exit | Result |
|---|---|---|
| `node packages/nana-stage/tests/blocks.test.mjs` | 0 | 116 pass, 0 fail |
| `node apps/desk/test/app-listener.test.mjs` | 0 | 75 pass, 0 fail |
| `node scripts/requirements-trace.mjs` | 0 | `requirements: 793 total (506 implemented · 1 planned · 2 retired · 277 untested · 7 violated); 506 traced by tests` / `ears: 0 rows off form (allowance 0)` |
| `npm run map:check` | 0 | 172 modules, 0 problems |
| `node scripts/readme-check.mjs --check` | 1 | 549 claims, 1 problem (`node_modules` only — environmental, see below) |

**astra r1 follow-up — same five, plus the spawn test file touched for fix 2, `apps/bench/.ext`
symlinked in again for this one re-run, then removed (tree clean before and after apart from the
two untracked astra-r1 files):**

| Check | Exit | Result |
|---|---|---|
| `node --experimental-strip-types packages/nana-pack/tests/objective-golden.test.mjs` | 0 | 1,157 pass, 0 fail |
| `node packages/nana-stage/tests/blocks.test.mjs` | 0 | 116 pass, 0 fail |
| `node apps/desk/test/app-listener.test.mjs` | 0 | 75 pass, 0 fail |
| `node --experimental-strip-types apps/desk/test/spawn-and-persist.test.mjs` | 0 | 120 pass, 0 fail |
| `node scripts/requirements-trace.mjs` | 0 | `requirements: 793 total (506 implemented · 1 planned · 2 retired · 277 untested · 7 violated); 506 traced by tests` / `ears: 0 rows off form (allowance 0)` |
| `npm run map:check` | 0 | 172 modules, 0 problems |
| `node scripts/readme-check.mjs --check` (`.ext` symlinked) | 1 | 550 claims, 1 problem (`node_modules` only) |
| `node scripts/readme-check.mjs --check` (baseline, no symlink) | 1 | 550 claims, 5 problems — the same 5 as every prior run, unchanged by this round |

Did not rerun the full `npm test` or the e2e suite in this round either, per the seat's
instruction (the seat runs the full suite after merge).

**astra r2 follow-up — real exit codes, `apps/bench/.ext` symlinked in again for the one
readme-check re-run, then removed (tree clean before and after apart from the untracked
astra-r2 scratchpad file the seat holds, outside this tree entirely):**

| Check | Exit | Result |
|---|---|---|
| `node --experimental-strip-types packages/nana-pack/tests/objective-golden.test.mjs` | 0 | 1,214 pass, 0 fail (run 3× — stable) |
| `node scripts/requirements-trace.mjs` | 0 | `requirements: 795 total (508 implemented · 1 planned · 2 retired · 277 untested · 7 violated); 508 traced by tests` / `ears: 0 rows off form (allowance 0)` |
| `npm run map:check` | 0 | 172 modules, 0 problems |
| `node scripts/readme-check.mjs --check` (`.ext` symlinked) | 1 | 550 claims, 1 problem (`node_modules` only) |
| `node scripts/readme-check.mjs --check` (baseline, no symlink) | 1 | 550 claims, 5 problems — the same 5 as every prior run |

**nana-setup tests: not rerun, with evidence.** The coordinator asked to grep first for whether
`doctor` reads these problems. `grep -rln "lock path obstructed\|store locked\|TrustStoreProblem\|
lockProblem\|trustRemedy\|unreadable" packages/nana-setup/` hits `doctor.mjs`, but only for the
unrelated English word "unreadable" in symlink/parse-error messages, and one comment restating
`objective.ts`'s `isBareFileName` rule — no import of, or reference to, `TrustStoreProblem`,
`lockProblem`, `trustRemedy`, or the new `unreadable` flag anywhere in `packages/nana-setup/`.
doctor does not read these problems; nana-setup's suite was not rerun this round.

Did not rerun the full `npm test` or the e2e suite, per the seat's instruction (the seat runs the
full suite after merge).

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
  readme-check.test.mjs` — **0 introduced failures**, environmental to the worktree, not
  pre-existing on main — see below. (Two
  earlier attempts raced on a shared output file across two backgrounded invocations and produced
  garbled, untrustworthy text; both are discarded in favor of this clean rerun, whose only FAIL
  line matches every other check of the same claim in this report.)
- **`npm run map:check`**: 0 problems (172 modules; map regenerated and committed).
- **`npm run readme:check`** — **corrected** (my first pass called this "pre-existing"; it is
  not). **[V]** On `main` (`~/nana-pi`, read-only check): `544 claims checked; 0 problem(s)`. In
  this worktree, before any fix: `549 claims checked; 5 problem(s)` — all 5 are the worktree
  missing two **gitignored** paths main's checkout happens to have: `apps/bench/.ext/
  pi-web-access` (an npm-installed package, never vendored) and the repo-root `node_modules`
  (manually symlinked `playwright`/`playwright-core`). Symlinked `apps/bench/.ext` in from
  `~/nana-pi/apps/bench/.ext` (read, not write, against the live checkout) for the seat's
  follow-up re-run: **549 claims, 1 problem** (`node_modules` only) — removed the symlink
  afterward, tree clean. **This branch introduces zero README problems.**
- **`node scripts/requirements-trace.mjs`**: exit 0 — see the seat follow-up table above for the
  current (post-R-943/944) count; this bullet originally reported the pre-follow-up number (791
  total), now superseded.
- **edge-screener** — `uv run ruff check src/edge_screener/desk/mcp_server.py`: clean. `uv run
  mypy src/edge_screener/desk/mcp_server.py`: clean. `uv run pytest -q` (whole suite): **691
  passed**, coverage 92.93% (gate 85%). `uv run pre-commit run --files
  src/edge_screener/desk/mcp_server.py .pi/extensions/edge-mcp.ts`: secret scan passed, ruff +
  ruff-format passed; `mypy` (repo-wide, `pass_filenames: false`) reports its documented
  pre-existing 81 errors in `tests/firm/` — matches the design doc's own close-of-slice-2 note
  ("mypy has 81 pre-existing errors in `tests/firm/`, untouched") exactly; not touched by this
  lane.

### Environmental to the worktree, not pre-existing on main [V] — corrected 2026-10-05

My first pass called the readme-check / `readme-check.test.mjs` red **"pre-existing"**. Wrong,
per the seat's follow-up: `git status --short` showing the affected READMEs unmodified by me only
proves I didn't edit their *text*; it says nothing about whether the *paths they claim* exist,
and those paths are gitignored, so a fresh worktree starts without them while `main`'s own
checkout (`~/nana-pi`) already has them from normal use. **[V]** `main` reads 0 problems (above).
The `readme-check.test.mjs` failure in my `npm test` run is the same gap, not a second bug — that
test shells out to the same checker. This branch changes no README claim and breaks nothing;
the corrected "Tests run" bullet above is the accurate record.

## Rows retired / reworded / added

| ID | Change | Clause the cited test(s) pin |
|---|---|---|
| R-263 | **retired** — pi-mcp-adapter removed; superseded by R-282 | n/a |
| R-278 | **retired** — no built-in equivalent: pi's built-in MCP never truncates/omits `structuredContent` (docs/mcp.md: only the model-facing text is cut, at 20 KB); the adapter's `outputGuard.detailsMaxBytes` cap this row named does not exist on that path | n/a |
| R-279 | **reworded** (ID kept) — "the MCP adapter" → "pi's built-in MCP carrier"; the clause's truth (no-blocks result left untouched) carries over unchanged | `blocks.test.mjs::non-block built-in MCP result (no blocks key) is untouched (null)` pins: a `structuredContent` with no `.structuredContent.blocks` key makes `processToolResult` return `null` — proved red by the R-279 mutation (next section) |
| R-282 | **added** — built-in carrier extraction + stamping | `blocks.test.mjs::built-in MCP carrier found` pins `extractBlocks` reading `structuredContent.structuredContent.blocks`; `::built-in path: blocks extracted, stamped, carrier moved to details.blocks` and `::built-in path: produced_by.tool is the mcp__ tool name` pin that a built-in MCP event's blocks get the same stamp (`produced_by.tool` = the real `mcp__edge__*` name) and land in `details.blocks` same as the extension path |
| R-283 | **added** — carrier dropped from the patch on success | `blocks.test.mjs::valid: patch carries no structuredContent (pi drops the raw carrier)` and `::built-in path: patch carries no structuredContent (raw carrier dropped)` pin that a successful patch never sets the `structuredContent` key; also proved live by the e2e's `raw MCP carrier dropped from the live event` check (not a formal rail citation — `.e2e.mjs` is outside `TEST_EXTENSIONS`) |
| R-284 | **added** — carrier dropped on rejection | `blocks.test.mjs::malformed: patch carries no structuredContent either (rejection drops the raw carrier too)` and `::built-in path, malformed: isError, no entries, no structuredContent in the patch` pin the same omission on the `fail()` path |
| R-943 | **added** 2026-10-05, seat follow-up 1 — a `builtin:<name>` manifest extension is accepted with no filesystem check; a near-miss is not | `app-listener.test.mjs::zeta (a builtin: entry mixed with real file extensions) loads and has a listener` pins acceptance; `::near-miss "builtin:" (empty name) rejected at load, same as a missing file` and `::near-miss "builtin:../x" rejected at load, same as a missing file` pin that only an exact `builtin:<name>` match is exempt |
| R-944 | **added** 2026-10-05, seat follow-up 1 — spawnChild passes a `builtin:<name>` entry through as `-e builtin:<name>`, in manifest order, skipping the project-path refusal | `app-listener.test.mjs::argv: a builtin:<name> extensions entry rides through as literal -e builtin:mcp, in manifest order` |
| R-856 | **added** 2026-10-05, astra r2 MUST — an unreadable lock folder's remedy must say this check could not confirm whether it is empty (both the held and the stale-obstructed case) | `objective-golden.test.mjs::T17 ${k}: held-unreadable remedy — no move/delete advice, no /trust steps`, `::T17 astra r1 regression: held-unreadable remedy — no move/delete advice, no /trust steps`, `::T17 stale unreadable EMPTY lock folder: remedy says pi reclaims it ONLY IF it is empty, and names the check first`, `::T17 stale unreadable NON-empty lock folder: remedy says to move it aside IF it holds anything` |
| R-857 | **added** 2026-10-05, astra r2 MUST — a stale unreadable lock folder's remedy must never claim pi's own trust check fails (only pi's own `rmdir` outcome, which this check cannot see, decides that) | `objective-golden.test.mjs::T17 stale unreadable EMPTY lock folder: remedy never claims pi's own trust check and /trust both fail`, `::T17 stale unreadable NON-empty lock folder: remedy never claims pi's own trust check and /trust both fail` |

R-760 is unchanged (text and classification both), per the seat's instruction; its evidence cell
was updated only to drop a citation that moved to R-856 under its own, stronger marker.

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

**Seat follow-up 1 — two more mutations, same discipline, applied to `apps/desk/apps.mjs` and
`apps/desk/server.mjs`, reverted and `diff`-verified identical after each:**

**R-943** — dropped the `isBuiltinExtensionRef` short-circuit in `normalizeManifest` (so every
`extensions` entry, including `builtin:mcp`, goes straight to `fs.existsSync`):
```
(uncaught) Error: app listeners never came up: … apps: zeta.json: extensions: no such file builtin:mcp …
```
`zeta.json` is rejected at load exactly like a missing file would be, so the zeta listener never
binds and the test's own startup wait times out — exit 1. (A harness-level throw, not a `FAIL`
line, because the fixture this row depends on no longer exists at all under the mutation; still
unambiguous red, directly naming the mutated line's effect.)

**R-944** — in `spawnChild`, changed `if (isBuiltinExtensionRef(p)) { args.push("-e", p);
continue; }` to `if (isBuiltinExtensionRef(p)) { continue; }` (silently drop instead of pass
through):
```
FAIL argv: a builtin:<name> extensions entry rides through as literal -e builtin:mcp, in manifest order
```
exit 1.

After each: reverted, `node apps/desk/test/app-listener.test.mjs` → 75/75 pass, exit 0; `diff`
against the pre-mutation saved copy → identical.

**astra r2 — two more mutations in `trustRemedy()` (`packages/nana-pack/lib/objective.ts`),
each disabling one new `if (t.unreadable) return …` branch so it falls through to the old,
non-admitting text; reverted and `diff`-verified identical after each:**

**R-856** — disabled the "store locked" + unreadable branch:
```
FAIL T17 fresh unreadable EMPTY lock folder: held-unreadable remedy — no move/delete advice, no /trust steps
FAIL T17 future-dated unreadable EMPTY lock folder: held-unreadable remedy — no move/delete advice, no /trust steps
FAIL T17 fresh unreadable NON-empty lock folder: held-unreadable remedy — no move/delete advice, no /trust steps
FAIL T17 astra r1 regression: held-unreadable remedy — no move/delete advice, no /trust steps
```
(19 lines red in total, including the T2c exact-text oracle checks the same production branch
feeds); exit 19.

**R-856/R-857** — disabled the "lock path obstructed" + unreadable branch:
```
FAIL T17 stale unreadable EMPTY lock folder: remedy never claims pi's own trust check and /trust both fail
FAIL T17 stale unreadable EMPTY lock folder: remedy says pi reclaims it ONLY IF it is empty, and names the check first
FAIL T17 stale unreadable NON-empty lock folder: remedy never claims pi's own trust check and /trust both fail
FAIL T17 stale unreadable NON-empty lock folder: remedy says to move it aside IF it holds anything
```
(8 lines red in total); exit 8.

After each: reverted, `node --experimental-strip-types packages/nana-pack/tests/
objective-golden.test.mjs` → 1,214/1,214 pass, exit 0 (run 3× to rule out a timing flake in the
stale-mtime fixtures — stable every time); `diff` against the pre-mutation saved copy →
identical.

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

**Corrected again (astra r2 MUST, 2026-10-05).** My r1 fix only forbade spawning a session
**between the manifest replacement and the restart**. astra showed the unsafe window actually
begins at the FIRST merge: the running desk loads every manifest once at startup and keeps that
parsed object (and the pre-lane `spawnChild()` code) live regardless of when the checkouts
change, so a child spawned any time after nana-pi updates but before a restart can combine the
retained OLD manifest, the OLD `spawnChild()`, and the freshly-updated nana-stage — which astra
confirmed no longer recognizes an adapter-shaped result at all (it passes through as `null`,
unprocessed, where the pre-lane processor made one entry). astra also found an
outstanding-writeback window a bare "spawn nothing in between" cannot drain: a spawn begun
before the restart can still finish its awaited `get_state` (and write a stale manifest back)
afterward. The fix is to QUIESCE the desk — stop it, not merely avoid spawning into it — before
either checkout changes at all. These are machine steps for the seat; I did not perform any of
them (the hard rule forbids touching `~/edge-screener`, `~/.pi/agent/apps/edge.json`,
`~/.pi/agent/apps/vendor/`, and the running desk on 7317/7320/7321, including stopping and
starting it, which are now themselves two of these steps).

1. **Stop the desk**: `launchctl bootout gui/$(id -u)/com.nana.pi-desk`, then confirm no desk pi
   children remain (e.g. no `pi --mode rpc` process whose parent is the desk server). *Why
   first:* this is the only way to actually close the unsafe window astra found — it begins at
   the first merge, not at the manifest edit, and "spawn nothing in between" cannot drain a
   writeback already in flight from a session spawned before the stop.
2. **Merge both branches and update both live checkouts**: `feat/edge-builtin-mcp` into nana-pi
   `main`; `feat/builtin-mcp` into edge-screener's `p87-setup` (not `main`); pull that merged
   state into the live `~/nana-pi` and `~/edge-screener` checkouts. *Why now:* with the desk
   down, nothing can combine an old retained manifest or old `spawnChild()` with any part of
   this update — the combination astra's evidence showed is unsafe simply cannot occur while
   there is no running listener to hold stale state.
3. **Replace** `~/.pi/agent/apps/edge.json` with the JSON in this report. *Why here:* the desk
   is still down and reads no manifest until it starts, so this can happen any time between
   steps 1 and 4 without risk; placed here to keep the manifest and the code it names updated
   together, in one quiesced window.
4. **Start the desk**: `launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.nana.pi-desk.plist`.
   *Why this is what actually applies the change:* a restart is the only way the desk re-reads
   every manifest fresh and loads the landed `apps.mjs`/`server.mjs` — nothing short of it does,
   and now it starts with both checkouts and the manifest already consistent from steps 2–3.
5. **Verify**: the edge session (port 7321) reports the new manifest (`GET /api/manifest` shows
   the six `mcp__edge__*` tool names), and a live smoke prompt through it actually stages signed
   blocks (the same shape as probe (d) in this report, or a real prompt through the desk UI).
   *Why before anything is removed:* this is the first time the landed code runs against the
   real paths and the real `uv`/python env at `~/edge-screener`, neither of which I touched —
   confirming it live is the only way to know the quiesced restart actually worked.
6. **Only then** remove `~/.pi/agent/apps/vendor/` (the pi-mcp-adapter vendor tree) — nothing
   reads it any more; I found no other reference to it anywhere in nana-pi's live code or docs
   (the only other hit, `apps/bench/studies/tool-profiles-2026-09-08/fixture/...`, is a frozen
   benchmark artifact, left untouched). *Why last:* removing it before step 5 confirms success
   would leave no way back if the restart surfaces a problem the worktree didn't — step 5 is the
   first live evidence either way, so nothing is removed before it reports good.

## Residuals

- Fixed per seat follow-up: `apps/desk/README.md` ~L142 said "pi has no MCP"; now states the
  truth (built-in MCP and the user's MCP servers go with it when a narrowed spawn's
  `--no-extensions` fires, pi 1.0+). Did not touch the picker's own behavior.
- **Open item for the seat:** a narrowed interactive desk spawn (any skills/extensions toggle)
  has lost built-in MCP since pi 1.0 — the picker has no way to list or re-add `builtin:mcp`, so
  the user's own MCP servers (and the `/mcp` panel's servers) go dark on any narrowed session,
  silently. This is the desk's general spawn picker, not the edge app-session contract this lane
  owns, so I fixed only the README's claim, not the gap itself.
- The over-cap/overflow scenario the old e2e tested (adapter `outputGuard.detailsMaxBytes`) has
  no built-in-MCP equivalent and was retired, not replaced; the rejection mechanics it exercised
  stay pinned at the unit level only (R-255, pre-existing). **Corrected (astra r1 SHOULD, 2026-10-05):**
  retiring that scenario does not mean nothing is unbounded. Per-block caps hold (64 KiB block
  JSON, 500 table rows, bounded chart series/points, 256 KiB rendered text), but block COUNT and
  the aggregate structured bytes of one tool result are unbounded: astra's probe put 200 valid
  cards in one built-in MCP result and got 200 accepted entries and a 12,049,148-byte patch, no
  error — pi's built-in MCP keeps the whole structured result in memory regardless of block
  count, and the desk's stdout/SSE limits sit downstream of validation, signing and ledger
  construction. No cap was added in this lane (not asked for; would need a sealed value and a
  deterministic over-cap test, and would still not be a transport-level, pre-allocation bound).
  Updated `packages/nana-stage/README.md` to state this instead of "no residual."
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
any way I can see, but genuinely untested on the real paths. Machine step 5 above (verify the
live manifest and a live smoke prompt) covers it.

