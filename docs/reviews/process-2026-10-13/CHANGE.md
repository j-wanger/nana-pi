# Change declaration — process: the plan rules, the review standard and the builder preamble

*Lane `process` · branch `feat/process` · worktree `~/nana-pi-wt/process`, from `main` `9974218` · 2026-10-13. Features: FEAT-014
SUB-019, FEAT-007 SUB-008, FEAT-008, FEAT-006, FEAT-013 SUB-011; new R-1100–R-1111; no row retires. Class: FORMAT (two plan-review
rounds at most): it changes what every reviewer is told. Builder: Sonnet 5.5, a seat-spawned Claude subagent in the worktree, its
brief opening with the rendered preamble (Owner's 10-13 split). Reviews: sol plan and build, astra land. Evidence: `research-*.md`.*

## 1. Why

The owner queued "a small process lane" on 2026-10-11 (HANDOFF "Next" 6). The working pattern fans out to every nana project.
- **Rulings it lacks.** 10-11 (HANDOFF, archive, memory): threat model per plan; plan caps one (small) or two (gate or format),
  reopened only by a named fail-open bug; no edits after an all-LAND review; urgent fixes alone. 10-12 (shared memory only,
  `feedback_lane_process_2026_10_11.md` item 5): the install check, locally on macOS, before `nana-land`. 10-13 (memory,
  HANDOFF): the materiality bar; no MUST means LAND; LAND-WITH-FIXES retired; confirmation rounds review the delta.
- **No standard verdict instruction.** pi-review appends only the immutable-checkout sentence (`pi-review.mjs:177`, R-974);
  briefs ask for the verdict in three conflicting styles. Main's reader gives empty verdicts in trading-zone 19/172, yokai-world
  7/137, nana-pi 8/169, each blocking its revision for good (R-1004). `nana-land` refuses LAND-WITH-FIXES even beside another
  LAND (`probe-land-output.txt`); 18 and 41 are recorded.
- **The preamble is stale**: 18 lines since `df6372f` (10-08); build briefs in 13 lanes re-paste rules 7–18, each in 3 to 10
  lanes. Sonnet builds as a Claude subagent and never receives it.
- **README step 8 fails on every fresh machine.** The clone tracks `.pi/nana-pack.json`; untrusted, doctor adds a `!` row
  (`doctor.mjs:451-457`), and any `!` exits 1 with "NOT verified" (`nana-setup.mjs:323-335`).

**Outcome.** Every pi-review child gets one standard; every refreshed project states the owner's plan and review rules; the preamble
carries the recurring rules; step 8 ends at `all good` on a fresh Mac (INFERRED: trust is its only `!`, `restore.test.mjs:157`).
**Threat model** (Owner's 10-11 words). In: honest variation in our tools' output — a brief asking for a first-line verdict or
LAND-WITH-FIXES; "verdict" in a review body; a prompt file missing or blank after a partial checkout; CRLF on a Windows checkout.
Out: deliberate forgery — a forged verdict line; a standard file weakened on purpose.

## 2. Requirement delta

Lane range R-1100–R-1119; this lane uses R-1100–R-1111. Main's highest ID is R-1092; no branch holds R-1100 or above.

| ID | Change | Text (draft) |
|---|---|---|
| R-1100 | added, SUB-019 after R-683 | The shared working pattern shall require every plan to name its threat model, with honest variation in our tools' output in scope, deliberate forgery out of scope, and a finding outside the model recorded as a residual. |
| R-1101 | added, SUB-019 | The shared working pattern shall cap plan review at one round for a small lane and two rounds for a gate or format lane, with only a named fail-open bug reopening a plan after its cap. |
| R-1102 | added, SUB-019 | The shared working pattern shall forbid any edit once every reviewer has said LAND. |
| R-1103 | added, SUB-019 | The shared working pattern shall require an urgent fix to ship alone, with its hardening in a later lane. |
| R-1104 | added, SUB-019 | The shared working pattern shall state that pi-review appends the review standard so its briefs omit the bar, that a review with no MUST finding is LAND, that LAND-WITH-FIXES is retired, and that a confirmation round reviews only the change since the last round. |
| R-1105 | added, SUB-008 after R-974 | The pi-review child shall receive the text of `prompts/review-standard.md`, not its path, exactly once as an appended system prompt after the immutable-checkout sentence. |
| R-1106 | added, SUB-008 | IF the review standard file is missing, unreadable or blank THEN pi-review shall exit 1 before admission, creating no reservation and starting no pi child. |
| R-1107 | added, SUB-008 | The review standard shall require a last line of exactly `VERDICT: LAND` when no MUST finding stands or `VERDICT: SEND-BACK` otherwise, optionally followed by a score, and no LAND-WITH-FIXES verdict. |
| R-1108 | added, SUB-008 | The review standard shall define a MUST as a finding that names a realistic input under the brief's threat model and a consequence from its listed set, and limit a confirmation round to the change since the round its brief names. |
| R-1109 | added, FEAT-008 after R-981 | nana-pi's `AGENTS.md` shall carry, outside the shared marker region, a land-checklist step that runs `packages/nana-setup/bin/install-check.mjs` locally on macOS before `nana-land` for any lane touching `packages/nana-setup/` or a hook. |
| R-1110 | added, FEAT-006 after R-628 | The canonical builder preamble shall state each of twelve rules exactly once, each on its own line: wrong code first; fix the class; await every async case; CRLF and whitespace cases; IDs from the brief's range; no suite test runs a seat script; no unnamed test deleted; touched tests before each commit and the full suite before the last; seat checks before DONE; long output to a committed file; read CI once; the suite check count in the report. |
| R-1111 | added, SUB-011 after R-951 | The fresh-machine checklist's doctor step shall record pi project trust for the clone with `nana-setup trust ~/nana-pi` before it runs doctor from the clone. |

Each row carries one `shall` (`EARS_ALLOWANCE` is 0). R-628, R-683, R-719, R-720, R-859, R-950, R-951, R-961, R-974 and R-1004
keep their text. Tree total: 1,088 leaf rows on main (counted) → 1,100.

## 3. Design

- **One copy of the bar.** The bar, the verdict line and the delta rule live once, in `prompts/review-standard.md`, appended
  by pi-review.
- **Shared text** (`templates/_shared/working-under-nana-pi.md`; no deletions; 134 words in `shared-text.proposed.md`) goes after
  "Review ladder", which keeps "Maximum three rounds per item" (§6 item 2). The builder hand-copies it into `AGENTS.md:68-97`:
  `template:accept` renders only into temp folders, `nana-setup project .` would seed `OBJECTIVE.md`, `CLAUDE.md` is a symlink.
- **Install-check step**, outside the markers (in the shared file its path fails R-598 against scaffold renders, and downstream
  repos have no nana-setup), as `AGENTS.md` "### Install check before a land" after "### Shared-machine test runs": "Land
  checklist, nana-pi only (Owner, 2026-10-12): a lane that touches `packages/nana-setup/` or a hook runs
  `node packages/nana-setup/bin/install-check.mjs` locally on macOS before `nana-land`, because `nana-land` reads no CI result."
- **The review standard.** pi-review declares `REVIEW_STANDARD_URL = new URL('../prompts/review-standard.md', import.meta.url)`
  once at module scope, as `pi-worker.mjs:92` does (a co-shipped asset, not a tunable). It reads the file before building the
  checkout, exits 1 naming the file on any read error or blank text, and passes the TEXT as a second `--append-system-prompt`
  after the immutable sentence: pi 1.0.2 appends a missing PATH as literal text, silently (`resource-loader.js:100-114`). pi
  repeats the flag (`dist/cli/args.js:75-76`) and joins parts with a blank line (`dist/core/agent-session.js:1243`). Text:
  `review-standard.proposed.md` (157 words; the owner's consequence list; verdict forms checked against `verdictWord`). Contract
  notes: pi-review's header gains the file (`@inputs`) and the refusal (`@errors`); the pack README "Review runner" section gains
  a paragraph on the file, the append, the refusal, and that `review-ledger run` does not inject it.
- **Builder preamble:** `builder-preamble.proposed.md` (34 lines; `builder-preamble.diff`). Each pinned rule is one line whose
  text occurs once; every current line stays, "on branch {{BRANCH}}" (R-961) and the R-628 sentence included. Left out: rules
  15 and 17–19 and rule 9's session split are seat plan work; rule 10's re-run is the seat's.
- **README step 8** becomes "Run `nana-setup trust ~/nana-pi` (it asks before it records), then `nana-setup doctor` from
  `~/nana-pi`; expect `all good`." One numbered step, so R-950's eight actions hold; doctor already names this repair (R-674).
- **What NOT to do.** Never pass the standard's path to pi. No model names or install-check path in the shared file. Never run
  `nana-setup project` on nana-pi. No edit to `review-round.mjs`, `review-ledger.mjs`, `review-shape.mjs`, `nana-land.mjs` or
  `scripts/test.mjs`. No preamble line cap, `--print-preamble`, or `review-ledger run` injection.

## 4. Scope

**In.** The shared file; `AGENTS.md` (region, install-check step); `packages/nana-pack/` `prompts/review-standard.md` (new),
`bin/pi-review.mjs`, `prompts/builder-preamble.md`, `README.md`; root `README.md` step 8; tests `templates-render`,
`immutable-review`, `review-standard` (new), `worker-lane`, `fresh-machine`, `requirements-tree` (1,088 at `:38`, `:52`, `:53`);
`REQUIREMENTS.md`, tree, code map; the seat's HANDOFF and session entry before the final round; `docs/reviews/process-2026-10-13/`.
**NOT.** The test runner; the `--over-cap` rule; the cap and the verdict reader; `nana-land`; `apps/desk`; install-check, doctor
and trust code; downstream repos; shared memory; `nana-agent-loop`; pre-existing Ubuntu/Windows reds.

## 5. Verification

Each title is exact, under a `// req:` line naming its row, frozen in the seat's `seat-titles.mjs`; DONE means `0 missing`.
Phrase checks normalize CR and whitespace runs and count exactly one occurrence.
- `templates-render.test.mjs`, `checkInstructionContracts`: R-1100 "shared working pattern requires a threat model per plan";
  R-1101 "shared working pattern caps plan review at one or two rounds"; R-1102 "shared working pattern freezes edits after an
  all-LAND review"; R-1103 "shared working pattern ships urgent fixes alone"; R-1104 "shared working pattern states the review
  bar for seats"; R-1109 "AGENTS.md carries the macOS install check outside the shared region" (it also asserts the script exists).
- `immutable-review.test.mjs`, on the whole observed argv, against the file's current text: R-1105 "pi-review appends the review
  standard text once after the immutable sentence".
- `review-standard.test.mjs` (copies `bin/`, `lib/verdict-config.mjs`, `prompts/` to the OS temp dir; scratch HOME; stub `pi`;
  spawn cases SKIP on win32 like `handoff-writer-role`): R-1106 "missing review standard is refused before admission",
  "directory at the review standard path is refused before admission", "blank review standard is refused before admission"
  (each: exit 1, stderr names the file, no `.pi/agent/review-ledger.reservations` in HOME, no "admitted as round", stub never
  started); R-1107 "review standard asks for a last-line LAND or SEND-BACK verdict"; R-1108 "review standard defines a MUST and
  limits confirmation rounds to the delta".
- `worker-lane.test.mjs`, R-1110, on the rendered `prompt-1`, key = the rule's whole line: "lane preamble carries: " plus "wrong
  code first", "fix the class", "await every async case", "CRLF and whitespace cases", "IDs from the brief's range", "no suite
  test runs a seat script", "no unnamed test deleted", "touched tests before each commit and the full suite before the last",
  "seat checks before DONE", "long output to a committed file", "read CI once", "the suite check count in the report".
- `fresh-machine.test.mjs`: R-1111 "fresh-machine step 8 trusts the clone before doctor". Renamed: R-291's "…leaf counts total
  1,088" becomes "…leaf counts total 1,100" (R-291's evidence cites another title).

**Wrong code first.** Each pair edits code or text, never an assertion, and reds exactly the titles named, by default its row's.
Shared-text pairs edit the shared file and the region alike (root R-859 stays green) and also red the python and typescript
"rendered AGENTS.md marker region matches shared bytes and follows a paragraph" titles (copier renders HEAD).
- R-1100 (3): delete "every plan names its threat model", "deliberate forgery is out", "a finding outside the model is a
  residual". R-1101 (2): gate-or-format "two" → "three"; delete "only a named fail-open bug reopens the plan". R-1102 (1): delete
  the LAND-freeze sentence. R-1103 (2): delete "Urgent fixes ship alone", "are hardened in a later lane". R-1104 (4): delete the
  `pi-review` sentence, "no MUST finding says LAND", "LAND-WITH-FIXES is retired", the confirmation sentence.
- R-1105 (4): no second `--append-system-prompt`; the standard twice; the path for the text; the standard before the immutable
  sentence (also R-974's "dirty working state is reproduced exactly and reviewer runs in the immutable checkout"). R-1106 (4):
  skip the read when the file is missing (missing title only); on a read error other than ENOENT append nothing and go on
  (directory title only); no blank check (blank title only); read after `admit()` (all three R-1106 titles).
- R-1107 (4): "last line" → "first line"; `SEND-BACK` → `BLOCK`; delete the score clause; delete "Do not use LAND-WITH-FIXES".
  R-1108 (3): delete "a realistic input under the brief's threat model", the consequence list, the confirmation sentence.
- R-1109 (5): the subsection inside the region (also R-859's root "AGENTS.md marker-owned section is byte-identical to the
  shared file"); the path misspelt; delete "on macOS", "before `nana-land`", "or a hook". R-1110 (13): delete each of the
  twelve rule lines; duplicate one line. R-1111 (2): no trust command; trust after doctor.
- **Kept clauses.** K1 "three rounds" → "two rounds" in both copies: R-683's "shared working pattern names generic defaults and
  local overrides" and the two rendered titles. K2 no immutable sentence: R-974's title and R-1105's. K3 the R-628 line deleted:
  R-628's title. K4 "on branch {{BRANCH}}" dropped: R-961's "verified lane passes preamble and validated brief as ordered file
  paths". K5 a space inside the region only: R-859's root title. K6 step 8 split in two: R-950's "fresh-machine checklist has
  eight ordered actions" and R-1111's title.

**The seat's acceptance script** (scratch HOME and repos; never the real ledger): `seat-titles.mjs` at `0 missing` (25 new, 1
renamed); all 53 pairs red with exactly their named titles, restored by `git checkout`; a stub `pi` gets the standard text once,
after the immutable sentence; temp copies with the file missing, a directory or blank exit 1 with no reservations directory and no
stub start; `cmp` of shared file and region, and of the committed standard, preamble and bullets with the proposed files;
`git diff --name-only main...feat/process` lists only §4 paths; one `shall` per new row; install, `nana-setup trust <checkout>
--yes`, then doctor from the checkout shows `✓ project trust`; `npm run test:locked`, `map:check`, `readme:check`,
`node scripts/requirements-tree.mjs --check`, `template:accept` and the local install check pass (the lane edits nana-setup tests).

**The claim most likely to be wrong:** that one appended standard ends empty verdicts. A reviewer obeying both a yokai brief's
first-line LAND-WITH-FIXES and a last-line SEND-BACK records an empty verdict: safe, but a wasted round (§6 item 8).

## 6. Decisions, carries and residuals (each becomes one HANDOFF line)

No YOUR CALL remains for the owner in this lane.
1. **Not pursued: refusing non-standard `--over-cap` reasons.** No ruling asked for it, and other repos pass free text.
2. **Seat decision: "Maximum three rounds per item" stays** as the code-review cap; the owner's caps are plan-review caps (fact-check P9).
3. **Seat decision:** plan SHOULDs after an all-LAND plan review stay out of CHANGE.md; adopted ones go into the build brief.
4. **Seat decision:** "suite green before commit" means touched tests before each commit and the full suite before the last.
5. **Seat decision:** the builder split lives in the roster memory only; the shared file names no models.
6. **Seat decision: the parallel runner is lane `test-jobs`, after this one** (GATE, Sonnet). `scripts/test.mjs` runs 138 files
   one at a time: locked 725 s and 880 s on 10-13, 580 s on 10-10, CI macOS 746 s; four files take 53%, review-ledger 137–200 s,
   at half a core per wall second; four jobs simulate 181–260 s. Its exit code gates land and release, so a lost result fails
   open; port 4391, five time bounds and `--poll 1` come first, and its plan asks the owner whether the desk freeze covers a test edit.
7. **Carry: downstream copies.** jev-research, the-hive, trading-zone and yokai-world need `nana-setup project` (the last two
   also take the next CI tag); work-project, family-planner, game-world and returner hold unmarked hand copies; basketball-geek has none.
8. **Carry: seat memory and briefs.** `reference_pi_review_procedure.md` takes a last-line verdict without LAND-WITH-FIXES; the
   builder-brief rules name the twelve preamble rules (rule 4 false until `test-jobs`); yokai-world's briefs drop LAND-WITH-FIXES.
9. **Residual:** `review-ledger run` wraps any command and gets no standard; its briefs paste the file's text.
10. **Residual:** no test names LAND-WITH-FIXES under R-1004; the 10-13 probe shows `nana-land` refuses it.
11. **Residual:** no staged rollout (pi-review on PATH runs from main); the install check runs doctor outside the clone, so CI
    never proves step 8; the shared file grows by 134 words, against hardening plan 2.6's wish for less.

## Seat revision (2026-10-13)

1. Over-cap enforcement dropped (old R-1110, R-1113, their tests, pairs and YOUR CALL); old R-1111/R-1112 went too: the refusal was the constant's only reader.
2. Old R-1105 (consequence list only in the standard file) dropped; the rule is one copy in `review-standard.md`, appended by pi-review.
3. The new R-719 seal test dropped; the unmarked `cap is 3` check stays; the pattern keeps "Maximum three rounds per item".
4. Threat model worded as the owner ruled: honest variation in our tools' output in, deliberate forgery out.
5. Preamble: S5's two additions dropped; every pinned rule on its own line with unique text, so each pair reds one title.
6. Parallel runner is lane `test-jobs` after this one; measurements in §6 item 6; `scripts/test.mjs` untouched.
7. Install-check rule dated the owner 2026-10-12, "on macOS" kept, in `AGENTS.md` outside the markers as a land-checklist step.
8. Builder split stays in the roster memory only (§6 item 5).
9. Fact-check fixes: old R-1109 one `shall`; join cite `agent-session.js:1243`; drift check `requirements-tree.mjs --check`; pairs name every red title; R-1106 directory and pre-admission assertions; pack README and header notes; asset path as `pi-worker.mjs:92`; per-attempt claim dropped; "broken install or hook" restored.
10. Class FORMAT, two plan rounds; Sonnet 5.5 subagent in `~/nana-pi-wt/process`; rows R-1100–R-1111; tree total 1,100.
11. §5 holds 25 exact titles, 47 row-clause pairs, 6 kept-clause pairs and the acceptance script.
12. §6 holds no YOUR CALL for this lane; the desk-freeze question moves to `test-jobs`.
