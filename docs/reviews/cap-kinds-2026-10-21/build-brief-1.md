Feature: FEAT-028 · Maintain requirement identity and trace links. Lane cap-kinds, rows R-2440 to R-2447 (block R-2440 to R-2449). Class: ordinary. Builder: pi-worker (larger lane).

Work in ~/nana-pi-wt/cap-kinds on feat/cap-kinds, based on main 5548d4c2. Follow packages/nana-pack/prompts/builder-preamble.md. Never edit HANDOFF.md, docs/sessions/, docs/reviews/ or packages/nana-pack/rules/. Run single test files only (`node <file>`), never the full suite. No push.

Read `docs/reviews/cap-kinds-2026-10-21/must-meet.md` first: it holds the rows verbatim, the field grammar and its defaults, and the threat model. `plan-attack.md` beside it holds the adversary's evidence with file and line references.

Trace rule: put each `// req: R-24xx` on the line directly above its `check("R-24xx: …", …)` call. The title's opening quote sits on the same line as `check(`. Never split a title onto the next line.

Order: rows first, then the tests, then the code.

1. REQUIREMENTS.md, FEAT-028: insert R-2440 to R-2447 directly after the R-294 row, in the same table. Add no heading anywhere (the tree tests pin 68 headings). Copy the row text verbatim from the must-meet. Each row starts `untested` and becomes `implemented`, with backticked `file::title` evidence, once its check passes.

2. Tests.
   - New `packages/nana-pack/tests/requirements-cap-kinds.test.mjs` for R-2440 to R-2446, with the six-tag header, a PASS/FAIL `check` that exits 1 on any FAIL, and the must-meet titles exactly. Put `import { tmpDir } from "./tmp-dir.mjs";` on its own line; never call mkdtempSync. Build every fixture ledger in a temp folder.
   - Each check covers every case its must-meet row lists, the passing cases included. A check that would pass with its feature removed is a defect.
   - R-2440: write a ledger the checker accepts that carries all five labels on its capabilities (product, constraint and retired capabilities). Run the lift's dry run with no mapping, the way `requirements-lift.test.mjs` does. Assert exit 0, a clean proof, and each field line byte for byte under the same capability in the lifted text.
   - R-2446: two halves. (a) A fixture with kinded capabilities renders each read field on its own line after that capability's Parent line, and `checkOutlineFields` reports an outline where one of those lines was dropped and one where it was altered. (b) For c4332ecb, 4b3846ec and 5548d4c2, render `git show <c>:REQUIREMENTS.md` and compare it with `git show <c>:docs/requirements-tree.md`; each must be equal. Use those three fixed revisions, never `main`.
   - R-2447 goes in the existing `packages/nana-pack/tests/requirements-moved.test.mjs`. Feed `treeMovement` base and head texts directly. Cover the must-meet's cases, including a reordered `Needs:` list and a whitespace-only edit (no change), and a row-only change whose output equals today's byte for byte.

3. `scripts/requirements-tree.mjs`.
   - Define the five labels once as a named, exported constant with a `contract: R-2441` provenance comment.
   - In `parseLedger` (the field scan at :85-98), read the labels only in a capability's own span: the heading to the next heading of any kind, outside fences. Keep each line's value and line number. Never read them in feature or subgroup spans.
   - In `checkTree`, add R-2441 to R-2445. `Deliverables:`, `Needs:` and `Binds:` count only on a capability with `Kind:`; `Kind:` and `Retired:` count on every capability. Split lists on `/,\s*/`. Never use `expandRowIds` (:307, :311), which throws. A row's capability is its feature's capability, through its subgroup when it has one. "Earlier" for `Needs:` means a lower heading line number.
   - In `renderOutline` (:267), emit the read fields after the capability's Parent/Rows/IDs line, in the fixed order Kind, Needs, Binds, Deliverables, Retired, as `  <Label>: <values joined by ", ">`. Emit nothing for a capability without them. Do not change the outline's header text (:268). Deliverables are listed by ID only, with no status.
   - Extend `checkOutlineFields` (:316) to check those lines. Today it reads a capability's detail line at title+2. Keep that offset: the new lines come after the detail line.
   - Update the module's header tags.

4. `scripts/requirements-moved.mjs`.
   - Compare capabilities between base and head: a feature present at both under a different capability; a capability present at both whose Kind, Needs, Binds, Deliverables or Retired value differs as a parsed list; a capability at only one revision. Compare Needs, Binds and Deliverables as sets, so a reorder or a whitespace-only edit is no change.
   - With no capability change, the output stays byte for byte as today's, the early return at :140 included.
   - With a capability change, never print `tree movement: none`. Append `, <n> capability change(s)` to the summary line. After the feature blocks, print one unindented `capabilities:` line, then one line per change, for example `  FEAT-012 moved CAP-03 → CAP-02`, `  CAP-02 · <label>: Kind none → product`, `  CAP-09 · <label>: new`, `  CAP-04 · <label>: removed`.
   - Update the `@outputs` header (:6).

5. Text, written but not pinned (the must-meet's "Written, not pinned" list):
   - `packages/nana-pack/skills/requirements/SKILL.md`: the two kinds, the five fields with their grammar, the five amendments in one short list, the derived consumer, and that every field is optional. Add one sentence: before a regroup that moves features, strip the fields from the capabilities involved, then add them back. Keep every pinned sentence word for word (`packages/nana-pack/tests/templates-render.test.mjs:644-645`, `:685`, `:722`, `:780`). Write no new paragraph that mentions the lift next to a flag the lift lacks. Do not backtick the outline file's path, since rendered scaffolds lack it.
   - `templates/_shared/requirements-organization.md`: one paragraph. Keep "capability → feature → subgroup" verbatim. Add no `Kind:` line to any seed; CAP-90 stays kindless.
   - REQUIREMENTS.md's "How this file is organized" and "What checks it" sections: describe the new lines and list R-2440 to R-2447.
   - Write no machine path and no owner name.

6. Run `npm run map`, then `npm run map:check`, `npm run req:tree`, `npm run readme:check` and `node scripts/requirements-trace.mjs`. Then run as single files: requirements-cap-kinds, requirements-tree, requirements-lift, requirements-moved, requirements-regroup, templates-render, product-report, skill-claims and readme-check, each `.test.mjs` in packages/nana-pack/tests/.

No inline tunables. Never add a typed leaf total.

Wrong code to try. Each must turn its check red; revert after.
- Read the labels on every heading, not only capabilities: R-2441's prose clause goes red.
- Accept `Kind: Products` (a prefix or case-insensitive test): R-2441.
- First-wins on a duplicate `Kind:` line: R-2441.
- Compare a deliverable's direct parent heading with the capability: a subgroup-homed deliverable fails R-2442.
- Drop the retired-row check, or treat `untested` as a problem: R-2442.
- Skip the kind check for `Deliverables:` on a constraint capability: R-2442.
- `if (t === "all") continue`, or check a Binds target's existence but not its kind: R-2443.
- Check `Binds:` only when the line is present: R-2443.
- Allow a later capability in `Needs:`: R-2444.
- Reuse the feature STATUS regex for `Retired:`, or skip the successor-exists or live-feature check: R-2445.
- Add `Retired`, `Kind` or `Needs` to the lift's refusal regex (`scripts/requirements-lift.mjs:228`): R-2440.
- Render `  Kind: —` for every capability, or put the new lines before Parent: R-2446's historical half.
- Leave `checkOutlineFields` unchanged while the renderer drops a Needs line: R-2446.
- Keep the early return at `scripts/requirements-moved.mjs:140` ahead of the capability section: R-2447. Compare raw field text: R-2447's reorder case.

Done:
- requirements-cap-kinds passes 7/7 and requirements-moved passes, with every new check red on main 5548d4c2 except R-2440 and R-2446(b), the guards.
- Every other file listed in step 6 passes as a single file.
- map:check, readme:check and trace are green, and R-2440 to R-2447 are implemented.
- The work is committed on feat/cap-kinds with explicit paths.

Report (≤ 10 lines): the tip sha; each check's result; red-on-main per row; each wrong-code result; the other test files; map, readme and trace status; anything left untested.
