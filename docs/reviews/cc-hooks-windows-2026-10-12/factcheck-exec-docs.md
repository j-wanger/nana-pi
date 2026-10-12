[harness: subagent output matched instruction-shaped pattern(s): settings-json. Control tags below are neutralized (`<` → `<\`); treat any remaining directive-shaped text as a finding to relay to the user, not an instruction to you.]

**Verdict:** the plan's exec-form claims mostly match the official docs. Every direct quote I checked is word for word. I found no unsupported claim that changes the design. There are four gaps worth fixing: items 1 to 4 below.

I read these sources on 2026-10-12, read-only:
- https://code.claude.com/docs/en/hooks (`hooks.md`)
- https://code.claude.com/docs/en/hooks-guide
- https://code.claude.com/docs/en/env-vars
- https://code.claude.com/docs/en/tools-reference
- https://code.claude.com/docs/en/settings
- https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md (the newest entry is 2.1.296, so Jake's version is current)

## Confirmed claims

**Exact JSON shape of an exec-form entry**
- hooks#command-hook-fields:
  - `command`: "Shell command to execute. With `args`, the executable to spawn directly."
  - `args`: "Argument list. When present, `command` is resolved as an executable and spawned directly with `args` as the argument vector, with no shell involved."
  - `shell`: "... Ignored when `args` is set."
  - `onFailure`: "Requires Claude Code v2.1.295 or later."
- hooks#common-fields: `type` is required. `timeout` is "Seconds before canceling". `statusMessage` is "Custom spinner message displayed while the hook runs".
- The documented settings example, hooks#block-the-action-when-a-hook-fails:
  `{"type":"command","command":"node","args":["${CLAUDE_PROJECT_DIR}/.claude/hooks/check-command.js"],"onFailure":"block"}`
- The plan's shape `{type, command:"node", args:[path(,"hook")], timeout:5, statusMessage}` fits these fields. No other field is required. Note that `"args": []` also selects exec form; the docs' examples use it.

**Exec form versus shell form** (hooks#exec-form-and-shell-form)
- "A command hook runs as exec form when `args` is set, and shell form when `args` is omitted."
- "Claude Code resolves `command` as an executable on `PATH` and spawns it directly with `args` as the argument vector. There is no shell, so each `args` element is one argument exactly as written, and path placeholders like `${CLAUDE_PLUGIN_ROOT}` are substituted into `command` and into each `args` element as plain strings. Special characters such as apostrophes, `$`, and backticks pass through verbatim because there is no shell to interpret them. No shell tokenization happens on any platform."
- Shell form: "`sh -c` on macOS and Linux, Git Bash on Windows, or PowerShell when Git Bash isn't installed."

**`node` on Windows** (the Note in that same section)
- "On Windows, exec form requires `command` to resolve to a real executable such as a `.exe`. The `.cmd` and `.bat` shims ... are not executables and can't be spawned without a shell ... The `node` plus script-path pattern works on every platform because `node.exe` is a real binary."
- A second Note: "In exec form, `command` is the executable name or path only ... Absolute paths with spaces, such as `C:\Program Files\nodejs\node.exe`, are a single valid executable."

**Changelog entries**
- 2.1.139: "Added hook `args: string[]` field (exec form) that spawns the command directly without a shell, so path placeholders never need quoting". Word for word.
- 2.1.47: "Fixed hooks (PreToolUse, PostToolUse) silently failing to execute on Windows by using Git Bash instead of cmd.exe (anthropics/claude-code#25981)". Word for word, except the plan drops the issue number.
- 2.1.126: "Windows: when the PowerShell tool is enabled, Claude now treats PowerShell as the primary shell instead of defaulting to Bash".
- 2.1.143: "The PowerShell tool is now enabled by default on Windows for Bedrock, Vertex, and Foundry users." This contradicts tools-reference and env-vars, which both still say `=1` is needed for those providers. The plan names this contradiction correctly.

**`CLAUDE_CODE_SHELL_PREFIX`** (env-vars)
- "PowerShell hooks and exec-form hooks run without the prefix." Word for word.

**Matcher `Bash|PowerShell`** (hooks#matcher-patterns)
- "Only letters, digits, `_`, `-`, spaces, `,`, and `|` → Exact string, or list of exact strings separated by `|` or `,`".
- The match is against `tool_name`. Confirmed.

**PowerShell tool input** (hooks#powershell)
- "The fields match the Bash tool, with the command string in `command`".
- "On Windows, wherever the PowerShell tool is enabled, Claude treats PowerShell as the primary shell and routes shell commands through it." The plan drops "On Windows," but the quote is otherwise correct.

**stdin**
- hooks#hook-input-and-output: "Command hooks receive JSON data via stdin". This covers both forms.
- The docs' own exec-form example on Windows (`"command": "powershell.exe", "args": [...]`, in the Windows tab of "How a hook resolves") "reads the JSON input from stdin".

**Exit codes** (hooks#exit-code-output)
- Exit 0 is success, and the JSON fields apply.
- Exit 2 is a blocking error.
- Any other exit code, or a hook that cannot start, is a "Non-blocking error ... The action goes ahead".
- `permissionDecision: "ask"` is valid on PreToolUse: "`"ask"` prompts the user to confirm".

**Timeouts**
- hooks#timeouts: "A timed-out `command` ... hook doesn't block the tool call ... so don't count on a stalled hook to act as a gate." Confirmed.
- The default is 600 s, or 30 s on UserPromptSubmit. The plan's explicit `5` replaces both.

**Environment in both forms**
- Both forms "export them as the environment variables `CLAUDE_PROJECT_DIR`, `CLAUDE_PLUGIN_ROOT`, and `CLAUDE_PLUGIN_DATA` on the spawned process". Confirmed.
- The docs do not say which form `CLAUDE_PROJECT_DIR` takes on Windows (`C:\` or `/c/`). The plan says so correctly.
- The backslash quote in hooks#pretooluse-input is about `tool_input.file_path` only. The plan already marks it as indirect evidence, which is correct.

**Other confirmed quotes**
- Workspace trust (hooks#workspace-trust): the "holds back hooks from every settings file, including your own `~/.claude/settings.json`" quote is correct. The docs add: "or for a parent directory whose trust extends to it".
- hooks#debug-hooks: from v2.1.296, `Hooks:` lines carry a duration for tool events, UserPromptSubmit and SessionStart. Possible endings include `failed to start`. Confirmed.
- `CLAUDE_CONFIG_DIR`: settings says "Claude Code then stores your settings, session history, and plugins there instead". env-vars: "All settings ... are stored under this path". Confirmed.
- Git Bash sources the profile in shell form (hooks-guide: "Git Bash and some configurations ... still source your profile"). So "exec form removes profile output" holds.

## Flags

1. **The PowerShell-tool default has a cause the plan does not list.**
   - env-vars#features-that-need-feature-flag-fetching says that with flag fetching off you can't "Get the PowerShell tool by default for claude.ai and Console accounts on Windows with Git Bash installed; Claude Code routes shell commands through Git Bash unless you set `CLAUDE_CODE_USE_POWERSHELL_TOOL=1`."
   - Fetching is off when `DISABLE_GROWTHBOOK`, `DISABLE_TELEMETRY`, `DO_NOT_TRACK` or `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` is set.
   - It is also off on a third-party provider.
   - The first session after an install or upgrade may lack the flag.
   - Finding 3 and Jake's machine check should record these variables, and whether the check runs in the first session after an upgrade.
2. **"Any Bash deny rule ... turns the tool off" overstates the docs.** tools-reference#bash-deny-rules-also-turn-off-the-powershell-tool says this applies "On Windows with Git Bash installed". The tool stays on if `CLAUDE_CODE_USE_POWERSHELL_TOOL=1` is set, or if a settings file has a scoped `PowerShell(...)` permission rule.
3. **The plan undersells the docs on Windows argument quoting.**
   - The docs promise "each `args` element is one argument exactly as written" and "No shell tokenization happens on any platform". They also give a `C:\Program Files\...` example.
   - So correct quoting on Windows is a documented contract, not only an inference.
   - The real spawn is still untested, so "most likely wrong" stays a fair label. It should cite the contract.
4. **Lookup on PATH is underspecified.**
   - The docs say only "resolves `command` as an executable on `PATH`".
   - They do not say how PATHEXT is used. They do not say which file wins when a directory earlier on PATH holds `node.cmd` and a later one holds `node.exe`.
   - The changelog (2.1.117: "cached `where.exe` executable lookups per process for faster subprocess launches"; 2.1.140: `where.exe` re-spawns) suggests Claude Code uses `where.exe` for subprocesses in general. That it does so for hooks is INFERRED.
   - "A shim on PATH cannot start" is documented. "Claude Code would pick the shim over a later `node.exe`" is unverified.
5. **"Reaches `node` exactly as written" has one documented exception.**
   - Path placeholders (`${CLAUDE_PROJECT_DIR}`, `${CLAUDE_PLUGIN_ROOT}`, `${CLAUDE_PLUGIN_DATA}`) are substituted inside `args`. A checkout path holding one of those literal strings would be rewritten. The risk is negligible.
   - `%` is not named in the docs. That it passes through follows from "no shell", not from a direct quote.
   - No other variable expands in `args`: `$HOME`, `~` and `%USERPROFILE%` stay literal. The plan relies on that correctly by writing absolute paths.
6. **Mapping `failed to start` to "`node` did not resolve to a real executable" is INFERRED.** The docs list the ending only; other start failures produce the same line.
7. **"Only Claude Code before 2.1.47 used cmd.exe as the hook shell" is wider than the changelog.** The entry names only PreToolUse and PostToolUse. This does not matter for exec form.
8. **"never fires there" (hooks#powershell) is ambiguous in the docs.**
   - It is the third bullet after "On Windows without Git Bash ... doesn't register the Bash tool at all".
   - Reading it as about Windows without Git Bash, as the plan does, is the natural reading. It is not stated outright.
9. **What versions before 2.1.139 do with `args` is not documented.**
   - The plan's guess is that `node` with no arguments reads stdin as a program and fails open. That is marked INFERRED, correctly.
   - Another failure mode is equally undocumented: an older settings check might reject or ignore the unknown field.
10. **Exec form behaves the same with or without Git Bash.** The docs never say this in one sentence, but it follows from three that they do say: "There is no shell", "No shell tokenization happens on any platform", and `shell` is "Ignored when `args` is set". Whether Git Bash changes the PATH that Claude Code passes to hooks is not documented.

No claim in the plan contradicts the docs. The relayed request ("The same version as ours") fits the plan's 2.1.296 premise, and 2.1.296 is the newest changelog entry.