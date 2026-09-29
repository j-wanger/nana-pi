# E1 checkpoint: advisory size ceiling crossed (2026-09-28)

**Crossed:** the advisory cap was ≤10 files / ≤600 LOC. The lane has:
- 783 LOC of tool code (`catch-ledger.mjs` 212, `lib/catch-extract.mjs` 310, `lib/catch-judge.mjs` 148, `lib/catch-stats.mjs` 113);
- 166 LOC of tests;
- 19 files, of which 12 are data artifacts (rows, labels, matches, results).

The spend ceiling was not crossed: judge spend was $10.11, plus the builder session.

**Why it is over:**
- The extractor needs ~310 lines because the 35 reports come in about ten markdown shapes: heading items, numbered severity lists, MUST/CARRY labels, inline `;` lists, and status lines.
- The pieces that could be subtracted are pass `c` and matcher pass `b`, about 40 LOC. They were added after the fact as reliability and sensitivity checks. They are also what exposes that P2 and P1-on-5-lanes are unreliable, so I kept them.

**Done:**
- `doneWhen` is met: `npm test` exits 0 (72 files, 4500 checks); extraction is deterministic; κ is reported; the claims are answered from `results.json`.

**What remains, and what it would cost:**
1. **sol review, r1 (scope + adversarial), per the lane's Roles.** It runs on the Codex subscription at ~$0 metered and takes about 5–10 minutes. It was not started because of this checkpoint. Command, from the repo root:
   ```bash
   pi-review --item e1-catch-ledger --role sol --out docs/reviews/e1-2026-09-28/sol-r1.md \
     --stall-secs 90 --retries 2 -- --provider openai-codex -m gpt-5.6-sol -t read,grep,find,bash \
     -p "$(cat apps/bench/studies/catch-ledger-2026-09-28/CHECKPOINT.md | sed -n '/^## Review brief/,$p')"
   ```
2. **Land** (Opus 5.5) after the review, following the Roles line.
3. **Optional, not needed for doneWhen:** make P3 and P2 answerable. Both failed their κ check, so the label guide needs sharper `origin` and `relation` definitions, followed by a re-run of `label a`, `label b` and `label c`. Estimated at ~$7 of judge spend. A 20-row human-labelled calibration set would be more useful than a third model.

## Review brief (sol r1 — scope · adversarial)

Read-only except scratch work under /tmp. Worktree `~/nana-pi-wt/e1`, branch `lane/e1-catch-ledger`, commits `fcf012d` (pre-registration) and the ledger commit after it.

Contract: the E1 lane brief is summarised in `apps/bench/studies/catch-ledger-2026-09-28/PREREG.md`. The results are in `RESULTS.md` in the same directory. The corpus under `docs/reviews/tranche{1,2}-2026-09-28/` is evidence and must not be modified.

**Scope**
- Did `PREREG.md` precede every judge label? Check with `git log --format='%h %ci %s'`.
- Is anything outside `apps/bench/` touched? Nothing under `lib/`, the gate, the ledger or the objective producer may change.
- Does the size overrun earn its keep?

**Adversarial (executed)**
- Re-run `node apps/bench/catch-ledger.mjs extract && node apps/bench/catch-ledger.mjs build`. The output must be byte-identical to the committed `rows.jsonl`, `results.json` and `table.md`.
- Attack the matcher with near-duplicate findings across rungs. In a scratch copy (`CATCH_REVIEWS`, `CATCH_OUT`), check whether `stageHints` and `adjacency`/`buildLedger` mis-attribute uniqueness. Read `matches-a.jsonl` against `ledger.jsonl` for P1's rows: l1/astra-r1#1, l2/astra-r1#1, l3/astra-r1#1, t2b/astra-r1#2, t2c/astra-r1#1–3.
- Check κ by hand on at least 10 rows of `kappa-pairs.json`, and on the whole top-level axis.
- Verify that no finding is silently dropped: compare `skipped.jsonl` plus `rows.jsonl` against at least 5 reports read by eye.
- Try the judge's fail-closed path: set `CATCH_JUDGE_BIN` to a missing binary, and separately to a stub that prints garbage.

Report findings as severity-tagged items with `file:line`, then `VERDICT: LAND|BLOCK`.
