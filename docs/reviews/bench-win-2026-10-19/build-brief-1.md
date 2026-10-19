# bench-win — build brief 1 (2026-10-19 · feat/bench-win from main after win-leg-blocking lands)

**Builder: Claude Sonnet, a subagent in `~/nana-pi-wt/bench-win`.** Class: ordinary.
- Read `docs/reviews/bench-win-2026-10-19/must-meet.md` first.
- Rows come only from R-1520 to R-1529. Use R-1520 and R-1521.
- Do not touch apps/desk, `scripts/test.mjs`, `HANDOFF.md` or `docs/sessions/`.
- Do not run the full suite and do not push; the seat does both. Run single files through the runner: `node scripts/test.mjs <path>...`.

**Change**
1. REQUIREMENTS.md: add R-1520 to FEAT-038 after R-537, and R-1521 to FEAT-031 after R-1383, both `planned`. Run `npm run req:tree`. Bump the R-291 leaf-total literal in `packages/nana-pack/tests/requirements-tree.test.mjs` by 2 (title and numbers). Flip each row to `implemented` with its test title once it is green.
2. `apps/bench/lib/catch-judge.mjs`:
   - Add `import os from "node:os"`.
   - `callJudge` gains `spawn = spawnSync` and calls `spawn(bin, args, {...})`.
   - `cwd: "/tmp"` becomes `cwd: os.tmpdir()`.
   - Update the header's @inputs (optional spawn) and @effects (cwd: the OS temp folder). Change nothing else.
3. `apps/bench/test/catch-ledger.test.mjs`, judge block:
   - `stub()` writes `<name>.mjs` with no shebang and mode 0o644.
   - Add `const viaNode = (bin, args, opts) => spawnSync(process.execPath, [bin, ...args], opts)`. It must pass `opts` UNCHANGED.
   - `run(bin, spawn = viaNode)` passes `spawn` to callJudge.
   - "judge missing" calls `run(path.join(tmp, "nope"), spawnSync)`.
   - Guard the well-formed call: `let ok = null, okErr = ""; try { ok = run(...) } catch (e) { okErr = e.message; }`. The check becomes `ok !== null && …`, with okErr as its extra. The title is unchanged.
   - Update the header's @inputs and @effects ("stub judge scripts run through node").
4. `apps/bench/test/argv.test.mjs`, check "relative -e path…":
   - Add `import os from "node:os"` and set `const base = path.join(os.tmpdir(), "nana-bench")`.
   - studyDir is `path.join(base, "studies", "s1")`.
   - The expected value is `path.join(base, ".ext", "pi-web-access", "node_modules", "pi-web-access", "index.ts")`.
   - Keep the title.
5. `apps/bench/test/usage.test.mjs`, check "a wrong BENCH_PI_ROOT…":
   - Set `const wrongRoot = path.join(fixtureRoot, "definitely-not-a-pi-install")` and use it as BENCH_PI_ROOT.
   - The check becomes `(threw ?? "").includes(wrongRoot)`.
   - Keep the title and `// req: R-508`.
6. `apps/bench/test/agentdir.test.mjs`, check "the dir is 0700": on win32, print `SKIP the dir is 0700 — Windows has no POSIX mode bits to hold`. Otherwise the check is unchanged.
7. `packages/nana-pack/lib/windows-skips-config.mjs`:
   - Delete the four `apps/bench/test/*` entries and the three bench cause constants with their comments.
   - Change "These 20 desk and bench files…" to the 16 desk files.
   - Add one line: bench entries removed 2026-10-19 by bench-win, fixed instead.
   - Keep the provenance.
8. `apps/bench/README.md`: replace the four-file Windows paragraph with one sentence. Every bench test runs on win32; agentdir's folder-mode check prints SKIP there.
9. Run `npm run map` and commit `docs/code-map.md`.

**Tests** (only these two new checks, each with `// req:` directly above its check call)
- **R-1520** (catch-ledger, inside the judge block):
  - A `cwd` stub prints `{is_error:false,structured_output:{labels:[],cwd:process.cwd()},modelUsage:{"claude-opus-5-5":{}}}`.
  - Save TMPDIR, TEMP and TMP. Set all three to `judgeTmp = tmpDir(path.join(tmp, "judge-tmp-"))`.
  - Call `run(stub)` in try. Restore the three in finally, deleting each one that was undefined.
  - Assert `fs.realpathSync.native(out.cwd) === fs.realpathSync.native(judgeTmp)`. The extra is both paths, or the error.
- **R-1521** (test-runner.test.mjs, after R-1383):
  - `benchSkips = Object.keys(WINDOWS_SKIPS).filter(p => p.startsWith("apps/bench/"))`. Check `benchSkips.length === 0`.
  - That file's `check(n, ok)` takes no extra, so console.log the offenders on their own line when there are any.

**Order.** Commit 1 holds the rows, tree, the two new checks and the test edits, with the product and skip list untouched. Paste the red lines for R-1520 and R-1521. Commit 2 holds the product change, skip list, README and map.

**Wrong code to try** (break the code, never the assertion):
- W1: callJudge ignores `spawn`. R-1520, the four R-537 stub checks and the well-formed check go red.
- W2: `cwd: "/tmp"` kept. R-1520 goes red under the runner, and also in `env -u TMPDIR node apps/bench/test/catch-ledger.test.mjs`.
- W3: `cwd` omitted. R-1520 goes red.
- W4: one bench entry left in WINDOWS_SKIPS. R-1521 goes red.
- W5: profiles.mjs extPath resolves against `process.cwd()`. The argv check goes red.
- W6: pi-exports drops the Tried list. The usage check goes red.
- W7: prepareAgentDir drops the 0o700 chmod and mkdir mode. The agentdir 0700 check goes red on macOS.

**Done.** On macOS these files pass, each run singly through the runner: the four bench files, `test-runner`, `requirements-tree`, `requirements-trace` and `requirement-rows`. W1 to W7 each turn their check red. `npm run map:check` and `npm run readme:check` exit 0.

**Report (≤10 lines):** VERDICT; commits; the two red lines from commit 1; W1–W7 with the check each turned red; the existing-test edits listed; per-file PASS/SKIP counts for the six files; map and readme exit codes; anything not done.