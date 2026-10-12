# Review — the verdict reader, 2026-10-11 (reviewers: gpt-5.6-sol build review and gpt-6-astra land review, in parallel)

URGENT: since the land rule merged, every yokai-world land is refused — its reviewers write the
verdict on the FIRST line with a bare score, and the reader took only the final line.

Review `git diff 0818b72..HEAD` on `feat/verdict-position` (current `main`, `0110601`, is merged in;
the main side of that merge is already reviewed — judge this lane's own changes): the plan
(`CHANGE.md`; sol plan r1–r4, LAND 10/10 at r4), the seat's prototype (`seat-proto.mjs`) and corpus
(`corpus-2026-10-11.json`), the builds (`build-brief-1.md`, `build-brief-2.md`, the two builder
reports), the seat's acceptance script (`seat-verify-verdict.mjs`: 64 cases + 414 corpus files),
title check and mutation runner (`seat-mutate.py`, 14/14 red; outputs committed), and the seat's
`HANDOFF.md` lines and session entry, written for the merged state.

Check: (1) `verdictWord` in `packages/nana-pack/bin/review-round.mjs` against CHANGE §4 — detection
on the canonical form, acceptance on the raw line, both branches; look for any output a reviewer
could write in which a rejection records LAND, beyond §4's declared residuals, and for any real
shape in the corpus the reader now refuses; (2) R-969 and R-1010 — one `shall` each, the clause each
cited test pins; (3) `packages/nana-pack/lib/verdict-config.mjs` (header, provenance, no inline
vocabulary); (4) the pack README's verdict paragraph — probe its examples against the code; (5) the
HANDOFF lines and session entry are true; (6) anything that should block the merge. Run the seat
scripts if useful (from the repo root; the corpus run needs `~/yokai-world/docs/reviews`). Rare cases
may be named as residuals.

Answer with the full review as your final message: MUST / SHOULD / NOTE with file:line, evidence and
the smallest fix; score; last line exactly one of `VERDICT: LAND`, `VERDICT: LAND-WITH-FIXES`,
`VERDICT: SEND-BACK`.
