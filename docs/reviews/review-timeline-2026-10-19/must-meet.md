# review-timeline — must-meet (plan, 2026-10-19; amended by the adversary)

Feature: FEAT-007 · Review a specific revision independently (SUB-010 · Protect and inspect review records)
Rows: R-1560 to R-1565 (block R-1560 to R-1569). Class: ordinary.

## Feature
One read-only command prints a lane's review timeline as markdown. It lists each round in ledger order with each review's revision, role, model, verdict, duration and review file name. Under each sent-back review it lists the MUST findings stated in the file the ledger recorded for that review. It reads only the review ledger and those recorded files, invents nothing and writes nothing.

## Reader
The owner at land, judging whether review worked for this lane: how many rounds, who sent back and for what, what ran over cap or unverified. The seat runs it at land, from the session that ran the reviews, and pastes the output into its land report.

## Class
Ordinary, decided. The lane adds a read-only command beside the review tools and changes none of review-round, review-ledger, pi-review, nana-land, pi-watchdog or review-shape. It imports four exported read-only functions (readRounds, canonicalItem, repoKeyOf, ledgerPaths) and gates nothing.

## Threat model
Honest variation in our tools' output, platforms and configs is in scope: version 1 and 2 tally lines, lines with no end time, unverified and over-cap reviews, empty verdicts, a verdict on the first line only, the MUST layouts reviewers actually wrote, CRLF files, POSIX and Windows paths. Deliberate forgery (a hand-edited tally or audit line, a planted review file) is out; the verdict cross-check guards honesty, not security.

## Design
- `node packages/nana-pack/bin/review-timeline.mjs --item <slug> [--repo <path>]` prints markdown to stdout. Bad arguments, a non-git --repo, a malformed tally or no recorded review give one stderr message and exit 1, with no stack trace.
- Reviews: readRounds filtered by canonicalItem(--item) and repoKeyOf(--repo, default the working folder). A round is a distinct revision, numbered by its first appearance in the tally, as complete() numbers it. Reviews keep tally order inside a round. A duration reads `9m 42s`, or `1h 02m` from one hour up.
- Review file: the `out` of the audit record (ledgerPaths: the audit log and its one rotated generation; kind verdict or verdict-unverified) that matches the tally line on repo, item, revision, role and endedAt. A relative recorded path, a tally line with no endedAt, or no match means no file recorded. The file is read through lib/bounded-read.mjs and printed by its file name only.
- Findings are read only for a SEND-BACK review whose file's last line carrying `VERDICT:` also reads SEND-BACK.
- MUST reading (lib/review-findings.mjs, pure): (1) a heading `MUST — <title>` is one finding. (2) A `MUST` heading or a bare `**MUST**` line opens a section; its findings are the first item form seen in it: a deeper sub-heading, a numbered item, a bullet, or a bold-led paragraph whose bold text is not a label ending in `:`. The section ends at a heading of the same or a higher level. (3) A line that, after an optional list number or bullet and emphasis marks, starts with `MUST —` is one finding. A line counts once. Each title drops numbering and marks and is cut at its first sentence or at FINDING_MAX_CHARS.
- Every printed field has whitespace runs collapsed to one space. Tunables, the R-1562 statements and the R-1563 marks live in lib/review-timeline-config.mjs with provenance. Each new module carries the six-tag header.

## Measured before planning (read-only, 2026-10-19)
- The tally holds no review-file path; the audit log records each review's `out`. Joined on repo, item, revision, role and endedAt, 447 of 447 reviews since 2026-10-12 matched one audit record, none ambiguous (706 of 862 overall; the other 156 are older lines with no end time). complete() writes both records' endedAt from one object.
- The first plan's `<role>-r<round>.md` name rule matched 92 of 156 reviews in this repo since 2026-10-12, and 2 of 127 and 0 of 163 in two other repositories the toolkit serves. Several lanes split one lane's reviews over two folders. So the lookup reads the recorded path and --corpus is dropped.
- No recorded output path served two reviews (0 of 885).
- Real SEND-BACK files include `N. MUST — text` items under a first-line-only verdict, and `- **MUST — title.** detail` bullets. A probe recorded both as SEND-BACK through `review-ledger run`.
- MUST closure lines (`MUST 1 — FIXED.`) appear in 8 committed LAND or older BLOCK files and in no SEND-BACK file.

## Must-meet
| # | Row | Requirement | Test (packages/nana-pack/tests/review-timeline.test.mjs::) |
|---|---|---|---|
| RT1 | R-1560 | WHEN the review timeline runs for an item, the timeline shall list every review the ledger recorded for that item in the current repository and no other, grouped into rounds numbered in the order the ledger first recorded each revision, each review with its short revision, role, model, verdict and duration. | RT1: one item's reviews in one repository, grouped into rounds in ledger order with revision, role, model, verdict and duration |
| RT2 | R-1561 | WHERE the ledger recorded the file a sent-back review was written to and that file's last verdict line also reads SEND-BACK, the timeline shall list under that review each MUST finding the file states in a layout the timeline declares, by its title, and none of its SHOULD or NOTE items. | RT2: a sent-back review lists the MUST findings its recorded file states in each declared layout, and no SHOULD, NOTE, label or detail line |
| RT3 | R-1562 | IF the ledger recorded no file for a sent-back review, or the recorded file is gone, or its last verdict line differs from the ledger's verdict, or no MUST finding can be read from it, THEN the timeline shall state which of these holds for that review in place of findings. | RT3: no recorded file, a gone file, a disagreeing file or no readable MUST is stated for that review and no finding is listed |
| RT4 | R-1563 | WHEN a recorded review is unverified, carries an over-cap reason, has no verdict, or comes from an older ledger line without a model or duration, THEN the timeline shall mark that review's line with unverified, the over-cap reason, no verdict, or - for each missing field. | RT4: unverified, over-cap, no-verdict and older ledger lines carry their marks |
| RT5 | R-1564 | The review timeline shall print no absolute path, naming each recorded review file by its file name alone. | RT5: the timeline prints no absolute path and names each review file by its file name |
| RT6 | R-1565 | The review timeline shall leave the ledger folder and every folder holding a recorded review file unchanged, creating, removing or rewriting no file in them. | RT6: the timeline leaves the ledger folder and the review folders byte-for-byte unchanged |

## Red today
A probe in a temp HOME and temp repository recorded real reviews with `review-ledger run`. `bin/review-timeline.mjs` does not exist (MODULE_NOT_FOUND, exit 1). `review-ledger report` prints flat lines with no rounds, file names or findings. Every test first asserts exit 0 and a listed review, so RT5 and RT6 are red today too and cannot pass on a command that prints nothing.

## Known limits
- Older tally lines with no end time, reviews whose audit generation has rotated away (one previous generation is kept), and relative recorded paths show "no review file recorded".
- A review file moved or deleted after its run shows "review file gone". Scratch folders are temporary, so the seat runs the timeline at land from the session that ran the reviews. The timeline searches no other folder.
- A MUST layout outside RT2's five shows "no MUST readable", or could list a detail line. A sent-back confirmation round that lists closed MUSTs as `MUST n — FIXED` would list them (none measured so far).
- No closure tracking, no review in flight, no line under a legacy `path:` repo key, no verdict score.
- Markdown only. This lane does not close the queued review-timeline diagram: HANDOFF keeps it open, and the picture should reuse the blast-radius lane's drawing code, not a second renderer.
- The MUST reader repeats part of apps/bench's catch extractor on purpose: the code-map layer rule forbids a package importing an app, and that extractor reads an older corpus.
- Nothing runs the timeline automatically. The new rows leave FEAT-007's product-report assessment stale until someone refreshes it.