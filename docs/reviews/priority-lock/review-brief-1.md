Feature: FEAT-001 · Keep goals and priorities in view

# Review brief 1: priority-lock

Review only this lane's own commits: `git diff feat/waking...HEAD` on branch feat/priority-lock (the branch starts from the approved waking lane, which has its own review). Plan: `docs/plan/priority-lock.md`.

The owner, 2026-11-09: "And why do we keep drifting, this should not be fixed through a memory entry, I have already stated this many times now". The 11-08 fix (a `Serves:` line pi-worker checks for presence) was met by assertion on 11-09 while the seat ran side-repo builds. This lane adds an owner-held `priorityLock` in the user-scope pack config; `pi-worker --lane` refuses any lane whose git common directory is not the locked repository's. Slots, reviews and lands are unaffected; no lock means no change.

Questions:
- Can a lane in the locked repository be refused wrongly (linked worktrees, symlinked or differently cased paths, Windows)?
- Can a lane in another repository get past the check on any launch path, including a rebuild or a Claude Code builder?
- With no `priorityLock` key, is every existing launch unchanged?

Threat model: honest variation in our tools' output is in scope; deliberate forgery, including the seat editing the config, is out.
