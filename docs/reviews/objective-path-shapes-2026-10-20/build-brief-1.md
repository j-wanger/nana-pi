# objective-path-shapes — build brief 1

Feature: FEAT-001 · Keep goals and priorities in view. Class: install, hook or gate. Builder: a Claude Sonnet subagent in ~/nana-pi-wt/objective-path-shapes on feat/objective-path-shapes, from main 72abe19a or newer. Follow packages/nana-pack/prompts/builder-preamble.md. Run single test files only. Never edit HANDOFF.md or docs/sessions/. Add no inline tunables and no typed leaf total.

## Change
1. New packages/nana-pack/lib/objective-path.mjs: six-tag header, `@effects none`, `@errors none`. Export `DEFAULT_OBJECTIVE_FILE` (provenance: contract value, R-004) and `resolveObjectivePath(value, { home, agentDir, platform })`. Pick `path.win32` or `path.posix` from platform. Non-string or "": `<agentDir>/DEFAULT_OBJECTIVE_FILE`. "~": home. Leading `~/`, or `~\` where platform is "win32": under home. Absolute: as is. Else: under agentDir.
2. objective.ts `objectivePath`: `return resolveObjectivePath(o.path, { home: os.homedir(), agentDir: piAgentDir(), platform: process.platform })`. Keep `o.path`, never `o?.path`: objective-golden's R-2093 check needs a missing settings object to stay an internal error. Update the doc comment.
3. steps.mjs `objectiveTarget`: keep the export. Make it one call with `layout.base`, `layout.piHome` and `process.platform` (never the platform() seam), delete the hand copy, and update its comment.
4. paths.mjs: `piObjective: path.join(piHome, DEFAULT_OBJECTIVE_FILE)`.
5. doctor.mjs, after the `pi objective.projectFile` row: add FAIL `pi objective.path` with no install label, only when `cfg.objective.path` is present and neither a string nor null. Detail: `<JSON value, capped at 120 as projectFileState caps it> is invalid (expected a path string or null) — the producer ignores it and uses <layout.piObjective>; set objective.path in <piPackConfig> to a path string, or null for the default`. Add the row to @outputs.
6. REQUIREMENTS.md: put R-2280 and R-2281 after R-343, R-2282 after R-309, and R-2283 to R-2285 after R-005, using the must-meet text verbatim. Mark R-2280 to R-2284 implemented with file::title evidence. Mark R-2285 untested, evidence "Windows-leg-only; pending the Windows CI leg".
7. READMEs: in the pack README objective paragraph, say a leading `~\` also expands on Windows, and an empty or non-string objective.path means the default file. In the nana-setup README nana-objective.md row, say an empty or non-string objective.path resolves to this file.
8. Run `npm run map` and `npm run req:tree`. Then make map:check, readme:check and `node scripts/requirements-trace.mjs` green.

## Tests: new packages/nana-setup/tests/objective-path-shapes.test.mjs (six-tag header)
Put each `// req: R-nnnn` on the line directly above `check("R-nnnn: <must-meet title>", …`.
Setup:
- Temp homes with made-up names (tests/tmp-dir.mjs), with a knowledge sources.json as in install.test freshHome.
- Producer env: HOME and USERPROFILE = home, PI_CODING_AGENT_DIR = <home>/.pi/agent, plus cleanEnv from pack-config-utf16.test.mjs. Pass `--cwd` a neutral temp folder.
- Doctor: run the CLI through withPiStub from a neutral cwd. Call in-process `diagnose(layout, { projectDir: <neutral dir> })` inside withPiStub.
- Report any throw as a FAIL.

Checks:
- R-2280, values 5, true, {} and []: CLI `doctor --home` exits 1, prints no `TypeError` and no `^\s+at ` line, and its last line has no "could not predict". The in-process labels equal the same home's labels with objective.path removed, plus `pi objective.path`.
- R-2281, values 5, true, false, {} and []: the row is ✗ and its detail holds JSON.stringify(value) and the default file. That file equals the producer's `governing:` path once it holds an `**Objective` line. For null, "", "notes/goal.md" and absent, no such row appears.
- R-2282, values 5, true and {}: write the config, then run `install --home`. Expect exit 0, no TypeError, and step labels equal to those of a fresh home whose nana-pack.json is `{"objective":{}}`. The default nana-objective.md must exist.
- R-2283, objective.path "": install's `pi nana-objective.md` row says created, not "not needed". The producer prints `**Objective`, no MARKER_PREFIX, and `governing: <default file>`. Doctor's `pi objective file` row is ✓ with exactly that path.
- R-2284, a pure check with made-up homes: win32 maps `~\notes\goal.md` under home, posix keeps it under agentDir, and `~/` expands on both.
- R-2285: use the marker `// req-candidate: R-2285 (Windows only; becomes req: when the Windows CI leg passes it)`. On win32, write <home>\notes\goal.md and set the config to `~\notes\goal.md`. The producer's `governing:` names that file, and doctor's objective file row is ✓ with that path. Off win32, print `SKIP <title> — …` and count no PASS.
Also run each alone: objective-golden, objective-injection, doctor-detail, fresh-machine, install, doctor-fix-line, stale-copies.

## Wrong code to try (each must turn the named check red; revert after)
1 resolver tests `!value`, not the type: R-2280, R-2282 · 2 "" resolves under agentDir: R-2283 · 3 `~\` expands on every platform: R-2284 · 4 `~\` never expands: R-2284 · 5 objective.ts keeps its old body: R-2283 · 6 objectiveTarget restores the hand copy: R-2280, R-2282 · 7 doctor row dropped: R-2280, R-2281 · 8 row also for null or "": R-2281 · 9 row warns, or omits the default file: R-2281 · 10 row only for truthy values: R-2281 · 11 objectiveTarget passes `home: os.homedir()`: install.test's R-309 check "objective seed: created when objective.path resolves to it".

## Done
Every check passes on macOS, and each wrong-code item turns its named check red. map:check, readme:check and the requirements trace are green. The work is committed on feat/objective-path-shapes.

## Report (≤ 10 lines)
Verdict line; commits; per-row PASS counts; wrong-code results by number (red or survived); green checks; anything not done.