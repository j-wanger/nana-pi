# pi first-party examples census (2026-09-03)

Mining pass over the installed 0.84.4 `examples/` (77 extension examples + 13 SDK
examples) — the landscape research called this "the real standard library" and we had
only mined the four hook classes. Method: full catalog read (examples/extensions/README
is a complete one-liner index), source read of every shortlisted candidate, and a live
load test: all five shortlist picks loaded together headlessly on 0.84.4 in a git repo,
zero errors. agent-pi re-checked the same day (bottom).

## Shortlist — worth enabling (all load-verified together)

| Example | What it gives Jake | Notes from source read |
|---|---|---|
| `plan-mode/` (390+168 ln) | Claude Code-style plan mode: `/plan` (+ `--plan` flag), write tools disabled, bash allowlisted read-only, numbered-step extraction + progress widget during execution | The one omitted-feature gap left after pi-subagents. Status/widgets render in the desk; Ctrl+Alt+P is TUI-only |
| `preset.ts` (436 ln) | Named model+thinking+tools+instructions presets: `--preset`, `/preset <name>`, cycle key; `~/.pi/agent/presets.json` + project `.pi/presets.json` | Its own doc example IS a plan/implement pair — pairs with or substitutes plan-mode. `/preset` picker is a custom TUI component (desk can't render it; `/preset <name>` works everywhere) |
| `git-checkpoint.ts` (53 ln) | `git stash create` (dangling commit — no stash-list noise, no tree touch) each turn; offers restore on `/fork` | Clean design; non-interactive mode deliberately never auto-restores. Natural partner to the desk Fork button |
| `handoff.ts` (190 ln) | `/handoff <goal>` → model generates a self-contained transfer prompt into a NEW session's editor — the lossless alternative to compaction | Uses current model for the transfer summary; drafts into editor (desk supports set_editor_text) |
| `claude-rules.ts` (86 ln) | Lists `<cwd>/.claude/rules/*.md` filenames in the system prompt; agent reads on demand (progressive disclosure) | PROJECT rules only (cwd-relative) — does NOT touch `~/.claude/rules`. Zero value until a repo carries `.claude/rules/`; near-zero cost |

Adoption mechanics: copy to `~/.pi/agent/extensions/` (auto-discovery + `/reload`) or
add example paths to settings `extensions` (tracks pi updates, breaks if upstream
renames). Desk spawn-toggles can then turn each off per session.

## Parked for other lanes

- **`sandbox/` + `gondolin/`** — OS-level confinement (`@anthropic-ai/sandbox-runtime`
  / micro-VM) for pi's tools. Not for interactive use; this is the "unattended
  enforcement belongs at the container layer" answer IN pi — relevant to pi-engine
  governed loops. Filed in nana-agent-loop `research/IDEAS.md`.
- **`structured-output.ts`** — terminate-on-tool pattern for programmatic runs;
  relevant to loop runners, not the interactive seat.
- **`ssh.ts`** — delegate all tools to a remote machine; interesting future lane
  (drive the Windows box from the Mac desk).

## Covered already — do not double-mount (one pack per hook class)

`permission-gate` / `protected-paths` / `confirm-destructive` → nana-gate ·
`file-trigger` → nana-post-edit · `notify` → nana-notify (OS-native beats OSC 777) ·
`session-name` → desk rename/derive · `subagent/` → pi-subagents (superior) ·
`custom-compaction` / `trigger-compact` → pi native + desk Context tab ·
`rpc-demo` / `rpc-extension-ui` → the desk itself.

## Skipped (read the catalog so we don't re-litigate)

UI demos (snake, doom, tic-tac-toe, overlays, rainbow/modal editors, custom
header/footer/renderers — TUI polish we get from the desk instead) · provider examples
(custom-provider-anthropic/gitlab-duo, kimi-deferred-tools — no current need) ·
`todo.ts` (no felt need; pi philosophy is bring-your-own) · `bookmark.ts` (/tree is
TUI-only) · `dirty-repo-guard` (would fight the loop-land choreography) ·
`github-issue-autocomplete` (niche) · `inline-bash`, `interactive-shell`,
`mac-system-theme`, `qna`, `summarize` (nice-to-haves; revisit on felt need) ·
`dynamic-tools/resources`, `event-bus`, `with-deps`, `tool-override`,
`input-transform*` (patterns, not products — reference material for pack work).

SDK examples (13): reference material for the loop-engine pi adapter; nothing to adopt
standalone.

## agent-pi (re-checked 2026-09-03)

267★, 43 extensions, 6 modes, 0 open issues. Verdict UNCHANGED from 09-01: mine
patterns, don't adopt the layer. Its PLAN/SPEC modes ≈ plan-mode + preset above; its
security layer ≈ nana-gate; its approval viewers ≈ desk dialogs. Unique bits worth
remembering: interactive plan review with checkbox/reorder (a desk feature idea),
per-file rollback in completion reports. The 11 TUI themes are the one direct-reuse
asset if TUI theming ever matters.
