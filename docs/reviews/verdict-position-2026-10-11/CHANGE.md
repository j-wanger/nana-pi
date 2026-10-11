# Change declaration — read the verdict from the first or the last line

*Lane `verdict-position` · branch `feat/verdict-position` · worktree `~/nana-pi-wt/verdict-position`,
based on `main` at `0818b72` · 2026-10-11. Feature: FEAT-007 SUB-009 (R-969, R-1010; R-969 is shared
with FEAT-008). URGENT: every land in yokai-world is refused. Order: why → plan → sol plan review (item
`verdict-position-plan`; r1 SEND-BACK 4/10, r2 SEND-BACK 5/10 and r3 SEND-BACK 7/10, answered here; r4 is over the cap) → build → seat verification → sol build review → astra land review → Jake
accepts.*

## 1. Why

Jake relayed another session's report (2026-10-11): "I merged by hand. The merge helper refused,
because the review tool logged no verdict for any round. … That is a toolkit fault to fix."

The land rule (merged `0818b72`) made `verdictWord` read ONLY the output's final non-blank line and
accept a score only as `(n/m)` or `— n/m`. yokai-world's reviewers write the verdict on the FIRST line
with a bare score (`VERDICT: LAND 9/10`) and end with notes. Since the merge every yokai-world round
(nine, four items) recorded an empty verdict, so `nana-land` refuses them all (R-1004, R-1011), and
the session merged by hand. The land-rule grammar was built from a scan of review endings in three
repos; yokai-world was not among them. Real review outputs put the verdict on the first line, the
last line or both; a few older ones put it only in the middle (counts below); 41 verdict lines use
the bare `n/m` score.

**Observable outcome.**
1. A review whose final non-blank line carries `VERDICT:` is read from that line, as today.
2. Otherwise a review is read from its FIRST non-blank line, but only when that line is a PLAIN verdict
   line (it starts at column zero with `VERDICT: `, then the word, an optional score and an optional
   period — no marks, no backticks) and the word "verdict" appears on no other line, in any case and
   after folding look-alike letters (sol plan r1: a backtick-quoted first line, or a look-alike final
   label, must not let a first-line LAND stand).
3. A score may be written `(n/m)`, `— n/m` or ` n/m`, with whole numbers.
4. Everything else still fails closed with an empty verdict: a malformed selected line, a first line
   that is not plain, any other line mentioning a verdict when the first line is selected, or first
   and last verdict lines that disagree — including a first-line label disguised by an invisible
   character or a look-alike letter while the final line is selected (sol plan r3).
5. Every check that LOOKS FOR a verdict label or the word "verdict" reads one canonical form of the
   line; every check that ACCEPTS a verdict line reads the raw line. A disguised label is therefore
   always found and never accepted.

**Corpus (seat, 2026-10-11, the exact planned rule run over every output).** The review ledger holds
364 verdict records naming 364 review outputs; 26 of those files no longer exist (session scratch since
removed) and cannot be read. The 338 that exist fall into exactly these categories: 265 read by the
final line; 53 read by the first line; 12 with first and final verdict lines that agree; 8 refused
because the verdict sits only in the middle — all eight are nana-pi's 2026-10-04 EARS-form batch
reviews (`docs/reviews/ears-form-2026-10-04/batch-*-astra-r*.md`). Total 338. Beyond the ledger,
yokai-world's `docs/reviews` on `main` at `c4f3f2e` hold 76 outputs whose first non-blank line carries
the label and whose final line does not: 74 are read by the first line; two builder reports
(`VERDICT: PARTIAL — <prose>`) record empty. (An earlier draft counted 129; that number came from a
different file set and is withdrawn.) The seat's prototype of section 4
(`seat-proto.mjs` in this folder; from the repo root run `node <this folder>/seat-proto.mjs probe` and `node <this folder>/seat-proto.mjs corpus <this folder>/corpus-2026-10-11.json ~/yokai-world/docs/reviews` with yokai-world at `c4f3f2e`) reproduces all of these counts with
zero mismatches. Deliberately UNSUPPORTED shapes,
which record an empty verdict and need a fresh review in a supported shape: the verdict only in the
middle (the eight above; also `~/aml-desk/docs/reviews/slice3-2026-09-16-sol-r2.md:69` and
`~/jev-research/docs/reviews/local-tool-judge-2026-09-19/contract3-astra-r1.md:4`), and prose after
the verdict word (`~/game-world/docs/reviews/design-2026-09-06/round-9.md:17`).

## 2. Requirement delta (FEAT-007 SUB-009; R-969 shared with FEAT-008)

| ID | Change | Text (draft) |
|---|---|---|
| R-969 | reworded | Each completed review shall record as its verdict the verdict word of its selected line — the final non-blank line of its output, after one leading byte-order mark is removed, when that line's canonical form carries `verdict:` not preceded by a letter, digit or underscore, otherwise its first non-blank line — where a line's canonical form is its NFKC normalisation with every Unicode default-ignorable code point removed, the configured look-alike letters folded and all letters lower-cased, where the final line may carry before the label only whitespace and the marks `#`, `>`, `-`, `*`, `_` and backtick, the first line must begin with `VERDICT: ` and carry no marks, and either may carry after the word one whole-number score written `(n/m)`, `— n/m` or ` n/m`, one trailing `.` (the final line also `,`, `;` or `:` and the marks `*`, `_` and backtick) and whitespace. |
| R-1010 | reworded | IF the selected line is not a verdict line R-969 allows, or the final line is selected while the first non-blank line's canonical form (R-969) carries `verdict:` not preceded by a letter, digit or underscore and the first line is not a verdict line with the same word, or the first line is selected while the canonical form of any other non-blank line contains `verdict`, THEN the review ledger shall record an empty verdict for that review. |

## 3. Scope

**In.** `verdictWord` in `packages/nana-pack/bin/review-round.mjs`; the new
`packages/nana-pack/lib/verdict-config.mjs` holding the look-alike fold table; its tests in
`packages/nana-pack/tests/review-ledger.test.mjs`. Every existing R-969/R-1010 case keeps its
expectation EXCEPT two (seat check after plan r4: every existing case run through `seat-proto.mjs`;
an earlier draft named a different case here and was wrong). (1) `VERDICT: LAND | FIX-FIRST | BLOCK`
above a final `VERDICT: SEND-BACK` now records EMPTY, not SEND-BACK: the first line carries the label
and is not a verdict line with the same word (§4); both outcomes refuse a land. (2) `VERDICT: LAND`
above `ΕERDICT: SEND-BACK` (Greek capital Epsilon, then `ERDICT`) now records LAND: it folds to
`eerdict`, which is not the word. The test keeps that string with the new expectation and gains the
true look-alike `VΕRDICT: SEND-BACK` (Epsilon in the E position), which stays empty. A misspelled
label is a declared residual (§4). New cases:
first-line plain with and without bare, parenthesised and dash scores; a backtick-quoted or marked
first line → empty; a first line plus a prose correction mentioning "verdict" → empty; first and last
agreeing → the word; disagreeing → empty; a malformed first-line rejection followed by a clean final
LAND → empty; a zero-width character inside a later "VERDICT" → empty; `XVERDICT:` does not carry the
token; with a clean final LAND, a first-line rejection disguised by U+200B, by a Greek or Cyrillic
look-alike letter, or written in lower case (`verdict: send-back`) → empty; a first-line LAND followed by
a rejection disguised by U+034F (combining grapheme joiner, not category Cf) → empty; a byte-order mark
before a plain first-line verdict → the word; the pack README's verdict sentence
(probed against the code); `REQUIREMENTS.md` (the two rows); `HANDOFF.md` and the session entry
(seat, before the final review).

**NOT.** Rewriting the empty verdicts already recorded for yokai-world's nine rounds — records are
history; those revisions were merged by hand and need no land; a new review of a new revision reads
correctly. A per-repo setting for the verdict position (subtraction: both positions are accepted).

## 4. Design

- Remove one leading byte-order mark from the output, then split it into lines (sol plan r3 note; the
  requirements rail does the same at file read).
- `canon(line)` = NFKC normalisation, then remove every Unicode default-ignorable code point
  (`/\p{Default_Ignorable_Code_Point}/gu` — category Cf such as U+200B and U+FEFF, and also U+034F,
  variation selectors and Hangul fillers; sol plan r3), then fold the look-alike table, then lower-case.
  `carries(line)` = `canon(line)` contains `verdict:` not preceded by a letter, digit or underscore.
  Detection always uses `canon`; acceptance always matches the RAW line against a grammar. A disguised
  label is found by `carries` and then fails the grammar, so it can only produce an empty verdict.
- `F` = final non-blank line, `S` = first non-blank line.
- If `carries(F)`: `F` must be a verdict line, else empty; if `S` (a different line) also
  `carries`, it must be a PLAIN verdict line (the first-line grammar, as R-969 says of the first
  line) with the SAME word, else empty. (Seat amendment after sol build r1: the plan said "a verdict
  line", and the build checked `S` with the final-line grammar, so a quoted, marked, indented or bold
  first line above a final LAND recorded LAND, against R-969's text. A scan of every repo's reviews
  found no real review whose first line carries the label in a non-plain form above a final verdict;
  the only three are builder reports, refused either way.) — so a malformed or
  disagreeing first-line verdict cannot be overridden by a clean final LAND (sol plan r2:
  `VERDICT: SEND-BACK 4/10 — blockers remain` … `VERDICT: LAND` → empty); else `F`'s word.
- Else: `S` must match the PLAIN first-line form, and no other line's `canon` may contain "verdict";
  else empty; then `S`'s word. The look-alike table covers Greek and Cyrillic capitals and small
  letters that look like V, E, R, D, I, C, T.
- Moving `F`'s detection to `canon` changes no outcome: a disguised final label used to fall to the
  first-line branch and be refused by the other-line rule; it is now selected and refused as malformed.
- The look-alike table is one exported constant in a pack configuration module
  (`packages/nana-pack/lib/verdict-config.mjs`, six-tag header), its provenance beside it; the parser
  imports it (no inline vocabulary).
- Declared residuals: a reviewer who writes a plain first-line LAND and then rejects in prose without
  the word "verdict" is read as LAND — the same limit the final-line rule has for prose above the
  verdict. A look-alike outside the fold table, or a misspelled label such as `EERDICT:`, is not caught. When the final line is selected, a
  verdict line in the MIDDLE is not read (unchanged from the land rule). Ordinary notes that use the
  word "verdict" after a first-line verdict are refused on purpose (sol plan r3 note); the pinned
  yokai-world set has none. The default-ignorable set is the one in the running Node's Unicode tables.

## 5. Verification

The seat's acceptance cases (first line, last line, both agreeing, both disagreeing, a first-line
verdict with a later correction or quoted verdict, bare and other scores, the land-rule corpus cases);
a corpus regression: the new parser over every readable output the ledger references and every file
in yokai-world's `docs/reviews` must reproduce the corpus counts above exactly (265 / 53 / 12 / 8 of
338) and give the same word a reader sees for every non-empty one; mutation pairs (final-only selection → the yokai case fails; drop the "no other verdict" rule → the
prose-correction case fails; drop the fold → the look-alike case fails; allow marks on the first line →
the backtick case fails; reject the bare score → its case fails; check the first line with the raw
token instead of `canon` in the final-line branch → the U+200B and look-alike cases fail; remove only
category Cf → the U+034F case fails; keep the byte-order mark → its case fails).
