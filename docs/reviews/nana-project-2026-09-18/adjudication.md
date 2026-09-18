# project seeds + `nana-setup project` — review adjudication (2026-09-18)

Ladder: one Opus 4.8 builder in a worktree; three gpt-5.6-sol rounds via `pi-review`; the seat ran the suites and a real blank-folder smoke before each round.

| Round | Verdict | Real findings | Fold |
|---|---|---|---|
| r1 | BLOCK | 1 HIGH (dangling symlink at a seed path written through) + 4 MEDIUM (`--check` contradicted setup's own decisions; held build lock reported as rebuilt; refresh had no hard deadline; adopt fallback baked `_tmp` as the name) + 1 LOW (copier tests vanish without uvx) | all six |
| r2 | BLOCK | 1 HIGH (the skill's documented fallback command interpolated the project name into shell text) + 2 MEDIUM (`--check` ✓ for any inode; a symlinked private rule read as healthy) + r1 LOW carried | all; CI residual recorded honestly (the repo has no CI) |
| r3 (cap) | BLOCK | 1 HIGH (install printed ✗ but exited 0) + 1 MEDIUM (CLAUDE.md alias judged by basename only) | both implemented |

**Landed without r4 per the OBJECTIVE.md cap**; every r3 item was implemented, not carried. Residuals: no repo CI enforces `NANA_SETUP_REQUIRE_COPIER=1` (manual until a workflow exists); win32 seam-verified only; `<date>` stays literal in copier renders by design (filled by `nana-setup project` and the skill).
