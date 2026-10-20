# Review — rm-outside-asks (in pi, a plain rm or rm -f whose target lies outside the working folder and every temp folder asks first and names that target), 2026-10-20 (pi gpt-6-astra, the land reviewer)

Feature: FEAT-010 · Guard risky commands and protected resources

Review `git diff cd2d580e..HEAD` on `feat/rm-outside-asks` (main was `cd2d580e` when this brief was written; `git
merge-base HEAD main` is `cd2d580e`). The plan of record is `docs/reviews/rm-outside-asks-2026-10-20/must-meet.md`:
eight must-meet checks, rows R-2330 to R-2337, plus R-2338, which build 2 added after the independent check's MUST.
`plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` is build 1 (3d8e2d22); `build-brief-2.md` is build 2
(b19438f5). The seat's record is `seat-verify-b19438f5.md`. On draft pull request #140, build 1's CI run was cancelled
as superseded, and run 39460770013 runs at 490bb78b (build 2 plus the seat's pairs record). It was still running when this brief was written; the seat reads its Windows leg before the land. The land runs the locked suite on the reviewed tip. The record also
holds the macOS wrong-code pairs (`seat-mutate.mjs`; 27 of 30 red on build 1, G2, G5 and G6 surviving; 31 of 31 red on
build 2) and the independent check (`independent-check-b19438f5.md`: FINDINGS, one MUST, run on 3d8e2d22). Build 2
fixes that MUST; the check did not re-run on build 2, and the seat's re-run of its replay against build 2 saw 1 new
block versus main, a reviewer's `rm /config`, the one case the plan expected. The final reviewer's brief is
`review-brief.md`.

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

The code under review: `commandHit` in `packages/nana-pack/extensions/nana-gate.ts`, which judges every bash and
PowerShell call pi makes, and the new `packages/nana-pack/lib/gate-rm-outside.ts` it now calls. After the floor loop
and the in-folder exemption, a non-recursive rm or `Remove-Item` whose readable target lies outside the real working
folder and every real temp root gets the non-floor danger `rm outside the working folder: <path>`: interactive pi asks,
headless pi blocks. The temp roots come from the new `gateTempRoots()` in the same file, the shared `acceptedTempRoots`
plus `/tmp`, resolved, on macOS and Linux; `laneWriteHit` now calls that helper in place of its inline list. The module
never throws, and an internal failure counts the segment as outside. `packages/nana-pack/lib/gate-shell.ts` exports
three existing names.

Judge whether the lane fails open: an honest spelling of a readable outside target that runs unasked beyond the plan's
known limits, a module failure that allows, or a must-meet check that passes with the change removed. Judge whether it
leaves a harm the review standard lists, such as a builder's or reviewer's ordinary headless work now blocked on any
platform (temp cleanup under `/tmp` or the OS temp folder, variable-led cleanup, rm inside the working folder), or a
test writing outside its fixtures. Judge whether anything main does today stopped working: the recursive and forced
verdicts, the in-folder exemption and its bare-repository walk, allow, extra and protected patterns, the verifier pipe
check, the lane write guard's temp roots, and all three CI legs.

Known gaps the seat records as residuals; judge whether each is a harm the standard lists or a known limit: a target
led by another variable, a command substitution or `~user`, or a relative target after an unreadable cd, is not judged;
a session started in home or a filesystem root sees nothing as outside; temp folders are shared, and on macOS and
Linux `/tmp` counts even with home inside it (read from the code); a glob or variable folder part is judged by the
literal folder before it, and `..` after a linked folder lexically; in a command the gate can split, a cd applies to the
rest of the line even when it fails or sits in a pipeline; only rm in command position is judged, and the recursive and
forced reasons name no path; a heredoc line that looks like an rm is judged, so a commit-message heredoc with a line
starting `rm ../x` blocks headless (the independent check's known bug 2); Git Bash `/tmp` and drive paths ask; PowerShell
colon-bound parameters, pipeline input, filter scope and backtick escapes are not read; the pairs and the independent
check ran on macOS only, so Windows path handling rests on the Windows CI leg.

Threat model: honest variation in our tools' output and the OS is in scope (command spellings, `..`, home spellings,
globs, links and junctions, `/var` and its real path on macOS, 8.3 short names, temp variables, Git Bash, and the
macOS, Linux and Windows layouts); deliberate forgery is out, such as eval, base64, a variable built to hide a path, a
race that swaps a folder for a link after the check, or a prefix, `BASH_ENV` or spawn hook that moves the cwd. The gate
is advisory by load path.
Lane class: install, hook or gate — the pi extension nana-gate's command check, plus the new
`lib/gate-rm-outside.ts`, three exports from `lib/gate-shell.ts` and one shared temp-root helper in `nana-gate.ts`.

Check: (1) no fail-open; (2) no listed harm; (3) nothing main does today stopped working, on any of the three CI legs;
(4) HANDOFF and the session entry are true; (5) any MUST.
