# Writing trial — tally

Template for the seat (design-ruling.md Amendment 1, 2026-10-04, §A4, SHOULD 2; corpus
separation per astra r2 SHOULD 3, 2026-10-04). Filled by hand, one row per day.

**Two corpora, two invocations — never mixed.** A report is addressed to Jake and carries a
verdict; a `HANDOFF.md` line does not (its scope paragraph excludes it from the verdict and
identifier checks by design). Checking both the same way would distort the 20-report stop
condition and blur two different targets.

- **Reports**, once per report sent: `node packages/nana-pack/bin/nana-writing.mjs --report`
  on the text. Record its sentence count and whether the verdict passed.
- **`HANDOFF.md`**, once per edit: `node packages/nana-pack/bin/nana-writing.mjs HANDOFF.md`
  (no `--report` — verdict and identifiers do not apply there). Record its sentence and
  over-cap counts from the diff lines added that day.

**Landing date:** 2026-10-04 (merge on main)

**Stop condition:** day 14 after landing, or 20 REPORTS checked (the `HANDOFF.md` corpus does
not count toward this), whichever comes first. Stop early after two lost-detail complaints —
Jake saying a report dropped detail he needed.

| Date | Reports checked | Verdict passes | Report sentences | Report over-cap | HANDOFF sentences | HANDOFF over-cap | Lost-detail complaints |
|---|---|---|---|---|---|---|---|
| 2026-10-04 | 0 | 0/0 | 0 | 0 | 0 | 0 | 0 |
| 2026-10-05 | 6 | 6/6 | 176 | 0 | 60 | 0 | 0 |

2026-10-05 note: the original hand tally covers the reports it checked, not every report-sized final. Status updates remain style-scoped but are not individually checker-scoped; the report-only command is not a status-update habit metric.

Reviewer-harm trigger record: the “reviewers drop paths” trigger was checked against the post-landing review corpus and did not fire. Identifier density per 100 words: pre-landing 6.9, 5.7, 4.6, 4.9; post-landing 4.8, 4.9, 2.1, 7.1, 7.6, 7.9, 3.6, 4.0, 6.1. Over-cap findings stayed at 0–1 per file in both periods. These aggregate measures do not prove that no necessary detail was dropped.

The pi half has no corpus yet: the journal does not distinguish Jake-facing UI output from worker or reviewer sessions.

The reproducible extractor is `extract.mjs`; the treated corpus and same-method baseline remeasurement are recorded in [after.md](after.md) and [rebaseline.md](rebaseline.md). The 2026-10-05 after count is 14 reports. The baseline uses the ruled session-start window and yields 32 units; the hand-published verdict count remains non-reproducible.

Targets (design-ruling.md §3, re-based on the Markdown-aware splitter), one set per corpus:
over-cap at or under a quarter of the baseline share `baseline.md` measures on landing day,
for REPORTS and for HANDOFF separately; a verdict word in the first sentence in 90% of
reports; zero banned words in either corpus. Then Jake's call: faster to read, nothing
missing.
