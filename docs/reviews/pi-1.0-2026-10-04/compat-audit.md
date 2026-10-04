# pi 0.87.1 → 1.0.2 compatibility audit

Lane A · 2026-10-04 · worker: Sonnet (Claude Code `Agent`, subagent)

## Top line

Safe to upgrade. Nothing in our consumers breaks against 1.0.2. The one real finding — codemode
(QuickJS scripts calling tools) could in principle bypass nana-gate/nana-post-edit — is **disproven**
by pi's own source: nested calls route through the identical `beforeToolCall`/`afterToolCall` hooks
as model-issued calls (`dist/core/agent-session.js:301-333`), and codemode is opt-in, not default.
The only visible friction is cosmetic: pi-mcp-adapter 2.32.1 (installed) predates pi's built-in MCP
and will print a one-line startup warning under 1.0.2 (`built-in extension "mcp" was not loaded`) —
harmless, verified live, no double-connect. Jake will notice three UX defaults changing (fullscreen
TUI, OKHSL-revised `dark`/`light` colors, "OpenAI Codex (legacy)" label) that we don't control via
settings today except theme (already pinned `dark`). `npm test`'s six pi-oracle tests hardcode
`npm root -g` and can't be pointed at a scratch install without a real global upgrade — so this audit
verified 1.0.2 via direct, isolated-agent-dir RPC probes instead, not a second full suite run.

## Table

| Change (version) | Our consumer | Verdict | Evidence |
|---|---|---|---|
| Codemode + nested `ctx.executeTool()` (0.99.0) | `nana-gate.ts:238` `tool_call`, `nana-post-edit.ts:358` `tool_result` | NO EFFECT | [V] `dist/core/agent-session.js:301-333`: `_beforeToolCall`/`_afterToolCall` are installed once as `this.agent.beforeToolCall/afterToolCall` and reused by `_executeNestedToolCall` with `parentToolCallId` set; both paths call `runner.emitToolCall({type:"tool_call", toolName, ...})`. `toolName`/`input` — the only fields nana-gate/nana-post-edit read — are unchanged for nested calls. |
| codemode default-on? | all consumers | NO EFFECT | [V] `docs/settings.md:40`: `defaultTools` default is `read,bash,edit,write`; codemode needs `+codemode` or an MCP server with `codemode` exposure connecting. Our `pi-review`/`pi-worker`/bench all pass explicit `-t`/`--tools` allowlists that never include `codemode`. |
| TS extension loading ("replaced tsx with Node type stripping", 0.99.0 #9965) | `packages/nana-pack/extensions/*.ts`, `nana-knowledge/extensions/*.ts` | NO EFFECT | [V] That changelog line is pi's own build, not the extension loader: 1.0.2 still ships `dist/core/extensions/jiti-loader.js` + `jiti@2.7.0` (identical to 0.87.1's `jiti@2.7.0`). [V] Live load: `pi --mode rpc -e packages/nana-pack -e packages/nana-knowledge` under isolated 1.0.2 answered `get_state` cleanly, zero stderr, expected nana-pack notices only. |
| Built-in MCP (0.99.0) vs `pi-mcp-adapter` 2.32.1 | `~/.pi/agent/mcp.json` ("memory" server) | NEEDS CHANGE (cosmetic) | [V] Live test: loading installed adapter 2.32.1 under isolated 1.0.2 with a synthetic `mcp.json` prints `Warning: Extension package "builtin:mcp": ... registers command /mcp, so built-in extension mcp was not loaded.` Status line showed `connecting to 1 servers` (adapter only) — **no double-connect**, no duplicate process. Root cause: our installed 2.32.1 predates pi 0.99 (released 2026-09-01, pi 0.99.0 shipped 2026-09-29) and still reads `mcp.json` directly (pre-3.0.0 adapter behavior); adapter 5.0.0 (2026-10-01) fixes this properly — disables `-builtin:mcp` and reads both files. |
| MCP server default exposure = `codemode` (0.99.0) | if adapter is ever disabled | NEEDS CHANGE (future) | [V] `docs/mcp.md:191`: "Pi activates codemode when a server with codemode exposure connects." Our `mcp.json` "memory" entry has no `exposure` key → defaults to `codemode`. If the adapter is removed, pi's builtin MCP will auto-enable codemode the first time that server connects, unless `autoEnableCodemode:false` is set. Does not currently apply — adapter still owns `/mcp`. |
| pi-subagents 0.75.0 on 1.0.2 | `~/.pi/agent/npm/node_modules/pi-subagents` (user has 0.64.0; 0.75.0 is latest) | NO EFFECT | [V] Installed 0.75.0 fresh (own deps resolved) and loaded under isolated 1.0.2 via `-e`: clean `get_state`, zero stderr. |
| `openai-codex` → "OpenAI Codex (legacy)" display rename, default model → `gpt-6.1-sol` (0.99.1) | `~/.pi/agent/settings.json` (`defaultProvider: openai-codex`), `pi-review`/`pi-worker` `--provider openai-codex -m gpt-5.6-sol\|gpt-6-astra` | NO EFFECT | [V] `dist/bundle/chunks/chunk-ZSBPJAJ2.js`: provider id is still `"openai-codex"` (only the display `name` changed); `gpt-5.6-sol` and `gpt-6-astra` are both still registered with `provider:"openai-codex"`. Only the *unqualified default* (no `-m` given) moved to `gpt-6.1-sol` — we always pass `-m`/`--model` explicitly. |
| Desk RPC: session file created on first user message, not before (1.0.0 #10000) | `apps/desk/apps.mjs:53,297` `spawnForApp` reads `get_state.sessionFile` right after spawn | NO EFFECT (verified, not assumed) | [V] A/B live test, identical isolated harness: under both 0.87.1 and 1.0.2, `get_state` right after spawn (zero messages) already reports a `sessionFile` path for a file that **does not yet exist on disk** (`find <sessionDir>` empty in both). `apps.mjs`'s existing `fs.existsSync(m.session)` reattach guard already handles this — behavior is identical pre/post upgrade, not a new race. |
| Per-input `disposition` on `prompt`/`steer`/`follow_up` (0.99.0) | `apps/desk/server.mjs:2028` `promptChild` | NO EFFECT | [V] `grep disposition apps/desk/*.mjs` (non-test): zero hits. The desk only reads `r.success`/`r.error`; the new field is additive and currently unused — an improvement opportunity, not a requirement. |
| `builtin:<name>` renaming of extension sources (0.99.0) | desk/bench display code | NO EFFECT | [V] `grep "<inline:\|<builtin:\|builtin:mcp"` across `packages/`,`apps/` (non-vendor): zero hits — nothing string-matches the old or new spelling. |
| `--no-extensions` now also disables built-ins (codemode/mcp/tool_search/llama.cpp) (0.99.0) | `apps/bench/lib/profiles.mjs:26` `ISOLATION_FLAGS` | NO EFFECT (strengthens isolation) | [V] `docs/settings.md`/changelog: built-ins didn't exist under 0.87.1 (bench was built against it), so bench never assumed anything about them; `--no-extensions` under 1.0.2 now cleanly removes them too, preserving bench's "known, minimal tool set" invariant. |
| `npm test` pi-oracle tests vs. scratch 1.0.2 | `config-trust.test.mjs`, `config-project-gate-fallback.test.mjs`, `objective-golden.test.mjs`, `post-edit-file-queue.test.mjs`, `post-edit-status.test.mjs`, `handoff-staleness.test.mjs` | UNVERIFIED (by design, not a bug) | [V] Each hardcodes `execSync("npm root -g")`/`spawnSync("npm",["root","-g"])` to find a real pi install — they ignore `DESK_PI_BIN`/`DESK_PI_ROOT` entirely, and `scripts/test.mjs` also scrubs `PI_CODING_AGENT_DIR` from the child env. Running them against 1.0.2 without a real global upgrade (forbidden by this audit's rules) isn't possible as written. |
| Desk e2e suites vs. scratch 1.0.2 | `apps/desk/pi-session.mjs` `DESK_PI_BIN`/`DESK_PI_ROOT` | override exists, not exercised | [V] `resolvePiBin()`/`resolvePiPackage()` honor `DESK_PI_BIN`/`DESK_PI_ROOT` explicitly (`pi-session.mjs:129-132,267`). `scripts/test.mjs` excludes every `*.e2e.mjs` file by design, so `npm test` never exercises this path; running e2e manually against 1.0.2 was skipped here per the "never run two desk suites at once" rule and budget — a build-lane item, not a blocker. |
| Theme colors (0.99.0, OKHSL-revised `dark`/`light`); fullscreen TUI default (1.0.0); "OpenAI Codex (legacy)" label | interactive use only | NO EFFECT on automation / visible to Jake | [I] Settings pin `theme: "dark"` already — name unchanged, RGB values changed (not independently re-rendered here). `tuiMode` isn't pinned, so interactive sessions go fullscreen by default; set `tuiMode: "regular"` to keep today's behavior. |
| `pi update` now nudges the pi.dev managed installer (1.0.1) | `apps/desk/pi-session.mjs` global-npm resolution, `nana-setup` doctor | NEEDS CHANGE if ever run | [I] Not exercised (forbidden). If anyone runs `pi update` and accepts the migration, `npm root -g` stops containing pi, breaking the desk's and nana-setup's resolution until `DESK_PI_ROOT`/doctor are updated. Upgrade procedure below avoids this entirely. |

## Minimal change list for the build lane

1. **Upgrade `pi-mcp-adapter` to ≥5.0.0** (or explicitly accept the cosmetic warning). File:
   `~/.pi/agent/settings.json` `packages` entry / `pi update npm:pi-mcp-adapter`. Why: 2.32.1 predates
   pi 0.99's built-in MCP by a month; 5.0.0 disables `-builtin:mcp` cleanly and silences the startup
   warning. Test to pin: a live-load check asserting zero stderr lines matching `built-in extension`
   when the adapter loads under 1.0.2+ (same harness as this audit's `test-adapter.err`).
2. **Decide `autoEnableCodemode` explicitly** in `~/.pi/agent/mcp.json` (set `false` unless codemode
   is wanted) — belt-and-suspenders for the day the adapter is ever removed, since the "memory"
   server has no `exposure` key and would otherwise auto-enable codemode on builtin MCP's first
   connect. Why: default exposure is `codemode` (`docs/mcp.md:191`). Test to pin: an isolated-agent-dir
   RPC probe loading builtin MCP (no adapter, `-e builtin:mcp`) against that `mcp.json` and asserting
   codemode is NOT in the active tool set.
3. **Patch the six `npm root -g`-hardcoded pi-oracle tests to honor `DESK_PI_ROOT`** (fall back to
   `npm root -g` only when unset), so a future upgrade lane can verify against a scratch install
   without a global `pi update`. Why: this audit could not run them against 1.0.2 as a result. Test
   to pin: none new — this is test-infra, the existing tests stay the pin.

No other file needs to change before upgrading.

## Upgrade procedure

```bash
npm i -g --ignore-scripts @earendil-works/pi-coding-agent@1.0.2
pi --version   # expect 1.0.2
# restart any running pi sessions / the desk (apps/desk) so it re-resolves PI_BIN
```

Rollback:

```bash
npm i -g --ignore-scripts @earendil-works/pi-coding-agent@0.87.1
```

(Prior art: `git show d845c5f` used the identical `npm i -g --ignore-scripts` form for 0.84.4→0.87.1.)

## Baseline vs 1.0.2 test results

- **Baseline, `npm test` on installed 0.87.1** [V]: `89 files: 88 PASS, 0 FAIL, 1 SKIP, 0 WARN ·
  checks: 5442 pass, 0 fail, 7 skip · 289.7s`. The 1 skip is `packages/nana-pack/tests/
  post-edit-file-queue.test.mjs` (pre-existing, environment-gated — matches the known intermittent
  note for this suite). No `apps/desk/test/stage-key-persistence.test.mjs` flake observed this run.
- **1.0.2**: not run as a second full suite (see table row above — six tests ignore any override and
  `scripts/test.mjs` scrubs `PI_CODING_AGENT_DIR`, and a real global upgrade is out of scope for this
  audit). Instead verified directly via isolated-agent-dir RPC `get_state` probes against a scratch
  `npm i --prefix <scratchpad>/pi102 --ignore-scripts @earendil-works/pi-coding-agent@1.0.2` install:
  nana-pack + nana-knowledge extension load (clean), pi-mcp-adapter 2.32.1 load (one cosmetic
  warning, no double-connect), pi-subagents 0.75.0 load (clean), model catalog grep (gpt-5.6-sol /
  gpt-6-astra / openai-codex provider id all present), and the nested-tool-call dispatch path read
  directly from `dist/core/agent-session.js`.

## One claim I'd flag as most likely to be wrong

The "no double-connect" MCP finding rests on a 10-second window before I killed the probe process —
if the adapter's connection to the real "memory" server (not my synthetic stdin-resume stub) is much
slower or retries, I would not have seen a second attempt that only manifests later. The command-
registration race (adapter wins `/mcp`, builtin backs off) is the real, structural mechanism though,
and that part is verified directly from pi's own warning text, not timing.
