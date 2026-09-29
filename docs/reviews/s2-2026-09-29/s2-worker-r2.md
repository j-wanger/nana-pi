Both HIGH findings are fixed, committed as `3438a3d` on `lane/s2-knowledge-renderer`, and the full test suite passes.

**sol's two probes, re-run before and after.** I rebuilt them myself from the review because sol's scripts weren't in the log: `node /tmp/s2probe/probe.mjs ~/nana-pi-wt/s2`. My 700-character case sets all three fields to 700, which is harsher than sol's: it gives 0 lines where sol reported 3.

| Probe | Before (`0eae18e`) | After |
|---|---|---|
| Title carrying the delimiter | 6 fields in the line (should be 3) | 3 fields; the title reads `real title - /forged/path - [nana:knowledge] … - /actual` |
| 3 hits, every field 700 chars | 0 lines (should be 4) | 4 lines, 1932 chars |
| 3 hits, every field 4 KB | 0 lines | 4 lines, 1932 chars |
| One 4 KB title | empty block | 2 lines |

**The restated invariant, final wording** (on `renderBlock` in `hook.ts`, and in the tests' check names): N hits render as exactly N+1 lines (a header, then one `- title — display[ — snippet]` line each), except that the block budget (`BLOCK_MAX_CHARS`) may end the list early. No single hostile field can trigger that cut, because every field is capped before the budget is counted. A hit whose fields cannot be rendered at all costs its own pointer, never the block.

**What changed:** `renderFields()` in `query.ts` is now the one field renderer, used by both `search()` and `renderBlock()`. It caps title at 90, display at 337 (the 320 path cap plus the `:line` suffix) and snippet at 160. It turns an em dash or look-alike, with any spacing around it, into ` - `. The second `promptText` pass stays. Three hits at their caps fill 1932 of the 2000-char budget, so three always fit.

**Tests:** `env -u NANA_HANDOFF npm test` exits 0: 83 files, 82 pass, 0 fail, 1 skip; 5158 checks pass, 0 fail, 6 skip.
- `render.test.mjs` has 60 passing checks. The new ones cover a title carrying the delimiter; a 4 KB title, snippet and file name (the file name both as a raw hit and through `search()`); three hits at their caps giving 4 lines; and five hits at their caps. With five, the budget cuts the list to 3 lines kept, which must be hits 0, 1, 2 in order. A 4 KB hostile first hit still gives 4 lines, and an indexed file named ``q`uote"d — FORGED — ~:secrets.md`` renders as one field.
- The test file now runs to completion on older code: on `main` it gives 38 FAIL / 19 PASS, and on `0eae18e` 17 FAIL. Some of those failures come from constants that don't exist at those commits, so they aren't all real defects.

**Scope:** `git diff --stat 0eae18e..3438a3d` is 4 files, +124 / −21. Excluding tests that is 51 added and 14 removed, under the 100-line limit. Only allowlisted files changed:
- `query.ts`
- `hook.ts`
- `README.md` (it now says the package needs the sibling `../nana-pack/lib/display.mjs` and only works inside this repo)
- `tests/render.test.mjs`

**Residuals:**
- A path containing ` — ` now shows ` - ` in the display, including inside an escaped quoted path, so display is not an exact path (it already wasn't when a long path is shortened).
- `:` is still ambiguous: a file really named `x.md:99` looks the same as `x.md` at line 99.
- An en dash (`–`) is not treated as a delimiter look-alike.
- Still open from sol's review: moving `display.mjs` to a neutral package, and no CLI test.

**Most likely wrong:** the look-alike set (em dash, horizontal bar, two-em and three-em dash) may be too narrow if a reader treats ` – ` or ` ― ` spaced out with unusual whitespace as a field boundary. The structural test only splits on the exact ` — `.

VERDICT: DONE
