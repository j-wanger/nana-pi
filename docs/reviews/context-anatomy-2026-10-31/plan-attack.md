# Plan attack: context-anatomy (2026-10-31)

Adversary for lane `context-anatomy`, against `plan.md` at base main `e5db630e`. Read-only except this file.
Checked: the plan, the agreed design and anatomy research, `claude-review.mjs`, `pi-worker.mjs` (Claude builder argv and the
settings carry), `worker-config.mjs`, `review-ledger.mjs`, `pi-review.mjs`, `review-launch.mjs`, `win-command.mjs`,
`brief-precedent.mjs`, `review-movement.mjs`, `agent-dir.mjs`, the shared-memory hook and its tests, the known-bug files
and their `git blame`, the builder preamble, the sibling plans `memory-making` and `owner-profile`, `claude --version`
(2.1.310) and `claude --help`, and the installed binary's strings. No paid session was started.

## MUST

### M1. The Claude reviewer silently loses the owner's effort setting

Failing case: this Mac's `~/.claude/settings.json` holds `effortLevel: "xhigh"` and
`modelSettings: { "claude-opus-5-5": { "effortLevel": "medium" } }`; the roster reviewer is `claude-code opus`.
`--setting-sources project,local` drops both keys, and `CLAUDE_CARRY_KEYS` carries neither. From the first round after
the land, every Claude review runs at Claude Code's default effort instead of the one the owner set. Nothing prints it;
T1 and T2 both pass. The plan's stakes line says "a wrong reviewer isolation flag fails reviews loudly, not silently";
this one is silent. It also confounds the seat check: the before/after round compares token counts across two different
effort levels. `claude --help` (2.1.310) has `--effort <low|medium|high|xhigh|max>`.

Fix: pass the reviewer's effort explicitly. Either add an `--effort` value read from a named config value (or a roster
field) with provenance, or carry `effortLevel` and `modelSettings` into the reviewer's settings file through a
reviewer-only carry list. Pin it in T1 or T2, and record the effort in the T6 log line and the seat check. Add the
wrong-code pair "drop the effort" (red).

### M2. The digest breaks the builder's duty to report every known bug the change touches

Failing case: the builder preamble says "The known bugs that follow the brief are context; fix only those the brief
names, and report each one the change touches." A future lane with `Feature: FEAT-006` whose brief names
"no size guard on the attached file" gets a digest of the last ~6,000 chars. That is about the last 25 to 31 of 141
lines. The named line is line 35. It is cut. For FEAT-013 the digest shows about 20 of 200 lines. The builder can no
longer see 85% of the lines it is told to report on. It reports none, and no test notices. T3 passes, since it checks
only the cut's shape.

Fix, cheapest first:
1. Change the fold line and preamble line 12 together. When a fold line is present, the builder reads the whole file
   before writing its report. The preamble is the builder's rule, so this edit belongs in this lane.
2. Always keep, ahead of the tail, any bug line whose text the brief quotes. Use a deterministic substring match on the
   brief's backticked or quoted spans. Pin it in T3 with a fixture whose quoted line sits above the tail.

### M3. If T6 covers pi-worker's non-lane mode, the suite writes into the real home

Failing case: `packages/nana-pack/tests/watchdog-cpu.test.mjs` runs `pi-worker.mjs` without `--lane` on every platform.
Its env is `{ ...process.env, PATH: … }`, with no temp `HOME` and no `PI_CODING_AGENT_DIR`. T6 reads "WHEN pi-worker …
starts its child". If non-lane mode logs, each `npm run test:locked` and each CI run appends fake launches to
`~/.pi/agent/nana-context-loads.jsonl`. That is a test writing outside the worktree and temp folder, a harm the review
standard lists. It also poisons the baseline this lane exists to start.

Fix: scope T6 to lane mode for pi-worker, and say so in the row. Or give watchdog-cpu a temp agent dir. In both cases,
add a check to T6's test that a launch with an unset agent dir writes nothing under the real home. Grep for every
launcher-spawning test without `HOME` or `PI_CODING_AGENT_DIR`; today that finds watchdog-cpu, and component-audit
only reads the file.

## SHOULD

### S1. FEAT-040, the row IDs and A-088 are claimed three times

Failing case:
- memory-making proposes `FEAT-040 · Make memory from past work` with rows "from R-3188". Its own attack already
  flags this as SHOULD.
- owner-profile plans to reuse memory-making's FEAT-040.
- This plan proposes `FEAT-040 · Shape each agent's context by role`, artifact "A-088 or the next free ID", and names
  no row range.
- The highest IDs on main are R-3187 and A-087, so all three lanes would take R-3188 and A-088.
- The builder preamble says "New requirement rows take IDs only from the range your brief names". The brief cannot
  satisfy that as planned.

Whichever lane lands second hits a tree conflict. The owner would also get two "new FEAT-040" questions.

Fix: before any brief, the seat assigns IDs across the lanes, for example FEAT-041 here, a row range, and A-089. Then
edit this plan's Feature line, Question 1 and the artifact line.

### S2. Dropping user setup also drops the objective, but the question asks only about rulings

Failing case: the objective reaches the Claude reviewer only through the user SessionStart hook, and
`--setting-sources project,local` removes that hook. So does the verifier-pipe PreToolUse hook. The plan's "Left for
later lanes" says gating the objective for pi children "changes AGENTS.md's runtime table and the objective invariant,
so each needs its own call". This lane makes that change for the Claude reviewer without the call. Question 2 names
only the rulings, so the pi reviewer and the Claude reviewer then diverge on two inputs, not one.

Fix: widen Question 2 to "rulings and objective", and list the verifier-pipe hook among the dropped hooks. Declare the
Claude reviewer's inputs in the pack README contract notes.

### S3. The carry list misses provider and Windows env names, so some machines lose the reviewer

Failing case, Windows: Claude Code on Windows needs Git Bash. A machine that sets `CLAUDE_CODE_GIT_BASH_PATH` in user
settings `env` loses it, because it is not in `CLAUDE_CARRY_ENV_NAMES`. The reviewer then fails to start on that machine.
The name is in the 2.1.310 binary.

Failing case, provider (INFERRED):
- A settings file holds `awsCredentialExport` and `env.CLAUDE_CODE_USE_BEDROCK=1`, `AWS_REGION`.
- The carry keeps `awsCredentialExport` but drops `CLAUDE_CODE_USE_BEDROCK`. Vertex and the `ANTHROPIC_DEFAULT_*_MODEL`
  pins are dropped the same way.
- The reviewer then either fails, or, on a machine also logged in with OAuth, sends a work repo's review to the
  first-party account instead of the company provider.

This was true for the Claude builder already; the reviewer is the slot used every round.

Fix: add those names to the carry contract with provenance, or have claude-review print the user-settings env names it
dropped, so the loss is visible. At minimum, record it as a residual and add it to the Windows CI leg's expectations.

### S4. The moved helper prints the wrong launcher name, and T2 contradicts the builder's settings shape

Failing case:
- `readClaudeBuilderSettings` builds its line as `pi-worker: claude settings carry: …`, and R-2655's tests pin that
  text. Moved unchanged, claude-review would print a `pi-worker:` line.
- The helper always writes `settings.env = { ...carried, ...sealed }`. R-2655's failure check expects
  `env === sealedEnv()`.
- T2 wants the reviewer file to hold `apiKeyHelper` and `env.HTTPS_PROXY` only. That holds only if claude-review passes
  an empty sealed env. Then the reviewer's `CLAUDE_CODE_DISABLE_AUTO_MEMORY` lives only in the child env, where a
  project settings `env` can override it. The builder puts it in flag settings, which win.

Fix:
- Give the shared helper a launcher-name argument, defaulting to keep R-2655's text.
- Decide the reviewer's sealed env. Recommended: `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` plus `REVIEWER_CHILD_ENV` in
  settings `env`, as the builder does.
- Restate T2 as "only the carry keys, the carry env names and the sealed reviewer env".

### S5. The settings file, with any carried key, stays in temp when a review is interrupted

Failing case:
- claude-review has no signal handling.
- `die()` and Ctrl-C end the process with no cleanup, and a hard kill does too.
- pi-worker has a lane watcher that removes its folder after a hard kill; claude-review has none.
- The file can hold `apiKeyHelper` commands and `ANTHROPIC_API_KEY` or `CLAUDE_CODE_OAUTH_TOKEN` values. It is
  mode 0600 on POSIX, but has only the folder's ACL on Windows.
- T2 pins removal after a normal end only.

Fix: create the file after every refusal check. Remove it in `exit` and on SIGINT, SIGTERM and SIGHUP. Pin the removal
after a non-zero review-ledger exit in T2, and add the wrong-code pair "keep the file on failure".

### S6. "Newest" is not what the bottom of a known-bug file holds

Failing case: A4 says lines are appended at the bottom. `git blame` shows lines inserted mid-file under their topic:
- FEAT-039 has four lines dated 10-29 at lines 5 to 8, and more 10-29 lines further down.
- FEAT-007 has a 10-25 line at line 19.
- FEAT-013 has 10-23 lines spread through a 10-21 block.

The tail rule cuts those, and the fold line calls them "older known-bug lines", which is false for them.

Fix: name the rule for what it is, "the last whole lines in file order". Word the fold line as
"`<n>` known-bug lines above omitted for size". Drop "newest" from T3 and A4.

### S7. T3 passes a digest that keeps one line

Failing case: T3 checks the cap, whole lines, that the last bug line is present and the omitted count. A digest that
keeps the header and only the last bug line passes, as long as `<n>` is honest. T3 also does not pin that the header
lines are present.

Fix: add two assertions to T3. Adding the next omitted line would exceed the cap. The file's lines before its first
bug line come first, unchanged.

### S8. "Chars" has no unit, and known-bug lines are full of non-ASCII

Failing case:
- Most lines hold `·` and `—`, which are 2 to 3 bytes in UTF-8.
- The Claude builder path reads the file as a Buffer, but T3 and T4 compare against a "chars" cap.
- Suppose the builder counts bytes and the test counts string length. A file of 5,990 chars and about 6,050 bytes
  then takes the digest branch in code and the pass-through branch in the test. The result depends on which side
  each fixture lands.

Fix: define a char as one UTF-16 unit of the UTF-8-decoded text, which is what the shared-memory budget uses. Name that
unit beside `KNOWN_BUG_DIGEST_CHARS`. Make T4's exactly-at-cap fixture contain non-ASCII.

### S9. A known-bug section could turn a reviewer's MUST into "already recorded"

Failing case:
- The seat writes non-blocking findings into known-bug files in the notes commit before the final round.
- With T5, the final reviewer then sees a line describing the bug it is about to raise.
- If the lane made that bug material, for example by moving it onto the main path, a reviewer may downgrade it
  because it is "recorded".

Fix: the section's lead line, declared in config, says a recorded line is context and does not change a finding's
class under the review standard. Pin the lead in T5.

### S10. A fix lane that moves no rows gives its reviewer no known bugs

Failing case: a lane that restores agreed behaviour changes code and no requirement rows, so the movement names no
feature, and T5 sends nothing. Fix lanes are exactly where the known bugs matter most. A5 accepts this as a residual.

Fix: when the movement names no feature, fall back to the review brief's first `Feature: FEAT-nnn` line. Parse it with
the existing brief parser `brief-precedent.mjs` already uses, and import it rather than copying it.

### S11. A cwd-relative agent dir puts the load log inside the repo

Failing case:
- `PI_CODING_AGENT_DIR=.pi-agent` resolves against each process's cwd, and `agent-dir.mjs` ships
  `piAgentDirIsCwdRelative()` because this happens.
- A pi-review started in a lane worktree then appends the log inside that worktree.
- pi-review's `copySnapshot` copies untracked, non-ignored files, so the log enters the reviewed snapshot.
- The log holds working-folder paths and memory file names. A6 promises it is never committed.

Fix: when `piAgentDirIsCwdRelative()` is true, or the log path sits inside a git worktree, skip the append and print the
one T7 stderr line. Pin it as a T7 case.

### S12. A failed import in the shared-memory hook loses the whole index

Failing case: if the hook statically imports a new nana-pack log module and that import fails, no index is printed.
That covers a stale checkout, a moved file, or a syntax error on Windows. T7 covers only "the log path is a directory".
`nana-roster-notice.mjs` already imports nana-pack inside a dynamic `import()` in a try for this reason.

Fix: write stdout first, then load the log module by dynamic import inside the try. Add the wrong-code pair "log before
writing stdout" or "static import of a missing module". Its T7 result must be stdout byte-equal and exit 0.

### S13. Missing wrong-code pairs and install-check coverage

The listed pairs miss these:
- T1: drop `CLAUDE_CODE_DISABLE_AUTO_MEMORY`.
- T2: keep the file after a failed review (S5).
- T3: cap only the pi runtime, or only the Claude runtime. T3 says "both runtimes".
- T5: give each feature the full cap instead of an equal share.
- T7: the hook pairs in S12.

Also, the local install check runs the hook in a temp home but does not assert the new log line. The hook's import
through the installed symlink is then proved only by the roster-notice precedent. Add one install-check assertion that
the temp home's agent dir holds one load line after the hook run.

## NOTE

### N1. Installed Claude Code is 2.1.310; the isolation flags were measured on 2.1.299

`--setting-sources`, `--settings` and `--strict-mcp-config` are in 2.1.310's `--help`.
`CLAUDE_CODE_DISABLE_AUTO_MEMORY` is in the binary, and `"1"` reads as off. `--help` does not say whether `~/.claude/rules`
and user skills follow the `user` source; only the seat's real round shows it. Make that seat check a land condition
with numbers written down before the run: no `~/.claude/rules` files in the `instructions` attachment, no MCP
instructions, and first-turn input below a stated figure.

### N2. The reviewer loses user `permissions.defaultMode: auto`

Tools outside `--allowedTools` are now denied in `-p`, such as the Agent tool and WebFetch. That is probably fine for
a reviewer; record it in the contract note.

### N3. Windows `.cmd` launches refuse some characters

`winCommand` refuses `%`, `!` and `"` in any argument. A `%TEMP%` path holding `!` or `%` blocks the `--settings` argument.
This is already true for the Claude builder; spaces are quoted and fine.

### N4. The log grows by about 3 to 5 KB per seat start

T8 lists about 85 entry names per line. SessionStart also fires on resume, clear and compact. There is no rotation by
design. Give each line a schema field `v`, as `appendBuildRecord` does, so a later reader can change the shape.

### N5. The hook and the launchers can log to different files

If `PI_CODING_AGENT_DIR` is set in the shell that starts the launchers but not in Claude Code's environment, the hook
and the launchers resolve different agent dirs. The log then splits in two. Record it in the README note.

### N6. Equal shares can leave a feature with only its header

- The longest bug line today is 1,137 chars (FEAT-028).
- With five or more named features, a share is under 1,200 chars, before the header and fold line.
- A feature then gets its header and a fold line only.
- An unused share, such as FEAT-024 at 321 bytes, is not given to the others.

Define both cases in T5's row.

### N7. This lane's own builder sees no known bugs

The brief's feature is new and has no file, yet the lane amends FEAT-006 and FEAT-007 rows. The seat should name the
two known-bug lines it resolves, and any FEAT-006 and FEAT-007 lines on the launchers, in the build brief.

### N8. Helper moves the builder will hit

- `readClaudeBuilderSettings` and `writeClaudeBuilderSettings` move as planned. They depend on `json-text.mjs`, which
  is already shared.
- O3's parsing of the seat's `--append-system-prompt` values needs pi-review's private nested `piOption` at line 200.
  A second caller imports it after a move and does not copy it.
- T8 needs the hook's nested `shorten` and `render` results, the selected list and the limit. Keep that refactor
  inside the hook file.

### N9. A6's "if the tree checker requires one" is moot

The format rule says every live artifact entry needs a `Read by:` line or a `Parked:` hold. Write the `Parked:` line.

### N10. The threat model lists concurrent appends, but no test exercises them

One `appendFileSync` per line, under a few KB, is enough on POSIX and on Windows append handles. Either pin one
two-writer case or drop it from the model.

### N11. The account email (A2) stays in the reviewer's context

It reaches the repo only if a reviewer quotes it. The identity scan on review text before `keep` catches it.
