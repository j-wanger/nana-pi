1. **MUST — The suite-proof comparison misses changes imported from main.**  
   Evidence: `land-clean-merge-plan.md:31` changes the proof check to `capturedMain..M`. `packages/nana-pack/lib/land-config.mjs:42-44` identifies workflows and the test runner as proof-defining paths.  
   If main changes the runner after the lane’s green CI, M inherits that runner. The proposed comparison sees no runner change, yet accepts evidence from the old runner.  
   **Plan change:** Check proof-defining paths on both the lane contribution and `tip..M`, retaining `--no-renames`. Add cases where only main changes, deletes, or renames a proof-defining file. Refuse under A3 rather than silently calling the old evidence sufficient.

2. **MUST — The merge test uses the implementation as its own oracle.**  
   Evidence: `land-clean-merge-plan.md:28,141` both implement and validate the tree using the same `merge-tree` invocation. Its attribute-source assumption remains explicitly unverified at line 36. Existing normalized-checkout coverage only exercises fast-forward landing (`packages/nana-pack/tests/land-merge.test.mjs:376-404`).  
   Honest attributes, merge drivers, renormalization settings, and rename handling can affect the result. A configured driver can return success while discarding one side. Comparing the output with another identical invocation cannot expose that.  
   **Plan change:** Add independent expected-content assertions and compare against an ordinary lane-side merge in isolated test fixtures. Cover same-file clean edits, rename/edit, attributes differing between parents, and a driver that chooses one side. Define supported merge semantics; refuse unsupported cases or explicitly document their limitations. Validate malformed/truncated output and process errors, not just exit 129.

3. **MUST — The documentation update leaves a contradictory review rule.**  
   Evidence: `AGENTS.md:94` and `templates/_shared/working-under-nana-pi.md:26` still require review of “the exact tip that will land” and coverage for “every later commit.” The plan updates the Land checklist, not that Review ladder sentence (`land-clean-merge-plan.md:114-117`).  
   Readers can therefore keep demanding the confirmation round this lane removes.  
   **Plan change:** Update both bullets in the shared source and rendered region. Describe the clean helper-created merge as review-covered under the new ruling, while preserving exact review coverage for lane-authored commits. Test that the complete guidance agrees, not merely that the new sentence appears.

4. **SHOULD — The claimed savings are an upper bound, not demonstrated eligibility.**  
   Evidence: `land-clean-merge-plan.md:21,24` counts 14/44 textually clean merges, but A3 adds suite-proof eligibility at line 30. The raw files record merge outcomes and overlap, not whether each historical tip had qualifying CI artifacts. `recent.txt:1-2,7-8` identifies generated-file conflicts but does not prove regeneration succeeds.  
   “A merge build adds nothing a land needs” also overstates what equal trees establish: the build and review supplied validation, even when they changed no content.  
   **Plan change:** Say “at most 14/44 historical merge builds avoided under textual eligibility; actual qualifying count unmeasured.” Preserve commit IDs and replay commands with the measurement. Treat 26/44 as a candidate upper bound requiring regeneration replay, not a delivered saving. Keep regeneration out of this lane: it changes conflicted content and needs a separate, bounded generator contract.

5. **NOTE — Textual cleanliness deliberately permits semantic breakage and silent loss.**  
   Evidence: `land-clean-merge-plan.md:87-92` acknowledges semantic conflicts, but M1 only changes different files (`:141`).  
   A lane can rename an exported helper while main adds a caller in another file. Both tips pass; the merge is clean and fails. Two lanes can also make independent generated-file edits whose combined totals or ordering are invalid. A change/revert on one side can produce surprising three-way results without any conflict. File-overlap exclusion would not catch the cross-file example.  
   **Plan change:** Add a small fixture demonstrating an accepted clean-but-semantically-broken result, explicitly as a policy-limit test. State that review coverage is a policy decision, not evidence that reviewers saw M. Keep the owner’s no-new-CI/no-confirmation default; do not smuggle either check back in.

6. **SHOULD — “Newest CI passed” is only a snapshot, and the PR-merge assurance is too broad.**  
   Evidence: `packages/nana-pack/bin/nana-land.mjs:172-199` judges runs before artifact reads and the final lock. `packages/nana-pack/lib/land-ci.mjs:96-115` accepts events without requiring a pull-request run; `packages/nana-pack/tests/land-ci-read.test.mjs:61-72` explicitly accepts push evidence. The plan nevertheless says CI already tested a PR merge (`land-clean-merge-plan.md:89`).  
   A rerun can begin after the first read. The artifact reader can then observe a different attempt while the original verdict remains accepted. This is ordinary concurrency, not forgery.  
   **Plan change:** Qualify the PR-merge claim to this repository’s actual workflow and observed event. Add a test where a newer queued/failed attempt appears during evidence collection. Either perform a final non-waiting tip-CI validation or explicitly retain the snapshot limitation; do not claim continuously newest evidence.

7. **SHOULD — The race claim exceeds the lock’s actual protection.**  
   Evidence: `land-clean-merge-plan.md:34,95,145` promises refusal when main moves again. The lock is user-scoped (`packages/nana-pack/bin/review-round.mjs:104-112`), while the final HEAD check and Git merge are separate calls (`packages/nana-pack/bin/nana-land.mjs:235-242`). Existing tests explicitly retain an undefended final-check-to-merge window (`packages/nana-pack/tests/land-merge.test.mjs:295`).  
   Two lands using the same ledger serialize. Another ledger home or an external checkout operation does not share that lock. M5 only tests movement before the final check.  
   **Plan change:** State the cooperating-writer assumption precisely. Extend merge-path tests to source movement, tracked dirt, branch switching, and two lands capturing the same main. Preserve the documented external-operation race rather than claiming a transactional guarantee or adding a new locking system unnecessarily.

8. **SHOULD — Post-land CI is delayed detection, not containment.**  
   Evidence: `land-clean-merge-plan.md:35,90-92` allows further lands before main’s result. The helper only prints a push command (`packages/nana-pack/bin/nana-land.mjs:280`); it does not push. Linux suite failures are non-blocking (`.github/workflows/ci.yml:68`), despite the plan’s broad three-platform safety framing.  
   The exposure lasts until someone pushes and checks the relevant result, not necessarily 30 minutes. Several dependent lands may already exist when the first broken merge is discovered.  
   **Plan change:** Document that exact window and the Linux qualification. Specify that the existing seat check follows the landed SHA and stops ordinary lands once failure is known. Do not require waiting for every main run: that recreates the serial CI cost the owner rejected.

9. **SHOULD — Several must-meets freeze ceremony rather than protect behavior.**  
   Evidence: M2 pins zero CI calls and a precise preflight stage; M3 preserves an obsolete ancestor substring; M6 preserves the last ruling’s position (`land-clean-merge-plan.md:142-146`). `packages/nana-pack/tests/rulings.test.mjs:385-395` demonstrates why the placement workaround exists. The plan also leaves the install check simultaneously prescribed and inferred unnecessary (`:7`).  
   **Plan change:** Require unchanged refs/worktrees on refusal, actionable diagnostics, correct evidence identity, and no merge-tip CI or review. Keep exact words only for genuine reader interfaces. Update stale tests rather than shaping refusals around `/ancestor/i`. Resolve the install-check applicability now: this file list changes neither setup nor a hook. Retain the agreed defaults without adding another approval round.

MUST: 3 · SHOULD: 5 · NOTE: 1
