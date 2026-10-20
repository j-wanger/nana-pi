# Build brief · handoff-cap-surrogate

Feature: FEAT-002 · Resume decisions and next actions. Class: hook (pi extension).
- Builder: a Claude Sonnet subagent in ~/nana-pi-wt/handoff-cap-surrogate on feat/handoff-cap-surrogate. It follows packages/nana-pack/prompts/builder-preamble.md.
- Base: main after handoff-pins lands. The R-189 cap block must already be in handoff-artifact.test.mjs.
- Threat model: honest astral characters in a model-written summary are in scope; a forged store file is out.

## Change, in this order
1. `REQUIREMENTS.md`, FEAT-002 › SUB-003: add this row directly under R-189. Do not edit R-189.
   `| R-2160 | IF the injection cap falls between the two halves of a surrogate pair in a handoff summary body, THEN the injected body shall end immediately before that pair. | untested | — |`
2. `packages/nana-pack/tests/handoff-artifact.test.mjs`: add one block after the R-189 cap block, before the final `fs.rmSync(td, …)`.
   - Copy R-189's fixture: USER_CFG with the journal off, `fs.realpathSync.native(tmpDir(...))`, a `.pi` dir, fresh handlers, then compact → startup → before_agent_start, with the same start and end markers.
   - Use `const CAP = mod.INJECT_CAP;` and the body `` `${"x".repeat(CAP - 1)}\u{1F600}tail` ``. Never write the literal 8000.
   - Put `// req: R-2160` on its own line. The line directly under it is:
     `check("cap: a body cut between the two halves of a surrogate pair is injected ending before that pair", cut4 === "x".repeat(CAP - 1));`
   - Remove the block's temp dir at its end. Add no other test.
3. `packages/nana-pack/extensions/nana-handoff.ts`, export only:
   - Replace `const INJECT_CAP = 8000;` with these two lines:
     `// contract (R-189): the injected compaction summary body cap, in UTF-16 code units.`
     `export const INJECT_CAP = 8000;`
   - Run handoff-artifact: R-2160 must FAIL with the cut ending on 0xD83D. This is the red-before. R-189 must PASS.
4. Same file:
   - Add `head` to the `../lib/display.mjs` import, keeping the names alphabetical.
   - Change `h.body.slice(0, INJECT_CAP),` to `head(h.body, INJECT_CAP),`.
   - Change nothing else: not the header, not POINTER_CAP, not the stalePointer trim.
5. Flip R-2160 to `implemented`. Its evidence is `` `packages/nana-pack/tests/handoff-artifact.test.mjs::<exact title>` ``.
6. Run `npm run req:tree` to regenerate `docs/requirements-tree.md`. Commit it. It is generated, so never hand-edit it.

## Run (single files only, never the full suite)
- `node --experimental-strip-types packages/nana-pack/tests/<f>.test.mjs` for each f: handoff-artifact, handoff-store, handoff-staleness, handoff-trust, handoff-symlink, handoff-writer-role, display-surfaces, product-report and requirements-tree. Every one must exit 0.
- `node scripts/requirements-trace.mjs` must exit 0 and print 0 rows off form.
- `npm run map:check` and `npm run readme:check` must exit 0.

## Wrong code to try at the cut (restore after each; report which check fails)
| # | Wrong code | Expected failure |
|---|---|---|
| W1 | `h.body.slice(0, INJECT_CAP - 1)` | R-189 only |
| W2 | `h.body.slice(0, INJECT_CAP).toWellFormed()` | R-2160 only |
| W3 | drop the last unit when it is any surrogate (D800–DFFF) | R-189 only |
| W4 | `Array.from(h.body).slice(0, INJECT_CAP).join("")` | both |
| W5 | drop the last unit only on a low surrogate (DC00–DFFF) | both |
| W6 | the head fix with INJECT_CAP not exported | R-2160 only |
| W8 | `head(h.body, INJECT_CAP + 1).slice(0, INJECT_CAP)` | R-2160 only |

## Done
- R-2160 is implemented and green, red in step 3 for the real reason, and R-189 is still green.
- Each wrong version fails its expected check.
- Every listed file and script exits 0.
- Changed files: nana-handoff.ts, handoff-artifact.test.mjs, REQUIREMENTS.md and docs/requirements-tree.md. Nothing else.
- HANDOFF.md and docs/sessions/ stay untouched. The seat removes the two "Handoff summary cap" residual lines.

## Report (≤ 10 lines)
Commit SHA · files changed · the R-2160 FAIL line from step 3 (cut length and last unit) and the PASS line after step 4 · the R-189 line after the fix · wrong version → failing check · single-file exit codes · trace, map and readme exit codes · anything left open.