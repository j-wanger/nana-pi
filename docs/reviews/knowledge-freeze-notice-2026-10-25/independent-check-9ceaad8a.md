# knowledge-freeze-notice · independent check at 9ceaad8a

Checker: the lane's one independent check, Claude Code, 2026-10-25; class hook lane (the Claude Code UserPromptSubmit pull, the pi extension's pull through the same CLI, and nana-setup doctor); threat model: honest variation in our tools' output, files and environment is in scope (a single-backslash path, a missing comma, a trailing comma, an empty file, a folder at the file's path, good files saved plain, UTF-8-marked, UTF-16LE-marked or with CRLF, a wrong-shape file, an absent file, an index that is absent, fresh, stale or random bytes); deliberate forgery is out.

**Result: MATERIAL none.** Every broken form of sources.json made the lane's pull print one frozen-index notice as its first line. The notice named the user, gave no command, and matched status's marker for the same file. Main printed no notice for the same files. Doctor's new sources row failed with the path, the marker, the clause and a node-path rescan command, and the index row showed the build age. Repairing the file removed the notice on the next pull. No pull, doctor run or build wrote sources.json. The notice adds no measurable time. Six NOTEs follow.

## Setup

```
S=<scratch>/indep-kf
H=$S/home                                   # scratch HOME and doctor --home
K=$H/.pi/agent/nana-knowledge               # = doctor's knowledgeHome under --home
env HOME=$H USERPROFILE=$H NANA_KNOWLEDGE_HOME=$K NODE_NO_WARNINGS=1, NANA_ROLE removed
lane = the worktree at 9ceaad8a; main = the clone at 4af28b0f; both clean before and after
```

- The knowledge CLI picks its home from `NANA_KNOWLEDGE_HOME`, else `~/.pi/agent/nana-knowledge`. Doctor under `--home H` reads `H/.pi/agent/nana-knowledge`. Both were pointed at `$K`, and HOME was `$H`, so seeding and discovery could not touch the real home.
- A two-file scratch markdown folder (`notes/`, two articles with a made-up token) was the one root. The lane CLI built a two-row index from it.
- Drivers, all in `$S`: `lib.mjs` (spawn helpers), `setup.mjs`, `matrix.mjs` (11 file states × both sides: a hit pull, a no-hit pull, status, doctor), `scen.mjs` (session repeat, roles, bad input, junk index, no index, stale index, pi form), `repair.mjs` (doctor's rescan command and the repair flow), `age.mjs` (doctor's age row), `nowrite.mjs`/`nowrite2.mjs` (doctor writes), `absent.mjs`, `timing.mjs`. Raw results: `matrix-all.json`, `scen.json`.
- Every pull ran as the Claude Code form: `node <side>/packages/nana-knowledge/bin/nana-knowledge.ts hook` with hook JSON (`prompt`, `session_id`, `cwd`, `hook_event_name`) on stdin. The pi form ran through each side's own `makePull()` from its extension module.
- Afterwards `find ~/.pi/agent/nana-knowledge -newer <stamp>` listed 0 files, and both checkouts showed 0 changed paths.
- Baseline: the lane's affected test files passed in isolation (sources-file 10/10, doctor-knowledge 5/5, hook 98/98).

## Step 1: pull, side by side, per file state

"notice" means the first stdout line was `[nana:knowledge] sources.json <marker> <clause>`. Every pull on both sides exited 0 with empty stderr. Every file's sha256 was the same before and after its run on both sides.

| sources.json state | main hit pull | lane hit pull | main no-hit pull | lane no-hit pull | status marker = notice marker |
|---|---|---|---|---|---|
| good, fresh session | header + 2 pointers | header + 2 pointers | nothing | nothing | n/a |
| good CRLF / UTF-8-marked / UTF-16LE-marked | header + 2 pointers | header + 2 pointers | nothing | nothing | n/a |
| `{"roots": 5}` (wrong shape) | header + 2 pointers | header + 2 pointers | nothing | nothing | n/a |
| absent (fresh index) | header + 2 pointers | header + 2 pointers | nothing | nothing | n/a; file still absent after each pull |
| single-backslash path | header + 2 pointers | **notice** + header + 2 pointers | nothing | **notice** alone | yes (`at line 3, column 19`, forward-slash advice) |
| missing comma | header + 2 pointers | **notice** + header + 2 pointers | nothing | **notice** alone | yes (`at line 4, column 5`, manual advice) |
| trailing comma | header + 2 pointers | **notice** + header + 2 pointers | nothing | **notice** alone | yes (no place, manual advice) |
| empty file | header + 2 pointers | **notice** + header + 2 pointers | nothing | **notice** alone | yes (no place, manual advice) |
| folder at the path | header + 2 pointers | **notice** + header + 2 pointers | nothing | **notice** alone | yes (`UNREADABLE (no roots read, rows kept)`) |

The single-backslash notice in full:

```
[nana:knowledge] sources.json UNPARSEABLE at line 3, column 19 (no roots read, rows kept). Write paths in this file with forward slashes and any other backslash as two, because JSON reads a single backslash as an escape. The knowledge index is frozen until the user repairs sources.json; the next build after the repair rescans it.
```

The notice holds no file text, no parser message and no path. It names the user and no command. Its length is 178 characters for UNREADABLE, 205 for manual advice and 331 for forward-slash advice. The pointer block after it is byte-identical to the block the same pull prints with a good file.

## Step 2: other pull states (lane, single-backslash file unless named)

| Case | Lane output | pull.log reason | Main output |
|---|---|---|---|
| same prompt, same session, second time | notice alone | (all-shown, not logged, as today) | — |
| reviewer role / worker role | nothing | — | — |
| bad JSON on stdin / prompt `hi` / `/clear` | nothing | bad-json / — / — | — |
| index replaced by random bytes | notice alone | query-failed | nothing, query-failed |
| no index.db | notice alone; a detached build ran | no-index(spawned) | — |
| index mtime 2 h old | notice + header + 2 pointers; a detached build ran | ok | — |
| pi form (`makePull`), hit prompt | notice, header, 2 pointers | — | main's `makePull`: header, 2 pointers |
| pi form, no-hit prompt | notice alone | — | — |

- After the no-index build, sources.json was byte-identical. The new index had 0 rows, which is today's behaviour with a broken file and no prior index.
- After the stale-index build, rows stayed at 2, `built_at` advanced, the index mtime became fresh, and sources.json was byte-identical (R-2408 as planned).
- pull.log held 144 lines from this check, all with exactly the keys `ts, cwd, session_id, source, reason, tokens, hits, ms`. Reasons were ok, no-hits, bad-json, query-failed and no-index(spawned); no new reason appeared. No line held the marker or clause text.
- Not run through the CLI: a pull past its budget. The CLI's own 1.5 s budget could not be forced from outside without a slow disk; the in-process test covers it.

## Step 3: doctor, side by side

Doctor ran as `node <side>/packages/nana-setup/bin/nana-setup.mjs doctor --home $H`.

| State | main `knowledge index` | lane `knowledge index` | lane `knowledge sources` |
|---|---|---|---|
| good (and CRLF, both marks, wrong shape) | ✓ `docs count: 2` | ✓ `docs count: 2; built 0.0h ago` | ✓ `<path> — parses` |
| absent | ✓ `docs count: 2` | ✓ `… built 0.0h ago` | · `<path> — not present; the next build seeds it` |
| each of the five broken forms | ✓ `docs count: 2` | ✓ `… built 0.0h ago` | ✗ `<path> — <marker> <clause> Rescan with \`node <lane>/packages/nana-knowledge/bin/nana-knowledge.ts build\`.` |
| empty home (no index, no file) | ✗ cannot open | ✗ cannot open | · not present; no folder or file created |

- Main has no sources row. Each lane fail detail led with the full path and held status's exact marker.
- With a broken file, doctor's last line on the lane read `35 missing — fix by hand as each ✗ line says: pi pi-subagents, knowledge sources; then run: nana-setup install for the other 33`. The sources fail routes to "fix by hand", not to install.
- Age row, on a copied index with `built_at` set 2.5 h back and the file mtime a day back: lane `built 2.5h ago`, matching status's `built 2.5h ago`; main gave the count only. Through `knowledgeIndexState(db, undefined, now)`: `built_at` of `abc`, `0`, `-5`, empty and one hour in the future, and a dropped meta table, each gave `ok: true` and `no build time recorded`.
- Doctor wrote no file. The empty home stayed empty after main's and the lane's doctor. In the populated home, a file walk before and after each doctor run differed only in `index.db-shm`'s mtime, on main and on the lane alike. sources.json's bytes did not change.

## Step 4: rescan command and repair

1. With the single-backslash file, a third note was added to the root. The pull printed the notice and did not find it. Rows stayed at 2.
2. I ran the rescan command exactly as doctor printed it, through `/bin/sh -c`, with the scratch environment. Exit 0. The build printed the same marker, `preserved 2`, and kept 2 rows. sources.json was unchanged. The pull still printed the notice.
3. I wrote the good file back. The next lane pull printed no notice. The new note was still not found, because the index had not rescanned (a planned known limit). Doctor showed ✓ parses.
4. I ran the same rescan command again. Rows went to 3 (`reindexed 1`). The lane and main pulls both found the new note.
5. sources.json's bytes were unchanged by every pull, doctor run and build in the flow.

## Step 5: timings

Each pull below used a fresh session and the hit prompt. The sides and file states alternated, with n=20 per cell.

| Cell | Wall median (min–max) | pull.log `ms` median (min–max) |
|---|---|---|
| lane, good file | 78.0 ms (73.5–102.8) | 3 (3–4) |
| lane, broken file | 78.8 ms (73.9–84.7) | 4 (3–6) |
| main, good file | 77.2 ms (71.2–84.0) | 4 (3–5) |
| main, broken file | 78.1 ms (73.5–85.8) | 4 (3–5) |

The notice's file read adds about 1 ms inside the pull, far inside the 1.5 s budget and the pi extension's 2 s deadline.

## Windows

No Windows machine was available. CI run 40200450405 for 9ceaad8a: all four install-check legs passed, including Windows floor and ceiling. The three suite legs, Windows included, were still running when this report was written. The Windows path forms in the doctor detail are inferred from the code: the path comes from `path.join`, and the CLI path is quoted only when it holds a space.

## Findings

1. **NOTE**: the UNREADABLE notice has no full stop between the marker and the clause: `UNREADABLE (no roots read, rows kept) The knowledge index is frozen …`. The doctor fail detail reads the same way. The UNPARSEABLE forms end their advice with a full stop, so only this form runs on. The marker is status's exact text by design; this is cosmetic.
2. **NOTE**: doctor's rescan command, run as printed, builds the home the CLI resolves, not the one `--home` named. Run without the scratch environment, it would have built the real knowledge home. This is the plan's listed known limit. I ran it with the scratch environment.
3. **NOTE**: while the file is broken, a stale-index pull starts a build that advances `built_at`. Doctor then shows `built 0.0h ago` beside the ✗ sources row. This confirms the listed known limit.
4. **NOTE**: the notice also prints on no-hit and all-shown pulls, so every eligible prompt carries 178 to 331 extra characters while the file stays broken. This is the planned behaviour (no per-session dedup).
5. **NOTE**: doctor's read-only index open moves `index.db-shm`'s mtime on main and on the lane alike. It is SQLite's shared-memory file, not a user file, and the behaviour predates this lane.
6. **NOTE**: the Windows suite leg at 9ceaad8a had not finished when this report was written. The seat should read it before the review brief, as the plan says.
