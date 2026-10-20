# Independent check — claude-config-dir at 58fe4374 (2026-10-20)

VERDICT: HOLDS
Lane claude-config-dir, tip 58fe4374. I worked in a private clone with a temp HOME for every run. The clone is removed and no process is left running.

Must-meet tests
1. `node tests/claude-config-dir.test.mjs`, which covers R-2390 to R-2394, R-2397 and R-2398.
   Result: 7 PASS, exit 0. HOLDS.
2. `node tests/test-runner.test.mjs` with the variable set to a scratch folder, for R-2396.
   Result: "PASS CLAUDE_CONFIG_DIR is scrubbed from the child env", 46 PASS, exit 0. HOLDS.
3. `node scripts/code-map.mjs --check` and `node scripts/readme-check.mjs`.
   Result: "0 problem(s)" from each. HOLDS.

Probes
P1. On macOS: `CLAUDE_CONFIG_DIR=<tmp>/home1/claude-alt/ nana-setup install`, with a trailing slash and no flags.
   Output: exit 0; `claude home   <tmp>/home1/claude-alt  (from CLAUDE_CONFIG_DIR)`.
   The folder holds `hooks nana-memory rules settings.json skills`, and the hooks are links into the checkout.
   The home holds `.local .pi claude-alt work`, with no `.claude`. Hook commands are `node '<tmp>/home1/claude-alt/hooks/…'`. HOLDS.
P2. I ran the installed shared-memory hook through its link, with the variable carrying a trailing slash.
   Output: `[nana:shared-memory] <tmp>/home1/claude-alt/nana-memory/shared/MEMORY.md — …`.
   The hook made the project link under `claude-alt/projects/<key>/memory/shared`. The new lib import resolves through the link. HOLDS.
P3. A second install with the same variable, then doctor with a pi stub on PATH.
   Install output: exit 0, no rows created.
   Doctor output: every hook, rule and settings row ✓. The only ✗ rows are `pi pi-subagents` and `PATH resolves pi-review`, which come from the stub environment. HOLDS.
P4. The variable points at a folder whose settings.json already has user keys and a Stop hook. I ran install, then `uninstall --yes`.
   After install: `model opus allow ["Bash(ls:*)"] Stop echo bye events Stop,SessionStart,PreToolUse,UserPromptSubmit`.
   After uninstall: `model opus allow ["Bash(ls:*)"] events Stop`. The user's keys are kept and nana's entries are removed. HOLDS.
P5. A relative value, `CLAUDE_CONFIG_DIR=.claude-work`, run from <home>.
   `install` exits 2: "CLAUDE_CONFIG_DIR is a relative path; here it resolves to <tmp>/home5/.claude-work … Pass --claude-home <absolute dir>".
   `install --dry-run` exits 2. `project <dir>` exits 0. The home holds only `proj work`. A literal `~/.claude-work` also exits 2. HOLDS.
P6. Forced win32 (`NANA_SETUP_PLATFORM=win32`) with an absolute value.
   Output: exit 0, `(from CLAUDE_CONFIG_DIR)`. The folder holds `nana-memory nana-setup-copies.json rules settings.json skills` and no hooks folder.
   Hooks are written as `node ["<tmp>/lane/packages/nana-setup/claude/hooks/nana-objective.mjs"]`. HOLDS.
   A `C:\Users\dev\claude` value exits 2 as relative, but only because darwin's node runs the path rules. Real win32 path rules treat it as absolute.
P7. With no variable, I ran a default install from the base commit and from the tip into two fresh homes.
   Output: "install output identical"; "home trees identical (43 entries)"; `claude home   ~/.claude`. Main use is unchanged. HOLDS.
P8. I ran four test files directly, without the runner, with the variable set to an empty scratch folder: relative-agent-dir, desk-service, win-shims and shared-memory-hook.
   Results: 31, 46, 2 and 43 PASS. Linked-claude-folder and settings-lock gave 5 and 6 PASS. The scratch folder still had 0 entries. HOLDS.
P9. The variable points at a linked folder.
   Output: exit 1 with `✗ skill requirements … unsafe source ancestor under <tmp>/home9/cc-link`.
   A default linked `~/.claude` and `--claude-home <link>` give the same rows, so this is the existing behaviour. HOLDS.
P10. I removed one rule link, then ran the session-start stale check with the variable set.
   Output: `[nana:install] INSTALL STALE: rule nana-soul.md — …`. Without the variable it prints nothing. HOLDS, but see HANDOFF below.
P11. `state --paths` with the variable outside the home.
   Output: exit 2, "durable store outside home: private rule (<tmp>/outside-cc/rules/nana-personal.md)". This matches the plan's stated limit. HOLDS.

Findings (no MUST)
F1. Known bug. A direct run of `packages/nana-setup/tests/stale-copies.test.mjs` with the variable set goes red on the tip.
   Tip: 7 PASS, 6 FAIL (R-1600, R-1760, R-1761). Base 9552afb1 under the same run: 13 PASS.
   Cause: the adoption hook's child now inherits the variable, and the stale check honours it. The plan scrubbed three test files and missed this one.
   Impact: the stale check only reads, so nothing was written; the scratch folder stayed empty. The runner scrubs the variable, so the suite stays green.
   The `install.test.mjs` red under the same direct run ("space in home: the shared-memory hook printed its index") already happens on base.
F2. Known bug. The seeded shared-memory index still says "Lives at ~/.claude/nana-memory/shared" when the variable moves it. The text is wrong, and nothing else breaks.
F3. Known bug. A user who installed before this lane and then sets the variable gets a new, empty shared-memory index in the new folder. Their old memories stay in `<home>/.claude/nana-memory/shared`, so nothing is lost. Install does not move them or say where they are.

HANDOFF on the tip
H1. Line 391 says the stale check "reads the default Claude folder", and that "a machine installed into another Claude folder gets no line". The lane makes this untrue for a folder set by CLAUDE_CONFIG_DIR, as P10 shows.
   The seat should narrow it to a `--claude-home` install made without the variable.
H2. HANDOFF on the tip has no entry for this lane yet. The seat should add the plan's known limits as residuals, together with F1 to F3:
   - Claude Code's own settings env block is not read.
   - The login file still points at <home>.
   - uninstall and state do not refuse a relative value.
   - doctor shows no ! row for a relative value.
   - The gate pattern still matches only a folder named `.claude`.
   - The extractor's default root is `.claude`.
   No other HANDOFF line is made untrue. I checked lines 385, 592, 648 and 876 to 885.
