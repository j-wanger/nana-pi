# Method ruling — EARS form batches B and C (2026-10-04)

Ruler: Fable (architecture + landing, read-only; this file is the only write). Inputs: `design-ruling.md`,
`batch0-land-ruling.md`, the A1/A2/A3 briefs, reviews and worker reports, `batch-a3.json` and the A3
worker report in `~/nana-pi-wt/ears-a3`, `apply-batch.mjs`, `refusal-test.mjs`, `REQUIREMENTS.md` on main
(`ef9d774`). `[V]` = I read or ran it today. `[A]` = astra or the seat ran it, I read the log. `[I]` = inferred.

Stakes: medium-blast, reversible. Rows and statuses in one file, no code, no tag until C. The spend is the
irreversible part: three batches have each cost two astra rounds and two or three Sonnet fix cycles.

## The rulings in one screen

1. **Method.** (b)'s default with one executed promotion path. Every split-born row starts `untested`. It
   reads `implemented` only when the mapping carries one recorded red mutation per condition and outcome
   the clause names, each record quoting the words it pins. astra reads the quotes against the sentence
   and replays one record in five. It mutates nothing. A gap is a downgrade the seat applies, never a redraw.
2. **A3** lands under its in-flight fix. Its round 2 switches to the read-and-replay shape. No round 3.
3. **B and C** stay two batches. The mapping is grouped by package; the reviewer reads per package.
4. **Review.** One astra round. Form findings are the only MUST. Status gaps are NOTEs the seat closes
   mechanically. The bar: zero lost, hidden or merged promise and zero dropped condition. The gap rate is
   reported per batch for 6b, not gated.
5. **apply-batch.mjs.** One record field (`pins`, substring-checked), the implemented read-list on
   stdout, and the untested sentence as a per-batch mapping field with the old sentence as default.
   Landed rows keep their sentence.

---

## 0. The ground

| Batch | Origins | New rows | Claimed `implemented` | Round 1 found | Rounds | Fix cycles |
|---|---|---|---|---|---|---|
| A1 | 37 | 37 | 32 (86%) | 3 of 20 PARTIAL; 3 of 5 `untested` rows pinned by existing assertions | 2 | 3 |
| A2 | 33 | 36 | 30 (83%) | 3 of 20 PARTIAL; 4 of 10 code-read rows PARTIAL; 2 merges rejected; 1 condition lost | 2 | 3 |
| A3 | 24 | 23 | 20 (87%) | 6 of 20 PARTIAL; 3 merges rejected; 1 promise dropped | 1 so far | 1 in flight |

All `[V]` from the review files; A3's from `batch-a3-astra-r1.md`.

| Fact | Value |
|---|---|
| Remaining off form | 100 after A3 `[A]`. B: 47 origins (43 `implemented`, 4 `untested`), 64 new rows, §14–26, three packages. C: 53 origins (44 `implemented`, 9 `untested`), 69 new rows, §27–47, two apps `[V]` |
| Dense rows | B has 13 rows with three or more `shall`, C has 15. R-348 carries five `[V]` |
| Density predicts the overclaim | A3's six PARTIAL rows average 2.8 named conditions by a rough count; its fourteen PINS rows average 1.6 `[V]`. The PARTIALs: R-844 "at once, with a message, without a stack, before the review runs"; R-912 SIGINT/SIGTERM and the whole tree; R-843 file and line |
| Every A3 PARTIAL was text-detectable | R-833 "as given" against `status === 0`; R-843 "naming file and line" against `exit 1`; R-844 "at once" against nothing timed; R-846 pi-review against a pi-worker launch; R-910 exit-1 FAIL against an exit-0 WARN cite; R-912 interrupt against a timeout cleanup `[V, r1 table]` |
| Recorded mutations replay | A2: 12 of 12 red. A3: 10 of 10 red `[A]`. The record class is reliable once executed |
| Records in A3 | 48 for 42 implemented clauses; 6 clauses carry two `[V]`. Three were isolated reproductions; astra found one of the three claims behind them incorrect (`ledgerRun()` already has a 30 s timeout) `[A]` |
| `refusal-test.mjs` | replays `batch-a2.json` against the verifier `[V]`. A global change to the standard sentence breaks it |
| The rule tightened once already | A2 → A3: `implemented` needs an executed recorded red mutation. The PARTIAL rate went 15% → 30% |

## 1. Why not (a) as it stands

One red mutation proves sensitivity to that mutation. The worker chooses it; the adversary chooses the
condition the worker did not. Tightening the rule to "executed and recorded" moved the proof from code-read to
execution and the rate rose, because the gap was never execution. It is enumeration: a one-`shall` clause
still names two to five conditions, and nothing in the mapping says which ones the record covers. B and C
are denser than A3. On the current shape I expect both to take three rounds and hit the cap.

The seat's per-condition rule for A3 is the right standard. It fails as a review method only because the
enumeration lives in the worker's head. Put it in the mapping and the review becomes a read.

## 2. Why not pure (b)

Numbers `[I]`, from the three batches. Workers claim about 85% of new rows `implemented`; astra finds 15–30% of
those PARTIAL. So of 133 new rows in B and C, roughly 80–90 are fully pinned by existing assertions today.
Pure (b) writes `untested` on all 133. Against (a)'s roughly 33 untested, that is about **+100 untested
rows, of which about 85 are an under-claim**, not the honest picture.

Two costs beyond the count. `untested` is defined in the header as "the code does it, nothing pins it";
pure (b) would use it to mean "unjudged", a vocabulary change the header does not carry and the rail cannot
express. And the 6b lane would then re-pay the fixed cost of this machinery — worker, verifier, reviewer,
seat close — to flip about 85 rows back. The subtraction test says: judge once, now, with the machinery
warm, but make the judgement legible so one reader can check it without mutating.

(c), a Sonnet adversary before astra, adds a stage without changing the standard. A2's code-read set
(4 of 10 wrong) is the measure of a Sonnet adversary. Rejected.

## 3. The rule for B and C

**Default.** A split-born row is `untested` with the sentence
`split from R-nnn 2026-10-dd (EARS form batch B): no recorded red mutation per named condition; 6b worklist`.
It carries no cite and no marker. The old sentence ("no test pins this clause") claimed a search; A1 r1 showed
three of five such claims false. The new one states what the mapping holds.

**Promotion.** `implemented` only when, for each condition and outcome the clause names, the mapping carries
one record `{file, break, cite, result: "red", pins}` where `pins` quotes the words of the clause that record
turns red. The verifier checks `pins` is a substring of the clause text. astra reads whether the union of the
`pins` quotes covers every condition and outcome the sentence names, then replays one record in five.

**Worker discipline.** No code-read. No isolated reproduction: when the cited test file cannot run red
cleanly under the mutation, the clause is `untested`. Never cite a neighbouring case. When a condition's red
record is not found in one pass, stop and write `untested`. The review downgrades; it never promotes.

**Origins.** The origin keeps its first clause, its status, its cites and its markers (header line 5). The
worker re-judges the retained clause by the same rule — A3's mapping already records origins this way — and
downgrades with a marker edit when a condition lacks a record, as R-193, R-138 and R-097 were. astra reads
the retained clause against its records exactly as it reads a split-born row.

**Merges.** Unchanged: two wordings of one promise only. The A2 and A3 test stands — if one promise can be
broken while the other holds, split.

**Estimate `[I]`.** Under this rule 60–70% of the 133 new rows reach `implemented` with full records:
40–53 `untested` against (a)'s roughly 33, so **about +10 to +20**. That rise is (a)'s overclaims becoming
visible, plus a small under-claim: the dense rows nobody chased, perhaps 10–20, which is the 6b worklist.
Ledger-wide, `untested` goes from about 90 to about 135–145 of about 790 rows (11% → 17–18%), A3's
downgrades included. The over-claim residual is a condition both the worker and astra misread, and a cite
whose text names the condition but does not check it; the replay catches a wrong record, not a wrong title.

## 4. A3

**Lands under its in-flight fix.** The per-condition work is executed evidence; redoing it as pure (b) would
write `untested` on rows astra itself turned red 14 times. The round-2 brief changes shape:

1. Closure of the form items: the three un-merged origins (R-711, R-718, R-727 and their new rows), R-723's
   restored directory-lock guarantees, the nine standalone sentences.
2. Read every implemented clause in the mapping — origins and split-born, about 46 — against its records'
   `break` text (A3's mapping predates `pins`): is there a red record for each condition and outcome the
   sentence names? List every gap.
3. Replay one record in five, seed the fix commit.
4. Verdict: MUST for a form item only. Gaps are listed, not gated.

The seat downgrades every listed gap to `untested` with its marker edit, re-runs the verifier and
`refusal-test.mjs`, and lands. No round 3. A3 r2's gap rate is the first measurement of the per-condition rule
and goes in B's brief as the number to beat.

## 5. B and C: two batches

Form defects per batch have been three or four at 24, 33 and 37 origins — the count does not scale with
size, and astra's origin audit found all of them in round 1 every time. The review cost that did scale was
the mutation hunt, which this ruling removes. Two batches as sized (47 and 53), allowance 100 → 53 → 0.
The mapping lists origins by package in section order; the brief tells astra to read per package, because
the retained-clause read needs the package's test files open. `batch0-land-ruling.md` §5's rule stands: do
not merge B and C.

## 6. The review shape

1. **Worker** writes `batch-b.json`, applies it with `apply-batch.mjs --base main`, runs `refusal-test.mjs`.
   Both green; the verifier's stdout carries the read-list.
2. **astra, one round**, fixed brief: run both scripts; read every origin on main against its clauses for a
   lost, hidden or merged promise, a dropped condition, a non-standalone sentence; rule each merge by the
   separability test; read the read-list — every implemented split row and every re-judged origin — `pins`
   against sentence, listing gaps; replay one record in five by seed. Do not probe `untested` rows for
   existing assertions: that is 6b's work, and the sentence no longer claims a search.
3. **MUST** is form only. A gap is a NOTE with the row. The seat downgrades each, re-runs both scripts.
4. **Round 2** only on a form MUST; astra re-reads the fixed origins only. The cap stays three. Expectation:
   one round and a seat close.
5. **The seat lands** on verifier green plus astra's form verdict plus its own close. The batch's gap rate
   (gaps over implemented split rows) is written in the HANDOFF line.
6. **Fable at C**, as ruled: G-013 flips, the §5 acceptance list, and the closing 25-row sample — mutation-based,
   by astra, once, over every implemented split-born row A1 to C. That number closes or restates 6b.

## 7. What changes in `apply-batch.mjs` and the sentence

| Change | Where | Gate |
|---|---|---|
| `pins` on every record: non-empty, exact substring of the clause text; one `must()` in (g2) | the (g2) loop | `batch.conditionRecords === true`; A1–A3 mappings replay unchanged |
| Read-list on stdout: each implemented clause (origin or split-born) with its text and its `pins` quotes, grouped by origin | after the merged list | always |
| The untested sentence as `batch.untestedSentence`; `evidenceCell` and check (h) read it, default the current sentence | one constant | `refusal-test.mjs` replays `batch-a2.json` unchanged `[V]` |

Nothing else. G-013, G-015, the allowance literal and both seals move as before. Landed rows keep their
sentence; a sentence rewrite over A1–A3 is bookkeeping with no reader.

**Rows and prose, for the seat.**

- Open question 6b, one sentence appended: "From batch B a split-born row is `implemented` only with one
  recorded red mutation per named condition (`bc-method-ruling.md`); its `untested` rows carry the 6b
  sentence and are this question's worklist; the lane's closing sample is mutation-based over every
  implemented split-born row."
- HANDOFF line, rewritten at each landing with the batch's gap rate.
- 8(a) already says form is not coverage. No change.

## What would change my mind

- A3 r2 lists gaps on more than one in five of its implemented clauses. Then the per-condition rule does not
  converge either; B promotes nothing (pure (b), sentence as ruled) and 6b takes the whole worklist with a
  different method.
- B's round returns more than one lost or hidden promise. Then C splits at the app seam, desk and bench.
- The seat's spot mutation on a landed B row finds a gap astra's read passed. Then the closing sample at C
  grows from 25 to 40 and a 10-row mutation check returns to each round. Not 20.

## The claim most likely wrong

That reading `pins` against the sentence catches what the mutation hunt caught. The evidence is one batch:
all six A3 PARTIALs were visible in text `[V]`. The class a read cannot catch is a cited assertion whose
text names the condition and does not check it — R-759's `trustRecord` cite in A1 was that shape. The
replay reaches the record, not the title. C's closing sample is where that class would surface.
