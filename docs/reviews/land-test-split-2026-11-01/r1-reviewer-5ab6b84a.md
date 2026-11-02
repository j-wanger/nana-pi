I found nothing that blocks this lane. The split does what the brief asks, and every check came through unchanged.

**Does it work on Windows?** Yes. In both full locked runs on the laptop, every land file stayed well under the 180 s target and the 300 s limit:

| File | First run | Run on the merged tip |
|---|---|---|
| `land.test.mjs` | 73.8 s | 101.2 s |
| `land-merge.test.mjs` | 77.5 s | 108.7 s |
| `land-ci-read.test.mjs` | 45.1 s | 63.5 s |
| `land-ci-edge.test.mjs` | 60.3 s | 84.6 s |

Run alone, the four files total 65 PASS and 1 SKIP, as the plan expects for Windows. Main has not changed `land.test.mjs` or `land-fixtures.mjs` since `ac20e30a`, so the "before" list did not need taking again. Removing the line-130 known bug is justified.

**Did every check survive unchanged?** I checked this myself rather than relying on the lane's own script:
- **Code:** I compared the old file's body (after its helpers) with the four new bodies, with the ` R-3490 R-3491` tags removed. It is 830 non-blank lines on each side with no differences. Each new file's body appears word for word in the old file.
- **Helpers:** the six helpers and two constants in `land-checks.mjs` match the old file apart from the added `export`. Each new file still has its own `check`, `failures` and exit line.
- **Shared runner name:** all four files import the review-seeding `runLand` from `land-checks.mjs`, not nana-land's raw `runLand`, so no check silently lost its automatic review setup.
- **Names on macOS:** I ran the four files through `node scripts/test.mjs … --verbose`. All 66 passed in 82 s, and the names match `names-before-posix.txt` exactly. The Windows and macOS lists match before and after the split. The run left the worktree clean.
- **Evidence cells:** all 73 `REQUIREMENTS.md` cells that cite the four land files point at the file that now holds the check. The 21 changed rows differ only in the file name, plus the two new rows.
- **Lane checks:** `requirements-trace` (exit 0), `requirements-tree --check`, `known-bugs` and `map:check` are all green. The code-map exemption moved to `land-ci-edge.test.mjs`, which holds its only use (the `where.exe`/`which` call), and no stale copy is left. No runner config, CI workflow or run-alone list names the old file. `test-runner-config.mjs` and `land-fixtures.mjs` are unchanged.

**Harms:** none. Only test files and docs changed; nothing writes outside the worktree or temp folder, and nothing main does today stops working.

**Findings to record (none blocks the land):**
- **SHOULD:** In the merged-tip run, `profile-store-guards.test.mjs` timed out at 300.3 s, and it took 249.5 s even alone. This lane doesn't touch that file and adds no work, but no known-bug line records it. It belongs in `docs/known-bugs/FEAT-031.md`.
- **NOTE:** R-3490 and R-3491 sit in the FEAT-008 table, while the plan and brief name FEAT-031. The tree movement confirms FEAT-008. This is bookkeeping only.
- **NOTE:** R-3490's 180 s bound is backed only by the lane-folder timing records. The tagged checks don't measure time, so nothing in the suite would catch a later slowdown. The earlier R-3454 row works the same way.
- **NOTE:** the lane's `m3-blocks.mjs` compares only the blocks that start with a `// req:` line, so code between blocks isn't covered. My full-body comparison above covers that gap. Also, each new file copies all of the old file's imports, unused ones included, which is harmless.

None of these touches a recorded FEAT-008 known bug.

VERDICT: LAND
