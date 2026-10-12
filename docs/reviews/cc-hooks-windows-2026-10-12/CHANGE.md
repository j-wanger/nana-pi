# Change declaration: the Claude Code seat's hooks run on Windows

*Lane `cc-hooks-windows` · branch `feat/cc-hooks-windows` · worktree `~/nana-pi-wt/cc-hooks-windows`, based on `main` at `c22bab5` · 2026-10-12. Builder: Claude Sonnet 5.5 (Jake's measurement lane).*

*Features and rows:*
- *FEAT-010 "Guard risky commands and protected resources": R-984.*
- *SUB-012 "Deliver commands, hooks and workflow resources": R-985, R-301; new R-1054.*
- *SUB-013 "Connect hooks and packages without duplication": R-319, R-923.*
- *SUB-015 "Apply the platform's supported installation": R-387, R-936 and the feature's purpose line; new R-1050 to R-1053 and R-1058.*
- *FEAT-015 "Diagnose the active environment": R-937; new R-1055 and R-1057.*
- *FEAT-018 "Update or remove managed components safely": R-394, R-653; new R-1056.*
- *FEAT-019 "Release usable templates and report support": R-684.*

*Order: why → plan → sol plan review (two rounds at most) → seat acceptance script, red → build → CI run with the Windows leg (a draft pull request; Jake, 2026-10-11: pushing a non-main branch and opening a draft PR for CI need no approval) → seat verification → sol build review → astra land review → Jake's machine check → Jake accepts.*

*Dependencies:*
- *`feat/pi-cmd-launch` has landed. Main is now `c22bab5`, 21 commits past `c505601`, and this lane starts there. Every line reference below is at `c22bab5`.*
- *`feat/product-report` (`4b3846e`) is not on main, and it lands first (`HANDOFF.md:56`). It edits:*
  - *`REQUIREMENTS.md` (R-1012 to R-1030 and R-1040 to R-1043; its build brief reserves R-1043 to R-1049);*
  - *`docs/requirements-tree.md`, `requirements-tree.test.mjs` and `scripts/requirements-tree.mjs`;*
  - *the code map and HANDOFF.*
- *R-1050 onward collides with neither lane. Merge main after product-report lands and before the final round.*

## 1. Why

Jake uses both seats every day on his x64 Windows machine, which has Git Bash (`~/.claude/nana-memory/shared/user_jake_windows_both_seats.md:8,10`). On that machine the Claude Code seat gets only the knowledge pull:
- install skips the four hook files (`packages/nana-setup/lib/steps.mjs:102`);
- install filters their settings entries out (`:505-509`);
- doctor marks them skipped (`lib/doctor.mjs:335`, `:379-383`).

HANDOFF ranks this second in the Windows queue (`HANDOFF.md:57`). The triage calls it lane 2 (`docs/reviews/windows-ci-2026-10-11/windows-triage.md:24-28`). Four findings shape the fix.

1. **Copies cannot work.** Each hook imports `../../lib/…` relative to its own file:
   - `claude/hooks/nana-objective.mjs:11-12`
   - `nana-adoption.mjs:11-12`
   - `nana-shared-memory.mjs:12-13`
   - `verifier-pipe.mjs:11`

   So the settings entries must name the checkout's own scripts.
2. **The hook shell is now documented.** Shell form runs "`sh -c` on macOS and Linux, Git Bash on Windows, or PowerShell when Git Bash isn't installed" (https://code.claude.com/docs/en/hooks#exec-form-and-shell-form, read 2026-10-12).
   - The `shell` field "Accepts `"bash"` or `"powershell"`. Defaults to `"bash"`, or to `"powershell"` on Windows when Git Bash isn't installed" (hooks#command-hook-fields).
   - So current Claude Code does not use cmd.exe as the hook shell. Earlier versions did. The 2.1.47 changelog entry says: "Fixed hooks (PreToolUse, PostToolUse) silently failing to execute on Windows by using Git Bash instead of cmd.exe".
   - The plan tests cmd.exe and refuses `%` for one reason only: to support Claude Code older than 2.1.47.
   - The shared memory note that calls the default hook shell undocumented is out of date (`reference_claude_code_hooks_windows.md:9`).
   - The title at `tests/win32-degrade.test.mjs:85` ("cmd.exe cannot run it") is incomplete, not wrong. cmd.exe cannot run a `VAR=value` prefix. PowerShell, the current fallback hook shell, cannot run one either (INFERRED).
3. **A `Bash`-only matcher may miss most shell commands on Jake's machine (INFERRED).**
   - With Git Bash installed, the PowerShell tool "is on by default for claude.ai and Console accounts" (https://code.claude.com/docs/en/tools-reference#powershell-tool).
   - "When the tool is enabled, Claude treats PowerShell as the primary shell. The Bash tool remains available for POSIX scripts when Git Bash is installed" (same page).
   - The sentence in hooks#powershell that applies to Jake's machine is: "wherever the PowerShell tool is enabled, Claude treats PowerShell as the primary shell and routes shell commands through it."
   - The same section also says "A hook that matches only `Bash` never fires there". That sentence is about Windows *without* Git Bash, so it does not describe Jake's machine.
   - Nobody has recorded whether the tool is on for Jake. That depends on his account type, his Claude Code version and his settings:
     - The docs say Bedrock, Agent Platform and Foundry users must set `CLAUDE_CODE_USE_POWERSHELL_TOOL=1`.
     - The 2.1.143 changelog entry says the opposite: "now enabled by default on Windows for Bedrock, Vertex, and Foundry users".
     - Version 2.1.126 made PowerShell the primary shell whenever the tool is enabled.
     - Any Bash deny rule, or `CLAUDE_CODE_USE_POWERSHELL_TOOL=0`, turns the tool off (tools-reference#bash-deny-rules-also-turn-off-the-powershell-tool).
   - The verifier's matcher is `Bash` (`lib/settings.mjs:159`), and `decideHook` abstains for any other tool (`lib/verifier-hook.mjs:14`). Matching `Bash|PowerShell` is right whichever way the tool is set.
   - Two places say a `Bash` matcher fires on his machine. Both get corrected: `HANDOFF.md:57` and `user_jake_windows_both_seats.md:10`.
4. **Bug 4: the knowledge hook's stale-path repair is dead on win32.** This is R-394 failing on win32.
   - `installerKnowledgeTarget` requires four words beginning `NODE_NO_WARNINGS=1`, plus the exact prefixed string (`lib/settings.mjs:93`, `:96`).
   - win32 strips that prefix (`steps.mjs:509`).
   - After a re-clone, install says "already wired" while doctor shows ✗. The code path is traced. The effect on Jake's machine is INFERRED (`windows-triage.md:70`).

**Observable outcomes.**
1. On win32, install writes all five hook entries into `settings.json`:
   - objective, adoption and shared memory (SessionStart);
   - verifier pipe (PreToolUse);
   - knowledge pull (UserPromptSubmit).

   Each entry runs the checkout's own script as `node "<absolute path, forward slashes>"`, and the knowledge entry adds ` hook`. The command has no single quote and no `VAR=value` prefix. The same string runs under Git Bash and PowerShell, from a checkout and a home whose paths contain spaces. It also runs under cmd.exe, which only Claude Code before 2.1.47 uses.
2. On win32 the verifier entry's matcher is `Bash|PowerShell`.
   - The docs evaluate this matcher as a list of exact names, not as a regular expression (hooks#matcher-patterns).
   - The hook judges a PowerShell command with the pipe guard's existing PowerShell dialect (`packages/nana-pack/lib/pipe-guard.mjs:85`, `:93`).
3. On win32, install refuses a checkout path that contains `$`, a backtick or `%`:
   - every hook settings row is a PROBLEM that names the character;
   - install exits non-zero;
   - no hook entry is written.

   This is a regression. Today such a path still gets the knowledge entry on win32. Section 3 sets out the trade.
4. After the checkout moves, install rewrites each installer-shaped, repo-anchored entry whose script no longer resolves inside the checkout.
   - That is the knowledge entry on every platform, and all five entries on win32. This fixes bug 4, which is R-394 on win32.
   - Install recognizes the two win32 forms only on win32, so the preserve rule on POSIX keeps its current effect.
   - Install keeps entries in any other shape byte for byte (R-653, R-923).
5. On win32, doctor reports each of the five settings rows ✓ only when two things hold: the entry sits under the expected event and matcher, and its script resolves inside the checkout.
   - Doctor also runs the Node 22.18 floor check, which it skips today (`doctor.mjs:296`). It checks the `node` on doctor's own PATH, which may differ from the hook shell's (see the limits in section 3).
   - The hook-file rows keep "skipped (win32)", because install writes nothing to `~/.claude/hooks`.
6. On macOS and Linux, a fresh install writes the same `settings.json` as `main` at `c22bab5`, once the checkout path and home are normalized.
7. The Support lines say that the Claude Code hooks run on Windows.

**Threat model.** This follows Jake's 2026-10-11 rule (`HANDOFF.md:18`). Honest variation in a Windows machine is in scope:
- paths with spaces and shell-special characters;
- Git Bash or PowerShell as the hook shell, and Git Bash present or absent;
- PowerShell 7 or Windows PowerShell 5.1;
- PATHEXT, and wherever `node` comes from;
- Claude Code's version and account type, which decide the hook shell and whether the PowerShell tool is on.

A hostile local user is out of scope. Anyone who can edit `settings.json` or the checkout can already run code as Jake.

**Lane class.** Gate-adjacent. The verifier pipe is a PreToolUse guard, and every Claude Code session on the machine shares `settings.json`. Two plan-review rounds at most.

## 2. Requirement delta

| ID | Change | Text (draft) |
|---|---|---|
| R-1050 | added (SUB-015) | WHERE the platform is win32, the installer shall write each hook command it owns as `node`, then the script's absolute path with every backslash turned into a forward slash inside double quotes, then ` hook` for the knowledge pull only. |
| R-1051 | added (SUB-015) | WHERE the platform is win32, the installer shall wire the objective, adoption, shared-memory and verifier-pipe settings entries to the checkout's own `packages/nana-setup/claude/hooks/<hook>.mjs`. |
| R-1052 | added (SUB-015); a regression for `$` and `%` paths (section 3, quoting trade) | IF the platform is win32 and the checkout path contains `$`, a backtick or `%`, THEN the installer shall report every hook settings row as a problem naming the character and write no hook entry. |
| R-1053 | added (SUB-015) | WHERE the platform is win32, the installer shall place the verifier-pipe entry in a PreToolUse group whose matcher is `Bash\|PowerShell`. |
| R-1054 | added (SUB-012, beside R-985); overlaps R-984 | WHEN the verifier hook receives a PreToolUse event whose tool is `PowerShell`, it shall judge the command with the pipe guard's PowerShell dialect. |
| R-1055 | added (FEAT-015, beside R-393) | WHERE the platform is win32, doctor shall report each of the five hook settings rows as ✓ only when an entry invoking its script sits under the expected event and matcher and every such entry's script resolves inside the checkout. |
| R-1056 | added (FEAT-018, beside R-394, which it extends) | WHEN install finds an installer-shaped, repo-anchored hook entry whose script is missing or resolves outside the checkout, it shall replace that entry's command in place with the current form. Repo-anchored means the knowledge pull on every platform, and all five entries on win32. Installer-shaped means timeout 5, the installer's status message, and a command that matches one of these forms apart from the path: the POSIX knowledge form on every platform; on win32 only, the earlier win32 form `node '<path>' hook` or the R-1050 form. |
| R-1057 | added (FEAT-015, beside R-344) | WHERE the platform is win32, doctor shall run the R-344 Node floor check on the `node` found on PATH instead of reporting it skipped. |
| R-1058 | added (SUB-015); its cmd.exe cases cover Claude Code before 2.1.47 only | WHERE the platform is win32, each hook command the installer writes shall start its script and produce that script's expected output when run by Git Bash, by PowerShell, or by cmd.exe, from a checkout and a home whose paths contain a space. |
| R-387 | retired (superseded by R-1051) | Was: "WHERE the platform is win32, no POSIX Claude Code hook shall enter settings." Its "no bash hooks in settings" check (`win32-degrade.test.mjs:86-87`) carries `req: R-387` today and needs a new row. R-909 is a weak fit: it covers retired nana bash scripts, and its evidence (`REQUIREMENTS.md:974`) does not cite this check. The seat proposes R-1050, whose form admits only `node`. |
| R-985 | reworded (SUB-012) | The setup shall install and doctor-check the user-scope Node PreToolUse verifier hook on every platform. The clause "on POSIX and omit it on win32" is dropped. Its three win32 tests are rewritten: the two in `win32-degrade.test.mjs` move under R-1051 and R-1053, and `verifier-pipe.test.mjs:128-129` checks the pack README's "not wired on native Windows" sentence. |
| R-984 | reworded (FEAT-010) | The installed Claude Code PreToolUse verifier hook shall emit `ask` with the predicate reason only on a hit, and otherwise abstain with empty stdout while reporting its errors on stderr. Was "Bash PreToolUse hook". R-1054 carries the PowerShell dialect. |
| R-319 | reworded (SUB-013) | WHERE the platform is not win32, paths the installer writes into commands shall be single-quoted with an embedded quote escaped, so a home or clone containing a space still runs. R-1050 governs win32. The design comment at `settings.mjs:26` changes with this row. |
| R-394 | unchanged; extended by R-1056 | "Install shall replace its own recognized stale knowledge-hook entry without appending a duplicate." Bug 4 is this row failing on win32 today. |
| R-653 | reworded (FEAT-018) | The hook install migration shall preserve complete entries whose commands do not exactly match a command shape R-1056 recognizes on that platform, apart from the checkout path. Was "its generated command shape" (singular). On POSIX the only recognized shape is still the POSIX knowledge form, so behaviour there is unchanged. |
| R-923 | unchanged; cited | "A hand-written variant of a nana hook shall be kept as-is with no duplicate entry added." R-1056's "installer-shaped" decides what counts as hand-written. |
| R-301 | reworded (SUB-012) | WHERE the platform is not win32, the four Claude Code Node hooks and the three rules shall be installed into ~/.claude/ as symlinks into their source copies. The old qualifier "POSIX hooks" goes: the hooks have been Node since `c053b02`, and install links them only on POSIX. |
| R-936 | unchanged; gains a cited test | "No VAR=value prefix" stays. PowerShell, the current fallback hook shell, cannot run one (INFERRED), and nor can cmd.exe (before 2.1.47). R-1058's PowerShell cases pin it. The title at `win32-degrade.test.mjs:85` names PowerShell beside cmd.exe. |
| R-349, R-937 | unchanged | The hook-file step is still skipped on win32 (`steps.mjs:102`), and doctor still marks it. |
| R-684 | reworded (FEAT-019) | The Windows clause "no Claude Code hook except the knowledge pull" becomes "the Claude Code hooks wired to the checkout". These change together: the canonical line in `packages/nana-pack/tests/templates-render.test.mjs`, `README.md:5`, `AGENTS.md:5` and `packages/nana-setup/README.md:374`. `CLAUDE.md` is a symlink to `AGENTS.md`, not a fifth copy. The new wording must not trip the broad-parity scan at `templates-render.test.mjs:277-278`. |
| SUB-015 purpose | reworded | Was "Skip unsupported Windows integrations and maintain supported copies and mirrors without overwriting owner content." Becomes "Wire supported Windows integrations in their platform form, skip unsupported ones, and maintain supported copies and mirrors without overwriting owner content." |

R-393 keeps its text, and R-1055 extends doctor's check to all five win32 rows. The requirement tree changes with this delta:
- regenerate `docs/requirements-tree.md`;
- update the leaf total at `requirements-tree.test.mjs:38` and `:52` (1,033 at `c22bab5`; product-report also changes it).

## 3. Design

- **`settings.mjs` `desiredHooks({ hooksDir, repoRoot, platform })`.**
  - The POSIX branch stays byte-identical to today (`:122-178`).
  - win32 script paths:
    - the four hooks: `<repoRoot>/packages/nana-setup/claude/hooks/<hook>.mjs`;
    - the knowledge pull: `<repoRoot>/packages/nana-knowledge/bin/nana-knowledge.ts`.
  - Each path goes through a new function, `winq(p)`. It turns `\` into `/` and wraps the path in double quotes. If the path contains a refused character, `winq` returns a refusal that names the first one.
  - The verifier matcher is `Bash|PowerShell`.
  - `timeout: 5` and the status messages are unchanged. No `shell` field and no `args`.
  - The module header changes (`settings.mjs:4-8`). Its inputs gain the platform, and its outputs name the renamed functions.
- **Why double quotes and forward slashes.**
  - Inside double quotes, Git Bash and PowerShell expand `$` and the backtick, and cmd.exe expands `%`. Spaces, `&`, `(`, `)`, `;`, `^` and `'` pass through literally (INFERRED from each shell's quoting rules; R-1058's test proves it).
  - `"` cannot appear in a Windows path. Microsoft's naming rules list it as reserved (https://learn.microsoft.com/en-us/windows/win32/fileio/naming-a-file).
  - For an absolute path in shell form, the docs say: "Use absolute paths … In shell form, wrap it in double quotes" (hooks#security-best-practices).
  - The hooks#reference-scripts-by-path sentence, "wrap each placeholder in double quotes", is about placeholders, which must expand. This lane writes no placeholder.
  - The docs ask for forward slashes under Git Bash, because it "treats unquoted backslashes as escape characters" (https://code.claude.com/docs/en/statusline#windows-configuration). That guidance is written for status lines; that it applies to hooks is INFERRED.
  - Inside double quotes, bash treats a backslash as special only before `$`, the backtick, `"`, `\` and newline. This is documented bash behaviour. So `C:\Users` keeps its backslashes, but a UNC checkout's leading `\\` collapses to `\`. Forward slashes avoid both cases.
- **The quoting trade (open for Jake).**
  - Single quotes keep `$`, the backtick and `%` literal under Git Bash and PowerShell. Today's win32 knowledge entry already uses single quotes.
  - Double quotes are needed only for cmd.exe, which means Claude Code before 2.1.47.
  - Double quotes cost the R-1052 refusal. A path with `$` or `%` gets the knowledge entry today. After this change, install exits non-zero for that path and writes nothing.
  - Single quotes would cost cmd.exe support. They would also need a refusal for `'` in the path, because Git Bash and PowerShell escape it differently (INFERRED).
  - The plan keeps double quotes until Jake's Claude Code version is known.
- **Constants** are defined beside `shq` in `settings.mjs`, each with its provenance:
  - `WIN_VERIFIER_MATCHER = "Bash|PowerShell"`. Contract value: hooks#powershell and hooks#matcher-patterns, read 2026-10-12.
  - `WIN_REFUSED_PATH_CHARS = ["$", "`", "%"]`. Chosen: these characters expand inside double quotes in Git Bash or PowerShell (`$`, the backtick) or in cmd.exe (`%`, before 2.1.47).
  - One test pins each constant, naming R-1053 and R-1052.
- **`steps.mjs` `stepSettings`.**
  - Delete the win32 filter and the prefix strip (`:505-509`), and the out-of-date skip wording (`:516`). Pass `platform()` to `desiredHooks`.
  - A refusal becomes one PROBLEM row per hook, and install writes nothing.
  - `stepHooks` (`:102`) is unchanged: install links and copies nothing into `~/.claude/hooks` on win32.
  - The `.sh` migration stays POSIX-only (`:524`). win32 has only ever written the knowledge entry (`:505-509`).
- **One repair for entries anchored in the checkout.**
  - `installerKnowledgeTarget` becomes `installerTarget(command, wanted, platform)`.
    - It accepts the current form for that entry.
    - For the knowledge entry it also accepts the POSIX prefixed form on every platform (`settings.mjs:93-96`).
    - On win32 only, it also accepts the earlier win32 form `node '<path>' hook`.
    - It rejects every other form (R-653, R-923).
  - `mergeKnowledgeHook` becomes `mergeRepoHook(settings, wanted, repoRoot)`. It applies to the repo-anchored entries that R-1056 names.
  - The existing gates stay the same: timeout and status message (`:276`), and replacement in place (`:291`).
- **Doctor.**
  - `knowledgeHookHealthy` becomes `repoHookHealthy(settings, wanted, repoRoot)`, limited to the entry's event and matcher. On win32 it judges all five settings rows (`doctor.mjs:379-392`).
  - POSIX keeps `hasHook` for the four hooks and today's knowledge check.
  - Remove the win32 skip of the Node floor check (`:296`). `spawnSync("node", …)` should find `node.exe` on PATH (INFERRED; the Windows leg checks it).
  - The hook-file rows keep "skipped (win32)" (`:335`).
- **`verifier-hook.mjs` `decideHook`** (`:14`).
  - Accept `tool_name` `Bash` or `PowerShell`. The PowerShell tool's input "fields match the Bash tool, with the command string in `command`" (hooks#powershell).
  - For PowerShell, call `verifierPipeReason(command, "powershell")`.
  - POSIX keeps the `Bash` matcher, which filters out any PowerShell event there (see the residual below).
- **Header only:** `claude/hooks/verifier-pipe.mjs` keeps its code. Its purpose line, "one Claude Code Bash PreToolUse event", changes.
- **Unchanged:** the code of the four hook scripts, `lib/hook-producer.mjs`, the knowledge CLI, and `.github/workflows/ci.yml`.

**Rejected.**
- Copies or generated stub files in `~/.claude/hooks`. Copies break the `../../lib` imports. Stubs are one more file to keep in step, for no gain over naming the checkout path.
- A `shell` field. The double-quoted form needs none.

**Exec form (`args`): deferred to Jake, not rejected.**
- The 2.1.139 changelog entry says: "Added hook `args: string[]` field (exec form) that spawns the command directly without a shell, so path placeholders never need quoting."
- The docs endorse this lane's exact case on Windows: "The `node` plus script-path pattern works on every platform because `node.exe` is a real binary." They add: "Special characters such as apostrophes, `$`, and backticks pass through verbatim because there is no shell to interpret them" (hooks#exec-form-and-shell-form).
- What exec form removes:
  - the refused characters;
  - Git Bash and PowerShell profile output;
  - the shell-flag and PowerShell-stdin questions;
  - `CLAUDE_CODE_SHELL_PREFIX` wrapping ("PowerShell hooks and exec-form hooks run without the prefix", https://code.claude.com/docs/en/env-vars).
- What exec form costs:
  - it changes the entry shape that `hasHook`, `removeInstallerHooks` and doctor read;
  - it needs Claude Code 2.1.139 or later on Jake's machine, which nobody has recorded.
- A spawn with no shell would model exec form in the Windows test.
- The plan builds shell form until Jake decides.

**Open for Jake.**
1. Shell form or exec form. The deciding fact is Jake's `claude --version`.
2. Keep cmd.exe support or drop it. Keeping it means double quotes and the `%` refusal. Dropping it allows single quotes and removes the cmd.exe cases.
3. A pull request for the Windows CI run. HANDOFF already holds this ask ("Draft pull requests as a CI trigger", `HANDOFF.md:78`).

**Declared limits and residuals.**
- **Stale paths after a move.** When the checkout moves, all five entries are stale until install runs again. `nana-setup` is not on PATH on win32 (`steps.mjs:687`), so the command is `node <checkout>\packages\nana-setup\bin\nana-setup.mjs install`.
- **Git Bash profile output.**
  - The docs say Git Bash does source the profile: "Hooks run in non-interactive shells, but Git Bash and some configurations … still source your profile" (https://code.claude.com/docs/en/hooks-guide#shell-profile-output-before-the-json).
  - Anything the profile prints comes before the hook's JSON, and Claude Code then ignores that JSON silently. The verifier would then abstain without anyone seeing it.
  - Doctor cannot detect this. `claude --debug` can: search the log for "Hook output does not start with {". From 2.1.296, hooks#debug-hooks also logs each hook's finish status and duration.
- **PowerShell profile output.** The docs do not say hooks run with `-NoProfile`. They list "PowerShell profiles are not loaded" only for the PowerShell *tool*. A PowerShell profile could print ahead of the JSON just as a Git Bash profile can (INFERRED).
- **Shell flags, partly documented.**
  - Claude Code passes `-ExecutionPolicy Bypass` "when spawning PowerShell for tool calls, hooks, and status line commands" (env-vars, `CLAUDE_CODE_POWERSHELL_RESPECT_EXECUTION_POLICY`).
  - It "auto-detects `pwsh.exe` … and falls back to `powershell.exe`" (hooks#windows-powershell-tool).
  - The docs do not say whether `-NoProfile` is used. They do not say which `bash.exe` runs hooks (`Git\bin` or `Git\usr\bin`), whether it is a login shell, or its flags.
  - The test uses `bash.exe -c` and `-NoProfile -NonInteractive -ExecutionPolicy Bypass -Command`. `-NoProfile` is an assumption.
- **PowerShell stdin.**
  - Nobody has confirmed that PowerShell passes the hook's stdin through to `node` under `-Command`. The PowerShell cases settle it.
  - If they fail, the plan goes back to review, and exec form becomes the fallback (Jake's call).
- **The PowerShell hook-shell path is never run by real Claude Code in this plan.** Jake has Git Bash, so his machine check never reaches it. Only the CI emulation covers it.
- **The cmd.exe cases.** They test a shell that current Claude Code does not use. A green result covers versions before 2.1.47 only.
- **Timeouts fail open.**
  - The docs say: "A timed-out `command` … hook doesn't block the tool call … don't count on a stalled hook to act as a gate" (hooks#timeouts).
  - Git Bash start-up plus `node` may exceed 5 s, for example under first-run antivirus scanning (INFERRED). The verifier would then let the commit through.
  - The Windows leg records each run's duration.
  - `onFailure: "block"` needs 2.1.295. This lane does not use it.
- **`CLAUDE_PROJECT_DIR` form.**
  - The docs do not say whether it arrives in `C:\` form or `/c/` form. The objective and adoption hooks pass it on as `--cwd` (`lib/hook-producer.mjs:32-33`).
  - Indirect evidence points to the native `C:\` form (INFERRED):
    - the docs' PowerShell hook example, `"& \"$env:CLAUDE_PROJECT_DIR\\.claude\\hooks\\check.ps1\""`, works only with a native path;
    - hooks#pretooluse-input says file paths "arrive with backslash separators, even when your hook runs under Git Bash where `$PWD` looks like `/c/project`".
  - Only Jake's machine check confirms the form.
- **The claim most likely to be wrong** is that the Windows leg's emulated shells match how Claude Code really launches a hook: which `bash.exe`, its flags, the profile, PATH and the working folder. This is the seat's judgment. A green Windows leg may not carry over. Jake's machine check is the only test of the real launch.
- **`node` on PATH.** R-1057's `spawnSync("node")` resolves `node` from doctor's PATH, not from the hook shell's. A ✓ does not prove the hook finds the same `node`.
- **The refused set may be incomplete (INFERRED, not checked).**
  - PowerShell treats U+201C, U+201D and U+201E as double quotes, and all three are legal in Windows paths.
  - cmd.exe expands `!` when delayed expansion is on in the registry. R-1035 already refuses `!` for cmd.exe.
  - This lane declares these as limits rather than refusing them.
- **An old form install does not recognize.** The unquoted knowledge form that `54b5088` wrote, and `b39518f` fixed the same day, is not in R-1056's list. The risk is low.
- **`CLAUDE_CONFIG_DIR`.** This limit predates the lane and is not specific to Windows.
  - The installer ignores the variable: `lib/paths.mjs:39-40` uses `<home>/.claude`.
  - The shared-memory hook honours it (`nana-shared-memory.mjs:32`).
  - With the variable set, Claude Code reads its settings from that folder (https://code.claude.com/docs/en/settings). So install would write a `settings.json` that Claude Code never reads.
  - This lane does not change that.
- **The PowerShell tool on POSIX.**
  - macOS, Linux and WSL can turn the tool on with `CLAUDE_CODE_USE_POWERSHELL_TOOL=1`, which also requires `pwsh`.
  - POSIX keeps the `Bash` matcher (outcome 6), so a session with the tool on gets no verifier guard.
- **Uninstall.** Uninstall still refuses on win32 (lane 4). Until then, someone must remove the five win32 entries by hand.
- **Console flash.** The detached index rebuild sets no `windowsHide` (`packages/nana-knowledge/lib/hook.ts:51-69`), so a console window may flash (INFERRED). This lane does not change it.

## 4. Scope

**In.**
- Code:
  - `packages/nana-setup/lib/settings.mjs`, including its module header and the comment at `:26`;
  - `steps.mjs` (`stepSettings` only);
  - `doctor.mjs` (the Node floor row and the hook settings rows);
  - `verifier-hook.mjs`;
  - the header of `claude/hooks/verifier-pipe.mjs` (purpose line only).
- A new test, `packages/nana-setup/tests/hooks-win32-exec.test.mjs`, which runs on the Windows leg only.
  - The other legs skip it through a declared entry in `scripts/test.mjs` (`SKIPS`, `:154`).
  - Without that entry, the runner fails an exit-0 file that printed no PASS line (`:372-374`). `packages/nana-pack/tests/test-runner.test.mjs:222` pins that behaviour.
- New forced-win32 cases in `settings-merge.test.mjs` and `win32-degrade.test.mjs`, including the title at `:85`.
- The hook-related assertions only in:
  - `install.test.mjs`;
  - `verifier-pipe.test.mjs`: `:128-129` (the pack README's win32 sentence) and `:133` (the setup README's knowledge-migration sentence);
  - `shared-memory-hook.test.mjs` (pass USERPROFILE);
  - `hook-producers.test.mjs` (`path.join` instead of `/clone/…`, `:30-32`);
  - `settings-merge.test.mjs:244` and `:315`, and `retired-artifacts.test.mjs:167` and `:172`, which break on the Windows leg once the entries use forward slashes.
- `REQUIREMENTS.md`, including the row changes and SUB-015's purpose line.
- `docs/requirements-tree.md`, regenerated, and `requirements-tree.test.mjs:38` and `:52` (the leaf total).
- The code map.
- Front-door text:
  - the three Support lines (`README.md:5`, `AGENTS.md:5`, `packages/nana-setup/README.md:374`) and the canonical line in `templates-render.test.mjs`;
  - setup README `:44` (the knowledge form and the "On native Windows" sentence), `:59` (the verifier-pipe guard) and `:376` (Platforms);
  - pack README `:40` ("The Claude Code Bash hook is not wired on native Windows by nana-setup.").
- `HANDOFF.md`, including the correction at `:57`, and the session entry. The seat writes both before the final review.
- Outside the repo, the seat corrects the shared memory notes `user_jake_windows_both_seats.md:10` and `reference_claude_code_hooks_windows.md:9`.

**NOT.**
- The desk.
- The pi seat's Windows changes. Lane `pi-cmd-launch` has landed.
- The install-and-hooks CI job, which is a separate parallel lane. This lane does not touch `ci.yml`.
- Test-portability files unrelated to hooks (lane 6):
  - nana-knowledge `discovery`, `hook` and `render`;
  - nana-pack `adoption-producer`, `adoption-reader` and `objective-golden`;
  - `state-manifest`. Once its hook-link checks can run, they follow R-349.
- The other Windows install gaps: skills, PATH commands, uninstall and copy drift (lane 4).
- Exec form, until Jake decides.
- Writing anything into `~/.claude/hooks` on win32.
- The `_shared` matrix's "Bash PreToolUse Node hook" text, which `verifier-pipe.test.mjs:123` pins. After this lane that text is incomplete for win32. Changing it means a template release, so this lane declares the gap instead.
- The installer's handling of `CLAUDE_CONFIG_DIR`, and the PowerShell-tool gap on POSIX. Both are declared above.

## 5. Verification

- **Seat acceptance script**, written and red before the build: `docs/reviews/cc-hooks-windows-2026-10-12/acceptance.mjs`, run on macOS.
  - (a) Forced win32 (`NANA_SETUP_PLATFORM=win32`) install into a temp home whose path has a space:
    - five entries exist;
    - every command matches `^node "[^"'\\]+"( hook)?$`;
    - the four hook commands name `packages/nana-setup/claude/hooks/`;
    - the verifier group's matcher is `Bash|PowerShell`;
    - doctor shows ✓ on the five settings rows and on the Node row;
    - `~/.claude/hooks` is absent or empty. A forced-win32 install never creates it, and `win32-degrade.test.mjs:68` asserts that it is absent.
  - (b) `/bin/sh -c` runs each forced-win32 command with sample stdin, and each gives the per-hook output listed below.
  - (c) The script seeds two entries that point at a missing checkout: one in the R-1050 form, one in the `node '<path>' hook` form. Install replaces each in place, and doctor shows ✓. These seeds use POSIX paths, because POSIX `path.isAbsolute` rejects `C:\`.
  - (d) An unforced install writes a `settings.json` equal to a golden file captured from `main` at `c22bab5` before the build.
    - Both installs use the same injected home.
    - The checkout path is replaced by a placeholder in both, because `settings.json` embeds the checkout path and the hooks folder (`settings.mjs:131`, `:172`).
  - (e) Tool `PowerShell` with `set -o pipefail; npm test | Select-Object -Last 5; git commit -m x` gives an ask. Tool `Bash` with the same command gives none.
- **Pure cases on every leg** (forced win32, injected `repoRoot`):
  - `winq` accepts a path containing a space, `&`, `(`, `)`, `'`, `;` and `^`, and writes it with forward slashes.
  - `winq` refuses `$`, the backtick and `%`, naming each.
  - POSIX `desiredHooks` deep-equals a fixture of today's output.
  - `installerTarget` accepts its forms on the right platforms and rejects a hand-edited form. On POSIX it rejects the two win32-only forms.
  - `decideHook` handles Bash and PowerShell with the pipefail-prefixed command.
  - Each constant is pinned by a test naming its row.
- **Windows leg: run every installed hook command** (`hooks-win32-exec.test.mjs`).
  - **Setup.**
    - Add a `git worktree add --detach` of HEAD in a temp folder whose name contains a space, `&`, `(`, `)`, `'`, `;` and `^`.
    - Clean up with `git worktree remove --force`, because the worktree registers under `.git/worktrees`.
    - The hook entry files' import closure is 28 files: the five entries, both producers and `nana-knowledge.ts`. It has one npm import.
      - At load (`:378`), `packages/nana-pack/lib/config.ts:369` starts `import("@earendil-works/pi-coding-agent")`.
      - `packages/nana-pack/bin/nana-objective.mjs:36` imports `config.ts`.
      - The import is dynamic and caught, so nothing crashes. In a detached worktree under a temp folder it cannot resolve, so the trust check fails closed.
      - The objective block should still print with trust failed closed (INFERRED). The objective case settles it.
    - Run that copy's real `nana-setup install --home <temp home with a space>` with no platform forcing, then read `settings.json`.
    - Seed `<temp home>/.pi/agent/npm/node_modules/pi-subagents/package.json` at the floor version, as `win32-degrade.test.mjs:37-41` does. Without it, doctor fails `pi pi-subagents` (`doctor.mjs:514`).
    - Set `CLAUDE_PROJECT_DIR` to a fixture project with an `OBJECTIVE.md`, under a folder whose name has a space.
    - Environment:
      - point HOME and USERPROFILE at the temp home;
      - set `CLAUDE_CONFIG_DIR` to `<temp home>/.claude`, or leave it unset. The shared-memory hook reads `<CLAUDE_CONFIG_DIR>/nana-memory/shared/MEMORY.md` (`:32-34`), and `install --home` writes under `<home>/.claude`;
      - put `NANA_KNOWLEDGE_HOME` under the temp home.
    - Seed the shared index with one `- [` line. The hook prints only its header, an optional note, and lines matching `^- \[` (`nana-shared-memory.mjs:87-89`). `MEMORY.seed.md` has no such line.
    - Seed the entry today's code really writes on Windows: `node 'C:\…\checkout/packages/nana-knowledge/bin/nana-knowledge.ts' hook`. It has a backslash root and a forward-slash suffix, and it points at a missing checkout. Install must replace it in place, and doctor must then show ✓. Without this case, only POSIX paths pin the bug 4 fix.
  - **Shells.** Each shell runs each command string with its event's sample stdin and a 5-second limit (the entry's timeout). Each run records its duration. The shells:
    - Git Bash: `<Git>\bin\bash.exe -c <command>`, found through `git --exec-path`. The test first checks that `uname -o` prints `Msys`, so it never runs WSL's `bash.exe`.
    - PowerShell 7 and Windows PowerShell 5.1, each when present: `-NoProfile -NonInteractive -ExecutionPolicy Bypass -Command <command>`. That `windows-latest` ships both is INFERRED.
    - cmd.exe, for Claude Code before 2.1.47 only: `%ComSpec% /d /s /c "<command>"`, with verbatim arguments.
  - **Expected output per shell.**
    - Objective: exit 0; stdout starts with `[nana:objective]` and contains no `OBJECTIVE UNAVAILABLE`.
    - Adoption: exit 0; no `ADOPTION UNAVAILABLE`.
    - Shared memory:
      - exit 0;
      - stdout starts with the `[nana:shared-memory]` header and contains the seeded `- [` line;
      - the project's `memory\shared` is a junction to the shared folder.
    - Verifier pipe:
      - tool `Bash` with `npm test | tail -5; git commit -m x` gives one JSON line with `permissionDecision: "ask"`;
      - tool `PowerShell` with the pipefail-prefixed command gives an ask;
      - a command that does not match gives empty stdout.
    - Knowledge: exit 0 within the limit, and no module-resolution error on stderr. nana-knowledge's own tests pin its content, and lane 6 unblocks them.
    - Doctor on the same copy and home: ✓ on the five settings rows and on the Node row; exit 0.
  - **Reading the result.**
    - The Windows leg is non-blocking (`ci.yml:21`).
    - CI runs only on a push to main or on a pull request (`ci.yml:2-5`), so pushing the branch runs nothing. A Windows run needs a pull request, which is Jake's open ask.
    - The seat reads this file's lines in the Windows job log and records the run ID. A green check is not evidence.
- **macOS regression:** case (d) above, plus `npm run test:locked` green.
- **Mutation pairs.** Each mutation breaks code, never an assertion, and the seat records which test goes red.
  1. Restore the filter at `steps.mjs:505-509`: the five-entry case fails on every leg, and every Windows run case fails.
  2. Use `shq` instead of `winq` on win32: the form case fails, and the cmd.exe cases fail on the checkout path with a space.
  3. Keep backslashes: the form case fails. Inside double quotes, bash keeps `\` before ordinary characters (documented bash behaviour), so on a drive-letter path this mutation rests on the form case alone. A UNC checkout would break under Git Bash, because `\\` collapses to `\`.
  4. Restore the `NODE_NO_WARNINGS=1 ` prefix on win32: the PowerShell and cmd.exe knowledge cases fail.
  5. Use matcher `Bash` on win32: the matcher case fails. Only Jake's machine checks Claude Code's own routing.
  6. Make `decideHook` reject PowerShell: the PowerShell ask cases fail on every leg and on Windows.
  7. Use the bash dialect for PowerShell: the pipefail-prefixed PowerShell case fails.
  8. Drop one refused character: its `winq` case fails.
  9. Narrow `installerTarget` back to the prefixed form only (`settings.mjs:93`, `:96`): the win32 stale-repair cases fail, including the Windows-leg case with the real mixed-separator entry. This pins bug 4.
  10. Make doctor use `hasHook` alone on win32: the stale-target doctor case fails.
  11. Skip the Node floor check on win32 again: the forced-win32 Node-row case fails.
  12. Send POSIX through the win32 form: the macOS golden case fails.
  13. Accept the win32-only forms on POSIX: the POSIX rejection case for `installerTarget` fails (R-653).
- **Jake's machine, last; Jake runs it.**
  - First, record:
    - the `claude --version` output, against the floors 2.1.47 (Git Bash hook shell), 2.1.126 (PowerShell as the primary shell), 2.1.139 (exec form) and 2.1.296 (debug duration lines);
    - the account type, `CLAUDE_CODE_USE_POWERSHELL_TOOL`, and any Bash deny rule;
    - whether `CLAUDE_CONFIG_DIR`, `CLAUDE_CODE_SHELL_PREFIX` or `CLAUDE_CODE_GIT_BASH_PATH` is set.
  - Accept the workspace trust dialog for the test project first. The docs say: "Claude Code holds back hooks from every settings file, including your own `~/.claude/settings.json`, until you accept the workspace trust dialog" (hooks#workspace-trust).
  - Install from the merged branch. Then start a Claude Code session with `claude --debug` in an adopted project.
  - Expected: the objective block and the shared-memory index appear.
  - Ask Claude to run a piped verifier before `git commit`. That raises an ask. Record the `tool_name` the hook saw. Do not expect PowerShell: the account type or a Bash deny rule can leave the PowerShell tool off.
  - Search the debug log for "Hook output does not start with {". From 2.1.296, also read each hook's finish status and duration against the 5 s timeout.
  - A throwaway hook that prints `cat /proc/$$/cmdline`, `$-`, `$PWD`, `$PATH` and `$CLAUDE_PROJECT_DIR` settles three things: the Git Bash invocation, whether the profile runs, and the project-folder form.
  - Record which `node` the hook shell resolves (`node.exe` or a `.cmd` shim) and its version against 22.18. Compare it with the `node` doctor found.
  - This is the only check of these behaviours:
    - Claude Code's real shell choice and launch;
    - the form of `CLAUDE_PROJECT_DIR`;
    - PowerShell routing;
    - profile output;
    - hook latency.

## Seat fact-check (2026-10-12)

Two read-only checks reviewed the draft. One checked the code, the other checked the Claude Code docs and changelog. The docs were read on 2026-10-12, not against a pinned Claude Code version. Changes:
- **Base and dependencies.** The base moved to `c22bab5`, because `pi-cmd-launch` landed, and all line references moved with it. The golden file now comes from `c22bab5`. The draft did not name `feat/product-report`, which is now listed, with the row ranges it uses.
- **Hook shell.**
  - Current Claude Code does not use cmd.exe for hooks; versions before 2.1.47 did. The cmd.exe cases and the `%` refusal are now justified only by those versions.
  - The `:85` title is incomplete, not wrong.
- **Bash-only matcher.**
  - The "never fires there" quote is about Windows without Git Bash. Whether the PowerShell tool is on for Jake is now marked INFERRED.
  - Two more stale places are named: `HANDOFF.md:57` and the memory note line `:10`.
  - Deny rules can turn the PowerShell tool off.
- **Exec form.** Claude Code has accepted `args` since 2.1.139, and the docs endorse `node` plus the script path on Windows. Exec form moved from rejected to Jake's call. Its only surviving cost is the entry shape plus Jake's unknown version.
- **Quoting.**
  - The double-quote citation now points to hooks#security-best-practices.
  - The R-1052 regression is named as a trade, and the trade is open for Jake.
  - The rule that `"` cannot appear in a Windows path is documented, so it is no longer INFERRED.
  - Mutation 3 rests on documented bash behaviour, with a UNC note.
  - Smart quotes and `!` are declared limits (INFERRED).
- **Rows.**
  - Added: R-319, R-394, R-984 and R-923, plus SUB-015's purpose line.
  - R-653 is now reworded, and R-1056's extra forms are limited to win32.
  - R-985 has three win32 tests.
  - The proposed new home for R-387's check moved from R-909 to R-1050.
  - `CLAUDE.md` is a symlink, not a fifth Support copy.
  - `desiredHooks` is at `:122-178`.
- **Scope.** Added:
  - the pack README and its test;
  - the setup README lines `:44`, `:59` and `:376`, with the broad-parity pitfall;
  - the requirement tree and its leaf-total test;
  - the skip entry in `scripts/test.mjs`;
  - assertions that break on Windows;
  - the module headers;
  - the `_shared` matrix gap, declared.
- **Windows leg.**
  - `config.ts` does make one npm import, which fails closed in a temp worktree.
  - The shared-memory expectation now seeds a `- [` line.
  - `CLAUDE_CONFIG_DIR` now points to `<temp home>/.claude`.
  - The pi-subagents fixture is seeded so doctor can exit 0.
  - Cleanup uses `git worktree remove --force`.
  - A new case seeds today's real Windows entry.
  - Each run records its duration.
  - PowerShell gets `-ExecutionPolicy Bypass`.
  - A branch push triggers no CI; a pull request is needed.
  - Case (d) normalizes paths, and case (a) accepts an absent hooks folder.
- **Residuals added:**
  - timeouts fail open;
  - PowerShell profile output;
  - the PowerShell hook-shell path is never run by real Claude Code;
  - the cmd.exe cases prove nothing about current Claude Code;
  - doctor's `node` may differ from the hook shell's;
  - `CLAUDE_CONFIG_DIR` is ignored by the installer;
  - the PowerShell-tool gap on POSIX;
  - the unrecognized unquoted form from `54b5088`.
- **Most likely wrong.** `CLAUDE_PROJECT_DIR` now has indirect evidence for the native form. The claim most likely to be wrong is now the Windows leg's shell emulation.
- **Jake's machine check.** It now records the version, account type, environment variables, `tool_name`, debug-log lines, the `node` it resolves and latency, and it accepts workspace trust first.