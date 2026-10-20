# Build brief — project-check-quiet
Feature: FEAT-014 · Create or adopt a project workspace (rows home in SUB-021 · Check readiness and ratify the objective)
Class: ordinary. Threat model: honest variation in Node version, platform, project config and preloads is in scope; deliberate forgery is out.
Builder: simple lane, a Claude Sonnet subagent. Work in ~/nana-pi-wt/project-check-quiet on feat/project-check-quiet, from main 6f07daee or newer. Follow packages/nana-pack/prompts/builder-preamble.md. Run single test files only. Never edit HANDOFF.md or docs/sessions/.

## Change, in order
1. REQUIREMENTS.md, SUB-021 table: add R-2050, R-2051 and R-2052 directly after R-1670, in that order, verbatim from the must-meet. Each starts `untested` with evidence `—`. Flip each to `implemented` with its `file::title` once its check passes.
2. packages/nana-setup/tests/doctor-quiet.test.mjs:
   - Add `runProjectCheck(label, { nodeOptions = [], config = true } = {})`.
     - It makes `root/<label>`. When `config` is set, it also writes `.pi/nana-pack.json` with "{}\n".
     - Env is process.env minus NODE_OPTIONS, NODE_NO_WARNINGS and NODE_REDIRECT_WARNINGS.
     - It spawns `process.execPath` with `[...nodeOptions, cli, "project", folder, "--check", "--home", path.join(root, `${label}-home`)]` and cwd `folder`, and returns spawnSync's utf8 result. No pi stub is needed.
   - R-2052 `project --check in a folder without project config writes no Node warning`: stdout includes "nana-setup project --check" and not "project trust", and warningLines(stderr) is empty.
   - R-2050 `project --check in a folder with project config writes no Node warning`: stdout includes "nana-setup project --check" and "project trust", and warningLines(stderr) is empty.
   - R-2051 `project --check still prints a Node warning it does not mute`:
     - Use a second preload like R-1752's, triggered by stdout text "nana-setup project --check".
     - It emits one ExperimentalWarning and one warning with code NANA_PROJECT_QUIET_PROBE, each with its own message.
     - The check passes when stderr includes both messages.
   - Put each `// req: R-205n` directly above a one-line `check("title", …`. Use the existing failure detail (status, stdout, stderr).
   - Change @purpose to "Pin the selective muting of Node warnings in doctor and project --check while preserving unrelated warning output." Keep the other tags unless one becomes false.
3. Run doctor-quiet.test.mjs. Record that R-2050 and R-2052 FAIL and R-2051 PASSes.
4. packages/nana-setup/bin/nana-setup.mjs:
   - In runProject, make `muteDoctorWarnings();` the first statement inside `if (opts.check) {`.
   - In the comment above DOCTOR_MUTED_WARNINGS, make "rows R-1750 and R-1751" read "rows R-1750, R-1751 and R-2050".
   - In the module header, @outputs reads "the stderr of doctor and project --check carries no muted warning". @effects reads "replaces the warning listeners for doctor and project --check".
   - Make no rename, filter change or new tunable, and touch no other branch.
5. packages/nana-setup/README.md:
   - After the paragraph beginning "`project --check` compares only the marker-owned section", add "`project --check` mutes the same two Node warnings doctor mutes and prints every other Node warning."
   - In the Tests-table row for `tests/doctor-quiet.test.mjs`, name `project --check` beside doctor.
6. Run `npm run req:tree` and `npm run map`, and commit both outputs.

## Checks (single files)
- `node packages/nana-setup/tests/doctor-quiet.test.mjs`: all 6 checks pass.
- packages/nana-setup/tests/project.test.mjs, entry-guidance.test.mjs and relative-agent-dir.test.mjs; packages/nana-pack/tests/requirements-tree.test.mjs.
- `node scripts/requirements-trace.mjs`, `npm run map:check` and `npm run readme:check`.

## Wrong code (apply each in the worktree, run doctor-quiet, then revert)
- M1, step 4's call left out: R-2050 and R-2052 red.
- M2, `process.removeAllListeners("warning");` in place of the call: R-2051 red.
- M3, the call moved to just before `refuseIfDismissed(dir);`: R-2050 and R-2052 red.
- M4, `process.env.NODE_NO_WARNINGS = "1";` in place of the call: R-2050 and R-2052 red.
- M5, a local listener in place of the call: it drops only an ExperimentalWarning whose message names SQLite and forwards the rest. R-2050 and R-2052 red.
- M6, the call made only when `path.join(dir, ".pi", "nana-pack.json")` exists: only R-2052 red.

## Done
- All six doctor-quiet checks pass. R-2050 and R-2052 failed before step 4.
- M1 to M6 each turn red only the named checks.
- Trace, tree test, map:check and readme:check are green.
- Only the six listed files changed: the CLI, the test, the setup README, REQUIREMENTS.md, the requirements tree and the code map.

## Report (≤ 10 lines)
1. DONE or BLOCKED, the tip SHA and one line on what changed.
2. The R-2050 and R-2052 FAIL lines before the fix, each with its first stderr line.
3. The doctor-quiet PASS lines after the fix.
4. M1 to M6: the checks that went red for each.
5. Trace, tree test, map:check and readme:check results.
6. The project, entry-guidance and relative-agent-dir results.
7. Files changed.
8. Anything off-brief, or "none".