## Findings

### MEDIUM — the new additive API corrupts an astral `extra` character
**`packages/nana-pack/lib/display.mjs:62-68` — executed**

`Array.from(raw)` supplies an astral character as one two-unit string, but `tok()` emits only `charCodeAt(0)`. The result loses its low surrogate:

```text
displayPath("/a😀b", "😀") -> "\"/a\\uD83Db\""
JSON.parse(...)           -> "/a\ud83db"
round trip                -> false
```

This violates the explicit requirement that passing a character only escape more; it silently changes the locator. The current em-dash caller is BMP and unaffected, but the newly shared API makes a broader claim. Smallest fix: when an unsafe token spans a surrogate pair, emit both UTF-16 escapes (`\uD83D\uDE00`), and add a package-level regression asserting JSON round-trip.

## Confirmations

- **`packages/nana-pack/lib/display.mjs:62-82` — executed:** 50,000 deterministic hostile inputs produced byte-identical output between the prior implementation and `displayPath(p)` with no `extra`. The 1,071 objective goldens also passed.
- **`packages/nana-pack/lib/display.mjs:64-82` — executed:** BMP-extra paths become quoted, remain reversible, stay within `PATH_CAP`, and retain the basename under middle elision. A path unsafe only because of `extra` is correctly quoted.
- **`packages/nana-knowledge/lib/query.ts:69-104` — executed:** 100,000 short delimiter-bearing paths round-tripped through `JSON.parse(pointerPath(p))`, with no literal `FIELD_SEP`. The all-C1 regression passes. The worker’s token-by-token rewrite is gone, so none of that parsing risk remains; the astral defect above is a separate generic-API issue.
- **`packages/nana-knowledge/lib/query.ts:83-104`, `lib/hook.ts:86-114` — executed:** MUST 1’s exact-separator invariant holds for the current S2 caller. Prose substitutes only the exact separator; en dash and minus remain untouched as declared.
- **`packages/nana-knowledge/lib/hook.ts:86-114` — executed:** MUST 2 remains fixed with unchanged numbers: caps `90/337/160`, five hits retain `0,1,2`, three lines occupy 1932/2000 characters, and a hostile first hit retains `H,1,2` at the same 1932 characters.
- **`packages/nana-knowledge/tests/render.test.mjs:125-147` — executed:** delimiter path, all-C1 path, reversible raw display, look-alikes, and field-count regressions pass.
- **Scope — executed:** `main..HEAD` contains exactly the expected five files, including the seat-authorized `packages/nana-pack/lib/display.mjs`; `git diff --check` passes and the worktree is clean. Lifting the restriction was the right engineering choice—the shared renderer is safer than retaining the stand-in trick—but it also makes the generic additive contract subject to package-level correctness.
- **Full suite — executed:** `env -u NANA_HANDOFF npm test` passed: 83 files, 82 PASS, 0 FAIL, 1 SKIP; 5167 checks passed.
- **Across rounds:** round-1’s original delimiter spoof, long-hit omission, and historical-main count were read from the prior review; their fixes were independently re-executed here. Round-2’s historical lossy path was read; the replacement’s exactness, field invariant, look-alike behavior, cap arithmetic, ordering, and hostile-first behavior were independently executed here.

This does **not** land yet because the seat’s stated additive contract has a concrete Unicode shape that silently corrupts data. The smallest landing change is to encode every UTF-16 unit of an unsafe astral token and add the one round-trip regression; no nana-knowledge logic needs changing.

Residuals to carry after that fix, priced by cost of error: **medium** — look-alike characters can still visually mislead, intentionally mitigated by the data header; **low/medium** — nana-knowledge remains coupled to nana-pack’s repository layout, now accurately declared; **low** — more than the 16× pre-cap in leading whitespace can erase later prose; **low** — no CLI-level rendering test; **low** — a clean path literally surrounded by quotes can visually resemble an encoded path.

SCORE: 8/10  
MUST: Fix astral `extra` escaping in `displayPath` and pin its JSON round-trip; bounded N+1 remains FIXED.  
CARRY: Visual look-alikes; cross-package layout coupling; 16× pre-cap loss; CLI coverage; quote-shaped clean-path ambiguity.  
VERDICT: BLOCK
