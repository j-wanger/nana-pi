Feature: FEAT-039 · See the product and its decisions in one report

Lane page-on-pages. Class: ordinary. Builder: pi-worker (small lane). Build session 3.

Work in the lane worktree on feat/page-on-pages at fa17c979. The plan of record is `docs/reviews/page-on-pages-2026-10-28/plan.md`. Build 2 fixed every point of `seat-check-0867e56e.md`. The seat's check of build 2 found three more; fix them. Do not edit `docs/known-bugs/` or `HANDOFF.md`.

1. **Restore R-1014's Parked line.** Build 2 deleted it (`REQUIREMENTS.md:2248`). The page's Overview now shows "Deliverables code does not make and read: 1 · parked: 20" with R-1014 listed, where main shows 0 gaps and 21 parked. The plan's must-meet 7 keeps R-1014 parked. Keep build 2's new Read by line. Restore the Parked line as main has it: `Parked: R-1014 · since 2026-10-23: the local land copy has no code reader; a session-start line that consumes that copy deletes this line`. The Overview then shows 0 gaps and 21 parked again.
2. **Draw the issue notice only in Decisions.** Build 2 also drew it at the top of the `#issues` view, which lists violated rows (`scripts/product-report.mjs:533`). Remove that line. The R-2984 check pins the drawn Issues paragraph in `#decisions` instead.
3. **No empty Ask line on an issue ask.** `paragraph(card, "Ask", ask.body ?? "")` now draws "Ask: " under every issue ask. A list ask keeps main's Ask line, even when empty (R-2983). An issue ask, which has a URL and no body, draws no Ask line. Pin both in the existing R-2981 and R-2983 checks.

Run the locked full suite as a plain foreground command with its output on screen, not redirected to a file and not in the background. Another lane's suite may hold the machine-wide lock; waiting for it is expected.

## Done when

Rows R-2980 to R-2986 stay `implemented` with backticked `file::title` evidence. The locked full suite (`npm run test:locked`), `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs` are green. `node scripts/product-report.mjs --out <scratch file>` on this repo gives an Overview with 0 deliverable gaps and 21 parked.

Report: each fix and the check that pins it; the Overview gap line from that run; each departure from the Precedent below with its reason; every existing test you changed.

## Precedent

- `REQUIREMENTS.md` on main, line 2249: R-1014's Parked line.
- `scripts/product-report.mjs` on main, line 443: the list-ask drawing.
- `packages/nana-pack/tests/product-report.test.mjs`: the R-2981, R-2983 and R-2984 checks build 2 wrote.
