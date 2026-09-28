## L1 ruling

**BLOCK: trusted-project corruption still violates “never widens.”** The implemented traversal repair is sound for the tested lexical paths, but does not close this separate config-contract gap.

Evidence: corpus and implementation read in the requested order; installed package/source confirms pi **0.87.1**. This was read-only source verification. The **60 files / 2625 checks / exit 0** result and live probes are seat evidence, not my rerun.

### A. Invariants 1–6
1. **Substantially satisfied:** `config-normalize.test.mjs` covers block/leaf types, siblings, malformed entries and parse failures; `config-handlers-malformed.test.mjs` exercises the six extensions. Disabled-journal diagnostics are pinned. Caveat: malformed project leaves inherit user values, not necessarily defaults—document that precedence precisely.
2. **Satisfied for user scope:** `config-gate-fallback.test.mjs` a–e pins in-memory retention, fresh-process stop, planted snapshots, interactive stop, repair and missing-file defaults. Stop precedes exceptions.
3. **Satisfied under the defined predicate:** `config-trust.test.mjs` checks F1, resource evidence, saved folder/parent trust, false/missing APIs, corrupt stores and cross-module caching against real pi exports. Resource existence is evidence that pi *would ask*, not proof it actually prompted.
4. **Satisfied:** `config-trust` pins one warning/journal notice, `/trust` guidance, repeat-session notice and no-file silence.
5. **Satisfied:** the bare-harness test pins the unavailable-module state; production import failure closes trust.
6. **Not satisfied generally:** the matrix compares malformed project overrides against the **user baseline**, not against a previously effective restrictive project policy. It therefore misses widening after project corruption and restart.

### B. Blocking counterexample and acceptance coverage
**Source-derived, not executed:** `packages/nana-pack/lib/config.ts:412–426` replaces a malformed trusted-project gate with cached project leaves **or `{}`**.
- Start with valid user defaults and a nana-trusted project denying `terraform destroy`.
- Corrupt the project JSON and start a fresh process.
- No project cache exists; `{}` contributes no deny; `terraform destroy` encounters no built-in restriction and is allowed.
- Likewise, a project’s explicit `allowPatterns: []` can disappear, reactivating a broader user exception.
This contradicts the lane goal, invariant 6 and synthesis item 1, notwithstanding invariant 2’s specifically user-scoped test.

The **“1 + 2” row is not fully met**: compounds, shell/PowerShell mutation, non-bypassable protection and session-bound loosening remain L2 work. Do not represent L1’s green suite as that row’s acceptance.
Explicit exceptions remain covered by `gate-status`’s force-with-lease and Allow-once cases.
Missing automated cases: custom protected-path corruption/restart, actual headless repair-and-resume, and the composed tool-write → trust-store → fresh-project-policy regression. Repair is currently tested interactively; the planting test forces project trust false.

### C. Merge harm and session lifetime
The ruled loss of auto-trusted project config is acceptable; `/trust` plus restart is actionable. A fresh-process user-gate typo stopping all four gated classes is also acceptable: owner repair costs less than silently losing restrictions.
`adopt-structure` and newly generated setup guidance explain trust. Existing projects, setup’s own README/output and desk settings do not adequately explain the additional nana-trust requirement; the desk checkbox’s `-a` alone does not satisfy it for nana-only directories.
Desk children are separate processes (`apps/desk/server.mjs:443–445`).
**Interactive pi is not inherently one process per session:** installed `agent-session-runtime.js` replaces sessions in-process for new/resume/fork. Last-good maps persist across those transitions; diagnostics use session IDs and lifecycle re-primes cwd trust. Concurrent same-cwd SDK sessions can share/overwrite trust evidence. The seat’s narrower launch habit is not a runtime guarantee.

### D/E. Upstream contracts and coupling
L2 can consume the typed gate and `stopReason`; it must preserve stop-before-exception behavior and retain traversal regressions. Its session snapshot is **not implemented by L1**.
L2’s allowlist needs the promised comment/documentation edits in `config.ts`, README Config and desk UI—not merely Gate bullets/desk README.
L3’s custom `handoff.path` already receives nana-trust filtering. `staleAfterDays` needs interface/default/schema validation plus normalization-test updates; L3’s “no other assertion edits” restriction must permit those additive schema changes.

### F. Seat conduct
Approve the declared scope amendments: policy-path protection, its resolver and `gate-policy-paths.test.mjs` directly repair demonstrated trust-forging paths.
No existing assertion weakening found in the clean patch; robustness seeding explicitly establishes the replacement last-good precondition.
Snapshot subtraction, unconditional diagnostics and traversal normalization are independently supported by source/tests; no evidence these fixes were adopted merely on reviewer authority.
However, “no planted file anywhere can widen” exceeds the tested claim, and the new test’s `check(..., true)` is bookkeeping, not a composed regression.
These implementation choices do not exceed Jake’s rulings. Silently narrowing “never widens” to malformed **user** policy would.

**SCORE: 7/10**

**MUST**
- Preserve restrictions or conservatively stop for a malformed nana-trusted project gate without last-good state; add fresh-process deny/protected-path and exception-resurrection regressions.
- Update owner-facing trust/recovery guidance in setup, desk and root `AGENTS.md`; distinguish nana-trust from the desk checkbox and explain external owner repair.

**CARRY**
- L2’s live-loosening, compound-exception and command-write gaps: **high destructive-action cost**, temporary sequencing debt, not completed acceptance.
- Process-wide state across sequential sessions; concurrent SDK isolation untested: **potential cross-session permission impact**. Document lifetime and pin transitions.
- Windows execution, symlink/alternate-agent-directory protection, implicit pi trust provenance: **high-impact advisory-boundary limitations**; no sandbox claim.
- Headless recovery/custom-path coverage gaps and best-effort journal failures: **stalled-run or lost-diagnostic cost**; add focused tests.
- Substring lookalike over-gating: **low-cost unwanted prompts**.

**UPSTREAM-CONTRACT DECLARATION:** project config now requires nana-trust; malformed user policy retains process-local last-good or stops; config diagnostics ignore `journal.enabled`; direct policy-file edits now gate. README Config, shared working guide, adopt-structure and `config.ts` describe these changes, but consumer guidance remains incomplete. “Read live” and “exceptions checked first” still describe L1 and must change with L2—not be claimed fixed now.

**VERDICT: BLOCK**
