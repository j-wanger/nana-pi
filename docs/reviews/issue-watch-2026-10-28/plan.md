# issue-watch · plan (seat, 2026-10-28)

Feature: FEAT-002 · Resume decisions and next actions

The seat wrote this plan from `$HOME/nana-pi/packages/nana-pack/prompts/planner.md`. The owner picked reading 2 of three on 2026-10-28: "Reading 2 makes sense". One adversary attacked this plan (`plan-attack.md` beside it: 3 MUST, 7 SHOULD, 4 NOTE). The seat took every MUST and SHOULD except self-echo, which stays a known bug. Plans get no review round.

## Purpose

The owner answers open questions as comments on GitHub issues. Today no session hears a comment until it next reads that issue. The owner said: "for any project converted/worked on using our process, with github issues enabled, at session start, the issue comment tracking should be automatically started". With this lane, a seat session in a project whose HANDOFF points to its issues watches for the owner's new comments from the start of the session. Each new comment reaches the seat while the session runs.

The owner's reading 2 has three parts. A pack command watches and prints one line per new owner comment. In Claude Code, the session-start block names that command, and the rule says to run it as a background monitor. A Claude Code hook can only add text, so it cannot start the command itself. In pi, an extension runs the watch itself and hands each comment to the model (O1).

## Assumptions (any may be wrong)

- A1. One gh call per poll is enough: `gh api repos/<o>/<r>/issues/comments?since=<time>` lists comments on every issue, newest last.
- A2. The owner is the only commenter whose words reach the session. Anyone can comment on a public repo, so another person's comment is counted but its text never shown.
- A3. A pi extension may start a timer in `session_start` and must stop it in `session_shutdown` (installed pi 1.0.2, `docs/extensions.md` "Respect the runtime lifecycle").
- A4. Claude Code's Monitor tool runs for at most 30 minutes, so the rule must say to restart it when it expires.

## Open choices

- O1, decided: in pi the comment goes to the model with `pi.sendMessage`, steering a running turn or starting one when idle, so a pi seat reacts as a Claude Code seat does. The owner's own words are in the threat model, so starting a turn is safe.
- O2. Where the pi watch lives: inside `nana-frontier-summary.ts` or in its own extension. Default: inside it, since it already reads the pointer.

## Threat model

In scope is honest variation: no gh, gh not signed in, a slow or failing gh, rate limits, no network, an org-owned repo, zero comments, a burst of comments, long or multi-line comments, comments from other people, a project with list asks, CRLF, builder and reviewer sessions, Windows. Deliberate forgery is out: a forged author, or an outsider with write access. A finding outside this model is a residual.

## Precedent

- `packages/nana-pack/lib/handoff-issues.mjs`: `issuesPointer` decides opt-in, and `readHandoffIssues` is the bounded gh read to follow.
- `packages/nana-pack/lib/gh-runner.mjs`: `ghResult` and `ghFromEnvironment`, the gh call and its test seam.
- `packages/nana-pack/bin/nana-frontier-summary.mjs` and `packages/nana-pack/lib/frontier-summary.mjs`: the session-start block the watch line joins.
- `packages/nana-pack/extensions/nana-frontier-summary.ts`: the pi extension that reads the same block.
- `packages/nana-pack/lib/frontier-summary-config.mjs`: where the sealed read limits live, with provenance.
- `packages/nana-setup/claude/rules/nana-seat.md`: the seat guide, which already says how to run background tasks.

## Must-meet

Rows R-2990 to R-2999. Each check carries its `// req:` marker directly above it.

1. **The watch command.** In a project whose HANDOFF points to its issues, `nana-issue-watch --root <dir> [--since <time>]` polls every sealed interval with one pinned call: `gh api --hostname github.com repos/<o>/<r>/issues/comments?since=<cursor>&per_page=100`. It prints one line per comment created after the cursor and not yet printed, deduped by comment id: `issue #<n> comment by <owner>: <excerpt>`. An edit to an older comment prints nothing. The excerpt is one line, control characters stripped, at most a sealed length. A full page prints one "more comments than shown" line.
2. **Only the owner's words.** A comment is the owner's when its author is the repo owner, or, for an org-owned repo, when `author_association` is `OWNER`. Any other comment prints `issue #<n>: a comment by someone else` with no text.
3. **Restart without loss.** The watch exits by itself before a sealed run time, under Claude Code's 30-minute monitor cap. Its last line gives the exact restart command with `--since <cursor>`, so no comment between runs is lost or repeated.
4. **Failures stay quiet and bounded.** When gh is missing, fails or times out, the command prints one line naming the cause and keeps polling. It prints nothing more until a poll succeeds, then prints one recovery line. It never posts, edits or deletes anything.
5. **No opt-in, no watch.** Without the issues pointer, the command prints one line saying so and exits 0, with no gh call.
6. **Claude Code session start names it.** For an opted-in project, the session-start block ends its issues part with one line giving the exact command to run as a background monitor. The line is there even when the issues read fails, and it fits inside the block's cap; it makes no gh call, so the hook deadline is unchanged. Every other project gets today's block, byte for byte. Builder and reviewer sessions print nothing new.
7. **The rule says to run it.** The seat guide says: at session start, when the block names the issue watch, run it as a background monitor, and when it ends, run the restart command it printed. A builder or reviewer never runs it. The check pins the sentences.
8. **pi runs it itself, without blocking.** In a pi seat session with a UI, in an opted-in project, the extension starts the watch at `session_start`, through an asynchronous gh call, never a blocking one. It clears any earlier timer first, because `session_start` fires again on new, fork and reload. It stops at `session_shutdown`. Each owner comment reaches the model as a quoted comment (O1). Builder and reviewer sessions, and print or JSON runs, start nothing. No timer starts when the extension first loads.

Every printed or delivered excerpt carries a sealed label that marks it as a quoted comment, never an instruction. Tests drive the poll through an injected clock and gh seam, so no test waits or calls the network.

Sealed tunables, each pinned by one test naming its row: the poll interval, the excerpt length, the run time and the quoted-comment label, with provenance in the config.

## Class and size

- Class: `node scripts/lane-class.mjs --root . --files` on the planned files prints `hook: packages/nana-pack/bin/nana-frontier-summary.mjs — launched CLI`. The full ladder applies: wrong-code pairs, one independent check, the land reviewer, and the local macOS install check.
- Size: larger.
