Feature: FEAT-006 · Launch builders with execution limits

# Review brief 1: waking

Review only this lane's own commits: `git diff feat/agents-trim...HEAD` on branch feat/waking (the branch starts from the agents-trim lane, which has its own review). Plan: `docs/plan/waking.md`.

The owner, 2026-11-09: "im pretty sure we used to have a pretty nice waking process". Since 11-07 the seat sat idle with lanes open for 11.7 h: a blocking question to an away owner (8 h 43 min), waiters that could never fire (68 min) and a detached launch with no waiter (1 h 51 min). This lane adds three project-scope Claude Code hooks in nana-pi: a turn-end check that blocks once when a lane is open and no recurring wake fires at least every 30 minutes; a question guard that denies a blocking question once the owner has been silent 15 minutes while a lane is open; and a launch guard that denies a lane tool started outside its own background call. The seat wrote `.claude/settings.json` and the ruling change, because the builder's gate refuses that file.

Questions:
- Can any hook block or deny the seat in normal work when it should not (a false block), or break a session outside nana-pi, a builder or a reviewer?
- Does every hook fail open on a bad payload, a missing transcript or unreadable records?
- Does the open-lane function match the real records (unfinished builds open; landed, removed or 48-hour-idle lanes not)?

The hook payload fields (`session_crons`, `background_tasks`, `run_in_background`, `transcript_path`, `origin.kind`) were confirmed in live Claude Code 2.1.317 payloads on 2026-11-09.

Threat model: honest variation in our tools' output is in scope; deliberate forgery is out. The hooks are advisory, never a security boundary.
