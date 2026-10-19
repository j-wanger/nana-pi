# Review — audit-open-questions (the product report lists the requirements ledger's open questions; the ledger records the open 2026-10-09 audit issues), 2026-10-19 (Opus, the lane's one final reviewer)

Feature: FEAT-039 · See the product and its decisions in one report

Review `git diff b8616fb..HEAD` on `feat/audit-open-questions` (main was `b8616fb` when the lane was cut and is `f29827a`
now, after study-stop landed; `git merge-base HEAD main` is `b8616fb`). The plan of record is
`docs/reviews/audit-open-questions-2026-10-19/must-meet.md` (rows R-1570 and R-1571; question 3 closed in place;
questions 13 to 23 word for word), with the adversary's amendments in `plan-attack.md` and the build in
`build-brief-1.md`. The seat's record `seat-verify-6f168dd.md` holds CI, the Windows log beside it.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement b8616fb..6f168dd: 2 rows in 1 features
FEAT-039 · See the product and its decisions in one report
  R-1570 new (implemented)
  R-1571 new (implemented)
```

Judge whether the written page's Decisions view lists every numbered or bulleted entry under the ledger's
`## Open questions` heading, in file order, with its number and its full text across continuation lines, stopping at
the next heading; and whether a ledger with no such heading, or only a preamble under it, still writes the page and
shows the none message. Judge too whether the two new checks would fail if that behaviour were removed, given that the
renderer ships to the page as source and both checks run the written page's own script, and whether questions 13 to 23
and question 3's prefix are the plan's text with no row text changed.

Threat model: honest variation in our tools' output and the OS in scope (CRLF from a Windows checkout, indented
continuation lines, a lettered number such as 6b, bullet entries, a template's preamble line, no open-questions
heading); deliberate forgery of the ledger out, its markup being inert data already (R-1019). Lane class: ordinary — the
report script, its test, ledger prose, the tree outline and count, and the README's report sentence.

Check: (1) the two must-meet checks are not vacuous: each fails with its feature removed (per the builder, W1 to W9 each
turned its named check red); (2) the renderer reads nothing from module scope, the none message lives inside it, and
entries render as text nodes in list items, never as `article` or through innerHTML; (3) the parse reads the normalised
ledger text buildReport already holds, not a fresh read; (4) questions 13 to 23 and question 3's prefix match
`must-meet.md`, and no row text changed; (5) no test writes outside its temp folders; (6) nothing else changed, and the
README, tree and count say what the code does; (7) HANDOFF, its four "Open questions in the report" residual lines and
the session entry are true; (8) any MUST.
