# Lane install-honest-report — build brief 1 (2026-10-19 · feat/install-honest-report · tip after the seat's plan commit)

**Builder:** pi gpt-5.6-sol via `pi-worker --lane install-honest-report --lane-size larger`, in `<worktrees>/install-honest-report`. Follow `packages/nana-pack/prompts/builder-preamble.md`. Lane class: install. Feature: FEAT-013 · Install and connect harness runtimes. Rows R-1590 to R-1593 go under SUB-014. Read `must-meet.md` here first.

**Order.**
1. Add the four rows as `planned` under SUB-014 in `REQUIREMENTS.md`, then run `npm run req:tree`.
2. Set the R-291 leaf total in `packages/nana-pack/tests/requirements-tree.test.mjs` (title, return and detail) to the total `node scripts/requirements-trace.mjs` prints.
3. Write the tagged tests, then the code. Flip each row to `implemented` when its test passes.

Run single test files only. Do not push. Never edit `HANDOFF.md` or `docs/sessions/`.

**Product (`packages/nana-setup/lib/steps.mjs`).**
- `install()`: keep `readClaudeSettings` first. When not a dry run, call `withSettingsLock(layout.claudeSettings, …)` once around retired, hooks, rules, skills and settings, then run the remaining steps after it returns, in today's order. A dry run runs the same five steps with no lock.
- `stepSettings(layout, o, state, { lockHeld })`: when `lockHeld` is set, run the body directly. Otherwise take the lock as today. Only `install()` passes it.
- `stepRetiredArtifacts`: after the ancestor check and `lstatSafe(source)`, `continue` with no row when `st.isSymbolicLink()` and `entry.relative` is `.claude/skills/<name>` with `<name>` in `NEW_CLAUDE_SKILLS`. Add one comment line naming `stepSkills` (R-665) as the step that reports such a link. Add no realpath compare and no new helper.
- Leave the win32 skip line, the no-reclamation note, the lock message and `uninstall.mjs` untouched.
- Header (`@outputs` and `@errors`): say that install takes the settings lock before its first write and holds it through the settings write.

**Tests.** Use the four titles from must-meet.md verbatim. Put `// req: R-159x` directly above a single-line `check("title", …`.
- R-1590: in the settings-merge lock section, take a full-home snapshot (lstat, no follow).
- R-1591 and R-1592: in install.test section 2, reuse `first` and `second`.
- R-1593: in retired-artifacts, use a fresh `home()` with `.claude/skills/nana` as a `"junction"`-type link to an outside temp folder. Compare readlink before and after. Add no platform guard and no exit-code assertion.
- Add `// req: R-926` above the existing `lock: --dry-run is not blocked by a lock` and flip R-926 to implemented. Write no other new test.

**Docs.** In the packages/nana-setup README:
- The lock paragraph: the lock is taken before the first write and held through the settings write; a held lock means nothing was written.
- The retired-artifacts row of the install table: a link at spec, py-lint, py-review or py-test is reported by its skill row, not as retired.
- The install and settings-merge test-table rows.

Then run `npm run map` and commit `docs/code-map.md`.

**Wrong code to try.** Each must fail the named check. Report each pair.
1. Lock taken from the hooks step on, with retired outside it: R-1590 fails.
2. Lock only inside `stepSettings` (today's code): R-1590 fails.
3. Lock also wraps `--dry-run`: `lock: --dry-run is not blocked by a lock` fails.
4. `stepSettings` takes the lock again inside install's: `lock: a normal install leaves no lock file` fails (exit 2).
5. Lock released only on success, with no finally: `full install: no temp or lock left behind` fails.
6. Retired step skips every symlink under `.claude/skills/`: R-1593 fails.
7. Retired step skips the four names whatever their kind: `recognized Claude skill and empty flag move under dated backups` fails.
8. Retired step keeps the row but prints it unchanged: R-1591 fails.
9. A lock-existence check before the first write, with the lock still taken only at settings: no check fails. Report it as uncaught.

**Done.**
- The settings-merge, install, retired-artifacts, uninstall, win32-degrade, skills-and-standards, state-manifest, fresh-machine and requirements-tree test files pass.
- `npm run map:check`, `npm run readme:check` and the requirements trace are green.
- The four rows and R-926 are implemented.
- No file outside the lane list is touched.
- The seat runs `npm run test:locked`, the mutation runner, `install-check.mjs` on macOS and `requirements-moved.mjs`.

**Report (≤ 10 lines):** commits; files; rows and their status; the nine wrong-code pairs, each with its failing check title or "uncaught"; each command with its exit code; per-file PASS/FAIL counts; what was not done.