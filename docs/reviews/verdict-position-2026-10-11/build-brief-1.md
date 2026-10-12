# Lane verdict-position — build brief 1 (2026-10-11 · feat/verdict-position · worktree ~/nana-pi-wt/verdict-position)

**The contract is `CHANGE.md` in this folder: §1 outcomes, §2 rows, §3 scope, §4 design, §5
verification.** sol reviewed the plan four times (`sol-plan-r1..r3.md` here; r4 LAND 10/10). Read
them for the reasons. `seat-proto.mjs` is the seat's prototype of §4: your code must give the same
answer on every input, but do NOT copy it into the product or import it from a product file or a
suite test. URGENT: every yokai-world land is refused until this lands.

## What to build (each item maps to CHANGE.md)
1. **Rows first** (§2): reword R-969 and R-1010 to the §2 text exactly; update each row's Evidence
   to the tests that pin it. One `shall` each. Run `npm run req:tree`.
2. **`packages/nana-pack/lib/verdict-config.mjs`** (new, six-tag header): the look-alike fold table
   as one exported constant (Greek and Cyrillic capitals and small letters that look like V, E, R, D,
   I, C, T — at least the set in `seat-proto.mjs`), with its provenance beside it (`chosen`, the
   reason, the date). Named exports only.
3. **`verdictWord` in `packages/nana-pack/bin/review-round.mjs`** (§4): remove one leading
   byte-order mark; split into lines; `canon` = NFKC, then remove
   `/\p{Default_Ignorable_Code_Point}/gu`, then fold (imported table), then lower-case; DETECTION
   always uses `canon` (the bounded `verdict:` token, and the other-line `verdict` scan); ACCEPTANCE
   always matches the RAW line (the final-line grammar, now also taking a bare ` n/m` score; the PLAIN
   first-line grammar). Final-line branch, then first-line branch, exactly as §4.
4. **Tests** in `packages/nana-pack/tests/review-ledger.test.mjs`, each `// req:` marker directly
   above its `check(...)`: every §3 new case, through the same real launch path the existing
   R-969/R-1010 tests use. The two changed expectations in §3 — and NO other existing expectation —
   change: (1) the `VERDICT: LAND | FIX-FIRST | BLOCK` + final `VERDICT: SEND-BACK` case → empty (move
   it to the empty list or give it its own check); (2) `ΕERDICT: SEND-BACK` after a first-line LAND →
   LAND, plus the new `VΕRDICT: SEND-BACK` (Epsilon in the E position) → empty. CRLF, trailing tab
   and no-final-newline cases for the first-line form.
5. **Docs**: the pack README's verdict paragraph (`packages/nana-pack/README.md`, the "Limits to plan
   for" paragraph that begins "A review's verdict is read from its final non-blank line only") —
   rewrite it to state §1's outcomes 1–5 and §4's residuals in plain words. Every sentence must be
   true of your code: probe each example it gives through the real parser before you commit.
   Do not edit `HANDOFF.md` or `docs/sessions/` — the seat writes them before the final review.

## Rules
- **Wrong code first.** For each new case, run the obvious wrong implementation and see it fail
  before writing the code. Mutation pairs as CHANGE §5 lists: break the CODE (or a scratch copy),
  never an assertion; record red and green for each.
- **No suite test may run, import or copy a seat script** (`seat-*.mjs` in this folder).
- **No test deletion.** Every test title in `land.test.mjs` and `review-ledger.test.mjs` at launch
  (`fdee8c9`) must survive or map to a named replacement with a reason in
  `test-title-map.json` (this folder); `seat-verify-tests.mjs` checks it. Nothing retires.
- No test writes the repository or the real review ledger: fixtures in the OS temp dir; every test
  that reaches the ledger uses a scratch `home`/`HOME`.
- Fix the class, not the instance: when a case fails, look for its siblings (other invisible
  characters, other look-alikes, the other branch).
- NOT (§3): no rewrite of recorded verdicts; no per-repo setting; no edits in other repos or to the
  historical lane tools under `docs/reviews/` (the land-rule seat scripts stay as they are).
- Commit with explicit paths, message file under `$TMPDIR`. Keep gate-trigger text out of command
  strings.

## Then
`npm run req:tree`, `npm run map`, `npm run map:check`, `npm run readme:check`,
`npm run test:locked`, commit; then, from the repo root:
`node docs/reviews/verdict-position-2026-10-11/seat-verify-verdict.mjs ~/yokai-world/docs/reviews > docs/reviews/verdict-position-2026-10-11/seat-verify-verdict-output.txt 2>&1`
(must exit 0 with `seat-verify-verdict: 0 mismatch(es)`; at launch it fails 22 cases and 127 corpus
files — `seat-verify-verdict-launch.txt`), and
`node docs/reviews/verdict-position-2026-10-11/seat-verify-tests.mjs > docs/reviews/verdict-position-2026-10-11/seat-verify-tests-output.txt 2>&1`
(must end `seat-verify-tests: 0 gap(s)`). Commit both output files. The seat scripts, the prototype,
the corpus file and `CHANGE.md` are frozen; if you think one is wrong, say so in the report and do not
edit it.

## Report
≤ 40 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; files; the two rows and the
clause each cited test pins; mutation pairs red/green; the `test:locked` summary line and the suite's
total check count; the LAST TWO LINES of each seat output file, verbatim; scope check
(`git diff --stat <the commit that adds this brief>..HEAD`); the one claim most likely wrong.
