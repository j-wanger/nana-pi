# Lane req-tree — continuation 3: close sol build-review r2 (SEND-BACK 5/10)   (2026-10-09 · feat/req-tree)

Contract unchanged (`CHANGE.md`, `build-brief.md`, approved commit
`6b9202a501a7fe03dfc834ab34cdfc212f6d92ce`). Read `sol-build-r2.md` in full. The NEXT review is the
last one allowed for this item, so every fix below must be pinned by a test that checks the whole
real ledger or a property, not by a single example. The seat accepts all three findings.

## 1. The outline drops the second ID of every two-ID run (sol MUST 1 — 74 IDs missing)
`compressRowIds` emits only `start` when `j - i === 1` (scripts/requirements-tree.mjs, the
`j - i >= 2 ? … : start` line). Fix: a two-ID run emits both IDs (`R-109, R-110`); three or more
emit a range.
Pin it so the same bug cannot hide behind the renderer:
- Add `expandRowIds(text)`, written independently of `compressRowIds` (parse the ID list text:
  single IDs and `X-nnn–X-mmm` ranges, any prefix).
- Rewrite the R-291 field check so it reads the COMMITTED outline text, not a re-render: for every
  heading, parse its line in `docs/requirements-tree.md`, expand its ID list with `expandRowIds`,
  and compare with the rows the parsed LEDGER puts directly under that heading — same set, and the
  `Rows:` count equals the expanded size for leaves and the descendant total for parents. Also
  compare ID, label, purpose and parent from the outline line against the parsed ledger.
- Property test: `expandRowIds(compressRowIds(ids))` equals `ids` (as a sorted set) for constructed
  sets covering runs of 1, 2, 3 and 4, gaps, unsorted input, and mixed R/G prefixes.
- Real-ledger test: every heading's IDs survive the round trip, and the total of leaf counts equals
  1,009.

## 2. "Sit in a table" is not enforced (sol MUST 2)
Model a table exactly: a header line (`| ID | Requirement | Status | Evidence |`) IMMEDIATELY
followed by a delimiter line (`|---|---|---|---|`, cells of dashes with optional colons), then
contiguous row lines; the table ends at the first line that is not a row line. Any line the trace
rail would read as a row (`/^\|\s*[RG]-\d{3}\s*\|/`) that is not inside such a table is an R-287
violation, named by line. A header without a delimiter is not a table.
Fixtures (each red with the old code, green-detected with the new): a row after a prose line
inside a feature; a row after a blank line that follows a table; a header with no delimiter line;
a row line inside a fenced code block.

## 3. SETEXT headings are invisible (sol MUST 3)
Recognize headings the way CommonMark does, for the block types that matter here:
- ATX: `^ {0,3}#{1,6}(?:[ \t]|$)`.
- SETEXT: a non-blank paragraph line (not a heading, not a table line, not inside a fence) followed
  by `^ {0,3}(=+|-+)[ \t]*$`; `=` is level 1, `-` is level 2.
- Fenced code (``` or ~~~, indent 0–3) is opaque: no headings or tables inside it.
Every heading, ATX or SETEXT, is a boundary for R-287, R-288 and R-290 (the round-2 rules).
Fixtures: a SETEXT level-1 heading after FEAT-001 followed by a table (R-287 red); a SETEXT heading
between a capability and its `Purpose:` (R-288 red); a SETEXT level-1 heading between CAP-01 and
FEAT-001 (R-290 red); an ATX-looking line inside a fence is NOT a boundary; a `---` line after a
BLANK line is a thematic break, not a heading. The real ledger has no fences, SETEXT underlines,
indented headings or HTML comments, so it must stay green.
Declared residual (state it in the report): HTML blocks and comments, link reference definitions
and indented code are not modeled; the ledger uses none.

## Then
Mutation pairs for each new check (break the code, the new fixture goes red, restore green).
`npm run req:tree`, `npm run map`, `npm run map:check`, the proof (exit 0; the ledger must not
change), `npm run test:locked`. Same NOT, allowlist and frozen inputs; this brief is frozen too.
Report ≤ 40 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; per finding the tests
that pin it with red/green; the count of IDs the corrected outline lists (must be 1,009); the
prove and suite summary lines; the one claim most likely wrong.
