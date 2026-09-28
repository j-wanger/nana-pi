# Review brief — lane U round 2 of 3 (gpt-5.6-sol) — confirm the r1 fold

Your r1 (`u-sol-r1.md`) BLOCKed with 1 HIGH, 1 MED, 2 LOW. The seat folded (commit `6b6b430` on `lane/pi-upgrade-0.87`, worktree `~/nana-pi-wt/u`; full diff vs main: `u-r2.patch`):
- HIGH (research/ addendum vs NOT-list): seat RULING — the addendum is intended; nana-pi AGENTS.md says to append dated addenda to `research/pi-landscape-2026-09-01.md` when pi facts drift. The brief's NOT line was the seat's error; the lane template now requires the NOT-list and allowlist to be checked for overlap before launch. The hunk stays.
- MED: pack README now names 0.87.1 as the tested host and marks the skill-trust claim as verified on 0.84.4 only; desk README example says 0.87.1; root README rows say "≥ 0.84.4 (tested on 0.87.1)".
- LOW wording: desk README says default-TUI parity, cache-warm notices only behind `showCacheMissNotices`, hidden unconditionally by deliberate choice.
- LOW test: `pi-087-entries.test.mjs` now appends a `context_edit` as pi's actual leaf after the usage leaf and asserts the branch ends there (11/11 pass; seat ran it).

Seat-verified: `npm test` → 56 files, 2399 checks, exit 0 on pi 0.87.1.

Judge only: (1) each r1 finding FIXED / PARTIAL / NOT FIXED with the line; (2) any NEW defect in the fold; (3) residuals to carry to the land (the seat will restart the live desk service at land and document the study re-pin path). ≤40 lines. End with `VERDICT: LAND` or `VERDICT: BLOCK`.
