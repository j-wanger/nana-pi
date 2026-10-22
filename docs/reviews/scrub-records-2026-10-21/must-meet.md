# scrub-records · must-meet (seat and plan adversary, 2026-10-21)

Feature: FEAT-032 · Keep instructions and documentation accurate (R-2517 sits in FEAT-038, the catch-ledger study's feature)

Class: ordinary. The lane changes records, the identity scan and its test, the catch-ledger test and study files, two test fixtures and the README's scan line; no install, hook, gate or review-tool file. Ladder: one final reviewer from another model family. Threat model: honest variation in scope — a word in a context the table misreads, a code token or a fenced block, a byte-order-marked log, a superseded cache record, a Windows checkout, a later lane pasting a log with a home path; deliberate forgery out.

Rulings: the public repo carries no owner name and nothing about the owner's work (2026-10-16); the scrub covers the current files only, with no history rewrite (2026-10-21). Inputs: the planner's draft (`plan-draft.md`) and the adversary's attack (`plan-attack.md`), both measured at lane A's tips 896314fe and e55e5926. This lane's base is main 383b1588, where lane A landed; it re-runs the census there. Placeholders `<first>`, `<login>`, `<surname>`, `<acr>`.

## What changes for the user

Every record (review corpora, session archive, research, bench studies, design docs, the product report's assessments) stops naming the owner and stops describing the owner's work. The allowlist then holds only the eight pinned entries, and its writer goes, so a record can no longer gain a name and pass. The catch-ledger study keeps its recorded results byte for byte.

## Seat decisions (not the owner's call; each is reversible)

- **D1 · The scrub method: `table`.** `scrub.mjs` finds the words by digest at run time, applies one context table, and prints classes, counts and paths only; it takes one file too, so a later seat can clean a pasted log. Contexts as the draft lists, plus a code context (attack M2): record scripts (`.mjs/.js/.py/.sh`) and fenced blocks take the identifier rule (`owner`, `work`, no space), and lane A's real renames map by name (the old splitter becomes `splitOpenSection`, attack N3). An article rule fixes "a the owner". The work project's folder name becomes `work-project`.
- **The proof.** `proof.mjs --base <rev>`, one-time, not a suite test: same line count per file; each changed line equals the table applied to its base line, or sits on the paraphrase list; zero words left; every base record entry counts zero. Checks that do not reuse the table (attack M2): every changed script that parsed at the base still parses (`node --check`, `py_compile`, `bash -n`); every changed JSON file or JSONL line still parses; no spaced replacement lands inside a whitespace-free token holding `/ \ @ = (`. On paraphrase lines, the base line's numbers, code spans, paths and URLs survive (attack S2).
- **D2 · The catch-ledger: exact re-key.** `rekey.mjs` builds the label and match jobs on the base corpus and on the scrubbed one, in one process (two imports of the CLI's functions), pairs label keys by report name per pass and match keys by lane, rewrites only records whose key is a current base key, and asserts the pairing is one to one. Then `extract` and `build` run. Superseded cache records keep their keys.
- **D3 · No library move: `copy`.** Nothing else imports the key builders (attack S1). `rekey.mjs` reaches them without a production change.
- **D4 · Work-domain text: `paraphrase`.** About 84 lines in 34 records, plus lane A's corpus lines that name kinds of work detail (attack N5), are reworded to role words with no regulator, report type, act or country. The paraphrase runs before the re-key (one label-prompt input holds such a line). `paraphrase.tsv` lists path, line and a neutral code, never text. The seat reads every listed line by path and line before the final round.
- **D5 · Writer and record reason: `delete`.** `--write-allowlist`, the record prefixes and the `record` reason go; the README's scan line says how to add a pinned entry by hand.
- **D6 · Known bugs this lane fixes.** The writer (R-2519); the 1 MiB `ls-files` buffer in the scan and in R-2511's own count (R-2520, attack S4); R-2511's failure detail names the first finding paths and the scan command; the display test's Windows path becomes `C:\Users\example\…`; the lift test's one remaining work-domain fixture row becomes neutral. pi-review's git helper has the same 1 MiB limit: a known-bug line, since touching it would make this a review-tool lane.
- **D7 · Order: `alone`.** It starts from main after lane A lands and builds and lands with no other lane in flight, because every lane appends to the session archive this lane rewrites.

## Must-meet rows

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2517 | WHEN every catch-ledger subcommand runs over the committed corpus and caches with no judge available, the catch ledger shall exit 0 and leave every study file byte-equal to its committed copy and to its digest recorded at the base. | `apps/bench/test/catch-ledger.test.mjs::the study reproduces its recorded results with no model call` |
| R-2518 | The identity scan config shall hold only entries pinned by one of the sealed manifests, whose pin recomputes from the tracked bytes, or one of the sealed frozen-desk entries with its sealed counts. | `packages/nana-pack/tests/identity-scan.test.mjs::every allowlist entry is byte-pinned or frozen-desk` |
| R-2519 | IF the identity scan is run with `--write-allowlist`, THEN it shall exit 2 and leave the config's bytes unchanged. | `packages/nana-pack/tests/identity-scan.test.mjs::the scan refuses to rewrite its allowlist` |
| R-2520 | WHEN git lists more than 1 MiB of tracked paths, the identity scan shall scan every tracked file. | `packages/nana-pack/tests/identity-scan.test.mjs::the scan reads a tracked list over 1 MiB` |

### What each test does, and why it is red before the change

- **R-2517.** Copies the study to a temp `CATCH_OUT` with the judge absent; runs `extract`, `label a`, `label b`, `label c`, `match a`, `match b`, then `build`; each exits 0. It compares all 15 study files by bytes, and compares the four word-free outputs (results.json, table.md, kappa-pairs.json, reports.json) with a digest manifest beside the study, recorded at this lane's base; a seal, `seal: catch-ledger study digests`, pins the manifest's four digests and names R-2517 (attack M1; precedent the tool-profiles fixture manifest). Green at the base; it pins the invariant. Red on wrong builds: a name-only re-key (`match` exits 1, digests differ), a name-and-lane re-key (digests differ), no re-key (`build` exits 1), a table-scrubbed skipped.jsonl (4 lines differ) — measured by the planner and the adversary.
- **R-2518.** Parses each entry's pin against three sealed manifest rules (the tool-profiles `FIXTURE.sha256` through study.json, the retired-fingerprints values, the skill-copy-history keys) and recomputes it; the two frozen-desk entries are sealed with their paths and counts. Injected cases each fail: a `record` entry, a free-text pin, a wrong digest, a self-pin, a third desk path, a desk count bump (attack S3). Red before: 882 record entries and free-text pins.
- **R-2519.** Runs the CLI with the flag on a temp git tree with a copied config; exit 2 and the same bytes. Red before: the flag rewrites the config (independent check, measured).
- **R-2520.** Stages 9,000 paths through `git update-index --index-info` with the empty blob and no files on disk (a listing over 1 MiB); a made-up digest; 9,000 files scanned. Red before: ENOBUFS (measured, 83 ms setup).

R-2511 needs no new row: once the record entries are gone, it is the suite's proof that every record is clean.

## Tunables

- The replacement table, `work-project` and the code context — chosen (lane A's D1 and this plan's D1).
- The pin grammar and the sealed manifests — contract (R-2518). The study's digest manifest — contract (R-2517). No buffer constant (`maxBuffer: Infinity`).

## Known limits (carried to the feature files)

- History keeps every word, by ruling.
- Records' home paths and cited memory-file names no longer resolve; CI logs no longer show what CI printed.
- Superseded cache records keep their old keys; the re-keyed caches claim the judge saw the scrubbed prompts, and the match prompt's cut moves (FEAT-038).
- In 4 skipped rows the text cut moves.
- The 84-line paraphrase is human judgement that no scan checks beyond the preserved-token rule.
- R-2519 pins an absence; R-2518 fails any entry a renamed writer could add.
- pi-review's git helper keeps the 1 MiB limit.

## Seat steps

- Two build sessions with the larger builder. (1) R-2517 and its seal (green), R-2519 and R-2520 (red, then green), the writer's removal, the buffer fix and the other known-bug fixes, `scrub.mjs`, `rekey.mjs` and `proof.mjs`; their dry runs must match the census, and no record changes. (2) R-2518 (red on the pre-scrub config), the paraphrase, the scrub, the re-key, `extract` and `build`; empty the record entries and drop the `record` reason; R-2518 green; the proof clean; the locked full suite.
- Between sessions the seat re-runs the dry runs and R-2517, and writes `paraphrase.tsv` (path, line, neutral code) with a finder kept outside the repo, since its search terms name the work.
- The review brief names a pathspec that leaves out the record folders, so no reviewer quotes a removed line; the seat scans each review output before committing it (attack S5). The seat reads the paraphrase list by path and line before the final round.
- A draft PR runs the Windows leg. Reserve R-2517 to R-2520.
