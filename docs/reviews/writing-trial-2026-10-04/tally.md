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

**Landing date:** _(filled by the seat on landing)_

**Stop condition:** day 14 after landing, or 20 REPORTS checked (the `HANDOFF.md` corpus does
not count toward this), whichever comes first. Stop early after two lost-detail complaints —
Jake saying a report dropped detail he needed.

| Date | Reports checked | Verdict passes | Report sentences | Report over-cap | HANDOFF sentences | HANDOFF over-cap | Lost-detail complaints |
|---|---|---|---|---|---|---|---|
| _(landing date)_ | 0 | 0/0 | 0 | 0 | 0 | 0 | 0 |

Targets (design-ruling.md §3, re-based on the Markdown-aware splitter), one set per corpus:
over-cap at or under a quarter of the baseline share `baseline.md` measures on landing day,
for REPORTS and for HANDOFF separately; a verdict word in the first sentence in 90% of
reports; zero banned words in either corpus. Then Jake's call: faster to read, nothing
missing.
