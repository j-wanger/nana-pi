# Lane-close ruling — EARS form, `main` at 3b32c05 (2026-10-04)

Ruler: Fable (architecture + landing, read-only; this file is the only write). Inputs: `main` at
`3b32c05`; the seat-verify files for batch 0, A1, A2, A3, B and C; `batch-b-astra-r1.md`,
`batch-c-astra-r1.md`, `batch-a3-astra-r2.md` and the B and C worker reports; `batch-*.json`;
`design-ruling.md`, `batch0-land-ruling.md`, `bc-method-ruling.md`. `[V]` = I read or ran it today;
every run was in a scratch clone or a scratch render under the session scratchpad, never in the
checkout. `[A]` = astra, a worker or the seat ran it, I read the log. `[I]` = inferred.

Stakes: the irreversible part is the push and the tag — the templates reach every new project from
`v0.6.1`. Inside this repo the close is one row flip, one check, three mapping strings and two prose
lines.

## The rulings in one screen

1. **CLOSE.** The lane closes at one close commit on main that flips G-013 to `implemented`, cited
   `packages/nana-pack/tests/requirements-trace.test.mjs::this repo: zero rows off form` — a check the
   commit adds with `// req: G-013`. Rehearsed green `[V]` (§1).
2. **The 17 B rows stay `implemented`.** They met the per-condition standard in full. My trigger was
   a spend rule; the spend had already been made (§2).
3. **Acceptance.** Steps 3, 4, 5 and 6 ran today `[V]`. Step 2 is the close commit. Step 1, a full
   `npm test` on the main checkout after the close commit, is the one step still open and the one that
   gates the push. Step 7, the 25-row sample, is MOOT: A3 and B were read in full, and a sample over A1
   and A2 would measure under a standard those batches were not built to (§3).
4. **6b** gets the paragraph in §4. The lane's worklist is 214 `untested` rows: 161 split-born, 53
   downgraded origins; by batch 7 · 5 · 9 · 34 · 90 · 69.
5. **HANDOFF** gets the one line in §5 (checker: 9 sentences, 0 over 25 words, 0 passive `[V]`). It
   replaces both bullets of the batch-0 section.
6. **Before the push** (§6): the close commit's exact contents; the three mapping strings the seat's
   merge edits left stale — both throwaway verifiers REFUSE until they are fixed `[V]`; R-740's cell
   goes false the moment the tag is pushed; basketball-geek fails at allowance 0 on its next update;
   the tag moves from `ae15067`, never pushed `[V]`, to the close commit.

---

## 0. The ground

| Fact | Value |
|---|---|
| main | `3b32c05`, clean `[V]` |
| rail | 788 rows: 498 implemented · 279 untested · 9 violated · 2 planned · 0 retired; `ears: 0 rows off form (allowance 0)`; exit 0 `[V]` |
| repo trace test | 8 PASS, including `seal: EARS_ALLOWANCE is 0 (G-015)` and the R-757 equality seal `[V]` |
| `map:check` / `readme:check` | 172 modules, 0 problems · 544 claims, 0 problems `[V]` |
| lane-born rows | 249: 5 check and mirror rows (G-013 to G-015, R-756, R-757) + 244 split-born `[V]` |
| split-born by status | 82 implemented · 161 untested · 1 violated (R-760) `[V]` |
| implemented split-born by batch | batch 0: 0 · A1 32 · A2 30 · A3 10 · B 10 · C 0 `[V]` |
| origins downgraded | 53, all implemented → untested: A1 1 · A2 3 · A3 13 · B 36 · C 0 `[V]` |
| `untested` rows the lane left | 214 = 161 + 53; the 65 pre-existing untested rows are unchanged `[V]` |
| implemented rows the lane never judged | 289 never off form, plus C's 44 retained origins `[V]` |
| templates | untouched since `3d7072b`, the batch-0 landing `[V]` |
| tag | `v0.6.1` local at `ae15067`, 29 commits behind main; the remote's latest is `v0.6.0` `[V]` |
| G-013 | `violated`; evidence "0 rows off form … the allowance ratchets per batch"; no `// req: G-013` marker anywhere `[V]` |

The seat's figures (788 · 498 · 279 · 9 · 2) are right to the row.

---

## 1. Verdict: CLOSE

One reason. Form is done — zero rows off form at allowance zero, sealed and held equal to the
measured count — and every status the lane touched traces to a recorded judgement or a recorded
absence. What remains is coverage, and that was never this lane's promise (8(a)).

**G-013's cite.** `design-ruling.md` §4 named `this repo: zero rows off form` and §5's C allowlist
named it as C's work; the worker deferred it to this ruling. The check does not exist yet `[V]`, so
G-013 cannot flip without a code line, and the close commit adds it.

Why not cite the two seals that already exist. R-757's seal is green whenever the measured count
equals `EARS_ALLOWANCE`; raise the literal to 5 with five rows off form and R-757 stays green while
G-013 is violated. The direct check is one line, fails naming the rows, and pins the row's own
sentence.

**Rehearsal** in a scratch clone `[V]`: the row flipped and the check added as below; the trace test
read 9 PASS, the new line among them; the shim read `788 total (499 implemented · 2 planned · 279
untested · 8 violated)`, `ears: 0 rows off form (allowance 0)`, exit 0; `map:check` 0 problems.

The check, placed directly after the G-015 seal in `packages/nana-pack/tests/requirements-trace.test.mjs`:

```js
// G-013 for THIS repo: the lane that split every multi-shall row closed 2026-10-04; from here
// a new off-form row fails this check by name (lane-close-ruling.md §1).
// req: G-013
check("this repo: zero rows off form", earsOffForm.length === 0, `off form: ${earsOffForm.join(", ")}`);
```

The row:

```
| G-013 | WHERE a row is not retired, it shall carry exactly one `shall` outside a code span. | implemented | `packages/nana-pack/tests/requirements-trace.test.mjs::this repo: zero rows off form`; 200 rows off form at design-ruling.md §0, 0 at the lane close 2026-10-04 (lane-close-ruling.md) |
```

**The seat's two deviations.**

1. *The missed trigger when briefing B.* `bc-method-ruling.md`'s first "what would change my mind"
   fired at A3 r2 (58.7% > one in five), so B should have promoted nothing. The seat briefed B under
   the per-condition rule instead. Cost: one Sonnet pass of about 120 executed mutations `[A, worker
   report]` and astra's read of 83 rows. Product: 93 records with `pins`, 66 gap findings whose
   uncovered words now sit in the cells, and the 17 rows of §2. The correction before landing was
   right. Its by-product is better than pure (b) would have written: pure (b) writes one sentence on
   every row; B's downgraded cells quote the condition nobody pinned. Ratified as corrected. No
   residual.
2. *Seat edits in the merge commits.* R-931 (`70ef61e`), R-477 and R-478 (`3b32c05`). Read against
   astra's MUSTs (B MUST 3, C MUST 2) `[V]`: each is the correction asked for, one `shall`, a named
   subject, status `untested`, no cite, no marker. Ratified. But the mapping files were not updated,
   so both throwaway verifiers now refuse. B at its landing tree `70ef61e` against `afc026a`:
   `REFUSED: R-931: already present but does not match the mapping` `[V]`. C at main against
   `70ef61e`: the same for R-477 `[V]`. The repair is the three `text` fields set to the committed
   cells; with that, B replays `ALL CHECKS GREEN` and C replays `ALL CHECKS GREEN`, `rows added: 0`
   `[V]`. It goes in the close commit (§6). Rule from here: a seat edit to a mapped row edits the
   mapping in the same commit. The verifier is the corpus's replay instrument; a refusing verifier
   reads as a defect in the batch.

A note on replaying. Each batch verifier replays only at its own landing tree: it checks G-013's
evidence cell for that batch's count, and C moved the count to 0. After the close commit G-013's
cell carries a cite and no count, so no batch verifier replays on main. The mappings and the trees
in history are the evidence; nothing in `npm test` reads them.

---

## 2. The 17 B rows — RATIFIED `implemented`

Who they are `[V]`: seven origins — R-218, R-221, R-229, R-254, R-308, R-323, R-337 — and ten
split-born — R-274, R-275, R-280, R-281, R-891, R-925, R-928, R-929, R-930, R-934.

| Evidence | Source |
|---|---|
| Each carries one executed record whose `pins` quotes its own sentence | `batch-b.json` `[V]` |
| astra read all 83 implemented rows against their `pins` and listed no gap for these 17 | r1 §3 `[A]` |
| Three of the 17 fell in the one-in-five replay and turned red: R-218 (index 12), R-254 (37), R-925 (67) | r1 §4 `[A]` |
| The verifier's `pins` substring check refused a wrong quote | r1 §1 `[A]` |

**Why ratify.** The standard in `bc-method-ruling.md` §3 is an evidence standard, and these rows meet
it in full. My trigger — "B promotes nothing" — was a spend rule: stop the hunt because the worker
side does not converge. The hunt had already happened. Writing `untested` on rows astra itself read
as covered is the under-claim §2 of that ruling rejected, and A3 landed its 19 no-gap rows the same
way `[V, batch-a3-seat-verify.md]`. Same shape, same ruling.

**Residual.** The class a read cannot catch: a cited assertion whose title names the condition and
does not check it. The replay reached 3 of the 17. That class belongs to 6b's method, not to this
lane.

---

## 3. Acceptance — what ran, who ran it, what is moot

Against `design-ruling.md` §5 "Acceptance, end of lane".

| Step | State | By whom | Evidence |
|---|---|---|---|
| 1. `npm test` green; rail line at 0; `EARS_ALLOWANCE` 0; seal names G-015 | rail line, literal and seal `[V]`; **the full suite STILL RUNS** | the seat, on the main checkout, after the close commit | The corpus holds no green full suite on main since batch 0: every worker run failed on the worktree's readme check (8(d)), and the A1–C seat-verify files do not record a main run. This is the step that gates the push. |
| 2. G-013, G-014, G-015, R-756 `implemented` with cites | G-014, G-015, R-756, R-757 `[V]`; G-013 in the close commit | the seat | §1 |
| 3. A scratch two-`shall` row makes the shim exit 1 naming it | **DONE** `[V]` | this ruling, in a clone | `ears: 1 rows off form (allowance 0)` · `R-200 carries 2 shall (one is the form)` · exit 1 |
| 4. Both templates render both modes; the rendered scaffolds' suites pass | **DONE** `[V]` | render: `templates-render.test.mjs` in the suite; suites: this ruling, from `HEAD` (the close commit touches no template) | TypeScript `pnpm install && pnpm test`: 4 files, 52 passed. Python `uv sync && uv run pytest`: 58 passed. The batch-0 worker's numbers `[A]`, reproduced. |
| 5. One injected two-`shall` row fails the rendered suite naming the row; adopt mode with allowance 1 passes | **DONE** `[V]` | this ruling | TypeScript: `this project: every row carries exactly one shall` fails, `R-001 carries 2 shall (one is the form)`. Python: 1 failed, 57 passed, the same line; then `requirements_ears_allowance = 1` under `[tool.pytest.ini_options]`: `ears: 1 rows off form (allowance 1)`, 58 passed. The TypeScript allowance is the `PROJECT_EARS_ALLOWANCE` constant in the test file; the `at the allowance none` fixture pins it. |
| 6. `map:check` and `readme:check` green | `[V]` now; **re-run after the close commit** | the seat | a check lands in a mapped test file; the rehearsal was green `[V]` |
| 7. A final 25-row sample over every implemented split-born row, by astra | **MOOT** | — | below |

**Why 7 is moot.** The population is 82 implemented split-born rows `[V]`. Twenty of them (A3 10,
B 10) were read at 100% under the per-condition standard, with one record in five replayed; a sample
over them re-measures a measured number. The other 62 (A1 32, A2 30) were judged at the row level: A2
with one executed red mutation per row, mechanically enforced, 12 of 12 replays red; A1 by worker
code-read plus astra's own 20-row mutation sample, r2 19 of 20. Astra has already sampled 20 of each.
A per-condition sample over them would find gaps at something like A3 and B's rate `[I]`, downgrade
perhaps 15 of 25, and leave about 40 rows in the same state unsampled. That is not a measurement of
the lane's output — the output sits under two standards — and it is not a repair. The repair is a
full re-judge of those 62 rows, their 61 implemented origins, C's 44 and the 289 the lane never saw.
That is 6b's scope, with a method the lane showed does not converge from the worker side. The honest
substitute is to name the two standards in 6b and list the A1 and A2 rows as the re-judge tier (§4).
The lane's closing numbers are A3 27 of 46 and B 66 of 83 under per-condition; A1 and A2 3 of 20 each
under row-level.

**Amendments this section makes.** `design-ruling.md` §5 step 7 and `bc-method-ruling.md` §6 item 6
are replaced by the above. §1's "whole word" was amended to "ASCII word" at batch 0
(`batch0-land-ruling.md` §2). Nothing else in the three rulings changes.

---

## 4. Open question 6b — replacement text

Replace the whole 6b entry with this paragraph.

> 6b. **Clause-level honesty.** The form half closed 2026-10-04 (`docs/reviews/ears-form-2026-10-04/lane-close-ruling.md`); the coverage half is this question. Origin: sol r3 2026-10-02 showed the rail proves marker identity and citation existence, not clause coverage; a 25-row sample pinned fully in 16 (64%). The EARS-form lane then split every multi-`shall` row: 200 origins into 244 new rows, 0 off form, G-013 `implemented`. `EARS_ALLOWANCE` sits at 0, sealed and held equal to the measured count (R-757). The lane judged the rows it touched under a standard that tightened as it ran. A3 and B's `implemented` rows (10 and 10 split-born, 9 and 7 origins) carry one recorded red mutation per named condition. In those, astra read every record and replayed one in five (`bc-method-ruling.md`). A1 and A2's (32 and 30 split-born, 33 and 28 origins) carry one red mutation per row, sampled 20 per batch at 19 of 20. C's 44 origins and the 289 implemented rows never off form carry their pre-lane cites, unjudged. Under the per-condition standard the worker-claimed rows had an uncovered condition in 27 of 46 (A3) and 66 of 83 (B). Each now reads `untested` with the uncovered words in its cell. The lane left 214 rows `untested`: 161 split-born and 53 downgraded origins. By batch: 7, 5, 9, 34, 90 and 69 for batch 0, A1, A2, A3, B and C. It ran no closing sample (`lane-close-ruling.md` §3). Worklist, in order. (1) The 214 untested rows, read from their cells: A3 and B's quote the uncovered words, the rest carry a batch sentence. (2) The re-judge tier: A1 and A2's 62 implemented split-born rows and 61 origins, then C's 44 origins, then the 289. Method is open. Per-condition records did not converge from the worker side (58.7% then 79.5% gap); the reviewer's text read found every gap the mutation hunt found. The next design starts there. Until a cell names a per-condition record, an implemented row means: one mutation turns one cited check red; read the cell.

---

## 5. The HANDOFF line

Rename the section `## Landed 2026-10-04 — EARS form batch 0` to `## Landed 2026-10-04 — EARS form
lane` and replace both of its bullets — the A1 "BUILT … awaiting one review round" bullet is stale —
with this one. `<close sha>` is the close commit. Checker (`nana-writing.mjs`): 9 sentences, 140
words, 0 over, 0 passive, 0 banned `[V]`.

> - **EARS form lane LANDED 2026-10-04** (`<close sha>`, `docs/reviews/ears-form-2026-10-04/lane-close-ruling.md`): every row carries one `shall`. The rail reads `ears: 0 rows off form (allowance 0)`, sealed at 0 and held equal to the measured count (R-757). G-013 reads `implemented`. 788 rows: 499 implemented, 279 untested, 8 violated, 2 planned. The lane split 200 origins into 244 rows and downgraded 53 origins. Its 214 untested rows are Open question 6b's worklist; each cell names its batch and, where astra found one, the uncovered words. Standards differ by batch: A3 and B per named condition, A1 and A2 one red mutation per row, C's origins unjudged; 6b says which. Both templates carry the check; new projects get it at `v0.6.1`. Out of scope: aml-desk's rail copy (193 off form) and basketball-geek (2 off form, which fails at allowance 0 on its next `copier update`).

Also drop HANDOFF line 35 ("The next `v*` tag must also carry the seven-extension wording …") once
the tag is pushed: `templates/_shared/working-under-nana-pi.md` reads "seven pi extensions" on main
`[V]`, so the tag carries it.

---

## 6. The close commit, then the push

**One close commit, the seat, prose and one check only.** In this order, then the checks.

| # | File | Edit |
|---|---|---|
| 1 | `REQUIREMENTS.md` | G-013 row → the row in §1 |
| 2 | `packages/nana-pack/tests/requirements-trace.test.mjs` | the check and marker in §1, after the G-015 seal |
| 3 | `REQUIREMENTS.md` line 9 | replace the tail "…the declared allowance (G-014/G-015), currently `EARS_ALLOWANCE` in `scripts/requirements-trace.mjs`, lowered at every landing." with "…the declared allowance (G-014/G-015). `EARS_ALLOWANCE` in `scripts/requirements-trace.mjs` is 0 since 2026-10-04 and sealed equal to the measured count (R-757)." |
| 4 | `scripts/requirements-trace.mjs` | the `EARS_ALLOWANCE` doc comment names 194 and a seal titled 194 — stale provenance beside a tunable. Replace with: "Rows off EARS form (G-013) tolerated before the rail fails naming them (G-015). Measured 200 at design-ruling.md §0 (2026-10-04); 0 since the lane close the same day (lane-close-ruling.md §1). Pinned by packages/nana-pack/tests/requirements-trace.test.mjs::seal: EARS_ALLOWANCE is 0 (G-015) and held equal to the measured count by R-757's seal." |
| 5 | `docs/reviews/ears-form-2026-10-04/batch-b.json`, `batch-c.json` | R-931's, R-477's and R-478's `text` → the committed Requirement cells, verbatim (§1 deviation 2) |
| 6 | `REQUIREMENTS.md` Open questions | 6b → §4 |
| 7 | `HANDOFF.md` | §5 |

Then, on the main checkout: `node packages/nana-pack/tests/requirements-trace.test.mjs` reads 9 PASS
with `this repo: zero rows off form`; `npm run map:check`; `npm run readme:check`; `npm test`. The
known intermittent (`HANDOFF.md` 0b, `stage-key-persistence`) is the only failure that does not hold
the close; anything else does.

**The tag.** `v0.6.1` was never pushed `[V]`, so moving it is safe: `git tag -f v0.6.1 <close sha>`,
then push main and the tag. The templates at the close commit are the batch-0 templates `[V]`, and
the rendered suites from them pass (§3 step 4).

**Record before the push.**

- **R-740** (`planned`: "scaffold-* and adopt-* shall render from the latest v* tag") carries the
  evidence "v0.6.1 is local only". The push makes that cell false. Re-judge it in the commit after the
  push; R-848 already records that nothing in this suite exercises tag-gated rendering, so the honest
  landing is `untested` unless the seat pins it.
- **basketball-geek.** Its next `uvx copier update` to `v0.6.1` rewrites `conftest.py` with the
  allowance default 0; it had 2 rows off form at `design-ruling.md` §3 `[A]`, so its suite fails
  naming two rows. The owner declares `requirements_ears_allowance = 2` under
  `[tool.pytest.ini_options]` — the shape verified today `[V]` — or splits two rows. The same update
  is its marker migration (`@pytest.mark.req` → `# req:`) `[I]`. Record it in the HANDOFF line (§5
  does) and open it as its own lane, not here.
- **aml-desk** is unaffected by the tag: its own rail copy, 193 rows off form, its own lane.
- **R-760** (`violated`, lane-born in A1): `objective.ts:479-480` tells the owner to "move it aside
  first" for an obstructed lock path, and `packages/nana-pack/README.md:725` documents the same
  wording. The row's cell records it; the README describes the behaviour the row calls wrong. A
  one-line fix for the next objective lane, not this one.
- **The throwaway scripts** (`apply-batch.mjs`, `refusal-test.mjs`, the sweeps, the isolated repros)
  stay in this folder as evidence. None is collected by `scripts/test.mjs`; none replays on main after
  the close commit (§1, the replay note).

---

## What would change my mind

- `npm test` on main fails on anything but the known intermittent. The close commit waits, the tag
  does not move, and the failure is a defect of this lane until shown otherwise.
- The seat mutates one A1 or A2 implemented split-born row by hand and finds no uncovered condition
  in two tries: the re-judge tier in 6b drops below the untested tier in priority. It finds one: 6b
  starts with that tier. The lane is closed either way.

## The claim most likely wrong

That A1 and A2's 62 implemented split-born rows carry per-condition gaps at anything like A3 and B's
rate. Those sections — objective, trust, gate, handoff — hold the densest golden suites in the repo,
and their rate may be well under half. I inferred it from two batches in other packages; 6b measures
it.
