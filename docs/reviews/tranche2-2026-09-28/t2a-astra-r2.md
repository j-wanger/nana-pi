## T2a — round 2 land ruling

Read-only review; tests not rerun. Acceptance evidence: seat-verified **70 files / 3514 checks / exit 0**.

1. **MUST 1 — FIXED.** Consumer contract declared at `AGENTS.md:13`, `templates/_shared/working-under-nana-pi.md:28`, and `templates/_shared/OBJECTIVE.md:8`. Node ≥22.18 is published at `packages/nana-setup/README.md:18`, `README.md:52`, and `packages/nana-pack/bin/nana-objective.mjs:5`; the pre-import guard and missing-node marker are present.
2. **MUST 2 — FIXED.** `packages/nana-setup/lib/doctor.mjs:41` distinguishes defaults, valid renames and invalid settings with effective fallback. `packages/nana-setup/tests/doctor-detail.test.mjs:61–97` exercises `diagnose()` and producer-rule agreement.
3. **MUST 3 — FIXED by the seat.** Main’s `HANDOFF.md:33` records the unimplemented provenance label and open choice accurately; `HANDOFF.md:35` preserves the flaky-test notice. The supplied patch preserves both.

**HANDOFF sufficiency:** Yes—as an open-decision record, not as policy implementation or risk acceptance. Its structural-safety claim must be read as objective-producer-scoped, not closure of inherited injection surfaces.

**New defects:** No new blocking defect found. Doctor’s own-PATH check (`doctor.mjs:66–78`) cannot certify Claude Code’s runtime. Raising the floor exercises the rejection branch but does not establish real Node 22.17 compatibility; the independently verified 22.18 floor resolves the disputed requirement. Both are nonblocking validation residuals.

SCORE: 9/10
MUST: []
CARRY:
- **HIGH:** Jake-owned provenance-label versus trust-gating decision; semantic steering remains possible.
- **HIGH:** Separate post-edit/handoff sanitization audit with end-to-end sink tests.
- **MEDIUM:** Unbounded config I/O, filesystem races/stalls, actual-host rendering and Windows parity; no universal guarantees.
- **LOW:** Verify Claude’s actual Node/PATH and smoke-test real 22.17/22.18; retain CLI-catch coverage and raw installation-path fallback residuals.
VERDICT: LAND
