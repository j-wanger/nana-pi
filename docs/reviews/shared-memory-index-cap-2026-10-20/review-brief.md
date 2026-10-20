# Review — shared-memory-index-cap (the Claude Code seat's shared-memory hook keeps its session-start output under Claude Code's hook output cap), 2026-10-20 (Opus, the final reviewer)

Feature: FEAT-003 · Index and connect existing knowledge sources

Review `git diff 9552afb1..HEAD` on `feat/shared-memory-index-cap` (main was `9552afb1` when this brief was written; `git
merge-base HEAD main` is `9552afb1`). The plan of record is `docs/reviews/shared-memory-index-cap-2026-10-20/must-meet.md`:
seven must-meet checks, rows R-2340 to R-2346. `plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` is build 1
(e5b95409, the hook change), with the seat's amendments at its end; `build-brief-2.md` is build 2 (4641a6f2, tests only).
The seat's record is `seat-verify-2eea960a.md`. CI run 39499268786 on draft pull request #142 at 2eea960a (build 2 plus
the seat's pairs record) reads 0 failing on all three legs: macOS 193 PASS, 0 FAIL, 2 SKIP of 195 files (8,007 checks
pass, 35 skip); Ubuntu 192 PASS, 0 FAIL, 3 SKIP (7,946 pass, 55 skip); Windows 177 PASS, 0 FAIL, 18 SKIP (6,935 pass, 114
skip). The install check passes on macOS and Windows. The Windows leg's log is ci-windows-2eea960a.log in this folder.
The land runs the locked suite on the reviewed tip. The record also holds the macOS wrong-code pairs (`seat-mutate.mjs`;
20 of 23 red on build 1, with H7, H16 and H22 surviving; 23 of 23 red, 0 survived on build 2; records
`seat-mutate-output-e5b95409.txt` and `seat-mutate-output-4641a6f2.txt`) and the independent check
(`independent-check-2eea960a.md`: HOLDS over eleven probes on build 1, e5b95409, no MUST, one known bug, F1, now a
HANDOFF residual; nobody re-ran it on build 2, which changed tests only).

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

CAP-01 moves from 196 to 203 rows and FEAT-003 from 41 to 48. No existing row changed.

The code under review: the new `packages/nana-setup/lib/shared-memory-config.mjs` (the sealed
`SHARED_MEMORY_OUTPUT_BUDGET = 9000` and `SHARED_MEMORY_TRIM_MARK`), and the output block of
`packages/nana-setup/claude/hooks/nana-shared-memory.mjs`, with its new `FOLD_LINE` template beside `HEADER`. Tests: the
seven checks in the new `packages/nana-setup/tests/shared-memory-budget.test.mjs`. The setup README gains one auto-memory
bullet and one Tests-table row. The rest of the diff is the plan, the seat's records, the generated code map and tree,
HANDOFF and the session entry.

Judge whether the hook now never writes more than the budget to stdout, on the description-cut path, at the fit-at-zero
boundary, on the drop path and with the self-heal note; whether it keeps every entry's title and link whole and cuts only
the longest descriptions, all to the longest common length that fits, never splitting a character; whether it leaves out
whole trailing entries only when every description cut to nothing still overflows; whether its last line names the
shortened and left-out counts and the full index path whenever it cuts or drops anything; whether an index that fits
prints exactly as on main, with no added line; whether self-heal, the folder resolution, fail-open and closed-output
handling are unchanged; and whether the tests write only inside the temp folders they own.

Threat model: honest variation in our tools' output and the OS is in scope (an index that grows, long descriptions, CRLF
line endings, multibyte and astral text, a long Claude config folder path in the header, a symlinked path component that
adds the self-heal note; the macOS, Linux and Windows layouts); deliberate forgery is out: a hostile index file is out of
scope. Lane class: install, hook or gate — the Claude Code SessionStart hook `nana-shared-memory.mjs` and its sealed
budget in `lib/shared-memory-config.mjs`.

Check: (1) the must-meet checks are not vacuous: each fails on main's hook except R-2345, the baseline pin, which the plan
keeps green on main and pairs H3 and H4 turn red; and each pair turns its named checks red (23 of 23 on build 2) — judge whether any must-meet check is still unproven, given the survivors build 1 had; (2) the output
never passes the budget on any path the hook can take, and the budget is read by name; (3) nothing main does today
stopped working: under-budget output byte for byte, self-heal, the folder resolution, fail-open on an unreadable index,
exit 0 when the reader closes early, the hook run through install's link, and all three CI legs; (4) every README
sentence the lane changed is true; (5) HANDOFF and the session entry are true, including the Landed line, the six lane
residuals with F1's corrected wording, and the five late review notes from other lanes; (6) any MUST.
