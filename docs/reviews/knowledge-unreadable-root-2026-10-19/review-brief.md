# Review — knowledge-unreadable-root (the knowledge build keeps the search entries of a root or folder it cannot list), 2026-10-19 (Opus, the final reviewer)

Feature: FEAT-003 · Index and connect existing knowledge sources

Review `git diff d4423eff..HEAD` on `feat/knowledge-unreadable-root` (main was `d4423eff` when the lane branched; `git
merge-base HEAD main` is `d4423eff`). Main has since moved to `8a9ff9a3` (the readme-windows-checklist land), so the
land needs a merge of main and a confirmation round on the merged tip. The plan of record is
`docs/reviews/knowledge-unreadable-root-2026-10-19/must-meet.md`: rows R-1910 to R-1913, with the R-883 and R-207 pins;
`build-brief-2.md` adds R-1914 and R-1915. `plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` and
`build-brief-2.md` are the two builds (802c8478, merged with main d4423eff at fd0e7ab5; then 08ba23e3). The seat's
record is `seat-verify-08ba23e3.md`: CI run 39360453683 on draft pull request #89, 0 failing files on all three legs
(`ci-windows-08ba23e3.log` beside it, and build 1's `ci-windows-fd0e7ab5-build1.log`); the wrong-code pairs
(`seat-mutate.mjs`; `seat-mutate-output-fd0e7ab5.txt`, 14 of 19 red; `seat-mutate-output-08ba23e.txt`, 14 of 16 red,
M4 and M5 declared survivors); and the independent check (`independent-check-08ba23e3.md`: HOLDS on build 1, no
MUST, eleven probes; its known bugs A and B are fixed in build 2, and its two confirmed limits are HANDOFF residuals).
`build-2-output.txt` is the builder's saved local macOS install check and locked suite. The local macOS install check
runs again before the land.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, run at 356dc265; the seat's notes commit
changes no row):

```
tree movement d4423ef..356dc26: 8 rows in 1 features
FEAT-003 · Index and connect existing knowledge sources
  R-207 untested -> implemented
  R-883 untested -> implemented
  R-1910 new (implemented)
  R-1911 new (implemented)
  R-1912 new (implemented)
  R-1913 new (implemented)
  R-1914 new (implemented)
  R-1915 new (implemented)
```

CAP-01 moves from 179 to 185 rows and FEAT-003 from 35 to 41.

The code under review: `walk()` and the purge loop in `packages/nana-knowledge/lib/build.ts` (the new
`BuildStats.unreadable`), `contains` exported from `lib/sources.ts`, the build output lines and `rootStatus` in
`bin/nana-knowledge.ts`, and the README's missing-root paragraph. The new checks sit in
`packages/nana-knowledge/tests/unreadable-root.test.mjs`; `tests/incremental-build.test.mjs` gains six `req:` markers
and no assertion.

Judge whether a configured root, or a folder under it, that exists but cannot be listed keeps its indexed rows
searchable, while a file deleted from a folder the build could list is still purged; whether the build names each such
path UNREADABLE and exits 0; whether status marks such a root UNREADABLE and a readable single-file root ok; whether
the lines after `build --rebuild` are truthful; and whether a root dropped from `sources.json` still purges, a missing
root still prints MISSING and keeps its rows, setup still reads the build's summary line, and the hook's detached build
behaves the same.

Threat model: honest variation in our tools' output and the OS is in scope: POSIX modes, macOS privacy denial,
Windows deny rules, offline or missing folders and temp paths of any spelling, on macOS, Linux and Windows under Node 22.
Deliberate forgery is out, including a hostile filesystem and a forged index. Lane class: install, hook or gate —
`lib/build.ts` is the background build both seats' knowledge hooks start, and the CLI is the Claude Code hook command
and the pi extension's child.

Check: (1) the six must-meet checks and the two pins are not vacuous: each fails with its feature removed (the pair
tables name which wrong code turns which check red), and no denial check can pass on a host where the denial did not
take; (2) an unreadable folder keeps only the rows inside it, with no sibling-name prefix match, and nothing keeps the
rows of a root no longer configured; (3) nothing main does today stopped working: incremental and full builds, the
MISSING line, status for a missing or readable root, setup's read of the summary, and the hook's pull and background
build, on all three CI legs; (4) the tests write only inside the temp folders they own, undo every denial in a
`finally`, and clean up; (5) the README, the module headers and the rows say what the code does, the rebuild wording
included; (6) HANDOFF and the session entry are true, including the narrowed walker residual, the seven new
knowledge-unreadable-root residuals and the other lanes' items the seat added; (7) any MUST.
