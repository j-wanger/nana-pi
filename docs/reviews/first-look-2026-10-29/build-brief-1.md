Feature: FEAT-039 · See the product and its decisions in one report

Lane first-look. Class: ordinary (`node scripts/lane-class.mjs --root . --files` on the planned files prints `ordinary`). Builder: pi-worker (small lane). Build session 1.

Work in the lane worktree on feat/first-look, based on main with pi-seat-guide merged. The plan of record is `docs/reviews/first-look-2026-10-29/plan.md`. Read it whole, and read `plan-attack.md` beside it. The plan has no list of allowed edits.

What the lane does, in one sentence: one command takes before and after screenshots of the product page (or two running desks) at phone and laptop width, so the seat can show the owner a change after build 1.

Build must-meets 1 to 4 and the sealed list of page-shaping files. New requirement rows take IDs from R-3040. The guide's new bullet must keep every sentence the seat-rule tests pin; R-1140 and `seat-rule.test.mjs` move from twelve rules to thirteen.

Tests use a fake browser seam and a fake report runner; no test launches a real browser. After the suite is green, run the command once for real (`npm run first-look -- --page product --out <a temp dir outside the repo>`) and report what it printed and which files it saved. If no browser is found, report the one line it printed.

Numbers that must not move: the seat guide's existing pinned sentences; the product page's own output.

Run the locked full suite as a plain foreground command with its output on screen, not redirected to a file and not in the background. Another lane's suite may hold the machine-wide lock; waiting for it is expected.

## Done when

Each row is `implemented` with backticked `file::title` evidence. The locked full suite (`npm run test:locked`), `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs` are green.

Report: each must-meet's test title; the real run's output; the sealed file list with its provenance; each departure from the Precedent below; every existing test you changed.

## Precedent

- `apps/desk/test/rail-collapse.e2e.mjs`: how the repo loads Playwright and starts a desk on a free port.
- `scripts/product-report.mjs`: the report build, run as a child process at each checkout.
- `scripts/lane-class.mjs`: how a script reads a lane's changed files against main.
- `packages/nana-setup/claude/rules/nana-seat.md`: the seat guide, where the bullet goes.
- `packages/nana-setup/tests/seat-rule.test.mjs`: the guide's rule count (R-1140).
