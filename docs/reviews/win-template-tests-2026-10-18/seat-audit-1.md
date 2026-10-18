# Seat audit of build 1 — win-template-tests at 25717de (2026-10-18)

Four read-only file checkers and one critic, run by the seat after build 1. No MUST.

## text

VERDICT: DONE

Commit 25717de (pushed to feat/win-template-tests): added `packages/nana-pack/tests/git-only-path.mjs`; edited the four named test files; `docs/code-map.md` regenerated.
`templates-update.test.mjs`: 34 pass → 34 pass. `template-acceptance.test.mjs`: 12 pass → 12 pass. `template-release.test.mjs`: 5 pass → 5 pass. `test-runner.test.mjs`: 39 pass → 39 pass.
Extra edits beyond the literal diff, each forced by the brief's own change: dropped now-unused `gitBinary`/`symlinkSync` locals in acceptance/release (replaced by `gitOnlyPath`); removed test-runner's now-dead `skip()` helper (its only caller became a `check()` at :243-247).
Commands, each green: `npm test -- <file>` per file (foreground, <90s); `npm run map` (284 modules); `npm run map:check` (0 problems); `node scripts/requirements-trace.mjs` (0 rows off form) — all exit 0.
Verified the win32 SKIPS/tally logic for test-runner by forcing `posix=false` in a throwaway scratch copy of `scripts/test.mjs` (never committed; the real file was never touched).
Claim most likely wrong on Windows: the g-signal `/— exit 1$/` form is inferred from libuv's `TerminateProcess(handle,1)` and could not be run-verified on macOS, where a real SIGKILL always reports a signal.

## text

MUST: 0

None of the six bar items is broken for this file. Evidence:
- **Windows skips:** the file has no platform guard and no skip. All five checks run on Windows.
- **macOS pinning:** the three assertions at template-release.test.mjs:48-50 are byte-identical to before. The POSIX branch of the helper (git-only-path.mjs:33-36) is the old `which git` plus symlink route. The only difference is that `mkdirSync` became `recursive`, which pins nothing less. My macOS run printed `PASS ... template-release.test.mjs  5 pass  3.6s`, which matches the builder's count.
- **Pass with the feature removed:** on Windows, /uvx/ can only show up if the CLI's five real git calls succeed and it reaches the default gate's uvx spawn. If git cannot start, the CLI prints "cannot resolve commit (spawnSync git ENOENT)", the check fails loudly, and the git fix proves itself. The helper's own errors throw inside the check, so it fails with a stated reason rather than hiding anything.
- **Writes:** the POSIX link goes under `root`, which is `tmpDir(os.tmpdir())`. On win32 the helper writes nothing. The CLI's cwd, remote and mkdtemp all stay under the temp folder.
- **Product files:** the diff from 08a86fa touches only the four test files, the new helper and docs/code-map.md. scripts/test.mjs is untouched, and the worktree is clean.
- **gitOnlyPath on Windows:**
  - It returns the folder of the first `where git` line (git-only-path.mjs:24-31). `where.exe` is found in System32 from the parent's full PATH.
  - The suite job runs `shell: bash` (ci.yml:51-53). Git Bash's bin\bash.exe wrapper puts `Git\mingw64\bin;Git\usr\bin` in front of PATH (INFERRED from git-wrapper.c). So the first line is most likely `C:\Program Files\Git\mingw64\bin\git.exe`, not the cmd\git.exe launcher the brief assumed.
  - That is the real git binary, with its DLLs beside it, found through the app-folder DLL search. Every git command the CLI runs is built into git, so it starts.
  - If the first line is `Git\cmd` or `Git\bin`, those launchers locate the Git install from their own position and start mingw64\bin\git.exe by absolute path. That works with a narrowed PATH (INFERRED).
  - libuv tries only `git.com` and `git.exe`, so `git.exe` is found. Node keeps the `PATH` key over `Path` (PATH sorts first when duplicate keys are dropped), so the child sees only the git folder.
  - No Git folder holds uvx on the runner. uv comes from setup-uv, so uvx stays missing and the gate logs "python scaffold: uvx copier copy exited 1".

PREDICTION (INFERRED, not run on Windows):
`PASS  packages/nana-pack/tests/template-release.test.mjs  5 pass  ~8-12s`, with no failures expected.

The only check that can still fail is "release CLI runs its in-process gate from spaced and percent-looking checkout paths" (line 35). The rest of that check has never run on Windows, so it is the risk. Possible causes, each judged unlikely:
- **The percent path:** the second loop pass ("release a%20b checkout") has never reached the CLI on Windows. The guard at template-release.mjs:58 calls realpath on both sides, and the spaced path already passed it on Windows, so I expect it to pass.
- **The CLI's later git steps:** merge-base against `refs/remotes/origin/main`, then `tag --points-at`, `for-each-ref` and `rev-list --count -- templates copier.yml` have not run through the CLI child on Windows. They are plain git commands, and I expect them to pass.
- **A different machine:** on a machine where the first `where git` folder also holds uvx, the helper throws and the check fails with that reason. An example is a scoop shims folder with uv installed through scoop. This is intended and loud, and does not apply to the CI runner.

SHOULD: none.

NOTE:
- **Purpose line (git-only-path.mjs:3):** it says the folder "resolves to git and nothing else", which is false on win32. There it is the whole Git folder, with hundreds of executables under mingw64\bin, and only uvx is checked. This is harmless here because the only assertion is /uvx/. A future fixture that pins a different missing tool (uv, pnpm, copier) would get an unchecked folder.
- **uvx probe (git-only-path.mjs:29):** it leaves out `uvx.com`, which libuv does try. It includes `.cmd`, `.bat`, `.ps1` and the bare name, which libuv's bare-name search never finds. Refusing too often is harmless, and the `.com` gap is theoretical.
- **`where` output encoding (git-only-path.mjs:24):** the output is decoded as utf8, but where.exe writes in the console code page. An install path with non-ASCII characters would come out garbled. Runner paths are ASCII.
- **Brief vs. CI:** the brief and must-meet assume the cmd\git.exe launcher. Under CI bash the first match is probably mingw64\bin. Both start, so the brief's premise does not matter for the result.

Files: <worktree>/packages/nana-pack/tests/template-release.test.mjs, <worktree>/packages/nana-pack/tests/git-only-path.mjs, <worktree>/scripts/template-release.mjs, <worktree>/scripts/template-acceptance.mjs, <worktree>/.github/workflows/ci.yml

## text

MUST: 0

Prediction for Windows (INFERRED):
`PASS  packages/nana-pack/tests/test-runner.test.mjs  39 pass  ~15s`
This means 39 pass, 0 fail and 0 skip, up from 35 pass, 3 fail and 1 skip. The three old failures each have a fix. The one SKIP is now a check.
- g-signal at :235: the win32 check needs the line to end in `— exit 1`. On Windows a self-SIGKILL becomes TerminateProcess(handle, 1), so the parent sees code 1 and no signal, and `scripts/test.mjs:405` prints `exit 1`. I compared the dash bytes: the test regex and the runner's separator are the same character (e2 80 94).
- R-916 at :245: on win32 the post-edit-hardening fixture now passes. The failing-line tail is then d-red's 20 lines only (`not ok` plus FAIL 1..19). The g-signal and j-silent tails do not match the regex.
- R-616 at :247: I counted the win32 tally by hand from the fixtures. It is 14 files: 9 PASS, 4 FAIL (d-red, f-allskip, g-signal, j-silent), 1 SKIP (study-tasks). Checks are 10 pass, 22 fail (d-red 21 plus e-warn 1) and 2 skip (f-allskip). This matches `EXPECTED_TALLY` at :115-117.
- R-607 at :260: post-edit-hardening is labelled PASS on win32. This check would catch the `posix &&` guard being dropped from the runner's SKIPS entry. With PATH set to an empty folder, `onPath("pgrep")` is false, the file would SKIP, and the check would fail.

Checks I expect could fail on Windows:
1. g-signal at :235 (low risk). The `$` anchor fails if the "(stdio still open 2s after exit …)" suffix gets added. That happens only if the pipe close comes more than 2s after exit. A process ended by TerminateProcess has no grandchild holding the pipe, so I expect no suffix.
2. R-616 at :247 (low risk). The checks.pass, checks.skip and `A.code === 1` parts have never been seen passing on Windows, because the test never prints the runner's output. The totals line did parse on Windows before: the e-warn check, which reads `tA.warn`, passed there.

What I checked against the bar:
- Windows skips: none remain in this file. The only `skip()` caller, at :247 before the change, became a real check, and the helper was removed with it. The g-signal if/else swaps one check for another, and the win32 check's name gives the reason ("win32 has no signal to report"). On Windows a file that kills itself never reports a signal, so the case cannot happen there.
- macOS checks: the macOS side pins exactly what it pinned before.
  - The POSIX g-signal check is unchanged.
  - `EXPECTED_TALLY` on POSIX equals the old numbers (14/8/4/2, 9/22/2), and `A.code === 1` is kept.
  - The POSIX fixture is still the trap.
  - The POSIX R-607 check is unchanged.
  - I ran the file on macOS: `39 pass, 0 fail, 0 skip`, and `git status` stayed clean.
- Writes: every write stays under the temp tree TD. The new win32 fixture only prints.
- Changed files: the diff from 08a86fa touches only the four test files, the new helper and `docs/code-map.md`. No product file changed, and `scripts/test.mjs` did not change.
- Helper: `test-runner.test.mjs` does not import `git-only-path.mjs`, so the gitOnlyPath item in the bar does not apply to this file.

SHOULD: none.

NOTE:
1. At :105-106 the older comment still says the empty PATH makes the post-edit-hardening skip fire, and that it is "the only SKIPS entry". Neither holds now: on win32 the skip never fires, and SKIPS has three entries. The new comment at :109-111 covers the win32 part. The wrong text is older than this change.
2. On win32 the g-signal check pins the same thing as d-red, because a TerminateProcess exit 1 looks the same as `process.exit(1)`. So R-910's "naming the signal" half is pinned on POSIX only. That cannot be fixed, but the row's evidence should say POSIX-only.
3. The win32 branches of this file have never run on any machine. The builder's check that forced `posix=false` in a scratch copy of the runner cannot be repeated from the commit. My tally numbers above come from reading the fixtures, not from a run.
4. Before this change Windows ran 38 checks plus 1 skip. It now runs 39 checks, so TT1's count for this file is 39 minus 0 declared skips, the same as macOS.

## text

MUST: 0

No MUST findings. Evidence for each item of the bar, for packages/nana-pack/tests/template-acceptance.test.mjs and packages/nana-pack/tests/git-only-path.mjs:
- Skips: this file has no skip and no platform guard that drops a check. The win32 branch in git-only-path.mjs:23-32 only changes how the PATH folder is built. If that folder also holds uvx, it throws with a reason, so the check fails loudly instead of being hidden.
- macOS strength is unchanged. The POSIX branch at git-only-path.mjs:33-36 does the same `which git` plus a symlink into a fresh folder under the temp root. The only change is `mkdirSync` with `recursive`, which behaves the same here because each folder name is unique under a mkdtemp root. At :109 and :121, `fileURLToPath` gives the same path as `.pathname` on this worktree, and it is more correct for paths that need percent-encoding. I ran the file here: `PASS ... 12 pass 10.0s`, the same as the base count of 12.
- Removing the feature still fails the check. At :59-60 the check needs a nonzero exit and /uvx/ in the output. If the CLI's main guard broke, the child would exit 0 and the check would fail. If git failed to start, the output would read "git could not start", which has no "uvx", so the check would fail. The helper's uvx refusal means the CLI reaches its missing-uvx branch on every machine.
- Writes stay inside the temp folder. On win32 the helper returns the real Git folder and nothing writes into it. The CLI child inherits TEMP/TMP, which the runner sets to the per-file mkdtemp folder (scripts/test.mjs:384-389). The clone at :109, the append at :112 and the render at :113-114 all stay under `root`, which is under os.tmpdir().
- No product file or scripts/test.mjs changed. The diff touches only the four test files, the new helper and the generated docs/code-map.md.
- Does gitOnlyPath give git and no uvx on Windows? Yes (INFERRED). CI runs `shell: bash` (ci.yml:52-53). The Git Bash launcher puts `<Git>\mingw64\bin` first on PATH, which matches the old MSYS `which` printing /mingw64/bin/git (triage). So `where git` should return `C:\Program Files\Git\mingw64\bin\git.exe` first. setup-uv puts uvx in its own tool-cache folder, so that Git folder has no uvx.
- Does the CLI's first git call start? Yes (INFERRED), whichever folder `where git` returns first:
  - A direct mingw64\bin\git.exe has its DLLs beside it, and `rev-parse` is built in.
  - A cmd\git.exe or bin\git.exe launcher finds its install root from its own location, prepends mingw64\bin itself, then starts the real git.
  - libuv on win32 tries name+.com and name+.exe in that folder and finds git.exe. Its PATH lookup ignores case. Node passes `PATH` ahead of `Path` because it sorts env keys, which the earlier run's ENOENT confirms.
  - The uvx spawn then searches only cwd (the checkout, which holds no uvx) and the Git folder, so it hits ENOENT. The CLI then logs "python scaffold: uvx copier copy exited 1" and exits 1.
  - The same reasoning covers the first git call in template-release, whose later git calls are all built-in commands.

Prediction (INFERRED): `PASS  packages/nana-pack/tests/template-acceptance.test.mjs  12 pass  ~20-60s`, up from 9 pass, 3 fail. I expect no check to fail. Ranked by risk:
1. ":104-117 dirty SHA render" is the least certain. It is the first Windows run past the clone. The deepest tracked path is 145 characters. The clone folder adds about 95-99 characters, so the longest path is about 240-244 against the 259 limit. That margin is inferred, not measured. copier's handling of a dirty repo with `--vcs-ref <sha>` also runs on Windows for the first time. templates-render already clones the same checkout with copier on Windows under the temp HOME and passes, which is my basis for expecting a pass.
2. The ":105 uvx copier --version" probe has a 15s timeout and existed before this lane. template-acceptance sorts before templates-render, so a cold uv cache could exceed 15s. It passed in the earlier Windows run.
3. ":50 CLI check": I expect no failure on the hosted runner. It would fail only if the first `where git` result were a .cmd or .bat shim rather than an .exe.

SHOULD/NOTE:
- NOTE git-only-path.mjs:24-26: the helper takes the first `where git` line without keeping only .exe or .com results. On a machine where the first hit is a git.cmd or git.bat shim, libuv cannot find git in that folder. The check would fail with "git could not start", loudly and never silently. Filtering to `/\.(exe|com)$/i` would remove this case.
- NOTE git-only-path.mjs:3 (@purpose) says the folder "resolves to git and nothing else". On win32 it returns the whole Git folder (mingw64\bin holds many tools), and only uvx's absence is guaranteed. The header overstates what Windows gets. The check itself only depends on uvx being absent, so this does not weaken it.
- NOTE git-only-path.mjs:29: the uvx file-name list is an inline literal. It is a test-only list of names, so I raise it as a NOTE, not a tunable finding.
- NOTE: immutable-review.test.mjs:199 still uses `which git` directly. It is outside this lane and is a likely next user of the helper.
- I did not run map:check or the trace check, because they are outside the commands this task allows. The builder reports both green, and the code-map diff matches the new module and the two new callers.

## text

MUST: 0

(No MUST findings. Checks against the bar for templates-update.test.mjs at 25717de:)
- Windows skips: none added. The diff touches only the path strings at :13-14, :81, :130, :197, :209, :211, :217 and :274. No predicate changed.
- macOS strength: I ran `npm test -- packages/nana-pack/tests/templates-update.test.mjs` twice. Both runs gave "34 pass, 0 skip", and 34 is every check in the file. The verbose run showed the render, update and adopt legs all running. `sourcePath` differs from the old `sourceRoot.pathname` only by the trailing slash, and it decodes %-escapes, so no check pins less.
- Writes: the change only alters the read-only template source argument. Copier destinations and HOME stay under `root` (OS temp), so no write target is new.
- Scope: `git diff 08a86fa..HEAD --name-only` shows only packages/nana-pack/tests/* and docs/code-map.md. No product file and not scripts/test.mjs.
- gitOnlyPath: this file does not import it, so bar item 6 does not apply here.

PREDICTION (INFERRED) — Windows result line:
`FAIL  packages/nana-pack/tests/templates-update.test.mjs  33 pass, 1 fail  ~2-3 min  — exit 1`

- Checks now expected to pass:
  - 15 rail and static checks (they already passed).
  - 5 Python rail fixtures, through the fileURLToPath fix at :130.
  - 4 render-matrix checks, the same pattern templates-render already passes on Windows with `--vcs-ref HEAD`.
  - 2 "full pytest reports malformed" checks and 2 TS malformed checks (already passed).
  - 2 update "no rejection files" checks (:225), 2 "earlier-tag ... rail clean" checks (:261) and the adopt check (:286).
- Why the update legs should run: the tag probe at :211 now gets `D:\a\nana-pi\nana-pi`. ci.yml:59 sets fetch-depth: 0, and `git ls-remote` confirms v0.6.0 is on origin.
- Expected failure: :257 "Python earlier-tag update prints Part G drift". It needs the updated project's whole pytest suite to exit 0, and that suite has never run on Windows (the template CI is ubuntu-only).
  - Likely cause: pytester's `runpytest_subprocess` reads the child's stdout with `encoding="utf8"`, and its popen sets no PYTHONIOENCODING or PYTHONUTF8. I checked this in the cached pytest's pytester.py.
  - On the runner, the child is Python 3.12 with its stdout going to a file, so it writes in cp1252. The conftest summary separator " · " (templates/python/template/tests/conftest.py:392) becomes byte 0xB7, and "—" becomes 0x97.
  - Reading those bytes back as UTF-8 should raise UnicodeDecodeError. At minimum this hits test_requirements_trace.py.jinja:356-358 and :412-414, which assert lines containing "·". pytest then exits 1.
  - The fix would be in templates/python/template, a product change. That is the brief's stop condition, so TT1 for this file is not reachable in this lane if this holds.
  - Only :257 fails: `clean` at :259 does not include `pythonPytestExit`.
- The claim most likely wrong: that the runner's Python writes piped stdout as cp1252. If GitHub's image enables UTF-8 mode, the line is `PASS ... 34 pass`.
- Secondary risks, both INFERRED and both expected to pass:
  - v0.6.0 has no .gitattributes, and the runner's git converts line endings by default, so files copied straight from v0.6.0 are probably CRLF. Copier 9.18 builds its update diff with `git diff-tree` over git-normalized blobs on both sides and sets nothing that would make the sides differ. I expect no .rej files.
  - Runtime goes from 5.7s to an estimated 2-3 min. macOS takes 79-82s, and copier steps look about 2x slower on Windows given templates-render's 57s there. That is under the 300s default per-file timeout (scripts/test.mjs:70), which ci.yml does not override.

SHOULD:
- packages/nana-pack/tests/templates-update.test.mjs:212-213 and :264-265 (pre-existing; left as SHOULD because the skip prints and counts, this lane fixed its probe, and the brief allowed no new checks). These skips ignore NANA_TEST_REQUIRE_COPIER=1, which :189 honours and CI sets (ci.yml:55). They also blame "v0.6.0 tag unavailable" for any failure of the probe at :211, including a bad path or git not starting. That is how the Windows run hid 6 checks behind a wrong reason before this lane. A later regression would turn the file into "PASS 28 pass, 2 skip" on CI. Fix, in a later lane or as a recorded residual: under NANA_TEST_REQUIRE_COPIER=1, make `!hasOldTag` a FAIL and print the probe's stderr. For now, TT1 should be accepted only on the Windows count "34 pass" with no skip.

NOTE:
- :91 (pre-existing): UV_CACHE_DIR is set to the real `uv cache dir`, so uvx writes the developer's real cache (~/.cache/uv on a Mac). That is outside the OS temp folder and the worktree. On CI it is runner temp. The lane did not change this.
- :259 (pre-existing): if copier copy fails, `readFileSync(join(dest, "REQUIREMENTS.md"))` throws. The file then crashes instead of printing FAIL. The runner still reports FAIL, so nothing is hidden.
- :231 is OK. `'file://' + process.cwd()` parses on Windows to `file:///C:/Users/RUNNER~1/...`; I checked this with Node's URL parser.
- :245 `python3` resolves on the runner: templates-render's `python3 scripts/code_map.py` check passes there.
- The em dash and middle dot in code_map.py and conftest output are all cp1252-encodable. So `print` and `sys.stdout.write` do not throw at :235, :245 or :281, and those checks only match ASCII substrings.

Files: <worktree>/packages/nana-pack/tests/templates-update.test.mjs, <worktree>/templates/python/template/tests/conftest.py, <worktree>/templates/python/template/tests/test_requirements_trace.py.jinja

## text

MUST: 0

No MUST findings were raised, and I found none. All four checkers reported MUST: 0, so part (b) has nothing to confirm or refute.

(a) Win32 guards and skips in 08a86fa..HEAD (25717de):
- The diff has exactly five platform branches, and the checkers covered all five:
  - `packages/nana-pack/tests/git-only-path.mjs:23`, the win32 branch.
  - `packages/nana-pack/tests/test-runner.test.mjs:112-114`, the post-edit-hardening fixture.
  - `test-runner.test.mjs:115-117`, `EXPECTED_TALLY`.
  - `test-runner.test.mjs:232-236`, the g-signal check.
  - `test-runner.test.mjs:255-261`, the R-607 check.
- The diff adds no new SKIP line. It removes the only `skip()` caller and the `skip` helper.
- The SKIP lines in `templates-update.test.mjs` at :190, :213 and :265 are older than this lane, and their predicates did not change.
- Each win32 branch still checks something real:
  - The R-607 win32 check (`labelFor === "PASS"`) fails if `posix &&` is dropped from `scripts/test.mjs:173`. Without that guard, `onPath("pgrep")` is false under `PATH: noPath`, so the file would SKIP.
  - The POSIX fixture, the POSIX tally (14/8/4/2, 9/22/2) and both POSIX checks are byte-identical to the base.
- I checked the runner's line format at `scripts/test.mjs:405-409`, which is `…  — exit 1` plus an optional held-pipe suffix. It fits `/— exit 1$/` when no grandchild holds the pipe, and the g-signal fixture (`:162`, a self SIGKILL) spawns none.
- I confirmed the `templates-update` claim that `clean` at :259 leaves out `pythonPytestExit`. If the pytester encoding guess holds, only :257 fails.

(c) The shared helper `git-only-path.mjs`:
- **Header.** All six tags are present, and `@effects` uses the allowed words disk and process. I ran `node scripts/code-map.mjs --check` here: 284 modules, 0 problems, exit 0. `node scripts/requirements-trace.mjs` also exited 0 with 0 rows off form. The worktree stayed clean.
- **Code map.** `docs/code-map.md` has the entry, and it matches the header. Its callers are template-acceptance and template-release. Both callers' callees lists were updated, and the module count went from 283 to 284.
- **Windows behaviour.**
  - :24 takes the first `where git` line, split on `\r?\n` and trimmed. If git is missing, `where` exits 1 and execFileSync throws first, so the `lines.length === 0` branch can never run. It is harmless.
  - :29-30 refuse with a reason if the folder holds uvx, and nothing on Windows writes to disk.
  - I agree with the checkers' inference that the first match under CI's `shell: bash` is `Git\mingw64\bin\git.exe`. Every git command the two CLIs run before uvx is built into git: rev-parse, merge-base, tag, for-each-ref and rev-list.
  - The child's uvx spawn searches its cwd (the fixture checkout, which has no uvx) and then the Git folder. Both lack uvx, so the spawn gets ENOENT and the `/uvx/` match holds.
  - v0.6.0's `copier.yml` has no `_tasks` or `_migrations`, so the update legs run no POSIX shell step on Windows.
- **Writes.** On POSIX the helper writes only `mkdirSync(tmp, {recursive})` and `tmp/git`. On win32 it writes nothing. Both callers pass `path.join(root, …-bin)` with `root` under os.tmpdir().

SHOULD:
- `templates-update.test.mjs:212-213, :264-265` (older than this lane; I agree with that checker's SHOULD). The update-leg skips ignore `NANA_TEST_REQUIRE_COPIER=1`, which CI sets. They also report any failure of the :211 probe as "v0.6.0 tag unavailable". A later regression would show on Windows as "28 pass, 2 skip" rather than a FAIL. TT1 for this file should be accepted only as "34 pass" with no SKIP. Record this as a residual if it is not fixed.

NOTE:
- `git-only-path.mjs:3` (@purpose): "resolves to git and nothing else" is false on win32, where the whole Git folder is returned. Only uvx's absence is checked. This is harmless for the /uvx/ assertions but would mislead a future fixture that pins a different missing tool.
- `git-only-path.mjs:6` (@effects): the POSIX side also creates the folder itself, and its parents through recursive mkdir, not only "one symlink".
- `git-only-path.mjs:24-26`: there is no filter to `.exe`/`.com`. A first `where` hit that is a `git.cmd` shim fails loudly with "git could not start", never silently. The uvx list at :29 leaves out `uvx.com`, which libuv does try. Both gaps are theoretical on the runner.
- `test-runner.test.mjs:105-106, :188` (older text): "that is the only SKIPS entry" and "the one declared platform skip" are stale. `SKIPS` now has three entries (`scripts/test.mjs:168-180`), and the skip never fires on win32.
- REQUIREMENTS.md R-607 cites only the POSIX check name. The new win32 check "a file whose declared skip condition does not hold runs instead of skipping" is not in its evidence. R-910's signal-naming half is pinned on POSIX only. The trace check passes, but each row's evidence should say POSIX-only where that is true.
- `immutable-review.test.mjs:199` uses the same raw `which git` pattern. It is outside this lane and is the next likely user of the helper.

I did not re-run the four test files or the suite. The checkers' macOS counts were 34, 12, 5 and 39, and each checker ran its own file.

Files:
- <worktree>/packages/nana-pack/tests/git-only-path.mjs
- <worktree>/packages/nana-pack/tests/test-runner.test.mjs
- <worktree>/packages/nana-pack/tests/templates-update.test.mjs
- <worktree>/scripts/test.mjs
- <worktree>/docs/code-map.md
- <worktree>/REQUIREMENTS.md
## Check of build 2 (8c5d512)

MUST: 0

**Evidence by question**

1. **Every copier path is now long form.** The temp root goes through `realpathSync.native` at `templates-update.test.mjs:21-22`, before any copier or git call.
   - Everything in the update legs is built from that root: `dest` (:224), `adoptRoot` (:276), the `cwd: root` for copy (:225, :283), the `cwd: dest` / `cwd: adoptRoot` for update (:230, :286) and `HOME: root` (:96).
   - The template source is `sourcePath`, which resolves the checkout (`D:\a\...` on CI) and has no 8.3 part.
   - The Windows run 1 traceback shows the failing call is copier's `_apply_update`, `self.subproject.local_abspath.relative_to(subproject_top)` (copier `_main.py:1406`). `local_abspath` is `dst_path.absolute()`, which is the child's cwd. That cwd was the short root and is now long.
   - Only `TEMP`/`TMP` still reach copier in short form, for copier's own `TemporaryDirectory` folders (old_copy, new_copy, clone). I read copier 9.19.1 locally (`~/.cache/uv/archive-v0/nop55zT3dOgHkAkwu8NKK/copier/_main.py`). Its line 1406 matches the CI traceback, so it is likely the same version (INFERRED). In that code, the temp folders are only compared with themselves: `old_copy / subproject_subdir` with subdir `.`, and `_render_template` resolves both sides (:806, :835-838). `_load_external_data` (:345-349) mixes the two forms, but `--trust` bypasses it and `copier.yml` uses no external data.
2. **The `\\?\` strip is correct but never fires.** The JS literal `"\\\\?\\"` is the four characters `\\?\`, and `slice(4)` removes them. libuv's `fs__realpath_handle` already strips that prefix and turns `\\?\UNC\` into `\\`. The line would turn a raw `\\?\UNC\…` into `UNC\…`, but libuv never returns that form.
3. **The strict probe behaves as briefed.** I tested it in a tagless clone in my scratchpad (`git clone --no-tags`), since deleted.
   - With `NANA_TEST_REQUIRE_COPIER=1`, both legs FAIL with the probe's stderr ("FAIL v0.6.0 tag is required when NANA_TEST_REQUIRE_COPIER=1 fatal: Needed a single revision", plus the adopt-leg twin), and the run ends "2 FAILED".
   - With the variable unset, both legs SKIP ("v0.6.0 tag unavailable") and the run exits 0 with 28 pass.
   - CI cannot trip strict mode. The variable is set only by the `suite` job (`ci.yml:55`; checked with git grep). That job checks out with `fetch-depth: 0` on all three OS legs, which fetches tags. The Windows log line 118 shows `[new tag] v0.6.0`, and `git ls-remote origin` has the tag at 0ff62ae.
4. **Scope is clean.**
   - On macOS, `npm test -- packages/nana-pack/tests/templates-update.test.mjs` gives `34 pass, 0 fail, 0 skip` (variable unset). With the variable set and the tag present, the code takes the same path.
   - `6d97ba5..HEAD` touches only `templates-update.test.mjs`, and `main...HEAD` changes nothing outside `docs/` and `*/tests/`. There is no product file and no `scripts/test.mjs` change.
   - HEAD equals the remote branch at 8c5d512.
   - The change adds no write outside the OS temp folder. The macOS root becomes `/private/var/...`, and cleanup still works: no `nana-partg-rail-*` folders were left after my runs.

**Prediction (INFERRED):** `PASS packages/nana-pack/tests/templates-update.test.mjs 34 pass`. Run 1 had 30 pass and 3 fail. The three update legs should clear the subpath error. A 34th check, "Python earlier-tag update prints Part G drift", becomes reachable once `REQUIREMENTS-general.md` exists after the update. Windows failing files would go from 26 to 25. Confidence is moderate, because the steps after the update have never run on Windows. These are the most likely to fail:
- The drift check, which runs full pytest on the updated rendered Python project. No other test runs that project's pytest on Windows.
- The two "earlier-tag … unchanged and its rail clean" checks. The v0.6.0 tag has no `.gitattributes`. If the runner's system git sets `core.autocrlf=true` (assumed, not checked), copier's v0.6.0 clone renders with CRLF while HEAD renders LF. That could produce `.rej` files or diff noise. The CRLF handling in both rails, and `templates-render` passing on Windows, make this less likely.

The run 1 `conflict REQUIREMENTS.md` line in the adopt leg is followed by `skip REQUIREMENTS.md`. That is the expected `_skip_if_exists` handling of the existing file, not a fault.

**NOTE**
- The two new strict-mode `check(...)` calls (:220, :273) carry no `req:` marker, the same as the existing copier guard at :194.
- With strict mode on and the tag present, a missing pytest still SKIPs the update legs silently. This was already so, and the brief did not ask to change it.
- `oldTagProbe.stderr ?? ""` prints nothing if git fails to start, because spawnSync then returns a null stderr and the error object is not printed. This cannot happen on CI.
- `UV_CACHE_DIR` points at the real uv cache outside temp (:96). This was already so and the lane did not touch it.
- The unused `const available` (:215) was already there.
