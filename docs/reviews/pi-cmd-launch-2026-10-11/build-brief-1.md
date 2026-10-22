# Lane pi-cmd-launch — build brief 1 (2026-10-11 · feat/pi-cmd-launch · worktree ~/nana-pi-wt/pi-cmd-launch)

**The contract is `CHANGE.md` in this folder: §1 outcomes, §2 rows, §3 design and declared limits,
§4 scope, §5 verification.** sol reviewed the plan five times (`sol-plan-r1..r4.md` here; r5 LAND
10/10). Read them for the reasons. The owner uses the pi seat on Windows daily: this lane makes install
register nana with pi there.

## Interfaces (pinned — the seat's acceptance script calls exactly these)
- `packages/nana-pack/lib/win-command.mjs` (new, six-tag header, named exports, no real resource
  reached without injection):
  - `findOnPath(name, { env, cwd, searchCwd = false, exists })` → absolute path string or `null`.
    `exists(p)` defaults to "lstat succeeds and is not a directory". Windows paths via `path.win32`.
  - `winCommand(file, args, { comspec })` → `{ command, args, options }` to pass to `spawnSync`, or
    `{ refused: "<reason naming the character or extension>" }`. `.cmd`/`.bat` →
    `command = comspec ?? "cmd.exe"`, `args = ["/d", "/v:off", "/s", "/c", "\"" + [file, ...args].map(a => "\"" + a + "\"").join(" ") + "\""]`,
    `options.windowsVerbatimArguments = true`; `.exe`/`.com` → `{ command: file, args, options: {} }`
    with no refusal; anything else → refused. Extensions compare without case.
  - `cmdCouldNotRun(command, { env, cwd, exists })` → boolean, exactly R-1038 / §3.
- `packages/nana-pack/lib/win-command-config.mjs` (new): `DEFAULT_PATHEXT`, `PI_EXTENSIONS`,
  `INTERNAL_COMMANDS` (the sealed 45 in §3, lower case), each with its provenance beside it.
- `stepPiRegister(layout, o, { platform, env, spawn, exists, manifestRoot } = {})` in
  `packages/nana-setup/lib/steps.mjs`: defaults are the real ones — `platform()` from `paths.mjs`
  (the existing `NANA_SETUP_PLATFORM` seam), `process.env`, `spawnSync`, the default `exists`, and
  `repoRoot`. `spawn(command, args, options)` returns a `spawnSync`-shaped result.
- `diagnose(layout, { ..., pi: { platform, env, spawn, exists } })` in `packages/nana-setup/lib/doctor.mjs`:
  the `pi executable` row uses `opts.pi` (same defaults); every other row is unchanged.
- `packages/nana-pack/extensions/nana-post-edit.ts`: `classify` gains the platform and the command;
  on win32, exit status 1 with `cmdCouldNotRun(command, { env, cwd, exists })` → `error`.

## What to build (each item maps to CHANGE.md)
1. **Rows first** (§2): add R-1033–R-1039 in their homes (R-1033–R-1036 and R-1039 under SUB-013;
   R-1037 under FEAT-015 beside R-952; R-1038 beside R-105), reword R-952 to the §2 text. One `shall`
   each; status `implemented` only for a row whose every clause a cited test pins. Rows whose only
   proof is the Windows leg stay `untested` with that reason in Evidence until the CI run is green.
   Run `npm run req:tree`.
2. **The helper and config modules**, then **`stepPiRegister`**, **doctor's pi row** and
   **post-edit**, exactly as §3. POSIX lookup unchanged, but R-1036 applies on every platform.
3. **Tests** (§5), each `// req:` marker directly above its check:
   - `packages/nana-pack/tests/win-command.test.mjs` (new): every pure case in §5, on every platform,
     plus one test that pins `INTERNAL_COMMANDS` to the exact sealed list, naming R-1038.
   - `pi-registration.test.mjs`, `doctor-runtime.test.mjs`: the injected win32 cases in §5 (a
     recording spawn; no real pi), on every platform; keep every existing test.
   - The **Windows-leg-only** cases in §5 (the real npm-generated shim with the space-and-
     metacharacter manifest root and prepended PATH; post-edit's R-105 test, `node -e
     "process.exit(1)"`, `type nana-missing-file.txt` and `dir/Z`; each sealed name under `where`
     and `cmd /d /c "<name> /?"`): guarded by `process.platform === "win32"`, reported as SKIP
     elsewhere so the count shows. You cannot run them here; write them so they would fail if the
     code were wrong, and say in the report which ones you could not execute.
4. **Docs**: the setup README and pack README where they say the pi check is skipped on Windows or
   describe post-edit statuses; the §3 limits in plain words where a Windows user reads them. Every
   sentence true of the code. Do not edit `HANDOFF.md` or `docs/sessions/`.

## Rules
- **Wrong code first.** For each row, run the obvious wrong implementation and see its test fail
  before writing the code. Mutation pairs as §5 lists: break the CODE (or a scratch copy), never an
  assertion; record red and green for each.
- **No suite test may run, import or copy a seat script** (`seat-*.mjs` in this folder).
- **No test deletion.** Every test title in the three existing test files at `0110601` must survive
  or map to a named replacement with a reason in `test-title-map.json` (this folder);
  `seat-verify-tests.mjs` checks it. Nothing retires.
- No test writes the repository, the real `~/.pi` or the real `~/.claude`; fixtures in the OS temp
  dir; no test runs the real `pi install` against a real agent dir.
- Fix the class: when a case fails, look for its siblings (other extensions, other characters,
  the other seam, the other platform).
- Keep `nana-post-edit.ts` crash-free: a throw in `cmdCouldNotRun` must not escape `classify`
  (catch and keep `checks_failed`).
- NOT (§4): the Claude Code hooks on Windows, the desk, other triage items, escaping instead of
  refusing. Commit with explicit paths, message file under `$TMPDIR`; keep gate-trigger text out of
  command strings.

## Then
`npm run req:tree`, `npm run map`, `npm run map:check`, `npm run readme:check`,
`npm run test:locked`, commit; then, from the repo root:
`node docs/reviews/pi-cmd-launch-2026-10-11/seat-verify-wincmd.mjs > docs/reviews/pi-cmd-launch-2026-10-11/seat-verify-wincmd-output.txt 2>&1`
(must exit 0 with `seat-verify-wincmd: 0 mismatch(es)`; at launch it fails 21 of 32 —
`seat-verify-wincmd-launch.txt`; the pure sections are skipped at launch because the module is
missing, so the finished count is higher), and
`node docs/reviews/pi-cmd-launch-2026-10-11/seat-verify-tests.mjs > docs/reviews/pi-cmd-launch-2026-10-11/seat-verify-tests-output.txt 2>&1`
(must end `seat-verify-tests: 0 gap(s)`). Commit both output files. The seat scripts and `CHANGE.md`
are frozen; if you think one is wrong, say so in the report and do not edit it.

## Report
≤ 40 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; files; each row and the clause
its cited test pins (say which rows wait on the Windows leg); mutation pairs red/green; the
`test:locked` summary line and total check count; the LAST TWO LINES of each seat output file,
verbatim; the Windows-only tests you could not execute; scope check
(`git diff --stat <the commit that adds this brief>..HEAD`); the one claim most likely wrong.
