Feature: FEAT-005 · Communicate decisions clearly (PATH rows in FEAT-013). Lane writing-adoption, rows R-2498 to R-2503. Class: install, hook or gate. Builder: pi-worker (larger lane). Build session 3 of 3: the rule's Check section, the README contracts and the AGENTS line.

Work in ~/nana-pi-wt/writing-adoption on feat/writing-adoption. The plan of record is `docs/reviews/writing-adoption-2026-10-21/must-meet.md` (row R-2502, the sealed Check text, the seat decisions and the known limits). Follow packages/nana-pack/prompts/builder-preamble.md. Never edit HANDOFF.md, docs/sessions/ or docs/reviews/. In packages/nana-pack/rules/ you may edit only `nana-writing.md`, and in it only the `## Check` section. No push.

The seat checked build 2 at 6a9fa725: install 110, win32-degrade 88, state-manifest 20, uninstall 31, install-overlap 4 and restore 14 pass (restore through `npm test`); win-shims 2 pass, 6 skip on macOS; the macOS install check is 17 PASS; the seat check prints `0 missing` for session 2. The Windows leg is running on the draft pull request. No findings carry over.

1. R-2502. Replace the `## Check` section of `packages/nana-pack/rules/nana-writing.md` with the must-meet's sealed Check text, byte for byte (it ends with one newline). In `packages/nana-setup/tests/writing-rule.test.mjs`, write the check with the must-meet's title: the test holds the sealed text as its own constant and asserts the rule's `## Check` section (from that heading to the end of the file) equals it, and that the whole rule contains no `node ` and no `~/`. Keep R-376's check (the rule passes its own checker with zero findings) green. Add R-2502 to FEAT-005 in REQUIREMENTS.md with the must-meet's text, status `implemented`, and its evidence.

2. `packages/nana-pack/README.md`:
   - The extension table row (:39): the rule is adopted, not a trial; it is on by default and `writing.enabled: false` in the user-scope `nana-pack.json` turns it off.
   - The "Writing checker" section (:365-380): retitle it as adopted and report-only; say the checker is on PATH as `nana-writing` after `nana-setup install`; replace the two `node packages/nana-pack/bin/nana-writing.mjs` examples with `nana-writing file.md` and `nana-writing --report < draft.txt`; say the rule makes the pre-send run required, that reports stay report-only, and that the suite fails on an over-cap or banned sentence in nana-pi's own HANDOFF.md live sections.
   - Behavior notes (:592-594): drop the lone-surrogate note (fixed: the cut ends before a split pair); replace "it has no switch of its own" with the `writing.enabled` key, user scope only, default true, pi only (Claude Code keeps its linked rule; seat decision D3); keep the pi-filter sentence as a second way.
   - Add the known limits the must-meet lists that a README reader needs: the report run stays an instruction; the key reaches pi only; Windows PowerShell 5.1 pipes non-ASCII as `?`, so pass a file there; the frozen desk refuses to save a `nana-pack.json` holding `writing`.
3. `packages/nana-setup/README.md`: line 43's "(writing for the owner — trial, 2026-10-04)" becomes "(the writing rule, adopted 2026-10-21)". Keep the rest.
4. `AGENTS.md`: in the nana-pi section after the marker region (near "### Install check before a land"), add a short "### HANDOFF writing check" paragraph: the suite fails on a sentence over 25 words or a banned word in HANDOFF.md's live sections (Where things stand, Next, Open for the owner); run `nana-writing HANDOFF.md` after editing it. On line 20, "`nana-writing` (the report-only writing checker)" becomes "`nana-writing` (the writing checker, on PATH; report-only)". Do not edit inside the marker region.
5. Headers: update any module header these changes make stale, then `npm run map`.
6. Run `node packages/nana-setup/tests/writing-rule.test.mjs`, `npm run map`, `npm run map:check`, `npm run req:tree`, `npm run readme:check`, `node scripts/requirements-trace.mjs`, then the full suite with `npm run test:locked` before your last commit. For R-2502, try a rule that keeps the old `node ~/...` line, and one that says "It is not required to run" in place of "You must run it every time"; see the check go red; restore. Commit with explicit paths.

Seat check: `node docs/reviews/writing-adoption-2026-10-21/seat-titles.mjs all` must print `0 missing`.

Done:
- The rule's Check section is the sealed text; R-2502 and R-376 pass; the READMEs and AGENTS.md say what the code does.
- map:check, req:tree, readme:check, the trace and the full suite are green; the seat check prints `0 missing`; the work is committed.

Report (at most 12 lines after the VERDICT line): the commit sha; the check results; the wrong versions tried; the full suite's summary line with its check count; map, readme, trace and seat-check status.
