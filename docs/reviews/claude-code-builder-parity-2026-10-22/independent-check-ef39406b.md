MATERIAL: none

# claude-code-builder-parity · independent check at ef39406b

Class: gate. Checked on 2026-10-23 on macOS (Darwin 25.2) with claude 2.1.299, node 22.22.2 and pi 1.0.2.
Tip under test: `~/nana-pi-wt/claude-code-builder-parity` at ef39406b. The worktree's tracked files were clean the whole time; the only untracked files were the seat's mutation table and its output. The seat's mutation runner uses its own scratch worktrees, so it never changed the files under test.
Nothing was edited, committed or pushed in the lane worktree or in `~/nana-pi`. Fixtures, scripts and raw outputs are in `<scratch>/ccbp-indep/`: `lib.mjs`, `check-a.mjs` to `check-g.mjs`, `check-c-stop.mjs`, `check-pi-stop.mjs`, and the `out-*.json` files.
Real-endpoint claude runs: 0 of the 2 allowed. Every run of the real binary used a temp HOME, `CLAUDE_SECURESTORAGE_CONFIG_DIR` inside that HOME, and a fake Messages endpoint (`fakeapi.mjs`, adapted from the attack pass). No file under the real `~/.claude` or `~/.pi` was written (measured: no fixture names under `~/.claude/projects` or `~/.pi/agent/sessions`).

The common launch, run from the fixture's linked worktree on `feat/alpha`:
`node <lane>/packages/nana-pack/bin/pi-worker.mjs --poll 0.2 --out <fx>/out.md --lane alpha --brief <fx>/brief.md --lane-size larger [--max-secs N]`
Its env set HOME, USERPROFILE, TMPDIR and PI_CODING_AGENT_DIR to temp folders. The roster was `largerBuilder: {runtime: "claude-code", model: "haiku"}`. A fake `claude` went first on PATH; it records argv, cwd, pgid, env, the settings and prompt file modes, and copies of both files. The fake `pi` drops a marker file.

## a. A failing brief is refused before the lock and claude — PASS (measured)

Command: `node <scratch>/ccbp-indep/check-a.mjs`. For each brief it runs `brief-check.mjs --brief <b> --tree <wt>` and then pi-worker.
Expected: the same line and exit code from both; on a refusal, no lock, no claude, no pi, no temp folder and no carry line.
Measured (6 briefs):
- No Precedent section: both exit 1 with `pi-worker: lane refused: Precedent section needs a Precedent heading, or a line holding only Precedent:, then one entry …`. Claude did not run, there was no lock and no temp folder, and pi-worker printed no builder or carry line.
- Untracked precedent path (`not-tracked.mjs`): both exit 1 with `… "not-tracked.mjs" is not tracked at HEAD; commit the file, or merge main if it landed there`. The rest matched the first brief.
- A file on disk but not tracked at HEAD (`ondisk.mjs`): both gave the same refusal; nothing started.
- An empty Precedent heading, and a reasonless `- none:`: both exit 1 with the same line; nothing started.
- A passing brief: both exit 0 with `pi-worker: precedent: 1 checked at HEAD <sha>; known bugs: docs/known-bugs/FEAT-006.md`. Claude ran once. No lock and no temp folder were left afterwards.

## b. The settings carry under honest variation — PASS (measured)

Command: `node <scratch>/ccbp-indep/check-b.mjs` (15 cases). The fake secret is `sk-ant-INDEP-SECRET`.
Expected:
- One carry line that names keys only.
- A settings file that holds only the allowed keys plus the sealed env, assigned last.
- The file is mode 0600 while it exists and is gone after the build.
- The secret appears nowhere: not in stdout or stderr, the `--out` file, the build ledger, the worktree, the agent folder, or anything left in TMPDIR.

Measured, one row per case (exit 0 for all 15):

| case | carry line (after `pi-worker: claude settings carry: `) | file keys / env names |
|---|---|---|
| settings.json missing | `none; not found; source: …/home/.claude/settings.json` | env: sealed 6 only |
| settings.json is a directory | `none; cannot read (EISDIR); …` | sealed only |
| malformed JSON with the secret as a bare token | `none; not valid JSON; …` | sealed only |
| malformed JSON, unterminated string holding the secret | `none; not valid JSON at line 1, column 51; …` | sealed only |
| array / string / `null` holding the secret | `none; not a JSON object; …` | sealed only |
| empty file | `none; not valid JSON; …` | sealed only |
| mode 000 | `none; cannot read (EACCES); …` | sealed only |
| full file (below) | `apiKeyHelper, awsCredentialExport, proxyAuthHelper, env ANTHROPIC_API_KEY, NODE_EXTRA_CA_CERTS, https_proxy, no_proxy; …` | apiKeyHelper, awsCredentialExport, env, proxyAuthHelper / ANTHROPIC_API_KEY, no_proxy, https_proxy, NODE_EXTRA_CA_CERTS, then the 6 sealed names |
| UTF-8 BOM + full file | same as the full file | same |
| `env` is an array | `apiKeyHelper; …` | apiKeyHelper, env (sealed only) |
| `CLAUDE_CONFIG_DIR=<fx>/cfg dir` (holds a space) | `env HTTPS_PROXY; source: …/cfg dir/settings.json` | HTTPS_PROXY from the config folder, not from home; child env `CLAUDE_CONFIG_DIR` unchanged; the name is not in the file |
| `CLAUDE_CONFIG_DIR=""` | `env HTTP_PROXY; source: …/home/.claude/settings.json` | falls back to home |
| `CLAUDE_CONFIG_DIR` set, its settings.json missing | `none; not found; source: …/cfg dir/settings.json` | sealed only; no fallback to home |

The full file held `hooks`, `permissions` (`bypassPermissions`), `mcpServers`, `enabledPlugins`, `model`, `awsAuthRefresh` and `statusLine`. Its `env` held `NODE_OPTIONS`, `PROBE_OTHER`, `CLAUDE_CODE_USE_BEDROCK`, `CLAUDE_CONFIG_DIR`, `CLAUDE_CODE_DISABLE_AUTO_MEMORY=0`, `nana_role` and `BASH_MAX_TIMEOUT_MS=5`. None of these was carried.
In every case:
- The secret was in no output and no file left behind.
- The settings file was mode 600 inside a mode 700 temp folder, and outside the worktree.
- The file and its temp folder were gone after the build, and TMPDIR was empty.
- The child env held NANA_ROLE=worker, CLAUDE_CODE_DISABLE_AUTO_MEMORY=1 and BASH_MAX_TIMEOUT_MS=3600000.

## c. Isolation with the real binary and the fake endpoint — PASS (measured)

Command: `node <scratch>/ccbp-indep/check-c.mjs <case>`. The temp HOME held these user-layer markers:
- `~/.claude/CLAUDE.md`, `~/.claude/rules/probe.md`, a user skill and a user agent.
- `~/.claude/settings.json` with SessionStart, UserPromptSubmit, PreToolUse and Stop hooks that log to a file.
- In the same file: `permissions {defaultMode: plan, deny: [Bash]}`, `model: opus`, `mcpServers`, `statusLine`, and `env` with the fake ANTHROPIC_BASE_URL and key. The base URL and key reach claude only through the carry.
- `~/.claude.json` with its own `mcpServers` entry.

The worktree held a committed `CLAUDE.md` with a project marker. The endpoint asks for one Bash command, which prints the builder's env into `echo.txt`.
The pi-worker cases inherited a Claude Code seat's env: `CLAUDECODE=1`, `CLAUDE_CODE_ENTRYPOINT`, `CLAUDE_CODE_CHILD_SESSION`, `CLAUDE_EFFORT=xhigh`, a fake `CLAUDE_CODE_SESSION_ID`, and `CLAUDE_CODE_MESSAGING_SOCKET` pointing at a socket the harness listens on.

Expected:
- The first request's system prompt holds no user CLAUDE.md, rules, skill or agent text, and does hold the project CLAUDE.md, preamble, brief and known bugs.
- The tools are exactly the six; no user hook runs and no MCP server starts.
- Memory stays off when the worktree's `.claude/settings.json` env (or `settings.local.json`, or `~/.claude.json`) sets `CLAUDE_CODE_DISABLE_AUTO_MEMORY=0`.

Measured:
- Positive controls, run directly with claude (not through pi-worker):
  - `c0control` (no `--settings`, memory env unset): the system prompt held the memory text `You have a persistent file-based memory`. The memory detector works.
  - `c6hookcontrol` (all setting sources): the hooks logged SessionStart, UserPromptSubmit and Stop. The user CLAUDE.md and rule appeared, memory was on, there were 22 tools, and both user MCP servers started. The detectors work.
- `c1project` (worktree `.claude/settings.json` env with memory 0), through pi-worker: exit 0. The carry line read `env ANTHROPIC_API_KEY, ANTHROPIC_BASE_URL`, and two requests went to the fake endpoint with the carried key.
  - Tools were `Bash, Edit, Glob, Grep, Read, Write`, with no `mcp__` tools.
  - The system prompt held no user text; it held the project CLAUDE.md, preamble, brief and known bugs. The memory text was absent.
  - The Bash tool ran without a permission error, even though the user file said plan mode and denied Bash. It printed `MEM=1 ROLE=worker ROOT=<lane> BASHMAX=3600000 HANDOFF=off`.
  - The hook log was empty and no MCP server started.
- `c2localglobal` (`.claude/settings.local.json` env plus `~/.claude.json` env, both setting memory to 0): same result; memory stayed off and `MEM=1`.
- `c3nonstring`: a carried env value that is not a string (`CLAUDE_CODE_PROXY_RESOLVES_HOSTS: true`) plus a project env with memory 0. Claude accepted the settings file and memory stayed off.
- `c4noseat` (no seat env inherited): same as c1.
- `c5spaces` (worktree `my lane dir`, brief `my brief.md`, CRLF known-bug file, TMPDIR with a space): same as c1, exit 0.
- Seat env, in the c1, c2, c3 and c5 runs:
  - The real claude started and finished under `CLAUDECODE=1`, so no nested-session refusal.
  - Its transcript used a fresh session id, not the inherited one.
  - It made no connection to the inherited messaging socket during the run.

## d. Stop paths — PASS for what R-2651 claims (measured); see note 2 for commands the builder is running

Command: `node <scratch>/ccbp-indep/check-d.mjs`. The fake claude sleeps 60 s and starts a `sleep 300` grandchild in its own group.
Expected: the ceiling and the signals stop the builder's process group and release the lock, and no temp files remain.
Measured:
- `--max-secs 5`: exit 1 after 5.6 s with `[pi-worker] FAILED: wall-clock ceiling 5s reached — killing process group` and the `build record: ceiling` line. The claude pid, the grandchild and the group were gone. The lock was released and TMPDIR was empty.
- SIGTERM to pi-worker once claude had started: exit 143 with `[pi-worker] aborted by SIGTERM`. The group was gone, the lock released and TMPDIR empty.
- SIGINT gave exit 130 and SIGHUP gave exit 129, each with its aborted line. The group was gone, the lock released and TMPDIR empty.
- Flat CPU for 4 s with `--stall-secs 1`: exit 0 and no STALL line. The heartbeat printed `flat=1/Infinity`, and the report was kept.
- Claude missing from PATH: exit 1. The lock was released and TMPDIR was empty. The `--out` file held `pi spawn failed: spawn claude ENOENT`; this is the known pi-named-lines bug.
- A claude that exits 1 with an auth message: exit 1 with `FAILED after 1 attempt(s) (endpoint likely in a bad stretch)`. Claude's own message went to the `--out` file only. The lock was released and TMPDIR was empty.

## e. The pi path is unchanged — PASS (measured)

Command: `node <scratch>/ccbp-indep/check-e.mjs`. It runs three pi-workers against the same fixture with a recording fake pi:
- main (df910cd3) and the lane base (16c902c2), both extracted with `git archive` into `<scratch>/ccbp-indep/src-*` (read-only for `~/nana-pi`);
- the tip.

Expected: the same pi argv, env, prompt files, builder line and output.
Measured: the tip equals both main and the base in all 5 scenarios:
- a pi largerBuilder with `--lane-size larger`, with thinking and without;
- a pi largerBuilder with `--lane-size small`;
- no largerBuilder and no size;
- a Claude largerBuilder with `--lane-size small`.

The argv was `--provider … --model … [--thinking …] -t read,grep,find,bash,edit,write --append-system-prompt <preamble> --append-system-prompt <brief> --append-system-prompt <known bugs> -p <instruction> --name pi-worker-a1-N`. The env was NANA_ROLE=worker, NANA_WORKTREE_ROOT=<lane> and NANA_HANDOFF=off, with no Claude names. No carry line was printed and no temp folder was left.

Test files, each run alone from the lane worktree with HOME, USERPROFILE and TMPDIR under `<scratch>/ccbp-indep/t-*`:
- `review-ledger.test.mjs`: exit 0, 170 PASS (195 s).
- `watchdog-exit.test.mjs`: exit 0, 6 PASS.
- `watchdog-cpu.test.mjs`: exit 0, 4 PASS, 1 SKIP.
- `worker-lane.test.mjs`: exit 0, 64 PASS.
- `worker-claude.test.mjs`: exit 0, 10 PASS, 1 SKIP (R-2650, Windows only).
- `win32-launch.test.mjs`: exit 0, 5 PASS, 8 SKIP.
- `build-records.test.mjs`: exit 0, 7 PASS.

The worktree stayed clean after these runs. The full suite was not run.

## f. Spaces and CRLF — PASS (measured)

Command: `node <scratch>/ccbp-indep/check-f.mjs`. The brief is CRLF and holds `"`, `%`, `!`, `$HOME` and a backtick.
Expected: exit 0; the prompt file equals the rendered preamble, a blank line, the brief bytes, a blank line and the known-bug bytes; CRLF bytes are kept; and claude runs with cwd and NANA_WORKTREE_ROOT set to the lane.
Measured:
- Worktree `my lane dir`: exit 0, prompt byte-exact.
- Brief `my brief file.md`: exit 0, prompt byte-exact.
- A CRLF known-bug file: exit 0, prompt byte-exact, CRLF kept.
- All three plus TMPDIR `tmp with space`: exit 0, prompt byte-exact, and both files lay under that TMPDIR.
- A relative brief path `../rel brief.md`: exit 0, prompt byte-exact.

In every case the lock was released, TMPDIR was empty, and an `--out` path with a space was written. The real-binary run `c5spaces` (section c) also passed.

## Extra checks

g. Early exits after the settings file is written (`check-g.mjs`; the user settings carry `ANTHROPIC_API_KEY=sk-ant-INDEP-SECRET`):
- Lock held by a live pid: refused, and TMPDIR was empty.
- `--stall-secs abc`: refused, and TMPDIR was empty.
- `--retries 1`: refused, and TMPDIR was empty.
- An `--out` folder that does not exist: claude ran, the run failed on the write, and TMPDIR was empty.
- `--worker` or `--item x`: exit 1 with the review-option line, but `nana-lane-preamble-*/builder-settings.json` stayed in TMPDIR holding the secret. See note 1.

Real binary, a Bash command running at stop time (`check-c-stop.mjs`). The fake endpoint asks for `echo $$ > pid; sleep N`.
- `--max-secs 20`: claude stopped. The Bash shell and its `sleep` survived in their own process group (shell pgid = shell pid).
- SIGTERM: exit 143, with the same survivors.
- The harness killed the survivors afterwards.

pi parity (`check-pi-stop.mjs`). A real pi 1.0.2 builder ran through the tip's pi-worker against the same fake endpoint, through a temp `models.json` provider.
- Ceiling and SIGTERM gave the same result: the bash shell survived in its own group.
- So this is not a change from main; it is the existing pi-watchdog behaviour.

## NOTES (non-blocking)

1. Review-option exit leaves a carried key in TMPDIR (measured).
   - `pi-worker.mjs` refuses `--item`, `--role`, `--revision`, `--over-cap` and `--worker` with `process.exit(1)` at about line 340. That exit comes after the temp folder is written and does not remove it.
   - On main the same exit leaves only `preamble.md` (measured with `g-main.mjs`). With a Claude builder it now also leaves `builder-settings.json`, holding the carried helper keys and env values, for example an `ANTHROPIC_API_KEY`.
   - Exposure: the same user only. The file is mode 0600 in a mode 0700 folder under the per-user TMPDIR, and that user can already read the source settings file. That is why this is not material.
   - Fix: remove `path.dirname(preambleFile)` on that exit, or run the review-option check before the files are written. Suggested FEAT-006 known-bug line: "a review-only option passed in lane mode exits without removing the temp folder, which for a Claude builder holds the carried settings."
2. Bash commands outlive a stopped builder (measured, for claude and for pi).
   - Both runtimes start their Bash tool commands in a new process group. pi-watchdog SIGKILLs only the builder's group, so a command still running at the ceiling or on SIGTERM keeps running after pi-worker exits.
   - pi-worker has already released the lane lock by then. One example is a locked suite run that keeps the machine-wide lock.
   - Not a regression. Worth one known-bug line in FEAT-006, because R-2651's "the ceiling and SIGTERM still stop it" holds for claude but not for its running command.
3. claude -p waits for background Bash tasks before it exits (measured).
   - A 9 s background sleep gave exit 0 at 10.6 s. A 3173 s background sleep kept claude running until the 60 s ceiling.
   - With no stall stop, a builder that leaves a server running holds the lane until the ceiling, 8 hours by default.
   - This is covered in spirit by the "No stall stop" known limit, which could name this cause.
4. Claude's own runtime writes outside the worktree (measured in a temp HOME; pi writes its sessions the same way).
   - It writes the transcript under `~/.claude/projects/`, `~/.claude.json` and its backup, and task output under `/tmp/claude-<uid>/<project-key>/`. That last path ignores TMPDIR.
   - In a fresh HOME, claude's startup migration rewrote the user `settings.json` even under `--setting-sources project,local`. It re-formatted the file and changed `"model": "opus"` to `"opus[1m]"`.
   - Inferred: on a machine where the seat's own claude already ran these migrations, this does nothing. A builder whose claude is newer than the seat's may run new migrations first; the seat here ran 2.1.280 while 2.1.299 is on PATH.
5. Claude's own failure text goes only to the `--out` file. Stderr says `endpoint likely in a bad stretch`, and a missing claude says `pi spawn failed`. This is the known pi-named-lines bug; it is listed because a seat debugging a login miss must read the `--out` file.
6. When the user `env` is not an object, the carry line names only the top-level keys and does not say that `env` was skipped. This is cosmetic.
7. Not checked here: R-2650 and anything Windows (macOS only), and a real endpoint behind a proxy (the HANDOFF owner ask covers this).
8. Leftovers outside `<scratch>`: claude's own task-output folders `/tmp/claude-501/-private-tmp-claude-501-…-ccbp-indep-fx-*`, created by the real-binary fixture runs. They were left in place and hold only fake data.
