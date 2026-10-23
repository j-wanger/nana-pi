# session-start-frontier: plan draft (planner, 2026-10-22, main 61ac64f3)

Feature: FEAT-002 · Resume decisions and next actions (rows in SUB-005 · Keep next steps and open decisions current; R-2613 sits in SUB-012 beside R-2011 and R-2012, its precedent, and is shared into FEAT-002 through Also applies).

Class: hook. The lane changes a Claude Code hook (`packages/nana-setup/claude/hooks/nana-objective.mjs` gains a second producer) and its launcher (`packages/nana-setup/lib/hook-producer.mjs`), and adds a pi extension. It does not change nana-setup install, uninstall or doctor: no new settings.json entry, no new hook file, no new installed path. Ladder: the roster's final reviewer, the land reviewer, the seat's wrong-code pairs and one independent check; `node packages/nana-setup/bin/install-check.mjs` on macOS before `nana-land`; CI on the draft PR with the blocking Windows leg.

Stakes: medium blast, reversible. Every Claude Code and pi seat session that starts in a project with a HANDOFF.md gains up to 4,000 characters of context, on every machine at its next `git pull` (POSIX hooks are symlinks into the checkout, nana-setup README:39; Windows runs the checkout's hook directly). A producer crash fails open to one marker line; a hang is cut at the launcher's 1,500 ms limit. Nothing is written.

Threat model: honest variation in our tools' output is in scope. HANDOFF files written by seats and by `nana-setup project`'s seed: numbered or bulleted Next items, with or without a bold lead, a bold lead ending in a full stop or a colon, nested sub-items, fenced examples, `## NEXT` and `## Next (…)` headings, the seed's `## Open` heading, `Open for …` headings with a parenthetical, asks with and without the `**[tag] Title.**` lead, a tag only in a continuation line, CRLF line ends (Windows autocrlf checkouts), a file over the read window, a file saved as UTF-16 by Windows PowerShell 5.1, an empty file, no file, a directory named HANDOFF.md. Sessions started at a repository root, in a subfolder, in a linked worktree, outside any repository, in a folder whose name holds a space. Ledgers: a tree with deliverable lines, a tree without them, a flat ledger, none. Launcher children (`NANA_ROLE`). Deliberate forgery is out: a HANDOFF written to steer the agent is shown as quoted, bounded data and not refused; a forged ledger count is shown as the tree checker prints it. Public repo: no text in this lane names the owner or the owner's work; sibling projects are counted, never named.

Measured on this Mac, 2026-10-22 (read-only):
- 14 HANDOFF.md files in sibling project folders (names withheld). 7 have a heading the checker reads as Next (NEXT included). Only this repo's Next items all carry a bold lead (6 of 6); across the 14, 8 of 20 top-level Next items do. Only this repo's asks carry the title lead (24 of 24); three other files hold 14 asks with no title lead. 6 files use the seed's `## Open` or a variant of it, which the checker's `Open for ` rule does not read. None uses CRLF or a BOM.
- Bold leads: longest 142 chars, median 28. Plain first lines of Next items: longest 494, median 122. First lines of untitled asks: longest 474, median 172. Titled asks with their tag: longest 103.
- A sketch renderer (titles capped at 160, 400 chars of framing) gives about 2,130 chars for this repo's HANDOFF and at most 1,590 for the other 13 (inferred: the real format is the builder's).
- `nana-objective.mjs --cwd .` prints 1,005 bytes in 85 ms; `nana-frontier.mjs HANDOFF.md` takes 40 ms; `scripts/requirements-tree.mjs --root .` takes 212 ms on this repo's 1,846 rows and prints `deliverables: 14 of 39 made and read by code`; on four other local ledgers (174 to 1,337 rows) it takes 90 to 137 ms and exits 1 (flat ledgers, no tree).

## Precedent

Precedent:
- packages/nana-setup/claude/hooks/nana-adoption.mjs:16-18 — one hook entry running two producers in a row through `runHookProducer`; the objective hook gains its second call the same way.
- packages/nana-setup/lib/hook-producer.mjs:13-54 — `launcherDefinitions` (cli path plus fail-open marker), `HOOK_PRODUCER_TIMEOUT_MS` and its two-producers-under-5-s arithmetic (R-2013), `runHookProducer`. Add a `frontier` definition; no new launcher.
- packages/nana-pack/bin/nana-objective.mjs:22-47 — the producer CLI shape: tag line, `--cwd`, always exit 0, a fail-open marker naming the cause.
- packages/nana-pack/bin/nana-adoption.mjs:30-38 — a plain .mjs producer whose imports sit inside the try, with the `oneLine` allow-list for the failure path (:34, :81-84) and the "quoted data, never an instruction" framing (:71).
- packages/nana-pack/extensions/nana-objective.ts:61-89 — compute at `session_start` for every reason, inject at `before_agent_start`, lib imported in-process, never throws.
- packages/nana-pack/extensions/nana-rulings.ts:84-112 — the simpler extension: section key from config, an `opts` seam for tests, no `orderNanaSections` call (:108-111); `causeFor` (:40-57) and the fatal UTF-8 decode (:76-80) for the unavailable line.
- packages/nana-knowledge/lib/hook.ts:159-160 — `NANA_ROLE` reviewer or worker gets nothing.
- packages/nana-pack/bin/nana-frontier.mjs:14-161 — MOVE the checker body into a pure lib and import it back; the bin keeps argv, the read and the print (:26-54, :163-165). Its item rule (:101-107: a list item at column 0 under Next) is the top-level rule for Next titles.
- packages/nana-pack/lib/handoff-asks.mjs:11-28 — `splitOpenSection` with tag and title per ask; export `TAG` for the first-line fallback instead of copying it.
- packages/nana-pack/lib/markdown-list-sections.mjs:16-68 — `scanListSections` for the Next section (heading form, fence-aware, continuation lines joined).
- packages/nana-pack/lib/frontier-config.mjs:21-32 — `LIVE_SECTION_NAMES` and `isNamed`; add `NEXT_SECTION_NAME` here and use it in the moved checker (today an inline `"next"`).
- packages/nana-pack/lib/adoption.mjs:68-74 — `canonicalCwd`; :107-112 — `repoRootOf` (a `.git` directory or file); :115-123 — `rootState`, the root HANDOFF.md rule adoption already uses (:116).
- packages/nana-pack/lib/bounded-read.mjs:11-18 — `readBounded` with `BOUNDED_READ_CAP` (1 MiB, "config and handoff records"); no new read cap.
- packages/nana-pack/lib/display.mjs:109-117 — `promptText` for each title, `promptPath` for the HANDOFF path.
- scripts/requirements-tree.mjs:584-604 — the `--root <dir>` mode every project already runs; it prints the deliverables line built at scripts/deliverables.mjs:242.
- packages/nana-pack/lib/rulings-config.mjs:14-32 — a config module beside its lib, provenance per value, read by name.
- packages/nana-setup/lib/shared-memory-config.mjs:9-11 — the recorded Claude Code hook cap: plain stdout capped at 10,000 chars measured whole.
- packages/nana-setup/tests/hook-deadlines.test.mjs:33-37 and :77-96 — copied hooks plus producer stubs, and R-2011's two-hung-producers case.
- packages/nana-pack/tests/objective-golden.test.mjs:21-27 — the hook's stdout equals the extension's section once the tag line is removed.
- packages/nana-pack/tests/rulings.test.mjs:53-64 — a fake pi that records handlers, driven per reason.
- packages/nana-pack/tests/frontier.test.mjs:28-41 — the frontier-baseline golden that guards the checker move.
- packages/nana-pack/tests/requirements-tree.test.mjs:416-418 — a minimal tree ledger with deliverable lines.
- packages/nana-setup/tests/hooks-win32-exec.test.mjs:245-270 — R-1340, the Windows content check for the installed objective hook entry.
- packages/nana-pack/tests/templates-render.test.mjs:455-510 — the runtime inventory and matrix rows (R-680, R-985) a new extension must appear in.

## Decisions

- **D1 · A new producer, not a larger objective block.** The objective block keeps its text, its goldens, its 12,000-char cap and its Node 22.18 floor. A separate producer keeps the two switches apart: `objective.enabled: false` (user scope only) still hides only the objective, and nothing hides the frontier but a missing HANDOFF.md or a launcher role. The objective reaches worker and reviewer children; the frontier must not (D7). The frontier libs are plain .mjs, so no Node floor.
- **D2 · The Claude seat: a second producer in the existing objective hook entry.** `nana-objective.mjs` calls `runHookProducer(hookProducerConfig("frontier", repo))` after the objective call. `hook-producer.mjs` gains `frontier: { cli: "packages/nana-pack/bin/nana-frontier-summary.mjs", marker: "[nana:frontier]\nFRONTIER UNAVAILABLE: producer failed (<cli>).\n" }`. No settings.json change, so install, uninstall, doctor, the state manifest and the install check's hook table stay as they are. Two producers fit 2 × 1,500 ms plus the start under the installed 5 s, the arithmetic R-2013 already records for the adoption hook. The adoption hook is not used: a third producer there would not fit.
- **D3 · The pi seat: a new extension `packages/nana-pack/extensions/nana-frontier-summary.ts`.** It imports the lib in-process, as nana-objective does. At `session_start`, every reason, it recomputes the block; at `before_agent_start` it sets section `nana-frontier`, or none when the lib returns nothing. No `orderNanaSections` call, as nana-rulings. Never throws. Its default export takes `opts = { today?, env? }` for tests, as nana-rulings takes `opts.agentDir`.
- **D4 · The project is the repository root.** `repoRootOf(canonicalCwd(cwd))`, else the session folder when no repository holds it. The file is `<root>/HANDOFF.md`, read with `readBounded` (1 MiB) and a fatal UTF-8 decode. A missing file is silence. A directory, a non-regular file, an over-cap file or invalid UTF-8 gives one unavailable line (R-2611).
- **D5 · The lists reuse the existing parsers.** Next: `scanListSections` with `isNamed(title, NEXT_SECTION_NAME)`; only entries whose first line starts at column 0, the checker's item rule. A Next title is the item's leading bold text without the marks and one trailing `.` or `:`, else its first line after the list marker. Asks: `splitOpenSection`. An ask line is `[<kind>, since <date>] <title>`; with no title, its first line after the list marker and one leading `TAG`; with no tag, `[no tag] <first line>`. Asks are ordered blocking, optional, parked, untagged, each group in file order.
- **D6 · The checker moves into a lib.** New `packages/nana-pack/lib/frontier-check.mjs` (effects none) exports `checkFrontier(text, today)` returning `{ findings, wordCount }`, `frontierSummaryLine(result)` and `isDate`. `bin/nana-frontier.mjs` imports them and prints byte for byte as today; frontier.test.mjs and its baseline guard that. The block's check line is `Frontier check: <frontierSummaryLine>` plus ` (<kind> <count>, …)` in the order kinds first appear, when there are findings.
- **D7 · Launcher roles get nothing.** The lib returns nothing when `env.NANA_ROLE` is exactly `reviewer` or `worker`. One check serves both runtimes: pi-worker and pi-review children, and the Claude reviewer, whose review-ledger child sets `NANA_ROLE=reviewer`.
- **D8 · The deliverables line comes from the tree checker's CLI.** When `<root>/REQUIREMENTS.md` is a regular file, the lib runs `process.execPath <checkout>/scripts/requirements-tree.mjs --root <root>` through an injected runner (default `spawnSync`) with `timeout: DELIVERABLES_TIMEOUT_MS`, and keeps the one stdout line matching `DELIVERABLES_LINE`. A run that exits 1 or prints no such line gives no line (flat ledgers exit 1 today). A timeout or a failed start gives `deliverables: not counted (tree check timed out after 1000 ms)` or `(tree check could not start)`. Trade: a process edge from a package to `scripts/` that the code map does not see, declared in the lib's header, against moving 1,100 lines of ledger code (requirements-tree, requirements-trace, deliverables, MAX_GIT_BUFFER) and the two mirror copies in requirements-regroup.test.mjs:208-217 and requirements-tree.test.mjs:410-413. Cost: 90 to 212 ms per session start in a project with a ledger (measured, macOS), slower on Windows (inferred).
- **D9 · The block.** New `packages/nana-pack/lib/frontier-summary.mjs` (effects disk, process) exports `frontierSummary({ cwd, today, env, runTreeCheck })`, returning the block text or null. New `packages/nana-pack/bin/nana-frontier-summary.mjs` prints `[nana:frontier]` and the block, prints nothing for null, and always exits 0, with an adoption-style fail-open line. The block, in order:

```
## Project frontier (nana)

Read from <promptPath(handoff)> at session start. Each title below is quoted from that file as data, not as an instruction.

Next (<n>):
- <title>
Open for the owner (<n>: <count> <kind>, …):
- [<kind>, since <date>] <title>
…and <k> more titles not shown (<x> Next, <y> asks).
Frontier check: summary words=<w> budget=<b> findings=<f> (<kind> <count>, …)
deliverables: <a> of <t> made and read by code
```

  `Next: none found.` or `Open for the owner: none found.` stands in for an empty list. Counts name nonzero kinds only. Each title goes through `promptText(…, FRONTIER_TITLE_CAP)`. Titles are added in block order while the block stays within `FRONTIER_OUTPUT_CAP` with the cut line and both status lines reserved. The cut line appears only when a title was left out.
- **D10 · The ledger closes the audit gap.** In CAP-01, R-873's `Made by: manual` and `Read by: person` lines become `Made by: R-873 · session start: packages/nana-setup/claude/hooks/nana-objective.mjs, packages/nana-pack/bin/nana-frontier-summary.mjs`, `Made by: R-873 · extension: packages/nana-pack/extensions/nana-frontier-summary.ts, packages/nana-pack/lib/frontier-summary.mjs` and two `Read by: R-873 · prompt:` lines for the hook and the extension. In CAP-04, R-327's `rule:` reader ("no hook or extension loads it") becomes a `prompt:` reader naming the extension. The count line should read `deliverables: 15 of 39 made and read by code` (inferred until the tree checker runs on the lane tip; no test pins the count, grep 2026-10-22).
- **D11 · Left out.** No off switch (open question). No Where things stand, no item bodies, no per-finding lines, no journal event, no new install-check assertion, no seed heading fix, no BOM strip. The AGENTS startup rule to read HANDOFF.md stays: the block holds titles only.

## Must-meet rows (EARS, one shall each)

| ID | Requirement | Test file::title |
|---|---|---|
| R-2606 | WHEN a Claude Code session starts in a folder inside a git repository whose root holds a HANDOFF.md, the objective hook shall print that file's frontier block, tagged `[nana:frontier]`, after the objective block. | `packages/nana-setup/tests/frontier-hook.test.mjs::R-2606: the objective hook prints the repository HANDOFF's frontier block after the objective block, from a subfolder and a linked worktree` |
| R-2607 | WHEN the HANDOFF.md has a Next or an Open for the owner section, the frontier block shall list each top-level Next item's title in file order, then each ask's tag and title, blocking asks first, then optional, parked and untagged, each group in file order. | `packages/nana-pack/tests/frontier-summary.test.mjs::R-2607: Next titles and ask tags and titles are listed in block order, and nested items, fences and other sections are not` |
| R-2608 | The frontier block shall end with the frontier checker's summary line and finding counts for the same HANDOFF.md and date, then the tree checker's deliverables line for the repository when its `--root` run prints one, or a not-counted line naming the cause when that run times out or cannot start. | `packages/nana-pack/tests/frontier-summary.test.mjs::R-2608: the block ends with the frontier checker's own summary line and counts, then the tree checker's own deliverables line or a not-counted cause` |
| R-2609 | The frontier block shall hold at most `FRONTIER_OUTPUT_CAP` characters, each title as one line of at most `FRONTIER_TITLE_CAP` characters free of control characters, line breaks and bidi marks, and a count of any titles it left out. | `packages/nana-pack/tests/frontier-summary.test.mjs::R-2609: the block stays within its caps, renders each title as one clean line and counts the titles it left out` |
| R-2610 | IF the repository root holds no HANDOFF.md, or `NANA_ROLE` is `reviewer` or `worker`, THEN the frontier producer shall print nothing and exit 0. | `packages/nana-pack/tests/frontier-summary.test.mjs::R-2610: no HANDOFF.md or a reviewer or worker role gives no output and exit 0` |
| R-2611 | IF the repository root's HANDOFF.md is not a regular file, is over the bounded read cap or is not valid UTF-8, THEN the frontier block shall be its heading and one `FRONTIER UNAVAILABLE:` line naming the cause and the path. | `packages/nana-pack/tests/frontier-summary.test.mjs::R-2611: an unreadable HANDOFF.md gives one FRONTIER UNAVAILABLE line naming its cause` |
| R-2612 | WHEN a pi session starts for any reason, the frontier summary extension shall set the `nana-frontier` system-prompt section to the frontier producer's output for that session folder without its tag line, and set no section when the producer prints nothing. | `packages/nana-pack/tests/frontier-golden.test.mjs::R-2612: the pi section equals the Claude hook's frontier block minus its tag line for every session start reason, and is re-read after an edit` |
| R-2613 | IF neither the objective producer nor the frontier producer has exited when the producer time limit passes, THEN the objective hook shall print the objective unavailable marker and then the frontier unavailable marker before its installed limit. | `packages/nana-setup/tests/hook-deadlines.test.mjs::R-2613: objective hook prints both markers before its installed limit when both producers hang` |
| R-2614 | This repository's ledger shall name the frontier summary's session-start and extension runs as the makers of the HANDOFF frontier report deliverable (R-873), and their prompts as its readers. | `packages/nana-pack/tests/frontier-summary.test.mjs::R-2614: this repository's HANDOFF frontier report deliverable is made and read by code` |

Plus one seal test (no row of its own; it names R-2606, R-2608, R-2609 and R-2612): `seal: the frontier block's tag is [nana:frontier], its pi section is nana-frontier, its caps are 4,000 and 160 characters and its tree-check limit is 1,000 ms`.

Nine rows, one over the guide; R-2615 stays spare for a build amendment. R-2614 could drop to a ledger edit with no row (open question).

### What each test does, and why it is red on main

Every case has a time limit that fails rather than hangs, a temp HOME (and USERPROFILE), and fixture repositories under the OS temp folder.

- **R-2606.** Runs the checkout's real hook as `node <checkout>/packages/nana-setup/claude/hooks/nana-objective.mjs`, the way Windows exec form runs it, with `CLAUDE_PROJECT_DIR` set and an objective file in the temp agent dir. Cases: the repository root; a subfolder (the root's HANDOFF is shown); a linked worktree with its own HANDOFF (its title shown, the main checkout's not); a folder name holding a space; the HANDOFF with CRLF. Each: exit 0, stdout starts `[nana:objective]`, then exactly one `[nana:frontier]` line, and the rest equals `nana-frontier-summary.mjs --cwd <same folder>`. It runs on all three CI legs, the blocking Windows leg included. Red on main: the hook runs only the objective producer.
- **R-2607.** Calls `frontierSummary` with an injected `today` and a runner that records calls. Fixtures: this repo's shape (numbered bold leads, one ending in a colon, a nested sub-list); a plain-bullet Next under `## NEXT`; an `Open for …` heading with a parenthetical; asks out of kind order; a titled ask; a tagged untitled ask (its tag shown once); an untagged ask; a fenced `## Next` example; a list under Landed; the seed's `## Open` (`Open for the owner: none found.`). The CRLF copy gives the same block. Red on main: no lib.
- **R-2608.** For each frontier-baseline input and the fixture files, the check line equals `Frontier check: ` plus the last line of `bin/nana-frontier.mjs --today <same date>`, and the kind counts equal the CLI's finding lines. A temp repository with the tree ledger from requirements-tree.test.mjs:416: the last line equals the `deliverables:` line `scripts/requirements-tree.mjs --root <repo>` prints, also when the session folder is a subfolder. A flat ledger: no line. No ledger: the runner is never called. An injected runner reporting `ETIMEDOUT`, then `ENOENT`: the two not-counted lines. The runner receives `timeout: DELIVERABLES_TIMEOUT_MS`. Red on main: no block.
- **R-2609.** A 500-char first line (cut to 160 on one line); titles holding a tab, U+202E and U+2028; a bold lead holding `## ` and `**` (one `- ` data line); 300 asks with 3 blocking (block ≤ 4,000; all 3 blocking listed; the cut count equals the titles left out; both status lines present). Red on main.
- **R-2610.** The CLI in a repository with no HANDOFF.md; in a folder outside any repository; in a repository with one under `NANA_ROLE=worker`, then `reviewer` (empty stdout, exit 0); under `NANA_ROLE=Worker` the block prints. Red on main: the CLI does not exist.
- **R-2611.** A directory named HANDOFF.md; a UTF-16LE file with its BOM, as Windows PowerShell 5.1 writes; a file one byte over 1 MiB; on POSIX a FIFO (no hang). Each: exit 0, the heading, one marker line naming the cause, no title line. Red on main.
- **R-2612.** Worlds: a full HANDOFF, a seed-shaped one, a CRLF one, an unreadable one, none, and one under `NANA_ROLE=worker`. For each of startup, new, resume, fork and reload, the fake pi's section equals the CLI's stdout minus its first line, or is absent when the CLI prints nothing. A second `session_start` after an edit shows the edited title. Fixtures hold no due dates, so the two clocks cannot differ. Red on main: no extension.
- **R-2613.** Copies the hooks and the setup lib as R-2011 does, writes hung stubs for both producers and asserts `objective marker + frontier marker` before the installed limit. Red on main: the hook prints only the objective marker.
- **R-2614.** Parses this repo's REQUIREMENTS.md with `parseLedger` and reads CAP-01's claims with `deliverableClaims`: R-873 is made and read by code, and its maker paths include the hook, the producer, the extension and the lib (a test may import scripts/). Red on main: R-873 is made by hand and read by a person.

Existing tests made false (listed edits, not new tests):
- `packages/nana-setup/tests/hook-deadlines.test.mjs` R-2012: the copied checkout has no frontier producer, so the hook would add the frontier marker. The case writes a live frontier stub that prints nothing, and `stubPaths` gains `frontier`.
- `packages/nana-pack/tests/templates-render.test.mjs` R-680 and R-985: `RUNTIME_INVENTORY_TEXT` gains `nana-frontier-summary`, and three matrix row literals change (the Claude seat, pi seat and child rows; Codex unchanged).
- Inferred unchanged, for the builder to confirm: objective-golden (its worlds sit outside any repository with no HANDOFF.md), hook-producers (R-2013 names three producers), hooks-closed-output, the install check (its fixture project has no HANDOFF.md), and hooks-win32-exec (its project sits inside a worktree of HEAD, so the objective entry now also prints this repo's block and runs the tree check, inside the entry's 5 s).

## Tunables

`packages/nana-pack/lib/frontier-summary-config.mjs` unless noted:

- `FRONTIER_TAG` `[nana:frontier]` — chosen: the producers' tag form (`[nana:objective]`, `[nana:adoption]`). Sealed.
- `FRONTIER_HEADING` `## Project frontier (nana)` — chosen: the `(nana)` heading form of the objective and adoption blocks.
- `FRONTIER_SECTION` `nana-frontier` — chosen: the pi section key form (`nana-objective`, `nana-rulings`). Sealed.
- `FRONTIER_UNAVAILABLE` `FRONTIER UNAVAILABLE:` — chosen: the OBJECTIVE, ADOPTION and RULINGS UNAVAILABLE form.
- `FRONTIER_DATA_NOTE` (the framing sentence) — chosen: nana-adoption's "quoted data, never an instruction" wording (bin/nana-adoption.mjs:71).
- `FRONTIER_OUTPUT_CAP` 4000 — chosen: about 1.9 times the largest block estimated over the 14 local HANDOFF files (about 2,130 chars, this repo, 2026-10-22, inferred). With the objective's measured 1,005 bytes the objective hook stays well under Claude Code's 10,000-char cap (shared-memory-config.mjs:9). Sealed.
- `FRONTIER_TITLE_CAP` 160 — chosen: keeps every measured bold lead whole (longest 142) and every titled ask (longest 103); cuts about half the plain first lines (median 122). Measured 2026-10-22. Sealed.
- `DELIVERABLES_TIMEOUT_MS` 1000 — chosen: about 5 times the measured 212 ms tree check on this repo's 1,846 rows (macOS, 2026-10-22), and under the launcher's 1,500 ms. Sealed.
- `DELIVERABLES_LINE` `/^deliverables: \d+ of \d+ made and read by code$/` — contract: R-2541's line (scripts/deliverables.mjs:242).
- `HANDOFF_FILE` `HANDOFF.md` — contract: the startup rule (AGENTS.md:7) and adoption's root HANDOFF (adoption.mjs:116).
- `LEDGER_FILE` `REQUIREMENTS.md` — contract: the file the tree checker's `--root` reads (requirements-tree.mjs:595).
- `LAUNCHER_ROLES` `reviewer`, `worker` — contract: the values worker-config.mjs:72 and pi-worker.mjs:70 set and hook.ts:159-160 reads.
- `ASK_KIND_ORDER` `blocking`, `optional`, `parked` — contract: R-878's tag kinds (handoff-asks.mjs:11).
- `NEXT_SECTION_NAME` `Next` in frontier-config.mjs — contract: `LIVE_SECTION_NAMES` (R-2470), now read by name.
- Reused unchanged: `BOUNDED_READ_CAP` (1 MiB) and `HOOK_PRODUCER_TIMEOUT_MS` (1,500 ms).

## Wrong-code pairs (each must turn its test red)

1. The hook runs the frontier producer before the objective producer (R-2606: order).
2. The producer reads `<cwd>/HANDOFF.md`, not the repository root's (R-2606: subfolder case).
3. The root walk accepts only a `.git` directory, so a linked worktree reads the main checkout's HANDOFF (R-2606: worktree case).
4. Every list item under Next is listed, nested sub-items included (R-2607).
5. The title keeps its bold marks or its trailing full stop or colon (R-2607).
6. Asks in file order, not blocking first (R-2607).
7. An untitled ask is dropped, or its tag is shown twice (R-2607).
8. The summary line is rebuilt in the new lib, counting words with `split(" ")`, not taken from the moved checker (R-2608: a fixture with tabs and line breaks).
9. The tree check runs on the session folder, not the repository root, or its line is kept when it exits 1 (R-2608: subfolder and flat-ledger cases).
10. The tree check starts with no time limit (R-2608: the runner's timeout option and the timed-out line).
11. A title is rendered raw, so a line break or a bidi mark reaches the block (R-2609).
12. Only the per-title cap applies, with no block cap and no cut count (R-2609: the 300-ask case).
13. No `NANA_ROLE` check, so a worker child gets the block (R-2610).
14. An unreadable file reads as absent, or invalid UTF-8 is decoded with replacement marks (R-2611: the directory and UTF-16 cases).
15. The extension computes the block once and keeps it across a reload (R-2612: the edit case).
16. The frontier producer is spawned directly, outside `runHookProducer` and its limit (R-2613: both-hang case).

## Known limits (the seat writes them to docs/known-bugs/FEAT-002.md before the final round)

- Titles only: item bodies, Where things stand, Landed and the known bugs are not shown. The startup rule to read HANDOFF.md stays.
- Seed-shaped files show no asks: the seed's `## Open` is not the checker's `Open for ` (an existing FEAT-002 known bug; 6 of 14 local files).
- Most projects' titles are fallbacks: plain first lines, cut at 160 chars (12 of 20 measured Next items, all 14 measured untitled asks).
- Read at session start only. An edit during a session shows at the next start, reload, resume, clear or compaction.
- The repository root decides: a sub-project folder with no `.git` of its own reads the enclosing repository's HANDOFF.md.
- A process edge: a package runs `scripts/requirements-tree.mjs` by path, which the code map does not see.
- Shared output cap: Claude Code caps one hook's plain stdout at 10,000 chars. An objective near its own 12,000 cap already passes it alone; the frontier adds up to 4,000.
- No switch: neither user nor project config turns the block off.
- Repository text reaches the system prompt: titles from a repository-writable HANDOFF.md reach pi's system prompt as bounded, quoted data with no trust gate (unlike the objective's provenance label). Steering text is outside the threat model.
- A heading on line 1 behind a BOM is not read (the shared scanner's rule); no measured file has one.
- R-2013's limit test still names three producers; R-2613's deadline test pins the frontier producer's limit.
- No journal event for the pi pickup.

## Docs that change

- `packages/nana-pack/README.md`: a "Session-start frontier summary" section (what the block holds, where it comes from, roles, caps, the tree-check run, no switch); the extension table and "Nine extensions" become ten.
- `README.md` (:11, :193) and `packages/nana-pack/package.json` description: ten extensions.
- `templates/_shared/working-under-nana-pi.md` matrix: the Claude seat's Objective cell names the frontier summary in the objective hook; the pi seat's cell adds the `nana-frontier-summary` extension; the child row says it adds nothing under `NANA_ROLE`. AGENTS.md's marker region stays byte-identical (R-859).
- `AGENTS.md`: the Layout bin list names `nana-frontier-summary`; the Objective contract paragraph gains one sentence: the frontier summary follows the same output rule and has no switch.
- `packages/nana-setup/README.md:20`: the objective hook also runs the frontier producer.
- `REQUIREMENTS.md`: nine rows; FEAT-002's Also applies gains R-2613; CAP-01's R-873 lines and CAP-04's R-327 rule line (D10). Regenerate `docs/requirements-tree.md` and `docs/code-map.md` (new modules: lib/frontier-check.mjs, lib/frontier-summary.mjs, lib/frontier-summary-config.mjs, bin/nana-frontier-summary.mjs, extensions/nana-frontier-summary.ts and three test files).
- Seat, before the final round: the known limits above, HANDOFF and the session note.

## Seat steps

- Build with the larger builder: the lane moves a checker, adds four modules and an extension, and changes a hook every session runs.
- The build brief opens with `Feature: FEAT-002 · Resume decisions and next actions` and carries the Precedent section above.
- The wrong-code pairs above, on the build tip, before review.
- Install check on macOS before `nana-land`; CI on the draft PR with the Windows leg (R-2606 and R-2613 run there from the checkout).
- `requirements-moved.mjs --root . --base main` output in the final review brief and the land.
- Cross-lane: a lane that edits the shared template, AGENTS.md or the hook launcher lands first or merges main; the later one merges.

## Open for the seat (one-word defaults)

- A user-scope switch for the frontier block: default `none`.
- Read the seed's `## Open` as the asks section: default `no` (fix the seed in its own lane).
- R-2613 in SUB-012 shared into FEAT-002, or in FEAT-002 outright: default `SUB-012`.
- Keep R-2614 as a row, or make it a ledger edit only: default `keep`.
- Assert the frontier block in the install check's objective probe (a fixture HANDOFF.md): default `later`.
