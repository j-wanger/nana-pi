I've fixed the six items from the review and committed them on `lane/l3-handoff` as **`3996c98`** (on top of `6b23473`, not pushed). `npm test` passes, including the new long-path pointer cases and `handoff-trust.test.mjs`.

**Worst-case pointer:** a 200-character filename deep outside home plus an 80-character writer comes out at exactly 300 characters:
`Stale handoff NOT injected (400d old, writer wwww…(50 w)): …/bbbb…(197 b).md`
The filename is kept whole and the writer is cut to fit, so the rest of the line is dropped. In the long-home case (290-character HOME, 377-character store path) the pointer is 274 characters and shows `~/.pi/agent/handoffs/<hash>.md` in full.

**AGENTS.md edit:** it's the worktree's `AGENTS.md`, handoff bullet only. It now says compaction writes to `~/.pi/agent/handoffs/<sha256(cwd)>.md`, where the path is printed and that this is the file to update in place. It also says a repo `.pi/handoff.md` is never injected, only named in one line as untrusted, and should not be created or maintained.

**Fixes and tests:**
1. **Path cut off in the stale pointer:** new `compactPath` plus `stalePointer` shorten it: `~/…` under home, a custom path inside the project is relative to cwd, anything still too long becomes `…/<tail>` with the filename intact, and the writer shrinks first. I wrote the long-home test first and watched it fail on r1 (path cut off, 300 characters). New checks in `handoff-staleness`: long HOME, a long custom path under home, one outside home, and the worst case. With r1's code swapped back in, 7 checks fail; all 30 pass now.
2. **AGENTS.md:** as above.
3. **Missing writer journaled as a clean write:** `handoff_provenance_unavailable` is now journaled next to `handoff_written`, both when `getSessionFile` throws and when it returns nothing. The write still happens with `Writer: unknown`. Tested in `handoff-store`; fails on r1.
4. **Corrupt UTF-8:** the file is now decoded strictly, so nothing is injected and `handoff_pickup_failed` is journaled with code `ERR_ENCODING_INVALID_ENCODED_DATA`. Tested in `handoff-store`; fails on r1.
5. **Removed:** the default-store symlink refusal on both read and write, and the "store symlink" test block in `handoff-store`. The README now says the store has no symlink policy. The custom-path refusal and `handoff-symlink.test.mjs` (14 pass) are unchanged, and so is the `Cwd:` mismatch check.
6. **Marker:** the README says only exact lowercase `off` works, and that any process a review child spawns inherits it; the extension's header comment says the same.

**Invariant (g) — seat ruling, for the land reviewer to judge:** I kept the current behaviour, which overrides sol's MEDIUM #3. The "No handoff for this directory" line appears only when an ancestor has a handoff. I changed the wording to match in the pack README and in `~/nana-pi/docs/reviews/tranche1-2026-09-28/l3-brief.md` (g), with a note dated 2026-09-28. That brief isn't tracked in git, so that edit is in place and not in any commit.

**`npm test`:** 65 files, 64 PASS, 0 FAIL, 1 SKIP; 2,733 checks pass, 0 fail, 6 skip. The six handoff files pass: artifact 7, staleness 30, store 38, symlink 14, trust 12, writer-role 7.

**`git diff --stat main..HEAD`:** 13 files, +864/−194. This round alone is 5 files, +166/−40.

**Residuals:**
- A filename of about 250+ characters can still be cut at 300, because the writer can only shrink to empty.
- A `…/`-shortened path can't be read as written; it is only a tail you can recognise.
- Other pointers, such as the ancestor line and the fresh `Source:` line, still show full paths; they have no length cap.
- The win32 `~\` form and rename-over-existing haven't been run on Windows.

**Claim most likely wrong:** that a `~/…` path is "one read away" for the agent. That assumes the agent's read tool expands `~`, which I haven't checked against pi's tools.

VERDICT: DONE
