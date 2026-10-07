# Re-baseline, 2026-10-07

The baseline window is by session start date, EDT: 2026-09-20 through 2026-10-03 inclusive. The unit is the last assistant main-thread message of at least 80 words in each eligible seat session. Worktree project directories are excluded.

| Row | Reports | Sentences | Over 25 words | Share | Former lenient verdict-first | Strict verdict-first |
|---|---:|---:|---:|---:|---:|---:|
| Published baseline.md | 35 | 1,178 | 370 | 31% | 6/35 | not recorded |
| Reproduced from verified private snapshot | 32 | 1,166 | 365 | 31% | 3/32 | 0/32 |

The three-report difference is the window edge: the ruled 2026-09-20 to 2026-10-03 session-start window yields 32 eligible units. The published 6/35 lenient verdict-first figure is reproducible within that window gap: the former checker logic yields 3/32 here. It is not a match of identical populations, but the earlier claim that the verdict figure was not reproducible was wrong.

The former checker is the case-insensitive listed-verdict regex applied only to the first prose sentence. The strict check applies the committed R-747 uppercase first-token rule. The original table's 1,169 sentences and 368 over-cap count were inaccurate; scoring the exact preserved corpus yields 1,166 and 365. The committed extractor now reads the private text files named by the committed manifest, verifies every SHA-256, and recomputes this table without needing transcripts.

Recompute from the preserved private files with:
`node docs/reviews/writing-trial-2026-10-04/extract.mjs --manifest docs/reviews/writing-trial-2026-10-04/baseline-manifest.json --corpus-dir ~/.local/share/nana/writing-trial-2026-10-04/baseline`

The manifest commits only session IDs, timestamps and SHA-256 hashes. Message text remains outside the repository.
