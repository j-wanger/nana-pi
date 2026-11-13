## Working under nana-pi

The bullets below describe pi sessions; other runtimes receive only the surfaces listed here. At startup, a seat reads `HANDOFF.md`; every session looks up affected `REQUIREMENTS.md` rows by ID (grep or the requirements skill). Landscape predates pi 1.x; installed pi docs win.

| Runtime | Context and rules | Checks and state |
|---|---|---|
| Claude Code seat | SessionStart `nana-objective.mjs` (objective/frontier), `nana-adoption.mjs`, `nana-shared-memory.mjs`; nana-soul / nana-standards; shared nana-writing rule and `nana-rulings.md` | No nana Gate or Verifier pipe; Claude-owned Compaction summary, no nana HANDOFF producer; `nana-roster-notice.mjs` notice |
| pi TUI session | `nana-objective`, `nana-frontier-summary`; `nana-writing`, `nana-rulings`; no soul/standards or shared auto-memory | `nana-gate` for bash/PowerShell; `nana-lifecycle` journal; `nana-adoption` journals unadopted roots; pi-owned compaction; `nana-roster-notice` widget |
| pi reviewer/worker child (`NANA_HANDOFF=off`) | Same pi extensions; no objective, frontier, writing or rulings for launcher `NANA_ROLE` | Same gate/journal; roster notice has no UI |
| Codex | Unsupported; no nana runtime contract | Not specified |

Objective: nearest project unless user-disabled; none for launcher-role children. Shared memory: Claude-only. Writing rule and rulings follow the runtime above. Knowledge search: explicit `nana-knowledge query` only, no automatic pull. Post-edit: no nana per-edit checks. Notify: no desktop notifications. Requirements-first comes through project `AGENTS.md` and the requirements skill.

### Session guidance

- **Compaction summary:** compaction summaries are pi-owned background state, not the project frontier. Persist carry before a final report or session boundary. Builders and reviewers put open questions in their report; only the seat posts issues.
- **Gate:** pi's advisory gate checks shell commands and protected edits/writes. nana-rm-guard.mjs guards Bash deletes by a Claude Code seat's subagents, not the seat or Claude Code lane builders and reviewers. Neither is a sandbox. See `$HOME/nana-pi/packages/nana-pack/README.md` and `$HOME/nana-pi/packages/nana-setup/README.md` for limits.
- **Post-edit:** nana runs no per-edit checks in either runtime; run project checks explicitly.

### Working pattern

- Builder pushes: builders do not push. They report the branch, the full tip and the seat checks run on it. The seat pushes after verifying, then waits for CI where the project uses it.
- Seat guidance lives in the seat guide and the soul and rulings rules.
- Seat guide: while a builder or reviewer runs, the seat does not read or judge its partial work, and it acts when the run completes. The full guide is `$HOME/nana-pi/packages/nana-setup/claude/rules/nana-seat.md`; Claude Code loads it as a rule, and pi installs and injects the same guide for seat sessions.
- Builder rules: `$HOME/nana-pi/packages/nana-pack/prompts/builder-preamble.md`; reviewer rules: `$HOME/nana-pi/packages/nana-pack/prompts/review-standard.md`. Follow the assigned brief.
- Project-specific overrides belong in that project's own section AFTER this marker region; `nana-setup project` replaces everything between the markers.
