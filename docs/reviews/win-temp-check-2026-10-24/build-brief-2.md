Feature: FEAT-006 · Launch builders with execution limits. Lane win-temp-check. Class: ordinary. Builder: pi-worker (small lane). Build session 2.

Work in the lane worktree on feat/win-temp-check, on top of e3ff6827. The spec is still `docs/reviews/win-temp-check-2026-10-24/must-meet.md`. Session 1 built the fix; the seat found four gaps against the must-meet. Fix only these. Do not edit any file under `packages/*/bin/`, `packages/*/lib/` or `scripts/`, HANDOFF, the session archive, `docs/known-bugs/`, or any file in a review folder except as named.

Precedent:
- packages/nana-pack/tests/process-tree-helper.mjs — `hardKillTempNames` and the module header, from session 1.
- packages/nana-pack/tests/worker-claude.test.mjs — `hardKillTempNamesCheck` and the R-2803 check, from session 1.

No private helper moves to a shared module.

The task:
1. R-2803's row text in REQUIREMENTS.md departs from the must-meet. It claims what "a hard-kill test" judges, which the planted-folder test cannot show. Use the must-meet's wording exactly: "The hard-kill temp check shall return, sorted, the name of every entry left in a case temp folder, file or folder, and report the folder empty only when it returns none."
2. The R-2803 test plants no PowerShell-named file. Add the must-meet's case: a folder holding only a file named `__PSScriptPolicyTest_lvnwlq0m.dy0.ps1` returns that one name and is not empty. A helper that skipped that name must turn the check red.
3. The sort red case is weak: two names may come back from the folder already sorted. Plant at least five names whose creation order is not sorted, files and folders mixed, and compare with the sorted list.
4. The process-tree-helper.mjs header no longer matches the module. Name the case temp folder in `@inputs`, add the folder read to `@effects`, and widen `@purpose` to cover reporting what a killed worker left, in one sentence. Then run `npm run map` and commit the regenerated code map.

Try each R-2803 red case by hand if the shell allows it, and say which ran. If the gate blocks a hand check, name the command it blocked.

Checks before your one commit: worker-claude.test.mjs alone; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `npm run test:locked`.

Seat check: `node docs/reviews/win-temp-check-2026-10-24/seat-titles.mjs all` must print `0 missing`.

Done: the row reads as the must-meet says, the test covers the PowerShell-named file and a real sort, the header matches the module, the full suite is green, the seat check prints `0 missing`, and the work is committed.

Report (at most 8 lines after the VERDICT line): the commit sha; each fix; which red cases you ran by hand, and any command the gate blocked; the full suite's summary line; map, readme, trace, tree and seat-check status.
