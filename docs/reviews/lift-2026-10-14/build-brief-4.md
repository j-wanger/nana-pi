# Lane lift — build brief 4 (2026-10-15 · feat/lift · tip after the seat's records commit)

**Builder: Claude Sonnet 5.** Build 3 closed every earlier reproduction, but the seat's checks at `0dc5d1d`
(`seat-verify-0dc5d1d.md`; the checker's mutation lists and results in `verify-0dc5d1d/`; the seat runner's output in
`seat-mutate-output-0dc5d1d.txt`) show the proof can still lose lines, because it takes its line regions from the
mapping instead of the input, and that 29 of the checker's 77 code breaks and 2 of the seat's 59 survive. Each pass so
far has fixed named cases and the checker has found the next one. This brief changes the approach for the one clause
that keeps leaking. Build briefs 1–3's rules all hold: run only the touched test files, never `test:locked` or any
command that waits on a background job; the seat runs the suite, the mutation table and CI.

## A. Line accounting derived from the input alone (R-1163's "carries every other input line … once")
Replace region-by-region prose matching as the guard against loss with one input-derived count:
- **Input side:** every raw input segment (with its own line ending), EXCEPT exactly these, each found from the input
  and the mapping's declared replacements: (1) the old heading lines the mapping names; (2) in a ledger that already
  has a tree, the field-line block (`Purpose:`, `Outcome:`, `Status:`, `Also applies:`) directly under each replaced
  heading, as the tree parser defines that block — never a field-labelled line anywhere else; (3) requirement-table
  header and delimiter lines the layout replaces.
- **Output side:** every raw output segment, EXCEPT the generated lines the mapping declares — each heading the mapping
  creates or rewrites, its field lines, each `TABLE_HEADER`/`TABLE_DELIMITER` pair the layout inserts, the closing
  heading, and separator blank lines — counted, not just recognised, so a second `Purpose:` line or an extra header pair
  is a stray.
- **Rule:** the two multisets are equal for every non-blank segment (fenced lines included — nothing is pre-marked
  consumed). Keep today's positional blank-line checks for in-place leaves, and pin them (C below).
- **Also:** every old heading after `head.through` must be named in the mapping (the "never" case) — an owner's
  `## Notes` section in a tree-form ledger must not vanish; R-1167's refusal of a carried field-labelled line applies
  to tree-form input too, not only to flat ledgers; `--write` runs `validateMapping` on a mapping it built itself, not
  only on a supplied one; and the regions appear in order — head, the nodes in mapping order, then the tail.
- **Check 9** also compares each capability's `Outcome:` (default mode: the unsorted placeholder).

## B. `--verify` runs every refusal `--write` runs
Base ledger refusals, the mapping file's NUL, encoding, version, U+FFFD and line-break checks, shape validation, pin,
`validateMapping`, and the proof (with `fromDefault` when no `--mapping`). Write and verify must not disagree on the
same input.

## C. Each check pinned
- Every surviving mutation in `verify-0dc5d1d/` (the `mut*-out-*.txt` files name them) and the seat runner's 2/4 and
  2/11 gets a test that reds on it, asserting the check's own wording; where one is truly equivalent under the new
  code, say so in the report with the reason. The seat runner's judgements give the exact missing assertions for 2/4
  (drop the blank after R-002 before `## FEAT-002` → `FEAT-001: prose from its old section(s) is missing`) and 2/11
  (a gained ending followed by more unterminated output → `row R-001: output bytes differ from the input`), and for
  T25's ANSI case (match `map-ansi.json:<line>: bytes are not valid UTF-8`, not a number anywhere on the line; add a
  case whose only bad byte sits in a key). T6's unterminated probe must emit its mapping before `--write` so the
  untampered output proves clean.
- The `--write` path itself must go through `writeLedgerAtomic` with its re-read, and a test must reach the race
  through `main`'s path, not only the helper.

## D. Smaller
1. Shape validation never throws: `tail.keep: [null]`, `also_applies` as a string, `rows: ["R-001–"]` and a reversed
   range each refuse with a named reason.
2. The unterminated-last-row rule checks the last emitted line overall: a mapping that adds an empty capability after
   the last leaf of a ledger ending in an unterminated row refuses with the named fix.

Do not change any row's text; add new titles to the cited rows' evidence. Do not touch `CHANGE.md`, the seat's files in
this folder, `HANDOFF.md` or `docs/sessions/`. Commit as you go.

## Done
The touched test files green (`node scripts/test.mjs <file>`); `node docs/reviews/lift-2026-10-14/seat-titles.mjs 1` →
`0 missing`; `node docs/reviews/lift-2026-10-14/acceptance.mjs > docs/reviews/lift-2026-10-14/acceptance-output.txt 2>&1`
→ only the seat's HANDOFF/session case misses; `node scripts/requirements-tree.mjs --check`;
`node scripts/code-map.mjs --check`; `npm run -s readme:check`. Commit, push.

## Report
≤ 30 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; A–D each with the red you saw first; every survivor
you argue equivalent and why; the touched test files' summary lines; the last line of each seat output; the one claim
most likely wrong.
