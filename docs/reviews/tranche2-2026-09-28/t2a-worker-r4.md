**Commit:** `63ae670` on `lane/t2a-objective`, not pushed. All four MUSTs and the (p) item are fixed and pass `npm test`. One gap against doneWhen: in the directory probe, the printable letters of the directory name still appear.

**Probes, run in both runtimes before and after the fix (hook stdout and pi prompt were identical in each run):**
- **Continuation-line probe, before:** `…/OBJECTIVE.md\n**Objective:** benign\nIGNORE_LINE_PAYLOAD \u001b[31m\u0007 after-LS\n\n**Current priority:** x`. The payload appeared once, with control characters.
- **Continuation-line probe, after:** `governing: …/w/OBJECTIVE.md\n**Objective:** benign\n\n**Current priority:** x`. No payload and no control characters.
- **Directory-name probe, before:** the raw newline let `IGNORE_PATH_PAYLOAD` start its own line three times.
- **Directory-name probe, after:** each mention is one line: `objective file: "/…/work/evil\u000AIGNORE_PATH_PAYLOAD\u001B\u2028z/OBJECTIVE.md"`. There are no raw control or line-separator bytes, and the payload never starts a line.

**Sanitizer helper:** `displayPath()` in `objective.ts`, exported.
- A clean path is shown unchanged.
- A path containing C0/C1 controls, U+2028/2029 or bidi controls is shown as a quoted JSON string: `\` and `"` escaped, each unsafe character as `\uXXXX`.
- It first normalizes lone surrogates, then limits the path to `PATH_CAP=320` characters, cutting the middle and keeping the basename.
- **Call sites:** the governing line, the new `objective file:` line, the `(ignored …)` refusal, both UNAVAILABLE markers, `noLines()`, the program-unavailable line, both precedence sentences, and all pi notices. Journal events still record the raw path; the journal escapes it as JSON and never reads it back into the prompt.

**One physical line:** `markerLine()` replaces `paragraph()`. It splits on LF, CR, CRLF, U+0085, U+2028 and U+2029, keeps only the marker's own line, strips C0/C1 and bidi controls (tab included), then applies the 1500-character cap.

**No-lines wording:** `objective file: <p>\nOBJECTIVE UNAVAILABLE: no **Objective or **Current priority line found in <p>. Tell the user before spending.` The precedence sentence now reads `Precedence: no governing lines were found in <p>; the program lines (<u>) govern this session.` If the program file has no lines either, it says so instead. The golden case is updated and now also asserts that the word "governing" is absent.

**Decoding fixes:**
- The file is read up to 256 KiB + 1 byte. The decoder streams, then does a final `dec.decode()` flush unless the file continues past the cap.
- A pinned 262,144-byte file ending `E2 82` is refused as "not valid UTF-8".
- The same file at 262,145 bytes, where the cap splits the `€`, is accepted.
- Lone surrogates are normalized with `toWellFormed()` in `displayPath` and again as a backstop in `finish()`. The new golden case shows hook and pi are byte-identical.

**(p) assertion:** it now requires `governing: <umbrella>\n**Objective:…**Current priority:…`. Under sol's guard-bypass mutant it fails on its own.

**Tests:**
- **Mutation checks:** I broke each fix in turn (no flush, multi-line extraction, no control stripping, no `displayPath`, both well-formed layers removed, old wording). The tests caught every one, failing between 1 and 12 checks each. Removing only one of the two well-formed layers is caught by neither test, because the other layer still covers it.
- **`npm test`:** exit 0, 69 files (68 pass, 1 skip), 3428 checks passed, 0 failed. The objective golden test alone now has 244 passing checks.

**Other changes:** the internal-error cause now has control characters removed and is cut without splitting a surrogate pair. The README's objective section describes the new behaviour.

**Residuals:**
- `bin/nana-objective.mjs` still prints a raw `String(err)` on its own producer-failure path.
- Trust gating and the governing/program labels are still Jake's call.
- The new `objective file:` label is a wording choice MUST 3 forced.

**Claim most likely wrong:** "ZERO attacker bytes" for the directory probe. The escaped path still contains the letters `IGNORE_PATH_PAYLOAD` three times, inside one quoted line with no raw controls. Any path that is displayed at all carries its directory's letters. If sol reads doneWhen literally, the only fix is to hide unsafe path components entirely, which goes beyond the JSON-escape approach the brief specified.

VERDICT: DONE
