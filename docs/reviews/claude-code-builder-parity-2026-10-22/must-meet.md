# claude-code-builder-parity · must-meet of record (seat, 2026-10-22)

Feature: FEAT-006 · Launch builders with execution limits

Written by the seat from the planner's draft (`plan-draft.md`) and one adversary pass (`plan-attack.md`), then amended on 2026-10-23 for the settings carry from three more passes (`proxy-measure.md`, `proxy-docs.md`, `proxy-verdict.md`). All are kept in this folder. Plans get no review round. Where this file and those differ, this file holds.

Spend line: the owner's 2026-10-22 power-mode pick, "Claude Code builder parity — A Claude Code builder gets the builder rules and known bugs, and its brief check stops being advisory."

Stakes: medium blast, reversible. Every lane launch and every pi review loads the changed pi-watchdog; pi's argv stays byte-identical and existing tests pin it. Reverting means a pi entry in `largerBuilder`.

## Seat decisions on the attack

- **Route.** pi-worker starts a Claude Code `largerBuilder` itself, as a headless `claude -p` in the lane worktree, under the same brief check, lock, ceiling, signals and build record as a pi builder. The Agent-tool subagent route leaves the shared working pattern. The planner's open question 1 ("retire the subagent route?") carried the default yes. The owner approved this route on 2026-10-23, with one constraint: a builder must still log in and reach the model on a machine whose Claude Code settings hold its proxy.
- **Small slot.** Question 2 ("Claude Code in the small `builder` slot?") takes its default: later.
- **M1 adopted.** `--permission-mode default`, sealed. Without it, a machine with no `defaultMode` runs auto mode and sends Bash to a classifier; `plan` mode edits nothing and exits 0.
- **S1 adopted.** Class: gate. Precedent: watchdog-exit and win-watchdog-cpu-read were both classed gate for a pi-watchdog change, because pi-review runs `runOnce`. Ladder: Opus final reviewer, astra land reviewer, the seat's wrong-code pairs, one independent check. No install check: no hook, extension or nana-setup file changes.
- **S2 adopted.** `--setting-sources project,local` and `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`. The builder keeps the project CLAUDE.md (AGENTS.md) and loses the seat's user rules, user hooks and auto-memory, like a pi builder. The owner's constraint changes the trade: see **Settings carry** below.
- **S3 adopted.** R-2646's test asserts the whole argv in order, with the temp path and the `--name` suffix matched by pattern.
- **S4.** The roster notice keeps "(Claude Code only)"; a known-limit line names R-1213 and the disagreement. Changing it is a hook lane.
- **S5 adopted.** The seat's smoke drops the tool self-report. A fake-endpoint capture records the real tools array, system prompt and permission mode; one real-claude smoke checks login, a commit and one Bash command over 120 s.
- **S6 adopted.** The child env sets `BASH_DEFAULT_TIMEOUT_MS` and `BASH_MAX_TIMEOUT_MS` to one chosen builder value, so the builder's own locked suite run is not moved to the background and stopped.
- **N5 adopted.** R-2651 narrowed to the ceiling and SIGTERM; R-1124 reworded with R-2649; pair 3 loses "and the seal"; pair 10 rewritten.
- **N6, N7.** Known-bug lines, not fixes: pi-named failure lines for a claude failure (FEAT-006); claude-review has none of these switches (FEAT-007).

## Must-meet rows (FEAT-006 unless noted)

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2646 | WHEN pi-worker lane mode receives `--lane-size larger` and the roster's larger-lane builder is a Claude Code entry, it shall start `claude` in the lane worktree while holding the worktree lock, with exactly this argv in order: `-p`, `--model` and that entry's model, `--permission-mode default`, `--setting-sources project,local`, `--strict-mcp-config`, `--tools` and `--allowedTools` each followed by the sealed builder tool list, `--append-system-prompt-file` and its path, then the fixed instruction naming the lane, in an environment holding `NANA_ROLE=worker` and `NANA_WORKTREE_ROOT` set to the worktree. | `packages/nana-pack/tests/worker-claude.test.mjs::R-2646: lane size larger starts a Claude Code larger-lane builder as claude -p with its model, default permission mode, project settings only, no MCP servers and the builder tools, in the locked worktree` |
| R-2647 | WHEN pi-worker starts a Claude Code builder, it shall pass `--append-system-prompt-file` naming one file outside the worktree that holds the rendered builder preamble, then the brief's text, then the text of the known-bug file R-2581 selects when there is one, and remove that file once the builder ends. | `packages/nana-pack/tests/worker-claude.test.mjs::R-2647: the Claude Code builder's prompt file holds the rendered preamble, the brief and the feature's known bugs once each in that order, and is gone after the build` |
| R-2648 | WHEN the roster's larger-lane builder is a Claude Code entry, pi-worker shall run the brief precedent check before it takes the worktree lock or starts claude, printing the same refusal or launch line brief-check prints for that brief and worktree. | `packages/nana-pack/tests/worker-claude.test.mjs::R-2648: for a Claude Code builder a failing brief is refused with brief-check's line before the lock and claude, and a passing brief prints brief-check's launch line` |
| R-2649 | WHEN pi-worker lane mode starts a Claude Code larger-lane builder, the builder line R-1124 requires shall read `pi-worker: builder (larger lanes): claude-code <model>; source: <source>`. | `packages/nana-pack/tests/worker-claude.test.mjs::R-2649: a Claude Code larger-lane launch prints one builder line naming claude-code and its model before claude starts` |
| R-2650 | WHERE the platform is win32, WHEN PATH resolves `claude` to a `.cmd` shim, pi-worker shall start it through cmd.exe with the lane's claude arguments unchanged. | `packages/nana-pack/tests/worker-claude.test.mjs::R-2650: Windows: a claude.cmd larger-lane builder starts through cmd.exe with its arguments unchanged and a brief holding quotes, percent, bang and line breaks intact in its prompt file` (Windows leg only) |
| R-2651 | WHILE pi-worker runs a Claude Code builder, it shall not stop it for flat CPU time; the lane's wall-clock ceiling and SIGTERM still stop it. | `packages/nana-pack/tests/worker-claude.test.mjs::R-2651: a Claude Code builder whose CPU stays flat past the stall limit runs to its end, and the ceiling and SIGTERM still stop it` |
| R-2652 (FEAT-014, in FEAT-006's Also applies) | The shared working pattern's Larger lanes bullet shall state that a seat starts the roster's larger-lane builder, a pi entry or a Claude Code entry, through `pi-worker --lane-size larger`, and a small lane through `pi-worker --lane-size small`. | `packages/nana-pack/tests/templates-render.test.mjs::R-2652: the shared working pattern starts the larger-lane builder, pi or Claude Code, through pi-worker --lane-size larger and a small lane through --lane-size small` |
| R-2653 | WHEN pi-worker appends the start record of a Claude Code build, the record shall hold provider `claude-code`, the entry's model and a null thinking. | `packages/nana-pack/tests/build-records.test.mjs::R-2653: a Claude Code build's start record names provider claude-code, its model and a null thinking` |
| R-2654 | WHEN pi-worker starts a Claude Code builder, the child environment shall also hold `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`, and `BASH_DEFAULT_TIMEOUT_MS` and `BASH_MAX_TIMEOUT_MS` both set to the sealed builder Bash limit. | `packages/nana-pack/tests/worker-claude.test.mjs::R-2654: a Claude Code builder runs with auto-memory off and the builder Bash limit as both Bash time limits` |

Seal test (names R-2646, R-2651, R-2654 and R-2655): `packages/nana-pack/tests/worker-claude.test.mjs::seal: a Claude Code builder uses default permission mode, project and local settings, a carried settings file, no MCP servers, tools Read,Grep,Glob,Bash,Edit,Write, a prompt file, no stall stop, auto-memory off and the builder Bash limit`. It compares the imported names with literals.

Reworded: R-1124 — `<provider> <model> <thinking>` becomes "the entry's runtime tokens", with R-2649 named for a Claude Code entry. Its tests stay.

Retired:
- R-1191: "retired: R-2646 starts the Claude Code entry instead of refusing it".
- R-1193: "retired: R-2652 routes both entry kinds through pi-worker".

R-2655, R-2664 and R-2665 belong to the settings carry below; R-2656 to R-2663 belong to shared-helpers.

## What each test does (from the draft, with the seat's changes)

The new file follows worker-lane's harness: a fixture repo with a linked worktree on `feat/alpha`, a temp HOME and USERPROFILE, a temp `PI_CODING_AGENT_DIR` whose roster has a pi `builder` and `largerBuilder: {runtime: "claude-code", model: "fable"}` (`fable`, so a fixed `sonnet` fails). A fake claude goes first on PATH, following claude-review's `writeFakeClaude` (POSIX shebang script, or `claude.cmd` on win32). It records argv, cwd, the environment names the rows list, and whether the lane lock exists; copies the file after `--append-system-prompt-file`; writes a fixed report. A fake pi writes a spawn marker that must never appear. Per-case time limits; assertions import config names; every case injects its platform or skips by name off it.

- **R-2646.** One build, exit 0. The fake ran once; its argv equals the row's sequence (JSON equality, as R-2560 does), the temp path and the watchdog's `--name pi-worker-a1-…` suffix matched by pattern. No `--provider`, `--thinking` or `-t`. cwd is the lane root as a real path. Env holds `NANA_ROLE=worker`, `NANA_WORKTREE_ROOT=<lane>`, `NANA_HANDOFF=off`. The lock existed during the run and is gone after. `--out` holds the fake's report; no pi marker. Red on main: R-1191 refuses.
- **R-2647.** Two builds. The first brief carries `Feature: FEAT-006`; the fixture commits `docs/known-bugs/FEAT-006.md` and `unplaced.md`. Its copy holds the rendered preamble (worktree and branch filled in, no `{{`), then the brief, then FEAT-006's text, each once, in order. The second brief has no Feature line: no known-bug or unplaced text. In both, the path lies outside the worktree and is gone after exit; `git status --porcelain` in the worktree is empty. A CRLF brief with no final newline keeps its bytes.
- **R-2648.** Five briefs: no Precedent section, an empty one, a reasonless `none:`, an entry not tracked at HEAD, and a passing brief. Each line and exit code equals `brief-check.mjs --brief <b> --tree <lane>`'s. A refused brief leaves no lock, no fake record and no pi marker. The passing brief prints the launch line and the fake runs.
- **R-2649.** Exactly one `pi-worker: builder` line, equal to `pi-worker: builder (larger lanes): claude-code fable; source: <roster file>`, no `undefined`, before `[pi-worker] attempt 1/1`.
- **R-2650.** Windows leg only; SKIP elsewhere. The fake `claude.cmd` records argv: the comma list, `project,local`, the instruction and the temp path arrive unchanged; the prompt copy keeps `"`, `%`, `!` and CRLF bytes.
- **R-2651.** A fake that sleeps 3 s with flat CPU under `--stall-secs 1 --poll 0.2` exits 0, report kept, no STALL line. A fake past `--max-secs 1` ends FAILED with the ceiling line and its process group gone. On POSIX, SIGTERM once the fake has started gives exit 143 and the abort line; skipped on win32 by name.
- **R-2652.** One Larger lanes bullet in `templates/_shared/working-under-nana-pi.md`, matching the new routing in order, no `subagent`, R-1213's and R-1214's sentences kept.
- **R-2653.** build-records' harness: a Claude roster build's start line holds `provider: "claude-code"`, `model: "fable"`, `thinking: null`, `slot: "largerBuilder"`, and its end line pairs with it.
- **R-2654.** The fake records `CLAUDE_CODE_DISABLE_AUTO_MEMORY`, `BASH_DEFAULT_TIMEOUT_MS` and `BASH_MAX_TIMEOUT_MS`; they equal `1` and the imported limit, as strings. A seat env that sets `BASH_DEFAULT_TIMEOUT_MS` to another value is overridden.

Existing tests the change makes false (listed edits, not new tests): worker-lane's R-1191 check is deleted (R-2646 replaces it); templates-render's R-1193 check is replaced by R-2652's.

## Tunables (packages/nana-pack/bin/worker-config.mjs)

- `CLAUDE_BUILDER_TOOLS` = `Read,Grep,Glob,Bash,Edit,Write`. Chosen 2026-10-22: pi's sealed builder tools mapped one to one, no Agent, web or notebook tool. Sealed.
- `CLAUDE_TOOLS_FLAG` = `--tools`, `CLAUDE_STRICT_MCP_FLAG` = `--strict-mcp-config`, `CLAUDE_PERMISSION_MODE_FLAG` = `--permission-mode`, `CLAUDE_SETTING_SOURCES_FLAG` = `--setting-sources`. Contract: Claude Code 2.1.299 `claude --help`, read 2026-10-22. Sealed.
- `CLAUDE_BUILDER_PERMISSION_MODE` = `default`. Measured 2026-10-22 (attack M1): no `defaultMode` runs auto mode, `plan` edits nothing; `default` with the allowed tools runs every builder command. Sealed.
- `CLAUDE_BUILDER_SETTING_SOURCES` = `project,local`. Measured 2026-10-22 (attack S2): drops user rules, hooks and memory paths, keeps the project CLAUDE.md. Sealed.
- `CLAUDE_APPEND_PROMPT_FILE_FLAG` = `--append-system-prompt-file`. Contract, measured 2026-10-22: unlisted in `--help`, named in the `--bare` text, a missing file gets claude's own error. Sealed.
- `CLAUDE_BUILDER_STALL_SECS` = `Infinity`. Measured 2026-10-22 (draft probe 4, attack N1): flat-CPU stop does not fire on a native claude, even on a hung request. Sealed.
- `CLAUDE_BUILDER_CHILD_ENV` = `{ CLAUDE_CODE_DISABLE_AUTO_MEMORY: "1" }`. Measured 2026-10-22 (attack S2). Sealed.
- `CLAUDE_BUILDER_BASH_LIMIT_MS` = `3600000`. Chosen 2026-10-22: one locked suite measured 455.9 s here and can wait for one other suite (about 912 s); an hour leaves room, and the lane ceiling still bounds the build. Sealed (pinned by the seal test).
- `CLAUDE_BUILDER_PROMPT_FILE` = `builder-prompt.md`. Chosen: beside `preamble.md` in the lane's temp folder. Not sealed.
- Imported, never copied: `CLAUDE_BIN`, `CLAUDE_PRINT_FLAG`, `CLAUDE_MODEL_FLAG`, `CLAUDE_ALLOW_FLAG` (claude-review-config.mjs); `CLAUDE_CODE_RUNTIME`, `LARGER_BUILDER_LABEL`, `LANE_SIZE_SLOTS`, `LANE_MAX_SECS`.

## Wrong-code pairs (seat; each must turn its test red)

1. R-1191's refusal kept → R-2646 (and every other new Claude test).
2. The Claude entry handed to pi (runtime ignored, no `launch` injected) → R-2646.
3. `--tools`, `--allowedTools` or `--strict-mcp-config` dropped, one run each → R-2646.
4. The model taken from the small builder slot, or fixed at `sonnet` → R-2646.
5. The child environment built fresh, without `NANA_ROLE` or `NANA_WORKTREE_ROOT` → R-2646.
6. The preamble missing from the prompt file, or left unrendered → R-2647.
7. Known bugs placed before the brief, or `unplaced.md` used as a fallback → R-2647.
8. The prompt file written into the worktree, or left after exit → R-2647.
9. The prompt passed as argv text (`--append-system-prompt <text>`) → R-2647, and R-2650 on Windows.
10. The refusal skipped when the resolved `largerBuilder` is Claude Code → R-2648.
11. The builder line built from pi tokens (`undefined fable default`) → R-2649.
12. `launch.options` not spread into `spawn` (cmd.exe re-quoted) → R-2650 (Windows leg).
13. The seat's `--stall-secs` passed through for a Claude build → R-2651.
14. The start record built from `builder.provider` and `builder.thinking` → R-2653.
15. The bullet keeps the subagent route → R-2652.
16. pi-watchdog's default launch removed (a launch required) → existing worker-lane R-1190 tests and win32-launch's R-1125 lane test.
17. `--permission-mode default` dropped → R-2646.
18. `--setting-sources project,local` dropped → R-2646.
19. The instruction placed right after the `--allowedTools` list (before a non-variadic flag) → R-2646.
20. `CLAUDE_CODE_DISABLE_AUTO_MEMORY` left out of the child env → R-2654.
21. The seat's `BASH_DEFAULT_TIMEOUT_MS` passed through instead of the builder limit → R-2654.

## Known limits (seat writes them to FEAT-006's known-bug file before the final round)

- The builder gets the project CLAUDE.md but no user settings: user `env` (Bedrock, Vertex, a proxy) and `apiKeyHelper` are lost, so such a machine fails at start with claude's auth error. The objective that a pi builder's extension supplies does not reach it.
- No worktree edit gate: pi's gate refuses edit and write targets outside `NANA_WORKTREE_ROOT`; Claude Code has no such gate. Bash can write anywhere for both.
- No stall stop: a hung claude ends at the 8-hour ceiling or on a signal; measured not to fire on a hung request. `--stall-secs` has no effect; the heartbeat prints `flat=n/Infinity`.
- The build record's cost is null for a Claude build.
- Only `largerBuilder`; the `builder` slot stays pi-only.
- The seat cannot continue a Claude builder with SendMessage; a follow-up is a new build brief, as with pi.
- Windows: the tool list has no PowerShell (claude-review has the same gap); no real claude has built a lane on Windows; CI uses a fake `claude.cmd`.
- `--append-system-prompt-file` is unlisted in 2.1.299's help; a claude without it fails at start. Unknown `--tools` names are dropped silently (measured); the seal test is the guard.
- The roster notice still marks a Claude Code entry "(Claude Code only)", which now disagrees with R-1213's "a seat that cannot start that builder stops and asks". Changing it is a hook lane.
- A missing or failing claude prints pi-named lines (`pi spawn failed`, `pi launch refused`, "endpoint likely in a bad stretch").
- Advisory by load path: a seat can still start an Agent-tool subagent by hand, as it can start pi by hand.
- Other projects' AGENTS.md marker regions keep the old bullet until `nana-setup project` refreshes them; the drift notice reports this.
- FEAT-007: claude-review's reviewer gets none of these switches (permission mode, setting sources, MCP, auto-memory).

## Docs that change

- `packages/nana-pack/README.md`: the lane-mode paragraph (a Claude Code `largerBuilder` starts `claude -p` with the listed flags, the composed prompt file, the child env and no stall stop); the roster paragraph ("pi-worker passes it to `claude --model`"); the brief-check lead-in ("to check a brief without starting a builder").
- `templates/_shared/working-under-nana-pi.md` Larger lanes bullet and AGENTS.md's marker region: "…a seat builds a larger or riskier lane with it through `pi-worker --lane-size larger`, a pi entry or a Claude Code entry alike; a small lane goes through `pi-worker --lane-size small`. A seat that cannot start that builder stops and asks the user rather than starting another. With no `largerBuilder`, the builder builds every lane."
- `REQUIREMENTS.md`: the rows above; R-1124 reworded; R-1191 and R-1193 retired.
- Module headers: pi-worker, pi-watchdog (`@inputs` names the optional launch), worker-config, review-launch (`@purpose` "Resolve a review command" → a non-pi command); the `pi-worker.mjs` comment citing R-1193.
- `docs/requirements-tree.md` and `docs/code-map.md` regenerated.
- Seat notes: close FEAT-006's "a Claude Code subagent builder gets only what the seat runs" line; add the known limits; HANDOFF and session entry.

## Seat steps

1. Cut `feat/claude-code-builder-parity` from main after build-records lands (both edit pi-worker; R-2653 needs the records).
2. Commit this must-meet, the draft, the attack and build brief 1 in the lane. Run brief-check.
3. Build with the roster's larger builder (`pi-worker --lane-size larger`).
4. Seat checks on the tip: the touched test files (worker-claude, worker-lane, templates-render, build-records, review-ledger, win32-launch, claude-review, brief-check), `npm run test:locked`, map, readme, trace, `requirements-moved --base main`.
5. Fake-endpoint capture on the tip (tools array, system prompt, permission mode; no model). One real-claude smoke on macOS in temp folders with a `haiku` roster: exit 0, a commit, one Bash command over 120 s, the `claude-code haiku` builder line. Outputs scrubbed into the lane folder.
6. Run the 34 pairs through the mutation runner. The lane changes pi-watchdog, which the runner does not import, so the lane's own runner may judge them.
7. Draft PR CI; R-2650 needs the Windows leg green.
8. Notes before the final round.
9. Opus final review (claude-review), astra land review (pi-review), one independent check.

## Settings carry (amendment, 2026-10-23)

Why: `--setting-sources project,local` drops the user settings file, and with it any proxy, CA, key or login helper kept there. From a pi seat or a terminal the builder then cannot reach the model (measured). Two more facts came out of the probes. First, the worktree's own `.claude/settings.json` env and the `env` in `~/.claude.json` both survive `--setting-sources` and beat the process env, so they turned auto-memory back on (measured a1, a9). Second, a `--settings` file beats both (measured a2, a10).

Decision (verdict option iii): pi-worker always writes one settings file beside the prompt file and passes it with `--settings`. The file holds only an allowlist taken from the user settings file, then the sealed builder env written last. Nothing else from the user file goes in. Every miss fails at start with claude's own message.

- **Source.** `settings.json` in `CLAUDE_CONFIG_DIR` when that is set and not empty, else in `.claude` under the home folder (measured q7). Read once with `json-text.mjs`'s `parseJsonBytes`. `CLAUDE_CONFIG_DIR` stays in the child env unchanged and is never written into the file.
- **Carry keys** (sealed): `apiKeyHelper`, `awsCredentialExport`, `proxyAuthHelper`. Measured to work only when carried (q4, a7, a8, extra-pah).
- **Carry env names** (sealed, 17, matched without regard to case, spelling kept): `HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY`, `ALL_PROXY`, `CLAUDE_CODE_PROXY_RESOLVES_HOSTS`, `CLAUDE_CODE_PROXY_AUTH_HELPER_TTL_MS`, `CLAUDE_CODE_ENABLE_PROXY_AUTH_HELPER`, `NODE_EXTRA_CA_CERTS`, `CLAUDE_CODE_CERT_STORE`, `CLAUDE_CODE_CLIENT_CERT`, `CLAUDE_CODE_CLIENT_KEY`, `CLAUDE_CODE_CLIENT_KEY_PASSPHRASE`, `ANTHROPIC_BASE_URL`, `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN`, `CLAUDE_CODE_OAUTH_TOKEN`, `ANTHROPIC_CUSTOM_HEADERS`. Provenance: claude 2.1.299's own connection-and-identity name set, read 2026-10-23; the proxy, CA, base URL and key names measured.
- **Sealed env in the file.** `NANA_ROLE`, `NANA_WORKTREE_ROOT`, `NANA_HANDOFF`, `CLAUDE_CODE_DISABLE_AUTO_MEMORY` and both Bash limits, assigned last, and also kept in the child process env (under a desktop-host entry point inherited names beat the file, measured a6). The seal test pins that the carry names and the sealed names share no name, compared without regard to case.
- **File.** `builder-settings.json`, mode 0o600, in the lane's existing `mkdtemp` folder, removed in the same `finally` as the prompt file.
- **argv.** R-2646's sequence gains `--settings <file>` right after `--setting-sources project,local`. `--append-system-prompt-file <path>` stays the last flag before the instruction.
- **Line.** One stderr line per launch before `[pi-worker] attempt 1/1`, names only, never a value: `pi-worker: claude settings carry: <sorted keys>, env <sorted env names>; source: <file>`, or `pi-worker: claude settings carry: none; <reason>; source: <file>` with reason `not found`, `cannot read (<code>)`, `not valid JSON[ at line L, column C]` (place from `jsonErrorPlace` only, never parser text: V8 quotes the file) or `not a JSON object`. pi-worker never throws on the source file; it still writes the file with the sealed env and starts claude.
- **Provider env** (Bedrock, Vertex, Foundry, about 20 names) is not carried. A Claude Code seat passes it down through the inherited env anyway (measured a3). Default: no; an optional ask in HANDOFF.

### Amended and added rows

- **R-2646 (amended):** the argv sequence gains `--settings` and the path R-2655 names, right after `--setting-sources project,local`.
- **R-2654 (unchanged):** the child process env still holds the sealed values.

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2655 | WHEN pi-worker starts a Claude Code builder, it shall pass `--settings` naming one file outside the worktree that holds, from the user settings file (`settings.json` in `CLAUDE_CONFIG_DIR` when set, else in `.claude` under the home folder), only the carry keys and, under `env`, only the carry env names matched without regard to case, values unchanged; print one carry line naming them and no value; and remove the file once the builder ends. | `packages/nana-pack/tests/worker-claude.test.mjs::R-2655: a Claude Code builder gets a settings file outside the worktree carrying only the login keys and network env names from the user settings, named in one line without values, and gone after the build` |
| R-2664 | WHEN pi-worker writes a Claude Code builder's settings file, its `env` shall hold `NANA_ROLE=worker`, `NANA_WORKTREE_ROOT` set to the worktree, `NANA_HANDOFF=off`, `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` and both Bash time limits at the sealed builder limit, whatever the user settings `env` holds. | `packages/nana-pack/tests/worker-claude.test.mjs::R-2664: the builder's settings file holds the sealed builder env whatever the user settings env says` |
| R-2665 | IF the user settings file is missing, unreadable, not valid JSON or not a JSON object, THEN pi-worker shall print one carry line naming the file and the reason and no file content, and still start the Claude Code builder with a settings file whose `env` holds only the sealed builder env. | `packages/nana-pack/tests/worker-claude.test.mjs::R-2665: a missing, unreadable, malformed or non-object user settings file prints one carry line without its content, and the builder still starts with only the sealed env` |

The seal test adds `CLAUDE_SETTINGS_FLAG`, `CLAUDE_CARRY_KEYS` and `CLAUDE_CARRY_ENV_NAMES`, names R-2655, and asserts the carry and sealed names are disjoint without regard to case.

Tests: as `proxy-verdict.md` section 4 "Tests: fixture and assertions" (R-2655 builds 1 and 2, R-2664, R-2665's four builds with the secret markers, and R-2650's Windows argv carrying the path).

Tunables (worker-config.mjs): `CLAUDE_SETTINGS_FLAG = '--settings'` (contract, `claude --help` 2.1.299, sealed); `CLAUDE_BUILDER_SETTINGS_FILE = 'builder-settings.json'` (chosen, not sealed); `CLAUDE_CARRY_KEYS` and `CLAUDE_CARRY_ENV_NAMES` (sealed, provenance above).

Wrong-code pairs 22 to 34 (each must turn its test red):
22. Copy the user `env` whole, with no name filter → R-2655.
23. Copy the whole user file → R-2655.
24. Match carry names with case → R-2655 (`no_proxy` dropped).
25. Ignore `CLAUDE_CONFIG_DIR` → R-2655 build 2.
26. Keep the sealed env only in the process env, not in the file → R-2664.
27. Put the parser's message in the line → R-2665 (`sk-ant-SEC` appears).
28. Throw on a malformed or unreadable file → R-2665.
29. Omit `--settings` when the user file is missing → R-2665 and R-2646.
30. Write the file into the worktree, or leave it after exit → R-2655.
31. Pass inline JSON to `--settings` → R-2655, and R-2650 on Windows.
32. Print values in the carry line → R-2655.
33. Drop `--settings` from the argv → R-2646.
34. Add `CLAUDE_CODE_DISABLE_AUTO_MEMORY` to the carry env names → the seal test.

Known limits (replace the first known-limit line above):
- From user settings the builder gets the three helper keys and the 17 network and login env names. From a pi seat it gets no provider env, no `NODE_OPTIONS` and no other user env name. From a Claude Code seat it inherits the whole seat env anyway, including the seat's session names.
- `~/.claude.json` env and the worktree's `.claude/settings.json` env still apply for names the file does not set (measured).
- Under a desktop-host entry point, carried names cannot override inherited ones (measured).
- Managed policy env beats the sealed names (code read); reaching the builder under `--setting-sources` is inferred, not measured.
- A SIGKILLed pi-worker leaves the temp folder, which may hold a carried key.
- `awsAuthRefresh` and `gcpAuthRefresh` are not carried.
- With a carried `apiKeyHelper` and an env key both set, two credentials go out (measured), as in a normal session.
- A Windows system proxy (Internet Options, WinHTTP, PAC) does not reach claude at all, seat or builder (binary strings, inferred).

Seat steps (added): the fake-endpoint capture at the tip also checks the settings file and the carry line. HANDOFF gains one owner ask: on a machine behind a proxy, one real-claude builder smoke started from the owner's usual seat, checking login through the proxy and a commit.
