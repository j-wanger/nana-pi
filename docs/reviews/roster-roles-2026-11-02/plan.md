# Plan — roster-roles (2026-11-02), revision 2

Lane class: `hook: packages/nana-pack/extensions/nana-roster-notice.ts — pi extension` (run on the revision 2 file list; revision 1's list, without the two notice entry points, printed `hook: packages/nana-pack/bin/nana-roster.mjs — directly imported by packages/nana-pack/extensions/nana-roster-notice.ts`). This is a hook lane: land reviewer, the seat's wrong-code pairs, one independent check, and the local macOS install check before the land.

Base: origin/main 7c4e7e19. Revision 2 answers the adversary's attack (`plan-attack.md`, pi gpt-6-astra, 5 MUST and 5 SHOULD) and records the owner's two answers. The disposition list is at the end.

## Purpose

The owner's words, 2026-11-02, in order:

- "ok go with your recommendation, do we not need to add specific role for planner then? to at least add clarity? and for future better context management for each role"
- "A now, working towards B and C; scout should be kept, and it should be used for code scout and research gathering"
- On this plan's two questions: "defaults".

Agreed reading A: the machine roster gains slots for the planner, the adversary and the independent checker, beside scout, builder, largerBuilder, reviewer and land. Each slot takes a pi entry or a Claude Code entry. Scout stays and is used for code scouting and research gathering for the seat. A seat starts each of these roles through an existing launcher with the slot's model. Each launch appends a line to the existing load log (FEAT-041) naming the role. B (a per-role context bundle) and C (memory per role) attach later; neither is built now.

What this fixes: today planners, adversaries, independent checks and research all run as Claude subagents on the seat's own model, because the roster names no slot for them and no launcher starts them. On this Mac that puts the adversary in the planner's lineage and the checker in the reviewer's (Claude opus) lineage.

Design. Three optional slots, `planner`, `adversary` and `checker`, join the `roster` object the way `largerBuilder` did on 2026-10-16: an absent slot reads as null, and null has a printed token. `scout` becomes Claude-Code-capable like the three new slots. `pi-worker` gains one non-lane mode, `pi-worker --slot <scout|planner|adversary|checker> --brief <file> --out <file> [--max-secs N]`. It resolves the slot or its fallback into one internal launch specification, builds the pi or `claude -p` argv with the code lane mode already uses, and appends one load-log line, after the child has spawned, naming the role and the slot that supplied the entry. The roster command, `--json`, `set` and both notices show the new slots. The notice and the role launch line report lineage for the two pairs that must differ. The seat guide, the shared working pattern and one new ruling tell each seat how to start these roles.

Fallbacks (answered by the owner, "defaults"):

| Slot | Absent or null | Printed token | Why |
|---|---|---|---|
| `planner` | the seat plans itself, as today | `seat` | Planning needs the seat's conversation; a roster without the slot keeps today's behaviour and spend. |
| `adversary` | the `builder` entry | `builder` | `builder` is mandatory and always a pi entry, so it is always launchable. |
| `checker` | the `builder` entry | `builder` | Same; and on a roster whose small builder differs from the reviewer, the checker does too. |
| `scout` | the seat scouts itself, as today | `none` (unchanged) | Existing token and meaning; changing it would break `set scout none`. |

A fallback is never silently swapped for another model. When a pair shares a lineage or its lineage cannot be known, the seat is told (MM8); the owner changes the slot.

Lineage. Lineage is judged on the resolved entries, fallbacks included, through one sealed alias map: `claude-code` and the pi provider `anthropic` read as `anthropic`; `openai` and `openai-codex` read as `openai`. The builder sets the exact provider list from pi's installed provider names and records the source. Any other provider reads as unknown. The seat's own lineage is `anthropic` for a Claude Code seat and unknown for a pi seat, since pi's notice cannot know the seat model. Two pairs are checked: adversary against planner (the seat when the planner is `seat`) and checker against reviewer. A known shared lineage reads `shared`; an unknown side reads `unverified`. Worked cases:

- This Mac (builder openai-codex gpt-6.1-sol medium, reviewer claude-code opus, Claude Code seat): adversary openai versus planner seat anthropic, checker openai versus reviewer anthropic. Both differ; nothing is shown.
- A pi seat on any roster with no planner slot: adversary versus planner is `unverified`.
- The sealed default roster, or a file a `set` wrote whole from it (builder luna and reviewer sol, both openai-codex): checker versus reviewer is `shared`.

Older checkouts. main's validator refuses any `roster` field it does not know, and refuses a Claude Code entry on `scout`. So setting `planner`, `adversary`, `checker` or a Claude Code `scout` makes a checkout older than this lane refuse the whole roster. This lane limits that to those deliberate operations: `set` never writes a new slot nobody named (MM3). Recovery on such a machine: pull, or `set <slot> <null token>` (or a pi scout) from the new checkout, or copy `nana-pack.json.bak` back. The README states both incompatible operations and the recovery.

## Assumptions

- A1. A role child keeps `NANA_ROLE=worker`. The `LAUNCHER_ROLES` readers (`packages/nana-setup/lib/stale-copies.mjs`, `packages/nana-pack/extensions/nana-rulings.ts`, `packages/nana-pack/lib/frontier-summary.mjs`, `packages/nana-pack/bin/nana-issue-watch.mjs`, `packages/nana-pack/lib/main-ci.mjs`) treat only `reviewer` and `worker` as launcher children. A new value would hand a planner the seat guide, the frontier summary and the issue watch. The requested role travels inside pi-worker in one launch specification `{role, slot, entry, cwd, brief, parts, tools, env}`. Prompt assembly, logging and any later role policy read that one object.
- A2. Role mode delivers only the brief, plus the existing Claude settings carry for a Claude Code entry. No preamble, known-bug digest or planner prompt is appended by the launcher; the seat's brief names what to read, as today.
- A3. Role mode runs in any folder: the lane worktree for planner and adversary, a private clone for the checker, any checkout for the scout. It sets `NANA_WORKTREE_ROOT` to that folder, so the pi gate confines edits there and to temp roots, as for a lane builder. It takes no lane lock, writes no build record and prints no lane class.
- A4. Tools. Planner, adversary and checker use lane mode's sets (`LANE_DEFAULTS.tools` for pi, `CLAUDE_BUILDER_TOOLS` for Claude Code). A Claude Code scout adds `WebSearch` and `WebFetch` to that set, through one new sealed scout tool list, because the owner named research gathering. A pi scout has no web tool in pi's defaults and gathers through bash (`gh`, `git`, `curl`) and local files; the README says so. Every other per-role tool choice is B.
- A5. Role mode uses lane mode's 8-hour ceiling (`LANE_MAX_SECS`, overridable by `--max-secs`), `--retries 0` only, and Claude Code's disabled stall stop.
- A6. The flag is `--slot`, not `--role`: pi-worker already refuses `--role` as a review option before reading anything (README "Workers"), and that guard stays.
- A7. `pi-worker --slot builder`, `largerBuilder`, `reviewer` and `land` are refused: builders go through lane mode, reviewers through `pi-review` or `claude-review`, land through `nana-land`.
- A8. Print order appends the new slots after land: `scout, builder, largerBuilder, reviewer, land, planner, adversary, checker`. After machine-lane-limits lands, its `lanes:` line follows the slots and precedes `source:`. Existing positions and `--json` order for the old five stay put.
- A9. One new ruling records the owner's decision: "2026-11-02: The roster names a slot for the scout, planner, adversary and checker; a seat starts each through its slot." The 2026-10-16 and 2026-10-17 rulings stay. The four roles are available, not four mandatory launches per lane: the adversary stays once per plan and the checker once per install, hook or gate lane, as the rulings already say; scout and planner launches are the seat's choice.
- A10. Feature placement: FEAT-041. Amended roster rows stay in FEAT-006 and notice rows in FEAT-023 where they live.
- A11. B and C promise, narrowed: they need no roster-schema change and no launcher-interface change. B changes how role mode fills the launch specification's parts and tools. C delivers role memory explicitly as one more part; it does not enable Claude Code's automatic memory, which stays off for every launched child. The memory-factory design's "What each stage needs" table has no checker or scout row; B adds them.
- A12. The lane-mode load-log timing fix (MM5) applies to lane builds too, because both modes share the moved code. Today lane mode logs before the child's spawn outcome is known.

## Open choices

- O1. The exact launch line text. Lane mode prints `pi-worker: builder: <tokens>; source: <file>`. Role mode prints the same shape with the role, the supplying slot when it differs, and any lineage word, for example `pi-worker: adversary (builder): openai-codex gpt-6.1-sol medium; lineage unverified; source: <file>`. MM4 and MM8 pin only those parts.
- O2. How lane mode's entry-to-argv code becomes shared. It is inline top-level script today (the lane block, about lines 148–230 of `pi-worker.mjs`). The builder factors it into one function both modes call, in the same file or a new `lib/` module. No copy (ruling 2026-10-22).
- O3. Notice wording for fallbacks and lineage, for example `adversary gpt-6.1-sol medium` versus `adversary builder`, and `lineage: checker shares openai with reviewer`. MM7 and MM8 pin the resolved model and the pair names.
- O4. Whether the alias map lives in `worker-config.mjs` or a small roster config module. It is one sealed value with its source and date.

## Questions for the owner

Both questions are answered. The owner's word on 2026-11-02 was "defaults".

- Answered: the three new slots live inside `roster`, as optional slots. The older-checkout cost of this choice is recorded under Purpose and in the README.
- Answered: an unset adversary or checker runs on the builder entry, printed `builder`; an unset planner means the seat plans, printed `seat`.

No new question. Every remaining choice is a marked assumption or open choice above.

## Feature

Feature: FEAT-041 · Shape each agent's context by role

## Threat model

In scope, honest variation in our tools' output:

- roster file shapes: absent file; a file holding only other members such as `lanes` or `objective`; a legacy four-slot roster; the fully written old five-slot roster a `set` creates (the laptop's file was just made this way); this Mac's file; the sealed default;
- a malformed new slot (wrong type, an unknown Claude Code model, a bad `thinking`);
- an older checkout reading a file this lane's `set` wrote;
- a missing `claude` or `pi` executable, a launch refusal, a child that fails after spawn, and an unwritable or unsafe load-log path;
- Windows: the Claude Code launch through an npm `.cmd` shim, a path with spaces, the wall-clock ceiling, and a forced stop of pi-worker;
- pi seats and Claude Code seats, which get the notice and the seat guide through different surfaces;
- a role slot whose fallback is `seat` or `none` being asked to launch.

Out: deliberate forgery of the roster file, the load log, or a child's environment. Out as residuals: a provider outside the alias map reads as unknown; a Claude Code seat running a non-Anthropic model through `ANTHROPIC_MODEL` or a gateway still reads as `anthropic`; a Windows forced stop removes the role's temp folder but does not kill a surviving child (`packages/nana-pack/lib/lane-watcher.mjs` ends no process on Windows, as for lane builds); a concurrent `set` and desk write (existing FEAT-006 known bug).

## Precedent

- `packages/nana-pack/bin/worker-config.mjs` — `OPTIONAL_SLOTS`, `CLAUDE_CODE_SLOTS`, `SLOT_PRINT_ORDER`, `SLOT_NULL_TOKENS`, `LANE_SIZE_SLOTS` and `CLAUDE_BUILDER_TOOLS`: add the three slots exactly the way `largerBuilder` was added on 2026-10-16; add `scout` to `CLAUDE_CODE_SLOTS`; the fallback map follows `LANE_SIZE_SLOTS`'s shape and provenance comment; the scout tool list follows `CLAUDE_BUILDER_TOOLS`.
- `packages/nana-pack/bin/nana-roster.mjs` — `validateRosterShape`, `entryProblem`, `formatRosterLines`, `orderedRoster`: the new slots ride the same validator and printer.
- `packages/nana-pack/lib/roster-set.mjs` — `setRosterSlot` works off `SLOT_PRINT_ORDER` and `SLOT_NULL_TOKENS`, so `set planner …` needs no new parser. Its write of the normalised roster is what would add absent slots; MM3 sets the write rule.
- `packages/nana-pack/lib/pack-config-write.mjs` — the member write `set` uses, which keeps other top-level members; unchanged.
- `packages/nana-pack/tests/nana-roster-set.test.mjs` — already covers absent-file creation; its cases extend to the four file shapes in MM3.
- `packages/nana-pack/bin/pi-worker.mjs` — lane mode's roster resolve, entry-to-argv for pi and Claude Code, `claudeLaunch` through `reviewLaunch`, the settings carry, `contextLoad` and `onSpawn`, and the capture-folder cleanup that today runs only in lane mode. Role mode is its second caller (O2).
- `packages/nana-pack/bin/pi-watchdog.mjs` — calls `onSpawn` right after `spawn()`, before the child's `spawn` or `error` event. The load line must wait for the child's `spawn` event.
- `packages/nana-pack/bin/claude-review.mjs` — logs on `child.once('spawn', …)`, the timing MM5 adopts; and starts the cleanup-only `startLaneWatcher` on Windows with a sentinel lock inside its private folder and that folder as `commonDir`. Role mode calls the same function the same way.
- `packages/nana-pack/lib/lane-watcher.mjs` — resolves `lock` and `commonDir` paths, so the sentinel form above is required; it ends no process on Windows.
- `packages/nana-pack/bin/review-launch.mjs` — the Windows-safe child launch lane mode already uses for `claude`.
- `packages/nana-pack/lib/context-load-log.mjs` — `appendContextLoad` and `contextPart`; the record already has a `role` field. Unchanged module.
- `packages/nana-pack/lib/roster-notice.mjs` and `packages/nana-pack/lib/roster-notice-config.mjs` — `rosterSegment` and `entryText`; new segments follow `reviewer …, land …`. `rosterNotice` gains the seat's runtime as an input for lineage.
- `packages/nana-pack/extensions/nana-roster-notice.ts` and `packages/nana-setup/claude/hooks/nana-roster-notice.mjs` — both call `rosterNotice`; each passes its own runtime.
- `packages/nana-setup/claude/rules/nana-seat.md` — the bullet "In Claude Code, launch each builder or reviewer as a background task …; in pi, run it as one foreground command" extends to role launches; one new bullet names `pi-worker --slot` and the Node form.
- `templates/_shared/working-under-nana-pi.md` and `AGENTS.md` — the "Default pattern" bullet, which already gives the Node fallback for Windows; the shared file is the single source and AGENTS.md's marker region must match it (`packages/nana-pack/tests/templates-render.test.mjs`).
- `packages/nana-pack/rules/nana-rulings.md` — one new dated ruling line (A9).
- Tests to extend, not copy: `packages/nana-pack/tests/nana-roster.test.mjs`, `packages/nana-pack/tests/nana-roster-set.test.mjs`, `packages/nana-pack/tests/roster-notice.test.mjs` (including the R-1199 case it replaces), `packages/nana-setup/tests/roster-notice-hook.test.mjs`, `packages/nana-pack/tests/worker-claude.test.mjs` and `packages/nana-pack/tests/worker-lane.test.mjs` (fake pi and fake claude fixtures, Windows shim cases), `packages/nana-pack/tests/context-anatomy.test.mjs` (R-3215 load-line assertions), `packages/nana-setup/tests/seat-rule.test.mjs`, `packages/nana-pack/tests/templates-render.test.mjs`, `packages/nana-pack/tests/rulings.test.mjs`.
- From `npm run map:search`: "resolve roster slot entry" and "launch worker with roster model claude code" returned the roster command, both notices, `claude-review.mjs`, `pi-worker.mjs` and `worker-config.mjs`, all listed above. "append context load line role" added `packages/nana-pack/lib/outcome-meter.mjs`, the reader that splits logged context by role and launcher; unknown role names get numbered aliases, so no change is needed. "seat guide roles launch" added `packages/nana-pack/lib/rulings-config.mjs` (`RULINGS_READ_CAP`; the new ruling must stay under it) and `packages/nana-setup/lib/steps.mjs` (installs the seat guide; no change expected).

Known bugs read: `docs/known-bugs/FEAT-041.md`, `docs/known-bugs/FEAT-006.md` (roster `set` writing an empty larger-builder slot is the precedent MM3 must not repeat for the new slots), `docs/known-bugs/FEAT-023.md` (the pi widget wraps at 80 columns; more entries make it longer).

Overlap with machine-lane-limits (about to land; R-3520 to R-3523). It adds a top-level `lanes` member, a `lanes` field on the resolver result, a `lanes: <limit>` line after the slots and before `source:`, a third `formatRosterLines` argument, a `lanes` segment after land in `rosterSegment`, two notice constants, and edits the README "Machine roster" paragraph, the nana-seat.md lane-limit bullet and the rulings file. This lane touches the same functions and paragraphs. Rebase on main after it lands, before build 1 if possible. After the merge: slot lines (old five, then the three new), then `lanes:`, then `source:`; in the notice, roles and any lineage segment go after land and before `lanes`. Take new row IDs above that block.

## Outside precedent

- Aider (github.com/Aider-AI/aider, Apache-2.0) — borrow. It names one model per role in one config (`--model`, `--editor-model` for architect mode, `--weak-model` for commit messages and summaries), and an unset role model falls back to a named sibling rather than failing. This lane borrows the shape: role slots in the one machine roster, each with an explicit fallback slot and a printed token for it. Skip its per-role edit formats; per-role context is B.
- Also looked at: crewAI (MIT), where each agent carries its own `llm` and an unset one falls back to the process default. Same idea, less explicit about fallbacks; nothing further taken.

## Must-meet

MM1. An old roster still works. Proves: this Mac's file and the laptop's whole-written old five-slot file each resolve `ok`; the roster command prints the old five lines unchanged, then `planner: seat`, `adversary: builder`, `checker: builder`, then the remaining lines (`lanes:` once machine-lane-limits is in, then `source:`), and exits 0; `--json` carries the three new keys as null after land. Rows: amended R-1121, R-1123, R-1192. Pins those three lines and their place after land.

MM2. Each new slot, and scout, takes a pi entry, a Claude Code entry or its null token, and a bad one is refused by name. Proves: `set planner claude-code opus`, `set adversary openai-codex gpt-6.1-sol high`, `set checker builder` and `set scout claude-code sonnet` each succeed and print the slot back; a file with `"checker":{"runtime":"claude-code","model":"gpt-6"}` is refused naming `roster.checker.model`; a file with `"planner":"opus"` is refused naming `roster.planner`. Row: amended R-1122. Pins the refusal's slot path.

MM3. `set` adds no slot nobody named, so older checkouts keep reading the file. Rule: `set` writes the named slot, every slot already present in the file's roster, and nothing else; a file with no `roster` member gets today's whole old five-slot shape (`largerBuilder: null` included, which every checkout since 2026-10-16 accepts, so the laptop's shape is unchanged). Every other top-level member is kept byte-for-value. Proves, for four starting shapes — absent file, a file holding only `{"lanes":2}`, a legacy four-slot roster, and the laptop's old five-slot roster — that `set builder openai-codex gpt-6.1-sol medium` writes no `planner`, `adversary` or `checker` key, keeps `lanes`, and that a frozen copy of main's 7c4e7e19 acceptance rule (roster keys within scout, builder, largerBuilder, reviewer, land; scout not a Claude Code entry) accepts the result. The four-slot case gains `largerBuilder: null`, as on main; that is stated, not accidental. New row.

MM4. A seat starts each role on its slot's model through `pi-worker --slot`, and a role that belongs to the seat is refused. Proves, with fake pi and fake claude: `--slot planner` with a pi entry starts pi with that entry's `--provider`, `--model` and `--thinking`, the brief appended, and `NANA_ROLE=worker` and `NANA_WORKTREE_ROOT=<cwd>` in its environment; `--slot checker` with a Claude Code entry starts `claude -p --model <model>` with the sealed builder tools; `--slot scout` with a Claude Code entry starts it with the builder tools plus `WebSearch` and `WebFetch`; `--slot adversary` with no adversary slot starts the builder entry and its launch line names both `adversary` and `builder`; output lands in `--out`. Refusals, each exit 1 with one stderr line and no child, temp folder or load line: `--slot planner` with no planner slot (naming `seat`), `--slot scout` with a null scout (naming `none`), `--slot builder`, `reviewer` or `land` (naming the launcher to use), and `--slot` with `--lane`, `--lane-size` or caller pi arguments. New row.

MM5. A role launch logs one load line once its child has spawned, and only then. Proves: a launch whose child spawns appends exactly one versioned line with `launcher: "pi-worker"`, `role` the requested role, `slot` the slot that supplied the entry (`builder` for a fallback adversary), `runtime`, `model`, `cwd` and parts holding the brief (plus `settings` for Claude Code); a child that fails after spawning still leaves exactly one line; a missing executable (`ENOENT`) and a launch refusal leave zero lines; an unsafe or unwritable log path leaves zero lines, one `nana context load skipped:` stderr line, and the same child argv and exit; a plain non-lane `pi-worker -- …` run logs nothing. Lane builds share the timing (A12). Rows: new row; R-3215 amended to "plain non-lane workers log nothing" and to the spawn timing.

MM6. A role launch cleans up on every end it can see, on Windows too. Proves, on the Windows CI leg with a fake claude `.cmd` shim under a folder whose path holds a space: a Claude Code role launch runs once and passes its arguments unchanged; its temp settings and prompt folder is gone after a normal exit and after the `--max-secs` ceiling; after a forced stop of pi-worker the cleanup-only watcher removes that folder; in every case no lane lock, no build record and no lane-class line exist, and the child started exactly once. The README states that a surviving Windows child is not killed. New row.

MM7. Both seats see the roles at session start. Proves: the composed notice for this Mac's roster contains `planner seat`, `adversary gpt-6.1-sol medium` and `checker gpt-6.1-sol medium` after the land entry; it contains `scout <model>` (with the Claude Code mark for a Claude Code entry) when scout is set, and no scout when scout is null; the Claude Code hook and the pi extension emit the same roles. Rows: amended R-1194; R-1199 ("The roster notice shall name no scout, set or null") retired, with a new row for the set and null scout cases replacing its negative test. Pins those substrings and their order after `land`.

MM8. The seat is told when a role pair shares a lineage or cannot be checked. Proves, on resolved entries with fallbacks: on this Mac's roster in a Claude Code seat, neither the notice nor a role launch shows a lineage word; in a pi seat with no planner slot, the notice and the `--slot adversary` launch line both say adversary versus planner is unverified; on the sealed default roster, and on a file `set` wrote whole from it, both say checker shares `openai` with reviewer; `openai` and `openai-codex` read as one lineage, and a pi `anthropic` entry and a `claude-code` entry read as one; no launch is refused and no entry is swapped. One sealed alias map, pinned by one test. New row.

MM9. The seat guide and the shared pattern tell a seat how to start a role. Proves: the seat guide names the launcher `pi-worker --slot`, the four roles, its Node form `node "$HOME/nana-pi/packages/nana-pack/bin/pi-worker.mjs" --slot …` with a PowerShell form `node "$env:USERPROFILE\nana-pi\packages\nana-pack\bin\pi-worker.mjs" --slot …`, and that a role whose roster line reads `seat` or `none` runs in the seat; the existing Claude Code background and pi foreground bullet names role launches beside builders and reviewers; the shared working pattern and AGENTS.md carry the same pointer; the ruling line exists. The test checks that those names, commands and exceptions appear, not one frozen sentence. New row.

Rows needed: seven new rows under FEAT-041 (MM3, MM4, MM5, MM6, MM8, MM9, and the scout-notice row from MM7), at the next free IDs above machine-lane-limits' R-3520 to R-3523; amended R-1121, R-1122, R-1123, R-1192 (FEAT-006), R-1194 (FEAT-023) and R-3215 (FEAT-041); R-1199 retired. Sealed tunables, each with one pin test naming its row: the fallback map (MM1's rows), the scout tool list (MM4), the lineage alias map (MM8).

Expected test edits (forecast, not a limit): the exact-line tests for R-1123 and R-1192 in `nana-roster.test.mjs`; the exact notice strings in `roster-notice.test.mjs` and `roster-notice-hook.test.mjs`; the R-1199 negative test, replaced (a contract reversal, not a string update); the R-3215 cases in `context-anatomy.test.mjs`, whose lane-mode log timing changes; the seat-guide and shared-pattern text checks; the rulings file checks.

Planned files: `packages/nana-pack/bin/worker-config.mjs`, `packages/nana-pack/bin/nana-roster.mjs`, `packages/nana-pack/lib/roster-set.mjs`, `packages/nana-pack/lib/roster-notice.mjs`, `packages/nana-pack/lib/roster-notice-config.mjs`, `packages/nana-pack/extensions/nana-roster-notice.ts`, `packages/nana-setup/claude/hooks/nana-roster-notice.mjs`, `packages/nana-pack/bin/pi-worker.mjs`, `packages/nana-pack/README.md` (Machine roster, Workers, Role context and load log), `packages/nana-setup/claude/rules/nana-seat.md`, `templates/_shared/working-under-nana-pi.md`, `AGENTS.md`, `packages/nana-pack/rules/nana-rulings.md`, `REQUIREMENTS.md`, the tests above, the code map, `HANDOFF.md` and the session note.

## Disposition of the attack

1. MUST, fallback does not establish independence on a pi seat — taken. Lineage is judged on resolved pairs with fallbacks, through one alias map that joins the OpenAI and the Anthropic aliases. An unknown side reads "unverified". The diagnostic is in the notice and on the role launch line, not only in the roster command. No model is swapped (MM8). The roster-command-only warning of revision 1 is dropped.
2. MUST, MM3 misses the laptop's whole-file path — taken. MM3 now covers absent file, a `lanes`-only file, a legacy four-slot roster and the laptop's whole-written five-slot roster. It requires no unrequested new slot, kept other members, and acceptance by a frozen copy of main's rule. It states that a four-slot roster still gains `largerBuilder: null`, as on main.
3. MUST, showing scout breaks R-1199 — taken. R-1199 is retired with a replacing row and test (MM7), and the forecast names it as a contract reversal. MM1 now places the new lines before `lanes:` and `source:`.
4. MUST, load line can record delivery when no child started — taken. The line is written on the child's `spawn` event, as `claude-review` does. MM5 tests a missing executable, a launch refusal, a failure after spawn and an unusable log path. "Exactly one" is now qualified to a spawned child. Lane mode gains the same timing (A12).
5. MUST, Windows cleanup and lifecycle untested — taken. MM6 covers a `.cmd` shim, a path with a space, the ceiling, a forced stop through the sentinel-lock cleanup watcher, no lane lock, build record or lane class, and one attempt. The Windows child-survival limit is a stated residual.
6. SHOULD, Claude Code scout also breaks older checkouts — taken. The compatibility note and README name both incompatible operations (a new slot set, a Claude Code scout) and the recovery. Storage stays inside `roster`, as the owner answered. MM3's frozen rule includes the scout check.
7. SHOULD, research gathering not shown — taken in part. A Claude Code scout gets `WebSearch` and `WebFetch` through one sealed list, tested in MM4. A pi scout gathers through bash and local files, because pi's defaults have no web tool; the README says so rather than claiming more. Wider per-role tools stay B.
8. SHOULD, B and C need more than one function — taken. One internal launch specification carries the role to prompt assembly, logging and later policy (A1). The promise is narrowed to no roster-schema or launcher-interface change. C is explicit role-memory delivery, not automatic memory (A11).
9. SHOULD, MM8 mixed lineage with guidance and pinned prose — taken. Lineage is MM8; guidance is MM9, tested for names, commands and exceptions, not one sentence. Existing rows are amended where behaviour expands; new rows only for new contracts. A9 says the four roles are available, not four mandatory launches.
10. SHOULD, Windows-native form and scheduling guidance — taken. MM9 adds the Node and PowerShell forms and extends the existing Claude Code background and pi foreground bullet to role launches.
