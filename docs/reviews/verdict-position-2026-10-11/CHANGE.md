# Change declaration — read the verdict from the first or the last line

*Lane `verdict-position` · branch `feat/verdict-position` · worktree `~/nana-pi-wt/verdict-position`,
based on `main` at `0818b72` · 2026-10-11. Feature: FEAT-007 SUB-009 (R-969, R-1010; R-969 is shared
with FEAT-008). URGENT: every land in yokai-world is refused. Order: why → plan → sol plan review (item
`verdict-position-plan`; r1 SEND-BACK 4/10 and r2 SEND-BACK 5/10, answered here) → build → seat verification → sol build review → astra land review → Jake
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
   and last verdict lines that disagree.

**Corpus (seat, 2026-10-11, the exact planned rule run over every output).** The review ledger holds
364 verdict records naming 364 review outputs; 26 of those files no longer exist (session scratch since
removed) and cannot be read. The 338 that exist fall into exactly these categories: 265 read by the
final line; 53 read by the first line; 12 with first and final verdict lines that agree; 8 refused
because the verdict sits only in the middle — all eight are nana-pi's 2026-10-04 EARS-form batch
reviews (`docs/reviews/ears-form-2026-10-04/batch-*-astra-r*.md`). Total 338. Beyond the ledger,
yokai-world's `docs/reviews` hold 129 first-line-only outputs: 127 plain, two builder reports
(`VERDICT: PARTIAL — <prose>`), none mentioning "verdict" elsewhere. Deliberately UNSUPPORTED shapes,
which record an empty verdict and need a fresh review in a supported shape: the verdict only in the
middle (the eight above; also `~/aml-desk/docs/reviews/slice3-2026-09-16-sol-r2.md:69` and
`~/jev-research/docs/reviews/local-tool-judge-2026-09-19/contract3-astra-r1.md:4`), and prose after
the verdict word (`~/game-world/docs/reviews/design-2026-09-06/round-9.md:17`).

## 2. Requirement delta (FEAT-007 SUB-009; R-969 shared with FEAT-008)

| ID | Change | Text (draft) |
|---|---|---|
| R-969 | reworded | Each completed review shall record as its verdict the verdict word of its selected line — the final non-blank line of its output when that line carries `VERDICT:` not preceded by a letter, digit or underscore, otherwise its first non-blank line — where the final line may carry before the label only whitespace and the marks `#`, `>`, `-`, `*`, `_` and backtick, the first line must begin with `VERDICT: ` and carry no marks, and either may carry after the word one whole-number score written `(n/m)`, `— n/m` or ` n/m`, one trailing `.` (the final line also `,`, `;` or `:` and the marks `*`, `_` and backtick) and whitespace. |
| R-1010 | reworded | IF the selected line is not a verdict line R-969 allows, or the first non-blank line carries `VERDICT:` while the final line is selected and the first line is not a verdict line with the same word, or the first line is selected while the word "verdict" — in any case, after removing invisible format characters and folding look-alike letters — appears on any other line, THEN the review ledger shall record an empty verdict for that review. |

## 3. Scope

**In.** `verdictWord` in `packages/nana-pack/bin/review-round.mjs`; the new
`packages/nana-pack/lib/verdict-config.mjs` holding the look-alike fold table; its tests in
`packages/nana-pack/tests/review-ledger.test.mjs`. Every existing R-969/R-1010 case keeps its
expectation EXCEPT one, changed on purpose: `VERDICT: LAND` followed by a prose line with no verdict
word now records LAND (a plain first-line verdict with notes — yokai's shape). Kept: the look-alike
final label after a first-line LAND stays EMPTY (the folded body now mentions "verdict"). New cases:
first-line plain with and without bare, parenthesised and dash scores; a backtick-quoted or marked
first line → empty; a first line plus a prose correction mentioning "verdict" → empty; first and last
agreeing → the word; disagreeing → empty; a malformed first-line rejection followed by a clean final
LAND → empty; a zero-width character inside a later "VERDICT" → empty; `XVERDICT:` does not carry the
token; the pack README's verdict sentence
(probed against the code); `REQUIREMENTS.md` (the two rows); `HANDOFF.md` and the session entry
(seat, before the final review).

**NOT.** Rewriting the empty verdicts already recorded for yokai-world's nine rounds — records are
history; those revisions were merged by hand and need no land; a new review of a new revision reads
correctly. A per-repo setting for the verdict position (subtraction: both positions are accepted).

## 4. Design

- `F` = final non-blank line, `S` = first non-blank line, `T` = every line carrying the bounded token
  `VERDICT:` (not preceded by a letter, digit or underscore).
- If `F` carries the token: `F` must be a verdict line, else empty; if `S` (a different line) also
  carries the token, it must be a verdict line with the SAME word, else empty — so a malformed or
  disagreeing first-line verdict cannot be overridden by a clean final LAND (sol plan r2:
  `VERDICT: SEND-BACK 4/10 — blockers remain` … `VERDICT: LAND` → empty); else `F`'s word.
- Else: `S` must match the PLAIN first-line form, and no other line may contain "verdict" after NFKC
  normalisation, removing invisible format characters (Unicode category Cf, such as U+200B), folding
  the look-alike table (Greek and Cyrillic capitals and small letters that look like V, E, R, D, I, C,
  T) and lower-casing; else empty; then `S`'s word.
- The look-alike table is one exported constant in a pack configuration module
  (`packages/nana-pack/lib/verdict-config.mjs`, six-tag header), its provenance beside it; the parser
  imports it (no inline vocabulary).
- Declared residual: a reviewer who writes a plain first-line LAND and then rejects in prose without
  the word "verdict" is read as LAND — the same limit the final-line rule has for prose above the
  verdict. A look-alike outside the fold table is not caught.

## 5. Verification

The seat's acceptance cases (first line, last line, both agreeing, both disagreeing, a first-line
verdict with a later correction or quoted verdict, bare and other scores, the land-rule corpus cases);
a corpus regression: the new parser over every readable output the ledger references and every file
in yokai-world's `docs/reviews` must reproduce the corpus counts above exactly (265 / 53 / 12 / 8 of
338) and give the same word a reader sees for every non-empty one; mutation pairs (final-only selection → the yokai case fails; drop the "no other verdict" rule → the
prose-correction case fails; drop the fold → the look-alike case fails; allow marks on the first line →
the backtick case fails; reject the bare score → its case fails).
