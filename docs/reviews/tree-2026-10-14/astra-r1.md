Reviewed `99a4103..81027f3`. No MUST findings.

- **SHOULD — shared template prose:** The new organization guide appears four times across both `REQUIREMENTS.md.jinja` templates. Move it into `templates/_shared/` to prevent drift.
- **SHOULD — skill guidance:** `packages/nana-pack/skills/requirements/SKILL.md:126` directs users to an outline’s shared-requirements index, but new projects receive no outline. Qualify that instruction and provide a ledger-based fallback.

Verification:
- Independently passed template-render, requirements-tree and product-report tests.
- Tree outline, requirement trace, code-map and README checks passed.
- Read acceptance and mutation records; did not rerun mutations.
- Reserved G-row placement, flat-ledger guidance and protected scope match the plan.
- Windows report-test coverage remains explicitly unverified, as recorded in `HANDOFF.md`.

VERDICT: LAND
