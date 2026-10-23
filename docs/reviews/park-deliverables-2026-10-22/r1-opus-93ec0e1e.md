**Park-deliverables review: no blocking finding, so this lane lands.**

The lane delivers what the plan of record asks for: rows R-2639 to R-2643 and decisions D1 to D11. Each must-meet test is present, carries its `req:` marker and checks the behaviour the plan names.

**What I checked**
- **Diff `3bbb0662..HEAD`, read in full.** The lane changes `scripts/deliverables.mjs`, `scripts/requirements-moved.mjs`, the four test files, `REQUIREMENTS.md`, the README, the requirements skill text, the known-bug files and HANDOFF. Everything else in `a6382024..HEAD` under `scripts/` and `packages/` came in with the merge of main (land-reads-ci). It is not this lane's code.
- **Tests:** I ran the four named test files plus `requirements-regroup.test.mjs`, which copies the scripts. 5 of 5 files pass.
- **Tree check:** `node scripts/requirements-tree.mjs --check` prints `0 problems` and `deliverables: 14 of 31 made and read by code, 8 parked`, with no notes. The eight park lines sit in the right capability spans and parse cleanly.
- **Other checks:** `map:check` has 0 problems and `readme:check` has 0 problems.
- **Wrong-code pairs:** the seat's run shows 15 of 15 red and none surviving. The plan declared p10 untestable as a natural build, which I accept.

**How the code holds up**
- **Live rows are still counted (D4).** The stale-park check reads `claimsByRow`, which is built before the field scan. So a park line above the maker line is still caught, which is what p10 was about. A park never removes a row that code makes and reads from the live count. `staleParkRows` gives one note per row.
- **The count line (D3).** It equals today's line when nothing is parked. That is why R-2538, R-2541 and R-2543 still pass unedited. `parkedRows` is a set, so two park lines for one row count once.
- **Required labels.** `seen` skips `Parked`, and `DELIVERABLE_FIELD_LABELS` is unchanged. So a park never becomes a required line and never satisfies one.
- **Other capabilities.** A park line outside a live `Kind: product` capability goes through the existing "outside a live Kind: product capability" note. A park line naming a row its capability does not list gets "names an unlisted deliverable".
- **Product view (D6).** It shows the park claim with `madeByCode` and `readByCode` set to false, so it cannot raise either code mark. The only other place claims are read is `product-report.mjs:630`. It maps `label`, `text` and `artifact`, and the artifact is null, so nothing there breaks.
- **Movement report (D9).** It splits park lines from maker and reader lines, so the existing `Made by/Read by lines changed` entry is unchanged.

**Non-blocking findings, for the known-bug files**
- **SHOULD:** `scripts/requirements-moved.mjs:65-66` splits lines with inline literals `/^(?:Made by|Read by):/` and `/^Parked:/` instead of reading `DELIVERABLE_FIELD_LABELS` and `PARKED_LABEL`. If someone renames `PARKED_LABEL`, the movement report quietly stops seeing park lines. That breaks the no-inline-tunables rule, which the plan's own fix in `FIELD_PREFIX` (attack N3) was meant to prevent.
- **NOTE:** R-2641 asks for the note to name the "first `Parked:` line". The code names the first *readable* one. Example: a broken park line sits above a good one on a row that code makes and reads. The broken line gets its own note, and the stale note names the second line. This is harmless, but the row's wording is wider than what the code does.
- **NOTE:** `deliverables.mjs` checks the park line's row with an inline regex that duplicates the existing row-shape regex. This matches the existing style.

VERDICT: LAND
