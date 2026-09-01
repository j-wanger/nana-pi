# nana-pi-pack

Four extensions giving pi the hook coverage we require (Claude Code parity classes):

| Extension | Hook class | Events used |
|---|---|---|
| `nana-gate` | Pre-tool permission gating | `tool_call` (blocking) |
| `nana-post-edit` | Post-edit format/lint/test | `tool_result` (modifying) |
| `nana-lifecycle` | Session lifecycle observability | `session_start/…compact…/shutdown` |
| `nana-notify` | Outward notifications | `agent_settled` |

## Install

```bash
pi install /path/to/nana-pi/packages/nana-pack   # local dev
pi install git:github.com/<owner>/nana-pi        # once pushed (subdir support via manifest)
pi remove ...                                     # uninstall
```

## Config (all optional)

User `~/.pi/agent/nana-pack.json`, project `<cwd>/.pi/nana-pack.json` (project wins,
read live on every event — edits apply without restarting):

```json
{
	"gate": {
		"extraPatterns": ["\\bterraform\\s+destroy\\b"],
		"allowPatterns": ["^git push --force-with-lease origin (?!main)"],
		"protectedPaths": ["secrets/"]
	},
	"postEdit": {
		"commands": [
			{ "match": "\\.ts$", "run": "npx prettier --write {file}" },
			{ "match": "\\.py$", "run": "ruff check {file}", "timeoutMs": 20000 }
		]
	},
	"notify": { "enabled": true, "headless": false },
	"journal": { "enabled": true, "path": null }
}
```

## Behavior notes

- **Gate is fail-closed headless**: without a UI, a dangerous/protected hit is blocked
  outright. Interactively, "Block" is the default choice. Built-in patterns cover
  `rm -rf`-family, `sudo`, force-push, `git reset --hard`/`clean -f`, `chmod 777`,
  `dd of=/dev/`, `mkfs`, shutdown/reboot, `Remove-Item -Recurse/-Force`, plus protected
  paths (`auth.json`, `settings.json`, `.ssh`, `.env*`) checked in commands AND edit/write targets.
- **The gate is advisory-by-load-path** — a pi run without the extension has no gate.
  Unattended enforcement stays at the container/sandbox layer.
- **post-edit failures are appended to the tool result** so the model sees and fixes them;
  successes are silent. `{file}` is shell-quoted; exotic path characters on Windows cmd.exe
  are quoted best-effort.
- **Journal** is best-effort JSONL at `~/.pi/agent/nana-journal.jsonl` (override via
  `journal.path`); one line per session event.
- **Notify** never writes terminal escape codes without an attached UI, so print/RPC
  output stays clean. Headless notifications are opt-in (`notify.headless`).
