# Lane cc-hooks-windows — build brief 1 (2026-10-12 · feat/cc-hooks-windows · worktree ~/nana-pi-wt/cc-hooks-windows)

**Builder: Claude Sonnet 5.5** — Jake's measurement lane (the install-check lane is built by pi luna);
the seat records wall clock and rounds to land for each.

**The contract is `CHANGE.md` in this folder** (sol plan r3 LAND 100/100 after r1 70 and r2 86; read
`sol-plan-r1.md`, `sol-plan-r2.md` for why). Threat model: honest variation in a Windows machine is in
scope; a hostile local user is out. Lane class: gate-adjacent. Build all of it. Work ONLY inside
`/Users/jwang/nana-pi-wt/cc-hooks-windows` (use absolute paths; `cd` there in every shell command).

## What to build (each item maps to CHANGE.md)
1. **Rows first** (§2): add R-1050, R-1051, R-1053–R-1064 as listed (R-1052 is withdrawn — do not add it),
   reword or retire the existing rows exactly as §2 says, each with one `shall`; status `implemented`
   only when a cited test pins every clause, otherwise `untested` with the reason. Rows proven only on the
   Windows leg stay `untested` until that run is read. `npm run req:tree`.
2. **`packages/nana-setup/lib/settings.mjs`** (§3): exec form on win32 (`command: "node"`, `args`
   [absolute script path] — plus `"hook"` for knowledge — no `shell` key), `WIN_VERIFIER_MATCHER`,
   `CLAUDE_CODE_EXEC_FLOOR`, `entryInvokes`, `hookTargets`, `installerTarget`, `mergeRepoHooks`,
   `hasHook` and `removeInstallerHooks` with the platform argument, exactly as §3 names them. POSIX output
   byte-identical to main.
3. **`steps.mjs` (`stepSettings`), `doctor.mjs`** (the Node floor row on win32, the five hook settings
   rows, the floor note row), **`verifier-hook.mjs`** (`Bash` and `PowerShell`), the verifier-pipe
   header line.
4. **`packages/nana-pack/lib/pipe-guard.mjs`**: the PowerShell lexer in `liveText` (R-1062, §3), Bash
   path byte-for-byte unchanged.
5. **The runtime matrix cell** in `templates/_shared/working-under-nana-pi.md` and its two byte-identical
   copies (AGENTS.md, CLAUDE.md regions), the three Support lines, and the checks §4 lists. Commit the
   template change BEFORE `npm run template:accept`.
6. **Tests** (§5): every case listed, including the PowerShell lexing cases (each negative case carries a
   live `git commit`), the forced-win32 cases on every leg, the doctor and migration cases iterating all
   five labels, the macOS golden case, and the Windows-leg-only `packages/nana-setup/tests/hooks-win32-exec.test.mjs`
   (skipped and counted elsewhere). Each test carries its `// req:` marker directly above it.

## Rules
- **Wrong code first.** For each new case, run the obvious wrong implementation, see the test fail, then
  write the code. Mutation pairs (§5, 1–24) break the CODE, never an assertion.
- **No suite test may run, import or copy a seat script** (`seat-*.mjs` in this folder).
- **No test deletion.** Every test title in the seven test files `seat-verify-tests.mjs` lists, at launch
  (`5139889`), must survive or map to a named replacement with a reason in `test-title-map.json` (this
  folder). It must print `0 gap(s)`.
- No test writes the repository, the real `~/.claude` or `~/.pi`; fixtures under the OS temp folder;
  every install uses `--home <temp>`.
- New requirement IDs ONLY from R-1050–R-1069 (R-1065 onward if you must split; R-1070–R-1079 belong
  to the install-check lane).
- Fix the class, not the instance. Do not edit `CHANGE.md`, the seat scripts, `HANDOFF.md` or
  `docs/sessions/`. Commit with explicit paths; message file under `$TMPDIR`.

## Then
`npm run req:tree`, `npm run map`, `npm run map:check`, `npm run readme:check`, `npm run test:locked`,
commit, `npm run template:accept`, then from the worktree root:
`node docs/reviews/cc-hooks-windows-2026-10-12/seat-verify-hooks.mjs > docs/reviews/cc-hooks-windows-2026-10-12/seat-verify-hooks-output.txt 2>&1`
(must exit 0 with `seat-verify-hooks: 0 mismatch(es)`; it fails 32 of 59 at launch —
`seat-verify-hooks-launch.txt`) and
`node docs/reviews/cc-hooks-windows-2026-10-12/seat-verify-tests.mjs > docs/reviews/cc-hooks-windows-2026-10-12/seat-verify-tests-output.txt 2>&1`
(`0 gap(s)`). Commit both output files. Then push the branch and open a DRAFT pull request against
`main` titled "cc-hooks-windows (draft, for CI)" (no approval needed — Jake, 2026-10-11), wait for its CI
run, and report the Windows job's lines for `hooks-win32-exec`, `pipe-guard`, `settings-merge`,
`win32-degrade` and `verifier-pipe` verbatim (`gh run list --branch feat/cc-hooks-windows`, `gh run view
<id> --log`; poll no faster than every 60 s).

## Report
≤ 40 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; files; each row and the clause its
cited test pins; mutation pairs red/green; the `test:locked` summary line and total checks; the LAST TWO
LINES of each seat output file, verbatim; the Windows lines verbatim with the run ID; scope check
(`git diff --stat 5139889..HEAD`); the one claim most likely wrong.
