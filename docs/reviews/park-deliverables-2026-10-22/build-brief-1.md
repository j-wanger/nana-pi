Feature: FEAT-028 · Maintain requirement identity and trace links. Lane park-deliverables, rows R-2639 to R-2643 (R-2642 in FEAT-039). Class: ordinary. Builder: pi-worker (small lane). Build session 1 of 1: the `Parked:` deliverable line, its count, notes, Product-view claim and movement entry, and the eight desk and app park lines.

Work in the lane worktree on feat/park-deliverables. The plan of record is `docs/reviews/park-deliverables-2026-10-22/must-meet.md`: read D1 to D11, the rows, what each test does, the tunables, the known limits and the wrong-code pairs first; then `plan-attack.md` (M1, S1 to S7, N1 to N9) and `plan-draft.md` (its measurements). Where the draft and the must-meet disagree, the must-meet wins: the lane parks only the eight desk and app rows, R-694 stays on CAP-08's list, and each park reason ends "reopening the desk deletes this line". Before editing, run the map impact command on scripts/deliverables.mjs and scripts/requirements-moved.mjs, and work from the blast radius. Follow the root README's module rules. Do not edit HANDOFF, the session archive or the known-bug files.

Precedent:
- scripts/deliverables.mjs — the contract constants with provenance; `FIELD_PREFIX`; the `Read by:` branch, which the park branch copies; `deliverableClaims`; `isMadeAndReadByCode`; the per-capability count and the count line.
- packages/nana-pack/lib/handoff-asks.mjs — the `[parked, since <YYYY-MM-DD>]` form with a shape-only date.
- scripts/requirements-moved.mjs — `rowSnapshot` and the `Made by/Read by lines changed` entry.
- scripts/product-report.mjs — the claims render, which stays unchanged.
- packages/nana-pack/tests/requirements-deliverables.test.mjs — `notesFor`, `tree`, R-2537's `expectNote` table, its `outside` fixture and its sealed-constant check.
- packages/nana-pack/tests/requirements-tree.test.mjs — R-2541's three-mode count check and the copy list of scripts and pack libs.
- packages/nana-pack/tests/requirements-regroup.test.mjs — `mirrorScripts`, the second copy list.
- packages/nana-pack/tests/product-report.test.mjs — R-2542's claims-in-order check.
- packages/nana-pack/tests/requirements-moved.test.mjs — R-2540's `deliverableBase`, `treeMovement` and `changedIn`.

1. `PARKED_LABEL` and `PARKED_SINCE` in scripts/deliverables.mjs with their contract provenance; `FIELD_PREFIX` built from `DELIVERABLE_FIELD_LABELS` and `PARKED_LABEL` (D9, the tunables). The park branch, the row-counted parked total, the stale-park rule and `parkedDeliverables` (D1 to D4). `deliverableClaims` returns park lines in ledger order (D6). `rowSnapshot` splits park lines into their own `Parked lines changed` entry (D9). Update both module headers' `@outputs`.
2. Tests in the four named files with the must-meet's exact titles and `// req:` markers, every case "What each test does" lists. If a new import enters deliverables.mjs, add it to both copy lists; better, add none.
3. REQUIREMENTS.md: R-2541's cell narrowed as D8 says; R-2639, R-2640, R-2641 and R-2643 in FEAT-028 after R-2541, R-2642 in FEAT-039 after R-2543, each `implemented` with evidence; the eight park lines from "Docs and lines that change", each directly after its row's last `Read by:` line. The README paragraph and the requirements skill text as that section says.
4. Run the four named test files, then `npm run map`, `npm run map:check`, `npm run req:tree`, `npm run readme:check`, `node scripts/requirements-trace.mjs` and `node scripts/requirements-tree.mjs --check` (expect `, 8 parked` and no note), then `npm run test:locked` before your last commit. Try these wrong versions, see each go red, then restore: pairs 1, 4, 8, 11, 14 and 16 of the must-meet's list.

Seat check: `node docs/reviews/park-deliverables-2026-10-22/seat-titles.mjs all` must print `0 missing`.

Done:
- The tree checker's count line leaves the eight desk and app rows out of its total and ends `, 8 parked`, with no note; a malformed park line gets one note and parks nothing; a stale park counts as live with one note.
- The Product view lists each park line as a claim; the movement report names `Parked lines changed`.
- map:check, req:tree, readme:check, the trace and the full suite are green; the seat check prints `0 missing`; the work is committed.

Report (at most 14 lines after the VERDICT line): the commit shas; the tree checker's count line; the wrong versions tried and their results; each departure from the Precedent files with its reason; each existing test you edited and why; the full suite's summary line; map, readme, trace and seat-check status.
