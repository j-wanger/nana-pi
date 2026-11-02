1. **MUST — “Clean status” uses the wrong baseline and can reject every useful regeneration.**  
   **Evidence:** `docs/reviews/land-regenerate-generated-2026-11-02/plan.md:18-22` creates a detached checkout at the accepted tip, replaces its index with the merged tree, then requires clean status. HEAD still names the tip: main’s contributions—and regenerated outputs—are legitimate staged changes against HEAD.  
   **Fix:** Compare the final index tree against the captured merge-tree result, allowing only contract paths. Separately require no unstaged changes and no unexpected untracked or ignored files. Do not require empty HEAD-relative status. Make M1 include main-only tracked additions.

2. **MUST — The claimed generator write boundary is not enforced by a repository diff.**  
   **Evidence:** Plan `:22,30,86` promises detection of writes outside the output contract. But `scripts/code-map.mjs:136-140` writes to the configured `mapPath`; the template generator also writes that configurable path (`templates/typescript/template/scripts/code-map.mjs:831-838`). Its source collector follows configured roots and reads matching files (`:760-782`). An accidental parent-relative output or source root can escape the temporary checkout. Git status cannot detect changes outside that checkout.  
   **Fix:** Before execution, validate the merged configuration’s output against the sealed contract and constrain source roots and resolved paths to the temporary tree. Explicitly distinguish repository-diff enforcement from filesystem confinement. Either confine arbitrary script effects or declare those outside-tree effects a residual; do not claim Design 3 detects them.

3. **MUST — `finally` does not meet the crash guarantee, and global pruning exceeds owned cleanup.**  
   **Evidence:** Plan `:23,35` relies on worktree removal and pruning in `finally`, while `:57` includes crashes in scope. Process termination or machine failure skips `finally`, leaving shared `.git/worktrees` metadata. A repository-wide prune can also remove unrelated stale registrations. Regeneration precedes the final ledger lock (`packages/nana-pack/bin/nana-land.mjs:178,266`).  
   **Fix:** Prefer the unregistered temporary-directory/index alternative, with narrowly scoped cleanup. Otherwise specify owned-registration recovery and an explicit crash residual. Never prune unrelated worktrees. Test termination after checkout creation and verify that existing registrations remain unchanged.

4. **MUST — The plan widens the exemption without updating its consumer contracts.**  
   **Evidence:** `REQUIREMENTS.md:1144` still requires refusal for any merge conflict; `:1149` requires agreement across guidance, README and ruling. The existing guidance test pins the ruling’s “git finds no conflict” wording (`packages/nana-pack/tests/land-clean-merge.test.mjs`, M9). The new plan lists only new rows and implementation tests, leaving these conflicting contracts untouched.  
   **Fix:** Update the existing conflict/refusal requirements, shared working-pattern source, rendered `AGENTS.md`, pack README and ruling. State the exact generated-output exception and preserve review requirements for lane-authored resolutions. Extend the guidance-agreement test.

5. **SHOULD — A2 is false for diagnostics, though not currently for generated outline bytes.**  
   **Evidence:** `scripts/requirements-tree.mjs:646-652` calls the deliverable reporter. `scripts/deliverables.mjs:722-729` reads paths from **HEAD**, not the merged index. With the proposed checkout, that means accepted-tip paths; main’s newly added artifact readers can receive misleading missing-path notes. Rendering itself uses `artifactRegistry(parsed, null)` and does not depend on that HEAD query.  
   **Fix:** Narrow A2 to output bytes and exit semantics, explicitly recording the report-only HEAD dependency. Either suppress these diagnostics during regeneration or provide a merged-tree-aware reporting path. Do not present the command’s entire report as validation of merged-tree deliverables.

6. **SHOULD — Several promised wrong-code checks need reachable, discriminating fixtures.**  
   **Evidence:** Plan `:85-87` does not specify how write-success/check-failure occurs. A tracked “stray hand-merged” source file is rejected before regeneration by `nana-land.mjs:128` and `assertCleanTracked` at `:45-48`. Also, staging only contract paths means an unstaged scope violation may be caught by status even when the non-contract tree comparison is removed; the proposed mutation can survive.  
   **Fix:** Specify:
   - a fixture generator whose write exits zero and whose check exits nonzero;
   - the hand-merged decoy’s location and how regeneration is actually reached;
   - an index-only non-contract modification to exercise the tree comparison independently;
   - ignored-file writes, modify/delete conflicts, and rename conflicts involving non-contract destinations.

7. **SHOULD — Determinism needs direct evidence, not an inference from existing CI.**  
   **Evidence:** Plan `:29` treats passing checks across CI legs as proof. This tree’s `.gitattributes:1` forces LF, so those checks do not establish behavior under other checkout settings. Both current `--check` commands passed locally, and the planned file list classified as `gate`. The temporary repeat-write/autocrlf probe was blocked by the harness before execution; no repeat-write or cross-OS result is established here.  
   **Fix:** Add bounded repeat-write/hash comparisons in disposable repositories, with spaces in paths and `core.autocrlf` variations. Assert committed output bytes and scope, not merely successful exits. Keep generated paths in the final-tree proof comparison; no additional suite-path exclusion is needed.

**MUST: 4 · SHOULD: 3**
