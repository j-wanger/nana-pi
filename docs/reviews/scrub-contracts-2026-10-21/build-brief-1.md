Feature: FEAT-032 · Keep instructions and documentation accurate. Lane scrub-contracts, rows R-2511 to R-2516. Class: install, hook or gate. Builder: pi-worker (larger lane). Build session 1 of 3: the identity scan.

Work in ~/nana-pi-wt/scrub-contracts on feat/scrub-contracts. The plan of record is `docs/reviews/scrub-contracts-2026-10-21/must-meet.md`: read its seat decisions (D5 and the tokenizer especially), rows and known limits first. Follow packages/nana-pack/prompts/builder-preamble.md. Never edit HANDOFF.md, docs/known-bugs/, docs/sessions/, docs/reviews/ or packages/nana-pack/rules/. No push. Never write an identity word into any file you create or into your report: use the digests below, and in prose say "the owner".

1. `identity-scan.config.json` at the repo root: `{ "$comment": …, "wordDigests": [ … ], "allowlist": [] }`, with the four sha256 digests of the lowercased identity words, in this order (first name, login name, surname, work acronym):
   - `cdf30c6b345276278bedc7bcedd9d5582f5b8e0c1dd858f46ef4ea231f92731d`
   - `bac080aab1142c3d251ae1ecad795693dce90da3d614178ac6e2baf47d920dd0`
   - `2ac81299578013795576682809a4a16d1ecca67118a797ea576c113c41786849`
   - `22775a0eeeb56ca5f021663d7fa549fa699859e8561cefae37f41547ad277f9e`
   Its `$comment` gives the provenance: the 2026-10-16 ruling (no owner name, nothing about the owner's work) and the 2026-10-21 census. Each allowlist entry is `{ "path", "counts": [n0, n1, n2, n3], "reason": "record" | "byte-pinned" | "frozen-desk", "pin"?: "<what the bytes rest on>" }`.

2. `scripts/identity-scan.mjs`, a new module with the six-tag header. Export a pure `scanTree({ root, config, files? })` that returns findings: a tracked file whose path or content holds an identity word and has no allowlist entry, and an allowlisted file whose per-word counts differ from its entry in any word (more, fewer or swapped). The root comes from `git rev-parse --show-toplevel` run from the given directory, never the cwd; the file list is that root's `git ls-files`. The tokenizer: split on `[^A-Za-z0-9]`; inside an all-letter token, also split camelCase parts; hash only tokens whose length equals an identity word's length, lowercased, with sha256; scan each path's segments and file name as well as the content; read CRLF files the same. Export the count function so tests and the allowlist writer share it. A CLI: `node scripts/identity-scan.mjs [--root <dir>]` prints one line per finding (path and which word index, never the word) and a summary line, exiting 1 on any finding; `--write-allowlist` rewrites the allowlist with a `record` entry for every currently matching file under `docs/reviews/`, `docs/sessions/`, `research/`, `apps/bench/studies/` and the design docs directly under `docs/`, keeping existing `byte-pinned` and `frozen-desk` entries. Name the script, its flags and what it does in the root README beside the other repo scripts.

3. Tests in a new `packages/nana-pack/tests/identity-scan.test.mjs` (six-tag header), each with the must-meet's exact title and its `// req:` marker:
   - R-2512: a temp git tree; a config whose digests hold a made-up word's digest (pass the config in; never touch the real one); the seven forms the must-meet lists are each found, a CRLF file reads the same, and a mixed-alphanumeric id holding the word is not found.
   - R-2513: one allowlisted temp file, then three mutations — one more, one fewer, and two words swapped at the same total — each reported.
   - The seal test `seal: identity word digests` (req R-2511): the committed config's four digests, compared as literals here only.
   Add R-2512 and R-2513 to FEAT-032 in REQUIREMENTS.md with the must-meet's texts, status `implemented` and their evidence. R-2511's row and repo-wide test come in session 3.

4. R-1415 (`packages/nana-pack/tests/rulings.test.mjs` near :205-213): its plaintext word list is itself an identity occurrence. Replace it with the scan: the rulings file's content holds zero identity words under the committed digests, using the exported count function. Keep the check's title. Change R-1415's text to say the rulings file holds none of the identity words in the identity scan's config, and its evidence stays the same title.

5. Run the new test file, `rulings.test.mjs`, then `npm run map`, `npm run map:check`, `npm run req:tree`, `npm run readme:check` and `node scripts/requirements-trace.mjs`. Run `node scripts/identity-scan.mjs --root .` once and put its summary line and the per-word totals (counts only) in your report; it is expected to fail now, because sessions 2 and 3 do the scrub. Try the wrong versions the must-meet names (a camel split on mixed ids; a one-sided count check; a cwd-relative file list) and see the checks go red; restore. Commit with explicit paths. No full suite this session.

Seat check: `node docs/reviews/scrub-contracts-2026-10-21/seat-titles.mjs 1` must print `0 missing`.

Done:
- The config, the scan, its CLI and README line, R-2512, R-2513, the seal and the reworked R-1415 are in; the two test files, map:check, req:tree, readme:check and the trace are green; the work is committed.

Report (at most 12 lines after the VERDICT line): the commit sha; the check results; the scan's summary line and per-word totals on the repo (counts only); the wrong versions tried; map, readme, trace and seat-check status.
