# g005-carveout: must-meet (amended by the adversary, on main 0f2e0ca)

**Feature.** Jake ruled on 2026-10-10 that a pi extension's default export counts as its named entry point. The 10-09 audit (C08) classed the fix as "wording + template tag": the standard is wrong, not the code.
Falsifiable form: the coding standards rule, the requirements skill and the shared G-005 row each carry the words "a pi extension's default export counts as its named entry point". The suite fails, naming the file, when any one of them drops those words.

**Class: ordinary.** The lane changes rule, skill and ledger text plus one check in an existing test. It changes no install, uninstall or doctor code, no hook, no extension, no gate policy and no land or review tool. It touches `packages/nana-setup/`, so the seat runs `node packages/nana-setup/bin/install-check.mjs` on macOS before `nana-land` (AGENTS, 10-12). The template change ships through the CI tag after main goes green.

**Threat model.** In scope is honest variation:
- a rule line that wraps mid-phrase;
- a CRLF checkout on Windows;
- a later edit that drops the words from one copy;
- G-005 edited in one ledger copy only (R-756 already catches this).

Out of scope is deliberate forgery.

**Why pi needs the carve-out.** pi 1.0.2 `dist/core/extensions/loader.js:481-484` imports with `{default:true}` and drops a non-function. Lines 529-530 then report "Extension does not export a valid factory function". The adversary read both.

**Every copy of the rule.**
- Normative, changed together:
  - `REQUIREMENTS.md` G-005;
  - `templates/_shared/requirements-general.md` G-005 (R-756 pins it byte-equal to the first);
  - `packages/nana-setup/claude/rules/nana-standards.md` "Named exports only." bullet;
  - `packages/nana-pack/skills/requirements/SKILL.md` "Standing rules:" line.
- Descriptive, left unchanged, and still true: `README.md:53`, `scaffold-py/SKILL.md:16`, `scaffold-ts/SKILL.md:17` and the Part G purpose line.

**Design.**
- G-005, both copies, same bytes: "A module shall expose its behaviour only through named exports that are its entry points, where a pi extension's default export counts as its named entry point." It has one shall, a straight apostrophe and no `|`. Its Status stays `untested` and its Evidence is unchanged.
- Standard bullet: "Named exports only; a pi extension's default export counts as its named entry point, because pi's loader requires one. Never reach into another module's internals, private helpers or mutable module-level state." The file stays under 80 lines (71 in the probe).
- Skill: "Standing rules: named exports only, where a pi extension's default export counts as its named entry point (no reaching into …". Nothing else in the skill changes.
- One check goes in `packages/nana-setup/tests/skills-and-standards.test.mjs`, section 0, directly after R-1301's check and inside the same block. It reuses `RULE_NORM`, `SKILL_NORM` and `norm()`. It reads the shared G-005 Requirement cell with `/^\|\s*G-005\s*\|([^|]+)\|/m` and normalizes it the same way. Its failure detail names each file missing the words.
- R-1480 goes in FEAT-033's table after R-1301.
- No new module, so the code map is unchanged.

| Row | Requirement | Test | Red today |
|---|---|---|---|
| R-1480 | The coding standards rule, the requirements skill and the shared G-005 row shall each carry the words "a pi extension's default export counts as its named entry point". | `packages/nana-setup/tests/skills-and-standards.test.mjs::R-1480: the coding standards rule, the requirements skill and the shared G-005 row each say a pi extension's default export counts as its named entry point` | Probe in a temp clone of 0f2e0ca: FAIL "missing in: the coding standards rule, the requirements skill, the shared G-005 row". After the text change it PASSES. Reverting each file in turn FAILs naming that file (3 of 3). |

**Existing tests that must stay green (probed after the change):**
- R-756 Part G mirror (templates-render);
- R-291 tree, after the leaf total goes +1;
- the "one screen" check on the standards rule;
- skill-claims, product-report, the trace rail (ears 0 off form), `code-map --check` and readme-check;
- the `templates-update` drift line, which still lists G-005 because the v0.6.0 cell differs.

**Known limits.**
1. G-005 stays `untested`. No check scans modules for default exports; a reviewer reads the rule. The adversary cut the planned scanner for four reasons: the ruling did not ask for it, its guard tests pass on today's tree with the carve-out absent, about 30 existing tests already load each extension's default export, and ESM rejects two default exports.
2. Rendered projects get the new G-005 cell in `REQUIREMENTS-general.md` on their next copier update after the CI tag. Until a project copies the cell into its own `REQUIREMENTS.md`, its rail prints one Part G drift line and does not fail (R-583). trading-zone's copy is at `REQUIREMENTS.md:176`; it gets a follow-up lane in that repo.
3. Python projects carry pi wording that does not apply to them. It is harmless.
4. On Windows, the rule and skill copies refresh on the next `nana-setup install`, as for every rule edit.
5. FEAT-033's product-report assessment goes stale until the report refresh HANDOFF already queues.