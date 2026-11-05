# Review brief 1: ui-brief

Feature: FEAT-039 · See the product and its decisions in one report

Lane class: ordinary. Threat model: honest variation in scope (a seat skipping the template, a moved doc path, the rule and the doc drifting apart); deliberate forgery out.

Review the branch `feat/ui-brief` from main `efcd1329` to its tip. The plan is `docs/reviews/ui-brief-2026-11-05/plan.md` (revision 2, with the adversary's attack beside it), and the builder's report is `build-report.md` in the same folder.

The owner's pick was option A, rule only: the UI brief template becomes a nana-pi doc (`docs/ui-brief-template.md`), plus one seat-guide bullet that points to it. Seat picks are the default; the owner's starred library references replace them when the owner wants a say.

Question: does the change do that for its user, a seat writing a UI lane brief in any project, and does it cause a harm the review standard lists? Check in particular:
- the bullet resolves from other projects;
- the doc stands alone in a public repo;
- the gates don't widen beyond each lane's own spec;
- R-1140, R-3161, R-3162 and R-3163 match their tests.
