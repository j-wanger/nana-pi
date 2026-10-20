# Review — shared-memory-index-cap (the Claude Code seat's shared-memory hook keeps its session-start output under Claude Code's hook output cap), 2026-10-20 (pi gpt-6-astra, the land reviewer)

Feature: FEAT-003 · Index and connect existing knowledge sources

Review `git diff 9552afb1..HEAD` on `feat/shared-memory-index-cap` (main was `9552afb1` when this brief was written; `git
merge-base HEAD main` is `9552afb1`). The plan of record is `docs/reviews/shared-memory-index-cap-2026-10-20/must-meet.md`:
seven must-meet checks, rows R-2340 to R-2346. `plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` is build 1
(e5b95409, the hook change) and `build-brief-2.md` build 2 (4641a6f2, tests only). The seat's record is
`seat-verify-2eea960a.md`. CI run 39499268786 on draft pull request #142 at 2eea960a (build 2 plus the seat's pairs
record) reads 0 failing on all three legs: macOS 193 PASS, 0 FAIL, 2 SKIP of 195 files (8,007 checks pass, 35 skip);
Ubuntu 192 PASS, 0 FAIL, 3 SKIP (7,946 pass, 55 skip); Windows 177 PASS, 0 FAIL, 18 SKIP (6,935 pass, 114 skip). The
install check passes on macOS and Windows. The Windows leg's log is ci-windows-2eea960a.log in this folder. The land runs
the locked suite on the reviewed tip. The record also holds the macOS wrong-code pairs (`seat-mutate.mjs`; 20 of 23 red
on build 1, 23 of 23 red and 0 survived on build 2) and the independent check (`independent-check-2eea960a.md`: HOLDS
over eleven probes on build 1, no MUST, one known bug). The final reviewer's brief is `review-brief.md`.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, which reads from the merge base; run at
2eea960a, before the seat's notes commit):

```
tree movement 9552afb..2eea960: 7 rows in 1 features
FEAT-003 · Index and connect existing knowledge sources
  R-2340 new (implemented)
  R-2341 new (implemented)
  R-2342 new (implemented)
  R-2343 new (implemented)
  R-2344 new (implemented)
  R-2345 new (implemented)
  R-2346 new (implemented)
```

The code under review: the output block of `packages/nana-setup/claude/hooks/nana-shared-memory.mjs`, which Claude Code
runs at every session start through install's link, and the sealed budget and trim mark in the new
`packages/nana-setup/lib/shared-memory-config.mjs`. Under the budget the hook writes main's exact text. Over it, the hook
keeps each entry's `- [title](link)` head whole, cuts the longest descriptions to one common length, drops whole trailing
entries only when the heads alone overflow, and ends with a fold line naming the counts and the full index path.

Judge whether the lane fails open: output past the budget on any path (the description cut, the fit-at-zero boundary,
the drop path, the self-heal note), a hook that now exits non-zero or throws where main exited 0, a self-heal step that no
longer runs, a new import that fails to load through install's hook link, or a must-meet check that passes with the change
removed (R-2345 is the baseline pin, green on main by design; pairs H3 and H4 turn it red). Judge whether it leaves a harm the review standard lists, such as a broken install or hook, or a test writing
outside the temp folders it owns. Judge whether anything main does today stopped working: under-budget output byte for
byte, fail-open on an unreadable index, exit 0 when the reader closes early, the folder resolution, and all three CI legs.

Known gaps the seat records as residuals; judge whether each is a harm the standard lists or a known limit: when the
heads alone overflow, the trailing entries drop, and those are the newest (from about 125 entries at today's title
length); the header and the self-heal note are never cut (an index path of about 4,400 characters); the budget counts
UTF-16 units, so an astral-heavy index could pass the cap if Claude Code counted bytes; a `]` in a title makes the whole
line its head, so it is only ever dropped whole; a `)` in a link ends the head at its first `)`, so a cut to nothing puts
the trim mark inside the link (the independent check's F1); the independent check ran on build 1 only, and the pairs and
the check ran on macOS only.

Threat model: honest variation in our tools' output and the OS is in scope (an index that grows, long descriptions, CRLF
line endings, multibyte and astral text, a long Claude config folder path in the header, a symlinked path component that
adds the self-heal note; the macOS, Linux and Windows layouts); deliberate forgery is out: a hostile index file is out of
scope. Lane class: install, hook or gate — the Claude Code SessionStart hook `nana-shared-memory.mjs` and its sealed
budget in `lib/shared-memory-config.mjs`.

Check: (1) no fail-open; (2) no listed harm; (3) nothing main does today stopped working, on any of the three CI legs;
(4) HANDOFF and the session entry are true; (5) any MUST.

## Chain note (the seat, after this brief was written)

Since `4654a034`, the seat merged `63aca2fb`, the review-launch-win-paths lane's reviewed tip. Lanes land in order; each land is a fast-forward of main, so `63aca2fb` becomes main before this lane lands. Review this lane's own change as `git diff 63aca2fb...HEAD` (three dots: against the merge base) and the merge itself as `git show --remerge-diff 2f787a20` (the merge commit) if your git supports it; the generated tree, code map and R-291 leaf total were regenerated by the seat's merge helper. Tree movement now (`node scripts/requirements-moved.mjs --root . --base 63aca2fb`):

```
tree movement 63aca2f..2f787a2: 7 rows in 1 features
FEAT-003 · Index and connect existing knowledge sources
  R-2340 new (implemented)
  R-2341 new (implemented)
  R-2342 new (implemented)
  R-2343 new (implemented)
  R-2344 new (implemented)
  R-2345 new (implemented)
  R-2346 new (implemented)
```
