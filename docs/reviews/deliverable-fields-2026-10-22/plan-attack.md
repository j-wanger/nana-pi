# Plan attack: deliverable-fields (main 08c33d94)

Probe: `git archive` copy of main in scratch `plan-dlf/adv/`, `git init`; a two-folder git fixture in `plan-dlf/adv-sub/`; read-only `git log` on main; read-only ledger scan of ~. No suite run, no install.

## MUST

**M1. The run names let a hand-made or rule-read deliverable pass silently (D1a, R-2535, R-2537).** `build`, `review`, `land`, `suite`, `CI`, `hook`, `session start` and the reader `prompt` say when a thing happens, not what code does it. None needs a reason or a path. So an agent following a rule can honestly be written as an automatic run. Concrete cases on the 38: the mutation record (R-1239) is run by the seat because the seat rule says so, and reads as `land` or `build`. The movement listing (R-1460) is run because AGENTS says carry it in briefs, and reads as `review`. The install check before a land (R-1070) is a rule step, and reads as `land`. HANDOFF (R-873) is read because AGENTS says "read HANDOFF.md", and reads as `prompt`. The audit labels all four RULE-ONLY or MANUAL. Three of them are D5's deferred rule lines, so the plan would hide exactly the items it defers. The planned R-2535 test even asserts that a bare `prompt` and a bare `land` get no note. Fix: every maker other than `manual`, and every `prompt` or `code` reader, must name at least one tracked code path after the colon: the file that writes the artifact, or the file that puts it in the agent's context (`land: packages/nana-pack/bin/nana-land.mjs`, `CI: .github/workflows/ci.yml`, `prompt: packages/nana-pack/extensions/nana-objective.ts`). A bare run or a bare `prompt` or `code` gets one note. R-2536 then checks those paths too. A wrong build that accepts a bare `code` reader passes all three planned rows today; add it.

**M2. The notes never reach nana-pi's own runs (D3, R-2538).** Measured on the export: `requirements-tree.mjs --check` and `--write` print nothing at exit 0. Only `--root` prints the summary line. nana-pi's builders run `npm run req:tree`, which is `--write`; R-291's suite test forces it whenever the ledger changes. R-2538 tests `--root` only, so a build that prints notes only under `--root` lands green, and no nana-pi run ever shows a note. The plan's "the seat records zero notes at the land" is then a hand step with no pin. That makes the check itself a deliverable made by hand and read by nobody, the gap the ruling targets. Fix: R-2538 covers `--write` and `--check` too. Each prints the notes on stdout after a clean tree and keeps its exit status. Test `--write` on a scratch copy and assert the written outline equals the one without the lines. Record the rest as a known limit: a renamed reader file with no ledger edit shows its note only at the next ledger lane. Whether R-2539 should also fail on path notes in nana-pi only, as the code map gate does, is the owner's call. The ruling says report-only, so the default is no.

**M3. Git last-commit age reads a sweep as a fresh make (D2, R-2541, lane B).** Measured on main: scrub-records commit fe331dcd touched 889 files. Both bench study folders now show 2026-10-21 as their last commit. Their last real make was 2026-09-28 and 2026-09-08 (git log of each folder). The audit says no study since 09-29. R-2541 as written passes on a report that shows the 09-28 study as 0 days old. A revert, a CRLF pass or a rename does the same. Fix: when the artifact or its maker records its own date, use that: the runtime map's `tip`, a study folder's date. Otherwise show "last changed <n> commits and <d> days before HEAD by <sha8>" with the commit subject, so a reader can see "scrub". R-2541's fixture adds an unrelated commit that touches the artifact after its make, and asserts the report names that commit rather than a bare fresh age.

## SHOULD

- **S1. Age applies to few of the 38 (inferred from row text).** About 8 name a tracked file: HANDOFF, the outline, the bench studies and the writing-trial records. About 11 are machine-local: the handoff store, the journal, the knowledge index, the roster, the round ledger, the runtime map, ~/.claude links, desk keys and mutation records. The rest are behaviours or printed output, with no file. The outline is kept fresh by a suite gate, and HANDOFF changes every lane. So lane B's age column informs maybe 3 to 5 rows. Give the owner this count before lane B.
- **S2. Coverage is 38 of the audit's 78 deliverables, and 0 of CAP-03's 7.** `Deliverables:` is allowed only on `Kind: product` (checkCapabilityFields). So the never-kept gate blocks and ignored-config lines can never carry the fields. Nothing flags an artifact that sits on no `Deliverables:` line. Name this in the plan. The owner can choose to list more rows later.
- **S3. R-2536 passes a wrong path source.** Measured in the fixture: a staged file appears in `git ls-files` but not in `git ls-tree HEAD`. From a ledger in a subfolder, both list only that subfolder, relative to it; R-1164 already supports such projects. Fix: run `git -C <ledger folder> ls-tree -r -z --name-only HEAD`. Use `-z`, because quotePath escapes non-ASCII names. Paths are relative to the ledger's folder. Add a staged-only file, a subfolder ledger, a non-ASCII name and an unborn HEAD to the test. Run git only when some path is to be checked, so R-1157's pinned line holds in non-git temp dirs. A git error (unborn HEAD, dubious ownership) gives the "paths not checked" note and never throws.
- **S4. The movement listing cannot see the new lines (requirements-moved.mjs:85-97).** A lane that turns `code:` into `rule:`, or deletes a row's lines, shows nothing in the output carried into briefs and reviews. Add one changed-line entry per row when the lines differ. The no-change output stays byte for byte.
- **S5. Written lines rot when a maker changes.** R-1272's maker turns from `manual` to `land` when runtime-map-live lands. If lane A's build 2 lands first, its line goes stale with no note. Write R-1272's line after runtime-map-live lands, or in its final state. M1's code paths make a deleted maker show up as a note.
- **S6. Lane B needs a count line.** The derived view gave a number ("2 of 38"). R-2540 should print "<n> of <m> deliverables made by code and read by code or a person", so the owner can see progress the way the audit did (16 of 78).
- **S7. The desk and app rows.** 8 of the 38 need fresh research. The owner's call on parking the desk and app items is still open. Write them as `manual` and `person` with "desk frozen since 10-10", or wait for that call. Do not research frozen code.

## NOTE

- N1. Field shape holds on the 10-21 tools. The lift carries the lines as capability prose: only Purpose, Outcome and Status are field-block lines (requirements-lift.mjs:161-173). The outline, regroup page and `checkOutlineFields` never read them. One other project has capability headings, with no `Kind:`, so it gains nothing and loses nothing. A regroup that merges two capabilities concatenates both spans' lines. That already duplicates `Kind:`, which is a problem today.
- N2. Lines written under a kindless capability are silent prose. R-2537 notes them on a constraint capability. Give the same one note on a kindless one; it fires only when lines exist.
- N3. Compute whole days from the epoch difference of committer times, never from calendar dates, so the timezone cannot change the bytes. Clamp a negative difference after a rebase to 0. A shallow clone should say "age unknown: shallow clone" (`git rev-parse --is-shallow-repository`); CI is full depth (ci.yml:65,93).
- N4. Windows runs `git log -1` per artifact more slowly (inferred). Batch it with one `git log --name-only` walk if lane B passes 30 artifacts.
- N5. The runtime map lives in the git common dir, so the report's age changes after another worktree lands. R-1012 already makes unchanged runtime data a condition, so it holds.
- N6. Remove the HANDOFF Open ask "Deliverable consumers" in lane A's notes; the ruling answered it (written).

## AMENDED

Lane A (ordinary; FEAT-028). Wrong-code pairs: add "accept a bare run or `prompt`", "list paths from the index", "print notes only under `--root`".

| Row | Change to the draft | Test file :: title |
|---|---|---|
| R-2535 | Keep. Add `manual · docs/x.md` (artifact present, no reason). Assert only R-2535's note kind, so a bare `land` carries M1's note, not this one. | requirements-deliverables.test.mjs :: as drafted |
| R-2536 | HEAD tree from the ledger folder, `-z`; cases from S3; also checks M1's maker and `prompt` paths. | same :: as drafted |
| R-2537 | Add: a non-manual run, a `prompt` or a `code` reader with no tracked path gets one note; a kindless capability with lines gets one note. Pins the run and reader lists. | same :: "...or a line the check cannot read, or an automatic claim with no code path, gets one note naming it" |
| R-2538 | `--root`, `--write` and `--check` each print the notes after a clean tree, keep their exit status, and leave the outline unchanged. With no lines, today's output, byte for byte. | requirements-tree.test.mjs :: "the tree checker prints deliverable notes in every mode and keeps its exit status and outline" |
| R-2539 | Keep (presence only). | as drafted |

Lane B (ordinary; FEAT-039; after lane A and runtime-map-live).

| Row | Change to the draft |
|---|---|
| R-2540 | Add S6's count line. |
| R-2541 | Use the maker's own record first; otherwise "last changed ... by <sha8>" with its subject; add the sweep-commit fixture from M3. |
| R-2542 | Keep. |
