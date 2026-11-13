## 5. Audit mode — an existing project with no rows yet

Extract the standing set from what the project already knows, then find what cannot be true.

**Pass 1 — extraction (read-only workers).** One worker per repo or per area, read-only, each
briefed with:

- **Areas** — the capabilities and features the worker drafts rows under once the ledger has a
  tree (read the design docs, `HANDOFF.md`, phase plans and the test suite; nothing else is a
  source).
- **Statuses** — the five above, with the rule that `untested` is the honest default when the
  code appears to hold a row and nothing checks, and `violated` is for code that contradicts a
  documented rule.
- **Evidence form** — `tests/<file>::<test title>` verbatim from the suite (the project's test
  directory — `tests/` in a nana template), or `<repo>:` prefixed for a sibling, with that
  repo's own spelling. A title you cannot copy exactly is not evidence.
- **Extraction notes** — a separate file (`docs/requirements-extraction-<date>.md`): every
  judgement call on a status, every stale doc claim found, every merged row whose clauses
  should be split later, every artifact format or join key a consumer binds to. This file is
  where the honest uncertainty goes so the rows can stay clean.

Assemble the rows yourself; workers draft, the seat owns the file. Allocate ID blocks per
repo or area up front (`R-001`–`R-199` repo A, `R-200`–`R-299` repo B, …) so later rows never
need renumbering. Then place the markers mechanically (an idempotent script over the cited
titles) and get the rail green.

Set `NANA_REQ_UNCLAIMED=1` and run the suite; the rail prints every test declaration no
marker claims. Treat each listed declaration as a proposal: mark a row it already evidences,
draft a row for behaviour no row states, or leave it. A listed line is never a row or evidence
by itself. A zero count covers only what the grammar sees; `req-candidate:` tests stay listed
until their rows are promoted.

**Pass 2 — conflicts and failing-now.** A second read-only pass, two tables:

- **Conflicts** — rows that cannot all hold at once. Each one: the row IDs, what the conflict
  is, whose contract has to move, and **whose call it is** (the owner, or the seat). Carry them
  in `REQUIREMENTS.md` under `## Open questions`, numbered, until ruled. A conflict is not a
  bug report — it is a decision someone owes.
- **Failing now** — rows whose status is false against the code or the artifacts: an
  `implemented` row no test actually pins, a performance row that is a measured miss, a row the
  committed data contradicts. Correct the statuses the same day the audit lands.

Rule the conflicts that block the work **before** any cleanup pass, or the pass rewrites rows
it should not touch. The seed's general-engineering feature (configuration and provenance,
module boundaries, the code map, documentation — the README contract, G-012 — and the
requirement set itself) already holds the G rows; the audit does not add them again.

