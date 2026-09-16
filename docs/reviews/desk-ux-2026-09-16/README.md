# Review corpus — desk UX batch, 2026-09-16

Jake's dogfood feedback on nana code, five items: files-changed bar + floating diff window; a live
session picking up new skills; `/skill:` triggers no longer dumping the SKILL.md; an activity line
so a running turn is visibly alive; a streaming thinking card. Built as three Opus-4.8 lanes in
worktrees (`feat/live-feel`, `feat/changes`, `feat/reload`), merged onto `feat/desk-2026-09-16`,
then reviewed as one unit by `gpt-5.6-sol` (slice review tier). Landed on `main` after round 4.

| round | brief | review | verdict | what it caught |
|---|---|---|---|---|
| r1 | `brief-r1.md` | `sol-r1.md` | BLOCK | up to ~1 GiB of SYNC untracked-file reads on the event loop per refresh; a prompt could post while `/reload-runtime` was still running (the desk's 5 s prompt detach returned `pending` and the client treated it as done) |
| r2 | `brief-r2.md` | `sol-r2.md` | BLOCK | budget checked against stale `lstat` sizes (a file can grow under the read); reload completion was a poll on `get_commands` — heuristic, false-completion on unrelated list changes, 15 s hold when nothing changed |
| r3 | `brief-r3.md` | `sol-r3.md` | BLOCK | `limit + 1` probe byte and unreserved concurrent reads still overshoot; `desk_prompt_settled` can be delivered before the client installs its waiter (healthy connection, not just SSE drop) |
| r4 | `brief-r4.md` | `sol-r4.md` | LAND | one MED: the dropped-SSE e2e proved less than it claimed (timing-based; no "no live event" assertion) — folded after the verdict |

Mechanisms that survived: reserve-before-read byte accounting (`plan(size)` runs synchronously
between `fstat` and the first read; reads stop AT the bound); server-side `settlePrompt()` ring of
32 replayed in every `desk_hello`, client `settledSeen` checked before a waiter is installed.
Mechanisms removed under review: `awaitPendingReload()` polling + ceiling; the vacuous stale-tick
activity test.

Also in this land: `session-races.e2e.mjs` had a latent race in three reconnect scenarios (released
a held POST on a wait the pre-reconnect pane already satisfied); a few ms of git work on the same
hello exposed it. Fixed by marking the first bubble and waiting for the rebuilt pane.
