# handoff-cap-surrogate · must-meet

Feature: FEAT-002 · Resume decisions and next actions (SUB-003 · Frame recent and stale context)

**Sentence:** when a fresh pi session injects a compaction summary longer than INJECT_CAP code units, and the cap falls inside a surrogate pair, the injected body ends immediately before that pair (INJECT_CAP − 1 units). In every other case the body is still its raw first INJECT_CAP units.

**Why it matters:** pi-ai's own sanitizer strips a lone half from the system prompt on most providers. The openai-codex provider sends `instructions` unsanitized (read from the pi 1.0.2 bundle), and every model in the owner's roster runs on it. How the server treats a lone `\ud83d` escape is unverified, so that harm is inferred. The lane also closes the two "Handoff summary cap" residuals that handoff-pins recorded.

**Class:** hook (a pi extension changes). Ladder: the roster reviewer (sol), the land reviewer (astra), the seat's wrong-code pairs and one independent check. Before nana-land, the seat runs the macOS install check, because its real pi turn loads this extension.

**Threat model:** in scope is honest variation: a model-written summary with emoji, rare CJK or any other astral character at any position. Out of scope is a hand-planted store file. Store reads reject invalid UTF-8 and a written lone surrogate becomes U+FFFD, so the body is well-formed before the cut. Only the cut can create a lone half.

## Design
- `extensions/nana-handoff.ts`: add `head` to the existing `../lib/display.mjs` import. `head` is the pack's pair-safe cut: the first n units, minus one when unit n−1 is a high surrogate. `objective.ts` and `displayText` already use it. Replace `h.body.slice(0, INJECT_CAP)` with `head(h.body, INJECT_CAP)`.
- Change `const INJECT_CAP = 8000;` to `export const INJECT_CAP = 8000;`, preceded by `// contract (R-189): the injected compaction summary body cap, in UTF-16 code units.` The file already exports a named const (`UNADDRESSABLE_MARK`), so this follows existing practice.
- **Sealing:** the R-189 check from handoff-pins pins the literal 8000 and stays the only sealing test. The new check imports `INJECT_CAP` by name.
- R-189's text ("capped at 8000 UTF-16 code units") stays true and unchanged. The header's "≤ INJECT_CAP" stays true. The code map lists no exports, so it does not change (map:check exit 0 on the probe).
- The new row requires regenerating `docs/requirements-tree.md` with `npm run req:tree`. Without it, requirements-tree.test.mjs fails 5 R-291 checks (probed).

## Must-meet

| Row | Requirement (EARS) | Test (file::title) | Red today |
|---|---|---|---|
| R-2160 | IF the injection cap falls between the two halves of a surrogate pair in a handoff summary body, THEN the injected body shall end immediately before that pair. | `packages/nana-pack/tests/handoff-artifact.test.mjs::cap: a body cut between the two halves of a surrogate pair is injected ending before that pair` | Probed on a temp clone of the handoff-pins tip 54433844 with a temp HOME. The body is 7999 × "x", then U+1F600, then "tail". **Unchanged code:** FAIL, but only because INJECT_CAP is not exported (CAP undefined, cut "😀tail"). **Export added, cut unchanged (W0):** FAIL for the real reason: the cut is 8000 units, ends on 0xD83D and is not well-formed. **Fix:** PASS, with a 7999-unit cut. R-189 passes in all three runs. |

The partner check already exists: the R-189 check `cap: a 9012-unit body is injected raw as its first 8000 UTF-16 code units, …`. Its body is a 12-unit prefix plus 4500 emoji, so unit 7999 is a low surrogate. It kills W1 and W3.

## Wrong versions (all probed)
| # | Wrong code at the cut | R-189 | R-2160 |
|---|---|---|---|
| W1 | `slice(0, INJECT_CAP - 1)` always | FAIL | pass |
| W2 | `slice(0, INJECT_CAP).toWellFormed()` (U+FFFD in place of the half) | pass | FAIL |
| W3 | drop the last unit on any surrogate (D800–DFFF) | FAIL | pass |
| W4 | code-point cut `Array.from(body).slice(0, INJECT_CAP).join("")` | FAIL | FAIL |
| W5 | drop the last unit only on a low surrogate (DC00–DFFF) | FAIL | FAIL |
| W6 | `head` fix, INJECT_CAP not exported | pass | FAIL |
| W8 | `head(body, INJECT_CAP + 1).slice(0, INJECT_CAP)` | pass | FAIL |

Equivalent, not wrong: stripping lone surrogates after the raw cut passes both checks. It matches `head` on every well-formed body, and the store only holds well-formed bodies.

## Known limits (residuals, not changed)
- Provider behaviour: whether the codex backend rejects or replaces a lone surrogate in `instructions` was not measured.
- The `stalePointer` writer trim (`w.slice(0, keep)`) can split a pair. The writer is the basename of pi's session file, so honest variation does not reach it. Using `head` there could leave an empty `writer ` label, which needs an R-127 decision.
- `nana-post-edit.ts` MAX_OUTPUT cuts raw. That file belongs to post-edit-timeout-name.
- The knowledge index cuts titles and claims raw (parse.ts). Every rendered field then passes through `promptText`, so the worst case is a U+FFFD. R-888 stays untested.
- `review-findings.mjs` cuts at FINDING_MAX_CHARS. That text goes to the ledger, not a prompt.
- POINTER_CAP and DAY_MS still carry no provenance note. They are out of scope.
- The test is a pure string check with no skip. It reuses the R-189 fixture's `fs.realpathSync.native(tmpDir(...))`, which handles Windows 8.3 temp paths. Windows and Linux run it as-is.