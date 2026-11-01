**Review of context-anatomy (`origin/main...6808a04b`): no MUST findings, so the lane can land.**

**What I checked**
- I ran the lane's must-meet test file on this tip: 10 of 10 pass, and the worktree stayed clean.
- The real `~/.pi/agent/nana-context-loads.jsonl` has 2 lines after that run and the seat's earlier full suite. Both are real `claude-review` launches from `~/nana-pi-wt`. So no test wrote to the real home.
- The two commits after `411af910` (the seat's suite and CI tip) change only docs and records. The suite and CI evidence therefore still covers the code that would land.

**The five points the brief asked about**
- **Login, proxy and effort.** `lib/claude-settings-carry.mjs` keeps the carry logic that was already in `pi-worker` and adds 11 env names for Git Bash, Bedrock, Vertex and model aliases. The reviewer now runs with `--setting-sources project,local`, `--settings <0600 file in temp>` and `--strict-mcp-config`. Effort is read from `modelSettings[model].effortLevel`, falling back to the top-level `effortLevel`, and passed as `--effort`. OAuth login lives outside `settings.json`, so the user-settings cut does not touch it. The seat's round-2 measurement shows a real launch working.
- **Tree's own instructions.** `claudeMdExcludes` is built only from `path.dirname(tree)` upward. The tree's own `CLAUDE.md`, `AGENTS.md` and `.claude/` stay eligible, and the R-3219 test asserts that. The user's `~/.claude/CLAUDE.md` and `~/.claude/rules/**` are dropped because home is an ancestor, which is the intent.
- **Digest and precedent lines.** Lines matching a precedent path or a backticked term from the brief are kept first, then the newest lines in file order. Whenever lines are omitted, a fold line tells the reader to read the whole file.
- **No writes to the real home.** The test fixtures set `HOME`, `USERPROFILE` and `PI_CODING_AGENT_DIR` to temp, and the real-home log check above confirms it.
- **Log failures never block.** `appendContextLoad` never throws and writes one stderr line on failure. In `nana-shared-memory.mjs`, stdout is written before the dynamic import, and the import sits in its own try/catch, so the hook's output is unchanged. R-3216 and R-3217 pin this, and the install check asserts `printedChars === stdout.length`.

**Other checks**
- The `claude-review` preflight calls `project()` from `review-round.mjs`, which is read-only apart from taking the lock briefly. It honours an over-cap override, so a refused review creates no credential file.
- The Windows cleanup watcher only gets a lock path inside its own private temp folder, so it cannot release a lane lock.

**Findings (none blocking)**
- SHOULD: the Claude builder launched by `pi-worker` still gets no `--effort`. This is not a regression: builders have run under `project,local` since 10-22. It is the same effort gap R-3210 just closed for reviewers.
- SHOULD: if the brief-matched known-bug lines alone exceed 6,000 characters, some precedent-matched lines are dropped. The fold line still sends the builder to the whole file, so nothing is silently lost.
- NOTE: in the glob escaping, `]` becomes `[]]`. Whether every glob engine reads that as a literal `]` is unverified. If it does not, an ancestor folder whose name contains `]` would not be excluded, and its memory files would load as they did before this change.
- NOTE: on a machine where home is a dotfiles git repo, the log is skipped on every launch with one stderr line. That is by design (R-3216) but easy to miss.

VERDICT: LAND
