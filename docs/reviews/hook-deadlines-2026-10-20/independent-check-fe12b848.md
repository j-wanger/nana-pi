# Independent check — hook-deadlines at fe12b848 (2026-10-20)

VERDICT: HOLDS

Private copy: R=<tmp>/hook-deadlines-check.vCWw6V. The lane clone is at fe12b848 and a base clone at cdf4b098. Every probe used a temp HOME under $R. T=$R/t1 is a copy of the lane's hooks and lib with stub producers.

Must-meet tests (lane clone, node per file):
- `node packages/nana-setup/tests/hook-deadlines.test.mjs` → 3 PASS (R-2010/2011/2012), real 6.19 s
- `node packages/nana-setup/tests/hook-producers.test.mjs` → 11 PASS, including R-2013's 1500 ms seal
- `node packages/nana-setup/tests/hooks-closed-output.test.mjs` → 7 PASS, including R-2014 and R-2015

Probes:
1. Producer stuck opening a FIFO that has no writer. Stub: `readFileSync("$R/fifo/pipe")` after it writes PARTIAL-OBJ; run `node packages/nana-setup/claude/hooks/nana-objective.mjs` in T.
   → only the exact `OBJECTIVE UNAVAILABLE: producer failed (...)` marker, no PARTIAL-OBJ; exit=0; elapsed=1.543 s. HOLDS (SIGTERM ends a blocked read).
2. Producer writes REAL-OBJECTIVE, exits 0, and leaves a detached grandchild holding stdout for 4 s.
   → marker printed, elapsed=1.560 s. Before this change the hook waited for the grandchild. The bound holds. The real output is lost, but `grep spawn|execFile` on all three real producers finds nothing, so this case does not arise in practice. HOLDS.
3. Real producers, healthy, with a temp HOME holding a read-only copy of the real nana-journal.jsonl (8159 lines) and nana-pack.json: `node $R/measure.mjs $R/lane $R/lane 5`
   → objective 80-83 ms, adoption 34-36 ms, stale-copies 41-44 ms, all status 0.
   With 20 busy loops on 10 cores → objective 101-120 ms, adoption 38-52 ms, stale-copies 59-72 ms. HOLDS (more than 12x margin under 1500 ms).
4. Both adoption producers hung, under the same 2x CPU load: run `nana-adoption.mjs` in T.
   → adoption marker, then the `[nana:install] STALE-COPY CHECK UNAVAILABLE` marker; exit=0; elapsed 3.057 s against the 5 s limit. HOLDS.
5. win32 entries in exec form: `desiredHooks({platform:"win32"})` run as `spawnSync("node", args)` with no shell, against hung stubs.
   → objective `{"command":"node","timeout":5}` gave status 0, 1535 ms, exact marker. Adoption gave status 0, 3039 ms, both markers in order. HOLDS on macOS. I did not observe the real Windows kill behaviour.
6. Healthy output, lane vs base, through the darwin installer commands run with `/bin/sh -c` and the real producers: `node $R/shell.mjs <lane|base> $R/lane`
   → objective 117/117 ms, adoption 113/109 ms, `IDENTICAL healthy output lane vs base`. HOLDS (no regression on the healthy path).
7. Verifier hook with closed pipes, 4 runs per case: `node $R/verif.mjs <hook>`

   | Case | lane exit codes | base exit codes |
   |---|---|---|
   | hit, open | 0,0,0,0 (`permissionDecision":"ask"`) | 0,0,0,0 (same) |
   | hit, stderr closed | 0,0,0,0 (decision still on stdout) | 0,0,0,0 |
   | `not json`, both closed | 0,0,0,0 | 1,1,1,1 |
   | `not json`, stderr closed | 0,0,0,0 | 1,1,1,1 |
   | `{}`, stderr closed | 0,0,0,0 | 1,1,1,1 |

   HOLDS. The fix works and the ask decision is unchanged.
8. Limit boundary: a healthy stub that prints after 1300 ms vs one that prints after 1700 ms.
   → `SLOW-HEALTHY-1300` printed; the 1700 ms stub gave `OBJECTIVE UNAVAILABLE`. HOLDS as designed; the plan declares this limit.
9. Install check: `HOME=$R/home TMPDIR=$R/tmp node packages/nana-setup/bin/install-check.mjs`
   → 15/15 PASS (install, hook objective, hook adoption, hook verifier pipe (Bash), hook knowledge pull, doctor, readme checklist, among others); exit=0. HOLDS.
10. Repo checks: `node scripts/code-map.mjs --check` → 0 problems; `node scripts/readme-check.mjs` → 715 claims, 0 problems; `requirements-moved.mjs --base cdf4b098` → R-2010..R-2015 new (implemented). HOLDS.
11. Test cleanliness: `TMPDIR=$R/tmp2 node .../hook-deadlines.test.mjs` → 3 PASS. $R/tmp2 is empty afterwards, `pgrep nana-hook-deadlines` finds no leftover stubs, and the clone's git status shows 0 lines. `find -newer` over <worktrees>/hook-deadlines and <repo> finds no new files. HOLDS.
12. Killing a producer mid-run: all three producers only read from disk. stale-copies runs `stepSkills(layout,{dryRun:true})`, and every unlink, symlink or mkdir in linkSkill comes after an `if (o.dryRun) return`. A SIGTERM therefore cannot corrupt data. HOLDS.

Findings: none at MUST or known-bug level.

Notes:
- Not verified by me:
  - a cold first run after a reboot (the OS file cache cannot be flushed without sudo);
  - the real Windows kill behaviour and Defender cold-start time.

  The plan already lists these as known limits.
- The probe-2 behaviour (a grandchild holding the pipe gives the marker, not the output) applies to no current producer.
- Unrelated to this lane: an old hung process was found on this machine, pid 39054. It runs `node --no-warnings .../T/e2e-8N0XwN/packages/nana-pack/bin/nana-objective.mjs --cwd .../T/plan.CowjuX` and looks like a leftover from an earlier probe of the code before this change. I did not touch it.
- The worktree has two untracked files, `seat-mutate.mjs` and `seat-mutate-output-fe12b848.txt`. They come from the seat's own runs, not from this check.
