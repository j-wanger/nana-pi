# Independent check — knowledge-index-recover at de48bcdb (2026-10-20)

VERDICT: FINDINGS

Scope: I checked tip de48bcdb in a private clone under <tmp>, with a temp HOME and made-up names. I used base 63aca2fb for side-by-side runs. I ran no win32 probe, because the changed code has no platform branch. Since my clone, the worktree has moved to ad3ae5d6, which only merges main and changes no knowledge library file.

Must-meet and single-file runs:
- `node tests/recover.test.mjs` gave 8 PASS, exit 0.
- `sources-file` gave 7 PASS, `incremental-build` 30 PASS and `hook` 98 PASS, each exit 0.
- `node scripts/code-map.mjs --check` reported 0 problems, and `node scripts/readme-check.mjs` reported 735 claims and 0 problems.

Probes:
1. Healthy index, sources.json with a trailing comma, index.db mtime set back about 32 h, and a shown/ file 49 days old. I ran `build` on base and lane.
   - base: `B: mtime moved: yes; old shown file: 0 left`, `index age h 0.0`
   - lane: `L: mtime moved: no; old shown file: 1 left`, `index age h 32.2`
   - Verdict: REGRESSION. See finding 1.
2. Same state, then 5 pulls through `runHook`, with a counting spawn that runs the real `build`.
   - base: `5 pulls -> 1 background builds started`
   - lane: `5 pulls -> 5 background builds started`
   - Verdict: REGRESSION. See finding 1.
3. `build` over three damaged indexes, then a query.
   - 64 KB of random bytes: `index was damaged (file is not a database) — rebuilt from the sources`, exit 0, and the query hits heron.md.
   - Zero-byte index.db, which is a valid empty database: a normal build with 31 files, and the query hits.
   - Half-truncated, `status` first: `index <tmp>/index.db is damaged (database disk image is malformed) — repair: nana-knowledge build --rebuild`, status exit 0. Then `build` printed `index was damaged (database disk image is malformed) — rebuilt from the sources`, and the query hits.
   - Verdict: HOLDS.
4. sources.json set to chmod 000 over a half-truncated index, then `build` and `build --rebuild`. This case is not pinned by any test.
   - Both runs: exit 0, 0 bytes on stderr, the line `index was damaged (database disk image is malformed) — not rebuilt while sources.json has a problem; ...`, and `sources.json  UNREADABLE (no roots read, rows kept)`.
   - `hash same: yes`
   - Verdict: HOLDS.
5. Healthy index with 40 KB of random bytes written into index.db-wal.
   - `build` gave `files 31 · rows 31 · ... unchanged 31`, exit 0, and `same file (not replaced): yes`.
   - Verdict: HOLDS. A garbage sidecar is not treated as damage.
6. Healthy index.db set to chmod 444, then `build`.
   - exit 1 with `Error: attempt to write a readonly database`, and `same file kept: yes`. Base also exits 1 in this state.
   - Verdict: HOLDS. Code 8 is never treated as damage, so the file is not deleted.
7. Another connection holds an open read transaction (`BEGIN; SELECT`) while `build` adds one new file.
   - `files 32 · rows 32 · reindexed 1`, exit 0, `inode kept: yes`. status then shows `32 files · 32 rows`.
   - Verdict: HOLDS. No false damage.
8. Random-bytes index.db with mtime more than 1 h old, then `nana-knowledge hook` run twice through the CLI.
   - Pull 1: `stdout bytes: 0`, `"reason":"query-failed"`.
   - Pull 2: prints the `[nana:knowledge] untrusted search pointers` block, `- Heron notes — <tmp>/heron.md`, `"reason":"ok"`.
   - `no process left`.
   - Verdict: HOLDS.
9. Broken sources.json with no index.db, then `build`, and then nana-setup's install step `stepKnowledge`.
   - base: `index.db exists after: yes`, install `created | files 0 · rows 0 ...`
   - lane: `index.db exists after: no`. The lane still prints `db 0.0 MB · <tmp>/index.db`.
   - lane install: `skipped | build failed, the pull just stays quiet: exit 0`
   - Verdict: KNOWN BUG. See finding 2.

Findings:
1. MUST: the healthy-index path under a sources problem no longer refreshes the index age or prunes shown/.
   - Cause: `buildLocked` now opens the index read-only for every sources problem, `openDb(paths.db, { create: !problem, readonly: !!problem })`, and `buildOpen` returns before `setMeta(built_at)`, the checkpoint and `pruneShown()`.
   - Requirement R-2407 asks for a byte-for-byte keep only for a damaged index. The lane applied the same keep to a healthy one.
   - Main today refreshes the index age in that state. HANDOFF records that the previous independent check saw it hold.
   - Effect while sources.json stays broken: every prompt in both seats starts a detached build, which runs the full quick_check (about 0.5 s on the README's 273 MB corpus, inferred). Probe 2 shows 5 of 5 pulls against 1 of 5 on main.
   - Requirement R-210 is broken in that state: a build no longer prunes shown/ files older than 7 days (probe 1).
   - The lane's own brief expected the healthy path to keep refreshing ("unlike the sources lane's healthy-index path").
   - A possible fix: check the index read-only first, then, when it is healthy, reopen read-write and finish as main does.
2. Known bug: with a broken sources.json and no index, the build no longer creates an empty index.
   - nana-setup install then reports `skipped | build failed ... exit 0`, a wrong reason for a build that exited 0.
   - Each pull starts a build until the file is repaired. On main, the empty index stays fresh for an hour.
   - The build also prints a db path that does not exist.

HANDOFF:
- The tip has no entry yet for this lane.
- One existing residual becomes untrue on de48bcdb and on ad3ae5d6. It reads "Knowledge sources file (knowledge-sources-unparseable, wrong-code pairs): a build with a broken sources file still refreshes the index age. So the hook does not start a build on every prompt."
  - Either fix finding 1, or rewrite that line to say every pull past the stale age now starts a build, and that shown/ is not pruned while the file is broken.
- The other knowledge lines I read still hold: the sources-file entry, the residuals on the refresh summary and doctor, and the line that doctor names no fix for a corrupt index.

Cleanup: I removed the private copy under <tmp>. No probe process is left. I wrote nothing in <worktrees>, the main checkout, ~/.pi or ~/.claude.
