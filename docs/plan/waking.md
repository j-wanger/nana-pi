Feature: FEAT-006 · Launch builders with execution limits

# Plan: waking

Serves: owner 2026-11-09 — "im pretty sure we used to have a pretty nice waking process"; and "How come you seemed to have gone idle before I messaged".

## Purpose

A Claude Code seat in nana-pi never sits silent with a lane open and nothing set to wake it, never freezes the queue on a question to an owner who is away, and never launches a lane tool in a way whose finish cannot wake it.

From 10-28 to 11-03 a 25-minute wake was re-armed by habit and no idle gap passed 40 minutes. The habit lived in one memory file and one ruling sentence; it lapsed on 11-03. Since 11-07, three gaps with lanes open cost 11.7 h:
- 11-08 night: a blocking question asked 76 min after the owner's last message held every notification for 8 h 43 min.
- 11-09: four review LAND verdicts sat 68 min behind hand-written waiters that could never fire.
- 11-09: a lane launched with `( … ) &` had no waiter; 1 h 51 min idle.

The seat armed a recurring session wake on 2026-11-09 by hand. This lane makes the hooks hold it.

## Probe result (2026-11-09, Claude Code 2.1.317, live payloads)

- Stop input carries `stop_hook_active`, `transcript_path`, `background_tasks[]` (`id`, `type`, `status`, `description`, `command`) and `session_crons[]` (`id`, `schedule`, `recurring`, `prompt`).
- PreToolUse input carries `tool_name`, `tool_input` (Bash: `command`, `run_in_background`) and `transcript_path`.
- Project `.claude/settings.json` hooks ran in a headless session with no prompt.
- In the transcript, an owner prompt is a `type: "user"` line with `origin.kind == "human"`; task notifications carry `origin.kind == "task-notification"`.
- Not probed: whether a session cron survives compaction. The turn-end check below covers that: a lost cron is an unarmed lane.

## Threat model

Honest variation in our own tools' output is in scope: record files with partial or bad lines, worktrees removed by hand, lanes that reached main by another route, a missing or unreadable transcript, a payload without the probed fields. Deliberate forgery is out. The hooks are advisory guidance for the seat, never a security boundary. Every hook fails open: on any error it exits 0 and prints nothing.

## Parts

1. **Open lanes** (one shared library function, no command). A lane is open when its worktree still exists and either a build for it has started with no end record yet, or its newest build or land record is under 48 hours old, its tip is not contained in main and it has no landed record. An unfinished build counts as open even when its tip is still contained in main. Lanes untouched for 48 hours are parked, not open.
2. **Turn-end check** (Stop hook). Abstains when `NANA_ROLE` is set, when `stop_hook_active` is true, when the payload has no `session_crons` field, or when there are no open lanes. Otherwise it passes only when `session_crons` holds a recurring job that fires at least every 30 minutes (its hour field is `*` and its minute field fires at least twice an hour). Else it blocks once. The reason names each open lane and says: arm a recurring wake with CronCreate, firing at least every 30 minutes, whose prompt checks each lane and advances anything ready or stalled; if this session is not the seat, end the turn again.
3. **Question guard** (PreToolUse on `AskUserQuestion`). Abstains under `NANA_ROLE` or with no open lanes. Otherwise reads the transcript for the newest owner prompt (`origin.kind == "human"`); when it is more than 15 minutes old, it denies with the reason: put the question in your reply with a one-word default and act on the default, keep lanes moving; a default never authorizes deleting, overwriting or acting outside the working folder, so that one item waits for the owner's yes in a later message. Fails open when the transcript cannot be read or holds no owner prompt.
4. **Launch guard** (PreToolUse on `Bash`). Abstains under `NANA_ROLE`. Denies an actual lane-tool launch when `run_in_background` is not true, or when the command detaches it (`&` after the tool, `nohup`, `setsid`, `disown`). An actual launch is `pi-worker` or `pi-review` with `--brief`, `claude-review.mjs` with `--item`, `nana-ci-wait.mjs` with `--tip`, or `nana-main-ci.mjs` with `--wait`; `--help` and other calls pass. The reason says: run it as its own background call, so its exit wakes the seat.
5. **Delivery.** Project-scope `.claude/settings.json` in nana-pi, with commands run through `node` from the checkout (`$CLAUDE_PROJECT_DIR`). No setup code, no user-scope install, no `.gitignore` change. Confirm `claude-review` sets `NANA_ROLE` for its child; if it does not, set it, so reviewers abstain.
6. **Text.** Ruling 2026-10-15 ("Every builder and long background run gets a failure watcher and a heartbeat at launch.") becomes: "In nana-pi, the turn-end check and the launch and question guards hold the waking rule: a recurring wake at least every 30 minutes while a lane is open, every lane tool in its own background call, and no blocking question once the owner has been silent 15 minutes." Do not edit the seat guide, AGENTS.md or the shared section in this lane.

Every hook only abstains or denies; none answers "ask" (an "ask" overrides the owner's bypass mode).

## Precedent

- `packages/nana-setup/claude/hooks/nana-objective.mjs` — hook entry shape, stdout error guard, fail-open exit.
- `packages/nana-pack/bin/nana-issue-watch.mjs` — the `NANA_ROLE` guard via `LAUNCHER_ROLES` in `packages/nana-pack/lib/frontier-summary-config.mjs`.
- `packages/nana-pack/lib/build-records.mjs` — call readBuildLedger (`packages/nana-pack/lib/build-records.mjs:101`) rather than re-implementing it.
- `packages/nana-pack/lib/land-records.mjs` — call readLandLedger (`packages/nana-pack/lib/land-records.mjs:44`) rather than re-implementing it.
- `packages/nana-pack/lib/frontier-summary-config.mjs` — where role constants live; put the new tunables (48 h lane age, 30-minute wake interval, 15-minute owner window, the lane-tool launch list) in a config module beside it, read by name.

## Outside precedent

none: Claude Code hook payloads are product-specific; the shapes come from the live probe above.

## Validation

Name how to check the result, run small and early:
- V1 replay: feed the Stop hook five recorded states — open lane and no cron (blocks, names the lane); open lane and a daily cron (blocks); open lane and a 20-minute recurring cron (passes); no open lane (passes); `stop_hook_active` true (passes). Then run the open-lane function on the real records and worktrees and list what it calls open; `agents-trim` must be open and `carry-sweep`, `builder-drop` and `seat-memory-push` must not.
- V2 replay: feed the question guard a transcript whose last human prompt is 20 minutes old with a lane open (denies), and one 5 minutes old (passes).
- V3 replay: feed the launch guard `pi-worker --lane x --brief b --out o &` with `run_in_background` false (denies), the same without `&` and `run_in_background` true (passes), `pi-worker --help` in the foreground (passes), and `git status` (passes).
- V4 live: after the land, the seat runs one lane under the hooks; the seat reports each block or deny it saw.

## Tests

Only the three failures that happened, one row each, R-3970 to R-3972:
- R-3970: the turn-end check blocks with an open lane and no recurring wake (11-09, 1 h 51 min).
- R-3971: the question guard denies a blocking question when the owner's last prompt is over 15 minutes old and a lane is open (11-08, 8 h 43 min).
- R-3972: the launch guard denies a detached lane-tool launch (11-09).
Plus one test that pins each new sealed tunable, by the standards. No other new test.

## Adversary changes taken (2026-11-09)

- Unfinished builds count as open before containment; the age limit is 48 h on the newest record.
- The wake must recur at least every 30 minutes; a daily cron does not count.
- A question's default never authorizes a destructive or outside-folder act.
- The launch guard matches actual launches only.
- Cut: the `nana-lanes` command and the `.gitignore` edit.
- A non-seat session escapes by ending its turn again.
