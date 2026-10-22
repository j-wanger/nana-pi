# Research B — the real flat ledgers, and what the mechanical lift does to each

nana-pi main `d9cf0bc`, 2026-10-14. Source repos were read only (`cp`, `git status`, `git diff`, `git show HEAD:`); all runs are on copies in `plan-lift/ledgers/`.
Stakes: high blast, hard to reverse — the lift rewrites another project's contract file, and a mis-filed row passes the checker silently.
Ran: `scan-ledgers.mjs` (characterisation → `scan-output.json`), `lift-sim.mjs` (the mechanical lift plus a line proof plus `checkTree` → `lift-output.json`, `*.lifted`, `*.map.txt`),
`variants.mjs` (honest-variation copies → `variants-output.txt`), and `node scripts/requirements-tree.mjs --root <copy>` (→ `ledgers/<p>.tree.out`). INFERRED marks anything not read or run.
Sim rule (the task's): `# Part X` → `CAP-nn`, `##` → `FEAT-nnn`, `###` → `SUB-nnn`, file order; `# Part G` → `CAP-90` + inserted `FEAT-900`, `## Gn.` → `### SUB-90(n−1)`
(`templates/_shared/requirements-general.md:13-80`); `Purpose: Not yet sorted — the rows of old section "<label>".` and `Status: active` inserted after each heading; `## Open questions` /
`## Deliberate omissions` kept under an inserted `# Open questions and deliberate omissions`; a header pair inserted before each headless fragment; a synthetic `# CAP-nn · Not yet sorted`
before the first `##` with no Part above it. Parsing is fence-aware via `parseLedger` (`scripts/requirements-tree.mjs:30-58,60`).

## 1. Inventory

| Project | Marker | Ledger | Verdict |
|---|---|---|---|
| work-project | AGENTS.md + CLAUDE.md shared region; not copier-tracked | root | flat, 6 Parts |
| basketball-geek | `.copier-answers.yml` v0.4.0, python, `adopt: true` | root | flat, no Parts, dirty |
| trading-zone | `.copier-answers.yml` v0.6.8, python, `adopt: false` | root | flat + template Part G mid-file (new since `research-adopt.md` §3) |
| yokai-world | `.copier-answers.yml` v0.6.7, typescript | root | hand-built partial tree |
| nanaclaw | none (upstream fork) | `docs/REQUIREMENTS.md`, prose, 0 table lines | not a nana ledger; checker: `REQUIREMENTS.md: no requirement rows` (R-1160); `--root ~/nanaclaw` would not find it |
| edge-screener | — | none | nothing to lift |

`~/nana-pi-wt/land` and the 39 `~/yokai-world-wt/*` folders are worktrees of nana-pi and yokai-world, not separate projects. No ledger has a BOM, a CR, a NUL, a tab, a fenced row,
a duplicate ID, a trailing-space row, a setext heading, a `####` heading, a row before the first heading, or a row directly under a `#` (scan). Every table header is byte-exact; work-project mixes two delimiter forms (`| --- |` ×19, `|---|` ×26), both accepted (`requirements-tree.mjs:21`).

## 2. work-project (`~/work-desk` main `7dee19b`; ledger last commit `c044031`, 2026-10-07)

| Field | Found |
|---|---|
| Size | 691 lines, 258,449 B, LF, final newline |
| Rows | 365, all R-nnn (R-001–R-610 blocks), 0 retired |
| Headings | `#` ×7: title (1), Parts A–F (13, 221, 318, 400, 482, 601). `##` ×43: sections 1–39 incl. `36b` twice, Open questions (631), Deliberate omissions (674). `###` ×2: Lane B (486), Lane A (572) |
| Rows outside exact-header tables | 27 in 3 headless fragments: 149–165 (17; §8's table split by one blank line), 520–525 (6) and 529–532 (4) in §36, each after a prose paragraph |
| Repeated labels | `## 36b. Build at production size` at 484 and 570; `## 36.` (501) sits between them |
| Labels that are prose, not headings | 6 lanes: in §36 "Entity-cluster lane", "Split out of R-505…", "Scale lane", "Link-adjacency lane", "Client-standing lane"; under `### Lane A` "Lane C — incremental, slice 1" (R-586–R-595) |
| General-engineering block | Part F (601–630): sections 37–39, R-600–R-610, no G rows |
| Uncommitted / contended | clean; 1 branch; 0 unmerged branches edit it |
| Checker on the copy | exit 1, one line: "holds 365 requirement rows and no capability or feature heading…" (R-1159, `requirements-tree.mjs:442-444`) |
| Cited from outside | `README.md:63` "REQUIREMENTS Part F, R-600–R-610" |

**Lift:** CAP-01–06 (Parts A–F), FEAT-001–041, SUB-001–002; 147 lines inserted, 49 headings rewritten, 692/692 split lines accounted, 365 rows byte-identical in order; checker 0 problems.
FEAT-037 (§36) holds 41 rows in 6 tables. FEAT numbers stop matching section numbers at 36b: 36b→FEAT-036, 36→FEAT-037, 36b→FEAT-038, 37→FEAT-039.

## 3. basketball-geek (`~/basketball-geek` main `98192e3`; ledger last commit `98192e3`, 2026-10-01)

| Field | Found |
|---|---|
| Size | 240 lines, 73,869 B, LF |
| Rows | 171 in the working tree, 165 at HEAD; R-nnn only; 1 retired |
| Headings | `#` ×1 title. `##` ×11: sections 1–9, Open questions (221), Deliberate omissions (234). No Part, no `###` |
| Rows outside tables / repeated labels | 0 / none |
| Uncommitted | ` M REQUIREMENTS.md`, +6 row lines: R-166, R-168, R-171 after line 27 (§1); R-167, R-169, R-170 after line 43 (§2). Another session's work |
| Contended | 1 branch; no worktrees; no `HANDOFF.md` |
| Checker on the copy | exit 1, R-1159's line, 171 rows |

**Lift:** synthetic CAP-01 before `## 1.` (line 5), FEAT-001–009 (= section numbers by coincidence), no SUB; 33 inserted, 9 rewritten; checker 0. The HEAD copy (165 rows) gives the identical mapping
and 0 problems. Section 9's label carries provenance prose ("direction from the owner 2026-10-01, after …") that becomes a feature label.

## 4. trading-zone (`~/trading-zone` main `ad27336`; ledger last commit `f868050`, 2026-10-12)

| Field | Found |
|---|---|
| Size | 379 lines, 85,637 B, LF |
| Rows | 197: 175 R-nnn + 22 G; 0 retired |
| Headings | `#` ×2: title (1), `# Part G.` (151). `##` ×18: sections 1–4 (55–136), G1–G5 (161–200, template labels), sections 5–11 (209–325), Open questions (363), Deliberate omissions (373) |
| Look-alikes that are not structure | fenced `# req: R-001 G-004` (29, a python example); indented `    \| R-squared \| example \| untested \| — \|` (49, not a row: no leading pipe) |
| Rows outside tables / repeated labels | 0 / none |
| Post-Part-G drift | 7 product sections (5–11, 105 R rows) follow G5, so by nesting they belong to Part G |
| Uncommitted / contended | clean; 30 branches incl. main, 0 unmerged edit it |
| Checker on the copy | exit 1, R-1159's line, 197 rows |
| Cited from outside | `src/trading_zone/config.py:337` "REQUIREMENTS section 8", `:406` "section 9"; the ledger's own prose at 295 "(section 8, never run)" |

**Lift:** synthetic CAP-01 + CAP-90; FEAT-001–011 + FEAT-900; SUB-900–904; 56 inserted, 17 rewritten; checker **0 problems**, yet FEAT-005–011 (105 R rows) nest under CAP-90, which
then holds 127 rows. Silent (`CHANGE.md:234`, residual 11). G labels match the template exactly; no R row sits in the G block.

## 5. yokai-world (`~/yokai-world` main `4263b76`; ledger last commit `5714cd0`, 2026-10-14) — a hand-built partial tree

| Field | Found |
|---|---|
| Size | 1,507 lines, 474,961 B, LF |
| Rows | 1,106: 704 R-nnn, 380 R-nnnn, 22 G; 133 retired (959 at `8b04969`, `research-adopt.md:34`) |
| Headings | 42 tree: CAP-01–06, 36 FEAT. Non-tree: title (1), `## The product` (48, prose only, before CAP-01), `# Part G.` (1186), `## G1.`–`## G5.` (1443–1483), Open questions (1492), Deliberate omissions (1498) |
| Drift | 8 features (FEAT-031–036, 028, 029; 1196–1421) sit between Part G's preamble (1187–1194) and G1; FEAT-035, 036, 028, 029 have no `Status:`; R-399 sits in G2 (1465) |
| Uncommitted / contended | clean; 40 branches and 41 worktrees incl. main; 2 unmerged branches edit it: `feat/v2-move` (+19/−1) adds `## FEAT-032 · Movement: entry and kite`, `feat/v2-target` (+45/−16) adds `## FEAT-027 · Entry: exposure and pace…`; main already has FEAT-032 · Types (1208) and FEAT-027 · No role label in scoring (1150) |
| Checker on the copy | exit 1, 35 problems (was 29): 23 orphaned rows (22 G + R-399), 8 nesting, 4 Status |

**Lift (keep tree headings, lift the rest):** 35 → **4** problems (the four missing `Status:` lines), and the result is wrong: G1–G5 become SUB-900–904 under **FEAT-029**, not FEAT-900;
FEAT-900 is empty; the 8 product features nest under CAP-90 (210 rows); `## The product` becomes an empty FEAT-037 under a synthetic CAP-07 that sits first in the file. Needs the hand fix (`CHANGE.md:233`, residual 10).

## 6. Honest variation (copies of basketball-geek, lifted by the sim)

| Variant | Result |
|---|---|
| CRLF; BOM + CRLF | proof clean, 171/171 row lines byte-equal, checker 0 |
| Mixed LF/CRLF (every third line) | line proof clean, but **114/171 row lines change bytes**: the sim splits on `/\r?\n/` (`requirements-tree.mjs:61`) and rejoins with one EOL |
| Padded header (`\| ID    \| …`) | checker 0, but the inserted exact header sits under the padded one: a double header that renders as two junk rows (`:68` needs the byte-exact header) |
| Trailing space on every row | clean |
| UTF-16LE | refused before the lift: `NUL byte; likely UTF-16…` (`:423-427`) |
| Two sections with one label | two features, same label, checker 0 (`:150-153` checks IDs only) |

## 7. Where the mechanical rule is ambiguous or loses information

1. **What is a Part?** Every ledger opens with a `#` title. The sim keys on `^Part [A-Z]`; keying on "any `#`" makes the title a capability that swallows the preamble.
2. **No Part above a section** (basketball-geek all 9, trading-zone 1–4, yokai `## The product`): a synthetic capability is needed; its label, purpose and position are unspecified.
3. **Product sections after Part G** (trading-zone 5–11; yokai's 8 features): the rule files them under CAP-90 with 0 checker problems. Options: insert a new product CAP before them (no row moves; CAP-90 no longer last, against S2, `CHANGE.md:216`), move the G block to the end (moves 58 lines and 22 rows), or refuse.
4. **Part G is detected by letter only.** work-project's general block is Part F with R-600–R-610. Mapping it to CAP-90 would put R rows in FEAT-900, against R-1151 (`REQUIREMENTS.md:877`); the sim makes it CAP-06.
5. **A hand-built tree** (yokai): keeping its headings and lifting the rest mis-files the G rows under the nearest product feature and leaves 4 problems. Refuse any ledger with a CAP/FEAT/SUB heading, or take an explicit mapping.
6. **Where FEAT-900 goes.** The template puts it straight after CAP-90, above the preamble prose (`requirements-general.md:13-29`). That works only when G1 follows the preamble directly, which fails in yokai.
7. **Part G purposes:** the placeholder, or the template's own CAP-90/FEAT-900/SUB-900–904 text (`requirements-general.md:15-16,20,33,45,60,70,80`)? The labels match the template in both G ledgers.
8. **An R row in the G block** (yokai R-399 in G2) lands in SUB-901 under FEAT-900.
9. **Labels: strip or keep `Part A.` / `36b.`?** Stripping drops anchors that other files cite: work-project `README.md:63` (Part F); trading-zone `config.py:337,406` and ledger line 295 (sections 8, 9). The sim keeps the full old label only in the placeholder purpose, which the owner later replaces. A mapping file must keep the old labels.
10. **Section number ≠ FEAT number** once a non-integer or repeated section appears (work-project from 36b on). Readers who navigate by the old number lose it.
11. **Repeated labels** (work-project 36b ×2): two features with one label. Merging them would move Lane B's rows past §36, a reorder the lift must not do.
12. **Prose-labelled lanes** (work-project, 6): not headings, so the rule cannot see them. Lane C's 10 rows are filed under the subgroup "Lane A — normalize".
13. **Headless fragments** (work-project, 27 rows): insert a header pair (adds 2 lines each; keeps every line), or delete the separating blank line (a deletion the proof must declare).
14. **Padded or variant header** (synthetic): needs a declared rewrite of the header line, not an insertion.
15. **Mixed line endings** (synthetic): the writer must keep each line's own terminator, and the proof must compare raw bytes per line, not split lines.
16. **Empty sections become empty features** (yokai `## The product`): `active` or `proposed`, or keep it as a non-tree heading (but a non-tree `##` resets row ownership, `requirements-tree.mjs:127`).
17. **Open questions / Deliberate omissions** nest today under the last Part (work-project F, trading-zone G, yokai G). They must be named exclusions, or they become features.
18. **Fence awareness:** a grep-style heading scan would turn trading-zone's fenced `# req:` line (29) into a capability. The lift must reuse `parseLedger`'s fence logic.
19. **Mapping key stability:** line numbers shift with concurrent edits (basketball-geek's +6 rows move every heading below line 27), and labels are not unique (36b). Key on (level, label, occurrence), and bind it to a HEAD blob.
20. **A dirty ledger:** basketball-geek differs from HEAD by 6 rows. `--write` only at HEAD (`CHANGE.md:210`) refuses it; the HEAD lift gives the same mapping, so the owner commits or stashes first.
21. **Heading-ID contention across branches:** both unmerged yokai branches add a FEAT ID that main already uses. A lift on main and a flat branch merged after it leave that branch's new `## N.` section as a non-tree heading, which orphans its rows and fails loudly (INFERRED).
22. **ID allocation with kept IDs:** the yokai sim gave CAP-07 to a capability that sits first in the file, so "numbered in file order" and "unused ID" conflict once any tree heading exists.

## 8. What this means for the lane (R-1162–R-1169, at most eight)

- Both flat ledgers without a G block lift cleanly: work-project to 6/41/2 with 3 header pairs, basketball-geek to 1/9/0 at HEAD. trading-zone passes the checker but is wrong, because of item 3. yokai needs the hand fix.
- The proof needs four checks the sim's line proof lacks: byte-level per line with its terminator; a declared-rewrite list that covers header lines; a check that no product feature sits under CAP-90; and a refusal on any existing tree heading.
- The rails read rows line by line and ignore headings (trading-zone `tests/conftest.py:81-86,178-182`; the other three per `research-adopt.md:95`), so a heading-only lift leaves every rail unchanged. Running each project's suite on the lifted copy is still unrun (INFERRED).
