Feature: FEAT-015 · Diagnose the active environment. Lane linked-folder-advice. Class: install. Builder: pi-worker (larger lane). Build session 1: the whole lane.

Work in the lane worktree on feat/linked-folder-advice. The spec is `docs/reviews/linked-folder-advice-2026-10-23/must-meet.md`: read it whole before designing. It holds over `plan-draft.md` where they differ; read the draft for the measured cases M1 to M17, the design parts 1 and 2, the test designs and the pairs, and `plan-attack.md` for the findings the must-meet adopts. The planner's prototype is evidence, not the design. Do not edit HANDOFF, the session archive, `docs/known-bugs/`, or any file in this review folder.

What the lane does, in one sentence: under a linked Claude or skills folder, doctor's legacy enforcement-flag and scaffolder rows name the linked folder and each present path to move out of the way by hand instead of telling the user to run install, and install refuses before any write, naming the link, when the Claude folder or its rules, shared-memory or (off win32) hooks folder is a link whose target cannot be reached, so doctor's last line names that refusal instead of an install that crashes.

Precedent:
- docs/reviews/linked-claude-folder-remedy-2026-10-20/must-meet.md — the same bug's first lane: the condition, the folder named in a code span, the move-aside proof step, junctions on win32 in tests, and its known limits.
- packages/nana-setup/lib/doctor.mjs — the linked skill rows (`linkedFolder`, `codeSpan(linkedFolder) ?? linkedFolder`) for the legacy rows' condition and text, and the legacy rows themselves.
- packages/nana-setup/lib/steps.mjs — `directoryAncestorsAreSafe` and `linkedSkillFolder` (reuse, do not copy; follow `linkedSkillFolder`'s candidate loop for the guard's loop), the retired step's guard (the question doctor asks), `readClaudeSettings`' preflight `SetupError` ending `Nothing was changed.` (the refusal's shape), and `install()`'s preflight position.
- packages/nana-setup/bin/nana-setup.mjs — `refuseCwdRelativeClaudeHome` (a refusal that names the folder and the step), and doctor's dry run and refusal form, unchanged.
- packages/nana-setup/lib/stale-copies.mjs — `staleNotice`, the wording "move `<path>` out of the way".
- packages/nana-setup/tests/linked-claude-folder.test.mjs — where the new checks go: `fixtureHome`, `freshCwd`, `makeDir`, `runCli`, `linkType`, `winEnv`, `tryReadlink`, `installRows`, `parseDoctorLine`, `doctorRow`, `lastNonEmptyLine`, `codeSpansOf`, `firstCodeSpan`, `buildHomeBD` and R-2293's move step.
- packages/nana-setup/tests/doctor-fix-line.test.mjs — `walk` and `walkDifference`, and R-1994's refusal-form check.
- packages/nana-setup/tests/retired-artifacts.test.mjs — `copyTree` and the recognized `tests/fixtures/retired/py-init`.
- packages/nana-setup/tests/stale-copies.test.mjs — R-1762, which ties the session line to install's dry run.
- packages/nana-setup/tests/project.test.mjs — the existing dangling-link fixture.

Named departures the brief accepts: `walk` and `copyTree` are copied into `linked-claude-folder.test.mjs` (a test file runs its checks on import, so one cannot import another), and the copied `walk` reads links through the file's own `tryReadlink`, so a broken Windows junction cannot throw. The refusal's folder list is written out in `steps.mjs`, since no step exposes its folders.

Steps, in order:
1. Rows first: add R-2701 to R-2703 and R-2705 to `REQUIREMENTS.md` in FEAT-015 after R-2294, and R-2704 in FEAT-013 SUB-014 after R-2291, `untested` until each check passes, then `implemented` with backticked `file::title` evidence. Edit R-2294's text in place as the must-meet's M-1 says; keep its ID, title and test.
2. Tests, each with its `// req:` marker directly above and the exact title the must-meet gives, with the must-meet's changes to the draft's test designs (S-1, S-2, N-3, N-6). Every new check except R-2703 must be red on main's code; check that by hand once per row and say so in the report (do not commit those checks).
3. Code: the two legacy rows in `doctor.mjs` and the guard first in `install()` in `steps.mjs`, with the by-hand text "install will not back these up through the linked folder" (N-6).
4. Docs: `packages/nana-setup/README.md` as the draft's Docs list and the must-meet's M-1 say (the legacy rows, the refusal, R-2294's exception, the test table row); module headers of `doctor.mjs`, `steps.mjs` and the test file. Regenerate `docs/code-map.md` and `docs/requirements-tree.md` (`npm run map`, `npm run req:tree`).
5. Checks before your one commit: `linked-claude-folder`, `retired-artifacts`, `doctor-fix-line`, `stale-copies` and `install` test files each alone; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `npm run test:locked`. You cannot run Windows here; reason about the junction paths from the code and say what you could not run.

Seat check: `node docs/reviews/linked-folder-advice-2026-10-23/seat-titles.mjs all` must print `0 missing`.

Done: every must-meet test passes and every one but R-2703 was red on main, the seat check prints `0 missing`, the full suite is green, and the work is committed.

Report (at most 12 lines after the VERDICT line): the commit sha; each must-meet title's result; the hand check against main; each departure from the Precedent files or the must-meet, with its reason; the full suite's summary line; map, readme, trace, tree and seat-check status; what you could not run.
