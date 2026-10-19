# review-timeline — plan attack (one adversary)

Verdict: AMEND

AMEND: the plan finds review files by a name rule that misses most real reviews. The ledger already records each review's exact file.

1. Lookup (the main amendment). The plan rebuilt each file name as `<role>-r<round>.md` inside a `--corpus` folder. Measured against the real ledger, read-only:
   - That rule matched 92 of 156 reviews in this repo since 2026-10-12.
   - It matched 2 of 127 and 0 of 163 in two other repositories the toolkit serves.
   - Several lanes split their reviews over two folders (`*-review` and `*-final`), which one `--corpus` folder cannot cover.
   - The audit log (`review-ledger.jsonl`, reached through the exported `ledgerPaths`) records each review's output path. Joined to the tally on repo, item, revision, role and endedAt, it matched 447 of 447 reviews since 2026-10-12, none ambiguous.
   - It matched 706 of 862 overall. The other 156 are older lines with no end time.
   - complete() writes endedAt into both records from one object.
   - No output path served two reviews (0 of 885).
   - So `--corpus`, the name rule, the guard on path separators in roles and the known limit about plan reviews colliding are all dropped. This design is simpler and more correct.

2. RT5 is now red against the natural wrong code. The audit stores absolute paths that hold the home folder, so printing the recorded path fails RT5.

3. Real layouts the plan's fixtures missed:
   - A verdict on the first line only, with `N. MUST — text` items (another repo's reviewer). Its last line that is not blank is a NOTE.
   - `- **MUST — title.** detail` bullets.
   - A probe recorded both as SEND-BACK through `review-ledger run`. RT2 now carries five layouts.
   - The verdict cross-check reads the last line that carries `VERDICT:`. The new wrong code to try is "read the verdict from the last line that is not blank".

4. Guards could pass on a command that prints nothing. Every test now first asserts exit 0 and that its reviews are listed. RT5 and RT6 are therefore red today and cannot pass vacuously.

5. RT4: a `|` in the over-cap reason only matters for a table. The output is a list, so the test now uses a reason holding a line break, and the code collapses whitespace in every field.

6. Lane class decided: ordinary.
   - The lane adds a read-only reporter and changes none of the named review or land tools.
   - It imports four exported read-only functions: readRounds, canonicalItem, repoKeyOf, ledgerPaths.

7. Changes to rows:
   - R-1561 is no wider than its test: it now reads "in a layout the timeline declares".
   - R-1562, R-1564 and R-1565 are reworded for recorded files instead of a corpus folder.
   - IDs stay inside R-1560 to R-1565. No branch uses R-1550 to R-1599.

8. Frame (inferred, not changed here). HANDOFF queues "the review-timeline diagram". This lane ships markdown only. The must-meet says HANDOFF keeps the diagram open, so the picture can reuse the blast-radius lane's drawing code instead of adding a second renderer.

9. Duplication is kept on purpose. `apps/bench/lib/catch-extract.mjs` already reads MUST findings. code-map.config.json forbids a package importing an app, and that extractor reads an older corpus. Recorded as a known limit.

Red today (probed in a temp HOME and repository; my probe folders are removed):
- `review-ledger run` recorded real reviews.
- `bin/review-timeline.mjs` gives MODULE_NOT_FOUND.
- `review-ledger report` prints flat lines with no rounds, file names or findings.

Windows and Linux:
- No platform-specific code.
- Tests set HOME and USERPROFILE.
- RT5 checks for the tmpDir folder's unique name, which survives any spelling of the path.
- `path.basename` handles both separators on win32.
- `review-ledger.test.mjs` is not on the Windows skip list.
- Still unverified on CI: Linux and Windows.

Writes: tests and records stay under tmpDir, and every spawn gets a temp HOME and USERPROFILE. The brief says this outright, because a spawn left on the real home would write to the real ledger.

Conflicts and waiting:
- No in-flight lane edits the new files.
- Every in-flight nana-pi lane edits REQUIREMENTS.md, docs/requirements-tree.md and the R-291 leaf total and its check title. Most also edit docs/code-map.md.
- clean-revision, gate-rm-workdir, rulings-file and win-gate-tmp also edit packages/nana-pack/README.md, in other sections.
- All of these conflicts are mechanical: regenerate the tree and the map, then re-add the total.
- clean-revision changes workingState only. It does not touch readRounds, canonicalItem, repoKeyOf, ledgerPaths or the audit `out` field.
- bench-win has already landed (main ab5c3e8).
- No wait is needed. Merge main before the final review.

Files the build touches:
- REQUIREMENTS.md
- docs/requirements-tree.md
- docs/code-map.md
- packages/nana-pack/README.md
- packages/nana-pack/bin/review-timeline.mjs (new)
- packages/nana-pack/lib/review-findings.mjs (new)
- packages/nana-pack/lib/review-timeline-config.mjs (new)
- packages/nana-pack/tests/review-timeline.test.mjs (new)
- packages/nana-pack/tests/requirements-tree.test.mjs (R-291 leaf total and check title, +6)
- The seat adds docs/reviews/review-timeline-2026-10-19/ plus HANDOFF.md and docs/sessions/2026-10.md before the final round.

Claim most likely wrong: that the MUST reader lists exactly the MUSTs a real review states.
- Its exactness rests on spot checks and five fixture layouts.
- A reviewer layout outside those could add a detail line as a finding, or drop one.
- Runner-up: that the seat runs the timeline while the scratch review files still exist. Otherwise it honestly shows "review file gone" for every review.
