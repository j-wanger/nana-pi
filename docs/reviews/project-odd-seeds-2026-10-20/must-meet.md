# project-odd-seeds — must-meet

Feature: FEAT-014 · Create or adopt a project workspace
Class: ordinary. It changes only `nana-setup project` (lib/project.mjs and runProject in bin/nana-setup.mjs), not install, uninstall, doctor, a hook, an extension, the gate or the land and review tools. Ladder: one final reviewer. The lane touches packages/nana-setup/, so the seat runs install-check on macOS before land.
Build: simple. A Claude Sonnet subagent builds it.
Threat model: honest leftovers are in scope: a moved repo's broken link, a stray folder or file where a seed or its folder belongs, the project's own CLAUDE.md, odd characters in a name, and a dry run of a folder that does not exist yet. A link planted to make project write elsewhere is out of scope. So is a swap between lstat and write.

Feature: when something other than a regular file holds a seed path or a folder on its way, `project` reports that seed skipped by name and lists it as a fix by hand in its closing line. `project --check` names the entry, says to move or remove it, and names `nana-setup project` only for the ✗ lines a project dry run would change. A --name lands literally, and a dry run reports what the real run then does.

## What is wrong (main 72abe19a, temp clone, macOS, temp home, probed)
- A dangling AGENTS.md link: project prints `· AGENTS.md unchanged AGENTS.md already present`. The second run prints `nothing to do — everything was already in place.` --check prints `2 missing — run: nana-setup project <dir>`, and that command changes nothing.
- A directory or a dangling link at .pi/nana-pack.json reads `unchanged already present`.
- A dangling CLAUDE.md with no AGENTS.md reads `AGENTS.md unchanged CLAUDE.md already present`. --check prints `✗ AGENTS.md AGENTS.md (or a CLAUDE.md the project already had)` and never names the link.
- A file at `docs`, or a dangling link at `.pi`: project prints a raw ENOTDIR/ENOENT stack after seeding only some of the files.
- An AGENTS.md beside the project's own CLAUDE.md, or beside a dangling CLAUDE.md link: --check says `run nana-setup project to replace it` or `run: nana-setup project`. Project leaves both alone by design (R-329, R-1312).
- `--name 'Rel <date> …'`: OBJECTIVE.md and HANDOFF.md get today's date in place of the literal `<date>`, because fillSeed fills in two passes. AGENTS.md and the month log keep it literal.
- A dry run of a new folder prints `– AGENTS.md working region skipped AGENTS.md is not a regular file`, but the real run reports `unchanged`.

## Design
- One new classifier in project.mjs, not exported: `seedEntry(dir, rel)`. It lstats each part of rel and returns absent, file or odd. For the last part, odd's `found` is `a symlink -> T`, `a directory` or `not a regular file`. For a folder on the way it is `a file at <folder>` or `a symlink -> T at <folder>`. A live link to a folder on the way is followed, as today.
- Setup: stepSeeds (the month log included), stepAgents and stepPackConfig ask seedEntry first. stepAgents checks AGENTS.md, and CLAUDE.md unless AGENTS.md is a regular file. An odd entry gives `{status: skipped, byHand: true, detail: "<found> is there — left untouched, nothing written through it"}`. fsops.mjs is not touched.
- fillSeed makes one pass: `text.replace(/<name>|<date>/g, (t) => (t === "<name>" ? name : date))`.
- setupProject: when stepAgents created or would create the stub, the region row is `unchanged — comes with the new AGENTS.md stub`. setupProject does not call refreshWorkingRegion then.
- Setup closing line with byHand rows: `<k> changed` (`would change`, or `nothing changed`), then `; <j> left alone — fix by hand as each – line says: <labels>.` Exit codes do not change.
- checkProject: fileState uses seedEntry. Each ✗ detail that names an odd entry ends `; move or remove it by hand`. That covers each seed; this month's log when no month log exists; CLAUDE.md, named on the AGENTS.md line, when AGENTS.md is absent; a CLAUDE.md link that does not resolve to AGENTS.md; and a CLAUDE.md directory.
- The project's own CLAUDE.md beside AGENTS.md drops `run nana-setup project to replace it`. Its line says to fold the file into AGENTS.md and leave the line @AGENTS.md by hand. The R-1312 placeholder line keeps its project remedy. Every existing ✗ prefix stays byte-identical, so the R-337 and R-930 regexes still match.
- The --check summary uses doctor's mechanism: the README says install's dry run decides doctor's last line. runProject runs `setupProject(dir, layout, {dryRun: true})`. A ✗ row belongs to project when a dry-run row with its label is created or updated; this month's log row maps to `docs/sessions/YYYY-MM.md`.
  - every ✗ row belongs to project: today's line;
  - none does: `<n> missing — fix by hand as each ✗ line says: <labels>`;
  - mixed: `<n> missing — fix by hand as each ✗ line says: <labels>; then run: nana-setup project <dir> for the other <m>`.
  Each label appears once, in row order. A SetupError from the dry run (a dismissed folder) keeps today's line; any other throw propagates. checkProject carries no byHand flag, because the dry run is the one source of what project fixes.

## Must-meet (packages/nana-setup/tests/project-odd-seeds.test.mjs::title)
| # | Row | Title | Red today |
|---|---|---|---|
| M1 | R-385 (pin) | `R-385: a dangling link or a directory at each of the seven seed paths is reported skipped naming it, with nothing written through it` | Red: AGENTS.md and .pi read unchanged; CLAUDE.md gets no row |
| M2 | R-2420 | `R-2420: a file at docs and a dangling link at .pi are reported skipped by name and the other seeds still land` | Red: a stack trace, exit 1 |
| M3 | R-2421 | `R-2421: a second run over a dangling AGENTS.md link, a directory at HANDOFF.md and a file at docs names each seed path left alone as a fix by hand instead of everything already in place` | Red: a crash, and no by-hand line |
| M4 | R-2422 | `R-2422: --check names the entry at each seed path or on its folder path, CLAUDE.md included, and says to move or remove it` | Red: no line says to move or remove it |
| M5 | R-2423 | `R-2423: --check sends each ✗ that project leaves alone to a fix by hand, names nana-setup project only for the other ✗ lines and writes nothing` | Red: `run: nana-setup project` |
| M6 | R-335 (pin) | `R-335: a --name holding the date and name placeholders, $&, backticks and $(...) lands literally in every seeded file that carries the name, with nothing executed` | Red: `<date>` is filled in OBJECTIVE.md and HANDOFF.md |
| M7 | R-338 (pin) | `R-338: a dry run of a missing folder names the folder it would create, reports every row the real run then reports with the same status, and writes nothing` | Red: the region row is skipped in the dry run and unchanged in the real run |
| M8 | R-931 (pin) | `R-931: project and project --dry-run on a folder whose parent is missing both abort naming the parent and create nothing` | Green pin; W9 turns it red |

Fixtures:
- M1: two projects, one with dangling links and one with empty folders at all seven paths. The link targets stay absent, the entries stay untouched, and project exits 0.
- M3: the closing line names AGENTS.md, HANDOFF.md, docs/sessions/README.md and this month's log.
- M4: six paths × {dangling link, folder}; a file at docs with a dangling .pi; a dangling CLAUDE.md with no AGENTS.md; and a dangling CLAUDE.md and a CLAUDE.md folder beside a regular AGENTS.md.
- M5, three cases. The month log is still absent after each check.
  - the project's own CLAUDE.md beside AGENTS.md gives `1 missing — fix by hand as each ✗ line says: CLAUDE.md`, with no `nana-setup project`;
  - a folder at HANDOFF.md plus a missing month log gives `… HANDOFF.md; then run: nana-setup project <dir> for the other 1`;
  - a missing month log alone gives today's line.
- M6: reads the first lines of OBJECTIVE.md, HANDOFF.md, AGENTS.md and the month log, and checks a canary file was not created.
- M7: compares the mark, label and status of every row except `+ folder`.
Every case exists on darwin, linux and win32, so no check skips.

## Evidence (temp clone of main, macOS)
- A draft test fails 7 of 8 on main; M8 passes. A prototype of this design (+77/−32 lines in project.mjs and nana-setup.mjs) passes 8/8 in 2.3 s.
- On the prototype: project 124/124, project-working-region 28/28, entry-guidance 17/17, project-dismiss 14/14, doctor-quiet 7/7, trust 13/13, project-key 20/20. No existing check needed an edit.
- Wrong code on the prototype, each turning its check red:
  - W1 two-pass fillSeed → M6; W2 a string-form replace chain → M6
  - W3 no CLAUDE.md odd row → M1; W4 a link on the way not stat'ed → M2, M4
  - W5 always refresh the region → M7; W8 an odd month path ignored by --check → M4
  - W9 the parent check only when not a dry run → M8
  - Wa a dry-run `skipped` counted as project's → M5; Wb no month-label mapping → M5
  - Wc by-hand taken from the check's own odd entries → M5; Wd the mixed count uses n → M5
  - We the prediction run without dryRun → M5
- R-2420–R-2423 pass the EARS check (`ears: 0 rows off form`).

## Known limits
- project still exits 0 when it leaves a seed alone, and --check exits 1. The existing check `dangling symlink: exits 0` pins that.
- Setup prints no row for a CLAUDE.md beside a regular AGENTS.md. --check names it as a fix by hand.
- A live link on a seed's folder, such as `.pi -> shared/.pi`, is followed as today, so a missing starter is written there.
- A symlinked AGENTS.md gives two by-hand ✗ lines, one for the region and one for the navigation file.
- Telling the owner to fold their own CLAUDE.md into AGENTS.md is advice only. That CLAUDE.md stays ✗, as today.
- On a dismissed folder the dry run refuses, so --check keeps today's summary line.
- Inferred, not probed: the dry run opens AGENTS.md read-only, so an unwritable AGENTS.md whose region differs is still sent to project.
- R-328 stays untested. A test that can catch an extra `git init` needs a GIT_TEMPLATE_DIR sentinel.
- Proven on macOS only. The Windows CI leg runs the same file, with the same kind of symlink fixtures that project.test.mjs already uses there.