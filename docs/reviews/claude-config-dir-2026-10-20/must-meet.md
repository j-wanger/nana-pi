# claude-config-dir — must-meet

Feature: FEAT-013 · Install and connect harness runtimes (SUB-011 · Select the active runtime and home). R-2396 sits in FEAT-031 after R-618. R-2395 is not used.
Class: install, hook or gate. The lane changes how nana-setup install and doctor resolve the Claude folder, plus the suite runner's env scrub. It gets the full ladder, seat wrong-code pairs, one independent check, and the local macOS install check before nana-land.
Threat model: honest variation is in scope. That means CLAUDE_CONFIG_DIR unset, empty, absolute, absolute with a trailing separator, relative, or a drive path on win32. A forged environment is out of scope.

Falsifiable sentence: with an absolute CLAUDE_CONFIG_DIR and neither --home nor --claude-home, `nana-setup install` writes the Claude Code files into that folder and creates nothing at <home>/.claude, and `nana-setup doctor` checks that folder.

## Design
- packages/nana-setup/lib/paths.mjs exports `CLAUDE_CONFIG_ENV = "CLAUDE_CONFIG_DIR"`. Provenance: contract value, Claude Code's config-folder variable, which the shared-memory hook reads (R-386).
- resolveLayout reads the variable only when neither --claude-home nor --home is given.
  - An empty value counts as unset, matching the hook's `||`.
  - The folder is `path.resolve(value)`.
- New layout fields, placed right after claudeHome, mirror the pi pair:
  - `claudeHomeSource`: "--claude-home" | "--home" | "CLAUDE_CONFIG_DIR" | "default".
  - `claudeHomeCwdRelative`: the cwd when the ambient value is relative, else null.
- bin/nana-setup.mjs gets `refuseCwdRelativeClaudeHome(layout, what)`. It throws a one-line SetupError (exit 2) that names CLAUDE_CONFIG_DIR, the resolved folder, the cwd and `--claude-home <absolute dir>`.
  - runInstall calls it after refuseCwdRelativePiHome and before the banner.
  - Doctor's install prediction calls it beside refuseCwdRelativePiHome, so R-1994's summary names it.
- The banner's claude home line appends `  (from CLAUDE_CONFIG_DIR)` for that source only. Every other banner stays byte-identical.
- In USAGE and the README, the --claude-home default reads "CLAUDE_CONFIG_DIR, else ~/.claude".
- No other consumer is edited. Steps, doctor, hook-health, uninstall, state-manifest, the settings lock, bin/stale-copies.mjs and the in-flight copyRecord all derive from layout.claudeHome. install-check already strips the variable (OVERRIDE_ENV). lib/project.mjs reads no Claude path. The hook is not edited.
- scripts/test.mjs SCRUB adds CLAUDE_CONFIG_DIR. Claude Code passes the variable to its hook and tool children. A seat that sets it would otherwise run suite installs into the real Claude folder.
- A direct `node <file>` run bypasses the runner. Three test files therefore delete CLAUDE_CONFIG_DIR from their child env:
  - relative-agent-dir;
  - desk-service, for its `install --desk` spawn with no --home;
  - win-shims, for the R-1616 env.
  Probe: I ran relative-agent-dir directly against the prototype with the variable set to a scratch folder. It wrote hooks, rules, settings.json, skills and nana-memory into that folder.

## Must-meet (file packages/nana-setup/tests/claude-config-dir.test.mjs unless named)
| Row | Requirement | Test title | Red today |
|---|---|---|---|
| R-2390 | WHERE CLAUDE_CONFIG_DIR is an absolute path and neither --home nor --claude-home is given, install shall put settings.json, rules, skills, the shared-memory index and, off win32, its hook links under that folder and create no <home>/.claude. | install with an absolute CLAUDE_CONFIG_DIR writes the Claude files there and nothing under ~/.claude | yes (probe: folder empty; all five pieces under <home>/.claude) |
| R-2391 | WHERE CLAUDE_CONFIG_DIR is an absolute path and neither --home nor --claude-home is given, doctor shall read its rule and shared-memory index rows from that folder, so an empty folder reads ✗ there even when <home>/.claude is fully installed. | doctor checks the CLAUDE_CONFIG_DIR folder, not a fully installed ~/.claude | yes (probe: ✓ rule nana-soul.md, ✓ shared memory index naming <home>/.claude) |
| R-2392 | WHEN --claude-home or --home is given, install shall place the Claude Code files where that flag says and write nothing into the CLAUDE_CONFIG_DIR folder. | --claude-home and --home win over CLAUDE_CONFIG_DIR | no: a guard (probe: green, the variable is ignored today) |
| R-2393 | IF CLAUDE_CONFIG_DIR is a relative path and neither --home nor --claude-home is given, THEN install shall exit 2 with a message naming CLAUDE_CONFIG_DIR and write nothing. | a relative CLAUDE_CONFIG_DIR: install exits 2 naming the variable and writes nothing | yes (probe: exit 0, wrote <home>/.claude) |
| R-2394 | WHERE CLAUDE_CONFIG_DIR sets the Claude Code folder, the install banner's claude home line shall name that folder and CLAUDE_CONFIG_DIR as its source. | the install banner names the CLAUDE_CONFIG_DIR folder and its source | yes (probe: `claude home   ~/.claude`) |
| R-2396 | The runner shall scrub CLAUDE_CONFIG_DIR from each child's env. | packages/nana-pack/tests/test-runner.test.mjs::CLAUDE_CONFIG_DIR is scrubbed from the child env | yes by reading: SCRUB names NANA_* and PI_CODING_AGENT_DIR only (not run: heavy file) |
| R-2397 | WHEN CLAUDE_CONFIG_DIR is set but empty, install shall use <home>/.claude, as the shared-memory hook does. | an empty CLAUDE_CONFIG_DIR falls back to ~/.claude | no: a guard against a `!== undefined` read |
| R-2398 | IF CLAUDE_CONFIG_DIR is a relative path, neither --home nor --claude-home is given and doctor finds a ✗ row, THEN doctor's summary shall say that install will not run and name CLAUDE_CONFIG_DIR. | a relative CLAUDE_CONFIG_DIR: doctor's summary names it as install's refusal | yes (probe: `34 missing — fix by hand …; then run: nana-setup install for the other 33`) |

Every check runs on all three platforms with no skip. R-2390's hook-link clause is a win32 branch, because win32 makes no hook links. It is not a skip.

## Red-today evidence
- Main 72abe19a was cloned to a temp folder, with a temp HOME for every run.
- Seven behaviours were probed on today's code: R-2390, R-2391, R-2392, R-2393, R-2394, R-2397 and R-2398. Five were red; R-2392 and R-2397 were green, as guards.
- With a 15-line prototype, all seven matched their rows.
- With the prototype, paths.test passed and relative-agent-dir passed 31/31.

## Known limits
- nana-setup reads its own shell's environment. It cannot see a CLAUDE_CONFIG_DIR set only in a Claude Code settings `env` block, or only in the environment a desktop-launched Claude Code started with. --claude-home stays the override.
- `state --paths` refuses a Claude folder outside the home ("durable store outside home"), as --claude-home does today.
- The state manifest still lists the Claude login file at <home>/.claude.json. Claude Code keeps that file in CLAUDE_CONFIG_DIR when the variable is set; this is inferred from its bundle.
- uninstall and state do not refuse a relative value.
- Doctor gets no ! row for a relative value; R-2398 covers its summary only.
- The pi gate's protected Claude settings and hooks pattern, and the writing-trial extractor's default root, still match only a folder named .claude.