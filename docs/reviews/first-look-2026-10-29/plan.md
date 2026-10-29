# first-look · plan (seat, 2026-10-29)

Feature: FEAT-039 · See the product and its decisions in one report

The seat wrote this plan from `$HOME/nana-pi/packages/nana-pack/prompts/planner.md`. One adversary attacked it (`plan-attack.md` beside it: 2 MUST, 4 SHOULD, 3 NOTE); the seat took all of them. Plans get no review round.

## Purpose

The owner picked reading 1 for his top idea "First-look screenshots at build one" (2026-10-29: "C 1, product and desk make sense"). The idea: the agent uses the product the way the owner does and hands him what it saw, so he judges a change by looking at it. A seat-run screenshot walk on 2026-09-17 caught his first two complaints before he sat down, but it stayed a desk test tool. With this lane, on any lane that changes the product page or the desk, the seat takes before and after screenshots at phone and laptop width after build 1. It sends the owner one card asking "is this the shape?" before the review rounds.

## Assumptions (any may be wrong)

- A1. Playwright is the browser. A lane worktree has no `node_modules`, so the command looks in `PW_ROOT`, then its own require chain, then the main checkout, and degrades with one line when none has it or the browser binary is missing.
- A2. The product page's before and after come from building the report at main and at the lane tip. While the desk stays frozen, the desk path is only `--before <url> --after <url>` against two desks the seat starts by hand; desk file detection and starting desks wait until the owner reopens it.
- A3. Playwright's `ariaSnapshot()` gives the accessibility tree the idea asks for, so no stand-in is needed.

## Open choices

- O1, decided: the command saves the shots and the diff outside git, in the seat's scratch folder, and the seat points the owner to them; a Claude Code seat may also send them as files.

## Questions for the owner

None.

## Threat model

In scope is honest variation: no browser installed, a page that fails to load, a lane that changes no page, a view that differs only in its commit line, phone and laptop widths. Deliberate forgery is out. A finding outside this model is a residual.

## Precedent

- `apps/desk/test/rail-collapse.e2e.mjs`: how the repo loads Playwright and starts a desk on a free port.
- `scripts/product-report.mjs`: `generateReport`, to build the page at two revisions.
- `packages/nana-setup/claude/rules/nana-seat.md`: the seat guide, where the step goes.
- `scripts/lane-class.mjs`: how a script reads a lane's changed files against main.
- `packages/nana-setup/tests/seat-rule.test.mjs`: the guide's rule count (R-1140).

## Outside precedent

- Playwright, Apache-2.0, `adopt`: the browser driver already used by the desk's e2e tests.
- Percy and Chromatic-style visual review, proprietary, `skip`: hosted visual-diff services; the owner asked for shots he looks at, not a hosted diff tool.

## Must-meet

Rows from R-3040. Each check carries its `// req:` marker directly above it.

1. **One command takes the shots.** `npm run first-look -- --page product --out <dir>` builds the page twice: from a temporary worktree of main, running that checkout's own `scripts/product-report.mjs` as a child process, and from the working tree the same way. It saves four screenshots of the landing view, before and after at 380 px and 1280 px, and one accessibility-tree diff covering every view, with the commit, date and working-tree lines left out. `--page desk --before <url> --after <url>` does the same for two running desks.
2. **It says when there is nothing to show.** The files that shape the page are one sealed list with provenance (the renderer, its template and the report's own modules; not REQUIREMENTS.md or HANDOFF.md, which nearly every lane touches). When the lane changes none of them against main, the command prints one line saying so and saves nothing.
3. **It degrades without a browser.** With no Playwright or no browser binary, it prints one line naming how to install it and exits 0.
4. **The seat guide says when.** The seat guide gains one bullet: "On a lane that changes the product page or the desk, run `npm run first-look -- --page product` (or `--page desk`) after build 1, save the shots outside git, and point the owner to them with one question: is this the shape?" R-1140 and `seat-rule.test.mjs` move from twelve rules to thirteen, and the check pins the sentence. This lane builds after pi-seat-guide lands, since both edit the guide.

Tests use a fake browser seam and a fake report runner; no test launches a real browser. That pins the plumbing only; the seat's first real run is the evidence that the page renders.

## Class and size

- Class: ordinary. `node scripts/lane-class.mjs --root . --files` on the script, the seat guide and package.json prints `ordinary`.
- Size: small.
