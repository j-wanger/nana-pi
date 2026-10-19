# win-gate-tmp: the lane write guard permits only real temp roots, judged where pi writes

**Feature.** WHEN NANA_WORKTREE_ROOT is set, the gate allows an edit/write target only inside the lane folder, the OS temp folder, or /tmp on macOS and Linux. It judges each target at the path pi's edit/write tools write, compared in each folder's spelling on disk.

**Class: gate** (pi extension `packages/nana-pack/extensions/nana-gate.ts`: `realOut`, `laneWriteHit`). Ladder: roster reviewer, land reviewer (seat-land.md when the roster prints `land: seat`), seat wrong-code pairs, one independent check. Windows CI run 1 on the tests-only commit, run 2 on the fix.
**Threat model.** In scope: honest variation in paths, platforms and config (8.3 names, letter case, links, drive letters, pi's `~`, `@`, `file://` forms). Out: deliberate forgery. Bash writes stay outside this guard (R-962, unchanged).

## What is wrong today (main b3f6ec2)
1. **/tmp on Windows.** `allowed = [root, os.tmpdir(), "/tmp"]`; on win32 "/tmp" resolves to the gate process's drive, e.g. `D:\tmp` on CI (the suite runs each test from `D:\a\...\packages\nana-pack`). Not a temp folder: an extra lane root. Fail-open.
2. **pi's path forms (every OS).** `realOut` uses `path.resolve(cwd, target)`; pi's write/edit use `resolveToCwd` (expands `~`, strips `@`, converts `file://`, maps Git Bash drives). `~/x`, `@/outside/x`, `file:///outside/x` are judged as `<lane>/~/x` etc. and allowed while pi writes outside. Fail-open. The policy floor already uses the mirror `resolveToolPath` (lib/gate-paths.ts); only the lane guard skips it.
3. **Spellings.** JS `fs.realpathSync` keeps typed case and 8.3 names; POSIX `path.relative` is case-sensitive; win32 folds case but never expands `RUNNER~1`. A temp or lane target spelled differently from TEMP/TMPDIR or NANA_WORKTREE_ROOT is refused (over-block), including a relative write when the root is spelled in another case.
4. **TEMP vs TMP.** `os.tmpdir()` reads TEMP first; GetTempPath reads TMP first. Kept as is (known limit).

## Design (6 changed lines; adversary applied it to a temp copy)
- Import `resolveToolPath`; in `realOut`: `let candidate = path.resolve(cwd, resolveToolPath(target, cwd));`.
- Local `real(p)`: `fs.realpathSync.native(p)`, falling back to `fs.realpathSync(p)` when native throws. Used for the target's deepest existing ancestor, the lane root and each temp root. An entry neither form resolves still refuses (R-962).
- Temp roots: `[os.tmpdir()]` on win32, `[os.tmpdir(), "/tmp"]` elsewhere (prior art `lib/adoption.mjs:42`). R-962 stays as written.

## Must-meet (all in packages/nana-pack/tests/lane-write-guard.test.mjs)
| Row | Requirement | Test | Red today |
|---|---|---|---|
| R-1430 | WHEN NANA_WORKTREE_ROOT is non-empty, the gate shall allow an edit/write target under `/tmp` on macOS and Linux, and refuse one under the `\tmp` folder of the gate process's current drive on Windows when that folder lies outside the lane folder and the OS temp folder. | `/tmp is a temporary root on macOS and Linux and not on Windows` | Windows, inferred: `path.win32.resolve("D:\\a\\nana-pi","/tmp")` = `D:\tmp` (probed); CI run 1 confirms on the absolute form. The literal `/tmp/...` is refused today on CI too (judged on the session's C: drive), so only the absolute form is red (inferred). POSIX half green today; it catches "drop /tmp everywhere". |
| R-1431 | WHEN NANA_WORKTREE_ROOT is non-empty and an edit/write target names a file in the OS temp folder through another spelling of that folder than the temp variable holds (letter case on a case-insensitive volume, an 8.3 short or long name, or a link), the gate shall allow it. | `a temp file named through another spelling of the temp folder is allowed` | macOS, probed by planner and adversary: case pair BLOCK both directions. Link and /var-vs-/private pairs ALLOW (regression guards). Windows 8.3 half inferred. |
| R-1432 | WHEN NANA_WORKTREE_ROOT is non-empty and an edit/write target names a path in the lane folder through another spelling of that folder than NANA_WORKTREE_ROOT holds (letter case on a case-insensitive volume, an 8.3 short or long name, or a link), the gate shall allow it. | `a lane file named through another spelling of the lane folder is allowed` | macOS, probed: case pair BLOCK both directions; relative `x.txt` BLOCK with root `LANE`, cwd `Lane`. Windows 8.3 half inferred. |
| R-1433 | WHEN NANA_WORKTREE_ROOT is non-empty and an edit/write target starts with `~`, `@` or `file://`, the gate shall judge the lane boundary at the path pi's edit and write tools write that target to. | `home, at-sign and file URL targets are judged where pi writes them` | macOS, probed: `~/x` (HOME outside), `@<outside>`, `file://<outside>` all ALLOWED today; same code path on every OS. |

After the fix on a temp copy (macOS): every new sub-check flips as intended; gate-corpus 227 PASS, gate-status 23 PASS and the nine lane-write-guard checks unchanged versus today.

## Test shapes
- **R-1430.** Target `path.join(path.resolve("/tmp"), "nana-lane-<pid>", "x.txt")` and the literal `/tmp/nana-lane-<pid>/x.txt`: allowed on POSIX, refused on win32. On win32, SKIP with reason when that `\tmp` lies inside the lane or `os.tmpdir()`.
- **R-1431 / R-1432.** Each spelling pair runs in both directions (env/root holds A, target uses B; then the reverse). Pairs: *case* (swap the last segment's case; runs where the swapped path exists), *OS spelling* (as-given vs `realpathSync.native`; 8.3 on the Windows runner, /var vs /private/var on macOS), *link* (dir symlink; a junction on win32). R-1432 adds the relative-target case with root and cwd in different case.
- **Non-vacuity control (new).** Each sub-check first asks the gate about a sibling folder under the same env; that target must be refused. If the control is allowed (a permitted root covers the fixtures), or the pair's two spellings are equal strings, print one SKIP line with the reason. Never count that as PASS.
- Temp variable: TEMP and TMP on win32, TMPDIR elsewhere. For R-1432 point it at a sibling folder so it does not cover the lane. Restore every env var after.
- **R-1433.** Outside target: `<lane's fs root>/nana-lane-guard-missing-<pid>/x.txt`, never created. For `~`, set HOME and USERPROFILE to that folder. Build every file URL with `url.pathToFileURL(p).href`: a drive-less `file:///...` throws on win32 (probed `ERR_INVALID_FILE_URL_PATH`) and would make the check fail falsely after the fix. The same three forms naming a lane path stay allowed. Assert the outside folder still does not exist afterward.

## Platform coverage
- macOS: everything runs; R-1431, R-1432, R-1433 red today.
- Linux in the suite: HOME and TMPDIR both sit under /tmp (scripts/test.mjs:383-387), so every spelling sub-check SKIPs on its control. R-1430's POSIX half and R-1433 run.
- Windows: R-1430 and the 8.3 pairs red (inferred); case pairs green (win32 folds case); links via junction; R-1433 runs.

## Known limits
- TMP differing from TEMP is not a root. TEMP/TMPDIR set to a drive root permits that drive (owner config).
- `\\?\`, Git Bash `/c/...` and driveless targets are fixed by the same change but untested. The native-to-JS fallback (RAM disks, virtual drives) is untested.
- Linux has no spelling check in the suite (above).
- The gate keeps its own fail-closed resolver beside win-review-paths' `lib/real-path.mjs` (which falls back to the raw path). Unifying them is later work.
- A Windows worker writing `/tmp/x` with the write tool is now refused; pi would have put it in `<drive>:\tmp`, which is not Git Bash's /tmp (inferred: MSYS maps /tmp to the user temp folder). Use the temp folder.
- Ubuntu's existing "symlink escape outside lane is blocked" red is untouched (same cause: the suite's HOME under /tmp).


## Rows the builder adds as `planned` first (seat, 2026-10-19)

- **R-1430** — WHEN NANA_WORKTREE_ROOT is non-empty, the gate shall allow an edit/write target under `/tmp` on macOS and Linux, and refuse one under the `\tmp` folder of the gate process's current drive on Windows when that folder lies outside the lane folder and the OS temp folder.
- **R-1431** — WHEN NANA_WORKTREE_ROOT is non-empty and an edit/write target names a file in the OS temp folder through another spelling of that folder than the temp variable holds (letter case on a case-insensitive volume, an 8.3 short or long name, or a link), the gate shall allow it.
- **R-1432** — WHEN NANA_WORKTREE_ROOT is non-empty and an edit/write target names a path in the lane folder through another spelling of that folder than NANA_WORKTREE_ROOT holds (letter case on a case-insensitive volume, an 8.3 short or long name, or a link), the gate shall allow it.
- **R-1433** — WHEN NANA_WORKTREE_ROOT is non-empty and an edit/write target starts with `~`, `@` or `file://`, the gate shall judge the lane boundary at the path pi's edit and write tools write that target to.
