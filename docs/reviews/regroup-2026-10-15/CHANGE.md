# Change declaration — regroup: an agent proposes a project's feature tree, a second lineage reviews every placement, the owner approves a short packet, and the lift applies it

*Lane `regroup` · `feat/regroup` · `~/nana-pi-wt/regroup`, from `main` `e451c90` (lift landed) · 2026-10-15 · seat draft 3 (sol plan r1 folded in, last section). Rows: R-1170 to
R-1179 and R-1184 in FEAT-028 (beside the lift's R-1162 to R-1168), R-1180 in FEAT-032 after R-1169; no tree change. R-1181 to R-1183 are held for lane `regroup-shares` (§2). Class
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

**Threat model.** In scope: honest variation in our tools' output and users' files — a field-name typo at any level, a stale proposal after a ledger edit, a review record that misses,
repeats or outdates a row or claim, a share upheld for one target and refuted for another, an `--out` aliasing an input, a re-run after a failure, two old headings with the same text, a
proposal saved with a BOM or CRLF (PowerShell 5.1 `-Encoding UTF8`, Git for Windows), a UTF-16 proposal (5.1 `>`; the lift refuses it as NUL, `:482`), evidence paths written with `\`, a
placeholder purpose left in, an invented reason or a drifting purpose, a flat or lifted ledger, a project in a subfolder, Bash or PowerShell, Node 22.18 or later. Out: deliberate forgery — a
proposal, review record, lineage label or evidence path built to fool the checker, a lying git. **Not machine-checkable:** a claim's truth; the reviewer judges, the checker counts (R-1184).

**Split (two lanes, run in parallel).** **Lane `regroup` (this file, FORMAT):** the lift's line-keyed report, the proposal format, the checker and packet, and the skill.
**Lane `regroup-shares` (GATE, its own declaration):** the lift carries, adds and drops shares under proof (A §5-§6). It reopens T22b's closed MUST in the proof core, so it
gets the gate class's rounds on its own. This lane carries shares as a review verdict and a packet section, reading `also_applies` from the proposal either way.

## 2. Requirement delta

Main's highest ID is R-1169 (`REQUIREMENTS.md:1532`). R-1170 appears six times at HEAD, only as the lift's mutation fixture row (`docs/reviews/lift-2026-10-14/seat-mutate.mjs:267` and five
outputs). That is harmless: it is in no ledger, code or `req:` marker, so the ID is free. R-1171 to R-1184: 0 hits (main, both worktrees). One `shall` per row; each starts `planned`.

| ID | Change | Text |
|---|---|---|
| R-1170 | added, FEAT-028 after R-1168 | WHEN `scripts/requirements-lift.mjs` runs with `--mapping <file>` and neither `--write` nor `--verify`, it shall print one line for each old heading the mapping names whose own tree ID, if any, differs from the ID of the node naming it — every named heading of a flat ledger — giving that heading's line number, its text and the node, and key each move line by its old heading's line number and list the IDs of the rows it moves. |
| R-1171 | added, FEAT-028 | WHEN `scripts/requirements-regroup.mjs` runs with `--root <dir>`, `--proposal <file>` and `--out <page>`, it shall write the review page to `<page>` only when `<page>`'s real path, symlinks followed, is none of the run's inputs (the ledger, the proposal, the lift and each evidence path), the lift's dry run with `--root <dir> --mapping <file>` exits 0 and every regroup check passes, and otherwise exit 1 naming each problem and leave no review page at `<page>`, removing an earlier one and changing no other file. |
| R-1172 | added, FEAT-028 | The regroup checker shall refuse a proposal in which a capability, feature or subgroup other than CAP-90, FEAT-900 and SUB-900 to SUB-904 keeps a purpose or outcome starting with the lift's unsorted prefix. |
| R-1173 | added, FEAT-028 | The regroup checker shall refuse a proposal unless each heading line and move line R-1170 reports for it has exactly one reason naming that line's old line number and node, and each reason names such a line. |
| R-1174 | added, FEAT-028 | The regroup checker shall refuse a proposal in which a `proposed` feature names no evidence path, or names one that, with `\` read as `/`, does not exist under `<dir>` or leads outside it. |
| R-1175 | added, FEAT-028 | The regroup checker shall refuse a proposal unless its review record names the drafter's and the reviewer's model lineage, declaring `same-family` when they match, and holds exactly one verdict per ledger row, each naming the row, the node the proposal places it in, and either `keep` with a non-empty reason or `move` or `share` with targets that each carry their own non-empty reason, one target for a move, and unless each move or share target has exactly one outcome keyed by row and target: carried in that feature's `also_applies` (a share only), named in `refuted` with a reason, or named in a question. |
| R-1176 | added, FEAT-028 | The regroup checker shall refuse a proposal unless `regroup.placed` gives one non-empty reason for exactly the rows whose Evidence cell names no path that exists under `<dir>`. |
| R-1177 | added, FEAT-028 | The regroup checker shall refuse with exit 2 and its usage line a run missing `--root`, `--proposal` or `--out`, and otherwise with exit 1, in at most `PROBLEM_LINE_CAP` lines plus the count of the rest, a proposal holding, in an object at any level, a key outside that level's fields in `PROPOSAL_KEYS`, naming the key's path, or a question without its recommendation. |
| R-1178 | added, FEAT-028 | The review page shall open with the proposal's SHA-256, the lift's pin and proof line, the drafter's and reviewer's lineages — reading "same-family review" when they match — and the placement and claim verdict counts, then list the numbered questions each with its recommendation, one table of every feature with its row count and status mix, and every capability, feature and subgroup with its purpose, each capability's outcome and each proposed feature's evidence paths. |
| R-1179 | added, FEAT-028 | After R-1178's parts, the review page shall list each line R-1170 reports with its reason and moved row IDs, each move and share target by row and target with its own reason and outcome — carried, refuted or asked —, each rejected claim with its reason, each text-placed row's ID, opening `GIST_WORDS` words, home and reason, and only then an appendix of every row's ID and requirement text under its new node. |
| R-1180 | added, FEAT-032 after R-1169 | The requirements skill shall carry "regroup" in its description and, in one regroup paragraph, name the check as `node "$HOME/nana-pi/scripts/requirements-regroup.mjs" --root . --proposal <file> --out <page>`, list what the agent reads, say that a reviewer of another model lineage, or a same-family reviewer named as such, checks every row's placement and every purpose, outcome and section reason before the owner sees the page, say that `--write` with the proposal as `--mapping` runs only after the owner's yes with the proposal committed, name the reviewer's check as `--verify <base> --mapping <proposal>`, say that a gap becomes a `proposed` feature with no rows, and show no regroup flag the command's source lacks. |
| R-1184 | added, FEAT-028 after R-1179 | The regroup checker shall refuse a proposal unless its review record holds exactly one claim verdict, `accept` or `reject` with a non-empty reason and the claim's current text, for each capability's, feature's and subgroup's purpose and each capability's outcome outside R-1172's reserved nodes and for each reason R-1173 requires, and a question names each rejected claim. |

Held for lane `regroup-shares` (drafts; that lane's declaration fixes them): R-1181 the lift writes a tree-form feature's one `Also applies:` line onto the node whose `from`
names it; R-1182 the proof recounts each feature's shares against those carried, added and dropped; R-1183 the dry run prints one line per added or dropped share. R-1167
narrows; T22b becomes a share-lifting test (A §5e). No row here changes text or status. Leaf total 1,136 → **1,148** (`requirements-tree.test.mjs:40`); the heading literals
at `:28` and `:299` (68) stay, because no heading is added (FR 25).

## 3. Design

**3.1 Deterministic parts, judgment part.** Deterministic: §3.2 to §3.5 and the lift's apply and proof (unchanged). Judgment: the grouping and the verdicts; the rehearsal measures it (§5).

**3.2 The lift reports each old section by line (R-1170).** `detectMoves` (`:605-635`) gains `export` and returns records `{line, heading, to, rows}`, keyed by old line, never
by heading text. A heading record prints when the node naming that `from` line is not the heading's own tree ID; a flat heading has none, so every one prints. A move record
prints per old line and new home, with its row IDs. Format: `line 484: ## 36b. Build at production size -> FEAT-012` and `line 484: ## 36b. … -> FEAT-020 (rows R-201, R-207)`.
The plan loop (`:978`) prints records instead of pairs. Nothing else in the lift changes. **Under proof:** every record derives from the mapping the proof then checks the
output against — each `from` section's prose under the node naming it (proof:476-497) and each row in its mapped leaf (proof:325-329) — and a failing proof exits 1 after the
lines. R-1162's tests stay green: the default and identity runs print no `->` line (`requirements-lift.test.mjs:178`, `:228`), and a merge still prints one (`:1214`).

**3.3 The proposal = a lift mapping plus one `regroup` object.** The lift's shape check ignores keys it does not read, at any level (`:415-469`; Ran: a `regroup` key
passes), so `statsu` beside `status` passes it. The checker holds every object to its level's keys in `PROPOSAL_KEYS`, naming the path (`tree[1].features[0].statsu`, R-1177).
`stringsOf` refuses CR, LF and U+FFFD in any string (`:470-475`), so reasons are one line each. Pin, byte and BOM rules are the lift's (`readMapping` `:478-500`). No row text.
```json
"regroup": { "read": ["README.md", "test/", "docs/code-map.md"],
  "reasons": [{ "line": 484, "to": "FEAT-012", "why": "these rows build the production fixture the desk loads" }],
  "placed": { "R-212": "names the import screen's retry; no local test" }, "evidence": { "FEAT-012": ["scripts/analyst_pass.py"] },
  "review": { "drafter": "anthropic", "reviewer": "openai", "verdicts": [{ "id": "R-044", "at": "FEAT-002", "verdict": "keep", "reason": "…" },
    { "id": "R-051", "at": "FEAT-002", "verdict": "share", "targets": [{ "to": "FEAT-007", "reason": "…" }, { "to": "FEAT-008", "reason": "…" }] }],
    "claims": [{ "node": "FEAT-012", "field": "purpose", "text": "…", "verdict": "accept", "reason": "…" }, { "line": 484, "to": "FEAT-012", "text": "…", "verdict": "reject", "reason": "…" }] },
  "refuted": [{ "id": "R-051", "to": "FEAT-008", "reason": "…" }], "questions": [{ "ask": "…", "recommendation": "…", "about": [{ "id": "R-051", "to": "FEAT-007" }, { "line": 484, "to": "FEAT-012" }] }] }
```
- **Reasons per reported line (R-1173).** One reason per line R-1170 prints, keyed by `(line, to)`, so aml-desk's two `## 36b.` sections are reasoned apart. aml-desk: 47
  heading lines (6 Parts, 41 sections) plus its row moves; a section-preserving proxy gives 19 move pairs (FE §1, Ran). Kept rows inherit their node's purpose.
- **The review record (R-1175)** mirrors the precedent's per-row form (`placement-review.json`: id, verdict, target, reason). `at` is the home the reviewer judged; a re-homed
  row's `at` goes stale and needs re-review. Each move or share target holds its own reason and resolves alone, keyed by `(id, to)`: carried (the target's `also_applies` names
  the row), refuted or asked, so R-051 can be asked for FEAT-007 and refuted for FEAT-008. A `same-family` record is printed as such, never as another lineage.
- **Claim review (R-1184).** One quoted `accept` or `reject` with a reason per purpose, outcome and section reason; reserved nodes need none; a kept reject becomes a question.
- **Text-placed rows (R-1176).** A row whose Evidence cell names no path under `<dir>` was placed by text alone. Each needs the drafter's reason, and the packet lists them.
  aml-desk 174 (C §6: 74 local, 100 sibling-cited), basketball-geek 20, trading-zone about 32 (Ran, a rough path test on a copy).
- **Gaps** only where the draft needs one: a `proposed` feature, `rows: []`, with an existing evidence path (R-1174). The lift and checker already refuse rows under it
  (`:538`; `requirements-tree.mjs:189-191`). Gap discovery stays with the audit mode (`SKILL.md:134-150`). The regroup is move-only, so the lift's byte proof covers it whole.

**3.4 Checker and packet (`scripts/requirements-regroup.mjs`).** *@purpose* "Check a regroup proposal against the lift and the regroup rules and write the packet its owner
reviews." Form, identical in Bash and both PowerShells: `node "$HOME/nana-pi/scripts/requirements-regroup.mjs" --root <dir> --proposal <file> --out <page>`.
1. **Output, then the lift (R-1171).** `<page>`'s real path (its parent's, when new) must not be an input's (the ledger, the proposal, the lift, an evidence path); a failing run removes a file
   at `<page>` only if it opens with `PAGE_HEAD`. Then it spawns `process.execPath` on the lift with `--root <dir> --mapping <file>` (no shell); exit 0 is required, lift problems print as is.
2. **Regroup checks** (R-1172 to R-1177, R-1184). Input headings from `parseLedger`, rows and Evidence cells from `readRequirementRows` (`requirements-tree.mjs:60,231`), report
   records from the exported `detectMoves`. At the lift's levels the checker reads key names only, never values. The checks are a named export, so T8 calls them directly.
3. **Packet** (R-1178, R-1179), Markdown, written by the tool, in the order of the approved nana-pi packet (B §6 item 7): header; numbered decisions with recommendations; one
   feature table (rows, status mix); every heading with its purpose; every reported line with its reason; each move and share target with its reason and outcome; rejected
   claims; text-placed rows with reasons; refuted items. The full row list is only an appendix. No timestamp.
- **Tunables** atop the module, by name with provenance: `PAGE_SECTIONS` (contract: R-1178 and R-1179's order, pinned by T14 and T16), `PROPOSAL_KEYS` (contract: each object level's
  keys, the lift's at `e451c90` `:366`, `:382-384` plus §3.3's records; a key `regroup-shares` adds must join it; T13), `VERDICTS` (contract: keep, move, share, T7), `CLAIM_VERDICTS`
  (contract: accept, reject, T22), `PAGE_HEAD` (contract: the page's first line, which marks an earlier page, T21), `GIST_WORDS` (chosen, 12: enough words to recognise a row; the
  appendix holds the text), `LIFT_SCRIPT` (path). `PROBLEM_LINE_CAP` and `UNSORTED_PREFIX` are imported from the lift. Main guard by realpath, as the lift's (`:1117`).

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
4. **Review every placement (J3)** before the owner sees anything, in batches of about 80 rows (the precedent's 1,009 over 12). Reviewer: another model lineage through `pi-review` (on Windows
   `node "$HOME/nana-pi/packages/nana-pack/bin/pi-review.mjs"`, pack `README.md:228`). With no second lineage on the seat (a Claude Code seat without pi or a roster), a fresh subagent reviews,
   recorded `same-family`, and the packet says "same-family review". The reviewer also judges each purpose, outcome and section reason (R-1184). One skeptic per batch tries to refute each move
   and share target; a critic compares batches. Home = the feature the row most directly serves (what breaks if it is violated); share only when the row directly constrains the other feature
   (`placement-review.md:5`). Refuted targets go in `refuted`; owner-level conflicts, kept rejects and upheld shares go in `questions`.
5. **Check and show.** Run the check to exit 0; show the packet. An amendment edits the proposal, re-runs the check, says what changed; re-homed rows and changed claims need a fresh verdict.
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
path and skips `$HOME/nana-pi/scripts/…` (template `readme-check.mjs:152`, `:399-407`), so adding `--proposal` to line 64 would red. `REQUIREMENTS.md` (12 rows), regenerated
`docs/requirements-tree.md` and `docs/code-map.md`, `HANDOFF.md`, `docs/sessions/2026-10.md`, this corpus.
**NOT.** §3.6; any project's actual regroup (each is its own lane with the owner's yes); nana-pi's own regroup; feature-oriented development (the next queue item).
**Overlap.** `regroup-shares` edits the lift's field block, proof and `requirements-lift.test.mjs`, plus FEAT-028 rows. This lane touches only `detectMoves` and the plan print.
Whichever lands second merges main and re-runs both suites. R-291's literal is the base plus 12 here and plus 3 there. `~/nana-pi-wt/land` (`land/t3`) is stale and outside both.

## 5. Verification

Exact titles under `// req:` lines, red before the code, frozen in `seat-titles.mjs` (DONE = `0 missing`). Fixtures are built in the test: a flat ledger with two same-text
headings, a lifted one, G rows from the seed's parse; no other project's ledger enters nana-pi. Spawned runs drop Node's `(node:` lines. Tunables imported by name.
**`requirements-lift.test.mjs`:** T1 `R-1170: on a flat ledger whose two sections share one heading text, a mapping's dry run prints each named heading's line, text and node, and each row move by old line with its row IDs`.
**`requirements-regroup.test.mjs`:**
- T2 `R-1171: a passing proposal writes the review page, and one the lift's dry run refuses writes no page and names the lift's problem` · T3 `R-1171: run through a symlink to the script, the command still writes its page` (skipped on win32) · T19 `R-1171: an --out naming the ledger or the proposal is refused and leaves that file byte-identical` · T20 `R-1171: an --out that is a symlink to the proposal is refused and leaves the proposal byte-identical` (skipped on win32) · T21 `R-1171: a failing run removes an earlier review page at --out and leaves a file there that is not a review page unchanged`.
- T4 `R-1172: a node outside the reserved general-engineering nodes that keeps a "Not yet sorted:" purpose or outcome is refused` · T5 `R-1173: each line the lift reports needs exactly one reason by old line and node, a missing, repeated or stale reason is refused, and two same-text headings are reasoned apart`.
- T6 `R-1174: a proposed feature with no evidence path, a missing path or a path leaving the root is refused, and an existing path written with backslashes passes`.
- T7 `R-1175: a review record missing a row, repeating one, naming a stale home, an unknown verdict or target, an empty reason or a target without its own reason is refused` · T8 `R-1175: each move or share target needs exactly one outcome keyed by row and target, so a share carried to one feature and refuted for another passes, and a target left unresolved or resolved twice is refused` (the checks called directly: the lift refuses a declared share until `regroup-shares` lands) · T9 `R-1175: a record whose drafter and reviewer share a lineage is refused unless it declares same-family`.
- T10 `R-1176: a text-placed row without a placed reason, or a placed reason for a row with local evidence, is refused`.
- T11 `R-1177: a proposal with more problems than the cap prints at most the problem-line cap and the count of the rest` · T12 `R-1177 fixture: a run missing --root, --proposal or --out exits 2 with usage` · T13 `R-1177: a misspelled key in any object level of a proposal is refused naming its path, and so is a question without a recommendation` (18 levels: top, pin, head, capability, feature, subgroup, from, tail, keep, regroup, reason, review, verdict, target, claim, refuted, question, about).
- T14 `R-1178: the page opens with both hashes, the proof line, the lineages and the placement and claim verdict counts, then the numbered questions, the feature table with status mix, and every node with its purpose and each proposed feature's evidence` · T15 `R-1178: a same-family record reads "same-family review" on the page and never "another lineage"`.
- T16 `R-1179: the page lists each reported line with its reason and rows, each move and share target with its own outcome, each rejected claim with its reason, each text-placed row with its reason, and every row only in the appendix after them`.
- T22 `R-1184: each purpose and outcome outside the reserved nodes and each reported line's reason needs exactly one accept or reject verdict with a reason and the claim's current text, a missing, repeated, stale or reasonless one is refused, and a reserved node needs none` · T23 `R-1184: a rejected claim named in no question is refused, and one named in a question passes`.
**`templates-render.test.mjs`:** T17 · R-1180 `requirements skill's regroup paragraph names the regroup check, what the agent reads, a review of every placement and every purpose, outcome and section reason, the owner's yes before --write, --verify with --mapping and gaps as proposed features, and only flags the regroup has`.
T17 checks the paragraph holding `REGROUP_SKILL_CMD` alone, never the whole skill: "only after the owner's yes" already sits in the lift paragraph under T29 (FR 51).
Phrases: `REGROUP_SKILL_CMD`; `regroup` in the description; `every row's placement`; `every purpose, outcome and section reason`; `same-family`; `only after the owner's yes`; `--verify <base> --mapping <proposal>`;
`with no rows`. Every `--flag` in the regroup span appears in the source at `REGROUP_SCRIPT`, imported by name. T29's phrases stay. **`requirements-tree.test.mjs`:** T18 · R-291 `…total 1,136` → 1,148.

**Wrong code first.** Each pair edits code or text, never an assertion, and must red exactly the named titles (N/N in `seat-mutate.mjs`). 80 pairs.

| # | Wrong code | Reds |
|---|---|---|
| 1 | lift keys by heading text again / flat heading lines dropped / row IDs dropped / a heading line printed for an identity heading | T1 / T1 / T1 / R-1162 identity test |
| 2 | the lift's dry run skipped / its exit ignored / the guard uses the resolve form / the `--out` clash check dropped / the clash compared without realpath / a failed run leaves an earlier page / a failed run removes any file at `--out` · placeholder check dropped / applied to reserved nodes too | T2 / T2 / T3 / T19, T20 / T20 / T21 / T21 · T4 / T4 |
| 4 | missing reason accepted / repeated reason accepted / stale reason accepted / reasons keyed by heading text | T5 (each) |
| 5 | empty evidence accepted / missing path accepted / `..` accepted / `\` not normalised | T6 (each) |
| 6 | missing row / repeated row / stale `at` / empty reason / a target without its own reason accepted · unresolved move target / unresolved share target / outcome keyed by row alone / a target resolved twice accepted · same lineage accepted without `same-family` · a purpose / an outcome / a section reason without a claim verdict accepted / a repeated claim verdict / stale claim text / an empty claim reason accepted / reserved nodes demanded · a rejected claim named in no question accepted | T7 ×5 · T8 ×4 · T9 · T22 ×7 · T23 |
| 7 | missing `placed` reason accepted / Evidence path existence ignored · cap removed / missing `--out` accepted / the key check skipped at one level, once per T13 level / question without recommendation accepted | T10 / T10 · T11 / T12 / T13 ×18 / T13 |
| 8 | questions after the table / proof line omitted / status mix omitted / gap evidence omitted / claim counts omitted · same-family printed as another lineage | T14 ×5 · T15 |
| 9 | moved row IDs omitted / share verdicts omitted / share outcome printed per row, not per target / rejected claims omitted / text-placed list omitted / appendix before the lists | T16 (each) |
| 10 | regroup paragraph drops the placement review / drops the claim review / drops "only after the owner's yes" / shows `--verify <base>` without `--mapping` / shows a flag the source lacks · a row added without the literal | T17 ×5 · T18 |

Kept green: the rest of the lift suite, R-1162's three move-line tests included (`:178`, `:228`, `:1214`).

**Seat acceptance** (copies in the seat's scratch, never the projects; seen failing at the base). Each run records runs, wall clock, packet words and minutes against its budget (§7 J2), naming any overrun.
- basketball-geek's HEAD copy, end to end on a Claude Code seat: check exits 0; the lift proves; in a scratch git copy, `--write`, commit, `--verify <base> --mapping <proposal>` exits 0.
- aml-desk's copy, straight from flat: check exits 0; both `## 36b.` sections print apart, each with its reason; §36's lane notes land where residual 3 says.
- **Blind rehearsal (grouping quality, measured, not gated).** nana-pi's pre-tree ledger (`5b68a91`, 1,004 rows, 0 share lines, Ran), a `git archive` without `docs/reviews/` in the
  seat's scratch. Run it in a pi worker session (`NANA_ROLE=worker` turns the knowledge pull off; pi has no shared auto-memory), never a Claude Code session in nana-pi: the knowledge
  index holds `docs/requirements-tree.md`, Jake's ruled tree, and project memory names it (FR E). Score R rows only; the lift forces G rows into the seed subgroups while Jake's tree
  keeps them in FEAT-033. Score = share of rows whose drafted feature's majority ruled feature is their ruled feature; also at capability level. **Pass mark: feature ≥ 85% and
  capability ≥ 93%** (chosen: the test-file signal alone, the drafter's own first step, scores 85.9% and 94.1%, C §2, so the judgment steps must not do worse). Record both scores
  before and after the placement review, and each role's billed tokens from pi's usage (§6's multipliers). Budget: 60 minutes (chosen: the largest accepted, for the most rows).
- Suite: `npm run test:locked`, `map:check`, `readme:check`, `node scripts/requirements-tree.mjs --check`, `node scripts/requirements-trace.mjs`, and an empty merge-base diff on
  §3.6's files. Windows: nothing runs there before the land; CI's Git Bash leg runs after it and is non-blocking (`.github/workflows/ci.yml:50`, `:53`).

**The claim most likely wrong:** that aml-desk's packet, about 10,000 words, half of it the 174 text-placed rows, fits its 45–60-minute budget (the 17,742-word appendix, FE, is outside). The
precedent's 9,518-word packet was planned at 20 minutes, but Jake's actual minutes were never recorded (B, "Not read"). The rehearsal and the first checkpoint record them against it.

## 6. Cost per project (all INFERRED, anchored on the nana-pi precedent)

**Raw input** = what each run reads once, at about 4 characters a token (Ran, sizes read-only): read sets aml-desk 450 KB (FE §5), trading-zone 271 KB, basketball-geek about
170 KB, 5b68a91 about 1.1 MB; ledgers 258, 86, 72 and 452 KB. Drafters together read the read set once; reviewers, and likewise skeptics, the ledger once plus the proposal per
run (about 12% of the ledger: aml-desk's emitted mapping is 31 KB, Ran); the critic every verdict (about the ledger) and the proposal. **Billed** = each role's raw input × its
re-read multiplier, as each agent turn re-sends its context: drafter ×5, reviewer ×3, skeptic ×3, critic ×2 (chosen, INFERRED; the rehearsal measures them). Runs = the four roles summed.

| Project | Rows | Drafters | Reviewers / skeptics / critic | Agent runs | Raw input tokens (drafters / reviewers / skeptics / critic) | Billed input tokens | Wall clock | Packet words (before appendix) | Owner minutes (budget) |
|---|---|---|---|---|---|---|---|---|---|
| aml-desk | 365 | 6 (one per Part) | 5 / 5 / 1 | 17 | about 0.39M (113k / 103k / 103k / 72k) | about 1.3M | 4–6 h | about 10,000 | 45–60 |
| basketball-geek | 165 | 1 (its draft exists) | 2 / 2 / 1 | 6 | about 0.11M (43k / 22k / 22k / 20k) | about 0.39M | 2–3 h | about 4,000 | 20–30 |
| trading-zone | 197 | 1 | 3 / 3 / 1 | 8 | about 0.15M (68k / 29k / 29k / 24k) | about 0.56M | 2–3 h | about 4,100 | 20–30 |
| rehearsal (5b68a91) | 1,004 | 4 (one per Part) | 12 / 12 / 1 | 29 | about 0.96M (278k / 276k / 276k / 127k) | about 3.3M | 6–8 h | about 10,000 | 60, the largest (the seat reads) |
| nana-pi precedent | 1,009 | astra, one draft | 12 / 14 / 1 | 27, plus 11 builder runs | not recorded | not recorded | about 22 h | 9,518 | about 20 planned for the last packet; never recorded |

The precedent's 22 hours included building its move and proof scripts, now the lift; scaling it by rows (8 h, 3.6 h, 4.3 h) is the upper bound. Owner minutes = packet words
at 238 a minute (FE §1) plus one amendment round; Jake accepted them as the budget (§7 J2). Weakest guesses: rows per drafter, batch size, the re-read multipliers.

## 7. Decisions and residuals (each becomes one HANDOFF line)

**Jake's decisions (product; non-blocking, the build starts on the recommendations).**
- **J1 What the agent reads.** Rec: §3.5 step 2. Not session archives or review corpora. Why his: it defines "grounded in the repo" for every project.
- **J2 The owner's packet — RULED by Jake 2026-10-15: "Short package".** As recommended: reproduce the packet he approved for nana-pi (B §3, §6 item 7; planned there at 15–20 minutes),
  in §3.4 item 3's order, row list only as an appendix. **Budget:** the owner minutes Jake accepted with §6's table (aml-desk 45–60, basketball-geek and trading-zone 20–30); runs
  report words, minutes and any overrun; nothing enforces it. Expected: aml-desk about 10,000 words (42 minutes), basketball-geek about 4,000 (17). Why his: he reads it.
- **J3 The checkpoint form.** Rec: one checkpoint, after the every-row review his 2026-10-10 ruling requires; answers by number in chat; approval is the proposal committed
  with his words quoted. Why his: it sets his review time per project.
**Decided by Jake's rulings, applied here.** Every placement reviewed by a different lineage before he sees the packet (2026-10-10). Shares in scope (2026-10-10), as the
parallel GATE lane `regroup-shares`; this lane carries shares as a verdict and a packet section.
**Seat decisions (declared, not asked).** S1 The proposal is a lift mapping plus one `regroup` object. S2 Move-only; gaps hold no rows and need evidence. S3 One reason per line
the lift reports, keyed by old line. S4 The checker spawns the lift's dry run and imports `detectMoves`. S5 The page is regenerated; the committed proposal is the approval
record. S6 One paragraph in the requirements skill. S7 Applies to the committed ledger, flat or lifted. S8 `\` in evidence paths becomes `/`. S9 Rows in FEAT-028 and FEAT-032;
no FEAT-040, no tree change. S10 Class FORMAT, Sonnet builder. S11 The every-row and claim reviews are structured and counted, `same-family` when no second lineage exists.
**Residuals and carries.**
1. The checker proves form, grounding and review coverage, not good grouping or true claims; the rehearsal is one data point. A same-family review is weaker, and the packet says so.
2. Until `regroup-shares` lands, a proposal cannot carry shares; upheld share targets wait in one question, and only T8's direct call pins the carried outcome.
3. Lift residual 2 stands: a split section with prose between table fragments puts that prose above one table (aml-desk §36). Prose moves only as whole sections (A §4).
4. FEAT and SUB IDs cited in HANDOFF, briefs and corpora go stale when a regroup merges them; the lift prints each merge, and nothing rewrites citations.
5. A failed run removes an earlier review page at `<page>` but leaves any other file there; a copy of a page saved elsewhere survives, and its header's proposal hash tells it apart.
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

## Plan review r1 (2026-10-15)

sol, SEND-BACK (`sol-plan-r1.md`). Counts after: 12 rows (R-1184 new), leaf total 1,148, 23 tests, 80 mutation pairs. Also: R-1170's second `shall` removed, so each row has one.
1. MUST, nested key typos: R-1177 holds every object to its level's keys in `PROPOSAL_KEYS`, naming the path; T13 covers 18 levels, one mutation pair each (§3.3).
2. MUST, mixed share outcomes: R-1175 gives each move or share target its own reason and one outcome keyed by row and target; R-1179 prints each; T7, T8, T16.
3. MUST, unreviewed purposes and reasons: new R-1184, one counted accept or reject per purpose, outcome and section reason, quoting it; rejects go to questions; T22, T23.
4. MUST, `--out` over an input: R-1171 writes only when `<page>`'s real path is none of the run's inputs (the review record lives in the proposal); T19 (direct path), T20 (symlink alias).
5. SHOULD, packet length: the budget is the owner minutes Jake accepted with §6's table; runs report words, minutes and overruns. Not enforced, by the seat's ruling (J2, §5).
6. SHOULD, stale page: a failed run removes an earlier review page and touches no other file (R-1171, T21 starts with one); residual 5 rewritten.
7. SHOULD, token method: §6 shows raw input per role and billed tokens apart, with each role's re-read multiplier; the rehearsal measures the multipliers.

## Seat amendment (2026-10-16): the trace rail's citation split

Build brief 2 item 1 told the builder to read an Evidence cell "exactly as the trace rail reads it … import it, never copy
it". The rail's split was inline in `loadRequirements`, so build 2 moved it unchanged into an exported `citesOf` in
`templates/typescript/template/tests/requirements-trace.ts`, called it from `loadRequirements`, and re-exported it from
`scripts/requirements-trace.mjs`. No behaviour changes: the same expression, the same trim and the same placeholder drop.
§3.6 froze `templates/`; this amendment adds those two files to §4 In for that extraction only. A new project rendered
from the next template tag gets the extra export. Acceptance checks that the template's diff is that extraction and
nothing else.

## Seat amendment 2 (2026-10-16): shares in the review record, now that regroup-shares has landed

Reopened under the plan rule that only a named fail-open bug reopens a frozen plan. The seat's independent check of build 2
(`seat-verify-228f37c.md`, the merge findings) merged main `2dbc817` into the build and found this: a proposal can add or
drop a share (`shares_added`, `shares_dropped`) with no share verdict. The lift applies it, the checker exits 0, and the
owner's page never shows it. A refuted move target can also be added as a share while the page reads "refuted", and
`--write` then writes the share. The owner's 2026-10-10 ruling put every placement, shares included, under one review.

**Rows.**

| ID | Change | Text |
|---|---|---|
| R-1187 | added, FEAT-028, after R-1184 | The regroup checker shall refuse a proposal unless each row a feature's `shares_added` or `shares_dropped` names has a `share` verdict with that feature among its targets. |
| R-1178 | reworded | The review page shall open with the proposal's SHA-256, the lift's pin and proof line, the drafter's and reviewer's lineages — reading "same-family review" when they match — and the placement and claim verdict counts, then list the numbered questions each with its recommendation, one table of every feature with its label, status, row count and status mix, and every capability, feature and subgroup with its label and purpose as the lift will write them, each capability's outcome and each proposed feature's evidence paths. |
| R-1179 | reworded | After R-1178's parts, the review page shall list each line R-1170 reports with its reason and moved row IDs, each move and share target by row and target, marked move or share, with its own reason and outcome — carried, refuted, or asked with its question's number —, each rejected claim with its reason, each text-placed row's ID, opening `GIST_WORDS` words, home and reason, and only then an appendix of every row's ID and requirement text under its new node. |

R-1187 needs no outcome clause of its own. R-1175 already demands exactly one outcome per target, and "carried" means the
row sits in that feature's `also_applies` for a `share` verdict. So an added share's target is carried, and a dropped
share's target, which the lift has removed from `also_applies`, must be refuted or asked. A move target is never carried,
so a refuted move target that is also added as a share fails R-1187: its verdict is `move`, not `share`. R-1178 and R-1179
gain the label, status, "as the lift will write them" (the reserved nodes' seed text, never blanks or proposal text the
lift ignores) and the move-or-share mark. These close the check's reserved-node and target-list findings. Leaf total:
main's 1,139 (the shares rows included) plus the 12 regroup rows plus R-1187 = **1,152**.

**Tests** (exact titles; `// req:` above each):
- T10 (the shares plan's title, verbatim) · `// req: R-1177` · `R-1177: a proposal whose feature declares shares_added and shares_dropped holds no unknown key and passes the regroup checker`.
- T24 · `// req: R-1187` · `R-1187: a share added or dropped with no share verdict targeting its feature is refused, an added one with that verdict passes as carried, and a dropped one passes only refuted or asked` (a tree-form fixture, since only a tree ledger can drop a share; each refusal asserts R-1187's own message).
- T14 and T16 keep their titles; they gain the reserved nodes' seed text, labels, feature status and the move-or-share mark.

**Wrong code first.** R-1187's check dropped (T24); the check applied to `shares_added` only (T24, dropped case); applied to
`shares_dropped` only (T24, added case); `move` accepted in place of `share` (T24); reserved nodes printed from the proposal
(T14); the move-or-share mark dropped (T16); `PROPOSAL_KEYS` lacks `shares_added` / `shares_dropped` (T10 ×2).

**Threat model and class** are unchanged: honest variation in scope, forgery out; format lane. Not reopened: anything else
in this plan.

### Plan review r3 on amendment 2 (2026-10-16): sol, SEND-BACK (`sol-plan-r3.md`); the seat's answer

1. MUST, a refused move and an accepted share for one row and target. Declined, with a test. The review record judges the
   proposal as it stands, as before this amendment: one verdict per row, one outcome per (row, target). When the reviewer
   refuses a move to FEAT-B and the drafter revises the row into a share to FEAT-B, the revised proposal holds a `share`
   verdict whose target is carried, and that verdict's reason records the refused move, as a resolved review comment does.
   Nothing reaches the ledger unreviewed, and nothing is refused that the revised proposal honestly holds. Keying outcomes
   by kind as well would change R-1175's frozen schema for a history the owner can read in the reason. The finding is not
   fail-open, and the plan item is at its three-round cap. So it stays a recorded decision, not a fourth round. Acceptance
   and T24 gain the case: a refused move replaced by a share to the same feature passes as a carried share.
2. SHOULD, unpinned page clauses. Accepted. Wrong code first gains: node labels dropped (T14); feature status dropped from
   the table (T14); the question number dropped from an asked target (T16). T14 and T16 assert each. The page writes an
   asked target as `asked in question <n>`.

## Seat amendment 3 (2026-10-16): a share that a merge moves to another feature is reviewed too

The seat's independent check of build 3 (`seat-verify-656dc86.md`) found a share reaching the ledger unreviewed. When a
proposal merges or demotes a feature that shares a row, the lift carries that share into the feature that absorbs it.
The lift reports no share change, because the share is carried, not declared. The checker then asks for no share verdict,
and the owner's page never names the share. The written ledger gains `Also applies: R-003` under a feature that never
shared R-003. Amendment 2 meant every share placement to be reviewed, and this one is not, so the seat names it a
fail-open bug and widens R-1187.

**Row.**

| ID | Change | Text |
|---|---|---|
| R-1187 | reworded | The regroup checker shall refuse a proposal unless each row that a feature's `also_applies` names and that the input ledger's feature of the same ID does not share, and each row its `shares_dropped` names, has a `share` verdict with that feature among its targets. |

"The input ledger's feature of the same ID" is read from the input ledger by the tree parser's share reader, the one the
lift and the shares proof use. A flat ledger shares nothing. So a declared added share, and a share a merge or demotion
moves onto another feature, both need a verdict, and R-1175 then demands its outcome. A share that stays on the same
feature needs none. A share that leaves with a merged-away feature ID is not a drop of a live feature, and needs no
verdict either. The page lists every such target under R-1179, so the owner sees it.

**Tests.** T24 keeps its title and gains the merge case and the demotion case: each is refused without a share verdict
and passes with one, and its page line reads `share` and `carried`.

**Review.** The plan item is at its three-round cap. This amendment is recorded here and named in the final review brief
for sol and astra, who review the whole lane, so it gets no separate plan round.

