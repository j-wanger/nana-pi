# Change declaration — regroup: an agent proposes a project's feature tree, a second lineage reviews every placement, the owner approves a short packet, and the lift applies it

*Lane `regroup` · `feat/regroup` · `~/nana-pi-wt/regroup`, from `main` `e451c90` (lift landed) · 2026-10-15 · seat draft 2 (seat revision applied), not reviewed. Rows: R-1170 to
R-1179 in FEAT-028 (beside the lift's R-1162 to R-1168), R-1180 in FEAT-032 after R-1169; no tree change. R-1181 to R-1183 are held for lane `regroup-shares` (§2). Class
FORMAT (it fixes the proposal format and the owner's packet): two plan-review rounds. Builder: Sonnet (larger lane, `HANDOFF.md:25`). No `packages/nana-setup/` or hook change,
so no install check. Stakes: medium blast, reversible: the command writes only a page; the ledger changes only through the lift's proved `--write` after the owner's yes. A wrong
grouping costs a git revert, the owner's time, and every later feature-oriented lane that trusts it. Evidence beside this file: `research-lift-api.md` (A), `research-precedent.md`
(B), `research-understand.md` (C), `factcheck-repo.md` (FR), `factcheck-external.md` (FE). Cites at `e451c90`; "Ran" = run here on scratch copies; INFERRED = not read or run.*

## 1. Why

Jake, 2026-10-14: "Lift is the tool that enables better regroup, but this is a core feature for nana, understanding existing repo and turn into feature trees, then development
really becomes feature oriented". The queue puts the regroup first (`HANDOFF.md:80`), then feature-oriented development (`:81`). Jake, 2026-10-10 (`docs/reviews/req-tree-2026-10-09/CHANGE-B.md:10-13`):
"Do one review on all 1009 placements, also we should allow multiple features pointing to the same requirements". Both rulings bind this program.
- **The gap.** The skill stops at the lift: "name no regroup command until that lane lands" (`packages/nana-pack/skills/requirements/SKILL.md:132`). A lifted ledger's every
  purpose reads "Not yet sorted:" (`scripts/requirements-lift.mjs:24`; reserved nodes take the seed's text, `:731-746`). A hand mapping already applies with proof (A §4, Ran),
  but the plan prints only `<id>: <n> row(s)` and move lines (`:968-978`). Worse, `detectMoves` keys pairs by heading text and reads merges only from tree IDs (`:610`, `:619`,
  `:628`): on a flat ledger a folded section prints nothing (FR 31, Ran), and aml-desk's two identical `## 36b. Build at production size` headings (lines 484, 570) collapse into one pair (FR B).
- **What failed before.** basketball-geek's markdown draft (6 CAP, 25 FEAT) is still untracked five days on, six questions open (C §5). nana-pi's own tree took about 22 hours
  by git times and 11 builder runs, because placement correctness came after the name checkpoint (B §5). Jake approved names from a 163-line outline (`outline.md`, 3,072 words),
  then refused a fidelity-only checkpoint and got a 27-run placement review (B §3).
- **The users.** Flat, unlifted: aml-desk (365 rows), basketball-geek (165 at HEAD), trading-zone (197; `docs/reviews/lift-2026-10-14/research-ledgers.md:64`). None carries a
  share line (grep on copies, FR 14). yokai-world (1,359 rows, 46 tree headings, a partial tree) has no starting mapping: `--emit-mapping` refuses it (Ran), so it needs a hand
  fix to its ledger first (`HANDOFF.md:63`). nana-pi itself is not a user of this lane (§7).

**Threat model.** In scope: honest variation in our tools' output and users' files — an agent's typo in a field name, a stale proposal after a ledger edit, a review record
that misses or repeats a row or names a home the proposal has since changed, two old headings with the same text, a proposal saved with a BOM or CRLF (PowerShell 5.1
`-Encoding UTF8`, Git for Windows), a UTF-16 proposal (5.1 `>`; the lift refuses it as NUL, `:482`), evidence paths written with `\`, a placeholder purpose left in, a flat or
lifted ledger, a project in a subfolder, Bash or PowerShell, Node 22.18 or later. Out: deliberate forgery — a proposal, review record, lineage label or evidence path built to
fool the checker, a lying git. **Out by nature: the grouping's quality.** The checker proves form, grounding and review coverage; quality rests on the placement review and the owner.

**Split (two lanes, run in parallel).** **Lane `regroup` (this file, FORMAT):** the lift's line-keyed report, the proposal format, the checker and packet, and the skill.
**Lane `regroup-shares` (GATE, its own declaration):** the lift carries, adds and drops shares under proof (A §5-§6). It reopens T22b's closed MUST in the proof core, so it
gets the gate class's rounds on its own. This lane carries shares as a review verdict and a packet section, reading `also_applies` from the proposal either way.

## 2. Requirement delta

Main's highest ID is R-1169 (`REQUIREMENTS.md:1532`). R-1170 appears six times at HEAD, only as the lift's mutation fixture row (`docs/reviews/lift-2026-10-14/seat-mutate.mjs:267`
and five outputs). That is harmless: it is in no ledger, code or `req:` marker, so the ID is free. R-1171 to R-1183: 0 hits. One `shall` per row; each starts `planned`.

| ID | Change | Text |
|---|---|---|
| R-1170 | added, FEAT-028 after R-1168 | WHEN `scripts/requirements-lift.mjs` runs with `--mapping <file>` and neither `--write` nor `--verify`, it shall print one line for each old heading the mapping names whose own tree ID, if any, differs from the ID of the node naming it — every named heading of a flat ledger — giving that heading's line number, its text and the node, and shall key each move line by its old heading's line number and list the IDs of the rows it moves. |
| R-1171 | added, FEAT-028 | WHEN `scripts/requirements-regroup.mjs` runs with `--root <dir>`, `--proposal <file>` and `--out <page>`, it shall write the review page to `<page>` only when the lift's dry run with `--root <dir> --mapping <file>` exits 0 and every regroup check passes, and otherwise exit 1 naming each problem and leave `<page>` unwritten. |
| R-1172 | added, FEAT-028 | The regroup checker shall refuse a proposal in which a capability, feature or subgroup other than CAP-90, FEAT-900 and SUB-900 to SUB-904 keeps a purpose or outcome starting with the lift's unsorted prefix. |
| R-1173 | added, FEAT-028 | The regroup checker shall refuse a proposal unless each heading line and move line R-1170 reports for it has exactly one reason naming that line's old line number and node, and each reason names such a line. |
| R-1174 | added, FEAT-028 | The regroup checker shall refuse a proposal in which a `proposed` feature names no evidence path, or names one that, with `\` read as `/`, does not exist under `<dir>` or leads outside it. |
| R-1175 | added, FEAT-028 | The regroup checker shall refuse a proposal unless its review record names the drafter's and the reviewer's model lineage, declaring `same-family` when they match, and holds exactly one verdict per ledger row, each naming the row, the node the proposal places it in, `keep`, `move` or `share`, a target for a move or share and a non-empty reason, with each move and each share the proposal does not carry named by row in `refuted` with a reason or in a question. |
| R-1176 | added, FEAT-028 | The regroup checker shall refuse a proposal unless `regroup.placed` gives one non-empty reason for exactly the rows whose Evidence cell names no path that exists under `<dir>`. |
| R-1177 | added, FEAT-028 | The regroup checker shall refuse with exit 2 and its usage line a run missing `--root`, `--proposal` or `--out`, and otherwise with exit 1, in at most `PROBLEM_LINE_CAP` lines plus the count of the rest, a proposal holding a top-level key outside the lift's mapping fields and `regroup`, a `regroup` key outside its seven fields, or a question without its recommendation. |
| R-1178 | added, FEAT-028 | The review page shall open with the proposal's SHA-256, the lift's pin and proof line, the drafter's and reviewer's lineages — reading "same-family review" when they match — and the verdict counts, then list the numbered questions each with its recommendation, one table of every feature with its row count and status mix, and every capability, feature and subgroup with its purpose, each capability's outcome and each proposed feature's evidence paths. |
| R-1179 | added, FEAT-028 | After R-1178's parts, the review page shall list each line R-1170 reports with its reason and moved row IDs, each move and share verdict with its reason and whether it is carried, refuted or asked, each text-placed row's ID, opening `GIST_WORDS` words, home and reason, and only then an appendix of every row's ID and requirement text under its new node. |
| R-1180 | added, FEAT-032 after R-1169 | The requirements skill shall carry "regroup" in its description and, in one regroup paragraph, name the check as `node "$HOME/nana-pi/scripts/requirements-regroup.mjs" --root . --proposal <file> --out <page>`, list what the agent reads, say that a reviewer of another model lineage, or a same-family reviewer named as such, checks every row's placement before the owner sees the page, say that `--write` with the proposal as `--mapping` runs only after the owner's yes with the proposal committed, name the reviewer's check as `--verify <base> --mapping <proposal>`, say that a gap becomes a `proposed` feature with no rows, and show no regroup flag the command's source lacks. |

Held for lane `regroup-shares` (drafts; that lane's declaration fixes them): R-1181 the lift writes a tree-form feature's one `Also applies:` line onto the node whose `from`
names it; R-1182 the proof recounts each feature's shares against those carried, added and dropped; R-1183 the dry run prints one line per added or dropped share. R-1167
narrows; T22b becomes a share-lifting test (A §5e). No row here changes text or status. Leaf total 1,136 → **1,147** (`requirements-tree.test.mjs:40`); the heading literals
at `:28` and `:299` (68) stay, because no heading is added (FR 25).

## 3. Design

**3.1 Deterministic parts, judgment part.** Deterministic: §3.2 to §3.5 and the lift's apply and proof (unchanged). Judgment: the grouping and the verdicts; the rehearsal measures it (§5).

**3.2 The lift reports each old section by line (R-1170).** `detectMoves` (`:605-635`) gains `export` and returns records `{line, heading, to, rows}`, keyed by old line, never
by heading text. A heading record prints when the node naming that `from` line is not the heading's own tree ID; a flat heading has none, so every one prints. A move record
prints per old line and new home, with its row IDs. Format: `line 484: ## 36b. Build at production size -> FEAT-012` and `line 484: ## 36b. … -> FEAT-020 (rows R-201, R-207)`.
The plan loop (`:978`) prints records instead of pairs. Nothing else in the lift changes. **Under proof:** every record derives from the mapping the proof then checks the
output against — each `from` section's prose under the node naming it (proof:476-497) and each row in its mapped leaf (proof:325-329) — and a failing proof exits 1 after the
lines. R-1162's tests stay green: the default and identity runs print no `->` line (`requirements-lift.test.mjs:178`, `:228`), and a merge still prints one (`:1214`).

**3.3 The proposal = a lift mapping plus one `regroup` object.** The lift's shape check reads only its own fields (`:415-469`; Ran: a `regroup` key passes). `stringsOf`
refuses CR, LF and U+FFFD in any string (`:470-475`), so reasons are one line each. Pin, byte and BOM rules are the lift's (`readMapping` `:478-500`). Row text never appears.
```json
"regroup": { "read": ["README.md", "test/", "docs/code-map.md"],
  "reasons": [{ "line": 484, "to": "FEAT-012", "why": "these rows build the production fixture the desk loads" }],
  "placed": { "R-212": "names the import screen's retry; no local test" }, "evidence": { "FEAT-012": ["scripts/analyst_pass.py"] },
  "review": { "drafter": "anthropic", "reviewer": "openai", "verdicts": [{ "id": "R-044", "at": "FEAT-002", "verdict": "keep", "reason": "…" },
    { "id": "R-051", "at": "FEAT-002", "verdict": "share", "target": ["FEAT-007"], "reason": "…" }] },
  "refuted": [{ "id": "R-051", "reason": "skeptic: FEAT-007 never reads this field" }], "questions": [{ "ask": "…", "recommendation": "…", "rows": ["R-101"] }] }
```
- **Reasons per reported line (R-1173).** One reason per line R-1170 prints, keyed by `(line, to)`, so aml-desk's two `## 36b.` sections are reasoned apart. aml-desk: 47
  heading lines (6 Parts, 41 sections) plus its row moves; a section-preserving proxy gives 19 move pairs (FE §1, Ran). Kept rows inherit their node's purpose.
- **The review record (R-1175)** mirrors the precedent's per-row form (`placement-review.json`: id, verdict, target, reason). `at` is the home the reviewer judged. An
  amendment that re-homes a row makes its `at` stale, so the checker demands that row's re-review. A `same-family` record is accepted and printed as such, never as another lineage.
- **Text-placed rows (R-1176).** A row whose Evidence cell names no path under `<dir>` was placed by text alone. Each needs the drafter's reason, and the packet lists them.
  aml-desk 174 (C §6: 74 local, 100 sibling-cited), basketball-geek 20, trading-zone about 32 (Ran, a rough path test on a copy).
- **Gaps** only where the draft needs one: a `proposed` feature, `rows: []`, with an existing evidence path (R-1174). The lift and checker already refuse rows under it
  (`:538`; `requirements-tree.mjs:189-191`). Gap discovery stays with the audit mode (`SKILL.md:134-150`). The regroup is move-only, so the lift's byte proof covers it whole.

**3.4 Checker and packet (`scripts/requirements-regroup.mjs`).** *@purpose* "Check a regroup proposal against the lift and the regroup rules and write the packet its owner
reviews." Form, identical in Bash and both PowerShells: `node "$HOME/nana-pi/scripts/requirements-regroup.mjs" --root <dir> --proposal <file> --out <page>`.
1. **The lift is the gate.** It spawns `process.execPath` on the lift with `--root <dir> --mapping <file>` (no shell). Exit 0 is required; lift problems print as is.
2. **Regroup checks** (R-1172 to R-1177). Input headings from `parseLedger`, rows and Evidence cells from `readRequirementRows` (`requirements-tree.mjs:60,231`), report
   records from the exported `detectMoves`. No second validator of the mapping.
3. **Packet** (R-1178, R-1179), Markdown, written by the tool, in the order of the approved nana-pi packet (B §6 item 7): header; numbered decisions with recommendations; one
   feature table (rows, status mix); every heading with its purpose; every reported line, move and share with its reason; text-placed rows with reasons; refuted items. The
   full row list is only an appendix. No timestamp.
- **Tunables** atop the module, by name with provenance: `PAGE_SECTIONS` (contract: R-1178 and R-1179's order, pinned by T14 and T16), `REGROUP_FIELDS` (contract: the seven
  keys, T13), `VERDICTS` (contract: keep, move, share, T7), `GIST_WORDS` (chosen, 12: enough words to recognise a row; the appendix holds the text), `LIFT_SCRIPT` (path).
  `PROBLEM_LINE_CAP` and `UNSORTED_PREFIX` are imported from the lift. Main guard by realpath, as the lift's (`:1117`).

**3.5 The skill (R-1180): one regroup paragraph in the requirements skill**, replacing `SKILL.md:132`'s last clause. `steps.mjs:58` links five pack skills into Claude Code
(requirements, spec, py-lint, py-review, py-test); Windows gets only the requirements skill, as a copy (`:59`, `:217-228`, `:336`). A new skill would need a nana-setup edit;
a paragraph here reaches both seats with none. The paragraph matches T29's `/lift/` scan (`templates-render.test.mjs:490-497`), so regroup-only flags appear only inside the
regroup command's backtick span; every lift flag it names (`--mapping`, `--write`, `--verify`) exists in the lift. The procedure:
1. **Start** in a lane worktree, ledger committed and matching HEAD. `--emit-mapping` gives the default (flat) or identity (tree) start. If it refuses a flat ledger (5b68a91's
   mixed G section, line 1,320, Ran), write the start from the ledger's headings by line and exact text; the lift names any heading missed (`:554-560`). A partial tree such as
   yokai-world needs a hand fix to the ledger first.
2. **Read (J1).** Evidence cells and `req:` markers; test files and titles; module `@purpose` headers or first docstrings and the code map; the README's first paragraph and
   `OBJECTIVE.md`; HANDOFF rulings that freeze or retire work. Not session archives or review corpora. List them in `regroup.read` (shown, not checked).
3. **Draft.** A ledger with Parts gets one drafter per Part (aml-desk six, C §6); the seat assembles. Cluster rows by cited test file and seed one feature per cluster (C §3;
   aml-desk places 52% this way, basketball-geek 88%). Place the rest by text, each with a `placed` reason. Write purposes from module purposes, never the old label alone.
   Split a sprint or lane section by what its rows serve. A gap goes in only as a `proposed` feature with evidence.
4. **Review every placement (J3)** before the owner sees anything, in batches of about 80 rows (the precedent's 1,009 over 12). Reviewer: another model lineage through
   `pi-review` (on Windows `node "$HOME/nana-pi/packages/nana-pack/bin/pi-review.mjs"`, pack `README.md:228`). With no second lineage on the seat (a Claude Code seat without
   pi or a roster), a fresh subagent reviews, recorded `same-family`, and the packet says "same-family review". One skeptic per batch tries to refute each move and share; a
   critic compares batches. Home = the feature the row most directly serves (what breaks if it is violated); share only when the row directly constrains the other feature
   (`placement-review.md:5`). Refuted items go in `refuted`; owner-level conflicts, and upheld shares before `regroup-shares` lands, go in `questions`.
5. **Check and show.** Run the check to exit 0; show the packet. An amendment edits the proposal, re-runs the check, says what changed; re-homed rows need a fresh verdict.
6. **Apply.** On the owner's yes, commit the proposal by its own path, quoting the yes. Run the lift with `--mapping <proposal>`, then `--write`, the tree check and the product
   report. Commit `REQUIREMENTS.md` with the proof line; the reviewer runs `--verify <base> --mapping <proposal>` (FR 43, Ran: plain `--verify <base>` refuses a regroup).

**3.6 What NOT to do.** No change to the lift's validation, apply, proof, write gate or verify; the tree checker; `scripts/product-report.mjs`; the seeds; the five pi skills
(their "then a regroup … that the owner approves" stays true); `packages/nana-setup/**`; any other project's files. No LLM call in the command; no share support in the lift
(lane 2); no row text, status or ID change in a regroup; no gap discovery pass; no page determinism across encodings; no non-empty checks on self-reports.

## 4. Scope

**In.** New `scripts/requirements-regroup.mjs` and `packages/nana-pack/tests/requirements-regroup.test.mjs` (six-tag headers). `scripts/requirements-lift.mjs`: `detectMoves`
(export, line key, heading records, row IDs) and the plan loop's print, nothing else; `requirements-lift.test.mjs` gains T1. `SKILL.md`: description and regroup paragraph.
`templates-render.test.mjs` (T17 beside `checkRequirementsSkillTreeText`, `:454-499`), `requirements-tree.test.mjs` (R-291's leaf literal, `:40`). `README.md` names the new
script on its own physical line, with `scripts/requirements-regroup.mjs` as that line's first bare script path: readme-check gives a line's flags to its first bare `scripts/…`
path and skips `$HOME/nana-pi/scripts/…` (template `readme-check.mjs:152`, `:399-407`), so adding `--proposal` to line 64 would red. `REQUIREMENTS.md` (11 rows), regenerated
`docs/requirements-tree.md` and `docs/code-map.md`, `HANDOFF.md`, `docs/sessions/2026-10.md`, this corpus.
**NOT.** §3.6; any project's actual regroup (each is its own lane with the owner's yes); nana-pi's own regroup; feature-oriented development (the next queue item).
**Overlap.** `regroup-shares` edits the lift's field block, proof and `requirements-lift.test.mjs`, plus FEAT-028 rows. This lane touches only `detectMoves` and the plan print.
Whichever lands second merges main and re-runs both suites. R-291's literal is the base plus 11 here and plus 3 there. `~/nana-pi-wt/land` (`land/t3`) is stale and outside both.

## 5. Verification

Exact titles under `// req:` lines, red before the code, frozen in `seat-titles.mjs` (DONE = `0 missing`). Fixtures are built in the test: a flat ledger with two same-text
headings, a lifted one, G rows from the seed's parse; no other project's ledger enters nana-pi. Spawned runs drop Node's `(node:` lines. Tunables imported by name.
**`requirements-lift.test.mjs`:** T1 `R-1170: on a flat ledger whose two sections share one heading text, a mapping's dry run prints each named heading's line, text and node, and each row move by old line with its row IDs`.
**`requirements-regroup.test.mjs`:**
- T2 `R-1171: a passing proposal writes the review page, and one the lift's dry run refuses writes no page and names the lift's problem` · T3 `R-1171: run through a symlink to the script, the command still writes its page` (skipped on win32).
- T4 `R-1172: a node outside the reserved general-engineering nodes that keeps a "Not yet sorted:" purpose or outcome is refused` · T5 `R-1173: each line the lift reports needs exactly one reason by old line and node, a missing, repeated or stale reason is refused, and two same-text headings are reasoned apart`.
- T6 `R-1174: a proposed feature with no evidence path, a missing path or a path leaving the root is refused, and an existing path written with backslashes passes`.
- T7 `R-1175: a review record missing a row, repeating one, naming a stale home, an unknown verdict or target, or an empty reason is refused` · T8 `R-1175: a move or uncarried share verdict named neither in refuted nor in a question is refused, and one named in either passes` · T9 `R-1175: a record whose drafter and reviewer share a lineage is refused unless it declares same-family`.
- T10 `R-1176: a text-placed row without a placed reason, or a placed reason for a row with local evidence, is refused`.
- T11 `R-1177: a proposal with more problems than the cap prints at most the problem-line cap and the count of the rest` · T12 `R-1177 fixture: a run missing --root, --proposal or --out exits 2 with usage` · T13 `R-1177: a misspelled top-level or regroup key and a question without a recommendation are refused`.
- T14 `R-1178: the page opens with both hashes, the proof line, the lineages and verdict counts, then the numbered questions, the feature table with status mix, and every node with its purpose and each proposed feature's evidence` · T15 `R-1178: a same-family record reads "same-family review" on the page and never "another lineage"`.
- T16 `R-1179: the page lists each reported line with its reason and rows, each move and share verdict with its outcome, each text-placed row with its reason, and every row only in the appendix after them`.
**`templates-render.test.mjs`:** T17 · R-1180 `requirements skill's regroup paragraph names the regroup check, what the agent reads, a review of every placement, the owner's yes before --write, --verify with --mapping and gaps as proposed features, and only flags the regroup has`.
T17 checks the paragraph holding `REGROUP_SKILL_CMD` alone, never the whole skill: "only after the owner's yes" already sits in the lift paragraph under T29 (FR 51).
Phrases: `REGROUP_SKILL_CMD`; `regroup` in the description; `every row's placement`; `same-family`; `only after the owner's yes`; `--verify <base> --mapping <proposal>`;
`with no rows`. Every `--flag` in the regroup span appears in the source at `REGROUP_SCRIPT`, imported by name. T29's phrases stay. **`requirements-tree.test.mjs`:** T18 · R-291 `…total 1,136` → 1,147.

**Wrong code first.** Each pair edits code or text, never an assertion, and must red exactly the named titles (N/N in `seat-mutate.mjs`). 44 pairs.

| # | Wrong code | Reds |
|---|---|---|
| 1 | lift keys by heading text again / flat heading lines dropped / row IDs dropped / a heading line printed for an identity heading | T1 / T1 / T1 / R-1162 identity test |
| 2 | the lift's dry run skipped / its exit ignored / the guard uses the resolve form · placeholder check dropped / applied to reserved nodes too | T2 / T2 / T3 · T4 / T4 |
| 4 | missing reason accepted / repeated reason accepted / stale reason accepted / reasons keyed by heading text | T5 (each) |
| 5 | empty evidence accepted / missing path accepted / `..` accepted / `\` not normalised | T6 (each) |
| 6 | missing row / repeated row / stale `at` / empty reason accepted · unresolved move / unresolved share accepted · same lineage accepted without `same-family` | T7 ×4 · T8 ×2 · T9 |
| 7 | missing `placed` reason accepted / Evidence path existence ignored · cap removed / missing `--out` accepted / unknown key accepted / question without recommendation accepted | T10 / T10 · T11 / T12 / T13 / T13 |
| 8 | questions after the table / proof line omitted / status mix omitted / gap evidence omitted · same-family printed as another lineage | T14 ×4 · T15 |
| 9 | moved row IDs omitted / share verdicts omitted / text-placed list omitted / appendix before the lists | T16 (each) |
| 10 | regroup paragraph drops the placement review / drops "only after the owner's yes" / shows `--verify <base>` without `--mapping` / shows a flag the source lacks · a row added without the literal | T17 ×4 · T18 |

Kept green: the rest of the lift suite, R-1162's three move-line tests included (`:178`, `:228`, `:1214`).

**Seat acceptance** (on copies in the seat's scratch, never in the projects; seen failing at the base).
- basketball-geek's HEAD copy, end to end on a Claude Code seat: check exits 0; the lift proves; in a scratch git copy, `--write`, commit, `--verify <base> --mapping <proposal>`
  exits 0. Record runs, wall clock, packet words and minutes to read.
- aml-desk's copy, straight from flat: check exits 0; both `## 36b.` sections print apart, each with its reason; §36's lane notes land where residual 3 says.
- **Blind rehearsal (grouping quality, measured, not gated).** nana-pi's pre-tree ledger (`5b68a91`, 1,004 rows, 0 share lines, Ran), a `git archive` without `docs/reviews/`
  in the seat's scratch. Run it in a pi worker session (`NANA_ROLE=worker` turns the knowledge pull off; pi has no shared auto-memory), never a Claude Code session in
  nana-pi: the knowledge index holds `docs/requirements-tree.md`, Jake's ruled tree, and project memory names it (FR E). Score R rows only; the lift forces G rows into the
  seed subgroups while Jake's tree keeps them in FEAT-033. Score = share of rows whose drafted feature's majority ruled feature is their ruled feature; also at capability
  level. **Pass mark: feature ≥ 85% and capability ≥ 93%** (chosen: the test-file signal alone, the drafter's own first step, scores 85.9% and 94.1%, C §2, so the judgment
  steps must not do worse). Record both scores before and after the placement review, the packet's words and its reading minutes at 238 words a minute.
- Suite: `npm run test:locked`, `map:check`, `readme:check`, `node scripts/requirements-tree.mjs --check`, `node scripts/requirements-trace.mjs`, and an empty merge-base diff on
  §3.6's files. Windows: nothing runs there before the land; CI's Git Bash leg runs after it and is non-blocking (`.github/workflows/ci.yml:50`, `:53`).

**The claim most likely wrong:** that aml-desk's packet, about 10,000 words, half of it the 174 text-placed rows, can be judged in one sitting. The precedent's 9,518-word
packet was planned at 20 minutes, but Jake's actual minutes were never recorded (B, "Not read"). The rehearsal and the first real checkpoint record them.

## 6. Cost per project (all INFERRED, anchored on the nana-pi precedent)

Tokens are material read at about 4 characters a token, from measured sizes (Ran: aml-desk read set about 450 KB, FE §5; trading-zone 271 KB and basketball-geek about
170 KB, measured read-only today). Billed tokens run higher, because each agent turn re-reads its context. Runs = drafters + reviewers + skeptics + one critic, batches of about 80 rows.

| Project | Rows | Drafters | Reviewers / skeptics / critic | Agent runs | Tokens read | Wall clock | Packet words (before appendix) | Owner minutes |
|---|---|---|---|---|---|---|---|---|
| aml-desk | 365 | 6 (one per Part) | 5 / 5 / 1 | 17 | about 0.45M | 4–6 h | about 10,000 | 45–60 |
| basketball-geek | 165 | 1 (its draft exists) | 2 / 2 / 1 | 6 | about 0.13M | 2–3 h | about 4,000 | 20–30 |
| trading-zone | 197 | 1 | 3 / 3 / 1 | 8 | about 0.16M | 2–3 h | about 4,100 | 20–30 |
| rehearsal (5b68a91) | 1,004 | 4 (one per Part) | 12 / 12 / 1 | 29 | about 0.75M | 6–8 h | about 10,000 | none (seat reads) |
| nana-pi precedent | 1,009 | astra, one draft | 12 / 14 / 1 | 27, plus 11 builder runs | not recorded | about 22 h | 9,518 | about 20 planned for the last packet; never recorded |

The precedent's 22 hours included building its move and proof scripts, now the lift; scaling it by rows (8 h, 3.6 h, 4.3 h) is the upper bound. Owner minutes = packet words
at 238 a minute (FE §1) plus one amendment round. Weakest guesses: rows per drafter, batch size, the re-read factor.

## 7. Decisions and residuals (each becomes one HANDOFF line)

**Jake's decisions (product; non-blocking, the build starts on the recommendations).**
- **J1 What the agent reads.** Rec: §3.5 step 2. Not session archives or review corpora. Why his: it defines "grounded in the repo" for every project.
- **J2 The owner's packet — RULED by Jake 2026-10-15: "Short package".** As recommended: reproduce the about 15–20-minute packet he approved for nana-pi (B §3, §6 item 7): one
  feature table (rows, status mix), every heading with its purpose, every reported line, move and share with its reason, text-placed rows with reasons, refuted items, numbered
  decisions each recommended; full row list only as an appendix. Expected: aml-desk about 10,000 words (42 minutes at 238 a minute), basketball-geek about 4,000 (17). Why his: he reads it.
- **J3 The checkpoint form.** Rec: one checkpoint, after the every-row review his 2026-10-10 ruling requires; answers by number in chat; approval is the proposal committed
  with his words quoted. Why his: it sets his review time per project.
**Decided by Jake's rulings, applied here.** Every placement reviewed by a different lineage before he sees the packet (2026-10-10). Shares in scope (2026-10-10), as the
parallel GATE lane `regroup-shares`; this lane carries shares as a verdict and a packet section.
**Seat decisions (declared, not asked).** S1 The proposal is a lift mapping plus one `regroup` object. S2 Move-only; gaps hold no rows and need evidence. S3 One reason per line
the lift reports, keyed by old line. S4 The checker spawns the lift's dry run and imports `detectMoves`. S5 The page is regenerated; the committed proposal is the approval
record. S6 One paragraph in the requirements skill. S7 Applies to the committed ledger, flat or lifted. S8 `\` in evidence paths becomes `/`. S9 Rows in FEAT-028 and FEAT-032;
no FEAT-040, no tree change. S10 Class FORMAT, Sonnet builder. S11 The every-row review record is structured and counted, `same-family` when no second lineage exists.
**Residuals and carries.**
1. The checker proves form, grounding and review coverage, not good grouping; the rehearsal is one data point. A same-family review is weaker, and the packet says so.
2. Until `regroup-shares` lands, a proposal cannot carry shares; upheld share verdicts wait in one question.
3. Lift residual 2 stands: a split section with prose between table fragments puts that prose above one table (aml-desk §36). Prose moves only as whole sections (A §4).
4. FEAT and SUB IDs cited in HANDOFF, briefs and corpora go stale when a regroup merges them; the lift prints each merge, and nothing rewrites citations.
5. A page from an earlier passing run stays at `<page>` after a failed run; its header's proposal hash tells it apart.
6. The node form of `pi-review` has not run a placement review on a Windows seat, nobody has run the PowerShell form there, and lineage labels are self-reported.
7. nana-pi's own regroup is out of scope. Its 31 shares wait for lane 2, and the recorded decision "G rows stay in FEAT-033 by declared design" (`placement-review.md:5`)
   stands, while the lift demands G rows in their seed subgroups (`:532-536`). Revisiting either is Jake's call in a later lane. yokai-world needs a hand fix first (§1).
8. HANDOFF line for Jake, written before the final round: re-run `nana-setup install` on the Windows Claude Code seat so its requirements skill copy updates (`steps.mjs:217-228`).

## Seat revision (2026-10-15)

1. Factcheck WRONGs fixed: `--verify <base> --mapping <proposal>` in skill and acceptance; lift reports each old section by line, flat included (R-1170, T1); rows in FEAT-028; T17 scoped to the paragraph; R-1170 fixture noted; `steps.mjs:58` five skills; aml-desk 52%; yokai-world, readme-check first path, T29 scan, G-row decision named; J6 dropped; rehearsal off the knowledge pull.
2. Owner's packet reproduces the approved nana-pi packet, full row list only as an appendix (R-1178, R-1179, J2 ruled by Jake 2026-10-15: "Short package"); expected length aml-desk about 10,000 words, basketball-geek about 4,000.
3. Every row reviewed by a different lineage before the owner sees the packet; a per-row record the checker counts (R-1175); `same-family` fallback named plainly; Windows uses `node …/pi-review.mjs`.
4. Shares in scope by Jake's 2026-10-10 ruling: parallel GATE lane `regroup-shares` (R-1181 to R-1183); this lane carries shares as a verdict and packet section.
5. Per-project cost table for aml-desk, basketball-geek and trading-zone, plus the rehearsal, anchored on the 22-hour, 1,009-row precedent; all INFERRED (§6).
6. Cut: gap discovery pass (gaps kept only as `proposed` features with evidence), byte-identical page across encodings, non-empty self-report checks, ID re-point check.
7. Blind rehearsal kept on 5b68a91 with pass mark feature ≥ 85%, capability ≥ 93%, and the packet's words and reading minutes recorded.
