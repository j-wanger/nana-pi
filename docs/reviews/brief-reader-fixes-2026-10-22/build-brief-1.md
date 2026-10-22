Feature: FEAT-006 · Launch builders with execution limits. Lane brief-reader-fixes, rows R-2616 to R-2621. Class: ordinary. Builder: pi-worker (small). Build session 1 of 1: the Precedent reader's label, list-end, entry and heading fixes, and brief-check's unreadable-brief line.

Work in the lane worktree on feat/brief-reader-fixes. The plan of record is `docs/reviews/brief-reader-fixes-2026-10-22/must-meet.md`: read D1 to D7, the rows, what each test does, the tunable and the known limits first; then `plan-attack.md` (M1, M2, M3, S2 to S6, N4) and `plan-draft.md` (the code paths it measured). Where the draft and the must-meet disagree, the must-meet wins (D6 drops the draft's change of brief-check's base). Follow packages/nana-pack/README.md's module rules. Do not edit HANDOFF, the session archive or the known-bug files.

Precedent:
- packages/nana-pack/lib/markdown-list-sections.mjs — the label match (:40) and the label-only blank-line boundary (:49-56); the marker-kind boundary goes beside it, on the label path only.
- packages/nana-pack/lib/brief-precedent.mjs — `normalizeEntry` (:24-37), the heading predicate (:43) and the no-section refusal (:78-79).
- packages/nana-pack/lib/review-findings.mjs — `BARE_MUST_BOLD_RE` (:18): a whole line holding only a bold word, built from a config value.
- packages/nana-pack/lib/frontier-config.mjs — `isNamed` (:26-32), reused unchanged.
- packages/nana-pack/lib/brief-config.mjs — `PRECEDENT_TRAILING_PUNCTUATION`, retuned with its provenance.
- packages/nana-pack/bin/brief-check.mjs — the unreadable-worktree refusal (:30-35), the pattern for the unreadable-brief line.
- packages/nana-pack/tests/worker-lane.test.mjs — `runBriefText` (:83), R-2579's quoted-name match (:143-181), R-2580's case table (:183-249) and the seal check (:251-253).
- packages/nana-pack/tests/brief-check.test.mjs — `writeBrief`, `runCheck` and R-2585's equality loop (:52-103).

1. `markdown-list-sections.mjs` (D1, D2): on the label path only, end the section at a list item of the other marker kind whose indentation is at most the first entry's, and accept the label as an exact set of lines the caller passes. Heading sections and the handoff-asks reader must read exactly as on main. Name the bold label in the header's `@inputs`.
2. `brief-precedent.mjs` (D2 to D5): pass the three accepted label lines built from `PRECEDENT_SECTION`; give the no-section case (`precedent === null`) the new refusal text built from the config names, leaving the empty-section and reasonless-none text as it is; in `normalizeEntry` remove every `**` before the `none:` check, strip a run of trailing marks, and run the unsafe-path check before and after the mark strip; make the heading predicate refuse a title where a letter or digit follows Precedent and its spaces.
3. `brief-config.mjs`: retune `PRECEDENT_TRAILING_PUNCTUATION` to `,;.):` with the must-meet's measured provenance, and update the seal check's literal to match (this is the one existing test the retune makes false; list it in your report).
4. `brief-check.mjs` (D6): before the shared check, if the resolved brief cannot be read, exit 1 with one `brief-check:` line naming the absolute path tried and that a relative `--brief` resolves from `--tree`. The base stays the worktree.
5. Tests with the must-meet's exact titles and `// req:` markers for R-2616 to R-2621, with every case "What each test does" lists, guards included. Add rows R-2616 to R-2621 to FEAT-006 in REQUIREMENTS.md with the must-meet's texts, `implemented` with evidence. Update the pack README's lane-mode and brief-check paragraphs (D7).
6. Run worker-lane, brief-check, frontier, handoff-asks and product-report tests, then `npm run map`, `npm run map:check`, `npm run req:tree`, `npm run readme:check`, `node scripts/requirements-trace.mjs`, then `npm run test:locked` before your last commit. Try these wrong versions, see each go red, then restore: the kind boundary also on heading sections; the kind boundary ignoring indentation; one trailing mark stripped, not a run; `**` removed after the `none:` check; the heading predicate left as plain `isNamed`; brief-check refusing without the path.

Seat check: `node docs/reviews/brief-reader-fixes-2026-10-22/seat-titles.mjs all` must print `0 missing`.

Done:
- A numbered list after a plain Precedent list, a bold label, bold and punctuated paths and a "Precedent audit" heading are read as the must-meet says; the no-section refusal names both start forms; brief-check names the path it tried.
- Frontier, handoff-asks and product-report tests stay green unchanged.
- map:check, req:tree, readme:check, the trace and the full suite are green; the seat check prints `0 missing`; the work is committed.

Report (at most 12 lines after the VERDICT line): the commit shas; the check results; each departure from the Precedent files with its reason; each existing test you edited and why; the wrong versions tried and their results; the full suite's summary line; map, readme, trace and seat-check status.
