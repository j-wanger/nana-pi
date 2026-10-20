# win-silent-skips: must-meet

Feature: FEAT-031 · Run checks reliably and without contaminating work
Sentence: On Windows, each of eight test files prints its own SKIP line, naming the check and a reason, for every check it runs only off Windows. Today 20 of those 21 checks print nothing, and the 21st prints a SKIP line that does not name it.
Class: ordinary. The lane changes test files and the ledger only, with no install, hook, gate or review-tool code. It edits a file under packages/nana-setup/, so the local install check still runs before the land.
Threat model: honest variation in our tools' output, platforms and configs is in scope. Deliberate forgery, such as a SKIP line that lies about its reason, is out.

## Evidence today
CI run 39344916736, pass+skip per file on Windows and on macOS.

| file | Windows | macOS | guarded checks (guard lines at d4423eff) |
|---|---|---|---|
| requirements-regroup | 59+0 | 63+0 | 4 (246, 272, 409, 424) |
| requirements-lift | 63+0 | 65+0 | 2 (200, 960) |
| bounded-read | 2+0 | 4+0 | 2 (29, 41) |
| adoption-producer | 61+0 | 62+0 | 1 (164) |
| post-edit-hardening | 17+0 | 22+1 | 6 (201 b, 388 f); 270 is a Windows-only counterpart |
| adoption-reader | 42+1 | 44+0 | 1 (140); its one SKIP is the mode-000 case |
| nana-setup win32-degrade | 92+0 | 93+0 | 1 (365) |
| test-locked | 13+1 | 17+0 | 4 (178: three signal checks, silent; 199: one check whose SKIP does not name it) |

The adversary added test-locked. Comparing every file's Windows and macOS totals in that run showed its gap of 3. The plan had listed it as a group-SKIP file.

## Design
- Each file keeps its guard lines and gains the branch Windows takes, with one literal `console.log("SKIP <exact check title> — <reason>")` per guarded check. test-locked's existing SKIP at 199 is reworded to that shape.
- A new test, `packages/nana-pack/tests/windows-skip-lines.test.mjs`, reads the eight files as text:
  - A guard is a line `if (process.platform !== "win32"…) {`, or `if (NAME…) {` where the file binds `const NAME = process.platform !== "win32"`. The inverted `if (process.platform === "win32") {` or `if (!NAME) {` counts, with its branches swapped.
  - The guarded body ends at the first later line that starts with the guard's own indentation and `}`. The Windows branch is the `} else …` on that line: the rest of the line, or a block to its own `}` at that indentation.
  - A Windows branch that calls `check(` is a counterpart and is exempt.
  - Titles are the first literal argument of each `check(` in the guarded body. For a template title, take the text before the first `${`, trimmed of trailing spaces and `(`.
  - Each title needs its own SKIP literal in the Windows branch whose text starts with `SKIP <title> — ` and has a non-space reason after it. One literal serves one title.
  - A file with no guarded check fails, and the message says to retire its row if its guards are gone.
- The target list and the ` — ` separator are named constants with provenance. No product code changes.

## Must-meet
Each test is `packages/nana-pack/tests/windows-skip-lines.test.mjs::<file>: each check it runs only off Windows has its own SKIP line naming it and a reason on the Windows branch`, with `<file>` the file name in its row.

| Row | Requirement | Red today |
|---|---|---|
| R-1950 | Each check that requirements-regroup.test.mjs runs only off Windows shall have its own SKIP line, naming the check and a reason, on the branch the file takes on Windows. | 4 of 4 |
| R-1951 | Each check that requirements-lift.test.mjs runs only off Windows shall have its own SKIP line, naming the check and a reason, on the branch the file takes on Windows. | 2 of 2 |
| R-1952 | Each check that bounded-read.test.mjs runs only off Windows shall have its own SKIP line, naming the check and a reason, on the branch the file takes on Windows. | 2 of 2 |
| R-1953 | Each check that adoption-producer.test.mjs runs only off Windows shall have its own SKIP line, naming the check and a reason, on the branch the file takes on Windows. | 1 of 1 |
| R-1954 | Each check that post-edit-hardening.test.mjs runs only off Windows shall have its own SKIP line, naming the check and a reason, on the branch the file takes on Windows. | 6 of 6 |
| R-1955 | Each check that adoption-reader.test.mjs runs only off Windows shall have its own SKIP line, naming the check and a reason, on the branch the file takes on Windows. | 1 of 1 |
| R-1956 | Each check that the setup package's win32-degrade.test.mjs runs only off Windows shall have its own SKIP line, naming the check and a reason, on the branch the file takes on Windows. | 1 of 1 |
| R-1957 | Each check that test-locked.test.mjs runs only off Windows shall have its own SKIP line, naming the check and a reason, on the branch the file takes on Windows. | 4 of 4 |

How red-today is known: a scanner prototype run on a clone of main d4423eff reports all eight files red, with 21 of 21 guarded checks unmatched. A prototype fix that adds 24 lines and changes 12 turns all eight green. Every edited file passes `node --check`. macOS runs of bounded-read, adoption-producer and test-locked keep 4, 62 and 17 passes with no SKIP.

Each of these wrong versions turned its file red under the prototype: one (b) SKIP deleted; the three (b) SKIPs merged into one line naming all three titles; bounded-read's first SKIP moved into the guarded body; a SKIP without its title; a SKIP with no reason, or with the dash and nothing after; regroup's first guard inverted in two-line form with no SKIP; adoption-producer's guard respelled `os.platform()`; test-locked's 199 SKIP restored to its old wording.

Simulated Windows (a preload sets process.platform to win32; HOME, TEMP and TMP are temp folders): after the fix, regroup 59+4, lift 63+2, bounded-read 2+2, adoption-producer 61+1 and test-locked 13+4. Each matches macOS. post-edit-hardening prints its six SKIP lines, but its Windows kill checks cannot run under the simulation.

## Seat check after the build
On the CI Windows leg, each file's pass+skip equals its macOS pass+skip: regroup 63, lift 65, bounded-read 4, adoption-producer 62, post-edit-hardening 23, adoption-reader 44, win32-degrade 93, test-locked 17. The new test shows 8 passes on all three legs.

## Known limits
- The test pins the source's shape. Only the CI Windows leg shows that the lines print.
- Two guard respellings survive. One is an inverted guard written `{} else {` on one line. The other is a guard respelled another way, such as `os.platform()`, in a file that keeps another recognized guard. Either drops out of the scan.
- install.test.mjs's guard at 307 drops two checks silently on Windows. win-claude-skills edits that file now, so this lane leaves it to a HANDOFF line.
- Files with one SKIP line per group stay short of macOS counts. They include agent-dir-hostile, agent-dir-parity, handoff-staleness, handoff-store, notify-fallback, objective-golden, pi-install, post-edit-file-queue, agent-dir-consumers, desk-service, doctor-detail, doctor-runtime, skills-and-standards and uninstall.
- On a POSIX host where mkfifo fails, regroup and bounded-read still drop their FIFO checks silently.
- The scanner reads only the eight files and does not read a title written on the line after `check(`.