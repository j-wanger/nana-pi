# Lane win-pi-handoff — build brief 2 (2026-10-17 · feat/win-pi-handoff · tip f718a1c, main merged)

**Builder: Claude Sonnet 5**, the same worktree and rules as brief 1. Windows run 1 (`ci-windows-run-1.log`, on 41542d6):
frontier, handoff-artifact, handoff-store and handoff-trust now pass on Windows. Three files still fall short of HD1.

**1. `display-surfaces.test.mjs`: 140 pass, 2 fail, then a crash at :207.**
- The two post-edit checks fail because cmd.exe refuses the checker's working folder: `'\\?\C:\Users\...\post-edit'`,
  "UNC paths are not supported". The folder comes from `HOME` (:22). The evidence points at `fs.realpathSync.native`
  returning a `\\?\`-prefixed path on this runner (INFERRED; the log shows the prefix on the command's script path,
  which is built only from `HOME`). On win32, drop a leading `\\?\` from `HOME` after the realpath. Confirm the cause
  from the code before you change it.
- The crash at :207 reads `mod.storePathFor(repo)` and gets ENOENT. The product hashes its own canonical form of the
  folder, so a `\\?\`-prefixed `repo` gives a different file name. Fixing `HOME` should fix this; if not, find which
  form the product hashes and build the expected path the same way.

**2. `handoff-staleness.test.mjs`: 15 pass, 3 fail, then a crash at :150.**
- The three "15d" checks fail because `NANA_HOME` (:26) is an 8.3 short path (`C:\Users\RUNNER~1\...`). The product
  will not shorten any path holding `~` to `~\...` (`nana-handoff.ts:100`, by design), so the pointer shows the full
  path, runs past its budget and loses its tail. Realpath `NANA_HOME` with `fs.realpathSync.native`, then drop any
  leading `\\?\`, before setting `HOME` and `USERPROFILE`.
- The crash: the long-HOME block sets a ≈290-character `USERPROFILE`, and `os.homedir()` then throws
  `uv_os_homedir returned ENOBUFS` on Windows. Windows cannot hold a home that long. Skip that block on win32 with a
  SKIP line giving this reason, and keep it running elsewhere.

**3. `post-edit-file-queue.test.mjs`: 3 pass, macOS 5.** The guard at :118 drops two checks on win32 without a SKIP
line. Print one with the reason.

Must-meet HD1 still governs: each of the seven files passes on Windows with its macOS count minus declared skips, and
each skip prints its reason. Do not change product files. If the `\\?\` prefix comes from the product rather than the
test, stop and report it.

## Done
The three files green on macOS with their counts unchanged; the code-map and trace checks. The seat reads the next
Windows run.

## Report
≤ 10 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; each file's macOS line before and after; each edit
and why; what you confirmed about the `\\?\` cause; the one claim most likely wrong on Windows.
