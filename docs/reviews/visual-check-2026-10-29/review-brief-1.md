Feature: FEAT-039 · See the product and its decisions in one report

Lane visual-check. Class: ordinary. Final review, round 1, of the branch tip against main.

Threat model: honest variation in our tools' output is in scope (a page that renders differently, a reference folder with odd files, a judge answer in an unexpected shape, a missing roster entry or browser). Deliberate forgery of shots, manifests or judge answers is out.

The plan of record is `docs/reviews/visual-check-2026-10-29/plan.md`; the attack is `plan-attack.md`. Rows R-3140 to R-3148, and R-1140 (the seat guide now has fifteen rules).

What the lane does: `first-look --page url --reference --spec` captures a page beside reference frames; `visual-reader` sends them with the numbered art spec to a cold Claude Code launch of the roster reviewer and prints pass or fail per line. The seat guide's new rule makes the seat run it, or judge side by side itself, before showing the owner referenced shots.

The seat's acceptance runs, outside git, on build 1 (commit 8c836523):
- `--control` on the 3dmk reference frames: pass, five lines pass, the phone line unjudged (no phone reference), verdict "holds up".
- hive build 1 (the page the owner called "ai slop"): fail, six of six lines, verdict "reads as a demo against the reference".
- hive build 2 (the replication): five lines pass, the phone line fails, verdict "holds up".

Known departure: the first-look config copies the hive background as a literal until hive-render lands; it is a known bug line.

Question: does the feature work for its user, the seat, and does the change cause a harm the review standard lists? Pay attention to the cold launch's isolation (flags, tools, working folder, what reaches the child), the refusal paths, and that the outside reader still behaves the same after its helpers moved into `scripts/reader-common.mjs`.
