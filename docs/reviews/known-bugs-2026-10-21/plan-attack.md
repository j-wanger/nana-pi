# Attack: known-bugs per feature (plan draft, main 086eb4b2)

Probe: `git archive main` at `scratchpad/kb-adv/{repo,mod}`, HOME=`kb-adv/home`. Verdict: 4 MUST, 9 SHOULD, 8 NOTE. The mechanical move itself is sound. The shared text, the size gate and the merge story are not.

## MUST

**M1. The proposed shared text breaks R-598 (11 failing checks).** I applied §3.5's Review bar and Land checklist text to `mod/`. `skill-claims.test.mjs` failed 3 checkout path checks; `templates-render.test.mjs` (copier 9.19.1) failed 8, two per render target. The cause: `` `docs/known-bugs/FEAT-nnn.md` `` and `` `unplaced.md` `` are path claims (readme-check `claims()`) that exist in no checkout or render, even after the move. The plan misses R-598.
Fix: write `` `docs/known-bugs/<feature>.md` `` and an unbackticked docs/known-bugs/unplaced.md. Never backtick `docs/known-bugs/` in the shared file. I probed both spellings: `claims()` extracts neither. Add no exemptions.

**M2. R-2507 plus R-2508 turn the suite red in about two FEAT-013 lanes, and nothing the plan allows can fix it.** The moved FEAT-013.md is 47,144 bytes, 92.1% of the window (probe `kb-adv/move-probe.mjs`). FEAT-013 averages 2,243 bytes of known bugs per lane (178 lines, 21 lanes), so the headroom is about 4,000 bytes. The queue's next items are install and settings lanes. Every remedy is closed: a second file for one feature is a name finding, a feature split is Jake's tree call, and deleting lines breaks the lossless move. A red R-2508 blocks `nana-land` for every later lane.
Fix: R-2508 asserts no *name* finding. Size stays a reported line (R-2507), in keeping with the frontier checker's report-only posture. Add a Next line: FEAT-013's file is near one read, so split or prune it (Jake's call).

**M3. No pinned or reviewable check proves the move, and the plan defines it against a fixed 891.** R-2504, R-2505 and R-2508 all pass if the seat deletes the 891 lines and adds an empty FEAT-001.md. The seat check names "the 891 lines in main:HANDOFF.md". Once any lane lands during the build, the right base changes. My merge simulation (`kb-adv/merge`): a lane appends 2 lines and rewrites line 913. Merged against the move, that gives one conflict hunk, 893 lines against 1. Taking main's side drops all three changes, and every row stays green.
Fix: commit `docs/reviews/known-bugs-<date>/conserve.mjs`. It reads the Carried residuals section of `git show $(git merge-base HEAD main):HANDOFF.md`, aborting on any non-blank line not starting `- `. It compares that section, as a multiset with CR stripped, against every `- ` line in `docs/known-bugs/*.md` plus a committed `fixed.txt`, minus a committed `added.txt` (this lane's new lines). It checks each file keeps source order and HANDOFF keeps none of the lines, then prints the counts. Re-run after every main merge; the review brief carries its output and the reviewer re-runs it. Baseline: the planner's placement conserves (891 = 890 moved + line 913; missing 0, extra 0; no continuation lines, CRLF or duplicates).

**M4. The plan's concurrency mitigation is false.** §5 says a parallel lane "fails R-2505 after merging main". That is true only if its seat keeps the old heading. If the seat takes main's side, the lines vanish and R-2505 passes (M3 simulation). Two lanes may build at once, and the next queue item, the owner-name scrub, rewrites HANDOFF lines (6 residual lines name the owner, 60 say "owner"). No lane branch is open today.
Fix: precondition at land: `git diff main...feat/<x> -- HANDOFF.md` adds no residual line for any open lane. Start the scrub after this lane lands. The strengthened R-2505 below catches the keep-ours case.

## SHOULD

- **S1. R-2505 passes when lines stay under a renamed heading.** It also passes when the folder is named only in this lane's Landed line, because "finds the sealed folder name" can match anywhere. Fix: a Known bugs section that names the folder and holds no list item (see AMENDED).
- **S2. R-2509 has a cheap wrong implementation.** It excludes only "HANDOFF's residuals", so "HANDOFF's carried residuals" passes, and the Land checklist goes unchecked. Fix: check the Review bar and Land checklist bullets. No bullet may hold both "HANDOFF" and "residual". Import `KNOWN_BUGS_DIR`.
- **S3. "Its feature" is ambiguous.** The move files a line under the lane's brief feature, while a reader looks under the feature the bug is in. Example: silent-main-guard's lines 270–273 (bench start check, roster import, temp-link cleanup) go to FEAT-028. About 5 of 30 sampled corpus placements could go either way. Fix: the rule says "the feature whose behaviour it concerns". The move keeps lane placement as a declared limit.
- **S4. The ruling is not in the rulings file.** Ruling 2026-10-16 requires a new ruling to land in its lane's reviewed change. cap-kinds did this in f3331b06. Add "2026-10-21: Known bugs live one line each in a file per feature, not in HANDOFF." The file has room (2,714 of 8,192 bytes).
- **S5. R-2507 needs a byte-versus-character case.** FEAT-013.md is 47,106 characters and 47,144 bytes, and 40 of the 891 lines are non-ASCII. Without a multibyte boundary case, an implementation that counts `text.length` passes.
- **S6. R-2506 is missing cases.** Add SUB-005.md, CAP-01.md, FEAT-001.MD, a subfolder and a missing REQUIREMENTS.md. Frozen and retired fixtures must use the ledger's real `frozen (<reason>)` and `retired (<successor>)` form (requirements-tree.mjs:19).
- **S7. The README entry is required, not "inferred".** `documentedProblems` (readme-check.mjs:530–545) fails any script under `scripts/` that no README names, and the flag check validates `--root`.
- **S8. A split or retirement turns R-2508 red in the regroup lane, and its builder may not fix it** (the new preamble line). Declare this. The seat moves the retired feature's lines in that lane's plan commit.
- **S9. The plan does not order the seat's work against the build.** The builder cannot make R-2504, R-2505 or R-2508 green, so the seat must move the lines in the plan commit before the build (frontier-first did the same). The writing rule's scope also shifts without a word: known-bug lines were "a HANDOFF.md line" under the rule adopted today. Put it to Jake in one Open line. Default: technical records.

## NOTE

- N1. "None needs [the row fallback] today" is false. Lines 140–143 (readme-check-cp1252) placed by rows, because that brief's Feature line reads "SUB-019 in FEAT-014". The rows agree with the brief.
- N2. 30 of the 93 area-only lines name a lane in prose (Rulings file, Clean revision, Study stop, Watchdog-exit). An alias table cuts hand placement to about 63. Two of the 7 area-propagation guesses are wrong: Mutation runner and Product report under FEAT-013.
- N3. Label drift: drop the label from each file's heading. That is the cheaper option, and nothing then drifts.
- N4. yokai-world (57 KB HANDOFF, 40-feature tree), jev-research and the-hive keep old residual lines; the plan surveyed four projects that have none. Say the rule applies going forward.
- N5. Line 150 ("Desk residuals live in apps/desk/README.md Known limits") belongs in the HANDOFF pointer section, not in unplaced.md.
- N6. Class ordinary is correct: pi-worker is off the ladder's list, R-1110 has no whole-text check, and the review standard is untouched.
- N7. After the move the frontier reports only `word-budget: words=2556` (15,727 bytes). No test pins the repository's size findings.
- N8. R-2509 and R-2510 sit in FEAT-002, apart from their siblings R-1104 (FEAT-014) and R-1110 (FEAT-006). Allowed.

## AMENDED must-meet rows

IDs are inferred to be free (the highest is R-2503); the seat assigns them. Tests run from `packages/nana-pack/tests/`.

| Row | Requirement (EARS, one shall) | Test file :: title | What the test does |
|---|---|---|---|
| R-2504 | This repository's HANDOFF.md shall get no file-size finding from the HANDOFF frontier report. | `frontier.test.mjs` :: `R-2504: this repository's HANDOFF.md gets no file-size finding` | Repository file has no file-size line; a `READ_WINDOW_BYTES + 1` control has one. |
| R-2505 | This repository's HANDOFF.md shall carry a Known bugs section that names the known-bugs folder, holds no list item, and stands where no Carried residuals heading remains. | `known-bugs.test.mjs` :: `R-2505: this repository's HANDOFF.md points to the known-bugs folder from a Known bugs section with no list item and has no Carried residuals heading` | Headings outside fences; the section contains `KNOWN_BUGS_DIR` and no list item. Controls with a `- ` line under it, or a Carried residuals heading, fail. |
| R-2506 | WHEN an entry in the known-bugs folder is neither the unplaced file nor named `FEAT-nnn.md` for an active or frozen feature, the known-bug check shall report its name. | `known-bugs.test.mjs` :: `R-2506: a known-bug entry named for a missing, proposed or retired feature, or not named for a feature, is reported` | Temp tree: FEAT-001 active, 002 `frozen (x)`, 003 `retired (FEAT-001)`, 004 proposed. Pass: FEAT-001.md, FEAT-002.md, unplaced.md. Reported: FEAT-003/004/099.md, feat-001.md, FEAT-001.MD, SUB-005.md, notes.md, a subfolder. Flat or missing ledger: only unplaced.md passes. |
| R-2507 | WHEN a known-bug file is over 51,200 bytes or 2,000 lines, the known-bug check shall report that file as a size line with its byte and line counts. | `known-bugs.test.mjs` :: `R-2507: a known-bug file over the read window in bytes or in lines is reported with its counts` | One byte over via a multibyte character; one line over (CRLF, no final newline); exactly at both limits. Limits imported from frontier-config. |
| R-2508 | This repository's known-bugs folder shall hold at least one feature file and get no name finding from the known-bug check. | `known-bugs.test.mjs` :: `R-2508: this repository's known-bugs folder holds feature files and gets no name finding` | Repo root: at least one FEAT file, no name finding; a size line allowed. |
| R-2509 | The shared working pattern shall state that a finding that does not block the land goes as one line in the known-bug file of the feature it concerns, or in the unplaced file. | `templates-render.test.mjs` :: `R-2509: the shared working pattern records a non-blocking finding in its feature's known-bug file, not HANDOFF` | Review bar bullet holds `KNOWN_BUGS_DIR` and `UNPLACED_FILE`'s stem; no bullet holds both "HANDOFF" and "residual"; main's text fails. R-859 covers AGENTS.md. |
| R-2510 | The builder preamble shall forbid a builder to edit the known-bugs folder. | `worker-lane.test.mjs` :: `R-2510: the builder preamble forbids editing HANDOFF.md, the known-bugs folder and session archives` | Runs `preambleOnce` on the new line, built from `KNOWN_BUGS_DIR`. |

The seal test `seal: the known-bugs folder is docs/known-bugs` cites R-2509.

**Seat checks:** `conserve.mjs` at the final tip against the merge base (M3); the open-lane HANDOFF diff (M4); skill-claims and templates-render with copier (M1); requirements-moved, map:check, the readme check; `npm run test:locked`.

**Order:** the seat moves the lines in the plan commit; the builder builds; the seat re-runs `conserve.mjs` after each main merge; the notes add the rulings line, the FEAT-013 Next line and the writing-scope Open line.
