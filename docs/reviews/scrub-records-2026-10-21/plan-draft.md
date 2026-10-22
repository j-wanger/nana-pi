# Lane plan draft: records scrub, `scrub-records` (base: lane A tip 896314fe)

Feature: FEAT-032 · Keep instructions and documentation accurate (R-2517 sits in FEAT-038, the study's feature; the seat's call).
Placeholders `<first>`, `<login>`, `<surname>`, `<acr>` (the work acronym). Probe: `git archive` export of 896314fe in the planner's scratch folder, `git init`, temp HOME; a scratch clone for the history check. Every count comes from `countIdentityWords`/`scanTree` with the committed config; no file the planner wrote holds a word. Counts are per word in the order first, login, surname, acronym.

## 1. What the lane changes

It scrubs the 882 `record` entries' files with one context table that a script applies after finding the words by digest at run time. It re-keys the catch-ledger caches so the study rebuilds byte for byte. It paraphrases 84 work-domain lines. Then it deletes the allowlist writer and the `record` reason, so 8 pinned entries remain. A full trial in scratch did all of this except the paraphrase: 877 table files plus 5 regenerated study files, 5,416 changed lines, line counts unchanged, `findings=0 totals=5,0,0,4`.

## 2. Census at 896314fe (882 record entries; 8 other entries stay)

| Folder | Files | first, login, surname, acr | Kind | Files | first, login, surname, acr |
|---|---|---|---|---|---|
| docs/reviews/ | 828 | 3,308 · 1,974 · 50 · 755 | CI logs (`ci-*.log/txt`) | 164 | 1,589 · 610 · 0 · 314 |
| docs/sessions/ | 2 | 174 · 0 · 0 · 10 | reviewer and worker run logs (`.log`) | 114 | 0 · 211 · 0 · 0 |
| research/ (distilled) | 4 | 25 · 0 · 0 · 4 | command outputs (`.txt`) | 48 | 26 · 234 · 0 · 48 |
| research/raw/ | 22 | 132 · 7 · 2 · 12 | review system prompts (`*system.md`) | 50 | 78 · 1 · 50 · 1 |
| apps/bench/studies/ | 19 | 30 · 38 · 0 · 3 | JSON and JSONL | 21 | 561 · 547 · 0 · 156 |
| design docs under docs/ | 6 | 50 · 0 · 0 · 20 | prose `.md` | 450 | 1,465 · 385 · 2 · 243 |
| product report assessments | 1 | 32 · 0 · 0 · 0 | scripts (`.mjs/.py/.sh`) | 33 | 26 · 31 · 0 · 38 |
| **Total** | **882** | **3,751 · 2,019 · 52 · 804** | other (`.tsv`, `.html`) | 2 | 6 · 0 · 0 · 4 |

No tracked session transcript exists; the 114 run logs are runner output. The studies split as catch-ledger 5 files, tool-profiles pilot `argv.txt` 13 (login in paths), and one VERDICT.md. The two largest files are the hardening audit's findings.json (350 · 187 · 0 · 147) and the verdict-position corpus (0 · 336 · 0 · 0). The record file named after the owner was already renamed by lane A; no tracked path carries a word.

## 3. Pins inside the records

| # | Pin | What breaks if bytes change | How the lane keeps it true | Evidence |
|---|---|---|---|---|
| 1 | Catch-ledger caches: label key = report name + 16-hex sha of the prompt; match key = lane + sha of guide, schema and prompt. Prompts embed 79 tranche files' text | `build` drops labels and exits 1; a name-only re-key exits 0 with changed numbers (attack M2) | Exact re-key (D2) | 35 of 46 label-a, 22 of 28 label-b, 6 of 6 label-c, 8 of 16 per match file map one to one; the rest are superseded and keep their keys |
| 2 | Study outputs written by `extract` and `build` | Study numbers | Regenerate after the re-key | results.json, table.md, kappa-pairs.json, reports.json byte-equal to the base; rows.jsonl and ledger.jsonl equal the table applied to the base; skipped.jsonl differs from that in 4 lines, where a fixed-length text cut moves |
| 3 | Label quotes verified verbatim against fix briefs at label time | A stored "verified" would be false | Same table on both | 191 of 191 quotes still verify |
| 4 | `catch-ledger.test.mjs` reads the real tranche corpus (35 reports, 28 fix briefs, named bodies and surfaces) | Its checks | Nothing extra | 76 of 76 pass on the trial |
| 5 | Product report stamps: purpose and row hashes checked against history | "stamped purpose differs" | Words sit only in 5 prose fields (32), none in a stamp | validateStore passes in a history clone after the trial |
| 6 | Tool-profiles fingerprint: study.json, tasks, fixture, settings | Nothing: no record with a word is hashed | Scrub the 13 pilot argv files and VERDICT.md; the 3 fixture files stay byte-pinned | FIXTURE.sha256's sha256 equals study.json's pin |
| 7 | Other readers: knowledge-home test greps `docs/reviews/*.mjs`; journal keys `v2:<sha>`; lift verify records copy the old lift fixture; the writing trial's manifest hashes transcripts outside the repo | No reader checks the scrubbed bytes | Scrub; the lift copies get lane A's neutral rows | Knowledge-home test passes on the trial |
| 8 | Whole-file hashes, code map, readme check | None found | Nothing | 0 of 882 files' sha256, 16-hex prefix or git blob id appears in any tracked file. No golden can embed a changed line: each holds a word, and no non-record file does. map:check and readme:check green on the trial |

Not pins: review-ledger tallies are keyed by commit in git's own folder; seat proof scripts inside records (conserve.mjs and the like) read history at their own base and already stopped re-running on HEAD with lane A. The 159 records with a byte-order mark keep it (measured).

## 4. Open design choices

- **D1 Scrub method.** Options: a context table applied by a script; hand edits (the builder may not type the words); a one-word swap (breaks paths and identifiers). Recommend the table. `scrub.mjs` reads the digests, finds the words in memory with the scan's tokenizer, and prints classes, counts and paths only. A dry run must match this census. `proof.mjs --base <rev>` checks every changed file: same line count, each changed line equals the table applied to the base line or sits on the paraphrase list, zero words left, and every base record entry now counts zero. It also checks the study rules in row 2 of section 3. The builder reads `git diff --stat` and the proof, never a raw record diff. Default: `table`.

  | Context | Becomes | Trial |
  |---|---|---|
  | `<first>` after "Open for " or "Writing for " | the owner | 950 |
  | possessive | the owner's | 836 |
  | `<first> <surname>` | the owner | 52 |
  | other prose, including "(…, date)" provenance | the owner; The owner at a sentence or line start; "a `<first>` X" becomes "an owner X" | 1,642 |
  | inside a code span | `owner` | 32 |
  | part of a kebab, snake or camel identifier | `owner` / `Owner` | 49 |
  | a home-folder segment (`/Users/W`, `C:\Users\W`, `-Users-W-`), any word | `example` | 2,174 |
  | `<login>` in prose | the owner | 2 |
  | `<acr>-desk`, the work project's folder | `work-project` (chosen: reads as a noun; lane A's test uses `a-work-project`) | 723 |
  | `<acr>` inside another identifier | `work` | 33 |
  | `<acr>` in prose | the work project, then the human pass | 45 |
  | catch-ledger study files | regenerated (D2) | 36 |

  The trial table left 7 article slips ("a the owner"), which the article rule fixes.
- **D2 Catch-ledger.** Options: exact re-key, exempting the 79 tranche files and 5 study files (keeps the name, against the ruling), or a relabel (about $14, and model output differs). Recommend exact re-key. `rekey.mjs` builds the jobs on the base corpus and on the scrubbed one. It pairs label keys by report name per pass and match keys by lane. It rewrites only cache records whose key equals a current base key; superseded records keep theirs. It asserts the pairing is one to one and collision-free. The table runs on the cache bodies. Then `extract` and `build` run. Measured in scratch: byte-equal as in section 3. Default: `rekey`.
- **D3 Where the key builders live.** Options: move `corpus`, `labelJobs`, `matchJobs`, `currentLabels` and `currentMatches` into a new `apps/bench/lib/catch-jobs.mjs` that takes the roots as parameters; export them from the CLI behind a main guard (its roots come from env at import, so two corpora need two processes); or copy them into the one-time script (duplicate code, though R-2517 still catches drift). Recommend the move: R-2517 is green before and after it, which pins that it changed nothing. Default: `move`.
- **D4 Work-domain text.** 84 lines in 34 record files: 54 carry the acronym outside the folder name, 41 carry a domain term, and 17 mention the work machine (lines overlap). Seven lines name a regulator, report type or act. One is the design doc line that reveals the country, five are lift verify copies of the old fixture, and one non-record line is lane A's leftover threshold row in the lift test. Recommend paraphrasing to role words with no regulator, report type or country. `paraphrase.tsv` lists path, line and category, with no text. The proof exempts only those lines. The seat reads them by path and line before the final round, and the owner may. Lane B fixes the leftover lift test row if lane A lands it. Default: `paraphrase`.
- **D5 Writer and record reason.** After the scrub, all 8 entries are byte-pinned or frozen-desk. Their counts cannot change without breaking the pin or the freeze, so a writer has no job (subtraction). Recommend deleting `--write-allowlist`, the record prefixes and the `record` reason, and rewording README.md's scan line. Option: keep a writer that skips records, which is code for 8 hand-held entries. Default: `delete`.
- **D6 Known bugs this lane fixes.** Fix four: the writer (R-2519); the `ls-files` buffer (R-2520; `maxBuffer: Infinity`, so no tunable); R-2511's failure detail, which will name the first finding paths and the scan command (no new row); and the display test's Windows path, which becomes `C:\Users\example\Repo\A.TS` (no new row). The rest stay: tokenizer escapes, plural or compound acronym (0 instances in the trial tree, measured), history, legal name and machine name, the handle, dictionary reversal, descriptions, time zone, Open-for prefix, stale shipped text, stale Windows copy, lanes in flight. Default: `four`.
- **D7 Class and order.** The lane is ordinary: it touches no install, hook, gate or review-tool file. It starts after lane A lands and re-runs this census on that tip. It builds and lands alone, for two reasons. Every lane appends to the session log this lane rewrites. Any lane with a word in its records would fail the scan at its own land. Queued lanes wait. Default: `alone`.

## 5. Must-meet rows

| Row | EARS (one shall) | Test file :: title | What it does | Red before the change |
|---|---|---|---|---|
| R-2517 (FEAT-038) | WHEN extract and build run over the committed review corpus and study caches, the catch ledger shall write every study file byte-equal to its committed copy without a model call. | `apps/bench/test/catch-ledger.test.mjs` :: "build reproduces the recorded results with no model call" | Copies the study to a temp `CATCH_OUT` and points `CATCH_JUDGE_BIN` at a missing file. Runs the CLI's `extract` then `build`, and compares all 15 files by bytes. | Green at the base (15 of 15, measured); it pins the invariant. Red on three wrong builds: a scrub with no re-key (exit 1, lane A measured); a re-key by name or lane only (3 files differ, attack M2); skipped.jsonl scrubbed by the table instead of regenerated (4 lines, measured) |
| R-2518 | The identity scan config shall hold only allowlist entries whose named pin recomputes from the tracked bytes or whose path lies under `apps/desk/`. | `packages/nana-pack/tests/identity-scan.test.mjs` :: "every allowlist entry is byte-pinned or frozen-desk" | Parses each pin. `fixture <study.json> <sha>`: the file's manifest line matches its bytes, and the manifest's sha256 equals the study's pin. `sha256 <manifest> <sha>`: the file's sha256 is listed there. `key <manifest> <sha>`: a JSON key with that sha256 holds every word in the file. Also injects a `record` entry, a free-text pin and a wrong digest; each fails. | 882 `record` entries and one free-text pin, the retired path cleanup entry (measured) |
| R-2519 | IF the identity scan is run with `--write-allowlist`, THEN it shall exit 2 and leave the config's bytes unchanged. | same :: "the scan refuses to rewrite its allowlist" | Runs the CLI on a temp git tree with a copied config, and compares the exit code and the bytes. | The flag rewrites the config, raising a record's count and adding a new record (independent check, measured) |
| R-2520 | WHEN git lists more than 1 MiB of tracked paths, the identity scan shall scan every tracked file. | same :: "the scan reads a tracked list over 1 MiB" | Builds a temp tree of 9,000 empty files on 126-character paths (1,134,000 bytes of listing, 0.9 s on macOS). Uses a made-up digest and expects 9,000 files scanned. | ENOBUFS after 33 ms at 896314fe (measured). The Windows path stays under 260 characters (inferred) |

R-2511's test needs no new row: once the record entries are gone, it is the suite's proof that every record is clean.

## 6. Sessions, tunables, limits, threat, files

**Sessions.** Two sessions with the larger builder, by size. Session 1 writes the lib move, the four tests (R-2518 to R-2520 red, R-2517 green), the scan changes and the known-bug fixes. It also writes `scrub.mjs`, `rekey.mjs` and `proof.mjs`, whose dry run must match section 2. Session 2 runs the scrub, re-key, `extract` and `build`, and the paraphrases. It empties the record entries; then R-2518 goes green, the proof comes back clean, and the locked full suite passes. Between sessions the seat re-runs the dry run and R-2517. The seat writes HANDOFF, FEAT-032's known-bug lines and the session entry before the final round. A draft PR runs the Windows leg. One final reviewer from another lineage reads the code diff and the proof, and samples records by path and line; it reports counts and paths, never removed lines.

**Tunables.** The replacement table and `work-project` are chosen (D1, lane A's precedent). The pin grammar is contract (R-2518). The lane adds no buffer constant.

**Known limits.** History keeps every word (ruling). Records' home paths and cited memory-file names no longer resolve. Superseded cache records keep old keys. In 4 skipped rows the text cut moves. Journal cache keys no longer match their prompts. CI logs no longer show what CI printed. The handle stays in repository addresses (lane A's limit). The region time zone stays in one record. The 84-line pass is human judgement that no scan checks.

**Threat model.** Honest variation is in scope: a word in a context the table misreads, a byte-order-marked log, a superseded cache record, a Windows checkout (LF by `.gitattributes`), a later lane pasting a log with a home path. Deliberate forgery is out.

**Files.** The 882 records; `identity-scan.config.json`; `scripts/identity-scan.mjs`; README.md's scan line; `identity-scan.test.mjs`; `catch-ledger.test.mjs`; `apps/bench/catch-ledger.mjs` and the new lib module; one line of `display-surfaces.test.mjs` (and of `requirements-lift.test.mjs` if needed); R-2517 to R-2520 in REQUIREMENTS.md; FEAT-032's known-bug file; the regenerated map; the lane folder's three scripts and `paraphrase.tsv`.
