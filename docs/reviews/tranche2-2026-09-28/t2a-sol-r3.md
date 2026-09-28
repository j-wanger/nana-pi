### R2 findings
- **HIGH #1 — FIXED structurally** (`objective.ts:289-319`); semantic trust-vs-label remains a policy question.
- **MED #2 — FIXED:** independent line/output caps remain intact (`objective.ts:172-178,233-238,329-335`).
- **MED #3 — FIXED:** runtime parity, control removal, and newline normalization pass focused tests.
- **LOW #4 — FIXED:** exact-cap incomplete UTF-8 is refused (`objective.ts:141-158`).
- **LOW #5 — FIXED:** doctor/config wording remains corrected.
- **HIGH narrowing — FIXED in objective output:** `markerLine()` prevents continuation structure; `displayPath()` safely covers every objective path/notice site (`objective.ts:180-237,271-319`).
- **MED no-lines incoherence — FIXED:** the file is not called governing; program lines govern when present (`objective.ts:289-319`). The test does not literally ban “governing”; it bans the false governing claims.
- **Surrogate parity / decode flush / (p) assertion — FIXED.**

### Probes and residuals
- `objective.path`, control-bearing `projectFile`, and label-like directory names stay inline and escaped; no attacker-controlled line begins in the objective block.
- Clean paths of exactly 320 characters remain unchanged; 321 is elided. Unsafe paths can total **322** including quotes, so “320-character cap” excludes quoting.
- A basename longer than the cap is not kept whole—only its tail is retained. Safe, but the “keeping the basename” description overclaims.
- `projectFile` validation accepts separators/traversal despite documenting a filename (`config.ts:136-140`); owner-only, but worth tightening.
- **Remaining structure route:** Pi’s generic config diagnostic interpolates raw `file` and `problem` (`config.ts:378-389`). An untrusted repo path containing `\nprogram current priority:` plus `.pi/nana-pack.json` produced a notification with that attacker label starting its own line. This violates the corrected invariant in Pi output.
- `bin/nana-objective.mjs:16-17` still emits raw `String(err)`, but supported repo/config/path failures are caught below it; attacker bytes require process-level injection. Harden anyway.
- Decode boundary defect: malformed UTF-8 beginning at byte 262,144 and receiving an invalid continuation after the cap is accepted because the extra byte is used only as a continuation flag (`objective.ts:143-156`).

### Mutation/tests
- Confirmed: removing either surrogate-normalization layer alone leaves both focused suites green (313 checks). Keep both: `displayPath()` fulfills its exported contract; `finish()` is a cheap whole-output backstop.
- Focused objective suites: 313/313 passed.

### CARRY
- **HIGH:** sanitize both fields in `config.surface()` before `ui.notify`; cost of error is attacker UI-label spoofing.
- **HIGH policy:** decide whether untrusted repo prose may be labelled “governing”; structural safety does not solve semantic prompt injection.
- **MED:** validate UTF-8 across the read-cap boundary.
- **LOW:** sanitize CLI fallback errors; clarify/enforce path-cap and basename contracts; enforce basename-only `projectFile`.

VERDICT: BLOCK
