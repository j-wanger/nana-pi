# knowledge-index-recover — plan attack (one adversary)

AMEND. The plan misses the most likely kind of damage. Probes ran on a temp copy of 72abe19a, with a copy of a real 50 MB index plus a synthetic 25 MB one.

1. The original design fails its own promise. The incremental build reads only the files table. A whole page overwritten in the docs table or the FTS data, which is most of the file, passes today's build without error. It would also pass the plan's catch-and-retry. Probe on 25 MB: pages were overwritten at 10, 30, 50, 70, 90 and 99% of the file. The no-op build resolved every time and moved the index mtime, so the hook stopped spawning builds for an hour. At 90–99%, 1 to 5 of 20 pulls failed. Today `status` also printed healthy counts for a docs-page fixture. Fix: run `PRAGMA quick_check(1)` in the build right after openDb, and in status. It flagged every case. Cost (measured): a no-op build went from 14–20 ms to 42–46 ms at 25 MB, and the check alone took 85 ms at 50 MB.
2. The plan's R-2400 case (c) (files root page) asserts only that a query hits. Today that is GREEN, because the build fails but the docs and FTS pages are intact. The plan's Windows close wrong-code pair would therefore survive. Now every case also asserts that build() resolves.
3. Page fixtures use a fixed 0xA5 filler, not random bytes. A random first byte is a valid b-tree page type 4 times in 256.
4. R-2402 now uses the docs-page fixture. It is red today and red on the plan's design: the build resolves and the later pull still fails. With the quick check it heals.
5. Rows are narrowed to their tests. R-2401 had "has other columns", but a table with extra columns builds fine; it now says "lacks a column the knowledge build uses". R-2405 and R-2406 had "damaged"; they now name not-a-database, truncated and page-overwritten, and their tests cover all three. WHEN rows drop "THEN".
6. R-2403 must read its sentinel through a NEW handle. An old handle reads the unlinked file on POSIX and would hide the add-5 wrong code.
7. The design is simpler: close in a finally (close rolls back an open transaction) instead of rollback plus close. There is no retry when the build was already a rebuild. A recovered build prints the rebuild wording for MISSING/UNREADABLE roots; this is unpinned and recorded.

Prototype results:
- The amended design passes 7/7.
- incremental-build 30/30, unreadable-root 7/7, discovery 37/37, hook 98/98 and extension 38/38 all pass, run as single files.
- Today's code fails R-2400, R-2401, R-2402, R-2405 and R-2406.
- Every listed wrong-code pair turned its named check red on macOS.

Files the build touches:
- packages/nana-knowledge/lib/db.ts
- packages/nana-knowledge/lib/build.ts
- packages/nana-knowledge/bin/nana-knowledge.ts
- packages/nana-knowledge/tests/recover.test.mjs (new)
- packages/nana-knowledge/README.md
- REQUIREMENTS.md (FEAT-003, after R-208)
- docs/code-map.md and docs/requirements-tree.md (regenerated)

Conflicts:
- I checked the diff and status of all seven in-flight worktrees. None touches packages/nana-knowledge. They share only REQUIREMENTS.md and the two generated docs, so regenerate after merging main. No wait.
- In this slate, knowledge-sources-unparseable (R-2370s) likely edits build.ts, the bin's status and build commands, the README and FEAT-003. This lane wraps buildLocked's body, so expect a textual conflict.
- Land order: knowledge-index-recover first, then knowledge-sources-unparseable merges main. Whichever lands second re-runs recover, incremental-build, unreadable-root, discovery and hook singly. A sources.json parse error is not a SQLite error, so it never counts as damage.
- shared-memory-index-cap and claude-config-dir may add FEAT-003 rows at the table end. Inserting after R-208 keeps those hunks apart.

The claim most likely wrong: that on Windows, once the handle closes in a finally, the in-process rebuild can delete index.db. It is unproven there, and node:sqlite's close or an antivirus scan holding the new file could block the delete. If so, R-2400's page cases fail only on the Windows leg, and the background heal becomes a retry on the next build.

Data point: the real pull.log holds 978 lines and no query-failed. This hardening is speculative but cheap, so I did not drop it.

## Re-check on the knowledge-sources-unparseable land tip (one adversary, 2026-10-20)

VERDICT: GO-WITH-FIXES

1. Branch from current main, not 29269b13. Main has moved twice since the amendments were written: 36427021 (project-odd-seeds landed) and 63aca2fb (review-launch-win-paths landed). Neither touches packages/nana-knowledge, so every cited line still holds. Re-run the red-on-main probe on the actual branch base.

2. Run checkIndex after every openDb in buildLocked, and drop the "unless this pass deleted the database" gate.
   - Why: build.ts:242–244 swallows a failed delete. A reader holding index.db on Windows makes the delete fail with EBUSY.
   - With the gate, the retry then skips the check, writes into the damaged file and sets `recovered`. It prints "rebuilt from the sources" and moves the mtime, so pulls stay quiet for an hour.
   - Simulated on macOS by making rmSync throw for index.db (<seat-scratch>). The amended build resolved with `recovered` set, and a later query still failed with errcode 11. `build --rebuild` did the same.
   - With an unconditional check (<seat-scratch>), both runs reject. probe2 cases a–c pass for both good and bad sources. sources-file 7/7, incremental-build 30/30, unreadable-root 7/7 and discovery 37/37 all pass.
   - The check on a fresh database costs next to nothing.
   - Rewrite wrong-code pair 2 as "skip checkIndex when opts.rebuild is set". It still turns R-2407's `--rebuild` half red for (c).

3. Change Done and the report to recover.test.mjs 8/8 for R-2400 to R-2407. The amendment still says 7/7. Add R-2407 to the red-on-main list, and to the brief's header range ("rows R-2400 to R-2407").

4. In R-2407's check, also assert what the damaged line names: "file is not a database" for (a) and "malformed" for (b) and (c), as R-2406 does. Otherwise the row's "names the damage" is wider than its test.

5. Call loadSources() inside build()'s `try` whose `finally` runs releaseBuildLock, not between acquireBuildLock and the `try`.

6. In the README sentence, write that a damaged index "is not rebuilt or replaced" instead of "kept as it is". The amendment's own residual says a table of another shape gains the missing tables.

7. Fix the BuildStats location: `problem?` is at :159, but `ms` (:160) and `dbBytes` (:161) follow it. Add `recovered?` and `keptDamage?` next to `problem`, not at the end.

8. Add three HANDOFF residuals:
   - With a valid sources.json, a recovery drops the rows of missing or unreadable roots, as `--rebuild` does. R-883, R-1910 and R-1911 keep those rows only over a healthy index.
   - A failed delete during the retry is unpinned.
   - The README and hook.ts:30 "0.1 s" rationale also predates the check.

Checked and holding: every other cited line, both row ranges, and that no worktree touches packages/nana-knowledge.
- The cited lines: build.ts :228–235, :237, :239, :241, :246, :263–266 and :329; db.ts :90 and :91; bin :42, :43, :120 and :123.
- R-2400 to R-2409 are free on main and in every worktree and slate plan. R-2370 to R-2376 sit directly above R-208.
- No live worktree touches packages/nana-knowledge.
- R-2407 is red on the base and green on the prototype. For (a) and (b), build and `--rebuild` exit 1 with a stack. For (c), both rewrite index.db.
- On the prototype, running `build` then `build --rebuild` on the same fixture keeps the hash and the mtime, and leaves no -wal or -shm (<seat-scratch>).
- The F3 marker line holds neither "damaged" nor "files ".
- Both wrong-code pairs go red as claimed.

The one claim I would most expect to be wrong: that the kept path leaves index.db byte for byte on the Windows leg for (b) and (c). Every piece of evidence, the seat helper's and mine, is from macOS. If SQLite's WAL open and close on Windows writes to the file, R-2407 goes red only on that leg.