# EARS form — architecture ruling

Ruler: Fable (architecture + landing, read-only), 2026-10-04. Roles: `../pi-1.0-2026-10-04/ROLES.md`.
Decided by Jake: a lane adds a form check and splits the rows that carry more than one `shall`.

## The rulings in one screen

1. **The check.** Every row that is not `retired` carries exactly one `shall` outside a code span. The rail counts the rows off form. It fails the suite when the count exceeds the project's declared allowance. The default allowance is 0. No template-opener check.
2. **Not report-only.** The allowance is a ratchet. nana-pi starts at 200 and lowers it at every landing, to 0. A new scaffold starts at 0. This supersedes my writing-trial ruling §4, which said "never a problem".
3. **One source per language.** The TypeScript rail in the template, read by nana-pi's shim. The Python rail in the template's `conftest.py`. Both change in batch 0.
4. **The split.** The origin row keeps its ID and its first clause. Every other clause becomes a new row placed directly after it, from the block's own free IDs, then from a continuation block declared up front. A split row is `implemented` only when one cited assertion fails if that clause breaks. Otherwise `untested`.
5. **Who does what.** A Sonnet worker writes the clause sentences and the clause-to-test mapping as a JSON file per batch. A throwaway script applies it. The rail, the form check and an ID verifier check the result. gpt-6-astra samples the mapping. LLMs judge, scripts verify.
6. **Batches.** Six landings, sequential: the check plus Part G, then Part A in three cuts, then Part B, then Part C. Each one is reviewed, at most three rounds.
7. **Other repos.** Out of scope. The check reaches them only through the next pushed template tag, and their rows are their own lanes.

Legend: **[V]** verified by reading the file or running a command today. **[I]** inferred. Every number is **[V]** unless marked.

---

## 0. The ground

| Fact | Value |
|---|---|
| Rows in nana-pi today | 535 (461 implemented · 65 untested · 7 violated · 2 planned · 0 retired) |
| Rows off form | 200, every one with more than one `shall`; 0 rows with none; 0 with `shall` inside a code span |
| `shall` count among them | 165 rows carry two, 31 carry three, 3 carry four, 1 carries five |
| Status of the 200 | 176 implemented · 23 untested · 1 planned |
| New rows a full split creates | 240 (233 in the R blocks, 7 in Part G) |
| Template forms used | 370 Ubiquitous · 69 WHEN · 53 IF-THEN · 34 WHERE · 9 WHILE; every IF row carries THEN |
| The rail | `templates/typescript/template/tests/requirements-trace.ts`, one source; nana-pi reads it through `scripts/requirements-trace.mjs`. Python: `templates/python/template/tests/conftest.py`, a second implementation of the same contract |
| Rail self-tests | `requirements-trace.test.ts` and `test_requirements_trace.py`. Neither is a Jinja file today. Neither carries a `req:` marker. The code-map and readme tests are Jinja and switch to `req-candidate:` in adopt mode |
| nana-pi's repo-level rail test | `packages/nana-pack/tests/requirements-trace.test.mjs`, three checks over the shim's result |
| The render test | `packages/nana-pack/tests/templates-render.test.mjs` renders both templates in both modes with `uvx copier` (9.18.2 here). It runs the dependency-free generators. It does not run the rendered suites. R-737 and its check pin "G-001 to G-012", twelve IDs |
| Shared Part G | `templates/_shared/requirements-general.md`, included by both `REQUIREMENTS.md.jinja`. nana-pi's Part G requirement cells are identical to it today. No check enforces that |
| Split convention already in use | 17 splits on 2026-10-02: the new row sits directly after its origin; its evidence cell reads `split from R-400 2026-10-02 (clause audit): no test pins this clause` |
| Tags | `v0.6.1` exists locally only; the remote's latest is `v0.6.0`. Consumers render from the latest pushed tag |
| Open question 6b | names this lane: a per-clause split pass, standard = a mutation of the clause turns the cited check red |

The seat's "about 200 of 507" is right on the 200. The 507 is the 2026-10-02 count; 28 rows landed since.

---

## 1. The check

**Decision.** The rail gains one count and one comparison.

| Behaviour | Rule |
|---|---|
| Counted | the `shall` tokens in the Requirement cell, whole word, case-insensitive, after every backtick span is masked |
| Off form | a row whose count is not exactly one |
| Exempt | rows with status `retired`. A dead row keeps its text |
| Ignored | the opening keyword. WHEN, WHILE, IF-THEN and WHERE are not checked. A complex row with one `shall` passes |
| Reported | one line after the summary line: `ears: 200 rows off form (allowance 200)`, every run |
| Failed | IF the count exceeds the allowance THEN one problem line per off-form row: `R-046 carries 2 shall (one is the form)` |
| Result | the off-form IDs are in the check result, so a caller can list them without a flag |

**Why count `shall` only.** The Ubiquitous form has no keyword, so an opener check cannot tell a Ubiquitous row from a malformed one. Every IF row already carries THEN. A missing THEN is a readability lapse. A second `shall` is a second promise under one status. That is the honesty vector, and it is the one thing to count. The skill names five templates and no complex form [V, `SKILL.md:9-10`], so nothing is lost.

**Why mask code spans.** A `shall` inside backticks is a mention, not a promise. The writing checker already rules this way (Amendment 1 §A3). nana-pi has none today, so the cost is one replace call and one fixture.

**Why a failing ratchet, not a report line.** The clause problem was found at 432 implemented and 0 problems [V, sol r3]. The rail was green and 36% of a sample overclaimed. A line nobody fails on drifts. The ratchet costs one integer and one comparison more than a line, and it stops a new off-form row from landing while the cleanup runs. A worker who raises the allowance to go green fails the seal test by name.

**Where the allowance lives.**

| Runtime | Surface | Default | Provenance |
|---|---|---|---|
| TypeScript rail | `CheckOptions.earsAllowance`; the rail exports `EARS_ALLOWANCE_DEFAULT = 0` | 0 | chosen: a new project writes rows one at a time, so it starts at zero |
| nana-pi | `EARS_ALLOWANCE` exported from `scripts/requirements-trace.mjs`, passed to `check` | 200 | measured 2026-10-04 (this ruling §0); lowered at every landing in §2 |
| Python rail | a pytest ini option `requirements_ears_allowance`, read with `config.getini` | 0 | same as the TypeScript default |

One seal test per surface names G-015. nana-pi's reads `seal: EARS_ALLOWANCE is 200 (G-015)` and changes with each landing. That edit is the ceremony the standard wants: a retune is deliberate and reviewed.

**Rejected.**

- A mode switch, `report` or `fail`. It protects nothing during the cleanup. The integer does the same job and also holds the line.
- A baseline file the rail writes and compares. State on disk for one integer.
- A new CLI or flag. The rail already runs in every suite. The result carries the IDs.
- Widening the five-template check to openers. See above.

**What would change my mind.** An adopted project's first run after a template update fails on N off-form rows. The message names the allowance and the option. If that still confuses two owners, the default becomes "report until the project declares an allowance". Not before.

---

## 2. The split

**Decision.** Every off-form row becomes one row per clause. The header already states the rule: the origin keeps its ID and its first clause [V, `REQUIREMENTS.md:5`].

**The sentence rule.** Each new row is a whole EARS sentence. It repeats the origin's condition. R-026 becomes two IF-THEN rows that both open "IF the store is unusable THEN the remedy shall". A clause is never left as a fragment that depends on its sibling to read.

**Merging.** Two `shall` clauses that say one promise in two wordings may be rewritten as one `shall` sentence instead of split. The mapping file records every such case with the word `merged` and the reviewer reads each one. A merge that hides a second promise is the failure the reviewer is there to catch.

**The status rule.** A split row is `implemented` only when the mapping names a cited test and one assertion in it. That assertion must fail if the clause breaks. The worker re-judges the origin row against its own clause. It may drop to `untested`, as R-400 did. Otherwise `untested`, evidence `split from R-nnn 2026-10-dd: no test pins this clause`. When in doubt, `untested`. Nobody writes a test in this lane. An unpinned clause is the worklist for a coverage lane, and it is honest.

**Placement.** Directly after the origin, in the origin's table. The reader sees siblings together.

**IDs.** Blocks are allocated up front, in batch 0, so no later batch touches the header line.

| Block | Free today | Needed | Continuation to declare |
|---|---|---|---|
| pack R-001–199 and R-700–755 | 0 | 94 | R-756 to R-879 |
| knowledge R-200–249 | 0 | 18 | R-880 to R-909 |
| runner R-600–619 | 0 | 5 | R-910 to R-919 |
| installer R-300–399 | 23 | 31 | R-920 to R-939, after R-399 |
| desk R-400–499 | 32 | 35 | R-940 to R-959, after R-499 |
| stage R-250–299 | 34 | 16 | none |
| bench R-500–599 | 56 | 34 | none |
| Part G | open-ended | 3 for the check, 7 split-born | G-013 to G-015 the check; G-016 to G-022 the split |

R-960 to R-999 stay unallocated. After the lane about 150 three-digit IDs remain repo-wide. The repo added 28 rows in two days. Widening IDs to four digits is a rail change in both languages and in aml-desk's copy. It is an open question for the seat, not this lane's work.

**Who judges, what verifies.**

| Step | Actor | Form |
|---|---|---|
| The worklist | script | the rail's off-form IDs for the batch's sections |
| Clause sentences and the clause-to-test mapping | Sonnet worker | `docs/reviews/ears-form-2026-10-04/batch-<n>.json`: per origin, the rows it becomes, each with id, text, status, cites, and the assertion named for every `implemented` one |
| Applying the mapping | throwaway script, not shipped | inserts rows after the origin; appends the new ID to the `req:` line above each cited test; touches no assertion |
| Verification | the rail, the form check, an ID verifier in the throwaway | every pre-existing ID still present · every new ID inside its declared block · no cite without its marker · the batch's sections at zero off form · every status legal for its evidence |
| Reviewer input | the throwaway | the list of new rows whose cite set equals their origin's. That is the sol r3 failure shape |
| Judgement of the mapping | gpt-6-astra | a 20-row random sample of the batch's `implemented` split rows, seed recorded, plus every row on the list above. PINS or PARTIAL per row |

Of the 200 origins, 24 are `untested` or `planned`. Those split by script with no judgement. The 176 implemented origins carry about 400 clauses to judge.

**Per-batch acceptance.** The rail is green. The `ears:` line reads the batch's new allowance. The seal test names it. Every PARTIAL the sample finds is fixed before landing, to `untested` or to the right cite. IF the sample pins fewer than 18 of 20 THEN a second sample is drawn after the fixes, within the three-round cap. The 18 is chosen: one wrong row in ten is the most the ledger can carry while 6b closes.

**Batches, sequential.** One `REQUIREMENTS.md`, one header line, and the desk suites bind fixed ports. One worktree at a time.

| Batch | Scope | Origins | New rows | Allowance after |
|---|---|---|---|---|
| 0 | the check in both rails; the three check rows; the block declarations; Part G split (6 origins) | 6 | 7 | 194 |
| A1 | Part A §1–4: objective, trust, gate, post-edit | 37 | 38 | 157 |
| A2 | Part A §5–9: handoff, journal, notify, display, agent dir | 33 | 35 | 124 |
| A3 | Part A §10–13: pi-review, pi-worker, skills, test runner | 24 | 27 | 100 |
| B | Part B §14–26: knowledge, stage, installer | 47 | 64 | 53 |
| C | Part C §27–47: desk, bench | 53 | 69 | 0 |

Batch 0 runs the split procedure on the smallest block first. If its mapping format or script fails, it fails on six rows. The seat may merge two adjacent batches when the previous review found nothing. The final landing flips G-013 in nana-pi from `violated` to `implemented` and closes or restates 6b with the measured rate.

**What would change my mind.** A1's review shows the sibling list is mostly legitimate parametrised tests, so it is noise. Then the reviewer samples at random only. Or a batch's PARTIAL rate stays above one in five after a second sample. Then the status rule tightens to "untested unless the assertion line is quoted".

---

## 3. Other repos

**Decision.** Out of scope, both. Say so in the HANDOFF line.

| Repo | Rail | Rows | Off form | How the check reaches it |
|---|---|---|---|---|
| aml-desk | its own copy, `test/requirements-trace.lib.mjs`, `R-` IDs only; not copier-managed | 335 | 193 | only by a hand port of the count. Its split is its own lane |
| basketball-geek | copier `v0.4.0`, Python, adopt mode; an older marker style (`@pytest.mark.req`) | 165 | 2 | `uvx copier update` to the next pushed tag rewrites `conftest.py`. The default allowance 0 then fails on two rows. The owner declares `requirements_ears_allowance = 2` or splits two rows. That update is already a marker migration **[I]** |

Both reach nothing until the seat pushes a tag after the lane. `v0.6.1` is local. R-740 stays `planned` until then.

---

## 4. Rows

**Part G, new subsection `## G5. The requirement set`,** in `templates/_shared/requirements-general.md` and mirrored verbatim in nana-pi. Scaffold mode `implemented` with the cite; adopt mode `untested`, as G-004 and G-009 to G-012 do today.

| ID | Requirement | Pinning test, scaffold (`tests/requirements-trace.test.ts::…` / `tests/test_requirements_trace.py::…`) | nana-pi |
|---|---|---|---|
| G-013 | WHERE a row is not retired, it shall carry exactly one shall outside a code span. | `this project: every row carries exactly one shall` | `violated` until batch C: "200 rows off form 2026-10-04; the allowance ratchets per batch". Then `implemented`, cited `packages/nana-pack/tests/requirements-trace.test.mjs::this repo: zero rows off form` |
| G-014 | The rail shall report the count of rows off form in its own line after the summary line. | `ears: a two-shall row and a no-shall row are counted, a retired one is not` | `implemented`, a fixture check in the repo-level test over a scratch dir, through the shim's export |
| G-015 | IF the count of rows off form exceeds the declared allowance THEN the rail shall fail naming each off-form row. | `ears: over the allowance each off-form row is a problem, at the allowance none` | `implemented`, the same fixture check plus `seal: EARS_ALLOWANCE is <n> (G-015)` |

G-016 to G-022 are the split-born clauses of G-001, G-003, G-005, G-007, G-008 and G-012. The worker writes them; the status rule of §2 applies.

**nana-pi rows.**

| ID | Requirement | Pinning test |
|---|---|---|
| R-737 (amend) | Both copier templates shall render REQUIREMENTS.md carrying the standard Part G rows G-001 to G-022 unrenumbered, with no Jinja surviving into the rendered file. | `templates-render.test.mjs`: `wantG` becomes 22 |
| R-756 | nana-pi's Part G shall carry the shared file's requirement cells verbatim. | `templates-render.test.mjs::nana-pi Part G mirrors templates/_shared/requirements-general.md` |

R-756 is the first ID of the pack's new block. Without it the two copies drift silently, and this lane edits both.

**Markers.** The rail self-tests gain `req:` markers for the first time. So both become Jinja files with the `rq` switch the code-map test uses [V, `code-map.test.ts.jinja:1`]. Rendered names do not change. The render test's `RAIL` lists stay as they are.

---

## 5. Build scope

**Order, every batch.** Rows first. Then markers. Then code. Then README lines. Then `npm run map`. Then the flips, each with its cite.

**Allowlist, batch 0.**

- `templates/typescript/template/tests/requirements-trace.ts` — the count, the option, the default with provenance, the `ears:` line, the problem lines
- `templates/typescript/template/tests/requirements-trace.test.ts` → `requirements-trace.test.ts.jinja` — the `rq` switch, the three fixture tests, the `this project` test
- `templates/python/template/tests/conftest.py` — the same, plus the ini option
- `templates/python/template/tests/test_requirements_trace.py` → `test_requirements_trace.py.jinja` — the same tests
- `templates/_shared/requirements-general.md` — G5 with G-013 to G-015; G-001, G-003, G-005, G-007, G-008, G-012 split into one `shall` each; G-016 to G-022
- `templates/typescript/template/REQUIREMENTS.md.jinja` and `templates/python/template/REQUIREMENTS.md.jinja` — one sentence on the form check and the allowance in the "Trace rail" paragraph. In the adopt paragraph: "declare the allowance at the count the first run names".
- `scripts/requirements-trace.mjs` — `EARS_ALLOWANCE = 200` with provenance, passed to `check`
- `packages/nana-pack/tests/requirements-trace.test.mjs` — the `ears:` line check, the two fixture checks, the seal
- `packages/nana-pack/tests/templates-render.test.mjs` — `wantG` 22; the Part G mirror check
- `REQUIREMENTS.md` — line 5 (the form, the exemption), line 9 (the rail sentence), line 11 (the continuation blocks). G5 mirrored. The six G splits. R-737 amended. R-756. Open question 6b names this lane and the allowance ladder.
- `README.md` — one sentence at lines 47–59 only if the readme check asks for it
- `docs/code-map.md` — regenerated
- `HANDOFF.md` — one line
- `docs/reviews/ears-form-2026-10-04/` — the brief, `batch-0.json`, the rounds

**Allowlist, batches A1 to C.**

- `REQUIREMENTS.md` — rows in the batch's sections only
- the batch's test directories — `// req:` lines only, IDs appended; no assertion changes
- `scripts/requirements-trace.mjs` — the allowance literal only
- `packages/nana-pack/tests/requirements-trace.test.mjs` — the seal literal only; batch C adds `this repo: zero rows off form` with `// req: G-013`
- `docs/reviews/ears-form-2026-10-04/batch-<n>.json` and the rounds
- `HANDOFF.md` — the one line, rewritten

**Do not touch.** Any assertion in any test. Any row that is on form. Any source module under `packages/**`, `apps/**` or `templates/**/scripts`. `~/.claude/*`, `~/.pi/*`, `~/aml-desk`, `~/basketball-geek`. The tag: the seat cuts and pushes it after batch C.

**Acceptance, end of lane.**

1. `npm test` green. The rail line reads `ears: 0 rows off form (allowance 0)`. `EARS_ALLOWANCE` is 0 and the seal names G-015.
2. G-013, G-014, G-015 and R-756 read `implemented` in nana-pi with their cites. G-013 is no longer `violated`.
3. A scratch copy of `REQUIREMENTS.md` with one two-`shall` row makes `node scripts/requirements-trace.mjs` exit 1 naming that row.
4. Both templates render in both modes. In the rendered TypeScript scaffold, `pnpm install && pnpm test` passes. In the rendered Python scaffold, `uv sync && uv run pytest` passes. The render test does not run these suites, so the seat runs them once by hand.
5. In each rendered scaffold, one injected two-`shall` row fails the suite naming the row. In adopt mode, the same row with `requirements_ears_allowance = 1` passes.
6. `npm run map:check` and `npm run readme:check` green.
7. A final 25-row sample over every `implemented` split-born row in nana-pi, seed recorded, by gpt-6-astra. The rate lands in 6b as the closing number or the residual.

---

## Residuals to record, not fix here

- The rail's older behaviours have no rows in any project. Only the form check gets rows. The unevenness is named in 6b's successor.
- Three-digit IDs: about 150 remain after the lane. Open question for the seat.
- The Python self-tests run only inside a rendered project with dependencies installed. nana-pi's suite does not run them. Acceptance step 4 covers it by hand.
- aml-desk's rail copy and its 193 rows. basketball-geek's marker migration on its next template update.

## The claim I would most expect to be wrong

That every extra `shall` is a distinct promise, so the split makes 240 rows. Some are one promise in two wordings. If the worker's `merged` count passes a tenth of a batch, the sizing in §2 shrinks. The reviewer's time then moves to the merges, where a promise can hide. The batch-0 mapping on six G rows is the first reading of that rate.
