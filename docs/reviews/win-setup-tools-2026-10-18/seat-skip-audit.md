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
