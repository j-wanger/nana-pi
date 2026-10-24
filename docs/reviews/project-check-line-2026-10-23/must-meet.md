# project-check-line · must-meet of record (seat, 2026-10-23)

Feature: FEAT-014 · Create or adopt a project workspace

Written by the seat from the planner's draft (`plan-draft.md`) and one adversary pass (`plan-attack.md`), both kept in this folder. Plans get no review round. Where this file and the draft differ, this file holds. The draft names projects P1 to P10 and N1 to N8; it names no project of the owner's.

The owner's decision, 2026-10-23, from the seat's artifact slate: "Project check line (Recommended)": in an adopted project whose seed or working-region check fails, session start prints one project line on both runtimes, naming every failing row that `nana-setup project --check` decides from files alone, with its fix.

Spend line: the current priority (since 2026-10-23), appetite clause 3: other projects' checks reported (the seed half of the 2026-10-22 audit's gap 8).

Stakes: medium blast, reversible. Every seat start in an adopted project runs the new code (ten projects here). The riskier part is the lift: `project --check` runs the moved row code, and the adopt skills' closing step reads that check. The guard is the existing project tests, S7's assertion and the seat's byte diff of `project --check` over the home repositories.

## Seat decisions on the attack

- **S1 adopted.** R-2623's fixture stays marker-only (unadopted, so the adoption block stays whole), and its one "last line" assertion builds the expected line from the labels: the four seeds, then the working section, then the `project` span. R-2623's text is unchanged.
- **S2 adopted.** D1's by-hand list adds the AGENTS.md row when AGENTS.md is absent and CLAUDE.md is not a regular file. R-2763 gains two fixtures: CLAUDE.md a directory (all platforms) and a live link to another file (POSIX).
- **S3 adopted.** Both the gate read and the rows' `readText` on the producer path use the producer's existing decode: bounded, fatal, BOM kept. R-2762 gains two fixtures: a CLAUDE.md of a BOM then the import line (the check marks it ✗ by hand), and an AGENTS.md whose BOM sits directly before a drifted begin marker (the check gives `!`, so no line).
- **S4 adopted.** The objective arm tests an entry by lstat (any kind). R-2760 gains two controls with an unmarked AGENTS.md and no other opt-in: OBJECTIVE.md a directory (all platforms) and a dangling link (POSIX); each gives one line naming OBJECTIVE.md by hand.
- **S5 adopted.** The no-path fallback applies to both spans. R-2763 gains a backtick root and a `$` root (all platforms) and a `"` root (POSIX), each with one by-hand row, asserting both fallback spans.
- **S6 adopted.** R-2760 gains fixture (g): a marked AGENTS.md holding one invalid UTF-8 byte and no OBJECTIVE.md gives no line in either seat.
- **S7 adopted.** `projectFileRows` guards only the CLAUDE.md read; an AGENTS.md read error reaches `checkProject` as today. R-2762's test asserts that `project --check` on a mode-000 AGENTS.md still rejects as it does on main (POSIX).
- **N6 adopted.** R-2763 gains a fixture where only this month's log path is a directory (computed at run time; the case skips if the month changes mid-case).
- **N8 adopted** (the marker control asserts the exact line). **N9 adopted** (R-2763 filters the check summary's by-hand list to the seven file rows). **N12 adopted** (pair 18 becomes "role guard removed").
- **N3, N4, N5, N10, N11** become known limits; N3 also gets a HANDOFF line at notes. **N1, N2** correct the draft's text and change no design.
- **Open questions, decided by the seat:** 1 `no` (the unmarked-region warning stays unnamed); 2 `no` (no objective-file rename); 3 `retire` R-2624 and R-2628 with named successors; 4 `yes` (two `Read by: R-327 · prompt:` lines for the stale-copy producer and the nana-rulings extension); 5 `larger` builder.
- **Class: hook.** The final reviewer (Opus), the land reviewer (astra), the seat's pairs, one independent check, the local macOS install check before the land, and the blocking Windows CI leg.

## Must-meet rows

The draft's six rows hold verbatim, with their test titles:

| ID | Test file::title |
|---|---|
| R-2760 | `packages/nana-setup/tests/project-stale.test.mjs::R-2760: a repository with neither an objective file nor a nana working-region marker gets no project line in either seat, whatever its check fails` |
| R-2761 | `packages/nana-setup/tests/project-stale.test.mjs::R-2761: an adopted project missing frontier seeds gets one project line naming each missing row in the check's order, in both seats` |
| R-2762 | `packages/nana-setup/tests/project-stale.test.mjs::R-2762: the project line names exactly the file rows project --check marks ✗` |
| R-2763 | `packages/nana-setup/tests/project-stale.test.mjs::R-2763: rows the check leaves to the owner are named as fixes by hand with the check command, and the line carries nothing read from the entry` |
| R-2764 | `packages/nana-setup/tests/project-stale.test.mjs::R-2764: no repository, a linked worktree, a nana-pi checkout and a dismissed root get no project line even with every seed missing` |
| R-2765 | `packages/nana-setup/tests/project-stale.test.mjs::R-2765: an unreadable, invalid UTF-8 or over-cap AGENTS.md leaves the working section out and the other failing rows in` |

R-2760, R-2761, R-2763, R-2764 and R-2765 go in SUB-016 beside R-2623 to R-2627; R-2762 in SUB-021 in R-2628's place. Each goes in `untested`, then `implemented` when its check passes. R-2624 retires "replaced by R-2762, R-2764 and R-2765"; R-2628 retires "replaced by R-2762". R-2623, R-2625, R-2626 and R-2627 keep their text. R-2766 to R-2769 stay free.

### What each test does

The draft's "What each test does" holds, with the fixtures the decisions above add: R-2760 gains (g) and the two unmarked objective controls, and its marker control asserts the exact line; R-2762 gains the two BOM fixtures and the mode-000 check assertion; R-2763 gains the two AGENTS.md-absent fixtures, the three special roots, the this-month-directory fixture and the filtered summary parse. Expected lines are built from the config names, `codeSpan` and `pkgRoot`, never literals.

## Tunables

None new; as the draft's list.

## Wrong-code pairs

The draft's pairs 1 to 17, pair 18 reworded as "the role guard removed" (R-2626), and the attack's 19 to 25, each caught by the fixture the decisions above add.

## Known limits (the seat writes them before the final round)

The draft's list, with: a fresh scaffold or adoption that has not run `nana-setup project` gets a line naming the month log at its first session (N3); invalid UTF-8 inside the working region makes the check mark it ✗ by hand while the line stays silent (N4); a read-only AGENTS.md with a drifted region is named as a `project` fix that `project` skips (N5); a CLAUDE.md link into a slow mount can stall the producer to its limit (N10); a project that omits a seed on purpose gets the line at every session, and only the dismissal marker silences it (N11); `project --check` prints a symlink target raw, so a target holding a newline breaks its one-row-per-line shape (measured by the planner).

## Docs and lines that change

As the draft's list, with the two R-327 prompt reader lines and the retired rows' cells.

## Seat steps

1. Cut `feat/project-check-line` from main; commit this file, the draft, the attack, seat titles and build brief 1; brief-check; draft PR.
2. Build 1 with the larger builder.
3. Seat checks: escape check; seat titles; pairs 1 to 25; the project-stale, project, project-odd-seeds, project-working-region, stale-copies, rulings and hook test files each alone; the byte diff of `project --check` from the main checkout and from the tip, run on every git repository directly under ~/ that has an AGENTS.md or OBJECTIVE.md at the same moment (read-only, temp HOME; expected: identical); the session line on each adopted project, driven from a scratch copy (expected: P1 to P5 byte-identical to main, P6 to P10 one line naming the sessions README, others silent); tree check; map, readme, trace; `requirements-moved --base main`.
4. Independent check; the local macOS install check; notes; CI with the Windows leg; Opus and astra on the exact tip; land.
