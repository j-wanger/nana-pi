# A4 recount record

- Input: one frozen copy of the Mac seat's 14 main-thread Claude Code transcript files for this repository, taken once and read by both runs. Checksum of the sorted per-file sha256 list: 8b2d4c992207069e761fb9dc6de3a339c245c2119709b5d8a78bda667b733f84.
- Baseline: main 68a616bc. Candidate: lane tip de89e4a2. Each ran from a detached checkout of its revision.
- Invocation: the round 1 one-off counts script (imports `extractSeatContexts` from `apps/bench/lib/anatomy-seat.mjs` and `reportSlots` from `apps/bench/lib/anatomy-slots.mjs`), changed only to read the frozen projects root and write outside the checkout.
- Denominators, both runs: recorded-input 6,882,508 chars; unknown-delivery 12,202,962 chars; 14 sessions; 72 segments; 351 owner turns.
- Whole-session rows, baseline: hook-other 8,145 (0.12%); roster-notice 0.
- Whole-session rows, candidate: roster-notice 8,145 (0.12%); hook-other 0.
- Every other line is identical between the two outputs; the diff touches only these two kinds (whole sessions, the compact phase, and the startup and clear start rows).
- Output sha256: baseline af41f12f9291562703cd6ad882ae1480a373ed321f1440eb8ab738f36c14dd2b; candidate (this `seat-counts.md`) 391216e1a891a46ec874b84663b907d4259fb639776e18e24989e74fcd8dfe0e.
- Counts only: no transcript text, owner text or session ids were written.
