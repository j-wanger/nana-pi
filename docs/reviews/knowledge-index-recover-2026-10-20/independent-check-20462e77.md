# Independent check — knowledge-index-recover at 20462e77 (2026-10-20)

VERDICT: HOLDS

Scope: private clone at 20462e77, base = main 7aadbc99 (no knowledge file differs from fed7d7f9). Temp HOME, macOS, Node 22.22.2. No code path in the diff is forced to win32, so I ran no win32 probe. While I worked, the worktree moved to 870b4eee and has an uncommitted edit to seat-mutate.mjs. Neither came from me; I checked only 20462e77.

Must-meet and neighbour test files, each run singly (node <file>):
- recover 10 PASS (R-2400 to R-2409).
- incremental-build 30, unreadable-root 7, sources-file 7, hook 98, discovery 37, extension 38. All PASS, none FAIL.

Probes (setup for each: `fx`, then `build`, damage, then the `kn tip|base` CLI with NANA_KNOWLEDGE_HOME=<tmp>/kh):
P1 `mv drive drive-unmounted; damage docs page; build` -> "index was damaged (… Tree 4 page 4 …) — rebuilt from the sources", "drive MISSING (skipped; the rebuild dropped its rows)", query hits, status 31 rows. HOLDS: this is the rebuild-drops-rows trade the plan records.
P2 `chmod 444 index.db; build` (healthy sources) -> base and tip both exit 1 "attempt to write a readonly database" errcode 8. Hash and inode unchanged on both. HOLDS: no deletion.
P3 `chmod 555 <tmp>/kh; build` -> base and tip both exit 0 "another nana-knowledge build holds …build.lock", hash unchanged. HOLDS: identical to main.
P4 healthy index with an uncheckpointed -wal (with -shm, and with -wal only), trailing-comma sources, mtime 2 days back -> exit 0, UNPARSEABLE line, "preserved 32", the WAL-only row is still readable ("probe=walrow docs=32"), status "built 0.0h ago". HOLDS: the read-only probe does not misreport a healthy WAL index.
P5 `chmod 000 sources.json`:
- random-bytes index -> exit 0, no stack lines, "index was damaged (file is not a database) — not rebuilt…" plus "UNREADABLE", hash unchanged.
- healthy index -> exit 0, "preserved 32", mtime refreshed.
- HOLDS.
P6 0-byte index.db -> healthy sources: base and tip both rebuild 32 rows. Broken sources: base creates an empty index ("files 0 · rows 0"); tip prints "index was damaged (no such table: files) — not rebuilt", the file stays 0 bytes, and status says "damaged (no such table: docs)". Known bug, finding 2.
P7 real CLI `hook` over a docs-page-damaged index with mtime 2 h back -> pull 1 exits 0 silently with pull.log reason "query-failed". The background build moved the mtime. Pull 2 prints "[nana:knowledge] … - Zephyr note — <tmp>/notes/zeph.md", reason "ok". HOLDS (R-2402 end to end).
P8 index.db deleted with a stale -wal/-shm left beside it -> base and tip both "files 32 · rows 32", query hits. HOLDS.
P9 nana-setup project refresh step (stepKnowledgeRefresh), random-bytes index:
- good sources: base "skipped | rebuild failed … Node.js v22.22.2", lane "unchanged | files 32 · rows 32 …".
- broken sources: base "skipped | rebuild failed …", lane "unchanged | rebuilt".
- Known bug, finding 1.
P10 install step (stepKnowledge), broken sources, no index -> base and lane both "created | files 0 · rows 0 …", index.db exists. HOLDS (R-2409 through the install path).
P12 3032-file index (5.4 MB), page 790 overwritten:
- no-op build before the damage: base 107 ms, tip 121 ms.
- status exits 0 with "damaged (… Tree 8 page 791 …)".
- build exits 0 with "rebuilt", 3032 rows, query item2999 hits.
- HOLDS.
P13 healthy index, broken sources, `build --rebuild` -> base and tip print the same lines ("UNPARSEABLE…", "preserved 32"); mtime refreshed on both. HOLDS.
P14 docs-page damage, broken sources, mtime 2 h back, three `hook` pulls -> each pull logs "query-failed" and stays silent. Hash and mtime (15:00) unchanged. No process left. HOLDS by design (R-2407): the age stays old, so every pull past the hour starts a build. Finding 3.
P15 status in the P14 state -> exit 0. It prints "sources … UNPARSEABLE …" and then "index … is damaged (…) — repair: nana-knowledge build --rebuild". `build --rebuild` then exits 0 with "not rebuilt while sources.json has a problem". Known bug, finding 4.

Harm checks:
- No probe or test wrote outside temp; the temp HOME stayed empty.
- No nana-knowledge process was left running.
- No healthy index was deleted (P2, P3, P4, P5, P13).
- The gate and land tools are untouched.
- An older `<tmp>/nk-recover-de48.*` repo copy, dated before this check, sits in the OS temp folder. Another run left it, inside temp.

Findings (none MUST):
1. Known bug: `nana-setup project` reports the knowledge index as "unchanged | rebuilt" when the build kept a damaged index under a broken sources file. Main said "skipped | rebuild failed". The new exit-0 path prints no totals line, so project.mjs falls back to the word "rebuilt", and the report is untrue.
2. Known bug: with a broken sources file, a 0-byte index.db is now reported as damaged and kept, where main created an empty index. Its age is never refreshed, so each pull past the hour starts a build. Rare input.
3. Known limit (design, R-2407): a damaged index under a broken sources file keeps its old age. Every pull past one hour starts a background build, and each build exits after the page check.
4. Known bug: under a broken sources file, status names `build --rebuild` as the repair. That command does nothing until sources.json is fixed. The UNPARSEABLE line above it is the only hint.

HANDOFF lines on the tip that must change:
- Next item 8 says the plan "sits beside the lane worktrees, outside the repo". The plan is now in docs/reviews/knowledge-index-recover-2026-10-20/, and the lane is near its land.
- The residual "a build with a broken sources file still refreshes the index age … No check pins that" is now half untrue. R-2408 pins it for a healthy index, and a damaged index keeps its old age (finding 3).
- The residual "project setup's refresh summary … shows only the totals line" is now untrue for a kept damaged index, which shows "rebuilt" (finding 1).
- The tip has no HANDOFF entry or session entry for this lane yet. The plan's ten known limits also still need to be recorded as residuals.
- The doctor residual ("Some ✗ lines name no fix … a corrupt knowledge index") is still true, so it stays.

Not lane harms: the tip does not contain main 7aadbc99, which changed no knowledge file. The private copy at <tmp>/knowledge-index-recover-check.* has been removed.
