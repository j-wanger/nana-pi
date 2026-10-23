# project-drift-notice · must-meet (seat, 2026-10-22, after one adversary pass)

Feature: FEAT-014 · Create or adopt a project workspace

Spend line: the current priority (both seats in terminal mode, every hook working) through the owner's 2026-10-22 slate of open audit items. The precedent audit found that other projects' working sections lack the new Plans text and nothing warns. Five home-level checkouts on this machine differ from the shared working section today, and no session is told.

Class: hook (the Claude Code SessionStart adoption hook's stale-copy producer and the nana-rulings pi extension change their output; the hook entry file and `hook-producer.mjs` stay byte-unchanged). Moving `SHARED_DIR` into `paths.mjs` and growing `stale-copies.mjs`'s imports reach the installer's path resolver and doctor's import graph without changing what they do; the class stays hook, and map impact runs on `paths.mjs` too. Ladder: the roster's final reviewer, the land reviewer, the seat's wrong-code pairs, one independent check, the install check on macOS before the land (its fresh project has no markers, so it proves only that the hook still runs and stays silent), and the blocking Windows CI leg. Builder: the larger builder. Stakes: medium blast, reversible. Every Claude Code and pi seat start runs the new code. The named fix, `nana-setup project`, refreshes the marker region and also seeds any absent frontier file and month log, replaces a CLAUDE.md placeholder, writes `.pi/nana-pack.json` and starts a knowledge build. Nothing is written by this lane's code.

Threat model: honest variation in our own tools' output and in real project folders: a session in a subfolder, a subfolder with its own unmarked AGENTS.md, a linked worktree, CRLF, a BOM, a cp1252 byte, Windows drive and backslash paths, a root holding a space, a backtick or a double quote, a region differing only in trailing spaces or a blank line, a marker pair only inside a code fence, a duplicated begin marker, a symlinked, absent, folder-shaped or unreadable AGENTS.md, a dismissed repository, an AGENTS.md with no markers, a nana-pi checkout behind main, a copier project at its last tag, and launcher children (reviewer, worker). Deliberate forgery is out: a project that hand-writes the shared section passes as current, and a planted `.nana-not-a-project` silences the line. Public repo: no owner name, nothing about the owner's work, and no machine-local project names; HANDOFF says "five projects on this machine".

The planner's draft (`plan-draft.md`) holds the measurements; the adversary's attack (`plan-attack.md`, M 4, S 11, N 12) changed the plan as the decisions below say. Where they disagree with this file, this file wins.

## Precedent

Precedent:
- packages/nana-setup/lib/project.mjs — checkProject's region row (fence-aware markers, exactly one ordered pair, CRLF normalised on both sides, compare), `WORKING_BEGIN` and `WORKING_END`, `markerLines`, `SHARED_DIR`, `readShared` and the three spellings of the shared file name, and `refreshWorkingRegion`'s fatal UTF-8 decode; the compare, markers, scan and file name MOVE into a shared pure module and are imported back.
- packages/nana-setup/lib/paths.mjs — `pkgRoot` and `repoRoot`, the new home of `SHARED_DIR`.
- packages/nana-setup/bin/stale-copies.mjs — the adoption hook's second producer: it already receives `--cwd`, imports stale-copies.mjs, renders the notice shape and has its own child, limit and fail-open marker. The project-stale line is computed here, before the install-record gate.
- packages/nana-setup/lib/stale-copies.mjs — `staleNotice`: prefix, label, "tell the user; they fix it with", and the `node "<pkgRoot>/bin/nana-setup.mjs"` command inside `codeSpan` with a bare fallback.
- packages/nana-setup/lib/stale-copies-config.mjs — `STALE_PREFIX` and `STALE_SECTION` with provenance; the new names go here.
- packages/nana-pack/lib/adoption.mjs — `canonicalCwd`, `repoRootOf`, the dismissal `MARKER`, `printable`, and the OS temp-root skip.
- packages/nana-pack/lib/display.mjs — `codeSpan` and its 512-character cap.
- packages/nana-pack/lib/bounded-read.mjs — `readBounded` and `BOUNDED_READ_CAP`.
- packages/nana-setup/lib/hook-producer.mjs — two producers at 1,500 ms each under the installer's 5 s (R-2013); the launcher passes `--cwd`.
- packages/nana-setup/claude/hooks/nana-adoption.mjs — the hook runs the adoption reader, then the stale-copy producer; unchanged.
- packages/nana-pack/extensions/nana-rulings.ts — compute at every session_start reason in a try, set a section at before_agent_start; `STALE_SECTION` beside `RULINGS_SECTION`.
- packages/nana-pack/bin/worker-config.mjs — `REVIEWER_CHILD_ENV.NANA_ROLE`, the named reviewer role.
- packages/nana-setup/tests/stale-copies.test.mjs — one file driving both seats: the Claude producer and the imported rulings extension, the seal-test form, and `!Object.hasOwn(sections, …)` for an unset section (R-1605).
- packages/nana-pack/tests/adoption-reader.test.mjs — temp HOME, the `repo()` fixture, running the hook with node, and the env keys it removes.
- packages/nana-setup/tests/project-working-region.test.mjs — region fixtures and CRLF variants.
- packages/nana-setup/tests/stale-copies-slow.test.mjs — a `--require` preload through NODE_OPTIONS to a child run.
- packages/nana-pack/tests/agent-dir-config.test.mjs — createRequire plus syncBuiltinESMExports to patch a builtin in process.
- packages/nana-knowledge/tests/hook.test.mjs — `delete process.env.NANA_ROLE` at the top and around role cases.
- packages/nana-setup/tests/hooks-closed-output.test.mjs — `CASE_LIMIT_MS`, a named per-child limit with provenance.

## Seat decisions

- **D1 · Move, do not rewrite, the comparison** (draft D1; adversary S10). New `packages/nana-setup/lib/working-region.mjs` (effects disk, for the one shared-file read) holds `WORKING_BEGIN`, `WORKING_END`, `WORKING_FILE` (contract: R-859), `markerLines`, `readSharedWorking()` and `regionVerdict(text, shared)` returning `"malformed"`, `"match"` or `"differs"` from checkProject's own lines. checkProject, refreshWorkingRegion and agentsStub read them by name; project.mjs re-exports the markers and `SHARED_DIR`, so no importer changes. R-989's tests stay green.
- **D2 · One total function decides the line for both seats** (draft D2; adversary M4, S4, S7, S11, N5, N12). `projectStaleLine(sessionDir, { env = process.env } = {})` in `stale-copies.mjs` never throws. It returns "" when `env.NANA_ROLE` is one of `LAUNCHER_ROLES`; when the folder is in no repository (`canonicalCwd`, `repoRootOf`); when the root's `.git` is a file (a linked worktree or submodule: the fix belongs in the main checkout); when the root holds `templates/_shared/` + `WORKING_FILE` (a nana-pi checkout, governed by R-859); when the root holds the dismissal marker; when root AGENTS.md is absent, a symlink, not a regular file, unreadable or over `BOUNDED_READ_CAP`; when it is not valid UTF-8 (fatal decode, as refreshWorkingRegion); or when the verdict is not `"differs"`. Otherwise one line: `${PROJECT_STALE_PREFIX} ${PROJECT_STALE_LABEL} — tell the user; they fix it with <command>`, where the command is `codeSpan(\`node "<pkgRoot>/bin/nana-setup.mjs" project "<root>"\`)`, falling back to `` `nana-setup project` `` + ` in the project root` when the span is null, `printable(root)` fails or the root holds `"`. `LAUNCHER_ROLES` is built from `REVIEWER_CHILD_ENV.NANA_ROLE` plus `worker` (contract: pi-worker). OS temp roots are not skipped (known limit).
- **D3 · The Claude seat: the stale-copy producer** (adversary S1, M3). `packages/nana-setup/bin/stale-copies.mjs` reads `--cwd`, and before its install-record gate writes `projectStaleLine(<cwd>)` on its own line when not empty. The adoption reader is unchanged, so a failure in nana-setup's import graph costs only the stale-copy producer's own unavailable marker, never the adoption block. No new producer and no hook change.
- **D4 · The pi seat: a section in nana-rulings, in its own try** (draft D4; owner question 1 default `section`, seat's call). At every session_start reason the extension computes `projectStaleLine(ctx.cwd)` in a try separate from the rulings read; at before_agent_start it sets `sections[PROJECT_STALE_SECTION]` only when the line is not empty, independent of the rulings block.
- **D5 · Seats only** (draft D5). The role guard sits in `projectStaleLine`, so both seats share it.
- **D6 · Left out** (draft D7). Frontier seeds; the shared runtime table (hooks and extensions are unchanged); an install-check probe (default `no`); a second line form for adopted projects with a bare unmarked copy (default `later`); comparing a copier project against its tag (default `no`).

## Must-meet rows

All rows in FEAT-014: R-2623 to R-2627 in SUB-016 beside the adoption reader's rows; R-2628 in SUB-021 beside R-989.

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2623 | WHEN the stale-copy producer runs with `--cwd` set to a folder inside a git repository whose root AGENTS.md holds one ordered pair of nana working-region markers outside code fences enclosing text that differs from this checkout's shared working section, it shall print one line that starts with the project-stale prefix and names this checkout's `nana-setup.mjs project` for the canonical root, or `nana-setup project` with no path when the root is not printable or holds a double quote. | `packages/nana-setup/tests/project-stale.test.mjs::R-2623: a session in a project whose working section differs gets one project-stale line naming nana-setup project for its root` |
| R-2624 | IF the session folder is in no git repository, or its root is a linked worktree, a nana-pi checkout or dismissed, or holds no regular, readable, valid UTF-8 AGENTS.md within the bounded read cap, no marker pair outside code fences, a malformed pair, or a region that matches the shared section after CRLF normalisation, THEN the stale-copy producer shall print no project-stale line. | `packages/nana-setup/tests/project-stale.test.mjs::R-2624: no project-stale line where the region matches or nana-setup project would not refresh it, while one changed byte in the same region brings it` |
| R-2625 | WHEN a pi session starts for any reason, the nana-rulings extension shall set the project-stale section to the stale-copy producer's project-stale line for that folder exactly when the producer prints one, and leave the section unset otherwise. | `packages/nana-setup/tests/project-stale.test.mjs::R-2625: a pi session in a drifted project gets the producer's project-stale line as its section, gone after a refresh and a reload` |
| R-2626 | WHILE NANA_ROLE is reviewer or worker, the stale-copy producer and the nana-rulings extension shall emit no project-stale line. | `packages/nana-setup/tests/project-stale.test.mjs::R-2626: reviewer and worker children get no project-stale line in either seat, and the same folder with no role does` |
| R-2627 | WHEN the stale-copy producer or the nana-rulings extension decides the project-stale line, it shall start no child process and import no TypeScript module. | `packages/nana-setup/tests/project-stale.test.mjs::R-2627: deciding the project-stale line starts no child process and loads no TypeScript in either seat` |
| R-2628 | WHEN project --check reads the working region of a git repository root that is not a linked worktree, a nana-pi checkout or dismissed, and whose AGENTS.md is a regular, valid UTF-8 file within the bounded read cap, the stale-copy producer shall print the project-stale line for a session at that root exactly when the check's region row says the region differs. | `packages/nana-setup/tests/project-stale.test.mjs::R-2628: the project-stale line appears exactly where project --check says the working region differs` |

Plus one seal test naming R-2623 and R-2625: `packages/nana-setup/tests/project-stale.test.mjs::seal: the project-stale prefix is [nana:project] PROJECT STALE: and its pi section key is nana-project-stale`. R-2629 and R-2630 stay free.

### What each test does, and why it is red on main

The file opens with `delete process.env.NANA_ROLE` and saves and restores it around the in-process role cases; every child env drops `NANA_ROLE`, `PI_CODING_AGENT_DIR`, `CLAUDE_CONFIG_DIR` and `NANA_TEST_TEMP_ROOTS`. Children run under a temp HOME with a named per-child limit (`CASE_LIMIT_MS`, with provenance). The extension is imported with an injected agentDir. Expected lines are built from the config names and from `codeSpan`, never literals. On win32 the symlink, EACCES and double-quote cases SKIP with their reason.

- **R-2623.** Temp repositories whose root AGENTS.md holds a marked region with one changed line. (a) The real Claude hook with CLAUDE_PROJECT_DIR the root, from a cwd outside it; (b) the hook with CLAUDE_PROJECT_DIR a subfolder holding its own unmarked AGENTS.md; (c) the producer with `--cwd` the root; (d) a root holding a space; (e) a root holding a backtick; (f) a POSIX root holding `"`. Each: exit 0, exactly one stdout line with the prefix, equal to the expected text for the canonical root, node form in (a) to (d), no-path form in (e) and (f). (g) With a seeded journal, the hook's adoption block prints whole and the project-stale line is its own line after it. Red on main: the producer ignores `--cwd`.
- **R-2624.** Each case prints no line, and its control on the same fixture prints it: region matches (control: one byte changed); CRLF with a BOM (one byte changed); prose after the end marker differs (one byte in the region); no pair (wrap a stale copy in markers); markers only in a fence (unfenced); two begin markers (remove one); AGENTS.md a symlink (a regular copy); AGENTS.md absent (add a drifted one); AGENTS.md a folder (replace with a drifted file); POSIX EACCES AGENTS.md (restore the mode); over the cap (trim under it); a cp1252 byte outside the region (replace it); dismissed (remove the marker); `.git` a file (a folder); `templates/_shared/working-under-nana-pi.md` present (remove it); in no repository (add `.git`; guarded by asserting `repoRootOf` is null, else SKIP). Red on main: every control prints nothing.
- **R-2625.** A drifted root and a subfolder: session_start `startup` with `ctx.cwd` the subfolder, then before_agent_start: the section equals the producer's line for the same folder byte for byte, and the rulings section is still set. `refreshWorkingRegion(root)`, then `reload`: `!Object.hasOwn(sections, PROJECT_STALE_SECTION)`. A ctx with no cwd: rulings set, no project-stale section. Every R-2624 negative run through the extension leaves the section unset. Red on main: no section.
- **R-2626.** The R-2623 (c) fixture with `NANA_ROLE` = `REVIEWER_CHILD_ENV.NANA_ROLE` and with `worker`: neither seat emits the line; with no role both do. Red on main: the no-role control gets nothing.
- **R-2627.** The producer on the R-2623 (b) subfolder under a NODE_OPTIONS `--require` preload recording every `child_process` spawn, spawnSync, exec, execSync, execFile, execFileSync and fork; the extension's session_start under an in-process patch. Both produce the line and record zero calls. The producer also runs under `node --no-experimental-strip-types` and still prints the line. Red on main: no line.
- **R-2628.** Fixture roots: matching (LF), matching (CRLF), one byte differs, only trailing spaces differ, only an extra blank line before the end marker differs, no pair, malformed pair, pair only in a fence, symlinked AGENTS.md; plus a dismissed root and an over-cap root, where the check says `differs` and no line prints (the scope is pinned). For each in scope, `checkProject(root)` gives a region row and the producer runs at the root and at a subfolder: a row whose detail starts `differs` matches a printed line, and no other row does. Red on main: the differing roots print nothing.

Existing tests made false: none expected; the builder confirms with the full suite (stale-copies, adoption-reader, project-working-region, hook-deadlines, hooks-closed-output, rulings and the install check).

## Tunables (packages/nana-setup/lib/stale-copies-config.mjs unless noted)

- `PROJECT_STALE_PREFIX` = `[nana:project] PROJECT STALE:` — chosen: `STALE_PREFIX`'s shape with its own tag, so install-check's `STALE_PREFIX` scans (packages/nana-setup/lib/install-check.mjs) do not read project drift as a stale install. Sealed.
- `PROJECT_STALE_SECTION` = `nana-project-stale` — chosen: parallels `nana-install-stale`. Sealed.
- `PROJECT_STALE_LABEL` = `AGENTS.md working section`, and the no-path phrase `in the project root` — chosen: staleNotice's label-then-remedy sentence.
- `LAUNCHER_ROLES` — built from `REVIEWER_CHILD_ENV.NANA_ROLE` and `worker` (contract: pi-worker).
- `WORKING_FILE` = `working-under-nana-pi.md` in working-region.mjs — contract: R-859.
- AGENTS.md read cap: `BOUNDED_READ_CAP` reused (largest marked AGENTS.md measured 17,757 bytes, 2026-10-22).
- No time limit of its own: the producer keeps R-2013's 1,500 ms launcher limit; R-2627 bounds the cost structurally.

## Wrong-code pairs (the seat runs each; it must turn its test red)

1. The producer ignores `--cwd` and judges `process.cwd()` (R-2623 a, c).
2. No walk to the repository root, or a walk that stops at the nearest AGENTS.md (R-2623 b).
3. The root rendered with no quote or span check (R-2623 d, e, f).
4. No CRLF normalisation (R-2624 CRLF case; R-2628).
5. Markers found without `markerLines`, or first begin to first end on a malformed pair (R-2624 fenced and malformed cases).
6. A symlinked AGENTS.md followed (R-2624).
7. A guard of D2 skipped: the dismissal marker, the cap, the `.git` file or the nana-pi checkout (R-2624).
8. A read error, or invalid UTF-8, counted as differs (R-2624).
9. A second comparison that trims whitespace or blank lines (R-2628).
10. The root found with `git rev-parse --show-toplevel` (R-2627 spawn count).
11. `checkProject(root)` called whole (R-2627 strip-types-off run).
12. No role guard (R-2626).
13. The pi line computed once per process, or inside the rulings try (R-2625).
14. The pi section built apart from the producer's line, or set to an empty string (R-2625).
15. The project-stale line computed after the install-record gate (R-2623: the temp HOME has no install record).

## Known limits (the seat writes them to docs/known-bugs/FEAT-014.md before the final round)

- Only the AGENTS.md marker region is compared; frontier seeds are not.
- The comparison uses the checkout the hook or extension runs from; the named command is that checkout's, so it writes the section that was compared.
- Linked worktrees and submodules get no line; the fix belongs in the main checkout, then a merge.
- A nana-pi checkout gets no line; R-859 governs it.
- No line where `nana-setup project` would not refresh the region: no markers (of 13 home-level checkouts here, 4 are adopted with a bare unmarked copy and 9 are other projects), a malformed or fence-only pair, a symlink, an unreadable or invalid UTF-8 file, over 1 MiB, or dismissed. `project --check` still reports these.
- The named fix also seeds any absent frontier file and month log, replaces a CLAUDE.md placeholder, writes `.pi/nana-pack.json` and starts a knowledge build.
- A copier project compares against main's section, not its template tag; its documented copier update does not clear the line, and the named fix writes unreleased text that a later update may conflict with.
- Inside the double quotes, `$` expands in POSIX shells and PowerShell, a backtick in PowerShell, and `%VAR%` in cmd.
- Both seats decide at session start; a fix mid-session clears the line at the next start or a pi reload.
- OS temp roots are not skipped, unlike the adoption block.
- Inferred, not probed: SessionStart does not fire for a Claude Code subagent, so a Claude Code builder gets nothing.
- The shared runtime table does not list the line; it lists hooks and extensions, which are unchanged.

## Docs that change

- `packages/nana-pack/README.md`: the nana-rulings row gains the project-stale section.
- `packages/nana-setup/README.md`: the stale-copy producer's paragraph gains the project-stale line; one test-table row for `tests/project-stale.test.mjs`.
- Module headers: `bin/stale-copies.mjs` (`--cwd` now read; purpose widened to the installed files and the session project's working section), `lib/stale-copies.mjs`, `lib/stale-copies-config.mjs`, `extensions/nana-rulings.ts`, `lib/project.mjs` (re-exports), `lib/paths.mjs` (`SHARED_DIR`), the new `lib/working-region.mjs`.
- `REQUIREMENTS.md`: six rows. Regenerated: `docs/requirements-tree.md` and `docs/code-map.md`.
- Unchanged: `templates/_shared/working-under-nana-pi.md`, AGENTS.md's marker region, the hook entry, `hook-producer.mjs`, the adoption reader.

## Seat steps

- Before building, the builder runs map impact on project.mjs, paths.mjs, stale-copies.mjs, bin/stale-copies.mjs and nana-rulings.ts.
- Build with the larger builder; the build brief carries a Precedent section and passes brief-check.
- The pairs above, the land reviewer, one independent check, the install check on macOS, CI with the Windows leg.
- `requirements-moved.mjs --base main` output in the final brief and the land.
- After the land, the seat looks at one real Claude seat start in a drifted project and records the line.
- Cross-lane: session-start-frontier also edits nana-rulings.ts (`causeFor` moves out); whichever lands second merges main.
