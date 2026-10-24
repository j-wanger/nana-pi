MUST: none
S1: R-2623's "adoption block whole" check fails under the planned default seeding. The plan says its assertions stay unchanged, and that is false (measured).
S2: The planned by-hand rule leaves out one case: AGENTS.md absent and CLAUDE.md odd. No R-2763 fixture covers it, and wrong code here sends the owner round a loop.
S3: Neither the gate read nor the row read is pinned to the producer's decoder (fatal, BOM kept). A BOM-stripping read breaks parity in both directions (measured), and the planned matrix has neither shape.
S4: Nothing pins the objective arm to lstat. An `existsSync` or `isFile` version passes every planned test, because the planned fixtures carry markers. Five of the ten adopted projects have no markers.
S5: No test covers the `--check` span's fallback for roots with special characters. R-2623's special roots only exercise the `project` span.
S6: R-2760's "valid UTF-8" clause has no fixture, so the row is wider than its test.
S7: Nothing pins what the check does with an unreadable AGENTS.md. D1's wording invites a lift that silently drops the region row from `project --check`, and neither the byte diff nor the listed project tests would notice.

# project-check-line: adversary attack (2026-10-23)

## What I did

All work was in <scratch>, from a `git archive` of main c273b4de. I wrote nothing in the repo, any worktree, any other repository, ~/.claude, ~/.pi or the global npm prefix. I made no model calls.

- **Faithful lift (scratch):** `lib/project-rows.mjs` as D1 describes. `checkProject` calls `projectFileRows` between its git row and its config rows. `projectStaleLine` implements D2–D4 after the existing skips, with readText as the producer's existing bounded, fatal, BOM-kept decode. To keep the check byte-identical I had to guard the CLAUDE.md read inside `projectFileRows` and leave the AGENTS.md read unguarded (see S7).
- **Check parity:** `project <root> --check` (read-only, temp HOME) ran from main and from the lift on 27 home repositories:
  - the planner's 19;
  - four more of the owner's repos with no AGENTS.md;
  - four third-party or nested clones.

  It also ran on 24 odd-entry fixtures.
- **Line comparison:** `projectStaleLine(dir, { env: {} })` ran from main and from the lift on the same repos, on subfolders, on the nana-pi checkout and a subfolder of it, on two linked worktrees, on a plan folder with no `.git`, and on ~.
- **Real hook entry:** the lift's `claude/hooks/nana-adoption.mjs` ran with CLAUDE_PROJECT_DIR set to real folders, under a temp HOME.
- **Fix check:** the fix ran on `git archive` copies of three projects (P1, P7, P10), each `git init`-ed in scratch.
- **Tests:** 14 related test files ran on main and on the lift: stale-copies, hooks-closed-output, hook-deadlines, hook-producers, rulings-install, rulings, adoption-reader, adoption-producer, display-surfaces, install-check (unit), project-working-region, entry-guidance, project-odd-seeds and project-dismiss. project-stale also ran on the lift with the planned default seeding.
- **Timing:** 20 producer-CLI runs per case, first dropped. Three real repos, main and lift run alternately, twice each.
- **Mutations:** BOM-stripping readText, plus the odd-entry, special-root and BOM probes.
- **No-write check:** afterwards, `find -newer` (depth 3) on all 26 home repos found no changed file, and main is still clean (measured).

## What holds (measured unless marked)

- **Gate inclusion:** I covered 28 git repos directly under ~ plus nine nested or third-party clones. The gate admits exactly the ten that hold OBJECTIVE.md. None of the nine nested or third-party clones holds OBJECTIVE.md or a marker line. All 62 linked worktrees under the seven `*-wt` folders have a `.git` file and are skipped. The two plan folders there have no repository, and ~ has none either.
- **Lines:** main prints 6 lines (P1–P5, plus one P1 subfolder). The lift prints 12 (the ten adopted projects, plus two subfolders). The lift's copies of main's 6 lines are byte-identical. Through the real hook entry, a P6 root and its subfolder each print one line naming `docs/sessions/README.md`. N4, the nana-pi checkout and a linked worktree print nothing.
- **Check byte parity:** the lift's check output matches main's on all 27 real repos and all 24 fixtures. The fixtures include FIFOs at seeds and at CLAUDE.md, a dangling `docs/sessions` link, a BOM CLAUDE.md and an unreadable AGENTS.md (same EACCES throw on both sides).
- **The fix fixes the row:** on all three archive copies, the line is present before `nana-setup project`, empty after, and the check shows only `!` rows. Side effects:
  - The P7 copy also gained this month's log.
  - The P10 copy also gained `.pi/nana-pack.json`, under a temp HOME with no user `postEdit.commands`.

  Both are inherited limits the plan already lists.
- **Tests:** all 14 related files pass on main and on the lift. project.test.mjs stops at the same environment import error on both: pi resolves from another npm prefix in this shell. Its 57 PASS lines before that point are identical on both.
- **project-stale with default seeding (lift):** R-2625, R-2626, R-2627 and the seal pass. R-2624 and R-2628 fail as designed, since both are retired. R-2623 fails (S1).
- **Cost:** producer-CLI medians were 50.9–57.7 ms on main and 52.1–58.2 ms on the lift. That is no detectable difference.
- **No hang paths found:** FIFOs at HANDOFF.md, CLAUDE.md and AGENTS.md are lstat-only, as are dangling links, and symlink loops are caught. Every special-character root, and a root containing a newline, gives one line using the no-path fallbacks. Line lengths were 395–457 characters with long scratch paths, and 1,197 with a 200-character folder name. That is well under the 10,000-character hook bound.
- **Roles (read):**
  - pi-review passes `REVIEWER_CHILD_ENV` to its pi child.
  - claude-review launches through review-ledger, which passes `REVIEWER_CHILD_ENV` to the Claude child.
  - pi-worker sets `NANA_ROLE=worker` for pi and Claude builders.

  So reviewer and builder seats stay silent.
- **IDs:** R-2760 to R-2765 are unused on main, in every worktree and on every local branch. Other planned lanes use up to R-2759.

## Findings

### S1 · R-2623's "adoption block whole" check breaks under default seeding (SHOULD, measured)

- **What I did:** seeded `repository()` with OBJECTIVE.md, HANDOFF.md, the sessions README and `docs/sessions/2000-01.md`, then ran project-stale on the lift.
- **What happened:** R-2623 fails on exactly one check, "adoption block whole". The adoption reader drops any root that `isAdopted` marks: OBJECTIVE.md present, or HANDOFF.md plus AGENTS.md plus `docs/sessions/`. So `[nana:adoption]` is no longer the first line.

  To keep the adoption block, that fixture must stay unadopted, with markers only. Then the line also names the missing seeds and no longer equals `expectedLine()`.
- **Change:** say in the plan that this one R-2623 assertion changes. Keep that fixture marker-only, and build its expected last line from the labels: `OBJECTIVE.md, HANDOFF.md, docs/sessions/README.md, docs/sessions/YYYY-MM.md, AGENTS.md working section` plus the `project` span. That also covers N8.

### S2 · The by-hand rule misses AGENTS.md absent with CLAUDE.md odd (SHOULD, measured)

- **What I did:** built three fixtures with OBJECTIVE.md and the other seeds present and no AGENTS.md:
  - CLAUDE.md is a directory (F1);
  - CLAUDE.md is a dangling link (F2);
  - CLAUDE.md is a live link to another file (F3).
- **What happened:** the check marks AGENTS.md ✗, and its summary lists AGENTS.md as by hand. `stepAgents` returns only the odd CLAUDE.md row, so `project` writes nothing here.

  D1's byHand list covers odd seeds, a linked AGENTS.md and the CLAUDE.md row. It says nothing about the AGENTS.md row in this shape. A builder who follows D1 literally sets byHand false there. The line then says "fix it with project", project does nothing, and the line comes back at every session. That is the loop the check's own comment exists to prevent.

  This is also exactly what `project` leaves behind in a repo whose CLAUDE.md was a symlink: it seeds OBJECTIVE.md, so the gate admits the repo, and it skips AGENTS.md. Measured shapes here: 0 of 10. The planner's prototype and my lift both get it right.
- **Change:**
  - Add "the AGENTS.md row when AGENTS.md is absent and CLAUDE.md is not a regular file" to D1's byHand list.
  - Add two R-2763 fixtures: AGENTS.md absent with CLAUDE.md a directory (all platforms), and with CLAUDE.md a live link to another file (POSIX).
  - Add pair 20.

### S3 · The decoder is not pinned, and a BOM-stripping read breaks parity (SHOULD, measured)

- **What I did:** made a mutant of the lift that reads with `new TextDecoder("utf-8", { fatal: true })`, which strips a BOM. That is nana-rulings' `buildBlock` decoder, a plausible copy source.
- **What happened:**
  - CLAUDE.md `"\uFEFF@AGENTS.md\n"`: the check marks CLAUDE.md ✗ by hand, and the mutant's line is silent.
  - AGENTS.md starting with `"\uFEFF"` directly followed by a drifted begin marker: the check gives `!` with no ✗, and the mutant names the working section.
  - The faithful lift (BOM kept) matches the check in both cases.

  The planned matrix has neither shape: its BOM fixture puts the BOM before a heading, and no CLAUDE.md fixture has a BOM.
- **Change:**
  - Make D1 and D2 name the decoder for both the gate read and readText: bounded, fatal, BOM kept (`ignoreBOM: true`), as today's producer does.
  - Add both fixtures to R-2762.
  - Add pair 19.

### S4 · The objective arm's lstat semantics are not pinned (SHOULD, measured and inferred)

- **What I did:** built two fixtures with an unmarked AGENTS.md: OBJECTIVE.md a dangling link (F10) and OBJECTIVE.md a directory (F21).
- **What happened:** the lift prints one line naming OBJECTIVE.md by hand in both cases, matching the check (measured). The planned fixtures with an odd OBJECTIVE.md (R-2763, "OBJECTIVE.md a directory") use the harness default. Inferred from reading the harness: that default carries a marked AGENTS.md, so the marker arm admits the root whatever the objective arm does.

  So `fs.existsSync(OBJECTIVE.md)` (which follows links, so a dangling link reads false) and `isFile()` (a directory reads false) both pass every planned test. Either one silences a broken objective file in unmarked adopted projects, which is five of the ten here.
- **Change:**
  - Add two R-2760 controls with an unmarked AGENTS.md and no other opt-in: OBJECTIVE.md a directory (all platforms), and OBJECTIVE.md a dangling link (POSIX). Each must give one line naming OBJECTIVE.md by hand.
  - Add pair 21.

### S5 · The `--check` span's no-path fallback is untested (SHOULD, measured and inferred)

- **What I did:** read the planned tests. R-2623's special roots (space, backtick, `$`, `%`, `"`) are seeded with a working section only, so they exercise only the `project` span. R-2763 has no special-character root.
- **What happened:** wrong code that applies the `PROJECT_STALE_NO_PATH_CHARS`/`printable` guard to the `project` span but not the `--check` span would pass every planned test (inferred). With a backtick root, that version breaks out of the code span; with `$` or `%`, the root expands when pasted into a shell. Measured on the lift: all five special roots and a root containing a newline give both fallbacks in one line.
- **Change:**
  - Add R-2763 fixtures with one by-hand row under a backtick root and under a `$` root, plus a `"` root on POSIX.
  - Assert `` `nana-setup project --check` in the project root `` and `` `nana-setup project` in the project root ``.
  - Add pair 22.

### S6 · R-2760's "valid UTF-8" clause has no fixture (SHOULD, inferred)

- **What I did:** compared the row text with fixtures (a)–(f).
- **What happened:** none of them is a marked but invalid-UTF-8 AGENTS.md. A gate that decodes non-fatally, as the check does, would admit such a root without OBJECTIVE.md and still pass.
- **Change:**
  - Add fixture (g): a marked AGENTS.md with one cp1252 byte and no OBJECTIVE.md, which must give no line in either seat. Otherwise drop the clause from the row.
  - Add pair 23.

### S7 · The check's handling of an unreadable AGENTS.md is unpinned (SHOULD, measured and inferred)

- **What I did:** ran `project --check` on a mode-000 AGENTS.md from main and from the lift.
- **What happened:** both throw EACCES, byte-identically. My lift keeps that only because the AGENTS.md read in `projectFileRows` is unguarded while the CLAUDE.md read is guarded.

  D1 says "readText returns text or null; a null AGENTS.md text means undecided, and the region row is left out". Together with "its guarded CLAUDE.md read", that invites a symmetric try/catch around both reads. The check would then silently drop the region row, report the AGENTS.md row ✓, and could print "all good". The adopt skills' closing step reads that check (R-1670).

  Neither the home-repo byte diff nor the four project test files cover this case (inferred from reading them: only the producer-side R-2624 case is mode 000).
- **Change:**
  - State in D1 that `projectFileRows` guards only the CLAUDE.md read and lets the AGENTS.md read error reach `checkProject`.
  - Add one POSIX assertion that `checkProject` on a mode-000 AGENTS.md still rejects as today, or emits a deliberately chosen ✗ row if the seat prefers.
  - Add pair 25.

## Notes

- **N1 · Dropped rationale undercounts (measured).** "Any seed present" would admit three other repos here, not one. Two more of the owner's repos hold a HANDOFF.md and no AGENTS.md, which put them outside the planner's 19. This strengthens the choice.
- **N2 · Wrong claim about the install check (measured).** The install check's project folder is `git init` only (install-check.mjs:335–353), not "fully seeded". The plan's conclusion still holds, because the gate keeps that folder out. But the install check rejects only STALE_PREFIX and STALE_UNAVAILABLE lines, so it would not catch a missing gate (pair 1). R-2760 is the only guard.
- **N3 · Fresh scaffolds and adoptions also get the line (inferred).** The copier templates ship `docs/sessions/README.md` but no month log. The adopt skills already say "a fresh adoption reads ✗ for the month log until `nana-setup project <dir>` runs". So every new scaffold or adoption that has not run `project` prints a line naming `docs/sessions/YYYY-MM.md` at its first session. Copier is not installed here, so I could not render one. This fits the letter of the owner's pick, but "five projects here show a new line" undercounts. Add a Known-limits and HANDOFF line.
- **N4 · Invalid UTF-8 inside the region (F8, measured).** The check marks the region ✗ and lists it by hand; the line is silent. R-2762's precondition and R-2765 cover this deliberately. Option: decode non-fatally for the verdict and mark byHand when the fatal decode fails. That gives full parity except over the cap.
- **N5 · Read-only AGENTS.md with a drifted region (F7).** The check and the line both say `project` fixes it (measured). Inferred from code: the real run opens the file read-write and skips it as "not writable — left alone". This is inherited from today's line. Add a Known-limits line.
- **N6 · Month by-hand derivation is barely tested.** Only the `docs`-a-file fixture reaches the odd-month path, and there the README is odd too. Wrong code that derives the month's byHand from the README's state passes. Add a fixture where only this month's path is a directory: compute the month at run time and skip if it changes mid-case. Add pair 24.
- **N7 · Row wording.**
  - R-2761, R-2763 and R-2765 carry no skip qualifiers, so as written they conflict with R-2764 and R-2626. R-2623 and R-2624 already follow the same pattern, so this is precedent and optional.
  - R-2762's "WHEN project --check checks…" trigger is copied from R-2628, but the producer acts at session start, so "WHERE" fits better.
- **N8 · Weak marker control.** R-2760's marker control asserts only a line count. Make it assert the exact line: it is the planned case where OBJECTIVE.md itself is named through the marker arm.
- **N9 · Parse filter.** R-2763 should filter the check summary's by-hand list to the seven file rows, because `.pi/nana-pack.json` can also be by hand.
- **N10 · Possible stall (inferred, not measured).** The producer path now calls realpath on a CLAUDE.md symlink and stat on intermediate symlinks. A link into an automount could stall until the 2,500 ms producer limit, after which the hook prints STALE-COPY CHECK UNAVAILABLE. The by-hand check already does the same. Add a Known-limits line.
- **N11 · No per-row opt-out.** A project that deliberately omits a seed gets the line at every session. Only the dismissal marker silences it, and that also drops the repo from adoption. The five missing READMEs here look historical (inferred: each project gained OBJECTIVE.md or its sessions folder on 2026-09-18, the day the README seed landed). Add a Known-limits line.
- **N12 · Pair 18 cannot turn red.** Moving the role guard below the gate does not change any output. Make the pair "role guard removed", which R-2626 catches.

## Wrong implementations and the test that catches each

The plan's pairs 1–16 are caught as the plan states: R-2760 a–f and the two controls, R-2762's note and prior-month fixtures, the `docs`-a-file fixture, R-2763, R-2623's exact text, R-2761's several-rows case, R-2764, R-2765 and R-2627. Pair 17 is caught only partially, because it misses S7. Pair 18 is reworded per N12.

| # | Wrong implementation | Caught by |
|---|---|---|
| 19 | readText or gate read strips a BOM | Nothing planned. Add S3's two R-2762 fixtures. |
| 20 | byHand false for AGENTS.md absent with CLAUDE.md odd | Nothing planned. Add S2's R-2763 fixtures. |
| 21 | Objective arm uses `existsSync` or `isFile` | Nothing planned. Add S4's unmarked R-2760 controls. |
| 22 | Special-character guard skipped on the `--check` span | Nothing planned. Add S5's R-2763 roots. |
| 23 | Gate decodes AGENTS.md non-fatally | Nothing planned. Add S6's fixture (g). |
| 24 | Month byHand taken from the README's or `docs` state | Nothing planned. Add N6's this-month-directory fixture. |
| 25 | `projectFileRows` swallows the check's AGENTS.md read error | Nothing planned; the home-repo byte diff passes. Add S7's assertion. |

Scratch artifacts are under `<scratch>/project-check-line/adv/`: `main/`, `lift/`, `checks-main/`, `checks-lift/`, `probe.mjs`, `bomprobe.mjs`, `oddroot.mjs`, `lines.mjs`, `time.mjs`, `runset.sh` and `fixcopies/`.