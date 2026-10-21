Feature: FEAT-028 · Maintain requirement identity and trace links. Lane cap-kinds, build 2 on c97ddc66. Class: ordinary. Builder: pi-worker (larger lane).

Work in ~/nana-pi-wt/cap-kinds on feat/cap-kinds. Follow packages/nana-pack/prompts/builder-preamble.md. Never edit HANDOFF.md, docs/sessions/, docs/reviews/ or packages/nana-pack/rules/. Run single test files only (`node <file>`), never the full suite. No push.

The seat's wrong-code pairs on c97ddc66 read 37 of 41 red (`docs/reviews/cap-kinds-2026-10-21/seat-mutate-output-c97ddc66.txt`). Four survived. Each is a test gap or a row-wording gap, not a code bug. This build changes tests and one row's wording only. Change no file under `scripts/`.

1. R-2443's row (REQUIREMENTS.md). Replace its Requirement cell with the must-meet's new wording, copied verbatim from `must-meet.md`. It now reads "a `Kind: constraint` capability with no `Retired:` line that lacks exactly one `Binds:` line …". The code already exempts a retired constraint capability; build 1's row did not say so, which contradicted R-2445. Keep the check title unchanged.

2. `packages/nana-pack/tests/requirements-cap-kinds.test.mjs`:
   - Remove the byte-order mark at the start of the file. No other file in the repository has one.
   - R-2443 (pair B6 survived): add a passing case, a capability with `Kind: constraint` and `Retired: CAP-01` (a live product successor), no `Binds:` line, and only retired features. Assert it raises no problem at all.
   - R-2444 (pairs N2 and N3 survived): in build 1 the constraint, kindless and retired targets all sat later than the capability that needs them, so the earlier-only rule caught them first. Rebuild those three cases so each target's heading comes earlier than the capability carrying `Needs:`, and that capability is a valid `Kind: product` in every other way. For every failing case, assert the problem names the capability, `Needs:` and the offending token. A problem that only mentions `Needs:` is not enough.
   - R-2445 (pair P2 survived): add a capability with no `Kind:` line whose `Retired:` names a missing successor, and assert the problem names that capability, `Retired:` and the token. Add a capability with no `Kind:` line that names a live successor and holds only retired features, and assert it raises no problem.

3. Run `npm run map`, then `npm run map:check`, `npm run req:tree`, `npm run readme:check` and `node scripts/requirements-trace.mjs`. Then run requirements-cap-kinds, requirements-moved and requirements-tree, each `.test.mjs` in packages/nana-pack/tests/, as single files.

Wrong code to try. Each must turn its check red; revert after.
- In `checkCapabilityFields`, make the Needs predicate `(target) => target.line < capability.line && !isRetiredCapability(target)`: R-2444 goes red.
- Make it `(target) => target.line < capability.line && capabilityKind(target) === "product"`: R-2444 goes red.
- In `parseLedger`, read `Retired:` only when `Kind:` is present (`(label === "Kind" || hasKind)`): R-2445 goes red.
- Drop `!isRetiredCapability(capability) &&` from the Binds count test: R-2443 goes red.

Done:
- requirements-cap-kinds passes 7/7, with the four wrong-code results above red.
- The other files in step 3 pass, and map:check, readme:check and trace are green.
- The work is committed on feat/cap-kinds with explicit paths.

Report (≤ 8 lines): the tip sha; each check's result; each wrong-code result; map, readme and trace status.
