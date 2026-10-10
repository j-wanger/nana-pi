# Lane req-ids — continuation 3: one whitespace list and one byte-order-mark rule in both rails (sol build r2 SEND-BACK, astra build r2 LAND-WITH-FIXES)   (2026-10-10 · feat/req-ids)

Read `sol-build-r2.md` and `astra-land-r2.md`. Change nothing else.

**The defects.** The rails still read rows and markers differently, because `\s`, `\S`, `.trim()`,
`.strip()` and `.split()` mean different characters in JavaScript and Python (JS whitespace has
U+FEFF and lacks U+0085 and U+001C–U+001F; Python's is the reverse). Found: U+0085 before an ID →
Python loads the row, TypeScript silently drops it; U+FEFF there → the reverse; a byte-order mark
before a first-line row → both silently skip it; a BOM before a first-line marker → Python ignores
the marker; `req: R-1000,R-001` (no space) → TypeScript traces both, Python fails; U+2028 in a
marker list → TypeScript drops the whole marker, Python traces both. The seat's script now has a
cross-rail parity block: 35 cases fail at `5c266a2`'s tip.

**Fix — the same rule in both rails, in every ledger and marker path** (near-miss check, row load,
shall counts, row cells, the Part G merge, evidence citations, marker scan):
1. Remove ONE leading U+FEFF from each file's text before splitting lines: `REQUIREMENTS.md`,
   `REQUIREMENTS-general.md` and every scanned test file.
2. Define ONE named whitespace constant per rail, identical in content: tab, LF, VT, FF, CR,
   U+001C–U+001F, space, U+0085, U+00A0, U+1680, U+2000–U+200A, U+2028, U+2029, U+202F, U+205F,
   U+3000, U+FEFF (the union of both languages' own lists). Use it, and nothing else, for every
   whitespace test in `ROW`, `ROW_CANDIDATE` (its `\S` becomes "not in the list"), `MARKER`, cell
   and citation trimming, and line-end stripping (it replaces round 3's `[ \t\r]`). In these paths
   no bare `\s`, `\S`, `.trim()`, `.strip()`, `.rstrip()` or argument-less `.split()` remains.
3. A marker's ID list splits on runs of that whitespace and commas, in both rails. TS `MARKER`
   keeps the `s` flag behaviour so U+2028 cannot end the match.
4. Not in scope: the test-call regexes (`CALL`, `DEF_RE`, decorator detection) — they parse each
   rail's own language.

**Row text.** R-1001: "optional spaces" → "optional whitespace", "a non-space character" → "a
non-whitespace character". No other row text changes.

**Docs (astra r2 SHOULD).** Both template ledgers' row paragraph says: lines split only at LF; one
byte-order mark at a file's start is ignored; whitespace (name the list) around cells and after the
closing pipe is ignored; any other character after the closing pipe fails, naming the line.

**Tests.** In both template self-tests and `packages/nana-pack/tests/requirements-trace.test.mjs`
(Python through the skip-gated `uvx pytest` run), cross-rail cases asserting the SAME outcome:
U+0085, U+FEFF and U+00A0 before the ID, after the ID and after the closing pipe → read; a BOM
before a first-line row and before a first-line marker → read and traced; `R-1000,R-001` and a
U+2028-separated list → both traced; U+200B after the closing pipe → fails at its line. Cite them
in R-1001's (rows) and R-1000's (markers) evidence. Mutation pairs, each red then green: put back
`.trim()` in TS cell trimming; put back `.strip()` in Python cell trimming; drop the BOM removal;
put back Python's `.split()` for marker lists.

Then: `npm run req:tree`, `npm run map:check`, `npm run test:locked`, commit,
`npm run template:accept`, then
`node docs/reviews/req-ids-2026-10-10/seat-verify-ids.mjs > docs/reviews/req-ids-2026-10-10/seat-verify-ids-output.txt 2>&1`
(must exit 0), commit that file, and paste its LAST TWO LINES verbatim.

Rules, NOT and allowlist as `build-brief.md`; this brief, `CHANGE.md` and the seat script are
frozen. Report ≤ 25 lines, first line `VERDICT: …`.
