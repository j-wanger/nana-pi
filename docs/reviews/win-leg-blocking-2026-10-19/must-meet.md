# win-leg-blocking — the Windows leg reads green with desk and bench declared (2026-10-19)

**Feature.** On win32, `npm test` SKIPs each desk and bench test file on a declared Windows skip list, prints that file's reason and never starts it. Every other file runs as before. macOS and Linux run them all.

**Class: gate.** The lane edits `scripts/test.mjs`, the runner every land rests on. Jake's 10-17 yes named W8 a gate lane; runtime-map set the precedent. Power-mode ladder: Opus final review, Fable land review, the seat's wrong-code pairs, one independent check.
**Threat model.** In scope: honest variation in platforms, temp-path spellings and npm layouts, and a list entry added to hide a failure outside desk or bench (R-1383). Out of scope: deliberate forgery.

**Design.**
- New `packages/nana-pack/lib/windows-skips-config.mjs` (six-tag header, `@effects none`) exports `WINDOWS_SKIPS`, a frozen map from repo-relative test path to reason. Provenance: measured on CI Windows run 2 at 3bd044e (`docs/reviews/win-impact-paths-2026-10-18/ci-windows-run-2.log`); declared by Jake 2026-10-17. Same home as `runtime-map-config.mjs`, which the runner already imports.
- `scripts/test.mjs`: the existing `skipReason` gains one fallback. After `SKIPS[rel(file)]?.()`, on win32 only, `Object.hasOwn(WINDOWS_SKIPS, rel(file)) ? WINDOWS_SKIPS[rel(file)] : null`. The SKIP branch (tally, coverage record) stays shared. Nothing else changes.
- Whole-file skips cover only the 20 files red on that run. live-feel and nine bench files were green there and keep running.
- Docs: one sentence in README "Tests"; one Windows bullet in the desk README "Known limits"; one Windows line in the bench README "Install, run and test". No desk product or test file changes (desk frozen).
- R-607 needs no rewording: the declared precondition is "not win32", false there.

**Why each file fails (Windows run 2).** Reason: `win32: desk|bench not supported on Windows (declared 2026-10-17): <cause>`.
| Files | Cause | Kind |
|---|---|---|
| desk (13): app-listener, buffer-caps, changes-endpoint, crash-paths, pi-087-entries, pi-resolution, pi-rpc-contract, pi-session-parity, prompt-detach, spawn-and-persist, stage-key-persistence, teardown-invariants, usage-line | `resolvePiPackage` cannot tie pi to a package. Its `npm root -g` and `pi --version` probes run `.cmd` shims through `execFileSync` without a shell, which Node does not run on Windows; the error is swallowed (inferred from code). Its prefix fallbacks assume the POSIX `lib/node_modules` layout. The server stops with "cannot start" (server.mjs:129). | real desk bug; frozen, so a known limit |
| desk host-rule, origin-rule | The harness passes `new URL(..).pathname` (`D:\D:\…\server.mjs`); the server behind it hits the resolver bug (inferred). | test bug hiding the real bug |
| desk knowledge-home-isolation | A source scan whose launcher regex expects `/`. The result is platform-independent; macOS covers it. | test bug |
| changes-endpoint (also) | `realpathSync` returns the 8.3 short root, git the long root. A symlink is refused with 400 "leave the root", not 409 "symlink": still refused. | test spelling; fail-closed difference |
| bench agentdir | `the dir is 0700` cannot hold: Windows has no POSIX mode bits. | cannot exist; a real limit |
| bench argv, usage | Expected values are written as POSIX paths. | test bug |
| bench catch-ledger | Stub judges are extensionless shebang files Windows cannot start (ENOENT). The judge's `cwd: "/tmp"` is also suspect (inferred). | test bug, suspected bench bug |

**Must-meet** (all in `packages/nana-pack/tests/test-runner.test.mjs`; no platform skip — every check forces its platform)
| ID | Row | Test title | Red today |
|---|---|---|---|
| R-1380 | WHERE the platform is win32, the test runner shall SKIP each test file on the declared Windows skip list without starting it, printing that file's declared reason. | `R-1380: win32 SKIPs each file on the declared Windows skip list with its reason and never starts it` | Yes. Probe: main's runner, forced to win32 by an `--import` preload, ran trap files at desk app-listener and bench usage and printed FAIL for both; the amended check read false on main's runner and true on a wired copy. Windows run 2 shows all 20 FAIL. |
| R-1381 | WHERE the platform is not win32, the test runner shall run each test file on the declared Windows skip list. | `R-1381: off win32 each file on the declared Windows skip list runs` | No, a guard. Probe: red on W1 (predicate ignores the platform). Forced to `linux` on every host, so it also runs on the Windows leg. |
| R-1382 | WHERE the platform is win32, the test runner shall run each desk or bench test file that is not on the declared Windows skip list and whose other declared preconditions hold. | `R-1382: win32 still runs each desk and bench file off the declared Windows skip list` | No, a guard. Probe: red on W2 (whole-app prefix skip). |
| R-1383 | The declared Windows skip list shall name only test files the runner collects from apps/desk/test or apps/bench/test. | `R-1383: the declared Windows skip list names only collected desk and bench test files` | Yes: the module does not exist. Red on an entry naming a pack test or a misspelled path. |

**Seat evidence (no row).** (1) The Windows leg on the lane tip: 0 desk or bench FAIL, 20 SKIP lines with reasons, live-feel and nine bench files PASS, R-1381 PASS there. Remaining FAILs belong to win-review-paths only. (2) On macOS, desk and bench per-file labels and check counts match `macos-baseline.txt` (b3f6ec2). (3) Map, readme and locked full-suite checks green. (4) The lane's wrong-code pairs re-run after any seat edit.

**Known limits.** Whole-file skips hide about 285 checks that pass on Windows inside partial files (usage 89, changes-endpoint 70, catch-ledger 65, argv 31, agentdir 25, pi-resolution 4, pi-rpc-contract 1). Nothing detects a stale entry once its cause is fixed; R-1383 catches only a removed or renamed file. The covered test bugs are skipped, not fixed. `DESK_PI_ROOT` (which skips the probes) is untested on Windows. A forced platform leaves `path` and `fileURLToPath` on the host flavour, so the real Windows leg is the platform evidence. Once the leg blocks, a new Windows failure in a still-running desk or bench file blocks release.

**CI flip: follow-up lane `win-leg-flip`, started by the seat.** Trigger: after this lane and win-review-paths land, two consecutive main pushes whose `suite (windows-latest)` job log reads `0 FAIL` (read the job: continue-on-error keeps the run green). Changes: `ci.yml:51` to `continue-on-error: ${{ matrix.os == 'ubuntu-latest' }}`; `ci-workflow.test.mjs` pins (R-1032 retired, a new row: release waits on the Windows leg); the R-684 Support line in README, AGENTS, nana-setup README and its canonical copy in `templates-render.test.mjs`; README prose. Not here: its trigger exists only after this lands, and nothing is edited after LAND. Open there: whether a land also needs a green Windows leg on the reviewed tip.

## Rows the builder adds as `planned` first (seat, 2026-10-19)

- **R-1380** — WHERE the platform is win32, the test runner shall SKIP each test file on the declared Windows skip list without starting it, printing that file's declared reason.
- **R-1381** — WHERE the platform is not win32, the test runner shall run each test file on the declared Windows skip list.
- **R-1382** — WHERE the platform is win32, the test runner shall run each desk or bench test file that is not on the declared Windows skip list and whose other declared preconditions hold.
- **R-1383** — The declared Windows skip list shall name only test files the runner collects from apps/desk/test or apps/bench/test.
