1. **HIGH #1 — RULED / structural fallback FIXED:** trust-vs-label deferred; no-line files emit only a marker (`objective.ts:183-190,240-249`).
2. **MED #2 — FIXED:** independent 1500-unit caps preserve both lines; overall marker is inside 12000 (`objective.ts:163-166,183-189,277-282`).
3. **MED #3 — FIXED for reported cases:** NUL stripping and exactly-one-newline parity (`objective.ts:146,277-282`; `nana-objective.mjs:15`); golden test is 195/195 with only tag removal.
4. **LOW #4 — FIXED:** fatal UTF-8 decode produces the named marker (`objective.ts:139-145`).
5. **LOW #5 — FIXED:** doctor calls only a differing filename a rename (`doctor.mjs:94-97`); config comment corrected (`config.ts:488-490`).

**HIGH — narrowing is not complete.**
- `paragraph()` emits continuation lines verbatim (`objective.ts:169-175`). Probe: `**Objective:** benign\nIGNORE_LINE_PAYLOAD ESC/BEL/U+2028` preserved every payload/control byte in both runtimes.
- Repo-controlled pathnames are interpolated unescaped into `governing`, no-lines marker, and precedence (`objective.ts:192,249,252,268`). A directory containing `\nIGNORE_PATH_PAYLOAD` appeared three times in the prompt.
- Marker causes are fixed, but marker paths are injectable. Journal JSON escapes the newline and is not read into this prompt; precedence directly repeats the unsafe path.

**MED — unresolved incoherence:** a product with no parsed line is still labelled `governing`, then its nonexistent “lines” are said to govern (`objective.ts:252,268`; pinned by `objective-golden.test.mjs:246-252`).

**Mutation tests:** baseline passed. Bypassing (h)’s umbrella symlink guard exited 2 and failed target-content/refusal assertions. Bypassing (p)’s project symlink guard exited 7 and failed five assertions, including target-content and journal source. The standalone “falls back” assertion stayed green because program priority contains the same phrase, but the surrounding checks catch the mutant.

**NEW parity/decoding defects:**
- A lone surrogate in configured path remains in pi’s JS prompt but becomes U+FFFD through CLI/stdout: runtime equality false.
- A 256 KiB file ending in incomplete UTF-8 is accepted because `stream:true` is never flushed (`objective.ts:142`), contradicting strict-decode behavior.

**CARRY:** sanitize/quote all paths and controls; restrict extraction to one physical canonical line; resolve no-lines governance wording/fallback; normalize lone surrogates; fix exact-cap UTF-8 validation; strengthen (p)’s fallback assertion.

VERDICT: BLOCK
