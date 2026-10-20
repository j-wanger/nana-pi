# install-pins: build brief 1

Feature: FEAT-013 · Install and connect harness runtimes (R-346: FEAT-015 · Diagnose the active environment)
Class: ordinary. Change tests and the ledger only, and nothing under lib/, bin/, claude/ or extensions/. If product code turns a check red, stop and report. Work in ~/nana-pi-wt/install-pins on feat/install-pins, branched from current main.
Rules: add exactly the eight checks below and no other new check; fold each control into its pinned check. No skips. No `|` in a title. No new tunable: reuse PI_SUBAGENTS_FLOOR and each block's own fixture values.

## Change
1. skills-and-standards.test.mjs, section 4. Insert right after `const r = run(["install", "--home", occupied]);` and before the platform branch. Run `install --home <occupied> --dry-run`, then add:
   - R-1870. Pass when the folder is still a real directory holding only SKILL.md with the same bytes, no entry in the skills directory has `.bak-` in its name, and stdout matches `/✗ skill requirements/` and `/a directory is already at .* — left untouched; move or remove it, then re-run/`.
   - R-1871. Pass when both runs exit 1.
2. settings-merge.test.mjs:
   - Held-lock block: add R-322. Pass on status 2, the lock path, "pid 4242", `/\b9\ds ago\b/` and `rm <lock path>`.
   - New block after the {"hooks":"disabled"} block. Use two fresh homes: one with an unparseable settings body, one with {"hooks":"disabled"}. Take homeSnapshot before and after each install. R-924 passes when both runs exit 2, stderr names the settings file, and the snapshot is unchanged.
3. install.test.mjs, new block before `function walk`. Setup: import shq. Set plat to "win32" on win32, else undefined. Build wanted with desiredHooks({ hooksDir: <home>/.claude/hooks, repoRoot: repo, platform: plat }). shellForm(w) joins a win32 exec-form entry into one line (the command, then each arg through shq); otherwise it returns w.entry.command.
   - R-922. Run install --home. The control has three parts, all inside this one check: install exits 0; doctor reads the four SessionStart rows ✓; and commandInvokes(shellForm(w), w.spec) is true for each. Then rewrite the four SessionStart entries in shell form with args deleted: objective `<cmd> || true`, adoption `<cmd> 2> nana.log`, shared-memory `<cmd> $(true)`, and roster notice with its closing quote dropped. Doctor must read all four ✗. Install again: it must exit 0, keep each rewritten entry, and add each installer entry, found by JSON equality.
   - R-318. Use a fresh home whose settings hold only `echo <objective shellForm>` and `<adoption shellForm> || true`. Install must exit 0. Both look-alikes must stay JSON-equal. Find each installer entry by JSON equality, never by entryInvokes.
4. packages/nana-pack/tests/agent-dir-parity.test.mjs, in the --home hermeticity block after "--home install writes nothing into the ambient agent dir". Make a new home and a new pi folder; seed the pi folder with nana-knowledge/sources.json holding {"roots":[]}. Run install --home <home> --pi-home <pi folder> with the ambient value still set. R-827 passes on exit 0, <pi folder>/nana-pack.json present, <home>/.pi/agent/nana-pack.json absent and the ambient folder absent.
5. relative-agent-dir.test.mjs, after the last doctor check. Give the check its own realpathed temp home H, with cwd H/somewhere, and remove H in a finally.
   - Seed H/.pi/agent/nana-knowledge/sources.json with {"roots":[]}. Seed pi-subagents at PI_SUBAGENTS_FLOOR, imported from lib/doctor.mjs.
   - Run install --home H with PI_CODING_AGENT_DIR deleted from the env.
   - Run `doctor --claude-home H/.claude` under withPiStub, with HOME and USERPROFILE both set to H. Run it once with PI_CODING_AGENT_DIR = H/.pi/agent and once with path.relative(cwd, H/.pi/agent). Edit no PATH and register no package.
   - R-346 passes on these conditions. Install exits 0. The absolute run exits 0, says "all good" and has no ✗ or ! line. The relative run has the same non-empty set of ✓ labels, exactly one ! line containing cwd, and no "all good". Its status is neither 0 nor null.
6. REQUIREMENTS.md: set R-318, R-322, R-346, R-827, R-922 and R-924 to implemented, with one citation each. Set R-304 and R-382 to retired with `superseded by R-1870, <date>`. Set R-381 to retired with `superseded by R-1871, <date>`. Add R-1870 and R-1871 after R-382, with the texts in the must-meet. Leave R-391 untested.
7. Run `npm run req:tree` and `npm run map`. Add lib/doctor.mjs to the @inputs of relative-agent-dir.test.mjs.

## Wrong code to try (restore after each, then confirm `git diff main -- packages/nana-setup/lib packages/nana-setup/bin packages/nana-pack/lib` is empty)
- W1: delete tokenize's operator `return null`. R-922 and R-318 go red.
- W2: in hook-health's POSIX branch, replace hasHook with a script-name substring test. Only R-922 goes red.
- W4: move readClaudeSettings in install() to after stepSkills. R-924 goes red.
- W6: drop the `rm` line from the lock message. R-322 goes red.
- W7: in the occupied-path branch, return "would link" when dryRun is set. R-1871 goes red.
- W7d: before the PROBLEM return, copy the occupied folder to requirements.bak-<date>. Only R-1870 goes red.
- W8: in paths.mjs, check --home before --pi-home. R-827 goes red.
- W11: make doctor's exit ignore ! rows. Only R-346 goes red.

## Done
- Run each of the five files alone with `node scripts/test.mjs <file>`. Expected PASS counts: install 106, settings-merge 219, skills-and-standards 83, relative-agent-dir 30, agent-dir-parity 56.
- requirements-trace, `requirements-tree --check`, map:check and readme:check all pass.
- requirements-moved shows 11 rows: 6 flipped to implemented, 2 new and 3 retired.

## Report (at most 10 lines)
Give the tip and the PASS and FAIL counts for each file. Name each wrong version tried and the checks it turned red. Give the trace, tree, map and README results. Name anything that would not stay green.