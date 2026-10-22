Feature: FEAT-002 · Resume decisions and next actions (SUB-005 · Keep next steps and open decisions current)

Lane frontier-first, rows R-2470 to R-2473 (block R-2470 to R-2479; R-2474 to R-2479 unused). Based on main 363df471.

Queue item (owner-approved 2026-10-21): "Put the handoff file's live sections first. The file is now 334 KB and 55,800 words. pi's read tool stops at 50 KB, so a pi seat never sees Next or Open. Claude Code will not read the file whole either. The checker gains a size check and an order check. The same change rewrites stale lines and moves old landed lines to the session archive."

Owner decision the same day: known bugs move out of HANDOFF into one file per feature in a separate later lane (known-bugs-per-feature). This lane does not move the Carried residuals; the whole-file size finding stays honestly reported until that lane.

Class: ordinary. The lane changes a report-only pack CLI (`packages/nana-pack/bin/nana-frontier.mjs`), its config, its test and fixture, the pack README and the ledger. The seat moves notes in `HANDOFF.md` and `docs/sessions/2026-10.md`. No nana-setup file, hook, pi extension, gate policy, land or review tool changes, and no runtime parses HANDOFF's section order (readers below). Ladder: the seat's wrong-code pairs, then one final reviewer of a different model lineage from the builder. CI's Windows leg runs `frontier.test.mjs`.

Threat model. In scope (honest variation): seats and the owner edit HANDOFF by hand: a new Landed line or a dated Landed section placed above Next; one-line entries hundreds of words long; multi-byte text such as em-dashes; headings with parenthetical or dash suffixes, and nested `###` headings; fenced examples; CRLF line endings in a Windows clone; a merge of another lane that puts a frontier block back below Landed; the read limits exactly as pi 1.0.2 and Claude Code 2.1.299 ship them. Out (deliberate forgery): a HANDOFF built to fool the checker — look-alike or zero-width headings, frontier text hidden in fences or HTML comments, headings renamed to dodge the name rule. A finding outside this model is a residual.

## Facts the design rests on (checked 2026-10-21)

- pi 1.0.2's read tool: `DEFAULT_MAX_LINES = 2000`, `DEFAULT_MAX_BYTES = 50 * 1024` (`$(npm root -g)/@earendil-works/pi-coding-agent/dist/core/tools/truncate.js:10-11`), applied by `read.js` through `truncateHead`, which counts UTF-8 bytes and keeps line k while the bytes of lines 1..k plus the k−1 newlines between them stay within 51,200 (`truncate.js:94-101`). pi 1.3.0 keeps the same values (`npm pack`, adversary).
- Claude Code 2.1.299's Read: `maxSizeBytes` 262,144 and `maxTokens` 25,000 by default (seen in the binary; `CLAUDE_CODE_FILE_READ_MAX_OUTPUT_TOKENS` overrides the tokens; an opt-in flag reads past the token cap). pi's window is the smaller, so it binds both seats.
- On main HANDOFF.md is 1,068 lines and 334,327 bytes; Next starts at line 1022, so a default pi read ends near line 105, inside Landed.
- No runtime reads HANDOFF's order: `handoff-asks.mjs` and `scripts/product-report.mjs` find Open for the owner by heading anywhere; `nana-handoff.ts` and `adoption.mjs` only check the file exists; nana-land and the review tools do not parse it. The project seed (`templates/_shared/HANDOFF.md`) is already live-first.

## Must-meet rows

| Row | Requirement (EARS) | Test (exact title) | Red today |
|---|---|---|---|
| R-2470 | WHEN a Where things stand, Next or Open for the owner heading comes after a heading named Landed or Carried residuals, the HANDOFF frontier report shall report that live heading's line as a section-order finding. | `packages/nana-pack/tests/frontier.test.mjs::R-2470: a Where things stand, Next or Open for Owner heading after a Landed or Carried residuals heading is reported as section-order` | RED: main's CLI has no section-order kind. |
| R-2471 | WHEN a Where things stand, Next or Open for the owner section ends past the first 51,200 bytes or the first 2,000 lines of the document, the HANDOFF frontier report shall report that section's heading line as a read-window finding. | `packages/nana-pack/tests/frontier.test.mjs::R-2471: a live section that ends past the read window in bytes or in lines is reported as read-window` | RED: main's CLI has no read-window kind. |
| R-2472 | WHEN a HANDOFF document is over 51,200 bytes or over 2,000 lines, the HANDOFF frontier report shall report one file-size finding that gives its byte and line counts. | `packages/nana-pack/tests/frontier.test.mjs::R-2472: a document over the read window in bytes or in lines gets one file-size finding with its byte and line counts` | RED: main's CLI has no file-size kind. |
| R-2473 | This repository's HANDOFF.md shall get no section-order or read-window finding from the HANDOFF frontier report. | `packages/nana-pack/tests/frontier.test.mjs::R-2473: this repository's HANDOFF.md gets no section-order or read-window finding` | RED: the control half fails on main (no such kinds). Main's own HANDOFF would get section-order at 1018, 1022 and 1040 and three read-window findings; the seat's restructure, committed before the build, makes the repo half pass. |

The four rows go in FEAT-002's SUB-005 table directly after R-879, each `untested` first, then `implemented` with backticked `file::title` evidence when its check passes. The two seal checks below are extra evidence on R-2471 and R-2472.

### What each test does

Every fixture goes in a temp folder (`tmpDir` or the file's existing temp pattern) and runs through the CLI the way the file's other checks do (`--today 2026-10-06` unless a check needs another day). Build fixtures from the imported `READ_WINDOW_BYTES` and `READ_WINDOW_LINES`, never from literals.

- **R-2470.** Four files; collect the line numbers of the `:<n>: section-order:` findings.
  - `after-landed.md`, nine lines: `# HANDOFF`, `## Landed`, `- 2026-10-21: one line.`, `## Where things stand`, `- state`, `## Next`, `1. step`, `## Open for Owner`, `- **[optional, since 2026-10-01] Ask.** body`. Expect `[4, 6, 8]`, each finding containing `comes after Landed at line 2`.
  - `after-residuals.md`: `## Where things stand`, `- state`, `## Carried residuals (live; one line each)`, `- residual`, `## Next`, `1. step`. Expect `[5]`, containing `comes after Carried residuals at line 3`.
  - `between.md`: `## Landed`, `## Where things stand`, `## Carried residuals`, `## Next`. Expect `[2, 4]`, both containing `comes after Landed at line 1` (the first archive heading decides).
  - `frontier-first.md`: the three live sections first, then `## Landed (one line each)` and `## Carried residuals`. Expect `[]`.
- **R-2471.** Collect the `read-window:` line numbers.
  - `bytes.md`: line 1 `## Where things stand`, line 2 `- state`, line 3 `## Next`, line 4 `### Detail`, then n = `Math.ceil(READ_WINDOW_BYTES / 1203) + 1` lines of `- ` + `'é'.repeat(600)` (1,202 bytes, 602 characters each), then `## Open for Owner` at line 5 + n and one tagged ask. Expect `[3, 5 + n]`. The `### Detail` line proves a section ends at the next heading of the same or a higher level, not at any heading.
  - `lines.md`: line 1 `## Where things stand`, then m = `READ_WINDOW_LINES + 100` lines of `- s`, then `## Next` at line m + 2 and `1. step`. Expect `[1, m + 2]`.
  - `small.md`: `## Where things stand\n- s\n## Next\n1. n\n`. Expect `[]`.
- **R-2472.**
  - `big-bytes.md`: `## Next\n` plus k = `Math.ceil(READ_WINDOW_BYTES / 1003) + 1` lines of `- ` + `'é'.repeat(500)` + `\n` (1,003 bytes and 503 characters each): over the byte window, under it in characters, under the line window. Expect exactly one `file-size:` line containing `bytes=${Buffer.byteLength(text)}` and `lines=${k + 1}`.
  - `many-lines.md`: `READ_WINDOW_LINES + 1` lines of `- s\n`. Expect exactly one `file-size:` line containing `lines=${READ_WINDOW_LINES + 1}`.
  - `at-limit.md`: `READ_WINDOW_LINES` lines of `- s\n`. Expect no `file-size:` line.
- **R-2473.** First a control: a temp file holds `## Landed\n`, then k = `Math.ceil(READ_WINDOW_BYTES / 1003) + 1` lines of `- ` + `'x'.repeat(1000)`, then `## Next\n1. step\n`; assert its output contains both `section-order:` and `read-window:`. Then run the CLI on `path.resolve(HERE, "../../../HANDOFF.md")` (this repository's file; read-only) and assert the output contains neither kind. Do not assert the file-size or word-budget findings; they stay honestly reported.
- **Seals.** `seal: HANDOFF read window is 51,200 bytes` and `seal: HANDOFF read window is 2,000 lines`, each marked `// req: R-2471 R-2472`, asserting the imported constants equal those values.

## Tunables (in `packages/nana-pack/lib/frontier-config.mjs`, provenance beside each)

| Name | Value | Provenance |
|---|---|---|
| `READ_WINDOW_BYTES` | 51200 | Contract value (R-2471, R-2472): pi 1.0.2's read tool `DEFAULT_MAX_BYTES = 50 * 1024` (`dist/core/tools/truncate.js:11`), checked 2026-10-21; pi 1.3.0 unchanged. Claude Code 2.1.299's Read limits (262,144 bytes, 25,000 tokens; seen in the binary 2026-10-21) are larger, so pi's window binds both seats. Sealed. |
| `READ_WINDOW_LINES` | 2000 | Contract value (R-2471, R-2472): pi 1.0.2 `DEFAULT_MAX_LINES = 2000` (`truncate.js:10`), checked 2026-10-21. Sealed. |
| `LIVE_SECTION_NAMES` | `["Where things stand", "Next", "Open for Owner"]` | Contract value (R-2470, R-2471): this repo's frontier headings, and the names `nana-soul.md` uses. Not sealed. |
| `ARCHIVE_SECTION_NAMES` | `["Landed", "Carried residuals"]` | Contract value (R-2470): this repo's archive headings. Not sealed. |

Update the config module's `@purpose` to "Defines the sealed word budget, read window and section names for HANDOFF frontier reports." and its `@outputs`.

## Design

1. `nana-frontier.mjs`: import the new names. Add a helper `isNamed(title, name)`: lowercase and trim the title; it matches when the title equals the name, or starts with it followed by whitespace, `(` or `—` (the rule `inSection` already uses; leave `inSection` unchanged). After the existing open-tag loop and before printing, append three checks in this order:
   a. **file-size (R-2472).** `bytes = Buffer.byteLength(text, "utf8")`; `lineCount = lines.length`, minus 1 when the text ends in a line ending (pi's own count). When `bytes > READ_WINDOW_BYTES` or `lineCount > READ_WINDOW_LINES`, add a finding on line 1: `file-size: bytes=<bytes> lines=<lineCount> window=<READ_WINDOW_BYTES> bytes, <READ_WINDOW_LINES> lines`.
   b. **section-order (R-2470).** Let `first` be the first heading whose title `isNamed` an archive name. For each later heading whose title `isNamed` a live name: `section-order: <Live> comes after <Archive> at line <n>`, with the canonical spellings from config.
   c. **read-window (R-2471).** For each live heading, `end` = the line before the next heading at the same or a higher level (else the last line). `endBytes` = UTF-8 bytes from the start of the file through the last character of line `end`, excluding that line's own line ending (pi's rule; on a CRLF file the `\r` of earlier lines counts). When `endBytes > READ_WINDOW_BYTES` or `end > READ_WINDOW_LINES` (1-based line number): `read-window: <Live> ends at byte <endBytes>, line <end>; a default read shows <READ_WINDOW_BYTES> bytes or <READ_WINDOW_LINES> lines`.
   The summary line and the exit rule stay as they are. Findings keep insertion order, so every existing output can only gain lines at the end.
2. Existing checks that the new kinds make false (edit exactly these, list each in the report):
   - `fixtures/frontier-baseline.json`, entry `current`: its stdout gains the section-order lines the fixture now produces, and its summary count changes to match. Regenerate that one entry from the new CLI and confirm the only difference from main's entry is added `section-order:` lines and the summary count; say so in the report with the diff.
   - The check `frozen 2026-10-06 rewrite passes on 2026-10-07` asserts `findings=0`; the frozen rewrite puts its live sections after Landed. Retitle it `frozen 2026-10-06 rewrite reports only its three section-order findings on 2026-10-07` and assert `findings=3` with exactly three `section-order:` lines (confirm the count by running it). Swap the new title into R-877's evidence cell in REQUIREMENTS.md.
   - The check `frozen pre-rewrite HANDOFF reports 12 findings and key drift categories`: update the count in its title and assertion to what the new CLI reports (expected 15); keep its kind assertions.
   - Any other existing check that turns red: stop, do not edit it, and report it.
3. `packages/nana-pack/README.md`, the HANDOFF frontier checker paragraph: say the CLI also checks the document's size against one default read (51,200 bytes or 2,000 lines: pi 1.0.2's read tool limits, the smaller of the two seats' limits), and reports a Where things stand, Next or Open for the owner section placed after a Landed or Carried residuals heading or ending past that read. Keep the other claims word for word. No machine path, no owner name.
4. Regenerate `docs/requirements-tree.md` (`npm run req:tree`) and `docs/code-map.md` (`npm run map`).

## Seat steps (not the builder's)

- Done before the build, in the plan commit: HANDOFF reordered live-first (header, Where things stand, Next, Open for the owner, Landed, Carried residuals) with one header sentence naming the order; the 153 Landed lines dated through 2026-10-20 moved verbatim to a new top entry of `docs/sessions/2026-10.md` (seat check: every moved line found verbatim there, 0 missing); the Carried residuals unchanged except three stale clauses (two Windows "never ran" clauses, disproved by the Windows log at 6a18aa36, and the pipe-narrowing ask closed by the owner's 2026-10-21 ruling); stale Next and Open lines rewritten; the cap-fields-own round-1 late notes folded; the writing trial's day-14 after-measure and verdict recorded in its `after.md`; the owner's 2026-10-21 rulings as one Landed line.
- After the build: re-run `frontier.test.mjs`, the wrong-code pairs below, then the lane notes (Landed line, session entry, residual lines), `requirements-moved.mjs`, a draft pull request for CI, one final reviewer, nana-land, push main.
- After this lane lands, each lane building at the same time merges main and places its HANDOFF lines in the new sections; R-2473 in its suite catches a live section put back below Landed. After each such merge the seat compares the count of Carried residuals lines and Open asks with the pre-merge counts.

Wrong-code pairs (seat, before the final review; each must turn its row red):
- Ignore Carried residuals as an archive heading (R-2470).
- Flag every live heading whenever any archive heading exists (R-2470).
- Use the last archive heading instead of the first (R-2470, `between.md`).
- Count characters instead of UTF-8 bytes in read-window (R-2471) and in file-size (R-2472).
- Take the heading's own position instead of the section's end (R-2471).
- End a section at the next heading of any level (R-2471).
- Count the final newline as an extra line, or flag at the limit with `>=` (R-2472).
- Restore main's HANDOFF.md (R-2473).

## Known limits (carried to HANDOFF)

- The whole-file size finding stays until known-bugs-per-feature moves the residuals out (owner, 2026-10-21). After the restructure the file is about 226 KB, of which the residuals are about 210 KB, and it regrows about 2 KB per lane (inferred).
- Claude Code still cannot Read the whole file in one call: under the 256 KB byte limit now, but over the 25,000-token default, unless the seat passes offset and limit or the opt-in large-read flag. With the frontier first, a limited head read shows the live sections.
- The frontier itself is about 1,900 words, most in the Open asks, so the word budget stays over until the owner answers or parks asks.
- Nothing runs nana-frontier at land or in CI. R-2473 in the suite is the one automatic pin, and only for this repo's HANDOFF; other projects' HANDOFFs are checked by no suite.
- Only the three live names count. The shared seed's `## Open` heading is not `Open for Owner` (predates this lane; also applies to the open-tag check).
- No test covers the CRLF byte count; the design says earlier lines' `\r` counts.
- The window copies pi 1.0.2's defaults; a pi upgrade that changes them needs the contract value retuned, and the seals then fail naming R-2471 and R-2472.
- A single Landed line hundreds of words long is still not flagged (R-874 covers multi-line entries only).

## Out of scope (options)

- Moving the Carried residuals to one known-bugs file per feature and changing the shared review-bar text (the owner's later lane).
- Running the CLI at land or in CI, or a land-checklist line for it.
- Changing the startup instruction to read only HANDOFF's head, or a session-start hook that injects the frontier.
- A token-count window for Claude Code's Read.
- A strict-mode failure or land gate on the size finding.
- Renaming the seed's Open and NEXT headings, or checking the seed, the templates or other projects.
- Answering or parking old Open asks to meet the word budget.
