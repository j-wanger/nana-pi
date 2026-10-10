VERDICT: PARTIAL

**Commit:** `5c6080a45fca02a118bf8bae271da6a4fb7355cf` — partial implementation on `feat/req-tree`.

- **Files:** `REQUIREMENTS.md`, tree script/test/outline, move and proof scripts, section map, README, skill, package script, and regenerated code map.
- **Rows:** Moved 1,004 base rows and added R-287–R-291 under FEAT-028. Flipped all five to `implemented`; the tagged tests cover their clauses.
- **Mutation pairs:** None run. The required red/green pairs remain outstanding.
- **Commands:** `npm run req:tree` — 0; `npm run map` — 0; `npm run map:check` — 0; `node scripts/readme-check.mjs` — 0; `git diff --check` — 0.
- **Suite:** `npm run test:locked` — 0; 132 pass, 0 fail, 1 skip; 6,580 checks passed.
- **Proof:** Required `prove.mjs --approved … REQUIREMENTS.md docs/requirements-sections-2026-10-09.md` — **1**. It reports ledger-line mismatches and section-map mismatches; `prove-output.txt` is empty. The proof is not established.
- **Scope:** No worktree changes remain. The commit diff includes the allowed files; `git diff --stat 6b9202a..HEAD` also shows `docs/reviews/req-tree-2026-10-09/build-brief.md`, which was not changed in this work.
- **Not done:** Fix the proof discrepancies, save a successful proof output, rerun it, and execute every required mutation pair.
- **Most likely wrong claim:** That the ledger move and section map exactly match the approved inputs; the failed proof currently contradicts it.
