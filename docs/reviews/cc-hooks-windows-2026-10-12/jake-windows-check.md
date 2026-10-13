# Jake's Windows check — the Claude Code hooks (after cc-hooks-windows lands)

About 20 minutes in PowerShell on your Windows machine. Nothing here touches a real project: the check uses a
throwaway folder you delete at the end. Paste the results (the four "record" lines and each expect line's
outcome) back to the seat.

## 1. Record the setup
```powershell
$NANA = "C:\path\to\nana-pi"        # your nana-pi checkout
cd $NANA; git pull; git log -1 --oneline
claude --version                    # floors: 2.1.139 exec form · 2.1.126 PowerShell primary · 2.1.296 debug durations
node --version                      # needs v22.18 or later
Get-ChildItem env: | Where-Object Name -in CLAUDE_CODE_USE_POWERSHELL_TOOL,CLAUDE_CONFIG_DIR,DISABLE_GROWTHBOOK,DISABLE_TELEMETRY,DO_NOT_TRACK,CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC
```
Also record your account type (claude.ai, Console or other), any Bash deny rule or scoped `PowerShell(...)`
permission rule in your settings, and whether this is your first Claude Code session since an upgrade.

## 2. The install check (added 2026-10-13)
In Git Bash or PowerShell, from the checkout:
```powershell
cd $NANA; node packages\nana-setup\bin\install-check.mjs
```
It installs nana into a temporary home and runs every hook as Claude Code would. Expect 13 lines starting
`PASS`, ending with `PASS doctor`, and exit code 0. Paste every line back, including the first lines naming
the resolved Git Bash, pi and node.

## 3. Install and doctor
Windows has no linked `nana-setup` command, so run it from the checkout:
```powershell
node "$NANA\packages\nana-setup\bin\nana-setup.mjs" install
node "$NANA\packages\nana-setup\bin\nana-setup.mjs" doctor
```
Expect in doctor: `✓ node for the objective hook`, five `✓ settings …` rows (objective, adoption,
shared-memory, verifier pipe, knowledge pull), and a `·` note naming Claude Code 2.1.139.

Check the two fixtures the session expects to print, and record which exist:
```powershell
Get-Content "$HOME\.pi\agent\nana-objective.md" -TotalCount 12          # your objective lines
Select-String -Path "$HOME\.claude\nana-memory\shared\MEMORY.md" -Pattern "^- \["   # at least one index line
```
If the objective file still holds only the seed's placeholder lines, or MEMORY.md has no `- [` line, the
matching expect line below cannot show your content; record exactly what the session printed instead.

## 4. A throwaway project with a knowledge note
```powershell
$P = "$HOME\nana-hooks-check-$(Get-Date -Format yyyyMMddHHmmss)"   # a new folder each run
New-Item -ItemType Directory "$P\docs" | Out-Null; cd $P; git init
Set-Content "$P\docs\hooks-check.md" "# Hooks check`n`nThe word zanzibarquill proves the knowledge pull reached this note."
node "$NANA\packages\nana-knowledge\bin\nana-knowledge.ts" build
node "$NANA\packages\nana-knowledge\bin\nana-knowledge.ts" query zanzibarquill
```
Expect the query to list `hooks-check.md`. If it lists nothing, run `… nana-knowledge.ts status`: the folder
must show as a `(discovered)` root. If your `sources.json` predates discovery, tell the seat and skip the
knowledge expect line below.

The adoption hook reports only folders a pi session has logged as not adopted in the last 7 days, so start pi
here once and quit it (Ctrl+C twice) — no prompt needed:
```powershell
cd $P; pi
```

Add the throwaway hook that shows which `node` Claude Code starts — save as `$P\.claude\settings.json`:
```json
{ "hooks": { "SessionStart": [ { "hooks": [ { "type": "command", "command": "node",
  "args": ["-e", "console.log('nana-check ' + JSON.stringify({ node: process.execPath, version: process.version, projectDir: process.env.CLAUDE_PROJECT_DIR, cwd: process.cwd() }))"],
  "timeout": 5 } ] } ] } }
```

## 5. One Claude Code session
```powershell
cd $P; claude --debug
```
Accept the workspace trust dialog first: Claude Code holds back every hook until you do. Then expect:
- an objective block (your user-scope objective), the shared-memory index, an adoption notice naming
  the new `nana-hooks-check-…` folder (logged by the pi session above), and a `nana-check {…}` line — ask Claude "what did the nana-check line say?" and record it;
- on the prompt "what does zanzibarquill prove?", a `[nana:knowledge]` block naming `hooks-check.md`;
- on "run exactly this one command: `npm test | Select-Object -Last 5; git commit -m check`", an ask from the
  verifier before anything runs. **Decline it.** Record the tool name the ask shows (Bash or PowerShell). If
  Claude uses Bash, the same ask should come for `npm test | tail -5 && git commit -m check`.

In the debug log, find each hook's `Hooks:` line and record its status and duration against the 5 s timeout.
`failed to start` most likely means `node` did not resolve to a real `node.exe` (inferred; the docs list the
status, not its causes).

## 6. Clean up
```powershell
cd $HOME; Remove-Item -Recurse -Force $P      # only the folder this run created
node "$NANA\packages\nana-knowledge\bin\nana-knowledge.ts" build
```
