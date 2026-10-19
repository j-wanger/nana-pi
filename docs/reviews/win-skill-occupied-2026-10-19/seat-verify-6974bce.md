# Seat checks — win-skill-occupied build 1, tip 6974bce (2026-10-19)

- Build: one pass by Claude Sonnet 5 (`build-brief-1.md`, product commit 04c14e8). After it: 0c7fab8 moved four
  `req:` markers directly above their checks (tests only); fc674a4 merged main b8ace0b; 6974bce recomputed
  `lib/skill-copy-history.json` (`build-brief-3.md`).
- CI on draft pull request #30, run 39256091122 (the runner tested 5599ad2, the merge of 6974bce into b8ace0b):
  - Windows `152 files: 131 PASS, 20 FAIL, 1 SKIP` (`ci-windows-run-3.log`). All 20 failing files are main's: 16 desk and
    4 bench. `skills-and-standards.test.mjs  55 pass, 4 skip`, and the lane's seven checks pass natively:
    `PASS win32 occupied skill dir: install exits 1 with ✗ naming the directory and the fix`,
    `PASS win32 occupied skill dir: the owner's folder is byte-identical after install`,
    `PASS win32 occupied skill dir: --dry-run exits 1 and leaves the folder unchanged`,
    `PASS win32 occupied skill dir: doctor reads ✗ — a directory instead of nana-setup's copy — with the move fix`,
    `PASS win32 pre-marker copy: install exits 0 and refreshes a shipped older SKILL.md, LF and CRLF`,
    `PASS win32 fresh mirror: install writes the .nana-setup-copy marker`, `PASS win32: install refreshes the stale copy`.
    Section 4's POSIX refusal prints one SKIP there (`SKIP win32 occupied skill dir (the POSIX refusal expects a
    symlink fix; section 4b runs the win32 refusal natively)`), so the file's skips go from 3 to 4.
  - macOS `152 files: 150 PASS, 0 FAIL, 2 SKIP`.
  - Ubuntu `152 files: 148 PASS, 2 FAIL, 2 SKIP`: lane-write-guard (8 pass, 1 fail; fixed on main by linux-lane-guard
    after b8ace0b) and path-spelling (9 pass, 2 fail; main's Linux regression, which the linux-path-spelling lane fixes).
    Neither file is in the lane's change.
  - install-check passed on macOS and on Windows.
  - The earlier run 39252114961 (0c7fab8 merged into main 73f39d5) passed the same seven Windows checks, with the file at
    55 pass, 4 skip. Its macOS leg failed one check, R-291's leaf total of 1,222 on that merge; the lane's merge of main
    at fc674a4 re-summed it, and run 39256091122's macOS leg is green.
- The seat's wrong-code pairs (`seat-mutate.mjs`, `seat-mutate-output-04c14e8.txt`, committed at 7d47110): 10 of 12
  red on 04c14e8 (7 on exactly their named titles, 3 with an extra unnamed red), 2 declared survivors:
  - M5, the marker's status not folded into the step's: no must-meet check covers it. Under that mutant, a run that only
    adds the marker prints "unchanged" instead of "updated". Recorded as a residual.
  - M8, `ownSkillCopy` without its byte-equal test: equivalent at this tip, since the pack ships only SKILL.md and its
    current hash is in the history list.
  - The pairs still hold at 6974bce. `lib/steps.mjs` and `lib/doctor.mjs` are byte-identical from 04c14e8 to 6974bce;
    the test file changed only where 0c7fab8 moved four markers, and every check title is unchanged. The new history
    key is the current pack's SKILL.md (19f44f1), so M8 stays equivalent.
- History list at 6974bce: `git log` names 13 versions of the requirements SKILL.md (19f44f1 back to ec7c17c); all 13
  LF hashes are keys, none missing. No commit on main since b8ace0b (main at 0f2e0ca) and none on the eight in-flight
  branches changes that file. A later merge of main that changes it needs this check again before the land.
- Independent check (`independent-check-6974bce.md`): HOLDS, no MUST. It ran on 04c14e8; the code it checks is unchanged
  at 6974bce. Ten probes, four wrong-code runs and the guard files, each recorded with its output. Its findings:
  - List completeness if tree-briefs landed first: it did (in b8ace0b). 6974bce recomputed the list and added one key,
    19f44f1, with the 12 earlier keys unchanged. Settled.
  - `ownSkillCopy`'s comment says ownership is decided with `lstat` alone, but its byte-equal test reads through a linked
    file. It only reads, and probe 10 shows nothing written through the link. Unchanged at 6974bce; recorded as a
    residual.
  - Windows skips 3 to 4: a note, not a defect; CI shows 55 pass, 4 skip.
  - The checker's 5 FAILs in its temp home (doctor reads `✗ pi pi-subagents not installed`) are the same at b3f6ec2;
    the pairs' baseline (80 PASS, 0 FAIL) and all three CI legs pass the file.
- Rows R-1420 to R-1426 read `implemented`. `node scripts/requirements-trace.mjs`: 1,233 total, 0 rows off form.
  `npm run map:check`: 0 problems.
- Not in this record: the locked full suite on 6974bce, and `node packages/nana-setup/bin/install-check.mjs` on macOS
  before `nana-land` (install lane).
