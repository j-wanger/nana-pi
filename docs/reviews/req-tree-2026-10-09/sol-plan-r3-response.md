# Seat response to sol plan review r3 (LAND-WITH-FIXES, 8/10) — the last round under the cap

The fixes below are sol's own "smallest fix" in each case, applied by the seat; no fourth round.

| Finding | Verdict | Change |
|---|---|---|
| MUST 1 — the new package script and `scripts/` file fail the README check, while READMEs are out of scope | Accepted (verified: `templates/typescript/template/scripts/readme-check.mjs:531-543` documents every package script and every `scripts/` file) | Root `README.md` joins the allowlist for one entry naming `npm run req:tree` and `scripts/requirements-tree.mjs`, beside the existing `req:rows` entry; the NOT list now excludes only other README edits. |
| MUST 2 — R-291 checks freshness, not the outline's contents | Accepted | R-291 now names the fields: every heading's ID, label, purpose, parent, row count and row IDs. Fixture mutations omit or alter each field in turn. Fixed text: "R-287 to R-290 check the structure; R-291 keeps the outline current." |
| SHOULD 3 — "one-line diff" overstates; a moved row changes two lines | Accepted | "Compact diff" throughout. |
| SHOULD 4 — keep the generated outline, no manifest; sol withdraws the pinning MUST and recommends "visible, not pinned" to the owner | Noted | Recorded in CHANGE §7 decision 4. |
