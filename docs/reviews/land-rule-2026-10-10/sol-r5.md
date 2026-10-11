## MUST

- Correct the verdict-format prose in `packages/nana-pack/README.md` and `docs/sessions/2026-10.md`.
- Both call the required line “bare,” while the parser accepts Markdown prefixes, wrappers, and trailing punctuation.
- The README’s “Anything else” claim is demonstrably false. For example, `> - **VERDICT:** LAND` records `LAND`.
- Describe the accepted decorations accurately, or refer to the verdict-only grammar without claiming every decorated form records an empty verdict.

## SHOULD

None.

## NOTE

- The three new score cases correctly record empty verdicts and directly exercise R-1010.
- The recovery text is accurate: an empty verdict remains attached to its revision, and a later LAND cannot clear it.
- The focused ledger suite passed using a scratch HOME.
- `readme:check`, `map:check`, and `git diff --check` passed.
- No production code changed after the accepted revision.
- The remaining changes are review records, acceptance evidence, and the requested documentation updates.

**Score: 8/10.**

VERDICT: LAND-WITH-FIXES
