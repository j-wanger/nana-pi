VERDICT: DONE

Commits:
- `eaf29b162ddb29e20a40f9470cdcebd317674b5d` — updated `packages/nana-pack/tests/land-regenerate.test.mjs`, M4, R-3709.
- `203fe6f196295b061f943bd7f9a9e2df04b745e9` — committed `docs/reviews/land-regenerate-generated-2026-11-02/seat-mutate-3.txt`.

Fixture: added staged `base.txt` content beside the retained index-removal case. Refusal requires `generatorScope` and `base.txt`.

Mutation proof:
- Disabled tree comparison: M4 failed, exit 1.
- Restored code: six checks passed, exit 0.
- G1–G7: **7/7 red, zero survivors**, including a repeat on the final tip.

Final-tip checks ran sequentially; all exited 0:
- Four named test files.
- `npm run map:check`
- `npm run readme:check`
- `node scripts/requirements-trace.mjs`
- `node scripts/requirements-tree.mjs --check`
- `node scripts/known-bugs.mjs --root .`
- `node scripts/identity-scan.mjs --root .`, after staging.

Known-bugs check retained its existing FEAT-013 size warning.

Departures: none. No production changes, helper exports, requirement edits, or known-bug fixes.

Branch: `feat/land-regenerate-generated`  
Full tip: `203fe6f196295b061f943bd7f9a9e2df04b745e9`

Not done: full suite, delegated to CI by AGENTS.md; push; CI access. Existing untracked seat files remain untouched.

Writing check ran. Required report formatting and technical identifiers retain its verdict and identifier findings.
