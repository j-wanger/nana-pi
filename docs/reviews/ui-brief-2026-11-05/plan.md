# Plan: ui-brief (2026-11-05)

Revision 2. The adversary's attack, `plan-attack.md` beside this plan, is taken in full: 3 MUST, 1 SHOULD, 1 NOTE.

Lane: `ui-brief`, worktree `~/nana-pi-wt/ui-brief`, branch `feat/ui-brief` from main `efcd1329`.

Lane class: `node scripts/lane-class.mjs --root . --files packages/nana-setup/claude/rules/nana-seat.md,docs/ui-brief-template.md` printed `ordinary`. One final reviewer, the roster's reviewer.

## Purpose

Agreed reading: the owner picked option A on 2026-11-05, through the laptop seat, after u7: "rule only — the template goes into nana-pi as a doc, plus one seat-rule line (UI lanes follow it; seat picks by default, owner stars when he wants a say; library link in the doc)".

Evidence behind the template comes from the laptop seat's UI experiments u1–u7, run 2026-11-04 and 2026-11-05.
- Neither a judge model's taste nor written audience text moved build quality.
- Looked-at reference images did move it.
- In u7, a fresh picker following the template, on a different page shape, produced builds the owner rated good. The template transferred.

## Assumptions

- A1. The doc is the laptop seat's template at its commit b61719e. It's adapted only to stand alone in this public repo:
  - experiment numbers become one evidence paragraph;
  - the library's metadata file, which lives in the laptop seat's project, is described rather than linked by path;
  - no owner name, and no work references.
- A2. The library link is a private claude.ai artifact URL. Only the owner and the people it's shared with can open it. Committing the URL exposes nothing else.
- A3. No reference image or capture enters git. The pages belong to their makers.
- A4. The new bullet goes after the visual-reader bullet (RULE_15), because it applies to the same lanes: pages a person looks at.

## Open choices

- O1. The builder chooses the doc's wording, within the writing rule and the content A1 lists.

## Questions for the owner

None.

## Feature

Feature: FEAT-039 · See the product and its decisions in one report

## Threat model

Honest variation is in scope: a seat that skips the template, a doc path that moves, or the rule and the doc drifting apart. Deliberate forgery is out.

## Precedent

- `packages/nana-setup/tests/seat-rule.test.mjs`: the bullet constants, the exact-once checks and the closed list. The visual-check lane (docs/reviews/visual-check-2026-10-29) added RULE_15 the same way.
- `packages/nana-setup/claude/rules/nana-seat.md`: the guide that gets the bullet.
- `docs/lane-brief-template-2026-09-28.md`: an existing brief-template doc in docs/.
- `packages/nana-pack/lib/rulings-config.mjs`: SEAT_GUIDE_READ_CAP is 8192. The guide is 5379 bytes, and about 5.8 KB after this lane.

Map search ("seat guide rule", "brief template doc"): steps.mjs and state-manifest.mjs link the guide unchanged; nana-rulings.ts injects the whole file under the cap. Nothing else reads the guide's bullet list.

Literals this change breaks:
- "sixteen" in R-1140 and in seat-rule.test.mjs's comment;
- the RULES list.

## Outside precedent

none: a design-brief standard of this kind has no open-source project to borrow from. I looked at BackstopJS, already skipped in visual-check, and found no brief-template project.

## Must-meet

1. **R-3161: the seat guide carries the UI-brief rule exactly once.** A new constant RULE_17 joins RULES in seat-rule.test.mjs, and the closed-list check still passes.
   - The bullet: on a lane that builds or reshapes a page a person looks at, the seat writes the build brief from `$HOME/nana-pi/docs/ui-brief-template.md`, named by that absolute form because the guide runs in every project (attack M2).
   - The seat picks references by default. The owner's starred references from the library replace them when the owner wants a say.
   - R-1140 becomes "seventeen original rules and R-3536's role-launch rule", and the comment's "sixteen" follows (attack N5).
2. **R-3162: the template carries the working parts.** The test reads `docs/ui-brief-template.md`; the path comes from RULE_17 with `$HOME/nana-pi/` mapped to the repo root, not from a second literal. Checks match case-insensitive key phrases, not whole sentences (attack S4). It checks that the doc names:
   - both modes, "seat picks" and "owner picks";
   - the exact library link `https://claude.ai/artifact/TqVYBrbms8gRvnS5sqtzce`;
   - picking by looking at captures, with "captur" and "look";
   - the builder handoff, where reference images go to the builder, who opens them before designing (attack M1);
   - that the award is "for the captured page";
   - that images stay "out of git".
3. **R-3163: the template's gates stay within the lane's own spec** (attack M3). It checks that the doc:
   - frames its defect gate as the lane's spec checks plus horizontal scroll at phone width and contrast;
   - says "no network" applies only where the lane's spec asks for an offline page;
   - calls the anchored owner rating a recommendation, not a land requirement.
   The test checks the phrases "only where" with "offline", and "recommend" near "anchor".

## Files to change

- `docs/ui-brief-template.md` (new)
- `packages/nana-setup/claude/rules/nana-seat.md`
- `packages/nana-setup/tests/seat-rule.test.mjs`
- `REQUIREMENTS.md`: R-1140's count, plus R-3161, R-3162 and R-3163 under FEAT-039
- `HANDOFF.md`: one line, with the session note before the final round
