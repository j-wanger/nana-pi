# claude-config-dir — build brief 1

Feature: FEAT-013 · Install and connect harness runtimes
- Lane: claude-config-dir. Worktree ~/nana-pi-wt/claude-config-dir, branch feat/claude-config-dir from current main.
- Builder: a Claude Sonnet subagent following packages/nana-pack/prompts/builder-preamble.md. Never edit HANDOFF.md or docs/sessions/.
- Run single test files only (`node <path>`). Never run the full suite: other lanes hold the machine's suite lock, and the seat runs the locked suite. This overrides the preamble's full-suite step.
- Trace rule: each `// req: R-nnn` sits on the line directly above `check("title", …`, with the title's opening quote on the same line as `check(`. Never split them; a slate-22 build broke CI that way.

## Change (rows R-2390–R-2394 and R-2396–R-2398, text exactly as in must-meet.md; R-2395 is not used)
1. REQUIREMENTS.md:
   - Add R-2390–R-2394, R-2397 and R-2398 to the FEAT-013 SUB-011 table, after R-932.
   - Add R-2396 to the FEAT-031 table, after R-618.
   - Each row starts as untested and flips to implemented, with its evidence, when its check passes.
2. lib/paths.mjs:
   - Export `CLAUDE_CONFIG_ENV = "CLAUDE_CONFIG_DIR"`. Provenance: contract value, Claude Code's variable; the hook reads it (R-386).
   - In resolveLayout, read the variable only when neither opts.claudeHome nor opts.home is set. Empty means unset. Use `path.resolve(value)`.
   - Add `claudeHomeSource` and `claudeHomeCwdRelative` right after `claudeHome`, not beside claudeSettings (an in-flight lane adds copyRecord there). Update @inputs and @outputs.
3. bin/nana-setup.mjs:
   - Add `refuseCwdRelativeClaudeHome(layout, what)`. It throws a one-line SetupError naming CLAUDE_CONFIG_DIR, the resolved folder, the cwd and `--claude-home <absolute dir>`.
   - Call it in runInstall after refuseCwdRelativePiHome and before the banner.
   - Call it in runDoctor's prediction, right after refuseCwdRelativePiHome.
   - Banner: append `  (from CLAUDE_CONFIG_DIR)` for that source only.
   - USAGE: the --claude-home default reads "CLAUDE_CONFIG_DIR, else ~/.claude". Update the header's @inputs and @errors.
4. scripts/test.mjs: add CLAUDE_CONFIG_DIR to SCRUB, and update its comment and header.
5. Tests:
   - New file packages/nana-setup/tests/claude-config-dir.test.mjs, with the six-tag header and seven checks.
   - In packages/nana-pack/tests/test-runner.test.mjs, add `claude_dir: String(process.env.CLAUDE_CONFIG_DIR)` to the h-env fixture and `CLAUDE_CONFIG_DIR: "/ambient/claude"` to run A's env. Add one check.
6. Direct-run hermeticity: delete CLAUDE_CONFIG_DIR from the child env in three files:
   - relative-agent-dir.test.mjs (its shared env);
   - desk-service.test.mjs (the `install --desk` spawn with no --home);
   - win-shims.test.mjs (the R-1616 env).
7. packages/nana-setup/README.md:
   - Change the --claude-home usage line.
   - Add one paragraph after the relative PI_CODING_AGENT_DIR paragraph: an absolute value is honoured; a relative one makes install exit 2 and doctor names it; an empty one counts as unset; the flags win.
   - In the Tests paragraph, say that the runner scrubs the variable.
   - Then run `npm run map` and `npm run req:tree`.

## Test shape
- Setup: a fresh temp home per case (made-up name), seeded with .pi/agent/nana-knowledge/sources.json = {"roots":[]}. Use cwd <home>/work.
- Child env: process.env minus CLAUDE_CONFIG_DIR, PI_CODING_AGENT_DIR, NANA_SHARED_MEMORY_DIR and NANA_SETUP_PLATFORM. Add HOME, USERPROFILE and the case's variable, set by its literal name.
- install and doctor take `--pi-home <home>/.pi/agent`, which keeps isRealHome false. Run doctor inside withPiStub.
- R-2390: use the folder plus a trailing path.sep.
  - Check settings.json, rules/nana-soul.md, skills/requirements and nana-memory/shared/MEMORY.md under the folder.
  - Off win32, check that hooks/nana-shared-memory.mjs is a link.
  - Check that <home>/.claude is absent.
- R-2391: install with the variable unset.
  - Control: doctor without the variable prints `✓ rule nana-soul.md` and `✓ shared memory index`.
  - Then doctor with an empty folder prints `✗ rule nana-soul.md` and a `✗ shared memory index` row naming the folder.
  - Do not assert the exit code: the pi-subagents ✗ makes it 1 regardless.
- R-2392: run once with --claude-home <dir> and once with --home <home2>, each with the variable set. Files land where the flag says, and the variable's folder stays empty.
- R-2393: value "rel-claude". Expect exit 2 and stderr naming CLAUDE_CONFIG_DIR. Check there is no <home>/work/rel-claude, no <home>/.claude, and no nana-pack.json in the pi home.
- R-2394: put the folder in a sibling temp folder outside HOME. Its `claude home` line holds the folder verbatim and `(from CLAUDE_CONFIG_DIR)`.
- R-2397: value "". Expect exit 0, and <home>/.claude/settings.json exists.
- R-2398: value "rel-claude", running doctor. The summary holds `nana-setup install will not run until this is fixed:` and `CLAUDE_CONFIG_DIR`, and <home>/work stays empty.

## Wrong code to try (each must turn its row red)
- Variable ignored, as today: R-2390, R-2391 and R-2394 go red.
- Variable beats --claude-home, or is read under --home: R-2392 goes red.
- `!== undefined` read: R-2397 goes red.
- Relative value resolved silently: R-2393 goes red.
- Plain Error instead of SetupError: R-2393 goes red (exit 1).
- Banner without its source: R-2394 goes red.
- Doctor prediction without the Claude refusal: R-2398 goes red.
- SCRUB unchanged: R-2396 goes red.

## Done
- claude-config-dir.test.mjs passes 7/7, and test-runner.test.mjs is green.
- These files are still green: relative-agent-dir, desk-service, install, paths, shared-memory-hook, state-manifest, uninstall, settings-lock, doctor-fix-line, retired-artifacts, stale-copies, and nana-pack agent-dir-parity.
- `npm run map:check`, `npm run readme:check` and `node scripts/requirements-trace.mjs` show no problem line for this lane's rows.
- Sentinel check: with CLAUDE_CONFIG_DIR set to an empty scratch folder, run `node packages/nana-setup/tests/relative-agent-dir.test.mjs` and `node packages/nana-setup/tests/desk-service.test.mjs`. Both leave the folder empty.

## Report (≤ 10 lines)
VERDICT line; commits; per row the test title and its wrong-code result; the three test edits; the single-file commands and exit codes; anything not done.

## Seat amendments (re-check on main 9552afb1)

- Branch from main 9552afb1. objective-path-shapes and win-copy-backup-noise have landed, so their paths.mjs edits are already in your base: the objective-file import, copyRecord after claudeSettings, and copyRecord in @outputs. No merge with those lanes is needed.
- Put claudeHomeSource and claudeHomeCwdRelative right after claudeHome. Leave copyRecord where it is. It derives from claudeHome, so it follows the variable without any change.
- Resolve the variable without throwing. path.resolve throws ENOENT on a relative value when the cwd is gone, and paths.mjs promises in @errors that it never throws. On failure, return the value unresolved, as the private safeResolve in nana-pack/lib/agent-dir.mjs does. Take the cwd from the existing safeCwd().
- Keep the Claude-folder rule in one place; the cross-lane check assigned that to this lane. Add one small module under packages/nana-setup/lib with the six-tag header. It exports CLAUDE_CONFIG_ENV and one function. The function returns the variable's value as given when it is not empty, and <home>/.claude otherwise. It does not resolve the value.
- paths.mjs imports CLAUDE_CONFIG_ENV and the function from that module instead of defining its own copy. It reads the variable only when neither --claude-home nor --home is given, as planned.
- In packages/nana-setup/claude/hooks/nana-shared-memory.mjs, replace only the claudeHome expression on line 35 with a call to the new function, and add its import. The hook's behaviour and output must not change, a relative value included.
- Do not touch the hook's output block (lines 90–92). shared-memory-index-cap rewrites that block and adds its own import from lib/shared-memory-config.mjs.
- Because the hook changes, also keep these single files green: shared-memory-hook, shared-memory-input, hooks-closed-output and hooks-win32-exec (all under packages/nana-setup/tests).
- Also keep these single files green: copy-record, linked-claude-folder, objective-path-shapes and checkout-spelling. They landed after planning and read claudeHome or resolveLayout.
- In the bin/nana-setup.mjs header, edit only the @inputs and @errors lines. project-odd-seeds edits @outputs, @effects and runProject, and it lands before this lane.
- Do not add the Claude refusal to runProject. The project command reads no Claude path.
- Do not edit lib/settings.mjs. win-hook-variant-loop owns its `.claude` literals.
- R-2395 stays unused: no row, no check and no mention anywhere. Never reuse the number.
- Land order: this lane lands last of the setup lanes, after shared-memory-index-cap and project-odd-seeds.
- Merge main once both of those have landed, before the final review.
- Expect small conflicts in four places: the hook's import block, the CLI header, packages/nana-setup/README.md and REQUIREMENTS.md.
- After that merge, regenerate docs/code-map.md and docs/requirements-tree.md with `npm run map` and `npm run req:tree` rather than merging them by hand. Then re-run every single file in the Done list.

## Cross-lane fixes (the seat's check of all nine amendments)

- In nana-shared-memory.mjs, put the resolver import directly after the `node:path` import (line 11), above the project-key import. Leave the hook's header (lines 1-8) unchanged. shared-memory-index-cap adds its import below line 13 and rewrites @outputs, so the two merge clean.
- In the bin/nana-setup.mjs header, change only line 7 (add CLAUDE_CONFIG_DIR to the 'whatever resolveLayout reads' list) and line 20 (beside 'ambient PI_CODING_AGENT_DIR'), with no rewrap.
- Keep lines 8 and 19 byte-identical. project-odd-seeds edits the lines between them, and git conflicts on adjacent lines.
- Replace 'win-hook-variant-loop owns its .claude literals' with: no slate lane edits lib/settings.mjs. Its two .claude literals match entries older installers wrote, so they stay.
- In claude-config-dir.test.mjs, put `import { tmpDir } from "./tmp-dir.mjs";` on its own line, exactly as written. Never call mkdtempSync.
- Land after shared-memory-index-cap and project-odd-seeds only. If win-hook-variant-loop has landed by your final merge of main, also rerun win32-hook-repair and settings-merge as single files.

## Seat (2026-10-20 ~16:45 EDT, after the re-check)

- Builder: pi-worker --lane claude-config-dir --lane-size larger (the roster's larger-lane builder, pi gpt-5.6-sol). The owner kept pi sol for larger lanes after power mode; ignore any line above that calls the builder an open question or names a Claude builder.
- Reviews: Claude Opus 5.5 is the final reviewer and pi gpt-6-astra the land reviewer; the seat lands when every reviewer says LAND (the owner's standing rule since 2026-10-20).
- Run single test files only, never the full suite: eight other builders share this machine, and the seat runs the locked suite at land.
- Branch: from main 9552afb1. Land order across the slate (each later lane merges main before its final review): knowledge-sources-unparseable, lifecycle-compaction-reason, gate-stop-names-config, review-launch-win-paths, shared-memory-index-cap, project-odd-seeds, verifier-pipe-commit-match, win-hook-variant-loop, claude-config-dir.
- No push; no HANDOFF.md, docs/sessions/ or docs/reviews/ edits; commit with explicit paths.
