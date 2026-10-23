# claude-code-builder-parity · plan attack (adversary, 2026-10-22, main 3bbb0662)

## Summary

The design is the smallest one that meets all three of the owner's clauses. A seat-side prompt file plus a hard brief-check still leaves the check advisory, so retiring the subagent route is right (default yes). The plan's code claims check out against main and the build-records worktree. One material gap remains: the builder's permission mode comes from the user's settings, and `--allowedTools` does not cover every mode. With no `defaultMode` set, 2.1.299 runs in auto mode and sends Bash commands to a classifier. With `plan` set, the build edits nothing and still exits 0. One flag, `--permission-mode default`, fixes both (measured). Three more changes are worth making. The class should be gate: both earlier pi-watchdog lanes were classed gate for exactly this reason. Two flags plus one env variable keep the seat's user rules, hooks and auto-memory away from the builder (measured). The R-2646 test should pin the exact argv, because a different flag order makes real claude swallow the prompt (measured). Stall stop off is fine: a hung claude is bounded by the 8-hour ceiling, and a stall stop could not catch it anyway (measured).

Probes: a fake Messages endpoint (`ccbp-attack/fakeapi.mjs`) records claude 2.1.299's real requests; a temp HOME (`setup-home.sh`) holds a user CLAUDE.md, rule, MCP server and hooks; `run.sh` drives it; logs in `ccbp-attack/logs/`. No real model ran.

## Findings

### M1. The permission mode is inherited, and `--allowedTools` does not approve tools in auto or plan mode

Design part 5 says `--allowedTools` "approves those tools on a machine whose permission mode would prompt". The threat model names "bypass or default permission mode". Measured on 2.1.299 with the plan's flags:

- User settings with no `defaultMode` (the out-of-box case): the PreToolUse hook logs `mode=auto`. A Bash `node -e …write file…` is sent to the classifier (`claude-sonnet-5`, 10 calls in `logs/nomode2.log`) instead of being approved by `--allowedTools Bash`. When the classifier gives no verdict, the result is "Auto mode could not evaluate this action and is blocking it for safety", and no file is written. Read-only commands and `touch` pass. So on a real login every non-trivial builder command (tests, commits) costs a classifier call and may be blocked.
- `defaultMode: "plan"`: Write returns "Cannot write to … while in plan mode", and claude exits 0 with its text (`logs/plan-mode.log`). pi-worker would print SUCCESS and the build record `ok` for a build that edited nothing.
- Adding `--permission-mode default` fixes both cases. The same command ran with zero classifier calls (`logs/nomode3.log`). The plan-mode setting was overridden and the Write succeeded (`logs/plan-pm.log`). A bypass setting becomes `mode=default` (`logs/bp-pm.log`). Under default mode with the six tools allowed, git commit, `rm -rf` outside the cwd and a Write outside the cwd all ran (`logs/def-git.log`, `def-out.log`). So the switch takes nothing the builder needs away from this Mac.
- Unchanged (consistent with the plan): with Bash not allowed in default mode, the call is denied at once ("needs approval") and nothing waits on a prompt (`logs/def-noallow.log`).

Fix: add `CLAUDE_PERMISSION_MODE_FLAG = '--permission-mode'` and `CLAUDE_BUILDER_PERMISSION_MODE = 'default'` to worker-config, sealed. Add both to R-2646's row and argv, and add a wrong-code pair "permission mode flag dropped → R-2646". Inferred, not measured: whether an OAuth login with no setting also defaults to auto. I measured with an API key against a local endpoint. The flag removes that dependence either way.

### S1. The class should be gate, not ordinary

- Precedent: `docs/reviews/watchdog-exit-2026-10-19/build-brief-1.md` says "Lane class: gate (pi-watchdog sits behind pi-review and pi-worker, which are the land and review tools)". `docs/reviews/win-watchdog-cpu-read-2026-10-19/build-brief-2.md` says "Class: install, hook or gate (pi-watchdog behind the review and land tools)". Both changed pi-watchdog only. A documented past decision beats a fresh derivation.
- Reach: `pi-review.mjs:203` runs every pi review through `runWatchdog`→`runOnce`. That is the function whose `piLaunch(args, { cwd })` call (`pi-watchdog.mjs:181`) and `spawn` options (`:193`) this lane edits. `review-launch.mjs:12` imports `piLaunch` from pi-watchdog, so claude-review → review-ledger → review-launch loads it too. AGENTS.md lines 17-19 list `pi-watchdog` in the bin group behind pi-review.
- The other side: pi-review passes no `launch`, and the fallback keeps its path byte-identical. That is true, but it is exactly what a land reviewer is for. The extra cost is one land review (roster `land: openai-codex gpt-6-astra`, through pi-review) and one independent check. The 16 seat pairs already exist.

### S2. The builder inherits the seat's Claude config; three cheap switches remove most of it (measured)

What a headless `claude -p` with the plan's flags gets from a temp HOME (`logs/plan-bypass.log.*`):

| Source | Reaches the builder? |
|---|---|
| User `~/.claude/CLAUDE.md` and `~/.claude/rules/*.md` | yes, as a system-reminder in turn 1 |
| Project `CLAUDE.md` (here `@AGENTS.md`) | yes; a bare `AGENTS.md` is not read |
| User SessionStart hook output | yes: "SessionStart:startup hook success: HOOK-CONTEXT-MARKER…" as a system message |
| UserPromptSubmit, PreToolUse hooks | run, with `NANA_ROLE=worker` |
| Auto-memory | yes: the prompt says to write memories to `~/.claude/projects/<key>/memory/` with Write, and the folder is created |
| User MCP server | no: tools are exactly `Bash,Edit,Glob,Grep,Read,Write` |
| User permission mode | yes (M1) |
| Appended prompt file | yes, at the end of the system prompt |

On this Mac that means the builder reads `nana-personal.md` (the owner's name, under the 2026-10-16 no-owner-name ruling), `nana-seat.md`, and the SessionStart quartet's output. That output includes the roster notice and the shared-memory index, which says "general feedback/user/reference memories are written HERE" (`nana-shared-memory.mjs:20`). Together with the auto-memory instructions, an honest builder has a documented path into the owner's shared memory, which every seat reads at start. A pi builder has none of this.

Measured switches:
- `--setting-sources project,local` drops the user CLAUDE.md, user rules, user hooks and user plugins, and keeps the project CLAUDE.md and the prompt file (`logs/ss-proj.log.*`). The user permission mode goes too, so M1's flag becomes required.
- `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` in the child env removes the memory instructions and the memory folder (`logs/nomem.log.system.txt`).
- Lighter alternative: `--settings <file>` holding `{"disableAllHooks":true}` stops every hook and keeps the rest of the user settings (`logs/nohooks`). Pass a file path, not JSON, because winCommand refuses `"`.

The trade with `--setting-sources`: it also drops user `env` (a Bedrock, Vertex or proxy setup) and `apiKeyHelper`, and the objective hook that a pi builder's extension supplies. Recommendation: `--setting-sources project,local` plus auto-memory off, with that trade as a known limit. This also makes probe 3's knowledge-hook skip moot. If the seat keeps user settings, auto-memory off is the minimum.

### S3. R-2646 does not pin argv order, and one order breaks real claude

`--tools <tools...>` and `--allowedTools <tools...>` take a variable number of values. Running `… --tools T --allowedTools T "Do the work in your brief for lane alpha." --name x` gives "Error: Input must be provided either through stdin or as a prompt argument when using --print", exit 1 (`logs/variadic.log.out`). The prompt was swallowed as a tool name. The plan's order is safe. But R-2646 only asserts "each exactly once" plus "the prompt … followed by --name", and a fake claude passes either order. Follow R-2560's precedent (`claude-review.test.mjs:126`, JSON equality of the whole argv): assert the exact sequence, with the temp path and the `--name` suffix matched by pattern. Add a pair: "the instruction placed right after the `--allowedTools` list → R-2646".

### S4. The roster notice still says "(Claude Code only)"

`roster-notice-config.mjs:25` (R-1197) marks a Claude entry "(Claude Code only)". Open question 1 sells "a pi seat can start one too". A pi seat that reads that mark next to `largerBuilder` meets R-1213's "a seat that cannot start that builder stops and asks". The two texts now disagree. Changing the mark makes this a hook lane (the Claude hook and the pi extension print it), which adds the macOS install check to the gate ladder. Either fold it in, or record the contradiction in the known limits as a line that names R-1213, not just "describes the runtime".

### S5. Make the smoke deterministic, and cover a long command

Step 5's "name every tool it has" is a model's self-report. The fake-endpoint capture records the real `tools` array, system prompt and permission mode with no model. Run it on the build tip, and keep the real smoke for login and the end-to-end commit, plus one Bash command over 120 s (S6). With the plan's flags and the real HOME, the smoke runs the owner's SessionStart hooks, and the shared-memory hook creates `~/.claude/projects/<temp-key>/memory/shared`; after S2 only the transcript is written.

### S6. The Bash tool's time limits apply to the builder's own suite run

Measured: a Bash call past its timeout moves to the background, and `-p` waits and runs the model again when it ends (`logs/def-long.log`). The result adds "If it is still running after 10m in the background, it will be stopped." Defaults: 120,000 ms, maximum 600,000 ms (`BASH_DEFAULT_TIMEOUT_MS`, `BASH_MAX_TIMEOUT_MS`). This Mac's suite took 455.9 s; with two lanes building, `test:locked` can wait one more suite, about 912 s, past 120 + 600 s. Set `BASH_DEFAULT_TIMEOUT_MS` as a chosen tunable in the child env, or add a known-limit line.

### N1. (c) Stall stop off: agreed

A hung request (the server accepts and never answers) left claude's CPU rising from 0.47 s to 0.61 s over 45 s. Only one 5-s pair was flat, and only one request was sent. So the flat-CPU stop could not fire on a hung native claude, and turning it off loses nothing on POSIX. On win32 `.cmd` it prevents killing a healthy build, as part 4 says. A hang is bounded by claude's own API and stream-idle timeouts, which come from remote config (`api_timeout_ms` and `stream_idle_timeout_ms` in the binary; values not measured), then by the 8-hour ceiling or `--max-secs`. That is acceptable. Reword the known limit from "cannot fire" (probe 4 measured a dead port, not a hang) to "measured not to fire on a hung request". The `cpu=` heartbeat will print `flat=n/Infinity`, which is cosmetic.

### N2. (b) The subtraction test

The smaller design (brief-check refusing hard, plus a prompt file the seat hands to a subagent) gives rules and known bugs only if the seat passes the file. It fails "stops being advisory", because the seat can skip it. It has no lock, ceiling, signals or build record. It keeps the seat's tools and MCP connectors (inferred), and a pi seat cannot use it. What it keeps that the plan loses: SendMessage continuation of the builder, and no PATH dependence on Windows. The plan's design loses those two and gets SessionStart output a subagent does not get (inferred). The plan's design stands. A hook on Agent would be advisory by load path too, and a hook lane.

### N3. `--restricted`: the reason for dropping it is partly wrong, but the decision is right

Measured: a Bash `git commit` and a Bash write outside the cwd both work under `--restricted`. A Write outside the cwd is refused, which matches pi's edit gate. But it drops the project CLAUDE.md too (no PROJECT marker in `logs/restr.log.*`), so the builder would lose AGENTS.md. Drop it for that reason, not for "gates git".

### N4. Unknown `--tools` names are dropped silently (measured)

`--tools Read,Bogus,Bash` gives tools `["Bash","Read"]` and exit 0 (`logs/bogus.log`). Change known limit 7 from inferred to measured. The seal test is the guard.

### N5. Row and pair accuracy

- R-2651 names SIGINT, SIGTERM and SIGHUP; its test sends only SIGTERM, on POSIX. Narrow the row or test all three.
- Pair 3's "and the seal" cannot go red: the seal compares constants, not argv.
- Pair 10 is not a one-line mutant (the roster is read after the check). Write it as "skip the refusal when the resolved `largerBuilder` is Claude Code".
- R-1124's row text (`<provider> <model> <thinking>`) becomes false for a Claude build; reword it with R-2649.
- `pi-worker.mjs:117` cites the retired R-1193.
- `review-launch.mjs:3` says "Resolve a review command"; its header needs a word change, in a file behind review-ledger (S1).
- Keep the injection in pi-worker: pi-watchdog importing review-launch would be a cycle (`review-launch.mjs:12`).

### N6. Failure lines name pi for a claude failure

A missing claude prints `pi spawn failed: spawn claude ENOENT` or `pi launch refused: not on PATH`, then "endpoint likely in a bad stretch" (`pi-worker.mjs:191`); the cost reason names the pi session folder. One known-bug line each, or a cheap fix in the Claude branch.

### N7. claude-review has none of these switches

`claude-review.mjs:90` passes only `-p --model --allowedTools --disallowedTools`, so its reviewer keeps all MCP servers, most built-in tools, user hooks, rules and permission mode, M1 included. One FEAT-007 known-bug line; out of this lane.

### N8. Claims verified

R-1191 at `pi-worker.mjs:123-128`; the `:134` line would print `undefined fable default`; temp folder `:139-141`, removed `:181-183`; optional feature `brief-precedent.mjs:111-123`; `hook.ts:160`; `review-ledger.mjs:149`; `largerBuilder` in `CLAUDE_CODE_SLOTS` (`worker-config.mjs:35`), its four model names (`:40`) all accepted by `claude --model` (`fable` → `claude-fable-5-1`). build-records copies `selectedBuilder.provider/thinking` into the start record, so R-2653 is needed. winCommand's refusals and verbatim `.cmd` route match the plan; claude-review's comma lists already use it (R-2564). Probe 3 reproduced. stdin set to ignore gives no 3-s stdin wait.

## Class

Gate (S1). Ladder: one final reviewer (claude-review, Opus), the land reviewer (pi-review, astra), the seat's wrong-code pairs, and one independent check. Add the macOS install check only if S4's notice change is folded in.

## Plan sections I would change

- **What I measured**: add the hung-request CPU probe (N1), the auto-mode default and its classifier gating (M1), and the inheritance table (S2).
- **Design**: part 1 argv adds `--permission-mode default` (and `--setting-sources project,local`), with a non-variadic flag right before the instruction; part 5 drops its `--allowedTools` claim; a new part sets the child env (`CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`, optionally `BASH_DEFAULT_TIMEOUT_MS`); part 4 reworded (N1); "Dropped" gets N3's reason.
- **Class**: gate, with the precedent from S1.
- **Threat model**: add "user settings with no `defaultMode` (auto in 2.1.299), or `plan`", and "user settings `env` or `apiKeyHelper`" if `--setting-sources` is adopted.
- **Tunables**: `CLAUDE_PERMISSION_MODE_FLAG` and `CLAUDE_BUILDER_PERMISSION_MODE` (sealed), `CLAUDE_SETTING_SOURCES_FLAG` and its value (sealed, if adopted), `CLAUDE_BUILDER_CHILD_ENV` (sealed), and optionally a Bash timeout (chosen).
- **Must-meet rows**: R-2646 names the permission mode (and setting sources) and the auto-memory env. Its test asserts the exact argv (S3). R-2651 is narrowed (N5).
- **Wrong-code pairs**: add permission mode dropped, setting sources dropped, auto-memory env dropped, and the instruction after a variadic list, all → R-2646. Fix pair 3's wording and rewrite pair 10 (N5).
- **Known limits**: rewrite #1 from S2; add lost SendMessage continuation, the Bash limits (S6) and the pi-named lines (N6); mark #7 measured (N4); rewrite the roster-notice line (S4).
- **Docs that change**: R-1124's wording, review-launch's header, the `pi-worker.mjs:117` comment, the FEAT-007 line (N7).
- **Seat steps**: step 4 adds the fake-endpoint capture (S5); step 5 adds a command over 120 s and drops the tool self-report; step 9 adds the land reviewer and the independent check.
