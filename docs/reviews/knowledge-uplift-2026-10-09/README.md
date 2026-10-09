# Knowledge-pull uplift, step 1 (plan 6.1, seat measurement, 2026-10-09)

Question (D6): does a pointer the automatic knowledge pull shows get read? The pre-registered rule: uplift = P(read | shown) − P(read | withheld) ≤ P(read | shown), so a one-arm Wilson 95% upper bound on P(read | shown) below 5 percentage points proves the pre-registered FAIL without a randomized arm.

Two independent read-only scripts compute it from this machine's `pull.log`, Claude Code transcripts and pi session files: `uplift.mjs` (the analyst) and `uplift-check.mjs` (a skeptic who re-derived the join separately; 1,002 of their 1,076 lines differ). Neither calls a model; `uplift.mjs` prints JSON to stdout, and `uplift-check.mjs` writes `check-out.json` beside itself.

| Window | Pointers shown (non-archive) | Read afterwards | Wilson 95% upper |
|---|---:|---:|---:|
| 2026-10-08T02:00Z (after the reviewer skip) to 2026-10-09T17:00Z, pi | 230 | 0 | 1.64% |
| same, Claude Code seat | 8 | 0 | 32.4% |
| pooled | 238 | 0 | **1.59%** |

"Read" means a main-thread read tool, or a bash command that names the path with cat, sed, head, tail, less, grep, rg, awk or nl, within the next five human turns (the rest of the session for one-prompt pi workers), across absolute, `~`, `$HOME` and cwd-relative spellings. Positive control: the same scanner finds HANDOFF.md reads at session start in 13 of 15 seat sessions and 80 of 85 pulled pi sessions. Decoy floor: random indexed paths not shown are read at about the same near-zero rate. The skeptic removed the analyst's one false positive (a `git grep` pathspec that excluded the file).

What it does NOT establish: 97% of the pointers come from builder sessions whose prompt is the same boilerplate, so the pull kept showing the same three files; prompts a person typed got 8 pointers, too few to bound. At the session level the bound is 0 of 87 (upper 4.2%). The decision on injection is Jake's (HANDOFF, Open for Jake).

Recompute: `node docs/reviews/knowledge-uplift-2026-10-09/uplift.mjs --since 2026-10-08T02:00:00Z --until 2026-10-09T17:00:00Z` (needs this machine's logs; read-only).
