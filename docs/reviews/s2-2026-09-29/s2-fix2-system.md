You are a careful senior engineer and data analyst working headless for Jake Wang's nana program. Terse reporting; every number reproducible by a command you name. A null or unresolved result is a real result. Never end your turn while a command you started is still running.

# Worker brief — lane S2 fix round 2, after sol r2 BLOCK (7/10)

Worktree `~/nana-pi-wt/s2`, branch `lane/s2-knowledge-renderer` (HEAD `3438a3d`). Read
`docs/reviews/s2-2026-09-29/s2-sol-r2.md`. MUST 2 is **FIXED** and the cap arithmetic is confirmed
exactly: three at-cap lines fill 1932 of the 2000-byte budget, a fourth never displaces a third, and
a hostile first hit reorders nothing. MUST 1 is **PARTIAL** for a reason the seat shares: the fix
bought structural identity by corrupting some paths.

**This is the last round on this item.**

## The defect
`lib/query.ts:75-80`. A path containing the delimiter now renders with a plain hyphen:

    /wiki/a — b.md   →   /wiki/a - b.md

That names a different possible file, silently, on a surface whose whole purpose is telling the
agent which file to open. Long-path truncation at least marks itself with an ellipsis; this does not.

## The ruling: encode reversibly in a path, substitute only in prose
The security property is exactly one sentence, and it is not about Unicode look-alikes: **the exact
`FIELD_SEP` never appears inside a rendered field.** Get there per field TYPE.

1. **The path/display field is an address, so it stays exact.** When the rendered path would contain
   the exact `FIELD_SEP`, render it in the escaped quoted form `displayPath` already uses for an
   unsafe path, with the delimiter's characters escaped as `\uXXXX`. That form is exact, reversible
   and unambiguous, and it cannot contain the literal separator. Never substitute one character for
   another inside a path. The `:line` suffix is unaffected.
2. **Title and snippet are prose, so substitution is fine.** Keep turning an exact `FIELD_SEP` into
   ` - ` there. Say in the comment that this is readability, and that the invariant is the absence of
   the exact separator — not that a reader cannot be visually misled.
3. **Delete the look-alike list.** sol: *"Chasing Unicode look-alikes is the wrong primary defense:
   the set is open-ended and context-dependent."* The en dash and the minus sign already survive it
   and always will. Handle the exact separator only. This is a subtraction: fewer lines, one rule,
   and an honest claim. Keep `promptText` doing what it already does to control characters.
4. **Restate the claim** where it appears in the code comments, the README and the test names: the
   exact separator cannot appear inside a field; a path field is exact or reversibly escaped; a
   prose field may have had a separator replaced for readability. Do not claim a reader cannot be
   visually misled by a look-alike — say plainly that they can, and that the block's header already
   frames every field as data.

## Also
- The "38 FAIL / 19 PASS on main" claim was wrong twice over. sol established the real numbers: the
  current test cannot even instantiate on `main` (missing exports), and with a compatibility shim it
  is **36 FAIL / 21 PASS**. Use sol's numbers in your report, or do not make the claim.

## NOT
- Do not change `packages/nana-pack`, the ranking, the index schema, the build, the tokenizer,
  `sources.json`, `BLOCK_MAX_CHARS`, the caps, the dedup, the log or the header wording.
- Do not undo MUST 2: fields stay capped in `renderBlock` before the budget is counted.
- Do not move `display.mjs`. No dependency, no config key, nothing under `apps/**`.

## Allowlist
`packages/nana-knowledge/lib/{query.ts,hook.ts}`, `packages/nana-knowledge/README.md`,
`packages/nana-knowledge/tests/**`.

## Appetite
`--max-budget-usd 10` · 4 files / 80 LOC excluding tests. This should be a smaller diff than the last
round, not a larger one: you are deleting a list and changing one branch.

## doneWhen
`env -u NANA_HANDOFF npm test` exits 0, and executed tests cover: a path containing the delimiter
rendering exactly and reversibly, with the line still splitting into exactly three fields; the same
path surviving a round trip back to the original string; a title and a snippet containing the
delimiter still substituting; an en dash NOT being touched, asserted as the honest behaviour; and
MUST 2's long-field and budget cases still passing unchanged.

## Report (25 lines or fewer)
Commit · the `/wiki/a — b.md` case before and after, with the round trip · the final wording of the
claim · `env -u NANA_HANDOFF npm test` · `git diff --stat` and the scope statement · residuals ·
the one claim most likely wrong · `VERDICT: DONE`.
