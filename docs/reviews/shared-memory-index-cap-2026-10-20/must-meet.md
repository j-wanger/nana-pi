# shared-memory-index-cap: must-meet

Feature: FEAT-003 · Index and connect existing knowledge sources
Class: install, hook or gate (Claude Code SessionStart hook). Ladder: final reviewer, land reviewer, seat wrong-code pairs, one independent check, the lane's mutation runner, and the local macOS install check before nana-land.
Threat model: honest variation is in scope (index growth, long descriptions, CRLF, multibyte and astral text, a long config-dir path in the header). A deliberately hostile index file is out of scope.

Falsifiable sentence: the shared-memory hook never writes more than SHARED_MEMORY_OUTPUT_BUDGET characters to stdout. It keeps every entry's `- [title](link)` part whole and cuts the longest descriptions first, to the longest common length that fits. It drops whole trailing entries only when the entries do not fit even with every description cut away. When it cuts or drops anything, its last line names the counts and the full index path.

## Why
- The hook writes the header plus every `- [` line with no bound (hook lines 90-92, main 72abe19a).
- The owner's live index is 12,753 bytes and holds 61 entries. A session on 2026-10-19 printed 12.2 KB.
- Claude Code hooks doc (read 2026-10-20): plain hook stdout is capped at 10,000 characters, measured whole, per hook. Over the cap, the model gets a file path and a preview of up to 2,000 characters. No setting raises the cap.
- Entries are appended, so the newest rules sit at the end. Dropping trailing lines first would hide them. That is why every title is kept and descriptions are cut first.

## Design
- New `packages/nana-setup/lib/shared-memory-config.mjs` (six-tag header, @effects none):
  - `SHARED_MEMORY_OUTPUT_BUDGET = 9000`. Provenance: hooks doc, 10,000-character cap, read 2026-10-20. Chosen to leave a 1,000-character margin. The unit is JS string length.
  - `SHARED_MEMORY_TRIM_MARK = "…"`, chosen as one character that reads as a cut.
- Fixed part: the header line, plus the self-heal note line when one is printed. Entries are the `- [` lines after splitting on `\r?\n`, as today.
- If the fixed part plus the entries fits the budget, the hook writes exactly what it writes today.
- Otherwise each entry splits into a head and a description. The head matches `^- \[[^\]]*\]\([^)]*\)`; if it does not match, the whole line is the head.
  - The hook reserves the fold line with both counts set to n.
  - It finds the largest common description length L that fits.
  - A description longer than L becomes its first L units plus the mark. If the cut would end on a high surrogate, the hook keeps one unit less.
- If L = 0 still overflows, the hook keeps the longest leading run of entries that fits at L = 0.
- The last line is `[nana:shared-memory] index shortened to fit the hook output cap: <s> of <n> entries shortened, <d> left out; full index: <idx>`. The template sits beside HEADER in the hook.
- Unchanged: self-heal, CLAUDE_CONFIG_DIR, fail-open and closed-stdout handling (R-348, R-386, R-933-R-935, R-871, R-872, R-1942).
- An adversary prototype ran on a temp copy of the live index. It printed 8,961 chars, kept all 61 entries, cut 59 descriptions to 55-70 chars and left out 0.

## Must-meet (new file `packages/nana-setup/tests/shared-memory-budget.test.mjs`; harness copied from shared-memory-hook.test.mjs)
| Row | Requirement (EARS) | Test title | Red today (probe on main 72abe19a) |
|---|---|---|---|
| R-2340 | WHEN the shared index's entry lines would take the shared-memory hook's output past its output budget, the shared-memory hook shall write at most the output budget in characters to stdout. | `R-2340: an over-budget CRLF index prints at most the output budget` | Red: fixture A printed 13,899 chars. |
| R-2341 | WHEN the index exceeds the output budget but every entry fits with its description cut away, the shared-memory hook shall print every entry, cutting only the descriptions longer than the longest common length that fits down to that length, less one unit where a cut would split a character. | `R-2341: over budget, every entry prints and only the longest descriptions are cut, all to the longest length that fits` | Red: fixture D printed 11,699 chars with 0 cut. Also red under titles-only, drop-trailing, proportional and half-length (under-fill) mutants (probe). |
| R-2342 | WHEN the shared-memory hook shortens an entry line, it shall print that line's whole title and link, then a prefix of its description that ends on a whole character, then the trim mark. | `R-2342: a shortened line keeps its whole title and link and ends on a whole character before the trim mark` | Red: the "a line was shortened" precondition fails (19,104 chars, 0 cut). With no surrogate back-off, U+FFFD appears (probe). |
| R-2343 | IF the index does not fit within the output budget even with every description cut away, THEN the shared-memory hook shall leave out whole entries from the end of the index. | `R-2343: when titles alone overflow the budget, leading entries print and trailing entries are left out whole` | Red: fixture B printed all 200 entries in 15,569 chars. |
| R-2344 | WHEN the shared-memory hook shortens or leaves out any entry, it shall end its output with a line naming how many entries it shortened, how many it left out, and the full index path. | `R-2344: a trimmed index ends with a line naming the shortened and left-out counts and the full index path` | Red: the last line is an entry line. Red under a no-left-out-count mutant (probe). |
| R-2345 | WHILE the header and every entry line fit within the output budget, the shared-memory hook shall print them unchanged with no added line. | `R-2345: an index whose output is exactly the budget prints every line unchanged with no fold line` | Green today: the baseline pin. Red under `<` for `<=` and always-reserve-fold mutants (probe). |
| R-2346 | The shared-memory hook's output budget shall be 9,000 characters, a chosen margin below Claude Code's 10,000-character hook output cap. | `R-2346: seal: SHARED_MEMORY_OUTPUT_BUDGET is 9,000 characters` | Red: the config module is absent, so the import throws. |

## Fixtures and checks (cross-platform, no skips; budget and mark imported by name)
- Each over-budget fixture takes its entry count from the imported budget, at about 1.5x overflow, so a retune changes no test code.
- A (R-2340): entries with about 200-character descriptions, CRLF line endings.
- D (R-2341, R-2344): repeating groups of six entries. Four have 20-char descriptions, one has 200 and one has 700. The checks:
  - every source entry appears, in order;
  - at least one line is whole and at least one is shortened;
  - every shortened prefix has one length L;
  - every whole description is at most L, and every shortened original is longer than L;
  - fill: output length + shortened count + 2 * digits(n) > budget.
- E (R-2342): descriptions are runs of `😀`, and every other one starts with one ASCII letter.
- B (R-2343, R-2344): long titles with short descriptions; the heads alone overflow.
- C (R-2345): run once on an empty index in the same home to learn the header length. Then fill the output to exactly the budget.
- R-2344, on D and on B: the last line, before the path the header names, holds the whole-number tokens s, n and d in that order, matching the observed counts.

## Known limits
- A header plus note longer than the budget is not trimmed. That needs an index path of about 4,400 chars.
- A title holding `]` or a link holding `)` makes the whole line its head. Such a line is never shortened, only dropped whole.
- If Claude Code counted bytes instead of UTF-16 units, an astral-heavy index could pass the cap.
- When the entries overflow even with every description cut away, trailing entries are dropped, and those are the newest. At today's average title length this starts at about 125 entries.