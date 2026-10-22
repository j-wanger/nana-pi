# Fact-check (external and process claims) — seat-guide CHANGE.md

Checked 2026-10-13 against: `HANDOFF.md` and `docs/sessions/2026-10.md` at main `5b53ebc`; `AGENTS.md`; `feat/roster` at `c7c7690`;
`~/.claude/nana-memory/shared/*.md`; installed pi 1.0.2 (`$(npm root -g)/@earendil-works/pi-coding-agent`); Claude Code docs
(code.claude.com/docs/en/memory, /sub-agents, /tools-reference, fetched today). Default is UNVERIFIED when no primary source confirms.

## WRONG

| # | CHANGE claim | Evidence |
|---|---|---|
| W1 | Header: the install check runs locally before `nana-land` "(Owner, 2026-10-11)". | The ruling is **2026-10-12**: `AGENTS.md:144` "Land checklist, nana-pi only (Owner, 2026-10-12)"; `feedback_lane_process_2026_10_11.md:15` "(Owner, 2026-10-12, "Yes")"; sessions 2026-10-13 process entry "the owner's 2026-10-12 rule". (The computed task text made the same slip.) |
| W2 | §3 Values: "Two lanes: accepted by the owner 2026-10-11 (`feedback_lane_process_2026_10_11.md:17`)". | The cited line says the opposite of "accepted": "The seat's own changes (no approval needed, stated to the owner): … at most two lanes in flight". `HANDOFF.md:70` puts "at most two lanes at once" in the parenthesis of a queue the owner ordered on 10-11, but no source quotes the owner setting the cap. Say "the seat's rule, stated to the owner 2026-10-11". |
| W3 | §1: "Polling costs turns and changes nothing the seat may do mid-run (`feedback_no_duplicate_mechanical_checks.md:3-5`)". | Lines 3-5 are frontmatter; the file's point is "never produce the same mechanical evidence twice". It does not say mid-run signal changes nothing. `feedback_probe_all_background_work.md:12` (Owner, 07-24) says the reverse: "Waiting for the completion notification alone hides mid-run signal … that changes what the seat does next". The "changes nothing" half is the seat's inference; mark it so or drop it. |
| W4 (minor) | §1: the template has no "background". | `templates/_shared/working-under-nana-pi.md:17` has "background state" (compaction, unrelated sense). Immaterial; say "nothing on waiting for a launched job". |

## UNVERIFIED or contested

| # | CHANGE claim | Status and evidence |
|---|---|---|
| U1 | §3 "Monitor conflict, decided by the seat"; §6 "none is YOUR CALL". | Contested authority. `feedback_probe_all_background_work.md` records three separate the owner asks (07-24 twice, 08-06 twice) for a monitor and a 30-minute heartbeat on **every** long background run, and line 14 explicitly allows passive log reading. Bullets 5 and 6 reverse both. The owner's 10-13 words cover "checking the work done by the worker every turn", not monitors on failure signatures. The cited owner text is weaker than stated: line 14 calls a watchdog a "platform-mechanize candidate", not a ruling. Reversing a repeated the owner ruling reads as his call. At minimum, put it to him as a decision point before the build, not as a one-line notice after the land. |
| U2 | §1 "Root cause: the practice lives only in the Mac's shared memory … the owner's Windows Opus seat has none of them". | Inferred. The seed is empty (`steps.mjs:62`, `claude/memory/MEMORY.seed.md`), but nothing shows what memory the owner's work machine holds or why that seat polls; default model behaviour is an equal candidate. The sessions lesson "a rule that exists only in a seat's memory does not reach another machine" was about the default pattern, not polling. Mark INFERRED. |
| U3 | Header: "Builder: **luna**" (small lane). | the owner's 10-13 split (`reference_roster.md:22-23`): Sonnet builds "larger or riskier lanes — gate-adjacent code, **multi-file changes**, lanes with many rows". §4 In lists about 16 files (8 test files, 2 code files, template, AGENTS.md, README, ledger, tree, map). The plan argues "two list entries" of code, which is fair, but it should answer the multi-file criterion by name. The 10-11 "small lane" class (plan-review caps) is a different axis from the 10-13 builder split. |
| U4 | §6.4 "Whether Claude Code's PowerShell tool runs background tasks is unverified". | Answerable from docs: tools-reference "Time limit for background commands" says "background Bash and PowerShell commands have a time limit" and "The PowerShell tool follows the same timeout rules". Documented yes; unproven on the owner's machine. |
| U5 | §6.4 "A pi seat blocks on its foreground launch, so two lanes need two pi seat sessions (INFERRED)". | The pi `bash` tool part is VERIFIED (`dist/core/tools/bash.js:30`: "Timeout in seconds (optional, no default timeout)", no background parameter). The conclusion is UNVERIFIED: this Mac's pi has `npm:pi-subagents@0.75.0` (`pi list`). nana-setup seeds `asyncByDefault: true, forceTopLevelAsync: true` for it (`packages/nana-setup/README.md:49`), so a pi seat may launch work in the background through a subagent. Whether Windows pi has it is unknown. |
| U6 | Pointer and R-1142 name `$HOME/nana-pi/...`. | Inherited from roster's bullets. The owner's Windows clone path is unknown: his check page uses `$NANA = "C:\path\to\nana-pi"`. For the pi seat on Windows, the named file may not exist at that path. The inline core still reaches it. |
| U7 | §1 Observable outcome: "every Claude Code session … on Windows loads `nana-seat.md`". | The docs say user rules in `~/.claude/rules/` "apply to every project on your machine" (memory page), and a copy is a plain file. Unproven on the owner's machine: his Windows check (`HANDOFF.md:81`, blocking since 10-12) has not run. Docs caveat: Cowork desktop sessions skip a symlinked rule file pointing outside the working directory (macOS symlinks), the same as for today's rules. |
| U8 | §3 "end your turn breaks a headless builder (`reference_claude_cli_headless_isolation.md:23`)". | The cited line is VERIFIED for a `claude -p` worker. For pi `-p` builders it is inferred, though plausible: pi's bash cannot background, so "end your turn" would just stop the run. |
| U9 | §3 Values: "Three items per session" measured over 231 luna sessions. | The figures are VERIFIED (`feedback_builder_brief_rules.md:19`). The same line also says three-item sessions alone did NOT fix PARTIAL (sessions 2a and 2b); exact titles did. Bullet 11 rests on the weaker half. It is also a luna measurement placed in a rule the plan calls model-neutral. |
| U10 | §5 "On this Mac `restore.test.mjs` needs `npm_config_prefix=$HOME/.local`; that predates the lane". | Only the plan's own research supports this (`research-rules-install.md:60`). `npm config get prefix` here is `/Users/example/.local`, which fits. No HANDOFF or session record. |

## Missing external fact (NOTE)

- Claude Code limits background commands in unattended sessions (`-p`, Agent SDK, CI, cloud) to 30 min by default and 2 h at most (tools-reference "Time limit for background commands"). The limit is 10 min for a `-p` run given a text prompt. A seat in such a session that follows bullet 4 would have a lane builder killed; lane mode allows 8 h (R-963). Interactive terminal, desktop and VS Code sessions have no limit. This belongs in §6 Known limits.

## VERIFIED (sampled)

- The owner's verbatim ask and the queued content: `reference_roster.md:28`. The paste-in paragraph the same day: same line. The lane appears in no HANDOFF queue (main or feat/roster), only in memory.
- `pi-worker.mjs:92-93` appends the builder preamble, and `pi-review.mjs:37` reads the review standard. pi children load `AGENTS.md`: pi `cli.md:202-203` says only `-nc` disables it, and lane mode does not pass `-nc`.
- Claude Code reads `AGENTS.md` only when no `CLAUDE.md` exists at or above the cwd (v2.1.277+; memory page "When Claude Code reads AGENTS.md"). A one-line `CLAUDE.md` text file therefore hides `AGENTS.md`, which supports §1 and `HANDOFF.md:81`. The owner's Claude Code is 2.1.296 (`user_owner_windows_both_seats.md:10`).
- Subagents load user rules and the CLAUDE.md hierarchy, except the built-in Explore and Plan agents and `omitClaudeMd` agents (sub-agents page "What loads at startup"). This subagent received soul, standards, writing and personal.
- The Bash tool's `run_in_background` keeps running after a final response and notifies on exit (tools-reference "Background commands").
- `pi-watchdog.mjs:16-23` covers stalls by CPU, and `pi-review` uses it too (`pi-review.mjs:34`). R-963 sets the 28,800 s lane ceiling. The watchdog's header names PowerShell CPU reads on win32.
- These items match their sources:
  - the 10-11 rulings (threat model, small lane one round): `feedback_lane_process_2026_10_11.md:10-11`
  - the 10-13 materiality triage and YOUR CALL: `feedback_review_materiality.md:17`
  - re-running the mutation runner after a seat change: `feedback_lane_process_2026_10_11.md:26`
  - the HANDOFF next steps: `:24`, plus the template's "before its final round" land checklist
  - one-line fixes get a direct answer: `reference_roster.md:26`
  - the probe memory dates
- From `feat/roster`: R-1128 pins the default-pattern and seat-land-review bullets byte for byte, and its row sits directly after R-301. Roster rewrites the `AGENTS.md` "Working pattern" intro. Roster's nana-setup README edit is at line 374, away from the planned row after `:39`.
- The `925f950` precedent amended R-301 in place. R-376's note cites Amendment 1 §A3: "will not open a file the rule merely points at".
- `nana-writing.mjs` on the proposed guide prints `over=0 passive=0 banned=0`; on the pointer, the same. The guide is 19 lines and 2,183 bytes.
- R-1140–R-1149 are unused on main and on `feat/roster`. Main's highest ID is R-1111, and roster's is R-1128.

## Scope creep (not traceable to the owner's 10-13 words, the queued item in `reference_roster.md:28`, or the task's listed content)

The queue item names six behaviours plus install and pointer. The guide has 15 bullets, and these go beyond any ruling or queue item:

- Bullet 2, acceptance seen failing before the build. This is the seat's own 10-11 practice; nobody asked for it in the guide.
- Bullet 3, the brief names the ID range, seat checks and exact titles. These are brief-writing rules; the preamble already consumes them (`builder-preamble.md:8,28`).
- Bullet 7, no writes in a running worktree. It is also stricter than `feedback_stage_explicit_paths_while_agents_run.md:15`, which allows explicit-path commits while a builder runs.
- Bullet 11, a fresh session after PARTIAL with three items at most.
- Bullet 13's first half, trace, map and README green before review. The memory asks for this mechanically in the launcher, "not by memory".
- Bullet 15, HANDOFF next steps before the final round.
- Bullet 6, as its own rule against a standing the owner ruling. Only "the stall watchdog handles hangs" appears in the task text; see U1.

The fifteen per-rule tests plus a no-extra-bullet test pin every bullet above, which makes trimming later a requirement change. By `feedback_builder_brief_rules.md:38` (#19), untraceable items go to §6 as options. Omitted with a stated reason, not creep: "reports short and verdict-first", which nana-writing covers.
