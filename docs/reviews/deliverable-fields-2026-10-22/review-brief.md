# Review — deliverable-fields (each deliverable names what makes it and what reads it; a report-only check in every tree run; a count line), 2026-10-22 (the final reviewer)

Feature: FEAT-028 · Maintain requirement identity and trace links

Class: ordinary. Threat model: honest variation in scope — a tree with no fields, a kindless or partly kinded tree, a deliverable retired or homed elsewhere, a maker or reader naming a path another project lacks, Windows `\` paths, CRLF ledgers, a ledger in a subfolder, a staged-only file, a non-ASCII name, an unborn HEAD, old committed outlines, and an honest seat mistake in one of the 102 lines; deliberate forgery out (a line written to name real code that the writer knows never makes or reads the artifact).

The owner's ruling (2026-10-22, top priority): a produced artifact is a feature to maintain. Each deliverable names the run that makes it and the code that reads it; a report-only check flags a hand-made maker or a rule-only reader; closing those comes first. The product report's maker, reader and age column is the next lane (lane B), not this one.

The plan of record is `docs/reviews/deliverable-fields-2026-10-22/must-meet.md`: decisions D1 to D8 (D1a's grammar), rows R-2535 to R-2540 and the amendment R-2541, the tunables and the known limits; `plan-draft.md` and `plan-attack.md` are its inputs. `build-brief-1.md` and `build-brief-2.md` are the two builder sessions: 10531a4c (the module, the check in every mode, the movement entry, the text) and 0a57bf06 (the 102 lines, R-2539, R-2541). The seat's table of lines is `deliverable-lines.tsv` (columns cap, row, line, basis, verdict, why), written from the 2026-10-22 deliverable audit.

The seat's record at 196c25b5:
- The 102 lines in REQUIREMENTS.md equal the table's non-removed rows exactly, in order, per capability (a script compare).
- `node scripts/requirements-tree.mjs --root .` and `--check` each print `requirements tree: 0 problems; rows 1789; features 39`, then `deliverables: 12 of 38 made and read by code`, and no note.
- The seat check prints `0 missing`.
- The seat's wrong-code pairs: 12 of 12 red at 0a57bf06 (`seat-mutate.mjs`, `seat-mutate-output-0a57bf06.txt`): a bare run, a bare code or prompt reader, index paths for HEAD paths, notes only under `--root`, no reason test, lines read through feature spans, lines rendered in the outline, a manual maker counted as automatic, a rule reader counted as code, the count only under `--root`, one deliverable's line dropped, and the movement report blind to changed lines.
- The full suite in build 2: `204 files: 202 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8274 pass, 0 fail, 39 skip`.

Tree movement (the lane's own `node scripts/requirements-moved.mjs --root . --base main`; main's copy does not yet list changed lines): 45 rows in 25 features, the seven new rows and 38 rows whose `Made by:`/`Read by:` lines changed. The full output is `requirements-moved.txt` in this folder.

CI: run 39719964396 at 196c25b5 (PR #162): suite (ubuntu-latest) 204 files, 201 PASS, 0 FAIL, 3 SKIP, checks 8211 pass, 0 fail; suite (macos-latest) 204 files, 202 PASS, 0 FAIL, 2 SKIP, checks 8272 pass, 0 fail; suite (windows-latest) 204 files, 186 PASS, 0 FAIL, 18 SKIP, checks 7202 pass, 0 fail, with the three lane test files passing there (4, 6 and 95 checks); install-check success on macOS and Windows.

Since 196c25b5 the seat added only the notes (HANDOFF, the rulings line, known-bug files, the session entry) and this brief.

Judge whether the feature works for the owner, who wants every artifact the toolkit produces to say what makes it and what reads it, so a hand step or an unread output shows up every time the tree is checked, and report:
- each must-meet check is red with its feature removed or with the obvious wrong code, and green with it; the seat's pairs above are the floor, not the ceiling;
- the grammar the check reads is D1a's, a note never becomes a tree problem or a non-zero exit, the outline is unchanged by the lines, and a tree with no lines keeps today's output;
- path checking uses the ledger folder's HEAD tree, runs git only when a path is to be checked, and gives one "paths not checked" note on any git error, never a throw;
- the 102 lines are true: sample at least fifteen across all seven product capabilities, and for each `code`, `prompt` or automatic maker line, open the named file and say whether it makes or reads that row's artifact; a line that claims code that does not do it is a material defect of this lane, because the count would then overstate the gap closed;
- the count line counts only deliverables with both an automatic maker and a code or prompt reader, out of all listed deliverables, in every mode;
- the movement report's changed-lines entry, and its unchanged no-change output;
- the text (the ledger's organization sentence, the requirements skill, the shared template sentence, the README's tree paragraph) says what the code does;
- the HANDOFF lines (one Landed line; the queue reordered with the artifact work first; the review pack's new sentence; the answered ask removed), the rulings line, the known-bug lines (seven in FEAT-028's file; three late scrub-records notes in FEAT-032's file and one in FEAT-038's) and the session entry are accurate.

Known limits already carried (do not send back for them): every line in FEAT-028's known-bug file that names this lane, and the must-meet's known limits.

Probe in a temporary folder with a temporary HOME. Do not edit the worktree.
