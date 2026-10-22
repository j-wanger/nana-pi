# Review — scrub-records (the records stop naming the owner and describing the owner's work; the catch-ledger study re-keyed exactly; the allowlist holds only pinned entries), 2026-10-21 (the final reviewer)

Feature: FEAT-032 · Keep instructions and documentation accurate (R-2517 sits in FEAT-038)

Class: ordinary. Threat model: honest variation in scope — a word in a context the table misreads, a code token or a fenced block, a byte-order-marked log, a superseded cache record, a Windows checkout, a later lane pasting a log with a home path; deliberate forgery out.

Never write a personal name, login, surname, work acronym, regulator, report type, act, country or work-domain term into your review. The identity words are hashed in `identity-scan.config.json`; do not try to recover them; probe with made-up words and injected digests. In prose say "the owner".

**Read the diff without the records.** A plain diff of a record file shows the removed words. Review the code and notes with:

```
git diff 383b1588..HEAD -- . ':!docs/reviews' ':!docs/sessions' ':!research' ':!apps/bench/studies' ':!docs/*.md' ':!docs/product-report/assessments.json' docs/reviews/scrub-records-2026-10-21 apps/bench/studies/catch-ledger-2026-09-28/OUTPUTS.sha256
```

Read records only at HEAD, by path and line, never as a diff. Use `git diff --stat 383b1588..HEAD` for the list of changed records, and `docs/reviews/scrub-records-2026-10-21/proof.mjs --base 3e633512` (which prints counts and paths only) for what changed in them.

The plan of record is `docs/reviews/scrub-records-2026-10-21/must-meet.md`: decisions D1 to D7, the proof, four rows (R-2517 to R-2520), the tunables and the known limits; `plan-draft.md` and `plan-attack.md` are its inputs. `build-brief-1.md` and `build-brief-2.md` are the two builder sessions. The seat checked build 1 and sent four findings back in brief 2 (F1: the table replaced words inside other words, 5,286 lines; F2: lost escapes, 52 lines with the name twice; F3: mid-sentence capitals, 2,560 lines; F4: a proof blind to all three). Session 2 fixed them and ran the scrub: 7be2a0ce (scripts and tests), fe331dcd (records and study), 272514cc (config).

The seat's record at 272514cc:
- Its own token-by-token comparison with 3e633512, independent of the lane's proof, over every record outside the study: 5,410 changed lines; no line adds a token outside the replacement words; the only non-identity tokens removed are "desk" (460, the work project's folder name becoming `work-project`) and "a" (8, the article rule); 0 new mid-sentence capitals; 0 lines with the name twice; no line count changed.
- `paraphrase.tsv` (the seat's 14 lines, found with a finder kept outside the repo because its search terms name the work): the seat read every reworded line at HEAD. They hold no domain term, keep their structure, and the five lift verify rows equal the current lift fixture's neutral rows. A sweep of every tracked file for the seat's domain terms finds only false matches (such as "declared flags") and generic instructions in this lane's own plan.
- The scan prints `summary files=3675 findings=0 totals=5,0,0,4`; the allowlist holds six byte-pinned and two frozen-desk entries.
- The study: only labels, matches, ledger, rows and skipped changed; results.json, table.md, kappa-pairs.json, reports.json and RESULTS.md are unchanged, and `OUTPUTS.sha256` is unchanged since it was written at 3e633512.
- The seat check prints `0 missing`; catch-ledger passes 78 checks and identity-scan 7.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement 383b158..272514c: 4 rows in 2 features
FEAT-032 · Keep instructions and documentation accurate
  R-2518 new (implemented)
  R-2519 new (implemented)
  R-2520 new (implemented)
FEAT-038 · Interpret workflow experiments and their limits
  R-2517 new (implemented)
```

CI: run 39704463803 at 272514cc (PR #160): suite (ubuntu-latest) 203 files, 200 PASS, 0 FAIL, 3 SKIP, checks 8204 pass, 0 fail; suite (macos-latest) 203 files, 201 PASS, 0 FAIL, 2 SKIP, checks 8265 pass, 0 fail; suite (windows-latest) 203 files, 185 PASS, 0 FAIL, 18 SKIP, checks 7195 pass, 0 fail, with `identity-scan.test.mjs` 7 pass and `catch-ledger.test.mjs` 78 pass on all three; install-check success on macOS and Windows. Since 272514cc the seat added only the notes (HANDOFF, known-bug files, session entry) and this brief.

Judge whether the feature works for the owner, whose public repo must carry no owner name and nothing about the owner's work, and report:
- each must-meet check is red with its feature removed or with the obvious wrong code, and green with it: R-2517 against a wrong re-key (name only, name and lane, none) and a table-scrubbed skipped file; R-2518 against each injected case; R-2519 against the old writer; R-2520 against the default buffer;
- the scrub table replaces a word only where the scan counts it, keeps scripts and data parseable, and reads as the plan's D1 says; sample records by path and line at HEAD across the folders (reviews, sessions, research, studies, design docs, CI logs, system prompts, JSON);
- the proof's checks do what the must-meet says, including the ones that do not reuse the table;
- the catch-ledger re-key is exact and R-2517 would catch a wrong one;
- the 14 reworded lines carry no work detail and lost no fact;
- the README's scan line, the row texts and the code comments say what the code does;
- the HANDOFF lines (one Landed line, the queue item removed), the known-bug changes (five fixed lines removed from FEAT-032's file, two added there, one each in FEAT-038's and FEAT-007's files) and the session entry are accurate.

Known limits already carried (do not send back for them): history keeps every word; records' home paths and cited memory files no longer resolve and CI logs no longer show what CI printed; superseded cache records keep their old keys and the match prompt's cut moves; 4 skipped rows' text cut moves; the paraphrase is human judgement beyond the preserved-token rule; R-2519 pins an absence; pi-review's git helper keeps the 1 MiB limit; and every limit in FEAT-032's file.

Probe in a temporary folder with a temporary HOME. Do not edit the worktree.
