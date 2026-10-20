# Independent check — knowledge-unreadable-root at 08ba23e3 (2026-10-19)

VERDICT: HOLDS

The feature works on macOS. The main bug is fixed: an unlistable root or folder no longer empties its part of the index. No probe found a harm or a broken main use. Two known bugs follow. Neither is a MUST.

Setup: I worked in a private clone at fd0e7ab5, with a main baseline at d4423eff. Every probe used a temp HOME and a temp knowledge home. `kn` below means `node packages/nana-knowledge/bin/nana-knowledge.ts`.

Must-meet tests, each file run alone:
- `node tests/unreadable-root.test.mjs` gave 5 PASS (R-1910, R-1911, R-1912, R-1913, R-883) and exit 0.
- `node tests/incremental-build.test.mjs` gave 27 PASS, `discovery` 37, `hook` 98, `extension` 38. None failed.
- The diff to `incremental-build.test.mjs` adds only `req:` markers. No assertion changed.

Probes:

P1. Main against the lane. I made root a/ and folder b/locked mode 000, deleted b/gone.md, then ran `kn build`, `kn status` and `kn query`.
- main: `removed 3`, status `ok articles <C>/a`, alphasig/lockedsig hits 0/0.
- lane: `<C>/a  UNREADABLE (skipped, rows kept)`, `<C>/b/locked  UNREADABLE (skipped, rows kept)`, `removed 1 · preserved 2`, status `UNREADABLE articles <C>/a`, alphasig/lockedsig/gonesig hits 1/1/0. Exit 0.
- Verdict: fixed. The deleted file is still purged.

P2. Recovery. I locked r/locked (000) and built, then restored it, deleted y.md inside it and built again.
- locked: `preserved 2 · removed 0`.
- restored: `removed 1`, no UNREADABLE line, ysig hits 0.
- Verdict: OK. Kept rows are purged once the folder lists again.

P3. A real macOS privacy-protected root, `~/Library/Safari` (stat ok, readdir EPERM). Both versions ran `kn build` and `kn status`.
- main: `<home>/Library/Safari  0 files  0 rows`, status `ok`.
- lane: `<home>/Library/Safari  UNREADABLE (skipped, rows kept)`, status `UNREADABLE articles <home>/Library/Safari`.
- Verdict: OK. The EPERM path behaves like the chmod case.

P4. Modes.
- Folder mode 311 (no read): `<C>/r/f  UNREADABLE`, `preserved 1`, fsig hits 1. OK.
- Folder mode 444 (read without execute): `removed 1`, fsig hits 0. The plan declares this known limit, and it is confirmed.
- Root mode 311 plus a single-file root: `<C>/r  UNREADABLE`, the file root is indexed, status shows `UNREADABLE` and `ok`. OK.

P5. Sibling names. I locked r/notes, then deleted r/notes-old/o.md and r/notes.md.
- `<C>/r/notes  UNREADABLE`, `removed 2 · preserved 1`, nsig/osig/msig hits 1/0/0.
- Verdict: OK. The boundary check holds.

P6. The hook path. I made the index stale (`touch -t 202601010000 index.db`), locked r/deep (000), and piped a prompt to `kn hook`.
- Both versions print the pointer block. The lane hook exits 0.
- After the background build: main quokka hits 0 (purged), lane quokka hits 1 (kept).
- Verdict: fixed in the hook's detached build.

P7. Setup's parse of the build output. The unlistable folder was named "old files x", and I applied the setup filter (last line containing "files ").
- It picks `files 2 · rows 2 · reindexed 0 · unchanged 1 · removed 0 · preserved 1 · skipped>1MB 0`.
- Verdict: OK. The UNREADABLE lines print before the summary, so setup still reads the summary.

P8. `kn build --rebuild` with root r at mode 000.
- Exit 0. It prints `<C>/r  UNREADABLE (skipped, rows kept)` and then `files 0 · rows 0`.
- Verdict: known bug B below.

P9. A discover parent at mode 000, main against the lane.
- Both print `removed 1`.
- Verdict: no regression. This is the plan's declared residual, confirmed.

P10. A whole subfolder deleted between builds.
- `removed 2`, no UNREADABLE line.
- Verdict: OK. The new per-folder stat does not hide a real deletion.

P11. The new test run with a temp path containing "ok" (`TMPDIR=$P/tmp-brook`).
- Output: `FAIL R-1913: status marks a root that cannot be listed UNREADABLE, not ok` and `FAIL R-883: build names a missing root MISSING and status marks it MISS, both exiting 0`. Exit 2.
- Verdict: known bug A below.

Hygiene: both temp folders were empty after the test runs. The lane worktree and <repo> were unchanged, with the lane worktree's HEAD still at fd0e7ab5. I removed the private clone.

Findings:

A. Known bug, test only: `packages/nana-knowledge/tests/unreadable-root.test.mjs` can fail on correct code. The R-1913 and R-883 checks assert that the status line does not contain "ok", but that line ends with the temp path.
- It always fails on a machine whose temp folder path contains "ok", for example a user named brooke.
- Elsewhere I estimate (did not measure) about 0.1% of runs fail, when the random temp suffix contains "ok".
- Fix: check the status prefix, for example `/^\s+UNREADABLE /`, instead of `!includes("ok")`.

B. Known bug: after `build --rebuild`, an unlistable path is printed with "(skipped, rows kept)", but the rebuild deleted the index and the rows are gone. The existing MISSING line has the same wording, and the README says `--rebuild` rebuilds the index from what exists now. It is misleading output, not data loss beyond what `--rebuild` already documents.

Not verified:
- Windows: nothing in this change takes a Windows-only code path, and I did not run the icacls deny. The lane's CI run (39357305834) was still in progress.
- I could not test running as root (uid 0), so I did not see the SKIP path.

Residuals the plan declared, now confirmed: a folder with read but no execute permission still purges (P4). An unlistable discover parent still purges, as main does today (P9).
