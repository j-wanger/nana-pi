# Research: seat practice (lane seat-guide, nana-pi, 2026-10-13)

Question: what does a good nana seat do, from the evidence; propose the guide text (at most 25 lines,
imperative, one behaviour per line, each line sourced) and the one-line pointer for the shared region;
flag every rule that is Mac- or Claude-specific.

Stakes: low blast, reversible (a text rule plus one install entry). The cost of error sits in two
places: a guide line that fights an existing rule (the seat obeys whichever it read last), and a line
that is right on the Mac Claude Code seat but wrong for a pi seat or on Windows.

Base: main 5b53ebc. Roster lane (feat/roster, tip 34f43bc) read with `git diff main...feat/roster`.
Memory paths are under `~/.claude/nana-memory/shared/`; repo paths are relative to `~/nana-pi`.

## 1. Evidence

| # | Behaviour | Source (file:line) |
|---|---|---|
| E1 | the owner's complaint: the Windows Opus seat checks the worker's work every turn; queued guide content: background launch, end turn, never poll or read a running worker's transcript or diff its partial work, act on completion, verify once at the end, findings in the next brief, at most two lanes | `reference_roster.md:28` |
| E2 | Do not poll with echo commands; wait for the notification; fall back only on a real failure, "not because it's taking long" | `feedback_wait_for_reviewers.md:14` |
| E3 | Token waste the owner flagged: a sleep+tail helper AND reading launcher output by hand; one producer per piece of evidence, read its exit code once | `feedback_no_duplicate_mechanical_checks.md:3-5,11-16` |
| E4 | The seat's value is brief, integration, verification, ruling; seat's own tool calls = reads of results, small edits, commits, status | `feedback_seat_instructs_opus_works.md:16-18,20-23` |
| E5 | Roster role: seat briefs, verifies, merges, decides; writes HANDOFF/sessions/memory | `reference_roster.md:12` |
| E6 | Acceptance script before the build; mutation run on build 1's tip; look at every page/CLI output itself; at most two lanes in flight | `feedback_lane_process_2026_10_11.md:17` |
| E7 | Acceptance before the build and the mutation runner after it stay mandatory for both builders | `reference_roster.md:24` |
| E8 | Acceptance seen failing before the build (103 of 122 failing at launch, 122/122 on a fake build) | `git log 5a6c890` (feat/roster) |
| E9 | luna builds small lanes only with every test named by exact title and a title check whose `0 missing` is DONE | `reference_roster.md:23`; `feedback_builder_brief_rules.md:19` |
| E10 | Reserve a requirement-ID range per lane; every brief names it | `feedback_builder_brief_rules.md:32`; preamble consumes it at `packages/nana-pack/prompts/builder-preamble.md:8` |
| E11 | The seat re-runs every claimed mutation; luna's report claimed five red mutations, all were exit 0 | `feedback_builder_brief_rules.md:21` |
| E12 | The seat runs the mutation pairs itself before the final review (green suite, bodies never ran) | `feedback_builder_brief_rules.md:28` |
| E13 | After ANY seat-authored code or test change, re-run the mutation runner before review (cost a round on fresh-install) | `feedback_lane_process_2026_10_11.md:26` |
| E14 | PARTIAL rate climbs with context; split build 1 into fresh sessions of at most three items | `feedback_builder_brief_rules.md:19` |
| E15 | Cheap rails (trace, map, README, whitespace) green before any review round; a red rail found by a reviewer is a wasted round | `feedback_prereview_cheap_rails.md:10-11` |
| E16 | Triage each MUST against the bar before briefing a build; a failing MUST becomes a residual with one line of reasoning; if the reviewer insists, YOUR CALL for the owner | `feedback_review_materiality.md:17` |
| E17 | Never commit into a worktree under review (voids the verdict, consumes the round); stage seat edits elsewhere until the review ends | `feedback_stage_explicit_paths_while_agents_run.md:17`; see also `:15` |
| E18 | Passive log reading does not break wait-for-the-runner; writes to its tree do | `feedback_probe_all_background_work.md:14` |
| E19 | A standing go chains across steps; never convert a settled go into "want me to keep going?"; a "next report at X" is honest only if X already runs | `feedback_autonomous_phase_execution.md:16` |
| E20 | One-line turn-ends read as absence to the owner in long remote sessions; a turn with a state change gets a real update | `feedback_confirm_parallel_candidates.md:17-19` |
| E21 | When a lane lands, every next increment its CHANGE lists goes into HANDOFF's queue or is dropped there | `feedback_lane_process_2026_10_11.md:24` |
| E22 | A headless print-mode worker that backgrounds a command and "waits for the notification" exits; there is no next turn | `reference_claude_cli_headless_isolation.md:23` |
| E23 | pi-watchdog kills a run whose CPU stays flat for `--stall-secs` and retries; pi-worker retries 0 by default; lane ceiling 8 h | `packages/nana-pack/bin/pi-watchdog.mjs:20-23,48,148`; `reference_pi_review_procedure.md:32-33`; `packages/nana-pack/bin/worker-config.mjs:9-10` |
| E24 | pi 1.0.2's `bash` tool blocks until the command exits: "Timeout in seconds (optional, no default timeout)"; pi docs name no background facility | `$(npm root -g)/@earendil-works/pi-coding-agent/dist/core/tools/bash.js:30` |
| E25 | the owner 2026-10-13: a change touching code with tests goes through the pattern; questions and one-line fixes get a direct answer | `reference_roster.md:26`; already in the roster lane's shared bullet and nana-soul bullet (see section 6) |

## 2. Already said elsewhere (the guide must not restate it)

- Builder rules (scope, wrong code first, mutation breaks code, CRLF cases, report shape, CI read once):
  `packages/nana-pack/prompts/builder-preamble.md:5-34`, appended by `pi-worker.mjs:92-93`.
- The materiality bar, confirmation rounds review the delta, the verdict line:
  `packages/nana-pack/prompts/review-standard.md:1-3`, appended by `pi-review.mjs:37`.
- Worktree/branch, review ladder, plan caps, threat model, land checklist, notes before the final round:
  `templates/_shared/working-under-nana-pi.md:24-30` (AGENTS.md:92-98).
- Default pattern, roster command, Windows launcher form, seat land review: roster lane bullets
  (feat/roster `templates/_shared/working-under-nana-pi.md` hunk `@@ -27,4 +27,6 @@`;
  `nana-soul.md` hunk `@@ -45,6 +45,8 @@`).
- Verdict-first short reports: `packages/nana-pack/rules/nana-writing.md:7-12`; reaches the Claude seat as a
  rule and the pi seat through the `nana-writing` extension. Dropped from the guide.
- HANDOFF before the final report: `nana-soul.md:37` and the shared region's compaction bullet (`:17`).

## 3. Proposed guide text (25 lines: title, scope sentence, 21 bullets)

Proposed file: `nana-seat.md`. Each bullet's source is in the table below (not part of the file). Bullets are numbered 1-21 in order. The text passes `nana-writing.mjs` with zero findings (checked on the extracted draft, `nana-seat.draft.md` beside this file).

```
# Nana — Running builders and reviewers

You are the seat: the interactive session Owner talks to. A builder or reviewer session skips this rule.

- Plan, write acceptance scripts and briefs, verify, decide and report; builders build and reviewers review.
- Write the lane's acceptance script before the build and see it fail on the base revision.
- Name in every brief the lane's free requirement-ID range and the seat checks whose pass is DONE.
- For a small-lane builder, name every required test by exact title, with a title check that must print `0 missing`.
- Start each builder or reviewer once and wait for its exit. In Claude Code, run it as a background task and end your turn; in pi, run it as one foreground command with no timeout.
- Never poll, never read a running job's output, transcript or log, and never diff its partial work.
- Arm no monitor, heartbeat or timer on a launcher run; its watchdog ends a stalled run, and a slow run is not a stalled one.
- Never write or commit in a worktree while its builder or reviewer runs.
- Keep at most two lanes in flight; while one runs, work the other or end your turn.
- End a waiting turn with one line: what runs, and what you will do when it exits.
- When a job exits, act in that turn: verify, then brief the next build or launch the review, without asking Owner to continue.
- Verify once per build: re-run the lane's seat checks yourself, read the builder's report, and look at every page or command output it produces. Seat checks are the acceptance script, title check and mutation runner.
- Believe no pass or mutation you did not re-run, and read each check's exit code once from the tool that owns it.
- On a PARTIAL report, start a fresh builder session for the remaining items, at most three per session.
- Send a builder's defects back in the next brief; fix only a one-line slip yourself.
- After any code or test change of your own, re-run the lane's mutation runner before the review.
- Run the project's cheap checks (requirements trace, code map, README check) green before any review round.
- Triage each MUST against the review standard before briefing a rebuild; answer one that fails the bar as a residual with one line of reasoning.
- If a reviewer insists on a MUST you answered as a residual, put it to Owner as YOUR CALL.
- After a land, move every next step the lane's change declaration lists into HANDOFF's queue, or drop it there by name.
- A seat run headless (print mode) has no next turn: wait for every job in the foreground.
```

| Line | Source |
|---|---|
| Scope sentence | E1; workers and reviewers load AGENTS.md too (the pointer reaches them), so the scope is explicit |
| Plan, write, verify… | E4, E5 |
| Acceptance before the build, seen failing | E6, E7, E8 |
| ID range + seat checks = DONE | E10; preamble `:8,:28` consumes both |
| Exact titles for small-lane builder | E9 (wording avoids the model name: the roster is per machine) |
| Start once, wait for exit | E1, E2, E24 (pi wording), E22 |
| Never poll / read output / diff partial work | E1 (Owner verbatim), E2, E3 |
| No monitor or heartbeat | E23, E2 ("not because it's taking long"); conflicts with the probe memory, see C1 |
| No writes in a running worktree | E17, E18 |
| Two lanes in flight | E6 |
| One-line waiting turn | E19, E20; reconciles `nana-soul.md:42` (see C2) |
| Act in the exit turn | E19 |
| Verify once per build | E6, E7, E11, E12 |
| Re-run, read once | E3, E11 |
| PARTIAL → fresh session | E14 |
| Defects in the next brief | E1, E4, E13 (the seat's own code cost a round); see C3 |
| Mutation runner after own change | E13 |
| Cheap checks before review | E15 |
| Triage MUSTs | E16 |
| Reviewer insists → YOUR CALL | E16 |
| Next increments into HANDOFF | E21 |
| Headless seat | E22 |

Optional line, only as a swap for another bullet (the cap is reached; older ruling, 07-08):
`- Before opening a new parallel lane, give Owner the candidates with a recommendation; he picks.`
(`feedback_confirm_parallel_candidates.md:16-17`.) Left out by default: lanes are now queued with the owner in
HANDOFF, so the selection step rarely arises.

## 4. Shared-region pointer

Recommended: one line, inserted after the roster lane's "Seat land review" bullet, carrying the core
behaviour inline:

```
- Seat guide: the seat starts each builder or reviewer once, acts only on its exit, and never polls or reads its partial work. The full guide is `$HOME/nana-pi/packages/nana-pack/rules/nana-seat.md`.
```

Why a pointer and not the whole guide:
1. The region fans out to every project's AGENTS.md through `nana-setup project` and the template renders
   (`templates/_shared/working-under-nana-pi.md` is the single source, AGENTS.md:68-99 the copy); 24 more
   lines would grow every project's always-loaded context.
2. pi loads AGENTS.md into every session in the cwd, including builder and reviewer children
   (`NANA_HANDOFF=off` row of the region's table). Seat-only text there costs every child tokens, and
   "end your turn" read by a headless builder is the exact failure in E22.
3. One source: the Claude Code seat already gets the rule file; a full copy in the region duplicates it.
4. The Windows Claude Code seat may not see AGENTS.md at all: `HANDOFF.md:81` warns that the owner's Windows
   clone's `CLAUDE.md` may be a one-line text file reading `AGENTS.md`. The rule file is the only sure route
   for that seat, so the region cannot be the Claude delivery path anyway.

Why the pointer carries one behaviour inline: prior art says a pi session does not open a file a rule
merely names (`docs/reviews/writing-trial-2026-10-04/design-ruling.md:326`, A3). The inline clause
delivers the owner's actual complaint even if the pi seat never opens the guide. Keep its words aligned with
guide bullets 5-6 so one thing has one name. The pointer passes `nana-writing.mjs` with zero findings.

Stronger option for the plan's options section (not this lane by default): a pack extension appending
`nana-seat.md` to pi sessions with no `NANA_ROLE`, as `nana-writing.ts` does for the writing rule
(`packages/nana-pack/extensions/nana-writing.ts:3-4`; delivery rationale
`design-ruling.md:263`, A1). Cost: a new extension, tests and rows. Revisit if a pi seat is seen polling.

File location: put the canonical file in `packages/nana-pack/rules/` beside `nana-writing.md`, the
precedent for "one source for both runtimes" (`packages/nana-setup/lib/steps.mjs:46-55`, `ruleSource`).
The alternative, `packages/nana-setup/claude/rules/`, reads as Claude-only and is wrong for a pi seat.

## 5. Mac- or Claude-specific rules (worded for both seats and both platforms above)

| # | Rule as practised on the Mac Claude seat | Problem elsewhere | Wording chosen |
|---|---|---|---|
| F1 | `run_in_background`, then the completion notification | Claude Code only. pi 1.0.2 `bash` blocks with no default timeout (E24); a pi seat that backgrounds with `&` gets no signal and would have to poll | Line 5 names both: background task in Claude Code; one foreground command with no timeout in pi |
| F2 | Two lanes in flight in one session | A pi seat blocks on its foreground launch, so its second lane needs a second pi seat session (inferred) | "at most two lanes in flight" stays; the plan may add "a pi seat runs one lane per session" |
| F3 | Monitor tool, heartbeats, `/loop`, cron | Claude Code tools; pi has none | Generic "monitor, heartbeat or timer" |
| F4 | Sonnet builder as a seat-spawned Claude subagent | Claude seat only; it has no pi-watchdog, so "its watchdog ends a stalled run" does not cover it (no recorded hang; inferred low risk) | Line 7 says "a launcher run"; no model names anywhere (the roster is per machine) |
| F5 | `pi-worker` and `pi-review` on PATH | Mac and Linux only; Windows runs them through `node "$HOME/nana-pi/…"` | Owned by the roster lane's bullet; the guide names no command |
| F6 | Lessons live in shared memory | The Windows seat's shared memory is the empty seed (`packages/nana-setup/claude/memory/MEMORY.seed.md`; `steps.mjs:556-558`) | Guide is self-contained and cites no memory file |
| F7 | Rules are symlinks into the checkout | win32 installs rules as copies (`steps.mjs:11-12,115`; `R-301` is the non-win32 row); an edited guide reaches Windows only after re-running nana-setup | Note for the README and doctor, not the guide |
| F8 | The Claude seat reads AGENTS.md through `CLAUDE.md` | Windows clone may hold a one-line `CLAUDE.md` text file (`HANDOFF.md:81`) | The rule file, not the region, is the Claude route |
| F9 | nana-pi commands: `npm run test:locked`, install check "on macOS", `map:check` | The rule is global (every project) | Line names the checks generically: "requirements trace, code map, README check" |
| F10 | Ending the turn while a job runs | A headless seat (`claude -p`, `pi -p`) exits (E22) | Last line |
| F11 | Bash tool background tasks | On Windows the PowerShell tool may be the primary shell (`user_owner_windows_both_seats.md:10`); whether it accepts a background flag is UNVERIFIED. The Bash tool (Git Bash, installed on the owner's machine) does | "as a background task", tool-neutral |

## 6. Conflicts and open items

- C1 (needs a decision; Open for the owner if the planner agrees): `feedback_probe_all_background_work.md:10,16-24`
  is the owner's 07-24 and 08-06 ruling: arm an event monitor plus a 30-minute liveness heartbeat on every long
  background process. Its index line loads in every Mac Claude session (shared `MEMORY.md`, "Probe all
  background work"). Guide bullet 7 contradicts it for launcher runs. The memory itself named the fix:
  "loop-status/watchdog should own this probe" (`:14`); pi-watchdog now does (E23), and pi-review's retries
  mean mid-run STALL lines would wake the seat for nothing. Recommend: scope that memory to runs with no
  watchdog (governed loops), and state the narrowing to the owner in one line. Without it, the Mac seat holds
  two rules that fight.
- C2: `nana-soul.md:42` "Progress over silence. During long tasks, send brief status updates" can read
  as "go check progress". Guide bullet 10 resolves it (the update says what runs, not how far it got).
  Do not edit nana-soul in this lane (the roster lane edits the same section).
- C3: "builders build" is stricter than recent practice: the seat rewrote the README scanner itself on
  fresh-install (`feedback_lane_process_2026_10_11.md:26`), and that cost a round. "Fix only a one-line
  slip" extends the owner's 10-13 "one-line fixes get a direct answer" (E25) from his requests to lane work.
  That is the seat's inference; the plan should say so.
- C4: the default-pattern sentence (E25) is NOT in the guide; the roster lane carries it in both
  `nana-soul.md` and the shared region.

## 7. Expected conflict with feat/roster

- `templates/_shared/working-under-nana-pi.md` and AGENTS.md's region copy: roster inserts two bullets
  directly before "Project-specific overrides" (hunk `@@ -27,4 +27,6 @@`; AGENTS.md `@@ -95,6 +95,8 @@`)
  and rewrites AGENTS.md's "Working pattern" intro line (`@@ -63,7 +63,7 @@`). A pointer planned on
  5b53ebc at the same anchor conflicts textually. Plan the pointer after roster's "Seat land review"
  bullet, on the post-roster main.
- `packages/nana-setup/claude/rules/nana-soul.md`: roster appends two Work-habits bullets
  (`@@ -45,6 +45,8 @@`). The seat guide does not touch nana-soul, so no conflict.
- `packages/nana-setup/README.md`: roster changes one line in "Platforms" (`@@ -371,7 +371,7 @@`); the
  seat guide edits the rules list elsewhere in that file — likely a clean merge, check after the rebase.
- `REQUIREMENTS.md`, `docs/code-map.md`, `docs/requirements-tree.md`: roster adds R-1120 to R-1128; the
  range R-1140 to R-1149 is free on main and on feat/roster (grep count 0). Expect a tail merge only.
- Install rows to amend (pointer for the install researcher): `R-301` (REQUIREMENTS.md:700) names exactly
  three rules; `restore.test.mjs:52`, `state-manifest.test.mjs:57` and `install.test.mjs:108` list them.
