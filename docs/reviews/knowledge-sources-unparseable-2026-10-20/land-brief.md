# Review — knowledge-sources-unparseable (a knowledge sources file that does not parse or cannot be read keeps the knowledge index, and one saved with a byte-order mark or as UTF-16 reads like plain UTF-8), 2026-10-20 (pi gpt-6-astra, the land reviewer)

Feature: FEAT-003 · Index and connect existing knowledge sources

Review `git diff 9552afb1..HEAD` on `feat/knowledge-sources-unparseable` (main was `9552afb1` when this brief was
written; `git merge-base HEAD main` is `9552afb1`). The plan of record is
`docs/reviews/knowledge-sources-unparseable-2026-10-20/must-meet.md`: seven must-meet checks, rows R-2370 to R-2376.
`plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` is build 1 (51d65cf8). The seat's record is
`seat-verify-c87c69d5.md`: CI on draft pull request #143 at 51d65cf8, the macOS wrong-code pairs (`seat-mutate.mjs`;
24 of 24 red, 0 survived, on 51d65cf8) and the independent check (`independent-check-c87c69d5.md`: HOLDS, no MUST,
twelve probes, run on 51d65cf8). The final reviewer's brief is `review-brief.md`. CI-PENDING. The land runs the locked
suite on the reviewed tip, and the local macOS install check runs before the land.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, which reads from the merge base; run at
c87c69d5, before the seat's notes commit):

```
tree movement 9552afb..c87c69d: 7 rows in 1 features
FEAT-003 · Index and connect existing knowledge sources
  R-2370 new (implemented)
  R-2371 new (implemented)
  R-2372 new (implemented)
  R-2373 new (implemented)
  R-2374 new (implemented)
  R-2375 new (implemented)
  R-2376 new (implemented)
```

The code under review: `packages/nana-knowledge/lib/sources.ts` now decodes sources.json through the pack's shared
`parseJsonBytes` and returns a problem, `unreadable` or `unparseable` with its place and repair kind, in place of an
empty root list; `lib/build.ts` keeps every indexed row and skips the `--rebuild` delete while a problem stands;
`bin/nana-knowledge.ts` prints the problem's marker on the build's stdout and on status's sources line. The Claude Code
UserPromptSubmit hook runs this CLI, and the pi extension spawns it; both start the build in the background.

Judge whether the lane fails open: an indexed row still lost on a sources.json that exists but cannot be read or does
not parse, through build, rebuild or the hooks' background build; file text reaching the build or status output; the
hook no longer failing open, or starting a build on every prompt while the file stays broken; or a check that passes
with the change removed. Judge whether it leaves a harm the review standard lists, such as a broken hook on any
platform, or a test writing outside its temp homes. Judge whether anything main does today stopped working: a parseable
sources.json decoding and purging as on main, the seed on a missing file, the discover block, `nana-setup project`'s
refresh summary (it reads the build's last totals line), status's other lines, and the knowledge tests on all three CI
legs.

Known gaps the seat records as residuals; judge whether each is a harm the standard lists or a known bug: a file that
parses with the wrong shape (a top-level null, roots that are not a list, a misspelt key) still purges every row, as
on main; while the file stays broken no root is scanned; doctor and project setup show no marker; the hooks' background
build discards its output; no check pins status UNREADABLE or the index age refresh under a problem; UTF-16 with no
mark reads as unparseable. The pairs and the independent check ran on macOS only, so CI is the only Linux and native
Windows run.

Threat model: honest variation in our tools' output and the OS is in scope (editor, shell and platform variation in
the owner's sources.json, on macOS, Linux and Windows); deliberate forgery is out.
Lane class: install, hook or gate — hook: the knowledge CLI behind the Claude Code UserPromptSubmit hook and the pi
extension, and the background build both start.

Check: (1) no fail-open; (2) no listed harm; (3) nothing main does today stopped working, on any of the three CI legs;
(4) HANDOFF and the session entry are true; (5) any MUST.
