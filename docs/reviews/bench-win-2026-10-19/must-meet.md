# bench-win: every bench test file runs and passes on Windows (2026-10-19)

**Feature.** On win32, `npm test` runs agentdir, argv, catch-ledger and usage under apps/bench/test, and they pass. The declared Windows skip list names no bench file. The catch ledger's judge starts in the OS temp folder, not a fixed `/tmp`.

**Class: ordinary.** The lane changes bench code and tests and removes entries from the skip-list data module. It does not touch `scripts/test.mjs`, a hook, an extension, the gate, or the land and review tools. Removing entries makes the runner run more files, so it cannot hide a failure.

**Threat model.** In scope: honest variation in platforms (drive letters, backslashes, 8.3 short temp paths, no POSIX mode bits, scripts Windows cannot start without a shell) and in temp folders set by the runner or the caller. Out of scope: deliberate forgery.

**Why each file fails on Windows today** (CI run 2, `docs/reviews/win-impact-paths-2026-10-18/ci-windows-run-2.log` lines 7437, 7541, 7608-7625, 8206)
| File | Failing check | Cause | Fix |
|---|---|---|---|
| catch-ledger | 4 stub checks → `judge unavailable: ENOENT`, then the unguarded well-formed call crashes the file (6 later checks never ran) | (1) bench bug: `cwd: "/tmp"` is `D:\tmp` on Windows; a missing cwd gives ENOENT for any judge (inferred). (2) test bug: extensionless shebang stubs Windows cannot start | product: `cwd: os.tmpdir()` plus an optional `spawn = spawnSync`; test: `.mjs` stubs run by an injected spawner through `process.execPath`; the well-formed call is guarded |
| argv | `relative -e path is made absolute against studyDir` got `D:\tmp\nana-bench\...` | test bug: POSIX literal | studyDir and expected value built with `path.join(os.tmpdir(), "nana-bench", ...)` |
| usage | `a wrong BENCH_PI_ROOT fails and names the path tried` | test bug: regex expects `/definitely/not/...`; product prints `D:\definitely\...` | BENCH_PI_ROOT = `path.join(fixtureRoot, "definitely-not-a-pi-install")`; check `threw.includes(wrongRoot)` |
| agentdir | `the dir is 0700` got 666 | cannot exist: no POSIX mode bits on Windows | per-check SKIP on win32 with that reason; unchanged on POSIX |

Existing check titles stay the same (R-508 and R-537 cite edited titles).

**Must-meet**
| ID | Row (EARS) | Test | Red today |
|---|---|---|---|
| R-1520 | WHEN the catch ledger calls its judge, the judge process shall start in the operating system's temporary folder. | `apps/bench/test/catch-ledger.test.mjs::R-1520: the judge child starts in the OS temp folder, not a fixed /tmp` | Yes. Probed in a temp clone of b88d62f. The test sets TMPDIR/TEMP/TMP to a fresh folder for the call, so it discriminates with or without the runner. Today: FAIL `judge unavailable: EACCES` (no seam). Seam with `cwd: "/tmp"`: FAIL (`/private/tmp` vs the folder), under the runner and directly with TMPDIR unset. `cwd` omitted: FAIL (child in apps/bench). `cwd: os.tmpdir()`: PASS (76 pass). |
| R-1521 | The declared Windows skip list shall name no apps/bench test file. | `packages/nana-pack/tests/test-runner.test.mjs::R-1521: the declared Windows skip list names no bench test file` | Yes. Probed on b88d62f: FAIL (43 pass, 1 fail). PASS (44) once the 4 entries are removed; R-1380..R-1383 stay green. |

Both rows are cross-platform with no skip. R-1521 statically imports `WINDOWS_SKIPS`. R-1382's forced-win32 check then also runs the four files.

**Dropped from the seat's plan: the spawner row.** It pinned a test seam, not user behaviour. The seam stays in the design, as the standards require for side-effect resources. Six existing checks pin it. With callJudge ignoring `spawn` (W1), R-1520, the four R-537 stub checks and "judge well-formed" go red (probed: 70 pass, 6 fail).

**Test-only edits (no row; probed on macOS).**
- argv: 32 pass, 1 skip. usage: 90. agentdir: 26. catch-ledger: 76 with the fix.
- Under path.win32, both new expected values equal path.resolve's result.
- W5 (extensions resolved against cwd) turns the argv check red. W6 (Tried list dropped) turns the usage check red.
- "judge missing" keeps the real `spawnSync`, so the platform's ENOENT path stays covered. The two CLI checks also use the real spawn.

**Seat evidence (no row).**
1. Push the branch and open a draft PR; CI runs only on PRs and main. The Windows leg must show agentdir, argv, catch-ledger and usage as PASS (agentdir with 1 SKIP), 0 bench FAIL and the 16 desk SKIP lines unchanged. A bench FAIL there blocks the land.
2. On macOS, per-file counts match main, except catch-ledger +1 check and test-runner +1.
3. `map:check` and `readme:check` exit 0, and the locked full suite is green.
4. The seat removes HANDOFF's "Bench tests on Windows (win-leg-blocking)" residual.

**Known limits.**
- The real judge on Windows: an npm-installed Claude Code is `claude.cmd`, which `spawnSync` cannot start without a shell. It reports `unavailable: ENOENT` unless CATCH_JUDGE_BIN names an `.exe`, such as the native installer's `claude.exe` (inferred, untested).
- Without symlink privilege, `…as a SYMLINK, not a copy` fails (R-514 by design). CI runners hold the privilege.
- Nothing checks the bench agent folder's Windows ACLs. The 0700 check only SKIPs there.
- Stub judges run through node via the seam. Only "judge missing" and the CLI checks use the platform's own spawn.
- On macOS and Linux the real judge now starts in `$TMPDIR` instead of `/tmp`. Recorded study labels are not re-run (inferred harmless: no CLAUDE.md sits above either folder).

## Rows the builder adds as `planned` first
- **R-1520** (FEAT-038, after R-537): WHEN the catch ledger calls its judge, the judge process shall start in the operating system's temporary folder.
- **R-1521** (FEAT-031, after R-1383): The declared Windows skip list shall name no apps/bench test file.