# pack-config-utf16 — must-meet (R-2230 to R-2237)

Feature: FEAT-015 · Diagnose the active environment

**Feature.** Every nana reader of nana-pack.json reads a file saved as UTF-16 with its byte-order mark, which is what Windows PowerShell 5.1's `>` and `Out-File` write. It reads that file exactly as it reads the same JSON saved as UTF-8. UTF-16 with no mark, with two marks or with an odd byte count stays unparseable.

**Class.** Install, hook and gate. lib/config.ts feeds the pi gate and objective extensions and the Claude Code objective producer. lib/adoption.mjs feeds both adoption seats. resolveRoster feeds nana-roster, the roster-notice hook and its extension, pi-worker and pi-review. doctor, install's objective seed and `project` read through doctor.mjs, steps.mjs and project.mjs. The lane gets the land reviewer, the seat's wrong-code pairs, one independent check, the mutation runner and the macOS install check.

**Threat model.** In scope: honest encodings from Windows editors and shells. That means UTF-8 with or without a mark, UTF-16LE or UTF-16BE with a mark, and LF or CRLF line endings. Out of scope: a forged or mixed encoding.

**Design.**
- json-text.mjs gains one export, `parseJsonBytes(bytes)`.
  - FF FE: the WHOLE buffer, mark included, decodes as UTF-16LE.
  - FE FF: a copy is swap16'd, then decodes as UTF-16LE.
  - Anything else decodes as UTF-8, as today.
  - An odd byte count after either mark throws a SyntaxError before any swap.
  - The text then goes through `parseJsonText`, which removes exactly one U+FEFF, so R-1586's two-mark rule holds in every encoding.
- Decoding and parsing happen in one call. A bad UTF-16 file therefore lands in each reader's existing parse catch, with its existing fallback and message. resolveRoster still never throws.
- Seven readers switch to it and drop their own decoding and mark stripping:
  - config.ts readConfigFile
  - adoption.mjs adoptionSettings
  - nana-roster.mjs readRosterFile and resolveRoster
  - roster-set.mjs
  - doctor.mjs piPackConfigState
  - steps.mjs readPiPackConfig
  - project.mjs's `.pi/nana-pack.json` parse
  The pi settings.json readers keep parseJsonText.
- No file that parses today is read differently. FE and FF never occur in UTF-8, so every newly read file is unparseable on main.
- `nana-roster set` re-serializes the file, so it writes UTF-8. `.bak` keeps the original bytes. Install still never rewrites the file.
- Pack README:
  - one Config bullet names the encodings;
  - the Machine roster sentence about the stripped mark also names UTF-16 with a mark;
  - the `set` known limits say the file is rewritten as UTF-8.
- Rows go in FEAT-015 after R-1586. R-1586, R-1971 and R-1972 keep their wording, because "one leading byte-order mark" holds in every encoding.

**Must-meet tests.** Test files:
- PU = packages/nana-pack/tests/pack-config-utf16.test.mjs (new)
- AR = packages/nana-pack/tests/adoption-reader.test.mjs
- DD = packages/nana-setup/tests/doctor-detail.test.mjs
- PJ = packages/nana-setup/tests/project.test.mjs

| Row | Requirement | Test (file::title) | Red today |
|---|---|---|---|
| R-2230 | WHEN the user-scope nana-pack.json is saved as UTF-16LE or UTF-16BE with its byte-order mark and holds a valid gate block, THEN the pi gate shall apply that block's extraPatterns with no stop reason, as for the same JSON saved as UTF-8. | PU::R-2230: the gate applies a UTF-16LE or UTF-16BE user nana-pack.json's extraPatterns with no stop reason | P1 |
| R-2231 | WHEN the user-scope nana-pack.json is saved as UTF-16LE with its byte-order mark and sets objective.enabled to false, THEN the Claude Code objective producer shall print nothing. | PU::R-2231: the objective producer prints nothing for a UTF-16LE user nana-pack.json with objective.enabled false | P2 |
| R-2232 | WHEN the user-scope nana-pack.json is saved as UTF-16LE with its byte-order mark, THEN the output of `nana-roster --json` and the nana-pack.json that `nana-roster set` writes shall be byte-identical to those for the same JSON saved as UTF-8. | PU::R-2232: nana-roster --json and set give byte-identical output and file for a UTF-16LE and a UTF-8 nana-pack.json | P3 |
| R-2233 | WHEN the user-scope nana-pack.json is saved as UTF-16LE with its byte-order mark, THEN doctor shall print its pi nana-pack.json, pi objective.projectFile and pi objective file rows exactly as for the same JSON saved as UTF-8. | DD::doctor reads a UTF-16LE nana-pack.json as it reads the same JSON saved as UTF-8 | P4 |
| R-2234 | WHEN a project's .pi/nana-pack.json or the user-scope nana-pack.json is saved as UTF-16LE with its byte-order mark, THEN `project --check` shall print its .pi/nana-pack.json and post-edit commands rows exactly as for the same JSON saved as UTF-8. | PJ::--check counts post-edit commands from a UTF-16LE project or user nana-pack.json as from UTF-8 | P5 |
| R-2235 | WHEN the user-scope nana-pack.json is saved as UTF-16LE with its byte-order mark and holds an absolute journal.path, THEN the Claude Code adoption hook shall list the unadopted roots that journal records. | AR::hook: a UTF-16LE nana-pack.json keeps its absolute journal.path | P6 |
| R-2236 | IF the user-scope nana-pack.json holds UTF-16 text with no byte-order mark, with two leading marks, or with an odd number of bytes after its mark, THEN the objective producer shall print the config-failure line with the manual JSON repair. | PU::R-2236: UTF-16 with no mark, two marks or an odd byte count, LE or BE, stays unparseable for the objective producer | Green by design; P7 |
| R-2237 | WHERE the platform is win32, WHEN Windows PowerShell's Out-File and its > redirect write the user-scope nana-pack.json with objective.enabled false, THEN the Claude Code objective producer shall print nothing. | PU::R-2237: on Windows, a nana-pack.json written by Windows PowerShell's Out-File and > turns the objective off | untested; Windows-leg-only |

**Probes.** All ran on main in a throwaway clone under a temporary home. The adversary re-ran P1–P4, P6 and P7 on 6f0098a8, then ran the same probes with the candidate applied in the clone.
- P1: on main, UTF-16LE and UTF-16BE stop `terraform destroy` and `ls` with "gate block is malformed … invalid JSON". UTF-8 blocks only `terraform destroy`, by its pattern. With the candidate, LE and BE behave as UTF-8.
- P2: on main, UTF-16LE `{"objective":{"enabled":false}}` prints the block plus "NANA-PACK CONFIG UNPARSEABLE … Repair the JSON by hand". UTF-8 prints nothing, and so does the candidate.
- P3: on main, `--json` and `set` refuse with "invalid JSON". With the candidate, `--json` matches UTF-8 and `set` exits 0. The written file is byte-identical to the one written from UTF-8, and `.bak` starts FF FE.
- P4: on main, doctor gives pi nana-pack.json ✗, the default projectFile and objective file ✗. UTF-8 gives three ✓. The candidate matches UTF-8.
- P5 (plan's probe; the adversary checked it by reading the code): on main, the project case gives "! post-edit commands". The user case gives "✗ post-edit on-ramp" and "!". The candidate matches UTF-8.
- P6: on main, adoptionSettings gives the default journal and OBJECTIVE.md. The candidate gives the configured journal and GOALS.md.
- P7: the six shapes print the config-failure line on main and with the candidate. Without the odd-count check, LE plus one byte parses. Slicing the mark before decoding makes two marks parse, and so does TextDecoder's default ignoreBOM.

**Platforms.** R-2230 to R-2236 test bytes, so they run on all three legs with no skip. R-2237 needs Windows PowerShell 5.1, which exists only on Windows. It prints SKIP elsewhere and carries a req-candidate marker; its row stays untested until the seat sees it pass on the Windows leg. PU also holds checks that run everywhere, so on win32 it is never all-SKIP.

**Known limits.**
1. A UTF-16 pi settings.json stays unreadable to pi and to doctor, because pi owns that file.
2. The frozen desk reads nana-pack.json its own way and is unchanged.
3. install-check.mjs reads the file it seeded and is unchanged.
4. ANSI code-page text, PowerShell 5.1's Set-Content default, still turns non-ASCII characters into replacement characters.
5. A refusal or gate stop for a UTF-16 file that still cannot be parsed quotes parser text, as it already does on main.
6. The gate, objective and roster rows sit in FEAT-015. Sharing them with other features is the owner's call.
7. Nobody has seen the owner's file. The lane fixes PowerShell 5.1's documented default.
8. Seat hazard: a wrong-code table under docs/reviews must never spell a pi launch as spawn("pi".