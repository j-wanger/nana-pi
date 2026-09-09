# Verdict — tool-profiles-2026-09-08 (applied 2026-09-09, N=3, 132 runs, all decided)

The procedure in DESIGN.md was applied mechanically to `summary.md`. Numbers are median observed
spend per task (own + nested tokens), `Total` = sum of per-task medians on shared tasks.

**N→5 trigger:** 0 insufficient task IDs (every task decided 3/3 in every arm) → no extension.
**Correctness everywhere:** 132/132 success. No comparison can turn on correctness; every verdict
below is a cost verdict or a cost-unmeasured stop. This is a ceiling effect (see Validity).

## 1. B (lean-code) vs A (pi-defaults), code — **REGRESSION (cost, per-task clause)**
Step 0 clear (no nested unknown). Step 1: 8/8 sufficient. Step 2: rate equal (MR 1.0 both,
Wins = Losses = 0); Total(B) 126,231 vs 1.15×Total(A) 140,256 → not tripped; per-task 1.5× clause
tripped by `code-glob-count` 4,763 vs 2,334 = **2.04×** (find+bash vs one bash). Verdict:
REGRESSION. Context, not re-litigation: the absolute excess is ~2.4k tokens; B spent 3.5% more
overall; B used grep/find/ls as the brief intended (tool mix bash:19 grep:16 find:3 ls:2 vs A's
bash:44) — it just did not pay for itself.

## 2. B′ (lean-code-hinted) vs B, code — **REGRESSION (cost)**
Total(B′) 156,760 > 1.15×Total(B) 145,166; per-task `code-bugfix` 1.78×. The appended hint made
the model do MORE exploration (find/ls calls appear), not less. Keep B over B′; A over both.

## 3. C (research = B + pi-web-access), both families
- **C vs B, research — INSUFFICIENT DATA (cost unmeasured).** Step 0: 3 C runs carry
  `nestedUnknown` (the sidecar observed a model connection/phase it could not measure). Rates
  equal, so no correctness-only verdict survives; the comparison would have turned on cost → stop.
  Context: observed spend lower bound Total(C) ≥ 121,301 vs Total(B) 21,814 (≥5.6×), and B
  answered every research task with one or two `npm view` bash calls — the research family did
  not require the web at all (design limitation, see Validity).
- **C vs B, code — REGRESSION (cost).** No nested unknown in the code arm. Total(C) 202,531 >
  145,166; per-task up to **5.55×** (`code-glob-count`), 3–3.6× on the trivial navigation tasks.
  Mechanism (from the records): every C turn carries pi-web-access's four tool schemas —
  `cacheRead` medians of 8,192 on two-turn tasks where B shows 0–1,408 — so the extension taxes
  every turn whether or not a web tool is used.
- **C for research work: NOT adopted** (needs IMPROVEMENT). **C as default: NOT adopted** (code
  verdict is REGRESSION, and step 0 forbids default adoption under any unknown).

## Falsification of the research brief (docs/tools-research-2026-09-08.md)
The brief expected a "modest win" from B. On this workload the measured result is equal
correctness at 3.5% higher total spend with one task at 2×; by the pre-declared rule that is a
regression, and the brief's operational recommendation is contradicted **for this workload**.
Equal results show nothing positive; they do not rule out benefits on harder work.

## Validity (read before generalizing)
1. **Ceiling effect.** gpt-5.6-sol solved every task in every profile. Navigation/metadata tasks of
   this size cannot discriminate correctness between tool sets; only cost moved. A follow-up needs
   tasks the seat FAILS without structured search (multi-file, ambiguous names, large repos).
2. **The research family was answerable offline** (`npm view`), so C's web tools were never
   necessary. A real test of web access needs keys that no local command can produce.
3. **C's nested spend is a lower bound** on 3 runs; the sidecar flagged rather than guessed.
4. N=3 pilot; per-task IQRs are small on navigation tasks (≤ 25 tokens) and large on the two edit
   tasks (up to 22k), which is where any real difference would have to be shown.
5. Cache warmth was randomized by block; C ran warm 24/24 on code (its larger prompt caches well),
   which if anything flatters C's cost.

## What this decides
- Default profile stays **A (pi defaults)**; `defaultTools` unset. (Jake may still choose B for
  its tool mix — the price is known: ~3.5% on this workload.)
- pi-web-access is **not** user-installed; the `.ext` install stays for future studies.
- Next study candidates: (a) failure-capable code tasks; (b) research tasks with web-only keys;
  (c) the `-xt` per-spawn narrowing the desk now offers, measured the same way.
