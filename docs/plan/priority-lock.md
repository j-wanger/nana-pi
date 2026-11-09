Feature: FEAT-001 · Keep goals and priorities in view

# Plan: priority-lock

Serves: owner 2026-11-09 — "And why do we keep drifting, this should not be fixed through a memory entry, I have already stated this many times now"

## Purpose

While the owner holds a priority lock on one repository, the builder launcher refuses to start or rebuild a lane in any other repository, whatever the brief says.

On 2026-11-08 the owner asked why the seat keeps drifting; the fix was a `Serves:` line that pi-worker checks for presence only. On 2026-11-09 the seat ran five basketball-geek builds and started a new basketball lane while no nana-pi lane had landed; every brief passed the check by naming a roadmap step or quoting the owner. An independent adversary found the root cause: the system enforces activity, not priority, and every text check can be met by assertion.

## What changes

1. **The lock.** User-scope pack config (`<agent dir>/nana-pack.json`, the file the roster lives in) gains an optional `priorityLock` object: `{ "repo": "<path to the repository's main checkout>", "since": "YYYY-MM-DD" }`. Absent means no lock. Only the owner sets or releases it; nothing in nana-pi writes it.
2. **The refusal.** `pi-worker --lane` (every attempt, first build or rebuild) reads the lock. When the lane worktree's git common directory, resolved to a real path, is not the lock repository's git common directory, it refuses before any spawn: `lane refused: priority lock holds <repo> since <date>; the owner releases it in <config path>`. Slot launches (`--slot`), reviews and lands are not affected.
3. **Fail closed on a bad lock.** A `priorityLock` that is present but malformed, or whose repo has no git common directory, refuses every lane launch and names the config file to fix. Absent config or absent key: no refusal.
4. **Text.** One ruling line replaces nothing: "2026-11-09: In nana-pi, the owner's priority lock in the pack config holds builds to one repository; pi-worker refuses others. Only the owner sets or releases it." One pack README line under the pi-worker section.

## Threat model

Honest variation in our tools' output is in scope: linked worktrees, symlinked or differently spelled paths to the same repo, Windows path case, a missing config file. Deliberate forgery is out; the seat editing the config is a visible act, not a bypass this lane defends against.

## Precedent

- `packages/nana-pack/bin/pi-worker.mjs` — `laneFailure` (line 84) is the refusal path; the brief check runs before spawn.
- `packages/nana-pack/lib/agent-dir.mjs` — call piAgentDir (`packages/nana-pack/lib/agent-dir.mjs:66`) rather than re-implementing it — finds the active agent dir and its `nana-pack.json`.
- `packages/nana-pack/lib/roster-set.mjs` — how the pack reads and validates `nana-pack.json`.

## Validation

- V1: with a temp agent dir whose lock names repo A, launching `pi-worker --lane` from a worktree of repo B is refused with the message; from a linked worktree of repo A it proceeds past the check (use a launch that stops right after the check, e.g. a refused brief, to avoid a real build).
- V2: with no `priorityLock`, behaviour is unchanged.
- V3: a malformed lock refuses and names the file.

## Tests

One test, R-3985, pins the recorded failure: with the lock on repo A, a lane launch in repo B is refused before spawn. No other new test. Requirement IDs: R-3985 only.
