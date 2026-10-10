## Land review — confirmation round 4

**Score: 9/10. All round-3 findings are closed; no merge-blocking defect found.**

Reviewed `eeeca20..6a74cfd88ee6973cd10b0781720ddd5f48050e60`. This review serves the terminal-consistency priority.

### MUST — None outstanding

**Round-3 MUST 1: closed — normalize the BOM once.**

- `templates/python/template/tests/conftest.py:74–81,175–178,424–432`
- `templates/typescript/template/tests/requirements-trace.ts:213–217,502–517`

Both rails normalize ledger files at ingestion. Validation, loading, counting and merging no longer remove another BOM.

The verifier confirms matching outcomes for double-BOM first-line rows containing either `R-0123` or `R-1000`. Neither becomes a row after removing exactly one BOM. Single-BOM rows still load.

**Round-3 MUST 2: closed — shared tree whitespace grammar.**

- `scripts/requirements-trace.mjs:21–25`
- `scripts/requirements-tree.mjs:13–19,62–63`
- `packages/nana-pack/tests/requirements-tree.test.mjs:159–166`

The tree derives its row prefix from the rail’s exported whitespace list and removes one leading BOM. Tests establish recognition, outline inclusion and placement rejection for the previously missed whitespace.

**Round-3 MUST 3: closed — HTML-page ruling.**

- `HANDOFF.md:44` explicitly removes the writing-trial dependency.
- `HANDOFF.md:47` unblocks both diagrams.
- `docs/sessions/2026-10.md:15` records Jake lifting the HTML-page hold.

These statements now agree.

### SHOULD — None outstanding

**Round-3 Windows wording: closed** at `docs/sessions/2026-10.md:15`.

“Jake requires Windows testing now” describes the ruling without claiming execution. The pending runner and VM remain explicit at `HANDOFF.md:48`.

### NOTE — Frontier and checkpoint

The frontier and session entry consistently record the desk freeze, HTML ruling, prospective Windows testing and remaining implementation queue.

The three checkpoint recommendations remain technically justified:

1. Keep the seven desk features frozen.
2. Retain the R-224 display share.
3. Retain both project-setup shares for R-1000/R-1001.

The prewritten landed entry at `HANDOFF.md:13` remains acceptable only upon actual approvals, checkpoint-2 acceptance and merge. It is not evidence those events already occurred.

The seat must read sol’s parallel verdict directly. The known first-verdict-only review-log defect must not mask a rejection.

### Evidence

Independently reran:

- Trace tests: **passed**.
- Tree tests: **passed**.
- Seat verifier: **zero mismatches; Python exercised**, including both former parser counterexamples.
- Tree freshness check: **passed**.
- Code-map check: **zero problems**.
- README check: **639 claims; zero problems**.

Checkout remained clean. Full-suite and template-acceptance success remain builder-reported; I did not rerun them.

### Accepted residuals

- Lexical ID sorting and downstream rail migrations.
- Context-free reserved prefixes and exclusion of indented examples.
- Characters outside the declared whitespace grammar can hide row-like lines.
- Exactly one leading BOM is removed; a second can prevent row recognition.
- Tree CRLF handling and native Windows execution remain pending.
- Clause-coverage limits, partial lifecycle freezes and the watchdog-share gap remain declared.
- Review-log enforcement remains incomplete; manual inspection of every verdict is required.

No further writes are requested by this review.

VERDICT: LAND
