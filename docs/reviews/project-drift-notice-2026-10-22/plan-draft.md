# project-drift-notice: plan draft (planner, 2026-10-22)

Feature: FEAT-014 · Create or adopt a project workspace. Rows R-2623 to R-2627 go in SUB-016 (Recognize projects that need adoption), beside the adoption reader's rows R-151 to R-157. R-2628 goes in SUB-021 beside R-989, the project check's region row it must agree with.

Class: hook. The lane changes `packages/nana-pack/bin/nana-adoption.mjs`, the producer the Claude Code SessionStart adoption hook runs, so the hook's output changes. It also changes `packages/nana-pack/extensions/nana-rulings.ts`, a pi extension. The hook entry file and `hook-producer.mjs` stay byte-unchanged. No nana-setup install, uninstall or doctor code changes, and no gate, nana-land, pi-review or review-round code changes. Ladder: the roster's final reviewer from another model family, the land reviewer (or `seat-land.md` when the roster prints `land: seat`), the seat's wrong-code pairs, one independent check, the install check on macOS before the land, and the blocking Windows CI leg.

Stakes: medium blast, reversible. Every Claude Code and pi seat start runs the new code. If it threw inside the existing try blocks, a Claude seat would get `ADOPTION UNAVAILABLE` in place of its unadopted list, and a pi seat would lose its rulings section. The design isolates it (D4, D5). A false "differs" sends the owner to an idempotent command that rewrites only the marker region. Nothing is written by this lane's code.

Threat model: honest variation in our own tools' output and in real project folders is in scope. That covers a session started in a subfolder, a subfolder with its own unmarked AGENTS.md, a linked worktree, CRLF checkouts, a BOM, Windows drive and backslash paths, a root holding a space or a backtick, a region that differs only in trailing spaces or a final blank line, a marker pair shown only inside a code fence, a duplicated begin marker, a symlinked AGENTS.md, a dismissed repository, an AGENTS.md with no markers, and launcher children (reviewer, worker). Deliberate forgery is out: a project that hand-writes the shared section byte for byte passes as current, and a planted `.nana-not-a-project` silences the line. Public repo: this plan and every text the lane writes name no owner and nothing about the owner's work.

## The gap, measured (this Mac, 2026-10-22, read-only)

- Six home-level checkouts carry the marker pair. Five differ from `templates/_shared/working-under-nana-pi.md` (16 to 28 changed lines each). All five lack today's `- Plans:` and `- Larger lanes:` bullets. nana-pi matches.
- Thirteen more home-level checkouts have an AGENTS.md with no marker pair. Linked worktrees: 45 differ, 13 have no pair.
- Nothing tells a session today. `nana-setup project --check` says `differs — fix: nana-setup project <dir>` only when someone runs it (project.mjs:655).
- Cost today: the adoption producer runs about 30 ms wall (3 runs, temp HOME). The region compare costs 0.2 to 0.7 ms per project in process. Imports cost: `stale-copies.mjs` 6.5 ms, `adoption.mjs` 5.7 ms, `project.mjs` 17.4 ms.
- `checkProject` whole is the wrong unit. Its first call took 44.5 ms, because it loads `config.ts` and `objective.ts`. On a subfolder it spawns `git rev-parse` (measured with a patched `child_process`: one `spawnSync git`). Importing `stale-copies.mjs`, `adoption.mjs` and `project.mjs` spawns nothing.
- Frontier seeds: all five drifted checkouts hold a `docs/sessions/README.md` byte-equal to the seed. nana-pi's own differs on purpose. `OBJECTIVE.md` and `HANDOFF.md` carry `<name>`/`<date>` placeholders and are owner-written. `nana-setup project` never rewrites a present seed (fsops.mjs:153-165). So a seed check would fire nowhere useful and name a fix that changes nothing. Seeds are left out (D7).
- On this Mac, pi loads the pack from `../../nana-pi/packages/nana-pack` and `~/.local/bin/nana-setup` links to `~/nana-pi`. So the section the hook and the extension compare against is the one `nana-setup project` writes.

## Precedent (this lane's own section, in the form pi-worker requires)

Precedent:
- packages/nana-setup/lib/project.mjs:643-659 — checkProject's region row: fence-aware markers, exactly one ordered pair, CRLF normalised on both sides, compare. MOVE the compare into a shared pure function; checkProject calls it back unchanged (R-989 tests stay green).
- packages/nana-setup/lib/project.mjs:185-186 — WORKING_BEGIN and WORKING_END. MOVE with the compare; project.mjs imports and re-exports them (tests import them from project.mjs).
- packages/nana-setup/lib/project.mjs:212-230 — markerLines, the fence-aware marker scan. MOVE; refreshWorkingRegion (:265) and checkProject import it back.
- packages/nana-setup/lib/project.mjs:41 — SHARED_DIR. MOVE beside repoRoot in paths.mjs; project.mjs re-exports it, so the shared-file path is defined once.
- packages/nana-setup/lib/paths.mjs:31-33 — pkgRoot and repoRoot, realPath-resolved; the new home of SHARED_DIR.
- packages/nana-setup/lib/stale-copies.mjs:53-60 — staleNotice: one line, prefix, label, "tell the user; they fix it with", command in a code span. The project-stale line takes the same shape and lives beside it.
- packages/nana-setup/lib/stale-copies-config.mjs:9-14 — STALE_PREFIX and STALE_SECTION with "chosen" provenance. The two new names go here.
- packages/nana-pack/lib/adoption.mjs:68-74 — canonicalCwd (realpath.native, fall back to resolve).
- packages/nana-pack/lib/adoption.mjs:107-112 — repoRootOf: walk up to the nearest `.git` file or folder, no git process; a linked worktree is its own root (R-809).
- packages/nana-pack/lib/adoption.mjs:33 — MARKER `.nana-not-a-project`, the dismissal nana-setup project refuses (R-340).
- packages/nana-pack/lib/adoption.mjs:177 — printable(root): absolute, not the filesystem root, at most 512 chars, code-span safe.
- packages/nana-pack/lib/display.mjs:150 — codeSpan, null when unsafe.
- packages/nana-pack/lib/bounded-read.mjs:12-18 — readBounded and BOUNDED_READ_CAP (1 MiB, chosen there): refuses a non-regular file or an over-cap one without reading past the cap.
- packages/nana-pack/bin/nana-adoption.mjs:36-83 — the reader: dynamic imports inside one try, TAG block, ADOPTION UNAVAILABLE on failure, exit 0 always. The line is written before the TAG block, from inside that try.
- packages/nana-pack/bin/nana-objective.mjs:38-39 — reading `--cwd <dir>` from argv.
- packages/nana-setup/lib/hook-producer.mjs:13-18 — why no third producer: two producers at 1500 ms each already sit under the installer's 5 s hook timeout (R-2013). The launcher already passes `--cwd` (:45).
- packages/nana-setup/claude/hooks/nana-adoption.mjs:16-18 — the hook runs the adoption producer, then the stale-copy producer; unchanged.
- packages/nana-pack/extensions/nana-rulings.ts:88-112 — compute at every session_start reason in a try, set a section at before_agent_start; STALE_SECTION is set beside RULINGS_SECTION with no reordering.
- packages/nana-knowledge/lib/hook.ts:159-160 — the NANA_ROLE reviewer and worker guard.
- packages/nana-pack/bin/worker-config.mjs:72 — REVIEWER_CHILD_ENV sets NANA_ROLE reviewer; review-ledger.mjs:149 passes it to every review child, Claude Code included.
- packages/nana-setup/tests/stale-copies.test.mjs:20-21 — one test file drives both seats: the Claude producer and the imported rulings extension. :276 is the seal-test form; :368-373 reads the pi section.
- packages/nana-pack/tests/adoption-reader.test.mjs:20-36 — temp HOME, BIN and HOOK paths, the `repo()` fixture, and running the hook with `node`.
- packages/nana-setup/tests/project-working-region.test.mjs:13-28 — region fixtures: `make()`, shared text normalised to LF, CRLF variants.
- packages/nana-setup/tests/stale-copies-slow.test.mjs:34-52 — a `--require` preload passed through NODE_OPTIONS to a child run.
- packages/nana-pack/tests/agent-dir-config.test.mjs:23 — createRequire plus syncBuiltinESMExports to patch a builtin in process.

## Design

- **D1 · Move, do not rewrite, the comparison.** New `packages/nana-setup/lib/working-region.mjs` (six-tag header, effects none) holds WORKING_BEGIN, WORKING_END, markerLines and `regionVerdict(text, shared)`. It returns `"malformed"`, `"match"` or `"differs"`, built from checkProject's own lines 645-655. checkProject and refreshWorkingRegion import them back. project.mjs re-exports the two markers and SHARED_DIR, so no importer changes. A second comparison would be the copy this repo's precedent ruling forbids. R-2628 pins that the session line and the check agree.
- **D2 · One total function decides the line for both seats.** `projectStaleLine(sessionDir, { env = process.env } = {})` goes in `stale-copies.mjs` beside staleNotice, and never throws. It returns "" when any of these holds:
  - `env.NANA_ROLE` is reviewer or worker.
  - The folder is in no repository (canonicalCwd, then repoRootOf).
  - The root holds the dismissal marker.
  - Root AGENTS.md is absent, a symlink (lstat), not a regular file, or over BOUNDED_READ_CAP (readBounded).
  - The verdict is not `"differs"`.

  Otherwise it returns one line: `${PROJECT_STALE_PREFIX} AGENTS.md working section — tell the user; they fix it with \`nana-setup project "<root>"\``. When `printable(root)` fails or the root holds `"`, the command has no path: `` `nana-setup project` in the project root ``. The text decodes as `utf8` exactly as checkProject reads it, so both agree on odd bytes. Its header purpose widens to one sentence: compare installed copies of this checkout's files (the user's installed files and the session project's working section) and render their stale-copy notices.
- **D3 · The Claude seat: the adoption reader reads `--cwd`, with no new child.** In nana-adoption.mjs, when `--cwd <dir>` is given, the reader imports `projectStaleLine` inside its existing try. When the line is not empty, it writes the line on its own first line, before any `[nana:adoption]` block. With no `--cwd`, nothing changes: every existing reader test passes no `--cwd`, or passes a temp folder outside any repository. The hook already passes CLAUDE_PROJECT_DIR. No third producer, because R-2013's budget (hook-producer.mjs:13-18) has no room for one. The stale-copy lane chose a separate child for isolation. Here, isolation comes from D2's totality instead, and the extra cost is a few milliseconds of import (inferred from the import measures above; the builder measures the reader before and after, 3 runs each).
- **D4 · The pi seat: a section in nana-rulings, in its own try.** At every session_start reason, the extension computes `projectStaleLine(ctx.cwd)` in a try separate from the rulings read. So a drift failure can never null the rulings block. At before_agent_start, it sets `sections[PROJECT_STALE_SECTION]` when the line is not empty, independent of `block`. This is the pi home of the one existing stale-copy notice (STALE_SECTION, R-1604). The import is already there. It works in TUI, desk and RPC alike. A new extension was rejected: R-680/R-985 would force a new row in the shared runtime table, and every adopted project would drift again. The widget form is open question 1.
- **D5 · Seats only.** The role guard sits in `projectStaleLine`, so both seats share it. A pi-worker or pi-review child, and a Claude Code reviewer child under review-ledger's env, get nothing. This matters here: 45 drifted linked worktrees on this Mac host builder children, which must not be told to run nana-setup.
- **D6 · The fix command is the bare `nana-setup project`, quoted root.** It is the same command the check row (R-989), the adoption block and the adopt skills name. The double quotes keep a root with spaces runnable in bash, zsh, PowerShell and cmd.
- **D7 · Left out.** Frontier seeds (measured above: no useful signal, no working fix). The shared working-section table: hooks and extensions are unchanged, so R-680/R-985's inventory still holds. The install check: open question 2.

Trade: a session-start notice costs one extra line, only in drifted projects. Against that, five projects' sessions plan without today's Plans and Larger-lanes rules, with no signal at all.

## Must-meet rows (EARS, one shall each) and tests

All tests live in a new `packages/nana-setup/tests/project-stale.test.mjs`. It runs the reader and the real Claude hook with `node` under a temp HOME and temp fixture repositories, and imports `extensions/nana-rulings.ts` with an injected agentDir, as stale-copies.test.mjs does. Every child run has a time limit that fails rather than hangs. Expected lines are built from the config names, never literals. On win32, the symlink case SKIPs with its reason when creating a link fails with EPERM.

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2623 | WHEN the adoption reader runs with `--cwd` set to a folder inside a git repository whose root AGENTS.md holds one ordered pair of nana working-region markers outside code fences enclosing text that differs from this checkout's shared working section, it shall print one line that starts with the project-stale prefix and names `nana-setup project "<root>"` for the canonical root, or `nana-setup project` with no path when the root is not printable or holds a double quote. | `packages/nana-setup/tests/project-stale.test.mjs::R-2623: a session in a project whose working section differs gets one project-stale line naming nana-setup project for its root` |
| R-2624 | IF the session folder is in no git repository, or its root holds a dismissal marker, no regular AGENTS.md, a symlinked AGENTS.md, an AGENTS.md over the bounded read cap, no marker pair outside code fences or a malformed pair, or a region that matches the shared section after CRLF normalisation, THEN the adoption reader shall print no project-stale line. | `packages/nana-setup/tests/project-stale.test.mjs::R-2624: no project-stale line where the region matches or nana-setup project would not refresh it, while one changed byte in the same region brings it` |
| R-2625 | WHEN a pi session starts for any reason in a folder for which the adoption reader prints the project-stale line, the nana-rulings extension shall set the project-stale section to that same line, and leave the section unset after a later session start finds the region matching. | `packages/nana-setup/tests/project-stale.test.mjs::R-2625: a pi session in a drifted project gets the reader's project-stale line as its section, gone after a refresh and a reload` |
| R-2626 | WHILE NANA_ROLE is reviewer or worker, the adoption reader and the nana-rulings extension shall emit no project-stale line. | `packages/nana-setup/tests/project-stale.test.mjs::R-2626: reviewer and worker children get no project-stale line in either seat, and the same folder with no role does` |
| R-2627 | WHEN the adoption reader or the nana-rulings extension decides the project-stale line, it shall start no child process. | `packages/nana-setup/tests/project-stale.test.mjs::R-2627: deciding the project-stale line starts no child process in either seat` |
| R-2628 | WHEN project --check reads a root's AGENTS.md working region, the adoption reader shall print the project-stale line for a session at that root exactly when the check's region row says the region differs. | `packages/nana-setup/tests/project-stale.test.mjs::R-2628: the project-stale line appears exactly where project --check says the working region differs` |

Plus one seal test, naming R-2623 and R-2625 (no row of its own): `seal: the project-stale prefix is [nana:project] PROJECT STALE: and its pi section key is nana-project-stale`.

### What each test does, and why it is red on main

- **R-2623.** Each fixture is a temp repository whose root AGENTS.md holds a marked region with one changed line. Cases:
  - (a) The real Claude hook with CLAUDE_PROJECT_DIR set to the root, run from a cwd outside it.
  - (b) The hook with CLAUDE_PROJECT_DIR set to a subfolder that holds its own unmarked AGENTS.md.
  - (c) The reader with `--cwd` set to the root.
  - (d) A root whose name holds a space.
  - (e) A root whose name holds a backtick, which every platform allows.

  Each run: exit 0, and exactly one stdout line starts with the prefix. That line equals the expected text for the canonical root: quoted in (a) to (d), the no-path form in (e). No journal is seeded, so no `[nana:adoption]` block appears. Red on main: the reader ignores `--cwd` and prints nothing.
- **R-2624.** Ten cases, each with a positive control on the same fixture:
  - Region matches (LF). Control: one byte changed in the region.
  - Region matches with CRLF throughout and a BOM. Control: one byte changed.
  - Prose after the end marker differs. Control: one byte changed in the region.
  - No marker pair. Control: wrap a stale copy in markers.
  - Markers only inside a code fence. Control: the same pair unfenced.
  - Two begin markers. Control: remove one.
  - AGENTS.md is a symlink to a drifted file. Control: replace it with a regular copy.
  - AGENTS.md over BOUNDED_READ_CAP with a drifted region. Control: trim it under the cap.
  - The dismissal marker is present. Control: remove it.
  - The folder is in no repository. Control: add `.git`.

  Each case prints no prefix line, and each control prints it. Red on main: every control prints nothing.
- **R-2625.** A drifted root and a subfolder:
  - session_start `startup` with `ctx.cwd` = the subfolder, then before_agent_start. The project-stale section equals the reader's line for `--cwd` = the same subfolder, byte for byte, and the rulings section is still set.
  - `refreshWorkingRegion(root)`, then session_start `reload`. The section is unset.
  - A ctx with no cwd. The rulings section is set and no project-stale section.

  Red on main: no section.
- **R-2626.** The R-2623 (c) fixture runs with `NANA_ROLE` = `REVIEWER_CHILD_ENV.NANA_ROLE` and with `worker`. Neither the reader nor the extension emits the line. The same fixture with no role does. Red on main: the no-role control gets nothing.
- **R-2627.** The reader runs on the R-2623 (b) subfolder under a NODE_OPTIONS `--require` preload. The preload records every `child_process` spawn, spawnSync, exec, execSync, execFile, execFileSync and fork into a file. The pi extension's session_start runs under an in-process patch (createRequire plus syncBuiltinESMExports). Both must produce the line and record zero calls. Red on main: no line. The zero count alone would pass on main, so the test requires both.
- **R-2628.** Nine fixture roots:
  - region matching (LF)
  - region matching (CRLF)
  - one byte differs
  - only trailing spaces on one line differ
  - only an extra blank line before the end marker differs
  - no pair
  - malformed pair
  - pair only inside a fence
  - symlinked AGENTS.md

  For each, `checkProject(root)` gives a region row, and the reader runs with `--cwd` at the root and at a subfolder. A row whose detail starts `differs` must match a printed line, and no other row may. Red on main: the three differing roots print nothing.

Existing tests made false by the change: none expected. Every existing reader and hook run passes no `--cwd`, or a folder that is not in a repository, or this checkout, which matches its own section (R-859). The rulings and stale-copies harnesses use temp cwds. The builder confirms with the full suite.

## Tunables

- `PROJECT_STALE_PREFIX` = `[nana:project] PROJECT STALE:` (stale-copies-config.mjs). Chosen: it has STALE_PREFIX's shape, so both stale notices read alike. Its distinct tag keeps install-check's STALE_PREFIX scans (install-check.mjs:228, :471) from reading project drift as a stale install. Sealed.
- `PROJECT_STALE_SECTION` = `nana-project-stale` (stale-copies-config.mjs). Chosen: it parallels `nana-install-stale`. Sealed.
- `PROJECT_STALE_LABEL` = `AGENTS.md working section`, and the no-path phrase `in the project root` (stale-copies-config.mjs). Chosen: staleNotice's label-then-remedy sentence (stale-copies.mjs:57). Not sealed; tests import the names.
- `LAUNCHER_ROLES` = `reviewer`, `worker` (stale-copies-config.mjs). Contract: the values review-ledger (worker-config.mjs:72) and pi-worker (pi-worker.mjs:70, :146) set. The knowledge hook skips the same two (hook.ts:159-160).
- AGENTS.md read cap: reuse `BOUNDED_READ_CAP`, 1 MiB, chosen in bounded-read.mjs:11-12. The largest marked AGENTS.md measured here is 17,757 bytes (2026-10-22). No new value.
- No time limit of its own. The reader keeps R-2013's 1500 ms launcher limit, and pi has none for session_start handlers. R-2627 bounds the cost structurally: no child, no TypeScript import, one bounded read and one template read.

## Wrong-code pairs (each must turn its test red)

1. The reader ignores `--cwd` and judges `process.cwd()`. R-2623 (a) turns red.
2. The session folder is taken as the project, with no walk to the repository root. R-2623 (b) turns red.
3. The walk stops at the nearest AGENTS.md instead of the nearest `.git`. R-2623 (b) turns red: the subfolder's own unmarked file.
4. The root is rendered with no quote or code-span check. R-2623 (d) and (e) turn red.
5. No CRLF normalisation. R-2624 CRLF case and R-2628 turn red.
6. Markers found with `indexOf` instead of the fence-aware markerLines. R-2624 fenced case and R-2628 turn red.
7. First begin to first end on a malformed pair. R-2624 malformed case turns red.
8. A symlinked AGENTS.md followed. R-2624 linked case turns red.
9. The dismissal marker ignored. R-2624 dismissed case turns red.
10. An unbounded `readFileSync`. R-2624 over-cap case turns red.
11. A second comparison that trims whitespace or blank lines, in place of the moved one. R-2628 trailing-space and blank-line roots turn red.
12. The root found with `git rev-parse --show-toplevel`, or `checkProject(sessionDir)` called whole. R-2627 turns red.
13. No role guard, or a guard in one seat only. R-2626 turns red.
14. The pi line computed once per process, or inside the rulings try. R-2625 turns red: the reload case keeps the line, and the cwd-less case drops the rulings section.
15. The pi section text built apart from the reader's line, for example with a different prefix or an unquoted root. R-2625's byte-equality turns red.

## Known limits (the seat writes them to docs/known-bugs/FEAT-014.md before the final round)

- Only the AGENTS.md marker region is compared. The frontier seeds are not: the five drifted checkouts hold the current sessions README, the other two seeds are owner-written, and `nana-setup project` never rewrites a present seed.
- The comparison uses the checkout the hook or extension runs from. On this Mac that is the checkout `nana-setup` writes from. A machine where they differ gets that checkout's answer.
- A linked worktree is its own root (R-809). A session in a lane worktree of a stale project names the worktree; the fix belongs in the main checkout, then a merge.
- A nana-pi lane worktree whose branch edits the shared section reads as differing against `~/nana-pi`'s section. The named fix would revert the branch's edit, and R-859 in that lane's suite would catch it.
- No line where `nana-setup project` would not refresh the region: no markers (13 home-level checkouts on this Mac), a malformed or fence-only pair, a symlink, over 1 MiB, or dismissed. `project --check` still reports these.
- The line inherits the project check's odd-byte reading. An invalid UTF-8 or unwritable AGENTS.md still names the fix, and setup then skips it with its reason (see the existing FEAT-014 line on the read-only dry run).
- The command is bare. On Windows without the bin folder on PATH, the owner needs the `node` form, as the adopt skills say. A POSIX root holding `$` expands inside the double quotes.
- Both seats decide at session start. A fix made mid-session clears the line at the next start or a pi reload, not at the next turn.
- Inferred, not probed: SessionStart does not fire for a Claude Code subagent, so a Claude Code builder gets nothing. Claude Code passes review-ledger's NANA_ROLE to its hooks.
- A failure in the reader's imports still prints the existing ADOPTION UNAVAILABLE marker. `projectStaleLine` itself returns "" on any error. An unreadable AGENTS.md gives no line.
- The shared runtime table does not list the line. It lists hooks and extensions, and those are unchanged.

## Docs that change

- `packages/nana-pack/README.md`: the adoption paragraph (:895-920) gains the `--cwd` project-stale line. The nana-rulings row (:43) gains the project-stale section.
- `packages/nana-setup/README.md`: one test-table row for `tests/project-stale.test.mjs`.
- Module headers:
  - `bin/nana-adoption.mjs`: `--cwd` is now used.
  - `lib/stale-copies.mjs` and `lib/stale-copies-config.mjs`
  - `extensions/nana-rulings.ts`
  - `lib/project.mjs`: re-exports.
  - `lib/paths.mjs`: SHARED_DIR.
  - The new `lib/working-region.mjs`.
- `REQUIREMENTS.md`: six rows, five in SUB-016 and one in SUB-021.
- Regenerated by the builder: `docs/requirements-tree.md` and `docs/code-map.md`.
- The seat writes HANDOFF, the session note and the FEAT-014 known bugs before the final round.
- Unchanged: `templates/_shared/working-under-nana-pi.md` and AGENTS.md's marker region. A change there would only move the target the five projects already miss.

## Seat steps

- Before building, the builder runs map impact on project.mjs, stale-copies.mjs, nana-adoption.mjs and nana-rulings.ts, and works from the blast radius.
- Build with the larger builder: a hook lane that touches both seats' session start. The build brief carries this Precedent section.
- The seat runs the fifteen wrong-code pairs and one independent check, and the land reviewer runs.
- The seat runs the install check locally on macOS before nana-land. Its fresh project has no markers, so it proves the hook still runs and stays silent there.
- CI runs on the draft PR, with the Windows leg blocking. That leg covers backslash roots, CRLF, a backtick root and the symlink SKIP.
- The seat carries `requirements-moved.mjs --base main` output into the final brief and the land.
- After the land, the seat looks at one real Claude seat start in a drifted project, and at the pi section through the test harness or one pi session there. It records the line.
- This lane fixes no project. The seat lists the five drifted projects for the owner in HANDOFF.
- Cross-lane: other open lanes that edit project.mjs or nana-rulings.ts merge main, whichever lands later.

## Open for the seat (one-word defaults)

1. The pi seat surface. The plan uses a prompt section in nana-rulings: the pi agent tells the owner, as the Claude line does, and it works in TUI, desk and RPC. The other choice is a widget like the roster notice: the owner sees it directly, and seats only come for free through `hasUI`. Default: `section`.
2. Should the install check gain a drifted-project probe for both seats? Default: `no`. The must-meet tests already run the real hook and the real extension.
3. Should the line be skipped in linked worktrees? Default: `no`. It is recorded as a known limit.
