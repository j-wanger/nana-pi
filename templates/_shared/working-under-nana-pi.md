## Working under nana-pi

The bullets below describe pi sessions; other runtimes receive only the surfaces listed here. At startup, read `HANDOFF.md`, look up affected `REQUIREMENTS.md` rows by ID (grep or the requirements skill), and read the landscape doc only for pi API questions.

| Runtime | Objective | Shared memory | nana-soul / nana-standards | Writing rule | Knowledge pull | Gate | Verifier pipe | Post-edit | Compaction summary | Notify |
|---|---|---|---|---|---|---|---|---|---|---|
| Claude Code seat | SessionStart `nana-objective.mjs` and `nana-adoption.mjs` hooks | `nana-shared-memory.mjs` hook; Claude shared-memory index and auto-memory | Both Claude rules | Shared nana-writing rule | UserPromptSubmit `nana-knowledge.ts hook` | No nana command gate | Bash PreToolUse Node hook `verifier-pipe.mjs` | No nana per-edit checks | Claude-owned summary; no nana HANDOFF producer | No nana notify |
| pi TUI or desk session | `nana-objective` extension | No shared auto-memory | Neither rule; requirements-first arrives through AGENTS and the requirements skill | `nana-writing` extension | `nana-knowledge` extension (`before_agent_start`) | `nana-gate` extension | `nana-gate` shared predicate for bash and PowerShell | `nana-post-edit` extension; configured checks, if any | `nana-lifecycle` journal; `nana-handoff` extension on compaction | `nana-notify` extension |
| pi reviewer/worker child (`NANA_HANDOFF=off`) | `nana-objective` extension | No shared auto-memory | Neither rule | `nana-writing` extension | `nana-knowledge` extension | `nana-gate` extension | `nana-gate` shared predicate for bash and PowerShell | `nana-post-edit` extension; configured checks, if any | Disabled by `NANA_HANDOFF=off` | `nana-notify` extension |
| Codex | Unsupported; no nana runtime contract | Not specified | Not specified | Not specified | Not specified | Not specified | Not specified | Not specified | Not specified | Not specified |

pi deliberately has no user-level `AGENTS.md`; shared auto-memory and nana-soul are Claude-only. Requirements-first practice is shared through project `AGENTS.md` and the requirements skill. The separate nana-knowledge extension serves pi; Claude Code has its own knowledge hook.

### pi-session guidance

- **Objective:** nana-objective supplies the nearest project objective unless disabled by user configuration; the shared rules above describe pi-only behavior.
- **Compaction summary:** compaction summaries are pi-owned background state, not the project frontier. Persist unresolved work and Jake's open questions in `HANDOFF.md` before a final report or session boundary.
- **Journal and notify:** journal records session events; notify is a pi extension and may be disabled or silent headlessly.
- **Gate:** Advisory pi gate inspects selected shell commands and protected edit/write targets. It is not a security boundary; see the pack README for exact scope and limits, including the interpreter code-operand path gap for floored settings, auth, MCP and extension files.
- **Post-edit:** configured checks run after successful edits only in pi; absent commands mean no checks. Claude Code has no nana per-edit checks.

### Working pattern

- Default worktree root: `~/<repo>-wt/<lane>`; branch: `feat/<lane>`, based on main. One writer per worktree.
- Review corpus: `docs/reviews/<lane>-<date>/`. Builder launcher: `pi-worker --lane <name> --brief <file> --out <file>`; reviewer launcher: `pi-review`.
- Review ladder: package reviewer, then land reviewer when blast radius warrants both. Maximum three rounds per item; a different model lineage reviews the work.
- Land checklist: resolve review findings or record residuals at point of use; use `nana-land` with a clean `main` checkout and clean source, verified review rounds, and the suite on the reviewed tip; rerun the suite if either checkout changes, and rely on the helper's immediate pre-merge checks, ff-only merge, and containment verification. Cleanup is a separate operation, only for a clean `feat/<lane>` worktree contained in `main`. Then run map, README, and locked full-suite checks; commit explicit paths and report evidence.
- Project-specific overrides belong in that project's own section AFTER this marker region; `nana-setup project` replaces everything between the markers.
