# Seat skip audit — win-setup-tools at f2f90cc (2026-10-18)

One read-only checker, run by the seat after build 1, against the bar: every Windows skip names a case that cannot exist on Windows,
every skip prints its reason, no macOS check pins less, no product file changes.

MUST: 0

No MUST findings. Base for comparison: ddc45b4..f2f90cc (one commit, f2f90cc).
- Only the four target test files and the two docs/reviews plan files changed. No product file changed.
- The worktree is clean, and the tip matches origin/feat/win-setup-tools.
- I re-ran the four files on macOS: doctor-detail 66, install-check 105, restore 14, trust 11, all passing. This matches the builder's report, and git status stayed clean.

GUARD INVENTORY (every win32 skip or platform branch in the four files)

packages/nana-setup/tests/doctor-detail.test.mjs
- :78-80 `if (win32) SKIP desk service diagnostics (the launchd desk service is macOS-only)`. This guard is new.
  - It drops 4 checks (:104, :107, :113, :118), which are all of R-399's coverage.
  - Verdict: HONEST. The block forces `NANA_SETUP_PLATFORM=darwin`, runs `#!/bin/sh` stubs and uses a `:`-joined PATH.
  - On Windows the forced darwin branch reaches `process.getuid()` at lib/doctor.mjs:650, which is undefined there. That is the crash behind "3 pass then crash".
  - Real win32 doctor emits `NOTE desk service skipped (win32)` (doctor.mjs:639). install refuses with "launchd is macOS-only" (steps.mjs:743).
  - The guard prints its reason, so it is not silent.
- No other win32 guards in this file.

packages/nana-setup/tests/install-check.test.mjs
- No skips and no `process.platform` guards. Every win32 case is injected through `platformName`.

packages/nana-setup/tests/restore.test.mjs
- :71 is a pre-existing branch: it makes a `junction` on win32 and a `dir` symlink elsewhere. It drops nothing, because a link is still created. Verdict: HONEST.
- No skip. The builder did not use the brief's "skip the archive half" exit.

packages/nana-setup/tests/trust.test.mjs
- :65 is a pre-existing junction-vs-dir branch. It drops nothing, and `realpathThroughExistingAncestor` resolves a junction the same way. Verdict: HONEST.
- :78 is an untyped file symlink with no guard, so it depends on the runner's symlink privilege.

EDITED CHECKS: macOS strength against the base
- install-check :77-78: `path.join("/sandbox/home","tmp")` equals the old literal on POSIX, so the macOS pin is unchanged.
  - The builder's premise is verified: `buildEnvironment` (lib/install-check.mjs:26-29) uses host `path.join` and ignores `platformName`.
- restore :37: `fileURLToPath` replaces `path.resolve(url.pathname)`. They are equal on macOS, and the new form is strictly more correct for %-encoded paths.
- restore :39 and trust :25: `pathToFileURL(...).href` loads the same module.
- restore :113/116/117/147: the archive is passed relative with `cwd: root`.
  - Both GNU tar and bsdtar open `-f` relative to the starting folder, before `-C` applies, so the same file is written and read.
  - All assertions are unchanged, and they passed.
- trust :85: the input changed from `path.relative(cwd, agentDir)` to `path.join("relative","agent")`. The assertion is unchanged.
  - The product test is `!path.isAbsolute(piNormalizePath(env))` (nana-pack/lib/agent-dir.mjs:84-91). Both inputs take the same branch, so the R-672 pin is not weaker.
  - The builder's cross-drive premise is correct: the checkout is on D:\ and the temp folder is on C:\.
- doctor-detail :78: only the opening brace changed, so the macOS path is identical.

PREDICTED WINDOWS RESULTS (INFERRED, from reading the code; nothing was run on Windows)
- doctor-detail: 62 pass plus 1 SKIP line. Win32 `diagnose` never reaches `getuid` without the darwin override, and the runner scrubs `NANA_*`.
  - Residual: :43 needs the runner's file-symlink privilege. The CI runner is admin, so this should hold.
- install-check: 105 pass. The only Windows failure in run 3 was :77-78, and that is now fixed.
- trust: 11 pass. Printed paths come from pi's `join(resolvePath(agentDir),"trust.json")` with no realpath, so they match the test's `path.join`.
  - Residual: :78 needs the same file-symlink privilege.
- restore: 14 pass is likely.
  - The CI suite runs with `shell: bash`, so `tar` should resolve to Git's GNU tar ahead of System32 bsdtar.
  - `-C C:\…` and `-T C:\…` are not parsed as host:file (only `-f` is), and MSYS accepts Win32 paths.
  - Risk, low confidence: if bsdtar is picked instead, `tar -tzf` output may end lines in CRLF. `archiveNames` would then carry `\r`, and :143 would fail.
- restore, the builder's most-doubted claim ("project trust only", :161): I traced it independently and expect it to hold.
  - Win32 rows for hooks, the new skills, PATH x4, the desk service and the hooks floor are NOTE. The pi executable and pi packages rows are NOTE under `--home`.
  - Rules and skills: the win32 copy is accepted by `linkOk` / `skillLinkState` (doctor.mjs:79, :101).
  - Settings rows: exec-form targets resolve inside the checkout. The knowledge build is not platform-gated.
  - The only WARN source left is "project trust".
  - Corroboration: the blocking install-check Windows job has `KNOWN_RED.win32 = []`.

SHOULD
- trust.test.mjs:85: the new relative value resolves against the runner's cwd, which is the package folder inside the checkout.
  - If R-672 regressed and the CLI accepted the value, pi's store would be written to `packages/nana-setup/relative/agent/trust.json` in the checkout.
  - The old input resolved to the temp agentDir, so a regression could only write into temp.
  - This only happens after a product regression, and the write stays inside the worktree, so it is not a MUST by the bar. It still breaks the brief's "no test writes this checkout".
  - Fix: spawn this one call with `cwd: root`, using a relative value under root.
  - Pre-existing gap: R-672's "without writing a decision" half is not asserted either before or after this change.

NOTE
- doctor-detail:79: one SKIP line stands for 4 dropped checks. ST1's arithmetic ("macOS count minus declared skips") needs 66−4=62, but the runner counts 1 skip. The seat should expect 62.
- doctor-detail: R-399 has no Windows coverage. A win32 pin of `desk service = note "skipped (win32)"` would replace it, but the brief forbids new tests.
- install-check:77-78: on win32 the expectation now uses the same `path.join` as the product, so it mirrors the code there. POSIX is unchanged.
- restore, pre-existing checks that pin less on Windows than on macOS (none were edited by this lane):
  - `forbiddenArchivePaths` (:95) is built with `path.relative`, which gives `\` on win32, but it is compared with `/` names at :143. That clause can never match on Windows; `nonDurableFixtures` mostly covers the same stores.
  - `symlinkIntoSource` (:176) compares the long-form `realpath` with a home path that can be in short (8.3) form on the runner.
  - `sourcePathLeak` (:178) searches for the raw `home` bytes, but JSON escapes each `\`, so a leaked path in a JSON file is missed.
- The comments the builder added at restore :111-112 and trust :82-84 are accurate.

## Check of build 2 (0cb429b)

MUST: 0

No blocking finding. Both checks of the bar hold for the diff 60acd61..0cb429b.

- **No product file changed.** The diff touches only `packages/nana-setup/tests/restore.test.mjs` and `packages/nana-setup/tests/trust.test.mjs`. The working tree was still clean after my test runs.
- **No macOS check pins less.** On macOS, restore passes 14 and trust passes 11, the same counts as before.
  - At `restore.test.mjs:152`, the relative `-C` value "destination-home" resolves to the same folder the absolute path named. The two checks after extraction assert the same things as before.
  - In `trust.test.mjs`, line 28's default `cwd = process.cwd()` matches what spawnSync does when no cwd is given, so every other call behaves the same. Line 88 makes the same assertion as before. The refusal does not depend on cwd.
- **Windows skips.** The diff adds no skip.
- **Writes stay in temp.**
  - `restore.test.mjs:152` extracts relative to cwd=root, and root is a `tmpDir` under `os.tmpdir()`. The runner sets TEMP and TMP to its own per-file folder, `scripts/test.mjs:384-389`.
  - `trust.test.mjs:88`: if the product ever wrongly accepted the relative value, the store would land at `<root>/relative/agent`. That is inside temp and is removed at line 91.
- **The tar arguments are safe for Git's GNU tar on Windows.** The argv is `-xzkf state.tgz -C destination-home` with cwd=root.
  - No argument starts with `/` or holds a drive letter, so MSYS converts no path. That also means `-f` cannot be read as a `host:file` remote archive.
  - Node passes no argument that needs quoting.
  - MSYS takes its starting directory from the Windows cwd. Run 1 already showed that a relative archive name with cwd=root works for `-czf` and `-tzf` (`:116-117`).
  - A relative `-C` opens against that starting directory: in `chdir_do`, a relative name first changes to the previous entry, which is the start.

Root cause, now confirmed rather than inferred: GNU tar turns on `--unquote` by default. In extract and list mode, `name_gather()` calls `name_next_elt(false)`. There the `NELT_CHDIR` case falls through to `NELT_NAME` and runs `unquote_string()` on the `-C` operand (GNU tar `src/names.c`). That is why only `Temp\nana-test` became a newline at `ci-windows-run-1.log:6041`. `\U`, `\A`, `\L`, `\R`, `\s` and `\d` are not escapes, so they stayed.

Create mode reaches `-C` through `name_next(true)`. That branch calls `chdir_do` directly without unquoting, which is why `-C home` at `:116` passed with the same `\nana-test` prefix. The `\n` appears on every run, because the runner always puts `\nana-test-<pid>` into TEMP.

The bare name "destination-home" has no backslash, so unquoting leaves it unchanged. The builder's "C-style escape" reading is right in effect. The bug is tar's own unquoting, not MSYS changing the argument.

PREDICTION (INFERRED): restore passes 14 of 14 on Windows, at about 80% confidence. Trust stays at 11 of 11.
- Extraction should now succeed, at about 95%. The archive half is already proven, and the new argument holds nothing tar can misread.
- The remaining risk is in checks that will see restored Windows state for the first time. The weakest is "restored doctor reports project trust only" (`:166`). It now runs doctor after install over restored files: `sources.json`, the knowledge index rebuilt over a Windows absolute root, a non-JSON `settings.json` fixture, and a project memory folder with no shared link. The doctor and install code I read handle these the same way on both platforms (no shared link is a NOTE; unparseable settings with an empty package list under `--home` is a NOTE). I did not run it on Windows.
- Second in line is "byte-equal" (`:178`).
- In run 1, the three leak checks (`:185`, `:187`, `:189`) passed with nothing to check, because the destination was empty. They will check real files for the first time.

SHOULD: none.

NOTE:
1. The comment at `restore.test.mjs:147-150` calls the failure a "path-argument misread". The real cause is GNU tar's default `--unquote` on `-C` in extract mode (`names.c` `name_next_elt`). A future reader would trust a more exact comment, and it would warn that `\t`, `\r`, `\a`, `\b`, `\f`, `\v` and octal `\0-7` corrupt a `-C` path the same way. This is not blocking.
2. Line 151's `fs.mkdirSync(destination, { recursive: true })` repeats line 29, and `state --home destination` only reads, so it does nothing. Brief 2 asked for it, and it is harmless.
3. A residual from before this diff: line 183 compares raw bytes against `Buffer.from(home)` with single backslashes. A Windows source-home path stored JSON-escaped (`C:\\Users\\...`) in `nana-pack.json`, `sources.json` or `settings.json` would not match. On Windows that check cannot see such a leak. Worth a HANDOFF residual line.
4. Outside this lane (no product edits allowed): the README restore command `tar -xzkf ~/nana-state.tgz -C ~` is safe in Git Bash, where `~` expands to `/c/Users/...`. Any Windows user who passes a backslash path to `-C` hits the same unquoting. A possible residual.
5. The builder's claim matches the log: at line 6041 every separator prints doubled except `Temp\nana-test`.
