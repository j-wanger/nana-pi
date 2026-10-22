# Research B — nana-pi's tree and report, and what keeps them repo-local

Stakes: medium blast — the checker gates nana-pi's suite (R-287–R-294) and would gate every project; the report is a
read-only seat tool. Main `5b53ebc`; roster tip `484329c`. Probes: macOS, Node v22.22.2, `plan-tree/probe/`.

## 1. Answers in brief

- Checker core is generic: `checkTree(text)` is pure (scripts/requirements-tree.mjs:382-386); only its CLI is tied
  to nana-pi (fixed root and outline path, LF-only parse, a repo-only import).
- The report already runs on another project with a tree ledger (probe `--root p1`, exit 0) and refuses a flat one
  (probe `p2`: "line 7: R-001 is not in a feature or subgroup table") — the Windows-seat trigger, reproduced on macOS.
- Minimal tree = three heading grammars, three line grammars, the exact table header. Ship: checker as template file
  plus pack bin from ONE source; report as pack bin only. Windows blocker: CRLF — a CRLF copy of the real ledger
  gives 0 headings and 1,104 problems (probe `crlf.mjs`; LF: 68 headings, 0 problems).

## 2. Tree format: structure vs nana-pi content

Structure (enforced by code):

| Element | Grammar | Where checked |
|---|---|---|
| Capability | `# CAP-nn · <label>`: two digits, U+00B7, single spaces, level 1 | requirements-tree.mjs:16, :166 |
| Feature | `## FEAT-nnn · <label>` directly under a CAP (R-290) | :155-170 |
| Subgroup (optional) | `### SUB-nnn · <label>` directly under a FEAT | :155-170 |
| Purpose | `Purpose: <text>` after every heading, before any table or heading (R-288) | :138-149 |
| Status | every FEAT, before its first table: `proposed`, `active`, `frozen (r)`, `retired (r)` (R-293); proposed/retired hold no rows (R-294) | :19, :186-192 |
| Shares (optional) | `Also applies: <ids>` on a FEAT; each live, once, homed elsewhere (R-292) | :193-205 |
| Table | exactly `\| ID \| Requirement \| Status \| Evidence \|` + delimiter; every R and G row in a FEAT/SUB table (R-287) | :20-21, :68, :121-137 |
| IDs | heading IDs unique (R-289); never reused is policy only (REQUIREMENTS.md:45) | :150-154 |

Parsed, not checked: `Outcome:` on a CAP (:88); the report shows it (scripts/product-report.mjs:81), empty if absent.
Optional: the generated outline `docs/requirements-tree.md` (:267-295, R-291), a review-diff device
(docs/reviews/req-tree-2026-10-09/CHANGE.md:61-70). Ordinary headings are fine for the preamble and the closing
block, but an ordinary `#` between a CAP and its FEATs fails R-290 (packages/nana-pack/tests/requirements-tree.test.mjs:111).

nana-pi content, not for templates:
- The 8 CAPs, 39 FEATs and 21 SUBs (REQUIREMENTS.md:77-1681); the test seals 68 headings (requirements-tree.test.mjs:26).
- The ID-block allocation (REQUIREMENTS.md:11-15); "Who decides. The owner decides…" (REQUIREMENTS.md:34-38). The
  lifecycle and share rules at REQUIREMENTS.md:40-56 are generic and portable.
- "Purpose and outcomes" with the owner's words (REQUIREMENTS.md:62-75); `Note (moved from old §…)` blocks,
  `See also:` lines and the old-section map (req-tree CHANGE.md:164-185).
- Test seals: leaf total 1,104 (requirements-tree.test.mjs:38-53), FEAT-033 holds the G rows (:59, :72), R-287's
  text (:24). The fixture cases (:97-231) are generic and could seed a template self-test.

Minimal seed (proposal for the plan): `# <project> requirements` + today's rules text (REQUIREMENTS.md.jinja:4-52)
+ a generic "How this file is organized" (from REQUIREMENTS.md:17-30, 40-56, owner unnamed) + `# CAP-01 · <what the
product does>` / `Purpose:` / `Outcome:` + `## FEAT-001 · <first feature>` / `Purpose:` / `Status: active` + table
with R-001 (fresh render) or `Status: proposed` and no rows (adopt render; R-294 allows it) + one FEAT holding
G-001…G-022 in one table + `# Open questions and deliberate omissions` over the existing `## Open questions` and
`## Deliberate omissions` (keeps SKILL.md's instruction true, req-tree CHANGE.md:192-194).

Part G conflict: the ledger template includes `# Part G` with `## G1.`–`## G5.` tables
(templates/_shared/requirements-general.md:13-62, included at templates/typescript/template/REQUIREMENTS.md.jinja:87).
Every G row then fails R-287 (probe "flat" case flags G-001). The same include renders `REQUIREMENTS-general.md`
(REQUIREMENTS-general.md.jinja:1), which the checker never reads, so that file can keep G1–G5. The ledger copy needs
a FEAT wrapper (nana-pi: one table under FEAT-033, REQUIREMENTS.md:1503-1507); one include, two shapes — a plan point.

## 3. Checker — what binds it to nana-pi, and the lift

| # | Binding | Where | Lift |
|---|---|---|---|
| 1 | Root is the script's parent | requirements-tree.mjs:15, :390 | `--root <dir>`, default cwd |
| 2 | Outline path fixed; `--check` dies on raw ENOENT when the file is absent | :394, :397 | `--check` = structure only; outline opt-in |
| 3 | CLI takes only `--write` or `--check` | :388-389 | add `--root`; keep exit 0/1/2 |
| 4 | Imports `ID`, `WHITESPACE`, `requirementRowId` through the shim, which imports the TS template rail by repo path | :13; scripts/requirements-trace.mjs:21 | bin resolves the rail inside the pack checkout, or inlines the three exports |
| 5 | Splits on LF only; `(.+)$` cannot cross `\r` | :61, :16 | normalise as the report does (product-report.mjs:23) inside `parseLedger`; compare the outline normalised (:397-398) |
| 6 | Exact header string | :20, :68 | keep; the adopt sorter rewrites variant headers (INFERRED that hand ledgers vary) |
| 7 | A heading typed with `-` for `·` silently turns ordinary; its rows fail as "not in a feature or subgroup table" | :16, :130 | name near-miss `CAP-`/`FEAT-`/`SUB-` headings |
| 8 | `MODULE_TYPELESS_PACKAGE_JSON` warning on stderr every run (probe), from the `.ts` import | deferred at product-report CHANGE.md:146 | `NODE_NO_WARNINGS=1` in the bin, or a module-type fix |

## 4. Report — what binds it to nana-pi, and the lift

Probe matrix (scratch repos, `node scripts/product-report.mjs --root <dir>`):

| Case | Result |
|---|---|
| Tree ledger, template HANDOFF seed, git | exit 0, page written; zero decisions shown |
| Flat ledger | exit 1, tree problems listed |
| No HANDOFF.md | exit 1, raw `ENOENT … HANDOFF.md` |
| Not a git repo | exit 1, `git rev-parse HEAD failed` |
| Project in a subfolder of a git repo, page | exit 0 |
| Same, `--packets` | exit 1: `path 'svc/REQUIREMENTS.md' exists, but not 'REQUIREMENTS.md'` |
| Default `--out`, folder not ignored | second run embeds `"clean":false` |

1. Repo-path imports: `./requirements-tree.mjs`, `./requirements-trace.mjs`, `../packages/nana-pack/lib/handoff-asks.mjs`
   (product-report.mjs:16-18). Fine from the nana-pi checkout; they move with the checker.
2. Product name hard-coded: "Nana pi product ledger" (:76; scripts/product-report/template.html:6); output
   `nana-pi-product-ledger.html` (:22). Lift: name from the ledger H1, or `--title`.
3. Default out sits inside root (:22, :300) while the clean flag reads `git status` (:218). The page marks itself
   dirty unless the folder is ignored; nana-pi ignores it (.gitignore:2). Lift: exclude the out path from the
   status call, or default out outside the tree.
4. HANDOFF.md is required (:208); asks come only from an "Open for the owner" heading (packages/nana-pack/lib/handoff-asks.mjs:11, :13).
   The template seed's heading is `## Open` (templates/_shared/HANDOFF.md:11), so a project's Decisions view is
   silently empty. Lift: absent HANDOFF gives zero asks with a visible note, or a named refusal; align the seed.
5. `git show <sha>:REQUIREMENTS.md` resolves from the git top level (:177, :263, :271). Lift: `<sha>:./REQUIREMENTS.md`
   (git's own hint in the probe).
6. Store path fixed at `docs/product-report/assessments.json` (:117, :219); absent store = all unassessed (:120, :225).
   Only nana-pi's suite validates it (product-report.test.mjs:486); `buildReport` reads it unvalidated (:221-226).
   Lift: validate on build, or a `--check-store` mode.
7. The refresh-loop doc is nana-pi's (docs/product-report/assess-brief.md). Google Fonts (template.html:7-9) fall back offline (INFERRED).
Already generic: `--root` (:310), CRLF normalise (:23, :204), injectable git (:116, :203), tree refusal (:205-206).

## 5. Ship form

Precedent: the rail is ONE source in the TS template, run in nana-pi through a shim (requirements-trace.mjs:10-21);
project checks ship per language as template files (templates/typescript/template/scripts/code-map.mjs,
templates/python/template/scripts/code_map.py). Pack bins are not on PATH on Windows (packages/nana-setup/lib/doctor.mjs:605-608);
the roster lane documents `node "$HOME/nana-pi/packages/nana-pack/bin/<x>.mjs"` (its working-under-nana-pi.md, after :29).

- Checker: BOTH, one source. Source home like the rail: a template-owned module the TS template renders; nana-pi's
  `scripts/requirements-tree.mjs` shrinks to a shim (root, outline path); a pack bin wraps the same module with
  `--root` for the seat, the adopt step and the report. Python template trade: (a) ship the `.mjs`, pytest calls
  `node` — one parser, project CI needs Node ≥ 22.18 (README.md:80); (b) port like code_map.py — no Node in CI, two
  parsers in parity (R-1000 already pins both rails, REQUIREMENTS.md:1321). Lean (a): Node is on every seat machine.
- Report: pack bin only. It is a seat tool, needs git and writes HTML; per-project copies of `template.html` and the
  renderer would drift. The store and packets stay project files.
- Outline: do not seed in increment 1 (the report already shows the tree); keep it opt-in.
- Adopt-sort prior art: `move.mjs`/`prove.mjs` (placement JSON in, rows proven byte-identical) hard-code SHAs and
  nana-pi's Part A boundary (docs/reviews/req-tree-2026-10-09/move.mjs:17-18, :67). Today's flat default: the skill's
  tree paragraph is nana-pi-phrased ("In this ledger…", "the owner decides", packages/nana-pack/skills/requirements/SKILL.md:126)
  and audit mode extracts rows with no tree step (:128 on).

## 6. Windows

1. CRLF (blocker). Checker: probe above. Outline: written LF (:395), compared raw (:397-398); the test compares raw
   too (requirements-tree.test.mjs:34). Repo `.gitattributes` holds one unrelated line; templates ship none.
   Git for Windows defaults to `autocrlf=true` (INFERRED). The CI suite's Windows leg checks out with no eol override
   and is non-blocking (.github/workflows/ci.yml:44-59, :50); INFERRED that it already fails this test.
   Fix: normalise in `parseLedger`, compare normalised, and have templates ship `*.md text eol=lf` (optional belt).
   The rail already reads CRLF (R-1001 CRLF case, REQUIREMENTS.md:1322); the report normalises (product-report.mjs:23).
2. Paths: no PATH links, so instructions name `node "<checkout>/packages/nana-pack/bin/<x>.mjs" --root .`; `$HOME`
   expands in PowerShell, not cmd.exe (INFERRED). Main guards compare `resolve(argv[1])` with the module path
   (requirements-tree.mjs:407; product-report.mjs:318); a drive-letter case mismatch would skip `main` (INFERRED).
3. Node only: Node ≥ 22.18 (README.md:80), no shell; `spawnSync("git")` needs git.exe on PATH (product-report.mjs:116, :203).
4. Typing and encoding: `·` (U+00B7) is awkward on Windows keyboards, and its failure is misnamed (§3 row 7). A
   ledger saved UTF-16 by PowerShell 5.1 redirection would parse as nothing (INFERRED). A BOM is handled (:61; test :187).

## 7. Overlap with the roster lane (worktree, not on main)

- `requirements-tree.test.mjs`: roster moves the leaf-total literal 1,104 → 1,113 (:38, :52-53). Any tree lane that
  adds rows or headings conflicts there and on the 68-heading literal (:26); land after roster and re-measure.
- `templates/_shared/working-under-nana-pi.md`: roster adds two bullets after :29; a tree lane edits Requirements-first
  (separate hunk, same file); both re-render the AGENTS.md/CLAUDE.md shared region. `AGENTS.md`: roster edits the
  support line and the Layout bin list (adds `nana-roster`); a new bin edits that sentence too — conflict likely.
  Roster also changes `REQUIREMENTS.md` (+15) and `docs/requirements-tree.md` (+17).

## 8. Not run
Nothing ran on Windows; Windows behaviour is INFERRED from code and macOS probes. Claim most likely wrong: that
Python projects accept a Node-run tree gate in their CI (§5 option a).
