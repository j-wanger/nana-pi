# Lane lift — build brief 3 (2026-10-15 · feat/lift · tip after the seat's records commit)

**Builder: Claude Sonnet 5.** Build 2 passes the suite, acceptance and the Windows leg, but the seat's independent check
(`seat-verify-202a660.md`, four MUSTs) and the seat's mutation runner (`seat-mutate-output-202a660.txt`: 36 of 59 code
breaks caught, 23 survived) show that the proof — the lane's core guarantee — does not do what R-1163 and R-1168 say,
and that the tests do not pin it. Build briefs 1 and 2's rules all hold, including brief 2's: run only the touched test
files, never `test:locked` or a command that waits on a background job; the seat runs the suite and CI.

## A. The proof must account every line (MUST 1)
Today it checks lines under each mapping `from` heading and the first `head.through` lines by position, and never the
tail, lines outside any declared region, or extra lines. Reproduced: a committed mapping with `head.through: 1` (true
value 4) let `--write` delete basketball-geek's 3-line intro with a clean proof; dropping aml-desk's 42-line Open
questions body, a Deliberate omissions bullet, duplicating a kept section, or appending a stray line all pass. Make the
proof partition the input: every input line — head, every node's region, tail, kept sections, blank lines — is assigned
to exactly one region from the input and the mapping, and appears exactly once in the output in its region's order,
except the heading, field, header and delimiter lines the mapping replaces; every output line is either a consumed
input line or a declared generated line. The validator requires `head.through` to end just before an old heading
(§3.2) and refuses otherwise, named.

## B. `--verify` must prove (MUST 2)
`runVerify` (`scripts/requirements-lift.mjs:773-774`) only compares the applied output with HEAD. It must run the same
mapping validation, pin check and proof as `--write` (with `fromDefault` when no `--mapping`), and refuse naming the
first problem. Reproduced: a mapping missing R-136, committed with its matching ledger, passes `--verify` against a base
that holds R-136.

## C. Check 9 in default mode derives everything from the input (MUST 3)
Today the derived sequence takes ids, levels and parents from the input but labels and purposes from the mapping, and
never compares `from` lines. Derive each node's kind, level, label (the old heading text), purpose (the unsorted
placeholder), source line and parent from the input alone, and compare all of them with the output's headings. A label
stripped of "1. ", two swapped sections, or a changed purpose must each fail it.

## D. Each check pinned by a test (MUST 4 and the survivors)
T6 must hold the nineteen tampers brief 1 names, and **each tamper must assert the specific problem text the check
it targets emits** (not just "the proof refuses"), so removing any one check reds T6. Add tampers in the tail and in a
middle node's region, not only the head. Also pin, each with its own assertion, every survivor in
`seat-mutate-output-202a660.txt`:
- the proof: order (check 6), the stray-line check, blank lines in in-place and re-laid leaves, line order in an
  in-place leaf, check 8, the default heading sequence (C), the reserved-node R-row rule, the G-row subgroup rule, an
  unterminated last row gaining an ending;
- apply: a row line with trailing whitespace at the very end of the line (outside any cell) in T4's fixture; rows out
  of ID order in T4's and T31's fixtures (so sorting by ID reds them);
- the gate: T12 must change the ledger **between the proof and the rename** through the write step's injected file
  functions (today it edits before the run, so the HEAD check refuses, not the re-read); `--verify`'s ledger and mapping
  git checks;
- the validator: a G row in another reserved subgroup, a heading named twice, a line after an unterminated last row;
  the mapping NUL, invalid-JSON and version checks; a repeated row ID in the ledger; the closing heading retyped.
Where a survivor is truly equivalent under the code (the checker found two: verify's `./` form and the null-status
case), say so in the report with the reason instead of adding a test.

## E. Smaller
1. A mapping whose `rows` is a string or whose `tree` is an object crashes with a TypeError; validate the shape of every
   field and refuse with a named reason (R-1167, "never a crash").
2. A merge of two features prints no move line, so the owner's plan hides it; print one move line per row that leaves
   its old section (R-1162).
3. In default mode, an unterminated last row after a mid-file Open questions is refused as "row R-002 appears 0
   time(s)"; refuse it with the named fix (end the file with a line break) before building the output.
4. The skill says a hand-built partial tree "takes `--emit-mapping`", but R-1167 refuses that; say such a ledger needs a
   hand fix or a hand-written mapping.

Do not change any row's text; add new titles to the cited rows' evidence. Do not touch `CHANGE.md`, the seat's files in
this folder, `HANDOFF.md` or `docs/sessions/`.

## Done
`node scripts/test.mjs packages/nana-pack/tests/requirements-lift.test.mjs` (and any other touched test file) green;
`node docs/reviews/lift-2026-10-14/seat-titles.mjs 1` → `0 missing`;
`node docs/reviews/lift-2026-10-14/acceptance.mjs > docs/reviews/lift-2026-10-14/acceptance-output.txt 2>&1` → only the
seat's HANDOFF/session case misses; `node scripts/requirements-tree.mjs --check`; `node scripts/code-map.mjs --check`;
`node scripts/readme-check.mjs` (or `npm run -s readme:check`). Commit, push.

## Report
≤ 30 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; each of A–E with the red you saw first (the
reproductions above make good first reds); the survivors you argue equivalent and why; the touched test files' summary
lines; the last line of each seat output; the one claim most likely wrong.
