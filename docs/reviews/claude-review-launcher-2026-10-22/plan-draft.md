# Lane plan draft: claude-review-launcher

Feature: FEAT-007 · Review a specific revision independently. Also touches FEAT-006 (R-1122, roster shape).
Class: install, hook or gate (review tool). Ladder: final reviewer, land reviewer (pi astra), seat wrong-code pairs, one independent check. No nana-setup change, so no install check (see Known limits 4).
Stakes: medium blast, reversible. A new bin plus one roster constant; pi-review, review-ledger and the watchdog keep their behaviour. A wrong verdict path would feed nana-land, so the ledger stays the only recorder.
Planner: Opus 5.5, read-only, main 09e38e7d, 2026-10-22.

## What changes for the seat

- Today: `bash <scratch>/claude-review.sh <wt> <item> opus <brief> <base> <out>`. It is outside the product, bash-only, fixed to `claude-opus-5-5` / `claude-fable-5-1`, and passes the whole prompt as one argv word.
- After: `node "$HOME/nana-pi/packages/nana-pack/bin/claude-review.mjs" --item <slug> --tree <wt> --brief <file> --out <file> [--role R] [--over-cap WHY]`, the same command on macOS, Linux and Windows (PowerShell: `$env:USERPROFILE`).
- The model comes from the roster's `reviewer` slot. The seat no longer names a model for a final review.
- The base revision moves into the brief. Briefs already name it, and the review standard says a confirmation round reviews "since the revision the brief names". `--base` is dropped: less to validate, one place for scope.
- One-time step after the land: `node .../nana-roster.mjs set reviewer claude-code opus`. It writes user scope only, keeps `nana-pack.json.bak`, and is undone by copying the backup back. The session-start notice then reads `reviewer opus (Claude Code)`, which matches practice. Today it says sol.
- The land review stays `pi-review … -- --provider openai-codex --model gpt-6-astra`, with arguments from the roster's `land` slot. No change.
- The seat deletes both scratch wrappers (`claude-review.sh`, `claude-review-records.sh`) after the land.

## Design choice: new thin launcher, not a runtime inside pi-review

Chosen: a new bin `packages/nana-pack/bin/claude-review.mjs` (about 100 lines) plus `lib/claude-review-config.mjs`. It (1) resolves the roster, (2) reads the brief and the review standard, (3) builds one prompt, (4) spawns `node review-ledger.mjs run --item --out --tree [--role] [--over-cap] -- claude -p --model <m> --allowedTools <list> --disallowedTools <list>` with the prompt piped on stdin, and (5) exits with review-ledger's status.
Why not a runtime in pi-review:
- pi-review is built on pi-watchdog. The watchdog is pi-specific: `piLaunch`, a merged stdout/stderr capture, stdin `ignore`, and a CPU-flat stall kill tuned to the Codex endpoint hang (FRICTIONS 2026-07-17). An Opus review can think quietly for minutes. A flat-CPU kill plus 2 retries would rerun whole reviews, an unmeasured risk. The 232 wrapper rounds ran with no watchdog.
- Adding a runtime branch to the watchdog widens the blast to pi-worker, which runs every builder.
- review-ledger run already does the hard parts for any command: round cap, reservation, cannot-start line (R-2250), Windows PATH/PATHEXT and cmd.exe launch (R-2252), stdin passed unchanged (R-2254), reviewer env (R-1720), unread-verdict handling (R-1620..R-1623), and out-in-tree refusal (R-724/R-1350).
- The wrapper was review-ledger run plus prompt assembly plus a model table. The product keeps exactly that and swaps the model table for the roster.
Trade given up: pi-review's immutable checkout and liveness retries (Known limits 1 and 2). This keeps parity with how the 232 recorded rounds actually ran.
Subtraction: extract pi-review's inline review-standard read (lines 46-61) into `lib/review-standard.mjs` (`readReviewStandard() -> {text}|{problem}`). Both launchers then share it with no duplicated logic. pi-review keeps its message prefix, and R-1106/R-1680..R-1682 tests guard it unchanged.
Rejected: (a) `--brief/--standard` flags on review-ledger run. That pushes prompt assembly into the generic hook and still leaves the model to the seat. (b) A `nana-review` dispatcher over both runtimes. It is nicer, but bigger, and the land path is already in the product. Revisit when a second Claude slot is wanted.

## Where the model comes from

- The roster `reviewer` slot, read with `resolveRoster(piAgentDir())`. A Claude Code entry `{runtime:"claude-code", model}` gives `--model <model>`. The roster vocabulary (`sonnet|opus|haiku|fable`) is also what `claude --model` takes as aliases ("Provide an alias for the latest model (e.g. 'fable', 'opus', or 'sonnet')", `claude --help` 2.1.299, read 2026-10-22). No translation table, and no versioned model id in the product.
- The roster refuses this today: `CLAUDE_CODE_SLOTS = ['largerBuilder']`, and R-1122 says reviewer is a pi entry. The lane adds `reviewer` to `CLAUDE_CODE_SLOTS` and rewords R-1122. Its rationale ("pi-review's inputs never change") still holds, because pi-review reads no roster.
- Other readers checked: roster-notice `entryText` already prints Claude Code entries. `roster-set` parses `claude-code <model>` for any slot. pi-worker reads only builder and largerBuilder. nana-land reads no model. One existing test case flips: `nana-roster.test.mjs:259` "reviewer runtime field" expects "runtime" in the refusal. With the widening that entry is read as a Claude Code entry and refused as "unexpected field provider, thinking". The builder updates that expectation under the R-1122 rewording, not silently.
- A pi entry in `reviewer` (this machine today, and the sealed default) is refused before admission. The refusal names the slot, the entry and both remedies (`pi-review`, or `nana-roster set reviewer claude-code opus`). There is no fallback model.
- Owner's call? No. The owner confirmed the fleet today (Opus does every final review), and `set` records exactly that, reversibly. The seat runs it after the land and reports it. One-word default if the seat wants consent: `yes`. The sealed `ROSTER_DEFAULTS.reviewer` stays pi sol, so a machine with no roster file and no `claude` keeps working with pi-review.

## Windows

- No bash anywhere: the seat runs node. claude-review spawns `process.execPath` with review-ledger's path. review-launch resolves bare `claude` through PATH/PATHEXT: `claude.exe` (native installer, inferred `%USERPROFILE%\.local\bin`) starts directly; `claude.cmd` (npm) starts through cmd.exe.
- The prompt goes on stdin, never in argv. cmd.exe refuses `"`, `%`, `!`, a line feed and a trailing backslash (`win-command.mjs:49`), so the wrapper's `claude -p "$prompt"` cannot run through a `.cmd` shim. Argv carries only `-p`, `--model opus`, and the two comma lists, all cmd-safe. Stdin also avoids Linux's 128 KiB single-argument limit.
- Verified locally: `claude -p` with no prompt argument reads stdin. With empty stdin it exits 1: "Input must be provided either through stdin or as a prompt argument when using --print" (2.1.299, temp HOME probe).

## Candidate must-meet rows (EARS; IDs assigned by the builder from R-2542)

M1 main use. WHEN the roster's reviewer slot holds a Claude Code entry, claude-review shall run review-ledger run with `claude -p --model <that entry's model>` and record the review-shaped output as one round for the item.
 Test: "claude-review starts the roster's Claude Code reviewer and records its round". Setup: temp HOME roster `reviewer: claude-code fable` (deliberately not opus), and a fake `claude` on PATH that logs argv, env and stdin. Asserts: argv is `-p --model fable --allowedTools <list> --disallowedTools <list>`, NANA_ROLE=reviewer, --out equals the fake's answer, and the tally has 1 round with model `fable`. Red on main: the bin does not exist.
M2 prompt. The standard input claude-review gives the reviewer shall be the brief's text, then the text of prompts/review-standard.md exactly once, then the reviewer sentence naming the item and the reviewed tree.
 Test: "claude-review sends the brief, the review standard once, then the reviewer sentence". The brief sits at a path with a space, a quote and an apostrophe. The fake checks order and count. Red on main: no bin.
M3 pi reviewer refused. IF the roster's reviewer slot holds a pi entry, THEN claude-review shall exit 1 before admission naming the slot and its entry, with no claude started and no reservation or round.
 Test: "a pi reviewer in the roster is refused before admission". Red on main: no bin.
M4 roster. WHEN `nana-roster set reviewer claude-code <model>` names a Claude Code subagent model, nana-roster shall store it and print `reviewer: claude-code <model>`.
 Test: "set reviewer claude-code opus is stored and printed". Red on main: validateRosterShape refuses runtime on reviewer.
M5 Windows. WHERE the platform is win32, WHEN PATH resolves `claude` to a .cmd shim, claude-review shall start it with a brief holding `"`, `%`, `!` and line breaks unchanged on its standard input and record its round.
 Test (Windows leg only, SKIP elsewhere): "Windows: claude-review starts a claude.cmd shim with a multi-line quoted brief on stdin and records a round". Red on main: no bin.
M6 exit status. claude-review shall exit with the status review-ledger run exits with, leaving review-ledger's stderr lines and --out unchanged.
 Test: "claude-review passes review-ledger's outcome through". Case a: no `claude` on PATH gives exit 1, a `cannot start claude` line on stderr and in --out, and no round. Case b: a last line `**VERDICT: LAND**` gives exit 1, the unread-verdict line, and the output kept. Case c: a plain `VERDICT: LAND` gives exit 0. Red on main: no bin.
M7 over cap. WHEN the item has used the round cap, claude-review shall pass `--over-cap <reason>` to review-ledger run, so that run admits and records the round with that reason.
 Test: "--over-cap reaches the ledger". Three rounds are seeded. Without the flag the run is refused; with it, the round is recorded with overCap = reason. Red on main: no bin.
M8 inputs first. IF the brief or the review standard is missing, a directory, or blank, THEN claude-review shall exit 1 before admission naming that file, with no reservation and no claude started.
 Test: "a missing, directory or blank brief or standard is refused before admission". Red on main: no bin.
 (Adversary may merge M6 or M8. M8's standard half comes from the shared lib.)

## Tunables (lib/claude-review-config.mjs unless noted)

- `CLAUDE_BIN = 'claude'`. Contract: the Claude Code 2.1.299 binary name.
- `CLAUDE_PRINT_FLAG='-p'`, `CLAUDE_MODEL_FLAG='--model'`, `CLAUDE_ALLOW_FLAG='--allowedTools'`, `CLAUDE_DENY_FLAG='--disallowedTools'`. Contract: `claude --help` 2.1.299, read 2026-10-22.
- `REVIEWER_ALLOWED_TOOLS='Read,Grep,Glob,Bash'`, `REVIEWER_DENIED_TOOLS='Edit,Write,NotebookEdit'`. Chosen for parity with the seat wrapper behind 232 recorded rounds (audit 2026-10-22). Pinned by M1.
- `REVIEW_SLOT='reviewer'`. Contract: the owner's fleet ruling 2026-10-22.
- `STANDARD_HEADING='## Review standard'` and `REVIEWER_SENTENCE` (a template with {item} and {tree}; read-only rule, temp-HOME probes, plain last verdict line, no other verdict line). Chosen: the wrapper's text, minus its base clause and its pi-review aside.
- `worker-config.mjs`: `CLAUDE_CODE_SLOTS = ['largerBuilder','reviewer']`. Contract: R-1122 as reworded, the owner's fleet ruling 2026-10-22. Pinned by M4.

## Wrong-code pairs (the seat runs each; the named test must go red)

1. Hard-code `--model opus`, ignoring the roster (M1's fixture is fable).
2. Spawn claude directly, skipping review-ledger: no round (M1).
3. Omit the standard, append it twice, or put it before the brief (M2).
4. Fall back to a default model when the reviewer is a pi entry (M3).
5. Leave `CLAUDE_CODE_SLOTS` unchanged (M4).
6. Pass the prompt as a positional argument: winCommand refuses it (M5, Windows leg).
7. Always exit 0, or drop review-ledger's stderr (M6).
8. Drop `--over-cap` forwarding (M7).
9. Read the brief after spawning review-ledger: a reservation appears (M8).

## Known limits (go to docs/known-bugs/ or the pack README "Claude Code reviewer" section)

1. No immutable checkout. The reviewer works in the live tree, as all 232 wrapper rounds did. A write there (the reviewer has Bash) or a builder edit makes the verdict unverified (R-717) and consumes the round.
2. No liveness watchdog and no retries. Claude Code's own request retries apply. A hung `claude` hangs the launcher (unmeasured; check the ledger's durationMs on the 232 rounds).
3. The ledger records the alias (`opus`), not the resolved model id, and records a null provider (review-ledger reads `--provider` from child args).
4. Not on PATH: no nana-setup shim or doctor line, which keeps this lane out of install and doctor. A later lane can add it with the install check.
5. Read-only is instructed, not enforced: Bash is allowed. `claude -p` loads user rules, hooks and auto-memory, as the wrapper did. `--bare` needs an API key, so it is not used.
6. Only the reviewer slot. A Claude land model, or a second-opinion Fable review, needs another lane. There is no `--model` override, so seat scripts carry no model names.
7. On Windows the tool list has no PowerShell, so shell probes need Git Bash.
8. A logged-out `claude` prints "Not logged in" on stdout and exits 1. review-ledger then returns the reservation (honest; seen in the temp-HOME probe).
9. claude-review forwards SIGINT, SIGTERM and SIGHUP to review-ledger. review-ledger run does not reap its child (existing), so a killed run leaves a dead-pid reservation that the next admission prunes.

## Threat model

In scope: honest variation in our tools' output and the seat's setup. This covers a missing or logged-out `claude`, a Windows seat (`claude.exe` or `claude.cmd`), an over-cap round, a brief path with spaces or quotes, a brief holding cmd.exe-hostile characters, a pi entry or no roster file, and a reviewer that writes a formatted or misplaced verdict. Out of scope: deliberate forgery, such as a crafted fake `claude`, a hand-edited ledger, or a reviewer told to lie. A finding outside this model is a residual.

## Parallel lanes

- review-outputs-kept: claude-review forwards `--out` verbatim and never creates folders or moves files. The wrapper's forced `lanes/reviews/<item>/` placement is a seat convention, not carried into the product. Whatever that lane changes in review-ledger run (a default or kept copy, an optional `--out`), claude-review inherits, at most changing its usage line. Shared surfaces: the pack README review section, FEAT-007 SUB-010 rows, the code map. The second lane to land merges main and reruns both lanes' tests.
- runtime-map-live (round 3): it touches the code map. Regenerate it after merging main, and expect a map conflict only.
- Template: the shared working-pattern line ("reviewer launcher: `pi-review`") lives in `templates/_shared/working-under-nana-pi.md`. Changing it means a template change and tag. Proposed: leave it for a later lane (default `no`) and document claude-review in the pack README now.
