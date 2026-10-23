# claude-code-builder-parity · seat smoke at tip ef39406b (2026-10-23)

Runner: the seat's smoke runner. Tree under test: the lane worktree at ef39406b, run read-only (`node ~/nana-pi-wt/claude-code-builder-parity/packages/nana-pack/bin/pi-worker.mjs`). claude 2.1.299. All fixtures, homes, agent dirs and TMPDIRs live under `<scratch>/ccbp-smoke/`. Every pi-worker run used `env -i` with PATH, HOME, USER, LOGNAME, TERM, TMPDIR and PI_CODING_AGENT_DIR only (plus the step 1 endpoint names below), so no seat session env reached the builder. Paths are scrubbed: home to `~`, scratch to `<scratch>`. No credential value was printed or saved.

Every claim below is **measured** unless marked **inferred**.

## Step 1 · fake-endpoint capture (no model)

Setup: fixture repo with a committed project `CLAUDE.md` (marker `PROJECT-CLAUDE-MD-MARKER-7d1e`), `docs/known-bugs/FEAT-006.md` (marker `KNOWN-BUG-MARKER-5c2a`), linked worktree on `feat/smoke`, brief with `Feature: FEAT-006`, `BRIEF-MARKER-91b4` and `Precedent: - seed`. Temp HOME holding `.claude/settings.json` with a SessionStart hook (writes `sessionstart.marker`), `permissions.defaultMode: "plan"`, an `mcpServers` entry, `env` {`HTTPS_PROXY=http://127.0.0.1:9`, `PROBE_USER_ONLY=1`, `NO_PROXY=127.0.0.1,localhost`}, and `apiKeyHelper` pointing at a script that writes `keyhelper.marker` and prints a fake key. The same HOME also had `~/.claude.json` with a user-scope `mcpServers` entry, `.claude/CLAUDE.md` (marker `USER-CLAUDE-MD-MARKER-3f8a`) and `.claude/rules/x.md` (marker `USER-RULE-MARKER-a6c0`). Roster `largerBuilder: {runtime: "claude-code", model: "haiku"}`. Process env: `ANTHROPIC_BASE_URL=http://127.0.0.1:<port>`, `DISABLE_TELEMETRY=1`, `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1`; no `ANTHROPIC_API_KEY`. `--max-secs 120`.

The fake endpoint is a copy of `ccbp-attack/fakeapi.mjs` with one addition: it logs header presence as booleans only (x-api-key present, x-api-key equals the fake helper key, Authorization present, Authorization equals `Bearer <fake helper key>`). It was scripted to answer the first turn with one Bash tool call, a permission-mode probe. Run 1a's probe wrote `perm-probe.txt`; run 1b's probe also recorded the builder's Bash env for the carry and sealed names, and copied the settings file while the build ran (it holds only fake values).

| # | Check | Expected | Measured | Result |
|---|---|---|---|---|
| 1.1 | pi-worker exit | 0 | 0 (16 s run 1a, 3 s run 1b); out.md = `FAKE-REPORT-DONE` | PASS |
| 1.2 | System prompt holds the rendered preamble's first line | contains `# nana lane builder` | present once; line 3 rendered as `You are a builder running in the verified lane worktree: <scratch>/ccbp-smoke/s1/lane on branch feat/smoke`; no `{{` anywhere in system or messages | PASS |
| 1.3 | System prompt holds the brief | contains brief text | `BRIEF-MARKER-91b4` present once | PASS |
| 1.4 | System prompt holds the known-bug text | contains FEAT-006 text | `KNOWN-BUG-MARKER-5c2a` present once; order preamble (offset 6363) < brief (9154) < bugs (9243) | PASS |
| 1.5 | User CLAUDE.md marker absent | absent | absent from system prompt AND from every message. Control: the project `CLAUDE.md` marker appears in the first user message (its only CLAUDE.md block), so the check could see a loaded CLAUDE.md | PASS |
| 1.6 | User rules marker absent | absent | absent from system prompt and every message | PASS |
| 1.7 | Tools array | exactly Bash, Edit, Glob, Grep, Read, Write; no Agent, no `mcp__` | `["Bash","Edit","Glob","Grep","Read","Write"]` on every main request; no `mcp__`, no `probe_tool` (neither the settings.json nor the `~/.claude.json` MCP server) | PASS |
| 1.8 | SessionStart hook marker | absent | `sessionstart.marker` does not exist (both runs); no hook text in messages | PASS |
| 1.9 | Builder line | `pi-worker: builder (larger lanes): claude-code haiku; source: ...` | exact, once, before `[pi-worker] attempt 1/1` | PASS |
| 1.10 | Carry line | names `apiKeyHelper` and env `HTTPS_PROXY`, `NO_PROXY`; no values | `pi-worker: claude settings carry: apiKeyHelper, env HTTPS_PROXY, NO_PROXY; source: <scratch>/ccbp-smoke/s1/home/.claude/settings.json`; no value, no `PROBE_USER_ONLY`; before `attempt 1/1` | PASS |
| 1.11 | apiKeyHelper ran | marker written | `keyhelper.marker` = `helper-ran` (once per run); every request carried x-api-key = the fake helper key and Authorization = `Bearer <fake helper key>` (booleans true); no `ANTHROPIC_API_KEY` in the env | PASS |
| 1.12 | Permission mode (user `defaultMode: plan` must not apply) | not plan | the scripted Bash call ran and wrote its file (`perm-probe`), result `is_error: false`; no "plan mode" text in system or messages | PASS |
| 1.13 | Settings file (run 1b copy) | carry allowlist + sealed env, 0600, outside worktree | `{"apiKeyHelper":"<scratch>/.../home/keyhelper.sh","env":{"HTTPS_PROXY":"http://127.0.0.1:9","NO_PROXY":"127.0.0.1,localhost","NANA_ROLE":"worker","NANA_WORKTREE_ROOT":"<scratch>/ccbp-smoke/s1b/lane","NANA_HANDOFF":"off","CLAUDE_CODE_DISABLE_AUTO_MEMORY":"1","BASH_DEFAULT_TIMEOUT_MS":"3600000","BASH_MAX_TIMEOUT_MS":"3600000"}}`; mode 600; no `PROBE_USER_ONLY`, no hooks, no permissions, no mcpServers. Temp folder held `builder-prompt.md`, `builder-settings.json`, `preamble.md` during the run and was empty after | PASS |
| 1.14 | Builder Bash env (run 1b probe) | sealed names + carried names, no user-only name | `BASH_DEFAULT_TIMEOUT_MS=3600000`, `BASH_MAX_TIMEOUT_MS=3600000`, `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`, `HTTPS_PROXY=http://127.0.0.1:9`, `NANA_HANDOFF=off`, `NANA_ROLE=worker`, `NANA_WORKTREE_ROOT=<lane>`, `NO_PROXY=127.0.0.1,localhost`; `PROBE_USER_ONLY` absent; no auto-memory text in the prompt | PASS |
| 1.15 | Dead-port proxy | record what happened | the fake was reached: 2 requests per run, both answered, build exit 0. **Inferred** cause: the base URL is plain `http://`, so `HTTPS_PROXY` does not apply to it, and `NO_PROXY` covers 127.0.0.1 anyway; this run cannot tell which of the two kept the request direct | RECORDED |
| 1.16 | Lane state after | clean, no lock | `git status --porcelain` empty; no `nana-lane.lock` under the worktree git dir | PASS |

pi-worker stderr, run 1a (exact, scrubbed):

```
pi-worker: builder (larger lanes): claude-code haiku; source: <scratch>/ccbp-smoke/s1/agent/nana-pack.json
pi-worker: precedent: 1 checked at HEAD 755353b; known bugs: docs/known-bugs/FEAT-006.md
pi-worker: claude settings carry: apiKeyHelper, env HTTPS_PROXY, NO_PROXY; source: <scratch>/ccbp-smoke/s1/home/.claude/settings.json
trust: none for <scratch>/ccbp-smoke/s1/lane — project post-edit checks are inert (nana-setup trust <scratch>/ccbp-smoke/s1/lane)
[pi-worker] attempt 1/1
  [pi-worker a1] cpu=0.47s flat=0/Infinity
[pi-worker] SUCCESS on attempt 1 (17 chars → <scratch>/ccbp-smoke/s1/out.md)
pi-worker: build record: ok, exit 0, 0 min, cost unknown: no matching session in <scratch>/ccbp-smoke/s1/agent/sessions/--<scratch>-ccbp-smoke-s1-lane--; lane smoke | 1 build | 1 ok | 0 min | 0 tokens | $0.00 | 1 unpriced
```

Run 1b's lines are the same shape (HEAD 741627b, no heartbeat line in its 3 s).

## Step 2 · real-claude smoke (haiku)

Setup: the real HOME (login from the macOS keychain; no auth env name in the process env), a temp PI_CODING_AGENT_DIR with roster `largerBuilder: {runtime: "claude-code", model: "haiku"}`, a fresh fixture repo with `docs/known-bugs/FEAT-006.md` (`- KNOWN-BUG-MARKER-e41d: the fixture smoke bug, quoted back by the builder.`), a linked worktree on `feat/realsmoke`, `--max-secs 900`. The real user settings file holds none of the carry keys and no `env`, so the carry line reads `none` (expected for this machine).

Two runs. Run 2a used the brief exactly as specified (`sleep 130 && echo slept`). Claude Code itself refused that command, so run 2b repeated the smoke in a fresh fixture with a 130 s command that is not a `sleep`, and told the builder to pass no Bash `timeout` parameter (so the default limit, not a model-chosen one, governs).

| # | Check | Expected | Measured | Result |
|---|---|---|---|---|
| 2.1 | Login and model reached | builder runs | both runs reached the model; transcript model `claude-haiku-5-5`, `permissionMode: default` | PASS |
| 2.2 | pi-worker exit | 0 | 2a: 0 (11 s); 2b: 0 (138 s) | PASS |
| 2.3 | Commit in the worktree | `hello.txt` = `hello`, committed | 2a: `dcc8169 Add hello.txt smoke fixture`; 2b: `b39c509 Add hello.txt smoke fixture`; `hello.txt` = `hello`; both worktrees clean | PASS |
| 2.4a | `sleep 130 && echo slept` as specified | runs past 120 s, `slept` | **not run**: Claude Code 2.1.299 blocked it before execution, tool result `<tool_use_error>Blocked: sleep 130 followed by: echo slept. To wait for a condition, use Monitor with an until-loop (e.g. ...). To wait for a command you started, use run_in_background: true. Do not chain shorter sleeps to work around this block.</tool_use_error>`. The builder had also passed `"timeout":200000` on that call. Its report began `VERDICT: PARTIAL`; pi-worker still exited 0 (it judges non-empty output only, as for a pi builder) | FAIL (claude's own sleep guard, not the lane) |
| 2.4b | One Bash command over 120 s (variant) | runs in the foreground to `slept` | Bash call `node -e "setTimeout(() => {}, 130000)" && echo slept`, no `timeout` and no `run_in_background` parameter; tool_use 05:30:05.776Z, tool_result `slept` at 05:32:15.844Z (130.1 s, foreground). **Inferred**, no control run: without the sealed `BASH_DEFAULT_TIMEOUT_MS` the 120 s default would have stopped or backgrounded it | PASS |
| 2.5 | Report first line | `VERDICT: DONE` | 2b: `VERDICT: DONE`, then `Bash output:` / `slept` | PASS (2b) |
| 2.6 | Rules first line quoted | `# nana lane builder` | 2a and 2b: `# nana lane builder` | PASS |
| 2.7 | Known-bug line quoted | the fixture line verbatim | 2a and 2b: `- KNOWN-BUG-MARKER-e41d: the fixture smoke bug, quoted back by the builder.` | PASS |
| 2.8 | Builder line | `pi-worker: builder (larger lanes): claude-code haiku; source: ...` | exact, once, before `attempt 1/1`, both runs | PASS |
| 2.9 | Carry line | one line, names only | `pi-worker: claude settings carry: none; source: ~/.claude/settings.json`, both runs | PASS |
| 2.10 | Cleanup | temp folder empty, no lock | TMPDIR empty after both runs (the prompt/settings folder and the watchdog's own `pi-review-*` output folder both removed); no `nana-lane.lock` | PASS |
| 2.11 | No stall stop | heartbeat shows no flat limit | 2b heartbeats `flat=0/Infinity`, 9 lines over 130 s | PASS |

pi-worker stderr, run 2b (exact, scrubbed):

```
pi-worker: builder (larger lanes): claude-code haiku; source: <scratch>/ccbp-smoke/s2b/agent/nana-pack.json
pi-worker: precedent: 1 checked at HEAD ae6e43f; known bugs: docs/known-bugs/FEAT-006.md
pi-worker: claude settings carry: none; source: ~/.claude/settings.json
trust: none for <scratch>/ccbp-smoke/s2b/lane — project post-edit checks are inert (nana-setup trust <scratch>/ccbp-smoke/s2b/lane)
[pi-worker] attempt 1/1
  [pi-worker a1] cpu=1.02s flat=0/Infinity
  [pi-worker a1] cpu=1.22s flat=0/Infinity
  [pi-worker a1] cpu=1.35s flat=0/Infinity
  [pi-worker a1] cpu=1.44s flat=0/Infinity
  [pi-worker a1] cpu=1.59s flat=0/Infinity
  [pi-worker a1] cpu=1.66s flat=0/Infinity
  [pi-worker a1] cpu=1.8s flat=0/Infinity
  [pi-worker a1] cpu=1.86s flat=0/Infinity
  [pi-worker a1] cpu=2.06s flat=0/Infinity
[pi-worker] SUCCESS on attempt 1 (365 chars → <scratch>/ccbp-smoke/s2b/out.md)
pi-worker: build record: ok, exit 0, 2 min, cost unknown: no matching session in <scratch>/ccbp-smoke/s2b/agent/sessions/--<scratch>-ccbp-smoke-s2b-lane--; lane realsmoke | 1 build | 1 ok | 2 min | 0 tokens | $0.00 | 1 unpriced
```

pi-worker stderr, run 2a (exact, scrubbed):

```
pi-worker: builder (larger lanes): claude-code haiku; source: <scratch>/ccbp-smoke/s2/agent/nana-pack.json
pi-worker: precedent: 1 checked at HEAD 0533ab7; known bugs: docs/known-bugs/FEAT-006.md
pi-worker: claude settings carry: none; source: ~/.claude/settings.json
trust: none for <scratch>/ccbp-smoke/s2/lane — project post-edit checks are inert (nana-setup trust <scratch>/ccbp-smoke/s2/lane)
[pi-worker] attempt 1/1
[pi-worker] SUCCESS on attempt 1 (1208 chars → <scratch>/ccbp-smoke/s2/out.md)
pi-worker: build record: ok, exit 0, 0 min, cost unknown: no matching session in <scratch>/ccbp-smoke/s2/agent/sessions/--<scratch>-ccbp-smoke-s2-lane--; lane realsmoke | 1 build | 1 ok | 0 min | 0 tokens | $0.00 | 1 unpriced
```

## Observations for the seat (not must-meet checks)

- The build-record line's cost reason names a pi sessions folder (`no matching session in <agent>/sessions/...`) for a Claude build. The must-meet's known limits name a null cost and pi-named failure lines, but not this reason text. A candidate known-bug line for FEAT-006 (measured).
- Claude Code 2.1.299 blocks a foreground `sleep N && ...` in the builder (measured, 2a). The blocked call's own suggestion, Monitor, is not in the builder tool list. A brief that needs a long wait has to use a command that is not a `sleep`. Any seat smoke recipe that names `sleep 130` should change.
- The real claude runs wrote their own transcripts under `~/.claude/projects/` (two folders, for the s2 and s2b lanes; accepted). `~/.claude.json` mtime moved to 01:30:01 during run 2b, so claude also wrote its own `~/.claude.json` (measured by mtime only; content not read; **inferred** to be its per-project entry). The runner wrote nothing under `~/.pi` or `~/.claude`.
- Run 1's Authorization header carried the fake helper key, not a keychain login (measured by boolean), so a temp-HOME run with a carried `apiKeyHelper` did not fall back to the real login.
- Cost: two real haiku runs (2a and 2b), each a handful of turns.

## Files

- Scripts: `<scratch>/ccbp-smoke/run-s1.sh`, `run-s1b.sh`, `run-s2.sh`, `run-s2b.sh`, `fakeapi.mjs` (booleans-only header addition), `scrub.sh`.
- Captures: `<scratch>/ccbp-smoke/s1*/logs/` (api log, system prompt, messages, tools), `s1b/settings-copy.json`, `s1b/perm-probe.txt`, `s2*/out.md`, `s2*/logs/worker.stderr` (unscrubbed; this file holds the scrubbed copies).
