# Lane plan draft: known-bugs per feature

Feature: FEAT-002 · Resume decisions and next actions (SUB-005). Main 086eb4b2. Probe: `git archive` copy, temp HOME.

## 1. What changes

Known bugs leave HANDOFF.md and live one line each in `docs/known-bugs/FEAT-nnn.md`, with `unplaced.md` for lines no feature owns. HANDOFF keeps a two-line pointer, so it drops from 235 KB to about 16 KB and fits one default pi read. Every seat records a non-blocking review finding in the lane's feature file. Other projects follow at their next `nana-setup project`.

## 2. Verified facts

- HANDOFF.md:65 opens Carried residuals. Lines 67–957 hold **891** single-line entries, which make up 219,871 of 235,462 bytes. :3 and :17 name the section. :913 is a known bug this lane fixes.
- Frontier at main reports `word-budget: words=38521` and `file-size: bytes=235462 lines=957` (nana-frontier.mjs:92, :141–143), and no read-window finding. A simulated move (lines 1–64 plus a pointer) leaves 15,717 bytes and only `word-budget: words=2549`.
- Placement probe:
  - **798** lines name a lane: 774 in the tag's parentheses, 24 as the area. Each lane's review-corpus brief has a `Feature: FEAT-nnn` line, so all 798 place mechanically.
  - **540** of them name a lane whose `<lane>:` commits add or change rows that sit in a feature at HEAD. 500 match the brief's feature. 40 lines from five lanes do not (bench-win, silent-main-guard, readme-windows-checklist, verifier-pipe-commit-match, writing-adoption).
  - **93** cannot be placed: area-only tags, mostly lines 67–345. Matching by area proposed 7, of which 3 looked wrong, so the seat places all 93.
  - 23 of 39 features get a file. The largest, FEAT-013, holds 178 lines and **47,099 bytes**, 92% of the read window.
- frontier-config.mjs:13,15 holds the read window and :19 the archive names. R-2473 (frontier.test.mjs:279–281) pins no section-order or read-window finding. Nothing pins file-size.
- AGENTS.md:96 says "recorded in HANDOFF's residuals" and :97 says "record residuals at point of use". Both mirror templates/_shared/working-under-nana-pi.md:28–29 byte for byte (R-859, templates-render.test.mjs:429–431).
- review-standard.md:1 says only "the seat records them as known bugs" (R-1108, review-standard.test.mjs:47).
- builder-preamble.md:7 says "Never edit `HANDOFF.md` or session archives". That line is unpinned, and it means the seat makes the move commit.
- Unaffected consumers:
  - product-report.mjs:365–366 (Open for Jake only)
  - writing-check.test.mjs:103–117 (live sections only)
  - review-round.mjs:21,657 (a message only), and nana-land
  - requirements SKILL.md:17,47 (violated-row sense)
  - the HANDOFF seed, which has no residual section (project.mjs:170, adopt-structure SKILL.md:159)
- The HANDOFFs of nana-agent-loop, basketball-geek, trading-zone and aml-desk have no residual heading.
- code-map.config.json forbids package→scripts imports, so the check lives in `scripts/`. requirements-moved.mjs:4–5 only diffs HEAD against a merge base, so the move script reads per-commit REQUIREMENTS.md diffs.

## 3. Open design choices

1. **Location.** Options: (a) `docs/known-bugs/FEAT-nnn.md` plus `unplaced.md`; (b) `FEAT-nnn-<slug>.md`; (c) `docs/features/FEAT-nnn/known-bugs.md`; (d) inside REQUIREMENTS.md. Pick (a): IDs never change (REQUIREMENTS.md:47–48) but labels do. (d) adds about 220 KB to the ledger and its tooling. **Default: docs/known-bugs.**
2. **Line format.** Options: (a) verbatim `- <area> (<lane>, <source>): <text>`, under `# FEAT-nnn · <label> — known bugs` and one italic rule line; (b) add a date and row IDs. Pick (a): the move stays lossless, and new lines must name the lane. **Default: verbatim.**
3. **Placement.** The brief's Feature line places 798 lines. Row diffs are the fallback where a brief has no Feature line; none needs it today. The seat places the 93 and re-reads the 40 mismatches. The seat commits the move script and placement table in the corpus. **Default: corpus.**
4. **What HANDOFF keeps.** Options: (a) a `## Known bugs` pointer; (b) the pointer plus counts per feature; (c) nothing. Pick (a): counts drift every lane and would need a check. **Default: pointer.**
5. **Text changes.**
   - Review bar: "recorded as one line in its feature's file, `docs/known-bugs/FEAT-nnn.md` (`unplaced.md` when no feature fits or the project has no tree)".
   - Land checklist: "record known bugs in their feature's file or at point of use".
   - The Plans bullet's "residual" stays (R-1100). The review standard and nana-soul stay as they are.
   - Preamble: "Never edit `HANDOFF.md`, `docs/known-bugs/` or session archives."

   **Default: as listed.**
6. **Lanes.** Two lanes would leave one land where the rule and the files disagree. **Default: one.**
7. **Other projects.** They take the new text at `nana-setup project`. Until then `--check` reports the region as differing (project.mjs:654–656). `ARCHIVE_SECTION_NAMES` stays, so old HANDOFFs still read correctly. No seed is added and nana-setup is untouched. A project with no tree uses `unplaced.md`. **Default: no seed.**
8. **Row homes.** All rows go in SUB-005. A share onto FEAT-014 or FEAT-006 is a tree change, so that is the owner's call. **Default: no shares.**

## 4. Must-meet rows

IDs are the next free ones (inferred); the seat assigns them. Tests run from `packages/nana-pack/tests/`.

| Row | Requirement | Test :: title | Does | Red on main |
|---|---|---|---|---|
| R-2504 | This repository's HANDOFF.md shall get no file-size finding from the HANDOFF frontier report. | `frontier.test.mjs` :: `R-2504: this repository's HANDOFF.md gets no file-size finding` | Runs the checker on the repo file and on a temp control over 51,200 bytes. Passes when the control is reported and the repo is not. | Probe reports `file-size: bytes=235462`. |
| R-2505 | This repository's HANDOFF.md shall point to the known-bugs folder in place of a Carried residuals section. | `known-bugs.test.mjs` :: `R-2505: this repository's HANDOFF.md names the known-bugs folder and has no Carried residuals heading` | Reads headings outside fences and finds the sealed folder name. | Heading at :65; the folder is never named. |
| R-2506 | WHEN a file in the known-bugs folder is named for no active or frozen feature of the requirements tree, the known-bug check shall report that file's name. | `known-bugs.test.mjs` :: `R-2506: a known-bug file named for a missing, proposed or retired feature, or not named for a feature, is reported` | A temp tree has FEAT-001 active, FEAT-002 frozen, FEAT-003 retired and FEAT-004 proposed. FEAT-001, FEAT-002 and unplaced pass. FEAT-003, FEAT-004, FEAT-099, feat-001 and notes are reported. With no tree, only unplaced passes. | `scripts/known-bugs.mjs` is absent. |
| R-2507 | WHEN a known-bug file is over 51,200 bytes or 2,000 lines, the known-bug check shall report that file with its byte and line counts. | `known-bugs.test.mjs` :: `R-2507: a known-bug file over the read window in bytes or in lines is reported with its counts` | Tests one byte over, one line over (CRLF, no final newline) and exactly at the limit, using the frontier-config limits. | The module is absent. |
| R-2508 | This repository's known-bugs folder shall hold at least one feature file and get no finding from the known-bug check. | `known-bugs.test.mjs` :: `R-2508: this repository's known-bugs folder holds feature files and gets no finding` | Runs the check on the repo root. | The folder is absent. |
| R-2509 | The shared working pattern shall record a finding that does not block the land as one line in its feature's known-bug file. | `templates-render.test.mjs` :: `R-2509: the shared working pattern records a non-blocking finding in its feature's known-bug file, not HANDOFF` | Requires the folder path and `unplaced.md`, and excludes "HANDOFF's residuals". R-859 carries the change to AGENTS.md. | Shared file :28. |
| R-2510 | The builder preamble shall forbid a builder to edit the known-bugs folder. | `worker-lane.test.mjs` :: `R-2510: the builder preamble forbids editing HANDOFF.md, the known-bugs folder and session archives` | Uses `preambleOnce` on the new line. | Preamble :7. |

The seal test `seal: the known-bugs folder is docs/known-bugs` cites R-2509.

Seat checks:
- Lossless move: the 891 lines in `main:HANDOFF.md` equal the moved lines plus the lines removed as fixed, each named. Line 913 is the expected fixed line.
- requirements-moved
- map:check
- the readme check
- `npm run test:locked`

## 5. Tunables, class, limits, threat model, files

**Tunables:**
- `KNOWN_BUGS_DIR = "docs/known-bugs"` (chosen: it sits beside `docs/reviews` and `docs/sessions`; contract for R-2509; sealed).
- `UNPLACED_FILE = "unplaced.md"` (chosen: an honest name).
- The live statuses `active` and `frozen` (contract: REQUIREMENTS.md:43–47, read through parseLedger).
- The read window, imported from frontier-config (contract: R-2471, R-2472).

**Class: ordinary, one final reviewer.** The lane touches no install, uninstall, doctor, hook, extension, gate policy, nana-land, pi-review or review-round, and pi-worker is not on the ladder's list. There is no nana-setup change, so no install check. Editing the review standard instead might count as a pi-review change (inferred).

**Known limits:**
- The word-budget finding stays at about 2,550 words against 1,200.
- 93 placements rest on seat judgement. A line about another feature stays under its lane's feature.
- 117 lines lack a lane tag. Nothing checks the line format or one-line entries.
- Label drift is unchecked.
- FEAT-013 starts at 92% of the read window.
- Nothing proves a seat files new findings.
- A lane building in parallel fails R-2505 after merging main, and the seat moves its lines then (inferred).
- The files are technical records, outside the writing rule.
- The product report does not show known bugs.
- "Residual" survives in Plans and in review-round, so one thing keeps two names.

**Threat model:**
- In scope, honest variation: untagged or multi-lane tags, lanes spanning features, later retirements or splits, CRLF or BOM saves, lowercase names, and projects with no tree.
- Out of scope, deliberate forgery: a file named for a live feature holding unrelated lines, or a forged Feature line.

**Files:**
- Seat: HANDOFF.md, `docs/known-bugs/*.md` (about 24 files), `docs/reviews/known-bugs-<date>/`, docs/sessions/2026-10.md.
- Builder:
  - new `scripts/known-bugs.mjs` (with a `--root` CLI) and `known-bugs.test.mjs`
  - frontier, templates-render and worker-lane tests
  - working-under-nana-pi.md and its AGENTS.md mirror, builder-preamble.md
  - REQUIREMENTS.md, docs/requirements-tree.md, docs/code-map.md
  - the root README, if the readme check needs the script listed (inferred)
