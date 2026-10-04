# Landing ruling — EARS form batch 0, `feat/ears-form` → `main` (2026-10-04)

Ruler: Fable (read-only; this file is the only write). Inputs: `git diff main...feat/ears-form`
(6f21ea9, 0704531, eac6906, 041e4e8 on ed90650; main is still ed90650, nothing newer), the worker
report, `batch0-astra-r1/r2/r3.md`, `batch0-seat-verify-after-r3.md`, `batch-0.json`, and my
`design-ruling.md`. `[V]` = I read or ran it today. `[A]` = astra or the seat ran it, I read the log.
`[I]` = inferred.

Stakes: medium-blast, reversible. The check reaches every rendered project, but only at the next
pushed tag; in this repo it is one count, two literals and thirteen rows.

## 1. Verdict: LAND

One reason. Execution closed every MUST astra opened in three rounds, and the row audit was
clean in every round. Round 1's four MUSTs closed in 0704531 `[A, r2]`. Round 2's three closed in
eac6906 `[A, r3]`. Round 3's one, the Python case-folding flag, closed in 041e4e8: the seat re-ran
the exhaustive sweep `[A, seat-verify]`, and I ran it again today `[V]`. Astra said a fourth round
was unnecessary once the sweep read zero. It does.

My runs `[V]`:

| Check | Result |
|---|---|
| `node scripts/requirements-trace.mjs` (worktree) | 551 rows, 469 implemented; `ears: 194 rows off form (allowance 194)`; exit 0 |
| `packages/nana-pack/tests/requirements-trace.test.mjs` | 8 pass, including `seal: EARS_ALLOWANCE is 194 (G-015)` and the R-757 equality seal |
| `packages/nana-pack/tests/templates-render.test.mjs` | pass, exit 0 (both languages, both modes, the Part G mirror check) |
| `boundary-sweep.mjs` | 1,114,112 codepoints, differences: 0 |
| off-form rows by section | §1–4: 37 · §5–9: 33 · §10–13: 24 · §14–26: 47 · §27–47: 53 · total 194; 233 new rows if every extra `shall` splits |
| `readme:check` on the main checkout | 544 claims, 0 problems — so the worktree's 5 are its missing `node_modules` and `apps/bench/.ext`, not the branch |
| worktree | clean at 041e4e8 |

The sizing in design-ruling.md §2 holds to the row. Of the 194 origins, 174 are `implemented`,
19 `untested`, 1 `planned`.

The one claim I could not verify is a green full `npm test` on this branch. The worktree lacks
`node_modules` and the bench extension, so every run in the corpus failed on the README check
alone. The seat's merge step runs the suite on main, where the baseline is green (§4).

## 2. Deviations from the ruling

- **ASCII word boundary — RATIFIED.** §1 said "whole word, case-insensitive" and left "word" to
  each runtime. Astra showed Node 22 and the rendered Python 3.14 carry different Unicode
  databases, 4,657 codepoints apart `[A, r2]`. The seat ruled a word character is `[A-Za-z0-9_]`
  on both sides, in both rails. I endorse it: rows are English prose, the contract has no database
  to drift with, and the exhaustive sweep is the proof `[V]`. The one false positive is a
  non-ASCII letter glued to `shall`, which no row here has `[A, worker r2]`. Amend §1's "whole
  word" to read "ASCII word". The sweep scripts stay in this folder as evidence, not as tests.
- **R-757, equality in nana-pi — RATIFIED, as astra ruled.** §1 chose a ceiling and said the
  seat lowers the allowance at every landing. R-757 makes that sentence fail loudly instead of
  depending on memory, for one comparison and no state on disk. The reusable rail and both
  templates stay `count > allowance` `[V]`. Its cost falls on other lanes. Any commit that moves the
  off-form count, even by retiring one row, must move `EARS_ALLOWANCE` and its seal too. That is the ratchet working. The seat closes Open question 7 (§4).
- **Split placement — directly after each origin, as ruled.** Both copies read that way `[V]`.
  The worker documented its first reading (G5 as the home for split rows); it was wrong, and
  astra fixed it in round 1. R-737's check now compares the sorted ID set with a duplicate check
  `[V]`; right, since R-737 promises IDs, not table order.
- **G-014 cites two tests in nana-pi**, the fixture and a spawn of the real CLI. §4 named one.
  The second is the one that pins "after the summary line" on the printed surface. Ratified.
- **Zero `implemented` split-born rows.** The worker refused to copy G-007's and G-012's cites onto
  G-019, G-021 and G-022 without a mutation of its own. It said so in the mapping. That is the
  rule applied, not evaded. The three stay `untested`; a coverage lane can promote them.

## 3. Residuals — where each one is

The worker recorded astra r3's four under REQUIREMENTS.md Open questions 8 (a) to (d) `[V]`. My
ruling's own residual list is only partly recorded:

| Residual | Recorded? | Where it goes |
|---|---|---|
| The form check counts tokens, not promises or coverage | yes, 8(a) | — |
| Generic allowances are ceilings; R-757 is nana-pi only | yes, 8(b) and R-757's cell | — |
| The render test does not run the rendered suites; acceptance step 4 is by hand | yes, 8(c) | — |
| The worktree's README-check failure is environmental | yes, 8(d) | — |
| Three-digit IDs: about 150 remain after the lane; widening is a rail change in both languages and in aml-desk's copy | **no** | new Open question 9 (§4) |
| The rail's older behaviours have no rows; only the form check does | **no** | the same question 9 |
| aml-desk (193 off form, own rail copy) and basketball-geek (2 off form, older markers) are out of scope and reach the check only at the next pushed tag | **no** | the HANDOFF line (§4) |

Nothing else to add. The exported `SHALL` regex carries the `g` flag, so a caller using `exec`
keeps state between calls; every caller today uses `match` `[V]`. Not worth a line.

## 4. Merge-commit edits (the seat; prose and rows only)

Main is ed90650, the branch's base, so the merge is clean. The branch adds four files in this
folder; none collides with the untracked review files already there `[V]`. Merge, then one
commit with these edits, then `npm test`, `map:check` and `readme:check` on main.

1. **`HANDOFF.md`**: replace the batch-0 line, which names the wrong ID range and the wrong
   TypeScript setting. The text below passes the checker: 8 sentences, 0 over, 0 passive `[V]`.

   > - **EARS form batch 0 LANDED 2026-10-04** (`<merge sha>`, `docs/reviews/ears-form-2026-10-04/`):
   > the trace rail counts `shall` per row and fails over a declared allowance (G-013 to G-015).
   > A rendered project sets it with `PROJECT_EARS_ALLOWANCE` or the `requirements_ears_allowance`
   > ini option. nana-pi's own is `EARS_ALLOWANCE`: 194, lowered at every landing and sealed.
   > Part G's six origins split into G-016 to G-022, each directly after its origin. Off form:
   > 200 → 194, 233 rows to come. Batches A1, A2 (A2+A3 if A1 is clean), B and C run sequentially,
   > one worktree at a time. Each lands on a mechanical verifier plus one astra round
   > (`batch0-land-ruling.md` §5). aml-desk's rail copy and basketball-geek are out of scope; the
   > check reaches them only at the next pushed tag.
2. **Open question 7**: replace "Fable's landing sign-off is the formal close." with "Closed at
   landing (Fable, batch0-land-ruling.md §2): kept. Any commit that moves the off-form count moves
   `EARS_ALLOWANCE` and its seal in the same commit."
3. **Open question 6b**, append two sentences: "The EARS-form lane (design-ruling.md,
   ears-form-2026-10-04) is that pass for the 194 rows off form, batches A1 to C, allowance 194 to
   0. Its closing 25-row sample rate lands here."
4. **New Open question 9**: "(ears-form batch 0, Fable) About 150 three-digit IDs remain after the
   lane. Widening to four digits is a rail change in both templates and in aml-desk's copy; the
   seat's call. The rail's older behaviours (markers, cites, statuses) have no rows of their own;
   only the form check does."
5. **R-757 requirement cell**, trim to the sentence: "WHERE this repo's measured count of rows off
   form is lower than EARS_ALLOWANCE, the repository suite shall fail naming the stale headroom."
   The deviation record moves to the evidence cell after the cite: "deviation from
   design-ruling.md §1, kept at landing (Open questions 7)".

The edits need no test, marker or map change; `map:check` is green on the branch `[A, r3; V, worker]`.

## 5. Batches A1 to C: the plan holds; the review shape shrinks

**The sizing holds** `[V, §1 table]`. Origins 37 · 33 · 24 · 47 · 53; 233 new rows. Allowance
194 → 157 → 124 → 100 → 53 → 0.

**What batch 0 taught.** Three rounds, eight MUSTs; every one was in the check's code (masking,
boundary, print path) or a ruling interpretation (placement). The row audit found no overclaim in
any round. Batches A1 to C touch no code: rows, `req:` lines, two literals, one JSON. The class of
defect that cost three rounds cannot occur. Three classes remain. A mechanical slip: an ID, a
placement, a marker on the wrong test, a touched assertion. A lost or hidden promise in a clause
sentence. An `implemented` split row whose cite does not pin it. The first class is a script's
job. The other two need one reader, once.

**Subtraction on the review spend.** A second round on bookkeeping only confirms that the worker
applied a status flip or a sentence fix. The seat can read that. A per-batch landing ruling buys
nothing a green verifier and an astra LAND do not. Both go.

**The shape, every batch:**

1. **Worker** (Sonnet) writes `batch-<n>.json` and applies it with `apply-batch.mjs`, a throwaway in
   this folder written once in A1 and reused. The script also verifies; that is the mechanical
   verifier.
2. **Verifier output must be all green before review.** It checks:
   - Every pre-existing ID is present and no on-form row changed.
   - Every new ID sits inside its declared block, directly after its origin or previous sibling.
   - Every committed cell equals the mapping's text.
   - The rail is green and the batch's sections are at zero off form.
   - The `ears:` line, both seals and G-013's evidence cell carry the new count.
   - Every `implemented` split row names an assertion in the mapping.
   - Every `untested` split row carries the standard evidence sentence.
   - Every changed line under a test root matches the marker regex, so no assertion moved.

   It prints the sibling-cite list (new rows whose cite set equals the origin's) and the
   `merged` list.
3. **Astra, one round**, fixed brief. Read every origin against its clauses for a lost or merged
   promise. Mutate every row on the sibling-cite list and every `merged`. Mutate a 20-row seeded
   sample of the batch's `implemented` split rows, or all of them if fewer. PINS or PARTIAL per row.
4. **Round 2 only on a judgement MUST**: a lost promise, a merge that hides one, or PARTIAL above
   2 of 20. Then the worker fixes, the sample is redrawn, astra reads once more. The worker fixes a
   mechanical MUST; the seat closes it by re-running the verifier and reading the fixed rows. The cap stays three; the expectation is one.
5. **The seat lands** on verifier green plus astra LAND, or BLOCK on mechanical items the seat
   closed. No Fable ruling per batch. Fable rules at C, the lane close: G-013 flips, the §5
   acceptance list runs, 6b closes with the final 25-row rate. Fable also rules on any deviation
   from design-ruling.md a batch wants to make, before it is built.

**Merging batches.** Keep A1 alone: it is the calibration batch and holds the gate, the densest
section (21 rows). A1 is clean when its round is LAND, or BLOCK on mechanical items only, with
PARTIAL at or under 2 of 20. Then merge A2 and A3 into one batch of 57 origins and 62 rows, the
size of B. Ladder: 194 → 157 → 100 → 53 → 0, four landings after this one. Do not merge B and C.
100 origins in one Sonnet pass is where sentence quality drops, and they span five packages and
two test suites.

**Per-batch allowlist** gains one item the ruling missed: G-013's evidence cell in nana-pi, the
count only. Everything else stands as written in §5 of the ruling.

**What would change this.** A1's sibling-cite list is long and mostly legitimate (parametrised
tests): drop that list from the brief and sample at random only. A1's PARTIAL rate stays above 1 in 5
after the second sample: the status rule tightens to "untested unless the mapping quotes the
assertion line". A2 and A3 then stay separate.

## The claim most likely wrong

That one astra round is enough for a 57-origin batch. Batch 0 had six origins and zero
`implemented` split rows to judge; the first real reading load is A1. If A1's round returns a
judgement MUST, A2 and A3 stay separate, and the shape above is the ceiling, not the norm.
