Feature: FEAT-040 · Make and keep memory

Lane memory-making. Class: ordinary. Builder: pi-worker (small lane). Build session 2, on this branch's tip.

Build 1 is done and green. Two changes before the final review.

1. Row ID clash. This lane holds rows R-3188 to R-3209; build 1 also used R-3210, which belongs to lane context-anatomy. Renumber R-3210 to R-3250 everywhere it appears (REQUIREMENTS.md, `req:` markers, docs, generated tree and map). Keep every other row number.

2. Shape notes from lane owner-profile, which imports this lane's record shape (its plan, `docs/reviews/owner-profile-2026-10-31/plan.md` on `feat/owner-profile`, section "Notes for lane memory-making"). In `packages/nana-pack/lib/memory-making-config.mjs`:
   - export one `SOURCE_WORDS` list, `['extracted', 'saved']`; this lane's tests pin only `extracted`;
   - document that seat-saved evidence takes the form `seat:<runtime>:<session key>:<date>` and resolves to the record's own `quote`; make `resolveEvidence` return the record's quote as resolved for that form, not `missing`;
   - document that stored `trust` and `invalidAt` are values at write time; effective state comes from a later reader;
   - export the user kind words once: `correction`, `decision`, `preference`, `fact`, `thinking`; this lane's maker still emits only `correction` and `decision` for user candidates.
   One new must-meet is allowed for the seat-evidence form, under a row in this lane's range.

The seat's real-data scoring run, for the record (counts only, labels made blind by a separate agent): correction recall 8/46, decision recall 119/162, lesson recall 56/56, precision 183/310, unlabelled 0. The rules miss the bar; a model-shaper lane follows. Do not change the maker's rules in this build.

## Done when

Rows `implemented` with backticked evidence. Green: locked full suite (foreground), `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check, `node scripts/identity-scan.mjs`. Push and report the finished CI run for the new tip.

## Precedent

- `packages/nana-pack/lib/memory-making-config.mjs`: the shape module this build extends.
- `packages/nana-pack/lib/memory-making.mjs`: `resolveEvidence`.
