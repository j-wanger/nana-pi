# Change declaration — read the verdict from the first or the last line

*Lane `verdict-position` · branch `feat/verdict-position` · worktree `~/nana-pi-wt/verdict-position`,
based on `main` at `0818b72` · 2026-10-11. Feature: FEAT-007 SUB-009 (R-969, R-1010; R-969 is shared
with FEAT-008). URGENT: every land in yokai-world is refused. Order: why → plan → sol plan review (item
`verdict-position-plan`) → build → seat verification → sol build review → astra land review → Jake
accepts.*

## 1. Why

Jake relayed another session's report (2026-10-11): "I merged by hand. The merge helper refused,
because the review tool logged no verdict for any round. … That is a toolkit fault to fix."

The land rule (merged `0818b72`) made `verdictWord` read ONLY the output's final non-blank line and
accept a score only as `(n/m)` or `— n/m`. yokai-world's reviewers write the verdict on the FIRST line
with a bare score (`VERDICT: LAND 9/10`) and end with notes. Since the merge every yokai-world round
(nine, four items) recorded an empty verdict, so `nana-land` refuses them all (R-1004, R-1011), and
the session merged by hand. The land-rule grammar was built from a scan of review endings in three
repos; yokai-world was not among them. A scan of every repo's review outputs referenced by the review
ledger (seat, 2026-10-11) finds real outputs put the verdict on the first line, the last line, or
both — never only in the middle — and 41 verdict lines use the bare `n/m` score.

**Observable outcome.**
1. A review whose final non-blank line carries `VERDICT:` is read from that line, as today.
2. Otherwise a review is read from its FIRST non-blank line, when that line is a verdict line and no
   other line carries `VERDICT:`.
3. A score may be written `(n/m)`, `— n/m` or ` n/m`.
4. Everything else still fails closed with an empty verdict: a malformed selected line, a first-line
   verdict with another `VERDICT:` line anywhere, or first and last verdict lines that disagree.

## 2. Requirement delta (FEAT-007 SUB-009; R-969 shared with FEAT-008)

| ID | Change | Text (draft) |
|---|---|---|
| R-969 | reworded | Each completed review shall record as its verdict the verdict word of its selected line — the final non-blank line of its output when that line carries `VERDICT:`, otherwise its first non-blank line — where a verdict line allows before the label only whitespace and the marks `#`, `>`, `-`, `*`, `_` and backtick, and after the word one whole-number score written `(n/m)`, `— n/m` or ` n/m`, one trailing `.`, `,`, `;` or `:`, whitespace, and the marks `*`, `_` and backtick. |
| R-1010 | reworded | IF the selected line is not a verdict line, or the first line is selected while another line carries `VERDICT:`, or the first and final non-blank lines are verdict lines with different words, THEN the review ledger shall record an empty verdict for that review. |

## 3. Scope

**In.** `verdictWord` in `packages/nana-pack/bin/review-round.mjs`; its tests in
`packages/nana-pack/tests/review-ledger.test.mjs` (every existing R-969/R-1010 case still holds, plus
the new first-line, bare-score, both-lines and fail-closed cases); the pack README's verdict sentence
(probed against the code); `REQUIREMENTS.md` (the two rows); `HANDOFF.md` and the session entry
(seat, before the final review).

**NOT.** Rewriting the empty verdicts already recorded for yokai-world's nine rounds — records are
history; those revisions were merged by hand and need no land; a new review of a new revision reads
correctly. A per-repo setting for the verdict position (subtraction: both positions are accepted).

## 4. Design

- `F` = final non-blank line, `S` = first non-blank line, `T` = every line carrying the bounded token
  `VERDICT:` (not preceded by a letter, digit or underscore).
- If `F` carries the token: `F` must be a verdict line, else empty; if `S` is also a verdict line with
  a different word, empty; else `F`'s word.
- Else: `S` must be a verdict line and `T` must be exactly `[S]`, else empty; then `S`'s word.
- Declared residual: a look-alike label on the final line (for example a Greek `Ε`) does not carry the
  token, so a first-line verdict then decides; reviewers are our own models, so this needs deliberate
  forgery.

## 5. Verification

The seat's acceptance cases (first line, last line, both agreeing, both disagreeing, a first-line
verdict with a later correction or quoted verdict, bare and other scores, the land-rule corpus cases);
a corpus regression: every review output the ledger references, read by the new parser, compared with
the verdict a reader sees (the single verdict line, or the final one) — zero disagreements, each
exception named; mutation pairs (final-only selection → the yokai case fails; drop the `T == [S]` rule →
the later-correction case passes LAND and fails; reject the bare score → its case fails).
