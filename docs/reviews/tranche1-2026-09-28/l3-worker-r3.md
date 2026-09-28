The stale pointer now always gives a path that pi's read tool resolves to the real file. Missing and unreadable handoffs are now separate results. `npm test` exits 0.

**Commit:** `ff0c6a1` on `lane/l3-handoff`, not pushed.

**Resolution rule (`resolvablePath`):** it picks the shortest of three forms: absolute, cwd-relative (only if the file is inside the session cwd) and `~/…` (only if it is under the real home).
- Any path containing a literal `~` is always absolute.
- A cwd-relative path starting with `@` is also absolute, because pi strips a leading `@`.
- The `…/<tail>` form is deleted and the path is never truncated.
- When the line is over 300 chars, it drops the "lower authority" tail first, then trims and drops the writer, then drops the age. If the path alone is over 300, the pointer is too; the README says so.

**Pinned cases** (each path run through the installed pi's own `resolveToCwd` in `path-utils.js`, then read back and compared against the intended file):
- **`…/` form gone:** 446-char path outside home is emitted in full, no `…` in the pointer. **474 chars, over 300 by design.**
- **255-char basename:** emitted whole and resolves. **350 chars, over 300 by design.**
- **Literal `~` directory** (`<repo>/~/handoff.md`): emitted absolute, 237 chars. A control check shows the old form `~/handoff.md` resolves to a decoy `$HOME/handoff.md` instead.
- **Custom path outside home:** absolute, 224 chars, keeps age, writer and tail.
- **Other paths also checked:**
  - default store (`~/…`): 235 chars
  - in-project path (cwd-relative): 163 chars
  - `@team` folder in the project (absolute): 241 chars
  - long home (290 chars) and long custom path under home: 274 and 267 chars
  - writer-trimming case: exactly 300 chars

**Missing vs error:** new `readHandoff(file)` returns `{kind:"missing"}`, `{kind:"error",reason}` or `{kind:"ok",text}`. The journal now writes a new `handoff_missing` line, separate from `handoff_pickup_failed`. The session sees exactly what it did before; a read error still names an ancestor's handoff, as it did.

**`npm test`:** 65 files, 64 PASS, 0 FAIL, 1 SKIP; 2757 checks pass. The first run had one failure in `apps/desk/test/stage-key-persistence.test.mjs`, a file I didn't touch; it passed when run alone and in the full rerun, so it looks flaky. Under the test runner's temp home the resolver is still the real installed pi, not the fallback copy.

**Residuals:**
- A path containing Unicode spaces or tab/CR/LF can't be written so that it resolves; pi turns Unicode spaces into ordinary spaces, and the pointer is a single line. No test covers it.
- The handoff writer can't create a file with a 255-char name, because its temp-file suffix goes over the name-length limit. The write fails and is journaled. The 255-char test file is written directly by the test.
- `handoff_missing` now adds one journal line to every fresh session in a directory with no handoff.
- When the path alone is over the cap, both writer and age are dropped. That is how I read the rule "trim writer, then age".
- The tail being dropped before the writer is existing behaviour, not something the brief specified.
- A relative custom `handoff.path` resolves against the process cwd, not the session cwd. The pointer is correct because it shows the file actually read.
- Windows `rename` is still untested.

**Claim most likely wrong:** that pi's read tool uses the session cwd as its base. `resolvesTo` assumes that cwd equals `ctx.cwd`, and I didn't trace it inside a running pi session.

VERDICT: DONE
