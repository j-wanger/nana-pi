# project-check-line: plan draft (planner, 2026-10-23)

Feature: FEAT-014 · Create or adopt a project workspace (label checked at REQUIREMENTS.md:1255). Five rows go in SUB-016 (Recognize projects that need adoption), beside R-2623 to R-2627: R-2760, R-2761, R-2763, R-2764 and R-2765. R-2762 goes in SUB-021 (Check readiness), in R-2628's place. R-2624 and R-2628 are retired with named successors (open question 3). R-2766 and R-2767 stay free.

## Why

The owner picked this on 2026-10-23: in an adopted project whose seed or working-region check fails, session start prints one project line on both runtimes. The line names every failing row that `nana-setup project --check` decides from files alone, with its fix. Today the line names only a differing working section (packages/nana-setup/lib/stale-copies.mjs:60-88 returns a line only on `differs`).

The gap, measured: five of the ten adopted projects on this machine fail a seed row and get no session line. Four miss only `docs/sessions/README.md`. One also misses `.pi/nana-pack.json`, a row that needs user config and stays out.

## Spend line

The current priority (since 2026-10-23) is to make every artifact a maintained feature, made by an existing run and read by code that acts on it. Its appetite lists the 2026-10-22 audit's top gaps, including "other projects' checks reported". This lane closes the seed half of audit gap 8. e1ac980f closed its working-region half.

## Stakes

Medium blast, reversible. Every Claude Code and pi seat start in an adopted project runs the new code, which means ten projects here. `projectStaleLine` stays total, so any throw gives "" and the seat loses only this line. A false row sends the owner to `nana-setup project`, which never overwrites a present file, or to the check, which names the by-hand step. The riskier part is the lift. `project --check` runs the moved row code, and the adopt skills' closing step reads that check (R-1670). A lift that changed one ✓ or ✗ would mislead every adoption close. The guard is the existing project tests plus a byte diff of `project --check` output over the home repos (seat step 1).

## Measurements (this Mac, Node 22.22.2, main c273b4de, read-only)

Method: `node packages/nana-setup/bin/nana-setup.mjs project ~/<repo> --check` on every git repository directly under ~/ that has an AGENTS.md or OBJECTIVE.md. That is 19 repositories, this checkout included. `projectStaleLine(root, { env: {} })` was driven from a `git archive` copy of main in <scratch>. A scratch prototype of the lifted rows, the gate and the line ran against the same roots. No file in any home repo was newer than the first check output afterwards (measured with `find -newer`, depth 3, excluding `.git` and `node_modules`).

| Repo | Last commit | OBJECTIVE / HANDOFF / markers | ✗ file rows (of the seven) | ! region | Today's line | Gate | New line (prototype) |
|---|---|---|---|---|---|---|---|
| P1 | 2026-10-20 | ✓ / ✓ / ✓ | AGENTS.md working region | — | working section | in | same bytes |
| P2 | 2026-10-07 | ✓ / ✓ / ✓ | AGENTS.md working region | — | working section | in | same bytes |
| P3 (largest, 4,063 tracked files) | 2026-10-07 | ✓ / ✓ / ✓ | AGENTS.md working region | — | working section | in | same bytes |
| P4 | 2026-10-19 | ✓ / ✓ / ✓ | AGENTS.md working region | — | working section | in | same bytes |
| P5 | 2026-10-15 | ✓ / ✓ / ✓ | AGENTS.md working region | — | working section | in | same bytes |
| P6 | 2026-10-07 | ✓ / ✓ / — | docs/sessions/README.md | ! | none | in | `docs/sessions/README.md` |
| P7 | 2026-09-18 | ✓ / ✓ / — | docs/sessions/README.md | ! | none | in | `docs/sessions/README.md` |
| P8 | 2026-09-18 | ✓ / ✓ / — | docs/sessions/README.md | ! | none | in | `docs/sessions/README.md` |
| P9 | 2026-09-18 | ✓ / ✓ / — | docs/sessions/README.md | ! | none | in | `docs/sessions/README.md` |
| P10 | 2026-10-23 | ✓ / ✓ / — | docs/sessions/README.md (plus the config row `.pi/nana-pack.json`, out) | ! | none | in | `docs/sessions/README.md` |
| N1 | 2026-06-23 | — / — / — | four seeds, CLAUDE.md | ! | none | out | none |
| N2 | 2026-06-29 | — / — / — | four seeds, CLAUDE.md | ! | none | out | none |
| N3 | 2026-06-23 | — / — / — | four seeds, CLAUDE.md | ! | none | out | none |
| N4 | 2026-10-08 | — / — / — | four seeds, CLAUDE.md | ! | none | out | none |
| N5 | 2026-05-13 | — / — / — | four seeds, CLAUDE.md | ! | none | out | none |
| N6 | 2026-10-02 | — / — / — | four seeds, CLAUDE.md | ! | none | out | none |
| N7 | 2026-08-05 | — / — / — | four seeds, CLAUDE.md | ! | none | out | none |
| N8 | 2026-10-02 | — / ✓ (its own frontier) / — | OBJECTIVE.md, docs/sessions/README.md, docs/sessions/YYYY-MM.md, CLAUDE.md | ! | none | out | none |
| this checkout | 2026-10-23 | — / ✓ / ✓ | OBJECTIVE.md, docs/sessions/README.md (by design) | — | none (nana-pi guard) | skipped | none |

"The seven" are the file-decided rows: OBJECTIVE.md, HANDOFF.md, docs/sessions/README.md, docs/sessions/YYYY-MM.md, AGENTS.md working region, AGENTS.md and CLAUDE.md. "Four seeds" means the first four of those.

- Measured: five of the eight other projects have an AGENTS.md containing the word "nana". Each other project fails four or five seed rows plus CLAUDE.md. A line keyed on failing seeds would fire in all eight, including three not committed since June or earlier.
- Measured: all ten adopted projects hold OBJECTIVE.md, and five of the ten hold the marker pair. The five without markers read `!` for the working region. The check calls that a warning, not a failure.
- Measured: the prototype's failing rows equal the check's ✗ rows among the seven on all 19 repos. Today's line equals the prototype line byte for byte on P1 to P5.
- Measured, scratch fixture: five rows were by hand (OBJECTIVE.md a directory, HANDOFF.md a dangling link whose target holds a newline, `docs` a file, an own CLAUDE.md) and one was a setup fix (a drifted region). The prototype's by-hand split equals the check summary's. That line was 892 characters with no newline and no link-target text. With a 200-character folder name it was 1,282 characters.
- Measured, found while measuring: `project --check` prints a symlink target raw, so a target holding a newline breaks its one-row-per-line shape. This lane does not fix that. The seat records it as a FEAT-014 known bug.
- Measured cost of today's `projectStaleLine` in process: 0.27 to 1.5 ms per repo, import 12.1 ms. The prototype took 0.43 to 2.3 ms per repo, the slowest being a first call.
- Measured cost as a child (11 runs, first dropped, temp HOME so ~/.claude is not read): today's stale-copy producer had a median of 47.6 ms on P3 and 49.3 ms on P10. A bare `node -e 0` takes 26.9 ms. The standalone prototype CLI took 41.7 to 41.9 ms, but its import set differs, so this is not a delta. Inferred: the new rows add 2 ms or less per session start inside the real producer. The producer limit is 2,500 ms (`HOOK_PRODUCER_TIMEOUT_MS`).
- Measured: `tests/project-stale.test.mjs` passes 7 of 7 at main in 7.0 s wall (scratch copy, temp HOME and TMPDIR). The runner's per-file limit is 5 min (scripts/test.mjs:89).
- Measured, map impact (static part, scratch copy): `lib/project.mjs` has 5 transitive callers, the CLI and four tests. `lib/stale-copies.mjs` has 34, including `lib/doctor.mjs`, `lib/install-check.mjs`, `lib/hook-health.mjs` and `extensions/nana-rulings.ts`. A new import in stale-copies.mjs therefore reaches doctor's and install's import graph. The runtime block needs a git checkout, so the builder runs impact in the worktree.

## Precedent

Precedent:
- packages/nana-setup/lib/project.mjs:538-673 — checkProject. Its closures `fileState` (:544), `seed` (:550) and `monthFiles` (:554) and its row blocks for the four seeds (:570-586), the working region (:588-600), the navigation file (:602-624) and CLAUDE.md (:626-673) MOVE into a new shared module as `projectFileRows`. checkProject calls it back between its git row and its config rows, so every row keeps its label, ok, detail, note and projectLabel byte for byte.
- packages/nana-setup/lib/project.mjs:74-106 — `seedEntry`, a private helper. It MOVES to the new module. stepSeeds (:169), stepAgents (:313) and stepPackConfig import it back.
- packages/nana-setup/lib/project.mjs:65-71 — `lstat`, a private helper. It MOVES with seedEntry, and project.mjs imports it back (stepGit, dismissProject, refuseIfDismissed, stepClaudeImportRefresh).
- packages/nana-setup/lib/project.mjs:44 — `today`. It MOVES, and project.mjs re-exports it.
- packages/nana-setup/lib/project.mjs:192 and :196 — `CLAUDE_IMPORT`, exported, and `PLACEHOLDER_RE`, private. Both MOVE. project.mjs re-exports CLAUDE_IMPORT, and stepClaudeImportRefresh (:351) imports PLACEHOLDER_RE back.
- packages/nana-setup/lib/working-region.mjs — `markerLines`, `readSharedWorking` and `regionVerdict`, unchanged. The gate's marker test uses `markerLines`.
- packages/nana-setup/lib/stale-copies.mjs:60-88 — `projectStaleLine`: the role guard, the root walk, the linked-worktree, nana-pi-checkout and dismissal skips, the bounded fatal-UTF-8 read, and the fix rendering with its no-path fallback. All of these stay. The gate and the rows go after the skips.
- packages/nana-setup/lib/stale-copies.mjs:92-98 — `staleNotice`. Its "labels joined by comma, tell the user; they move X out of the way, then fix it with Y" shape is the model for the by-hand form. Its sentence words are inline code, and the new connective words follow that.
- packages/nana-setup/lib/stale-copies-config.mjs — PROJECT_STALE_PREFIX and PROJECT_STALE_SECTION (sealed), and PROJECT_STALE_LABEL, PROJECT_STALE_ROOT_PHRASE and PROJECT_STALE_NO_PATH_CHARS. All are reused unchanged.
- packages/nana-setup/bin/nana-setup.mjs:419-436 — the check's ✓/!/✗ rendering and its summary. That summary is the by-hand split R-2763 compares against (R-2423). Not changed.
- packages/nana-setup/bin/stale-copies.mjs:21 — the Claude caller, which writes the line before its install-record gate. Code unchanged, header changes.
- packages/nana-pack/extensions/nana-rulings.ts:76-80 and :86-90 — the pi caller. It computes at every session_start reason in its own try and sets PROJECT_STALE_SECTION at before_agent_start. Code unchanged, header wording only.
- packages/nana-setup/claude/hooks/nana-adoption.mjs:16-18 and packages/nana-setup/lib/hook-producer.mjs — the hook runs the adoption reader and then the stale-copy producer with `--cwd`, under a 2,500 ms producer limit and a 4,000 ms deadline. Unchanged.
- packages/nana-setup/lib/settings.mjs:207 and :222 — install's SessionStart adoption entry (`timeout: 5`). Unchanged, so there is no install change.
- packages/nana-pack/lib/adoption.mjs:68, :107, :137 and :177 — `canonicalCwd`, `repoRootOf`, `isAdopted` (rejected as the gate, see Dropped) and `printable`.
- packages/nana-pack/lib/bounded-read.mjs:12 — `BOUNDED_READ_CAP`. It now also bounds the CLAUDE.md read on the producer path.
- packages/nana-pack/lib/display.mjs:140-150 — `CODE_SPAN_CAP` and `codeSpan`. They bound each command span.
- packages/nana-setup/tests/project-stale.test.mjs — the harness: `repository()`, `childEnv`, `sectionsFor`, `within`, `CASE_LIMIT_MS`, `expectedLine`, the child-process preload, and the R-2624 and R-2628 fixture lists that move.
- packages/nana-setup/tests/project-odd-seeds.test.mjs:173-182 — parsing the check's by-hand summary.
- docs/reviews/project-drift-notice-2026-10-22/ — the hook lane that added the line (must-meet.md, plan-draft.md, seat-mutate.mjs).

## Design

- **D1 · Lift the file rows, do not copy them.** New `packages/nana-setup/lib/project-rows.mjs` gets a six-tag header. Its purpose is to decide the project check's file-state rows from the project's files alone. Its effects are disk only. It imports only `node:fs`, `node:path` and working-region.mjs, never project.mjs or steps.mjs, so doctor's and install's graph grows by one small module. It exports `lstat`, `seedEntry`, `today`, `CLAUDE_IMPORT`, `PLACEHOLDER_RE` and `projectFileRows(dir, { date = new Date(), readText })`.
  - The rows come back in the check's order: OBJECTIVE.md, HANDOFF.md, docs/sessions/README.md, docs/sessions/YYYY-MM.md, AGENTS.md working region (when AGENTS.md is regular or a link), AGENTS.md, and CLAUDE.md (when AGENTS.md is regular and CLAUDE.md exists).
  - Each row adds one field the check ignores: `byHand`. It is true for an odd entry at or on the path to a seed, for a linked AGENTS.md, for a CLAUDE.md that is a folder, a link not to this AGENTS.md, or a file that is neither the import nor the placeholder, and for a month row whose this-month path is odd. It is false otherwise.
  - `readText(file)` returns text or null. checkProject passes `(f) => fs.readFileSync(f, "utf8")`, so its AGENTS.md read and its guarded CLAUDE.md read behave exactly as today. A null AGENTS.md text means undecided, and the region row is left out.
  - This is the move the 2026-10-22 rule requires a plan to name. A second copy of the rows in stale-copies.mjs would be the copy the rule forbids.
- **D2 · The adopted-project gate.** After the existing skips, `projectStaleLine` continues only when the root holds an `OBJECTIVE.md` entry of any kind (lstat), or its AGENTS.md is a regular, valid UTF-8 file within BOUNDED_READ_CAP whose `markerLines` finds at least one begin or end marker outside code fences. Otherwise it returns "".
  - Measured: this includes 10 of 10 adopted projects and excludes 8 of 8 others.
  - The objective arm alone covers all ten. The marker arm stays because today's line needs only markers: R-2623's fixtures, and any marked project without OBJECTIVE.md. Dropping it would silence a line that prints today.
  - The gate names the objective seed by the same name the row uses, not by a second literal.
- **D3 · One line, the check's ✗ rows only.** The line names each row with `ok === false` and no `note`, in row order, joined by ", ".
  - Labels are the check's labels. The working-region row is rendered as PROJECT_STALE_LABEL ("AGENTS.md working section"), so today's line stays byte-identical (measured on P1 to P5).
  - `!` rows are not named: the unmarked or malformed region (open question 1). So are the post-edit and trust rows.
- **D4 · The fix, and the by-hand case.**
  - No by-hand row: `${PREFIX} <labels> — tell the user; they fix it with <project>`.
  - All rows by hand: `${PREFIX} <labels> — tell the user; they fix it by hand as <check> says`.
  - Mixed: `${PREFIX} <labels> — tell the user; they fix <by-hand labels> by hand as <check> says, then the rest with <project>`.
  - `<project>` is today's span: `node "<pkgRoot>/bin/nana-setup.mjs" project "<root>"`, or `` `nana-setup project` in the project root ``. `<check>` is the same command plus ` --check`, with the same fallback.
  - The line never carries a row's detail. In particular it carries no symlink target or other text read from an entry.
- **D5 · The bound.** The line is one line. There are at most six named labels: four seeds, the working section and CLAUDE.md. A linked or missing AGENTS.md swaps the last two for one. Each label is a fixed string, so the line holds no project text outside the code spans. With two code spans at CODE_SPAN_CAP, the bound is about 1.4 KB. Measured: 892 and 1,282 characters on scratch fixtures, and 287 to 292 bytes on real projects with a scratch checkout path. No new cap is needed.
- **D6 · The skips that hold.** These keep their places before the gate: NANA_ROLE reviewer or worker (R-2626), no repository, a linked worktree or submodule (`.git` a file), a nana-pi checkout (`templates/_shared/working-under-nana-pi.md`), and the dismissal marker. Both seats share them because both call one function.
- **D7 · No child process, no TypeScript.** The producer path never calls checkProject or setupProject. checkProject spawns `git rev-parse` for a folder without `.git` and dynamically imports `config.ts` and `objective.ts`, while setupProject's dry run reads user config. Rows that need git, the knowledge refresh, config parsing or TypeScript stay out: git repo, `.pi/nana-pack.json`, post-edit commands and project trust. R-2627 already pins this, and its test gains a seed-only case.
- **D8 · Seats unchanged in code.** `bin/stale-copies.mjs` and `nana-rulings.ts` call `projectStaleLine` exactly as today. Only their headers and the READMEs change.

## Dropped

- A second session line. The owner's pick says one line.
- `isAdopted` (adoption.mjs:137) as the gate. Its handoff-store arm marks any repo where a pi session saved a compaction summary, and its temporary arm marks every OS temp root. Neither means the owner adopted the repo.
- "Any seed present" as the gate. Measured: it lets in one other project that keeps its own HANDOFF.md frontier.
- "AGENTS.md mentions nana" as the gate. Measured: five of the eight other projects mention it.
- Calling checkProject whole or setupProject's dry run from the producer (D7).
- Row details in the line: unbounded and possibly hostile text (D4, and the measured raw newline in the check).
- A roll-up across projects. Each project now reports itself at its own session start, and a roll-up would scan the home folder at every start.
- Renaming the prefix. It is sealed (R-2623, R-2625), and install-check's STALE_PREFIX scans rely on its distinct tag.

## Class

Hook, by AGENTS.md's letter. The output of a Claude Code hook producer (the SessionStart adoption hook's stale-copy producer) and of a pi extension (nana-rulings) changes. The hook entry, `hook-producer.mjs`, settings wiring and both callers' code stay byte-unchanged. No install, uninstall, doctor, gate, nana-land, pi-review, claude-review or review-round code changes. Doctor and install only import stale-copies.mjs.

Ladder: the roster's final reviewer from another model family; the land reviewer, or `seat-land.md` when the roster prints `land: seat`; the seat's wrong-code pairs; one independent check; the install check locally on macOS before nana-land; and the blocking Windows CI leg.

## Threat model

Honest variation in our own tools' output and in real project folders is in scope:
- every measured adopted shape: a drifted region, a missing sessions README, no markers, a prior-month log only;
- the measured shapes of other projects: an AGENTS.md mentioning nana, an own CLAUDE.md, an own HANDOFF.md;
- odd entries: a seed that is a directory or dangling link, a file where `docs` should be, a link target holding a newline or 600 characters;
- AGENTS.md linked, absent or a folder; CLAUDE.md as the import, the Windows placeholder, an own file, a link to AGENTS.md, or a dangling link;
- a session in a subfolder with its own AGENTS.md, a linked worktree, a dismissed root, a nana-pi checkout;
- CRLF, a BOM, a cp1252 byte, an over-cap or unreadable AGENTS.md;
- roots holding a space, a double quote, `$`, a backtick or `%`, and Windows drive and backslash paths;
- launcher children (reviewer, worker).

Deliberate forgery is out:
- a planted OBJECTIVE.md or marker line opts a foreign repository in;
- a planted dismissal marker silences it;
- empty seed files pass;
- a hand-written region passes as current.

Public repo: this plan and every text the lane writes name no owner, nothing about the owner's work and no other project. HANDOFF says "five projects on this machine".

## Must-meet rows (EARS, one shall each) and tests

All tests go in `packages/nana-setup/tests/project-stale.test.mjs`, reusing its harness. Expected lines are built from the config names, `codeSpan` and `pkgRoot`, never literals. Every child run uses CASE_LIMIT_MS. On win32 the symlink, mode and double-quote cases SKIP with their reason. Fixtures seed a prior-month log (`docs/sessions/2000-01.md`), so no case depends on today's month (R-395).

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2760 | IF a session's repository root holds no OBJECTIVE.md entry and no AGENTS.md that is a regular, valid UTF-8 file within the bounded read cap with a nana working-region marker line outside code fences, THEN the stale-copy producer and the nana-rulings extension shall emit no project-stale line, whatever project --check fails there. | `packages/nana-setup/tests/project-stale.test.mjs::R-2760: a repository with neither an objective file nor a nana working-region marker gets no project line in either seat, whatever its check fails` |
| R-2761 | WHEN the stale-copy producer runs with `--cwd` inside a git repository whose root holds OBJECTIVE.md or a nana working-region marker line and has nothing at OBJECTIVE.md, HANDOFF.md or docs/sessions/README.md, or no regular docs/sessions/YYYY-MM.md file and nothing at this month's log path, it shall print exactly one project-stale line naming each such row by its project --check label in the check's order, followed by the AGENTS.md working section when that also differs, and this checkout's `nana-setup.mjs project` command for the canonical root. | `packages/nana-setup/tests/project-stale.test.mjs::R-2761: an adopted project missing frontier seeds gets one project line naming each missing row in the check's order, in both seats` |
| R-2762 | WHEN project --check checks the root of a git repository that is not a linked worktree, a nana-pi checkout or dismissed, that holds OBJECTIVE.md or a nana working-region marker line, and whose AGENTS.md, when a regular file, is valid UTF-8 within the bounded read cap, the stale-copy producer shall name, for a session at that root, exactly the rows the check marks ✗ among OBJECTIVE.md, HANDOFF.md, docs/sessions/README.md, docs/sessions/YYYY-MM.md, AGENTS.md working region, AGENTS.md and CLAUDE.md, and print no line when it marks none of them ✗. | `packages/nana-setup/tests/project-stale.test.mjs::R-2762: the project line names exactly the file rows project --check marks ✗` |
| R-2763 | WHEN a row the project-stale line names is one that project --check's summary lists as a fix by hand, the line shall name it as fixed by hand with this checkout's `nana-setup.mjs project --check` command, name the `nana-setup.mjs project` command only when a row project would fix remains, and carry no text read from the entry the check found. | `packages/nana-setup/tests/project-stale.test.mjs::R-2763: rows the check leaves to the owner are named as fixes by hand with the check command, and the line carries nothing read from the entry` |
| R-2764 | IF the session folder is in no git repository, or its root is a linked worktree, a nana-pi checkout or holds the dismissal marker, THEN the stale-copy producer and the nana-rulings extension shall emit no project-stale line, even when the root holds OBJECTIVE.md and every other file row fails. | `packages/nana-setup/tests/project-stale.test.mjs::R-2764: no repository, a linked worktree, a nana-pi checkout and a dismissed root get no project line even with every seed missing` |
| R-2765 | IF a root that holds OBJECTIVE.md has an AGENTS.md that is a regular file but cannot be read, is not valid UTF-8 or is over the bounded read cap, THEN the project-stale line shall leave out the AGENTS.md working section and still name every other failing file row. | `packages/nana-setup/tests/project-stale.test.mjs::R-2765: an unreadable, invalid UTF-8 or over-cap AGENTS.md leaves the working section out and the other failing rows in` |

Retired with this lane, recorded in each row's cell:
- R-2624, "replaced by R-2762, R-2764 and R-2765". An adopted root with a linked, absent or folder-shaped AGENTS.md now gets a line naming those rows.
- R-2628, "replaced by R-2762". A matching region with a missing seed now prints a line.

R-2623, R-2625, R-2626 and R-2627 keep their text.

### What each test does, and why it is red on main

- **R-2760.** These fixtures opt out of the default seeds:
  - (a) an AGENTS.md mentioning nana plus an own CLAUDE.md (the measured shape of four other projects);
  - (b) (a) plus its own HANDOFF.md and no docs/sessions (the measured shape of one);
  - (c) (a) plus docs/sessions/README.md;
  - (d) a marker pair only inside a code fence;
  - (e) a marked region in an AGENTS.md over the cap;
  - (f) POSIX only: AGENTS.md linked to a marked file.

  In each case the producer child prints no prefix line and the extension leaves the section unset. There are two controls on (a). Adding an empty OBJECTIVE.md gives exactly one line in both seats. Adding one unfenced begin marker, with no OBJECTIVE.md, gives one line. Red on main: both controls print nothing, because main needs a differing region.
- **R-2761.** Start from a fully seeded root with a matching region: no line, and no section in either seat. Then:
  - Remove HANDOFF.md. The line equals the HANDOFF.md-only form, and the extension's section equals it byte for byte. A stacked `req: R-2625` marker sits on this test.
  - Use OBJECTIVE.md, no markers, and remove only docs/sessions/README.md (the measured four-project shape). The line names `docs/sessions/README.md`.
  - Remove every seed but OBJECTIVE.md and drift the region. The labels read `HANDOFF.md, docs/sessions/README.md, docs/sessions/YYYY-MM.md, AGENTS.md working section`.
  - Keep a prior-month log only. That row passes.
  - Run once through the real Claude hook with CLAUDE_PROJECT_DIR set to a subfolder that holds its own unmarked AGENTS.md.
  - Restore everything. A pi `reload` unsets the section.

  Red on main: every case prints nothing.
- **R-2762.** A fixture matrix, seeded unless the case removes a seed:
  - R-2628's region fixtures: matching LF, matching CRLF, no final newline, one byte differs, trailing spaces, a trailing tab, an extra blank line, no pair, a malformed pair, a fence-only pair;
  - R-2624's region fixtures: matching CRLF with a BOM, prose outside the markers differs;
  - each seed absent; each seed a directory; `docs` a file; a prior-month log only;
  - AGENTS.md absent, with and without an own CLAUDE.md;
  - CLAUDE.md as the import, the placeholder, an own file, or a link to AGENTS.md; POSIX only: a dangling CLAUDE.md link and a linked AGENTS.md.

  For each, `checkProject(root)`'s ✗ labels among the seven equal the labels parsed from `projectStaleLine(root)`, with the working section mapped back to the region label. A fixture with no ✗ row gives no line. For one fixture per row kind, the producer child runs at the root and at a subfolder and gives the same line. Red on main: every seed, navigation and CLAUDE.md fixture prints nothing while the check marks ✗.
- **R-2763.** The fixtures:
  - OBJECTIVE.md a directory;
  - HANDOFF.md a dangling link whose target holds a newline and 600 characters (POSIX; on win32 a directory);
  - `docs` a file;
  - CLAUDE.md an own file;
  - CLAUDE.md the placeholder, which project fixes, so it is not by hand;
  - a mixed root with one by-hand row and one absent seed.

  For each, the CLI `project <root> --check` runs under a temp HOME, and its summary's by-hand list is parsed as in project-odd-seeds.test.mjs. The line's by-hand labels must equal that list. The line must carry the `--check` span exactly when a row is by hand, and the `project` span exactly when a project-fixable row remains. It must hold no newline and no text of the link target. Its length must stay within the prefix, every label twice, two spans at CODE_SPAN_CAP and the fixed words. Red on main: no line.
- **R-2764.** An adopted root with OBJECTIVE.md, a matching region and every other seed missing, under four guards:
  - the dismissal marker (control: remove it);
  - `.git` a file (control: a folder);
  - `templates/_shared/working-under-nana-pi.md` present (control: remove it);
  - no repository (control: add `.git`, guarded by asserting `repoRootOf` is null, else SKIP).

  Both seats stay silent under each guard, and each control prints one line. Red on main: every control prints nothing.
- **R-2765.** OBJECTIVE.md present, HANDOFF.md absent, and a drifted marked AGENTS.md that is made unreadable by mode (POSIX), given one cp1252 byte in the region, or pushed over BOUNDED_READ_CAP. Each prints exactly one line, naming `HANDOFF.md` and not the working section. Control: a readable, valid drifted copy names `HANDOFF.md, AGENTS.md working section`. Red on main: the three cases print nothing, and the control names only the working section.

Existing tests changed:
- R-2623, R-2625, R-2626 and R-2627 have unseeded fixtures, which would now also name seeds. `repository()` therefore seeds OBJECTIVE.md, HANDOFF.md, docs/sessions/README.md and docs/sessions/2000-01.md by default, with an opt-out for R-2760. Their assertions are unchanged.
- R-2627's test gains one seed-only case: a root missing HANDOFF.md with the session in a subfolder. It must print the line with zero spawns, and again with strip-types off.
- The R-2624 and R-2628 tests go with their rows, and their fixtures move into R-2762, R-2764 and R-2765.
- No other test change is expected (inferred from reading). adoption-reader's hook roots hold only `.git`, so the gate keeps them out. The hook's default folder in the suite is a nana-pi checkout or a linked worktree, and both are skipped. install-check's fresh project is fully seeded. The builder confirms with the full suite.

## Tunables

No new tunable.
- Reused: PROJECT_STALE_PREFIX and PROJECT_STALE_SECTION (sealed, seal test unchanged), PROJECT_STALE_LABEL (chosen: keeps today's line byte-identical), PROJECT_STALE_ROOT_PHRASE, PROJECT_STALE_NO_PATH_CHARS and LAUNCHER_ROLES (stale-copies-config.mjs and stale-copies.mjs).
- BOUNDED_READ_CAP is reused (1 MiB, chosen in bounded-read.mjs). The largest adopted AGENTS.md measured here is 11,263 bytes.
- CODE_SPAN_CAP is reused (512, display.mjs).
- Contract values move unchanged: the seed names (R-327), the month-log pattern (R-395), CLAUDE_IMPORT (R-1311), PLACEHOLDER_RE (R-1312) and the marker strings. The `--check` flag is a contract value (R-336).
- The connective words stay inline sentence text, as in staleNotice (precedent).

## Wrong-code pairs (the seat runs each; it must turn its test red)

1. No gate: the line is keyed on failing rows alone (R-2760 a, b, c).
2. The gate counts any seed, so HANDOFF.md opts in (R-2760 b).
3. The gate drops the objective arm (R-2760 objective control; R-2761 four-project shape).
4. The gate drops the marker arm (R-2760 marker control).
5. The gate counts fenced markers, or markers read through a link or past the cap (R-2760 d, e, f).
6. `!` note rows are named (R-2762 no-pair, malformed and fence-only fixtures).
7. The month row requires this month's file (R-2761 and R-2762 prior-month cases).
8. A second row copy in stale-copies.mjs that drops the odd-folder walk (R-2762 `docs`-a-file case).
9. `byHand` ignored, so every row gets the project command (R-2763).
10. Row details or link targets copied into the line (R-2763 newline target).
11. The working section rendered with the check's label (R-2623 exact text).
12. Rows out of the check's order, for example the region first (R-2761 several-rows case).
13. One skip dropped: dismissal, `.git` file, nana-pi checkout or no repository (R-2764).
14. An unreadable AGENTS.md returns "" as today (R-2765).
15. An unreadable AGENTS.md counted as differs (R-2765).
16. checkProject or setupProject's dry run called on the session folder (R-2627 spawn count on the subfolder case; R-2761, because the async result is not a line).
17. The lift changes one check detail or order. The existing project tests turn red, and so does the seat's byte diff over the home repos.
18. The role guard moved below the gate or the rows (R-2626 with seeded fixtures).

## Windows notes

- The symlink, mode-000 and double-quote fixtures SKIP on win32, as R-2624 and R-2628 do today. The dangling-link-with-newline case becomes a directory case there.
- The CLAUDE.md placeholder is exactly the Windows checkout of a CLAUDE.md link. Writing its text covers it on every platform.
- Labels are the check's literal strings with `/`, so they are the same on every platform. Roots keep backslashes inside the double-quoted node command, as today.
- R-2628's test failed once on a Windows pull-request leg (run 39904357481, undiagnosed known bug). Its fixtures move into R-2762, so the flake may move with them. Keep CASE_LIMIT_MS. Run the matrix in process and limit children to one per row kind, so the Windows leg spawns fewer producers than R-2628 did.
- The Windows leg blocks. Push the draft PR before the final review (CI-runner gaps seen in three lanes on 2026-10-22).

## Known limits (the seat writes them to docs/known-bugs/FEAT-014.md before the final round)

- Rows that need user config, git or TypeScript are not named: `.pi/nana-pack.json` (one adopted project fails it today), post-edit commands, project trust and git repo. `project --check` still reports them.
- The unmarked or malformed region warning is not named. Five adopted projects here read `!`, and they still get no working-section updates (open question 1).
- The gate ignores a user-scope `objective.projectFile` rename. A renamed objective file with no markers gives no line. Inferred from project.mjs: the check's own objective row also reads only OBJECTIVE.md.
- A repository that ships its own OBJECTIVE.md or a nana marker line is treated as adopted.
- An unreadable, invalid UTF-8 or over-cap AGENTS.md leaves the working section out. The check still reports it.
- The line names rows, not their details. The check gives each by-hand step.
- `project --check` prints a symlink target raw, so a target with a newline breaks its row shape. This was found while measuring and is not fixed here.
- Two names remain for one thing: the check's "working region" and the line's "working section".
- After the land, five projects here show a new line at their next session. This is intended.
- Inherited from project-drift-notice: both seats decide at session start; linked worktrees, submodules, nana-pi checkouts and dismissed roots get no line; OS temp roots are not skipped; the named fix also seeds other files and starts a knowledge build; the no-path form resolves a bare `nana-setup` through PATH.

## Docs that change

- `packages/nana-setup/README.md`: :78, the stale-copy producer's paragraph, now names every failing file row of an adopted project with its fix. One sentence goes in the project section (:205). The test-table row for `tests/project-stale.test.mjs` (:514) changes.
- `packages/nana-pack/README.md`: :45, the nana-rulings row, and :686, the rulings-block bullet.
- `REQUIREMENTS.md`: six rows, plus R-2624 and R-2628 retired. CAP-04 gains `Read by: R-327 · prompt: packages/nana-setup/bin/stale-copies.mjs` and `Read by: R-327 · prompt: packages/nana-pack/extensions/nana-rulings.ts` (open question 4). Inferred: R-327 stays open, because its maker is manual.
- Module headers:
  - the new `lib/project-rows.mjs`;
  - `lib/project.mjs` (moved helpers, re-exports);
  - `lib/stale-copies.mjs` (purpose: compare installed copies and report an adopted session project's failing file rows);
  - `bin/stale-copies.mjs` (purpose);
  - `extensions/nana-rulings.ts` (wording).
- The builder regenerates `docs/requirements-tree.md` and `docs/code-map.md`.
- The seat writes the FEAT-014 known bugs, HANDOFF and the session note before the final round.
- Unchanged: the hook entry, `hook-producer.mjs`, settings wiring, `templates/_shared/` and the shared runtime table. The table lists hooks and extensions, and those are unchanged.

## Seat steps

1. Before building, capture `project --check` output at the lane base for every home repo in the table. A capture at c273b4de exists in <scratch>. After the build, re-run it and diff: it must be byte-identical.
2. The builder runs map impact on `lib/project.mjs`, `lib/stale-copies.mjs` and `lib/working-region.mjs` in the worktree, and works from the blast radius. It names the new module in the map.
3. Build with the larger builder (open question 5). The brief carries this Precedent section and passes brief-check. The builder reports the producer's median before and after, 11 runs, on the largest adopted project.
4. The seat runs the 18 pairs. Then come the land reviewer, one independent check, the install check on macOS before nana-land, and CI with the blocking Windows leg on the draft PR.
5. Carry `requirements-moved.mjs --root . --base main` output into the final brief and the land.
6. After the land, look at one real Claude session start in a seed-missing project, and at the pi section through the harness or one pi session. Record the line. HANDOFF lists the five projects as "five projects on this machine" with the fix.
7. Cross-lane: any open lane editing `project.mjs`, `stale-copies.mjs` or `nana-rulings.ts` merges main, whichever lands second.

## Open questions (one-word defaults)

1. Should the line also name the unmarked or malformed working-region warning, as a fix by hand? It would reach five adopted projects that get no working-section updates today. Against that, the fix needs judgment about where an older bare copy ends, and the check calls it a warning. Default: `no`.
2. Should the gate honour the user-scope `objective.projectFile` rename (R-150)? The check's objective row does not. Default: `no`.
3. Retire R-2624 and R-2628, or reword them in place? Retiring follows the requirements skill ("retire a row the change removes"). Default: `retire`. Seat's call.
4. Add the two `Read by: R-327 · prompt:` lines? Default: `yes`.
5. Builder size? The slate said small. This lane lifts the check's rows behind both seats' session start. Default: `larger`. Seat's call.