# park-honestly · must-meet of record (seat, 2026-10-23)

Feature: FEAT-028 · Maintain requirement identity and trace links

Written by the seat from the planner's draft (`plan-draft.md`) and one adversary pass (`plan-attack.md`), both kept in this folder. Plans get no review round. Where this file and the draft differ, this file holds.

The owner's decision, 2026-10-23, in the words the owner chose from the seat's slate: "Park honestly (Recommended)" — "Park the 12 open deliverables that have no honest maker, each with a reason; fix two misnamed readers; trim HANDOFF to its 1,200-word budget." — and "Park them (Recommended)" for the five idle bench study rows and the closed writing-trial extract, and "Park for now (Recommended)" for the writing check's summary line. The owner also said, at the priority review the same day: "Windows run passed; checklist passed; switch to artifact, continue with power mode".

Spend line: the current priority (since 2026-10-23, artifacts made by an existing run and read by code, their age shown), appetite clause 1: every listed deliverable either made by an existing run and read by code, or parked with a reason.

Stakes: low blast, reversible. Ledger lines, one suite check, and the seat's HANDOFF notes. The new cross-lane effect: R-2730 turns a report-only deliverable note into a suite failure for this repository, so a later lane whose ledger lines draw a note fails its suite until it fixes them (report-at-land must widen the artifact exemption in its own change).

## Seat decisions on the attack

- **M1 adopted.** R-301 and R-1150 have honest makers in CI runs that already happen, by the ledger's own precedent (R-341 and R-596 count live on the same runs). They get CI maker lines, not park lines. The owner's words were "the 12 open deliverables that have no honest maker"; these two have one, so making them live keeps the decision's intent. Ten park lines, two CI maker lines, one reader fix. The count after: `deliverables: 18 of 23 made and read by code, 18 parked` (measured by the attack on a scratch ledger).
- **S1 adopted.** R-327's and R-749's reasons are reworded so the code does not contradict them; R-536's and R-1239's are tightened (below).
- **S2 adopted.** The owner's words are quoted above.
- **S3 adopted.** R-2730's check runs the deliverable check with a runner that lists the index plus untracked files that git does not ignore, so a builder's not-yet-committed reader path passes before its commit.
- **S5 adopted: R-2731 drops.** Its rule (the product report is never a code reader) would equally forbid other readers the ledger counts. The R-1272 reader fix stays as a ledger edit.
- **S6 adopted: R-2732 drops (open question 1, default no).** Only 10 of 152 HANDOFF versions since 2026-10-06 were within the budget (measured); a suite gate would fail most lanes' notes. The trim stays seat work, checked by `nana-frontier` as today.
- **S8 adopted.** R-2730's control is a fixture ledger, not a rewrite of a real park line.
- **N4 adopted.** One park line per row; four separate bench lines.
- **N5 confirmed.** The owner answered the review pack on 2026-10-23, so the review is held; Next item 1 becomes the new priority's line. No open ask leaves except the two the owner answered.
- **Open question 4, decided by the seat: yes.** A code reader that prints what it reads still counts (the 2026-10-22 ruling says "the code that reads it"); no change.
- **Open question 5, decided: yes.** The half-answered ask becomes "A copier project's drift line", keeping its since-date.
- **Open question 3: no.** R-1014's lines belong to report-at-land.
- **Class: ordinary.** One final reviewer (Opus). Builder: the small builder. The seat runs the pairs anyway (cheap).

## Must-meet row (FEAT-028, after R-2643)

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2730 | WHEN the suite runs, it shall fail on any deliverable note that the deliverable check reports for this repository's REQUIREMENTS.md against the repository's tracked files and its untracked files that git does not ignore. | `packages/nana-pack/tests/requirements-deliverables.test.mjs::R-2730: this repository's ledger gets no deliverable note against its tracked and untracked files` |

R-2730 goes in `untested`, then `implemented` when its check passes. It is green on main by design (main's ledger draws no note); pairs 1 to 5 turn it red. R-2731 to R-2739 stay free.

### What the test does

After R-2539's block, call `deliverableReportLines` on this repository's parsed ledger with a git runner that lists `git ls-files --cached --others --exclude-standard`; expect the first line to match `^deliverables: \d+ of \d+ made and read by code` and no line starting `deliverable note:`. The assertion names no count and no row. Control: a fixture ledger holding one park line written with `-` for `·` must give one `cannot read Parked:` note.

## Ledger lines (each directly after its row's last `Read by:` line, except the two maker lines, which go directly above the row's manual maker line)

- `Parked: R-749 · since 2026-10-23: the owner parked it for now; the suite checks HANDOFF's live sections through the library, not this summary line, and no run checks a report sent in a session; a lane that runs the check on the seat's reports deletes this line`
- `Parked: R-1400 · since 2026-10-23: the roster is the owner's choice of models, so no run should write it, and code already reads it; an owner decision that lets a run set the roster deletes this line`
- `Made by: R-301 · CI: .github/workflows/ci.yml, packages/nana-setup/bin/install-check.mjs`
- `Parked: R-327 · since 2026-10-23: the seeds are written once, when the owner adopts a project, and the session-start frontier block reads them; nothing reseeds them; a run that reseeds projects deletes this line`
- `Made by: R-1150 · CI: .github/workflows/ci.yml, scripts/template-release.mjs, scripts/template-acceptance.mjs`
- `Parked: R-1239 · since 2026-10-23: the record is the seat's own wrong-code check, which the seat writes and runs by hand, required in install, hook and gate lanes; a run that makes it and code that reads it delete this line`
- `Parked: R-509 · since 2026-10-23: no study is open; a person starts each paid study by hand on the owner's decision, and the bench spends nothing without a run flag; the next study the owner opens deletes this line` (and the same line for R-532, R-507 and R-535, one line each)
- `Parked: R-536 · since 2026-10-23: no study is open; a person runs the catch-ledger extraction by hand when a review question needs it, and while extraction calls no model, its only code readers, the label and match steps, call judge models; the next catch-ledger study deletes this line`
- `Parked: R-694 · since 2026-10-23: the writing trial closed when the owner adopted the writing rule on 2026-10-21, and nothing has read the extract since; a new writing trial deletes this line`
- `Read by: R-1272 · code: scripts/product-report.mjs` becomes `Read by: R-1272 · code: scripts/code-map.mjs`.

No reason holds `·`.

## Wrong-code pairs (each must turn R-2730 red)

The draft's pairs 1 to 5 (a park line with `-` for `·`; a park line with no reason; a park line in another capability's span; a park line on a row code makes and reads; the R-1272 reader misspelled `scripts/code_map.mjs`). Declared non-pairs: a park line under a feature heading or inside a code fence reads as prose and draws no note (the seat's exact count-line check catches it).

## Known limits (the seat writes them before the final round)

The draft's FEAT-028 lines, without those for R-2731 and R-2732; the FEAT-005 writing-check line; the FEAT-002 note that the HANDOFF budget stays a seat check, not a suite gate.

## Docs and lines that change

As the draft's list, without R-2731, R-2732 and the frontier test; the HANDOFF trim from the planner's template (the seat's notes commit 1, before the build), with "Two planned-lane defaults" renamed and the two answered asks dropped; the Landed line and session entry name ten parks and two CI makers.

## Seat steps

1. Cut `feat/park-honestly` from main. Commit this file, the draft, the attack, seat titles and build brief 1; then notes commit 1, the HANDOFF trim (both HANDOFF checks: 0 findings, at most 1,200 words); run brief-check; open a draft PR.
2. Build with the small builder.
3. Seat checks: escape check; seat titles; pairs 1 to 5; `node scripts/requirements-tree.mjs --check` prints exactly `deliverables: 18 of 23 made and read by code, 18 parked` with no note; `npm run report` shows the new park claims; the session-start frontier block lists the expected asks; `npm run test:locked`, map, readme, trace; `requirements-moved --base main`.
4. Notes before the final round; CI on the tip; Opus on the exact tip; land.
