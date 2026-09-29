Commit **`c32f88d`** on `lane/s2-knowledge-renderer`, on top of `3438a3d`. Paths are now escaped reversibly, and the full test suite passes.

**The `/wiki/a — b.md` case** (loc 4). Reproduce with `node --experimental-strip-types packages/nana-knowledge/tests/render.test.mjs`, which prints a `PATH:` line.
- Before: `- t — /wiki/a - b.md:4 — s`. That names a different possible file.
- After: `- t — "/wiki/a \u2014 b.md":4 — s`. It splits into exactly 3 fields and the `:4` suffix is unaffected.
- Round trip: `JSON.parse` of both `pointerPath(P)` and the rendered field gives back `P` exactly (tested).
- It also round-trips a path containing a backslash, a quote, a C1 character, the literal text `\u0081` and a newline.
- An over-long path is shortened to fit the cap, marked with `…`, and contains no separator.

**Final wording of the claim** (code comment, README, test names): the exact separator ` — ` never appears inside a field. The path field is exact, or a JSON literal with the separator's dash and control characters escaped as `\uXXXX`, which `JSON.parse` reverses (unless the path was shortened, which `…` marks). In the title and snippet, which are prose, an exact separator becomes ` - ` for readability; that is not the guarantee. Look-alike dashes (en dash, minus, horizontal bar) are left alone. They can visually mislead a reader, and the block header already frames every field as data.

**Tests:** `env -u NANA_HANDOFF npm test` gives 83 files: 82 PASS, 0 FAIL, 1 SKIP; 5165 checks pass, 0 fail, 6 skip. `render.test.mjs` has 67 passing checks.
- New checks cover: the delimiter path through `search()`, with 3 fields and the exact escaped literal; its round trip; a title and a snippet still substituting; an en dash and a minus left untouched, with 3 fields still; and no exact separator in any rendered field.
- MUST 2's long-field and budget cases in sections 5 and 6 are byte-identical and still pass (5 hits at cap → 3 pointers, 1932 chars).

**Numbers on `main`:** sol's figures stand. The current test cannot instantiate on `main` because of missing exports; with a compatibility shim it is 36 FAIL / 21 PASS.

**Diff** (`git diff --stat HEAD~1`): 4 files, +74 / −23. Excluding tests: `query.ts` +34/−11, `README.md` +8, `hook.ts` +2/−1, so 44 added and 12 removed, inside the 80 LOC appetite. Everything is inside the allowlist. Nothing changed in `nana-pack`, the ranking, the schema, the caps, the budget, the header or `display.mjs`.

**Residuals:**
- **The diff is larger than the brief expected.** The look-alike list is deleted, but I added a new function, `pointerPath`, for the path branch. The escaped form has to go through `displayPath` so the length cap and the basename-preserving shortening stay unchanged. `displayPath` only escapes its own set of unsafe characters, so `pointerPath` swaps each em dash for a C1 control character the path doesn't contain, then turns that character's escape back into `\u2014`.
- **One path shape is dropped rather than rendered:** a path containing all 32 C1 characters has no free stand-in, so it throws and costs only that one pointer. It is not tested.
- **Pre-existing, unchanged:** a clean path that literally starts and ends with `"` looks the same as an escaped one.
- **Hand-built hits:** for a hit passed straight to `renderBlock` rather than coming from `search()`, the display is treated as a raw path.

**Most likely wrong:** mapping the stand-in's escape back to `\u2014`. It relies on reading the escaped string left to right in `\uXXXX`, `\\` and `\"` units. The one test with a literal `\u0081` in the path covers this, but no fuzz test does.

VERDICT: DONE
