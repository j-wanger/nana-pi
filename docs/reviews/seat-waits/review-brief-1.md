Feature: FEAT-008 · Integrate and clean up reviewed changes

# Review brief 1: seat-waits

Review `git diff main...HEAD` on feat/seat-waits (one commit, d6db72b2).

Card (owner 2026-11-09: "go with your recommendations on the prior choices", and the reflection ask):
1. The lane CI waiter reads the branch head before re-running a capacity-cancelled run; if the head moved, it ends `ci: superseded at <tip>: branch now at <head>` and re-runs nothing. Two waiters on one branch cancelled each other five times on 2026-11-09.
2. A red run prints its failing test files per job, from the job logs, through one log reader shared with main-ci.
3. `nana-main-ci --wait [--sha]` waits for every main run at the sha with the waiter's deadline; a red leg re-runs once at the same commit; a green re-run reports `flake: <file>` and main counts green; a second red stays red. Flakes are recorded per file, and a file recorded twice is named as needing a fix lane.
4. The frontier's ask lookup lists up to 100 asks with the owner filter; planner.md names `pi-worker --slot` for scout, planner and adversary.
5. A dated ruling records the owner's three decisions; OBJECTIVE.md's order replaces "caller-aware lane test selection" with the lost-round replay and builder-stop checks, and adds the generated-files lane. Rows R-3992–R-3995.

Builder's validation: 15 related test files pass alone (189 checks); the requested replays ran on synthetic payloads (the builder had no access to today's run payloads). Seat's live check: `nana-main-ci --wait --sha 398dfd7d` from this tip waited on today's real main runs and printed both workflows green.

Questions:
- Can the superseded check end a wait that should continue (a re-run of the same tip, a PR head lagging the push, a fork)?
- Can the main wait's single re-run turn a real failure green, or loop, or re-run a run it did not start for this sha?
- Do the ruling and the priority-line edit say only what the owner decided?

Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.

Put exactly one verdict line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, as the last line, and no other line starting with "Verdict".
