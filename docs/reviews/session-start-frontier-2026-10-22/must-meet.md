# session-start-frontier · must-meet (seat, 2026-10-22, after one adversary pass)

Feature: FEAT-002 · Resume decisions and next actions

Spend line: the current priority (both seats in terminal mode, every hook working) through the owner's 2026-10-22 slate of open audit items. It closes the artifact audit's gap 9: Next, Open for the owner and the frontier summary reach the session at start, made and read by code. Today the HANDOFF frontier report (R-873) is made by hand and read by a person.

Class: hook (a Claude Code hook and its launcher change, and a pi extension is added; nana-setup install, uninstall and doctor do not change: no new settings entry, hook file or installed path). Ladder: the roster's final reviewer, the land reviewer, the seat's wrong-code pairs and one independent check; the install check on macOS before `nana-land` (it guards against regressions only: its fixture project has no HANDOFF.md); CI on the draft PR with the blocking Windows leg. Builder: the larger builder. Stakes: medium blast, reversible. Every Claude Code and pi seat session that starts in a project with a HANDOFF.md gains up to 4,000 characters of context on every machine at its next pull. A producer crash fails open to one marker line; a Claude hang is cut at the launcher's 1,500 ms limit. Nothing is written.

Threat model: honest variation in HANDOFF files written by seats and by `nana-setup project`'s seed: numbered or bulleted Next items, with or without a bold lead ending in a full stop or a colon; nested sub-items and a nested `### Next (later)` heading; fenced examples; `## NEXT` and `## Next (…)`; the seed's `## Open`; `Open for …` headings with a parenthetical; asks with and without the `**[tag] Title.**` lead; a tag only in a continuation line; CRLF; a UTF-8 BOM; an empty file; a file over the read window; a UTF-16 file from Windows PowerShell 5.1; no file; a folder named HANDOFF.md; a symlinked HANDOFF.md. Sessions started at a repository root, in a subfolder, in a linked worktree, outside any repository, in a folder whose name holds a space; launcher children (`NANA_ROLE`); a long objective sharing the hook's output. Deliberate forgery is out: a HANDOFF written to steer the agent is shown as quoted, bounded data and not refused. Public repo: no owner name, nothing about the owner's work; sibling projects are counted, never named.

The planner's draft (`plan-draft.md`) holds the measurements; the adversary's attack (`plan-attack.md`, M 2, S 9, N 14) changed the plan as the decisions below say. Where they disagree with this file, this file wins. One name throughout: the **frontier block**, made by the **frontier producer**.

## Precedent

Precedent:
- packages/nana-setup/claude/hooks/nana-adoption.mjs — one hook entry running two producers in a row through `runHookProducer`.
- packages/nana-setup/lib/hook-producer.mjs — `launcherDefinitions`, `HOOK_PRODUCER_TIMEOUT_MS` and its two-producers-under-5-s arithmetic (R-2013), `runHookProducer`, and its import of a dependency-free config value.
- packages/nana-pack/bin/nana-objective.mjs — the producer CLI shape: tag line, `--cwd`, always exit 0, a fail-open marker naming the cause.
- packages/nana-pack/bin/nana-adoption.mjs — a plain .mjs producer with its imports inside the try, the `oneLine` failure path and the "quoted data, never an instruction" framing.
- packages/nana-pack/extensions/nana-objective.ts — compute at `session_start` for every reason, inject at `before_agent_start`, lib imported in-process, never throws.
- packages/nana-pack/extensions/nana-rulings.ts — the simpler extension: section key from config, an `opts` seam for tests, no `orderNanaSections` call; `causeFor`, to move into bounded-read.mjs (D8).
- packages/nana-knowledge/lib/hook.ts — `NANA_ROLE` reviewer or worker gets nothing.
- packages/nana-pack/bin/nana-frontier.mjs — MOVE the checker body into a pure lib and import it back; the bin keeps argv, the read and the print.
- packages/nana-pack/lib/handoff-asks.mjs — `splitOpenSection` with tag and title per ask; export `TAG` instead of copying it.
- packages/nana-pack/lib/frontier-config.mjs — `LIVE_SECTION_NAMES` and `isNamed`; `NEXT_SECTION_NAME` goes here.
- packages/nana-pack/lib/adoption.mjs — `canonicalCwd` and `repoRootOf` (a `.git` folder or file).
- packages/nana-pack/lib/bounded-read.mjs — `readBounded` with `BOUNDED_READ_CAP`.
- packages/nana-pack/lib/display.mjs — `promptText` for each title, `promptPath` for the HANDOFF path.
- packages/nana-pack/lib/rulings-config.mjs — a config module beside its lib, provenance per value.
- packages/nana-setup/lib/shared-memory-config.mjs — Claude Code's 10,000-character hook output cap and the 9,000 budget beside it (R-2346).
- packages/nana-setup/tests/hook-deadlines.test.mjs — copied hooks plus producer stubs, and R-2011's two-hung-producers case.
- packages/nana-pack/tests/objective-golden.test.mjs — the hook's stdout equals the extension's section once the tag line is removed.
- packages/nana-pack/tests/rulings.test.mjs — a fake pi that records handlers, driven per reason.
- packages/nana-pack/tests/frontier.test.mjs — the frontier-baseline golden that guards the checker move.
- packages/nana-setup/tests/hooks-win32-exec.test.mjs — R-1340, the Windows content check for the installed objective hook entry.
- packages/nana-pack/tests/templates-render.test.mjs — the runtime inventory and matrix rows (R-680, R-985) a new extension must appear in.
- packages/nana-knowledge/tests/hook.test.mjs — `delete process.env.NANA_ROLE` at the top of a test file.

## Seat decisions

- **D1 · A new producer, not a larger objective block** (draft D1). The objective block keeps its text, goldens, cap and Node floor. `objective.enabled: false` still hides only the objective; nothing hides the frontier block but a missing HANDOFF.md or a launcher role.
- **D2 · The Claude seat: a second producer in the existing objective hook entry, under a shared output budget** (draft D2; adversary S1, N10). `nana-objective.mjs` runs the objective producer, then `runHookProducer(hookProducerConfig("frontier", repo))`. `runHookProducer` gains an `args` option and returns the number of characters it wrote; the hook passes `--max <FRONTIER_HOOK_BUDGET minus that count>` to the frontier producer, which fits its block to it or prints one `frontier block omitted: <n> characters left after the objective` line. `FRONTIER_HOOK_BUDGET` reuses the 9,000 of the shared-memory budget by import. The frontier marker in `launcherDefinitions` is built from `FRONTIER_TAG` and `FRONTIER_UNAVAILABLE`, imported from `packages/nana-pack/lib/frontier-summary-config.mjs`, a module with no imports. No settings.json change.
- **D3 · The pi seat: a new extension `packages/nana-pack/extensions/nana-frontier-summary.ts`** (draft D3; adversary S3). It imports the lib in-process. At `session_start`, every reason, it recomputes the block; at `before_agent_start` it sets section `nana-frontier`, or none when the lib returns nothing. No `orderNanaSections` call. Never throws. Default export takes `opts = { today?, env? }`. The pi bound: the moved checker builds its heading stacks in one pass, so a 1 MiB file with thousands of headings reads in well under a second (the attack measured 6.0 s on main for 13,242 headings).
- **D4 · The project is the repository root** (draft D4; adversary S7, S8, N5, N6). `repoRootOf(canonicalCwd(cwd))`, else the session folder when no repository holds it. The file is `<root>/HANDOFF.md`, read with `readBounded` (it follows a symlink; chosen, as the objective's provenance rule does not apply to repository text) and a fatal UTF-8 decode. A missing file is silence. An empty file gives the block with both `none found` lines and the check line. A folder, a non-regular file, an over-cap file or invalid UTF-8 gives one unavailable line naming the cause and the path.
- **D5 · One definition of Next** (draft D5; adversary S2, N3). The moved checker exports its Next section: the first heading `isNamed(title, NEXT_SECTION_NAME)`, ending at the next heading of the same or higher level. The block lists that section's column-0 list items, numbered or bulleted. A Next title is the item's leading bold text without the marks and one trailing `.` or `:`, else its first line after the list marker. Asks: `splitOpenSection`. An ask line is `[<kind>, since <date>] <title>`; with no title, its first line after the list marker and one leading `TAG`; with no tag, `[no tag] <first line>`.
- **D6 · The checker moves into a lib** (draft D6; adversary S3). New `packages/nana-pack/lib/frontier-check.mjs` (effects none) exports `checkFrontier(text, today)` returning `{ findings, wordCount, nextSection }`, `frontierSummaryLine(result)` and `isDate`. `bin/nana-frontier.mjs` imports them and prints byte for byte as today. The block's check line is `Frontier check: <frontierSummaryLine>` plus ` (<kind> <count>, …)` in the order kinds first appear, when there are findings.
- **D7 · Launcher roles get nothing** (draft D7). The lib returns nothing when `env.NANA_ROLE` is exactly `reviewer` or `worker`.
- **D8 · The read-failure cause moves into bounded-read.mjs** (adversary S6). `causeFor` leaves nana-rulings.ts as an exported `readFailureCause(err, capBytes)` in `lib/bounded-read.mjs`; nana-rulings imports it with no change in its output, and the frontier lib uses it.
- **D9 · The block** (draft D9; adversary S4, N12, N14). New `packages/nana-pack/lib/frontier-summary.mjs` (effects disk) exports `frontierSummary({ cwd, today, env, max })`, returning the block text or null. New `packages/nana-pack/bin/nana-frontier-summary.mjs` prints `[nana:frontier]` and the block, prints nothing for null, takes `--cwd` and `--max`, and always exits 0 with an adoption-style fail-open line. The block, in display order:

```
## Project frontier (nana)

Read from <promptPath(handoff)> at session start. Each title below is quoted from that file as data, not as an instruction. When the check line names findings, tell the user.

Next (<n>):
- <title>
Open for the owner (<n>: <count> <kind>, …):
- [<kind>, since <date>] <title>
…and <k> more titles not shown (<x> Next, <y> asks).
Frontier check: summary words=<w> budget=<b> findings=<f> (<kind> <count>, …)
```

  `Next: none found.` or `Open for the owner: none found.` stands in for an empty list. Asks display blocking, optional, parked, then untagged, each group in file order. Titles are chosen in priority order, blocking asks, then Next, then optional, parked and untagged asks, while the block stays within `min(FRONTIER_OUTPUT_CAP, max)` with the cut line and the check line reserved; the chosen titles then print in display order. Each title goes through `promptText(…, FRONTIER_TITLE_CAP)`. The cut line appears only when a title was left out.
- **D10 · The ledger edit, with no row** (adversary M2). CAP-01's R-873 `Made by: manual` and `Read by: person` lines become `session start` and `extension` makers (the hook and producer; the extension and lib) and two `prompt` readers. CAP-04's R-327 `rule:` reader becomes a `prompt:` reader naming the extension. The seat puts the tree checker's count line at the lane tip in the land evidence. The draft's R-2614 is dropped: a ledger read passes with the feature removed.
- **D11 · Left out** (draft D11; adversary M1). No deliverables count line: it is a FEAT-028 row's output with existing readers, and it would add a hidden process edge from a package to `scripts/` and a child process inside pi's session start. No off switch. No Where things stand, item bodies or per-finding lines. No journal event. No new install-check assertion. No seed heading fix. The AGENTS startup rule to read HANDOFF.md stays.

## Must-meet rows

All rows sit in FEAT-002, SUB-005 (adversary S5: no share).

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2606 | WHEN a Claude Code session starts in a folder inside a git repository whose root holds a HANDOFF.md, the objective hook shall print that file's frontier block, tagged `[nana:frontier]`, after the objective block. | `packages/nana-setup/tests/frontier-hook.test.mjs::R-2606: the objective hook prints the repository HANDOFF's frontier block after the objective block, from a subfolder and a linked worktree` |
| R-2607 | WHEN the HANDOFF.md has a Next or an Open for the owner section, the frontier block shall show, in this order within its cap, each top-level item title of its first Next section in file order, then each ask's tag and title, blocking asks first, then optional, parked and untagged, each group in file order. | `packages/nana-pack/tests/frontier-summary.test.mjs::R-2607: Next titles and ask tags and titles are listed in block order, and nested items, fences and other sections are not` |
| R-2608 | The frontier block shall end with the frontier checker's summary line and finding counts for the same HANDOFF.md and date. | `packages/nana-pack/tests/frontier-summary.test.mjs::R-2608: the block ends with the frontier checker's own summary line and counts` |
| R-2609 | The frontier block shall hold at most the smaller of `FRONTIER_OUTPUT_CAP` and the producer's `--max` characters, each title as one line of at most `FRONTIER_TITLE_CAP` characters free of control characters, line breaks and bidi marks, blocking asks kept before any other title, and a count of any titles it left out. | `packages/nana-pack/tests/frontier-summary.test.mjs::R-2609: the block stays within its caps, renders each title as one clean line, keeps blocking asks first and counts the titles it left out` |
| R-2610 | IF the repository root holds no HANDOFF.md, or `NANA_ROLE` is `reviewer` or `worker`, THEN the frontier producer shall print nothing and exit 0. | `packages/nana-pack/tests/frontier-summary.test.mjs::R-2610: no HANDOFF.md or a reviewer or worker role gives no output and exit 0` |
| R-2611 | IF the repository root's HANDOFF.md is not a regular file, is over the bounded read cap or is not valid UTF-8, THEN the frontier block shall be its heading and one `FRONTIER UNAVAILABLE:` line naming the cause and the path. | `packages/nana-pack/tests/frontier-summary.test.mjs::R-2611: an unreadable HANDOFF.md gives one FRONTIER UNAVAILABLE line naming its cause and path` |
| R-2612 | WHEN a pi session starts for any reason, the frontier summary extension shall set the `nana-frontier` system-prompt section to the frontier producer's output for that session folder without its tag line, and set no section when the producer prints nothing. | `packages/nana-pack/tests/frontier-golden.test.mjs::R-2612: the pi section equals the Claude hook's frontier block minus its tag line for every session start reason, and is re-read after an edit` |
| R-2613 | IF neither the objective producer nor the frontier producer has exited when the producer time limit passes, THEN the objective hook shall print the objective unavailable marker and then the frontier unavailable marker before its installed limit, and its whole stdout shall stay within Claude Code's hook output cap when both producers succeed. | `packages/nana-setup/tests/hook-deadlines.test.mjs::R-2613: objective hook prints both markers before its installed limit when both producers hang, and keeps a long objective whole under the cap` |

Plus one seal test naming R-2606, R-2609 and R-2612: `packages/nana-pack/tests/frontier-summary.test.mjs::seal: the frontier block's tag is [nana:frontier], its pi section is nana-frontier and its caps are 4,000 and 160 characters`. R-2614 and R-2615 stay free.

### What each test does, and why it is red on main

Every case has a time limit that fails rather than hangs, a temp HOME and USERPROFILE, fixture repositories under the OS temp folder, and `delete process.env.NANA_ROLE` at the top of each new test file.

- **R-2606.** Runs the checkout's real hook as `node <checkout>/packages/nana-setup/claude/hooks/nana-objective.mjs`, with `CLAUDE_PROJECT_DIR` set and an objective file in the temp agent dir. Cases: the repository root; a subfolder (the root's HANDOFF shown); a subfolder of a linked worktree outside the main checkout with its own HANDOFF (a hand-written `.git` file is enough; its title shown, the main checkout's not); a non-repository folder holding a HANDOFF.md (its block prints); a folder name holding a space; CRLF; `objective.enabled: false` (no objective block, the frontier block still prints). Each: exit 0, stdout starts `[nana:objective]` (except the disabled case), then exactly one `[nana:frontier]` line, and the rest equals `nana-frontier-summary.mjs --cwd <same folder> --max <the hook's budget>`. Runs on all three CI legs. Red on main: the hook runs only the objective producer.
- **R-2607.** Calls `frontierSummary` with an injected `today`. Fixtures: this repo's shape (numbered bold leads, one ending in a colon, a nested sub-list); a plain-bullet Next under `## NEXT`; `## Next` with a nested `### Next (later)` (its item listed once); a `### Next steps` heading under Landed after the real Next (not read); an `Open for …` heading with a parenthetical; asks out of kind order; a titled ask; a tagged untitled ask (its tag shown once); an untagged ask; a fenced `## Next` example; a list under Landed; the seed's `## Open` (`Open for the owner: none found.`); an empty file (both `none found` lines and the check line). The CRLF copy and a UTF-8 BOM copy give the same block. Red on main: no lib.
- **R-2608.** For each frontier-baseline input and the fixture files, the check line equals `Frontier check: ` plus the last line of `bin/nana-frontier.mjs --today <same date>`, and the kind counts equal the CLI's finding lines; one fixture holds tabs and line breaks inside items. Red on main: no block.
- **R-2609.** A 500-char first line (cut to 160 on one line); titles holding a tab, U+202E and U+2028; a bold lead holding `## ` and `**` (one `- ` data line); 300 asks with 3 blocking (block within 4,000, all 3 blocking listed, the cut count equal to the titles left out, the check line present); 40 Next items and 3 blocking asks (all 3 listed); `max` 1,200 (block within 1,200); `max` below the heading and check line (the one omitted line). Red on main.
- **R-2610.** The CLI in a repository with no HANDOFF.md; outside any repository with none; with one under `NANA_ROLE=worker`, then `reviewer` (empty stdout, exit 0); under `NANA_ROLE=Worker` the block prints. Red on main: the CLI does not exist.
- **R-2611.** A folder named HANDOFF.md; a UTF-16LE file with its BOM; a file one byte over 1 MiB; on POSIX a FIFO (no hang). Each: exit 0, the heading, one marker line naming the cause and holding `promptPath` of the file, no title line. Red on main.
- **R-2612.** Worlds: a full HANDOFF, a seed-shaped one, a CRLF one, an unreadable one, none, and one under `NANA_ROLE=worker`. For each of startup, new, resume, fork and reload, the fake pi's section equals the CLI's stdout (with no `--max`) minus its first line, or is absent when the CLI prints nothing. A second `session_start` after an edit shows the edited title. Red on main: no extension.
- **R-2613.** Copies the hooks and the setup libs as R-2011 does. Both producers hung: the objective marker then the frontier marker before the installed limit. An objective stub printing 8,000 characters and a live frontier producer over a long fixture HANDOFF: stdout at most 10,000 characters with the objective whole. Red on main: the hook prints only the objective marker, and has no budget.

Existing tests made false (listed edits, not new tests): hook-deadlines R-2012 (the copied checkout gains a live frontier stub that prints nothing, and `stubPaths` gains `frontier`); templates-render R-680 and R-985 (`RUNTIME_INVENTORY_TEXT` gains `nana-frontier-summary`; three matrix row literals change). The builder confirms objective-golden, hook-producers, hooks-closed-output, the install check, nana-rulings' tests and hooks-win32-exec stay green unchanged (on the Windows leg the last now also prints this repo's frontier block).

## Tunables

`packages/nana-pack/lib/frontier-summary-config.mjs` (no imports) unless noted:

- `FRONTIER_TAG` `[nana:frontier]` — chosen: the producers' tag form. Sealed.
- `FRONTIER_HEADING` `## Project frontier (nana)` — chosen: the `(nana)` heading form.
- `FRONTIER_SECTION` `nana-frontier` — chosen: the pi section key form. Sealed.
- `FRONTIER_UNAVAILABLE` `FRONTIER UNAVAILABLE:` — chosen: the UNAVAILABLE marker form.
- `FRONTIER_DATA_NOTE` — chosen: nana-adoption's quoted-data wording, plus the instruction to tell the user about findings.
- `FRONTIER_OUTPUT_CAP` 4000 — chosen: about 1.9 times the largest block estimated over the 14 local HANDOFF files (about 2,130 characters, this repo, 2026-10-22, inferred). Sealed.
- `FRONTIER_TITLE_CAP` 160 — measured 2026-10-22: keeps every bold lead (longest 142) and every titled ask (longest 103); cuts about half the plain first lines (median 122). Sealed.
- `HANDOFF_FILE` `HANDOFF.md` — contract: the startup rule and adoption's root HANDOFF.
- `LAUNCHER_ROLES` `reviewer`, `worker` — contract: the values pi-worker and the worker config set and the knowledge hook reads (a third copy of the role words, accepted as a contract).
- `ASK_KIND_ORDER` `blocking`, `optional`, `parked` — chosen: urgency order; untagged last.
- `NEXT_SECTION_NAME` `Next` in frontier-config.mjs — contract: `LIVE_SECTION_NAMES` (R-2470), now read by name.
- `FRONTIER_HOOK_BUDGET` in hook-producer's config — the shared-memory 9,000 by import (R-2346), not a new number.
- Reused unchanged: `BOUNDED_READ_CAP` (1 MiB) and `HOOK_PRODUCER_TIMEOUT_MS` (1,500 ms).

## Wrong-code pairs (the seat runs each; it must turn its test red)

1. The hook runs the frontier producer before the objective producer (R-2606).
2. The producer reads `<cwd>/HANDOFF.md`, not the repository root's (R-2606).
3. The root walk accepts only a `.git` folder (R-2606: the linked-worktree subfolder case).
4. Nothing printed outside a repository (R-2606: the non-repository case).
5. Every list item under Next is listed, nested sub-items included (R-2607).
6. Titles from every Next-named heading (R-2607).
7. The title keeps its bold marks (R-2607).
8. Asks in file order, not blocking first (R-2607).
9. An untitled ask is dropped (R-2607).
10. The lib splits lines on `\n` only (R-2607: the CRLF copy).
11. The summary line rebuilt in the new lib with `split(" ")` (R-2608).
12. A title rendered raw (R-2609).
13. Titles chosen in display order, so a long Next pushes blocking asks out (R-2609).
14. Only `worker` is silenced (R-2610).
15. An unreadable file reads as absent (R-2611).
16. The extension computes the block once and keeps it across a reload (R-2612).
17. The hook writes both blocks with no shared budget (R-2613).
18. The frontier producer spawned outside `runHookProducer` and its limit (R-2613).

## Known limits (the seat writes them to docs/known-bugs/FEAT-002.md before the final round)

- Titles only: item bodies, Where things stand, Landed and the known bugs are not shown. The startup rule to read HANDOFF.md stays.
- Seed-shaped files show no asks: the seed's `## Open` is not the checker's `Open for ` (an existing FEAT-002 known bug; 6 of 14 local files).
- Most projects' titles are fallbacks: plain first lines cut at 160 characters, not at a sentence end.
- Read at session start only; an edit shows at the next start, reload, resume, clear or compaction.
- The repository root decides: a sub-project folder with no `.git` of its own reads the enclosing repository's HANDOFF.md.
- No switch: neither user nor project config turns the block off.
- Titles from a repository-writable HANDOFF.md reach pi's system prompt as bounded, quoted data with no trust gate. Steering text is outside the threat model.
- A symlinked HANDOFF.md is followed.
- pi-subagents children carry no `NANA_ROLE` and get the block.
- The Claude hook's status message still names only the objective; renaming it is a settings change.
- The deliverables count is not shown at session start (D11).
- No journal event for the pi pickup.

## Docs that change

- `packages/nana-pack/README.md`: a "Session-start frontier summary" section (what the block holds, where it comes from, roles, caps, the shared hook budget, no switch), naming the producer as `node packages/nana-pack/bin/nana-frontier-summary.mjs --cwd <dir>`; the extension table and the extension count.
- `README.md` and `packages/nana-pack/package.json` description: the extension count.
- `templates/_shared/working-under-nana-pi.md` matrix: the Claude seat's Objective cell names the frontier block in the objective hook; the pi seat's cell adds the `nana-frontier-summary` extension; the child row says it adds nothing under `NANA_ROLE`. AGENTS.md's marker region regenerated byte-identical (R-859).
- `AGENTS.md`: the Layout bin list names `nana-frontier-summary`; the Objective contract paragraph gains one sentence: the frontier block follows the same output rule and has no switch.
- `packages/nana-setup/README.md`: the objective hook also runs the frontier producer.
- `REQUIREMENTS.md`: eight rows in FEAT-002; CAP-01's R-873 lines and CAP-04's R-327 reader line (D10). Regenerate `docs/requirements-tree.md` and `docs/code-map.md`.

## Seat steps

- Build with the larger builder; the build brief carries a Precedent section and passes brief-check.
- The pairs above on the build tip, before review; the land reviewer and one independent check.
- Install check on macOS before `nana-land`; CI on the draft PR with the Windows leg.
- `requirements-moved.mjs --root . --base main` output in the final review brief and the land; the tree checker's count line at the tip in the land evidence.
- Cross-lane: project-drift-notice also edits nana-rulings.ts, and any lane editing the shared template, AGENTS.md or the hook launcher merges main after whichever lands first.

## Owner questions (defaults taken; none blocks)

- A user-scope switch for the frontier block: `none`.
- Read the seed's `## Open` as the asks section: `no` (fix the seed in its own lane).
- Assert the frontier block in the install check's objective probe: `later`.
