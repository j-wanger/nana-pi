# Review brief 1: leak-guard

Feature: FEAT-041 · Shape each agent's context by role

Lane class: ordinary (scripts/lane-class.mjs). It also touches nana-setup's seat rule, so the seat ran the install check locally on this tip, and every line passed. Threat model: honest variation in scope (a builder or seat committing logs with an identity word or an absolute home or temp path; renames, deletions, uncommitted fixes, win32 path forms, oversized files); deliberate forgery out.

Review the branch `feat/leak-guard` from main `14eb4c34` to its tip. The plan is `docs/reviews/leak-guard-2026-11-07/plan.md`. The builder wrote its report and evidence in `docs/reviews/leak-guard-2026-11-06/` (a date slip; both folders belong to this lane).

Intent: no identity word and no absolute home or temp path reaches the public remote again. The seat runs `leak-scan.mjs --base main --tip HEAD` chained with `&&` before every lane push (the gate, which exits 1 on a hit or a skip). pi-worker warns at build end. The builder preamble gains one line.

Question: does the change do that for its users (the seat pushing lane branches, builders writing evidence), and does it cause a harm the review standard lists? Check in particular:
- no output line or record echoes a matched word or path;
- blobs come from the commit range, never the worktree, and the allowlist doesn't bleed;
- a scan failure is never silent: exit 2, or `unavailable` in the record;
- the 4 MiB cap (raised from the plan's figure, so REQUIREMENTS.md fits) still bounds reads;
- R-3748 to R-3756 match their tests.
The seat ran the new CLI on this branch: 0 hits, 0 skipped. End with exactly one verdict line.
