# Change declaration: the Claude Code seat's hooks run on Windows

*Lane `cc-hooks-windows` · branch `feat/cc-hooks-windows` · worktree `~/nana-pi-wt/cc-hooks-windows`, based on `main` at `c22bab5` · 2026-10-12. Builder: Claude Sonnet 5.5 (Owner's measurement lane).*

*Revised 2026-10-12 after the owner's answer. On win32 every hook entry is now written in exec form. See "Decision (2026-10-12)" in section 3, and "Revision after the owner's answer" at the end.*

*Re-checked 2026-10-12 against the code and the docs. The last line of "Seat fact-check" records the changes.*

*Features and rows:*
- *FEAT-010 "Guard risky commands and protected resources": R-984; new R-1062.*
- *SUB-012 "Deliver commands, hooks and workflow resources": R-985, R-301; new R-1054 and R-1064.*
- *SUB-013 "Connect hooks and packages without duplication": R-319, R-923; new R-1061.*
- *SUB-015 "Apply the platform's supported installation": R-387 and R-936 (both retired), and the feature's purpose line; new R-1050, R-1051, R-1053, R-1058 and R-1063.*
- *FEAT-015 "Diagnose the active environment": R-937; new R-1055, R-1057 and R-1060.*
- *FEAT-018 "Update or remove managed components safely": R-394, R-653; new R-1056 and R-1059.*
- *FEAT-019 "Release usable templates and report support": R-684.*

*Order: why → plan → sol plan review (two rounds at most) → seat acceptance script, red → build → CI run with the Windows leg (a draft pull request; the owner, 2026-10-11: pushing a non-main branch and opening a draft PR for CI need no approval) → seat verification → sol build review → astra land review → the owner's machine check → the owner accepts.*

*Dependencies:*
- *`feat/pi-cmd-launch` has landed at `c22bab5`, 21 commits past `c505601`. This lane's worktree starts there. Its tip is `47df119`, this plan.*
- *`feat/product-report` has also landed. Main is now `7e6ce39`, which merged `c22bab5` (checked 2026-10-12 with `git log main`). It edited:*
  - *`REQUIREMENTS.md` (R-1012 to R-1030 and R-1040 to R-1043; its build brief reserved R-1043 to R-1049);*
  - *`docs/requirements-tree.md`, `requirements-tree.test.mjs` (leaf total now 1,056) and `scripts/requirements-tree.mjs`;*
  - *root `README.md` (a new section near `:241`, not the Support line at `:5`);*
  - *the code map and HANDOFF.*
- *Product-report touched none of this lane's code or test files. So every code and test line reference below, taken at `c22bab5`, holds at `7e6ce39`. HANDOFF references are at `7e6ce39`.*
- *R-1050 onward is free: the highest row on main is R-1043. Merge main into the lane before the build, and again before the final round if main moves.*

## 1. Why

The owner uses both seats every day on his x64 Windows machine, which has Git Bash (`~/.claude/nana-memory/shared/user_owner_windows_both_seats.md:8,10`). On that machine the Claude Code seat gets only the knowledge pull:
- install skips the four hook files (`packages/nana-setup/lib/steps.mjs:102`);
- install filters their settings entries out (`:505-509`);
- doctor marks them skipped (`lib/doctor.mjs:335`, `:379-383`).

HANDOFF ranks this first in the Windows queue now that product-report has landed (`HANDOFF.md:58`). The triage calls it lane 2 (`docs/reviews/windows-ci-2026-10-11/windows-triage.md:24-28`). Four findings shape the fix.

1. **Copies cannot work.** Each hook imports `../../lib/…` relative to its own file:
   - `claude/hooks/nana-objective.mjs:11-12`
   - `nana-adoption.mjs:11-12`
   - `nana-shared-memory.mjs:12-13`
   - `verifier-pipe.mjs:11`

   So the settings entries must name the checkout's own scripts.
2. **Exec form takes the shell out of the hook.**
   - In shell form, the `command` string "is passed to a shell: `sh -c` on macOS and Linux, Git Bash on Windows, or PowerShell when Git Bash isn't installed" (https://code.claude.com/docs/en/hooks#exec-form-and-shell-form, read 2026-10-12). On Windows that brings two shells with different quoting rules. It also brings profile output and launch flags that the docs leave open.
   - Exec form runs "when `args` is present. Claude Code resolves `command` as an executable on `PATH` and spawns it directly with `args` as the argument vector" (same section).
   - Exec form arrived in 2.1.139. The changelog entry says: "Added hook `args: string[]` field (exec form) that spawns the command directly without a shell, so path placeholders never need quoting."
   - The docs back this lane's exact case on Windows: "The `node` plus script-path pattern works on every platform because `node.exe` is a real binary." They add: "Special characters such as apostrophes, `$`, and backticks pass through verbatim because there is no shell to interpret them." And: "No shell tokenization happens on any platform."
   - The owner's Windows machine runs Claude Code 2.1.296, the same version as this Mac (Owner, 2026-10-12). On this Mac, `claude --version` prints `2.1.296 (Claude Code)`. 2.1.296 is the newest changelog entry.
   - 2.1.296 is past 2.1.139. It is also past 2.1.47, whose changelog entry reads: "Fixed hooks (PreToolUse, PostToolUse) silently failing to execute on Windows by using Git Bash instead of cmd.exe (anthropics/claude-code#25981)".
     - The entry names only PreToolUse and PostToolUse. That it covered every hook event is INFERRED. It does not matter for exec form.
     - So no version the owner runs needs cmd.exe or shell quoting.
   - An exec-form hook starts the same way whether Git Bash is installed or not.
     - The docs never say this in one sentence. It follows from three that they do say: "There is no shell", "No shell tokenization happens on any platform", and `shell` is "Ignored when `args` is set".
     - Whether Git Bash changes the PATH that Claude Code passes to hooks is not documented. That it does not is INFERRED.
     - Git Bash now decides only which shell *tool* exists (finding 3).
   - The title at `tests/win32-degrade.test.mjs:85` ("cmd.exe cannot run it") is about a shell that exec form never uses. Its check is rewritten under R-1050.
   - The shared memory note now records the documented hook shell (`reference_claude_code_hooks_windows.md:9`, corrected 2026-10-12). Its description (`:3`) and its "How to apply" line (`:16`) still recommend a double-quoted shell form.
3. **A `Bash`-only matcher may miss most shell commands on the owner's machine (INFERRED).**
   - With Git Bash installed, the PowerShell tool "is on by default for claude.ai and Console accounts" (https://code.claude.com/docs/en/tools-reference#powershell-tool).
   - That default is a fetched feature flag (https://code.claude.com/docs/en/env-vars#features-that-need-feature-flag-fetching). With fetching off, "Claude Code routes shell commands through Git Bash unless you set `CLAUDE_CODE_USE_POWERSHELL_TOOL=1`".
     - Fetching is off when `DISABLE_GROWTHBOOK`, `DISABLE_TELEMETRY`, `DO_NOT_TRACK` or `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` is set.
     - It is also off on a third-party provider.
     - The first session after an install or upgrade may lack the flag (env-vars#first-session-after-an-install-or-upgrade).
   - "When the tool is enabled, Claude treats PowerShell as the primary shell. The Bash tool remains available for POSIX scripts when Git Bash is installed" (tools-reference).
   - The sentence in hooks#powershell that applies to the owner's machine is: "On Windows, wherever the PowerShell tool is enabled, Claude treats PowerShell as the primary shell and routes shell commands through it."
   - The same section also says "A hook that matches only `Bash` never fires there".
     - It is the bullet after "On Windows without Git Bash, the tool is enabled automatically and Claude Code doesn't register the Bash tool at all."
     - Reading "there" as Windows without Git Bash is the natural reading, but the docs do not state it outright (INFERRED). On that reading it does not describe the owner's machine.
   - Nobody has recorded whether the tool is on for the owner. That depends on his account type, his settings, his environment and flag fetching:
     - The docs say Bedrock, Agent Platform and Foundry users must set `CLAUDE_CODE_USE_POWERSHELL_TOOL=1`.
     - The 2.1.143 changelog entry says the opposite: "now enabled by default on Windows for Bedrock, Vertex, and Foundry users".
     - Version 2.1.126 made PowerShell the primary shell whenever the tool is enabled. The owner's 2.1.296 is past it.
     - On Windows with Git Bash installed, any Bash deny rule, scoped or bare, turns the tool off. It stays on if `CLAUDE_CODE_USE_POWERSHELL_TOOL=1` is set, or if a settings file has a scoped `PowerShell(...)` permission rule (tools-reference#bash-deny-rules-also-turn-off-the-powershell-tool).
     - `CLAUDE_CODE_USE_POWERSHELL_TOOL=0` turns the tool off.
     - The flag-fetching cases above can leave it off.
   - The verifier's matcher is `Bash` (`lib/settings.mjs:159`), and `decideHook` abstains for any other tool (`lib/verifier-hook.mjs:14`). `Bash|PowerShell` is the right matcher whether the tool is on or off.
   - Two places said that a `Bash` matcher fires on his machine. The memory note was corrected on 2026-10-12 (`user_owner_windows_both_seats.md:10`). `HANDOFF.md:58` still says it, and the seat corrects it.
4. **Bug 4: the knowledge hook's stale-path repair is dead on win32.** This is R-394 failing on win32.
   - `installerKnowledgeTarget` requires four words beginning `NODE_NO_WARNINGS=1`, plus the exact prefixed string (`lib/settings.mjs:93`, `:96`).
   - win32 strips that prefix (`steps.mjs:509`).
   - After a re-clone, install says "already wired" while doctor shows ✗. The code path is traced. The effect on the owner's machine is INFERRED (`windows-triage.md:70`).

**Observable outcomes.**
1. On win32, install writes all five hook entries into `settings.json`:
   - objective, adoption and shared memory (SessionStart);
   - verifier pipe (PreToolUse);
   - knowledge pull (UserPromptSubmit).

   Each entry is in exec form:
   - `"command": "node"`;
   - `"args"` holds the checkout script's absolute path, and the knowledge entry adds `"hook"`;
   - timeout and status message stay as today, and there is no `shell` field.

   No path is quoted, escaped or refused. A space, an apostrophe, `$` or a backtick reaches `node` exactly as written.
   - `%` also passes through. The docs do not name it; that follows from "no shell" (INFERRED).
   - One documented exception: Claude Code substitutes `${CLAUDE_PROJECT_DIR}`, `${CLAUDE_PLUGIN_ROOT}` and `${CLAUDE_PLUGIN_DATA}` inside each `args` element. A checkout path that holds one of those literal strings would be rewritten. The risk is negligible.
   - No other variable expands in `args`: `$HOME`, `~` and `%USERPROFILE%` stay literal. The installer writes absolute paths, so it does not rely on them.
2. On win32 the verifier entry's matcher is `Bash|PowerShell`.
   - The docs evaluate this matcher as a list of exact names, not as a regular expression (hooks#matcher-patterns).
   - The hook judges a PowerShell command with the pipe guard's existing PowerShell dialect (`packages/nana-pack/lib/pipe-guard.mjs:85`, `:93`).
3. The README Support lines and a win32 doctor note row both say that the Windows hooks need Claude Code 2.1.139 or later. Doctor does not run `claude`.
4. After the checkout moves, install rewrites each installer-shaped, repo-anchored entry whose script no longer resolves inside the checkout.
   - That is the knowledge entry on every platform, and all five entries on win32. This fixes bug 4, which is R-394 on win32.
   - On win32, install also moves the knowledge entry that today's code wrote (`node '<path>' hook`) to exec form in place, even when it still works.
   - Install recognizes the win32-only forms only on win32, so the preserve rule on POSIX keeps its current effect. On win32 a shell form counts as installer-shaped only when it carries no `args`.
   - Install keeps entries in any other shape byte for byte (R-653, R-923).
5. On win32, doctor reports each of the five settings rows ✓ only when two things hold:
   - the entry, in either form, sits under the expected event and matcher;
   - every entry that invokes its script resolves inside the checkout.

   Doctor also runs the Node 22.18 floor check, which it skips today (`doctor.mjs:296`). It checks the `node` on doctor's own PATH, which may differ from the one Claude Code finds (see the limits in section 3). The hook-file rows keep "skipped (win32)", because install writes nothing to `~/.claude/hooks`.
6. On macOS and Linux, install and doctor behave as `main` at `c22bab5`, on the write side and on the read side.
   - A fresh install writes the same `settings.json`, once the checkout path and home are normalized.
   - Install and doctor read an entry by its `command` alone, as today (R-1061). Exec form is read only on win32.
   - The earlier draft read exec form on every platform. That is withdrawn. On POSIX it would have done three things:
     - a settings fragment copied from Windows (`command: "node"`, `args: ["C:\\…/nana-objective.mjs"]`) would count as installed, so install adds no working entry and doctor shows ✓ for hooks that cannot run;
     - for the knowledge pull, doctor would show ✗ (the target is not absolute on POSIX) while install says "already wired", which is bug 4 again;
     - an entry carrying `args` with a shell-form `command` would read as not installed, so install adds a twin and doctor flips from ✓ to ✗.
7. The Support lines say that the Claude Code hooks run on Windows, and they give the floor.

**Threat model.** This follows the owner's 2026-10-11 rule (`HANDOFF.md:18`). Honest variation in a Windows machine is in scope:
- paths with spaces, apostrophes and shell-special characters (`$`, the backtick, `%`, `&`, `;`);
- Git Bash present or absent, which decides whether the Bash tool exists;
- where `node` comes from (a real `node.exe` or a shim), and the PATH that Claude Code sees;
- Claude Code's version, account type, environment and flag fetching. The version decides whether exec form works. All of them decide whether the PowerShell tool is on.

A hostile local user is out of scope. Anyone who can edit `settings.json` or the checkout can already run code as the owner.

**Lane class.** Gate-adjacent. The verifier pipe is a PreToolUse guard, and every Claude Code session on the machine shares `settings.json`. Two plan-review rounds at most.

## 2. Requirement delta

| ID | Change | Text (draft) |
|---|---|---|
| R-1050 | added (SUB-015); rewritten 2026-10-12 from the double-quoted shell form to exec form | WHERE the platform is win32, the installer shall write each hook entry it owns in exec form: `command` exactly `node`, `args` holding the script's absolute path unquoted and unescaped, then `hook` for the knowledge pull only, and no `shell` field. |
| R-1051 | added (SUB-015) | WHERE the platform is win32, the installer shall wire the objective, adoption, shared-memory and verifier-pipe settings entries to the checkout's own `packages/nana-setup/claude/hooks/<hook>.mjs`. |
| R-1052 | withdrawn (a draft ID only, never written to `REQUIREMENTS.md`) | Was the refusal of a checkout path containing `$`, a backtick or `%`. It existed only because a double-quoted shell form expands those characters. Exec form refuses no character, so the regression it declared is gone. This lane does not reuse the ID, so earlier review notes stay unambiguous. |
| R-1053 | added (SUB-015) | WHERE the platform is win32, the installer shall place the verifier-pipe entry in a PreToolUse group whose matcher is `Bash\|PowerShell`. |
| R-1054 | added (SUB-012, beside R-985); overlaps R-984 | WHEN the verifier hook receives a PreToolUse event whose tool is `PowerShell`, it shall judge the command with the pipe guard's PowerShell dialect (R-1062). |
| R-1062 | added (FEAT-010, beside R-984; sol plan r1 MUST 1, r2 MUST 1) | WHERE the pipe guard's dialect is `powershell`, it shall treat a pipe as live only outside a single-quoted string, a single-quoted (`@'`) here-string, a `#` line comment, a `<# … #>` block comment and a backtick escape, and outside a double-quoted string or an expandable (`@"`) here-string except inside a `$( … )` subexpression there. |
| R-1055 | added (FEAT-015, beside R-393) | WHERE the platform is win32, doctor shall report each of the five hook settings rows as ✓ only when an entry invoking its script, in exec form or shell form, sits under the expected event and matcher, and every entry under that event invoking the script has an absolute script path that resolves inside the checkout. Pinned by forced-win32 suite cases (section 5), not only by the acceptance script. |
| R-1056 | added (FEAT-018, beside R-394, which it extends); re-scoped 2026-10-12 | WHEN install finds an installer-shaped, repo-anchored hook entry whose script is missing or resolves outside the checkout, it shall replace that entry in place with the platform's current form. Repo-anchored means the knowledge pull on every platform, and all five entries on win32. Installer-shaped means timeout 5, the installer's status message for that entry, and a form that matches one of these apart from the checkout path: the POSIX knowledge form on every platform; on win32 only, the earlier win32 knowledge form `node '<path>' hook` and the R-1050 exec form. On win32 a shell form also carries no `args`. |
| R-1057 | added (FEAT-015, beside R-344) | WHERE the platform is win32, doctor shall run the R-344 Node floor check on the `node` found on PATH instead of reporting it skipped. Pinned by a forced-win32 suite case (section 5). |
| R-1058 | added (SUB-015); re-scoped 2026-10-12 to exec form; split after sol plan r1 (MUST 2) | WHERE the platform is win32, each hook entry the installer writes, spawned as exec form (its `command` with its `args` and no shell) from a checkout, a home and a project folder whose paths contain a space, `$`, a backtick, `%` and an apostrophe, shall exit 0 within its `timeout` with no module-resolution error on stderr. Evidence is DIRECT EXEC-FORM CONFORMANCE on the non-blocking Windows leg (its run ID), not proof that Claude Code itself dispatches the hook; the owner's machine check is the acceptance evidence for that. |
| R-1063 | added (SUB-015; split from R-1058) | WHERE the platform is win32, when spawned as R-1058 describes with its event's sample stdin, the objective entry shall print a first line starting `[nana:objective]` and no `OBJECTIVE UNAVAILABLE`, the adoption entry no `ADOPTION UNAVAILABLE`, and the shared-memory entry its `[nana:shared-memory]` header and the seeded `- [` index line. |
| R-1064 | added (SUB-012; split from R-1058) | WHERE the platform is win32, the verifier entry spawned as R-1058 describes shall print exactly one JSON line whose `permissionDecision` is `ask` for a `Bash` or `PowerShell` event whose command masks a test's exit code through a live pipe, and print nothing for any other command. |
| R-1059 | added (FEAT-018, beside R-1056) | WHERE the platform is win32, WHEN install finds an installer-shaped knowledge entry in a shell form R-1056 recognizes, it shall replace it in place with the R-1050 exec form even when its script resolves inside the checkout. |
| R-1060 | added (FEAT-015) | WHERE the platform is win32, doctor shall print a note row stating that the Claude Code hooks need Claude Code `CLAUDE_CODE_EXEC_FLOOR` (2.1.139) or later, without running `claude`. |
| R-1061 | added (SUB-013, beside R-923) | WHERE the platform is not win32, install and doctor shall decide whether an entry invokes a nana hook from its `command` field alone, ignoring any `args`. This keeps the POSIX read side identical to `main` (outcome 6). |
| R-387 | retired (superseded by R-1051) | Was: "WHERE the platform is win32, no POSIX Claude Code hook shall enter settings." It has two tagged checks today, and both change. `win32-degrade.test.mjs:83-84` ("only the knowledge hook is wired") is its cited evidence and becomes false with five entries; it is rewritten as a five-entry check under R-1051. `:86-87` ("no bash hooks in settings") moves to R-1050, whose exec form admits only `node`. The trace rail does not flag a live tag on a retired row (`templates/typescript/template/tests/requirements-trace.ts:84`, `:429` check only `untested`, `planned` and `violated`), so the seat retags both by hand. R-909 is a weak fit: it covers retired nana bash scripts, and its evidence (`REQUIREMENTS.md:974`) does not cite this check. |
| R-936 | retired (superseded by R-1050) | Was: "WHERE the platform is win32, the knowledge hook shall be wired with no VAR=value prefix." It existed only because the shell-form hook shells (cmd.exe before 2.1.47, and PowerShell) cannot run the prefix. R-1050's `command` is exactly `node`, so a prefix cannot appear. Its check at `win32-degrade.test.mjs:85` is rewritten under R-1050, title included. In exec form today's `startsWith("NODE_NO_WARNINGS=")` passes vacuously, so the rewrite asserts `command === "node"` and the shape of `args`. |
| R-985 | reworded (SUB-012) | The setup shall install and doctor-check the user-scope Node PreToolUse verifier hook on every platform. The clause "on POSIX and omit it on win32" is dropped. Its three win32 tests are rewritten: the two in `win32-degrade.test.mjs` (`:89`, `:100`) move under R-1051 and R-1053, and `verifier-pipe.test.mjs:128-129` checks the pack README's new Windows sentence. `:89` would pass silently in exec form (`entry.command.includes("verifier-pipe.mjs")` is false for `node`), so its rewrite reads `args`. Two more tagged checks pin the runtime matrix text "Bash PreToolUse Node hook", which is incomplete for win32: `templates-render.test.mjs:288-298` (`req: R-680 R-985`) and `verifier-pipe.test.mjs:122-123`. This lane does not change the matrix (section 4, NOT), so R-985 carries that gap as its residual. |
| R-984 | reworded (FEAT-010) | The installed Claude Code PreToolUse verifier hook shall emit `ask` with the predicate reason only on a hit, and otherwise abstain with empty stdout while reporting its errors on stderr. Was "Bash PreToolUse hook". R-1054 carries the PowerShell dialect. |
| R-319 | reworded (SUB-013) | WHERE the platform is not win32, paths the installer writes into hook commands shall be single-quoted with an embedded quote escaped, so a home or clone containing a space still runs. On win32 no path enters a command string (R-1050). The design comment at `settings.mjs:26` changes with this row. Its cited evidence (`install.test.mjs:329-330`) runs each command through `bash -c`; that block (`:316-330`) is gated to POSIX, which matches the new WHERE clause. |
| R-394 | unchanged; extended by R-1056 | "Install shall replace its own recognized stale knowledge-hook entry without appending a duplicate." Bug 4 is this row failing on win32 today. Its tagged check at `settings-merge.test.mjs:155-174` calls `mergeKnowledgeHook`; it moves to `mergeRepoHooks` and its new return, keeping the tag. |
| R-653 | reworded (FEAT-018) | The hook install migration shall preserve complete entries whose shape does not exactly match a form R-1056 recognizes on that platform, apart from the checkout path. Was "its generated command shape" (singular). "Shape" replaces "command", because an exec-form entry carries `args`. On POSIX the only recognized form is still the POSIX knowledge form, so behaviour there is unchanged. Its tagged checks at `settings-merge.test.mjs:155-174` move to `mergeRepoHooks`, keeping their tags. |
| R-923 | unchanged; cited | "A hand-written variant of a nana hook shall be kept as-is with no duplicate entry added." R-1056's "installer-shaped" decides what counts as hand-written. On win32, section 3's `entryInvokes` makes an exec-form variant count as present; on POSIX, R-1061 keeps today's reading. A new forced-win32 case pins it: a hand-written exec-form variant is kept and gets no twin. |
| R-301 | reworded (SUB-012) | WHERE the platform is not win32, the four Claude Code Node hooks and the three rules shall be installed into ~/.claude/ as symlinks into their source copies. The old qualifier "POSIX hooks" goes: the hooks have been Node since `c053b02`, and install links them only on POSIX. |
| R-349 | unchanged | The hook-file step is still skipped on win32 (`steps.mjs:102`), and doctor still marks it. |
| R-937 | reworded (FEAT-015) | Was: "WHERE the platform is win32, doctor shall mark every win32-skipped line and exit 0 without a ✗." On win32 the Node row and the five settings rows can now be a real ✗, so doctor can exit 1. Becomes: "WHERE the platform is win32, doctor shall mark every win32-skipped line, and no win32 skip shall produce a ✗ or a non-zero exit." R-1060's floor row is a note, not a ✗. |
| R-684 | reworded (FEAT-019) | The Windows clause "no Claude Code hook except the knowledge pull" becomes "the Claude Code hooks run from the checkout and need Claude Code 2.1.139 or later". These change together: the canonical line in `packages/nana-pack/tests/templates-render.test.mjs:316`, `README.md:5`, `AGENTS.md:5` and `packages/nana-setup/README.md:374`. The canonical line builds the version from `CLAUDE_CODE_EXEC_FLOOR` by name. `CLAUDE.md` is a symlink to `AGENTS.md`, not a fifth copy. The new wording must not trip the broad-parity scan at `templates-render.test.mjs:277-278`. |
| SUB-015 purpose | reworded | Was "Skip unsupported Windows integrations and maintain supported copies and mirrors without overwriting owner content." Becomes "Wire supported Windows integrations in their platform form, skip unsupported ones, and maintain supported copies and mirrors without overwriting owner content." |

R-393 keeps its text, and R-1055 extends doctor's check to all five win32 rows. R-344 keeps its text, and R-1057 extends it to win32. The requirement tree changes with this delta:
- regenerate `docs/requirements-tree.md`;
- update the leaf total at `packages/nana-pack/tests/requirements-tree.test.mjs:38` and `:52` to the regenerated count. It is 1,056 at `7e6ce39`; it was 1,033 at `c22bab5`, before product-report.

## 3. Design

- **`settings.mjs` `desiredHooks({ hooksDir, repoRoot, platform })`.**
  - When `platform` is absent or not `"win32"`, the output is byte-identical to today (`:122-178`). The callers that pass no platform keep the POSIX output: `uninstall.mjs:24`, `migrateLegacyHooks` (`:340`) and the tests. `stepSettings` and doctor pass `platform()`.
  - win32 script paths:
    - the four hooks: `${repoRoot}/packages/nana-setup/claude/hooks/<hook>.mjs`;
    - the knowledge pull: `${repoRoot}/packages/nana-knowledge/bin/nana-knowledge.ts`, the string today's code already builds (`:131`).
  - Each win32 entry is `{ type: "command", command: "node", args: [<path>], timeout: 5, statusMessage }`. The knowledge entry's `args` is `[<path>, "hook"]`.
  - There is no `shell` field, which is "Ignored when `args` is set" anyway (hooks#command-hook-fields).
  - There is no `NODE_NO_WARNINGS`. Exec form has no place for an environment variable. `--no-warnings` in `args` would suppress warnings, but the lane does not add it. Chosen: it keeps `args` to the script and `hook`, as R-1050 says, and the win32 knowledge entry already runs without suppression today (`steps.mjs:509`).
  - Each `spec` is unchanged (`interpreters: ["node"]`, `script`, `args`), so the readers below match both forms with one spec.
  - The verifier matcher on win32 is `WIN_VERIFIER_MATCHER`.
  - The module header changes (`settings.mjs:4-8`). Its inputs gain the platform. Its outputs name `entryInvokes`, `hookTargets`, `mergeRepoHooks` and the two constants.
- **The `settings.json` shape on win32.** This follows the documented exec-form entry: `"command": "node", "args": [<script>]` (hooks#exec-form-and-shell-form), and the PreToolUse example in hooks#block-the-action-when-a-hook-fails. `timeout` and `statusMessage` are common fields (hooks#common-fields), and no other field is required. The checkout path below is illustrative:

  ```json
  {
    "hooks": {
      "SessionStart": [
        { "hooks": [
          { "type": "command", "command": "node", "args": ["C:\\Users\\owner\\nana-pi/packages/nana-setup/claude/hooks/nana-objective.mjs"], "timeout": 5, "statusMessage": "nana: objective + current priority" },
          { "type": "command", "command": "node", "args": ["C:\\Users\\owner\\nana-pi/packages/nana-setup/claude/hooks/nana-adoption.mjs"], "timeout": 5, "statusMessage": "nana: unadopted repositories" },
          { "type": "command", "command": "node", "args": ["C:\\Users\\owner\\nana-pi/packages/nana-setup/claude/hooks/nana-shared-memory.mjs"], "timeout": 5, "statusMessage": "nana: shared memory index" }
        ] }
      ],
      "PreToolUse": [
        { "matcher": "Bash|PowerShell", "hooks": [
          { "type": "command", "command": "node", "args": ["C:\\Users\\owner\\nana-pi/packages/nana-setup/claude/hooks/verifier-pipe.mjs"], "timeout": 5, "statusMessage": "nana: verifier pipe" }
        ] }
      ],
      "UserPromptSubmit": [
        { "hooks": [
          { "type": "command", "command": "node", "args": ["C:\\Users\\owner\\nana-pi/packages/nana-knowledge/bin/nana-knowledge.ts", "hook"], "timeout": 5, "statusMessage": "nana: knowledge pull" }
        ] }
      ]
    }
  }
  ```

  In `settings.json` the backslashes appear doubled, because that is JSON escaping. `node` receives single backslashes.
- **Why exec form, and why only on win32.**
  - Exec form passes each `args` element "exactly as written". So the win32 writer needs no quoting rule and no refused characters. Shell flags, profile output and `CLAUDE_CODE_SHELL_PREFIX` wrapping play no part either ("PowerShell hooks and exec-form hooks run without the prefix", https://code.claude.com/docs/en/env-vars).
  - The owner runs 2.1.296, and exec form needs 2.1.139.
  - The path is not rewritten. The root keeps its native separators and the suffix uses `/`. That is the same mixed string today's win32 knowledge entry hands to `node`. The suffix test `endsWith('/<script>')` (`settings.mjs:118`) reads it unchanged.
  - The earlier forward-slash rewrite existed only for Git Bash's backslash handling, which exec form never meets.
  - macOS and Linux keep shell form with single quotes. It works on every Claude Code version. Switching would rewrite every POSIX user's entries and change R-653's preserve rule and the golden file. That would put the blast radius on machines this lane is not about. The same reason keeps POSIX reading by `command` alone (R-1061).
- **Constants** are defined beside `shq` in `settings.mjs`, each with its provenance:
  - `WIN_VERIFIER_MATCHER = "Bash|PowerShell"`. Contract value: hooks#powershell and hooks#matcher-patterns, read 2026-10-12.
  - `CLAUDE_CODE_EXEC_FLOOR = "2.1.139"`. Contract value: the 2.1.139 changelog entry that added `args`, read 2026-10-12. Doctor's note row and R-684's canonical line read it by name.
  - One test pins each constant, naming R-1053 and R-1060.
- **Reading entries in either form.**
  - A new `entryInvokes(hook, spec, platform)` is exported beside `commandInvokes`. Both run one shared check on an argv: argv[0]'s base name is an interpreter, argv[1] ends with `/<script>`, and the extra words match `args`.
    - On win32, exec form applies when `args` is present. `args` must be an array of strings. `args: []` is exec form too (the docs' examples use it), and it invokes no script. The argv is `[command, ...args]`. No `VAR=value` word is skipped, because exec form has no shell to read one: `command: "NODE_NO_WARNINGS=1"` is not `node`.
    - On win32 without `args`, and on every other platform, it calls `commandInvokes(hook.command, spec)`, which is unchanged. So POSIX reads every entry by `command` alone, as `main` does (R-1061).
    - On win32, a non-array `args`, or a non-string element, reads as not installed. This follows the conservative rule at `:106-107`.
  - `hasHook` takes the platform and calls `entryInvokes(h, spec, platform)` in place of `commandInvokes(h?.command, spec)` (`:203`). Callers that pass no platform keep `main`'s reading.
  - `mergeRepoHooks` (below) matches the installer's own entries first, so a second install never asks `hasHook` about them. `hasHook` decides presence only for variants that are not installer-shaped (R-923). On win32 an exec-form variant then counts as present, and `mergeHooks` adds no twin. Doctor's five win32 rows also read through `hasHook` (R-1055).
  - A new `hookTargets(settings, event, spec, platform)` lists the script path of every entry under the event, in any group, that invokes the script. It reads exec form on win32 only, like `entryInvokes`. `knowledgeHookHealthy` (`:298-319`) keeps its meaning but reads through `hookTargets`: at least one target, and every target absolute and resolving inside the checkout.
  - `removeInstallerHooks(settings, { hooksDir, repoRoot, platform })` only forwards `platform` to `desiredHooks`.
    - It already compares whole canonical objects (`:248`), and that comparison includes `args`. So it removes an exec-form entry only when every field equals the installer's.
    - Uninstall passes no platform and still refuses on win32 (`uninstall.mjs:41`, lane 4). One pure case pins the win32 behaviour, so lane 4 starts from a tested function.
- **`steps.mjs` `stepSettings`.**
  - Delete the win32 filter and the prefix strip (`:505-509`), and the out-of-date skip wording (`:516`). Pass `platform()` to `desiredHooks`.
  - The repo-anchored set is all five entries on win32, and the knowledge entry on POSIX.
  - `stepHooks` (`:102`) is unchanged: install links and copies nothing into `~/.claude/hooks` on win32.
  - The `.sh` migration stays POSIX-only (`:524`). win32 has only ever written the knowledge entry (`:505-509`).
  - There is no refusal path (R-1052 is withdrawn).
- **One repair for entries anchored in the checkout.**
  - `installerKnowledgeTarget(command)` (`:91-97`) becomes `installerTarget(hook, wanted, platform)`. It returns `{ target, form }` or null.
    - It accepts the POSIX knowledge form on every platform: today's check (`:93-96`). On POSIX the check is today's, byte for byte (R-1061). On win32 it also requires that `args` is absent.
    - On win32 only, it accepts the earlier win32 knowledge form. `args` must be absent. The tokens must be `node`, a path and `hook`, and the command must equal `node ${shq(target)} hook` exactly.
    - On win32 only, it accepts the R-1050 exec form. `command` must be `node`. `args` must have the installer's length. `args[0]` must be absolute and end with the entry's repo suffix. Any later element must equal the installer's.
    - The `args`-absent rule on win32 makes the repair read an entry the way `entryInvokes` and Claude Code do. Without it, an entry carrying `args` would be shell form to the repair but exec form to everything else.
    - It rejects every other form (R-653, R-923).
  - `mergeKnowledgeHook` (`:268-296`) becomes `mergeRepoHooks(settings, { repoRoot, wanted, platform })`. It handles each repo-anchored entry that R-1056 names.
    - It scans entries under that entry's event. Where the entry has a matcher, it scans only groups with that matcher. Otherwise it scans every group, as the knowledge scan does today (`:269-273`).
    - The timeout and status-message gate stays (`:276`), and so does replacement in place (`:291`).
    - It replaces an entry when its target is missing or outside the checkout (R-1056). On win32 it also replaces an entry whose form is not exec form (R-1059).
    - A POSIX replacement changes `command` only, so the replaced object is byte-identical to today's. A win32 replacement sets `command: "node"` and `args`. Any other key the entry carried is kept, as today.
    - It returns, per label, whether an installer-shaped entry was found and whether it was replaced. `stepSettings` passes to `mergeHooks` only the entries with no installer-shaped match. `mergeHooks` then appends each one unless `hasHook` finds a variant.
    - The rename breaks the tagged checks at `settings-merge.test.mjs:23` and `:155-174`, which import `mergeKnowledgeHook` and expect `{ replaced, added, staleValid }`. They move to the new name and return (section 4).
- **Doctor.**
  - On win32, each of the five settings rows is ✓ when `hasHook` finds the entry under the expected event and matcher, and every target from `hookTargets` resolves inside the checkout (R-1055; `doctor.mjs:379-392`). A failing row names the script and says that its target is missing or outside the checkout.
  - On POSIX the four rows keep `hasHook`, and the knowledge row keeps `knowledgeHookHealthy`, both reading as today (R-1061).
  - Remove the win32 skip of the Node floor check (`:296`). `spawnSync("node", …)` should find `node.exe` on PATH (INFERRED; the Windows leg checks it).
  - On win32, add one note row for R-1060: the Claude Code hooks need Claude Code `CLAUDE_CODE_EXEC_FLOOR` or later, and doctor does not check it.
  - The hook-file rows keep "skipped (win32)" (`:335`).
  - A win32 skip still produces no ✗ (R-937, reworded). A ✗ on the Node row or a settings row is a real fault.
  - The module header names the new note row.
- **`verifier-hook.mjs` `decideHook`** (`:14`).
  - Accept `tool_name` `Bash` or `PowerShell`. The PowerShell tool's input "fields match the Bash tool, with the command string in `command`" (hooks#powershell).
  - For PowerShell, call the predicate with `"powershell"` (`verifierPipeReason(command, "powershell")`, `pipe-guard.mjs:85`).
- **`pipe-guard.mjs` `liveText(command, dialect)`** (R-1062; sol plan r1 MUST 1). Today the dialect changes only the pipefail rule; `liveText` (`:17-75`) lexes every command as Bash, so in PowerShell a backtick reads as command substitution, `\"` as an escape, and here-strings and block comments are not seen. For `powershell` it gets its own lexer:
  - a single-quoted string runs to the next `'` not doubled (`''` is a literal quote); nothing inside is live;
  - a double-quoted string runs to the next `"` not doubled and not backtick-escaped; nothing inside is live EXCEPT a `$( … )` subexpression, whose contents are lexed again as live PowerShell (nesting counted);
  - a here-string starts with `@'` or `@"` at the end of a line and ends at a line that begins with `'@` or `"@`; nothing inside is live, except `$( … )` in the `@"` form;
  - outside strings, a backtick escapes the next character (`` `| `` is not a pipe), `#` starts a comment to the end of the line, and `<# … #>` is a block comment;
  - the Bash path is byte-for-byte unchanged (every existing pipe-guard case keeps its result).
  - Blast radius: the pi seat's `nana-gate` uses the same predicate for PowerShell (CLAUDE.md runtime table), so its PowerShell judgments get the same correction. That is the intended effect, and the existing gate-corpus tests must stay green.
  - POSIX keeps the `Bash` matcher, which filters out any PowerShell event there (see the residual below).
- **Header only:** `claude/hooks/verifier-pipe.mjs` keeps its code. Its purpose line, "one Claude Code Bash PreToolUse event", becomes "one Claude Code Bash or PowerShell PreToolUse event".
- **Unchanged:** the code of the four hook scripts, `lib/hook-producer.mjs`, the knowledge CLI, `lib/uninstall.mjs` and `.github/workflows/ci.yml`.

**Rejected.**
- Copies or generated stub files in `~/.claude/hooks`. Copies break the `../../lib` imports. Stubs are one more file to keep in step, for no gain over naming the checkout path.
- Shell form on win32, with double or single quotes. It needs quoting rules for two shells and a refused-character set. It also carries residuals for profile output, shell flags and PowerShell stdin. Exec form needs none of these.
- cmd.exe support. Claude Code before 2.1.47 used cmd.exe for PreToolUse and PostToolUse hooks; the changelog names only those two events. The exec form this lane writes needs 2.1.139 anyway.
- Exec form on POSIX, for the blast-radius reason above. Reading exec form on POSIX is rejected for the same reason (outcome 6).
- A doctor probe of `claude --version`. On Windows `claude` may be a `.cmd` shim, which brings back the launch problem `pi-cmd-launch` solved for pi. That is not worth it for a floor the owner already exceeds. The floor is stated, not checked.

**Decision (2026-10-12).**
- The owner answered the plan's open questions. His Windows machine runs Claude Code 2.1.296, the same version as this Mac. That is past 2.1.139 (exec form) and past 2.1.47 (cmd.exe no longer the shell for PreToolUse and PostToolUse hooks).
- On that fact the seat decided the following:
  - On win32, the installer writes every hook it owns in exec form.
  - cmd.exe support is dropped, with its test cases and the `%` refusal.
  - macOS and Linux stay exactly as today, in shell form with single quotes, and read entries by `command` alone (R-1061), to keep the blast radius small.
  - The README and doctor state that the Windows hooks need Claude Code 2.1.139 or later.
- A draft pull request for the Windows CI run needs no approval (Owner, 2026-10-11, in the header). The general question at `HANDOFF.md:79`, whether the land helper should open a draft for every lane, stays with the owner. It does not block this lane.
- No item from this plan is open for the owner now. His machine check runs last.

**Declared limits and residuals.**
- **Stale paths after a move.** When the checkout moves, all five entries are stale until install runs again. `nana-setup` is not on PATH on win32 (`steps.mjs:687`), so the command is `node <checkout>\packages\nana-setup\bin\nana-setup.mjs install`.
- **Claude Code before 2.1.139.**
  - The docs do not say what an older version does with `args`.
  - INFERRED: an older version ignores `args` and runs `node` alone through its hook shell. `node` then reads the hook's JSON from stdin as a program and fails with a syntax error. Every hook fails open, and the verifier abstains.
  - Another failure is equally undocumented: an older settings check might reject the unknown field, or ignore it (INFERRED).
  - The Support lines and doctor's note row state the floor. The owner runs 2.1.296.
- **The real exec-form spawn on Windows.**
  - Windows hands a child process one command line, not an argument vector. Claude Code must find `node` on PATH and quote each `args` element so that `node.exe` splits the line back into the same elements.
  - The docs make that split a contract: "each `args` element is one argument exactly as written", and "No shell tokenization happens on any platform". They give `C:\Program Files\nodejs\node.exe` as "a single valid executable".
  - The Windows leg spawns with Node's `child_process` and no shell. That Claude Code meets the contract the same way in practice is INFERRED. A spawner that quotes differently would split a path that has a space in it.
  - The owner's machine check runs the real spawn, but only with his own checkout path, which may contain no space or special character.
- **`node` must be a real executable.**
  - The docs say that "On Windows, exec form requires `command` to resolve to a real executable such as a `.exe`."
  - A `node.cmd` or `.bat` shim cannot start. Then every hook fails open. From 2.1.296 the debug log marks such a run `failed to start` (hooks#debug-hooks, read on the raw page 2026-10-12).
  - The docs say only that Claude Code "resolves `command` as an executable on `PATH`". They do not say how it uses PATHEXT. They do not say which file wins when an earlier PATH folder holds `node.cmd` and a later one holds `node.exe`.
  - The changelog suggests Claude Code looks up subprocess executables with `where.exe` (2.1.117: "cached `where.exe` executable lookups per process"; 2.1.140). That it does so for hooks is INFERRED. That it would pick a shim over a later `node.exe` is unverified.
  - The official installer, nvm-windows, Volta and Scoop each put a `node.exe` on PATH (INFERRED).
- **`node` on PATH.** R-1057's `spawnSync("node")` resolves `node` from doctor's PATH. Exec form resolves it from Claude Code's own PATH, which comes from wherever Claude Code was started. A ✓ does not prove that both find the same `node`.
- **Timeouts fail open.**
  - The docs say: "A timed-out `command` … hook doesn't block the tool call … don't count on a stalled hook to act as a gate" (hooks#timeouts).
  - Exec form removes Git Bash start-up from the 5 s budget. Node start-up remains, plus any first-run antivirus scan (INFERRED that it fits). If the verifier times out, the commit goes through.
  - The Windows leg records each run's duration. From 2.1.296, the owner's debug log records each hook's duration.
  - `onFailure: "block"` needs 2.1.295. This lane does not use it.
- **`CLAUDE_PROJECT_DIR` form.**
  - Both forms export the variable to the spawned process (hooks#exec-form-and-shell-form). The objective and adoption hooks pass it on as `--cwd` (`lib/hook-producer.mjs:32-33`).
  - The docs do not say whether it arrives in `C:\` form or `/c/` form. In exec form no Git Bash layer sits between Claude Code and `node`, so the value is Claude Code's own.
  - Indirect evidence points to the native `C:\` form (INFERRED):
    - the docs' PowerShell hook example, `"& \"$env:CLAUDE_PROJECT_DIR\\.claude\\hooks\\check.ps1\""`, works only with a native path;
    - hooks#pretooluse-input says file paths "arrive with backslash separators, even when your hook runs under Git Bash where `$PWD` looks like `/c/project`". That sentence is about `tool_input.file_path` only.
  - The owner's throwaway hook (section 5) confirms the form.
- **The claim most likely to be wrong** is that Node's no-shell spawn on the Windows leg models how Claude Code spawns an exec-form hook on Windows. The argument split is a documented contract. The open part is which `node` Claude Code finds, whether its quoting meets the contract in practice, and its environment and working folder. This is the seat's judgment. A green Windows leg may not carry over. The owner's machine check is the only test of the real spawn.
- **Hand-written exec-form variants on win32.**
  - An entry can name `node` by full path or as `node.exe`, or name the script with backslashes only. Such an entry reads as not installed under the conservative rule (`settings.mjs:106-107`), and install appends its own entry beside it.
  - R-923 on win32 covers only variants that name `node` and a `/`-suffixed script.
  - Uninstall's variant report (`uninstall.mjs:31-33`) and the retired-bash scans (`steps.mjs:483-501`, `doctor.mjs:39-53`) read `command` only, so they never report an exec-form variant. Uninstall is lane 4.
- **POSIX entries carrying `args`.** On POSIX install and doctor read `command` alone, as `main` does (R-1061). Claude Code runs an entry carrying `args` in exec form, so install and doctor can misread a hand-made one. That gap predates the lane. Nothing on POSIX writes such an entry.
- **No `NODE_NO_WARNINGS` on win32.** Exec form cannot set an environment variable, and today's win32 knowledge entry already runs without it (`steps.mjs:509`). `--no-warnings` in `args` could suppress warnings; the lane does not add it (section 3). A Node warning, if one prints, goes to stderr, as it does on win32 today.
- **An old form install does not recognize.** The unquoted knowledge form that `54b5088` wrote, and `b39518f` fixed the same day, is not in R-1056's list. The risk is low.
- **`CLAUDE_CONFIG_DIR`.** This limit predates the lane and is not specific to Windows.
  - The installer ignores the variable: `lib/paths.mjs:39-40` uses `<home>/.claude`.
  - The shared-memory hook honours it (`nana-shared-memory.mjs:32`).
  - With the variable set, Claude Code reads its settings from that folder (https://code.claude.com/docs/en/settings). So install would write a `settings.json` that Claude Code never reads.
  - This lane does not change that.
- **The PowerShell tool on POSIX.**
  - macOS, Linux and WSL can turn the tool on with `CLAUDE_CODE_USE_POWERSHELL_TOOL=1`, which also requires `pwsh`.
  - POSIX keeps the `Bash` matcher (outcome 6), so a session with the tool on gets no verifier guard.
- **The runtime matrix (R-985; sol plan r1 MUST 3).** The `_shared` matrix (`templates/_shared/working-under-nana-pi.md`, mirrored in this repo's AGENTS.md and CLAUDE.md regions) says "Bash PreToolUse Node hook" for the Claude Code seat. This lane changes the cell to "PreToolUse Node hook `verifier-pipe.mjs` (matcher `Bash` on macOS and Linux, `Bash|PowerShell` on Windows)", updates both tagged checks (`verifier-pipe.test.mjs:122-123`, `templates-render.test.mjs:288-298`), keeps the three copies byte-identical (R-859), and runs `template:accept`. The next main build cuts a template tag through CI as usual.
- **Product report assessments.** The stamps in `docs/product-report/assessments.json` carry rows this lane changes:
  - FEAT-010: R-984;
  - FEAT-013: R-985, R-301, R-319, R-923, R-387 and R-936;
  - FEAT-015: R-985, R-937, R-344 and R-393;
  - FEAT-018: R-394 and R-653;
  - FEAT-019: R-684.

  The report will mark these "out of date" after the land. No check fails on that. Refreshing them is not in this lane.
- **Windows-leg coverage of the rewritten README checks.** `verifier-pipe.test.mjs` crashes at `:37` on the Windows leg, because no hooks folder exists on win32 (`fs.realpathSync` on the missing link). So its rewritten `:128-133` checks run only on the POSIX legs. Lane 6 owns that file's portability.
- **Uninstall (sol plan r1 SHOULD 1).** Uninstall refuses on win32 before anything else (`uninstall.mjs:41`), before this lane and after it. The five entries this lane writes join that existing gap: until the Windows install-shape lane adds Windows uninstall, someone removes them by hand. The pure `removeInstallerHooks` case pins only that function; this plan does NOT claim Windows uninstall works.
- **Console flash.** The detached index rebuild sets no `windowsHide` (`packages/nana-knowledge/lib/hook.ts:51-69`), so a console window may flash (INFERRED). This lane does not change it.
- **Gone with exec form.** These no longer apply to the five win32 entries:
  - profile output from Git Bash or PowerShell;
  - the undocumented hook-shell flags;
  - PowerShell stdin;
  - the cmd.exe cases;
  - the refused characters, smart quotes and `!`;
  - the UNC backslash collapse;
  - `CLAUDE_CODE_SHELL_PREFIX`.

  On macOS and Linux, shell form behaves exactly as it does today.

## 4. Scope

**In.**
- Code:
  - `packages/nana-setup/lib/settings.mjs`, including its module header and the comment at `:26`;
  - `steps.mjs` (`stepSettings` only);
  - `doctor.mjs` (the Node floor row, the hook settings rows, the floor note row and its header);
  - `verifier-hook.mjs`;
  - `packages/nana-pack/lib/pipe-guard.mjs` (`liveText` gains the PowerShell lexer, R-1062) and `packages/nana-pack/tests/pipe-guard.test.mjs`;
  - the runtime matrix cell in `templates/_shared/working-under-nana-pi.md` and its two byte-identical copies (`AGENTS.md`, `CLAUDE.md` regions), with `verifier-pipe.test.mjs` and `templates-render.test.mjs`;
  - the header of `claude/hooks/verifier-pipe.mjs` (purpose line only).
- A new test, `packages/nana-setup/tests/hooks-win32-exec.test.mjs`, which runs on the Windows leg only.
  - The other legs skip it through a declared entry in `scripts/test.mjs` (`SKIPS`, `:155`).
  - Without that entry, the runner fails an exit-0 file that printed no PASS line (`:372-374`). `packages/nana-pack/tests/test-runner.test.mjs:222` pins that behaviour.
- New forced-win32 cases:
  - in `settings-merge.test.mjs`, including a hand-written exec-form variant that is kept with no twin (R-923);
  - in `win32-degrade.test.mjs`, rewriting `:65-67`, `:81-89` and `:100`, including the title at `:85`:
    - `:81-82` collect `h.command` from UserPromptSubmit only, which becomes `"node"`; the rewrite reads all five entries and their `args`;
    - both R-387 tags (`:83`, `:86`) move, to R-1051 and R-1050;
    - `:85`, `:87` and `:89` would pass vacuously in exec form, so the new checks assert `command === "node"` and the shape of `args`;
  - in `doctor-detail.test.mjs` (or `win32-degrade.test.mjs`):
    - the floor note row and its constant pin (R-1060);
    - a stale or out-of-checkout target giving ✗ on its settings row (R-1055);
    - the Node row running instead of skipped (R-1057).
- New POSIX pure cases for R-1061 in `settings-merge.test.mjs`.
- The hook-related assertions only in:
  - `install.test.mjs`:
    - `:128` and `:131-132` read entries through `entryInvokes`;
    - `:136` reads the knowledge path from `args` on win32;
    - `:316-330` is gated to POSIX. It runs each command through `bash -c`, and on win32 `:324` gets `undefined`, so `spawnSync` throws. The block carries R-319's evidence (`:329-330`), which matches R-319's new WHERE clause. Today the Windows leg crashes earlier in this file, at check 39.
  - `settings-merge.test.mjs:23` and `:155-174`, which import and call `mergeKnowledgeHook`; they move to `mergeRepoHooks` and its return, keeping their R-394 and R-653 tags;
  - `verifier-pipe.test.mjs`: `:128-129` (the pack README's Windows sentence) and `:133` (the setup README's knowledge-migration sentence, whose required prefix stays);
  - `shared-memory-hook.test.mjs` (pass USERPROFILE);
  - `hook-producers.test.mjs` (`path.join` instead of `/clone/…`, `:30-32`).
- `REQUIREMENTS.md`, including the row changes, the two retirements and SUB-015's purpose line.
- `docs/requirements-tree.md`, regenerated, and `requirements-tree.test.mjs:38` and `:52` (the leaf total).
- The code map.
- Front-door text:
  - the three Support lines (`README.md:5`, `AGENTS.md:5`, `packages/nana-setup/README.md:374`) and the canonical line at `templates-render.test.mjs:316`, which interpolates `CLAUDE_CODE_EXEC_FLOOR`;
  - setup README `:44` (the win32 exec form beside the knowledge form, and the "On native Windows" sentence), `:59` (the verifier-pipe guard covers PowerShell on Windows), `:376` (Platforms, with the floor) and `:431` (the test table, which describes `win32-degrade` as "every posix-only step reporting `skipped (win32)`");
  - pack README `:40` ("The Claude Code Bash hook is not wired on native Windows by nana-setup.").
- `HANDOFF.md`, including the correction at `:58`, and the session entry. The seat writes both before the final review.
- Outside the repo, the seat updates the shared memory note `reference_claude_code_hooks_windows.md`: its description (`:3`) and its "How to apply" line (`:16`) move to exec form. Its `:9` and `user_owner_windows_both_seats.md:10` were already corrected on 2026-10-12.

**NOT.**
- The desk.
- The pi seat's Windows changes. Lane `pi-cmd-launch` has landed.
- The install-and-hooks CI job, which is a separate parallel lane. This lane does not touch `ci.yml`.
- Test-portability files unrelated to hooks (lane 6):
  - nana-knowledge `discovery`, `hook` and `render`;
  - nana-pack `adoption-producer`, `adoption-reader` and `objective-golden`;
  - `state-manifest`. Once its hook-link checks can run, they follow R-349.
- `settings-merge.test.mjs:244` and `:315`, and `retired-artifacts.test.mjs:167` and `:172`.
  - They already fail on the Windows leg today (triage `:76`, `:144`), so exec form does not newly break them.
  - Both files stay red there for other reasons. `settings-merge` fails on mode bits (`:252`, `:355`, `:508`), the hooks symlink (`:526`) and the POSIX-only migration (`:549-559`). `retired-artifacts` fails on the win32 skill skips (triage `:134-140`).
  - After this lane their expected win32 entry is exec form. Lane 6 owns them.
- `verifier-pipe.test.mjs:37`, which crashes on the Windows leg (lane 6).
- The other Windows install gaps: skills, PATH commands, uninstall (including its exec-form variant report) and copy drift (lane 4).
- Exec form on macOS and Linux, and reading exec form there.
- Shell form and cmd.exe support on win32.
- Writing anything into `~/.claude/hooks` on win32.
- A doctor probe of `claude --version`.
- Refreshing the product report assessments that go out of date (section 3).
- The installer's handling of `CLAUDE_CONFIG_DIR`, and the PowerShell-tool gap on POSIX. Both are declared above.

## 5. Verification

- **Seat acceptance script**, written and red before the build: `docs/reviews/cc-hooks-windows-2026-10-12/acceptance.mjs`, run on macOS.
  - (a) Forced win32 (`NANA_SETUP_PLATFORM=win32`) install into a temp home whose path has a space, `$`, a backtick, `%` and an apostrophe:
    - five entries exist;
    - each has `command` `node`, an `args` array whose first element is exactly `<checkout>/<suffix>`, and `hook` as a second element for the knowledge entry only;
    - no entry has a `shell` key or a `VAR=value` word;
    - the four hook entries name `packages/nana-setup/claude/hooks/`;
    - the verifier group's matcher is `Bash|PowerShell`;
    - doctor shows ✓ on the five settings rows and on the Node row, plus the floor note naming 2.1.139;
    - `~/.claude/hooks` is absent or empty. A forced-win32 install never creates it, and `win32-degrade.test.mjs:68` asserts that it is absent;
    - a second forced-win32 install reports nothing to do. This pins `mergeRepoHooks` matching its own entries; it does not exercise `hasHook`.
  - (b) Each forced-win32 entry is spawned as exec form, `spawnSync(entry.command, entry.args, { shell: false })`, with sample stdin. Each gives the per-hook output listed below. On macOS this proves the entry runs the right script with the right words. It proves nothing about Windows quoting.
  - (c) Seeds that point at a missing checkout, one per temp home:
    - the R-1050 exec form;
    - the earlier win32 form `node '<path>' hook`;
    - the POSIX prefixed form.

    Install replaces each one in place with exec form, and doctor shows ✓. A further seed, the earlier win32 form pointing inside the checkout, is moved to exec form in place (R-1059). These seeds use POSIX paths, because POSIX `path.isAbsolute` rejects `C:\`.
  - (d) An unforced install writes a `settings.json` equal to a golden file captured from `main` at `c22bab5` before the build. The settings code is unchanged at `7e6ce39`.
    - Both installs use the same injected home.
    - The checkout path and the hooks folder are replaced by placeholders in both. `settings.json` embeds the hooks folder (`settings.mjs:125`, `:132`) and the checkout path (`:131`, `:172`).
  - (e) Tool `PowerShell` with `set -o pipefail; npm test | Select-Object -Last 5; git commit -m x` gives an ask. Tool `Bash` with the same command gives none.
- **Pure cases on every leg** (forced win32, injected `repoRoot`):
  - Win32 `desiredHooks` gets a `repoRoot` that holds a space, `$`, a backtick, `%` and an apostrophe:
    - each entry is exec form;
    - `args[0]` is exactly `<repoRoot>/<suffix>`, with nothing quoted or escaped;
    - only the knowledge entry adds `hook`;
    - no entry has a `shell` key.
  - POSIX `desiredHooks` deep-equals a fixture of today's output. Called with no platform, it deep-equals the same fixture.
  - `entryInvokes`:
    - on win32 it recognizes an exec-form entry;
    - on win32 a non-array `args` or a non-string element reads as not installed;
    - on win32 an exec `command` of `NODE_NO_WARNINGS=1` with `node` in `args` reads as not installed;
    - on POSIX a copied Windows exec fragment reads as not installed, and an entry carrying `args` with a shell-form `command` reads as `commandInvokes` reads its `command` (R-1061);
    - shell form keeps today's cases (`settings-merge.test.mjs:39-82`).
  - `hasHook` on win32 finds an exec-form entry under the expected event and matcher, and not under another matcher.
  - Forced win32: a hand-written exec-form variant (another status message) is kept byte for byte, and install adds no twin (R-923).
  - `installerTarget` accepts its forms on the right platforms. It rejects a hand-edited form: an extra `args` element, another status message, or a relative path. On win32 it rejects a shell form that carries `args`. On POSIX it rejects the two win32-only forms.
  - Forced-win32 `removeInstallerHooks` removes the exact five entries and keeps one whose `args` differ.
  - `decideHook` handles Bash and PowerShell with the pipefail-prefixed command.
  - Forced-win32 doctor: a stale or out-of-checkout target gives ✗ on its row (R-1055); the Node row runs (R-1057); the floor note row is present (R-1060).
  - Each constant is pinned by a test naming its row.
- **Windows leg: spawn every installed entry as exec form** (`hooks-win32-exec.test.mjs`).
  - **Setup.**
    - Add a `git worktree add --detach` of HEAD in a temp folder whose name contains a space, `$`, a backtick, `%`, an apostrophe, `&`, `(`, `)`, `;` and `^`. The last five matter only to a shell. They stay in the name to show that no shell is involved.
    - Clean up with `git worktree remove --force`, because the worktree registers under `.git/worktrees`.
    - The hook entry files' import closure is 28 files: the five entries, both producers and `nana-knowledge.ts`. It has one npm import.
      - At load (`:378`), `packages/nana-pack/lib/config.ts:369` starts `import("@earendil-works/pi-coding-agent")`.
      - `packages/nana-pack/bin/nana-objective.mjs:36` imports `config.ts`.
      - The import is dynamic and caught, so nothing crashes. In a detached worktree under a temp folder it cannot resolve, so the trust check fails closed.
      - The objective block should still print with trust failed closed (INFERRED). The objective case settles it.
    - A `%` in the checkout path also tests the scripts' own file-URL handling. The entries turn `import.meta.url` back into a path (`claude/hooks/nana-objective.mjs:12`, `packages/nana-knowledge/lib/hook.ts:58`). That `%` survives the round trip is INFERRED; the run settles it.
    - Run that copy's real `nana-setup install --home <temp home>` with no platform forcing. The temp home's name carries the same characters. Then read `settings.json`. `install --home` skips pi registration (`steps.mjs:984`), so no pi launch ever sees the `%`.
    - Seed `<temp home>/.pi/agent/npm/node_modules/pi-subagents/package.json` at the floor version, as `win32-degrade.test.mjs:37-41` does. Without it, doctor fails `pi pi-subagents` (`doctor.mjs:514`).
    - Set `CLAUDE_PROJECT_DIR` to a fixture project with an `OBJECTIVE.md`, under a folder whose name has the same characters.
    - Environment:
      - point HOME and USERPROFILE at the temp home;
      - set `CLAUDE_CONFIG_DIR` to `<temp home>/.claude`, or leave it unset. The shared-memory hook reads `<CLAUDE_CONFIG_DIR>/nana-memory/shared/MEMORY.md` (`:32-34`), and `install --home` writes under `<home>/.claude`;
      - put `NANA_KNOWLEDGE_HOME` under the temp home.
    - Seed the shared index with one `- [` line. The hook prints only its header, an optional note, and lines matching `^- \[` (`nana-shared-memory.mjs:87-89`). `MEMORY.seed.md` has no such line.
    - Before install, seed the entry today's code really writes on Windows: `node 'C:\…\checkout/packages/nana-knowledge/bin/nana-knowledge.ts' hook`. It has a backslash root and a forward-slash suffix, and it points at a missing checkout. Install must replace it in place with exec form, and doctor must then show ✓. Without this case, only POSIX paths pin the bug 4 fix.
  - **Spawn.**
    - First, the harness asserts that every entry has `command` `node`, an `args` array and no `shell` key.
    - Each entry then runs as `spawnSync(entry.command, entry.args, { shell: false, input, env, timeout: entry.timeout * 1000 })`: the command plus its args, with no shell. Each run gets its event's sample stdin and records its duration.
    - Node finds `node.exe` on PATH and quotes each element into the Windows command line. That Claude Code does the same in practice is INFERRED (section 3), though the docs make the split a contract.
    - There is no Git Bash, PowerShell or cmd.exe case, because exec form uses none of them.
  - **Expected output per entry.**
    - Objective: exit 0; stdout starts with `[nana:objective]` and contains no `OBJECTIVE UNAVAILABLE`.
    - Adoption: exit 0; no `ADOPTION UNAVAILABLE`.
    - Shared memory:
      - exit 0;
      - stdout starts with the `[nana:shared-memory]` header and contains the seeded `- [` line;
      - the project's `memory\shared` is a junction to the shared folder.
    - Verifier pipe:
      - the group's matcher in `settings.json` equals `WIN_VERIFIER_MATCHER`;
      - tool `Bash` with `npm test | tail -5; git commit -m x` gives one JSON line with `permissionDecision: "ask"`;
      - tool `PowerShell` with the pipefail-prefixed command gives an ask, and tool `Bash` with the same command gives none. This pins the dialect choice through the real spawn;
      - a command that does not match gives empty stdout.
    - Knowledge: exit 0 within the limit, and no module-resolution error on stderr. nana-knowledge's own tests pin its content, and lane 6 unblocks them.
    - Doctor, run on the same copy and home through `withPiStub` (`tests/stub-pi.mjs`) as `win32-degrade.test.mjs` does: ✓ on the five settings rows and on the Node row; the floor note row is present; exit 0.
  - **Reading the result.**
    - The Windows leg is non-blocking (`ci.yml:21`). This file is R-1058's only test, so no blocking leg pins that row.
    - CI runs only on a push to main or on a pull request (`ci.yml:2-5`), so pushing the branch runs nothing. A Windows run needs a draft pull request, which needs no approval (Owner, 2026-10-11).
    - The seat reads this file's lines in the Windows job log and records the run ID in R-1058's evidence. A green check is not evidence.
- **macOS regression:** case (d) above, plus `npm run test:locked` green.
- **PowerShell lexing cases (R-1062), on every leg in `pipe-guard.test.mjs` (sol plan r2 MUST 1: every case carries a live `git commit` outside the construct, so a lexer that exposes the pipe turns the case into an ask).**
  - Live (ask): `npm test | Select-Object -Last 5; git commit -m x`; `"$(npm test | Select-Object -Last 1)"; git commit -m x`; an expandable here-string whose body is `$(npm test | Select-Object -Last 1)`, then `git commit -m x`.
  - Recovery after an escaped or doubled double quote (a lexer that ends the string early or late fails here): `Write-Output "a`"b"; npm test | Select-Object -Last 1; git commit -m x` → ask; `Write-Output "a""b"; npm test | Select-Object -Last 1; git commit -m x` → ask; and the mirror cases where the quote is NOT closed until after the pipe (`Write-Output "a`" | b"; git commit -m x`, `Write-Output "a"" | b"; git commit -m x`) → no ask.
  - Not live (no ask), each followed by `; git commit -m x` or a newline and `git commit -m x`: `'npm test | x'`; `"npm test | x"`; ``npm test `| x``; `# npm test | x`; `<# npm test | x #>`; a single-quoted here-string `@'` … `npm test | x` … `'@`; an expandable here-string `@"` … `npm test | x` … `"@` (plain text, no `$( )`); `'it''s | x'`.
  - Every existing Bash case keeps its result.
- **Every hook label, not one representative (sol plan r1 NOTE).** The forced-win32 doctor cases (R-1055) and the migration cases (R-1056, R-1059) iterate all five hook labels.
- **Mutation pairs.** Each mutation breaks code, never an assertion, and the seat records which test goes red.
  19. Lex PowerShell as Bash (drop the dialect branch in `liveText`): the escaped-pipe, here-string, block-comment and backtick-escaped-quote recovery cases fail.
  20. Treat `$( … )` inside double quotes or an expandable here-string as inactive: both subexpression cases fail.
  22. End a double-quoted string at a backtick-escaped quote: the backtick recovery and mirror cases fail.
  23. Treat `""` inside a double-quoted string as a close-and-reopen pair that resets state wrongly: the doubled-quote recovery and mirror cases fail.
  24. Treat every here-string as single-quoted: the expandable here-string subexpression case fails.
  21. Leave the matrix cell as "Bash PreToolUse": the two matrix checks fail.
  1. Restore the filter at `steps.mjs:505-509`: the five-entry case fails on every leg, and every Windows spawn case fails.
  2. Write shell form on win32 (`node ${shq(path)}`, no `args`): the exec-shape case fails on every leg. On Windows the harness fails each entry before spawning, because the entry has no `args`.
  3. Quote the path inside `args` (`"'<path>'"`, a shell habit): the exec-shape case fails, because the element is not an absolute path. The Windows spawn cases fail, because `node` receives the quotes.
  4. Use matcher `Bash` on win32: the matcher case and R-1053's constant pin fail. Only the owner's machine checks Claude Code's own routing.
  5. Make `decideHook` reject PowerShell: the PowerShell ask cases fail on every leg and on Windows.
  6. Use the bash dialect for PowerShell: the pipefail-prefixed PowerShell case fails.
  7. Make `hasHook` read `command` only on win32 (drop the exec branch of `entryInvokes`):
     - the pure exec-form `hasHook` case fails;
     - the forced-win32 hand-written variant case fails, because install appends a twin (R-923);
     - forced-win32 doctor shows ✗ on the five rows (R-1055), so `win32-degrade`'s "no ✗" fails.

     "Second install reports nothing to do" stays green, because `mergeRepoHooks` matches the installer's own entries before `hasHook` is asked.
  8. Let `entryInvokes` skip a leading `VAR=value` word in exec form: the pure `NODE_NO_WARNINGS=1` exec case fails.
  9. Narrow `installerTarget` back to the prefixed form only (`settings.mjs:93`, `:96`): the win32 stale-repair cases fail, including the Windows-leg case with the real mixed-separator entry. This pins bug 4.
  10. Repair only stale entries on win32 (drop R-1059's clause): the healthy earlier-form case fails.
  11. Make doctor use `hasHook` alone on win32: the forced-win32 stale-target doctor suite case fails (R-1055).
  12. Skip the Node floor check on win32 again: the forced-win32 Node-row suite case fails (R-1057).
  13. Drop the floor note row on win32: the R-1060 doctor case fails. Retune `CLAUDE_CODE_EXEC_FLOOR`: its pin naming R-1060 fails, and the R-684 front-door check fails until the three Support lines say the same.
  14. Send POSIX through exec form: the macOS golden case fails.
  15. Accept the win32-only forms on POSIX: the POSIX rejection case for `installerTarget` fails (R-653).
  16. Make `removeInstallerHooks` compare `command` only: the pure case that keeps an entry whose `args` differ fails.
  17. Read exec form on POSIX too (drop the platform gate in `entryInvokes`): the POSIX copied-fragment case fails (R-1061).
  18. Let `installerTarget` accept a win32 shell form that carries `args`: the pure win32 rejection case fails.
- **The owner's machine, last; the owner runs it.**
  - First, record:
    - the `claude --version` output at the time of the check. The owner reported 2.1.296 on 2026-10-12. Compare it against the floors 2.1.139 (exec form), 2.1.126 (PowerShell as the primary shell) and 2.1.296 (debug duration lines);
    - the account type, `CLAUDE_CODE_USE_POWERSHELL_TOOL`, any Bash deny rule, and any scoped `PowerShell(...)` permission rule;
    - whether `DISABLE_GROWTHBOOK`, `DISABLE_TELEMETRY`, `DO_NOT_TRACK` or `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` is set, and whether this is the first session after an install or upgrade;
    - whether `CLAUDE_CONFIG_DIR` is set.
  - Accept the workspace trust dialog for the test project first. The docs say: "Claude Code holds back hooks from every settings file, including your own `~/.claude/settings.json`, until you accept the workspace trust dialog for the folder, or for a parent directory whose trust extends to it" (hooks#workspace-trust).
  - Install from the branch tip with main merged in. Then start a Claude Code session with `claude --debug` in an adopted project.
  - Expected: the objective block and the shared-memory index appear, and a prompt gets the knowledge pull.
  - Ask Claude to run a piped verifier before `git commit`. That raises an ask. Record the `tool_name` the hook saw. Do not expect PowerShell: the account type, flag fetching or a Bash deny rule can leave the PowerShell tool off.
  - In the debug log, read each hook's `Hooks:` line for its finish status and duration against the 5 s timeout. A `failed to start` most likely means `node` did not resolve to a real executable. That reading is INFERRED: the docs list the ending, not its causes.
  - Add a throwaway exec-form SessionStart hook in the test project: `"command": "node"`, with `args` set to `-e` and a script that prints `process.execPath`, `process.version`, `process.env.CLAUDE_PROJECT_DIR` and `process.cwd()`. It settles which `node` Claude Code resolves, that node's version against 22.18, and the form of the project folder. Compare that `node` with the one doctor found.
  - This is the only check of these behaviours:
    - Claude Code's real exec-form spawn on Windows: how it finds `node` and how it quotes `args`;
    - the form of `CLAUDE_PROJECT_DIR`;
    - PowerShell routing;
    - hook latency.

## Seat fact-check (2026-10-12)

*This records the changes made to the first draft, before the owner's answer. The items about quoting, cmd.exe, the refused characters and the shell emulation are superseded by the revision below. The record stays as history.*

Two read-only checks reviewed the draft. One checked the code, the other checked the Claude Code docs and changelog. The docs were read on 2026-10-12, not against a pinned Claude Code version. Changes:
- **Base and dependencies.** The base moved to `c22bab5`, because `pi-cmd-launch` landed, and all line references moved with it. The golden file now comes from `c22bab5`. The draft did not name `feat/product-report`, which is now listed, with the row ranges it uses.
- **Hook shell.**
  - Current Claude Code does not use cmd.exe for hooks; versions before 2.1.47 did. The cmd.exe cases and the `%` refusal are now justified only by those versions.
  - The `:85` title is incomplete, not wrong.
- **Bash-only matcher.**
  - The "never fires there" quote is about Windows without Git Bash. Whether the PowerShell tool is on for the owner is now marked INFERRED.
  - Two more stale places are named: `HANDOFF.md:57` and the memory note line `:10`.
  - Deny rules can turn the PowerShell tool off.
- **Exec form.** Claude Code has accepted `args` since 2.1.139, and the docs endorse `node` plus the script path on Windows. Exec form moved from rejected to the owner's call. Its only surviving cost is the entry shape plus the owner's unknown version.
- **Quoting.**
  - The double-quote citation now points to hooks#security-best-practices.
  - The R-1052 regression is named as a trade, and the trade is open for the owner.
  - The rule that `"` cannot appear in a Windows path is documented (https://learn.microsoft.com/en-us/windows/win32/fileio/naming-a-file), so it is no longer INFERRED.
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
- **The owner's machine check.** It now records the version, account type, environment variables, `tool_name`, debug-log lines, the `node` it resolves and latency, and it accepts workspace trust first.
- **2026-10-12, second re-check of the exec-form revision.** A code check and a docs check re-read the revised plan, and the seat verified the disputed items. Changes:
  - **Base.** Product-report has landed: main is `7e6ce39`. It touched none of this lane's code or test files, so code references hold. HANDOFF references moved to `:58` and `:79`, and the leaf total is now 1,056.
  - **Mutation 7.** It could not turn the second-install case red, because `mergeRepoHooks` matches the installer's entries before `hasHook` is asked. The section 3 sentence is corrected. A new R-923 win32 variant case and the doctor rows now catch it.
  - **POSIX read side.** The declared read-side difference had three effects, two of them harmful. Exec form is now read only on win32, and new R-1061 keeps POSIX reading identical to `main`. Mutation 17 pins it.
  - **`installerTarget`.** On win32 the two shell forms require no `args`, so the repair and `entryInvokes` agree. Mutation 18 pins it.
  - **Rows.** R-937 is reworded, since win32 doctor can now show a real ✗. R-985 carries the matrix gap and cites `templates-render.test.mjs:288-298`. R-387's two tagged checks both move. R-1058 names its Windows-leg-only evidence.
  - **Tests and scope.**
    - `win32-degrade` refs are `:65-67` and `:81-89`, and its exec-form checks no longer pass vacuously.
    - Added: `settings-merge.test.mjs:23` and `:155-174`, `install.test.mjs:128`, `:136` and `:316-330` (POSIX-gated), named doctor suite cases for R-1055 and R-1057, and setup README `:431`.
    - `settings-merge.test.mjs:244`, `:315` and `retired-artifacts.test.mjs:167`, `:172` moved to NOT, because they are already red on Windows.
    - Now declared: the `verifier-pipe.test.mjs:37` crash and the out-of-date assessments.
  - **Line fixes.** The hooks folder is at `settings.mjs:125` and `:132`. The retired scans are at `steps.mjs:483-501` and `doctor.mjs:39-53`, and the uninstall report at `uninstall.mjs:31-33`.
  - **Docs.**
    - The PowerShell default depends on flag fetching.
    - The deny-rule effect applies on Windows with Git Bash, and two settings override it.
    - The `args` split is a documented contract.
    - PATH lookup and shim precedence are undocumented.
    - Placeholders are substituted inside `args`, and `%` passing through is INFERRED.
    - The `failed to start` cause is INFERRED.
    - The 2.1.47 entry names two events.
    - The "never fires there" reading is INFERRED.
    - Pre-2.1.139 field handling is unknown.
    - "On Windows," is restored to the quote, and the workspace trust quote is completed.
    - The `NODE_NO_WARNINGS` wording now names `--no-warnings`.
  - **Seat-verified disputes.** The raw hooks page ties `failed to start` and the duration lines to v2.1.296, not v2.1.200. The trace rail does not flag a live tag on a retired row, so the code check's INFERRED claim is wrong, and the seat retags by hand.

## Revision after the owner's answer (2026-10-12)

The owner reported that his Windows machine runs Claude Code 2.1.296, the same version as this Mac. The seat then chose exec form on win32. Changes:
- **Decision recorded.** "Open for the owner" is replaced by "Decision (2026-10-12)" in section 3.
  - Item 1 (shell or exec form) and item 2 (cmd.exe) are resolved by the version.
  - Item 3 (a pull request for CI) was already resolved by the owner's 2026-10-11 ruling in the header.
- **Outcomes.**
  - Outcome 1 is now exec form.
  - The refusal outcome is gone. In its place, the README and doctor state the 2.1.139 floor.
  - Outcome 4 adds the in-place move of today's win32 knowledge entry to exec form.
  - (Withdrawn by the second re-check, 2026-10-12.) An earlier draft said exec-form entries count as present on POSIX. The final design is R-1061: POSIX reads only `command`, as on main.
- **Rows.**
  - R-1050 and R-1058 are rewritten for exec form.
  - R-1052 is withdrawn.
  - R-936 is retired, superseded by R-1050.
  - R-1059 (form upgrade) and R-1060 (floor note) are added.
  - R-684 carries the floor in the Support line.
  - R-319 and R-653 are adjusted for entries that carry `args`.
- **Design.**
  - `winq`, `WIN_REFUSED_PATH_CHARS` and the forward-slash rewrite are removed.
  - Added: `entryInvokes`, `hookTargets`, `mergeRepoHooks` with a platform argument, `removeInstallerHooks` with a platform argument, `CLAUDE_CODE_EXEC_FLOOR`, and the exact `settings.json` shape.
  - Shell form on win32, cmd.exe support and a `claude --version` probe are rejected, with reasons.
- **Verification.**
  - The Windows leg spawns each entry with no shell, under paths with a space, `$`, a backtick, `%`, an apostrophe and five shell-only characters. Its Git Bash, PowerShell and cmd.exe runs are removed.
  - The acceptance script checks the exec shape, the floor note and a second install with no duplicates.
  - The mutation pairs are rewritten: 16 pairs.
  - The owner's check drops the Git Bash probes. It adds a throwaway exec-form hook and the `failed to start` debug line.
- **Residuals.**
  - Removed: profile output, shell flags, PowerShell stdin, cmd.exe, the refused set, UNC collapse and `CLAUDE_CODE_SHELL_PREFIX`.
  - Added: Claude Code before 2.1.139; the real exec-form spawn on Windows, now the claim most likely to be wrong; `node` as a real executable; hand-written exec-form variants on win32; no `NODE_NO_WARNINGS` on win32.
- **Memory.** Two lines were already corrected on 2026-10-12: `user_owner_windows_both_seats.md:10` and `reference_claude_code_hooks_windows.md:9`. The reference note's `:3` and `:16` still describe the double-quoted shell form, and the seat updates them.
- 2026-10-12, after sol plan r1 (SEND-BACK 70/100): PowerShell lexing added to the pipe guard (R-1062); R-1058 split into start (R-1058), SessionStart output (R-1063) and verifier output (R-1064), with its CI evidence named direct exec-form conformance; the runtime matrix cell updated in all three copies; Windows uninstall stated as a gap this lane does not close; doctor and migration cases iterate all five labels.
- 2026-10-12, after sol plan r2 (SEND-BACK 86/100): every R-1062 negative case carries a live commit; recovery cases after backtick-escaped and doubled double quotes, with mirrors; expandable here-string text and subexpression cases; R-1062 states the expandable here-string exception; three more lexer mutation pairs; the stale POSIX read-side line marked withdrawn.
