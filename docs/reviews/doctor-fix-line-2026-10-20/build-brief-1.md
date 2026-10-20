# Build brief: doctor-fix-line, build 1
Feature: FEAT-015 · Diagnose the active environment
Class: install/hook/gate. Threat model: honest machine states are in scope. A forged plan, label or home is out.
Rows: R-1990 to R-1996 only, from block R-1990 to R-1999. Row text, design, line forms and red evidence are in must-meet.md here.
Base: main after win-hook-settings-repair lands.

## Change
1. REQUIREMENTS.md: add R-1990 to R-1996 at the end of FEAT-015's table, after R-1766, as untested. Flip each row to implemented when its check passes.
2. lib/doctor.mjs, diagnose only:
   - `add(status, label, detail, installLabel)` stores installLabel only when one is given.
   - Three rows pass it: rule nana-personal.md → "rule nana-personal.md (private)"; shared memory index → "shared memory MEMORY.md"; pi objective file → "pi nana-objective.md".
   - Change no other row's status, label or detail.
   - Header @outputs: a row may carry installLabel.
3. bin/nana-setup.mjs, runDoctor only:
   - When bad.length > 0, in one try: refuseCwdRelativePiHome(layout, "this install"), then install(layout, { dryRun: true }). Catch SetupError only and rethrow anything else.
   - A ✗ row is install's when a dry-run row with status created or updated has the label `row.installLabel ?? row.label`.
   - Print the four forms from must-meet.md exactly, each with today's ! suffix. Leave the all-good line, the !-only line and the exit code unchanged.
   - Header @effects and @outputs: name the dry run (it writes nothing and may start `pi --version`) and the four forms.
4. packages/nana-setup/README.md:
   - After the "Doctor's `pi executable` row" paragraph, add one paragraph. It says install's dry run decides which ✗ rows the last line gives to install, and lists the rest by hand. It says a row with no install step, such as PATH resolves pi-review, is listed by hand. It says the dry run writes nothing, and what the refusal form prints.
   - Add the new test file's row to the tests table, next to doctor-quiet.
5. New tests/doctor-fix-line.test.mjs with the six-tag header, holding M1 to M7:
   - Put each `// req:` directly above `check("<title>", …` on one line, with the exact titles from must-meet.md.
   - Run the CLI with spawnSync(process.execPath, …) inside withPiStub.
   - Env: HOME and USERPROFILE are the scratch home. Delete PI_CODING_AGENT_DIR, CLAUDE_CONFIG_DIR, NANA_SHARED_MEMORY_DIR, NANA_KNOWLEDGE_HOME and NANA_SETUP_PLATFORM. M4 instead sets NANA_SETUP_PLATFORM=win32 and passes no --home.
   - Fixtures: pi-subagents package.json at the imported PI_SUBAGENTS_FLOOR, and the knowledge sources.json `{"roots":[]}`. Each cwd is a fresh folder without .pi.
   - M1 and M6: one empty home that has pi-subagents. M6 walks the home before and after doctor (type, path, link target, file bytes) and compares the two walks.
   - M2: `install --home` with no pi-subagents. Expect exactly `1 missing — fix by hand as each ✗ line says: pi pi-subagents`.
   - M3: a folder with a SKILL.md at .claude/skills/spec before install, with pi-subagents present. After install, remove rules nana-soul.md and nana-standards.md. Expect exactly `3 missing — fix by hand as each ✗ line says: skill spec; then run: nana-setup install for the other 2`.
   - M4: first assert the home's .local/bin is not an entry of process.env.PATH (split on path.delimiter). Then assert PATH resolves pi-review is a ✗ row and among the by-hand labels.
   - M5: settings.json is `{"hooks": {},}`. Match `^\d+ missing — nana-setup install will not run until this is fixed: .*settings\.json is not valid JSON`.
   - M7: run doctor on the M2 home and on the M3 home, each from a cwd holding `.pi/nana-pack.json` `{}`. Expect both exact lines with ` (and see the 1 ! above)`.
   - The summary is the last non-empty stdout line. A ✗ label is the text after ✗ up to the first two-space gap. No skip on any leg.
6. Regenerate docs/code-map.md (npm run map) and docs/requirements-tree.md (npm run req:tree). Keep map:check, readme:check and the trace green.

## Wrong code first; each must turn its check red
- W1 (join by row.label) → M1; W2 (any dry-run status counts) → M3.
- W3 (PATH resolves pi-review gets installLabel "PATH pi-review") → M4; W4 (refusal prints today's line) → M5.
- W5 (install without dryRun) → M6; W6 (no ! suffix on either by-hand form) → M7.
- W6b (no suffix on the mixed form only) → M7; W7 (all-by-hand prints today's line) → M2.
- W8 (`for the other <by-hand count>`) → M3.
In a seat table, never spell a pi launch as a literal spawn("pi".

## Rules and Done
- Run single files only: doctor-fix-line, relative-agent-dir, doctor-quiet, doctor-detail, install, win32-degrade, stale-copies, skills-and-standards, retired-artifacts. Never edit HANDOFF.md or docs/sessions/. Add no inline tunable and no new module.
- Done when:
  - M1 to M7 pass on macOS.
  - W1 to W8 and W6b each ran red.
  - The eight existing files pass.
  - R-1990 to R-1996 are implemented with their titles as evidence.
  - map, README and trace checks are green.

## Report, at most 10 lines
VERDICT; commits; PASS/FAIL per check; wrong-code results; counts for the eight files; files touched; what was not done.