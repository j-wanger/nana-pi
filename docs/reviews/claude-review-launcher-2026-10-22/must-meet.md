# claude-review-launcher · must-meet (seat, 2026-10-22, after one adversary pass)

Feature: FEAT-007 · Review a specific revision independently (also FEAT-006's R-1122, the roster's shape)

Class: install, hook or gate (a review tool). Ladder: the final reviewer, the land reviewer (the roster's land model), the seat's wrong-code pairs, one independent check, and the macOS install check before the land, because D5 edits `nana-soul.md` under the setup package. Builder: the larger builder. Threat model: honest variation in scope — a missing or logged-out `claude`, a Windows seat (`claude.exe` or `claude.cmd`), an over-cap round, a brief path with spaces or quotes, a brief holding cmd.exe-hostile characters, a pi entry or no roster file, a reviewer that writes a formatted or misplaced verdict; deliberate forgery out (a crafted fake `claude`, a hand-edited ledger, a reviewer told to lie).

Ruling: the owner, 2026-10-22, power mode — "Review tools" is the must slate; the fleet is confirmed with Opus 5.5 as every final reviewer. The audit found 232 of 406 recorded review rounds ran through a seat scratch bash wrapper with fixed model names, outside the product.

The planner's draft (`plan-draft.md`) is the evidence for every choice below; read it for the code paths it checked.

## Seat decisions

- **D1 · A thin new launcher, not a runtime inside pi-review.** `packages/nana-pack/bin/claude-review.mjs` plus `packages/nana-pack/lib/claude-review-config.mjs`: resolve the roster, read the brief and the review standard, build one prompt, spawn `node review-ledger.mjs run --item --out --tree [--role] [--over-cap] -- claude -p --model <m> --allowedTools <list> --disallowedTools <list>` with the prompt on standard input, exit with review-ledger's status. pi-review's watchdog is tuned to the Codex endpoint hang and shared with pi-worker; a flat-CPU kill could stop a quiet Opus review. review-ledger run already does the cap, cannot-start, Windows launch, unchanged standard input and unread verdicts. Subtraction: pi-review's inline review-standard read moves to `packages/nana-pack/lib/review-standard.mjs`, shared by both launchers; pi-review's messages stay unchanged, and the review-standard test harness's copy list gains that one file (adversary S2), the only change to those tests. The launcher handles errors on the child's standard input, so a refused admission or a cannot-start never prints an EPIPE stack, and it always ends standard input (S1). `--tree` is required, and `--brief` is resolved against `--tree`, as the wrapper did (S4, S5). A refused roster file exits 1 naming the file, before admission (S6).
- **D2 · The model comes from the roster's reviewer slot.** A Claude Code entry `{runtime:"claude-code", model}` gives `--model <model>` (the roster's vocabulary is what `claude --model` takes as aliases). `CLAUDE_CODE_SLOTS` gains `reviewer`; R-1122 is reworded to allow it; the two roster test expectations that flip are updated under that rewording: `nana-roster.test.mjs`'s reviewer runtime case, and R-1402's case in `nana-roster-set.test.mjs`, which moves to the pi-only `land` slot (adversary M1). A pi entry in the slot is refused before admission, naming both remedies; no fallback model, no model name in the product. After the land the seat runs `nana-roster set reviewer claude-code opus` once (the owner confirmed the fleet today; reversible through the backup file) and reports it.
- **D3 · The prompt goes on standard input; the base moves into the brief.** cmd.exe refuses `"`, `%`, `!` and line feeds in arguments, so the wrapper's `claude -p "$prompt"` cannot pass a `.cmd` shim; standard input also avoids the 128 KiB argument limit. Briefs already name their base, and the review standard scopes a confirmation round by the revision the brief names, so there is no `--base`.
- **D4 · `--out` passes through unchanged.** The launcher creates no folder and moves no file. Keeping review texts is the review-outputs-kept lane's change inside review-ledger run, which this launcher inherits. Its output must stay outside the reviewed tree.
- **D5 · Every instruction surface names the launcher (adversary M2, S7, N7).** The roster step changes the reviewer for every project and both runtimes on this machine, so the lane updates each surface that says reviews go through `pi-review`: the shared working-pattern template (reviewer launcher: `pi-review` for a pi entry, `node .../claude-review.mjs` for a Claude Code entry; claude-review joins the review tools that make a lane install-class) and the regenerated AGENTS section; `nana-soul.md`'s default-pattern bullet; the pack README's roster contract (the reviewer may be a Claude Code entry, whose model goes to `claude --model`) and a new "Claude Code reviewer" section; the provenance comment beside `CLAUDE_CODE_SLOTS`. A pi seat starts the launcher through node like any other command. The seat runs the roster step only after this lane lands. Another lane (review-outputs-kept) also edits the shared template; whichever lands second merges main.

## Must-meet rows

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2560 | WHEN the roster's reviewer slot holds a Claude Code entry, claude-review shall run review-ledger run with `claude -p --model <that entry's model>` and the declared tool lists, and record the review-shaped output as one round for the item. | `packages/nana-pack/tests/claude-review.test.mjs::R-2560: claude-review starts the roster's Claude Code reviewer and records its round` |
| R-2561 | The standard input claude-review gives the reviewer shall be the brief's text, then the review standard's text exactly once, then the reviewer sentence naming the item and the reviewed tree and holding its read-only and plain-verdict clauses. | `packages/nana-pack/tests/claude-review.test.mjs::R-2561: claude-review sends the brief, the review standard once, then the reviewer sentence` |
| R-2562 | IF the roster's reviewer slot holds a pi entry or the roster file is refused, THEN claude-review shall exit 1 before admission naming the slot and its entry or the file, with no claude started and no reservation or round. | `packages/nana-pack/tests/claude-review.test.mjs::R-2562: a pi reviewer in the roster is refused before admission` |
| R-2563 | WHEN `nana-roster set reviewer claude-code <model>` names a Claude Code subagent model, nana-roster shall store it and print `reviewer: claude-code <model>`. | `packages/nana-pack/tests/nana-roster.test.mjs::R-2563: set reviewer claude-code opus is stored and printed` |
| R-2564 | WHERE the platform is win32, WHEN PATH resolves `claude` to a `.cmd` shim, claude-review shall start it with a brief holding `"`, `%`, `!` and line breaks unchanged on its standard input and record its round. | `packages/nana-pack/tests/claude-review.test.mjs::R-2564: Windows: claude-review starts a claude.cmd shim with a multi-line quoted brief on stdin and records a round` |
| R-2565 | claude-review shall exit with the status review-ledger run exits with, leaving review-ledger's stderr lines and the `--out` file unchanged. | `packages/nana-pack/tests/claude-review.test.mjs::R-2565: claude-review passes review-ledger's outcome through` |
| R-2566 | WHEN the item has used the round cap, claude-review shall pass `--over-cap <reason>` to review-ledger run, so that run admits and records the round with that reason. | `packages/nana-pack/tests/claude-review.test.mjs::R-2566: --over-cap reaches the ledger` |
| R-2567 | IF `--tree` is missing, or the brief or the review standard is missing, a directory, or blank, THEN claude-review shall exit 1 before admission naming what is missing, with no reservation and no claude started. | `packages/nana-pack/tests/claude-review.test.mjs::R-2567: a missing, directory or blank brief or standard is refused before admission` |

R-1122 is reworded to let the reviewer slot hold a Claude Code entry; its test title stays.

### What each test does, and why it is red on main

The planner's draft lists each test's setup and assertions under M1 to M8 (R-2560 to R-2567 in order). Every test runs with a temp HOME roster and a fake `claude` on PATH that logs its argv, environment and standard input, and prints a review. R-2560's roster names `fable`, not `opus`, and `largerBuilder: claude-code sonnet`, so a hard-coded model or the wrong slot fails; it runs from a folder outside the tree and asserts the fake's working folder is the tree, and its argv assertion is an exact match. R-2561's brief exists only under `--tree`, and the sentence must hold the read-only and plain-verdict clauses as literal text. R-2562 adds a malformed roster file. R-2564 runs on the Windows leg only and skips elsewhere. R-2565 covers four cases: no `claude` on PATH (exit 1, the cannot-start line, no round), a formatted last verdict (exit 1, the unread-verdict line, the output kept), a plain `VERDICT: LAND` (exit 0), and a refused admission with a brief of about 256 KB (review-ledger's status, no EPIPE or stack on stderr). Every case has a time limit that fails rather than hangs. Every row but R-2563 is red on main because the launcher does not exist; R-2563 is red because the roster refuses a Claude Code reviewer today. R-2567 adds a missing `--tree`.

## Tunables (`packages/nana-pack/lib/claude-review-config.mjs` unless noted)

- `CLAUDE_BIN` `claude`, `CLAUDE_PRINT_FLAG` `-p`, `CLAUDE_MODEL_FLAG` `--model`, `CLAUDE_ALLOW_FLAG` `--allowedTools`, `CLAUDE_DENY_FLAG` `--disallowedTools` — contract: `claude --help`, Claude Code 2.1.299, read 2026-10-22.
- `REVIEWER_ALLOWED_TOOLS` `Read,Grep,Glob,Bash`, `REVIEWER_DENIED_TOOLS` `Edit,Write,NotebookEdit` — chosen: parity with the wrapper behind 232 recorded rounds (audit 2026-10-22). Pinned by R-2560.
- `REVIEW_SLOT` `reviewer` — contract: the owner's fleet ruling, 2026-10-22.
- `STANDARD_HEADING` and `REVIEWER_SENTENCE` — chosen: the wrapper's text, minus its base clause and its pi-review aside. Pinned by R-2561.
- `CLAUDE_CODE_SLOTS` `['largerBuilder', 'reviewer']` in `packages/nana-pack/bin/worker-config.mjs` — contract: R-1122 as reworded. Pinned by R-2563.

## Known limits (carried to FEAT-007's known-bug file)

- No immutable checkout: the reviewer works in the live tree, as every wrapper round did. A write there or a builder edit makes the verdict unverified and uses the round.
- No liveness watchdog and no retries beyond Claude Code's own; a hung `claude` hangs the launcher.
- The ledger records the alias (`opus`), not the resolved model id, and a null provider.
- Not on PATH and no doctor line; the seat runs it through node on every platform.
- Read-only is instructed, not enforced (Bash is allowed); `claude -p` loads user rules, hooks and memory, as the wrapper did.
- Only the reviewer slot; a Claude land model or a second-opinion review needs another lane.
- On Windows the reviewer's tool list has no PowerShell.
- A logged-out `claude` exits 1 and review-ledger returns the reservation.
- A killed launcher leaves a dead-pid reservation that the next admission prunes.

## Seat steps

- Builds with the larger builder. Wrong-code pairs: the planner's nine (a hard-coded `--model opus`; claude spawned directly, skipping review-ledger; the standard omitted, doubled or first; a fallback model for a pi entry; `CLAUDE_CODE_SLOTS` unchanged; the prompt as an argument (Windows leg); always exit 0 or drop review-ledger's stderr; `--over-cap` not forwarded; the brief read after admission) and the adversary's eight (standard input never ended; no standard-input error handler; the model read from `largerBuilder`; `--tree` not forwarded; the roster's `ok` unchecked; the read-only clause dropped; an argument after the tool lists; `--brief` resolved against the working folder).
- One independent check runs real reviews through the launcher with a fake and with the real `claude` in a temp HOME.
- CI on the draft PR, the Windows leg included (R-2564).
- After the land: `nana-roster set reviewer claude-code opus`; the seat's next review uses the launcher; the scratch wrappers are retired.
- Cross-lane: review-outputs-kept also edits `review-ledger.mjs`; whichever lands second merges main and reruns both lanes' tests.
