# project-check-line · independent check and real-run check at 91ea70fe

Checker: the seat's real-run checker, the lane's one independent check (hook lane). No model calls. Read-only on every home repository, the main checkout and the lane worktree; this file is the only file written in the repo.

- Lane tip: `91ea70fe` (`feat/project-check-line`, merge base `d547b329`).
- Main checkout: `bd7f0f75`. Between the merge base and main, only `packages/nana-pack/lib/suite-records.mjs` changed under `packages/`, so every difference below is the lane's.
- Node 22.22.2, macOS. `<main>` = `~/nana-pi`, `<lane>` = `~/nana-pi-wt/project-check-line`, `<scratch>` = this lane's scratch folder. Every run used `env -u CLAUDE_CONFIG_DIR HOME=<scratch>/ic/home USERPROFILE=<scratch>/ic/home TMPDIR=<scratch>/ic/tmp`, cwd `<scratch>/ic/tmp`.
- Labels: the 19 git repositories directly under `~/` with an AGENTS.md or OBJECTIVE.md entry. P1–P5 hold OBJECTIVE.md and the marker pair; P6–P10 hold OBJECTIVE.md and no marker pair; N1–N8 hold neither; C0 is the main nana-pi checkout; W0 is the lane worktree (added to step 2 only). Within each group the numbers follow alphabetical order, so they need not match the plan draft's numbering. The mapping stays in `<scratch>/ic/labels.txt`.

Verdict: no MUST, no SHOULD, four NOTEs. The feature works for its user on both seats, the lift leaves `project --check` byte-identical on every home repository and on 18 odd-entry fixtures, and I found no path to harm.

## Step 1 · byte diff of `project --check`, main against the lane

Command, per repository, both runs started together (`( … ) & ( … ) & wait`), script `<scratch>/ic/step1.sh`:

```
node <main>/packages/nana-setup/bin/nana-setup.mjs project <root> --check   > ic/out/check/<label>.main.txt; echo $? > <label>.main.rc
node <lane>/packages/nana-setup/bin/nana-setup.mjs project <root> --check   > ic/out/check/<label>.lane.txt; echo $? > <label>.lane.rc
```

stdout and stderr were both captured. Result: **19 of 19 byte-identical, exit codes equal (1 on every repository: each has at least one ✗ or ! row).**

| Label | Bytes | ✗ rows | Identical |
|---|---|---|---|
| P1 | 1077 | 1 | yes |
| P2 | 1255 | 1 | yes |
| P3 | 1050 | 1 | yes |
| P4 | 1050 | 1 | yes |
| P5 | 1002 | 1 | yes |
| P6 | 1172 | 1 | yes |
| P7 | 1172 | 1 | yes |
| P8 | 1164 | 1 | yes |
| P9 | 1203 | 2 (the sessions README and the config row `.pi/nana-pack.json`) | yes |
| P10 | 1160 | 1 | yes |
| N1 | 1363 | 6 | yes |
| N2 | 1373 | 6 | yes |
| N3 | 1373 | 5 (keeps its own HANDOFF.md) | yes |
| N4 | 1375 | 6 | yes |
| N5 | 1373 | 6 | yes |
| N6 | 1375 | 6 | yes |
| N7 | 1357 | 6 | yes |
| N8 | 1365 | 6 | yes |
| C0 | 1031 | 2 (OBJECTIVE.md, the sessions README, by design) | yes |

Writes: a marker was touched before the runs; afterwards `find <root> -maxdepth 3 -newer <marker> -not -path '*/.git/*' -not -path '*/node_modules/*'` over all 19 roots listed one entry, C0's `.git` directory itself. Its `.git/worktrees` changed at 22:46:53, ten seconds after the last check output (22:46:43). The new entries were `.git/worktrees/wt*`, from another lane's mutation runs creating worktrees. The check does not touch `.git` when it exists. No tracked or untracked file changed in any repository. The scratch HOME and TMPDIR gained no file. A second marker window around step 2 listed nothing at all.

## Step 2 · the session line, main against the lane

Driver `<scratch>/ic/driver.mjs` imports a checkout's `packages/nana-setup/lib/stale-copies.mjs` and calls `projectStaleLine(root, { env: {} })` for each root. Two measurements:

1. **Direct**: main's and the lane's module imported from their own checkouts, run together. The line carries the checkout's own `nana-setup.mjs` path, so P1–P5 differ only in that path. After I replaced each checkout path with one placeholder, P1–P5 are identical.
2. **Same path**: `git archive bd7f0f75` and then `git archive 91ea70fe`, each extracted to the same `<scratch>/ic/co` and driven in turn. This gives raw bytes:

| Label | Main | Lane | Result |
|---|---|---|---|
| P1 | 296 B: AGENTS.md working section | 296 B: AGENTS.md working section | byte-identical |
| P2 | 293 B: AGENTS.md working section | 293 B: AGENTS.md working section | byte-identical |
| P3 | 289 B: AGENTS.md working section | 289 B: AGENTS.md working section | byte-identical |
| P4 | 293 B: AGENTS.md working section | 293 B: AGENTS.md working section | byte-identical |
| P5 | 292 B: AGENTS.md working section | 292 B: AGENTS.md working section | byte-identical |
| P6 | none | 287 B: docs/sessions/README.md | lane only |
| P7 | none | 293 B: docs/sessions/README.md | lane only |
| P8 | none | 289 B: docs/sessions/README.md | lane only |
| P9 | none | 294 B: docs/sessions/README.md | lane only |
| P10 | none | 287 B: docs/sessions/README.md | lane only |
| N1–N8 | none | none | both silent |
| C0 (nana-pi checkout) | none | none | both silent |
| W0 (linked worktree) | none | none | both silent |

Each lane line on P6–P10 has the form `[nana:project] PROJECT STALE: docs/sessions/README.md — tell the user; they fix it with `node "<checkout>/packages/nana-setup/bin/nana-setup.mjs" project "<root>"``. P9's config row is left out, as designed. All matches expected. In-process cost per root: main 0.02–0.96 ms, lane 0.02–2.30 ms (the highest is the first call).

The pi seat, driven by `<scratch>/ic/ext.mjs` (node `--experimental-strip-types`, a stub `pi.on`, `session_start` then `before_agent_start`) from each checkout, set `nana-project-stale` to exactly the driver's line on P1, P6, N1 and C0 (P6 set on the lane only; N1 and C0 unset on both).

## Step 3 · independent question: does it work for its user, and can it harm?

### The fix the line names, end to end

On a `git archive HEAD` copy of P6 at `<scratch>/ic/fix/copy` (then `git init`):

- Before: the lane line, and the real producer `node <lane>/packages/nana-setup/bin/stale-copies.mjs --cwd <copy>` (child, rc 0), both printed one line naming `docs/sessions/README.md` with `node "<lane>/…/nana-setup.mjs" project "<copy>"`. Main printed nothing. `project <copy> --check` showed one ✗, the sessions README.
- Fix: I ran the command text taken from the line's code span, unchanged: rc 0, `+ docs/sessions/README.md created`, every other row `unchanged` or `skipped`, and the knowledge refresh skipped because the scratch HOME has no index (no child started).
- After: the line is gone (driver ""), and the producer printed 0 bytes. The check has no ✗ row; it keeps the `!` rows for the unmarked region and project trust, which the line does not name, by design.
- Writes: in the copy, exactly one new file, `docs/sessions/README.md` (file-list diff). Outside the copy, nothing newer than the marker in the 19 home roots, the lane worktree, the scratch HOME or `~/.pi`, and nothing in `~/.claude` outside session transcripts.

Through the real Claude hook: on a fresh `git archive` copy of P7, `CLAUDE_PROJECT_DIR=<copy>/sub/deeper node <checkout>/packages/nana-setup/claude/hooks/nana-adoption.mjs`. Main printed nothing (rc 0). The lane printed the one line with the canonical root `<copy>` (rc 0). Nothing was written.

R-2765 shapes, each followed by the named fix: OBJECTIVE.md present, HANDOFF.md absent, and a drifted marked AGENTS.md that is mode 000, holds cp1252 bytes, or is over the 1 MiB cap. Each line named only `HANDOFF.md` with the `project` command. Running that command exited 0 and created HANDOFF.md, and the line was then gone. `project` left the cp1252 AGENTS.md bytes unchanged (its region refresh decodes with the fatal decoder), so following the line does not rewrite an invalid-UTF-8 AGENTS.md.

### Code read

- **Child process:** none. A static import walk (`<scratch>/ic/graph.mjs`) of `lib/stale-copies.mjs` finds 15 modules on main and 16 on the lane. The only addition is `lib/project-rows.mjs`, which imports `node:fs`, `node:path` and `working-region.mjs`. There is no `child_process`, no `project.mjs` and no `steps.mjs` in the library graph. `bin/stale-copies.mjs` adds the same single module; its `child_process` import was already there on main (via steps and doctor). At run time, with every `child_process` function patched to count calls (`<scratch>/ic/spawncount.mjs`), 57 calls of `projectStaleLine` made 0 spawns and 0 throws. The 57 covered the 20 roots, every odd fixture, each fixture's `docs` subfolder and the fix copy.
- **TypeScript:** none. The graph holds no `.ts` module and no dynamic `import()`.
- **Throws past the guard:** none. The whole body of `projectStaleLine`, from the role guard to the return, sits in one `try { … } catch { return ""; }`. Both callers' code is unchanged, and nana-rulings wraps the call again. Reads on the producer path are lstat-gated, then go through `readBounded` (O_NONBLOCK plus an fstat regular-file check, 1 MiB cap) and a fatal decoder. FIFOs at AGENTS.md, CLAUDE.md, every seed, `docs`, `docs/sessions` and this month's log path, and a CLAUDE.md link to a FIFO, all returned at once (no child hit its 10 s limit).
- **Text read from an entry:** none. Every label comes from a string literal in `projectFileRows` (the working-region row is mapped to the sealed `PROJECT_STALE_LABEL`). A row's `detail`, which holds link targets, is never read by the line. The only variable text is the canonical root inside a code span. It is guarded by `PROJECT_STALE_NO_PATH_CHARS`, `printable()` and `codeSpan`'s cap, with the path-free fallback for both spans. A HANDOFF.md dangling link whose target holds a newline and 600 characters gave a one-line result with no target text.

### `project --check` on odd entries (main against the lane)

Harness `<scratch>/ic/odd.mjs`: a seeded git repository per case (OBJECTIVE, HANDOFF, sessions README, a 2000-01 log, a drifted marked AGENTS.md, the CLAUDE.md import, `.pi/nana-pack.json`), with one entry changed. Both CLIs ran with `--check` under a 20 s limit.

| Case | stdout+stderr+status |
|---|---|
| AGENTS.md a FIFO, a dangling link, a directory; AGENTS.md absent with a dangling CLAUDE.md | identical |
| OBJECTIVE.md a FIFO; HANDOFF.md a dangling link with a newline in its target; `docs` a FIFO; `docs/sessions` a FIFO; the README a FIFO; this month's log a FIFO with no other log | identical |
| CLAUDE.md a FIFO, a link to a FIFO, a mode-000 own file, a dangling link; `.pi/nana-pack.json` a FIFO | identical |
| AGENTS.md with a BOM before the begin marker and a cp1252 byte; a matching region | identical |
| **AGENTS.md mode 000** | same rejection: empty stdout, `Error: EACCES: permission denied, open '<fx>/AGENTS.md'`, exit 1 on both. Only the stack frames differ, by two added frames (`readText`, `projectFileRows`), because the code moved. |

On the same 18 fixtures, the lane line's rows equal the check's ✗ rows among the seven file rows, in order. Its by-hand labels equal the check summary's by-hand list filtered to the seven (`<scratch>/ic/parity.mjs`): 18 of 18. The moved `today`, `lstat` and `seedEntry` bodies are textually identical to main's. `CLAUDE_IMPORT` and `PLACEHOLDER_RE` keep their values. `project.mjs` exports the same 27 names as on main.

## Findings

- **NOTE · the pi seat has no time limit on the new link-following calls (inferred, not measured).** On main, the producer path never followed a link: it read AGENTS.md only when lstat showed a regular file. The lane's rows `stat` an intermediate `docs` link, list `docs/sessions` through it, and `realpath` a CLAUDE.md link and AGENTS.md. In the Claude seat this is bounded by the 2,500 ms producer limit, as the attack's N10 says. In the pi seat, nana-rulings calls `projectStaleLine` synchronously inside `session_start` with no limit. A seed link into a hung network mount would block pi's session start until the filesystem call returns. When the seat writes the N10 known limit, it should name the pi seat and the `docs` link as well as the CLAUDE.md link.
- **NOTE · the by-hand pointer can lead to a crashing check (measured).** A root with OBJECTIVE.md a directory and a mode-000 AGENTS.md gets `… OBJECTIVE.md — tell the user; they fix it by hand as `… project "<fx>" --check` says`. That check exits 1 with an EACCES stack trace naming AGENTS.md before it prints any row. This is the seat's S7 decision, which keeps the check's main behaviour, and the error does name the file to fix. It is recorded here so it reads as a known edge, not a surprise.
- **NOTE · nana-setup README wording.** The session-start paragraph now says the producer names "every failing objective, frontier, session-log or navigation file row". The sentence it replaced named the differing working section, which the line still reports. The pack README's rulings bullet does list "refreshable working-section". A reader of the nana-setup README alone may not see that the working-section line remains.
- **NOTE · known limits not yet in the tree at this tip.** The FEAT-014 known-bug file does not yet carry the must-meet's limits (N3, N4, N5, N10, N11, and the raw link target with a newline in `project --check`). The must-meet assigns them to the seat before the final round; this note is a reminder only.

Not run: the lane's own test files. Another lane's full suite (`npm run test:locked`, started about five minutes before) was running on this machine, and the seat's steps cover them.
