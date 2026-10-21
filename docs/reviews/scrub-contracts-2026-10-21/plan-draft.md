# Lane plan draft: owner-identity scrub (main 906fbb56)

Placeholder `<first>` is the owner's first name. Probe: `git archive` copy, temp HOME; counts are whole-word, case-insensitive.

## 1. What the lane changes

It replaces the owner's first name, full name, login name and work-domain names in current files with role words such as "the owner", except where bytes are pinned. It renames the two contract strings that carry the name: the HANDOFF asks heading "Open for `<first>`" and the writing rule's title and prompt heading. A suite scan then fails any tracked file that brings an identity word back.

## 2. Census and categories

First name: 671 files, 3,983 times. Login name: 384 files (2,044). Full name: 52. Work-domain acronym family: 263 (854). Email: 0.

| # | Category | Files / occ | Examples | Replace with · kind | Pinned by | Breaks if changed |
|---|---|---|---|---|---|---|
| 1 | Contract: asks heading | 4 code + 9 test/fixture files | frontier-config.mjs:17; handoff-asks.mjs:11, exported name :13; nana-frontier.mjs:122-135; product-report.mjs:369; fixtures/frontier/*.md (5 files, 33); frontier-baseline.json (3, golden) | "Open for the owner" · mechanical plus matcher design | R-875, R-877, R-878, R-2470, R-2471, R-1018, R-1030, R-2503 | HANDOFF.md:27 moves in lockstep (R-2503). Three other projects here use the heading. Probe: a renamed heading gives 0 asks and no tag check, silently |
| 2 | Contract: writing rule title and heading | 3 code + 2 tests | nana-writing.md:1; nana-writing.ts:61; writing-trial-extractor.mjs:14; writing-injection.test.mjs:438; writing-trial-extractor.test.mjs:35 | "Writing for the owner" · mechanical | R-751, R-376 | Every pi prompt heading; the extractor misses attachments unless it matches a prefix |
| 3 | Sealed texts in tests | 5 files | templates-render.test.mjs:530 and :644-646; product-report.test.mjs:492, :542; rulings.test.mjs:212 (plaintext identity list); writing-check.test.mjs:187-454 (15 passive examples) | "the owner" · mechanical | R-682, R-1109, R-1029, R-1415 | Test and source change together |
| 4 | Shipped text | 9 files | nana-writing.md (4); nana-soul.md:37; working-under-nana-pi.md:17 (feeds every project's AGENTS.md); nana-adoption.mjs:75 (SessionStart output); requirements SKILL.md:59 (work project); pack README (8); nana-setup README:420-421; nana-knowledge README:144; README.md:72 | "the owner", example paths · judgement | R-682 | Other projects keep old text until reinstall (inferred). Prompts and other skills are clean |
| 5 | Ledger and generated maps | 3 files, 50 | REQUIREMENTS.md: 31 lines over 12 features, including 7 desk Status lines (:1422) and FEAT-039 Purpose (:2210); requirements-tree.md; code-map.md | "the owner" · mechanical, then regenerate | trace rail | Measured: 0 of 5 current assessments go stale (33 of 39 already are) |
| 6 | Code comments and identifiers | 19 files, 33 | worker-config.mjs:16, :56; writing-config.mjs:30-42 (provenance); objective.ts:23; gate-rm-inside.ts:3 (@purpose); doctor.mjs:425; stage.js:475 and stage.css:110 (frozen desk) | "owner" · mechanical | code map | The desk freeze (2026-10-10 ruling) |
| 7 | Machine paths and fixture identities | 6 files | project-key.test.mjs:30-34; settings-merge.test.mjs:353, :442-461; display-surfaces.test.mjs:55; retired-artifacts.test.mjs:122; steps.mjs:967 | `/Users/example`, `C:\Users\example` (precedent: retired-artifacts.test.mjs:87) · mechanical | R-668 area | None |
| 8 | Owner's work | 263 files, 854; 16 outside records | the work project in SKILL.md:59, README.md:72, HANDOFF.md:40, requirements-lift.test.mjs:1109; "work/corporate machine" phrasing in 8 review files | role words · judgement | R-1415 | None |
| 9 | Records | docs/reviews 574 / 3,312; sessions 2 / 174; research 24 / 157; studies 9 / 33; assessments.json 32; design docs 6 / 50; known-bugs 5 / 6; HANDOFF 5 | logs 163 files / 1,589 (819 are the asks heading in printed test titles); full name in 50 review system prompts (tranche1-2026-09-28/l3-system.md:1) | mechanical table | catch-ledger study | Measured: scrubbing the two tranche corpora makes `catch-ledger build` fail ("258 rows lack pass-A labels"); recorded label spend $13.96 |
| 10 | Byte-pinned: keep | 4 | tool-profiles fixture (3; study.json:38; study-tasks.test.mjs:48); retired/hook-backup (retired-fingerprints.json:150); skill-copy/requirements-0499e52.md (skill-copy-history.json:4); retired-fingerprints.json:82 (retired path on machines) | none · allowlist | R-534, R-668 | Cleanup on real machines; the study pin |
| 11 | Repository address | 219 / 4,626 | package.json:7; steps.mjs:996; five skills' copier source | out of scope | pi-registration tests | Installs |
| 12 | Personal, non-work projects | 224 / 839 | nana-knowledge discovery.test.mjs:251 | out of scope (D7) | — | — |

## 3. Open design choices

- **D1 Replacement words.** Options: "the owner", a name from user-scope config, or "you". Use "the owner", "(owner, date)" for provenance, and example paths. The skills and rulings file already do. Config fails the subtraction test; CI has none. Default: `owner`.
- **D2 Records.** Exempting docs/reviews, sessions and research leaves about 95% of the occurrences in place. Scrub them with one replacement table and a proof script that maps every changed line back, as known-bugs' conserve.mjs did. Default: `scrub`.
- **D2a Catch-ledger study.** Options: re-key its label cache with no model call, exempt the two tranche corpora (181 files, 36 with the full name), or pay a relabel (up to about $14). Recommend re-key, with a test that `build` reproduces the scrubbed results. Default: `rekey`.
- **D3 Other projects' HANDOFFs.** Options: H1, any heading starting "Open for", with no name in code and no end date. H2, an alias list holding the old name until a date. H3, plain "Open", which would also read the seed's `## Open` (the known bug at FEAT-002.md:17). Inferred: H3 makes the product report refuse seeded projects' untagged entries. Recommend H1, with one shared constant replacing the duplicate regex in handoff-asks.mjs:11. Default: `prefix`.
- **D4 Lane split.** Lane A: code, tests, rows, shipped text, HANDOFF and the scan, with record folders allowlisted at pinned counts. Lane B scrubs records and empties those entries. This keeps the install ladder off 600 mechanical files. Default: `two`.
- **D5 Guard.** Options: a plaintext list in one allowlisted config (simplest, but the repo still holds the name once), sha256 hashes of lowercased tokens, or a CI secret (local suites go blind). Recommend hashes, with a per-file allowlist that carries a reason and pinned counts. It replaces R-1415's plaintext list. Default: `hash`.
- **D6 Frozen desk.** Two desk comments. The owner's call: the freeze is the owner's ruling. Default: `exempt`.
- **D7 Personal projects.** They are neither the name nor work. Default: `keep`.

## 4. Must-meet rows

R-2511 onward. Inferred next free ID: the ledger's highest is R-2510.

1. **R-2511** The identity scan shall report every tracked file outside its allowlist that carries an identity word. Test: `packages/nana-pack/tests/identity-scan.test.mjs` "no tracked file outside the allowlist carries an identity word". It scans `git ls-files`. Red: 671 files carry the first name.
2. **R-2512** WHEN a token matches an identity hash in any case, as a possessive, in a path or in a hyphenated name, the identity scan shall report it. Same file: "the scan finds identity words in every written form". It injects a made-up word's hash over a temp tree. Red: the module is absent.
3. **R-2513** IF an allowlisted file's count for an identity word differs from its entry, THEN the identity scan shall report that file. Same file: "an allowlisted file with one more identity word is reported". Red: absent.
4. **R-2514** WHEN a HANDOFF heading starts with "Open for", the product report shall list that section's entries as asks. `product-report.test.mjs` "an Open for heading with any name is read as the asks section". Red: measured, 0 asks under "Open for the owner".
5. **R-2515** WHEN a HANDOFF heading starts with "Open for", the frontier report shall check that section's entries for tags. `frontier.test.mjs` "an Open for heading with any name gets the tag check". Red: measured, no open-tag finding.
6. **R-2516** WHEN a transcript attaches the writing rule under any "Writing for" title, the trial extractor shall count that session as rule-attached. `writing-trial-extractor.test.mjs` "a rule attached under either title counts as attached". Red: exact-title match (inferred; not run).
7. **R-2517** (lane B) WHEN the catch-ledger build runs on the scrubbed corpus, it shall reproduce the recorded results with no model call. `apps/bench/test/catch-ledger.test.mjs` "build reproduces the recorded results with no model call". Green on main, measured. A naive scrub turns it red, measured.
8. **R-2518** (lane B) The identity allowlist shall name only byte-pinned files and frozen-desk files. `identity-scan.test.mjs` "the allowlist names only byte-pinned and frozen-desk files". Red: absent.

Rows that change text only: R-751, R-682, R-875, R-877, R-878, R-2470, R-2471, R-1018, R-1030, R-1415, FEAT-039 Purpose and the seven desk Status lines.

## 5. Class, tunables, limits, threat, files

**Class.** Lane A is an install, hook or gate lane. It changes a pi extension (nana-writing.ts), the SessionStart producer nana-adoption.mjs, and rules and tests that nana-setup installs. It gets the roster reviewer, the land reviewer, the seat's wrong-code pairs, one independent check, a macOS install-check before `nana-land`, and the Windows CI leg. Lane B is ordinary. Feature: FEAT-032 · Keep instructions and documentation accurate (inferred fit; the owner decides placement). Carry `requirements-moved.mjs` output in both briefs.

**Tunables** (new root `identity-scan.config.json`, like readme-check's):
- `IDENTITY_WORD_HASHES`: contract, 2026-10-16 ruling; four words from this census, 2026-10-21; sealed by R-2511.
- `IDENTITY_ALLOWLIST`: chosen; each path carries reason and counts.
- Token split on non-alphanumerics, hyphen and apostrophe: chosen; catches every census form.
- `OPEN_SECTION_PREFIX` "Open for": contract (R-2514, R-2515). `OPEN_SECTION_NAME` "Open for the owner": chosen.
- Writing heading: contract (R-751). Title prefix "# Nana — Writing for": contract (R-2516).
- Replacement table: chosen; precedent is the skills' wording.

**Known limits.** History keeps every occurrence, by ruling. Commit author metadata carries the owner's real name and machine name in every past and future commit; changing the git author is the owner's call. The handle stays in the repository address. Short-word hashes are dictionary-reversible. The scan catches words, not descriptions. A stray "Open for review" heading would read as asks. The seed's `## Open` stays unread.

**Threat model.** Honest variation is in scope: a seat or builder types the name, a CI log prints a test title, a fixture copies a local path. Deliberate forgery is out: homoglyphs, zero-width splits or encoded names.

**Files, lane A.** Rows 1–4, 6 (not the desk) and 7; REQUIREMENTS.md; HANDOFF.md; AGENTS.md; FEAT-002.md; new `scripts/identity-scan.mjs`, config and test; regenerated tree and map.

**Files, lane B.** docs/reviews, docs/sessions, research, design docs, assessments.json, apps/bench/studies (not the fixture), and scrub, proof and re-key scripts in the lane's review folder.
