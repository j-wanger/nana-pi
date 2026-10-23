# claude-code-builder-parity · plan draft (planner, 2026-10-22, main 3bbb0662)

Feature: FEAT-006 · Launch builders with execution limits

Spend line: the owner's 2026-10-22 power-mode pick of remaining open items (HANDOFF "Lanes in flight": "After them come Claude Code builder parity and shared helpers"). It closes the FEAT-006 known bug "a Claude Code subagent builder gets only what the seat runs. brief-check is advice the seat follows, and that builder gets no preamble and no known-bug attachment".

Stakes: medium blast, reversible. Every lane launch runs the changed pi-worker; the pi path stays byte-identical and existing tests pin it. Reverting means a pi entry in `largerBuilder`.

## What I measured, and what I corrected

**"About a quarter" is about a third.** Method: for each of the 387 build briefs tracked at HEAD under `docs/reviews/*/`, I found the commit that added it, then the first run of non-seat commits descending from it (ancestry path to main, merges skipped). A `Co-Authored-By: Claude Sonnet/Haiku/Fable` trailer means a Claude Code subagent built it; no trailer means pi-worker; seat commits carry an Opus trailer. Where no builder commit followed, the brief's own builder line decided. Scripts: scratchpad `ccbp-plan/measure3.mjs`, `cross.mjs`, `lanes.mjs`.

- 131 of 385 classifiable builds went to a Claude Code subagent: 34%. The brief-line method gives 128 of 387. The two methods agree on 224 of the 240 briefs where both give an answer; the 15 that differ say "Claude Sonnet subagent" but have no trailer. Counting those as Claude gives 146 (38%).
- 72 of 168 lanes had at least one Claude build.
- 103 of the 131 Claude briefs never mention the preamble, and none carries a Precedent section.
- The path is idle today: 0 of the 62 builds since 2026-10-21 went to Claude, and this Mac's roster has `largerBuilder: openai-codex gpt-5.6-sol high`. The precedent-first adversary's 96 of 378 used a narrower brief-text match.

**Correction to the starting context:** pi-worker does not refuse a brief that has no `Feature:` line. `checkBriefForLaunch` (`packages/nana-pack/lib/brief-precedent.mjs`) treats the feature as optional and prints `known bugs: none`. It refuses only for the Precedent section.

**Claude Code 2.1.299 probes** (temp HOME, API pointed at a dead port, so no model ran; outputs in scratchpad `ccbp-plan/`):
1. `--append-system-prompt-file` exists but `--help` does not list it; the `--bare` help text names it. With a missing file, claude prints `Append system prompt file not found: <path>`. An unknown flag prints `unknown option`. Measured.
2. This argv parses: `--model sonnet --tools Read,Grep,Glob,Bash,Edit,Write --allowedTools <same> --strict-mcp-config --append-system-prompt-file <f> -p '<sentence>' --name pi-worker-a1-12345`. A `--name` after the prompt is accepted. Measured.
3. SessionStart and UserPromptSubmit hooks run in `-p` mode and receive the launcher's `NANA_ROLE=worker` and `NANA_WORKTREE_ROOT`. So the knowledge hook's worker-role skip (`packages/nana-knowledge/lib/hook.ts:160`) holds for a headless builder. Measured. This also answers FEAT-007's unprobed reviewer line about hook environment.
4. A claude waiting on network retries gained CPU in 11 of 11 five-second samples, from 0.64 s to 1.12 s over 55 s. Measured. So pi-watchdog's flat-CPU stall check cannot fire on a native claude. I infer it would also not fire while claude waits on a long tool run.
5. This Mac's user settings use `permissions.defaultMode: bypassPermissions`, so a headless claude here runs without prompts unless a tool is denied or absent. Measured.

## Design

Today `--lane-size larger` with a Claude Code `largerBuilder` is refused (R-1191). The seat then starts an Agent-tool subagent by hand after an advisory brief-check. The design deletes that refusal. pi-worker itself starts the Claude Code entry as a headless `claude -p` in the lane worktree, under the same lane checks, brief check, lock, ceiling, signals and build record as a pi builder. The brief check stops being advisory because the only builder route refuses before anything starts. The subagent route leaves the shared working pattern.

The parts, each with its subtraction test:

1. **Branch in pi-worker where R-1191 refused.** It runs after `checkBriefForLaunch` and roster resolution, so a refused brief is refused before the roster is read, exactly as for pi. It builds the claude argv: `CLAUDE_PRINT_FLAG`, `CLAUDE_MODEL_FLAG` and the entry's model, `--tools` and `--allowedTools` each followed by `CLAUDE_BUILDER_TOOLS`, `--strict-mcp-config`, `--append-system-prompt-file <prompt file>`, then the lane instruction as the prompt. The instruction text is the pi path's own sentence, defined once and used by both argv builders. The pi argv stays byte-identical. Without this branch there is no parity, so it stays.
2. **One composed prompt file.** It holds the rendered preamble, then the brief text, then the known-bug text when the check attached one, each separated by a blank line. That is pi's order of three appended prompts. It is written into the same `mkdtemp` folder as `preamble.md`, which is removed in the existing `finally`. pi takes file paths; claude takes one file. Putting the text on argv instead would break cmd.exe, which refuses `"`, `%`, `!` and line breaks (`packages/nana-pack/lib/win-command.mjs:54-57`). It stays.
3. **pi-watchdog launch injection: two lines.** `runOnce` calls `(opts.launch ?? piLaunch)(args, { cwd })` and spreads `launch.options` into `spawn`, as `review-ledger.mjs:149` already does. pi-worker passes `launch: (args, o) => reviewLaunch([CLAUDE_BIN, ...args], o)`. The resolver `packages/nana-pack/bin/review-launch.mjs` starts claude directly on POSIX. On win32 it searches PATH and PATHEXT, then starts a `.exe` directly and a `.cmd` through cmd.exe with `windowsVerbatimArguments`. pi-review passes no `launch`, so its path does not change. The alternative is to copy the ceiling, signal, process-group kill and attempt loop, so the injection stays.
4. **No stall stop for a Claude build.** pi-worker passes `stallSecs: CLAUDE_BUILDER_STALL_SECS` (Infinity). Then `maxFlat` is Infinity, the `cpu=` lines still print as a heartbeat, and the stop never fires. Probe 4 shows the check cannot fire on a native claude. On win32 a `.cmd` claude would leave cmd.exe as the watched pid: its CPU stays flat while node works, so the watchdog would kill a healthy build after `--stall-secs`. The 8-hour ceiling and signals still stop it. This removes a harm, so it stays.
5. **`--tools` + `--allowedTools`.** `--tools` makes only the listed built-ins exist, mapped one to one from pi's `read,grep,find,bash,edit,write`. No Agent tool means the preamble's "never start subagents" holds by construction. `--allowedTools` approves those tools on a machine whose permission mode would prompt; a prompt in `-p` mode is a denial. claude-review uses the same allow flag. Both stay.
6. **`--strict-mcp-config` with no `--mcp-config`.** The builder gets no MCP servers, like a pi builder. Without it, a builder in bypass mode can call every configured MCP tool, including the owner's Drive connector. It stays.
7. **Builder line.** Today's format string would print `undefined sonnet default`. It prints the `claude-code <model>` tokens `nana-roster` prints. It stays.
8. **Build record fields** (only once build-records is on main). Without a fix, the start record of a Claude build would lack `provider` and `thinking` (JSON drops `undefined`). It should hold `provider: "claude-code"`, the model and `thinking: null`. The cost stays null: build-records' matcher finds no pi session and names the folder. One row. build-records' D10 deferred "Claude Code subagent builds" to this lane.
9. **Docs.** The Larger lanes bullet sends both entry kinds through `pi-worker --lane-size larger`. The README's roster and lane-mode paragraphs and its brief-check lead-in change to match.

Dropped: a separate `claude-build.mjs` (duplicates lane validation, lock and records); a PreToolUse hook on Agent (a hook lane that must tell builders from research subagents); `brief-check --prompt-out` (still skippable); `--restricted` (ignores user settings, gates git and `$TMPDIR` writes unconfirmed); `--bare` (API key only); resolving npm claude's node entry (part 4 makes cmd.exe safe).

brief-check stays as the seat's dry run before a launch, with R-2585 unchanged. Only its README lead-in changes.

## Class

Ordinary. The lane changes pi-worker, two lines of pi-watchdog, worker-config, one new test file, two test edits, the shared template and AGENTS.md's marker region, the pack README and rows. It changes no nana-setup install, uninstall or doctor; no Claude Code hook and no pi extension; no gate policy; and no file of nana-land, pi-review, claude-review or review-round. The claim I expect to be read differently: pi-watchdog is pi-review's liveness module. If the seat counts it as part of pi-review, the class becomes gate, which adds the land reviewer and one independent check. Pair 16 guards pi-review's path either way.

## Threat model

Honest variation in our tools' output and machine state is in scope:
- a roster with any of the four Claude Code models in `largerBuilder`;
- claude as a POSIX symlink to a native binary, a Windows `claude.exe`, or an npm `claude.cmd`;
- user settings in bypass or default permission mode, with user MCP servers and hooks;
- briefs inside or outside the worktree, holding `"`, `%`, `!`, CRLF or no final newline;
- a feature with or without a known-bug file, and a brief with no `Feature:` line;
- claude missing from PATH, logged out, or exiting non-zero;
- a pre-existing lane lock, a long quiet tool run, and Ctrl-C or SIGTERM;
- Windows 8.3 and differently cased paths.

Deliberate forgery is out:
- a builder that reaches outside its tool list through Bash, or unsets its environment;
- a seat that starts an Agent-tool subagent by hand instead of pi-worker;
- a brief, roster or prompt file edited mid-launch;
- a hostile `claude` on PATH.

The public repo carries no owner name and nothing about the owner's work.

## Precedent

Precedent:
- packages/nana-pack/bin/pi-worker.mjs — lane checks, roster slot choice, the R-1191 refusal site this lane replaces, the preamble rendered into a `mkdtemp` folder removed in `finally`, the pi argv, `childEnv`, `acquireLaneLock`.
- packages/nana-pack/bin/pi-watchdog.mjs — `runOnce`'s single `piLaunch(args, { cwd })` call and its `spawn` options, the one injection point; `maxFlat` from `stallSecs`; the ceiling and signal handling reused unchanged.
- packages/nana-pack/bin/review-launch.mjs — resolves a non-pi command per platform; review-ledger's claude route.
- packages/nana-pack/bin/review-ledger.mjs — `spawn(..., { ...launch.options, ... })`, the options spread the watchdog adopts.
- packages/nana-pack/bin/claude-review.mjs — a headless Claude Code launch from a roster slot: runtime check, `-p --model`, tool flags, an env role.
- packages/nana-pack/lib/claude-review-config.mjs — `CLAUDE_BIN`, `CLAUDE_PRINT_FLAG`, `CLAUDE_MODEL_FLAG`, `CLAUDE_ALLOW_FLAG` with contract provenance; import them, never copy them.
- packages/nana-pack/bin/worker-config.mjs — home of the new builder values, beside `LANE_DEFAULTS.tools`, `CLAUDE_CODE_RUNTIME` and `LARGER_BUILDER_LABEL`.
- packages/nana-pack/lib/brief-precedent.mjs — `checkBriefForLaunch` and its `knownBugPath`, unchanged.
- packages/nana-pack/prompts/builder-preamble.md — the rules, rendered unchanged.
- packages/nana-pack/lib/win-command.mjs — `winCommand`'s refused characters and verbatim quoting.
- packages/nana-knowledge/lib/hook.ts — the worker-role skip that keeps the knowledge pull off.
- packages/nana-pack/tests/worker-lane.test.mjs — the lane harness (fixture repo, linked worktree, roster folders, spawn marker, lock path, prompt copies); its R-1191 check is retired.
- packages/nana-pack/tests/claude-review.test.mjs — `writeFakeClaude` (POSIX shebang, win32 `claude.cmd`) and R-2564's Windows-only case.
- packages/nana-pack/tests/brief-check.test.mjs — the equality pattern for "same line as brief-check".
- packages/nana-pack/tests/templates-render.test.mjs — the R-1193 bullet check this lane replaces, and the R-1213 and R-1214 checks it keeps.
- templates/_shared/working-under-nana-pi.md — the Larger lanes bullet.

After build-records lands, the build brief also lists `packages/nana-pack/lib/build-records.mjs` and `packages/nana-pack/tests/build-records.test.mjs`, the start record and its harness. The brief must not list them before they are tracked at the lane's HEAD.

## Must-meet rows (FEAT-006 unless noted)

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2646 | WHEN pi-worker lane mode receives `--lane-size larger` and the roster's larger-lane builder is a Claude Code entry, it shall start `claude` in the lane worktree while holding the worktree lock, with `-p`, `--model` and that entry's model, the sealed builder tool list after both `--tools` and `--allowedTools`, `--strict-mcp-config` and the fixed instruction naming the lane, in an environment holding `NANA_ROLE=worker` and `NANA_WORKTREE_ROOT` set to the worktree. | `packages/nana-pack/tests/worker-claude.test.mjs::R-2646: lane size larger starts a Claude Code larger-lane builder as claude -p with its model, the builder tools and no MCP servers, in the locked worktree` |
| R-2647 | WHEN pi-worker starts a Claude Code builder, it shall pass `--append-system-prompt-file` naming one file outside the worktree that holds the rendered builder preamble, then the brief's text, then the text of the known-bug file R-2581 selects when there is one, and remove that file once the builder ends. | `packages/nana-pack/tests/worker-claude.test.mjs::R-2647: the Claude Code builder's prompt file holds the rendered preamble, the brief and the feature's known bugs once each in that order, and is gone after the build` |
| R-2648 | WHEN the roster's larger-lane builder is a Claude Code entry, pi-worker shall run the brief precedent check before it takes the worktree lock or starts claude, printing the same refusal or launch line brief-check prints for that brief and worktree. | `packages/nana-pack/tests/worker-claude.test.mjs::R-2648: for a Claude Code builder a failing brief is refused with brief-check's line before the lock and claude, and a passing brief prints brief-check's launch line` |
| R-2649 | WHEN pi-worker lane mode starts a Claude Code larger-lane builder, the builder line R-1124 requires shall read `pi-worker: builder (larger lanes): claude-code <model>; source: <source>`. | `packages/nana-pack/tests/worker-claude.test.mjs::R-2649: a Claude Code larger-lane launch prints one builder line naming claude-code and its model before claude starts` |
| R-2650 | WHERE the platform is win32, WHEN PATH resolves `claude` to a `.cmd` shim, pi-worker shall start it through cmd.exe with the lane's claude arguments unchanged. | `packages/nana-pack/tests/worker-claude.test.mjs::R-2650: Windows: a claude.cmd larger-lane builder starts through cmd.exe with its arguments unchanged and a brief holding quotes, percent, bang and line breaks intact in its prompt file`; Windows-leg-only |
| R-2651 | WHILE pi-worker runs a Claude Code builder, it shall stop it only at the lane's wall-clock ceiling or on SIGINT, SIGTERM or SIGHUP, never for flat CPU time. | `packages/nana-pack/tests/worker-claude.test.mjs::R-2651: a Claude Code builder whose CPU stays flat past the stall limit runs to its end, and the ceiling and SIGTERM still stop it` |
| R-2652 (FEAT-014, listed in FEAT-006's Also applies) | The shared working pattern's Larger lanes bullet shall state that a seat starts the roster's larger-lane builder, a pi entry or a Claude Code entry, through `pi-worker --lane-size larger`, and a small lane through `pi-worker --lane-size small`. | `packages/nana-pack/tests/templates-render.test.mjs::R-2652: the shared working pattern starts the larger-lane builder, pi or Claude Code, through pi-worker --lane-size larger and a small lane through --lane-size small` |
| R-2653 | WHEN pi-worker appends the start record of a Claude Code build, the record shall hold provider `claude-code`, the entry's model and a null thinking. | `packages/nana-pack/tests/build-records.test.mjs::R-2653: a Claude Code build's start record names provider claude-code, its model and a null thinking` |

The seal test names R-2646, R-2647 and R-2651: `packages/nana-pack/tests/worker-claude.test.mjs::seal: a Claude Code builder uses --tools, --allowedTools and --strict-mcp-config, tools Read,Grep,Glob,Bash,Edit,Write, --append-system-prompt-file and no stall stop`. It compares the imported names with literals.

Retired:
- R-1191: "retired: R-2646 starts the Claude Code entry instead of refusing it".
- R-1193: "retired: R-2652 routes both entry kinds through pi-worker".

R-2654 and R-2655 stay free.

### What each test does, and why it is red on main

The new file follows worker-lane's harness: a fixture repo with a linked worktree on `feat/alpha`, a temp HOME and USERPROFILE, and a temp `PI_CODING_AGENT_DIR` whose roster has a pi `builder` and `largerBuilder: {runtime: "claude-code", model: "fable"}`. `fable` is chosen so that a fixed `sonnet` fails. A fake claude goes first on PATH, following `writeFakeClaude`: a POSIX shebang script, or `claude.cmd` on win32. It records argv, cwd, `NANA_ROLE`, `NANA_WORKTREE_ROOT`, `NANA_HANDOFF` and whether the lane lock exists. It copies the file after `--append-system-prompt-file`, then writes a fixed report. A fake pi writes a spawn marker that must never appear. Every case has a per-case time limit, and assertions import config names. Every case injects its platform, or skips by name off its platform.

- **R-2646.** One build, exit 0. The fake ran once with `-p`, and with `--model fable`, `--tools <list>`, `--allowedTools <list>`, `--strict-mcp-config` and `--append-system-prompt-file <path>` each exactly once. The prompt is the lane instruction naming `alpha`, followed by the watchdog's `--name pi-worker-a1-…`. There is no `--provider`, `--thinking` or `-t`. The fake's cwd is the lane root as a real path. The environment holds `NANA_ROLE=worker`, `NANA_WORKTREE_ROOT=<lane>` and `NANA_HANDOFF=off`. The lock existed during the run and is gone after. `--out` holds the fake's report, and there is no pi marker. Red on main: R-1191 refuses with exit 1.
- **R-2647.** Two builds. The first brief carries `Feature: FEAT-006`, and the fixture commits `docs/known-bugs/FEAT-006.md` and `unplaced.md`. Its copy holds the rendered preamble (worktree and branch filled in, no `{{`), then the brief text, then FEAT-006's text, each once and in order. The second brief has no Feature line: its copy holds no known-bug or unplaced text. In both builds the recorded path lies outside the worktree and no longer exists after exit, and `git status --porcelain` in the worktree is empty. A CRLF brief with no final newline keeps its bytes. Red on main: refused, so no file.
- **R-2648.** Five briefs: no Precedent section, an empty section, a reasonless `none:`, an entry not tracked at HEAD, and a passing brief. For each, the line pi-worker prints with the Claude roster equals the line `brief-check.mjs --brief <b> --tree <lane>` prints, and the exit codes match. A refused brief leaves no lock, no fake record and no pi marker. The passing brief prints the launch line and the fake runs. Red on main: R-1191 refuses the passing brief and its launch line is missing.
- **R-2649.** There is exactly one `pi-worker: builder` line. It equals `pi-worker: builder (larger lanes): claude-code fable; source: <roster file>`, contains no `undefined`, and precedes `[pi-worker] attempt 1/1`. Red on main: refused.
- **R-2650.** Windows leg only; elsewhere it prints SKIP. The fake `claude.cmd` records argv: the tool list with its commas, the instruction sentence and the temp prompt path all arrive unchanged. The prompt copy keeps the brief's `"`, `%`, `!` and CRLF bytes. Red on main: refused.
- **R-2651.** A fake that sleeps 3 s with flat CPU, run with `--stall-secs 1 --poll 0.2`, exits 0: its report is kept and no STALL line appears. A fake that sleeps past `--max-secs 1` ends FAILED with the ceiling line and its process group gone. On POSIX, SIGTERM sent once the fake has started gives exit 143 and the abort line; this case is skipped on win32. Red on main: refused.
- **R-2652.** There is one Larger lanes bullet in `templates/_shared/working-under-nana-pi.md`. It matches the new routing in order, holds no `subagent`, and keeps R-1213's and R-1214's sentences. Red on main: the bullet routes a Claude Code entry to a subagent.
- **R-2653.** This case uses build-records' harness. A Claude roster build's start line holds `provider: "claude-code"`, `model: "fable"`, `thinking: null` and `slot: "largerBuilder"`, and its end line pairs with it. Red on main after build-records: R-1191 refuses before the lock, so no record exists.

Existing tests the change makes false (listed edits, not new tests):
- worker-lane's R-1191 check `lane size larger refuses a Claude Code larger-lane builder before lock or spawn, …` is deleted, and R-2646 replaces it.
- templates-render's R-1193 check is replaced by R-2652's.

## Tunables (packages/nana-pack/bin/worker-config.mjs)

- `CLAUDE_BUILDER_TOOLS` = `Read,Grep,Glob,Bash,Edit,Write`. Chosen 2026-10-22: pi's sealed builder tools mapped one to one (find becomes Glob), with no Agent, web or notebook tool. Sealed.
- `CLAUDE_TOOLS_FLAG` = `--tools` and `CLAUDE_STRICT_MCP_FLAG` = `--strict-mcp-config`. Contract: Claude Code 2.1.299 `claude --help`, read 2026-10-22. Sealed.
- `CLAUDE_APPEND_PROMPT_FILE_FLAG` = `--append-system-prompt-file`. Contract, measured 2026-10-22 (probe 1): `--help` does not list it, the `--bare` text names it, and a missing file gets claude's own not-found error. Sealed.
- `CLAUDE_BUILDER_STALL_SECS` = `Infinity`. Measured 2026-10-22 (probe 4); chosen: no flat-CPU stop for a Claude build (R-2651). Sealed.
- `CLAUDE_BUILDER_PROMPT_FILE` = `builder-prompt.md`. Chosen: it sits beside `preamble.md` in the lane's temp folder. Not sealed.
- Imported, never copied: `CLAUDE_BIN`, `CLAUDE_PRINT_FLAG`, `CLAUDE_MODEL_FLAG`, `CLAUDE_ALLOW_FLAG` (claude-review-config.mjs); `CLAUDE_CODE_RUNTIME`, `LARGER_BUILDER_LABEL`, `LANE_SIZE_SLOTS`, `LANE_MAX_SECS`.

Module headers to update: pi-worker (`@inputs` and `@outputs` name the claude launch, `@effects` names spawning pi or claude), pi-watchdog (`@inputs` names the optional launch), worker-config (`@outputs`). The new test file carries the six-tag header. The claude launch is injected at the watchdog boundary, and `reviewLaunch` already takes platform, env and probes.

## Wrong-code pairs (the seat runs each; each must turn its test red)

1. R-1191's refusal kept → R-2646 (and every other new Claude test).
2. The Claude entry handed to pi (runtime ignored, no `launch` injected) → R-2646.
3. `--tools`, `--allowedTools` or `--strict-mcp-config` dropped, one run each → R-2646 and the seal.
4. The model taken from the small builder slot, or fixed at `sonnet` → R-2646.
5. The child environment built fresh, without `NANA_ROLE` or `NANA_WORKTREE_ROOT` → R-2646.
6. The preamble missing from the prompt file, or left unrendered → R-2647.
7. Known bugs placed before the brief, or `unplaced.md` used as a fallback → R-2647.
8. The prompt file written into the worktree, or left after exit → R-2647.
9. The prompt passed as argv text (`--append-system-prompt <text>`) → R-2647, and R-2650 on Windows.
10. The Claude branch placed before `checkBriefForLaunch` → R-2648.
11. The builder line built from pi tokens (`undefined fable default`) → R-2649.
12. `launch.options` not spread into `spawn` (cmd.exe re-quoted) → R-2650 (Windows leg).
13. The seat's `--stall-secs` passed through for a Claude build → R-2651.
14. The start record built from `builder.provider` and `builder.thinking` (keys dropped) → R-2653.
15. The bullet keeps the subagent route → R-2652.
16. pi-watchdog's default launch removed (a launch required) → existing worker-lane R-1190 tests and win32-launch's R-1125 lane test.

## Known limits (the seat writes them to FEAT-006's known-bug file before the final round)

- The Claude builder runs with the user's Claude Code config: user and project CLAUDE.md rules, the SessionStart hooks, the verifier-pipe hook, auto-memory and the user's permission mode, the same as claude-review's reviewer. Only the knowledge pull is off (probe 3).
- No worktree edit gate: pi's gate refuses edit and write targets outside `NANA_WORKTREE_ROOT`, and Claude Code has no such gate. Bash can write anywhere for both.
- No stall stop: a hung claude ends at the 8-hour ceiling or on a signal, and `--stall-secs` has no effect on a Claude build.
- The build record's cost is null for a Claude build. claude's `--output-format json` cost belongs to a later lane.
- Only `largerBuilder`; the `builder` slot stays pi-only.
- Windows: the tool list has no PowerShell (claude-review has the same gap). Whether Claude Code's Bash needs Git Bash there is inferred. No real claude has built a lane on Windows; CI uses a fake `claude.cmd`, and the `claude.exe` route is not run end to end.
- `--append-system-prompt-file` is unlisted in 2.1.299's help. A claude without it fails the build at start, with claude's error in the output. Unknown names in `--tools` may be ignored silently; this is inferred, and the seat's smoke run checks it.
- The roster notice still marks a Claude Code entry `(Claude Code only)`. It now describes the runtime, not which seat can start it. Changing it is a hook lane.
- Advisory by load path: a seat can still start an Agent-tool subagent by hand, as it can start pi by hand.
- Other projects' AGENTS.md marker regions keep the old bullet until `nana-setup project` refreshes them. The drift notice reports this.
- The pi trust notice also prints for a Claude build. `--strict-mcp-config` dropping claude.ai connectors is inferred, not probed.

## Docs that change

- `packages/nana-pack/README.md`, three places:
  - the lane-mode paragraph: a Claude Code `largerBuilder` starts `claude -p` with the listed flags, the composed prompt file, and no stall stop;
  - the roster paragraph: "pi-worker passes it to `claude --model`" replaces "the Claude Code seat's Agent tool";
  - the brief-check lead-in: "to check a brief without starting a builder".
- `templates/_shared/working-under-nana-pi.md` Larger lanes bullet, and the same text in AGENTS.md's marker region: "…a seat builds a larger or riskier lane with it through `pi-worker --lane-size larger`, a pi entry or a Claude Code entry alike; a small lane goes through `pi-worker --lane-size small`. A seat that cannot start that builder stops and asks the user rather than starting another. With no `largerBuilder`, the builder builds every lane."
- `REQUIREMENTS.md`: R-2646 to R-2651 and R-2653 in FEAT-006; R-2652 in FEAT-014 beside R-1213, and added to FEAT-006's Also applies; R-1191 and R-1193 retired as above.
- `docs/requirements-tree.md` and `docs/code-map.md` regenerated.
- Seat notes: close FEAT-006's line "Precedent check (precedent-first, plan): a Claude Code subagent builder gets only what the seat runs…"; add the known limits; update FEAT-007's "Nobody has probed it" hook-environment line with probe 3. Add the HANDOFF Landed line and the session entry.
- Unchanged: nana-setup, every hook and extension, the roster schema (`CLAUDE_CODE_SLOTS`), the roster notice, claude-review, review-ledger, pi-review, review-round, the builder preamble, brief-check.

## Seat steps

1. Cut `feat/claude-code-builder-parity` from main after build-records lands. Both lanes edit pi-worker heavily, and R-2653 needs the records. If build-records is still open, wait.
2. Run one adversary pass on this draft, then commit the must-meet of record and build brief 1 in the lane. The brief carries `Feature: FEAT-006 · Launch builders with execution limits` and a Precedent section. Run `brief-check.mjs` on it.
3. Build with the roster's larger builder: `pi-worker --lane claude-code-builder-parity --brief … --out … --lane-size larger`.
4. Seat checks on the build tip:
   - the touched test files: worker-claude, worker-lane, templates-render, build-records, review-ledger, win32-launch, claude-review, brief-check;
   - `npm run test:locked`, `map:check`, the readme check and the trace;
   - `node scripts/requirements-moved.mjs --root . --base main`, carried into the review brief and the land.
5. Run one real-claude smoke on macOS, entirely in OS temp:
   - Set up a fixture repo and worktree on `feat/smoke`, plus a temp `PI_CODING_AGENT_DIR` whose roster has `largerBuilder` claude-code haiku. The real HOME stays, for login.
   - The brief asks the builder to commit one file, to quote the first line of its builder rules and the fixture known-bug line, and to name every tool it has.
   - Expect exit 0, the commit, both quotes, the `claude-code haiku` builder line, and no Agent, web or MCP tool in the list.
   - Keep the output in the lane folder. The cost is a few cents (inferred), and claude writes its session under the real `~/.claude/projects`.
6. Run the 16 wrong-code pairs through the mutation runner.
7. Run CI on a draft PR. R-2650 needs the Windows leg green.
8. Write the notes (step 2's known limits, the closed bug line, HANDOFF and the session entry) before the final round.
9. Run one final reviewer on the exact tip through claude-review (Opus). The builder is pi sol, so the reviewer is a different lineage.

## Open questions to the owner

1. **Retire the subagent route?** A Claude Code builder becomes a headless `claude -p` that pi-worker starts. It gets the enforced brief check, the rules, the known bugs, the lock, the ceiling and a build record, and a pi seat can start one too. The cost: the seat no longer sees the builder inside its own session, and the report arrives at the end, as with pi builds. The owner approved the subagent route on 2026-10-16. Default: **yes**.
2. **Let the small `builder` slot hold a Claude Code entry too?** The 2026-10-19 power mode used Sonnet subagents for simple lanes outside the roster. Default: **later**.
