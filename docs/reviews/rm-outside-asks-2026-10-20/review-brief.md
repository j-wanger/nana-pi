# Review — rm-outside-asks (in pi, a plain rm or rm -f whose target lies outside the working folder and every temp folder asks first and names that target), 2026-10-20 (Opus, the final reviewer)

Feature: FEAT-010 · Guard risky commands and protected resources

Review `git diff cd2d580e..HEAD` on `feat/rm-outside-asks` (main was `cd2d580e` when this brief was written; `git
merge-base HEAD main` is `cd2d580e`). The plan of record is `docs/reviews/rm-outside-asks-2026-10-20/must-meet.md`:
eight must-meet checks, rows R-2330 to R-2337, plus R-2338, which build 2 added after the independent check's MUST.
`plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` is build 1 (3d8e2d22); `build-brief-2.md` is build 2
(b19438f5), which adds the `/tmp` temp root on macOS and Linux and closes three pair survivors. The seat's record is
`seat-verify-b19438f5.md`. On draft pull request #140, build 1's CI run was cancelled as superseded, and run
39460770013 runs at 490bb78b (build 2 plus the seat's pairs record). It was still running when this brief was written; the seat reads its Windows leg before the land. The land runs the locked suite on the reviewed tip. The record also holds the macOS
wrong-code pairs (`seat-mutate.mjs`; 27 of 30 red on build 1, G2, G5 and G6 surviving; 31 of 31 red on build 2; records
`seat-mutate-output-3d8e2d22.txt` and `seat-mutate-output-b19438f5.txt`) and the independent check
(`independent-check-b19438f5.md`: FINDINGS, one MUST, run on 3d8e2d22). Build 2 fixes that MUST. The independent check
did not re-run on build 2; the seat re-ran its replay of recorded rm calls against build 2 and saw 1 new block versus
main, a reviewer's `rm /config`, the one case the plan expected.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, which reads from the merge base; run at
490bb78b, before the seat's notes commit):

```
tree movement cd2d580..490bb78: 9 rows in 1 features
FEAT-010 · Guard risky commands and protected resources
  R-2330 new (implemented)
  R-2331 new (implemented)
  R-2332 new (implemented)
  R-2333 new (implemented)
  R-2334 new (implemented)
  R-2335 new (implemented)
  R-2336 new (implemented)
  R-2337 new (implemented)
  R-2338 new (implemented)
```

CAP-03 moves from 157 to 166 rows and FEAT-010 from 67 to 76. No existing row changed.

The code under review: the new `packages/nana-pack/lib/gate-rm-outside.ts` (`rmOutsideTargets(segments, cwd, tool, {
home, tempRoots, segmentable })`: a Map from segment to the full path of its first target outside the real working
folder and every real temp root, never throwing, with an internal failure counted as outside); `commandHit` in
`packages/nana-pack/extensions/nana-gate.ts`, which runs it over the exec segments and, for a command it cannot split,
the detection segments, and gives a hit segment with no danger the non-floor reason `rm outside the working folder:
<path>`; the new `gateTempRoots()` in the same file (the shared `acceptedTempRoots` plus `/tmp`, resolved, on macOS
and Linux), which `laneWriteHit` now calls in place of its inline list; and three new exports from
`packages/nana-pack/lib/gate-shell.ts`. Tests: nine checks in `packages/nana-pack/tests/gate-rm-outside.test.mjs`
(R-2338's prints a real SKIP on Windows). The pack README's gate section gains the rule's bullet. The rest of the diff is
the plan, the seat's records, the generated code map and tree, HANDOFF and the session entry.

Judge whether every honest spelling of a readable target outside the working folder and every temp folder now asks,
in bash and in PowerShell, naming the target's full path in the prompt and the headless block; whether a target inside
the working folder, inside a temp folder, inside `/tmp` on macOS and Linux, or led by another variable still runs with
no prompt and no block; whether the recursive and forced verdicts, the in-folder exemption, allow patterns and the lane
write guard behave as on main; whether the module never throws; and whether the tests write only inside the fixtures
they own and create nothing under `/tmp`.

Threat model: honest variation in our tools' output and the OS is in scope (command spellings, `..`, home spellings,
globs, links and junctions, `/var` and its real path on macOS, 8.3 short names, temp variables, Git Bash, and the
macOS, Linux and Windows layouts); deliberate forgery is out, such as eval, base64, a variable built to hide a path, a
race that swaps a folder for a link after the check, or a prefix, `BASH_ENV` or spawn hook that moves the cwd. The gate
is advisory by load path.
Lane class: install, hook or gate — the pi extension nana-gate's command check, plus the new
`lib/gate-rm-outside.ts`, three exports from `lib/gate-shell.ts` and one shared temp-root helper in `nana-gate.ts`.

Check: (1) the must-meet checks are not vacuous: each build-2 pair turns its named check red (31 of 31) — judge whether
any must-meet check is still unproven, especially the Windows-only branches, which no pair or probe ran off Windows;
(2) no fail-open: no honest spelling of an outside target runs unasked beyond the plan's known limits, and a failure
inside the module asks rather than allows; (3) nothing main does today stopped working: plain rm inside the working
folder and the temp folders, `/tmp` on macOS and Linux, builders' variable-led cleanup, the recursive and forced
verdicts, the in-folder exemption, allow patterns and the lane write guard's temp roots — and judge the independent
check's known bug 2 (a commit-message heredoc with a line starting `rm ../x` blocks headless) as a known bug or a
listed harm; (4) the tests write only inside the fixtures they own and create nothing under `/tmp`; (5) every README
sentence the lane changed is true; (6) HANDOFF and the session entry are true, including the ten new residuals, the
edited helper-order line and the seat items from other lanes (twelve residuals, the reworded rulings-copy line and two
Landed lines' late CI results); (7) any MUST.
