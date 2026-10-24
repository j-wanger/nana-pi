# park-honestly: plan draft (planner, 2026-10-23, main c273b4de)

Feature: FEAT-028 · Maintain requirement identity and trace links. Verified (measured): the park line's parser and checker live in `scripts/deliverables.mjs` (PARKED_LABEL and PARKED_SINCE at :17-19, the park branch at :154-185), called from `scripts/requirements-tree.mjs:589`; their rows R-2639, R-2640, R-2641 and R-2643 sit in FEAT-028 (REQUIREMENTS.md:2050-2053), beside R-2535 to R-2541 (REQUIREMENTS.md:2043-2049). Only R-2642, the Product view's park claim, is homed in FEAT-039. This lane's third row is homed in FEAT-002, beside the two HANDOFF repository checks it copies (R-2473 and R-2504, REQUIREMENTS.md:266-267), as park-deliverables homed R-2642 outside its own feature.

Why: the owner decided on 2026-10-23 to park every open deliverable that has no honest maker, each with a reason. That covers the five idle bench study rows and the closed writing-trial extract, which reverses HANDOFF's 2026-10-22 ask "Study deliverables" (default "keep them counted"). It also parks R-749, the writing check's summary line, for now. The rows: R-1400, R-301, R-327, R-1150, R-1239, R-694, R-749, R-509, R-532, R-507, R-535, R-536. The same decision asks for honest readers: R-1272's code reader is the impact command (`scripts/code-map.mjs`), not the product report. It also asks for HANDOFF.md back inside its 1,200-word budget, keeping every open owner ask and recording the owner's 2026-10-23 decisions.

Spend line: the current priority the owner set on 2026-10-23, the artifact work: every artifact nana produces is made automatically by a run that already happens, read by code, with its age shown. This lane serves appetite clause 1: every listed deliverable is either made by an existing run and read by code, or parked with a reason. It closes clause 1 for 12 of the 17 open rows. The other five are R-1560, R-291, R-1460, R-1014 and R-2632, each the subject of a planned slate lane.

Stakes: low blast, reversible. The ledger change is twelve lines, plus one reader line. Every deliverable output stays report-only (R-2538). The worst case the precedent named is a park that hides a gap nobody decided to park; here the owner named all twelve rows, and the seat only words the reasons. The new risk is cross-lane: R-2730 and R-2732 turn two report-only signals into suite failures for this repository. A later lane whose ledger lines draw a deliverable note, or whose HANDOFF notes push the file past 1,200 words, fails its suite until it fixes them (inferred; see Seat steps for the two lanes it reaches first).

Class: ordinary, by AGENTS.md's letter. The lane changes REQUIREMENTS.md lines, two test files (`packages/nana-pack/tests/requirements-deliverables.test.mjs`, `packages/nana-pack/tests/frontier.test.mjs`), `docs/requirements-tree.md` (regenerated), HANDOFF.md, the October session archive and two known-bug files. It touches no nana-setup install, uninstall or doctor code. It touches no Claude Code hook, no pi extension, no nana-gate policy, and none of nana-land, pi-review, claude-review or review-round. Ladder: one final reviewer, the roster's reviewer, from another model lineage. The seat's wrong-code pairs are not required for an ordinary lane; the precedent ran them, and they are cheap here, so the plan lists them. Builder: the small builder (`pi-worker --lane-size small`). The precedent's small builder returned PARTIAL, but that lane changed parser code; this one is ledger lines and three checks in existing test files (inferred: small fits).

Threat model: honest variation in our own ledger and HANDOFF lines is in scope. A park line typed with `-` for `·`. A middle dot anywhere in a reason, which the park parser splits on (`field.body.split(/\s*·\s*/u)`, deliverables.mjs:155, measured), so a reason can never hold `·`. A park line with no reason, in the wrong capability's span, above the maker line, under a feature heading, or inside a code fence. A park left on a row that code makes and reads. CRLF endings and trailing blanks. A reader path that is misspelled, moved, or not yet committed. A later lane re-adding the product report as a code reader. A later lane's notes pushing HANDOFF past its budget. A merge of main that adds HANDOFF words or deliverable lines. Deliberate forgery is out. A park line claiming an owner decision that never happened passes; the checker proves a shape, and the movement report shows the line to the reviewer. A reader line naming a tracked file that does not read the artifact passes, unless that file is the product report (R-2731). Public repo: every line this lane writes says "the owner", never a name, and names nothing about the owner's work.

## Precedent

Precedent:
- docs/reviews/park-deliverables-2026-10-22/ (must-meet.md, plan-draft.md) — the same lane shape: ordinary, small builder, park lines after each row's last `Read by:` line, the movement report carried in the brief and the land. Its D7 kept R-694 and the bench rows counted pending the owner; the owner has now decided, so this lane reverses D7 by the owner's 2026-10-23 decision, not by a fresh derivation.
- REQUIREMENTS.md:1705 and REQUIREMENTS.md:1875 — the existing park line form, `Parked: <row> · since <YYYY-MM-DD>: <reason>`, whose reason ends with what deletes it. The twelve new lines copy that form, ending each reason with "deletes this line".
- scripts/deliverables.mjs:17-19, :38-40, :154-185 — PARKED_LABEL, PARKED_SINCE, FIELD_PREFIX, PARKED_DATE and the park branch; unchanged by this lane.
- scripts/deliverables.mjs:296 (`deliverableReportLines`) — R-2730 calls it on this repository's root with the default git runner, exactly as the tree checker does at scripts/requirements-tree.mjs:589.
- scripts/deliverables.mjs:66 (`deliverableFieldLinesByRow`) — R-2731 reads the repository's reader lines through it.
- packages/nana-pack/tests/requirements-deliverables.test.mjs:238-253 — R-2539's repository check (`repositoryLedger`, `repositoryParsed`, `repositoryFields`); R-2730 and R-2731 sit directly after it and reuse those three names.
- packages/nana-pack/tests/writing-check.test.mjs:69-112 — R-2503's control-plus-repository shape: a fixture that must fail, then the repository that must pass. R-2730 and R-2731 each carry such a control.
- packages/nana-pack/tests/frontier.test.mjs:293-306 — R-2473 and R-2504, this repository's HANDOFF.md checked through the CLI's `run()` beside a control; R-2732 adds one check in that block. The over-budget control copies R-873's case at frontier.test.mjs:213-219, but builds HANDOFF_WORD_BUDGET + 1 words from the imported name (:14) instead of that case's literal 1201.
- scripts/code-map.mjs:31 and :81 — `loadRuntime` and `runtimeBlock`: the impact command reads the runtime map for the section R-1272 specifies. scripts/product-report.mjs:243-257 and :551-560 read it only to date it and to label files on the page a person reads (measured).
- docs/sessions/2026-10.md:19 — the archive form "Landed lines moved here verbatim on <date>:", which takes the pi-version-support Landed line when this lane's line replaces it.
- No helper moves between modules.

## Measurements (2026-10-23, this Mac, main c273b4de, clean tree)

1. Measured: `node scripts/requirements-tree.mjs --check` prints `requirements tree: 0 problems; rows 1945; features 39` and `deliverables: 16 of 33 made and read by code, 8 parked`, with no note.
2. Measured: a scratch script (`<scratch>/park-honestly/sim.mjs`) imports the repo's own `checkTree`, `deliverableReportLines`, `deliverableClaims` and `isMadeAndReadByCode`. It lists 17 open rows at main: CAP-01 R-749; CAP-02 R-1400, R-1560; CAP-04 R-301, R-327, R-1150; CAP-07 R-291, R-1460, R-1014, R-1239, R-2632; CAP-08 R-509, R-532, R-507, R-535, R-536, R-694. R-694 sits in CAP-08 (REQUIREMENTS.md:2544), not CAP-07.
3. Measured: the same script applies the twelve park lines below and the R-1272 reader change to a scratch copy of the ledger. It runs the checker against main's HEAD tree: 0 problems, and exactly `deliverables: 16 of 21 made and read by code, 20 parked`, with no note. The five open rows left are R-1560, R-291, R-1460, R-1014 and R-2632. The rendered outline is byte for byte main's, because park lines and reader lines are not in the outline. main's outline equals the committed `docs/requirements-tree.md`.
4. After this lane's three new rows, the tree check prints `requirements tree: 0 problems; rows 1948; features 39` and the same deliverable line (inferred: 1945 + 3; the rows change only FEAT-028's and FEAT-002's row lists).
5. Measured: `treeMovement` over main and the scratch copy prints `tree movement main..sim: 13 rows in 10 features`: twelve `Parked lines changed` entries and one `Made by/Read by lines changed` for R-1272. With the three new rows it should print 16 rows in 12 features (inferred).
6. Measured: R-2730 to R-2739 appear in no tracked file at main (`git grep`), in no file under the scratch folder, in no lane worktree's REQUIREMENTS.md, and in the REQUIREMENTS.md of none of the 15 newest `feat/*` branches. R-2720 to R-2729 are reserved for another lane and stay unused here.
7. Measured, the reader audit. For every `Read by:` line of kind code or prompt (16 counted rows and 7 others), the seat grepped the named path for the artifact's reader. Each named file reads its artifact. Example: nana-land.mjs:102-126 reads the round records, test-locked.mjs:183 reads the suite records, and install-check.mjs:529-543 reads doctor's output. One reader is misnamed: R-1272's `scripts/product-report.mjs` loads the runtime data only to show its age and per-file labels on a page a person reads (product-report.mjs:243-257, :551-560). `scripts/code-map.mjs --impact` reads it for the impact section R-1272 specifies (code-map.mjs:31, :81). Two weak readers stay, both inferred. R-977's code reader, CI, reads the merged main only after the seat pushes by hand. Both of R-2597's code readers, build-report.mjs and pi-worker.mjs:342, print what they read for a person. Both readers do read the artifact, so this lane does not change them (open question 4).
8. Measured: `node packages/nana-pack/bin/nana-frontier.mjs HANDOFF.md` prints `words=1411 budget=1200`, one finding. The session-start frontier block lists 29 asks: 1 blocking, 26 optional, 2 parked.
9. Measured: the trimmed draft below (`<scratch>/park-honestly/after/HANDOFF.md`, with sample seat fills for the lanes line and the Landed date) prints `summary words=1157 budget=1200 findings=0`. `nana-writing` on it prints `over=0 ... banned=0`. Its frontier block lists 27 asks, 25 optional and 2 parked. Diffed against main's ask list, exactly three titles change: the blocking Windows run and "Study deliverables" leave, and "Two planned-lane defaults" becomes "A copier project's drift line" with its since-date kept.
10. Measured: no test asserts that this repository's ledger has no deliverable note. A malformed park line in the real ledger today gives a report-only note and a green suite. No test checks this repository's HANDOFF.md word budget. R-2473 and R-2504 (frontier.test.mjs:302-305) check its other frontier findings.

## Design

- **D1 · Twelve park lines, dated the owner's decision.** Each goes directly after its row's last `Read by:` line in its listing capability's span, with `since 2026-10-23`. Each reason says what holds the row and what deletes the line, in the precedent's form. No reason holds `·` (measured: all twelve park in the simulation). R-694 stays on CAP-08's list and parks; the owner said park, not drop, and its maker and reader lines stay.
- **D2 · R-749 parks "for now".** The reason names the writing rule as today's only enforcement and a hook lane as the reopen step. The owner's 2026-10-21 ruling (every report runs the check) stays enforced by the rule alone; that residual goes in FEAT-005's known-bug file.
- **D3 · One reader line changes.** `Read by: R-1272 · code: scripts/product-report.mjs` becomes `Read by: R-1272 · code: scripts/code-map.mjs`. The product report still shows the runtime map's age: its age display keys on the maker line's `runtime-map` artifact, not on reader lines (deliverables.mjs:98, product-report.mjs:197-257; inferred from the code, not run). R-1272 stays counted (measured: 16 live before and after).
- **D4 · No deliverable note in this repository (R-2730).** The suite fails on any deliverable note for this repository's ledger against its HEAD tree. That covers a malformed or misplaced park line, a stale park, a typo'd reader path, and any future note. It is green on main by design (measurement 1). It guards the twelve new lines, because a malformed park otherwise leaves the suite green (measurement 10).
- **D5 · The product report is never a code reader (R-2731).** No `Read by:` line of kind code or prompt in this repository's ledger names `scripts/product-report.mjs`. A person reads its page, and it runs by hand, so naming it would let a row count because of its own report. The check also stops the planned report-ages lane from repeating R-1272's misnaming, which the slate critic warned of.
- **D6 · HANDOFF inside its budget (R-2732).** This repository's HANDOFF.md gets no word-budget finding. The trim is the seat's owner-facing text and lands as the seat's first notes commit on the lane branch, before the build. The builder writes the check and never edits HANDOFF.md. Open question 1 decides whether the budget becomes a suite gate; with "no", R-2732 drops and the trim stays a seat check.
- **D7 · The owner's decisions recorded in HANDOFF.** The Windows run and the checklist passed: the blocking ask leaves, and Next item 1 says so. The priority switched to the artifact work: Next item 1 becomes the new priority's line. Power mode continues: Next item 3's title says so. "Study deliverables" is answered: the ask leaves, and the Landed line names the parks. The second half of "Two planned-lane defaults" is answered (nana-land will print and keep the CI timing records, in its own lane): Next item 4 names it, and the ask keeps only its first half.
- **D8 · Left out.** R-1014's person reader stays for report-at-land (not in the owner's list; open question 3). Other changes this lane does not make:
  - a check that a named reader really reads its artifact, beyond R-2731;
  - a ratchet test listing the five remaining open rows;
  - dropping one-time rows from the Deliverables lists;
  - a phrase check on park reasons;
  - the shared template's organization text;
  - any checker or product-report code change.

## Must-meet rows (EARS, one shall each) and tests

| ID | Requirement (EARS) | Home | Test file::title |
|---|---|---|---|
| R-2730 | WHEN the suite runs, it shall fail on any deliverable note that the deliverable check reports for this repository's REQUIREMENTS.md against the ledger folder's HEAD tree. | FEAT-028, after R-2643 | `packages/nana-pack/tests/requirements-deliverables.test.mjs::R-2730: this repository's ledger gets no deliverable note against its HEAD tree` |
| R-2731 | This repository's REQUIREMENTS.md shall name `scripts/product-report.mjs` in no `Read by:` line of kind `code` or `prompt`. | FEAT-028, after R-2730 | `packages/nana-pack/tests/requirements-deliverables.test.mjs::R-2731: no code or prompt reader in this repository's ledger names the product report` |
| R-2732 | This repository's HANDOFF.md shall get no word-budget finding from the HANDOFF frontier report. | FEAT-002, after R-2504 | `packages/nana-pack/tests/frontier.test.mjs::R-2732: this repository's HANDOFF.md gets no word-budget finding` |

R-2733 to R-2739 stay unused. Each row goes in `planned`, then `implemented` with its `req:` marker and evidence once its test passes.

### What each test does, and why it is red on main

- **R-2730.** After R-2539's block, call `deliverableReportLines(repositoryParsed, <repo root from import.meta.url>)` with the default git runner. Expect the first line to match `^deliverables: \d+ of \d+ made and read by code` and no line starting `deliverable note:`. The assertion names neither the count nor any row. Control: the same call on `repositoryLedger` with one park line rewritten to use `-` for `·` must return one `cannot read Parked:` note, which proves the check can fail. **Green on main by design** (measurement 1: no note). Its red comes from wrong-code pairs 1 to 5. It is the gate that makes the twelve lines safe; without it a malformed park reads as an open row and the suite stays green.
- **R-2731.** From `repositoryFields` (R-2539's `deliverableFieldLinesByRow` map), take every line matching `^Read by: R-\d+ · (code|prompt): `. Split the paths on commas and expect none to equal the report's repo path. The test derives that path from the module's own URL, the way the file already imports scripts. Controls: a fixture ledger holding `Read by: R-001 · code: scripts/product-report.mjs` is caught. `Read by: R-001 · person: the owner reads the page scripts/product-report.mjs writes` is not caught, because a person reader may name the report. **Red on main:** REQUIREMENTS.md:2000 names it for R-1272.
- **R-2732.** In the block at frontier.test.mjs:293-306, add `!repository.includes("word-budget:")`. The control is a document of HANDOFF_WORD_BUDGET + 1 words, built from the imported name, which must get `word-budget:`. **Red on main:** `words=1411 budget=1200` (measurement 8). It turns green with the seat's trim (measurement 9).

Existing tests made false: none expected. R-2539 holds, because every parked row keeps its maker and reader lines. R-2460 holds, because no Deliverables list changes. R-2503 holds on the draft (over=0, banned=0, and every live section keeps a sentence). R-2505 holds, because the Known bugs section keeps the folder pointer and no list item. R-2473 and R-2504 hold (findings=0). The product-report tests that copy the real ledger and HANDOFF assert only general properties: asks present, each ask's kind and since-date rendered. With 27 asks, these stay green (inferred from product-report.test.mjs:45-53 and :325-331).

## Tunables

None new. R-2732 reads HANDOFF_WORD_BUDGET (packages/nana-pack/lib/frontier-config.mjs:10, sealed by R-873's test) through the CLI's output. R-2731's path is the identity of the file under check, which the test derives from the module URL, as every import line names a module; it tunes no behaviour.

## Wrong-code pairs (each must turn its named test red)

1. R-749's park line written `Parked: R-749 - since 2026-10-23: …`: R-2730 (`cannot read Parked:`).
2. R-1239's park line with no reason (`Parked: R-1239 · since 2026-10-23`): R-2730 (`needs a reason`).
3. R-1400's park line moved into CAP-01's span: R-2730 (`names an unlisted deliverable`).
4. A park line added for R-2547, which code makes and reads: R-2730 (`parks nothing`).
5. R-1272's new reader written `scripts/code_map.mjs`: R-2730 (`not tracked at HEAD`).
6. R-1272's product-report reader kept beside the new one: R-2731.
7. R-1272's old reader rewritten as `prompt: scripts/product-report.mjs`: R-2731.
8. main's HANDOFF.md restored over the trim: R-2732.
9. The trimmed HANDOFF padded to 1,201 words: R-2732.

Not caught by design: a park line placed under the feature heading or inside a code fence is prose, gets no note, and leaves the row open. The seat's exact count-line check catches it (Seat steps).

## Known limits (the seat writes them before the final round)

FEAT-028:
- Deliverable lines (park-honestly, plan): R-2730 reads the HEAD tree, so a reader path added in the working tree fails the suite until it is committed. A checkout without git gets the "paths not checked" note and fails it.
- Deliverable lines (park-honestly, plan): a park line under a feature heading or inside a code fence is prose; it draws no note, so R-2730 stays green while its row stays open.
- Deliverable lines (park-honestly, plan): R-2731 names one display reader. Another script that only renders a page for a person passes as a code reader. The checker still proves only that a named reader path is tracked; the seat's reader audit was a one-time grep.
- Deliverable lines (park-honestly, plan): both code readers of the build records print what they read for a person, and the land result's code reader, CI, reads main only after the seat's manual push. Both rows still count (inferred).
- Deliverable lines (park-honestly, plan): twenty of the 41 listed deliverables are parked, so the count line's ratio covers 21 rows.

FEAT-005:
- Writing check (park-honestly, plan): the summary line is parked. The owner's 2026-10-21 ruling that every report runs the check is enforced only by the writing rule; no run checks a report before it is sent.

FEAT-002:
- Frontier checks (park-honestly, plan): R-2732 counts every word in the file, the Landed and Known bugs sections included. Every lane's notes must fit the budget, so the seat trims at each land.

## Docs and lines that change

- **REQUIREMENTS.md, park lines.** Each goes directly after its row's last `Read by:` line. The simulation placed all twelve and parked all twelve (measurement 3).

| Row | Capability | Exact line |
|---|---|---|
| R-749 | CAP-01 | `Parked: R-749 · since 2026-10-23: the owner parked it for now; a writer runs the check by hand under the writing rule, and no existing run can tell a report to the owner from a technical record the rule exempts; a lane that runs the check from a hook deletes this line` |
| R-1400 | CAP-02 | `Parked: R-1400 · since 2026-10-23: the roster is the owner's choice of models, so no run should write it, and code already reads it; an owner decision that lets a run set the roster deletes this line` |
| R-301 | CAP-04 | `Parked: R-301 · since 2026-10-23: install writes the owner's home and stays the owner's act, and the session-start stale-copy line already names the fix; a lane that repairs the links automatically deletes this line` |
| R-327 | CAP-04 | `Parked: R-327 · since 2026-10-23: the seeds are written once, when the owner adopts a project, and the session-start frontier block and project-stale line carry their upkeep; a run that reseeds projects deletes this line` |
| R-1150 | CAP-04 | `Parked: R-1150 · since 2026-10-23: copier renders it once, when the owner creates or adopts a project, and the suite renders the templates only into temporary folders; a run that renders real projects deletes this line` |
| R-1239 | CAP-07 | `Parked: R-1239 · since 2026-10-23: the record is the seat's own wrong-code check, which the seat writes and runs by hand in install, hook and gate lanes; a run that makes it and code that reads it delete this line` |
| R-509, R-532, R-507, R-535 | CAP-08 | `Parked: <row> · since 2026-10-23: no study is open; a person starts each paid study by hand on the owner's decision, and the bench spends nothing without a run flag; the next study the owner opens deletes this line` |
| R-536 | CAP-08 | `Parked: R-536 · since 2026-10-23: no study is open; a person runs the catch ledger by hand when a review question needs it, and its label and match steps call judge models; the next catch-ledger study deletes this line` |
| R-694 | CAP-08 | `Parked: R-694 · since 2026-10-23: the writing trial closed when the owner adopted the writing rule on 2026-10-21, and nothing has read the extract since; a new writing trial deletes this line` |

- **REQUIREMENTS.md:2000.** `Read by: R-1272 · code: scripts/product-report.mjs` → `Read by: R-1272 · code: scripts/code-map.mjs`.
- **REQUIREMENTS.md, rows.** R-2730 and R-2731 after R-2643 (FEAT-028); R-2732 after R-2504 (FEAT-002).
- **docs/requirements-tree.md.** Regenerated with `npm run req:tree -- --write` for the three new rows. The park and reader lines alone change nothing (measurement 3).
- **Test headers.** requirements-deliverables.test.mjs's `@inputs` adds "this repository's REQUIREMENTS.md and its HEAD tree". frontier.test.mjs's header already names this repository's HANDOFF.md. Run `npm run map` if a header changes; `map:check` green at land.
- **docs/known-bugs/.** Delete FEAT-028.md:64 (R-694 counted as open; now parked with its reason). Delete FEAT-002.md:15 and :25 (the word budget stays over; now met). Add the known limits above.
- **HANDOFF.md (seat, notes commit 1, before the build).** 1,411 words now (measured) → 1,157 on the draft (measured, with sample seat fills). The exact text is at `<scratch>/park-honestly/after/HANDOFF.template.md`; the seat copies it into the lane folder as `handoff-trim.md` with the plan. By line of main's file:

| main line | Change | Words |
|---|---|---|
| 3, the italic intro | shortened; keeps "one line per live decision: rewrite, don't accumulate" and the section order | 47 → 27 |
| 10, "This file's word budget" | dropped; the budget is met and the checker prints the count | 30 → 0 |
| 14, Next 1 "Priority review, 2026-10-24" | becomes "**Current priority: the artifact work (the owner, 2026-10-23).** Each artifact comes from an existing run, is read by code, and shows its age. The owner's Windows run and checklist passed that day." | 74 → 33 |
| 16, Next 3 lanes | title becomes "Lanes in flight (power mode continues; the owner, 2026-10-23)"; the seat fills the lanes at each notes step | 19 → about 20 |
| 17, Next 4 queue | adds "The artifact lanes come first, including nana-land printing and keeping the CI timing records (the owner, 2026-10-23)", and takes in the review-timeline diagram from item 6 | 36 → 51 |
| 18, Next 5 Windows first-try failures | the last sentence shortened, same facts | 46 → 39 |
| 19, Next 6 Karpathy's other formats | folded into item 4 as "the review-timeline diagram"; item 7 becomes 6 | 16 → 0 |
| 22, the Open heading | becomes "## Open for the owner"; the tags carry the kind and date | 14 → 5 |
| 24, blocking Windows run | dropped; the owner's run passed on 2026-10-23 | 63 → 0 |
| 25, What a land waits for | the first sentence no longer names a lane | 39 → 35 |
| 26, Study deliverables | dropped; the owner answered park | 28 → 0 |
| 27, Two planned-lane defaults | becomes "**[optional, since 2026-10-22] A copier project's drift line.** It compares against main, not the project's template tag. Default: it stands." | 31 → 21 |
| 28, proxy builder | shortened, same ask and default | 54 → 47 |
| 40, pi 1.4.0 | shortened, same ask and default | 40 → 36 |
| 54, Landed heading | becomes "## Landed" | 10 → 2 |
| 56, archive pointer | shortened | 28 → 16 |
| 57, newest Landed line | moved verbatim to the October archive; this lane's line replaces it at notes | 28 → 27 |
| 61, Known bugs pointer | shortened; keeps the folder and the unplaced file | 30 → 20 |

Every other ask keeps its text. The drafted Landed line: "<land date>: the owner parked twelve deliverables that no existing run makes, each with its reason. The runtime map now names the impact command as its reader."

- **docs/sessions/2026-10.md.** One entry for the lane: the owner's decision, the before and after count lines, the HANDOFF word counts, and the pi-version-support Landed line under "Landed lines moved here verbatim on <date>:".
- **README.md, the requirements skill, AGENTS.md.** Unchanged. No README names a count or a reader this lane moves (`git grep`, measured).

## Seat steps

- Cut `feat/park-honestly` at `~/nana-pi-wt/park-honestly` from main.
- Notes commit 1, before the build: the HANDOFF trim from the template, with the lanes line filled in plain words, no lane code names. Keep the pi-version-support Landed line until notes. Run `nana-writing HANDOFF.md` and `node packages/nana-pack/bin/nana-frontier.mjs HANDOFF.md`, and expect `findings=0` with at most 1,200 words.
- Build with the small builder. The brief carries the Feature line and this Precedent section, and passes brief-check. It also carries the twelve exact park lines, the R-1272 line, the three rows and their tests. It says HANDOFF.md is already trimmed and the builder does not edit it.
- After the build: the per-build escape check, seat titles, the nine pairs, then the two test files whole.
- Run `node scripts/requirements-tree.mjs --check` and read it. Expect exactly `requirements tree: 0 problems; rows 1948; features 39` and `deliverables: 16 of 21 made and read by code, 20 parked`, with no note. Run `npm run report` and read the CAP-01, CAP-02, CAP-04, CAP-07 and CAP-08 cards. Each new park line should show as a claim (R-2642), and R-1272 should show `code: scripts/code-map.mjs`.
- Run the session-start frontier block on the branch. Expect 27 asks (25 optional, 2 parked). Expect the diff against main's ask list to be the two dropped titles and the one renamed title (measurement 9).
- Before the final round: the known-bug deletions and lines, the Landed swap and the archive move, the session entry, then both HANDOFF checks again. Run `node "$HOME/nana-pi/scripts/requirements-moved.mjs" --root . --base main` and carry its output in the review brief and the land (expected: 16 rows in 12 features, inferred).
- Cross-lane, before either lands: tell the report-at-land planner that R-2730 makes its planned `· product-report` artifact a red suite, because the checker exempts only `runtime-map` (deliverables.mjs:31, :130; the critic measured the note). That lane must widen the exemption in the same change. Tell the report-ages planner that R-2731 forbids `Read by · code: scripts/product-report.mjs`.
- If another lane lands first: merge main, re-run the tree check, and update the expected count line in the session entry. Re-trim HANDOFF to 1,200 words or fewer. The park lines sit apart from the planned slate lanes' ledger lines: R-1239's line goes after REQUIREMENTS.md:2006, R-2632's reader is at :2010, and R-1014's lines are at :1995-1996. So a textual conflict is unlikely (inferred). HANDOFF will conflict and the seat resolves it.
- One final reviewer from another model lineage, on the exact tip that lands. CI on the draft PR, the Windows leg included.

## Open questions (each with a one-word default)

1. Make HANDOFF's word budget a suite gate (R-2732)? It keeps the trim. Every later lane's notes must then fit, with about 43 words of headroom on the draft. Default: **yes**.
2. Make "no deliverable note in this repository's ledger" a suite gate (R-2730)? It makes the twelve lines safe. It also forces report-at-land to widen the artifact exemption in its own change. Default: **yes**.
3. Park R-1014's person reader here too, as the slate skeptic suggested? The owner's list leaves it out, and report-at-land plans to place it. Default: **no**.
4. Should a code reader that only prints what it reads for a person still count? This covers the build records' two readers, inferred. The 2026-10-22 ruling says "the code that reads it". Default: **yes**.
5. Rename the half-answered "Two planned-lane defaults" ask to "A copier project's drift line", keeping its since-date? Default: **yes**.
6. The park reasons are the seat's words; the owner's decision named the rows. Use them as drafted? Default: **yes**.
