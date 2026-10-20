# pack-config-utf16 — build brief 1

Feature: FEAT-015 · Diagnose the active environment
Class: install, hook and gate. Threat model: honest encodings from Windows editors and shells are in scope; forged or mixed encodings are out.
First, read must-meet.md beside this brief. It holds the rows, the design and the probes.

Change
1. packages/nana-pack/lib/json-text.mjs: add `parseJsonBytes(bytes)`.
   - FF FE: decode the WHOLE buffer, mark included, as UTF-16LE.
   - FE FF: copy the buffer, swap16 the copy, then decode it as UTF-16LE.
   - Anything else: decode as UTF-8.
   - Check for an odd byte count after either mark first, and throw a SyntaxError.
   - Then return parseJsonText(text).
   - Use Buffer, not TextDecoder. Never slice the mark off before decoding; parseJsonText removes exactly one mark.
   - Name the two marks as constants with a contract comment (R-2230, R-2236).
   - Update the six-tag header, with a one-sentence @purpose.
2. Switch seven readers to it. Each keeps its own catch and fallback and drops its inline U+FEFF strip.
   - lib/config.ts readConfigFile
   - lib/adoption.mjs adoptionSettings
   - bin/nana-roster.mjs: readRosterFile returns the bytes, and resolveRoster parses them
   - lib/roster-set.mjs: the read before the write
   - nana-setup lib/doctor.mjs piPackConfigState: read with no encoding
   - nana-setup lib/steps.mjs readPiPackConfig: change only its body and the import
   - nana-setup lib/project.mjs: the `.pi/nana-pack.json` parse
   Leave the pi settings.json readers on parseJsonText.
3. packages/nana-pack/README.md:
   - Add one Config bullet: UTF-8 with or without one mark, or UTF-16LE or UTF-16BE with a mark, is read; other UTF-16 is unparseable.
   - In Machine roster, the "one leading byte-order mark stripped" sentence also names UTF-16 with a mark.
   - In the `set` known limits, say the file is rewritten as UTF-8.
4. REQUIREMENTS.md: add R-2230 to R-2237 after R-1586 in FEAT-015, with must-meet's text.
   - R-2230 to R-2236 are `implemented`, with their tests.
   - R-2237 is `untested`, with the evidence "written; Windows-leg-only".
   Then run `npm run req:tree` and `npm run map`.

Tests (put each `// req:` marker directly above a one-line `check("title", …`, using must-meet's titles)
- Child environments, for every child process: set HOME, USERPROFILE and PI_CODING_AGENT_DIR to the temporary home. The `set` child must also drop PI_SESSION_ID; copy cleanEnv from nana-roster-set.test.mjs.
- Fixtures: build the JSON with JSON.stringify. LE = FF FE + Buffer.from(text, "utf16le"). BE = FE FF + the swap16 of those units.
- New packages/nana-pack/tests/pack-config-utf16.test.mjs, with the six-tag header:
  - R-2230: run UTF-8, LE and BE each in its own fresh child process, as config-gate-fallback's freshProcess does. A shared process would mask the bug through its last-valid policy. For LE and BE, `terraform destroy` is blocked by its pattern, not by the malformed-config stop, and `ls` is allowed.
  - R-2231: bin/nana-objective.mjs stdout is "", with UTF-8 as the control.
  - R-2232: in separate temporary dirs, `nana-roster --json` stdout for LE equals the UTF-8 run's. Then `set builder <p> <m> low` exits 0 in both, and the two written nana-pack.json files are byte-identical. The fixture holds objective, gate, one unknown member and a full roster.
  - R-2236: six shapes: LE with no mark, BE with no mark, LE with two marks, BE with two marks, LE plus one byte, BE plus one byte. Each prints CONFIG_FAILURE_PREFIX + displayPath(file) and MANUAL_JSON_ADVICE.
  - R-2237: mark it `// req-candidate: R-2237 (Windows only; becomes req: when the Windows CI leg passes it)`.
    - Run %SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe once, with -NoProfile -NonInteractive -EncodedCommand.
    - In that one run, write two files, one with Out-File and one with `>`. Pass the paths and the one-line JSON (under 80 characters) in env vars.
    - Assert each file starts with FF FE, then that the producer prints nothing for each.
    - Off win32, print SKIP with the reason "Windows PowerShell 5.1 exists only on Windows".
- adoption-reader.test.mjs, R-2235: use the R-1584 shape with UTF-16LE bytes, and a root that only the configured journal records.
- doctor-detail.test.mjs, R-2233: use the R-1580 shape with one layout, UTF-8 then UTF-16LE with CRLF. Assert the UTF-8 pi nana-pack.json row is ok and the three rows match.
- project.test.mjs, R-2234: test a UTF-16LE project file, and a UTF-16LE user file with commands and no project file. Compare both rows with the UTF-8 run. If the file crashes finding pi, set npm's prefix in your shell, never in the test file.

Wrong code to try (each must turn the named row red; revert each afterwards)
- Revert one reader at a time:
  - config.ts → R-2230 and R-2231
  - adoption.mjs → R-2235
  - nana-roster.mjs → R-2232
  - roster-set.mjs → R-2232
  - doctor.mjs → R-2233
  - steps.mjs → the R-2234 user case
  - project.mjs → the R-2234 project case
- Decoder faults → R-2236:
  - drop the odd-count throw
  - slice the two mark bytes before decoding
  - decode with TextDecoder defaults
  - strip every leading U+FEFF
  - read a NUL second byte as UTF-16LE with no mark
- Decode FE FF without the swap → R-2230.

Done
- The seven must-meet checks pass on macOS, and R-2237 prints SKIP.
- These files pass whole, run as single files: pack-config-utf16, adoption-reader, adoption-producer, doctor-detail, project, install, nana-roster, nana-roster-set, config-gate-fallback, objective-golden, requirements-tree, requirements-trace, requirement-rows.
- map:check and readme:check are green.
- Never edit HANDOFF.md or docs/sessions/. Never run the full suite.

Report (10 lines or fewer): the commit; the rows and their statuses; pass and fail counts per file; each wrong code as row → red or green; the map and readme checks; and anything you did outside this brief.