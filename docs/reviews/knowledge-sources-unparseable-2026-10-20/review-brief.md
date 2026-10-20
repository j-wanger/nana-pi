# Review — knowledge-sources-unparseable (a knowledge sources file that does not parse or cannot be read keeps the knowledge index, and one saved with a byte-order mark or as UTF-16 reads like plain UTF-8), 2026-10-20 (Opus, the final reviewer)

Feature: FEAT-003 · Index and connect existing knowledge sources

Review `git diff 9552afb1..HEAD` on `feat/knowledge-sources-unparseable` (main was `9552afb1` when this brief was
written; `git merge-base HEAD main` is `9552afb1`). The plan of record is
`docs/reviews/knowledge-sources-unparseable-2026-10-20/must-meet.md`: seven must-meet checks, rows R-2370 to R-2376.
`plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` is build 1 (51d65cf8), by a pi gpt-5.6-sol builder.
The seat's record is `seat-verify-c87c69d5.md`: CI on draft pull request #143 at 51d65cf8, the macOS wrong-code pairs
(`seat-mutate.mjs`; 24 of 24 red, 0 survived, on 51d65cf8, record `seat-mutate-output-51d65cf8.txt`; S4 red through
discovery's CRASH line, declared) and the independent check (`independent-check-c87c69d5.md`: HOLDS, no MUST, twelve
probes, run on 51d65cf8; its one known bug is the plan's wrong-shape limit). CI run 39496158186 at 51d65cf8 reads 0 failing on all three legs: macOS 193 PASS, 0 FAIL, 2 SKIP of 195 files (8,007 checks pass, 35 skip); Ubuntu 192 PASS, 0 FAIL, 3 SKIP of 195 files (7,946 checks pass, 55 skip); Windows 177 PASS, 0 FAIL, 18 SKIP of 195 files (6,935 checks pass, 114 skip). The install check passes on macOS and Windows. The Windows leg's log is ci-windows-51d65cf8.log in this folder. The land runs the locked suite
on the reviewed tip, and the local macOS install check runs before the land.

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

CAP-01 moves from 196 to 203 rows and FEAT-003 from 41 to 48. No existing row changed.

The code under review: `packages/nana-knowledge/lib/sources.ts` (`loadSources` reads bytes and decodes them with the
pack's `parseJsonBytes`; a read error other than a missing file gives the problem `unreadable`, a parse error
`unparseable` with `jsonParseFailure`'s place and repair kind; the new `formatSourcesProblem` and its two named marker
words), `lib/build.ts` (no `--rebuild` delete and every existing row preserved under a problem; `BuildStats.problem`)
and `bin/nana-knowledge.ts` (the build's marker line on stdout, the status line's marker). Tests: the new
`packages/nana-knowledge/tests/sources-file.test.mjs` (R-2370 to R-2376). The knowledge README's sources.json section
and Dependencies paragraph change with it. The rest of the diff is the plan, the seat's records, the generated code map
and tree, HANDOFF and the session entry.

Judge whether a sources.json that exists but cannot be read or does not parse, an empty one included, now never removes
an indexed row, through `build`, `build --rebuild` and the background build both hooks start; whether a file with a
UTF-8, UTF-16LE or UTF-16BE mark indexes like its plain UTF-8 twin; whether the build and status lines name the place
and the right repair with no text from the file, and exit 0; and whether a file that parses, a missing file and a root
taken out of the file behave as on main.

Threat model: honest variation in our tools' output and the OS is in scope (editor, shell and platform variation in
the owner's sources.json: a UTF-8 mark from Notepad or PowerShell 5, UTF-16LE or UTF-16BE with a mark, a single-backslash
Windows path, a missing or trailing comma, a file read mid-save, a file that exists but cannot be read, on macOS, Linux
and Windows); deliberate forgery is out.
Lane class: install, hook or gate — hook: `bin/nana-knowledge.ts` is the script the Claude Code UserPromptSubmit hook
runs and the pi extension spawns, and `lib/build.ts` is the background build both hooks start.

Check: (1) the must-meet checks are not vacuous: each pair named in the seat's record turns its check red, S4 through
discovery's CRASH line, and R-2376 catches a keep-rows rule keyed on an empty root list; (2) no row is lost on an
unreadable or unparseable sources.json in build, rebuild or the hooks' background build, and no file text reaches
stdout or stderr; (3) nothing main does today stopped working: a parseable file decodes as on main, a missing file
still seeds, R-207's root-removal purge and R-2376's empty-list purge still run, `nana-setup project` still reads the
build's totals line, and the hook still fails open within its budget; (4) the tests write only inside the temp homes
and folders they own; (5) HANDOFF and the session entry are true, including the rulings line, the Next line, the four
dropped asks, the removed scratch-branches line and the seven new knowledge residuals; (6) any MUST.

**Seat addition after the notes (2026-10-20):** the change also adds one line to the standing rulings file, the owner's 2026-10-20 ruling that the seat lands on every reviewer's LAND with no separate owner Land, as the 2026-10-16 ruling requires (rulings live in that file and land in the reviewed change that records them). Rulings, copy-record and template-render checks pass alone (10, 8, 168).

## Chain note (the seat, after this brief was written)

Since `a370bb8e`, the seat merged `10517a64`, the gate-stop-names-config lane's reviewed tip. Lanes land in order; each land is a fast-forward of main, so `10517a64` becomes main before this lane lands. Review this lane's own change as `git diff 10517a64...HEAD` (three dots: against the merge base) and the merge itself as `git show --remerge-diff 5a461519` (the merge commit) if your git supports it; the generated tree, code map and R-291 leaf total were regenerated by the seat's merge helper. Tree movement now (`node scripts/requirements-moved.mjs --root . --base 10517a64`):

```
tree movement 10517a6..5a46151: 7 rows in 1 features
FEAT-003 · Index and connect existing knowledge sources
  R-2370 new (implemented)
  R-2371 new (implemented)
  R-2372 new (implemented)
  R-2373 new (implemented)
  R-2374 new (implemented)
  R-2375 new (implemented)
  R-2376 new (implemented)
```
