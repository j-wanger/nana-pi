# Change declaration — tree: every new project starts with the requirements tree, and the checker and report run in any project

*Lane `tree` · `feat/tree` · `~/nana-pi-wt/tree`, from `main` `484329c` (roster landed) · 2026-10-14 · seat draft 2 (seat revision at the end; not reviewed). Features:
FEAT-014 SUB-019, FEAT-032, FEAT-028. New R-1150 to R-1161 (R-1160 and R-1161 added by the plan r1 revision); R-1162 to R-1169 held for lane `tree-lift` (§6); seat-guide takes R-1140 to R-1142. No reworded or
retired row, tree change in nana-pi, or share. Class FORMAT (it changes the ledger format every new project inherits): two plan-review rounds. Builder: Sonnet 5.5. No
`packages/nana-setup/` or hook change, so no install check. Evidence: the `research-*.md` and `factcheck-*.md` beside this file and the probe scripts in `probes/`; the
renders and other projects' ledger copies the probes read stay in the seat's scratch, uncommitted. Cites are at `484329c`; "Ran" means run on this Mac at `5b53ebc` (research) or `484329c` (fact-checks); INFERRED means not read or run.*

## 1. Why

Jake, 2026-10-13: "why does the default behavior today create requirements in row by row ears format instead of tree based design which we adopted?" He agreed: templates seed
the tree, the adopt step sorts a flat ledger into it, and the report runs in any project (`HANDOFF.md:74`; listed, unqueued, `req-tree-2026-10-09/CHANGE.md:292`).
**Trigger.** A Windows seat on a work project ran the report on its flat ledger. The report refuses any tree problem, one line per row (`scripts/product-report.mjs:205-206`).
Ran (`fc-ext/flat1000.mjs`): 1,000 flat rows give 1,005 lines and 54 KB on stderr, past Claude Code's 30,000-character inline window and pi 1.0.2's 2,000-line/50 KB cap
(`dist/core/tools/truncate.js:10-11`). The seat sees a cut-off wall and no next step.

**Where "flat" comes from (each read):**
- **The seeds.** `## 1. The product`, then `# Part G.` and `## G1.`–`## G5.` (`templates/python/template/REQUIREMENTS.md.jinja:75-89`,
  `templates/typescript/template/REQUIREMENTS.md.jinja:73-87`, `templates/_shared/requirements-general.md:13,23,33,46,54,62`). Ran: the checker finds 23, 22, 23 and 22
  problems on the four renders, every row "is not in a feature or subgroup table" (`scripts/requirements-tree.mjs:130`); a tree-shaped render finds 0, and both rails pass it
  (`research-templates.md` §3).
- **The skills.** Requirements audit workers cover "the numbered sections" (`packages/nana-pack/skills/requirements/SKILL.md:135`); the G block goes "at the end as its own
  Part" (`:163-166`, wrapped at `:165-166`); the tree rules are nana-pi text, "In this ledger…", "Jake decides" (`:126`). Scaffold: "one EARS `shall` row per behaviour"
  (`scaffold-py/SKILL.md:45-49`, `scaffold-ts/SKILL.md:45-49`); adopt: "extract EARS rows" (`adopt-py/SKILL.md:143-144`, `adopt-ts/SKILL.md:165-166`); adopt-structure: "add
  the standard `Part G` engineering block" (`:169`).
- **copier never rewrites an existing ledger** (`copier.yml:16`), so an adopted flat ledger needs a command step (lane `tree-lift`).
- **The commands.** The checker CLI reads only nana-pi's root and splits on LF only (`scripts/requirements-tree.mjs:15,390,61`; ran: a CRLF copy of nana-pi's ledger gives
  1,113 problems). The report takes `--root` (`product-report.mjs:310`) and exits 0 on another tree project (ran, `research-tree.md` §4).

**Threat model.** In scope is honest variation in our tools' output and our users' files: CRLF from Git for Windows, a BOM, a UTF-16LE file from Windows PowerShell 5.1 `>` or
`Out-File`, PowerShell or Bash, Node 22.18 or later, a project in a subfolder of a repo, a flat ledger, DRAFT placeholders left in, a hand-typed heading, and an old project
running `copier update`. Out of scope is deliberate forgery: a ledger built to fool the checker, forged stamps, a lying git.

**Frame and split.** Rows stay EARS (one `shall` each, counted by G-013); the tree only groups them, as in nana-pi (`REQUIREMENTS.md:5`, `:17-30`). Sorting an existing ledger
rewrites another project's contract file, so it gets its own lanes. **Lane `tree`** is text plus one script change, read-only everywhere: new projects start with the tree, the
checker and report run in any project that has one, and a project without one gets one line naming the next step. Lanes `tree-lift` and `regroup` follow (§6).

## 2. Requirement delta

Main's highest ID is R-1128. One `shall` per row.

| ID | Change | Text |
|---|---|---|
| R-1150 | added, SUB-019 after R-738 | Both copier templates shall render, in scaffold and in adopt mode, a REQUIREMENTS.md in which the requirements tree checker reports no problem and finds a capability and a feature besides CAP-90 and FEAT-900. |
| R-1151 | added, SUB-019 | Both copier templates shall render REQUIREMENTS.md with every G row homed in FEAT-900 under CAP-90, in subgroups SUB-900 to SUB-904, and no R row in FEAT-900. |
| R-1152 | added, SUB-019 | WHEN rendered in adopt mode, REQUIREMENTS.md shall carry a product feature whose `Status:` line reads `proposed` and which holds no row. |
| R-1153 | added, SUB-019 | The rendered REQUIREMENTS.md shall state that rows are grouped capability → feature → subgroup, that each new row goes in the table of the feature it serves, that the project owner decides every change to the tree, and the command that checks it. |
| R-1154 | added, FEAT-032 after R-657 | The requirements skill shall direct every new row, audit-extracted rows included, into the table of the feature it serves once the ledger has a tree, keep a ledger without a tree in its numbered sections and name a lift and then a regroup as its next step, and name the project owner as the one who decides tree changes. |
| R-1155 | added, FEAT-032 | The scaffold-py, scaffold-ts, adopt-py, adopt-ts and adopt-structure skills shall direct each row into the table of the feature it serves once the ledger has a tree, keep a ledger without a tree in its numbered sections and name a lift and then a regroup as its next step, and name no `Part G`. |
| R-1156 | added, FEAT-032 | The requirements skill shall name the tree check as `node "$HOME/nana-pi/scripts/requirements-tree.mjs" --root .` and the product report as `node "$HOME/nana-pi/scripts/product-report.mjs" --root .`. |
| R-1157 | added, FEAT-028 after R-294 | WHEN the tree checker command runs with `--root <dir>` and no other argument, it shall check only `<dir>/REQUIREMENTS.md` and read or write no outline, printing each problem on stderr with exit 1, and otherwise printing its problem, row and feature counts with exit 0. |
| R-1158 | added, FEAT-028 | The tree checker shall report the same problems, at the same line numbers, for a ledger with CRLF line endings as for the same ledger with LF line endings. |
| R-1159 | added, FEAT-028 | WHEN the tree checker reads a REQUIREMENTS.md that holds requirement rows but no capability or feature heading, it shall report one problem, which names the row count, says the ledger has no requirements tree yet and points to the requirements skill for the next step, in place of one problem per row. |
| R-1160 | added, FEAT-028 | WHEN a REQUIREMENTS.md holds a NUL byte or no requirement row, the tree checker command and the product report shall each refuse it with exit 1 and a named reason (for a NUL byte, that the file is likely UTF-16 and must be saved as UTF-8), the report writing no page. |
| R-1161 | added, FEAT-028 | WHEN a REQUIREMENTS.md heading starts with a capability, feature or subgroup ID but does not match the tree heading form, the tree checker shall report a problem naming that heading's line number and the expected form, in place of R-1159's no-tree problem. |

No row changes text or status; R-737, R-738, R-581, R-582, R-590, R-1012, R-1025 and R-1030 keep theirs. Through R-1025 the report refuses naming R-1159's one problem (plus
its header line). Leaf total: the base at branch time + 12 — 1,113 → **1,125** from `484329c`; 1,116 → **1,128** if seat-guide is on main first (§4). Headings stay 68.

## 3. Design

**3.1 The seeds (both languages).** Everything before `## 1. The product` stays, except that its `Part G` mentions (py `:45,:62`; ts `:43,:60`) become "the general-engineering
feature". Before `## 1.` goes a new ordinary `## How this file is organized`, adapted from `REQUIREMENTS.md:17-30,40-56` with no owner named and no outline: the capability →
feature → subgroup grouping, heading forms and `Purpose:`/`Outcome:`/`Status:` lines; every row in one table; "Add each new row to the table of the feature it serves."; new
features under the capability they serve, never CAP-90; product headings from CAP-01, FEAT-001 and SUB-001, with CAP-90, FEAT-900 and SUB-900–SUB-904 reserved for the
general-engineering block; unused IDs for new headings; "The project owner decides every change to the tree."; no rows in a `proposed` or `retired` feature; R-1156's checker
command.
- Scaffold: `## 1. The product` → `# CAP-01 · Use the package` (`Purpose:` and `Outcome: DRAFT — …`), `## FEAT-001 · Report the package version` (`Purpose: DRAFT — …`,
  `Status: active`), then R-001's table as today (py `:85-87`, ts `:83-85`).
- Adopt: `# CAP-01 · What the product does`, `## FEAT-001 · First feature` with `Status: proposed` and today's empty table; the audit names it, moves rows in and sets it
  `active` (R-294 allows a proposed feature with no rows). DRAFT purposes are the owner's to replace; the report shows them verbatim, and no check flags them (carry).
- Closing: `## Open questions` and `## Deliberate omissions` go under a new ordinary `# Open questions and deliberate omissions` (nana-pi's form, `REQUIREMENTS.md:1715`), so a
  feature appended after it fails nesting (R-290) instead of passing silently.

**Part G (`templates/_shared/requirements-general.md`).** `# Part G. …` becomes `# CAP-90 · Keep engineering promises checkable` with `Purpose:` and `Outcome:`, then
`## FEAT-900 · Adopt the general engineering requirements`, `Purpose:`, `Status: active`, then today's preamble prose. `## G1.`–`## G5.` become `### SUB-900`–`### SUB-904`,
keeping their labels, each with one `Purpose:` line. Tables and rows stay byte-identical. `REQUIREMENTS-general.md` gets the same headings (its jinja is only the include,
`REQUIREMENTS-general.md.jinja:1`); the rails are heading-blind (`research-templates.md` §3). Rejected: one flat G table as nana-pi's FEAT-033 (`REQUIREMENTS.md:1512`), which
needs two shapes from one include.
**Reserved IDs (seat decision).** The heading form `CAP-\d{2}`, `FEAT-\d{3}`, `SUB-\d{3}` (`requirements-tree.mjs:16`) accepts them as is. Why reserved:
`REQUIREMENTS-general.md` is not skip-listed (`copier.yml:13-20`), so copier-tracked projects get these headings on update, and the hand-built tree on this Mac already uses
`# CAP-02` and `## FEAT-002` for product. Ran (grep): no scanned project ledger (three) has a CAP-9x, FEAT-9xx or SUB-9xx heading. G stays last, before the closing heading.

**3.2 Tree checker (`scripts/requirements-tree.mjs`).** `parseLedger` splits on `/\r?\n/` after the BOM strip (`:61`); the outline stays LF. `checkTree` gains R-1159: rows and
no CAP or FEAT heading give one problem, built by an exported `noTreeProblem(rows)`: `REQUIREMENTS.md holds <n> requirement rows and no capability or feature heading: this
ledger has no requirements tree yet. The requirements skill describes the next step.` Ran (grep): no existing `checkTree` fixture has rows without a CAP or FEAT heading (the
SUB-only one, `requirements-tree.test.mjs:116`, has no row). **Plan r1 MUSTs (2026-10-14).** (a) R-1160: an exported `ledgerReadProblem(text, parsed)` returns `<path>: NUL byte; likely UTF-16 from Windows PowerShell
5.1; save it as UTF-8` for text holding U+0000, `<path>: no requirement rows` for a ledger with no `| R-`/`| G-` row, else null. Both `main --root` and the
report's `buildReport` call it before `checkTree` and refuse on a non-null result (exit 1, no page); nana-pi's own `--write`/`--check` call it too. It sits outside
`checkTree`, so the SUB-only no-row fixture (`requirements-tree.test.mjs:116`) keeps its problem set. (b) R-1161: `checkTree` reports every heading matching
`/^#{1,3}\s*(CAP|FEAT|SUB)-\d+/` that the heading parser (`:16`) rejects, as `line <n>: heading looks like a tree heading but is not in the form "# CAP-nn ·
Label"` (the form for its level); when there is any such heading, R-1159's no-tree problem is not reported. `main` takes `--root <dir>` as a third form. Then it prints problems to stderr with exit 1, or `requirements tree:
0 problems; rows <n>; features <f>` with exit 0, never touching an outline. `--write` and `--check` keep nana-pi's behaviour; any other shape prints the usage line (now naming
`--root <dir>`) with exit 2. No bin or PATH link: seats run `node "$HOME/nana-pi/…"` from the checkout (roster's form, `CHANGE.md:166-167`: PowerShell 5.1 expands `$HOME`, not
`~/`). The main guard (`:407`) is unchanged (§6).

**3.3 Product report.** One change: `buildReport` calls `ledgerReadProblem` first (R-1160). Otherwise it refuses any `checkTree` problem before it reads HANDOFF.md or calls git (`:205-206`, R-1025), so a ledger with no tree
now refuses with the header line and R-1159's line, exit 1.

**3.4 Skills (text only).** `requirements/SKILL.md:126` becomes generic: once the ledger has a tree, rows go into the table of the feature they serve, never a numbered section
or a separate Part. "The project owner decides every change to the tree"; the seat proposes and declares it. New headings take an unused ID and a `Purpose:` line; the reserved
IDs are the general-engineering block's; `## Open questions` stays. It names R-1156's two commands and says the report needs the tree, HANDOFF.md and git. Audit mode (`:135`)
drafts by feature under capabilities; `:163-166` says the seed's general-engineering feature already holds the G rows. The ID-block advice (`:148-151`) stays.
- **Flat-ledger carve-out (all six skills):** "A ledger without a requirements tree keeps its numbered sections; its next step is a lift into the tree, with every row kept
  byte-identical, then a regroup into capabilities and features that the owner approves." It names no command yet. The requirements skill also explains R-1159's line.
- The Claude Code seat gets only the requirements skill (`packages/nana-setup/lib/steps.mjs:58`); the scaffold and adopt skills are pi-only
  (`packages/nana-setup/README.md:178`). So the requirements skill carries the whole rule.
- scaffold-py and scaffold-ts (`:45-49`): each row goes "in the table of the feature it serves"; rename the seed's DRAFT capability and feature first. adopt-py and adopt-ts
  (`:143-144`, `:165-166`) say the same, and that a pre-existing REQUIREMENTS.md follows the carve-out. adopt-structure (`:169`) drops "add the standard `Part G` engineering
  block". Every `Part G` in the five (scaffold `:15-16,:46`; adopt-py `:53,:141,:148`; adopt-ts `:69,:163,:170`) becomes "the general-engineering feature".

**3.5 What NOT to do.** Leave unchanged: the shared working section, AGENTS.md, CLAUDE.md, nana-soul, `copier.yml`, both rails, `packages/nana-setup/**`, the pack's bin list,
`handoff-asks.mjs`, every part of `scripts/product-report.mjs` except `buildReport`'s one `ledgerReadProblem` call (R-1160, §3.3), `template.html`, both main guards, nana-pi's tree headings, the assessments store. Add no project-suite tree gate, no project
outline, no lift, no `Also applies:` in seeds.

## 4. Scope

**In.** Code: `scripts/requirements-tree.mjs`; `scripts/product-report.mjs` (`buildReport` calls `ledgerReadProblem`, R-1160). Templates: both `REQUIREMENTS.md.jinja`, `templates/_shared/requirements-general.md`. Skills: requirements, scaffold-py,
scaffold-ts, adopt-py, adopt-ts, adopt-structure. Tests: `templates-render.test.mjs`, `requirements-tree.test.mjs`, `product-report.test.mjs` (`packages/nana-pack/tests/`).
Docs: `README.md` `:64` gains the checker's `--root`; `:243` gains "on any nana project with the tree:" and the R-1156 report form. Also `REQUIREMENTS.md`,
`docs/requirements-tree.md`, `docs/code-map.md`, the session entry, the corpus, and `HANDOFF.md`: `:46` drops "The tree checker still splits lines on LF without CR handling
(the Windows lane).", and the `:74` "Now:" line becomes a landed line plus §6's queue lines. HANDOFF and session go in before the final round.
**NOT.** Everything in §3.5; downstream projects; a template tag by hand (CI cuts it after green on main, `AGENTS.md` Layout).
**Overlap with lane `seat-guide`** (`feat/seat-guide`, `~/nana-pi-wt/seat-guide`, in flight at `7306142`; its `CHANGE.md:4,36-40,97-111`):
- Shared: the SUB-019 table (seat-guide adds R-1142 after R-1127; this lane adds R-1150–R-1153 after R-738), `templates-render.test.mjs` (separate blocks), R-291's literal
  (`requirements-tree.test.mjs:38,52,53`), the outline, the code map, HANDOFF and the session file. Not shared: the working section, AGENTS.md, `packages/nana-setup/`.
- R-291's literal: the build reads the base total at branch time and adds 12. Seat-guide not on main: 1,113 → 1,125. Seat-guide on main first, or merged in before the land:
  1,116 → 1,128. After any merge of main, the outline and code map are regenerated.
**Release.** New projects get the tree from the next CI tag after the land. Existing projects keep their REQUIREMENTS.md (`copier.yml:16`); on update their
`REQUIREMENTS-general.md` gains the new headings (R-582 covers the rail). The Windows Claude Code seat's requirements skill is a byte copy (`steps.mjs:218-226`), stale until
`nana-setup install` re-runs (doctor flags it); HANDOFF gets a line for Jake (§6).

## 5. Verification

Exact titles under `// req:` lines, red before the code, frozen in `seat-titles.mjs` (DONE = `0 missing`). `${language} ${mode}` titles follow R-737's form
(`templates-render.test.mjs:172`); `R-nnnn:` prefixes follow `requirements-tree.test.mjs`. Phrase checks run on whitespace-collapsed text, so a wrapped line cannot hide a
phrase. Oracles import `checkTree` and `noTreeProblem` by name. R-1156's checker string is asserted in T4 and T7; its report string in T7 only.
- **templates-render.test.mjs**, in the four render loops beside the `partG` calls (`:488`, `:672`):
  - T1 · R-1150 `${language} ${mode}: REQUIREMENTS.md passes the requirements tree checker` (0 problems; a CAP other than CAP-90 and a FEAT other than FEAT-900).
  - T2 · R-1151 `${language} ${mode}: every G row is homed in FEAT-900 under CAP-90 with no R row` (22 G rows, via SUB-900–SUB-904). The one test pinning the reserved IDs.
  - T3 · R-1152 `${language} adopt: the product feature is proposed and holds no row`.
  - T4 · R-1153 `${language} ${mode}: REQUIREMENTS.md says how rows are grouped, where a new row goes, who decides and how to check` (phrases: `capability → feature →
    subgroup`; `Add each new row to the table of the feature it serves`; `The project owner decides every change to the tree`; the R-1156 checker command).
  - T5 · R-1154 `requirements skill directs every row into the feature it serves, keeps a flat ledger's sections and names the owner`. Present: `The project owner decides
    every change to the tree`; `A ledger without a requirements tree keeps its numbered sections`; `then a regroup into capabilities and features that the owner approves`.
    Absent: `Jake decides`; `In this ledger,`; `the numbered sections the worker must cover`; `at the end as its own Part`.
  - T6 · R-1155 `scaffold and adopt skills direct rows into the feature each serves, keep a flat ledger's sections and name no Part G`. Each of the five: present `the table of
    the feature it serves` and T5's two carve-out phrases; absent `` `Part G` ``. Ran (grep): the base skill text holds every absent phrase of T5 and T6 and no present one, so
    both red on the base, T6 per skill.
  - T7 · R-1156 `requirements skill names the tree check and the product report with a project root` (both exact strings).
- **requirements-tree.test.mjs** (each spawns the checker CLI on temp dirs):
  - T8 · R-1157 `R-1157: --root checks another project's ledger, names its problems and writes no outline`. A tree ledger: exit 0, stdout `requirements tree: 0 problems; rows
    1; features 1`, no `docs/` created. With one row outside its feature: exit 1, stderr names `is not in a feature or subgroup table`. `--root <dir> --write`: exit 2.
  - T9 · R-1160 `R-1160: --root refuses a UTF-16 ledger and a ledger with no rows, naming the reason`. T8's tree ledger saved as UTF-16LE with a BOM: exit 1, stderr names the
    NUL byte and UTF-16. A tree with headings and no row: exit 1, stderr says no requirement rows. Neither prints `0 problems`.
  - T10 · R-1158 `R-1158: a CRLF ledger gives the same problems and line numbers as its LF copy` (a two-problem fixture, and the real ledger as CRLF giving 0 problems and 68
    headings). It normalises to LF before building the CRLF copy, so it never builds `\r\r\n`.
  - T11 · R-1159 `R-1159: a ledger with rows and no tree gets one line naming the row count and the next step`. 1,000 rows under plain `## 1. …` headings: exit 1; stderr, less
    Node's own `(node:` warning lines, is one line naming `1000 requirement rows`, `no requirements tree yet` and `requirements skill`; no per-row line.
  - T15 · R-1161 `R-1161: a tree heading typed with "-" for "·" is named with its line and the expected form, not taken for a flat ledger`. A tree ledger
    whose CAP and FEAT headings use ` - `: exit 1; stderr names both headings' line numbers and `·`; no `no requirements tree yet`; no per-row line for its rows' table.
  - T12 · R-291 rename: `…leaf counts total 1,113` → the base + 12 (§4; title, `:52`, `:53`).
- **product-report.test.mjs.** T13 · R-1159 `a ledger with rows and no tree is refused with one problem line, not one per row`. It spawns `node scripts/product-report.mjs
  --root <tmp>` on T11's ledger, with no HANDOFF.md and no git: exit 1; R-1159's line once with T11's three phrases; no per-row line; no page. The spawn exercises the Windows
  leg's main guard and `.ts` import. T14 · R-1160 `a UTF-16 ledger and a ledger with no rows are refused by the report, naming the reason, and build no
  page`: spawns the report on T9's two ledgers; exit 1, the reason named, no output file.

**Wrong code first.** Each pair edits code or text, never an assertion, and must red exactly the named titles (N/N in `seat-mutate.mjs`).

| # | Wrong code | Reds |
|---|---|---|
| 1 | a seed keeps `## 1. The product` (one language) | T1 (that language, both modes), T3 (that language) |
| 2 | the include keeps `# Part G.` and `## G1.`–`## G5.` | T1 (all four), T2 (all four) |
| 3 | G1–G5 become five `## FEAT-90n` headings, each with `Purpose:` and `Status: active` / Part G numbered CAP-02, FEAT-002, SUB-001–SUB-005 | T2 (each) |
| 4 | adopt FEAT-001 reads `Status: active` | T3 |
| 5 | SUB-903 loses its `Purpose:` line | T1 (all four) |
| 6 | the seed says "Jake decides" / drops "the feature it serves" / writes `~/nana-pi/` | T4 (each) |
| 7 | requirements skill keeps "Jake decides tree changes" / drops the carve-out / keeps "at the end as its own Part" | T5 (each) |
| 8 | adopt-structure keeps "add the standard `Part G` engineering block" / scaffold-ts drops "the table of the feature it serves" / adopt-py drops the carve-out | T6 (each) |
| 9 | the skill writes `~/nana-pi/scripts/product-report.mjs` | T7 |
| 10 | `--root` ignored (reads `REPO_ROOT`) / `--root` also compares the outline / `--root --write` accepted | T8 (each) |
| 11 | the NUL check dropped / the no-row check dropped (in `ledgerReadProblem`) | T9, T14 (each) |
| 11b | `buildReport` skips `ledgerReadProblem` | T14 |
| 11c | the near-miss scan dropped / it matches CAP headings only | T15 (each) |
| 12 | `parseLedger` splits on `"\n"` only | T10 |
| 13 | `checkTree` keeps one problem per row with no tree / the no-tree rule fires only when the ledger has no heading at all | T11, T13 (each) |
| 14 | the no-tree line drops its row count | T11, T13 |
| K1 | a G row dropped from the include | the existing `${language} ${mode}: Part G ships G-001..G-022 unrenumbered` (R-737) |
| K2 | the adopt seed emits R-001 under FEAT-001 | T1 (R-294), T3, the existing `${language} adopt: no product row is invented` |
| K3 | R-1156's command written with a bare `.mjs` path token | the existing R-598/R-629 skill-claim titles (INFERRED; the run confirms) |

**Seat acceptance.**
- Render all four modes at the lane tip (copier `--vcs-ref HEAD`); `node scripts/requirements-tree.mjs --root <render>` exits 0 on each and its CRLF copy, and 1 with one line
  on a flat project ledger here (read-only). Commit the Python scaffold render to a new repo; `node scripts/product-report.mjs --root <render> --out <outside it>` exits 0.
- Suite: `npm run template:accept`, `npm run test:locked`, `map:check`, `readme:check`, `node scripts/requirements-tree.mjs --check`, `node scripts/requirements-trace.mjs`; an
  empty merge-base diff on §3.5's files.
- Windows: the draft PR's non-blocking Windows leg must show T8–T11 and T13 PASS; it runs Git Bash (`ci.yml:51-53`), never the PowerShell `$HOME` form. A failure narrows
  README `:243` and the skill text to what passed.

**The claim most likely wrong:** that a Windows seat can run `node "$HOME/nana-pi/scripts/product-report.mjs" --root .` as written. It needs Node ≥ 22.18 for the `.ts` rail
both scripts import (`requirements-tree.mjs:13`; README `:80`), git on PATH once the ledger has a tree (`product-report.mjs:203`), and a main guard (`:318`) matching the typed
path. None has run on Windows; T13 on the Windows leg decides the first and third, for CI's Node only. Next: that `copier update` shows the general file's new headings as a
clean change (INFERRED; R-582's update test decides).

## 6. Ruling, decisions, residuals (each becomes one HANDOFF line)

**Jake's ruling (2026-10-14) on what "sort" means for an existing project:** "Lift is the tool that enables better regroup, but this is a core feature for nana, understanding
existing repo and turn into feature trees, then development really becomes feature oriented". No question for Jake stays open here. The queue it implies:
1. Lane `tree` (this declaration): scope unchanged.
2. Lane `tree-lift`: one apply-with-proof tool, `scripts/requirements-lift.mjs --root <dir>`. It applies a mapping (old ledger line → tree position, plus inserted headings and purposes) to REQUIREMENTS.md and proves every row kept byte-identical and the ID set equal; its default mapping is the mechanical one (sections → features, "Not yet sorted", Part G → §3.1's reserved shape). Plan and proof by default; `--write` after the owner's yes, only while the file matches HEAD. Draft rows R-1162–R-1169; class GATE.
3. Lane `regroup`, the core nana feature: a skill and workflow that reads an existing repo (code, docs, tests, the ledger), proposes capabilities → features → subgroups with purposes, maps every row, and lists features with no rows as `proposed`; the owner approves at a checkpoint; lane `tree-lift`'s tool then applies the mapping.
4. Feature-oriented development: req-tree §8 item 2 (`req-tree-2026-10-09/CHANGE.md:284-287`): the brief declares its Feature, the review and session name it, and the land reports a structure diff.

**Seat decisions (declared, not asked).**
- S1 Order: `tree`, then `tree-lift`, then `regroup`; `tree` fixes the default Jake asked about and settles the CRLF handling and Part G shape the lift reuses.
- S2 Part G: one feature, five subgroups, reserved IDs, last before the closing heading (§3.1). S3 No tree gate in project suites yet (Python CI would need Node). Carry.
- S4 The Decisions view stays empty in projects: asks are read only under "Open for Jake" (`handoff-asks.mjs:11`); the seed HANDOFF has `## Open`
  (`templates/_shared/HANDOFF.md:11`). An untagged "Open for Jake" item makes the report refuse (R-1030; `product-report.mjs:210-213`). Carry both.
- S5 Commands run from the checkout's `scripts/` with `--root`; no bin, PATH link or nana-setup change. S6 No shared-section or AGENTS.md edit. S7 Rows stay EARS.
- S8 Row homes: SUB-019, FEAT-032, FEAT-028; no new heading or share. S9 Projects say "the project owner" (Jake owns them); nana-pi keeps "Jake" (`REQUIREMENTS.md:34`).
- S10 The adopt seed's feature is `proposed`; purposes start "DRAFT —". S11 CRLF is handled in `parseLedger` only. S12 Projects get no outline. S13 R-1159 and R-1161 sit in `checkTree`; R-1160 sits beside it, shared by the CLI and the report.

**Residuals and carries.**
1. Until `tree-lift` lands, a flat ledger still cannot run the report; it now gets R-1159's line and the skill's next step. A hand sort has no proof.
2. `--packets` fails for a project in a subfolder of a repo: `git show <sha>:REQUIREMENTS.md` resolves from the repo top (`product-report.mjs:263,271`), and `validateStore` makes the same call (`:177`). The fix is `<sha>:./REQUIREMENTS.md`. Carry.
3. The report's h1 and `<title>` name nana-pi in every project (`product-report.mjs:76`; `template.html:6`). Its Google Fonts fall back offline (INFERRED). Carry (cut from this lane).
4. A second report run labels the tree dirty when its output, whose default name says nana-pi (`:22`), sits untracked in the project (`:218`). Workaround: pass `--out` outside the project root. Carry (cut from this lane).
5. The report prints a `MODULE_TYPELESS_PACKAGE_JSON` warning on stderr every run (ran); the checker prints none, since `process.exit` (`:407`) runs first. Already deferred (product-report CHANGE §6).
6. Through a symlinked or junctioned checkout, both main guards (`requirements-tree.mjs:407`, `product-report.mjs:318`) exit 0 silently on any argument (ran). Pre-existing; not fixed here.
7. (Closed by plan r1: R-1160 covers the report.)
8. (Closed by plan r1: R-1161 names a near-miss heading.)
9. nana-pi's `--check` and R-291's test compare the outline raw (`:397-398`; `requirements-tree.test.mjs:34`); a CRLF checkout of nana-pi fails them. Test-portability lane.
10. The hand-built tree with 29 problems on this Mac needs a hand fix in its own lane: Part G under one feature, four features moved above it, two `Status:` lines added.
11. A feature inserted just above the closing heading nests silently under CAP-90; a check for a capability mixing G and R features belongs with S3's gate.
12. A Claude Code seat, or a project in neither template language, has no seed route: `nana-setup project` writes no REQUIREMENTS.md (`packages/nana-setup/README.md:198-203`). Carry.
13. Each seed freezes R-1156's `$HOME/nana-pi` checker command into a skip-listed file; a later PATH link will not reach it (`factcheck-external.md` §5). Carry.
14. HANDOFF line for Jake, written before the final round: re-run `nana-setup install` on the Windows Claude Code seat so its requirements skill copy updates.

## Seat revision (2026-10-14)

1. Base `main` `484329c`; roster overlap removed, seat-guide overlap named; R-291's literal is base + 10 in both land orders; stale cites refreshed; tag "the next CI tag after the land".
2. Cut the draft's R-1159 (report title) and R-1160 (clean-check exclusion) as scope creep; both are §6 carries, with the `--out` workaround.
3. New R-1159: rows and no tree give one problem line naming the row count and the next step, in the checker and through the report (T11, T13; pairs 13–14).
4. R-1157 refuses a ledger with a NUL byte (UTF-16) or no rows; UTF-16 joins the threat model (T9; pair 11). The symlinked main guard is a carry.
5. Part G takes reserved IDs CAP-90, FEAT-900, SUB-900–SUB-904 (the checker accepts them as is); G stays last before the closing heading; J2 is a seat decision.
6. All six skills gain the flat-ledger carve-out (lift, then regroup; no command named); T5/T6 red on the base; the Claude Code seat gets only the requirements skill; Windows needs a reinstall.
7. T1 needs a product capability and feature, so pair 1 reds T1 in adopt mode; K3 cites R-598/R-629; residuals 2 and 5 corrected; acceptance uses `--check`; R-1156's checker string is in T4 and T7.
8. J1–J4 are seat decisions with carries. Jake ruled on the sort question (2026-10-14); §6 records the ruling and its four-lane queue.
9. R-1153 keeps "the project owner decides"; nana-pi keeps "Jake".
10. Class FORMAT (two plan-review rounds); builder Sonnet 5.5.

## Plan review r1 (2026-10-14)

sol SEND-BACK with two MUSTs, both folded in above: (1) UTF-16 and no-row ledgers failed open through the report, since
`buildReport` calls `checkTree` directly — R-1160 moves the refusal into a shared `ledgerReadProblem` that the checker
command and the report both call (T9, T14; pairs 11, 11b); (2) a tree typed with `-` for `·` read as a flat ledger and
got the wrong next step — R-1161 names each near-miss heading and suppresses R-1159 (T15; pair 11c). Rows R-1160 and
R-1161 are new; tree-lift keeps R-1162 to R-1169. Leaf total base + 12.

## Plan review r2 (2026-10-14)

sol SEND-BACK with one MUST: §3.5 still listed `scripts/product-report.mjs` as unchanged and §4 left it out of scope,
contradicting R-1160's report fix — a builder following the scope would leave UTF-16 reports failing open. Fixed: §4 In
names the report's one change and §3.5 excludes every other part of it. Its NOTE: residual 8 is closed by R-1161 and now
says so. Round 3 (over the format lane's two-round plan cap, for this named fail-open finding) reviews only this delta.

## Plan review r3 (2026-10-14)

sol LAND (`sol-plan-r3.md`): round 2's MUST is closed. The plan is frozen at this commit.
