# Directory adoption — an unadopted directory is a signal for the seat

*Jake's ruling, 2026-09-28: "A directory with no handoff should be reported to seat, and have seat assign an objective and start accumulating directory-level knowledge." This overrides both the seat's ruling (stay silent) and sol's (print a line in-session) on L3 invariant (g). Design only; lane L5 in tranche 2.*

## The idea

A directory with no handoff is not a missing file. It is a directory nobody has adopted yet: no stated objective, no accumulated knowledge, no frontier. Today that fact is discovered by whoever happens to open a session there, and then discarded. It should travel to the seat, which is the only actor that can do something with it.

Three actors, three different right answers to the same fact:

| Actor | What "no handoff here" means | Right response |
|---|---|---|
| A worker in that directory | nothing actionable — it has a brief | say nothing (noise) |
| A reviewer session | nothing actionable | say nothing |
| **The seat** | this directory is unadopted | **assign an objective, start its knowledge** |

## Why this is cheap: the reader already needed building

The 2026-09-16 plan called for a decision collector in nana-pi and it was never built. The 09-27 review recorded the consequence: the CANNOT path has no reader in product repos, so a session that cannot name its objective writes a marker nothing surfaces. This ruling gives that collector its first concrete consumer, so one mechanism closes two gaps.

## Shape

**Producer** — the handoff extension, where it already computes that no store entry exists for this cwd. It journals one line, not a prompt injection:

```
{"event":"directory_unadopted","cwd":"<canonical>","has":{"handoff":false,"objective":false,"agents":true,"memory":false},"ts":"…"}
```

Bounded and deduped: one line per cwd per day, so a directory opened forty times does not write forty lines. The session sees nothing added to its prompt — the seat's ruling on noise stands for the in-session surface.

**Reader** — a collector the seat runs at session start, beside the objective print. It reports unadopted directories seen since the last session, newest first, capped (five lines, then a count). It reads the journal only; it never walks the filesystem looking for candidates, so an unopened directory never appears.

**Action** — the seat's, not automatic. For each reported directory: adopt it (`nana-setup project` seeds OBJECTIVE/HANDOFF/sessions/AGENTS) and write the objective line with Jake, or dismiss it once (`nana-setup project --not-a-project`, recorded so it stops being reported). Never auto-create files in a directory the user only visited.

**Directory-level knowledge** — adoption makes the directory a knowledge root. The knowledge index already discovers `docs/`, `research/`, `knowledge/` under any repo; a newly adopted directory gets indexed by that existing mechanism with no new machinery. What accumulates: the objective, the frontier, session narrative, and whatever the work deposits.

## What this is not

- Not a prompt line in every session (the noise objection stands).
- Not an auto-adopter: writing files into a directory because someone opened a shell there is the wrong blast radius.
- Not a filesystem scan: only directories where a session actually ran are reported.

## Ruled by Jake (2026-09-28)

1. **Repository root only.** A cwd is reportable only when it is a git repository root. A session in a subdirectory reports the repo root, not the subdirectory; a session in a non-repo directory (`~/Downloads`, a temp dir, a scratchpad) is never reported. Cheap and exact: walk up for `.git`, stop at the first hit, and report that path — no `.git`, no report. This also kills the worktree question: a linked worktree has a `.git` FILE, which counts, so a worktree is adoptable in its own right.
2. **Dismissal is a marker in the directory**, not a central list. A repo root the owner declines gets a marker file committed with the repo, so the decision travels with it and a second machine or a fresh clone inherits it. (Name it in the build; keep it one small dotfile, and have `nana-setup project` recognize it.)
3. **An `OBJECTIVE.md` ends the reporting.** Adoption, not compaction, is the signal — an adopted repo stops being reported the moment it has an objective, long before its first handoff exists.

## Status

Lane L5, tranche 2, after the objective producer (ruling 1) since both write to the session-start surface. L3 keeps today's behavior meanwhile: no in-session line when there is nothing to borrow, the ancestor marker when there is.
