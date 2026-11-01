# Plan: context-anatomy (2026-10-31)

Lane: `context-anatomy`, worktree `~/nana-pi-wt/context-anatomy`, branch `feat/context-anatomy`, base main `e5db630e`.

Lane class: `gate: packages/nana-pack/bin/claude-review.mjs — review tool`
(`node scripts/lane-class.mjs --root . --files` over the planned files, re-run after the attack with the preamble,
worker-config, install-check and READMEs added; same line). This is an install, hook or gate lane: land reviewer, the
seat's wrong-code pairs, one independent check, and the local macOS install check, since the shared-memory hook
changes.

Stakes: medium blast, reversible. Every Claude Code review round and every build passes through the changed
launchers. Most wrong flags fail a review loudly; a dropped setting (effort, provider env) fails silently, so those
are pinned (T1, T2). A wrong digest hides known bugs from a builder, so the cut keeps brief-matched lines and tells the
builder to read the whole file (T3). No data is migrated or deleted.

## Purpose

The agreed design names this lane "Lane A context-anatomy: station 6 + 5 groundwork — remove duplicated and
mis-targeted context, cap the builder's known-bug append, give reviewers the feature's known bugs, filter the Claude
reviewer's inherited setup, and log what each agent loads (the baseline every later experiment needs)."

This plan takes the launcher-side parts of that line and the load log as one feature: each agent nana launches gets a
bounded context meant for its role, and every delivery nana makes is recorded. Measured grounding (anatomy research,
2026-10-31):

- The Claude Code reviewer starts at 52,128 tokens. It inherits all six user rules (the seat guide, the writing rule,
  soul, standards, rulings, personal), user hooks (shared-memory index, objective, roster notice, verifier pipe), the
  project auto-memory index and every user MCP server's instructions. pi-worker's Claude Code builder already drops
  all of that with three flags and one env name (R-2646, R-2654, R-2655); claude-review uses none of them. This is
  FEAT-007's recorded known bug "`claude -p` loads user rules, hooks and memory".
- The builder's known-bug append is whole and uncapped: FEAT-013 is 51,195 chars and FEAT-039's 23.9k was 79% of the
  city-loop builder's addendum. FEAT-006 records "no size guard on the attached file".
- Reviewers never get the known bugs of the features they judge, so they cannot tell a recorded finding from a new one.
- Nothing records what any agent was handed. Every later memory experiment (delivery budgets, decay, use marks) needs
  that baseline first.

The 2026-10-09 ruling stands: builders get no automatic pull. The digest is a deterministic cut of the file the
seat's own brief names, keyed on that brief's own text, as the append is today.

## Assumptions

- A1. `--setting-sources project,local` on `claude -p` drops user rules, user `CLAUDE.md`, user hooks and user MCP for
  the reviewer, as measured for the builder on 2026-10-22 under Claude Code 2.1.299 (R-2646). Installed today is
  2.1.310, whose `--help` still lists the flags. Whether `~/.claude/rules` and user skills follow the `user` source is
  shown only by a real round; that round is a land condition (Seat checks).
- A2. The account email in Claude Code's session context comes from login, not settings, so it likely stays in the
  reviewer's context (inferred). It reaches the repo only if a reviewer quotes it; the identity scan the seat runs on
  review text before `review-ledger keep` catches that.
- A3. With user settings dropped, the Claude reviewer also loses the rulings, the objective, the verifier-pipe hook and
  the user `permissions.defaultMode` (tools outside `--allowedTools`, such as Agent and WebFetch, are denied in `-p`).
  Its bar stays the brief, the tree movement, the known-bug section and the review standard, as for the Claude builder
  today. Question 2 asks; the pack README's contract notes list the reviewer's inputs and what it no longer gets.
- A4. Known-bug lines are inserted under their topic, not only appended (git blame on FEAT-039, FEAT-007, FEAT-013), so
  file order is not age order. The digest fills by "the last whole lines in file order" and never calls them newest.
- A5. Reviewers learn the features from the tree movement both launchers already compute. When the movement names no
  feature with a known-bug file, they fall back to the review brief's first `Feature: FEAT-nnn` line (T5). A review
  with neither gets no section; that is a residual.
- A6. The load log is a private user-home file under pi's active agent dir. It holds working-folder paths, item names
  and memory file names, never file contents, and is never committed. This lane adds no rotation and no reader; the
  artifact entry carries a `Parked:` line naming the memory lanes as its readers-to-be (the format rule requires a
  `Read by:` or `Parked:` line). Each line carries a schema field `v`, as `appendBuildRecord` does.
- A7. The rows this lane amends live in other features: R-2560 and R-2561 (FEAT-007), R-2581, R-2647 and R-2655
  (FEAT-006). The change declaration lists each amendment, and the reviewer reads both features. Question 1 covers it.
- A8. The memory-making and owner-profile lanes plug their later seat delivery into the shared-memory hook. Logging
  that hook's delivery now is the hook change those lanes wait on.
- A9. The effort the user configured is read from the user settings file: `modelSettings[<roster model>].effortLevel`
  when that exact key exists, else the top-level `effortLevel`, else no `--effort` flag. The roster names the reviewer
  by alias (`opus`) while `modelSettings` keys are full model ids, so on this Mac the top-level `xhigh` is used, not the
  `claude-opus-5-5` entry's `medium`. Matching an alias to a full id would need Claude Code's alias table, which nana
  does not hold; that gap is a residual. The level is never a literal in code.
- A10. The log is appended with one `appendFileSync` per line of a few KB, which is atomic enough on POSIX and Windows
  append handles. Concurrent writers are not pinned by a test; a torn line is a residual.
- A11. The hook and the launchers can resolve different agent dirs when `PI_CODING_AGENT_DIR` is set in one environment
  and not the other, splitting the log in two. The READMEs say so.

## Open choices

- O1. Where the digest lives: a new `packages/nana-pack/lib/known-bug-digest.mjs`, or beside the resolver in
  `brief-precedent.mjs`. One function serves pi-worker, claude-review and pi-review either way.
- O2. How the reviewer launchers get feature IDs from the movement: parse `FEAT-nnn · ` lines from the section text
  they already hold, or call `treeMovement` from `scripts/requirements-moved.mjs`. Do not spawn the movement command
  twice.
- O3. Which parts pi-review logs for the seat-supplied `--append-system-prompt` values (count and chars of the values,
  or file sizes when a value is a readable file). Reading those values needs pi-review's nested `piOption`
  (pi-review.mjs line 200); a second caller imports it after a move out of the closure, never a copy.
- O4. Field names in the log line, as long as T6 and T8's facts and the `v` field are present and each line parses as
  one JSON object.
- O5. Whether claude-review's settings file reuses pi-worker's temp-folder naming or gets its own prefix. It must sit
  outside the reviewed tree.
- O6. The minimum length of a brief span used as a match term (chosen, not sealed; declared beside the cap with its
  reason). Short spans such as `-p` must not match every line.

## Questions for the owner

Question: Where do these rows live: a new feature, FEAT-041 · Shape each agent's context by role, under CAP-01 (rows R-3210 to R-3229, artifact A-089), with R-2560, R-2561, R-2581, R-2647 and R-2655 amended in place in their homes?
Default: yes, new FEAT-041 under CAP-01.
What the default gains and misses: one home for every role-context row the memory lanes will add next; it misses that FEAT-006 and FEAT-007 then split their launcher contracts across two features.
Cost of a wrong guess: easy to undo; rows move between features in a later reviewed change, and the feature ID is retired, not reused.
If answered otherwise: the rows go to FEAT-006 (builder digest), FEAT-007 (reviewer isolation and known bugs) and FEAT-004 (load log), and the lane splits into three lanes, one feature each.

Question: The isolated Claude Code reviewer stops getting the rulings, the objective and the verifier-pipe hook. Should it keep any of them?
Default: no for each; it gets the brief, the tree movement, the known-bug section and the review standard, the same inputs as the Claude Code builder.
What the default gains and misses: about 40k chars less per round and one bar for every Claude reviewer; it misses a ruling or priority the review standard does not restate, which the pi reviewer still sees through its extensions.
Cost of a wrong guess: easy to undo; claude-review can add the rulings or the objective output as a section in a later lane, and the verifier pipe guards commands a read-only reviewer should not run.
If answered otherwise: claude-review appends `packages/nana-pack/rules/nana-rulings.md` and/or the `nana-objective` output as sections before the review standard, and T1 pins them.

## Feature

Feature: FEAT-041 · Shape each agent's context by role

Purpose line for the new feature: Give each agent nana launches a bounded context meant for its role, and record what
each delivery handed over.

Rows: R-3210 to R-3229 (seat-assigned range; memory-making holds FEAT-040, R-3188..R-3209, A-088; owner-profile holds
R-3230..R-3249, A-090).

Artifact: A-089 · context load log · user-home store: `<pi agent dir>/nana-context-loads.jsonl` · launch:
`packages/nana-pack/lib/context-load-log.mjs`, with a `Parked:` line naming the memory lanes as readers-to-be.

## Threat model

In scope, honest variation in our own tools' output:

- known-bug files of any size, CRLF line ends, non-ASCII text, a header with no bug lines, a single bug line longer
  than the cap, lines inserted mid-file, a missing file, a feature with no file;
- briefs with or without Precedent paths and backticked spans, and spans too short to mean anything;
- a movement that failed, is empty, names no feature with a file, or names several features;
- user Claude settings missing, malformed, or holding hooks, MCP servers, permissions, effort settings, provider env
  and Windows Git Bash env;
- an agent dir that is missing, read-only, cwd-relative, inside a git worktree, or where the log path is a directory;
- a nana-pack module the hook cannot import (stale checkout, moved file);
- a review interrupted by an error exit or a signal;
- Windows `.cmd` shims for `claude`, and paths with spaces.

Out of scope, deliberate forgery: a known-bug line written to steer a reviewer or builder (it is reviewed repo
content, trusted like the brief); a hand-edited log line (the log is a measurement, not tamper-evident). A finding
outside this model is a residual. Residuals named now: a hard kill (SIGKILL) of claude-review leaves its settings file
in temp; a `%`, `!` or `"` in the temp path blocks the Windows `.cmd` launch, as for the Claude builder today;
concurrent log writes (A10); the alias-to-model gap (A9).

## Precedent

- `packages/nana-pack/bin/pi-worker.mjs` (lines 160–212, Claude Code builder argv): the reviewer isolation copies its
  `--setting-sources`, `--settings`, `--strict-mcp-config` flags and the sealed env in flag settings, and reads their
  names from `packages/nana-pack/bin/worker-config.mjs`, never new literals.
- `packages/nana-pack/bin/pi-worker.mjs` (`readClaudeBuilderSettings`, `writeClaudeBuilderSettings`, lines 236–281):
  private helpers whose second caller is claude-review. Per the 2026-10-22 ruling they move to
  `packages/nana-pack/lib/claude-settings-carry.mjs`, taking a launcher-name argument that defaults to `pi-worker` so
  R-2655's carry-line text stays. They depend on `json-text.mjs`, already shared. R-2655's existing tests prove the
  move.
- `packages/nana-pack/bin/worker-config.mjs` (`CLAUDE_CARRY_KEYS`, `CLAUDE_CARRY_ENV_NAMES`): the carry contract both
  launchers share; the added env names go here with provenance.
- `packages/nana-pack/lib/brief-precedent.mjs` (`readBrief`, lines 45–124): parses the brief's Feature line and
  Precedent entries and resolves the known-bug path. The digest's match terms and the reviewer's fallback feature come
  from `readBrief`, imported, not copied.
- `packages/nana-knowledge/lib/hook.ts` (`renderBlock`, R-222): drop whole items to fit a char cap, never half a line.
- `packages/nana-setup/claude/hooks/nana-shared-memory.mjs` (R-2340 fold line, and the UTF-16 char budget): a cut ends
  with one line saying how much was left out; the digest counts chars the same way.
- `packages/nana-pack/lib/review-movement.mjs` and `review-movement-config.mjs`: a reviewer prompt section with a
  heading and lead line declared in config; the known-bug section follows it.
- `packages/nana-pack/bin/pi-review.mjs` (lines 178–185, 200 and 218): the movement section is written to a temp file
  outside the checkout and appended; the known-bug section is one more file in that folder. `piOption` is the reader
  for the seat's append values (O3).
- `packages/nana-pack/bin/claude-review.mjs` (line 88): the stdin prompt gains the known-bug section between the
  movement section and `STANDARD_HEADING`.
- `packages/nana-pack/lib/lane-watcher.mjs` and pi-worker's signal listeners: cleanup of a launcher's temp folder on
  exit and signals; claude-review takes the signal and exit cleanup, not the watcher (hard kill stays a residual).
- `packages/nana-knowledge/lib/hook.ts` (pull.log append, R-231) and `packages/nana-pack/lib/build-records.mjs`
  (`appendBuildRecord`, its schema field): one JSON line per event, appended, failure never blocks the work.
- `packages/nana-pack/lib/agent-dir.mjs` (`piAgentDir`, `piAgentDirIsCwdRelative`): resolves the log folder and tells
  when it is cwd-relative.
- `packages/nana-setup/claude/hooks/nana-roster-notice.mjs`: a nana-setup hook that loads nana-pack through a dynamic
  `import()` inside a try, so a missing module cannot cost the hook's output. The shared-memory hook follows it.
- `packages/nana-setup/lib/install-check.mjs`: runs the installed hooks in a temp home; gains one assertion that the
  temp agent dir holds one load line after the shared-memory hook runs.
- `packages/nana-pack/prompts/builder-preamble.md` (line 12): the builder's known-bug duty; amended with the digest.

Map search used: "append one JSONL line to a log" (added nana-lifecycle journal and bench run as neighbours; not used),
"known bug file append to builder" (confirmed brief-precedent, known-bugs-config, scripts/known-bugs.mjs), "claude
settings carry keys" (confirmed pi-worker), "shared memory index hook", "review prompt section" (confirmed
review-movement, pi-review). Impact: claude-review is reached by `claude-review.test.mjs` and `lane-class.test.mjs`;
pi-worker and pi-review each by about 80 test modules through launch paths; the shared-memory hook by its three test
files.

## Outside precedent

Aider (Apache-2.0), its repo map: borrow. It fits context to a fixed budget by dropping whole units, never half of
one, and ranks what to keep by relevance to the files in play. This lane fits by chars, ranks by a deterministic match
on the brief's own paths and spans, then fills by file position.

Public reference: OpenTelemetry GenAI semantic conventions (Apache-2.0). Skip: no exporter or trace service is
wanted; one local JSON line per delivery is enough for a baseline.

## Must-meet

Eight tests, one row each in FEAT-041, plus the one seal test for the new cap. Every test runs on macOS, Linux and the
Windows CI leg. Every test that launches anything runs under a temp `HOME` and a temp `PI_CODING_AGENT_DIR`; the log
module takes its path as an argument, so no test writes to the real home.

A char throughout is one UTF-16 unit of the UTF-8-decoded text, the unit the shared-memory budget uses; the unit is
named beside `KNOWN_BUG_DIGEST_CHARS`.

- T1. Claude reviewer starts isolated at the user's effort. WHEN claude-review starts the Claude Code reviewer, the
  claude argv shall hold, after the existing tool lists, `--setting-sources project,local`, `--settings` naming a file
  outside the reviewed tree, `--strict-mcp-config`, and `--effort <level>` where the level is read from the user
  settings as A9 says, with no `--effort` when none is set. Proves the reviewer drops user rules, hooks, MCP and
  auto-memory without losing the effort the user chose. Pins the exact argv order recorded by a fake `claude` for three
  settings fixtures: top-level `effortLevel: "xhigh"` gives `--effort xhigh`; a `modelSettings` key equal to the roster
  model wins over it; no effort key gives no flag. Amends R-2560.
- T2. Claude reviewer settings carry only what it needs, and are cleaned up. WHEN claude-review starts the reviewer,
  its settings file shall hold, from the user settings file, only the carry keys and carry env names, plus the sealed
  reviewer env (`CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`, `NANA_ROLE=reviewer`, `NANA_HANDOFF=off`) under `env`; the file
  shall be created only after every refusal check, and be gone after a normal end, after a non-zero review-ledger
  exit, and after SIGTERM to claude-review. The carry line names `claude-review`. Pins: user settings with
  `apiKeyHelper`, `hooks`, `mcpServers`, `permissions` and env `HTTPS_PROXY`, `CLAUDE_CODE_GIT_BASH_PATH`,
  `CLAUDE_CODE_USE_BEDROCK` and `FOO` yield a file holding `apiKeyHelper`, those three carry names and the sealed env,
  and not `FOO`, `hooks`, `mcpServers` or `permissions`; the path is absent in all three end cases. The carry env names
  gain `CLAUDE_CODE_GIT_BASH_PATH` and the provider names (`CLAUDE_CODE_USE_BEDROCK`, `CLAUDE_CODE_USE_VERTEX`,
  `AWS_REGION`, `AWS_PROFILE`, `CLOUD_ML_REGION`, `ANTHROPIC_VERTEX_PROJECT_ID`, `ANTHROPIC_MODEL` and the
  `ANTHROPIC_DEFAULT_*_MODEL` names), each confirmed against the 2.1.310 binary with provenance. Amends R-2655 for both
  launchers.
- T3. Over-cap known bugs keep what the brief touches. WHEN the brief's feature known-bug file is longer than
  `KNOWN_BUG_DIGEST_CHARS`, pi-worker shall give the builder, in both runtimes, within `KNOWN_BUG_DIGEST_CHARS`: the
  file's lines before its first bug line, unchanged; then every bug line containing one of the brief's Precedent paths
  or backticked spans (at least the O6 length), in file order, while they fit; then the last whole bug lines in file
  order that still fit; all kept bug lines in file order; then the line `<n> known-bug lines omitted for size; read
  the whole file docs/known-bugs/FEAT-nnn.md before you report the known bugs your change touches.` Pins on a
  non-ASCII fixture about three times the cap, with a brief-quoted line near the top: delivered length is at most the
  cap; the header comes first, unchanged; the quoted line is present; the file's last bug line is present; every kept
  bug line is a whole line of the file; adding the next omitted line from the fill would pass the cap; `<n>` equals the
  omitted count; both runtimes deliver the same text; the pi run appends a file outside the worktree. The builder
  preamble's known-bug line gains the same duty: when the known bugs end with an omitted-lines line, read the whole
  file before reporting. Amends R-2581 and R-2647.
- T4. Small files pass unchanged. WHEN the known-bug file is at most `KNOWN_BUG_DIGEST_CHARS`, the builder shall
  receive it byte for byte with no fold line, and the pi builder's third appended prompt shall stay the worktree file.
  Pins a non-ASCII file of exactly the cap in chars (more in bytes): byte-equal delivery in both runtimes, same path as
  today.
- T5. Reviewers see the features' known bugs as context. WHEN the tree movement names features with known-bug files,
  or, when it names none, the review brief's first `Feature:` line names one, claude-review shall send one known-bug
  section between the movement section and the review standard heading, and pi-review shall pass the same section
  text as one more appended prompt file after the movement file. The section's lead line, declared in config, says a
  recorded line is context and does not change a finding's class under the review standard. Features take shares of
  `KNOWN_BUG_DIGEST_CHARS` in movement order, each getting the remaining chars divided by the features left, so a
  short file's unused share passes on; a feature whose share fits no bug line gets its header and the fold line. The
  digest's match terms come from the review brief. For pi-review, the review brief is the first seat-supplied
  `--append-system-prompt` value that is a readable file holding a `Feature:` line. With neither source, no heading.
  Pins byte-equal section text from both launchers' fake children; the lead line; the brief fallback for a movement
  naming no feature; the pass-on of a short file's share; no heading when neither source names a feature with a file.
  Amends R-2561.
- T6. Launchers log what they hand over. WHEN lane-mode pi-worker, claude-review or pi-review starts its child, it
  shall append exactly one JSON line to the context load log in pi's active agent dir, holding `v`, the time, launcher,
  role, runtime, model, effort (Claude reviewer), working folder, lane or item, and, for each part it assembled
  (preamble, brief, known bugs, movement, standard, settings), the part's source, its full chars and the chars
  delivered. pi-worker without `--lane` logs nothing. Pins one line per launch under a temp agent dir, with part names
  and char counts equal to the fixture inputs; the known-bug part's full chars above its delivered chars in the T3
  fixture; no file written by a non-lane pi-worker run; under a temp `HOME` with `PI_CODING_AGENT_DIR` unset, the line
  lands in that temp home's `.pi/agent` and nowhere else.
- T7. Logging never blocks or leaks. IF the load log cannot be appended (its path is a directory), or pi's agent dir is
  cwd-relative, or the log path sits inside a git worktree, THEN no line is written, each launcher shall start its
  child with the same argv and prompt as when it can, and print one stderr line naming the reason; the shared-memory
  hook shall write its stdout before it loads the log module by dynamic import, and its stdout shall be byte-identical
  to a writable run, with exit 0, also when the log module cannot be imported. Pins argv and prompt equality, the one
  stderr line, no file inside the worktree for a cwd-relative agent dir, and stdout equality for the directory case and
  for a missing module.
- T8. The seat's memory delivery is logged. WHEN the shared-memory hook prints the index, it shall append one JSON line
  holding `v`, the hook's name, the session id, the working folder, the entry files printed whole, printed shortened
  and omitted, and the index's full and printed chars. Pins, on an over-budget fixture index, lists whose counts match
  the hook's own fold line, and an unchanged stdout. The hook's `shorten` and render results stay inside the hook file.
- Seal. `KNOWN_BUG_DIGEST_CHARS` is 6000 (chosen: the anatomy research's builder budget, about a quarter of the
  FEAT-039 append that took 79% of a builder addendum). One test pins it naming its row; every other test imports the
  name.

Expected test changes (a forecast, not a limit): `claude-review.test.mjs` (R-2560 argv, R-2561 order);
`worker-lane.test.mjs` and `worker-claude.test.mjs` only where a fixture file passes the cap; the R-2655 tests for
the added env names; `immutable-review.test.mjs` where a movement fixture names a feature with a known-bug file; the
shared-memory tests keep their stdout assertions. The code map, runtime map and requirements outline are regenerated.
Grep tests and checkers for the literals this breaks before limiting edits: the claude-review argv, the carry env
list, and the appended-prompt count in pi-review tests. Grep every test that spawns a launcher or the hook without a
temp `HOME` or `PI_CODING_AGENT_DIR` (today `watchdog-cpu.test.mjs` runs non-lane pi-worker, which T6 keeps silent;
`component-audit`, `hive-city` and `templates-render` only read the file) and give any that would log a temp agent dir.

Contract notes the builder updates: `packages/nana-pack/README.md` (claude-review isolation and the reviewer's inputs,
including what it no longer gets per A3; the effort source; the carry list; the digest and its fold line; the reviewer
known-bug section; the load log and its skip cases), `packages/nana-setup/README.md` (the hook appends one load line;
the split-log case of A11).

## Seat checks

- Land condition, written before the run: one real claude-review round on a small item, at the same effort as the
  baseline round. Pass when the transcript's `instructions` attachment lists no `~/.claude/rules` file, the context
  holds no MCP server instructions, and the first-turn input is at most 42,000 tokens (baseline 52,128; the research
  sizes the removed user rules, MCP listing, memory index and hook output at about 10k to 15k tokens). Record whether
  the account email remains (A2). A fail blocks the land.
- One real pi-worker build on a feature over the cap: read the load log line and the builder's first-turn size.
- `node packages/nana-setup/bin/install-check.mjs` locally on macOS before the land, with the new load-line
  assertion; the Windows CI leg read before the review brief.
- The build brief names the known-bug lines this lane resolves (FEAT-007 "`claude -p` loads user rules, hooks and
  memory", FEAT-006 "no size guard on the attached file") and the FEAT-006 and FEAT-007 lines on these launchers, since
  the lane's own feature has no known-bug file. Before the final round, the seat moves the two resolved lines out in the
  notes commit, since builders may not edit known bugs.
- The identity scan on every kept review text before `review-ledger keep` (A2).

Wrong-code pairs for the seat (each must turn its test red):

- T1: drop `--strict-mcp-config`; drop `--effort`; hard-code `--effort xhigh`; prefer top-level effort over a matching
  `modelSettings` key.
- T2: copy every user settings key; drop `CLAUDE_CODE_DISABLE_AUTO_MEMORY` from the settings env; keep the file after
  a non-zero review-ledger exit; keep it after SIGTERM; print the carry line as `pi-worker:`.
- T3: cut mid-line; fill from the top instead of the end; skip the brief-matched lines; cap only the pi runtime; cap
  only the Claude runtime; count bytes instead of chars; drop the header.
- T4: always route the file through the digest with a fold line.
- T5: omit pi-review's section; give each feature the full cap instead of a share; drop the brief fallback; drop the
  lead line.
- T6: log only on success; log from non-lane pi-worker.
- T7: let the log write throw; write the log inside a cwd-relative agent dir; log before writing stdout in the hook;
  import the log module statically in the hook.
- T8: log only counts, not entry names.

## Left for later lanes

- Planner and adversary context: they are Claude Code Agent-tool subagents with no launcher, so the seat guide and all
  user rules still reach them, and there is no adversary prompt file. A launcher or a prompt file is its own lane.
- pi children: the writing rule (1.5k) and objective (1.8k) still reach builders and reviewers; gating them changes
  AGENTS.md's runtime table and the objective invariant, so each needs its own call.
- pi child skill listing: about 20.4k chars of skills, including document and morning skills, reach every pi builder
  and reviewer. `pi --no-skills` plus named `--skill` paths could cut it; which skills a builder needs is a decision.
- The duplicate passages in nana-soul.md and AGENTS.md (about 2k chars): soul reaches projects without the shared
  section, so removal needs care across projects.
- Logging what pi extensions and the runtime add (AGENTS.md, rules, skills, extension sections); the knowledge pull
  already has pull.log.
- Use marks, a reader or report over the load log, and log rotation.
- Ranked selection beyond the brief-match rule (for example by a lane pack), and reshaping the shared-memory index into
  a ranked digest (the owner-profile and memory lanes).
- Resolving a model alias to its full id for per-model effort (A9).
- The Claude Code subagent builder, which gets no preamble or known bugs (FEAT-006 known bug).

## Revision after the attack

The adversary's findings are in `plan-attack.md` (3 MUST, 13 SHOULD, 11 NOTE). Seat decisions applied: IDs, effort
via `--effort`, temp homes in tests, the re-measure as a land condition, and the widened Question 2.

- M1: taken. T1 passes `--effort` read from the user settings (A9), never a literal; T6 logs the effort; three pairs
  added.
- M2: taken with selection, not whole-file-plus-path. The digest keeps the header, then lines matching the brief's
  Precedent paths and backticked spans, then the last whole lines; the fold line and the preamble tell the builder to
  read the whole file before reporting. Selection is a deterministic substring match on text `readBrief` already
  parses, so it fits this lane.
- M3: taken. T6 is lane mode only; every launching test uses a temp `HOME` and agent dir; the log path is an argument;
  T6 pins where the line lands under an unset agent dir.
- S1: taken. FEAT-041, R-3210 to R-3229, A-089.
- S2: taken. Question 2 covers rulings, objective and verifier pipe; A3 lists them; README contract notes declare the
  reviewer's inputs.
- S3: taken. The carry env names gain Git Bash and provider names, pinned in T2, shared with the builder.
- S4: taken. The moved helper takes a launcher name; the reviewer's sealed env goes in settings `env`; T2 restated.
- S5: taken. File created after refusals, removed on exit, error exit and signals; T2 pins two failure cases; hard kill
  is a residual.
- S6: taken. "Last whole lines in file order"; the fold line no longer says "older"; A4 rewritten.
- S7: taken. T3 pins the header first and that the next omitted line would pass the cap.
- S8: taken. The char unit is named; T3 and T4 fixtures are non-ASCII.
- S9: taken. The section's lead line says a recorded line does not change a finding's class; T5 pins it.
- S10: taken. T5 falls back to the review brief's `Feature:` line, parsed by the imported `readBrief`.
- S11: taken. T7 skips a cwd-relative agent dir or a log path inside a git worktree.
- S12: taken. The hook writes stdout first and loads the log module by dynamic import; T7 pins a missing module.
- S13: taken. Pairs added for every case named; install-check gains a load-line assertion.
- N1: taken. The real round is a land condition with numbers written in Seat checks.
- N2: taken. A3 and the README contract note record the lost `defaultMode`.
- N3: taken as a named residual in the threat model.
- N4: taken. Each line carries `v`.
- N5: taken. A11 and the setup README note.
- N6: taken. T5 defines pass-on of unused shares and the header-only case.
- N7: taken. Seat checks name the lines for the build brief.
- N8: taken. Precedent and O3 name the `piOption` move and keep the hook refactor inside the hook file.
- N9: taken. A6 and the Feature section write the `Parked:` line.
- N10: not pinned; concurrency moves from the threat model to residual A10, because one small append per line is the
  pull.log precedent and a two-writer test would be timing-dependent.
- N11: taken. A2 and Seat checks name the identity scan before keep.
