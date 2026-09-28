**Commit:** `e1d87fe` on `lane/l3-handoff`. It changes 3 files, +98/−11: `nana-handoff.ts`, `handoff-staleness.test.mjs` and `README.md`.

**Escape form:** if a path contains a character pi's resolver rewrites (U+00A0, U+2000–U+200A, U+202F, U+205F, U+3000, the same class as pi's `UNADDRESSABLE` list in `utils/paths.js`) or a tab, CR or LF, the pointer shows the **absolute** path as a JSON string literal. Those characters become `\uXXXX`, and `\` and `"` are escaped, so `JSON.parse` gives back the exact path. The marker follows it and is never trimmed: `— path contains characters the read tool rewrites; JSON-escaped here, decode it exactly (do not pass it to read as written)`. The "read it if relevant" tail is left off in this case. Paths without those characters behave as before.

**The five cases** (each with the ASCII-space decoy `hand off.md` present next to the real file). Each emits `"<abs>/hand\uXXXX off.md"` — NBSP `\u00A0`, narrow NBSP `\u202F`, tab `\u0009`, CR `\u000D`, LF `\u000A`. For every case, run through the installed pi `resolveToCwd`:
- Control check: the old forms (verbatim, or tab/CR/LF turned into spaces) resolve to the decoy.
- The new form resolves to `<session cwd>/"…"`, which is neither the decoy nor any existing file.
- The pointer is one line, has the marker, and never contains the raw path.
- `JSON.parse` of the emitted text reads back the real summary.

**Relative-path pin:** with `handoff.path` set to `rel-h/handoff.md` and a decoy twin placed under the session cwd, the pointer shows `<process cwd>/rel-h/handoff.md` as an absolute path, and pi resolves it to that file, not the twin. `README.md` and the module header now state that relative paths resolve against the process cwd. The README's "one read away" wording now carries the caveat.

**`npm test`:** exit 0. 65 files: 64 PASS, 0 FAIL, 1 SKIP (`apps/bench/test/study-tasks.test.mjs`, unrelated). Checks: 2784 pass, 0 fail, 6 skip. The staleness suite alone has 77 PASS and no FAIL.

**Residuals:**
- **One change beyond the brief:** the fresh-summary `Source:` line and its "update … in place" line had the same decoy problem, so they now use the same escape and marker. One NBSP test covers this.
- **Age and writer dropped:** in the five escaped pointers the age and writer were cut. The escaped path plus marker leaves too little room under the 300-character cap, and the existing trim order removes them first.
- **Not a strict proof:** the quoted form could only reach a real file if someone created a directory literally named `"` inside the session cwd.
- **Out of scope:** the user-notify strings still show the raw path.

**Claim most likely wrong:** that the character class is complete. I copied it from this installed pi version (`UNADDRESSABLE` in `utils/paths.js`). If a later pi normalizes more characters, such as NFC or other controls, it will drift. Also, pi's `resolveReadPath` tries NFD and curly-quote variants, which the tests don't model.

VERDICT: DONE
