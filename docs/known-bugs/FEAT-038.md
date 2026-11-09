# FEAT-038 — known bugs

*One line per known bug in this feature, moved from HANDOFF.md on 2026-10-21 and kept word for word. A review finding that does not block a land goes here as one line.*

- Catch-ledger study (scrub-records, plan): superseded cache records keep their old keys. The re-keyed caches claim the judge saw the scrubbed prompts, and the match prompt's 600-character cut moves; in 4 skipped rows the text cut moves too. The four result files and RESULTS.md stay byte-equal.
- Catch-ledger study (scrub-records, final review): R-2517 cannot see two current label records with swapped keys, because labels are collected by row id; the real re-key has no swap.
