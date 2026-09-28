Both MUSTs are fixed, committed as `bee67dc` on `lane/l3-handoff`, and `npm test` exits 0.

**MUST 1: a custom path can no longer bring the repo file back in**
- **Reproduced first:** with `handoff.path` = `<repo>/.pi/handoff.md`, from user scope (cwd in the repo and cwd elsewhere) and from a nana-trusted project, the injection string reached the system prompt. Compaction overwrote the file and journaled `handoff_written`. 11 of 13 checks failed in each of the three cases.
- **After:** all three cases pass. The prompt gets one line: `Configured handoff.path .pi/handoff.md is a repo .pi/handoff.md — repo-writable, NOT injected and never written by compaction; …`. The journal records `handoff_legacy_ignored {"configured":"handoff.path"}`, then one `handoff_legacy_write_refused` per compaction. The file is byte-identical and there is one UI warning per session.
- **How it works:** a new `isLegacyShape` check matches any path ending in `.pi/handoff.md`, ignoring case. It checks both the configured path and the path with its parent's symlinks resolved.

**MUST 2: a dangling link is an error, not a missing store**
- **Reproduced first:** both cases journaled `handoff_missing`.
- **After:**
  - Dangling store-file symlink: `"event":"handoff_pickup_failed",…,"error":"dangling_symlink"`, with no `handoff_missing`.
  - Dangling `handoffs/` directory symlink: `"event":"handoff_pickup_failed",…,"error":"dangling_parent"`, with no `handoff_missing`.
  - A working `handoffs/` symlink still reads an absent entry as `handoff_missing`, and still writes and picks up normally. The default-store symlink refusal was not restored.

**Wording**
- The repo-file pointer and README now say the file was "left unchanged here, not migrated; nana writes future summaries to the user-scope store".
- The README records the escaped-pointer exception. I checked the code first: a short escaped path keeps its age and writer. Only past 300 chars is the writer trimmed, then dropped, then the age. The README says that, rather than "always omitted".

**Tests:** `npm test`: 65 files, 64 pass, 0 fail, 1 skip; 2833 checks passed, 0 failed, 6 skipped. `handoff-trust.test.mjs` run against main's package still fails (exit 36, 36 FAIL lines).

**Residuals**
- The shape check is advisory, like the existing symlink check: the file could be swapped between the check and the read or write.
- A hard link to a repo `.pi/handoff.md` under a different name is not caught.
- A file named `.PI/HANDOFF.md` on Linux is also refused, since the match ignores case. That's deliberately conservative.
- The dangling-link tests are skipped on Windows.
- The trusted-project test uses a stub of pi's trust module, not the real one.

**Claim most likely wrong:** that the refusal is "stated once". The prompt line is added only at a fresh session start, so a resumed session that then compacts gets just the UI warning and the journal line, with no prompt line.

VERDICT: DONE
