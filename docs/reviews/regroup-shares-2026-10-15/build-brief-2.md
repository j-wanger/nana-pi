# Lane regroup-shares — build brief 2 (2026-10-16 · feat/regroup-shares · tip after the seat's records commit)

**Builder: Claude Sonnet 5.** Build 1 holds: the independent check (`seat-verify-28d53c7.md`) found no share lost,
duplicated, retargeted or invented with exit 0, and no non-first `Also applies:` line accepted. The seat's mutation runner
(`seat-mutate-output-28d53c7.txt`) caught 31 of 36 code breaks; the five survivors are test weaknesses, not code bugs.
Build brief 1's rules hold (touched test files only, in the foreground, each tool call under 5 minutes; commit; push).

1. **T4's "share lost beside a declared drop" tamper** (`packages/nana-pack/tests/requirements-lift.test.mjs:1416`, :1432,
   :1457): its mapping keeps `f2.also_applies = ["R-001","R-005"]`, so a recount built from `also_applies` still names
   R-005. §5 requires that tamper's `also_applies` to lack the share too: use `["R-001"]`, so only the recount from the
   declarations can name R-005. Show it red with the recount reading `also_applies`.
2. **T8 asserts the validator's own wording** (§5): the checks at test :1618, :1619, :1621 and :1624 accept the proof's or
   the tree check's message ("listed more than once", "does not exist", "tail: prose …"). Make each match the validator's
   own refusal text for its case — "a declared add it already carries", "a declared add of an unknown row", "a sharing
   feature heading named by the tail", "a repeated ID in shares_added" — so turning off that validator check reds T8.
   Show each red with its check disabled.
3. **Stale comments.** `scripts/requirements-lift.mjs:155-157` and `:1199-1200` still say shares are refused in every
   ledger form; R-1181 and R-1167's reworded clause say otherwise. Fix the comments; no code change.

Do not change any row's text. Do not touch `CHANGE.md`, the seat's files, `HANDOFF.md` or `docs/sessions/`.

## Done
`node scripts/test.mjs packages/nana-pack/tests/requirements-lift.test.mjs` green;
`node docs/reviews/regroup-shares-2026-10-15/seat-titles.mjs 1` → `0 missing`;
`node docs/reviews/regroup-shares-2026-10-15/acceptance.mjs > docs/reviews/regroup-shares-2026-10-15/acceptance-output.txt 2>&1`
→ only the seat's HANDOFF/session cases miss; `node scripts/code-map.mjs --check`. Commit, push.

## Report
≤ 10 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; each item with the red you saw; the test file's
summary line; the last line of each seat output.
