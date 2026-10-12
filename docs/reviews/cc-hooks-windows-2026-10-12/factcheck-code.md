Corrections and missing items for the cc-hooks-windows draft. I checked every claim in the draft against the repo, the shared memory notes, the Claude Code docs and the Claude Code CHANGELOG. The checks started at c505601; main moved to c22bab5 partway through.

**A. Base and dependency (out of date)**
1. Dependency → the draft says `feat/pi-cmd-launch` is not on main. It landed while I was checking: main and origin/main are now c22bab5, 21 commits past c505601. The lane should start from c22bab5. These line references moved:
   - steps.mjs: :101→:102, :504-508→:505-509, :515→:516, :523→:524, :686→:687
   - doctor.mjs: :295→:296, :320→:335, :364-368→:379-383, :364-377→:379-392
   - HANDOFF.md: :52→:57 (queue); Jake's rulings are at :18
   - The golden file in case (d) should be captured from c22bab5, not c505601.
2. The dependency list was incomplete even before the land.
   - pi-cmd-launch also edited REQUIREMENTS.md (R-1033–R-1039, R-952 reworded, R-1037), docs/requirements-tree.md, requirements-tree.test.mjs (leaf total 1,026→1,033), HANDOFF.md, docs/code-map.md and the pack README.
   - `feat/product-report` (4b3846e, not on main) is not named. It edits REQUIREMENTS.md (R-1012–R-1030, R-1040–R-1043, and reserves R-1043–R-1049), docs/requirements-tree.md, requirements-tree.test.mjs, scripts/requirements-tree.mjs, the code map and HANDOFF. HANDOFF.md:56 says it lands first.
   - The draft's R-1050–R-1058 collide with neither lane.

**B. Claims that are wrong or need qualifying**
3. "cmd.exe is never the hook shell" and "the prefix matters for PowerShell, not cmd.exe" → both are wrong as stated.
   - CHANGELOG 2.1.47: "Fixed hooks (PreToolUse, PostToolUse) silently failing to execute on Windows by using Git Bash instead of cmd.exe". So cmd.exe was the hook shell before 2.1.47.
   - cmd.exe cannot run a `VAR=value cmd` prefix either. The title at win32-degrade.test.mjs:85 is incomplete, not wrong.
   - The real reason to test cmd.exe and to refuse `%` is support for Claude Code older than 2.1.47. The plan should say so.
4. The quote "A hook that matches only `Bash` never fires there" is misapplied. In hooks.md, "there" refers to the bullet just before it: "On Windows without Git Bash … doesn't register the Bash tool at all". For Jake's machine, which has Git Bash, the sentence that applies is the first bullet: "wherever the PowerShell tool is enabled, Claude treats PowerShell as the primary shell and routes shell commands through it."
5. "On by default for claude.ai accounts … rarely fires on Jake's machine" → this is INFERRED, not established.
   - The docs say "on by default for claude.ai and Console accounts". Bedrock, Agent Platform and Foundry users must set `CLAUDE_CODE_USE_POWERSHELL_TOOL=1`.
   - CHANGELOG 2.1.143 says the opposite: "now enabled by default on Windows for Bedrock, Vertex, and Foundry users". 2.1.126 made PowerShell the primary shell when the tool is enabled.
   - Nobody has recorded the account type or Claude Code version on Jake's corporate machine.
   - The draft marks only `reference_claude_code_hooks_windows.md:9` as out of date. Two more places say the Bash tool fires on his machine and also need correcting: HANDOFF.md:57 ("so the Bash tool fires there") and `user_jake_windows_both_seats.md:10` ("a PreToolUse `Bash` matcher fires").
   - Matching `Bash|PowerShell` is still the right change.
6. Exec form → the draft says "the research did not find which Claude Code version first accepts `args`". CHANGELOG 2.1.139 says: "Added hook `args: string[]` field (exec form)".
   - The hooks.md exec-form note also endorses `"command": "node", "args": [...]` on Windows: "The `node` plus script-path pattern works on every platform because `node.exe` is a real binary."
   - Exec form would remove the refused characters, the Git Bash profile-output residual (there is no shell) and the open PowerShell-stdin question.
   - The rejection now rests only on two costs: the entry shape that `hasHook`, `removeInstallerHooks` and doctor read, and not knowing whether Jake runs 2.1.139 or later. The plan should say that.
7. "The docs ask for double quotes in shell form (hooks#reference-scripts-by-path)" → the actual sentence is "In shell form, wrap each placeholder in double quotes". It is about placeholders, which must expand. This lane has no placeholder.
   - Single quotes keep `$`, the backtick and `%` literal in both Git Bash and PowerShell. Today's win32 knowledge entry is already single-quoted.
   - Double quotes are only needed for cmd.exe (Claude Code before 2.1.47).
   - The R-1052 refusal is a regression: a checkout path with `$` or `%` gets the knowledge hook wired today, but after the change install exits non-zero and writes nothing. Name that as a trade.
8. The refused-character set looks incomplete (INFERRED, not checked this session).
   - PowerShell treats U+201C, U+201D and U+201E as double quotes. These are legal in Windows paths.
   - cmd.exe expands `!` when DelayedExpansion is on in the registry. R-1035 already refuses `!` for cmd.exe.
   - Either add these to the set or declare them as limits.
9. "CLAUDE.md:5 states the same claim in other words" → wrong. `CLAUDE.md` is a symlink to `AGENTS.md`. There are three Support lines plus the test's canonical line, not a fifth copy.
10. "POSIX branch … (`:117-176`)" → wrong lines. `desiredHooks` is settings.mjs:122-178; lines 117-120 belong to `commandInvokes`.
11. "R-387's 'no bash hooks in settings' check stays under R-909" → it is not under R-909 today.
    - win32-degrade.test.mjs:86-87 carries `// req: R-387`.
    - R-909's evidence at REQUIREMENTS.md:974 does not cite it.
    - Moving it is a change to R-909's evidence, and a weak fit: R-909 is about reporting retired nana bash scripts.
12. "Checked: `config.ts` … import no npm package" → wrong.
    - packages/nana-pack/lib/config.ts:369 runs `import("@earendil-works/pi-coding-agent")` when the module loads. nana-objective.mjs:36 imports config.ts.
    - The import is dynamic and caught, so nothing crashes. In a detached worktree under a temp folder it cannot resolve, so the trust check fails closed.
    - The rest of the import closure (28 files from the five entries, both producers and nana-knowledge.ts) has no other npm import.
13. The Windows-leg shared-memory expectation "stdout contains the seeded index's first line" will fail.
    - The hook prints only its `[nana:shared-memory]` header, an optional note, and lines matching `^- \[` (nana-shared-memory.mjs:87-89).
    - MEMORY.seed.md starts with `# Shared memory …` and has no `- [` lines.
14. "Point … `CLAUDE_CONFIG_DIR` at the temp home" → that is the wrong folder.
    - The hook reads `<CLAUDE_CONFIG_DIR>/nana-memory/shared/MEMORY.md` (:32-34).
    - `install --home` writes under `<home>/.claude`; paths.mjs:40 ignores `CLAUDE_CONFIG_DIR`.
    - Set it to `<temp home>/.claude`, or leave it unset.
15. The Windows-leg doctor "exit 0" will fail. Doctor fails `pi pi-subagents` whenever `<piHome>/npm/node_modules/pi-subagents/package.json` is missing, even under `--home` (doctor.mjs:514 at c22bab5). Seed that file as win32-degrade.test.mjs:37-41 does, or assert only the six named rows.
16. "Skipped and counted on the other legs" → the runner fails an exit-0 file that printed no PASS line unless that file has a declared skip (scripts/test.mjs:155 and :372). test-runner.test.mjs:222 pins this. The plan needs a skip entry in scripts/test.mjs, and that file is not in scope.
17. "Pushing the branch needs Jake's approval" → a push runs nothing. ci.yml:2-5 triggers only on a push to main or a pull request. Getting a Windows CI run needs a pull request, which is an open ask for Jake in HANDOFF ("Draft pull requests as a CI trigger").
18. Case (d), a byte-equal golden "from main" → it cannot be byte-equal. settings.json embeds the checkout path (settings.mjs:131, :172) and the hooks dir. The main checkout and the worktree have different paths. Generate the golden with the same injected root and home, or normalize the paths.
19. Case (a), "`~/.claude/hooks` is empty" → a forced-win32 install never creates that folder; win32-degrade.test.mjs:68 asserts it is absent. Say "absent or empty".
20. Mutation 3 is marked INFERRED, but it is documented bash behavior: inside double quotes, a backslash is special only before `$`, the backtick, `"`, `\` and newline. Note that `\\` collapses to `\`, so a UNC checkout would break under Git Bash without the slash conversion.

**C. Rows the delta is missing**
21. R-319 (SUB-013, REQUIREMENTS.md:716): "Paths the installer writes into commands shall be single-quoted …". R-1050 contradicts it on win32. It needs a "WHERE not win32" reword. The settings.mjs:26 design comment says the same thing and also changes.
22. R-394 (FEAT-018, :982): "Install shall replace its own recognized stale knowledge-hook entry without appending a duplicate." Bug 4 is R-394 failing on win32, and R-1056 extends R-394, not R-653.
23. R-984 (FEAT-010, :577): "The installed Claude Code Bash PreToolUse hook shall emit `ask` …". The "Bash" wording needs rewording, and it overlaps R-1054. FEAT-010 and SUB-013 are missing from the features header.
24. R-653 says "its generated command shape" (singular). R-1056 adds two more installer shapes and is not limited to one platform. On POSIX, a stale `node '<path>' hook` entry that carries the installer's status message would then be rewritten; R-653 preserves it today. Either limit those forms to win32 or reword R-653. "R-653 keeps its text" does not hold.
25. R-985 has a third win32 test, not two. verifier-pipe.test.mjs:128-129 (`req: R-985`) checks that the pack README says "Claude Code … not wired on native Windows". It needs rewriting.
26. Optional: cite R-923 ("A hand-written variant … kept as-is"), since R-1056's "installer-shaped" definition decides what counts as hand-written. Also reword SUB-015's purpose ("Skip unsupported Windows integrations …"), which no longer fits R-1050–R-1053 and R-1058.

**D. Files the scope is missing**
27. packages/nana-pack/README.md:40 ("The Claude Code Bash hook is not wired on native Windows by nana-setup."), together with verifier-pipe.test.mjs:129.
28. Setup README lines beyond :370:
    - :40: the knowledge form "exactly the installer form `NODE_NO_WARNINGS=1 node '…' hook`", and "On native Windows, setup wires no Claude Code hook except the knowledge pull".
    - :55: "nana-setup does not wire this Claude Code hook on native Windows".
    - :372: "wires no Claude Code hook except the knowledge pull".
    - verifier-pipe.test.mjs:133 pins the :40 migration sentence.
    - Pitfall: templates-render.test.mjs:277-278 scans all three front doors for "everything/all … works/supported/parity … PowerShell/cmd/Windows". README wording like "all five hooks … PowerShell" would break R-684.
29. docs/requirements-tree.md (regenerate it) and requirements-tree.test.mjs:38 and :52 (the leaf total, now 1,033; it changes with 9 new rows).
30. scripts/test.mjs skip entry (see item 16).
31. Existing assertions that break on the Windows leg once the five entries use forward slashes: settings-merge.test.mjs:244 (`endsWith("/verifier-pipe.mjs'")`), settings-merge.test.mjs:315 (`includes(path.join(repo,…))`), and retired-artifacts.test.mjs:167.
32. Module headers:
    - claude/hooks/verifier-pipe.mjs: its purpose line says "one Claude Code Bash PreToolUse event", but the draft lists the hook scripts as unchanged.
    - settings.mjs: its outputs list names the renamed `knowledgeHookHealthy` and `mergeKnowledgeHook`, and its inputs list `{ hooksDir, repoRoot }` without the platform.
33. Windows-leg gap: no case seeds the real entry today's code writes on Windows, `node 'C:\…\checkout/packages/nana-knowledge/bin/nana-knowledge.ts' hook` (backslash root, forward-slash suffix).
    - On macOS, forced win32 cannot use it, because POSIX `path.isAbsolute` rejects `C:\`. So bug 4's fix is pinned only with POSIX paths.
    - Low risk: the unquoted form from 54b5088 (fixed the same day in b39518f) is not in R-1056's list. Declare it.
34. The test's `git worktree add` registers under `.git/worktrees`. Cleanup needs `git worktree remove --force`.
35. An undeclared POSIX residual: the PowerShell tool is opt-in on Linux, macOS and WSL. With POSIX keeping the `Bash` matcher, a session with that tool turned on gets no verifier guard.
36. Optional: the `_shared` matrix's "Bash PreToolUse Node hook" text (pinned by verifier-pipe.test.mjs:123) becomes incomplete on win32. Changing it means a template release.
37. Jake's machine check should record `claude --version` and the account type. They decide the hook shell (2.1.47 or later), whether exec form is usable (2.1.139 or later), and whether PowerShell is the default.

**Confirmed as written:** the memory note lines :8 and :10; the hook import lines (objective and adoption 11-12, shared memory 12-13, verifier pipe 11); settings.mjs:93, :96, :159, :276, :291; verifier-hook.mjs:14; pipe-guard.mjs:85 and :93; hook-producer.mjs:32-33; hook.ts:51-69; ci.yml:21; triage :24-28 and :70; the bug 4 path (traced: install reports "already wired", doctor shows ✗); the win32-degrade.test.mjs:85 title text; uninstall refusing on win32; R-301, R-344, R-349, R-387, R-393, R-653, R-684, R-909, R-936, R-937 and R-985 texts and where they sit in the tree; the c053b02 Node port; the docs quotes on exec and shell form, profile output and forward slashes.

**Read-only breach:** I wrote three docs pages and one import-scan script to the session scratchpad (/private/tmp/claude-501/-Users-jwang-nana-pi/dea1c010-278e-4392-a90f-df947a3a8b71/scratchpad). No repo file was touched.