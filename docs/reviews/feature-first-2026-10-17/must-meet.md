# feature-first — the working rules say feature-first development (seat plan, 2026-10-17)

**The feature.** The owner ruled on 2026-10-17 that nana moves from chasing bug-free lanes to feature-first development.
This lane writes that ruling into every rule a seat, a builder or a reviewer reads, so a fresh session in any project
works the new way. Per feature, the seat and one adversarial agent write only the must-meet tests; the builder builds to
them; plans get no review round; a reviewer sends back only for a bug that blocks the feature or a harm-list item (data
lost or corrupted, a write outside the lane's folder, a broken install or hook, a regression of what main does today);
every other finding is a known bug, fixed when someone hits it or next works on its feature; an ordinary lane gets one
final reviewer, and an install, hook or gate lane keeps two reviewers, the seat's wrong-code pairs and one independent
check.

**Lane class: ordinary** (rule text and the tests that pin it; no install, hook or gate code changes). One final
reviewer. It touches `packages/nana-setup/` rule files, so the install check runs before the land. Threat model: honest
variation in our tools' output in scope; deliberate forgery out. Builder: the small-lane builder, every test named.

## The text (verbatim; the builder copies it)

**T1 — the review standard, first paragraph** (`packages/nana-pack/prompts/review-standard.md` line 1, replaced):
> Classify each finding MUST, SHOULD or NOTE. A MUST is one of these: a must-meet test the brief names that is missing, or that still passes with the feature removed; a bug that stops the feature's main use the brief names, on a platform the brief names; or one of these harms under the brief's threat model: data lost or corrupted, a test, build step or seat script that writes outside the lane worktree or the OS temp folder (a product command writing where its contract says, such as install into the home folder, is not this harm), a broken install or hook, or something main does today that the brief does not set out to change no longer working. Name the realistic input and the consequence; if you cannot name both, the finding is a SHOULD or NOTE. Edge cases, contrived inputs, wording, citation bookkeeping and tests that miss a clause are SHOULD or NOTE; the seat records them as known bugs, fixed when someone hits one.

**T2 — the shared working pattern** (`templates/_shared/working-under-nana-pi.md`; nana-pi's `AGENTS.md` region is
regenerated from it):
- "Review ladder" bullet, replaced:
  > - Review ladder: an ordinary lane gets one final reviewer, the roster's reviewer. An install, hook or gate lane also gets the land reviewer, the seat's wrong-code pairs and one independent check. An install, hook or gate lane changes nana-setup install, uninstall or doctor; a Claude Code hook or a pi extension; the nana-gate policy; or the land and review tools (`nana-land`, `pi-review`, `review-round`). Every other lane is ordinary. Maximum three rounds per item; a different model lineage reviews the work. The final review must cover the exact tip that will land; every later commit needs its own accepted review coverage.
- "Plans" bullet, replaced:
  > - Plans: a lane is one feature. The seat and one adversarial agent write its must-meet tests, about three to eight, one requirement row each, and the builder builds to them. Every plan names its threat model: honest variation in our tools' output is in scope, deliberate forgery is out, and a finding outside the model is a residual. Plans get no review round. Urgent fixes ship alone and are hardened in a later lane. Once every reviewer says LAND, nothing more is edited.
- "Review bar" bullet: after "so its briefs state the threat model and lane class but not the bar." insert
  > A reviewer sends back only for a bug that blocks the feature or a harm the standard lists; every other finding is a known bug, recorded in HANDOFF's residuals and fixed when someone hits it or next works on its feature.
- "Seat land review" bullet: "when the roster sets no land model" becomes "in an install, hook or gate lane, when the
  roster sets no land model". `packages/nana-setup/claude/rules/nana-soul.md` carries the same bullet byte for byte.

**T3 — the seat guide** (`packages/nana-setup/claude/rules/nana-seat.md`), bullet 5 replaced:
> - In an install, hook or gate lane, re-run the lane's mutation runner after any change of your own to code or tests, before the review.

**T4 — the builder preamble** (`packages/nana-pack/prompts/builder-preamble.md`): after "Follow requirement diff →
tagged tests → code." add
> - Write the must-meet tests your brief names and no other new test, except the one test that pins each new sealed tunable. Edit an existing test only where your change makes it false, and list each such edit in your report.

and delete the "Fix the class…" line. The CRLF line stays: line endings are the Windows priority's live failure class.

**T5 — the standards and the requirements skill.**
- `packages/nana-setup/claude/rules/nana-standards.md`, "Requirement first": the first bullet becomes
  > - New behaviour starts as a feature and its must-meet tests, about three to eight: what the feature must do for its user. Each must-meet test gets one requirement row, written no wider than the test. IDs are stable — never renumbered, never reused; a removed requirement keeps its ID as `retired`.

  the second bullet ("Then the tests, …") becomes
  > - Then the tests: the must-meet tests your brief or plan names and no other new test, except the one test that pins each new sealed tunable; each carries its `req:` marker directly above the test call. Then the code.

  and the third bullet becomes
  > - A row flips to `implemented` when its test passes. A `violated` row carries its residual.
- "Status honesty", the second bullet becomes
  > - Every land gets an independent reviewer whose question is: does the feature work for its user, and does the change cause a harm the review standard lists?
- `packages/nana-pack/skills/requirements/SKILL.md`: §1 step 1's "Add a row, split a row that now carries two clauses,
  retire a row the change removes." becomes "Add one row per must-meet test, written no wider than the test; retire a
  row the change removes." §2's opening and its first two bullets become
  > Before you flip a row to `implemented`, its test passes and the row says no more than the test checks. Write the row from the test, not wider; a row wider than its test is an overclaim, and the fix is to narrow the row.

  and its "Mutation is the cheap proof" bullet becomes "In an install, hook or gate lane the seat also breaks the code
  and watches the cited test go red." §6's first paragraph becomes
  > **Every land gets an independent reviewer** who reads the diff and asks: does the feature work for its user, and does the change cause a harm the review standard lists? Rows written no wider than their tests keep the ledger honest without a clause-by-clause audit.
- Root `README.md` lines 51–52: "before a row is flipped to `implemented` somebody has to name the clause each cited
  test pins, and an independent reviewer asks exactly that" becomes "a row is written no wider than its test, and an
  independent reviewer checks every land".
- `templates/_shared/OBJECTIVE.md`: "contracts get an independent review before code" becomes "must-meet tests come
  before code".

**Carried known bug fixed here:** the pack README's mutation runner section says exit 0 means every pair turned RED;
the runner returns 0 with survivors. The line becomes: exit 0 means the run completed, and the RESULT line counts the
survivors.

## Rows

| ID | Change | Text |
|---|---|---|
| R-1101 | reworded | The shared working pattern shall say that plans get no review round. |
| R-1108 | reworded | The review standard shall define a MUST as a bug that stops the change's feature working for its user, or a harm from its listed set. |
| R-1110 | reworded (count) | as now, with the preamble's rules list changed per T4 |
| R-1127 | reworded | The shared working pattern shall say that in an install, hook or gate lane with no land model the seat writes its land review as `seat-land.md` before the final round, and that the independent slice review still covers every land. |
| R-1140 | reworded (list) | as now, with bullet 5 per T3 |
| R-1300 | added | The shared working pattern shall give an ordinary lane one final reviewer, and an install, hook or gate lane the land reviewer, the seat's wrong-code pairs and one independent check as well. |
| R-1301 | added | The coding standards and the requirements skill shall write one requirement row per must-meet test, no wider than the test, and ask every land's reviewer whether the feature works for its user. |

## The must-meet tests

- **FF1 (R-1108).** The review standard holds T1's MUST sentence, including the missing-or-empty must-meet test clause,
  its four harms and its known-bug sentence; it no longer holds "wrong output someone acts on" or "a security or review
  boundary bypassed".
- **FF2 (R-1101, R-1300).** The shared file holds T2's ladder sentences, the lane-class definition and "Plans get no
  review round"; it no longer holds "plan-review round" or "only a named fail-open bug reopens the plan".
- **FF3 (R-1127).** The shared file's seat land review bullet holds "in an install, hook or gate lane, when the roster
  sets no land model" (R-1128 already keeps nana-soul's copy byte for byte alike).
- **FF4 (R-1140).** The seat guide's ten bullets match the new list, bullet 5 per T3.
- **FF5 (R-1110).** The builder preamble's rules match the new list per T4: the must-meet line with its seal-test
  exception is there, and "Fix the class" is gone.
- **FF6 (R-1301).** nana-standards holds T5's three bullets, the builder line with its seal-test exception included, so
  a Claude Code builder that never reads the preamble gets it; the requirements skill holds T5's sentences; neither holds
  "name the clause each cited test pins" or "A row is the weakest of its clauses" / "A row's status is the weakest of
  its clauses".

Existing checks that change with the text: `review-standard.test.mjs` (R-1107/R-1108), `templates-render.test.mjs`
(R-1101, R-1104, R-1127, R-1128, R-683), `seat-rule.test.mjs` (R-1140), `worker-lane.test.mjs` (R-1110),
`skills-and-standards.test.mjs` (the 80-line limit), `project.test.mjs` (the OBJECTIVE seed, compares against the file).

## Known limits (recorded, not tested)

A machine whose reviewer seed predates this lane keeps its seed's plan section (the seed is written only when absent).
Other projects' `AGENTS.md` regions change only when `nana-setup project` runs there again; their Claude rules change at
once through the links on macOS and Linux, and on Windows at the next install. Dated HANDOFF and session lines that
describe the old process stay as history; the lane's HANDOFF notes mark the 2026-10-11 plan-review line and the
2026-10-13 review line superseded, and rename the queued "feature-oriented development" item (briefs and reviews per
feature in the tree) so it is not mistaken for this ruling. The pi reviewer seed still asks for edge cases in its plan
section; a pi seat that uses it as the adversary gets them back. The seat's shared memory notes on the old process are marked superseded by
the seat, outside the repo.

## The adversary's points and their disposition (`adversary.md`)

Taken: the builder line in the standards with the seal-test exception (FF6); the HANDOFF supersede marks (notes); FF3
narrowed to the new phrase; the write-harm bound; the MUST for a missing or empty must-meet test, the bounded main use
and platform, and the regression wording (T1, FF1); the lane-class definition (T2, FF2); the T4 rewrite. Kept against
the adversary: the CRLF preamble line stays (taken, its point 2.1); the mutation-runner README fix rides along because
this lane is based on main after that lane lands. Recorded as a known limit: the pi reviewer seed's edge-case wording.
