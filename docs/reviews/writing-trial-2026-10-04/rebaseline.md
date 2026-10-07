# Re-baseline, 2026-10-07

The seat ruling fixes the baseline window by **session start date**, EDT: 2026-09-20 through 2026-10-03 inclusive. The unit is the last assistant main-thread message of at least 80 words in each eligible seat session. Worktree project directories are excluded.

| Row | Reports | Sentences | Over 25 words | Share | Verdict-first (published/lenient) | Verdict-first (strict) |
|---|---:|---:|---:|---:|---:|---:|
| Published baseline.md | 35 | 1,178 | 370 | 31% | 6/35 | not recorded |
| Reproduced, 2026-10-07 | 32 | 1,169 | 368 | 31% | 21/32 | 0/32 |

The 3-report difference is the window edge: this reproduction applies the ruled 2026-09-20 to 2026-10-03 session-start window, yielding 32 eligible reports. The 31% over-cap share and sentence count match the published corpus shape closely enough to validate scope. The published 6/35 verdict-first result came from an unrecorded hand method and is declared not reproducible. The committed lenient check finds any listed verdict word, case-insensitively, anywhere in the message; the strict check applies the committed R-747 first-token uppercase rule. Therefore the re-measured baseline verdicts are 21/32 lenient and 0/32 strict.

Source command: `node docs/reviews/writing-trial-2026-10-04/extract.mjs --from 2026-09-20 --to 2026-10-03 --mode baseline` against the seat projects under `~/.claude/projects/`. The 32 normalized texts remain private under `~/.local/share/nana/writing-trial-2026-10-04/baseline/`; `baseline-manifest.json` records only session IDs, timestamps and SHA-256 hashes.
