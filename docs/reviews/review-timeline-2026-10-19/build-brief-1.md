# Build brief 1 — review-timeline (2026-10-19)

Feature: FEAT-007 · Review a specific revision independently
Work in the lane worktree on `feat/review-timeline`. The plan of record is `docs/reviews/review-timeline-2026-10-19/must-meet.md`: design, rows, tests and limits. Use rows R-1560 to R-1565 only. Class: ordinary. Threat model: honest variation in our tools' output, platforms and configs is in scope; deliberate forgery is out.

## Change
1. REQUIREMENTS.md: add R-1560 to R-1565, with the must-meet text, at the end of FEAT-007 › SUB-010, status `untested`; flip each to `implemented` with evidence when its test passes. Run `npm run req:tree`. Raise the R-291 leaf total (count and check title) in `packages/nana-pack/tests/requirements-tree.test.mjs` by 6, and name that edit in your report.
2. New `packages/nana-pack/lib/review-timeline-config.mjs`: SHORT_REVISION_CHARS 12 (contract: the R-970 report), FINDING_MAX_CHARS (chosen), the words MUST, SHOULD, NOTE and SEND-BACK (contract: prompts/review-standard.md), the R-1562 statements and R-1563 marks (contract: those rows). Provenance beside each value.
3. New `packages/nana-pack/lib/review-findings.mjs` (pure): the verdict word on a text's last line carrying `VERDICT:`, and its MUST titles by the design's three rules. Split lines on `\r?\n`.
4. New `packages/nana-pack/bin/review-timeline.mjs`: the CLI in the design. Import only readRounds, canonicalItem, repoKeyOf and ledgerPaths from `bin/review-round.mjs`. Read the audit log and its rotated generation line by line, skip a line that does not parse, keep kinds verdict and verdict-unverified, join on repo, item, revision, role and endedAt, and treat a relative `out` as none. Read review files through `lib/bounded-read.mjs`. Home is HOME, else USERPROFILE, as `review-ledger report` does. Print file names only, collapse whitespace in every field, write to stdout only.
5. `packages/nana-pack/README.md`: one paragraph after the `review-ledger report` paragraph: usage, what it reads (tally, audit log, recorded review files), that it writes nothing, the MUST layouts it reads, and the known limits.
6. Run `npm run map`, then confirm `npm run map:check` and `npm run readme:check` are green.
Do not edit review-round, review-ledger, pi-review, nana-land, pi-watchdog, review-shape, scripts/test.mjs or windows-skips-config.

## Tests: `packages/nana-pack/tests/review-timeline.test.mjs`, RT1 to RT6, titles exactly as in must-meet.md
Use the PASS/FAIL `check()` style of watchdog-exit.test.mjs, `// req: R-15xx` directly above each check, no skips. Every spawn gets HOME and USERPROFILE set to a temp home under `tmpDir`; no spawn may see the real home. Repositories and review folders live under `tmpDir` too. Record reviews with real `review-ledger run --item … --role … --out <absolute folder>/<role>-r<N>.md -- <process.execPath> <stub> --model <name>`; the stub prints the file named by STUB_FILE byte for byte. Only RT3 (d) and RT4 append hand-made tally lines, copied from the shape of a real line. Each test first asserts exit 0 and that its reviews are listed.
- RT1: repo A with two commits. Round 1: opus SEND-BACK, fable LAND; round 2: opus LAND. The same item in repo B and another item in A must not show. Pass --item in mixed case. Check order, 12-character revisions, models, verdicts and durations shaped `<m>m <ss>s`.
- RT2: one revision, five SEND-BACK reviews, one layout each. (a) `## MUST` with numbered bold titles, `**Smallest fix:**` lines and nested bullets. (b) `### MUST — <title>` headings. (c) `### MUST` with `**1. Title.**` paragraphs and `**Files:**` labels. (d) `1. MUST — text` beside `2. SHOULD —` and `3. NOTE —` lines, verdict on the first line only. (e) `- **MUST — title.** detail` bullets, CRLF, no final newline. Every file also holds SHOULD and NOTE items. Exactly the MUST titles appear.
- RT3: (a) a file deleted after its run; (b) a file rewritten after its run to end `VERDICT: LAND` and hold a planted MUST; (c) a file in the HIGH/MEDIUM grammar; (d) a hand-made SEND-BACK tally line with no audit record. Each states its case; the planted text never appears.
- RT4: hand-made lines: one unverified with completedAs, one over-cap reason holding a line break, one null verdict, one version 1 line with no model or duration.
- RT5: the output holds neither the unique name of the tmpDir folder nor the temp home path, and does name `opus-r1.md`.
- RT6: the listing plus the sha256 of every file in the ledger folder and each review folder are equal before and after.

## Wrong code to try (each must turn its test red)
RT1: group by role; number rounds per review; drop the repo filter; skip canonicalItem. RT2: take every list item in a section; take bold labels; end a section at its first sub-heading; split on `\n` only; read the verdict from the last nonblank line; match MUST only at line start. RT3: skip the verdict cross-check; print nothing for a missing file. RT4: print `undefined`; drop the unverified mark; print the reason raw. RT5: print the recorded path. RT6: write the timeline beside the review files; write a cache beside the tally.

## Done
RT1 to RT6 pass by single-file run, and each was seen red against its wrong code. `review-ledger.test.mjs` and `requirements-tree.test.mjs` pass by single-file run. The rows are implemented with evidence. The map and README checks are green. Commits are on the lane branch, with explicit paths.

## Report (at most 10 lines)
Tip sha; files changed; for each test, pass and the wrong code that turned it red; edits to existing tests; any fixture whose MUSTs read wrong; what is unverified (Linux, Windows).