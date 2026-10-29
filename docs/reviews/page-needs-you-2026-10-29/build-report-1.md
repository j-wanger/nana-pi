VERDICT: DONE

Commit: `801c0079` — FEAT-039.

**Files:** `scripts/product-report.mjs`; `packages/nana-pack/lib/ask-shape.mjs`, `packages/nana-pack/lib/handoff-issues.mjs` and their tests; `REQUIREMENTS.md`, `docs/requirements-tree.md`, `docs/code-map.md`, `docs/known-bugs/FEAT-039.md`.

**Rows:** R-3050–R-3055 implemented; R-2920 and R-2921 retired.

**Must-meet test evidence:**
- R-3050: `packages/nana-pack/tests/product-overview.test.mjs::R-3050: Overview leads with What it does and Needs you, then closes Broken, Gaps and Stale in Records`
- R-3051: `packages/nana-pack/tests/handoff-issues.test.mjs::R-3051: issue bodies are opt-in and malformed bodies fail validation`
- R-3052: `packages/nana-pack/tests/ask-shape.test.mjs::R-3052: ask bodies parse question groups, recommendations and since dates`
- R-3053: `packages/nana-pack/tests/product-overview.test.mjs::R-3053: Needs you lists blocking asks then cost-ranked optionals, caps and links the remainder` and `packages/nana-pack/tests/product-overview.test.mjs::R-3053: legacy asks retain kind counts and blocking entries while Needs you counts the open questions`
- R-3054: `packages/nana-pack/tests/product-overview.test.mjs::R-3054: Needs you shows each listed ask's question, recommendation, cost and further-question count`
- R-3055: `packages/nana-pack/tests/product-report.test.mjs::R-3055: issue Decisions cards render parsed choices with shared labels and body text stays inert`

**Mutation pairs:** Reversed overview order → R-3050 failed; restored order → passed. Omitted issue-body support → R-3051 failed; added opt-in support → passed. Omitted ask parser → R-3052 failed; implemented parser → passed. Reduced ask cap → R-3053 failed; restored cap → passed. Replaced parsed recommendation → R-3054 failed; restored parsed value → passed. Skipped issue question groups → R-3055 failed; rendered groups → passed.

**Commands and exit codes:** The first `npm run test:locked` run exited 1 because the generated requirements outline was stale. Regenerated it with `node scripts/requirements-tree.mjs --write` (0), then the requirements-tree test passed (0). The final `npm run test:locked` passed (0). `npm run map:check`, `npm run readme:check`, requirements trace, requirements tree, known-bugs check, identity scan and lane-class check all exited 0. `npm run first-look -- --page product` exited 2 with usage; the corrected command, `npm run first-look -- --page product --out "$TMPDIR/first-look-product"`, exited 0.

Suite summary: **234 files: 232 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8,676 pass, 0 fail, 44 skip · 559.4s.**

**Overview headings:** What it does → Needs you → closed Records: Broken → Gaps → Stale.

**Three asks listed today:**
- **Outside reader lane** — asks when it runs, where findings go and which model; recommendation: after build 1, after first-look, on product-page lanes.
- **Product page lane** — asks whether What it does should lead; recommendation: yes. The Overview notes two more questions in the issue; Decisions shows all three groups.
- **Widen the lane class** — asks whether to expand the full review ladder; recommendation: keep the narrow rule.

**Precedent departures:** None.

**Existing tests changed:** `product-overview.test.mjs` replaces the R-2920 and R-2921 assertions with the new behavior. `product-report.test.mjs` adds R-3055, marks the legacy R-2983 test, and supplies bodies in issue-reader fixtures. `handoff-issues.test.mjs` only adds the R-3051 test.

Added all seven requested FEAT-039 known-bug lines. No GitHub issues were changed; no CI run was requested. The worktree is clean.
